' ============================================================
' DnB GAMEPLAY TRACK - "Grid Runner"
' PLAY SIMPLE (2 channels for music, ch3 free for SFX)
'
' Design philosophy:
'   - DRUMS FIRST. M1/M2/M3 patterns ARE the track.
'   - Melodies complement the rhythm, never compete with it.
'   - Bass locks to kick. Melody breathes in the gaps.
'   - Two layers that weave — bass on ch2, melody fragments on ch1.
'   - 12-bar loop (not 8) so the repeat point is less predictable.
'   - Asymmetric phrasing: 4+4+4 structure but bars aren't identical.
'
' Ch1 = Melodic fragments (clarinet X — low octave, warm under drums)
' Ch2 = Bass line (bass Z — locked to kick pattern)
' Drums = M1(kick), M2(snare), M3(hat)
'
' Tempo 6 (~120 BPM, driving but not frantic)
' Melody range: E3-A4 (sits under SFX frequencies)
'
' Estimated: ~196 words (12 bars x 16 steps + overhead)
' ============================================================

GridRunnerLow:
  DATA 6

GridRunnerLow_loop:

  ' ==== Bars 1-4: Groove Lock ====
  ' Bass and drums only for bars 1-2, melody sneaks in bars 3-4.
  ' The ear learns the rhythm before anything melodic distracts.

  ' --- Bar 1: Pure groove — kick/snare/hat, bass locked to kicks ---
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 2: Same groove, bass walks to A2 ---
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC -,   A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 3: Melody enters — short stabs in the hat gaps ---
  MUSIC E3X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC G3X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E3X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC B3X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC G3X, -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 4: Melody answers, descending ---
  MUSIC A3X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G3X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E3X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC D3X, G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC E3X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' ==== Bars 5-8: Elevation ====
  ' Melody gets more confident. Bass stays locked but walks more.
  ' The rhythm never changes — drums are the constant.

  ' --- Bar 5: Melody climbs, C major color ---
  MUSIC C4X, C3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E4X, C3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC D4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC C4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   C3Z, -, M2

  ' --- Bar 6: D tension, melody thins ---
  MUSIC D4X, D3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC F3#X,D3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC A3X, A2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   D3Z, -, M2

  ' --- Bar 7: Em return, melody in low register ---
  MUSIC E3X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G3X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC B3X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G3X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC E3X, G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC D3X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC E3X, -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 8: Breakdown — melody vanishes, just drums + bass ---
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   E2Z, -, M2

  ' ==== Bars 9-12: Peak ====
  ' Both layers at full intensity. Melody is syncopated against drums.
  ' This is the section that should make you nod your head.

  ' --- Bar 9: Full intensity, call ---
  MUSIC E4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E4X, -,   -, M3
  MUSIC G4X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC E4X, -,   -, M3
  MUSIC D4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC B3X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC D4X, -,   -, M3
  MUSIC E4X, E2Z, -, M2

  ' --- Bar 10: Response, bass goes chromatic ---
  MUSIC G4X, G2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E4X, -,   -, M3
  MUSIC D4X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E4X, F2#Z,-, M1
  MUSIC D4X, S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC B3X, E2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC D4X, -,   -, M1
  MUSIC E4X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 11: Climax phrase, Am color ---
  MUSIC A4X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G4X, -,   -, M3
  MUSIC E4X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC D4X, -,   -, M3
  MUSIC E4X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC C4X, E2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 12: Exhale — melody evaporates, drums thin, turnaround ---
  MUSIC E3X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M1

  ' --- Bar 13: Bridge — space before the loop restarts ---
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3

  MUSIC JUMP GridRunnerLow_loop
