/**
 * IntyBASIC native MUSIC format engine.
 *
 * Reference: ~/intybasic/manual.txt lines 1180-1290.
 *
 * Format summary
 * --------------
 *   label:                       ' Routine name (also doubles as a JUMP/GOSUB target)
 *     DATA <ticks_per_note>      ' Initial tempo (50 ticks/sec on both NTSC and PAL)
 *     MUSIC ch1, ch2, ch3, drum  ' One tempo step (4 args = base PSG)
 *     MUSIC ch1, ch2, ch3, drum, ch5, ch6, ch7, drum2  ' ECS variant (8 args)
 *     MUSIC REPEAT               ' Loop back to start of song
 *     MUSIC STOP                 ' End of song
 *     MUSIC JUMP <label>         ' Jump to label
 *     MUSIC GOSUB <label>        ' Call subroutine
 *     MUSIC RETURN               ' Return from subroutine
 *     MUSIC SPEED <const>        ' Change ticks-per-note mid-song
 *     MUSIC VOLUME <const>       ' Change volume mid-song (0-15)
 *
 * Channel tokens
 * --------------
 *   C4              Note C in octave 4 (instrument carries over from previous note)
 *   C4#             Note C-sharp in octave 4
 *   C4W             Note C, instrument W (piano) — sets and remembers per-channel
 *   X / Y / Z       Other instruments: clarinet / flute / bass
 *   S               Sustain previous note (extends its duration by one tick)
 *   -               Silence (terminates any sustained note)
 *
 * Drum tokens (4th / 8th channel only)
 * ------------------------------------
 *   M1              Strong hit
 *   M2              Tap
 *   M3              Roll
 *   -               No drum this tick
 *
 * Parser strategy
 * ---------------
 *   1. Strip comments (single quote to EOL) and tokenize lines.
 *   2. Walk lines in source order, building SongIR.
 *      - LABEL lines mark structural points (stored in metadata.labels).
 *      - DATA <n> sets ticksPerNote (the "current" tempo as we walk).
 *      - MUSIC lines advance currentTick by ticksPerNote and emit notes/drums.
 *      - Control commands (REPEAT/STOP/JUMP/GOSUB/RETURN/SPEED/VOLUME)
 *        are recorded in song.controls at the current tick — Phase 2 playback
 *        will use these; Phase 1 just visualizes the linear note layout.
 *   3. Sustain ('S') extends the previous note on that channel by one tick
 *      step instead of emitting a new note.
 *   4. Instrument letter on a note sets a per-channel "remembered" instrument
 *      that subsequent notes (without a letter) inherit until changed.
 */

import { MusicEngine } from './engineBase.js';

// 12 semitone names matching IntyBASIC's note letters
const NOTE_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Regex for one channel token: letter + octave + optional sharp + optional instrument
//   examples: C4, F4#, B3Z, C7X
const NOTE_RE = /^([A-G])([2-7])(#?)([WXYZ]?)$/i;

// Drum tokens
const DRUM_RE = /^M([123])$/i;

// Control commands: MUSIC <cmd> [arg]
const CONTROL_RE = /^MUSIC\s+(REPEAT|STOP|JUMP|GOSUB|RETURN|SPEED|VOLUME)\b\s*(.*)$/i;

// MUSIC data line: MUSIC arg1, arg2, ... — exactly 4 or 8 args
const MUSIC_DATA_RE = /^MUSIC\s+(.+)$/i;

// DATA line: DATA <n>
const DATA_RE = /^DATA\s+(\d+)/i;

// Label line: just a bare identifier followed by colon
const LABEL_RE = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*$/;

export class IntyBasicMusic extends MusicEngine {
    static formatName    = 'IntyBASIC MUSIC';
    static formatSlug    = 'intybasic';
    static channelCount  = 3;
    static supportsDrums = true;

    static documentation = [
        'Native IntyBASIC music: 3 melody channels (square waves) + 1 drum channel.',
        'Each MUSIC statement is one tempo step.',
        'Notes: C/D/E/F/G/A/B + octave 2-6 (or C7/C7# only), optional # for sharp, optional W/X/Y/Z for instrument.',
        'Special tokens: S = sustain previous note, - = silence.',
        'Drums (4th argument): M1 strong, M2 tap, M3 roll, - none.',
        'Tempo: DATA <n> sets ticks-per-note (the MUSIC engine runs at a fixed 50 ticks/sec regardless of NTSC/PAL).',
    ].join('\n');

    /**
     * Parse IntyBASIC source containing one or more music blocks into a SongIR.
     * Picks up the FIRST song block (first label followed by DATA) and parses
     * forward through all MUSIC statements until the next non-music line.
     */
    static parse(text) {
        const lines = this._tokenize(text);
        if (lines.length === 0) {
            throw new Error('No usable lines found (only comments and blank lines).');
        }

        // Pre-scan: build labelName → line index AND identify subroutine labels
        // (any label whose block ends with MUSIC RETURN before the next label).
        // Subroutine labels are skipped during the main walk and only expanded
        // when reached via MUSIC GOSUB.
        const labelLine = {};
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].text.match(LABEL_RE);
            if (m && labelLine[m[1]] == null) labelLine[m[1]] = i;
        }
        const subroutineEndLine = {};   // labelName → line index of MUSIC RETURN
        for (const [name, labelIdx] of Object.entries(labelLine)) {
            for (let i = labelIdx + 1; i < lines.length; i++) {
                const txt = lines[i].text;
                if (LABEL_RE.test(txt)) break;            // next label without RETURN
                if (/^MUSIC\s+RETURN\b/i.test(txt)) {
                    subroutineEndLine[name] = i;
                    break;
                }
            }
        }

        // Find the first music block that is NOT a subroutine: a label followed
        // by DATA. That label becomes the song's identifier.
        let blockStart = -1;
        let songLabel = null;
        for (let i = 0; i < lines.length - 1; i++) {
            const m = lines[i].text.match(LABEL_RE);
            if (!m) continue;
            if (subroutineEndLine[m[1]] != null) continue;   // skip subroutine labels
            if (DATA_RE.test(lines[i + 1].text)) {
                blockStart = i;
                songLabel = m[1];
                break;
            }
        }
        if (blockStart === -1) {
            // Fallback: any label + DATA (mirror old behavior for songs with no GOSUBs)
            blockStart = this._findFirstMusicBlock(lines);
            if (blockStart === -1) {
                throw new Error('No music block found. Expected a label followed by DATA <n> then MUSIC statements.');
            }
            songLabel = lines[blockStart].text.match(LABEL_RE)[1];
        }

        // Walk lines from blockStart, building the SongIR. Stop when we hit
        // something that isn't recognizably part of a music block (e.g. a new
        // unrelated procedure or BASIC statement).
        const song = {
            engine:       this.formatSlug,
            label:        songLabel,
            ticksPerNote: 8,             // mutated through parse; ends up as the FINAL tempo
            initialTicksPerNote: null,   // captured at the song's first DATA line
            channelCount: 3,
            notes:        [],
            controls:     [],
            metadata: {
                labels: {},    // labelName → tick position (for JUMP/GOSUB targets)
                source: text,  // round-trip safety net for Phase 1
            },
        };

        // Shared processing context: mutated by _processBlock and any
        // recursive GOSUB expansions. Keeping currentTick / channelState /
        // currentVolume in one object lets the recursion share progress.
        // Six melody channel slots cover both base PSG (0,1,2) and ECS (4,5,6);
        // drum channels (3 and 7) don't need per-channel state.
        const ctx = {
            song,
            lines,
            labelLine,
            subroutineEndLine,
            currentTick: 0,
            currentVolume: 15,
            channelState: [
                { lastNote: null, instrument: 'W' },   // 0: base melody 1
                { lastNote: null, instrument: 'W' },   // 1: base melody 2
                { lastNote: null, instrument: 'W' },   // 2: base melody 3
                null,                                  // 3: base drums (no melody state)
                { lastNote: null, instrument: 'W' },   // 4: ECS melody 1
                { lastNote: null, instrument: 'W' },   // 5: ECS melody 2
                { lastNote: null, instrument: 'W' },   // 6: ECS melody 3
                null,                                  // 7: ECS drums
            ],
        };

        this._processBlock(blockStart, lines.length, ctx);
        return song;
    }

    /**
     * Walk lines [startIdx, endIdx) processing MUSIC data. Recurses on
     * MUSIC GOSUB <label> (which inlines the subroutine's notes at the
     * caller's currentTick) and returns on MUSIC RETURN.
     *
     * Used for both the main song walk and each GOSUB expansion.
     */
    static _processBlock(startIdx, endIdx, ctx) {
        for (let i = startIdx; i < endIdx; i++) {
            const { text: line } = ctx.lines[i];

            // Label inside the block → record for JUMP/GOSUB resolution.
            // First occurrence wins (so a subroutine label keeps the tick of
            // its definition, not the tick of a later GOSUB call site).
            const labelM = line.match(LABEL_RE);
            if (labelM) {
                if (ctx.song.metadata.labels[labelM[1]] == null) {
                    ctx.song.metadata.labels[labelM[1]] = ctx.currentTick;
                }
                // If this label is the start of a subroutine and we're in the
                // main walk, skip past its body so the subroutine notes only
                // appear via GOSUB calls. (During a GOSUB expansion, we
                // entered AT subStart+1, so the subroutine's own label is
                // never re-encountered here.)
                if (ctx.subroutineEndLine[labelM[1]] != null) {
                    i = ctx.subroutineEndLine[labelM[1]];
                }
                continue;
            }

            // DATA line → tempo change at this tick
            const dataM = line.match(DATA_RE);
            if (dataM) {
                const v = parseInt(dataM[1], 10);
                ctx.song.ticksPerNote = v;
                if (ctx.song.initialTicksPerNote == null) {
                    ctx.song.initialTicksPerNote = v;
                }
                continue;
            }

            // Control command (REPEAT / STOP / JUMP / GOSUB / RETURN / SPEED / VOLUME)
            const ctrlM = line.match(CONTROL_RE);
            if (ctrlM) {
                const cmd = ctrlM[1].toUpperCase();
                const arg = ctrlM[2].trim();
                ctx.song.controls.push({
                    tick:   ctx.currentTick,
                    type:   cmd,
                    target: arg || undefined,
                });
                if (cmd === 'SPEED') {
                    const n = parseInt(arg, 10);
                    if (!isNaN(n)) ctx.song.ticksPerNote = n;
                }
                if (cmd === 'VOLUME') {
                    const n = parseInt(arg, 10);
                    if (!isNaN(n) && n >= 0 && n <= 15) ctx.currentVolume = n;
                }
                if (cmd === 'GOSUB') {
                    // Inline the subroutine's notes at the current tick.
                    const subStart = ctx.labelLine[arg];
                    if (subStart != null) {
                        this._processBlock(subStart + 1, ctx.lines.length, ctx);
                    }
                    continue;
                }
                if (cmd === 'RETURN') {
                    // End of subroutine — unwind to caller.
                    return;
                }
                if (cmd === 'STOP' || cmd === 'REPEAT' || cmd === 'JUMP') {
                    // Terminal control — nothing past this plays in sequence.
                    return;
                }
                continue;
            }

            // MUSIC data line
            const musicM = line.match(MUSIC_DATA_RE);
            if (musicM) {
                const args = musicM[1].split(',').map(s => s.trim());
                // 4 args = base PSG (3 melody + drum). 8 args = ECS variant
                // (3 melody + drum on each of the two PSGs).
                if (args.length !== 4 && args.length !== 8) {
                    // Bad MUSIC line — skip silently. Real IntyBASIC would error;
                    // we'd rather show what we can than refuse to import.
                    continue;
                }
                if (args.length === 8 && ctx.song.channelCount < 8) {
                    ctx.song.channelCount = 8;
                }

                // Args 0-2 = base PSG melody → channels 0,1,2
                // Arg 3   = base PSG drum   → channel 3
                // Args 4-6 = ECS PSG melody → channels 4,5,6
                // Arg 7   = ECS PSG drum   → channel 7
                for (let ch = 0; ch < 3; ch++) {
                    this._processChannelToken(args[ch], ch, ctx.song, ctx.channelState, ctx.currentTick, ctx.currentVolume);
                }
                this._processDrumToken(args[3], ctx.song, ctx.currentTick, ctx.currentVolume, 3);

                if (args.length === 8) {
                    for (let ch = 4; ch < 7; ch++) {
                        this._processChannelToken(args[ch], ch, ctx.song, ctx.channelState, ctx.currentTick, ctx.currentVolume);
                    }
                    this._processDrumToken(args[7], ctx.song, ctx.currentTick, ctx.currentVolume, 7);
                }

                ctx.currentTick += ctx.song.ticksPerNote;
                continue;
            }

            // Anything else: we've left the music block. Stop.
            return;
        }
    }

    /** Process one melody channel token into a note (or sustain / silence). */
    static _processChannelToken(token, channel, song, channelState, currentTick, currentVolume = 15) {
        const state = channelState[channel];

        if (token === '-') {
            // Silence — terminate any sustained note
            state.lastNote = null;
            return;
        }
        if (token === 'S' || token === 's') {
            // Sustain previous note by one tempo step
            if (state.lastNote) {
                state.lastNote.durationTicks += song.ticksPerNote;
            }
            return;
        }

        const m = token.match(NOTE_RE);
        if (!m) {
            // Unrecognized token — treat as silence to keep the timeline sound
            state.lastNote = null;
            return;
        }
        // IntyBASIC compiler restriction: octave 7 only allows C and C#
        // (IntyBASIC.cpp:3315 — "if (note == 0)" gate). D7-B7 are illegal.
        if (m[2] === '7' && m[1].toUpperCase() !== 'C') {
            state.lastNote = null;
            return;
        }
        const [, letter, octaveStr, sharp, inst] = m;
        const semitone = NOTE_SEMITONE[letter.toUpperCase()] + (sharp ? 1 : 0);
        const octave = parseInt(octaveStr, 10);
        // MIDI: C4 = 60, so midi = (octave + 1) * 12 + semitone
        const midi = (octave + 1) * 12 + semitone;

        // Remember instrument across notes on this channel
        if (inst) state.instrument = inst.toUpperCase();

        const note = {
            startTick:     currentTick,
            durationTicks: song.ticksPerNote,
            channel:       channel,
            pitch:         midi,
            instrument:    state.instrument,
            volume:        currentVolume,
            drum:          null,
        };
        song.notes.push(note);
        state.lastNote = note;
    }

    /**
     * Process a drum-lane token into a one-shot drum hit.
     * @param {number} channel - 3 for base PSG drums, 7 for ECS drums
     */
    static _processDrumToken(token, song, currentTick, currentVolume = 15, channel = 3) {
        if (token === '-') return;
        const m = token.match(DRUM_RE);
        if (!m) return;
        song.notes.push({
            startTick:     currentTick,
            durationTicks: song.ticksPerNote,
            channel,
            pitch:         null,
            instrument:    null,
            volume:        currentVolume,
            drum:          'M' + m[1],
        });
    }

    /**
     * Tokenize source: strip comments (single quote to EOL), trim whitespace,
     * drop blank lines. Returns [{ text, lineNumber }].
     */
    static _tokenize(text) {
        return text
            .replace(/\r/g, '')                    // normalize line endings
            .split('\n')
            .map((rawLine, idx) => {
                // Strip everything after a single quote (IntyBASIC comment)
                const noComment = rawLine.replace(/'.*$/, '').trim();
                return { text: noComment, lineNumber: idx + 1 };
            })
            .filter(l => l.text.length > 0);
    }

    /**
     * Find the index of the first label whose NEXT non-blank line is a DATA
     * statement. That's the start of a music block.
     */
    static _findFirstMusicBlock(lines) {
        for (let i = 0; i < lines.length - 1; i++) {
            if (LABEL_RE.test(lines[i].text) && DATA_RE.test(lines[i + 1].text)) {
                return i;
            }
        }
        return -1;
    }

    // Reverse map: semitone → note letter + sharp flag
    static SEMITONE_TO_NOTE = [
        ['C',''], ['C','#'], ['D',''], ['D','#'], ['E',''],
        ['F',''], ['F','#'], ['G',''], ['G','#'], ['A',''],
        ['A','#'], ['B',''],
    ];

    /** Convert a MIDI note number back to IntyBASIC notation (e.g. "C4#X"). */
    static _midiToToken(midi, instrument) {
        const octave = Math.floor(midi / 12) - 1;
        const semi   = midi % 12;
        const [letter, sharp] = this.SEMITONE_TO_NOTE[semi];
        return `${letter}${octave}${sharp}${instrument || ''}`;
    }

    /**
     * Serialize a SongIR back to IntyBASIC MUSIC source.
     *
     * Walks the timeline in ticksPerNote steps. For each step, looks up what
     * each channel is doing (new note, sustain, silence) and emits one MUSIC
     * line with 4 arguments (3 melody + 1 drum). Labels and control commands
     * are emitted at their recorded tick positions.
     *
     * The output should round-trip cleanly: parse → serialize → parse produces
     * an identical SongIR (modulo whitespace / comment differences).
     */
    static serialize(song) {
        if (!song) return '';
        const step    = song.ticksPerNote || 8;
        const label   = song.label || 'song';
        // Walk must reach the latest control tick too, so a JUMP/STOP sitting
        // past the last note's end (silent tail bars) doesn't get dropped.
        let totalTicks = this.getTotalTicks(song);
        for (const c of (song.controls || [])) {
            if (c.tick > totalTicks) totalTicks = c.tick;
        }

        // Build per-tick lookup tables for fast access during the walk.
        // noteMap[channel] = sorted array of notes on that channel.
        // Channels 0-3 = base PSG (3 melody + drum). 4-7 = ECS PSG (3 + drum).
        const isEcs = (song.channelCount || 3) >= 8;
        const slotCount = isEcs ? 8 : 4;
        const noteMap = Array.from({ length: slotCount }, () => []);
        for (const n of (song.notes || [])) {
            if (n.channel < 0 || n.channel >= slotCount) continue;
            noteMap[n.channel].push(n);
        }
        for (let ch = 0; ch < slotCount; ch++) {
            noteMap[ch].sort((a, b) => a.startTick - b.startTick);
        }

        // Label lookup: tick → label name (may have multiple labels at different ticks)
        const labelAt = {};
        if (song.metadata?.labels) {
            for (const [name, tick] of Object.entries(song.metadata.labels)) {
                if (!labelAt[tick]) labelAt[tick] = [];
                labelAt[tick].push(name);
            }
        }

        // Control lookup: tick → control command
        const controlAt = {};
        for (const ctrl of (song.controls || [])) {
            controlAt[ctrl.tick] = ctrl;
        }

        // Per-channel state: which note is currently sounding (for sustain detection)
        const activeNote = Array.from({ length: slotCount }, () => null);
        // Per-channel last-emitted instrument (for carry-over: only emit the
        // instrument letter when it changes).
        const lastInst = Array.from({ length: slotCount }, () => '');

        let out = '';

        // Header comment
        out += `' Generated by Intellivision Overlay Editor\n`;
        out += `' https://intellivision-overlay-editor.fly.dev\n\n`;

        // Emit the song label + DATA
        out += `${label}:\n`;
        out += `  DATA ${step}\n\n`;

        // Walk the timeline
        for (let tick = 0; tick <= totalTicks; tick += step) {
            // Labels that fall at this tick
            if (labelAt[tick]) {
                for (const lbl of labelAt[tick]) {
                    if (lbl !== label) {   // don't re-emit the song's own label
                        out += `${lbl}:\n`;
                    }
                }
            }

            // Control commands at this tick (SPEED, VOLUME, etc. — NOT STOP/JUMP/REPEAT,
            // those go AFTER the last MUSIC line below)
            const ctrl = controlAt[tick];
            if (ctrl && ctrl.type === 'SPEED') {
                out += `  MUSIC SPEED ${ctrl.target}\n`;
            }
            if (ctrl && ctrl.type === 'VOLUME') {
                out += `  MUSIC VOLUME ${ctrl.target}\n`;
            }

            // If this tick is past the last note AND there's a terminal control here,
            // emit it and stop. Don't emit an empty MUSIC line for the terminal tick.
            if (ctrl && (ctrl.type === 'STOP' || ctrl.type === 'REPEAT' || ctrl.type === 'JUMP')) {
                if (ctrl.type === 'STOP')   out += `\n  MUSIC STOP\n`;
                if (ctrl.type === 'REPEAT') out += `\n  MUSIC REPEAT\n`;
                if (ctrl.type === 'JUMP')   out += `\n  MUSIC JUMP ${ctrl.target}\n`;
                break;
            }

            // Build the 4 (or 8) tokens for this MUSIC line.
            // Base PSG: channels 0-2 melody + 3 drum.
            // ECS PSG: channels 4-6 melody + 7 drum (only when channelCount === 8).
            const tokens = [];
            for (let ch = 0; ch < 3; ch++) {
                tokens.push(this._channelTokenAt(tick, step, ch, noteMap[ch], activeNote, lastInst));
            }
            tokens.push(this._drumTokenAt(tick, noteMap[3]));
            if (isEcs) {
                for (let ch = 4; ch < 7; ch++) {
                    tokens.push(this._channelTokenAt(tick, step, ch, noteMap[ch], activeNote, lastInst));
                }
                tokens.push(this._drumTokenAt(tick, noteMap[7]));
            }

            out += `  MUSIC ${tokens.join(', ')}\n`;
        }

        // If we walked past all notes without hitting a terminal control,
        // append MUSIC STOP so the song doesn't hang.
        const lastCtrl = (song.controls || []).find(c =>
            c.type === 'STOP' || c.type === 'REPEAT' || c.type === 'JUMP'
        );
        if (!lastCtrl) {
            out += `\n  MUSIC STOP\n`;
        }

        return out;
    }

    /**
     * Determine the token for one melody channel at a given tick.
     * Returns the note name (with instrument if changed), 'S' for sustain,
     * or '-' for silence.
     */
    static _channelTokenAt(tick, step, ch, notes, activeNote, lastInst) {
        // Is there a note that STARTS at this tick?
        const starting = notes.find(n => n.startTick === tick && n.pitch != null);
        if (starting) {
            activeNote[ch] = starting;
            // Emit instrument letter only if it changed from the last note on this channel
            const inst = starting.instrument || 'W';
            const instSuffix = (inst !== lastInst[ch]) ? inst : '';
            lastInst[ch] = inst;
            return this._midiToToken(starting.pitch, instSuffix);
        }

        // Is the previously-started note still sustaining through this tick?
        const prev = activeNote[ch];
        if (prev && prev.startTick + prev.durationTicks > tick) {
            return 'S';
        }

        // Silence
        activeNote[ch] = null;
        return '-';
    }

    /** Determine the drum token at a given tick. */
    static _drumTokenAt(tick, drumNotes) {
        const hit = drumNotes.find(n => n.startTick === tick && n.drum);
        return hit ? hit.drum : '-';
    }

    /**
     * Detect the loop structure of the song based on its REPEAT/JUMP control.
     *
     *   REPEAT     → loop entire song from tick 0
     *   JUMP label → loop the slice [label_tick .. jump_tick) indefinitely
     *
     * Returns null if the song doesn't loop (no REPEAT, no JUMP, or JUMP
     * to a label that doesn't exist in the parsed metadata).
     *
     * Shape: { introEnd, loopEnd, loopDuration }
     *   introEnd     — tick where the loop body begins (notes before this
     *                  play once at the start as an intro)
     *   loopEnd      — tick where the JUMP/REPEAT fires (loop body ends here)
     *   loopDuration — loopEnd - introEnd (one iteration's tick count)
     */
    static getLoopInfo(song) {
        if (!song || !song.controls) return null;
        const ctrl = song.controls.find(c => c.type === 'JUMP' || c.type === 'REPEAT');
        if (!ctrl) return null;

        const loopEnd = ctrl.tick;
        let introEnd;
        if (ctrl.type === 'REPEAT') {
            introEnd = 0;
        } else {
            const target = song.metadata?.labels?.[ctrl.target];
            if (target == null) return null;
            introEnd = target;
        }
        const loopDuration = loopEnd - introEnd;
        if (loopDuration <= 0) return null;   // degenerate loop (label after JUMP, etc.)
        return { introEnd, loopEnd, loopDuration };
    }

    /**
     * Convert SongIR into a flat list of timed playback events for psgSynth.
     *
     * IntyBASIC's MUSIC engine ticks at a fixed 50 Hz on both NTSC and PAL
     * (manual.txt:1228 — "there are 50 ticks per second"). On NTSC it skips
     * the 6th video frame to maintain the cadence.
     * So each tick = 1/50 = 0.02 seconds of song time.
     *
     * Looping: if the song has a JUMP/REPEAT control, the loop body is
     * emitted `loopCount` times so the synth's flat event list naturally
     * plays multiple iterations without needing the synth to know about
     * structure. Default 4 loops ≈ 1-3 minutes of audio for typical songs.
     *
     * @returns {Array<{ timeSec, type, ... }>}
     *   type 'note' has { pitch, durationTicks, instrument, channel }
     *   type 'drum' has { drumType, channel }
     */
    /**
     * Return the ticksPerNote tempo active at the given tick, accounting for
     * mid-song MUSIC SPEED changes. Used by the editor when placing new notes
     * so they get the right duration for where in the timeline they land.
     */
    static tempoAt(song, tick) {
        let tempo = song.initialTicksPerNote ?? song.ticksPerNote ?? 8;
        for (const c of (song.controls || [])) {
            if (c.type !== 'SPEED') continue;
            if (c.tick > tick) break;   // controls are pushed in tick order
            const v = parseInt(c.target, 10);
            if (!isNaN(v) && v > 0) tempo = v;
        }
        return tempo;
    }

    static toPlaybackEvents(song, framerate = 50, loopCount = 4) {
        const events = [];
        const tickSec = 1 / framerate;
        const loop = this.getLoopInfo(song);

        const noteToEvent = (note, startTick) => {
            const timeSec = startTick * tickSec;
            // Volume is a 0-15 IntyBASIC value; 15 (or undefined for older songs) = full.
            const volume01 = (note.volume == null) ? 1 : Math.max(0, Math.min(15, note.volume)) / 15;
            if (note.drum) {
                return {
                    timeSec,
                    type:     'drum',
                    channel:  note.channel,
                    drumType: note.drum,
                    volume:   volume01,
                };
            } else if (note.pitch !== null && note.pitch !== undefined) {
                return {
                    timeSec,
                    type:           'note',
                    channel:        note.channel,
                    pitch:          note.pitch,
                    durationTicks:  note.durationTicks,
                    instrument:     note.instrument || 'W',
                    volume:         volume01,
                };
            }
            return null;
        };

        for (const note of (song.notes || [])) {
            // Intro notes (or non-looping songs): emit once at original position
            if (!loop || note.startTick < loop.introEnd) {
                const ev = noteToEvent(note, note.startTick);
                if (ev) events.push(ev);
                continue;
            }
            // Loop body: emit loopCount times, shifted by iteration
            if (note.startTick < loop.loopEnd) {
                for (let i = 0; i < loopCount; i++) {
                    const ev = noteToEvent(note, note.startTick + i * loop.loopDuration);
                    if (ev) events.push(ev);
                }
            }
            // Notes past loopEnd (shouldn't exist since the parser stops at
            // JUMP) — silently ignored.
        }

        // Stable sort by time so the synth processes them in playback order
        events.sort((a, b) => a.timeSec - b.timeSec);
        return events;
    }

    /** Total UNLOOPED song length in ticks (one pass through everything). */
    static getTotalTicks(song) {
        let maxTick = 0;
        for (const note of (song.notes || [])) {
            maxTick = Math.max(maxTick, note.startTick + note.durationTicks);
        }
        return maxTick;
    }

    /**
     * Total playback duration in ticks accounting for loop expansion.
     * For looping songs: intro + loopCount × loopDuration.
     * For non-looping songs: same as getTotalTicks.
     */
    static getPlaybackTicks(song, loopCount = 4) {
        const loop = this.getLoopInfo(song);
        if (!loop) return this.getTotalTicks(song);
        return loop.introEnd + loopCount * loop.loopDuration;
    }
}
