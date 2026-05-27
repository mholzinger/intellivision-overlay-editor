' ============================================================
' "Starlight" — Victory / Menu Ambient
' PLAY SIMPLE (ch3 free for SFX)
'
' Bright, optimistic, floaty. C major / A minor.
' Ch1 = Gentle arpeggios (flute Y, airy)
' Ch2 = Slow root movement (bass Z)
' Drums = Minimal — just light hats for shimmer
'
' 8-bar loop, tempo 9 (~80 BPM, breathing room)
' ============================================================

Starlight:
  DATA 9

Starlight_loop:

  ' --- Bar 1: C major, ascending sparkle ---
  MUSIC C4Y, C2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC E4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC G4Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC C5Y, S,   -, -
  MUSIC S,   S,   -, -
  MUSIC E5Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC C5Y, S,   -, -
  MUSIC S,   -,   -, M3
  MUSIC G4Y, -,   -, -
  MUSIC S,   -,   -, -
  MUSIC E4Y, -,   -, M3
  MUSIC S,   -,   -, -

  ' --- Bar 2: Am, gentle descent ---
  MUSIC A3Y, A2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC C4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC E4Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC A4Y, S,   -, -
  MUSIC S,   S,   -, -
  MUSIC E4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC C4Y, S,   -, -
  MUSIC S,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -

  ' --- Bar 3: F major, warmth ---
  MUSIC F4Y, F2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC A4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC C5Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC F5Y, S,   -, -
  MUSIC S,   S,   -, -
  MUSIC C5Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC A4Y, S,   -, -
  MUSIC S,   -,   -, M3
  MUSIC F4Y, -,   -, -
  MUSIC S,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -

  ' --- Bar 4: G sus → resolve, open ---
  MUSIC G4Y, G2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC B4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC D5Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC G5Y, S,   -, -
  MUSIC S,   S,   -, -
  MUSIC D5Y, S,   -, M3
  MUSIC S,   -,   -, -
  MUSIC B4Y, -,   -, -
  MUSIC S,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -

  ' --- Bar 5: Em, deeper color ---
  MUSIC E4Y, E2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC G4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC B4Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC E5Y, S,   -, -
  MUSIC S,   S,   -, -
  MUSIC B4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC G4Y, S,   -, -
  MUSIC S,   -,   -, M3
  MUSIC E4Y, -,   -, -
  MUSIC S,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -

  ' --- Bar 6: Am → F, movement ---
  MUSIC A4Y, A2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC C5Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC E5Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC C5Y, S,   -, -
  MUSIC S,   -,   -, -
  MUSIC F4Y, F2Z, -, M3
  MUSIC S,   S,   -, -
  MUSIC A4Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC C5Y, S,   -, -
  MUSIC S,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -

  ' --- Bar 7: Dm, bittersweet ---
  MUSIC D4Y, D2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC F4Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC A4Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC D5Y, S,   -, -
  MUSIC S,   S,   -, -
  MUSIC A4Y, S,   -, M3
  MUSIC S,   -,   -, -
  MUSIC F4Y, -,   -, -
  MUSIC S,   -,   -, M3
  MUSIC D4Y, -,   -, -
  MUSIC S,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -

  ' --- Bar 8: G → breath, dissolve to loop ---
  MUSIC G3Y, G2Z, -, -
  MUSIC S,   S,   -, -
  MUSIC B3Y, S,   -, M3
  MUSIC S,   S,   -, -
  MUSIC D4Y, S,   -, -
  MUSIC S,   S,   -, M3
  MUSIC -,   S,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -
  MUSIC -,   -,   -, -

  MUSIC JUMP Starlight_loop
