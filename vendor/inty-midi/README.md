# inty-midi (vendored)

`inty-midi` is **Patrick Pelletier's** MIDI → IntyBASIC `MUSIC` converter.
The Music Studio's **📥 MIDI** import button uses this binary server-side
to translate uploaded `.mid` files into IntyBASIC source that the editor
then parses and renders on the piano-roll.

- **Upstream:** <https://github.com/intvnut/inty-midi>
- **Version:** `0.1.0.0`
- **Architecture:** Linux x86_64 (matches the `python:3.11-slim` Docker base)
- **License:** BSD-3-Clause — see `LICENSES.txt`. Binary redistribution is
  permitted; the copyright notice and disclaimer ship alongside the binary.
- **Runtime dependency:** `libgmp10` (installed in the Dockerfile alongside
  the COPY step).

## Why it lives here

This binary is wired into the production Docker image so the **📥 MIDI**
button "just works" on the deployed fly.io site without runtime fetching
or external network dependencies. For local dev on macOS, the Flask app's
`Config.get_inty_midi_path()` will also find the Mac build at
`~/src/intv-game-builder/inty-midi-0.1.0.0-bin/mac/inty-midi`, so this
vendored Linux binary is only exercised inside Docker.

## Updating

1. Drop the new Linux build at `vendor/inty-midi/inty-midi`.
2. Update `LICENSES.txt` if upstream's licenses changed.
3. Bump the **Version** line above.
4. Rebuild the Docker image to pick up the change.
