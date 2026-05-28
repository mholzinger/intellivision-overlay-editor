# vendor/intellivision-toolchain/

This directory is where the IntyBASIC + jzIntv build artifacts live for the
Docker image that needs WASM-playback support. Empty in the repo — populated
locally before running `docker build`. See [../../docs/wasm-playback.md](../../docs/wasm-playback.md)
for the full setup.

## What to drop in

```
vendor/intellivision-toolchain/
├── intybasic                       # Linux x86_64 build of IntyBASIC compiler
├── as1600                          # Linux x86_64 build of jzIntv assembler
├── intybasic_prologue.asm
├── intybasic_epilogue.asm
└── README.md                       # ← this file (tracked)
```

Everything except this README is `.gitignore`d to avoid checking in
several-hundred-KB binaries.

## Where to get the artifacts

- **intybasic** — from [Oscar Toledo's IntyBASIC distribution](https://nanochess.org/intybasic.html).
  Either grab `intybasic_linux` from the release zip or compile via
  `make -C source/` against the distribution source.
- **as1600** — from [Joe Zbiciak's jzIntv source](https://spatula-city.org/~im14u2c/intv/).
  Build with `make` in the jzIntv tree; the binary lands at `bin/as1600`.
- **intybasic_prologue.asm** + **intybasic_epilogue.asm** — ship at the top
  level of the IntyBASIC distribution. Copy both as-is.

## After populating

Edit the `Dockerfile` and uncomment the `COPY` lines in the
`Music Studio: WASM playback toolchain` section. Then `docker build` as usual.

Verify on the running container:

```bash
docker exec <container> curl -s localhost:5000/music/compile_rom/status
# → {"available":true,"intybasic":true,"as1600":true,"library":true}
```
