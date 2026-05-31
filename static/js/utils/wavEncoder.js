/**
 * wavEncoder.js — Convert a Web Audio AudioBuffer into a downloadable WAV blob.
 *
 * Used by the SFX Lab and Music Studio tabs to render their previews via
 * OfflineAudioContext and save the result as 16-bit PCM WAV. The encoder
 * itself is format-agnostic — it accepts any AudioBuffer.
 *
 * Output format: standard 44-byte RIFF/WAVE header + interleaved 16-bit
 * little-endian PCM samples. Loads cleanly into any DAW, browser, or the
 * IntelliVoice WAV pipeline already used elsewhere in the project.
 */

/**
 * Encode an AudioBuffer as a 16-bit PCM WAV Blob.
 * @param {AudioBuffer} audioBuffer
 * @returns {Blob} audio/wav blob, ready for download or upload
 */
export function audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate  = audioBuffer.sampleRate;
    const numSamples  = audioBuffer.length;
    const bytesPerSample = 2;  // 16-bit PCM
    const dataSize  = numSamples * numChannels * bytesPerSample;
    const headerSize = 44;
    const fileSize   = headerSize + dataSize;

    const buf  = new ArrayBuffer(fileSize);
    const view = new DataView(buf);

    const writeStr = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    // RIFF chunk descriptor
    writeStr(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeStr(8, 'WAVE');

    // "fmt " sub-chunk
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);                                   // PCM fmt chunk size
    view.setUint16(20, 1, true);                                    // audio format = PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);   // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true);                // block align
    view.setUint16(34, 16, true);                                          // bits/sample

    // "data" sub-chunk
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    // Pull channel data once (getChannelData copies internally otherwise).
    const channels = [];
    for (let c = 0; c < numChannels; c++) channels.push(audioBuffer.getChannelData(c));

    // Interleave + convert float32 [-1, 1] → int16 little-endian.
    let off = 44;
    for (let i = 0; i < numSamples; i++) {
        for (let c = 0; c < numChannels; c++) {
            let s = Math.max(-1, Math.min(1, channels[c][i]));
            // Asymmetric scale: negative range is 0x8000, positive is 0x7FFF.
            s = s < 0 ? s * 0x8000 : s * 0x7FFF;
            view.setInt16(off, s, true);
            off += 2;
        }
    }

    return new Blob([buf], { type: 'audio/wav' });
}

/**
 * Trigger a browser download for a Blob. Cleans up the object URL afterwards.
 * @param {Blob}   blob
 * @param {string} filename — e.g. "astro-boom.wav"
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke a tick later so the browser has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Slugify a name into a safe filename fragment (lowercase, dash-separated).
 * @param {string} name
 * @returns {string}
 */
export function slugifyFilename(name) {
    return String(name || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        || 'untitled';
}
