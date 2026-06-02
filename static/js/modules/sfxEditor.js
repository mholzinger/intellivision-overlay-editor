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
 * Patch schema (v2):
 *   {
 *     channel: 0|1|2,               // A, B, C
 *     durationMs: number,           // total length
 *     loop: boolean,                // re-play until stopped
 *     envMode: 'manual'|'hw',       // manual = linear vol fade; hw = AY env gen
 *     envShape: 0..15,              // AY register 13 shape (hw mode only)
 *     envPeriod: 1..65535,          // AY registers 11+12 (hw mode only)
 *     appendExec: null | 'CROWD_*' | etc.,
 *
 *     // Single-segment "flat" form (legacy & simple cases):
 *     freqStart, freqEnd, sweepShape: 'step'|'linear'|'exp'|'quadratic',
 *     steps, noise, noisePeriod, noisePeriodEnd?, volume,
 *
 *     // OR multi-segment form (overrides flat fields when present):
 *     segments: [
 *       { durationFraction, freqStart, freqEnd, sweepShape, steps,
 *         noise, noisePeriod, noisePeriodEnd?, volStart, volEnd }
 *     ]
 *   }
 *
 * Output format: raw `SOUND register, value` writes interleaved with
 * `WAIT n` (1 tick ≈ 1/60s NTSC). Optionally appends a placeholder
 * EXEC call (e.g. CROWD) for composition — Steve Ettinger's "ball
 * just misses the hole, crowd groans" scenario.
 */

import { buildNoiseBuffer } from './music/playback/instrumentVoices.js';
import { audioBufferToWav, downloadBlob, slugifyFilename } from '../utils/wavEncoder.js';

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

// AY-3-8914 envelope shapes (register 13). Names follow the chip datasheet.
// Shapes 0-3 are equivalent (single decay then off), as are 4-7 (single
// attack then off) and 9/11/13/15 (variants of decay-then-hold or attack-
// then-hold). The "musically interesting" loop shapes are 8, 10, 12, 14.
const ENV_SHAPES = {
    0:  { name: 'Decay → off',      loop: false, dir: 'down', hold: false },
    1:  { name: 'Decay → off',      loop: false, dir: 'down', hold: false },
    2:  { name: 'Decay → off',      loop: false, dir: 'down', hold: false },
    3:  { name: 'Decay → off',      loop: false, dir: 'down', hold: false },
    4:  { name: 'Attack → off',     loop: false, dir: 'up',   hold: false },
    5:  { name: 'Attack → off',     loop: false, dir: 'up',   hold: false },
    6:  { name: 'Attack → off',     loop: false, dir: 'up',   hold: false },
    7:  { name: 'Attack → off',     loop: false, dir: 'up',   hold: false },
    8:  { name: 'Sawtooth ↓ loop',  loop: true,  dir: 'down', hold: false },
    9:  { name: 'Decay → off',      loop: false, dir: 'down', hold: false },
    10: { name: 'Triangle ↕ loop',  loop: true,  dir: 'tri',  hold: false },
    11: { name: 'Decay → hold high',loop: false, dir: 'down', hold: true  },
    12: { name: 'Sawtooth ↑ loop',  loop: true,  dir: 'up',   hold: false },
    13: { name: 'Attack → hold high',loop:false, dir: 'up',   hold: true  },
    14: { name: 'Triangle ↕ loop',  loop: true,  dir: 'triUp',hold: false },
    15: { name: 'Attack → off',     loop: false, dir: 'up',   hold: false },
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

// Reverse: AY tone-period value → approximate Hz. Used when porting catalog
// data that's expressed in PSG periods (e.g. Space Intruders' `SOUND 2, 1800`).
function periodToHz(period) {
    if (period <= 0) return 0;
    return Math.round(AY_CLOCK / (16 * period));
}

const CH_NAMES = ['A', 'B', 'C'];

/**
 * Normalize a patch into canonical segmented form. Flat patches get wrapped
 * in a single-segment array; segmented patches pass through. The synth and
 * generator both consume only the canonical form so they don't need to
 * special-case flat vs. segmented.
 */
function migratePatch(p) {
    if (p.segments && p.segments.length > 0) {
        // Defaults for any missing per-segment fields
        const segments = p.segments.map(s => ({
            durationFraction: s.durationFraction ?? 1.0,
            freqStart:    s.freqStart    ?? 0,
            freqEnd:      s.freqEnd      ?? s.freqStart ?? 0,
            sweepShape:   s.sweepShape   ?? 'step',
            steps:        s.steps        ?? 1,
            noise:        s.noise        ?? false,
            noisePeriod:  s.noisePeriod  ?? 16,
            noisePeriodEnd: s.noisePeriodEnd ?? s.noisePeriod ?? 16,
            volStart:     s.volStart     ?? p.volume ?? 12,
            volEnd:       s.volEnd       ?? 0,
        }));
        return { ...p, segments };
    }
    return {
        ...p,
        segments: [{
            durationFraction: 1.0,
            freqStart:    p.freqStart    ?? 0,
            freqEnd:      p.freqEnd      ?? p.freqStart ?? 0,
            sweepShape:   p.sweepShape   ?? 'step',
            steps:        p.steps        ?? 1,
            noise:        p.noise        ?? false,
            noisePeriod:  p.noisePeriod  ?? 16,
            noisePeriodEnd: p.noisePeriodEnd ?? p.noisePeriod ?? 16,
            volStart:     p.volume       ?? 12,
            volEnd:       0,
        }],
    };
}

// ─── Preset library ──────────────────────────────────────────────────────────
// Patches use the v2 schema. Simple presets stay flat; multi-phase / looping /
// HW envelope presets use the extended fields. See migratePatch() above.

const PRESETS = [
    // ── Arcade classics (v1) ──────────────────────────────────────────────
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

    // ── Arcade classics (mined v1.5) ──────────────────────────────────────
    { id: 'astro_boom', name: 'Astrosmash Boom', cat: 'Arcade', icon: '☄️',
      // Canonical Intellivision death sound. sfxlab.bas D2:768-788.
      // Pure noise, period sweeps 14→24 over 22 frames.
      patch: { channel: 2, durationMs: 367, freqStart: 0, freqEnd: 0,
               sweepShape: 'step', steps: 22, noise: true,
               noisePeriod: 14, noisePeriodEnd: 24, volume: 15 } },
    { id: 'bwop', name: 'Spongey Bwop (Alien)', cat: 'Arcade', icon: '👾',
      // Descending pitch alien-kill. Space Intruders SfxT14, freq sweeps
      // up in AY period (= down in pitch).
      patch: { channel: 2, durationMs: 200, freqStart: periodToHz(180), freqEnd: periodToHz(440),
               sweepShape: 'linear', steps: 12, noise: false, noisePeriod: 16, volume: 12 } },
    { id: 'defender_crack', name: 'Defender Crack', cat: 'Arcade', icon: '🔫',
      // 5-frame ultra-fast crack. sfxlab.bas L4:295-312.
      patch: { channel: 0, durationMs: 83, freqStart: 200, freqEnd: 600,
               sweepShape: 'linear', steps: 5, noise: false, noisePeriod: 16, volume: 14 } },
    { id: 'si_missile', name: 'SI Missile', cat: 'Arcade', icon: '🚀',
      // Raspy Space Invaders missile. Tone + noise on channel C.
      patch: { channel: 2, durationMs: 250, freqStart: 400, freqEnd: 300,
               sweepShape: 'linear', steps: 8, noise: true, noisePeriod: 14, volume: 13 } },
    { id: 'schwing', name: 'Saucer Schwing', cat: 'Arcade', icon: '🛸',
      // Metallic saucer kill. Space Intruders SfxT12.
      patch: { channel: 2, durationMs: 250, freqStart: 400, freqEnd: 1200,
               sweepShape: 'linear', steps: 15, noise: true, noisePeriod: 8, volume: 15 } },
    { id: 'sad_descent', name: 'Sad Descent', cat: 'Arcade', icon: '😢',
      // sfxlab.bas D3:790-810. Tone-only descending death cry.
      patch: { channel: 2, durationMs: 500, freqStart: 800, freqEnd: 100,
               sweepShape: 'linear', steps: 25, noise: false, noisePeriod: 16, volume: 12 } },
    { id: 'pumpkin_fire', name: 'Pumpkin Fire (quadratic)', cat: 'Arcade', icon: '🎃',
      // Toledo's quadratic sweep — accelerating pitch rise. Pumpkin Master ch4.
      patch: { channel: 0, durationMs: 167, freqStart: 200, freqEnd: 2000,
               sweepShape: 'quadratic', steps: 10, noise: false, noisePeriod: 16, volume: 12 } },

    // ── Multi-phase showcase (mined v1.5) ─────────────────────────────────
    { id: 'belt_buckle', name: 'Belt-Buckle Powerup', cat: 'Arcade', icon: '✨',
      // Space Intruders SfxT13. Phase 1: noisy snap. Phase 2: descending ring.
      patch: { channel: 2, durationMs: 233, envMode: 'manual',
        segments: [
          { durationFraction: 0.3, freqStart: 600, freqEnd: 600,
            sweepShape: 'step', steps: 1, noise: true, noisePeriod: 6,
            volStart: 14, volEnd: 12 },
          { durationFraction: 0.7, freqStart: 600, freqEnd: 100,
            sweepShape: 'linear', steps: 8, noise: false, noisePeriod: 16,
            volStart: 12, volEnd: 0 }
        ] } },
    { id: 'plasma_cannon', name: 'Plasma Cannon (3-phase)', cat: 'Arcade', icon: '🌌',
      // sfxlab.bas L5:314-348. Bass thrum → mid arc → deep rumble.
      patch: { channel: 0, durationMs: 600, envMode: 'manual',
        segments: [
          { durationFraction: 0.2, freqStart: 80, freqEnd: 100,
            sweepShape: 'linear', steps: 4, noise: false, noisePeriod: 16,
            volStart: 15, volEnd: 14 },
          { durationFraction: 0.5, freqStart: 100, freqEnd: 1500,
            sweepShape: 'exp', steps: 12, noise: true, noisePeriod: 10,
            volStart: 14, volEnd: 10 },
          { durationFraction: 0.3, freqStart: 80, freqEnd: 40,
            sweepShape: 'linear', steps: 6, noise: true, noisePeriod: 20,
            volStart: 10, volEnd: 0 }
        ] } },
    { id: 'boss_meltdown', name: 'Boss Reactor Meltdown', cat: 'Arcade', icon: '☢️',
      // sfxlab.bas E9:688-742. 4-phase 40-frame epic.
      patch: { channel: 2, durationMs: 667, envMode: 'manual',
        segments: [
          { durationFraction: 0.2, freqStart: 200, freqEnd: 800,
            sweepShape: 'exp', steps: 6, noise: false, noisePeriod: 16,
            volStart: 13, volEnd: 15 },
          { durationFraction: 0.3, freqStart: 0, freqEnd: 0,
            sweepShape: 'step', steps: 8, noise: true,
            noisePeriod: 6, noisePeriodEnd: 12, volStart: 15, volEnd: 13 },
          { durationFraction: 0.3, freqStart: 60, freqEnd: 40,
            sweepShape: 'linear', steps: 6, noise: true,
            noisePeriod: 18, noisePeriodEnd: 24, volStart: 13, volEnd: 8 },
          { durationFraction: 0.2, freqStart: 100, freqEnd: 50,
            sweepShape: 'linear', steps: 4, noise: false, noisePeriod: 16,
            volStart: 8, volEnd: 0 }
        ] } },

    // ── Percussion (existing M1/M2/M3) ─────────────────────────────────────
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
    { id: 'bird_chirp', name: 'Bird Chirp', cat: 'UI', icon: '🐦',
      // Toledo all_about_sound_ch2.md sound_bird. Rising freq + pulsing vol.
      patch: { channel: 0, durationMs: 133, freqStart: 1500, freqEnd: 2500,
               sweepShape: 'linear', steps: 8, noise: false, noisePeriod: 16, volume: 10 } },
    { id: 'stepped_fanfare', name: 'Stepped Fanfare', cat: 'UI', icon: '🎺',
      // 4-note ascending sting using stepped sweep with the right rhythm.
      patch: { channel: 0, durationMs: 400, envMode: 'manual',
        segments: [
          { durationFraction: 0.25, freqStart: periodToHz(300), freqEnd: periodToHz(300),
            sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16,
            volStart: 12, volEnd: 12 },
          { durationFraction: 0.25, freqStart: periodToHz(250), freqEnd: periodToHz(250),
            sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16,
            volStart: 12, volEnd: 12 },
          { durationFraction: 0.25, freqStart: periodToHz(200), freqEnd: periodToHz(200),
            sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16,
            volStart: 12, volEnd: 12 },
          { durationFraction: 0.25, freqStart: periodToHz(150), freqEnd: periodToHz(150),
            sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16,
            volStart: 13, volEnd: 0 }
        ] } },
    { id: 'letdown', name: 'Letdown ★', cat: 'UI', icon: '📉',
      // Descending pitch into an EXEC CROWD groan. The descending-tone +
      // crowd-groan composition pattern is Steve Ettinger's advice — see
      // the SFX Primer credits for the technique attribution.
      patch: { channel: 0, durationMs: 350, freqStart: 600, freqEnd: 200,
               sweepShape: 'exp', steps: 8, noise: false, noisePeriod: 16, volume: 12,
               appendExec: 'CROWD_GROAN' } },

    // ── Sports / specialty ────────────────────────────────────────────────
    { id: 'whoosh',    name: 'Whoosh',          cat: 'Sports',  icon: '💨',
      patch: { channel: 2, durationMs: 300, freqStart: 0, freqEnd: 0,
               sweepShape: 'linear', steps: 12, noise: true, noisePeriod: 22, volume: 11 } },
    { id: 'thud',      name: 'Thud',            cat: 'Sports',  icon: '👟',
      patch: { channel: 2, durationMs: 90, freqStart: 80, freqEnd: 50,
               sweepShape: 'linear', steps: 2, noise: true, noisePeriod: 6, volume: 14 } },

    // ── Foley (translated from S.ASM macro examples contributed by Steve
    //          Ettinger — see vendor/sfx-macros/README.md for provenance).
    //          Labels here are our own naming; original sequence labels are
    //          not preserved. ────────────────────────────────────────────
    { id: 'tap', name: 'Tap', cat: 'Foley', icon: '👆',
      // HW envelope decay over a single ~1.9 kHz tone, ch.A. Short 100ms.
      patch: { channel: 0, durationMs: 100, freqStart: 1929, freqEnd: 1929,
               sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16, volume: 15,
               envMode: 'hw', envShape: 0, envPeriod: 128 } },
    { id: 'knock', name: 'Knock', cat: 'Foley', icon: '🚪',
      // Same envelope shape as Tap but a lower fundamental (~1.4 kHz).
      patch: { channel: 0, durationMs: 100, freqStart: 1398, freqEnd: 1398,
               sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16, volume: 15,
               envMode: 'hw', envShape: 0, envPeriod: 128 } },
    { id: 'cascade', name: 'Cascade', cat: 'Foley', icon: '💦',
      // 4-phase noise: high stab → low fade → swelling noise pitch rising →
      // long fade. Total ~833ms (the original sequence uses STUNIT 2).
      patch: { channel: 2, durationMs: 833, envMode: 'manual',
        segments: [
          { durationFraction: 0.08, freqStart: 0, freqEnd: 0,
            sweepShape: 'linear', steps: 2, noise: true,
            noisePeriod: 5,  noisePeriodEnd: 5,
            volStart: 8,  volEnd: 13 },
          { durationFraction: 0.12, freqStart: 0, freqEnd: 0,
            sweepShape: 'linear', steps: 3, noise: true,
            noisePeriod: 21, noisePeriodEnd: 21,
            volStart: 13, volEnd: 6 },
          { durationFraction: 0.40, freqStart: 0, freqEnd: 0,
            sweepShape: 'linear', steps: 10, noise: true,
            noisePeriod: 21, noisePeriodEnd: 4,
            volStart: 6, volEnd: 14 },
          { durationFraction: 0.40, freqStart: 0, freqEnd: 0,
            sweepShape: 'linear', steps: 10, noise: true,
            noisePeriod: 4,  noisePeriodEnd: 4,
            volStart: 14, volEnd: 0 }
        ] } },
    { id: 'impact', name: 'Impact', cat: 'Foley', icon: '💥',
      // 3-phase noise hit: high stab → low bite → high tail descending in
      // pitch. ~133ms. Good for crisp foreground impacts.
      patch: { channel: 2, durationMs: 133, envMode: 'manual',
        segments: [
          { durationFraction: 0.125, freqStart: 0, freqEnd: 0,
            sweepShape: 'step', steps: 1, noise: true,
            noisePeriod: 2,  volStart: 15, volEnd: 14 },
          { durationFraction: 0.25, freqStart: 0, freqEnd: 0,
            sweepShape: 'linear', steps: 2, noise: true,
            noisePeriod: 30, volStart: 14, volEnd: 12 },
          { durationFraction: 0.625, freqStart: 0, freqEnd: 0,
            sweepShape: 'linear', steps: 5, noise: true,
            noisePeriod: 4,  noisePeriodEnd: 14,
            volStart: 12, volEnd: 0 }
        ] } },
    { id: 'wind', name: 'Wind', cat: 'Foley', icon: '🌬️',
      // Sustained ~950ms tone + noise mix on ch.C. The original uses two
      // channels (tone on A, noise on B); we mix both on a single channel
      // via the mixer for our single-channel schema. The defining shape:
      // bidirectional pitch sweep (up then down) and matching vol curve.
      patch: { channel: 2, durationMs: 950, envMode: 'manual',
        segments: [
          { durationFraction: 0.47, freqStart: periodToHz(506), freqEnd: periodToHz(263),
            sweepShape: 'linear', steps: 14, noise: true,
            noisePeriod: 27, noisePeriodEnd: 4,
            volStart: 5, volEnd: 12 },
          { durationFraction: 0.53, freqStart: periodToHz(263), freqEnd: periodToHz(563),
            sweepShape: 'linear', steps: 15, noise: true,
            noisePeriod: 4,  noisePeriodEnd: 28,
            volStart: 12, volEnd: 0 }
        ] } },
    { id: 'sizzle', name: 'Sizzle', cat: 'Foley', icon: '🔥',
      // Single-phase noise burst with a fast volume drop. The defining
      // character is the high-frequency hiss tail.
      patch: { channel: 0, durationMs: 133, freqStart: 0, freqEnd: 0,
               sweepShape: 'linear', steps: 8, noise: true,
               noisePeriod: 4, noisePeriodEnd: 0,
               volume: 12 } },

    // ── Ambience (loops + HW envelope) ────────────────────────────────────
    { id: 'saucer_drone', name: 'Saucer Drone', cat: 'Ambience', icon: '🛸',
      // Space Intruders SaucerAmbient. Alternating two-tone hum, loops.
      patch: { channel: 2, durationMs: 266, envMode: 'manual', loop: true,
        segments: [
          { durationFraction: 0.5, freqStart: periodToHz(1800), freqEnd: periodToHz(1800),
            sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16,
            volStart: 12, volEnd: 12 },
          { durationFraction: 0.5, freqStart: periodToHz(2200), freqEnd: periodToHz(2200),
            sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16,
            volStart: 12, volEnd: 12 }
        ] } },
    { id: 'helicopter', name: 'Helicopter', cat: 'Ambience', icon: '🚁',
      // envelope.bas effect 3. HW envelope shape 12 (saw up) at fast period
      // gives chopper texture over noise+tone backdrop.
      patch: { channel: 0, durationMs: 2000, freqStart: 50, freqEnd: 50,
               sweepShape: 'step', steps: 1, noise: true, noisePeriod: 8, volume: 15,
               envMode: 'hw', envShape: 12, envPeriod: 400, loop: true } },
    { id: 'siren', name: 'Siren', cat: 'Ambience', icon: '🚨',
      // envelope.bas effect 5. HW envelope shape 12 sawtooth up at slow
      // period gives the classic rising-siren character.
      patch: { channel: 0, durationMs: 2000, freqStart: periodToHz(100), freqEnd: periodToHz(100),
               sweepShape: 'step', steps: 1, noise: false, noisePeriod: 16, volume: 15,
               envMode: 'hw', envShape: 12, envPeriod: 3600, loop: true } },
    { id: 'seawaves', name: 'Seawaves', cat: 'Ambience', icon: '🌊',
      // envelope.bas effect 2. Noise + HW envelope shape 8 (saw down loop).
      patch: { channel: 0, durationMs: 2000, freqStart: 0, freqEnd: 0,
               sweepShape: 'step', steps: 1, noise: true, noisePeriod: 31, volume: 15,
               envMode: 'hw', envShape: 8, envPeriod: 32000, loop: true } },
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
    static rawPatch     = null;      // user-facing patch (may be flat or segmented)
    static patch        = null;      // canonical (always segmented) form for synth/generator
    static appendExec   = null;      // null or key in EXEC_CALLS
    static playing      = false;
    static _loopTimer   = null;      // setTimeout handle for loop re-trigger

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
        SfxEditor.rawPatch = JSON.parse(JSON.stringify(p.patch));
        SfxEditor.patch = migratePatch(SfxEditor.rawPatch);
        SfxEditor.appendExec = p.patch.appendExec || null;
        SfxEditor._renderPresets();
        SfxEditor._renderDesigner();
        SfxEditor._renderExecPicker();
        SfxEditor._updateOutput();
        if (autoplay) SfxEditor.play();
    }

    static updateField(field, value) {
        if (!SfxEditor.rawPatch) return;
        // Numeric coercion for numeric fields
        const numericFields = ['channel', 'durationMs', 'freqStart', 'freqEnd',
                               'steps', 'noisePeriod', 'volume',
                               'envShape', 'envPeriod'];
        if (numericFields.includes(field)) value = Number(value);
        if (field === 'noise' || field === 'loop') value = !!value;
        SfxEditor.rawPatch[field] = value;
        SfxEditor.patch = migratePatch(SfxEditor.rawPatch);
        SfxEditor.currentId = null;  // mark as customized
        SfxEditor._renderPresets();
        SfxEditor._renderDesigner(/*onlyOutput=*/true);
        SfxEditor._updateOutput();
    }

    static setExec(key) {
        SfxEditor.appendExec = key || null;
        SfxEditor._updateOutput();
    }

    static isMultiSegment() {
        return SfxEditor.rawPatch?.segments && SfxEditor.rawPatch.segments.length > 1;
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

        // Schedule each segment in sequence.
        let segStart = t0;
        for (const seg of p.segments) {
            const segDur = durSec * (seg.durationFraction || 1);
            SfxEditor._scheduleSegment(seg, p, segStart, segDur);
            segStart += segDur;
        }

        // Optional EXEC tail preview — runs once after segments, never loops.
        let tailDurSec = 0;
        if (SfxEditor.appendExec && EXEC_CALLS[SfxEditor.appendExec]) {
            tailDurSec = SfxEditor._scheduleExecTail(SfxEditor.appendExec, t0 + durSec);
        }

        SfxEditor.playing = true;
        SfxEditor._setPlayButtonState(true);

        const totalDurMs = (durSec + tailDurSec) * 1000;

        if (p.loop && !SfxEditor.appendExec) {
            // Re-trigger after the segments complete (EXEC tail breaks the loop).
            SfxEditor._loopTimer = setTimeout(() => {
                if (SfxEditor.playing) SfxEditor.play();
            }, durSec * 1000);
        } else {
            // Auto-stop bookkeeping
            SfxEditor._loopTimer = setTimeout(() => {
                if (SfxEditor.playing) {
                    SfxEditor.playing = false;
                    SfxEditor._setPlayButtonState(false);
                }
            }, totalDurMs + 100);
        }
    }

    /** Schedule one segment's worth of Web Audio events. */
    static _scheduleSegment(seg, p, t0, durSec) {
        const ctx = SfxEditor.ctx;

        // Build per-segment envelope (gain). HW mode uses the AY envelope
        // generator shape; manual mode uses a simple linear vol fade.
        const env = (p.envMode === 'hw')
            ? SfxEditor._buildHwEnvelopeGain(p, t0, durSec)
            : SfxEditor._buildManualEnvelopeGain(seg, t0, durSec);
        env.connect(SfxEditor.masterGain);

        // Tone oscillator (if seg has tone enabled).
        const toneEnabled = (seg.freqStart > 0 || seg.freqEnd > 0);
        if (toneEnabled) {
            const steps = Math.max(1, seg.steps);
            const stepDur = durSec / steps;
            const freqs = SfxEditor._buildFreqRamp(seg.freqStart, seg.freqEnd, steps, seg.sweepShape);

            const osc = ctx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(Math.max(20, freqs[0]), t0);
            for (let i = 1; i < steps; i++) {
                const tStep = t0 + i * stepDur;
                const hz = Math.max(20, freqs[i]);
                if (seg.sweepShape === 'step' || seg.sweepShape === 'quadratic') {
                    // Quadratic ramps are precomputed step values (no native
                    // ramp), so just hop between them.
                    osc.frequency.setValueAtTime(hz, tStep);
                } else if (seg.sweepShape === 'exp') {
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

        // Noise source (if seg has noise enabled). Optionally sweep period.
        if (seg.noise) {
            const noise = ctx.createBufferSource();
            noise.buffer = SfxEditor.noiseBuffer;
            noise.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';

            const np0 = Math.max(1, seg.noisePeriod);
            const np1 = Math.max(1, seg.noisePeriodEnd ?? seg.noisePeriod);
            const cutoff0 = Math.max(200, 8000 / np0);
            const cutoff1 = Math.max(200, 8000 / np1);
            filter.frequency.setValueAtTime(cutoff0, t0);
            if (np0 !== np1) {
                filter.frequency.linearRampToValueAtTime(cutoff1, t0 + durSec);
            }

            noise.connect(filter).connect(env);
            noise.start(t0, Math.random() * 0.5);
            noise.stop(t0 + durSec + 0.05);
            SfxEditor.activeNodes.push(noise);
        }
    }

    /** Manual envelope: linear vol fade from volStart to volEnd. */
    static _buildManualEnvelopeGain(seg, t0, durSec) {
        const env = SfxEditor.ctx.createGain();
        const peak = SfxEditor._ayVolToGain(seg.volStart);
        const tail = SfxEditor._ayVolToGain(seg.volEnd);
        env.gain.setValueAtTime(peak, t0);
        env.gain.linearRampToValueAtTime(Math.max(0.0001, tail), t0 + durSec);
        return env;
    }

    /**
     * Approximate the AY hardware envelope generator. Real AY shapes 0-15
     * are encoded in 2 bits (continue/attack/alternate/hold) — we render
     * a reasonable Web Audio approximation. Useful for previewing the
     * character; the exported IntyBASIC SOUND statements drive the real
     * envelope generator on actual hardware.
     */
    static _buildHwEnvelopeGain(p, t0, durSec) {
        const env = SfxEditor.ctx.createGain();
        const shape = ENV_SHAPES[p.envShape ?? 0] || ENV_SHAPES[0];
        // AY envelope cycle frequency = AY_CLOCK / (256 * envPeriod)
        const cycleSec = Math.max(0.005, (256 * (p.envPeriod ?? 1000)) / AY_CLOCK);

        if (!shape.loop) {
            // One-shot shapes complete a single ramp in cycleSec then hold or off.
            const tEnd = Math.min(t0 + cycleSec, t0 + durSec);
            if (shape.dir === 'down') {
                env.gain.setValueAtTime(1.0, t0);
                env.gain.linearRampToValueAtTime(0.001, tEnd);
            } else {
                env.gain.setValueAtTime(0.001, t0);
                env.gain.linearRampToValueAtTime(1.0, tEnd);
            }
            if (tEnd < t0 + durSec) {
                env.gain.setValueAtTime(shape.hold ? 1.0 : 0, tEnd);
            }
            return env;
        }

        // Looping shapes: schedule N cycles for the segment duration.
        const N = Math.ceil(durSec / cycleSec);
        env.gain.setValueAtTime((shape.dir === 'up' || shape.dir === 'triUp') ? 0.001 : 1.0, t0);
        for (let i = 0; i < N; i++) {
            const ts = t0 + i * cycleSec;
            const te = Math.min(ts + cycleSec, t0 + durSec);
            if (te <= ts) break;
            if (shape.dir === 'down') {
                env.gain.setValueAtTime(1.0, ts);
                env.gain.linearRampToValueAtTime(0.001, te);
            } else if (shape.dir === 'up') {
                env.gain.setValueAtTime(0.001, ts);
                env.gain.linearRampToValueAtTime(1.0, te);
            } else if (shape.dir === 'tri') {
                // \/ triangle (10): down then up
                const mid = ts + (te - ts) / 2;
                env.gain.setValueAtTime(1.0, ts);
                env.gain.linearRampToValueAtTime(0.001, mid);
                env.gain.linearRampToValueAtTime(1.0, te);
            } else if (shape.dir === 'triUp') {
                // /\ triangle (14): up then down
                const mid = ts + (te - ts) / 2;
                env.gain.setValueAtTime(0.001, ts);
                env.gain.linearRampToValueAtTime(1.0, mid);
                env.gain.linearRampToValueAtTime(0.001, te);
            }
        }
        return env;
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
            const dur = (key === 'CROWD_BOO') ? 0.8 : 0.5;
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, t0);
            osc.frequency.linearRampToValueAtTime(110, t0 + dur);
            const env = mkEnv(0.30, dur);
            osc.connect(env);
            osc.start(t0); osc.stop(t0 + dur + 0.05);
            SfxEditor.activeNodes.push(osc);
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

        return 0;
    }

    static stop() {
        if (SfxEditor._loopTimer != null) {
            clearTimeout(SfxEditor._loopTimer);
            SfxEditor._loopTimer = null;
        }
        for (const n of SfxEditor.activeNodes) {
            try { n.stop(SfxEditor.ctx?.currentTime ?? 0); } catch (_) { /* already stopped */ }
        }
        SfxEditor.activeNodes = [];
        SfxEditor.playing = false;
        SfxEditor._setPlayButtonState(false);
    }

    // ── WAV export ─────────────────────────────────────────────────────────

    /** Approximate tail durations matching _scheduleExecTail's hardcoded values. */
    static _execTailDurSec(key) {
        if (key === 'CROWD_CHEER') return 1.0;
        if (key === 'CROWD_GROAN') return 0.5;
        if (key === 'CROWD_BOO')   return 0.8;
        if (key === 'WHISTLE')     return 0.4;
        if (key === 'PLAY_NOTE')   return 0.3;
        return 0;
    }

    /**
     * Render the current patch (one iteration, no loop) to an offline AudioBuffer.
     * Uses the same scheduling code as play() by temporarily swapping the
     * static ctx/masterGain/noiseBuffer for offline equivalents. Returns null
     * on failure or empty patch.
     */
    static async renderToBuffer() {
        if (!SfxEditor.patch) return null;
        const p = SfxEditor.patch;
        const durSec = p.durationMs / 1000;
        const tailDur = SfxEditor.appendExec ? SfxEditor._execTailDurSec(SfxEditor.appendExec) : 0;
        const totalDur = durSec + tailDur + 0.1;  // pad for envelope release

        const sampleRate = 44100;
        const offlineCtx = new OfflineAudioContext(
            1,                                                 // mono
            Math.max(1, Math.ceil(totalDur * sampleRate)),
            sampleRate
        );
        const offlineGain = offlineCtx.createGain();
        offlineGain.gain.value = 0.5;
        offlineGain.connect(offlineCtx.destination);
        const offlineNoise = buildNoiseBuffer(offlineCtx);

        // Save real audio state — we restore it after rendering whether
        // startRendering() succeeds or throws.
        const realCtx   = SfxEditor.ctx;
        const realGain  = SfxEditor.masterGain;
        const realNoise = SfxEditor.noiseBuffer;
        const realNodes = SfxEditor.activeNodes;

        SfxEditor.ctx          = offlineCtx;
        SfxEditor.masterGain   = offlineGain;
        SfxEditor.noiseBuffer  = offlineNoise;
        SfxEditor.activeNodes  = [];  // scratch; not used after rendering completes

        try {
            const t0 = 0.02;
            let segStart = t0;
            for (const seg of p.segments) {
                const segDur = durSec * (seg.durationFraction || 1);
                SfxEditor._scheduleSegment(seg, p, segStart, segDur);
                segStart += segDur;
            }
            if (SfxEditor.appendExec && EXEC_CALLS[SfxEditor.appendExec]) {
                SfxEditor._scheduleExecTail(SfxEditor.appendExec, t0 + durSec);
            }
            return await offlineCtx.startRendering();
        } finally {
            SfxEditor.ctx          = realCtx;
            SfxEditor.masterGain   = realGain;
            SfxEditor.noiseBuffer  = realNoise;
            SfxEditor.activeNodes  = realNodes;
        }
    }

    static async downloadWav() {
        try {
            SfxEditor._showStatus('Rendering WAV…');
            const buffer = await SfxEditor.renderToBuffer();
            if (!buffer) {
                SfxEditor._showStatus('Nothing to render');
                return;
            }
            const blob = audioBufferToWav(buffer);
            const presetName = SfxEditor.currentId
                ? PRESETS.find(x => x.id === SfxEditor.currentId)?.name || 'custom-sfx'
                : 'custom-sfx';
            const fname = `${slugifyFilename(presetName)}.wav`;
            downloadBlob(blob, fname);
            SfxEditor._showStatus(`Downloaded ${fname}`);
        } catch (e) {
            console.error('SfxEditor.downloadWav failed:', e);
            SfxEditor._showStatus('WAV render failed — see console');
        }
    }

    static _buildFreqRamp(start, end, steps, shape) {
        const out = [];
        if (steps === 1) return [start];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            let v;
            if (shape === 'exp') {
                const a = Math.max(1, start), b = Math.max(1, end);
                v = a * Math.pow(b / a, t);
            } else if (shape === 'quadratic') {
                // Toledo's `state*state` curve — accelerating sweep
                v = start + (end - start) * (t * t);
            } else {
                v = start + (end - start) * t;
            }
            out.push(v);
        }
        return out;
    }

    static _ayVolToGain(vol) {
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

        // HW envelope setup (one-time, before segments).
        if (p.envMode === 'hw') {
            const lo = (p.envPeriod & 0xFF);
            const hi = (p.envPeriod >> 8) & 0xFF;
            const shapeInfo = ENV_SHAPES[p.envShape ?? 0]?.name || '';
            lines.push(`SOUND ${REG.ENV_LO}, ${lo}\t' envelope period lo`);
            lines.push(`SOUND ${REG.ENV_HI}, ${hi}\t' envelope period hi (cycle ≈ ${((256 * p.envPeriod) / AY_CLOCK * 1000).toFixed(1)}ms)`);
            lines.push(`SOUND ${REG.ENV_SHAPE}, ${p.envShape}\t' envelope shape: ${shapeInfo}`);
            lines.push('');
        }

        if (p.loop) {
            lines.push(`' Loop label — ${SfxEditor.appendExec ? 'EXEC tail breaks the loop' : 'remove the GOTO below for one-shot'}`);
            lines.push('sfx_loop:');
        }

        // Emit each segment in turn.
        const totalTicks = Math.max(1, Math.round(p.durationMs / FRAME_MS));
        for (let segIdx = 0; segIdx < p.segments.length; segIdx++) {
            const seg = p.segments[segIdx];
            const segTicks = Math.max(1, Math.round(totalTicks * seg.durationFraction));
            if (p.segments.length > 1) {
                lines.push('');
                lines.push(`' ── Phase ${segIdx + 1}/${p.segments.length} (${segTicks} ticks ≈ ${(segTicks * FRAME_MS | 0)}ms) ──`);
            }
            SfxEditor._emitSegment(lines, seg, p, segTicks);
        }

        // Silence (unless looping — let the next iteration overwrite).
        if (!p.loop) {
            lines.push('');
            lines.push(`SOUND ${REG.VOL_A + p.channel}, 0\t' silence ch.${CH_NAMES[p.channel]}`);
        }

        // Loop back.
        if (p.loop) {
            lines.push('GOTO sfx_loop');
        }

        // Optional EXEC tail.
        if (SfxEditor.appendExec && EXEC_CALLS[SfxEditor.appendExec]) {
            lines.push('');
            lines.push(`' ── EXEC tail (composition: SFX then ${SfxEditor.appendExec}) ──`);
            lines.push(EXEC_CALLS[SfxEditor.appendExec].intybasicCall);
        }

        return lines.join('\n');
    }

    /** Emit IntyBASIC SOUND statements for one segment. */
    static _emitSegment(lines, seg, p, ticks) {
        const toneEnabled = (seg.freqStart > 0 || seg.freqEnd > 0);

        // Mixer for this segment.
        lines.push(`SOUND ${REG.MIXER}, ${mixerByte(p.channel, toneEnabled, seg.noise)}\t' mixer: ${toneEnabled ? 'tone' : ''}${toneEnabled && seg.noise ? '+' : ''}${seg.noise ? 'noise' : ''} on ch.${CH_NAMES[p.channel]}`);

        // Initial noise period (if enabled).
        if (seg.noise) {
            lines.push(`SOUND ${REG.NOISE}, ${seg.noisePeriod}\t' noise period`);
        }

        // Volume. In HW envelope mode, write 16 (bit 4 = use envelope generator).
        const volReg = REG.VOL_A + p.channel;
        if (p.envMode === 'hw') {
            lines.push(`SOUND ${volReg}, 16\t' ch.${CH_NAMES[p.channel]} routed via envelope generator`);
        } else {
            lines.push(`SOUND ${volReg}, ${seg.volStart}\t' ch.${CH_NAMES[p.channel]} volume (manual)`);
        }

        const steps = Math.max(1, seg.steps);
        const ticksPerStep = Math.max(1, Math.round(ticks / steps));
        const freqs = SfxEditor._buildFreqRamp(seg.freqStart, seg.freqEnd, steps, seg.sweepShape);
        const noisePeriods = SfxEditor._buildLinearRamp(seg.noisePeriod, seg.noisePeriodEnd ?? seg.noisePeriod, steps);

        const toneLoReg = REG.TONE_A_LO + (p.channel * 2);
        const toneHiReg = toneLoReg + 1;

        for (let i = 0; i < steps; i++) {
            // Tone freq
            if (toneEnabled) {
                const period = hzToPeriod(freqs[i]);
                const lo = period & 0xFF;
                const hi = (period >> 8) & 0x0F;
                lines.push(`SOUND ${toneLoReg}, ${lo}\t' tone ≈ ${Math.round(freqs[i])}Hz (step ${i + 1}/${steps})`);
                if (hi > 0) lines.push(`SOUND ${toneHiReg}, ${hi}`);
            }
            // Noise period (only if it changes across steps)
            if (seg.noise && noisePeriods[i] !== seg.noisePeriod && i > 0) {
                lines.push(`SOUND ${REG.NOISE}, ${Math.round(noisePeriods[i])}\t' noise period sweep`);
            }
            // Manual envelope: per-step volume taper (skip in HW envelope mode).
            if (p.envMode !== 'hw') {
                const t = steps === 1 ? 1 : i / (steps - 1);
                const stepVol = Math.round(seg.volStart + (seg.volEnd - seg.volStart) * t);
                if (i > 0 && stepVol !== Math.round(seg.volStart + (seg.volEnd - seg.volStart) * ((i - 1) / Math.max(1, steps - 1)))) {
                    lines.push(`SOUND ${volReg}, ${Math.max(0, stepVol)}`);
                }
            }
            lines.push(`WAIT ${ticksPerStep}`);
        }
    }

    static _buildLinearRamp(start, end, steps) {
        if (steps === 1 || start === end) return new Array(steps).fill(start);
        const out = [];
        for (let i = 0; i < steps; i++) {
            const t = i / (steps - 1);
            out.push(start + (end - start) * t);
        }
        return out;
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
        if (onlyOutput) return;
        const container = document.getElementById('sfx-designer');
        if (!container) return;
        const raw = SfxEditor.rawPatch;
        if (!raw) return;

        // Multi-segment patches don't get the per-segment slider UI in v1.5
        // (the segments are interrelated and a flat slider can't represent
        // them coherently). Show a read-only JSON view so the user can still
        // inspect and copy.
        if (SfxEditor.isMultiSegment()) {
            container.innerHTML = `
                <div class="sfx-multi-notice">
                    <strong>🧬 Multi-phase preset (${raw.segments.length} phases)</strong>
                    <p class="sfx-hint">This preset chains multiple PSG configurations end-to-end.
                    Inline per-phase sliders coming in v2 — for now, the preview and IntyBASIC output
                    fully reflect the design. Tweak the JSON below or duplicate the preset to start
                    a flat custom design.</p>
                </div>
                <div class="sfx-designer-section">PATCH JSON (read-only)</div>
                <pre class="sfx-json-view">${JSON.stringify(raw, null, 2)}</pre>
                ${SfxEditor._renderTopLevelControls(raw)}
            `;
            return;
        }

        // Flat / single-segment patch UI (existing behaviour, expanded with
        // HW envelope + loop sections).
        container.innerHTML = `
            ${SfxEditor._renderTopLevelControls(raw)}

            <div class="sfx-designer-section">TONE</div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Freq start</label>
                <input type="range" min="0" max="4000" step="10" value="${raw.freqStart ?? 0}"
                       oninput="sfxUpdate('freqStart', this.value); document.getElementById('sfx-fs-val').textContent = this.value + 'Hz'">
                <span class="sfx-designer-value" id="sfx-fs-val">${raw.freqStart ?? 0}Hz</span>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Freq end</label>
                <input type="range" min="0" max="4000" step="10" value="${raw.freqEnd ?? 0}"
                       oninput="sfxUpdate('freqEnd', this.value); document.getElementById('sfx-fe-val').textContent = this.value + 'Hz'">
                <span class="sfx-designer-value" id="sfx-fe-val">${raw.freqEnd ?? 0}Hz</span>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Sweep</label>
                <select class="form-control sfx-select" onchange="sfxUpdate('sweepShape', this.value)">
                    <option value="step"      ${raw.sweepShape === 'step' ? 'selected' : ''}>Step</option>
                    <option value="linear"    ${raw.sweepShape === 'linear' ? 'selected' : ''}>Linear</option>
                    <option value="exp"       ${raw.sweepShape === 'exp' ? 'selected' : ''}>Exponential</option>
                    <option value="quadratic" ${raw.sweepShape === 'quadratic' ? 'selected' : ''}>Quadratic (Toledo state²)</option>
                </select>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Steps</label>
                <input type="range" min="1" max="32" step="1" value="${raw.steps ?? 1}"
                       oninput="sfxUpdate('steps', this.value); document.getElementById('sfx-st-val').textContent = this.value">
                <span class="sfx-designer-value" id="sfx-st-val">${raw.steps ?? 1}</span>
            </div>

            <div class="sfx-designer-section">NOISE</div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Enabled</label>
                <input type="checkbox" ${raw.noise ? 'checked' : ''}
                       onchange="sfxUpdate('noise', this.checked)">
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Period</label>
                <input type="range" min="0" max="31" step="1" value="${raw.noisePeriod ?? 16}"
                       oninput="sfxUpdate('noisePeriod', this.value); document.getElementById('sfx-np-val').textContent = this.value">
                <span class="sfx-designer-value" id="sfx-np-val">${raw.noisePeriod ?? 16}</span>
            </div>

            <div class="sfx-designer-section">ENVELOPE</div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Mode</label>
                <select class="form-control sfx-select" onchange="sfxUpdate('envMode', this.value)">
                    <option value="manual" ${(raw.envMode ?? 'manual') === 'manual' ? 'selected' : ''}>Manual (vol fade)</option>
                    <option value="hw"     ${raw.envMode === 'hw' ? 'selected' : ''}>HW envelope generator</option>
                </select>
            </div>
            ${(raw.envMode === 'hw') ? `
                <div class="sfx-designer-row">
                    <label class="sfx-designer-label">Shape</label>
                    <select class="form-control sfx-select" onchange="sfxUpdate('envShape', this.value)">
                        ${Object.entries(ENV_SHAPES).map(([k, v]) =>
                            `<option value="${k}" ${(raw.envShape ?? 0) == k ? 'selected' : ''}>${k} — ${v.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="sfx-designer-row">
                    <label class="sfx-designer-label">Period</label>
                    <input type="range" min="1" max="65535" step="1" value="${raw.envPeriod ?? 1000}"
                           oninput="sfxUpdate('envPeriod', this.value); document.getElementById('sfx-ep-val').textContent = this.value + ' (≈' + (256*this.value/${AY_CLOCK}*1000).toFixed(1) + 'ms cycle)'">
                    <span class="sfx-designer-value" id="sfx-ep-val">${raw.envPeriod ?? 1000}</span>
                </div>
                <p class="sfx-hint">HW envelope drives volume from the AY chip; channel volume register is set to 16 (use-envelope bit). Most distinctive shapes: 8/12 (sawtooth loops), 10/14 (triangle loops), 0/9/11 (single decay).</p>
            ` : `
                <div class="sfx-designer-row">
                    <label class="sfx-designer-label">Volume</label>
                    <input type="range" min="0" max="15" step="1" value="${raw.volume ?? 12}"
                           oninput="sfxUpdate('volume', this.value); document.getElementById('sfx-vol-val').textContent = this.value">
                    <span class="sfx-designer-value" id="sfx-vol-val">${raw.volume ?? 12}</span>
                </div>
                <p class="sfx-hint">Manual envelope: linear volume fade from peak to 0 across all steps.</p>
            `}
        `;
    }

    /** Channel / duration / loop controls — shown above both flat and multi-segment patches. */
    static _renderTopLevelControls(raw) {
        return `
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Channel</label>
                <select class="form-control sfx-select" onchange="sfxUpdate('channel', this.value)">
                    <option value="0" ${raw.channel === 0 ? 'selected' : ''}>A</option>
                    <option value="1" ${raw.channel === 1 ? 'selected' : ''}>B</option>
                    <option value="2" ${raw.channel === 2 ? 'selected' : ''}>C</option>
                </select>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label">Duration</label>
                <input type="range" min="20" max="4000" step="10" value="${raw.durationMs}"
                       oninput="sfxUpdate('durationMs', this.value); document.getElementById('sfx-dur-val').textContent = this.value + 'ms'">
                <span class="sfx-designer-value" id="sfx-dur-val">${raw.durationMs}ms</span>
            </div>
            <div class="sfx-designer-row">
                <label class="sfx-designer-label" data-tooltip="When checked, the SFX re-triggers in the synth preview AND the generated IntyBASIC code wraps in a sfx_loop: label + GOTO. Use for ambient drones, sirens, hover sounds.">Loop</label>
                <input type="checkbox" ${raw.loop ? 'checked' : ''}
                       onchange="sfxUpdate('loop', this.checked)">
            </div>
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
