' ============================================================
' Grid Runner TEMPO STUBS — 2 words each
' Reuses GridRunner_loop body at different speeds.
' These are separate from the octave gears.
' ============================================================

GridRunnerSlow:
  DATA 8
  MUSIC JUMP GridRunner_loop

GridRunnerFast:
  DATA 4
  MUSIC JUMP GridRunner_loop

GridRunnerPanic:
  DATA 3
  MUSIC JUMP GridRunner_loop
