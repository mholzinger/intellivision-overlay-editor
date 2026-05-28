# Bit-Perfect WASM Playback Setup

The Music Studio's **▶ jzIntv (bit-perfect)** button compiles the user's
serialized `MUSIC` source to a real Intellivision ROM and plays it through the
in-browser jzIntv WASM emulator. Audio is exactly what real hardware would
produce — no Web Audio approximation.

The button is hidden by default and only appears when the server reports the
toolchain is installed. Frontend probes `GET /music/compile_rom/status` at
init.

## What the pipeline needs

1. **`intybasic`** — Oscar Toledo's IntyBASIC compiler (`.bas` → `.asm`)
2. **`as1600`** — the Intellivision assembler from jzIntv (`.asm` → `.rom`)
3. **IntyBASIC library directory** — contains `intybasic_prologue.asm` and
   `intybasic_epilogue.asm` (ships with the IntyBASIC distribution)

The binaries are checked in this order:
1. Explicit env var (`OVL_INTYBASIC_PATH`, `OVL_AS1600_PATH`)
2. `PATH` lookup (`shutil.which`)
3. Known install paths (configured in `config.py`)

Library path:
1. `OVL_INTYBASIC_LIBRARY_PATH` env var
2. Sibling directory of the `intybasic` binary

## Local development (macOS / Linux)

Already works on the developer's machine if `intybasic` and `as1600` are in
the usual install paths:

- `/Users/<you>/intybasic/intybasic` (macOS distribution)
- `/Users/<you>/jzintv/bin/as1600` (macOS jzIntv 2020 build)

Verify:

```bash
curl http://localhost:5001/music/compile_rom/status
# → {"available":true,"intybasic":true,"as1600":true,"library":true}
```

## Docker deployment

The default `Dockerfile` does NOT bundle the toolchain (binary distribution
choice, image-size trade-off). To enable WASM playback in production:

### Option A: bundle Linux binaries in the image

Drop these into the repo before building:

```
vendor/intellivision-toolchain/
    intybasic                       # Linux x86_64 binary
    as1600                          # Linux x86_64 binary
    intybasic_prologue.asm
    intybasic_epilogue.asm
```

Source binaries:
- `intybasic` from the IntyBASIC distribution (compile from source with
  `make -C intybasic/source`, or use the `intybasic_linux` ELF that ships in
  Oscar's release tarball)
- `as1600` from jzIntv (`cd jzintv && make` builds `bin/as1600`)

Then uncomment the `COPY vendor/intellivision-toolchain/` lines in the
Dockerfile.

### Option B: install via env vars at runtime

Provide a separate volume with the binaries mounted in and point the env
vars at them:

```bash
docker run \
    -v /opt/intellivision-toolchain:/toolchain:ro \
    -e OVL_INTYBASIC_PATH=/toolchain/intybasic \
    -e OVL_AS1600_PATH=/toolchain/as1600 \
    -e OVL_INTYBASIC_LIBRARY_PATH=/toolchain \
    intellivision-overlay-editor
```

### Option C: compile inside the image

Build IntyBASIC and as1600 from source as part of `docker build`. Adds a few
hundred MB of build tooling unless multi-stage. Not currently set up — open a
PR if you go this route.

## Wrapper template

The compile pipeline wraps the user's source in this minimal IntyBASIC stub:

```basic
main:
    PLAY SIMPLE
    PLAY <song_label>
wait_loop:
    WAIT
    GOTO wait_loop

<user's serialized MUSIC source goes here, including its own label>
```

`PLAY SIMPLE` initializes the music engine for both base PSG and ECS (the
8-arg `MUSIC` lines are detected at compile time and toggle ECS support
automatically — no separate `PLAY FULL` needed for our usage).

`song_label` is detected from the source by sniffing the first `LABEL:` if not
passed explicitly.

## Limitations

- **IntyBASIC engine only.** The button is hidden when Chevallier Tracker is
  active — Tracker round-trip (serialize back to assembly) is Phase 2.
- **No caching.** Each click re-compiles. Compile time on a dev box is ~80 ms
  total, so a few iterations a minute is fine. For prod traffic, add a hash
  cache on the source string.
- **No streaming compile.** The 20-second timeout on each subprocess covers
  realistic worst cases, but a malicious huge source could still hold a worker
  thread.

## Diagnosing problems

| Symptom | Likely cause |
|---|---|
| Button never appears | `/music/compile_rom/status` returns `available: false` — one of `intybasic` / `as1600` / `library` is `false`. Check that path. |
| "intybasic failed" with `INCLUDE not successful` | Library path is wrong. `intybasic_prologue.asm` must be in the configured library directory. |
| "as1600 failed" with assembly errors | The IntyBASIC compiler emitted something the assembler can't handle. Check the `MUSIC` source for malformed tokens (the editor's serializer doesn't usually do this, but pasted source might). |
| ROM loads but plays silence | The song label detection grabbed the wrong label. Pass `song_label` explicitly in the compile request. |
