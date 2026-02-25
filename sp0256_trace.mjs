/**
 * sp0256_trace.mjs — Trace specific ALD indices
 */

import { SP0256 } from './static/js/modules/sp0256.js';

const testIndices = [0, 1, 2, 3, 4, 5, 6, 44, 45, 46, 47, 48];

for (const idx of testIndices) {
    const synth = new SP0256();
    synth.reset();
    const { trace, samples } = synth.diagnose(idx);
    const ms = (samples / SP0256.SAMPLE_RATE * 1000).toFixed(1);
    console.log(`\n=== ALD ${idx} → ${samples} samples / ${ms}ms ===`);
    for (const line of trace) console.log(line);
}
