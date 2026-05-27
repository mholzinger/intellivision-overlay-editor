' ============================================================
' DnB GAMEPLAY - "Grid Runner" OCTAVE GEAR SYSTEM
' 3 gears sharing drum-only bars via MUSIC GOSUB.
' Low (calm) / Mid (original) / High (urgent)
' Total: ~466 words for 3 gears (vs 579 uncompressed)
'
' PLAY SIMPLE (ch3 free for SFX)
' Game code does: PLAY GR_Low / PLAY GR_Mid / PLAY GR_High
' ============================================================

' --- GEAR ENTRY POINTS ---

GR_Low:
  DATA 6
GR_Low_loop:
  MUSIC GOSUB GR_shared_bars12
  ' --- Bar 3: Melody enters (LOW E3-B3) ---
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
  ' --- Bar 4 (LOW) ---
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
  ' --- Bar 5 (LOW) ---
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
  ' --- Bar 6 (LOW) ---
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
  ' --- Bar 7 (LOW) ---
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
  MUSIC GOSUB GR_shared_bar8
  ' --- Bar 9 (LOW) ---
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
  ' --- Bar 10 (LOW) ---
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
  ' --- Bar 11 (LOW) ---
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
  MUSIC GOSUB GR_shared_bar12
  MUSIC JUMP GR_Low_loop


GR_Mid:
  DATA 6
GR_Mid_loop:
  MUSIC GOSUB GR_shared_bars12
  ' --- Bar 3: Melody enters (MID E4-B4) ---
  MUSIC E4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC G4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC B4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC G4X, -,   -, M3
  MUSIC -,   E2Z, -, M2
  ' --- Bar 4 (MID) ---
  MUSIC A4X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G4X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC D4X, G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC E4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2
  ' --- Bar 5 (MID) ---
  MUSIC C5X, C3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E5X, C3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC D5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC C5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   C3Z, -, M2
  ' --- Bar 6 (MID) ---
  MUSIC D5X, D3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC F4#X,D3Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC A4X, A2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   D3Z, -, M2
  ' --- Bar 7 (MID) ---
  MUSIC E4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G4X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC B4X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC E4X, G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC D4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC E4X, -,   -, M3
  MUSIC -,   E2Z, -, M2
  MUSIC GOSUB GR_shared_bar8
  ' --- Bar 9 (MID) ---
  MUSIC E5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E5X, -,   -, M3
  MUSIC G5X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC E5X, -,   -, M3
  MUSIC D5X, E2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E5X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   G2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC B4X, -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC D5X, -,   -, M3
  MUSIC E5X, E2Z, -, M2
  ' --- Bar 10 (MID) ---
  MUSIC G5X, G2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC E5X, -,   -, M3
  MUSIC D5X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC -,   -,   -, M3
  MUSIC E5X, F2#Z,-, M1
  MUSIC D5X, S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC B4X, E2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC D5X, -,   -, M1
  MUSIC E5X, -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2
  ' --- Bar 11 (MID) ---
  MUSIC A5X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC G5X, -,   -, M3
  MUSIC E5X, -,   -, M3
  MUSIC -,   -,   -, M2
  MUSIC D5X, -,   -, M3
  MUSIC E5X, A2Z, -, M1
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC C5X, E2Z, -, M2
  MUSIC -,   S,   -, M3
  MUSIC -,   -,   -, M1
  MUSIC -,   -,   -, M3
  MUSIC -,   -,   -, M3
  MUSIC -,   E2Z, -, M2
  MUSIC GOSUB GR_shared_bar12
  MUSIC JUMP GR_Mid_loop


GR_High:
  DATA 6
GR_High_loop:
  MUSIC GOSUB GR_shared_bars12
  ' --- Bar 3: Melody enters (HIGH E5-B5) ---
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
  ' --- Bar 4 (HIGH) ---
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
  ' --- Bar 5 (HIGH) ---
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
  ' --- Bar 6 (HIGH) ---
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
  ' --- Bar 7 (HIGH) ---
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
  MUSIC GOSUB GR_shared_bar8
  ' --- Bar 9 (HIGH) ---
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
  ' --- Bar 10 (HIGH) ---
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
  ' --- Bar 11 (HIGH) ---
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
  MUSIC GOSUB GR_shared_bar12
  MUSIC JUMP GR_High_loop


' --- SHARED DRUM-ONLY SECTIONS (exist once) ---

GR_shared_bars12:
  ' --- Bar 1: Pure groove ---
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
  ' --- Bar 2: Bass walks to A2 ---
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
  MUSIC RETURN

GR_shared_bar8:
  ' --- Bar 8: Breakdown ---
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
  MUSIC RETURN

GR_shared_bar12:
  ' --- Bar 12: Exhale ---
  MUSIC -,   E2Z, -, M1
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
  MUSIC RETURN
