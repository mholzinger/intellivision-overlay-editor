# ZMUS engine — vendored

`zmus_engine.bas` is the IntyBASIC-wrapped microprogrammed music engine for
the Intellivision. It's served from this directory by the editor whenever a
user clicks **🗂️ Export Bundle** with the ZMUS engine selected, and gets
zipped into the bundle alongside the song data + `main.bas` shell.

## Upstream

[`intv-game-builder/lib/zmus_engine.bas`](https://github.com/mholzinger/intv-game-builder/blob/main/lib/zmus_engine.bas)
— this file is a verbatim copy. Keep them in sync when the upstream is
updated.

## Origin

The microprogrammed music format and the player loop are Joe Zbiciak's work
(see `static/js/modules/music/engines/zmusEngine.js` header for the algorithm
credit + CP1610 implementation notes). This `.bas` wrapper is the
IntyBASIC-integrated version from `intv-game-builder`.

## Distribution

Bundled exports include this file as-is plus a top-level `README.md`
explaining where it came from. Users compile their bundle with `intybasic` +
`as1600` exactly as documented in the bundle README.
