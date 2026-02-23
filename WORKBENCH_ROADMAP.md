# Intellivision Audio & Emulation Workbench — Roadmap

## Context

The overlay editor is expanding into a full Intellivision authoring workbench. The goal is to
test and hear IntelliVoice speech strings, compose AY-3-8910 PSG music, and eventually run compiled
IntyBASIC programs in the browser via jzIntv compiled to WebAssembly. Each phase ships independently
as a new tab in the editor.

---

## Phase 1 — IntelliVoice Builder

**Goal:** A tab where the user assembles SP0256-AL2 allophone sequences, hears them played back via
Web Audio, and copies the resulting IntyBASIC `VOICE` statement.

### New Files
| File | Purpose |
|------|---------|
| `static/js/modules/voiceEditor.js` | Main module — sequencer, playback, output |
| `static/js/data/allophonesDict.js` | 64 allophone definitions + word→allophone lookup table |
| `static/audio/sp0256/` | 64 pre-recorded `.wav` samples (one per allophone) |

### Allophone Reference (SP0256-AL2, all 64)

**Pauses:** PA1 (10ms), PA2 (30ms), PA3 (50ms), PA4 (100ms), PA5 (200ms)

**Vowels:** OY, AY, EH, IH, IY, EY, AX, AO, AA, AE, UH, AW, OW, UW1, UW2

**Consonants:** KK3, PP, JH, NN1, TT2, RR1, MM, TT1, DH1, DD1, BB1, TH, GG3, VV, GG1, ZZ,
HH1, HH2, BB2, GG2, DH2, SS, NN2, LL, WW, WH, YY1, YY2, CH, ER1, ER2

**Special:** XR, OR, AR, YR, EL

Each allophone maps to:
- An index (0–63, also used as the `VOICE` argument)
- A `.wav` filename (`sp0256/PA1.wav`, etc.)
- A human description (e.g., `"OW as in 'go'"`)

### `allophonesDict.js` structure
```javascript
export const ALLOPHONES = [
  { index: 0,  code: 'PA1', desc: 'Pause 10ms',   file: 'PA1.wav' },
  { index: 1,  code: 'PA2', desc: 'Pause 30ms',   file: 'PA2.wav' },
  // ... all 64
];

export const WORD_LOOKUP = {
  'hello':  ['HH1','EH','LL','OW'],
  'fire':   ['FF','AY','ER1'],
  // common Intellivision game words
};
```

### `voiceEditor.js` — Architecture
```javascript
class VoiceEditor {
  static sequence = [];          // Array of allophone codes in order
  static audioCtx = null;        // Web Audio AudioContext
  static bufferCache = {};       // Preloaded AudioBuffers keyed by code

  static async init()               // Load all 64 samples into bufferCache
  static addAllophone(code)         // Append to sequence, re-render
  static removeAllophone(index)     // Remove by position, re-render
  static reorderAllophone(from, to) // Drag-and-drop reorder
  static async playSequence()       // Chain AudioBufferSourceNodes end-to-end
  static stopPlayback()
  static generateOutput()           // Returns IntyBASIC VOICE statement string
  static wordToAllophones(word)     // Lookup + append from WORD_LOOKUP
  static renderSequencer()          // Render the horizontal chip strip UI
  static renderAlloponeLibrary()    // Render the 64-button allophone grid
}
```

### Playback — Web Audio chain
```javascript
// For each allophone in sequence:
const src = audioCtx.createBufferSource();
src.buffer = bufferCache[code];
src.connect(audioCtx.destination);
src.start(startTime);
startTime += src.buffer.duration;
```

### Sample sourcing strategy
- **Option A (recommended):** Extract from jzIntv source (`src/sp0256/` — `.wav` files included)
- **Option B:** FreeSpeech project (open-source SP0256 samples, permissive license)
- **Option C:** Generate synthetically via formant synthesis (fallback only)

### UI Layout
```
┌──────────────────────────────────────────────────────────────┐
│  IntelliVoice Builder               [▶ Play] [■ Stop] [Copy] │
├──────────────┬───────────────────────────────────────────────┤
│  Word lookup │  Sequence strip:                              │
│  [hello   ] │  [HH1][EH][LL][OW][PA2][FF][AY][ER1]  [+]   │
│  [Add Word] │                                               │
├──────────────┴───────────────────────────────────────────────┤
│  Allophone Library (click to append):                        │
│  Pauses: [PA1][PA2][PA3][PA4][PA5]                          │
│  Vowels: [OY][AY][EH][IH][IY][EY][AX][AO][AA][AE]...       │
│  Consonants: [KK3][PP][JH][NN1][TT2][RR1][MM]...            │
├──────────────────────────────────────────────────────────────┤
│  Output:                                                     │
│  VOICE 0,26,5,34,36,255                                     │
└──────────────────────────────────────────────────────────────┘
```

### IntyBASIC `VOICE` output
```
VOICE channel, allophone1, allophone2, ..., 255
```
- `channel` = 0 (left) or 1 (right)
- `255` = end-of-sequence sentinel
- Each allophone is referenced by its integer index (0–63)

### Integration
- New tab button: `IntelliVoice`
- New HTML panel: `<div id="voice-tab" class="tab-panel">`
- Module wired in `overlay_editor.js`

---

## Phase 2 — AY-3-8910 PSG Composer

**Goal:** A tab to compose 3-channel chiptune music at register level, preview via Web Audio, and
export IntyBASIC `SOUND` statements.

### New Files
| File | Purpose |
|------|---------|
| `static/js/modules/psgComposer.js` | Main module — register state, playback, output |
| `static/js/modules/psgEmulator.js` | Pure AY-3-8910 emulation in JS (tick-accurate) |

### AY-3-8910 Register Map
```
R0/R1   Channel A tone period (12-bit: R1[3:0] | R0[7:0])
R2/R3   Channel B tone period
R4/R5   Channel C tone period
R6      Noise period (5-bit)
R7      Mixer (tone on/off, noise on/off per channel)
R8      Channel A amplitude (4-bit + envelope flag)
R9      Channel B amplitude
R10     Channel C amplitude
R11/R12 Envelope period (16-bit)
R13     Envelope shape (CONT, ATT, ALT, HOLD)
R14/R15 I/O ports (not used for audio)
```

Tone frequency formula: `f = 1,789,772 / (16 × period)`

### Web Audio synthesis approach
- Channel A/B/C: `OscillatorNode` (`type: 'square'`)
  - Period → frequency via formula → `oscillator.frequency.setValueAtTime()`
  - Amplitude (0–15) → `GainNode` (0.0–1.0)
- Noise: `AudioWorkletNode` with LFSR algorithm matching AY-3-8910
- Envelope: Scheduled parameter automation on GainNodes

### Piano Roll UI
- 3 rows (Channel A, B, C) × 32 steps
- Each cell = note name + duration
- Clicking a cell opens note picker
- Export generates time-sequenced `SOUND` calls

### IntyBASIC `SOUND` output
```
SOUND channel, period, amplitude
' channel: 0=A, 1=B, 2=C
' period: 12-bit AY register value
' amplitude: 0-15
```

---

## Phase 3 — jzIntv Emscripten WASM

**Goal:** Compile jzIntv to WebAssembly so the browser can run actual Intellivision ROM binaries.
IntyBASIC source → Flask compiles → `.rom` → WASM emulator → live video + audio.

### Architecture
```
[IntyBASIC source] → POST /compile_bas → Flask(intyBASIC compiler) → .rom binary
        ↓
[EmulatorBridge.js].loadRom(romBytes) → jzintv.wasm
        ↓
requestAnimationFrame loop → _jzintv_run_frame() → framebuffer → <canvas>
                                                  → audio PCM    → Web Audio
```

### Docker Build Changes
Add Emscripten multi-stage build to `Dockerfile`:
```dockerfile
# Stage 1: Build jzIntv to WASM
FROM emscripten/emsdk:3.1.50 AS wasm-builder
RUN apt-get update && apt-get install -y libz-dev
COPY jzintv-src/ /build/jzintv/
WORKDIR /build/jzintv
RUN emcmake cmake -DCMAKE_BUILD_TYPE=Release \
    -DENABLE_NETWORK=OFF -DENABLE_JLP=OFF \
    -s EXPORTED_FUNCTIONS="['_jzintv_init','_jzintv_load_rom','_jzintv_run_frame',\
       '_jzintv_get_framebuffer','_jzintv_get_audio','_jzintv_set_voice']" \
    -s MODULARIZE=1 -s EXPORT_NAME=JZIntv .
RUN make -j4

# Stage 2: Final app image
FROM python:3.11-slim AS app
COPY --from=wasm-builder /build/jzintv/jzintv.wasm static/wasm/
COPY --from=wasm-builder /build/jzintv/jzintv.js   static/wasm/
# ... rest of existing Dockerfile
```

### `EmulatorBridge.js` — API
```javascript
class EmulatorBridge {
  static module = null;
  static running = false;
  static frameCanvas = null;

  static async init(canvasEl)       // Load jzintv.wasm, attach to canvas
  static async loadRom(romBytes)    // Pass ROM ArrayBuffer to emulator
  static start()                    // Begin requestAnimationFrame loop
  static stop()
  static reset()
  static setVoiceEnabled(bool)      // Toggle IntelliVoice chip
  static getAudioPCM()              // Returns Float32Array for Web Audio
  static setControllerInput(mask)   // 16-bit controller bitmask
}
```

### Flask `/compile_bas` endpoint
```python
@app.route('/compile_bas', methods=['POST'])
def compile_bas():
    source = request.json['source']
    result = subprocess.run(
        ['intybasic', '-o', '/tmp/out.rom', '/tmp/src.bas'],
        capture_output=True, timeout=30
    )
    if result.returncode != 0:
        return jsonify({'error': result.stderr.decode()}), 400
    rom_bytes = open('/tmp/out.rom', 'rb').read()
    return jsonify({'rom': base64.b64encode(rom_bytes).decode()})
```

### EXEC ROM
- **Recommended:** User uploads their own `exec.bin` (zero legal risk)
- Fallback: investigate whether jzIntv's redistributable EXEC stub is usable

---

## Phase 4 — Full Workbench Tab

**Goal:** Integrated IDE — write IntyBASIC, compile, run, and inspect all in the browser.

### Features
| Feature | Implementation |
|---------|---------------|
| Live code editor | CodeMirror 6 with IntyBASIC syntax highlighting |
| Compile & Run | POST `/compile_bas` → `EmulatorBridge.loadRom()` → `start()` |
| Error overlay | Compiler errors shown inline in CodeMirror gutter |
| Memory inspector | STIC registers, BACKTAB, GRAM viewer |
| Audio oscilloscope | AnalyserNode → `<canvas>` waveform per AY channel |
| Sprint controller | Web HID API → `EmulatorBridge.setControllerInput()` |
| Snapshot/restore | Save emulator state to localStorage or file download |

### Layout
```
┌────────────────────────┬─────────────────────────┐
│  IntyBASIC Editor      │  Emulator Output         │
│  (CodeMirror)          │  ┌───────────────────┐   │
│                        │  │   160×192 canvas  │   │
│  [Compile & Run]       │  └───────────────────┘   │
│  [Stop] [Reset]        │  [Connect Sprint]         │
├────────────────────────┼─────────────────────────┤
│  Errors / Console      │  Audio Oscilloscope      │
│  > line 12: unknown    │  ~~~^~~^~~~  (Ch A)      │
│    identifier          │  ~~~~~       (Ch B)      │
│                        │  ────        (Ch C)      │
└────────────────────────┴─────────────────────────┘
```

### New Files
| File | Purpose |
|------|---------|
| `static/js/modules/workbench.js` | Workbench tab coordinator |
| `static/js/modules/codeEditor.js` | CodeMirror + IntyBASIC grammar |
| `static/js/modules/memoryInspector.js` | STIC/BACKTAB/GRAM viewer |
| `static/js/modules/oscilloscope.js` | Audio waveform renderer |

### IntyBASIC keywords for CodeMirror grammar
`DIM FOR TO STEP NEXT IF THEN ELSE END GOTO GOSUB RETURN PRINT INPUT
BITMAP DEFINE VOICE SOUND WAIT PLAY MODE BORDER BACKGROUND AT RESTORE
DATA READ POKE PEEK REM LET ON USING SPRITE MOB`

---

## Implementation Order

```
Phase 1 (IntelliVoice)   ← Start here. Standalone, zero WASM needed.
Phase 2 (PSG Composer)   ← Parallel or after Phase 1. Also standalone.
Phase 3 (jzIntv WASM)    ← Requires Emscripten build step + Docker changes.
Phase 4 (Workbench)      ← Depends on Phase 3 (needs running emulator).
```

## First Action for Phase 1

Locate the 64 SP0256-AL2 `.wav` sample files:
1. Check jzIntv source tree (`jzintv-src/src/sp0256/`)
2. Alternatively: FreeSpeech project on GitHub
3. Confirm license is compatible with project distribution
4. Place samples in `static/audio/sp0256/`
