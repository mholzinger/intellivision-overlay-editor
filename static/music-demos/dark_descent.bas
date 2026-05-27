' ============================================================
' "Dark Descent" — Boss / Tension Track
' PLAY SIMPLE (ch3 free for SFX)
'
' Chromatic, dissonant, heavy. For boss fights or final waves.
' Ch1 = Stabbing minor 2nd intervals (clarinet X, aggressive)
' Ch2 = Grinding chromatic bass walk (bass Z)
' Drums = Sparse, heavy kicks with silence between
'
' 8-bar loop, tempo 7 (~107 BPM, slow and crushing)
' ============================================================

DarkDescent:
  DATA 7

DarkDescent_loop:

  ' --- Bar 1: Grinding bass, no melody yet ---
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   F2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -

  ' --- Bar 2: Bass keeps crawling chromatically ---
  MUSIC -,   F2#Z,-, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   G2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -

  ' --- Bar 3: Stabs enter — minor 2nds, dissonant ---
  MUSIC E4X, E2Z, -, M1
  MUSIC F4X, S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC E4X, -,   -, -
  MUSIC -,   -,   -, -
  MUSIC F4X, F2Z, -, M1
  MUSIC E4X, S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -

  ' --- Bar 4: Stabs widen — tritone ---
  MUSIC B3X, F2#Z,-, M1
  MUSIC F4X, S,   -, -
  MUSIC -,   -,   -, -
  MUSIC B3X, -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC F4X, -,   -, -
  MUSIC -,   -,   -, -
  MUSIC B3X, G2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -

  ' --- Bar 5: Relentless — every beat gets a stab ---
  MUSIC E4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC F4X, -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC E4X, -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC D4X, -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC E4X, F2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC F4X, -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC E4X, -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC B3X, -,   -, -
  MUSIC -,   -,   -, M3

  ' --- Bar 6: Climbing tension ---
  MUSIC G4X, G2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC A4X, -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC B4X, -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC A4X, -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC G4X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC F4#X,-,   -, -
  MUSIC -,   -,   -, M3
  MUSIC G4X, -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3

  ' --- Bar 7: Peak — chromatic descent from B4 ---
  MUSIC B4X, B2Z, -, M1
  MUSIC A4#X,S,   -, M3
  MUSIC A4X, -,   -, -
  MUSIC G4#X,-,   -, M3
  MUSIC G4X, -,   -, M2
  MUSIC F4#X,-,   -, M3
  MUSIC F4X, -,   -, -
  MUSIC E4X, -,   -, M3
  MUSIC D4#X,E2Z, -, M1
  MUSIC D4X, S,   -, M3
  MUSIC C4#X,-,   -, -
  MUSIC C4X, -,   -, M3
  MUSIC B3X, -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -

  ' --- Bar 8: Silence before the storm — just bass pulse ---
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   E2Z, -, M1
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M1

  MUSIC JUMP DarkDescent_loop
