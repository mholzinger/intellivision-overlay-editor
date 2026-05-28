/**
 * Instrument voices for the Web Audio AY-3-8914 emulator.
 *
 * The real AY-3-8914 produces 50%-duty-cycle square waves with separate
 * tone, noise, and envelope generators. IntyBASIC's W/X/Y/Z "instruments"
 * are just different envelope shapes laid over the same square wave — they
 * don't change the waveform itself.
 *
 * We approximate that here:
 *   - All melody voices = square wave
 *   - Per-instrument envelope (attack, decay, sustain level, release)
 *   - Per-instrument optional second-harmonic mix for richer timbre
 *   - Per-instrument optional vibrato (slight pitch modulation)
 *
 * Drum samples (M1/M2/M3) are filtered noise envelopes — also matches the
 * way IntyBASIC's player produces drums by gating the AY noise channel.
 */

/**
 * Per-instrument envelope + voicing params.
 *
 * attack:    time (seconds) from silence to peak
 * decay:     time from peak to sustain level
 * sustain:   gain level during the held portion (0-1)
 * release:   time from sustain to silence after note ends
 * gain:      master gain for this instrument (balances volume across voices)
 * type:      OscillatorNode waveform
 * vibrato:   { rateHz, depthCents } or null
 * detuneSemis: integer pitch offset (e.g. Z bass drops an octave)
 */
export const INSTRUMENTS = {
    // W = piano: sharp attack, moderate decay — still audible when sustained
    W: {
        attack: 0.004, decay: 0.10, sustain: 0.50, release: 0.12,
        gain: 0.18, type: 'square', vibrato: null, detuneSemis: 0,
    },
    // X = clarinet: medium attack, strong sustain — woody held note
    X: {
        attack: 0.012, decay: 0.05, sustain: 0.85, release: 0.08,
        gain: 0.15, type: 'square', vibrato: null, detuneSemis: 0,
    },
    // Y = flute: soft attack, sustained, gentle vibrato — airy melodic
    Y: {
        attack: 0.025, decay: 0.04, sustain: 0.80, release: 0.10,
        gain: 0.14, type: 'square',
        vibrato: { rateHz: 5.2, depthCents: 8 },
        detuneSemis: 0,
    },
    // Z = bass: medium attack, sustained, dropped an octave for thump
    Z: {
        attack: 0.008, decay: 0.06, sustain: 0.90, release: 0.10,
        gain: 0.22, type: 'square', vibrato: null, detuneSemis: -12,
    },
};

/**
 * Drum voice definitions. Each is a short noise burst shaped by a band-pass /
 * low-pass filter and an envelope. Synthesized live from a shared white-noise
 * AudioBuffer.
 *
 * gain:        peak amplitude
 * duration:    full envelope length (seconds)
 * filterType:  'lowpass' | 'highpass' | 'bandpass'
 * filterHz:    cutoff/center frequency
 * filterQ:     filter resonance
 * decay:       exponential decay rate (smaller = snappier)
 * repeats:     for rolls (M3) — how many envelope re-triggers across the duration
 */
export const DRUMS = {
    // M1 = strong: low thudding kick — lowpass with steep decay
    M1: {
        gain: 0.55, duration: 0.16,
        filterType: 'lowpass', filterHz: 220, filterQ: 0.7,
        decay: 0.10, repeats: 1,
    },
    // M2 = tap: short snap — highpass click (snare-ish in busy patterns)
    M2: {
        gain: 0.40, duration: 0.06,
        filterType: 'highpass', filterHz: 1500, filterQ: 0.5,
        decay: 0.035, repeats: 1,
    },
    // M3 = roll: single shimmering noise burst (typically hi-hat). Was
    // previously firing 4 sub-hits per MUSIC line which made hat-heavy
    // patterns sound 4× too fast. The "roll" character comes from the
    // bandpass-filtered noise's natural shimmer, not from re-triggering.
    M3: {
        gain: 0.38, duration: 0.10,
        filterType: 'bandpass', filterHz: 4500, filterQ: 0.9,
        decay: 0.06, repeats: 1,
    },
};

/** Convert a MIDI note number to frequency in Hz. */
export function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Build a shared 1-second white-noise AudioBuffer for drum sources. */
export function buildNoiseBuffer(ctx) {
    const sampleRate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}
