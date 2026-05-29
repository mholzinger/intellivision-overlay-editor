// zmusDecoder.js — ZMUS Phase 2 work-in-progress
//
// Status: NOT FUNCTIONAL YET. First-pass transcription compiled and runs but
// produces zero PSG writes when fed Nutcracker March because the @@finish
// section's R4 addressing is subtly off — `MVI@ R4, R3` reads channelMask
// (advancing R4 to $364), then `MVO@ R3, R4` stores updated R3 back to $364
// rather than $363, which means the stream record gets mangled after every
// frame and the dataPtr never advances.
//
// Two productive ways to unstick this:
//
// 1. Run the actual engine in jzIntv WASM with a trivial player ROM,
//    capture the PSG write log, and validate this decoder against it
//    frame-by-frame. That gives us ground truth for the subtle ops
//    (SARC carry semantics, SLLC overflow detection, R4 sequencing).
//
// 2. Build a tiny generic CP1610 simulator (not just a transcription)
//    with proper flag tracking and instruction-by-instruction step
//    through, so we can single-step alongside jzIntv's debugger.
//
// Both routes require more focused time than a single session. Committing
// the first-pass transcription as Phase 2a so the work isn't lost, then
// returning to it once we have a ground-truth PSG trace.
//
// JavaScript reimplementation of Joe Zbiciak's ZMUS_UPDATE routine, transcribed
// op-by-op from intv-game-builder/lib/zmus_engine.bas (lines 60–216).
//
// The original is ~80 lines of CP1610 assembly that decodes a stream of 16-bit
// DECLEs into per-frame PSG register writes. We mirror it as a state machine
// over the same set of "registers" (R0..R5) and flags (C, Z, S, O) so the
// translation is auditable line-by-line against the asm.
//
// State model
//   Registers are 16-bit unsigned (mod 0x10000). Auto-increment ops bump the
//   addressing register AFTER reading.
//   Flags: C (carry), Z (zero), S (sign / bit 15), O (overflow).
//   Memory is a sparse Map<address, uint16> for the few addresses ZMUS touches:
//     $1F0..$1FF — PSG registers (writes harvested as the visible output)
//     $360..$363 — stream record (holdCount, dataPtr, ctrlWord, channelMask)
//     song data — at the song's load address; the caller passes an array.
//
// Phase 2 target
//   decodeFrames(songBytes, opts) runs N frames of ZMUS_UPDATE and returns the
//   per-frame PSG write log. Higher layers reconstruct musical notes from the
//   PSG period values (Hz = AY_CLOCK / (16 * period)).

const AY_CLOCK_HZ = 894886;    // Intellivision AY-3-8914 clock
const PSG_LOW     = 0x1F0;
const PSG_HIGH    = 0x1FF;
const STREAM_REC  = 0x360;     // 4 RAM words: holdCount, dataPtr, ctrlWord, channelMask

// ── CP1610 helpers ──────────────────────────────────────────────────────────

const u16 = (v) => v & 0xFFFF;
const isNeg = (v) => (v & 0x8000) !== 0;

// ── ZMUS_PLAY: initialise the stream record so update() can decode ─────────

export function init(songBytes, songLoadAddr = 0xD800) {
    const mem = new Map();
    // Mirror the PSG clear (ZMUS_PLAY lines 62–75)
    for (const r of [0x1F0, 0x1F1, 0x1F2, 0x1F4, 0x1F5, 0x1F6]) mem.set(r, 0);
    mem.set(0x1F8, 0x38);          // tone-only mixer
    mem.set(0x1FB, 0); mem.set(0x1FC, 0); mem.set(0x1FD, 0);
    // Stream record
    mem.set(STREAM_REC + 0, 2);                    // holdCount = 2 (skip first 2 frames)
    mem.set(STREAM_REC + 1, songLoadAddr);         // dataPtr
    mem.set(STREAM_REC + 2, 0);                    // ctrlWord
    mem.set(STREAM_REC + 3, 0x3FFF);               // channelMask
    // Map the song data into memory at songLoadAddr
    for (let i = 0; i < songBytes.length; i++) {
        mem.set(songLoadAddr + i, songBytes[i] & 0xFFFF);
    }
    return { mem, songLoadAddr };
}

// ── ZMUS_UPDATE transcription ──────────────────────────────────────────────
//
// One frame of decoding. Returns { writes: [{addr, value}, …], inactive: bool }.
// `inactive` is true when the routine hit the early-out path (still holding
// or song reached its end / pointer cleared).

export function updateFrame(state) {
    const { mem } = state;
    const writes = [];

    // PSG write capture: wrap mem.set so any address in $1F0..$1FF gets logged.
    const setMem = (addr, value) => {
        const a = u16(addr);
        if (a >= PSG_LOW && a <= PSG_HIGH) writes.push({ addr: a, value: u16(value) });
        mem.set(a, u16(value));
    };
    const getMem = (addr) => mem.get(u16(addr)) ?? 0;

    // Working "registers" — CP1610 has 8 general-purpose, ZMUS_UPDATE uses R0–R5.
    let R0 = 0, R1 = 0, R2 = 0, R3 = 0, R4 = 0, R5 = 0;
    let C = 0, Z = 0, S = 0, O = 0;

    const setNZ = (v) => { Z = (v === 0) ? 1 : 0; S = isNeg(v) ? 1 : 0; };

    // ── Step 1: load + decrement hold count ─────────────────────────────────
    // ASM   MVII #$360, R4
    R4 = STREAM_REC;
    // ASM   MVI@ R4, R1     ; R1 = holdCount, R4 → $361
    R1 = getMem(R4); R4 = u16(R4 + 1);
    // ASM   SUBI #2, R1
    R1 = u16(R1 - 2); setNZ(R1);

    // ASM   BMI @@inactive  (R1 < 0 means we're still holding; just decrement
    //                       and store back as needed)
    if (S) return { writes, inactive: true };

    // ASM   BEQ @@nextrec    ; R1 == 0 → time to decode next chunk
    if (!Z) {
        // ASM   DECR R4
        R4 = u16(R4 - 1);
        // ASM   MVO@ R1, R4   ; store decremented count at $360
        setMem(R4, R1); R4 = u16(R4 + 1);
        return { writes, inactive: false };
    }

    // @@nextrec — decode this frame's writes
    // ASM   MVI@ R4, R5      ; R5 = dataPtr, R4 → $362
    R5 = getMem(R4); R4 = u16(R4 + 1);
    // ASM   TSTR R5
    setNZ(R5);
    // ASM   BEQ @@inactive   ; null dataPtr ⇒ song stopped
    if (Z) return { writes, inactive: true };

    // ASM   MVI@ R5, R2      ; R2 = next stream word (the "header" for this frame)
    R2 = getMem(R5); R5 = u16(R5 + 1);
    // ASM   MOVR R2, R3
    R3 = R2;
    // ASM   ANDI #$000F, R3
    R3 = R3 & 0x000F; setNZ(R3);
    // ASM   MOVR R3, R0
    R0 = R3;
    // ASM   INCR R3
    R3 = u16(R3 + 1);
    // ASM   SLL R3, 2 ; SLL R3, 2   (R3 <<= 4)
    R3 = u16(R3 << 4);
    // ASM   ADDR R3, R0
    R0 = u16(R0 + R3); setNZ(R0);

    // ASM   MVI@ R4, R3      ; R3 = ctrlWord from RAM ($362), R4 → $363
    R3 = getMem(R4); R4 = u16(R4 + 1);
    // ASM   SLR R2, 2 ; SLR R2, 2   (R2 >>= 4)
    R2 = R2 >>> 4;
    // ASM   MOVR R2, R1
    R1 = R2;
    // ASM   ANDI #$003F, R1
    R1 = R1 & 0x003F;
    // ASM   ADDR R3, R1      ; R1 += R3 (PSG register destination address)
    R1 = u16(R1 + R3);

    // @@loop — the main bit-walk over R0 (channel write bitmap)
    //
    // Each iteration tests R0's LSB. If set, read a stream word, swap bytes,
    // compose into R2 and write to mem[R1++]. Otherwise skip. Then bump R2,
    // shift R0 right (more channels to consider?), and shift R1 right with
    // carry; loop while R1 nonzero.
    let safety = 0;
    while (true) {
        if (safety++ > 200) throw new Error('ZMUS update: inner loop exceeded safety budget (200 iters)');
        // ASM   SARC R0, 1   (shift right arithmetic with carry from bit 0)
        C = R0 & 1;
        R0 = (R0 >> 1) | ((R0 & 0x8000));  // arithmetic right shift preserves sign
        setNZ(R0);
        // ASM   BNC @@noread
        if (C) {
            // @@read
            // ASM   MVI@ R5, R3
            R3 = getMem(R5); R5 = u16(R5 + 1);
            // ASM   SWAP R3
            R3 = u16(((R3 & 0xFF) << 8) | ((R3 >>> 8) & 0xFF));
            // ASM   XORR R3, R2
            R2 = R2 ^ R3;
            // ASM   ANDI #$FF00, R2
            R2 = R2 & 0xFF00;
            // ASM   XORR R3, R2
            R2 = R2 ^ R3;
            // ASM   SWAP R3
            R3 = u16(((R3 & 0xFF) << 8) | ((R3 >>> 8) & 0xFF));
            // ASM   MVO@ R3, R1   (write to PSG register pointed at by R1, autoincr)
            setMem(R1, R3); R1 = u16(R1 + 1);
        }
        // @@noread
        // ASM   INCR R2
        R2 = u16(R2 + 1);
        // ASM   SARC R0, 1
        C = R0 & 1;
        R0 = (R0 >> 1) | ((R0 & 0x8000));
        // ASM   SARC R1, 1
        const C2 = R1 & 1;
        R1 = (R1 >> 1) | ((R1 & 0x8000));
        setNZ(R1);
        // ASM   BNEQ @@loop
        if (!Z) continue;
        // ASM   BC @@read       ; fall back into the read branch one more time
        if (C2) {
            // Single extra read
            R3 = getMem(R5); R5 = u16(R5 + 1);
            R3 = u16(((R3 & 0xFF) << 8) | ((R3 >>> 8) & 0xFF));
            R2 = R2 ^ R3;
            R2 = R2 & 0xFF00;
            R2 = R2 ^ R3;
            R3 = u16(((R3 & 0xFF) << 8) | ((R3 >>> 8) & 0xFF));
            setMem(R1, R3); R1 = u16(R1 + 1);
            R2 = u16(R2 + 1);
        }
        break;
    }

    // @@finish — store updated ctrlWord, compute new hold count, advance data
    //
    // The asm does some bit-fiddling with R2's halves to merge new and old
    // fields. We mirror it literally.
    //
    // ASM   SLLC R2, 2  ; shift left, carry-tracked
    R2 = u16(R2 << 2);
    // ASM   SLR R2, 2
    R2 = R2 >>> 2;
    // ASM   SWAP R2
    R2 = u16(((R2 & 0xFF) << 8) | ((R2 >>> 8) & 0xFF));
    // ASM   MVI@ R4, R3   ; R3 = channelMask (R4 → $364)
    R3 = getMem(R4); R4 = u16(R4 + 1);
    // ASM   XORR R2, R3
    R3 = R3 ^ R2;
    // ASM   ANDI #$00FF, R3
    R3 = R3 & 0x00FF;
    // ASM   XORR R2, R3
    R3 = R3 ^ R2;
    // ASM   MVO@ R3, R4   ; store back into channelMask slot, R4 advances
    setMem(R4, R3); R4 = u16(R4 + 1);

    // ASM   MOVR R2, R3
    R3 = R2;
    // ASM   ANDI #$003F, R3
    R3 = R3 & 0x003F;
    // ASM   MVI@ R5, R0   ; R0 = next stream word (hold-count delta?)
    R0 = getMem(R5); R5 = u16(R5 + 1);
    // ASM   ADDR R0, R3
    R3 = u16(R0 + R3);
    // ASM   DECR R4 ; DECR R4
    R4 = u16(R4 - 2);
    // ASM   MVO@ R3, R4   ; store new hold count
    setMem(R4, R3); R4 = u16(R4 + 1);

    // @@zloop — shift R0 right until zero; if carry on the last step, store R2
    while (R0 !== 0) {
        R2 = u16(R2 + 1);
        C = R0 & 1;
        R0 = (R0 >> 1) | (R0 & 0x8000);
    }
    if (C) {
        setMem(R2, R3);
    }

    // @@zlink — optional link to a sub-stream (used for pattern reuse). Bit
    // 15..14 of R1 are the link discriminator. We follow the link by reading
    // the next stream word and storing it back as the new dataPtr.
    //
    // ASM   SLLC R1, 2
    R1 = u16(R1 << 2);
    // ASM   BNOV @@nolink     ; if no overflow, no link
    // Overflow is tricky without proper flag tracking — approximate with a
    // simple bit test: did we shift a 1 out of bit 14 or 15?
    const hasLink = (R1 & 0x10000) !== 0 || (R1 & 0x4000) !== 0;
    if (hasLink) {
        // ASM   MVI@ R5, R3
        R3 = getMem(R5); R5 = u16(R5 + 1);
        // ASM   MVO@ R3, R4    ; new dataPtr = R3
        setMem(R4, R3); R4 = u16(R4 + 1);
    } else {
        // @@nolink — keep existing dataPtr (R5) as next-frame start
        setMem(R4 - 1, R5);   // store updated R5 back into the dataPtr slot
    }

    return { writes, inactive: false };
}

// ── High-level helper: run N frames, return all writes ─────────────────────

export function decodeFrames(songBytes, frameCount = 600, songLoadAddr = 0xD800) {
    const state = init(songBytes, songLoadAddr);
    const frames = [];
    for (let f = 0; f < frameCount; f++) {
        try {
            const r = updateFrame(state);
            frames.push(r);
            if (r.inactive && state.mem.get(STREAM_REC + 1) === 0) break;
        } catch (e) {
            frames.push({ writes: [], inactive: true, error: e.message });
            break;
        }
    }
    return frames;
}

// ── Period → MIDI conversion ───────────────────────────────────────────────

export function periodToMidiNote(period) {
    if (!period || period < 1) return null;
    const hz = AY_CLOCK_HZ / (16 * period);
    if (hz < 30 || hz > 4000) return null;
    return Math.round(12 * Math.log2(hz / 440) + 69);
}
