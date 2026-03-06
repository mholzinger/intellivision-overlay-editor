# Intellivision Overlay Editor — Roadmap

## Active / In Progress

*(nothing currently in flight)*

---

## Planned Features

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

- WebAssembly emulator roadmap item added (this session)
- Multi-sprite BITMAP paste (auto-split on labels and 8-row boundaries)
- Animation bug fix (increment-before-render, layout-aware frame count)
- Animation preview layout selector (1x1, 2x1 H, 1x2 V)
- CMU Pronouncing Dictionary server-side word lookup
- IntelliVoice paste VOICE data + custom user dictionary
- SPA tab routing (History API pushState)
- DS Overlay tab
- IntelliVoice Builder tab
