// Chevallier Tracker — Arnauld Chevallier's assembly music driver used by
// Joe Zbiciak's Space Patrol (and other homebrew Intellivision titles).
//
// Source format is as1600 assembly with NOTES("NnO IVL", ...) macro calls
// inside per-channel pattern labels, plus a song header that lists pattern
// order. See macro/tracker.mac in intv-game-builder for the canonical
// definitions, and games/spacepatrol/snd/music.asm for the example songs.
//
// Note string format ("NnO IVL"):
//   N = note letter      (C/D/E/F/G/A/B)
//   n = accidental       (- or #)
//   O = octave           (1..7)
//   I = instrument hex   (0 = unchanged, 1..F = instrument 0..14)
//   V = volume hex       (0..F)
//   L = length hex       (0..F → 1..16 ticks)
// Special tokens: "NUL IVL" extends the current note for L+1 ticks;
//                 "OFF IVL" is ECS tick-disable;
//                 ""        emits nothing (NOTES() padding only).
//
// Song-header DECLE:  speed, flags (M_3CH | M_TICK | ...), <patterns label>
// Order list:         DECLE per pattern index, then $8000 (stop) or a
//                     negative offset (loop back N order entries).
// Patterns table:     DECLE length, ch_A_label, ch_B_label, ch_C_label  ×N
//
// This Phase-1 engine implements:
//   • parse() — first PROC block becomes the active song
//   • toPlaybackEvents() — flatten patterns × order into linear time
//   • getTotalTicks / getLoopInfo / getPlaybackTicks / tempoAt
//   • estimateRomBytes — rough size for the status line
//   • defaultSong — empty 3-channel template
//
// Phase-2 work, deferred until round-trip is needed:
//   • serialize back to .asm
//   • Per-instrument envelope playback (synth currently uses W for all)
//   • M_DUP harmonic-shift mode
//   • Per-note volume baked into events (Web Audio synth honours it via
//     the same `volume` field we already use for IntyBASIC)

import { MusicEngine } from './engineBase.js';

const SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Single-line regex for the macro calls. Captures the four args (any may be "").
// Allows an optional "LABEL:" prefix because Chevallier songs put the first
// NOTES() call on the same line as the channel's pattern label.
const NOTES_RE = /^\s*(?:[A-Za-z_@][A-Za-z0-9_@]*:)?\s*NOTES\(\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*\)/i;
// PROC / ENDP block delimiters
const PROC_START_RE = /^([A-Z_][A-Z0-9_]*)\s+PROC\b/i;
const PROC_END_RE   = /^\s*ENDP\b/i;
// Labels (global "FOO:" and local "@@FOO:") at start of line
const LABEL_RE = /^(@@[A-Za-z0-9_]+|[A-Za-z_][A-Za-z0-9_]*):/;
// DECLE / DECLE chain
const DECLE_RE = /^\s*DECLE\s+(.*)/i;

export class ChevallierTracker extends MusicEngine {
    static formatName    = "Chevallier Tracker (Space Patrol)";
    static formatSlug    = 'chevallier-tracker';
    static channelCount  = 3;
    static supportsDrums = false;   // percussion is a noise instrument on one of the 3 voices

    // Hidden from the engine selector dropdown to avoid a redundant choice
    // alongside IMT (which is the same lineage, DZ-Jay's evolution of this
    // tracker). This engine remains in the registry so the auto-detect path
    // can still parse the original 3-channel Space-Patrol-style songs that
    // pre-date the IMT header changes. New compositions go through IMT.
    static hideFromDropdown = true;

    /**
     * Parse a Tracker .asm source. We look for the first PROC block and treat
     * it as the song. Unrecognised PROCs are skipped. Outside of PROCs we
     * also accept loose labels (some authors put the ENV table outside).
     */
    static parse(text) {
        const lines = text.replace(/\r/g, '').split('\n');
        const proc = this._findFirstSongProc(lines);
        if (!proc) {
            throw new Error('No Tracker song PROC found. Expected "NAME PROC ... ENDP" with a header DECLE and pattern data.');
        }
        const { name, body } = proc;

        // Build label → line-index lookup inside the PROC body
        const labelLine = {};
        for (let i = 0; i < body.length; i++) {
            const m = body[i].match(LABEL_RE);
            if (m && labelLine[m[1]] == null) labelLine[m[1]] = i;
        }

        // The first DECLE line in the body is the song header:
        //   DECLE   <speed>, <flags>, <patterns-label>
        const headerIdx = body.findIndex(l => DECLE_RE.test(l));
        if (headerIdx < 0) throw new Error(`PROC ${name} has no DECLE header.`);
        const headerVals = this._splitDecle(body[headerIdx]);
        const speed = this._evalNumber(headerVals[0]);
        // Note: flag value not consumed yet (M_3CH / M_TICK reserved for phase 2)
        const patternsLabel = headerVals[2];

        // Subsequent DECLE lines = order list until $8000 / negative terminator.
        // The order list always lives between the header and the patterns label.
        const orderTerm = (v) => v >= 0x8000;
        const orderList = [];
        let orderEndIdx = headerIdx + 1;
        for (let i = headerIdx + 1; i < body.length; i++) {
            const line = body[i];
            if (line.match(LABEL_RE)) break;             // labels end the order list
            const m = line.match(DECLE_RE);
            if (!m) continue;
            for (const tok of this._splitDecle(line)) {
                const v = this._evalNumber(tok);
                if (orderTerm(v)) {
                    // $8000 = stop. Anything else with bit 15 set we treat the
                    // same — Phase 2 may want to decode signed loops here.
                    orderList.push({ kind: 'STOP' });
                    orderEndIdx = i + 1;
                    break;
                } else if ((v & 0x8000) !== 0 || v >= 0x8000) {
                    // (already handled above)
                } else if (v >= 0xFFF0) {
                    // Signed-negative loop offset (e.g. -12 → JUMP back N orders)
                    const back = 0x10000 - v;
                    orderList.push({ kind: 'JUMP', back });
                    orderEndIdx = i + 1;
                    break;
                } else {
                    orderList.push({ kind: 'PATTERN', index: v });
                }
            }
            if (orderList.length && orderList[orderList.length - 1].kind !== 'PATTERN') break;
            orderEndIdx = i + 1;
        }

        // The patterns table lives at @@patterns label (or whatever the header pointed at).
        const patternsIdx = labelLine[patternsLabel] ?? body.findIndex((l, i) =>
            i >= orderEndIdx && LABEL_RE.test(l)
        );
        if (patternsIdx < 0) throw new Error(`PROC ${name}: cannot find ${patternsLabel} label.`);

        // Read pattern descriptors: DECLE length, ch_A, ch_B, ch_C
        const patterns = [];
        for (let i = patternsIdx + 1; i < body.length; i++) {
            const line = body[i];
            if (LABEL_RE.test(line)) break;              // first labeled note block ends the table
            const m = line.match(DECLE_RE);
            if (!m) continue;
            const toks = this._splitDecle(line);
            if (toks.length < 4) continue;
            const ticks = this._evalNumber(toks[0]);
            patterns.push({ ticks, chLabels: [toks[1], toks[2], toks[3]] });
        }

        // Decode each per-channel pattern stream into a flat note list (rebased to tick 0).
        // The Tracker advances all 3 channels in lockstep within a pattern; each note's
        // tick consumption is its own L+1 length. We re-emit notes with absolute startTick.
        const patternNotes = patterns.map(p => p.chLabels.map(lbl => {
            const startIdx = labelLine[lbl];
            if (startIdx == null) return [];
            return this._decodePatternChannel(body, startIdx);
        }));

        // Build SongIR notes by walking the order list and stacking patterns.
        const song = this.defaultSong();
        song.label = name;
        song.ticksPerNote = Math.max(1, speed);     // header speed used as snap grid
        song.metadata.trackerSpeed = speed;
        song.metadata.trackerFlags = this._evalNumber(headerVals[1] || '0');

        let currentTick = 0;
        let loopBodyStart = null;
        for (const entry of orderList) {
            if (entry.kind === 'PATTERN') {
                const idx = entry.index;
                const pat = patterns[idx];
                if (!pat) continue;
                const notes = patternNotes[idx];
                for (let ch = 0; ch < 3; ch++) {
                    for (const n of (notes[ch] || [])) {
                        // Re-issue the per-channel note at the pattern's absolute tick
                        song.notes.push({
                            startTick:     currentTick + n.offsetTick,
                            durationTicks: n.lengthTicks,
                            channel:       ch,
                            pitch:         n.pitch,
                            instrument:    'W',           // phase 2 will honour the Tracker instr
                            volume:        n.volume,
                            drum:          null,
                        });
                    }
                }
                currentTick += pat.ticks;
            } else if (entry.kind === 'JUMP') {
                // Compute the tick that's `back` patterns ago in the order list.
                // Phase-1 approximation: scan order list to find the matching position.
                const allPatterns = orderList.filter(e => e.kind === 'PATTERN');
                const cursorIdx = allPatterns.length - entry.back;
                let loopStartTick = 0;
                for (let i = 0; i < Math.max(0, cursorIdx); i++) {
                    const p = patterns[allPatterns[i].index];
                    if (p) loopStartTick += p.ticks;
                }
                if (loopBodyStart == null) loopBodyStart = loopStartTick;
                song.controls.push({ tick: currentTick, type: 'JUMP', target: 'loop' });
            } else if (entry.kind === 'STOP') {
                song.controls.push({ tick: currentTick, type: 'STOP' });
            }
        }
        if (loopBodyStart != null) {
            // Synthesize a label at the loop entry so getLoopInfo can find it
            song.metadata.labels = song.metadata.labels || {};
            song.metadata.labels[`${name}_loop`] = loopBodyStart;
            // Rewrite the JUMP target to point at the synthesized label
            for (const c of song.controls) {
                if (c.type === 'JUMP' && c.target === 'loop') c.target = `${name}_loop`;
            }
        }

        return song;
    }

    // ── PROC discovery ──────────────────────────────────────────────────────

    static _findFirstSongProc(lines) {
        for (let i = 0; i < lines.length; i++) {
            const m = lines[i].match(PROC_START_RE);
            if (!m) continue;
            // Heuristic: a "song" PROC has at least one NOTES() call inside its body.
            const startName = m[1];
            const bodyStart = i + 1;
            let bodyEnd = bodyStart;
            for (let j = bodyStart; j < lines.length; j++) {
                if (PROC_END_RE.test(lines[j])) { bodyEnd = j; break; }
            }
            const body = lines.slice(bodyStart, bodyEnd);
            if (body.some(l => NOTES_RE.test(l))) {
                return { name: startName, body };
            }
            i = bodyEnd;
        }
        return null;
    }

    // ── Per-channel pattern decoding ────────────────────────────────────────

    /**
     * Walk one channel's pattern stream starting at lineIdx. Returns an array
     * of { offsetTick, lengthTicks, pitch (MIDI), volume (0-15) }. Each note's
     * offsetTick is relative to the pattern start.
     */
    static _decodePatternChannel(body, startIdx) {
        const out = [];
        let offsetTick = 0;
        let lastPitch = null;

        for (let i = startIdx; i < body.length; i++) {
            const line = body[i];
            // Stop at the next label (next channel's pattern starts there)
            if (i > startIdx && LABEL_RE.test(line)) break;
            const m = line.match(NOTES_RE);
            if (!m) continue;
            for (let arg = 1; arg <= 4; arg++) {
                const token = m[arg];
                if (token === '') continue;
                const decoded = this._decodeNoteString(token);
                if (!decoded) continue;
                const lengthTicks = decoded.length + 1;
                if (decoded.kind === 'NOTE') {
                    out.push({
                        offsetTick,
                        lengthTicks,
                        pitch:  decoded.pitch,
                        volume: decoded.volume,
                    });
                    lastPitch = decoded.pitch;
                } else if (decoded.kind === 'NUL') {
                    // Sustain: extend the last emitted note on this channel
                    if (out.length > 0 && lastPitch != null) {
                        out[out.length - 1].lengthTicks += lengthTicks;
                    }
                } else if (decoded.kind === 'OFF') {
                    // Treat as silence — no further sustain
                    lastPitch = null;
                }
                offsetTick += lengthTicks;
            }
        }
        return out;
    }

    /**
     * Decode one "NnO IVL" / "NUL IVL" / "OFF IVL" string.
     * Returns { kind, pitch?, volume, length, instr } or null if malformed.
     */
    static _decodeNoteString(token) {
        if (token.length < 7) return null;
        const head = token.substring(0, 3);
        const space = token[3];
        if (space !== ' ') return null;
        const I = this._hexDigit(token[4]);
        const V = this._hexDigit(token[5]);
        const L = this._hexDigit(token[6]);
        if (I == null || V == null || L == null) return null;
        const volume = V;       // user-facing 0..15; Tracker stores 15-V on the wire
        const length = L;
        const instr  = I;

        if (head === 'NUL') return { kind: 'NUL', length, volume, instr };
        if (head === 'OFF') return { kind: 'OFF', length, volume, instr };

        const letter = head[0].toUpperCase();
        const sharp  = head[1] === '#';
        const minus  = head[1] === '-';
        if (!(sharp || minus)) return null;
        if (!(letter in SEMITONE)) return null;
        const octave = parseInt(head[2], 10);
        if (!(octave >= 1 && octave <= 7)) return null;
        // Standard musical convention: C4 = MIDI 60
        const midi = (octave + 1) * 12 + SEMITONE[letter] + (sharp ? 1 : 0);
        return { kind: 'NOTE', pitch: midi, length, volume, instr };
    }

    static _hexDigit(c) {
        if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
        if (c >= 'A' && c <= 'F') return c.charCodeAt(0) - 55;
        if (c >= 'a' && c <= 'f') return c.charCodeAt(0) - 87;
        return null;
    }

    // ── DECLE expression helpers ────────────────────────────────────────────

    static _splitDecle(line) {
        const m = line.match(DECLE_RE);
        if (!m) return [];
        // Strip trailing comments before splitting on commas
        const noComment = m[1].replace(/;.*$/, '').replace(/\/\/.*$/, '');
        return noComment.split(',').map(s => s.trim()).filter(Boolean);
    }

    /** Evaluate a tracker DECLE expression (hex / decimal / label / OR / AND). */
    static _evalNumber(expr) {
        if (expr == null) return 0;
        const e = expr.trim();
        if (e === '') return 0;
        // Hex literal: $ABCD or 0xABCD
        if (/^\$[0-9a-f]+$/i.test(e)) return parseInt(e.slice(1), 16);
        if (/^0x[0-9a-f]+$/i.test(e)) return parseInt(e.slice(2), 16);
        // Signed-negative wrap (e.g. "-12 AND $FFFF")
        const andMatch = e.match(/^(-?\d+)\s+AND\s+\$([0-9a-f]+)$/i);
        if (andMatch) return (parseInt(andMatch[1], 10) & parseInt(andMatch[2], 16)) & 0xFFFF;
        const orMatch  = e.match(/^([A-Z_0-9$]+)\s+OR\s+([A-Z_0-9$]+)$/i);
        if (orMatch) return this._evalNumber(orMatch[1]) | this._evalNumber(orMatch[2]);
        // Decimal literal
        if (/^-?\d+$/.test(e)) return parseInt(e, 10) & 0xFFFF;
        // Symbolic constant or label — we don't have a value, just return 0
        return 0;
    }

    // ── SongIR helpers shared with the editor ──────────────────────────────

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
        if (!song?.controls) return null;
        const jump = song.controls.find(c => c.type === 'JUMP');
        if (!jump) return null;
        const label = jump.target;
        const labelTick = song.metadata?.labels?.[label];
        if (labelTick == null) return null;
        const loopEnd = jump.tick;
        const loopDuration = loopEnd - labelTick;
        if (loopDuration <= 0) return null;
        return { introEnd: labelTick, loopEnd, loopDuration };
    }

    static getPlaybackTicks(song, loopCount = 4) {
        const loop = this.getLoopInfo(song);
        if (!loop) return this.getTotalTicks(song);
        return loop.introEnd + loopCount * loop.loopDuration;
    }

    static tempoAt(song, _tick) {
        return song?.ticksPerNote || 8;
    }

    /**
     * Estimate compiled ROM bytes. Each Tracker note = 1 DECLE (2 bytes), or
     * 2 DECLEs if it carries an instrument-change flag. Phase-1 lower bound:
     * 2 bytes per note. Pattern table = 4 DECLEs/pattern (8 bytes). Order list
     * = ~2 bytes/entry. Song header = 6 bytes.
     */
    static estimateRomBytes(song) {
        if (!song) return 0;
        const noteBytes    = (song.notes?.length || 0) * 2;
        const ctrlBytes    = (song.controls?.length || 0) * 2;
        const overheadBytes = 6 + 8 + (song.metadata?.trackerOrderCount || 6) * 2;
        return noteBytes + ctrlBytes + overheadBytes;
    }

    // ── Playback events ────────────────────────────────────────────────────

    static toPlaybackEvents(song, framerate = 50, loopCount = 4) {
        // Same shape as IntyBASIC: emit one 'note' event per pitched note,
        // shaped at the right time. Drums aren't a thing here.
        // We approximate the synth tick rate at the IntyBASIC framerate (50);
        // the Tracker actually runs at 60 Hz on hardware but the difference
        // is barely perceptible in the Web Audio preview.
        const events = [];
        const tickSec = 1 / framerate;
        const loop = this.getLoopInfo(song);

        const noteToEvent = (note, startTick) => {
            if (note.pitch == null) return null;
            const vol01 = (note.volume == null) ? 1 : Math.max(0, Math.min(15, note.volume)) / 15;
            return {
                timeSec:        startTick * tickSec,
                type:           'note',
                channel:        note.channel,
                pitch:          note.pitch,
                durationTicks:  note.durationTicks,
                instrument:     note.instrument || 'W',
                volume:         vol01,
            };
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

    // ── Serialize (Phase-2 placeholder) ────────────────────────────────────

    static serialize(_song) {
        return [
            '; Chevallier Tracker round-trip export is Phase 2.',
            '; The editor currently visualizes Tracker songs after import,',
            '; but cannot re-emit .asm yet — Phase 2 will add this.',
        ].join('\n');
    }

    static defaultSong() {
        return {
            engine:        this.formatSlug,
            label:         'untitled',
            ticksPerNote:  7,
            channelCount:  3,
            notes:         [],
            controls:      [],
            metadata:      {},
        };
    }
}
