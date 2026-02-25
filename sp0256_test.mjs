/**
 * sp0256_test.mjs — Diagnostic test for SP0256 synthesis
 * Run with: node sp0256_test.mjs
 */

import { SP0256 } from './static/js/modules/sp0256.js';

// Test HH1 (index 27), EH (index 7), LL (index 44), AO (index 23)
const testAllophones = [27, 7, 44, 23];
const names = { 27: 'HH1', 7: 'EH', 44: 'LL', 23: 'AO' };

console.log('=== SP0256 Diagnostic Trace ===\n');

for (const aldIndex of testAllophones) {
    const synth = new SP0256();
    synth.reset();
    const { trace, samples } = synth.diagnose(aldIndex);
    const ms = (samples / SP0256.SAMPLE_RATE * 1000).toFixed(1);
    console.log(`\n=== ALD ${aldIndex} (${names[aldIndex] ?? '?'}) → ${samples} samples / ${ms}ms ===`);
    for (const line of trace) {
        console.log(line);
    }
}

// Also test the continuous sequence (one SP0256 instance, state flows)
console.log('\n\n=== Continuous sequence: HH1, EH, LL, AO ===');
{
    const synth = new SP0256();
    synth.reset();
    let totalSamples = 0;
    for (const aldIndex of testAllophones) {
        synth.ald(aldIndex);
        const raw = synth.generateAllophone(80000);
        totalSamples += raw.length;
        const ms = (raw.length / SP0256.SAMPLE_RATE * 1000).toFixed(1);
        console.log(`  ALD ${aldIndex} (${names[aldIndex]}): ${raw.length} samples / ${ms}ms`);
        // Print a quick amplitude histogram
        if (raw.length > 0) {
            const absMax = raw.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
            const rms = Math.sqrt(raw.reduce((s, v) => s + v*v, 0) / raw.length);
            console.log(`    abs_max=${absMax.toFixed(4)}  rms=${rms.toFixed(4)}`);
        }
    }
    console.log(`Total: ${totalSamples} samples / ${(totalSamples / SP0256.SAMPLE_RATE * 1000).toFixed(0)}ms`);
}
