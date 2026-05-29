/**
 * sfxEditor.js — Intellivision Sound Effects designer.
 *
 * Designs short PSG (AY-3-8914) sound effects with a preset library +
 * slider-driven designer, previews them via Web Audio, and emits
 * IntyBASIC SOUND statements that the user can paste into their game.
 *
 * Borrows the shared `buildNoiseBuffer` primitive from the music tab's
 * instrumentVoices.js so we don't duplicate noise-source plumbing.
 *
 * Output format: raw `SOUND register, value` writes interleaved with
 * `WAIT n` (1 tick ≈ 1/60s NTSC). Optionally appends a placeholder
 * EXEC call (e.g. CROWD) for composition — Steve Ettinger's "ball
 * just misses the hole, crowd groans" scenario.
 */

import { buildNoiseBuffer } from './music/playback/instrumentVoices.js';

// AY-3-8914 clock in the Intellivision (Hz). Tone freq = CLOCK / (16 * period).
const AY_CLOCK = 894886;

// IntyBASIC frame rate (assumed NTSC). 1 WAIT tick ≈ 16.67ms.
const FRAME_MS = 1000 / 60;

// PSG register numbers (raw AY-3-8914 layout used by IntyBASIC SOUND).
const REG = {
    TONE_A_LO: 0, TONE_A_HI: 1,
    TONE_B_LO: 2, TONE_B_HI: 3,
    TONE_C_LO: 4, TONE_C_HI: 5,
    NOISE:     6,
    MIXER:     7,
    VOL_A:     8, VOL_B: 9, VOL_C: 10,
    ENV_LO:   11, ENV_HI: 12, ENV_SHAPE: 13,
};

// Mixer bits: 0=enabled, 1=disabled. Bits 0-2 = tone A/B/C, bits 3-5 = noise A/B/C.
function mixerByte(channel, tone, noise) {
    let m = 0x3F;  // start with everything disabled
    if (tone)  m &= ~(1 << channel);
    if (noise) m &= ~(1 << (channel + 3));
    return m;
}

function hzToPeriod(hz) {
    if (hz <= 0) return 0;
    return Math.max(1, Math.min(4095, Math.round(AY_CLOCK / (16 * hz))));
}

const CH_NAMES = ['A', 'B', 'C'];

// ─── Preset library ──────────────────────────────────────────────────────────
// Patches are intentionally simple — { channel, durationMs, freqStart, freqEnd,
// sweepShape: 'linear'|'exp'|'step', noise: bool, noisePeriod, volume,
// steps: how many discrete steps for 'step' shape, appendExec: optional }.

const PRESETS = [
    // ── Arcade classics ────────────────────────────────────────────────────
    { id: 'coin',      name: 'Coin Pickup',     cat: 'Arcade',  icon: '🪙',
      patch: { channel: 0, durationMs: 130, freqStart: 988, freqEnd: 1318,
               sweepShape: 'step', steps: 3, noise: false, noisePeriod: 16, volume: 13 } },
    { id: 'laser',     name: 'Laser Shot',      cat: 'Arcade',  icon: '⚡',
      patch: { channel: 0, durationMs: 200, freqStart: 2200, freqEnd: 150,
               sweepShape: 'exp', steps: 8, noise: false, noisePeriod: 16, volume: 14 } },
    { id: 'explosion', name: 'Explosion',       cat: 'Arcade',  icon: '💥',
      patch: { channel: 2, durationMs: 600, freqStart: 110, freqEnd: 50,
               sweepShape: 'linear', steps: 12, noise: true, noisePeriod: 8, volume: 15 } },
    { id: 'powerup',   name: 'Power-Up',        cat: 'Arcade',  icon: '⬆️',
      patch: { channel: 0, durationMs: 400, freqStart: 220, freqEnd: 1760,
               sweepShape: 'step', steps: 6, noise: false, noisePeriod: 16, volume: 12 } },
    { id: 'hurt',      name: 'Hurt / Damage',   cat: 'Arcade',  icon: '⬇️',
      patch: { channel: 0, durationMs: 200, freqStart: 400, freqEnd: 100,
               sweepShape: 'linear', steps: 6, noise: true, noisePeriod: 4, volume: 13 } },
    { id: 'jump',      name: 'Jump',            cat: 'Arcade',  icon: '🦘',
      patch: { channel: 0, durationMs: 180, freqStart: 300, freqEnd: 900,
               sweepShape: 'exp', steps: 5, noise: false, noisePeriod: 16, volume: 11 } },
    { id: 'death',     name: 'Death / Game Over', cat: 'Arcade', icon: '💀',
      patch: { channel: 0, durationMs: 800, freqStart: 800, freqEnd: 80,
               sweepShape: 'linear', steps: 16, noise: true, noisePeriod: 12, volume: 14 } },

    // ── Percussion (borrowed from music tab's M1/M2/M3) ───────────────────
    { id: 'kick',      name: 'Kick (low thud)', cat: 'Percussion', icon: '🥁',
      patch: { channel: 2, durationMs: 160, freqStart: 0, freqEnd: 0,
               sweepShape: 'step', steps: 1, noise: true, noisePeriod: 18, volume: 14 } },
    { id: 'snap',      name: 'Snap (snare)',    cat: 'Percussion', icon: '👏',
      patch: { channel: 2, durationMs: 60, freqStart: 0, freqEnd: 0,
               sweepShape: 'step', steps: 1, noise: true, noisePeriod: 4, volume: 12 } },
    { id: 'hat',       name: 'Hi-Hat',          cat: 'Percussion', icon: '🎩',
      patch: { channel: 2, durationMs: 100, freqStart: 0, freqEnd: 0,
               sweepShape: 'step', steps: 1, noise: true, noisePeriod: 1, volume: 10 } },

    // ── UI ────────────────────────────────────────────────────────────────
    { id: 'beep',      name: 'Beep',            cat: 'UI',      icon: '🔔',
      patch: { channel: 0, durationMs: 60, freqStart: 880, freqEnd: 880,
               sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16, volume: 10 } },
    { id: 'confirm',   name: 'Confirm',         cat: 'UI',      icon: '✅',
      patch: { channel: 0, durationMs: 120, freqStart: 660, freqEnd: 990,
               sweepShape: 'step', steps: 2, noise: false, noisePeriod: 16, volume: 11 } },
    { id: 'error',     name: 'Error Buzz',      cat: 'UI',      icon: '⛔',
      patch: { channel: 0, durationMs: 250, freqStart: 150, freqEnd: 150,
               sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16, volume: 13 } },

    // ── Sports / specialty ────────────────────────────────────────────────
    { id: 'whoosh',    name: 'Whoosh',          cat: 'Sports',  icon: '💨',
      patch: { channel: 2, durationMs: 300, freqStart: 0, freqEnd: 0,
               sweepShape: 'linear', steps: 12, noise: true, noisePeriod: 22, volume: 11 } },
    { id: 'thud',      name: 'Thud',            cat: 'Sports',  icon: '👟',
      patch: { channel: 2, durationMs: 90, freqStart: 80, freqEnd: 50,
               sweepShape: 'linear', steps: 2, noise: true, noisePeriod: 6, volume: 14 } },
    { id: 'lipout',    name: 'Golf Lip-Out ★',  cat: 'Sports',  icon: '🏌️',
      patch: { channel: 0, durationMs: 350, freqStart: 600, freqEnd: 200,
               sweepShape: 'exp', steps: 8, noise: false, noisePeriod: 16, volume: 12,
               appendExec: 'CROWD_GROAN' } },
];

// EXEC ROM sound routine entry points. These addresses are CANONICAL and
// unchanging — the EXEC ROM is the same fixed binary on every Intellivision,
// so anyone who has loaded EXEC into the emulator (or shipped a cartridge)
// already has these routines mapped at these addresses. Source of truth:
// jzIntv's disassembler symbol table at dasm/exec_interp.c.
//
// Format: ASM CALL $XXXX — IntyBASIC's escape hatch for invoking arbitrary
// CP1610 subroutines. EXEC sound routines expect to be called with the
// PSG already initialised (which IntyBASIC's runtime does at boot).
const EXEC_CALLS = {
    CROWD_CHEER: { label: '👏 Crowd Cheer',
                   intybasicCall: 'ASM CALL $1ED5  ; X_PLAY_CHEER1 — EXEC crowd cheer' },
    CROWD_GROAN: { label: '🤥 Crowd Razz (groan)',
                   intybasicCall: 'ASM CALL $1EBA  ; X_PLAY_RAZZ1 — EXEC raspberry / Bronx cheer (sonic groan)' },
    CROWD_BOO:   { label: '👎 Crowd Razz (boo)',
                   intybasicCall: 'ASM CALL $1EBD  ; X_PLAY_RAZZ2 — EXEC raspberry (longer boo)' },
    WHISTLE:     { label: '🎺 Referee Whistle',
                   intybasicCall: 'ASM CALL $1F1B  ; X_PLAY_WHST1 — EXEC ref whistle' },
    PLAY_NOTE:   { label: '🎵 Single PLAY_NOTE',
                   intybasicCall: 'ASM CALL $1ABD  ; X_PLAY_NOTE — EXEC single-note utility' },
    STOP_SFX:    { label: '⏹ Stop SFX',
                   intybasicCall: 'ASM CALL $1EB4  ; X_STOP_SFX — EXEC SFX silence' },
    HUSH:        { label: '🤫 HUSH (all silence)',
                   intybasicCall: 'ASM CALL $1AA8  ; X_HUSH — EXEC silence-all utility' },
};

// ─── Module ──────────────────────────────────────────────────────────────────

export class SfxEditor {
    static ctx          = null;
    static masterGain   = null;
    static noiseBuffer  = null;
    static activeNodes  = [];
    static currentId    = null;      // active preset id (null if customized)
    static patch        = null;      // working patch (cloned from preset)
    static appendExec   = null;      // null or key in EXEC_CALLS
    static playing      = false;

    static init() {
        // Load first preset as starting state.
        SfxEditor.loadPreset(PRESETS[0].id, /*autoplay=*/false);
        SfxEditor._renderPresets();
        SfxEditor._renderDesigner();
        SfxEditor._renderExecPicker();
        SfxEditor._updateOutput();
    }

    // ── Patch management ────────────────────────────────────────────────────

    static loadPreset(id, autoplay = true) {
        const p = PRESETS.find(x => x.id === id);
        if (!p) return;
        SfxEditor.currentId = id;
        SfxEditor.patch = JSON.parse(JSON.stringify(p.patch));
        SfxEditor.appendExec = p.patch.appendExec || null;
        SfxEditor._renderPresets();
        SfxEditor._renderDesigner();
        SfxEditor._renderExecPicker();
        SfxEditor._updateOutput();
        if (autoplay) SfxEditor.play();
    }

    static updateField(field, value) {
        if (!SfxEditor.patch) return;
        // Numeric coercion for numeric fields
        const numericFields = ['channel', 'durationMs', 'freqStart', 'freqEnd',
                               'steps', 'noisePeriod', 'volume'];
        if (numericFields.includes(field)) value = Number(value);
        if (field === 'noise') value = !!value;
        SfxEditor.patch[field] = value;
        SfxEditor.currentId = null;  // mark as customized
        SfxEditor._renderPresets();
        SfxEditor._renderDesigner(/*onlyOutput=*/true);
        SfxEditor._updateOutput();
    }

    static setExec(key) {
        SfxEditor.appendExec = key || null;
        SfxEditor._updateOutput();
    }

    // ── Web Audio playback ─────────────────────────────────────────────────

    static _ensureCtx() {
        if (!SfxEditor.ctx || SfxEditor.ctx.state === 'closed') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            SfxEditor.ctx = new AudioCtx();
            SfxEditor.masterGain = SfxEditor.ctx.createGain();
            SfxEditor.masterGain.gain.value = 0.5;
            SfxEditor.masterGain.connect(SfxEditor.ctx.destination);
            SfxEditor.noiseBuffer = buildNoiseBuffer(SfxEditor.ctx);
        } else if (SfxEditor.ctx.state === 'suspended') {
            SfxEditor.ctx.resume();
        }
    }

    static play() {
        SfxEditor.stop();
        SfxEditor._ensureCtx();
        if (!SfxEditor.patch) return;

        const ctx = SfxEditor.ctx;
        const t0 = ctx.currentTime + 0.02;
        const p = SfxEditor.patch;
        const durSec = p.durationMs / 1000;

        // Per-step frequency timeline (Hz). Each step gets a slice of duration.
        const steps = Math.max(1, p.steps);
        const stepDur = durSec / steps;
        const freqs = SfxEditor._buildFreqRamp(p.freqStart, p.freqEnd, steps, p.sweepShape);

        // Volume envelope: simple linear fade-out from `volume` to 0.
        // AY volume is 0-15; map to gain 0-1 logarithmically (closer to chip feel).
        const peakGain = SfxEditor._ayVolToGain(p.volume);

        const env = ctx.createGain();
        env.gain.setValueAtTime(peakGain, t0);
        env.gain.linearRampToValueAtTime(0.0001, t0 + durSec);
        env.connect(SfxEditor.masterGain);

        // Tone oscillator (always created; muted if disabled or freq=0).
        if (p.freqStart > 0 || p.freqEnd > 0) {
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(Math.max(20, freqs[0]), t0);
            for (let i = 1; i < steps; i++) {
                const tStep = t0 + i * stepDur;
                const hz = Math.max(20, freqs[i]);
                if (p.sweepShape === 'step') {
                    osc.frequency.setValueAtTime(hz, tStep);
                } else if (p.sweepShape === 'exp') {
                    osc.frequency.exponentialRampToValueAtTime(hz, tStep);
                } else {
                    osc.frequency.linearRampToValueAtTime(hz, tStep);
                }
            }
            osc.connect(env);
            osc.start(t0);
            osc.stop(t0 + durSec + 0.05);
            SfxEditor.activeNodes.push(osc);
        }

        // Noise source (if enabled). Noise period inversely controls perceived "pitch".
        if (p.noise) {
            const noise = ctx.createBufferSource();
            noise.buffer = SfxEditor.noiseBuffer;
            noise.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            // Approximate AY noise period → cutoff (lower period = brighter noise).
            const cutoff = Math.max(200, 8000 / Math.max(1, p.noisePeriod));
            filter.frequency.value = cutoff;
            noise.connect(filter).connect(env);
            noise.start(t0, Math.random() * 0.5);
            noise.stop(t0 + durSec + 0.05);
            SfxEditor.activeNodes.push(noise);
        }

        // Optional EXEC tail preview — Web Audio approximation of the real
        // EXEC ROM routine that the exported source calls. Scheduled to start
        // immediately after the PSG SFX finishes, mirroring how the export
        // would play in-game.
        let tailDurSec = 0;
        if (SfxEditor.appendExec && EXEC_CALLS[SfxEditor.appendExec]) {
            tailDurSec = SfxEditor._scheduleExecTail(SfxEditor.appendExec, t0 + durSec);
        }

        SfxEditor.playing = true;
        SfxEditor._setPlayButtonState(true);

        // Auto-stop bookkeeping
        setTimeout(() => {
            if (SfxEditor.playing) {
                SfxEditor.playing = false;
                SfxEditor._setPlayButtonState(false);
            }
        }, ((durSec + tailDurSec) * 1000) + 100);
    }

    /**
     * Web Audio approximation of an EXEC ROM sound routine. These aren't
     * bit-perfect to the real EXEC PSG data (the byte sequences live in
     * Mattel's read-only EXEC binary and aren't reproduced here), but they
     * match the sonic character closely enough that previews feel right.
     * Returns the tail's duration in seconds so play() can update its
     * auto-stop timer.
     */
    static _scheduleExecTail(key, t0) {
        const ctx = SfxEditor.ctx;
        if (!ctx) return 0;

        const mkEnv = (peak, dur) => {
            const env = ctx.createGain();
            env.gain.setValueAtTime(0.0001, t0);
            env.gain.linearRampToValueAtTime(peak, t0 + 0.02);
            env.gain.linearRampToValueAtTime(0.0001, t0 + dur);
            env.connect(SfxEditor.masterGain);
            return env;
        };

        if (key === 'CROWD_CHEER') {
            // Crowd cheer/applause — long bright noise burst with mild
            // amplitude modulation, suggesting many overlapping voices.
            const dur = 1.0;
            const noise = ctx.createBufferSource();
            noise.buffer = SfxEditor.noiseBuffer;
            noise.loop = true;
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass'; hp.frequency.value = 800;
            const env = mkEnv(0.35, dur);
            noise.connect(hp).connect(env);
            noise.start(t0, Math.random() * 0.5);
            noise.stop(t0 + dur + 0.05);
            SfxEditor.activeNodes.push(noise);
            return dur;
        }

        if (key === 'CROWD_GROAN' || key === 'CROWD_BOO') {
            // Bronx cheer / raspberry — buzzy low tone with noise overlay.
            const dur = (key === 'CROWD_BOO') ? 0.8 : 0.5;
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, t0);
            osc.frequency.linearRampToValueAtTime(110, t0 + dur);
            const env = mkEnv(0.30, dur);
            osc.connect(env);
            osc.start(t0); osc.stop(t0 + dur + 0.05);
            SfxEditor.activeNodes.push(osc);
            // Noise overlay for that raspberry texture
            const noise = ctx.createBufferSource();
            noise.buffer = SfxEditor.noiseBuffer;
            noise.loop = true;
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass'; lp.frequency.value = 1500;
            const env2 = mkEnv(0.20, dur);
            noise.connect(lp).connect(env2);
            noise.start(t0, Math.random() * 0.5);
            noise.stop(t0 + dur + 0.05);
            SfxEditor.activeNodes.push(noise);
            return dur;
        }

        if (key === 'WHISTLE') {
            // Referee whistle — bright square at ~2.5kHz with a short chirp.
            const dur = 0.4;
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(2400, t0);
            osc.frequency.linearRampToValueAtTime(2700, t0 + 0.05);
            osc.frequency.setValueAtTime(2700, t0 + dur - 0.05);
            osc.frequency.linearRampToValueAtTime(2400, t0 + dur);
            const env = mkEnv(0.25, dur);
            osc.connect(env);
            osc.start(t0); osc.stop(t0 + dur + 0.05);
            SfxEditor.activeNodes.push(osc);
            return dur;
        }

        if (key === 'PLAY_NOTE') {
            // Single utility tone — A4 for ~300ms.
            const dur = 0.3;
            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 440;
            const env = mkEnv(0.25, dur);
            osc.connect(env);
            osc.start(t0); osc.stop(t0 + dur + 0.05);
            SfxEditor.activeNodes.push(osc);
            return dur;
        }

        // STOP_SFX / HUSH are pure-silence routines — nothing to preview.
        return 0;
    }

    static stop() {
        for (const n of SfxEditor.activeNodes) {
            try { n.stop(SfxEditor.ctx?.currentTime ?? 0); } catch (_) { /* already stopped */ }
        }
        SfxEditor.activeNodes = [];
        SfxEditor.playing = false;
        SfxEditor._setPlayButtonState(false);
    }

    static _buildFreqRamp(start, end, steps, shape) {
        const out = [];
        if (steps === 1) return [start];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            let v;
            if (shape === 'exp') {
                // Exponential interpolation in log space (clamp to >0).
                const a = Math.max(1, start), b = Math.max(1, end);
                v = a * Math.pow(b / a, t);
            } else {
                v = start + (end - start) * t;
            }
            out.push(v);
        }
        return out;
    }

    static _ayVolToGain(vol) {
        // AY-3-8914 volume table is roughly logarithmic. Approximate.
        const v = Math.max(0, Math.min(15, vol));
        return v === 0 ? 0 : Math.pow(2, (v - 15) / 3);
    }

    // ── Output generation ──────────────────────────────────────────────────

    static generateIntyBasic() {
        const p = SfxEditor.patch;
        if (!p) return '';
        const lines = [];
        const presetName = SfxEditor.currentId
            ? PRESETS.find(x => x.id === SfxEditor.currentId)?.name || 'Custom SFX'
            : 'Custom SFX';
        lines.push(`' ${presetName} — ${p.durationMs}ms on channel ${CH_NAMES[p.channel]}`);
        lines.push(`' Generated by Intellivision Overlay Editor (SFX tab)`);
        lines.push('');

        // Mixer: enable tone and/or noise on the chosen channel.
        const toneEnabled = (p.freqStart > 0 || p.freqEnd > 0);
        lines.push(`SOUND ${REG.MIXER}, ${mixerByte(p.channel, toneEnabled, p.noise)}\t' mixer: ${toneEnabled ? 'tone' : ''}${toneEnabled && p.noise ? '+' : ''}${p.noise ? 'noise' : ''} on ch.${CH_NAMES[p.channel]}`);

        // Noise period (if enabled).
        if (p.noise) {
            lines.push(`SOUND ${REG.NOISE}, ${p.noisePeriod}\t\t' noise period`);
        }

        // Initial volume.
        const volReg = REG.VOL_A + p.channel;
        lines.push(`SOUND ${volReg}, ${p.volume}\t\t' ch.${CH_NAMES[p.channel]} volume`);

        // Tone frequency timeline.
        const steps = Math.max(1, p.steps);
        const freqs = SfxEditor._buildFreqRamp(p.freqStart, p.freqEnd, steps, p.sweepShape);
        const totalTicks = Math.max(1, Math.round(p.durationMs / FRAME_MS));
        const ticksPerStep = Math.max(1, Math.round(totalTicks / steps));

        const toneLoReg = REG.TONE_A_LO + (p.channel * 2);
        const toneHiReg = toneLoReg + 1;

        if (toneEnabled) {
            for (let i = 0; i < steps; i++) {
                const period = hzToPeriod(freqs[i]);
                const lo = period & 0xFF;
                const hi = (period >> 8) & 0x0F;
                lines.push(`SOUND ${toneLoReg}, ${lo}\t\t' tone ch.${CH_NAMES[p.channel]} ≈ ${Math.round(freqs[i])}Hz (step ${i + 1}/${steps})`);
                if (hi > 0) lines.push(`SOUND ${toneHiReg}, ${hi}`);
                // Volume taper for the manual envelope (linear fade across steps).
                const stepVol = Math.round(p.volume * (1 - i / steps));
                if (stepVol !== p.volume && stepVol >= 0) {
                    lines.push(`SOUND ${volReg}, ${stepVol}`);
                }
                lines.push(`WAIT ${ticksPerStep}`);
            }
        } else {
            // Noise-only — single hold then fade in volume steps.
            for (let i = 0; i < steps; i++) {
                const stepVol = Math.round(p.volume * (1 - i / steps));
                if (i > 0) lines.push(`SOUND ${volReg}, ${Math.max(0, stepVol)}`);
                lines.push(`WAIT ${ticksPerStep}`);
            }
        }

        // Silence.
        lines.push(`SOUND ${volReg}, 0\t\t' silence ch.${CH_NAMES[p.channel]}`);

        // Optional EXEC tail (Steve's CROWD-groan composition).
        if (SfxEditor.appendExec && EXEC_CALLS[SfxEditor.appendExec]) {
            lines.push('');
            lines.push(`' ── EXEC tail (composition: SFX then ${SfxEditor.appendExec}) ──`);
            lines.push(EXEC_CALLS[SfxEditor.appendExec].intybasicCall);
        }

        return lines.join('\n');
    }

    static copyOutput() {
        const txt = SfxEditor.generateIntyBasic();
        navigator.clipboard.writeText(txt).then(() => {
            SfxEditor._showStatus('Copied IntyBASIC SOUND statements to clipboard');
        }).catch(() => {
            SfxEditor._showStatus('Copy failed — select text manually and copy');
        });
    }

    // ── DOM rendering ──────────────────────────────────────────────────────

    static _renderPresets() {
        const container = document.getElementById('sfx-presets');
        if (!container) return;
        // Group by category.
        const byCat = {};
        for (const p of PRESETS) {
            (byCat[p.cat] = byCat[p.cat] || []).push(p);
        }
        const html = Object.entries(byCat).map(([cat, items]) => `
            <div class="sfx-preset-cat">
                <div class="sfx-preset-cat-label">${cat}</div>
                <div class="sfx-preset-grid">
                    ${items.map(it => `
                        <button class="sfx-preset-btn ${SfxEditor.currentId === it.id ? 'active' : ''}"
                                onclick="sfxLoadPreset('${it.id}')"
                                data-tooltip="${it.name} — click to load and preview">
                            <span class="sfx-preset-icon">${it.icon}</span>
                            <span class="sfx-preset-name">${it.name}</span>
                        </button>`).join('')}
                </div>
            </div>
        `).join('');
        container.innerHTML = html;
    }

    static _renderDesigner(onlyOutput = false) {
        if (onlyOutput) return;  // sliders' values track patch via oninput; no rebuild needed
        const container = document.getElementById('sfx-designer');
        if (!container) return;
        const p = SfxEditor.patch;
        if (!p) return;

        container.innerHTML = `
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Channel</label>
                <select class="form-control sfx-select" onchange="sfxUpdate('channel', this.value)">
                    <option value="0" ${p.channel === 0 ? 'selected' : ''}>A</option>
                    <option value="1" ${p.channel === 1 ? 'selected' : ''}>B</option>
                    <option value="2" ${p.channel === 2 ? 'selected' : ''}>C</option>
                </select>
            </div>

            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Duration</label>
                <input type="range" min="20" max="2000" step="10" value="${p.durationMs}"
                       oninput="sfxUpdate('durationMs', this.value); document.getElementById('sfx-dur-val').textContent = this.value + 'ms'">
                <span class="sfx-designer-value" id="sfx-dur-val">${p.durationMs}ms</span>
            </div>

            <div class="sfx-designer-section">TONE</div>

            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Freq start</label>
                <input type="range" min="0" max="4000" step="10" value="${p.freqStart}"
                       oninput="sfxUpdate('freqStart', this.value); document.getElementById('sfx-fs-val').textContent = this.value + 'Hz'">
                <span class="sfx-designer-value" id="sfx-fs-val">${p.freqStart}Hz</span>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Freq end</label>
                <input type="range" min="0" max="4000" step="10" value="${p.freqEnd}"
                       oninput="sfxUpdate('freqEnd', this.value); document.getElementById('sfx-fe-val').textContent = this.value + 'Hz'">
                <span class="sfx-designer-value" id="sfx-fe-val">${p.freqEnd}Hz</span>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Sweep</label>
                <select class="form-control sfx-select" onchange="sfxUpdate('sweepShape', this.value)">
                    <option value="step"   ${p.sweepShape === 'step' ? 'selected' : ''}>Step</option>
                    <option value="linear" ${p.sweepShape === 'linear' ? 'selected' : ''}>Linear</option>
                    <option value="exp"    ${p.sweepShape === 'exp' ? 'selected' : ''}>Exponential</option>
                </select>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Steps</label>
                <input type="range" min="1" max="32" step="1" value="${p.steps}"
                       oninput="sfxUpdate('steps', this.value); document.getElementById('sfx-st-val').textContent = this.value">
                <span class="sfx-designer-value" id="sfx-st-val">${p.steps}</span>
            </div>

            <div class="sfx-designer-section">NOISE</div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Enabled</label>
                <input type="checkbox" ${p.noise ? 'checked' : ''}
                       onchange="sfxUpdate('noise', this.checked)">
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Period</label>
                <input type="range" min="0" max="31" step="1" value="${p.noisePeriod}"
                       oninput="sfxUpdate('noisePeriod', this.value); document.getElementById('sfx-np-val').textContent = this.value">
                <span class="sfx-designer-value" id="sfx-np-val">${p.noisePeriod}</span>
            </div>

            <div class="sfx-designer-section">ENVELOPE</div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Volume</label>
                <input type="range" min="0" max="15" step="1" value="${p.volume}"
                       oninput="sfxUpdate('volume', this.value); document.getElementById('sfx-vol-val').textContent = this.value">
                <span class="sfx-designer-value" id="sfx-vol-val">${p.volume}</span>
            </div>
            <p class="sfx-hint">Manual envelope: linear volume fade from peak to 0 across all steps. AY hardware envelope shapes (register 13) are deferred to v2.</p>
        `;
    }

    static _renderExecPicker() {
        const container = document.getElementById('sfx-exec-picker');
        if (!container) return;
        const opts = Object.entries(EXEC_CALLS).map(([key, val]) =>
            `<option value="${key}" ${SfxEditor.appendExec === key ? 'selected' : ''}>${val.label}</option>`
        ).join('');
        container.innerHTML = `
            <label class="sfx-designer-label" data-tooltip="Append an EXEC sound routine call after the PSG SFX. Useful for compositions like 'whoosh → crowd cheer' or 'lip-out tone → crowd groan'.">EXEC tail</label>
            <select class="form-control sfx-select" onchange="sfxSetExec(this.value)">
                <option value="" ${!SfxEditor.appendExec ? 'selected' : ''}>(none — PSG only)</option>
                ${opts}
            </select>
            <p class="sfx-hint">EXEC ROM addresses are canonical (same on every Intellivision). Preview uses Web Audio approximations of the real EXEC routines; the exported source calls the actual EXEC ROM. Source: jzIntv's symbol table.</p>
        `;
    }

    static _updateOutput() {
        const el = document.getElementById('sfx-output');
        if (el) el.textContent = SfxEditor.generateIntyBasic();
    }

    static _setPlayButtonState(playing) {
        const playBtn = document.getElementById('sfx-play-btn');
        const stopBtn = document.getElementById('sfx-stop-btn');
        if (playBtn) playBtn.disabled = playing;
        if (stopBtn) stopBtn.disabled = !playing;
    }

    static _showStatus(msg) {
        const el = document.getElementById('sfx-status');
        if (!el) return;
        el.textContent = msg;
        clearTimeout(SfxEditor._statusTimer);
        SfxEditor._statusTimer = setTimeout(() => { el.textContent = ''; }, 3000);
    }
}
