/**
 * sp0256_survey.mjs — Survey all 64 ALD indices
 * Prints duration and amplitude info for each allophone.
 * Run with: node sp0256_survey.mjs
 */

import { SP0256 } from './static/js/modules/sp0256.js';

const SR = SP0256.SAMPLE_RATE;

console.log('ALD | Samples | ms    | rms    | Jump target');
console.log('----+---------+-------+--------+-----------');

for (let idx = 0; idx < 64; idx++) {
    const synth = new SP0256();
    synth.reset();
    synth.trace = [];
    synth.ald(idx);
    const raw = synth.generateAllophone(80000);
    const trace = synth.trace;
    synth.trace = null;

    const ms = (raw.length / SR * 1000).toFixed(1);
    const rms = raw.length
        ? Math.sqrt(raw.reduce((s, v) => s + v*v, 0) / raw.length).toFixed(4)
        : '0.0000';

    // First JMP target from trace
    const jmpLine = trace.find(l => l.includes('JMP'));
    const jumpByte = jmpLine ? jmpLine.match(/byte (\d+)/)?.[1] : '?';

    console.log(`${String(idx).padStart(3)} | ${String(raw.length).padStart(7)} | ${ms.padStart(5)} | ${rms} | byte ${jumpByte}`);
}
