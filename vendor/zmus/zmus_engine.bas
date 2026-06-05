' ============================================
' ZMUS - Microprogrammed Music Engine Library
' ============================================
' A reusable assembly-based music player for IntyBASIC
'
' USAGE:
'   1. INCLUDE this file in your main program
'   2. INCLUDE your music data file (with ZMUS-format DECLE data)
'   3. Call the routines via USR:
'
'      USR ZMUS_INIT              ' Initialize (call once at startup)
'      USR ZMUS_PLAY(SongLabel)   ' Start playing a song
'      USR ZMUS_UPDATE            ' Call every frame in game loop
'      USR ZMUS_STOP              ' Stop playback and silence
'      USR ZMUS_TEST              ' Play a test tone (A4, 440Hz)
'
' MEMORY USAGE:
'   - Code placed at $D000 (extra ROM space)
'   - Stream record at $360-$363 (4 words in RAM)
'   - Uses PSG registers $1F0-$1FF
'
' NOTES:
'   - This engine uses microprogrammed music data format
'   - Different from IntyBASIC's native MUSIC/PLAY system
'   - Supports 3 tone channels with volume control
'   - Does NOT use IntyBASIC's PLAY SIMPLE/FULL commands
'
' ============================================

' --- Assembly Music Engine ---
' Place in segment $D000 for extra ROM space

ASM ORG $D000
ASM ROMW 16

' Music stream record in RAM at $360-$363
' (4 words: hold count, data pointer, control word, channel mask)

' ==========================================================================
'  ZMUS_INIT - Initialize the music engine
'  Call once at program startup before using other ZMUS functions
' ==========================================================================
ASM ZMUS_INIT:  PROC
ASM         PSHR    R5
ASM         ; Initialize stream record at $360-$363
ASM         CLRR    R0
ASM         MVO     R0,     $360    ; Hold count = 0 (inactive)
ASM         MVO     R0,     $361    ; Data pointer = 0
ASM         MVO     R0,     $362    ; Control word = 0
ASM         MVII    #$3FFF, R0
ASM         MVO     R0,     $363    ; Channel mask = all
ASM         PULR    PC
ASM         ENDP

' ==========================================================================
'  ZMUS_PLAY - Start playing a song
'  Call with: USR ZMUS_PLAY(song_label)
'  R0 = pointer to music data
' ==========================================================================
ASM ZMUS_PLAY:  PROC
ASM         PSHR    R5
ASM         ; Clear PSG: periods and volumes
ASM         CLRR    R1
ASM         MVO     R1,     $1F0    ; Period A low
ASM         MVO     R1,     $1F1    ; Period B low
ASM         MVO     R1,     $1F2    ; Period C low
ASM         MVO     R1,     $1F4    ; Period A high
ASM         MVO     R1,     $1F5    ; Period B high
ASM         MVO     R1,     $1F6    ; Period C high
ASM         MVII    #$38,   R1      ; Tone only (no noise)
ASM         MVO     R1,     $1F8    ; Channel enables
ASM         CLRR    R1
ASM         MVO     R1,     $1FB    ; Volume A = 0
ASM         MVO     R1,     $1FC    ; Volume B = 0
ASM         MVO     R1,     $1FD    ; Volume C = 0
ASM         ; Set up stream record at $360 (use direct MVO, not R4)
ASM         MVII    #2,     R1
ASM         MVO     R1,     $360    ; Hold count = 2
ASM         MVO     R0,     $361    ; Data pointer = music address
ASM         CLRR    R1
ASM         MVO     R1,     $362    ; Control word = 0
ASM         MVII    #$3FFF, R1
ASM         MVO     R1,     $363    ; Channel mask = all
ASM         PULR    PC
ASM         ENDP

' ==========================================================================
'  ZMUS_STOP - Stop music playback and silence all channels
' ==========================================================================
ASM ZMUS_STOP:  PROC
ASM         PSHR    R5
ASM         CLRR    R0
ASM         MVO     R0,     $1FB    ; Volume A = 0
ASM         MVO     R0,     $1FC    ; Volume B = 0
ASM         MVO     R0,     $1FD    ; Volume C = 0
ASM         MVO     R0,     $360    ; Hold count = 0 (inactive)
ASM         PULR    PC
ASM         ENDP

' ==========================================================================
'  ZMUS_TEST - Play a test tone on channel A (A4, 440Hz)
'  Useful for verifying PSG access is working
' ==========================================================================
ASM ZMUS_TEST:  PROC
ASM         PSHR    R5
ASM         ; Set period for A4 (440Hz) - period = ~254 for NTSC
ASM         MVII    #$FE,   R0
ASM         MVO     R0,     $1F0    ; Period A low
ASM         CLRR    R0
ASM         MVO     R0,     $1F4    ; Period A high
ASM         ; Enable tone A only (bits 0-2 = tone, 3-5 = noise, 0=on)
ASM         MVII    #$3E,   R0      ; Tone A on, rest off
ASM         MVO     R0,     $1F8    ; Channel enable
ASM         ; Set volume to max on channel A
ASM         MVII    #$0F,   R0
ASM         MVO     R0,     $1FB    ; Volume A
ASM         CLRR    R0
ASM         MVO     R0,     $1FC    ; Volume B = 0
ASM         MVO     R0,     $1FD    ; Volume C = 0
ASM         PULR    PC
ASM         ENDP

' ==========================================================================
'  ZMUS_UPDATE - Update music stream (call each frame in game loop)
'  IMPORTANT: Preserves R4 (IntyBASIC stack pointer)
' ==========================================================================
ASM ZMUS_UPDATE: PROC
ASM         PSHR    R5
ASM         PSHR    R4              ; Save IntyBASIC stack pointer!
ASM         MVII    #$360, R4
ASM         MVI@    R4,     R1
ASM         SUBI    #2,     R1
ASM         BMI     @@inactive
ASM         BEQ     @@nextrec
ASM         DECR    R4
ASM         MVO@    R1,     R4
ASM @@inactive:
ASM         PULR    R4              ; Restore R4
ASM         PULR    PC
ASM @@backup:
ASM         DECR    R4
ASM @@nextrec:
ASM         MVI@    R4,     R5
ASM         TSTR    R5
ASM         BEQ     @@inactive
ASM         MVI@    R5,     R2
ASM         MOVR    R2,     R3
ASM         ANDI    #$000F, R3
ASM         MOVR    R3,     R0
ASM         INCR    R3
ASM         SLL     R3,     2
ASM         SLL     R3,     2
ASM         ADDR    R3,     R0
ASM         MVI@    R4,     R3
ASM         SLR     R2,     2
ASM         SLR     R2,     2
ASM         MOVR    R2,     R1
ASM         ANDI    #$003F, R1
ASM         ADDR    R3,     R1
ASM @@loop:
ASM         SARC    R0,     1
ASM         BNC     @@noread
ASM @@read:
ASM         MVI@    R5,     R3
ASM         SWAP    R3
ASM         XORR    R3,     R2
ASM         ANDI    #$FF00, R2
ASM         XORR    R3,     R2
ASM         SWAP    R3
ASM         MVO@    R3,     R1
ASM @@noread:
ASM         INCR    R2
ASM         SARC    R0,     1
ASM         SARC    R1,     1
ASM         BNEQ    @@loop
ASM         BC      @@read
ASM @@finish:
ASM         SLLC    R2,     2
ASM         SLR     R2,     2
ASM         SWAP    R2
ASM         MVI@    R4,     R3
ASM         XORR    R2,     R3
ASM         ANDI    #$00FF, R3
ASM         XORR    R2,     R3
ASM         MVO@    R3,     R4
ASM         MOVR    R2,     R3
ASM         ANDI    #$003F, R3
ASM         MVI@    R5,     R0
ASM         ADDR    R0,     R3
ASM         DECR    R4
ASM         DECR    R4
ASM         MVO@    R3,     R4
ASM @@zloop:
ASM         INCR    R2
ASM         SARC    R0,     1
ASM         BNEQ    @@zloop
ASM         BNC     @@zlink
ASM         MVO@    R3,     R2
ASM @@zlink:
ASM         SLLC    R1,     2
ASM         BNOV    @@nolink
ASM         MVI@    R5,     R3
ASM         MVO@    R3,     R4
ASM         PULR    R4              ; Restore R4
ASM         PULR    PC
ASM @@waslink:
ASM         MVO@    R5,     R4
ASM @@return:
ASM         PULR    R4              ; Restore R4
ASM         PULR    PC
ASM @@nolink:
ASM         CMP@    R4,     R5
ASM         BLE     @@return
ASM         DECR    R4
ASM         B       @@waslink
ASM         ENDP

' ============================================
' END OF ZMUS ENGINE LIBRARY
' ============================================
