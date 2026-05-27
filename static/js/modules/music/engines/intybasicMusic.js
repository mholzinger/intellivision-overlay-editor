/**
 * IntyBASIC native MUSIC format engine.
 *
 * Phase 0: stub that returns an empty song. Full parser arrives in Phase 1.
 *
 * Reference: ~/intybasic/manual.txt lines 1180-1290.
 *
 * Example native syntax:
 *   label:  DATA 8
 *           MUSIC C4, E4, G4, M1
 *           MUSIC S,  S,  S,  -
 *           MUSIC -,  -,  -,  M3
 *           MUSIC REPEAT
 */
import { MusicEngine } from './engineBase.js';

export class IntyBasicMusic extends MusicEngine {
    static formatName    = 'IntyBASIC MUSIC';
    static formatSlug    = 'intybasic';
    static channelCount  = 3;       // base PSG melody channels
    static supportsDrums = true;

    static documentation = [
        'Native IntyBASIC music: 3 melody channels (square waves) + 1 drum channel.',
        'Each MUSIC statement is one tempo step.',
        'Notes: C/D/E/F/G/A/B + octave 2-6 (or C7), optional # for sharp, optional W/X/Y/Z for instrument.',
        'Special tokens: S = sustain previous note, - = silence.',
        'Drums (4th argument): M1 strong, M2 tap, M3 roll, - none.',
        'Tempo: DATA <n> sets ticks-per-note (50 Hz NTSC, 60 Hz PAL).',
    ].join('\n');

    /** Phase 0 stub — replaced by full parser in Phase 1. */
    static parse(text) {
        // TODO Phase 1: tokenize labels, DATA, MUSIC lines; build SongIR.
        return this.defaultSong();
    }

    /** Phase 0 stub — replaced in Phase 4. */
    static serialize(song) {
        // TODO Phase 4: emit DATA + MUSIC lines from SongIR.
        const label = song.label || 'song';
        return `${label}:\n  DATA ${song.ticksPerNote}\n  ' (serializer not yet implemented)\n  MUSIC STOP\n`;
    }

    /** Phase 0 stub — replaced in Phase 2 when Web Audio synth lands. */
    static toPlaybackEvents(song) {
        // TODO Phase 2: flatten notes + control flow into a timeline.
        return [];
    }
}
