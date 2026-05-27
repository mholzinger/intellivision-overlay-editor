/**
 * MusicEngine — abstract base for all Intellivision music format engines.
 *
 * The Music Studio supports multiple platform sound engines: IntyBASIC native
 * MUSIC, ECS 8-channel, JLP/zmus, raw PSG register writes. Each one parses its
 * native text/bytecode INTO a common SongIR (Song Intermediate Representation)
 * and serializes back OUT. The piano-roll editor and Web Audio playback work
 * purely on SongIR — they don't know which format produced the song.
 *
 * Concrete engines extend this class and provide the four core methods plus
 * the static metadata.
 */
export class MusicEngine {
    /** Human-readable name shown in the engine selector dropdown. */
    static formatName = 'Abstract';

    /** Short slug used internally and in saved-project metadata. */
    static formatSlug = 'abstract';

    /** Number of audio channels this format supports (3 = base PSG, 8 = ECS). */
    static channelCount = 0;

    /** Whether the format has a dedicated drum/noise channel. */
    static supportsDrums = false;

    /** Multi-line description shown in the in-tab Music Primer. */
    static documentation = '';

    /**
     * Parse engine-native text into a SongIR.
     * @param {string} text - raw input (BASIC source, assembly, hex dump…)
     * @returns {SongIR}
     * @throws {Error} on unrecoverable parse failure
     */
    static parse(text) {
        throw new Error(`${this.formatName}: parse() not implemented`);
    }

    /**
     * Serialize a SongIR back into engine-native text.
     * @param {SongIR} song
     * @returns {string}
     */
    static serialize(song) {
        throw new Error(`${this.formatName}: serialize() not implemented`);
    }

    /**
     * Convert SongIR into a flat list of timed events for the playback synth.
     * Resolves control flow (REPEAT, JUMP, GOSUB) into a single linear timeline.
     * @param {SongIR} song
     * @returns {PlaybackEvent[]}
     */
    static toPlaybackEvents(song) {
        throw new Error(`${this.formatName}: toPlaybackEvents() not implemented`);
    }

    /**
     * Return an empty/blank song in this engine's native shape.
     * Used when the user clicks "New Song" with this engine selected.
     * @returns {SongIR}
     */
    static defaultSong() {
        return {
            engine:        this.formatSlug,
            label:         'untitled',
            ticksPerNote:  8,                   // 50 Hz / 8 ≈ 6.25 notes/sec
            channelCount:  this.channelCount,
            notes:         [],                  // see SongIR shape below
            controls:      [],                  // JUMP / REPEAT / GOSUB markers
            metadata:      {},
        };
    }
}

/**
 * @typedef {Object} SongIR
 * @property {string} engine          Engine slug that produced this IR
 * @property {string} label           Song label (used as IntyBASIC routine name)
 * @property {number} ticksPerNote    Initial tempo (frames per note step)
 * @property {number} channelCount    Channels in use (3 / 4 / 8)
 * @property {Note[]} notes           All notes in the song
 * @property {Control[]} controls     Structural markers (loops, jumps)
 * @property {Object} metadata        Engine-specific extras
 *
 * @typedef {Object} Note
 * @property {number} startTick       Tick position where the note begins
 * @property {number} durationTicks   Number of ticks the note sounds (sustain)
 * @property {number} channel         0-based channel index (0..channelCount-1)
 * @property {number|null} pitch      MIDI note number (60 = C4), null = drum
 * @property {string} instrument      'W' / 'X' / 'Y' / 'Z' (IntyBASIC) or engine-specific
 * @property {string|null} drum       'M1' / 'M2' / 'M3' (drum channel only) or null
 *
 * @typedef {Object} Control
 * @property {number} tick            Where in the song this control fires
 * @property {string} type            'REPEAT' / 'STOP' / 'JUMP' / 'GOSUB' / 'RETURN' / 'SPEED' / 'VOLUME'
 * @property {string|number} [target] Label name (JUMP/GOSUB) or value (SPEED/VOLUME)
 *
 * @typedef {Object} PlaybackEvent
 * @property {number} timeSec         Absolute time in seconds from playback start
 * @property {number} channel         Channel index
 * @property {string} type            'noteOn' / 'noteOff' / 'drumHit'
 * @property {number} [frequency]     Hz (noteOn only)
 * @property {string} [drumType]      M1/M2/M3 (drumHit only)
 * @property {string} [instrument]    Voice waveform selector
 */
