' ============================================================
' SHOWCASE TRACK - "Neon Cathedral"
' PLAY FULL (3 channels, no SFX room)
'
' Ambient electronic — inspired by early 90s UK electronica.
' Slow build, wide arpeggios, deep bass, cathedral reverb feel.
' Ch1 = Arpeggiated lead (clarinet timbre for warmth)
' Ch2 = Pad/harmony (flute timbre for breath)
' Ch3 = Deep bass pulse (bass timbre)
'
' 16-bar loop, tempo 8 (~100 BPM, stately)
' Estimated: ~260 words
' ============================================================

NeonCathedral:
  DATA 8

NeonCathedral_loop:

  ' ==== Section A: Emergence (bars 1-4) ====
  ' Bass pulse establishes Em, lead arpeggio rises slowly

  ' --- Bar 1: Bass alone, establishing presence ---
  MUSIC -,    -,    E2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    E2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    G2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 2: Lead enters, tentative ---
  MUSIC E4X,  -,    E2Z, -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC G4X,  -,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC -,    -,    E2Z, -
  MUSIC -,    -,    S,   -
  MUSIC B4X,  -,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC G4X,  -,    G2Z, -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 3: Pad joins, harmony thickens (G major) ---
  MUSIC G4X,  B3Y,  G2Z, -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC B4X,  S,    -,   -
  MUSIC S,    S,    -,   -
  MUSIC -,    -,    G2Z, -
  MUSIC -,    -,    S,   -
  MUSIC D5X,  D4Y,  S,   -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    -,   -
  MUSIC -,    S,    -,   -
  MUSIC B4X,  S,    B2Z, -
  MUSIC S,    S,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 4: Full texture, Em → Am movement ---
  MUSIC E5X,  E4Y,  A2Z, -
  MUSIC S,    S,    S,   -
  MUSIC D5X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC B4X,  C4Y,  -,   -
  MUSIC S,    S,    -,   -
  MUSIC -,    S,    A2Z, -
  MUSIC -,    S,    S,   -
  MUSIC A4X,  S,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC E4X,  -,    E2Z, -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' ==== Section B: Elevation (bars 5-8) ====
  ' Lead climbs higher, bass goes walking, pad sustains

  ' --- Bar 5: C major brightness ---
  MUSIC C5X,  E4Y,  C3Z, -
  MUSIC S,    S,    S,   -
  MUSIC E5X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC G5X,  G4Y,  -,   -
  MUSIC S,    S,    -,   -
  MUSIC E5X,  S,    C3Z, -
  MUSIC S,    S,    S,   -
  MUSIC C5X,  S,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    G2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 6: D sus, tension ---
  MUSIC D5X,  A4Y,  D3Z, -
  MUSIC S,    S,    S,   -
  MUSIC F5#X, S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC A5X,  S,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC F5#X, F4#Y, D3Z, -
  MUSIC S,    S,    S,   -
  MUSIC D5X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    A2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 7: Back to Em, descending ---
  MUSIC B5X,  G4Y,  E2Z, -
  MUSIC S,    S,    S,   -
  MUSIC G5X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC E5X,  E4Y,  -,   -
  MUSIC S,    S,    -,   -
  MUSIC B4X,  S,    E2Z, -
  MUSIC S,    S,    S,   -
  MUSIC G4X,  S,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC E4X,  -,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC -,    -,    B2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 8: Breath — sparse, resolving ---
  MUSIC E4X,  B3Y,  E2Z, -
  MUSIC S,    S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC G4X,  -,    E2Z, -
  MUSIC S,    -,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -

  ' ==== Section C: Cathedral (bars 9-12) ====
  ' Wide octave arpeggios, bass pedal, maximum space

  ' --- Bar 9: Em pedal, wide arpeggio ---
  MUSIC E3X,  B3Y,  E2Z, -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC B4X,  S,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC -,    -,    E2Z, -
  MUSIC -,    -,    S,   -
  MUSIC E5X,  E4Y,  S,   -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    -,   -
  MUSIC -,    S,    -,   -
  MUSIC B4X,  S,    G2Z, -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 10: G, descending mirror ---
  MUSIC G5X,  D4Y,  G2Z, -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC D5X,  S,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC -,    -,    G2Z, -
  MUSIC -,    -,    S,   -
  MUSIC B4X,  B3Y,  S,   -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    -,   -
  MUSIC -,    S,    -,   -
  MUSIC G4X,  S,    D2Z, -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 11: Am, melancholy turn ---
  MUSIC A4X,  C4Y,  A2Z, -
  MUSIC S,    S,    S,   -
  MUSIC C5X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC E5X,  E4Y,  -,   -
  MUSIC S,    S,    -,   -
  MUSIC C5X,  S,    A2Z, -
  MUSIC S,    S,    S,   -
  MUSIC A4X,  S,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC E4X,  -,    E2Z, -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 12: B7, tension before resolve ---
  MUSIC F4#X, D4#Y, B2Z, -
  MUSIC S,    S,    S,   -
  MUSIC B4X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC D5#X, S,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC F5#X, F4#Y, B2Z, -
  MUSIC S,    S,    S,   -
  MUSIC D5#X, S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC B4X,  S,    -,   -
  MUSIC S,    -,    -,   -
  MUSIC -,    -,    B2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' ==== Section D: Return (bars 13-16) ====
  ' Recapitulation with subtle changes, fade to loop point

  ' --- Bar 13: Em return, but higher register ---
  MUSIC E5X,  G4Y,  E2Z, -
  MUSIC S,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC -,    S,    S,   -
  MUSIC B5X,  B4Y,  -,   -
  MUSIC S,    S,    -,   -
  MUSIC G5X,  S,    E2Z, -
  MUSIC S,    S,    S,   -
  MUSIC E5X,  S,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    G2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 14: G major echo ---
  MUSIC D5X,  B3Y,  G2Z, -
  MUSIC S,    S,    S,   -
  MUSIC B4X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC G4X,  G3Y,  -,   -
  MUSIC S,    S,    -,   -
  MUSIC -,    S,    D3Z, -
  MUSIC -,    S,    S,   -
  MUSIC D4X,  S,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    G2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 15: Am → Em, final descent ---
  MUSIC A4X,  E4Y,  A2Z, -
  MUSIC S,    S,    S,   -
  MUSIC E4X,  S,    S,   -
  MUSIC S,    S,    S,   -
  MUSIC -,    C4Y,  -,   -
  MUSIC -,    S,    -,   -
  MUSIC -,    S,    E2Z, -
  MUSIC -,    S,    S,   -
  MUSIC G4X,  B3Y,  S,   -
  MUSIC S,    S,    S,   -
  MUSIC E4X,  S,    -,   -
  MUSIC S,    S,    -,   -
  MUSIC -,    -,    E2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    S,   -

  ' --- Bar 16: Dissolve — sparse, breath before loop ---
  MUSIC E4X,  -,    E2Z, -
  MUSIC S,    -,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC S,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    E2Z, -
  MUSIC -,    -,    S,   -
  MUSIC -,    -,    -,   -
  MUSIC -,    -,    -,   -

  MUSIC JUMP NeonCathedral_loop
