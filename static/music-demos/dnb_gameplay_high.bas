' ============================================================
' DnB GAMEPLAY TRACK - "Grid Runner" HIGH OCTAVE VARIANT
' Same drums, same bass, melody shifted +1 octave from original.
' Urgency/tension gear — piercing melody over unchanged rhythm.
' Ch1 melody range: E5-A6
' ============================================================

GridRunnerHigh:
  DATA 6

GridRunnerHigh_loop:

  ' ==== Bars 1-4: Groove Lock ====

  ' --- Bar 1: Pure groove — no melody ---
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

  ' --- Bar 3: Melody enters — high octave stabs ---
  MUSIC E5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC G5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC B5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC G5X, -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 4: Melody answers, descending ---
  MUSIC A5X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G5X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC D5X, G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC E5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' ==== Bars 5-8: Elevation ====

  ' --- Bar 5: Melody climbs, C major color ---
  MUSIC C6X, C3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E6X, C3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC D6X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC C6X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   C3Z, -, M2

  ' --- Bar 6: D tension, melody thins ---
  MUSIC D6X, D3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC F5#X,D3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC A5X, A2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   D3Z, -, M2

  ' --- Bar 7: Em return ---
  MUSIC E5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G5X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC B5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC E5X, G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC D5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC E5X, -,   -, M3
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

  ' --- Bar 9: Full intensity, call ---
  MUSIC E6X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E6X, -,   -, M3
  MUSIC G6X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC E6X, -,   -, M3
  MUSIC D6X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E6X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC B5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC D6X, -,   -, M3
  MUSIC E6X, E2Z, -, M2

  ' --- Bar 10: Response, bass goes chromatic ---
  MUSIC G6X, G2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E6X, -,   -, M3
  MUSIC D6X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E6X, F2#Z,-, M1
  MUSIC D6X, S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC B5X, E2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC D6X, -,   -, M1
  MUSIC E6X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 11: Climax phrase, Am color ---
  MUSIC A6X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G6X, -,   -, M3
  MUSIC E6X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC D6X, -,   -, M3
  MUSIC E6X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC C6X, E2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2

  ' --- Bar 12: Exhale — melody evaporates, drums thin, turnaround ---
  MUSIC E5X, E2Z, -, M1
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

  MUSIC JUMP GridRunnerHigh_loop
