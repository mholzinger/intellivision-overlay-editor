# Intellivision Overlay Editor — Roadmap

## Active / In Progress

*(nothing currently in flight)*

---

## Planned Features

### ECS ROM Support
**Goal:** Let users supply the Intellivision Entertainment Computer System (ECS) ROM
(`ecs.bin`) alongside EXEC and GROM so that ECS-enhanced games boot correctly.

**Context:** The ECS was a keyboard/synthesizer expansion module. Some games require it;
without `ecs.bin` they crash or hang at startup. jzIntv supports ECS via the `--ecs-rom`
flag — the WASM build just needs the file written to its virtual FS.

**Implementation:**
- Add a third drop zone in the BIOS setup UI: `ecs.bin` (8 KB)
- Store in the same IndexedDB store (`jzintv-bios`) under key `ecs.bin`
- Pass to `Module['launchJzintv']` as an optional 5th argument; the launch function
  writes it to the WASM FS and adds `--ecs-rom=ecs.bin` to the jzIntv args if present
- Show `ecs.bin ✓` chip in the BIOS chips row when loaded
- Loading ECS is optional — non-ECS games are unaffected

---

### IntelliVoice ROM as External Download
**Goal:** Let users supply `ivoice.bin` (the SP0256-AL2 ROM) the same way they supply
EXEC/GROM, rather than embedding it in the WASM build (which raises redistribution concerns).

**Context:** `ivoice.bin` is currently pre-loaded into `jzintv.data` via Emscripten's
`--preload-file`. This means it ships with the web app, which is legally murky for a public
deployment. Removing it from the preload and having users supply their own copy eliminates
the problem entirely.

**Implementation:**
- Remove `--preload-file "$(IVOICE_ROM)@ivoice.bin"` from `Makefile.emscripten`
- Rebuild `jzintv.wasm` / `jzintv.data` without the embedded ROM
- Add `ivoice.bin` drop zone to the BIOS setup UI (alongside exec/grom/ecs)
- Store in IndexedDB under key `ivoice.bin`
- Pass to launch function; write to WASM FS so jzIntv can find it
- IntelliVoice speech is silent (but the emulator runs) if ivoice.bin is not provided —
  show a clear notice rather than an error

---

### jzIntv Launch Options UI
**Goal:** Expose common jzIntv command-line options to users through the emulator UI so
they can tune emulation without knowing the CLI.

**Options to expose (first pass):**

| Option | UI control | Default |
|--------|-----------|---------|
| `--pal` / `--ntsc` | Toggle (NTSC / PAL) | NTSC |
| `--quiet` | Checkbox | off |
| `-z N` (zoom) | Dropdown 1×–4× | 2× |
| `--voice-rate=N` | Slider (8000–22050 Hz) | 15625 |
| `--rand-mem` | Checkbox | off |
| `--kbdhackfile=` | File drop (upload .kbd) | built-in |
| `--cfg=` | File drop (upload .cfg) | none |
| `--ecs` | Checkbox (enable ECS hardware) | off |
| `--ivoice` | Checkbox (enable IntelliVoice) | on if ivoice.bin present |

**Implementation:**
- Collapsible "Advanced Options" panel on the emulator setup card (below Keyboard Mapper)
- Settings serialized to a `cfg` string and written to WASM FS as `launch.cfg`
- Persisted per-user in IndexedDB under key `launch-options`
- `.kbd` file upload: written to WASM FS, passed via `--kbdhackfile`; replaces the
  in-browser keyboard mapper bindings for that session

---

### [MAJOR] WebAssembly Intellivision Emulator
**Goal:** Run Intellivision ROMs directly in the browser, primarily to test IntelliVoice
output while building allophones in the Voice Builder tab.

**Motivation:**
- Voice Builder helps authors write VOICE data (allophones) for games
- Today there is no way to hear the result in context — only isolated allophone playback
- A WASM emulator lets you load a ROM and hear IntelliVoice output live in the browser

**Scope (approximate, not cycle-accurate):**
- CP1610 CPU emulation
- AY-3-8914 PSG sound
- SP0256-AL2 IntelliVoice emulation (the critical piece)
- Enough video output to see the game (canvas display)
- Basic controller input (keyboard mapping)
- ROM file loading via file picker (user supplies EXEC/GROM/ivoice ROMs — copyrighted)

**Chosen approach: jzIntv via Emscripten**
- Proof of concept: archive.org runs MAME (JSMESS) compiled to WASM — proves the full stack works
- jzIntv chosen over MAME because it is Intellivision-specific (smaller binary, faster load)
- jzIntv already proven locally for IntelliVoice WAV capture in this project
- Fallback: MAME/JSMESS approach if jzIntv hits a wall (archive.org precedent)
- Audio output via Web Audio API
- Video output via HTML5 Canvas
- ROM files user-provided (EXEC, GROM, ivoice — copyrighted, cannot bundle)

**Open questions:**
- jzIntv license compatibility for WASM distribution?
- Standalone emulator tab vs embedded "Test ROM" panel inside Voice Builder?
- Minimum viable milestone: IntelliVoice audio only (no video) first?

**Sub-tasks (rough order):**
1. Attempt jzIntv Emscripten build — stub out SDL/file I/O for browser sandbox
2. Get CP1610 + SP0256-AL2 IntelliVoice audio running headlessly in WASM
3. Add canvas video output (STIC chip)
4. Wire up ROM loader UI (file picker, drag-drop)
5. Integrate into Voice Builder tab as a "Test ROM" panel
6. Full standalone emulator tab (stretch goal)

---

### IntelliVoice Builder — Continued
- Export VOICE data as .bas snippet (IntyBASIC)
- Phrase library / save/load named phrases
- Side-by-side compare: typed allophones vs ROM playback (depends on WASM emulator)

### Sprite Editor — Continued
- Export sprite sheet as PNG
- GRAM card conflict detection / auto-assign
- Copy/paste between sprites

### DS Overlay Tab
- Visual hotspot overlap detection
- Import from existing .ovl file

---

## Completed (recent)

- jzIntv WASM emulator tab — BIOS setup, Sprint ZIP loading, box art / overlay panels, screenshot carousel
- Archive.org BIOS auto-fetch via server proxy
- Mobile-responsive layout — swipeable tabs, full-bleed, 100dvh
- iOS fake-fullscreen via postMessage parent iframe expansion
- Stop button reliability fix on mobile Safari
- NES-style cross D-pad on touch controls
- Intellivision keypad layout on touch: [0][1][2][CLR] / [●][◀][▶][ENT]
- In-browser keyboard mapper with click-to-rebind, IndexedDB persistence, Reset to Defaults
- `-` (Clear) and `=` (Enter) keyboard routing via tcPush
- Desktop keyboard: all P1 actions owned by mapper, `preventDefault` during gameplay
- IntelliVoice ivoice.bin redistribution issue documented (open issue, see plan file)
- Multi-sprite BITMAP paste (auto-split on labels and 8-row boundaries)
- Animation bug fix (increment-before-render, layout-aware frame count)
- Animation preview layout selector (1x1, 2x1 H, 1x2 V)
- CMU Pronouncing Dictionary server-side word lookup
- IntelliVoice paste VOICE data + custom user dictionary
- SPA tab routing (History API pushState)
- DS Overlay tab
- IntelliVoice Builder tab
