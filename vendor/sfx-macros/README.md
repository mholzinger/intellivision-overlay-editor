# SFX Macros (reference)

Reference material for the **Intellivision Overlay Editor → SFX Lab**.

## What's here

`S.ASM` — a set of `as1600`-compatible assembler macros that define a
**bytecode SFX language**. Each macro (`FREQ`, `EFREQ`, `VOL`, `VOLV`,
`PAUSE`, `NFREQ`, `NFREQV`, `ECHAR`, `EUSE`, `STUNIT`, `FIN`, `PDJNZ`,
`RPAUSE`, `RSETR`, `UCALL`, …) emits 16-bit `DECLE` words that a runtime
interpreter reads at game time and uses to drive the AY-3-8914 PSG
registers. The DSL supports things the PSG itself doesn't: velocity-
based parameter ramps, randomized pauses and register values, a
sub-tempo unit (`STUNIT`), and looped sequences via `PDJNZ`.

The runtime interpreter that consumes these DECLE words is **not** in
this directory. The macros emit data; without the engine that walks
that data, nothing reaches the chip. The engine is on the wishlist as
a future "SFX-engine output mode" parallel to the existing direct-`SOUND`
emission. For now this file's role is purely reference: it documents
opcode layouts so we can hand-translate example sequences into the
SFX Lab's flat `SOUND register, value` output format.

## Provenance

Contributed by **Steve Ettinger** — a longtime Intellivision developer
who generously shared this macros file along with several short SFX
sequences for use as reference in the SFX Lab. The macros file itself
is unchanged from what Steve sent; the SFX sequences are not stored
here verbatim, only their effective patches (translated into the SFX
Lab's flat format) appear in `static/js/modules/sfxEditor.js`.

The labels for those translated SFX in the editor (Tap, Knock, Cascade,
Impact, Wind, Sizzle, …) are our own naming, intentionally generic and
unrelated to any of the original games the source sequences came from.
