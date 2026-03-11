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

### Emulator — Landscape Mobile Layout
**Goal:** On phones in landscape orientation, arrange the emulator as `[disc] | [canvas] | [keypad]`
so the game fills the center and controls flank it on either side.

**Context:** An initial implementation was attempted using CSS `display: contents` to dissolve the
`#touch-controls` wrapper and `order: -1` to reposition the disc. The disc/canvas/keypad
positioning works but the canvas does not scale to fit the available height, leaving dead space
and mis-sized controls. Needs a proper height-driven scaling pass.

**Known issues to solve:**
- Canvas does not auto-scale to viewport height in landscape — needs `max-height: 100dvh` or
  an explicit height-driven resize
- `#emulator-wrap` padding/background bleeds around the canvas in landscape
- Controls may be too large or too small depending on device aspect ratio — `clamp` values need
  tuning against real devices
- Layout toggle (Full / Mini) also needs landscape-specific sizing for mini mode

**Implementation notes:**
- Current approach: `display: contents` on `#touch-controls`, `order: -1` on disc —
  cascade was the original bug (landscape rule appeared before the `pointer:coarse` rule)
- Canvas scaling: likely needs a ResizeObserver or `aspect-ratio` + `height: 100%` on `#canvas-area`
- May need to hide `#emulator-controls` bar in landscape to reclaim vertical space, or
  move it into the keypad column

### Saved Game Library (IndexedDB)
**Goal:** When the user loads a Sprint bundle ZIP, automatically persist the game to IndexedDB
as a named entry. A saved game card appears in the emulator UI so the user can tap to resume
— no re-uploading required, works offline.

**What to store (per saved game):**
```
{
  id:          string,        // slug derived from game name, e.g. "space-intruders"
  name:        string,        // display name (from overlay.json title or filename)
  rom:         ArrayBuffer,   // the cartridge ROM bytes (8–128 KB)
  romExt:      string,        // "rom" | "bin" | "int"
  cfg:         ArrayBuffer?,  // jzIntv .cfg file if present in the bundle
  overlayJson: object?,       // parsed overlay.json from Sprint bundle
  overlayPng:  ArrayBuffer?,  // controller overlay PNG (for the in-game panel)
  boxartPng:   ArrayBuffer?,  // box art PNG
  savedAt:     number,        // Date.now() timestamp
}
```
Sprint bundles that include overlay art and box art are stored as full entries. Plain
`.rom`/`.bin` drops are stored with just ROM + ext (no artwork). The extra Sprint bundle
data (readme, source files, etc.) is discarded — only the above fields are kept.

**Trigger:** Save happens automatically on successful ROM load. No explicit "save" button
needed. If a game with the same `id` already exists, overwrite it silently.

**UI surface — "My Games" row:**
Above the ROM drop zone (or replacing it when at least one game is saved), show a
horizontal scrollable row of saved game cards:

```
┌─────────────────────────────────────────────────┐
│  My Games                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ [boxart] │  │ [boxart] │  │  +  Drop │       │
│  │  Astro   │  │  Space   │  │  a game  │       │
│  │  Smash   │  │Intruders │  │          │       │
│  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────┘
```

- Each card shows box art (if available) or a generic cartridge icon
- Tap to load — writes ROM to WASM FS and launches immediately (if BIOS already loaded)
- Long-press / ··· menu: "Delete saved game"
- When no games are saved, the row is hidden and only the drop zone shows
- When games are saved, the drop zone shrinks to a compact "+ Add game" card at the end of the row

**Plain ROM saves (no Sprint bundle):**
- Use a generic cartridge icon placeholder
- Name derived from filename (strip extension, replace `_`/`-` with spaces, title-case)

**IndexedDB schema:**
```
DB: 'jzintv-roms'   (already exists for BIOS)
Store: 'games'      (new store, keyPath: 'id')
```

**Implementation notes:**
- Extract save logic into a `saveGame(entry)` helper called from `_loadRom()` after
  successful load — both ZIP and direct ROM paths
- `loadSavedGame(id)` retrieves from IDB, writes ROM to WASM FS, calls `onPlay()`
- Card row rendered by a `renderGameLibrary()` function called on emulator tab init
  and after each save
- Box art displayed as `<img src="blob:...">` using `URL.createObjectURL(new Blob([boxartPng]))`

### DS Overlay Tab
- Visual hotspot overlap detection
- Import from existing .ovl file

---

### Per-Game jzIntv Run Settings
**Goal:** Remember each game's hardware configuration so the correct options are applied
automatically every time that game is loaded from the library — no manual checkbox toggling.

**Context:** The emulator currently has global options (JLP, PAL, ECS, extra flags) that
persist across all games via `localStorage`. This is wrong for a library: BurgerTime should
never enable ECS, while a JLP game needs JLP every time. Settings should travel with the game.

**Settings to persist per game:**
| Setting | Control | Notes |
|---------|---------|-------|
| ECS enabled | `opt-ecs` checkbox | Only for games that require the ECS expansion |
| JLP enabled | `opt-jlp` checkbox | JLP flash/RAM enhancement cartridge |
| PAL mode | `opt-pal` checkbox | PAL region ROMs run at wrong speed in NTSC mode |
| Extra flags | `opt-extra-flags` text input | Free-form jzIntv CLI flags for edge cases |

**Implementation sketch:**
- Add a `settings` field to the saved game record in the IndexedDB `games` store:
  ```javascript
  { id, name, rom, romExt, cfg, ..., settings: { ecs: false, jlp: false, pal: false, extra: '' } }
  ```
- When `saveCurrentGame()` runs, snapshot current checkbox/input state into `settings`
- When `loadSavedGame(game)` runs, apply `game.settings` to the UI controls before `onPlay()`
- Add an **edit settings** affordance on each game card (gear icon or long-press) so the user
  can change settings for a saved game without re-dropping the ROM
- Global options remain as the default for freshly-dropped, unknown games

**UX:** Show small hardware badges on each library card for any non-default settings active
(e.g. a "JLP" or "ECS" pill) so the user can see at a glance what's enabled for each title.

---

### Intellivision ROM File Validator (standalone tool)
**Goal:** A small standalone utility (separate project or CLI) that inspects an Intellivision
ROM file, detects its true format, and reports whether the file extension is correct.

**Context:** Intellivision ROMs circulate with inconsistent extensions. `.int` should be the
Intellicart self-describing format (has a header), while `.bin` is a raw ROM image requiring an
external `.cfg` for memory mapping. Files are frequently mislabeled — e.g. a raw binary
distributed as `.int`, or an Intellicart image renamed to `.bin`. This causes silent load
failures or wrong memory map application.

**Detection logic:**
- **Intellicart (`.int`)** — begins with the 2-byte magic `0xA8 0x52` (or the Intellicart ROM
  header signature). If this magic is present, the file is self-describing and `.int` is correct.
- **Raw binary (`.bin`)** — no header; any content is valid. Correct extension is `.bin` and
  a matching `.cfg` is required for jzIntv to load it.
- **`.rom`** — jzIntv's own tagged format; has a distinct header. Easy to detect.

**Outputs per file:**
- Detected format (Intellicart / Raw binary / jzIntv ROM / Unknown)
- Current extension: correct ✓ / mislabeled ✗
- Suggested extension if mislabeled
- For raw `.bin`: which map number from `GAME_MAP_DB` applies (if filename matches), or
  "unknown — drop alongside a .cfg"

**Delivery options (pick one):**
- Python CLI script: `python rom_validator.py beauty.bin` → prints report
- Browser drag-and-drop page: drop a file, get instant analysis (no server needed — pure JS)
- Integrated into the emulator drop zone as a soft warning badge when a mislabeled file is detected

**Notes:**
- Intellicart header reference: jzIntv source `icart/icartrom.c` — look for `ICARTROM_MAGIC`
- Should also flag `.bin` files NOT in `GAME_MAP_DB` (unknown ROM — user must supply `.cfg`)
- Useful for curating ROM collections before loading into the emulator

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
