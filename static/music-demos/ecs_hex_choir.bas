' ECS Hex Choir — 6-voice harmony showcase
' Demonstrates the IntyBASIC ECS expansion's 8-channel MUSIC format.
'   Base PSG: 3 X-clarinet voices (lead triad)      + base drums (M1 kick / M2 snare / M3 hat)
'   ECS PSG:  3 Y-flute voices    (pad / sub-octave) + ECS drums  (M3 shimmer)
' Chord progression: C - Am - F - G, loops. Tempo 8 (~94 BPM).
'
' 4-line intro of layered drums, then 4 chord bars × 4 lines = 16-line loop body.

ECSHexChoir:
  DATA 8

  ' Intro: drums build (base kick/snare, ECS shimmer)
  MUSIC -, -, -, M1, -, -, -, M3
  MUSIC -, -, -, M3, -, -, -, M3
  MUSIC -, -, -, M2, -, -, -, M3
  MUSIC -, -, -, M3, -, -, -, M3

ECSHexChoir_loop:
  ' Bar 1: C major  ( G5  E5  C5  |  C4  E3  C3 )
  MUSIC G5X, E5X, C5X, M1, C4Y, E3Y, C3Y, M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3
  MUSIC S,   S,   S,   M2, S,   S,   S,   M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3

  ' Bar 2: A minor  ( A5  E5  C5  |  A3  E3  A2 )
  MUSIC A5X, E5X, C5X, M1, A3Y, E3Y, A2Y, M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3
  MUSIC S,   S,   S,   M2, S,   S,   S,   M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3

  ' Bar 3: F major  ( A5  F5  C5  |  A3  F3  F2 )
  MUSIC A5X, F5X, C5X, M1, A3Y, F3Y, F2Y, M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3
  MUSIC S,   S,   S,   M2, S,   S,   S,   M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3

  ' Bar 4: G major  ( G5  D5  B4  |  G3  D3  G2 )
  MUSIC G5X, D5X, B4X, M1, G3Y, D3Y, G2Y, M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3
  MUSIC S,   S,   S,   M2, S,   S,   S,   M3
  MUSIC S,   S,   S,   M3, S,   S,   S,   M3

  MUSIC JUMP ECSHexChoir_loop
