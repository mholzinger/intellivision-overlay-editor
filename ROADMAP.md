# Intellivision Overlay Editor — Roadmap

## Active / In Progress

*(nothing currently in flight)*

---

## Planned Features

### IntelliVoice Builder — Continued
- Export VOICE data as .bas snippet (IntyBASIC)
- Phrase library / save/load named phrases
- Side-by-side compare: typed allophones vs ROM playback (depends on WASM emulator)

### Sprite Editor — Continued
- Export sprite sheet as PNG
- GRAM card conflict detection / auto-assign
- Copy/paste between sprites
- **GIF GRAM snapshot import** — Import jzIntv `gs` (GRAM snapshot) GIF files, auto-slice into 8×8 GRAM cards, populate sprite list and Layout Designer tile picker
- **MOB layer preview** — Composite preview showing 2-3 MOBs stacked at the same X,Y with independent foreground colors, simulating multi-sprite layering technique used for multi-colored characters
- **BACKTAB import from jzIntv debugger** — Round-trip workflow: paste the backtab word dump from jzIntv's debugger alongside the `gt` GRAM dump into Layout View, reconstruct the full screen mockup with correct GRAM card placement + FG/BG colors. Enables modifying existing game screens visually instead of only authoring new layouts from scratch. Requested by Steve Ettinger for inspecting/editing existing Intellivision game screens. Parser would decode each backtab word into card num + FG + BG (CS or FG/BG mode), reverse of `_encodeBacktabWord` in layoutDesigner.js.

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

### DS Overlay Tab
- Visual hotspot overlap detection
- Import from existing .ovl file

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
- ECS ROM Support — opt-in checkbox; ecs.bin sourced from OpenEmu BIOS pack; stored ≠ enabled
- IntelliVoice ROM as External Download — ivoice.bin via Archive.org BIOS pack auto-fetch + user drop zone
- jzIntv Launch Options UI — JLP / PAL / ECS checkboxes + free-form extra flags input, persisted to localStorage
- Game config database — 227-game filename→map lookup + 10 embedded cfg texts; auto-applied on `.bin`/`.int` drop
- Touch controller overhaul — 16-direction disc, `[●][◀][▶]` action row above keypad, ↺ reset button, overlay image underlay with SVG-coordinate alignment
- Sprint ZIP `.sav` support — `.sav` in ZIP loaded as `game.jlp` at launch (takes precedence over IDB cache)
- Browser Asset Export — "Export saved data" button in Options; downloads ZIP of JLP saves + game library metadata/art
- jzIntv WASM emulator (full) — CP1610 + SP0256-AL2 + STIC canvas video + Web Audio + ROM loader; jzIntv compiled via Emscripten; BIOS user-supplied; standalone emulator tab shipping
- Saved Game Library — My Games card row with box art, tap-to-load, auto-save on ROM drop, delete, Clear all; IDB `games` store
