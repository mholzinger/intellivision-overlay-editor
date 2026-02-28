/**
 * voiceEditor.js — IntelliVoice Builder
 *
 * Assembles SP0256-AL2 allophone sequences, synthesizes them using the
 * sp0256.js LPC engine, and outputs IntyBASIC VOICE statements.
 */

import { SP0256 } from './sp0256.js';
import {
    ALLOPHONES, ALLOPHONE_BY_CODE, ALLOPHONE_BY_INDEX,
    ALLOPHONE_GROUPS, WORD_LOOKUP
} from '../data/allophonesDict.js';
import { EXTENDED_WORDS } from '../data/wordDict.js';

// Merged word lookup: built-in + extended vocabulary (built-in takes priority).
const ALL_WORDS = { ...EXTENDED_WORDS, ...WORD_LOOKUP };

// Path to pre-recorded SP0256-AL2 allophone WAV files (captured via jzIntv).
const AUDIO_PATH = '/static/audio/allophones/';

// IntyBASIC uses different names for three allophones.
const IB_NAMES = { AE: 'AE1', NG: 'NG1', OR: 'OR2' };

// Reverse mapping: IntyBASIC name → canonical code used in ALLOPHONE_BY_CODE.
const IB_NAMES_REV = { AE1: 'AE', NG1: 'NG', OR2: 'OR' };

// localStorage key for the user's custom word dictionary.
const USER_DICT_KEY = 'voiceUserDict';

export class VoiceEditor {
    static sequence       = [];     // Array of allophone ALD indices in order
    static audioCtx       = null;
    static synth          = null;   // SP0256 instance (kept for diagnostics)
    static wavCache       = {};     // AudioBuffer cache keyed by allophone code
    static _playbackSrcs  = [];     // Active AudioBufferSourceNodes
    static playing        = false;
    static channel        = 0;      // 0 = left, 1 = right
    static userDict       = {};     // User-defined word → allophone-code[] entries

    // =========================================================================
    //  INIT
    // =========================================================================
    static init() {
        VoiceEditor.synth = new SP0256();
        VoiceEditor._loadUserDict();
        VoiceEditor._renderAll();
        VoiceEditor._updateOutput();
    }

    // =========================================================================
    //  SEQUENCE MANAGEMENT
    // =========================================================================
    static addAllophone(indexOrCode) {
        const a = typeof indexOrCode === 'string'
            ? ALLOPHONE_BY_CODE[indexOrCode]
            : ALLOPHONE_BY_INDEX[indexOrCode];
        if (!a) return;
        VoiceEditor.sequence.push(a.index);
        VoiceEditor._renderSequencer();
        VoiceEditor._updateOutput();
    }

    static removeAllophone(seqPos) {
        VoiceEditor.sequence.splice(seqPos, 1);
        VoiceEditor._renderSequencer();
        VoiceEditor._updateOutput();
    }

    static clearSequence() {
        VoiceEditor.sequence = [];
        VoiceEditor._renderSequencer();
        VoiceEditor._updateOutput();
    }

    static moveAllophone(from, to) {
        if (from === to) return;
        const [item] = VoiceEditor.sequence.splice(from, 1);
        VoiceEditor.sequence.splice(to, 0, item);
        VoiceEditor._renderSequencer();
        VoiceEditor._updateOutput();
    }

    static wordToAllophones(word) {
        const key = word.toLowerCase().trim();
        // User dict takes priority, then merged built-in + extended dict.
        const seq = VoiceEditor.userDict[key] ?? ALL_WORDS[key];
        if (!seq) { VoiceEditor._showStatus(`Unknown word: "${word}" — try typing individual allophones or define it in Custom Dictionary`); return; }
        for (const code of seq) VoiceEditor.addAllophone(code);
        VoiceEditor._showStatus(`Added "${word}" → ${seq.join(', ')}`);
    }

    // =========================================================================
    //  AUDIO PLAYBACK
    // =========================================================================

    /** Ensure AudioContext is created (or recreated after close). */
    static _ensureCtx() {
        if (!VoiceEditor.audioCtx || VoiceEditor.audioCtx.state === 'closed') {
            VoiceEditor.audioCtx = new AudioContext();
            VoiceEditor.wavCache = {};  // buffers from old context are invalid
        }
        return VoiceEditor.audioCtx;
    }

    /** Fetch a pre-recorded WAV file and decode it into an AudioBuffer (cached). */
    static async _loadWav(code) {
        if (VoiceEditor.wavCache[code]) return VoiceEditor.wavCache[code];
        try {
            const resp = await fetch(`${AUDIO_PATH}${code}.wav`);
            if (!resp.ok) return null;
            const arrayBuf = await resp.arrayBuffer();
            const audioBuf = await VoiceEditor.audioCtx.decodeAudioData(arrayBuf);
            VoiceEditor.wavCache[code] = audioBuf;
            return audioBuf;
        } catch (e) {
            console.warn(`VoiceEditor: cannot load ${code}.wav:`, e);
            return null;
        }
    }

    /** Play the full sequence by chaining pre-recorded WAV clips. */
    static async playSequence() {
        if (!VoiceEditor.sequence.length) return;
        VoiceEditor.stopPlayback();

        const ctx = VoiceEditor._ensureCtx();
        if (ctx.state === 'suspended') await ctx.resume();

        VoiceEditor.playing = true;
        VoiceEditor._updatePlayButtons(true);
        VoiceEditor._playbackSrcs = [];

        // Load all buffers first so scheduling is tight.
        const buffers = [];
        for (const aldIdx of VoiceEditor.sequence) {
            const a = ALLOPHONE_BY_INDEX[aldIdx];
            if (!a) continue;
            const buf = await VoiceEditor._loadWav(a.code);
            if (buf) buffers.push(buf);
        }

        if (!buffers.length) {
            VoiceEditor.playing = false;
            VoiceEditor._updatePlayButtons(false);
            return;
        }

        let t = ctx.currentTime + 0.05;
        let totalDur = 0;
        for (const buf of buffers) {
            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);
            src.start(t);
            VoiceEditor._playbackSrcs.push(src);
            t += buf.duration;
            totalDur += buf.duration;
        }

        setTimeout(() => {
            VoiceEditor.playing = false;
            VoiceEditor._playbackSrcs = [];
            VoiceEditor._updatePlayButtons(false);
        }, (totalDur + 0.2) * 1000);
    }

    static stopPlayback() {
        for (const src of VoiceEditor._playbackSrcs) {
            try { src.stop(); } catch (e) { /* already stopped */ }
        }
        VoiceEditor._playbackSrcs = [];
        VoiceEditor.playing = false;
        VoiceEditor._updatePlayButtons(false);
    }

    /** Play a single allophone preview (double-click in library). */
    static async playOne(aldIndex) {
        const ctx = VoiceEditor._ensureCtx();
        if (ctx.state === 'suspended') await ctx.resume();
        const a = ALLOPHONE_BY_INDEX[aldIndex];
        if (!a) return;
        const buf = await VoiceEditor._loadWav(a.code);
        if (!buf) return;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
    }

    // =========================================================================
    //  PASTE VOICE DATA
    // =========================================================================

    /**
     * Parse an IntyBASIC VOICE statement into an array of ALD indices.
     * Accepts:  "VOICE HH1,EH,LL,OW,0"  or  "HH1,EH,LL,OW,0"  or  "HH1,EH,LL,OW"
     * Returns array of valid ALD indices; unknown tokens are skipped with a warning.
     */
    static parseVoiceText(text) {
        const cleaned = text.trim().replace(/^VOICE\s+/i, '');
        const tokens  = cleaned.split(/[\s,]+/).filter(Boolean);
        const indices = [];
        const skipped = [];

        for (const tok of tokens) {
            if (tok === '0') continue;                        // terminator
            const canonical = IB_NAMES_REV[tok] ?? tok;      // AE1→AE, NG1→NG, OR2→OR
            const a = ALLOPHONE_BY_CODE[canonical];
            if (a) {
                indices.push(a.index);
            } else {
                skipped.push(tok);
            }
        }

        if (skipped.length) {
            console.warn('VoiceEditor.parseVoiceText: unknown tokens skipped:', skipped);
        }
        return indices;
    }

    /** Replace the current sequence with parsed VOICE data. */
    static loadVoiceText(text, append = false) {
        const indices = VoiceEditor.parseVoiceText(text);
        if (!indices.length) {
            VoiceEditor._showStatus('No valid allophones found in pasted text');
            return;
        }
        if (append) {
            VoiceEditor.sequence.push(...indices);
        } else {
            VoiceEditor.sequence = indices;
        }
        VoiceEditor._renderSequencer();
        VoiceEditor._updateOutput();
        VoiceEditor._showStatus(`${append ? 'Appended' : 'Loaded'} ${indices.length} allophone${indices.length !== 1 ? 's' : ''}`);
    }

    /** Called when the paste panel "Replace" button is clicked. */
    static pasteReplace() {
        const ta = document.getElementById('voice-paste-input');
        if (!ta) return;
        const text = ta.value.trim();
        if (!text) return;
        VoiceEditor.loadVoiceText(text, false);
        ta.value = '';
    }

    /** Called when the paste panel "Append" button is clicked. */
    static pasteAppend() {
        const ta = document.getElementById('voice-paste-input');
        if (!ta) return;
        const text = ta.value.trim();
        if (!text) return;
        VoiceEditor.loadVoiceText(text, true);
        ta.value = '';
    }

    // =========================================================================
    //  USER CUSTOM DICTIONARY
    // =========================================================================

    /** Load the user dict from localStorage. */
    static _loadUserDict() {
        try {
            const raw = localStorage.getItem(USER_DICT_KEY);
            VoiceEditor.userDict = raw ? JSON.parse(raw) : {};
        } catch (e) {
            VoiceEditor.userDict = {};
        }
    }

    /** Save the user dict to localStorage and refresh the textarea. */
    static _saveUserDict() {
        try {
            localStorage.setItem(USER_DICT_KEY, JSON.stringify(VoiceEditor.userDict));
        } catch (e) {
            console.warn('VoiceEditor: cannot save user dict:', e);
        }
        VoiceEditor._renderUserDict();
    }

    /**
     * Render the user dictionary textarea.
     * Format: one entry per line —  word = HH1,EH,LL,OW
     */
    static _renderUserDict() {
        const ta = document.getElementById('voice-user-dict');
        if (!ta) return;
        const lines = Object.entries(VoiceEditor.userDict)
            .map(([word, codes]) => `${word} = ${codes.join(',')}`)
            .sort();
        ta.value = lines.join('\n');
    }

    /**
     * Parse the user dict textarea and save.
     * Accepted formats per line:
     *   hello = HH1,EH,LL,OW
     *   hello = VOICE HH1,EH,LL,OW,0
     * Lines that don't parse cleanly are ignored.
     */
    static saveUserDictFromTextarea() {
        const ta = document.getElementById('voice-user-dict');
        if (!ta) return;
        const newDict = {};
        let saved = 0, skipped = 0;

        for (const rawLine of ta.value.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;

            const eqIdx = line.indexOf('=');
            if (eqIdx < 1) { skipped++; continue; }

            const word   = line.slice(0, eqIdx).trim().toLowerCase();
            const rhs    = line.slice(eqIdx + 1).trim();
            const indices = VoiceEditor.parseVoiceText(rhs);

            if (word && indices.length) {
                // Store as code strings, not indices
                newDict[word] = indices
                    .map(i => ALLOPHONE_BY_INDEX[i]?.code)
                    .filter(Boolean);
                saved++;
            } else {
                skipped++;
            }
        }

        VoiceEditor.userDict = newDict;
        VoiceEditor._saveUserDict();
        VoiceEditor._showStatus(`Saved ${saved} ${saved === 1 ? 'entry' : 'entries'}${skipped ? `, ${skipped} skipped` : ''}`);
    }

    /** Clear the entire user dictionary. */
    static clearUserDict() {
        VoiceEditor.userDict = {};
        VoiceEditor._saveUserDict();
        VoiceEditor._showStatus('Custom dictionary cleared');
    }

    // =========================================================================
    //  DIAGNOSTICS
    // =========================================================================
    /**
     * Run SP0256 execution trace for every allophone in the current sequence
     * (or a set of specific indices) and display the results in #voice-diag.
     */
    static runDiagnostics(indices) {
        const targets = indices ?? VoiceEditor.sequence;
        if (!targets.length) { VoiceEditor._showStatus('Add allophones to diagnose'); return; }

        const lines = [];
        for (const idx of targets) {
            const a = ALLOPHONE_BY_INDEX[idx];
            const label = a ? `${a.code}(${idx})` : `?(${idx})`;
            const { trace, samples } = VoiceEditor.synth.diagnose(idx);
            lines.push(`── ${label}  →  ${samples} samples (${(samples / SP0256.SAMPLE_RATE * 1000).toFixed(0)}ms) ──`);
            for (const t of trace) lines.push(t);
        }

        const el = document.getElementById('voice-diag');
        if (el) {
            el.textContent = lines.join('\n');
            el.style.display = 'block';
        } else {
            console.log(lines.join('\n'));
        }
    }

    // =========================================================================
    //  OUTPUT GENERATION
    // =========================================================================
    static generateOutput() {
        if (!VoiceEditor.sequence.length) return '';
        const names = VoiceEditor.sequence
            .map(idx => {
                const a = ALLOPHONE_BY_INDEX[idx];
                return a ? (IB_NAMES[a.code] || a.code) : null;
            })
            .filter(Boolean);
        return names.length ? `VOICE ${names.join(',')},0` : '';
    }

    static copyOutput() {
        const text = VoiceEditor.generateOutput();
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            VoiceEditor._showStatus('Copied to clipboard!');
        }).catch(() => {
            VoiceEditor._showStatus('Copy failed — select and copy manually');
        });
    }

    static setChannel(ch) {
        VoiceEditor.channel = ch ? 1 : 0;
        VoiceEditor._updateOutput();
    }

    // =========================================================================
    //  RENDERING
    // =========================================================================
    static _renderAll() {
        VoiceEditor._renderSequencer();
        VoiceEditor._renderLibrary();
        VoiceEditor._renderUserDict();
    }

    static _renderSequencer() {
        const container = document.getElementById('voice-sequencer');
        if (!container) return;
        container.innerHTML = '';

        if (!VoiceEditor.sequence.length) {
            container.innerHTML = '<span class="voice-seq-empty">Click allophones below to build a sequence</span>';
            return;
        }

        VoiceEditor.sequence.forEach((idx, pos) => {
            const a    = ALLOPHONE_BY_INDEX[idx];
            const code = a ? a.code : `?${idx}`;
            const chip = document.createElement('div');
            chip.className = `voice-chip voice-chip-${a?.group ?? 'pause'}`;
            chip.title     = a ? a.desc : '';
            chip.draggable = true;
            chip.dataset.pos = pos;

            chip.innerHTML = `
                <span class="voice-chip-code">${code}</span>
                <button class="voice-chip-del" onclick="voiceRemoveAt(${pos})" title="Remove">×</button>
            `;

            // Drag-to-reorder
            chip.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', String(pos));
                chip.classList.add('dragging');
            });
            chip.addEventListener('dragend', () => chip.classList.remove('dragging'));
            chip.addEventListener('dragover', (e) => { e.preventDefault(); chip.classList.add('drag-over'); });
            chip.addEventListener('dragleave', () => chip.classList.remove('drag-over'));
            chip.addEventListener('drop', (e) => {
                e.preventDefault();
                chip.classList.remove('drag-over');
                const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                VoiceEditor.moveAllophone(from, pos);
            });

            container.appendChild(chip);
        });
    }

    static _renderLibrary() {
        const container = document.getElementById('voice-library');
        if (!container) return;
        container.innerHTML = '';

        for (const group of ALLOPHONE_GROUPS) {
            const items = ALLOPHONES.filter(a => a.group === group.key)
                                     .sort((a, b) => a.index - b.index);
            if (!items.length) continue;

            const section = document.createElement('div');
            section.className = 'voice-lib-group';
            section.innerHTML = `<div class="voice-lib-label">${group.label}</div>`;

            const row = document.createElement('div');
            row.className = 'voice-lib-row';

            for (const a of items) {
                const btn = document.createElement('button');
                btn.className = `voice-lib-btn voice-lib-btn-${a.group}`;
                btn.textContent = a.code;
                btn.title = `${a.code} — ${a.desc}`;
                btn.addEventListener('click', () => VoiceEditor.addAllophone(a.index));
                btn.addEventListener('dblclick', (e) => {
                    e.preventDefault();
                    VoiceEditor.playOne(a.index);
                });
                row.appendChild(btn);
            }

            section.appendChild(row);
            container.appendChild(section);
        }
    }

    static _updateOutput() {
        const el = document.getElementById('voice-output');
        if (!el) return;
        const text = VoiceEditor.generateOutput();
        el.textContent = text || '(sequence is empty — click allophones to build)';
    }

    static _updatePlayButtons(isPlaying) {
        const playBtn = document.getElementById('voice-play-btn');
        const stopBtn = document.getElementById('voice-stop-btn');
        if (playBtn) playBtn.disabled = isPlaying;
        if (stopBtn) stopBtn.disabled = !isPlaying;
    }

    static _showStatus(msg) {
        const el = document.getElementById('voice-status');
        if (!el) return;
        el.textContent = msg;
        clearTimeout(VoiceEditor._statusTimer);
        VoiceEditor._statusTimer = setTimeout(() => { el.textContent = ''; }, 3000);
    }

    // =========================================================================
    //  WORD LOOKUP UI
    // =========================================================================
    static handleWordInput(e) {
        if (e.key === 'Enter') VoiceEditor.submitWord();
    }

    static submitWord() {
        const input = document.getElementById('voice-word-input');
        if (!input) return;
        const phrase = input.value.trim();
        if (!phrase) return;
        input.value = '';

        // Try the full phrase as a single dictionary key first (user dict → built-in).
        const phraseKey = phrase.toLowerCase();
        if (VoiceEditor.userDict[phraseKey] || ALL_WORDS[phraseKey]) {
            VoiceEditor.wordToAllophones(phrase);
            return;
        }

        // Multi-word: process each word independently.
        const words   = phrase.split(/\s+/).filter(Boolean);
        const added   = [];
        const unknown = [];
        for (const word of words) {
            const key = word.toLowerCase();
            const seq = VoiceEditor.userDict[key] ?? ALL_WORDS[key];
            if (seq) {
                for (const code of seq) VoiceEditor.addAllophone(code);
                added.push(word);
            } else {
                unknown.push(word);
            }
        }

        if (added.length && unknown.length) {
            VoiceEditor._showStatus(`Added: ${added.join(' ')} — Unknown: ${unknown.join(', ')}`);
        } else if (added.length) {
            VoiceEditor._showStatus(`Added "${phrase}"`);
        } else {
            VoiceEditor._showStatus(`Unknown: ${unknown.join(', ')} — define in Custom Dictionary`);
        }
    }
}
