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
        'Notes: C/D/E/F/G/A/B + octave 2-6 (or C7), optional # for sharp, optional W/X/Y/Z for instrument.',
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

        // Find the first music block: a label immediately followed (after any blank/comment)
        // by a DATA statement. That label becomes the song's identifier.
        const blockStart = this._findFirstMusicBlock(lines);
        if (blockStart === -1) {
            throw new Error('No music block found. Expected a label followed by DATA <n> then MUSIC statements.');
        }

        const labelMatch = lines[blockStart].text.match(LABEL_RE);
        const songLabel = labelMatch[1];

        // Walk lines from blockStart, building the SongIR. Stop when we hit
        // something that isn't recognizably part of a music block (e.g. a new
        // unrelated procedure or BASIC statement).
        const song = {
            engine:       this.formatSlug,
            label:        songLabel,
            ticksPerNote: 8,
            channelCount: 3,
            notes:        [],
            controls:     [],
            metadata: {
                labels: {},    // labelName → tick position (for JUMP/GOSUB targets)
                source: text,  // round-trip safety net for Phase 1
            },
        };

        let currentTick = 0;
        // Per-channel state: most recently added note (so 'S' can extend it) and
        // the remembered instrument letter.
        const channelState = [
            { lastNote: null, instrument: 'W' },
            { lastNote: null, instrument: 'W' },
            { lastNote: null, instrument: 'W' },
        ];

        for (let i = blockStart; i < lines.length; i++) {
            const { text: line } = lines[i];

            // Label inside the block → record for JUMP/GOSUB resolution
            const labelM = line.match(LABEL_RE);
            if (labelM) {
                song.metadata.labels[labelM[1]] = currentTick;
                continue;
            }

            // DATA line → tempo change at this tick
            const dataM = line.match(DATA_RE);
            if (dataM) {
                song.ticksPerNote = parseInt(dataM[1], 10);
                continue;
            }

            // Control command (REPEAT / STOP / JUMP / GOSUB / RETURN / SPEED / VOLUME)
            const ctrlM = line.match(CONTROL_RE);
            if (ctrlM) {
                const cmd = ctrlM[1].toUpperCase();
                const arg = ctrlM[2].trim();
                song.controls.push({
                    tick:   currentTick,
                    type:   cmd,
                    target: arg || undefined,
                });
                if (cmd === 'SPEED') {
                    const n = parseInt(arg, 10);
                    if (!isNaN(n)) song.ticksPerNote = n;
                }
                if (cmd === 'STOP' || cmd === 'REPEAT' || cmd === 'JUMP') {
                    // After STOP/REPEAT/JUMP the linear walk ends — nothing past
                    // this point will play in sequence with what came before.
                    // For visualization we stop processing further MUSIC lines.
                    break;
                }
                continue;
            }

            // MUSIC data line
            const musicM = line.match(MUSIC_DATA_RE);
            if (musicM) {
                const args = musicM[1].split(',').map(s => s.trim());
                // 4 args = base PSG (3 melody + drum). 8 args = ECS variant.
                // For Phase 1 we handle the first 4 (we'll widen in Phase 5).
                if (args.length !== 4 && args.length !== 8) {
                    // Bad MUSIC line — skip silently. Real IntyBASIC would error;
                    // we'd rather show what we can than refuse to import.
                    continue;
                }

                // First 3 args = melody channels
                for (let ch = 0; ch < 3; ch++) {
                    this._processChannelToken(args[ch], ch, song, channelState, currentTick);
                }
                // 4th arg = drum channel
                this._processDrumToken(args[3], song, currentTick);

                currentTick += song.ticksPerNote;
                continue;
            }

            // Anything else: we've left the music block. Stop.
            break;
        }

        return song;
    }

    /** Process one melody channel token into a note (or sustain / silence). */
    static _processChannelToken(token, channel, song, channelState, currentTick) {
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
            drum:          null,
        };
        song.notes.push(note);
        state.lastNote = note;
    }

    /** Process the drum (4th) channel token into a one-shot drum hit. */
    static _processDrumToken(token, song, currentTick) {
        if (token === '-') return;
        const m = token.match(DRUM_RE);
        if (!m) return;
        song.notes.push({
            startTick:     currentTick,
            durationTicks: song.ticksPerNote,   // visual width only
            channel:       3,                    // drum lane index
            pitch:         null,
            instrument:    null,
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

    /** Phase 4 stub. */
    static serialize(song) {
        const label = song.label || 'song';
        return `${label}:\n  DATA ${song.ticksPerNote}\n  ' (serializer not yet implemented)\n  MUSIC STOP\n`;
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
    static toPlaybackEvents(song, framerate = 50, loopCount = 4) {
        const events = [];
        const tickSec = 1 / framerate;
        const loop = this.getLoopInfo(song);

        const noteToEvent = (note, startTick) => {
            const timeSec = startTick * tickSec;
            if (note.drum) {
                return {
                    timeSec,
                    type:     'drum',
                    channel:  note.channel,
                    drumType: note.drum,
                };
            } else if (note.pitch !== null && note.pitch !== undefined) {
                return {
                    timeSec,
                    type:           'note',
                    channel:        note.channel,
                    pitch:          note.pitch,
                    durationTicks:  note.durationTicks,
                    instrument:     note.instrument || 'W',
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
