/**
 * PsgSynth — Web Audio AY-3-8914 emulation for the Music Studio.
 *
 * Phase 2 scope: approximate (not bit-perfect) playback of any SongIR.
 * Phase 7 will add a "Bit-Perfect" toggle that routes through WASM jzIntv
 * for real chip emulation; this synth stays as the instant-feedback option.
 *
 * What it does:
 *   - 3 melody channels — square wave + per-instrument ADSR envelope
 *   - 1 drum channel — filtered noise bursts (M1/M2/M3)
 *   - Per-instrument optional vibrato (Y/flute) and pitch detune (Z/bass octave drop)
 *   - Schedules events ahead of time using AudioContext currentTime for sample-accurate timing
 *   - onPlayheadTick callback so the UI can animate a playhead during playback
 *
 * Timing model:
 *   IntyBASIC's MUSIC player ticks at a FIXED 50 Hz regardless of whether
 *   the host Intellivision is NTSC (60 fps video) or PAL (50 fps video) —
 *   the manual is explicit: "there are 50 ticks per second" (manual.txt
 *   line 1228). On NTSC the engine skips every 6th frame to maintain that
 *   50 Hz cadence. We match it so playback timing here matches what users
 *   hear on real hardware / in jzIntv.
 *   So one tick = 1/50 = 0.02 seconds.
 */

import { INSTRUMENTS, DRUMS, midiToFreq, buildNoiseBuffer } from './instrumentVoices.js';

export class PsgSynth {
    static ctx           = null;       // AudioContext (created lazily on first play)
    static masterGain    = null;
    static noiseBuffer   = null;
    static activeNodes   = [];          // [{ stop(), }, ...] for cleanup on stop()
    static framerate     = 50;          // IntyBASIC MUSIC ticks 50/sec on both NTSC and PAL
    static onPlayheadTick = null;       // callback(currentTick) — UI playhead
    static _rafId        = null;
    static _startedAt    = 0;           // AudioContext time when playback began
    static _stopRequested = false;
    static _endsAt       = 0;           // AudioContext time when playback finishes

    /** Lazily set up the AudioContext. Browser policy requires this happen
     *  inside a user gesture handler (we call from the Play button click). */
    static _ensureContext() {
        if (this.ctx) {
            // Resume if browser suspended after a tab change
            if (this.ctx.state === 'suspended') this.ctx.resume();
            return;
        }
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.55;
        this.masterGain.connect(this.ctx.destination);
        this.noiseBuffer = buildNoiseBuffer(this.ctx);
    }

    /**
     * Play a SongIR through the synth.
     * @param {PlaybackEvent[]} events  - flat list of timed events
     * @param {number} totalTicks       - song length in ticks (for end-of-song detection)
     * @param {function(number):void} onTick - playhead callback
     */
    static play(events, totalTicks, onTick) {
        this._ensureContext();
        // Detach the previous session's callback BEFORE the teardown stop().
        // Otherwise stop()'s onPlayheadTick(null) call would fire the OLD
        // callback (which signals "playback ended" → reverts the piano-roll
        // back to static scroll mode), undoing the follow-mode setup the
        // caller just did. Only the new session should produce notifications.
        this.onPlayheadTick = null;
        this.stop();
        this._stopRequested = false;
        this.onPlayheadTick = onTick;

        const startTime = this.ctx.currentTime + 0.05;   // tiny buffer for scheduling
        this._startedAt = startTime;
        const tickSec = 1 / this.framerate;

        // Schedule every event ahead of time.
        for (const ev of events) {
            const evTime = startTime + ev.timeSec;
            if (ev.type === 'note') {
                this._scheduleNote(ev, evTime, tickSec);
            } else if (ev.type === 'drum') {
                this._scheduleDrum(ev, evTime);
            }
        }

        this._endsAt = startTime + (totalTicks * tickSec);

        // Start playhead animation
        this._tick(totalTicks);
    }

    /** Stop all currently-scheduled and currently-sounding voices. */
    static stop() {
        this._stopRequested = true;
        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        for (const n of this.activeNodes) {
            try { n.stop(this.ctx?.currentTime ?? 0); } catch (_) { /* already stopped */ }
        }
        this.activeNodes = [];
        if (this.onPlayheadTick) this.onPlayheadTick(null);  // hide playhead
    }

    static isPlaying() {
        return this._rafId !== null;
    }

    /** Set master volume (0-1). Safe to call before context exists. */
    static setVolume(level) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, level));
        }
    }

    // ── Internals ───────────────────────────────────────────────────────────

    /** Schedule one melody note at the given AudioContext time. */
    static _scheduleNote(ev, startTime, tickSec) {
        const inst = INSTRUMENTS[ev.instrument] || INSTRUMENTS.W;
        const baseMidi = ev.pitch + inst.detuneSemis;
        const freq = midiToFreq(baseMidi);
        const noteDuration = ev.durationTicks * tickSec;

        const osc = this.ctx.createOscillator();
        osc.type = inst.type;
        osc.frequency.value = freq;

        // Optional vibrato (small pitch modulation via a sub-audio sine LFO)
        if (inst.vibrato) {
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            lfo.frequency.value = inst.vibrato.rateHz;
            // depthCents → frequency Hz: depth = freq * (2^(cents/1200) - 1)
            const depthHz = freq * (Math.pow(2, inst.vibrato.depthCents / 1200) - 1);
            lfoGain.gain.value = depthHz;
            lfo.connect(lfoGain).connect(osc.frequency);
            lfo.start(startTime);
            lfo.stop(startTime + noteDuration + inst.release + 0.05);
            this.activeNodes.push(lfo);
        }

        // ADSR envelope via GainNode. MUSIC VOLUME (0-15) scales the peak.
        const env = this.ctx.createGain();
        const volScale = (ev.volume == null) ? 1 : ev.volume;
        const peak = inst.gain * volScale;
        const sustainLevel = peak * inst.sustain;
        const releaseStart = startTime + noteDuration;
        env.gain.setValueAtTime(0, startTime);
        env.gain.linearRampToValueAtTime(peak,         startTime + inst.attack);
        env.gain.linearRampToValueAtTime(sustainLevel, startTime + inst.attack + inst.decay);
        env.gain.setValueAtTime(sustainLevel,          releaseStart);
        env.gain.linearRampToValueAtTime(0,            releaseStart + inst.release);

        osc.connect(env).connect(this.masterGain);
        osc.start(startTime);
        osc.stop(releaseStart + inst.release + 0.02);
        this.activeNodes.push(osc);
    }

    /** Schedule one drum hit at the given AudioContext time. */
    static _scheduleDrum(ev, startTime) {
        const drum = DRUMS[ev.drumType];
        if (!drum) return;

        for (let r = 0; r < drum.repeats; r++) {
            const hitTime = startTime + (r * drum.duration / drum.repeats);

            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            // Randomize start offset into the noise buffer for variety
            const offset = Math.random() * 0.9 * this.noiseBuffer.duration;
            noise.loopStart = offset;
            noise.loopEnd = offset + drum.duration;

            const filter = this.ctx.createBiquadFilter();
            filter.type = drum.filterType;
            filter.frequency.value = drum.filterHz;
            filter.Q.value = drum.filterQ;

            const env = this.ctx.createGain();
            const volScale = (ev.volume == null) ? 1 : ev.volume;
            env.gain.setValueAtTime(drum.gain * volScale, hitTime);
            env.gain.exponentialRampToValueAtTime(0.001, hitTime + drum.decay);

            noise.connect(filter).connect(env).connect(this.masterGain);
            noise.start(hitTime, offset);
            noise.stop(hitTime + drum.decay + 0.02);
            this.activeNodes.push(noise);
        }
    }

    /**
     * Render the given playback events to an offline AudioBuffer (mono, 44.1 kHz).
     * Uses the same _scheduleNote / _scheduleDrum scheduling as live playback,
     * so the WAV matches what you hear in the preview. Swap pattern: we
     * temporarily redirect ctx/masterGain/noiseBuffer to an OfflineAudioContext,
     * run the scheduler, then restore. Returns the rendered AudioBuffer.
     */
    static async renderToBuffer(events, totalTicks) {
        const sampleRate = 44100;
        const tickSec = 1 / this.framerate;
        const totalDur = (totalTicks * tickSec) + 0.5;  // pad for tails / releases

        const offlineCtx = new OfflineAudioContext(
            1,                                          // mono
            Math.max(1, Math.ceil(totalDur * sampleRate)),
            sampleRate
        );
        const offlineGain = offlineCtx.createGain();
        offlineGain.gain.value = 0.55;                   // matches live default
        offlineGain.connect(offlineCtx.destination);
        const offlineNoise = buildNoiseBuffer(offlineCtx);

        const realCtx   = this.ctx;
        const realGain  = this.masterGain;
        const realNoise = this.noiseBuffer;
        const realNodes = this.activeNodes;

        this.ctx          = offlineCtx;
        this.masterGain   = offlineGain;
        this.noiseBuffer  = offlineNoise;
        this.activeNodes  = [];

        try {
            const startTime = 0.05;
            for (const ev of events) {
                const evTime = startTime + ev.timeSec;
                if (ev.type === 'note') {
                    this._scheduleNote(ev, evTime, tickSec);
                } else if (ev.type === 'drum') {
                    this._scheduleDrum(ev, evTime);
                }
            }
            return await offlineCtx.startRendering();
        } finally {
            this.ctx          = realCtx;
            this.masterGain   = realGain;
            this.noiseBuffer  = realNoise;
            this.activeNodes  = realNodes;
        }
    }

    /** Animation loop — calls onPlayheadTick with the current tick position. */
    static _tick(totalTicks) {
        const step = () => {
            if (this._stopRequested) return;
            const t = this.ctx.currentTime - this._startedAt;
            const currentTick = Math.max(0, t * this.framerate);

            if (this.onPlayheadTick) this.onPlayheadTick(currentTick);

            // End of song?
            if (this.ctx.currentTime >= this._endsAt) {
                this.stop();
                return;
            }
            this._rafId = requestAnimationFrame(step);
        };
        this._rafId = requestAnimationFrame(step);
    }
}
