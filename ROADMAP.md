# Intellivision Overlay Editor — Roadmap

## Active / In Progress

*(nothing currently in flight)*

---

## Identity / Branding

### Rename the project (and the website)

The name "Intellivision Overlay Editor" no longer describes what this is.
What started as an overlay-card designer has grown into a full Intellivision
homebrew authoring suite — Overlay Editor, Box Art Editor, Sprite Editor,
Layout Designer, DS Overlay, IntelliVoice Builder, Music Studio (with four
engines: IntyBASIC MUSIC base + ECS, Chevallier Tracker, IMT, ZMUS), SFX
Lab, and the jzIntv WASM Emulator.

We need a name + URL that reflects the broader scope. Some seeds for the
naming session:
- One word that captures "build everything an Intellivision homebrew needs"
- Something that survives shipping a real IDE (see the IntyBASIC IDE entry
  below — that's the eventual destination)
- Available `.dev` / `.app` / `.com` domain ideally
- Not "Intellivision" anything (trademark risk + too narrow if we ever broaden)

Deferred concrete asks:
- Pick the name
- Register the domain
- Update `<title>` in `templates/overlay_editor.html`
- Update the header logo / banner
- Update `README.md` and the GitHub repo name
- Update Fly.io app name (`fly.toml`)
- Move/redirect from `intellivision-overlay-editor.fly.dev`
- Update social cards / meta tags
- Update every doc that references the project name

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
- **dump.mem binary import** — Drag-drop the jzIntv `d`-command output (full memory snapshot) and auto-populate BACKTAB cells + GRAM sprites + STIC mode in one shot. Text-paste from `m` command already supported; this would be the polished single-file UX.

### Music Studio — Continued
**Shipped so far:** IntyBASIC MUSIC parser, piano-roll visualization, Web Audio AY-3-8914 synth playback (50 Hz, 4 instruments, 3 drum types), demo song library (10 Space Intruders tracks), click-to-edit composing, player-piano tracking with loop support (JUMP/REPEAT), volume slider, note hover tooltip, INTV Audio Primer modal.

**Next phases (per `~/.claude/plans/intellivision-music-studio.md`):**
- **Phase 4: Export round-trip** — serialize SongIR back to IntyBASIC MUSIC .bas text, project save/load, Copy Source actually produces valid code. This is the "shippable to friends" milestone.
- **Phase 5: ECS 8-channel** — second PSG, 8-arg MUSIC lines, wider piano-roll
- **Phase 6: Music templates** — starter patterns (blank, drum loop, chord progressions, scale exercises)
- **Phase 7: WASM jzIntv bit-perfect playback** — compile music into a stub ROM, run through the existing WASM emulator, A/B toggle vs Web Audio synth
- **Phase 8: JLP/zmus engine** — support the shared assembly music engine format
- **Phase 9: Raw PSG register writes** — direct AY-3-8914 register timeline for SFX design
- **Software piano keyboard** — on-screen clickable/tappable keyboard at the bottom of the editor page. Click a key → note is placed at the playhead position on the active channel. Useful for users without a physical keyboard layout intuition (which key = which note).
- **USB MIDI / HID keyboard input** — use the browser's Web MIDI API (`navigator.requestMIDIAccess()`) to accept note input from a USB MIDI keyboard. Web MIDI is a native browser API (Chrome, Edge, Opera — no plugin needed; Firefox requires a flag). For non-MIDI USB keyboards (HID), `navigator.hid` API or simpler keydown mapping could work. This would let musicians play notes in real time and have them recorded to the piano-roll — a proper "step record" or "live record" mode.

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

### [MAJOR] Browser-Native IntyBASIC IDE — The Long Game

**Goal:** Turn the editor into a complete in-browser IntyBASIC development
environment. Write code, build the ROM, run it in jzIntv WASM, debug —
without ever leaving the browser or installing native toolchain.

**Current bridge:** The Music Studio's `/music/compile_rom` endpoint already
demonstrates the loop (source → ROM → jzIntv WASM playback). It works on
local dev where the toolchain is installed. For production, the button is
visible-but-disabled with a tooltip pointing at setup docs. That's the
honest "we aren't shipping a compiler yet" stance — see
`docs/wasm-playback.md` for the three install paths.

**What "yet" means — the WASM-compiler dream:**
The natural symmetry breaker is that jzIntv ships as WASM (precompiled
static artifact) while `intybasic` + `as1600` are native `gcc` binaries
that have to execute on a server. The clean answer is to compile the
*compiler* to WASM too:

1. **intybasic.wasm** — emscripten port of Oscar Toledo's IntyBASIC C++
   source. Source is at github.com/nanochess/IntyBASIC. Real work:
   file I/O needs to go through emscripten's virtual FS, stdout/stderr
   captured to JS callbacks.
2. **as1600.wasm** — emscripten port of jzIntv's assembler. Smaller,
   simpler C. Should be a weekend project given the existing jzIntv WASM
   build experience.
3. Browser pipeline: `editor source → intybasic.wasm → .asm → as1600.wasm
   → .rom → jzintv.wasm → audio + video`. Zero server involvement after
   page load.

**Beyond the compiler — what makes it an "IDE":**
- **Code editor** — Monaco or CodeMirror with IntyBASIC syntax highlighting,
  on-the-fly error squigglies (run the WASM compiler in a worker on edit)
- **Multi-file projects** — virtual file tree, INCLUDE resolution, assets
  (`.bmp`, `.bas` chunks, music files) bundled as a project save
- **Build + Run** — one click goes from source to running ROM
- **Asset pipeline** — every existing tab (Overlay, Box Art, Sprite,
  Layout Designer, Music Studio, IntelliVoice) becomes an asset editor
  whose output flows into the project's `INCLUDE` graph
- **Debugger glue** — surface jzIntv's `-d` debugger via the existing
  Emulator tab plumbing (memory inspector, breakpoints, register watch)
- **Project share** — URL-encoded or token-stored project state so a
  composer can paste a link and have someone hear/play their game

**Strategic note:** every editor tab we've built so far already produces
IntyBASIC source. The IDE is the natural unification — the missing piece
is the compiler-in-browser. Once that's WASM, the editor stops being
"several tools that each emit BASIC source" and becomes "a place to build
homebrew Intellivision games."

**Order of operations when we go:**
1. Stand up an `as1600.wasm` proof of concept (smaller, gives us the
   emscripten template)
2. Stand up `intybasic.wasm` (the harder port)
3. Replace `/music/compile_rom` with a client-side call to the same
   pipeline — server endpoint deprecated, runs identically
4. Build the code editor surface and wire the asset tabs into a project
   model
5. Add the debugger glue

This is months of work, not a sprint. But it's the right north star.

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
