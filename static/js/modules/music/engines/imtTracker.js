// IMT — Intellivision Music Tracker
//
// IMT is Arnauld Chevallier's 2008 tracker as significantly extended by
// James Pujals (DZ-Jay) starting ~2017: 6 channels (3 base PSG + 3 ECS),
// first-class instrument envelopes, multi-step drum samples, and pitch
// effects. The NOTES("NnO IVL", …) macro syntax is the same as the
// original Chevallier tracker — the divergence is in the surrounding
// song-header structure and the addition of DRM events.
//
// Distribution on disk (downloaded by the user):
//   imt/trk-distro-rev4/
//     src/lib/{tracker.asm,tracker.mac}   — engine source (auth: Chevallier + Pujals)
//     src/songs/*.asm                      — 8 demo songs (validation corpus)
//     utils/ibn2imt.pl                     — IntyBASIC MUSIC → IMT translator
//     docs/Tracker v1.5 User Manual & Technical Guide.pdf
//
// ── Song-level structure (what we parse) ───────────────────────────────────
//
//   SONGNAME PROC
//     DECLE   <speed>, @@patterns, @@instr, @@drums         ; song header
//     @@sequence:  DECLE  0, 1, 1, 2, 3, -8                 ; pattern indices + signed-N loop
//     @@patterns:  DECLE  <len>, @@chA, @@chB, ..., @@chF   ; rows of 7 DECLEs each
//                  ...
//     @@instr:     DECLE  <pitch_ptr>, <vibrato>, <env_ptr> ; per-instr triplets
//                  ...
//     @@drums:     DECLE  <drum_sample_ptr>                 ; per-drum-slot pointer
//                  ...
//     @@p000:      NOTES("NnO IVL", "NnO IVL", "NnO IVL", "NnO IVL")
//                  NOTES(...)
//     @@pXXX:      NOTES("NUL 10F", "NUL 10F", "", "")      ; silence sentinel
//   ENDP
//
// ── Note string format (NnO IVL — identical to Chevallier) ─────────────────
//
//   N = note letter (C/D/E/F/G/A/B)
//   n = '-' or '#'
//   O = octave (1..7)
//   I = instrument hex (0 = unchanged, 1..F = instrument slot 1..15)
//   V = volume hex (0..F)
//   L = length hex (0..F → 1..16 ticks)
//
//   Special tokens:
//     "DRM IVL" → drum event (I = drum-kit slot, V = volume, L = length)
//     "NUL IVL" → no note change (sustain previous note for L+1 more ticks)
//     ""        → empty padding (NOTES() argument that emits nothing)
//
// ── Phase 1 scope (this commit) ────────────────────────────────────────────
//
// Parse the song structure into SongIR with 6 melody channels (no fixed
// drum lane — DRM events become drum-tagged notes on whichever channel
// they appear on). Build a flat timeline by walking the sequence list.
// Emit the loop label so getLoopInfo() can find it. Round-trip serialize
// back to .asm. Render on the existing piano-roll using channels 0-5.
//
// What Phase 2 may add:
//   • Per-instrument envelope playback in the Web Audio synth
//   • Pitch-effect / vibrato shape support
//   • Visual drum-kit editor that surfaces the DRUM() sample steps

import { MusicEngine } from './engineBase.js';

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Macros / labels / DECLE patterns. All accept an optional `LABEL:` prefix
// on the same line — IMT songs put first-pattern-row labels next to DECLE
// and NPK pattern labels next to the first NPK.Note. Also accepts an
// optional "ASM" IntyBASIC assembly-directive prefix.
const LABEL_PREFIX  = '(?:[A-Za-z_@][A-Za-z0-9_@.]*:)?\\s*';
const NOTES_RE      = new RegExp(`^\\s*${LABEL_PREFIX}NOTES\\(\\s*"([^"]*)"\\s*,\\s*"([^"]*)"\\s*,\\s*"([^"]*)"\\s*,\\s*"([^"]*)"\\s*\\)`, 'i');
const NPK_NOTE_RE   = new RegExp(`^\\s*${LABEL_PREFIX}NPK\\.Note\\(\\s*"([^"]*)"\\s*\\)`, 'i');
const NPK_BEGIN_RE  = new RegExp(`^\\s*${LABEL_PREFIX}NPK\\.Begin\\(`, 'i');
const NPK_END_RE    = new RegExp(`^\\s*${LABEL_PREFIX}NPK\\.End\\b`, 'i');
const PROC_START_RE = /^(?:ASM\s+)?([A-Z_][A-Z0-9_]*)\s+PROC\b/i;
const PROC_END_RE   = /^(?:ASM\s+)?\s*ENDP\b/i;
const LABEL_RE      = /^(@@[A-Za-z0-9_]+|[A-Za-z_][A-Za-z0-9_]*):/;
const DECLE_RE      = new RegExp(`^\\s*${LABEL_PREFIX}DECLE\\s+(.*)`, 'i');

// IMT's "silence sentinel" label convention — used in every demo song
const SILENCE_LABEL = '@@pXXX';

export class ImtTracker extends MusicEngine {
    static formatName    = 'IMT (Intellivision Music Tracker)';
    static formatSlug    = 'imt-tracker';
    static channelCount  = 6;
    static supportsDrums = true;   // drums are per-channel DRM events, not a separate lane

    /** Auto-detect helper for musicEditor's engine sniffer. IMT is
     *  distinguished from Chevallier original by the 4-DECLE header
     *  (the demo songs always include @@instr / @@drums labels) and from
     *  ZMUS by the presence of NOTES() macro calls. */
    static looksLike(text) {
        if (!PROC_START_RE.test(text)) return false;
        if (!/NOTES\(/i.test(text)) return false;
        // The IMT header references both @@instr and @@drums labels — these
        // are the IMT-only structures. Chevallier's header is just
        // (speed, flags, @@patterns) and has no instr/drums sections.
        return /@@instr\b/i.test(text) && /@@drums\b/i.test(text);
    }

    static parse(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const proc = this._findFirstSongProc(lines);
        if (!proc) {
            throw new Error('No IMT song PROC found. Expected "NAME PROC ... DECLE <speed>, @@patterns, @@instr, @@drums ... ENDP" with NOTES() macro calls.');
        }
        const { name, body } = proc;

        // Build label → line-index lookup
        const labelLine = {};
        for (let i = 0; i < body.length; i++) {
            const m = body[i].text.match(LABEL_RE);
            if (m && labelLine[m[1]] == null) labelLine[m[1]] = i;
        }

        // The very first DECLE line is the song header:
        //   DECLE <speed>, <patterns_label>, <instr_label>, <drums_label>
        const headerIdx = body.findIndex(l => DECLE_RE.test(l.text));
        if (headerIdx < 0) throw new Error(`IMT PROC ${name}: no DECLE header found.`);
        const headerToks = this._splitDecle(body[headerIdx].text);
        if (headerToks.length < 4) {
            throw new Error(`IMT PROC ${name}: header should have 4 DECLE values (speed, patterns, instr, drums); got ${headerToks.length}.`);
        }
        const speed         = this._evalNumber(headerToks[0]);
        const patternsLabel = headerToks[1];
        const instrLabel    = headerToks[2];
        const drumsLabel    = headerToks[3];

        // The sequence is the next labeled block immediately after the header
        // and before @@patterns. We collect every DECLE value until we hit the
        // @@patterns label. The terminator is a signed-negative loop offset.
        const sequence = this._collectSequence(body, headerIdx + 1, patternsLabel);

        // Patterns table — every row is `length, ch0, ch1, ch2, ch3, ch4, ch5`
        const patterns = this._collectPatterns(body, labelLine[patternsLabel]);

        // For each pattern, decode each channel's NOTES stream into a flat
        // array of { offsetTick, lengthTicks, pitch (MIDI) | drum | sustain, volume }.
        const patternNotes = patterns.map(p => p.chLabels.map(lbl => {
            // The silence-sentinel label is a documented placeholder meaning
            // "this channel produces no audible content for this pattern".
            if (lbl === SILENCE_LABEL) return [];
            const startIdx = labelLine[lbl];
            if (startIdx == null) return [];
            return this._decodePatternChannel(body, startIdx);
        }));

        // Build SongIR by walking the sequence and stacking patterns linearly.
        const song = this.defaultSong();
        song.label = name;
        song.ticksPerNote = Math.max(1, speed);
        song.channelCount = 6;
        song.metadata.imtSpeed = speed;
        song.metadata.imtSourceLabels = {
            patterns: patternsLabel,
            instr:    instrLabel,
            drums:    drumsLabel,
        };

        let currentTick = 0;
        let loopBodyStart = null;

        for (const entry of sequence) {
            if (entry.kind === 'PATTERN') {
                const pat = patterns[entry.index];
                if (!pat) continue;
                const notes = patternNotes[entry.index];
                for (let ch = 0; ch < 6; ch++) {
                    for (const n of (notes[ch] || [])) {
                        const isDrum = n.kind === 'DRM';
                        song.notes.push({
                            startTick:     currentTick + n.offsetTick,
                            durationTicks: n.lengthTicks,
                            channel:       ch,
                            pitch:         isDrum ? null : n.pitch,
                            instrument:    'W',
                            volume:        n.volume,
                            drum:          isDrum ? `M${n.instr || 1}` : null,
                        });
                    }
                }
                currentTick += pat.length;
            } else if (entry.kind === 'JUMP_BACK') {
                // Resolve the negative offset by counting back N PATTERN entries
                const patternEntries = sequence.filter(e => e.kind === 'PATTERN');
                const target = patternEntries.length - entry.back;
                let loopStartTick = 0;
                for (let i = 0; i < Math.max(0, target); i++) {
                    const p = patterns[patternEntries[i].index];
                    if (p) loopStartTick += p.length;
                }
                if (loopBodyStart == null) loopBodyStart = loopStartTick;
                song.controls.push({ tick: currentTick, type: 'JUMP', target: 'loop' });
            }
        }

        if (loopBodyStart != null) {
            song.metadata.labels = song.metadata.labels || {};
            song.metadata.labels[`${name}_loop`] = loopBodyStart;
            for (const c of song.controls) {
                if (c.type === 'JUMP' && c.target === 'loop') c.target = `${name}_loop`;
            }
        }

        return song;
    }

    // ── Parser helpers ──────────────────────────────────────────────────────

    static _findFirstSongProc(lines) {
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(PROC_START_RE);
            if (!m) continue;
            const startName = m[1];
            let bodyEnd = lines.length;
            for (let j = i + 1; j < lines.length; j++) {
                if (PROC_END_RE.test(lines[j])) { bodyEnd = j; break; }
            }
            const bodyLines = lines.slice(i + 1, bodyEnd);
            // A song PROC must contain NOTES() or NPK.Note() macros (BEAT_IT
            // and similar use the NPK packed form) AND reference @@instr in
            // its header. PROCs that hold pure instrument/drum global tables
            // (envelopes, DRUM() macros) get skipped — we want the song.
            const hasNotes = bodyLines.some(l => NOTES_RE.test(l) || NPK_NOTE_RE.test(l));
            const hasInstr = bodyLines.some(l => /@@instr\b/i.test(l));
            if (hasNotes && hasInstr) {
                return { name: startName, body: bodyLines.map((text, idx) => ({ text, originalIdx: idx })) };
            }
            i = bodyEnd;
        }
        return null;
    }

    static _collectSequence(body, startIdx, patternsLabel) {
        const entries = [];
        for (let i = startIdx; i < body.length; i++) {
            const line = body[i].text;
            const lblM = line.match(LABEL_RE);
            // Stop when we reach the @@patterns label (next phase of parsing).
            // Other labels (notably @@sequence) may have DECLE on the SAME LINE
            // — DECLE_RE allows the prefix so we let it run.
            if (lblM && lblM[1] === patternsLabel) break;
            const m = line.match(DECLE_RE);
            if (!m) continue;
            for (const tok of this._splitDecle(line)) {
                const v = this._evalSigned16(tok);
                if (v < 0) {
                    entries.push({ kind: 'JUMP_BACK', back: -v });
                    return entries;
                }
                entries.push({ kind: 'PATTERN', index: v });
            }
        }
        return entries;
    }

    static _collectPatterns(body, patternsIdx) {
        const patterns = [];
        if (patternsIdx == null) return patterns;
        for (let i = patternsIdx; i < body.length; i++) {
            const line = body[i].text;
            // We've left the patterns table when we hit ANY label other than
            // the @@patterns: label itself (the table starts on or after it).
            const lblM = line.match(LABEL_RE);
            if (lblM && i !== patternsIdx) break;
            const m = line.match(DECLE_RE);
            if (!m) continue;
            const toks = this._splitDecle(line);
            if (toks.length < 7) continue;   // expect length + 6 channels
            patterns.push({
                length:    this._evalNumber(toks[0]),
                chLabels:  toks.slice(1, 7),
            });
        }
        return patterns;
    }

    static _decodePatternChannel(body, startIdx) {
        const out = [];
        let offsetTick = 0;

        // Process one decoded event (NOTE / DRM / NUL) — shared between the
        // NOTES() and NPK.Note() macros.
        const processToken = (token) => {
            if (token === '') return;
            const decoded = this._decodeNoteString(token);
            if (!decoded) return;
            const lengthTicks = decoded.length + 1;
            if (decoded.kind === 'NOTE') {
                out.push({
                    kind:       'NOTE',
                    offsetTick,
                    lengthTicks,
                    pitch:      decoded.pitch,
                    volume:     decoded.volume,
                    instr:      decoded.instr,
                });
            } else if (decoded.kind === 'DRM') {
                out.push({
                    kind:       'DRM',
                    offsetTick,
                    lengthTicks,
                    volume:     decoded.volume,
                    instr:      decoded.instr,
                });
            } else if (decoded.kind === 'NUL') {
                if (out.length > 0) out[out.length - 1].lengthTicks += lengthTicks;
            }
            offsetTick += lengthTicks;
        };

        for (let i = startIdx; i < body.length; i++) {
            const line = body[i].text;
            // ANY label other than the one we entered at terminates the
            // pattern — subsequent labels mark the start of the next
            // channel's pattern data, even when they share a line with
            // NPK.Begin / NPK.Note / NOTES().
            if (i > startIdx && LABEL_RE.test(line)) break;

            const notesM = line.match(NOTES_RE);
            if (notesM) {
                for (let arg = 1; arg <= 4; arg++) processToken(notesM[arg]);
                continue;
            }
            const npkM = line.match(NPK_NOTE_RE);
            if (npkM) {
                processToken(npkM[1]);
                continue;
            }
            // NPK.Begin / NPK.End don't emit notes themselves — skip them
        }
        return out;
    }

    static _decodeNoteString(token) {
        if (token.length < 7) return null;
        const head = token.substring(0, 3);
        if (token[3] !== ' ') return null;
        const I = this._hexDigit(token[4]);
        const V = this._hexDigit(token[5]);
        const L = this._hexDigit(token[6]);
        if (I == null || V == null || L == null) return null;
        const common = { length: L, volume: V, instr: I };
        if (head === 'NUL') return { kind: 'NUL', ...common };
        if (head === 'DRM') return { kind: 'DRM', ...common };
        const letter = head[0].toUpperCase();
        const sharp  = head[1] === '#';
        const minus  = head[1] === '-';
        if (!(sharp || minus)) return null;
        if (!(letter in SEMITONE)) return null;
        const octave = parseInt(head[2], 10);
        if (!(octave >= 1 && octave <= 7)) return null;
        const midi = (octave + 1) * 12 + SEMITONE[letter] + (sharp ? 1 : 0);
        return { kind: 'NOTE', pitch: midi, ...common };
    }

    static _hexDigit(c) {
        if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
        if (c >= 'A' && c <= 'F') return c.charCodeAt(0) - 55;
        if (c >= 'a' && c <= 'f') return c.charCodeAt(0) - 87;
        return null;
    }

    static _splitDecle(line) {
        const m = line.match(DECLE_RE);
        if (!m) return [];
        const noComment = m[1].replace(/;.*$/, '').replace(/\/\/.*$/, '');
        return noComment.split(',').map(s => s.trim()).filter(Boolean);
    }

    static _evalNumber(expr) {
        if (expr == null) return 0;
        const e = expr.trim();
        if (e === '') return 0;
        if (/^\$[0-9a-f]+$/i.test(e)) return parseInt(e.slice(1), 16);
        if (/^0x[0-9a-f]+$/i.test(e)) return parseInt(e.slice(2), 16);
        if (/^-?\d+$/.test(e))         return parseInt(e, 10) & 0xFFFF;
        return 0;   // label refs are left as 0 — we resolve via labelLine instead
    }

    static _evalSigned16(expr) {
        if (expr == null) return 0;
        const e = expr.trim();
        if (/^-?\d+$/.test(e)) return parseInt(e, 10);
        if (/^\$[0-9a-f]+$/i.test(e)) {
            const v = parseInt(e.slice(1), 16);
            return v >= 0x8000 ? v - 0x10000 : v;
        }
        return 0;
    }

    // ── SongIR helpers (shared interface with the editor) ──────────────────

    static getTotalTicks(song) {
        let max = 0;
        for (const n of (song.notes || [])) {
            max = Math.max(max, n.startTick + (n.durationTicks || 0));
        }
        for (const c of (song.controls || [])) {
            if (c.tick > max) max = c.tick;
        }
        return max;
    }

    static getLoopInfo(song) {
        const jump = song?.controls?.find(c => c.type === 'JUMP');
        if (!jump) return null;
        const labelTick = song.metadata?.labels?.[jump.target];
        if (labelTick == null) return null;
        const loopDuration = jump.tick - labelTick;
        if (loopDuration <= 0) return null;
        return { introEnd: labelTick, loopEnd: jump.tick, loopDuration };
    }

    static getPlaybackTicks(song, loopCount = 4) {
        const loop = this.getLoopInfo(song);
        if (!loop) return this.getTotalTicks(song);
        return loop.introEnd + loopCount * loop.loopDuration;
    }

    static tempoAt(song, _tick) {
        return song?.ticksPerNote || 6;
    }

    /** Conservative byte estimate for the status line. IMT compiled size
     *  includes pattern data (2 DECLEs per note = 4 bytes), patterns table
     *  (7 DECLEs per pattern = 14 bytes), and the small per-song overhead. */
    static estimateRomBytes(song) {
        if (!song) return 0;
        const noteBytes      = (song.notes?.length || 0) * 4;
        const ctrlBytes      = (song.controls?.length || 0) * 2;
        const patternCount   = Math.max(1, song.metadata?.imtPatternCount || 1);
        const tableBytes     = patternCount * 14;
        const overheadBytes  = 12;   // header + sequence + tables
        return noteBytes + ctrlBytes + tableBytes + overheadBytes;
    }

    // ── Playback events (Web Audio synth) ──────────────────────────────────

    static toPlaybackEvents(song, framerate = 50, loopCount = 4) {
        const events = [];
        const tickSec = 1 / framerate;
        const loop = this.getLoopInfo(song);

        const noteToEvent = (note, startTick) => {
            const vol01 = (note.volume == null) ? 1 : Math.max(0, Math.min(15, note.volume)) / 15;
            const timeSec = startTick * tickSec;
            if (note.drum) {
                return {
                    timeSec,
                    type:     'drum',
                    channel:  note.channel,
                    drumType: note.drum,
                    volume:   vol01,
                };
            }
            if (note.pitch != null) {
                return {
                    timeSec,
                    type:           'note',
                    channel:        note.channel,
                    pitch:          note.pitch,
                    durationTicks:  note.durationTicks,
                    instrument:     note.instrument || 'W',
                    volume:         vol01,
                };
            }
            return null;
        };

        for (const note of (song.notes || [])) {
            if (!loop || note.startTick < loop.introEnd) {
                const ev = noteToEvent(note, note.startTick);
                if (ev) events.push(ev);
                continue;
            }
            if (note.startTick < loop.loopEnd) {
                for (let i = 0; i < loopCount; i++) {
                    const ev = noteToEvent(note, note.startTick + i * loop.loopDuration);
                    if (ev) events.push(ev);
                }
            }
        }
        events.sort((a, b) => a.timeSec - b.timeSec);
        return events;
    }

    // ── Serializer ─────────────────────────────────────────────────────────
    //
    // Phase 1 produces a structurally-correct IMT .asm output. We re-derive
    // one pattern per per-channel chunk of `song.notes` and emit a single
    // sequence entry per pattern with a -N loop terminator if a JUMP control
    // exists. This is functionally identical to the input but may not be
    // bit-identical when re-parsed from a hand-authored source that used
    // smaller patterns (the round-trip is many-into-one, then back as one).

    static serialize(song) {
        if (!song?.notes?.length) {
            return [
                "' IMT round-trip serializer — Phase 1.",
                "' This is an empty song; add notes (or load a demo) and try again.",
            ].join('\n');
        }

        const label = song.label || 'untitled_imt';
        const speed = song.ticksPerNote || 6;
        const totalTicks = this.getTotalTicks(song);

        // Build per-channel event streams from the SongIR notes.
        const channelStreams = [[], [], [], [], [], []];
        for (const n of song.notes) {
            const ch = Math.min(5, Math.max(0, n.channel));
            channelStreams[ch].push(n);
        }
        for (const stream of channelStreams) {
            stream.sort((a, b) => a.startTick - b.startTick);
        }

        // Encode each channel into a string of NOTE tokens covering 0..totalTicks
        const noteTokens = channelStreams.map(stream =>
            this._encodeChannelTokens(stream, totalTicks));

        const lines = [
            `' Generated by Intellivision Overlay Editor`,
            `' IMT — Intellivision Music Tracker (extended Chevallier).`,
            `' Engine: imt/trk-distro-rev4/src/lib/tracker.asm (Arnauld Chevallier 2008,`,
            `' James Pujals 2020). INCLUDE this file alongside the engine to play.`,
            ``,
            `${label}   PROC`,
            `; Song header: speed, patterns, instr, drums`,
            `        DECLE   ${speed}, @@patterns, @@instr, @@drums`,
            ``,
            `; Sequence — single combined pattern, looping back to itself if a JUMP exists`,
            `@@sequence:`,
            this._loopInfoToSequenceLine(song),
            ``,
            `; Patterns table — one row per pattern, length + 6 channel pointers`,
            `@@patterns:`,
            `        DECLE   ${totalTicks}, @@p000, @@p001, @@p002, @@p003, @@p004, @@p005`,
            ``,
            `; Instruments table (empty placeholder — Phase 2 will surface instrument editing)`,
            `@@instr:`,
            `        DECLE   0, 0, 0`,
            ``,
            `; Drums table (empty placeholder)`,
            `@@drums:`,
            `        DECLE   0`,
            ``,
            `; Per-channel pattern data`,
        ];

        for (let ch = 0; ch < 6; ch++) {
            lines.push(``);
            lines.push(`@@p00${ch}:`);
            const tokens = noteTokens[ch];
            if (tokens.length === 0) {
                // Use the documented silence sentinel form
                lines.push(`        NOTES("NUL 10F", "NUL 10F", "", "")`);
                continue;
            }
            // Group into NOTES(4-args) calls
            for (let i = 0; i < tokens.length; i += 4) {
                const chunk = [
                    tokens[i + 0] || '',
                    tokens[i + 1] || '',
                    tokens[i + 2] || '',
                    tokens[i + 3] || '',
                ].map(t => `"${t}"`).join(', ');
                lines.push(`        NOTES(${chunk})`);
            }
        }

        lines.push(``);
        lines.push(`        ENDP`);
        return lines.join('\n');
    }

    /** One channel's stream of timed notes/drums → an ordered list of
     *  IMT-format token strings ("NnO IVL", "DRM IVL", "NUL IVL"). Inserts
     *  NUL fills to cover gaps between consecutive notes. */
    static _encodeChannelTokens(stream, totalTicks) {
        const tokens = [];
        let cursor = 0;
        for (const n of stream) {
            // Gap before this note → emit a silent NUL of the right length
            const gap = n.startTick - cursor;
            if (gap > 0) {
                this._emitSilenceTokens(tokens, gap);
                cursor = n.startTick;
            }
            const remaining = n.durationTicks || 1;
            const len = Math.max(1, Math.min(16, remaining));
            const I = (n.drum ? this._drumToInstr(n.drum) : 1).toString(16).toUpperCase();
            const V = Math.max(0, Math.min(15, n.volume ?? 15)).toString(16).toUpperCase();
            const L = (len - 1).toString(16).toUpperCase();
            if (n.drum) {
                tokens.push(`DRM ${I}${V}${L}`);
            } else {
                tokens.push(`${this._midiToHead(n.pitch)} ${I}${V}${L}`);
            }
            cursor += len;
            // Long notes get NUL extensions
            let extra = (n.durationTicks || 1) - len;
            while (extra > 0) {
                const e = Math.min(16, extra);
                tokens.push(`NUL 0F${(e - 1).toString(16).toUpperCase()}`);
                cursor += e;
                extra  -= e;
            }
        }
        // Trailing silence to fill the pattern length so all 6 channels align
        if (totalTicks > cursor) {
            this._emitSilenceTokens(tokens, totalTicks - cursor);
        }
        return tokens;
    }

    static _emitSilenceTokens(tokens, ticks) {
        let remaining = ticks;
        while (remaining > 0) {
            const e = Math.min(16, remaining);
            tokens.push(`NUL 00${(e - 1).toString(16).toUpperCase()}`);
            remaining -= e;
        }
    }

    static SEMITONE_TO_NAME = [
        'C-', 'C#', 'D-', 'D#', 'E-', 'F-', 'F#', 'G-', 'G#', 'A-', 'A#', 'B-'
    ];

    static _midiToHead(midi) {
        const octave = Math.max(1, Math.min(7, Math.floor(midi / 12) - 1));
        const semi   = ((midi % 12) + 12) % 12;
        return `${this.SEMITONE_TO_NAME[semi]}${octave}`;
    }

    /** Map our SongIR drum tags (M1..M15) back to IMT instrument-slot numbers. */
    static _drumToInstr(drum) {
        if (typeof drum !== 'string') return 1;
        const m = drum.match(/^M(\d{1,2})$/);
        if (!m) return 1;
        return Math.max(1, Math.min(15, parseInt(m[1], 10)));
    }

    static _loopInfoToSequenceLine(song) {
        const hasJump = !!song.controls?.find(c => c.type === 'JUMP');
        if (hasJump) {
            // Single pattern, loop back one step
            return `        DECLE   0, -1`;
        }
        return `        DECLE   0`;
    }

    static defaultSong() {
        return {
            engine:       this.formatSlug,
            label:        'untitled_imt',
            ticksPerNote: 6,
            channelCount: 6,
            notes:        [],
            controls:     [],
            metadata:     {},
        };
    }
}
