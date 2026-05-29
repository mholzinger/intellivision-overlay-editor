;; ======================================================================== ;;
;;  SONG: Beat It - Michael Jackson                                         ;;
;;      Tracked originally in IBN by: Adán Toledo (nyuundere)               ;;
;;      Tracked & remixed in IMT by:  James Pujals (DZ-Jay)                 ;;
;; ======================================================================== ;;
BEAT_IT     PROC

; ------------------------------------------------------------------------- ;
;  Song Header                                                              ;
; ------------------------------------------------------------------------- ;
            DECLE   5, @@patterns, @@instr, @@drums

; ------------------------------------------------------------------------- ;
;  Sequence                                                                 ;
; ------------------------------------------------------------------------- ;
            DECLE    0,  0,  0,  1                      ; Intro beat
            DECLE    2,  3,  4,  5                      ; Chorus (Guitar)
            
            DECLE    6,  7,  8,  9, 10, 11, 12, 13      ; 1st Verse
            DECLE   14, 15, 16, 17, 18, 19              ; Chorus (Vocal)
            
            DECLE    6,  7,  8,  9, 10, 11, 12, 13      ; 2st Verse
            DECLE   14, 15, 16, 17, 20, 15, 16, 21      ; Chorus (Vocal)

            DECLE   22, 23, 22, 24, 25, 26, 27, 28      ; Break
            DECLE   29, 30, 31, 32, 33, 34, 35, 36      ; Break (Synth)
            
            DECLE   14, 15, 16, 17, 20, 15, 16, 21      ; Chorus (Vocal)
            DECLE   14, 15, 16, 17, 18, 18, 22, 23      ; Chorus (Reprise)

            DECLE   37, 38, 39                          ; End
            DECLE   TRK_END_SONG

; ------------------------------------------------------------------------- ;
;  Channel Patterns                                                         ;
; ------------------------------------------------------------------------- ;
            ;              A       B       F       D       C       E
            ;           Drums1   Bass   Rhythm  Drums2  Guitar  Unused
            ;           ------  ------  ------  ------  ------  ------
@@patterns: DECLE   32, @@pd01, @@p000, @@p000, @@pd11, @@p000, @@p000  ; #0    - Intro
            DECLE   32, @@pd02, @@pb00, @@p000, @@pd12, @@pg00, @@p000  ; #1

            DECLE   32, @@pd01, @@pb01, @@p000, @@pd15, @@pg01, @@p000  ; #2    - Chorus (Guitar)
            DECLE   32, @@pd01, @@pb02, @@pr00, @@pd16, @@pg02, @@p000  ; #3
            DECLE   32, @@pd01, @@pb01, @@pr01, @@pd16, @@pg01, @@p000  ; #4
            DECLE   32, @@pd04, @@pb03, @@pr02, @@pd18, @@pg03, @@p000  ; #5

            ; Verse:
            ; --------------------------------------------------------
            ;           Drums1   Bass    Vox    Drums2  Guitar  VxEcho
            ;           ------  ------  ------  ------  ------  ------
            DECLE   32, @@pd01, @@pb11, @@pv01, @@pd11, @@p000, @@pv11  ; #6    - Verse A
            DECLE   32, @@pd01, @@pb11, @@pv02, @@pd11, @@p000, @@pv12  ; #7
            DECLE   32, @@pd01, @@pb12, @@pv03, @@pd11, @@p000, @@pv13  ; #8
            DECLE   32, @@pd01, @@pb11, @@pv04, @@pd11, @@p000, @@pv14  ; #9

            DECLE   32, @@pd01, @@pb11, @@pv05, @@pd13, @@p000, @@pv15  ; #10   - Verse B
            DECLE   32, @@pd01, @@pb11, @@pv06, @@pd11, @@p000, @@pv16  ; #11
            DECLE   32, @@pd01, @@pb12, @@pv07, @@pd11, @@p000, @@pv17  ; #12
            DECLE   32, @@pd02, @@pb13, @@pv08, @@pd12, @@pg00, @@pv18  ; #13

            ; Chorus:
            ; --------------------------------------------------------
            ;           Drums1   Bass    Vox    Drums2  Guitar  VxEcho
            ;           ------  ------  ------  ------  ------  ------
            DECLE   32, @@pd01, @@pb01, @@pc01, @@pd15, @@pg01, @@pc11  ; #14   - Chorus A (Vocal)
            DECLE   32, @@pd01, @@pb02, @@pc02, @@pd16, @@pg02, @@pc12  ; #15
            DECLE   32, @@pd01, @@pb01, @@pc03, @@pd16, @@pg01, @@pc13  ; #16
            DECLE   32, @@pd01, @@pb02, @@pc04, @@pd16, @@pg02, @@pc14  ; #17

            DECLE   32, @@pd01, @@pb01, @@pc05, @@pd14, @@pg01, @@pc15  ; #18   - Chorus B (Vocal)
            DECLE   32, @@pd04, @@pb03, @@pc06, @@pd18, @@pg03, @@pc16  ; #19

            DECLE   32, @@pd01, @@pb01, @@pc01, @@pd14, @@pg01, @@pc11  ; #20   - Chorus C (Vocal)
            DECLE   32, @@pd02, @@pb02, @@pc04, @@pd17, @@pg02, @@pc14  ; #21

            ; Break:
            ; --------------------------------------------------------
            ;           Drums1   Bass   VxEcho  Drums2  Guitar  VxEcho
            ;           ------  ------  ------  ------  ------  ------
            DECLE   32, @@pd01, @@pb21, @@pv21, @@pd14, @@pg21, @@pv23  ; #22   - Break A (Beat)
            DECLE   32, @@pd01, @@pb21, @@pv22, @@pd16, @@pg21, @@pv24  ; #23
            DECLE   32, @@pd01, @@pb21, @@pv22, @@pd16, @@pg21, @@pv25  ; #24

            ;           Drums1   Bass   VxEcho  Drums2  Guitar  Rhythm
            ;           ------  ------  ------  ------  ------  ------
            DECLE   32, @@pd01, @@pb21, @@p000, @@pd14, @@pg21, @@pr21  ; #25   - Break B (Guitar)
            DECLE   32, @@pd01, @@pb21, @@pv26, @@pd16, @@pg21, @@pr21  ; #26
            DECLE   32, @@pd01, @@pb21, @@pv21, @@pd16, @@pg21, @@pr21  ; #27
            DECLE   32, @@pd02, @@pb21, @@pv22, @@pd17, @@pg21, @@pr22  ; #28

            ;           Drums1   Bass   VxEcho  Drums2  Guitar  VxEcho
            ;           ------  ------  ------  ------  ------  ------
            DECLE   32, @@pd01, @@pb11, @@pv11, @@pd15, @@p000, @@p000  ; #29   - Break C (Synth)
            DECLE   32, @@pd01, @@pb11, @@pv12, @@pd16, @@p000, @@p000  ; #30
            DECLE   32, @@pd01, @@pb12, @@pv13, @@pd16, @@p000, @@p000  ; #31
            DECLE   32, @@pd01, @@pb11, @@pv14, @@pd16, @@p000, @@p000  ; #32

            DECLE   32, @@pd01, @@pb11, @@pv15, @@pd14, @@p000, @@pv35  ; #33   - Break D (Synth)
            DECLE   32, @@pd01, @@pb11, @@pv16, @@pd16, @@p000, @@pv36  ; #34
            DECLE   32, @@pd01, @@pb12, @@pv17, @@pd16, @@p000, @@pv37  ; #35
            DECLE   32, @@pd02, @@pb13, @@pv18, @@pd17, @@pg00, @@pv38  ; #36

            ; End:
            ; --------------------------------------------------------
            ;           Drums1  VxEcho  VxEcho  Drums2  Unused  Unused
            ;           ------  ------  ------  ------  ------  ------
            DECLE   32, @@pd01, @@pv33, @@pv31, @@pd13, @@p000, @@p000  ; #37   - End
            DECLE   32, @@pd02, @@pv33, @@pv31, @@pd17, @@p000, @@p000  ; #38
            DECLE   32, @@pd03, @@p000, @@p000, @@pd23, @@p000, @@p000  ; #39

; ------------------------------------------------------------------------- ;
;  Pitch Effects                                                            ;
; ------------------------------------------------------------------------- ;
@@pitchBuzz     DECLE   -12, 0, -12, 0

; ------------------------------------------------------------------------- ;
;  Envelopes                                                                ;
; ------------------------------------------------------------------------- ;
                ; Sharp Bass (long)
@@env_bass_ln:  DECLE   4
                DECLE   $FEED, $CBBA, $AA99, $AA99
                DECLE   $AA99, $AA99, $AA99, $AA99
                DECLE   $8877, $8877, $7766, $7766
                DECLE   $7766, $5544, $3322, $1100

                ; Sharp Bass (short)
@@env_bass_sh:  DECLE   4
                DECLE   $FFEE, $DDBB, $AA99, $AA99
                DECLE   $8877, $6655, $4433, $4433
                DECLE   $2211, $1111, $0000, $0000
                DECLE   $0000, $0000, $0000, $0000

                ; Buzzy Bass (long)
@@env_buzz_ln:  DECLE   4
                DECLE   $CDEE, $DCDC, $BCBC, $BCBC
                DECLE   $BCBC, $BCBC, $BCBC, $BCBC
                DECLE   $ABAB, $ABAB, $9A9A, $9A9A
                DECLE   $8989, $8989, $7878, $7878

                ; Buzzy Bass (medium)
@@env_buzz_md:  DECLE   4
                DECLE   $EFEF, $EDED, $CDCD, $BCBC
                DECLE   $BABA, $9A9A, $8787, $6767
                DECLE   $5654, $3432, $1212, $0000
                DECLE   $0000, $0000, $0000, $0000

                ; Buzzy Bass (short)
@@env_buzz_sh:  DECLE   4
                DECLE   $EFDD, $DCDC, $BCAB, $9A89
                DECLE   $7867, $5544, $3322, $1100
                DECLE   $0000, $0000, $0000, $0000
                DECLE   $0000, $0000, $0000, $0000

                ; Rhythm Guitar (medium)
@@env_ryth_md:  DECLE   4
                DECLE   $CCDE, $EDCC, $BBBB, $CCCC
                DECLE   $BBBB, $CCCC, $BBBB, $AAAA
                DECLE   $8888, $7777, $6655, $4433
                DECLE   $2211, $0000, $0000, $0000

                ; Rhythm Guitar (medium)
@@env_ryth_sh:  DECLE   4
                DECLE   $CCDE, $EDCC, $AAAA, $8888
                DECLE   $6666, $4444, $2222, $1111
                DECLE   $0000, $0000, $0000, $0000
                DECLE   $0000, $0000, $0000, $0000

                ; Vocals
@@env_vox:      DECLE   3
                DECLE   $DEFE, $DDEE, $DDCC, $BBAA
                DECLE   $BBAA, $9988, $7766, $5544
                DECLE   $5544, $3322, $1111, $0000
                DECLE   $0000, $0000, $0000, $0000

                ; Vocals (echo)
@@env_vox_echo: DECLE   4
                DECLE   $DEED, $BAA8, $5442, $CDCB
                DECLE   $A886, $3220, $ABA9, $8664
                DECLE   $1000, $9A98, $7553, $0000
                DECLE   $8987, $6442, $0000, $6542

; ------------------------------------------------------------------------- ;
;  Instruments                                                              ;
; ------------------------------------------------------------------------- ;
@@instr:    DECLE   MUSIC.pitch01,  0,  @@env_bass_ln   ; #1: Sharp Bass long
            DECLE   MUSIC.pitch01,  0,  @@env_bass_sh   ; #2: Sharp Bass short
            DECLE   MUSIC.pitch01,  0,  @@env_buzz_ln   ; #3: Buzzy bass long
            DECLE   MUSIC.pitch01,  0,  @@env_buzz_sh   ; #4: Buzzy bass short
            DECLE   @@pitchBuzz,    0,  @@env_buzz_md   ; #5: Buzzy bass medium
            DECLE   MUSIC.pitch01,  3,  @@env_ryth_md   ; #6: Rhythm guitar medium
            DECLE   MUSIC.pitch01,  3,  @@env_ryth_sh   ; #7: Rhythm guitar short
            DECLE   MUSIC.pitch01,  2,  @@env_vox       ; #8: Vox
            DECLE   MUSIC.pitch01,  1,  @@env_vox_echo  ; #9: Vox echo

; ------------------------------------------------------------------------- ;
;  Drum Kit                                                                 ;
; ------------------------------------------------------------------------- ;
@@drums:    DECLE   MUSIC.808_kick_sh                   ; #1: Synthpop Kick
            DECLE   MUSIC.808_snare_sh                  ; #2: Synthpop Snare
            DECLE   MUSIC.hh_closed                     ; #3: Closed Hi-Hat
            DECLE   MUSIC.hh_half                       ; #4: Half-Open Hi-Hat
            DECLE   MUSIC.hh_open                       ; #5: Open Hi-Hat/Cymbal
            DECLE   MUSIC.snare                         ; #6: Hard Snare
            DECLE   MUSIC.808_clap_lo                   ; #7: Synthpop Handclap

; ------------------------------------------------------------------------- ;
;  Sub-Patterns                                                             ;
;                                                                           ;
;   The sub-patterns are grouped by their musical character or section:     ;
;       - p000: Full Pattern Silence (Unused Channel)                       ;
;       - pd##: Drums & Percussion                                          ;
;       - pv##: Verse Vocals                                                ;
;       - pc##: Chorus Vocals                                               ;
;       - pg##: Buzzy Bass Guitar                                           ;
;       - pr##: Rhythm Guitar                                               ;
; ------------------------------------------------------------------------- ;
            ; p000: Silence
            ; ------------------
@@p000: NPK.Begin(32)
            NPK.Note("NUL 00F") ; #00 - #15
            NPK.Note("NUL 00F") ; #16 - #31
        NPK.End

            ; ------------------
            ; pd##: Drum Beat
            ; ------------------
@@pd01: NPK.Begin(32)
            NPK.Note("DRM 1F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("DRM 380") ; #02
            NPK.Note("NUL 080") ; #03
            NPK.Note("DRM 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("DRM 380") ; #06
            NPK.Note("NUL 080") ; #07
            NPK.Note("DRM 1F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("DRM 380") ; #10
            NPK.Note("NUL 080") ; #11
            NPK.Note("DRM 2F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 380") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("DRM 1F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("DRM 380") ; #18
            NPK.Note("NUL 080") ; #19
            NPK.Note("DRM 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("DRM 380") ; #22
            NPK.Note("NUL 080") ; #23
            NPK.Note("DRM 3A0") ; #24 - 3
            NPK.Note("NUL 0A0") ; #25
            NPK.Note("DRM 1F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("DRM 2F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 380") ; #30
            NPK.Note("NUL 080") ; #31
        NPK.End

@@pd02: NPK.Begin(32)
            NPK.Note("DRM 1F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("DRM 380") ; #02
            NPK.Note("NUL 080") ; #03
            NPK.Note("DRM 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("DRM 380") ; #06
            NPK.Note("NUL 080") ; #07
            NPK.Note("DRM 1F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("DRM 380") ; #10
            NPK.Note("NUL 080") ; #11
            NPK.Note("DRM 2F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 380") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("DRM 1F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("DRM 380") ; #18
            NPK.Note("NUL 080") ; #19
            NPK.Note("DRM 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("DRM 380") ; #22
            NPK.Note("NUL 080") ; #23
            NPK.Note("DRM 3A0") ; #24 - 3
            NPK.Note("NUL 0A0") ; #25
            NPK.Note("DRM 6E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("DRM 2F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 1F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pd03: NPK.Begin(32)
            NPK.Note("DRM 1F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("DRM 1D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("DRM 1B0") ; #04 - 2
            NPK.Note("NUL 0B0") ; #05
            NPK.Note("DRM 180") ; #06
            NPK.Note("NUL 080") ; #07
            NPK.Note("DRM 150") ; #08 - 3
            NPK.Note("NUL 050") ; #09
            NPK.Note("DRM 130") ; #10
            NPK.Note("NUL 030") ; #11
            NPK.Note("DRM 110") ; #12 - 4
            NPK.Note("NUL 010") ; #13
            NPK.Note("NUL 000") ; #14
            NPK.Note("NUL 000") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("NUL 000") ; #20 - 2
            NPK.Note("NUL 000") ; #21
            NPK.Note("NUL 000") ; #22
            NPK.Note("NUL 000") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

@@pd04: NPK.Begin(32)
            NPK.Note("DRM 1F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("DRM 380") ; #02
            NPK.Note("NUL 080") ; #03
            NPK.Note("DRM 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("DRM 380") ; #06
            NPK.Note("NUL 080") ; #07
            NPK.Note("DRM 1F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("DRM 380") ; #10
            NPK.Note("NUL 080") ; #11
            NPK.Note("DRM 2F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 380") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("DRM 1F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("DRM 380") ; #18
            NPK.Note("NUL 080") ; #19
            NPK.Note("DRM 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("DRM 380") ; #22
            NPK.Note("NUL 080") ; #23
            NPK.Note("DRM 1F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("NUL 0F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("DRM 2F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 380") ; #30
            NPK.Note("NUL 080") ; #31
        NPK.End

@@pd11: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("NUL 000") ; #02
            NPK.Note("NUL 000") ; #03
            NPK.Note("NUL 000") ; #04 - 2
            NPK.Note("NUL 000") ; #05
            NPK.Note("NUL 000") ; #06
            NPK.Note("NUL 000") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("DRM 1E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 770") ; #30
            NPK.Note("NUL 070") ; #31
        NPK.End

@@pd12: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("NUL 000") ; #02
            NPK.Note("NUL 000") ; #03
            NPK.Note("NUL 000") ; #04 - 2
            NPK.Note("NUL 000") ; #05
            NPK.Note("NUL 000") ; #06
            NPK.Note("NUL 000") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("DRM 1E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("DRM 1F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 5D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pd13: NPK.Begin(32)
            NPK.Note("DRM 5D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("DRM 5A0") ; #02
            NPK.Note("NUL 0A0") ; #03
            NPK.Note("DRM 580") ; #04 - 2
            NPK.Note("NUL 080") ; #05
            NPK.Note("NUL 080") ; #06
            NPK.Note("NUL 000") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("DRM 1E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 770") ; #30
            NPK.Note("NUL 070") ; #31
        NPK.End

@@pd14: NPK.Begin(32)
            NPK.Note("DRM 5D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("DRM 5A0") ; #02
            NPK.Note("NUL 0A0") ; #03
            NPK.Note("DRM 4E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("DRM 4E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("DRM 4E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("NUL 0E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("DRM 1F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("DRM 4E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 770") ; #30
            NPK.Note("NUL 070") ; #31
        NPK.End

@@pd15: NPK.Begin(32)
            NPK.Note("DRM 5B0") ; #00 - 1
            NPK.Note("NUL 0B0") ; #01
            NPK.Note("DRM 580") ; #02
            NPK.Note("NUL 080") ; #03
            NPK.Note("DRM 4E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("DRM 4E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("DRM 4E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("NUL 0E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("DRM 1F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("DRM 4E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 770") ; #30
            NPK.Note("NUL 070") ; #31
        NPK.End

@@pd16: NPK.Begin(32)
            NPK.Note("DRM 4E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("NUL 0E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("DRM 4E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("DRM 4E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("DRM 4E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("NUL 0E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("DRM 1F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("DRM 4E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 770") ; #30
            NPK.Note("NUL 070") ; #31
        NPK.End


@@pd17: NPK.Begin(32)
            NPK.Note("DRM 4E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("NUL 0E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("DRM 4E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("DRM 4E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("DRM 4E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("NUL 0E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("DRM 1F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("DRM 4E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 5D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pd18: NPK.Begin(32)
            NPK.Note("DRM 4E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("NUL 0E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("DRM 4E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("DRM 4E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("DRM 7F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("DRM 770") ; #14
            NPK.Note("NUL 070") ; #15

            NPK.Note("DRM 4E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("NUL 0E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("DRM 1F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("DRM 5D0") ; #24 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("DRM 5A0") ; #26
            NPK.Note("NUL 0A0") ; #27
            NPK.Note("DRM 7F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("DRM 770") ; #30
            NPK.Note("NUL 070") ; #31
        NPK.End

@@pd23: NPK.Begin(32)
            NPK.Note("DRM 5A0") ; #00 - 1
            NPK.Note("NUL 0A0") ; #01
            NPK.Note("DRM 7B0") ; #02
            NPK.Note("NUL 0B0") ; #03
            NPK.Note("DRM 770") ; #04 - 2
            NPK.Note("NUL 070") ; #05
            NPK.Note("DRM 7A0") ; #06
            NPK.Note("NUL 0A0") ; #07
            NPK.Note("DRM 760") ; #08 - 3
            NPK.Note("NUL 060") ; #09
            NPK.Note("DRM 790") ; #10
            NPK.Note("NUL 090") ; #11
            NPK.Note("DRM 750") ; #12 - 4
            NPK.Note("NUL 050") ; #13
            NPK.Note("DRM 780") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("DRM 740") ; #16 - 1
            NPK.Note("NUL 040") ; #17
            NPK.Note("DRM 760") ; #18
            NPK.Note("NUL 060") ; #19
            NPK.Note("DRM 730") ; #20 - 2
            NPK.Note("NUL 030") ; #21
            NPK.Note("DRM 740") ; #22
            NPK.Note("NUL 040") ; #23
            NPK.Note("DRM 720") ; #24 - 3
            NPK.Note("NUL 020") ; #25
            NPK.Note("DRM 720") ; #26
            NPK.Note("NUL 020") ; #27
            NPK.Note("DRM 710") ; #28 - 4
            NPK.Note("NUL 010") ; #29
            NPK.Note("NUL 010") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

            ; ------------------
            ; pb##: Bass
            ; ------------------
@@pb00: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("NUL 000") ; #02
            NPK.Note("NUL 000") ; #03
            NPK.Note("NUL 000") ; #04 - 2
            NPK.Note("NUL 000") ; #05
            NPK.Note("NUL 000") ; #06
            NPK.Note("NUL 000") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("NUL 000") ; #12 - 4
            NPK.Note("NUL 000") ; #13
            NPK.Note("NUL 000") ; #14
            NPK.Note("NUL 000") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("NUL 000") ; #20 - 2
            NPK.Note("NUL 000") ; #21
            NPK.Note("NUL 000") ; #22
            NPK.Note("NUL 000") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("D#2 1F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pb01: NPK.Begin(32)
            NPK.Note("NUL 0F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("F#2 1F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("A#2 1F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("F#3 1F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#3 1F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("F-3 1F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("NUL 0F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("D#3 1F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("C#3 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("C#3 2F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("NUL 0F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("NUL 0F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("D#2 1F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pb02: NPK.Begin(32)
            NPK.Note("NUL 0F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("F#2 1F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("A#2 1F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("F#3 1F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#3 1F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("F-3 1F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("NUL 0F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("D#3 1F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("C#3 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("NUL 0F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("NUL 0F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("D#2 1F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pb03: NPK.Begin(32)
            NPK.Note("NUL 0F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("F#2 1F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("A#2 1F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("F#3 1F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#3 1F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("F-3 1F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("NUL 0F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("D#3 1F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("C#3 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("NUL 0F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("NUL 0F0") ; #28 - 4
            NPK.Note("NUL 0F0") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

@@pb21: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("D#1 2F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("D#1 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("NUL 0F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#1 2F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("D#1 2F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("D#1 2F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("D#1 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("NUL 0F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("NUL 0F0") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

@@pb11: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("D#2 2F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("D#2 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("NUL 0F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#2 2F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("C#2 2F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("C#2 2F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("C#2 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

@@pb12: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("B-1 2F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("B-1 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("NUL 0F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("B-1 2F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("C#2 2F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("C#2 2F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("C#2 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

@@pb13: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("D#2 2F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("D#2 2F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("NUL 0F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#2 2F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("C#2 2F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("C#2 2F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("C#2 2F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("D#2 1F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

            ; ------------------
            ; pv##: Verse Vox
            ; ------------------
@@pv01: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("A#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("G#4 8E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("A#4 8E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("A#4 8E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("A#4 8E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("G#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("A#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("C#5 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("A#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("G#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("A#4 8E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("A#4 8E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv02: NPK.Begin(32)
            NPK.Note("A#4 8E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("A#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("A#4 8E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("A#4 8E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("A#4 8E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("A#4 8E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("G#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("F#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("G#4 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("F#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("A#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("A#4 8E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv03: NPK.Begin(32)
            NPK.Note("G#4 8E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("F#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("D#4 8E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("C#4 8E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("D#4 8E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("D#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("D#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("F-4 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("D#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("C#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("C#4 8E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("D#4 8E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("NUL 0E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv04: NPK.Begin(32)
            NPK.Note("F#4 8E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("D#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("NUL 0E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("D#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("D#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("F-4 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("C#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("NUL 0E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("NUL 0E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv05: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("A#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("G#4 8E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("A#4 8E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("A#4 8E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("A#4 8E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("G#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("A#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("C#5 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("A#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("G#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("A#4 8E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("G#4 8E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv06: NPK.Begin(32)
            NPK.Note("A#4 8E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("A#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("A#4 8E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("G#4 8E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("A#4 8E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("A#4 8E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("G#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("F#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("G#4 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("F#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("A#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("A#4 8E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv07: NPK.Begin(32)
            NPK.Note("G#4 8E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("F#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("D#4 8E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("C#4 8E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("D#4 8E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("D#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("D#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("F-4 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("D#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("C#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("A#3 8E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("C#4 8E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("D#4 8E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("D#4 8E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv08: NPK.Begin(32)
            NPK.Note("F#4 8E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("D#4 8E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("NUL 0E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("A#4 8E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("A#4 8E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("C#5 8E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("A#4 8E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("G#4 8E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("F#4 8E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("A#4 8E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("G#4 8E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("NUL 0E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv11: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("A#5 9D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("A#5 9D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("NUL 0D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("A#5 9D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("G#5 9D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("NUL 0D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("C#6 9D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("NUL 0D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("G#5 9D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("A#5 9D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("G#5 9D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("NUL 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv12: NPK.Begin(32)
            NPK.Note("A#5 9D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("NUL 0D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("A#5 9D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("NUL 0D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("A#5 9D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("F#5 9D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("G#5 9D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("NUL 0D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("A#5 9D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("NUL 0D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("G#5 9D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("A#5 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv13: NPK.Begin(32)
            NPK.Note("G#5 9D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("NUL 0D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("D#5 9D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("D#5 9D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("NUL 0D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("F-5 0D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("NUL 0D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("NUL 0D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("C#5 9D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("NUL 0D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("C#5 9D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("D#5 9D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv14: NPK.Begin(32)
            NPK.Note("F#5 9C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("NUL 0C0") ; #02
            NPK.Note("NUL 0C0") ; #03
            NPK.Note("D#5 9C0") ; #05 - 2
            NPK.Note("NUL 0C0") ; #05
            NPK.Note("NUL 0C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("F#5 9C0") ; #08 - 3
            NPK.Note("NUL 0C0") ; #09
            NPK.Note("D#5 9C0") ; #10
            NPK.Note("NUL 0C0") ; #11
            NPK.Note("NUL 0C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("D#5 9C0") ; #14
            NPK.Note("NUL 0C0") ; #15

            NPK.Note("F-5 9C0") ; #16 - 1
            NPK.Note("NUL 0C0") ; #17
            NPK.Note("NUL 0C0") ; #18
            NPK.Note("NUL 0C0") ; #19
            NPK.Note("C#5 9C0") ; #20 - 2
            NPK.Note("NUL 0C0") ; #21
            NPK.Note("NUL 0C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("C#5 9C0") ; #25 - 3
            NPK.Note("NUL 0C0") ; #25
            NPK.Note("NUL 0C0") ; #26
            NPK.Note("NUL 0C0") ; #27
            NPK.Note("NUL 0C0") ; #28 - 4
            NPK.Note("NUL 0C0") ; #29
            NPK.Note("NUL 0C0") ; #30
            NPK.Note("NUL 0C0") ; #31
        NPK.End

@@pv15: NPK.Begin(32)
            NPK.Note("A#5 9D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("NUL 0D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("A#5 9D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("A#5 9D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("NUL 0D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("A#5 9D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("G#5 9D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("NUL 0D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("NUL 0D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("C#6 9D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("G#5 9D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("A#5 9D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("G#5 9D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("NUL 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv16: NPK.Begin(32)
            NPK.Note("A#5 9D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("NUL 0D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("A#5 9D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("NUL 0D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("G#5 0D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("NUL 0D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("G#5 9D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("F#5 9D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("A#5 9D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("NUL 0D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("F#5 9D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("NUL 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("A#5 9D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv17: NPK.Begin(32)
            NPK.Note("G#5 9D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("NUL 0D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("D#5 9D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("C#5 9D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("NUL 0D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("D#5 9D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("NUL 0D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("F-5 9D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("D#5 9D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("NUL 0D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("A#4 9D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("C#5 9D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("NUL 0D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("D#5 9D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("F#5 9D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv18: NPK.Begin(32)
            NPK.Note("NUL 0D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("D#5 9D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #05 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("NUL 0D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("A#5 9D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("A#5 9D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("C#6 9D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("NUL 0D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("G#5 9D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("F#5 9D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("NUL 0D0") ; #25 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("NUL 0D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("G#5 9D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pv21: NPK.Begin(32)
            NPK.Note("F#5 8D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("D#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("F#5 8A0") ; #04 - 2
            NPK.Note("NUL 0A0") ; #05
            NPK.Note("D#5 8A0") ; #06
            NPK.Note("NUL 0A0") ; #07
            NPK.Note("F#5 890") ; #08 - 3
            NPK.Note("NUL 090") ; #09
            NPK.Note("D#5 890") ; #10
            NPK.Note("NUL 090") ; #11
            NPK.Note("F#5 880") ; #12 - 4
            NPK.Note("NUL 080") ; #13
            NPK.Note("D#5 880") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("F#5 870") ; #16 - 1
            NPK.Note("NUL 070") ; #17
            NPK.Note("D#5 870") ; #18
            NPK.Note("NUL 070") ; #19
            NPK.Note("F#5 860") ; #20 - 2
            NPK.Note("NUL 060") ; #21
            NPK.Note("D#5 860") ; #22
            NPK.Note("NUL 060") ; #23
            NPK.Note("F#5 8D0") ; #24 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("D#5 8D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("F#5 8A0") ; #28 - 4
            NPK.Note("NUL 0A0") ; #29
            NPK.Note("D#5 8A0") ; #30
            NPK.Note("NUL 0A0") ; #31
        NPK.End

@@pv22: NPK.Begin(32)
            NPK.Note("F#5 890") ; #00 - 1
            NPK.Note("NUL 090") ; #01
            NPK.Note("D#5 890") ; #02
            NPK.Note("NUL 090") ; #03
            NPK.Note("F#5 880") ; #04 - 2
            NPK.Note("NUL 080") ; #05
            NPK.Note("D#5 880") ; #06
            NPK.Note("NUL 080") ; #07
            NPK.Note("F#5 870") ; #08 - 3
            NPK.Note("NUL 070") ; #09
            NPK.Note("D#5 870") ; #10
            NPK.Note("NUL 070") ; #11
            NPK.Note("F#5 860") ; #12 - 4
            NPK.Note("NUL 060") ; #13
            NPK.Note("D#5 860") ; #14
            NPK.Note("NUL 060") ; #15

            NPK.Note("F#5 850") ; #16 - 1
            NPK.Note("NUL 050") ; #17
            NPK.Note("D#5 850") ; #18
            NPK.Note("NUL 050") ; #19
            NPK.Note("F#5 840") ; #20 - 2
            NPK.Note("NUL 040") ; #21
            NPK.Note("D#5 840") ; #22
            NPK.Note("NUL 040") ; #23
            NPK.Note("F#5 830") ; #24 - 3
            NPK.Note("NUL 030") ; #25
            NPK.Note("D#5 830") ; #26
            NPK.Note("NUL 030") ; #27
            NPK.Note("F#5 820") ; #28 - 4
            NPK.Note("NUL 020") ; #29
            NPK.Note("D#5 820") ; #30
            NPK.Note("NUL 020") ; #31
        NPK.End

@@pv23: NPK.Begin(32)
            NPK.Note("F#4 9E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("D#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("F#4 9A0") ; #08 - 3
            NPK.Note("NUL 0A0") ; #09
            NPK.Note("D#4 0A0") ; #10
            NPK.Note("NUL 0A0") ; #11
            NPK.Note("NUL 0A0") ; #12 - 4
            NPK.Note("NUL 0A0") ; #13
            NPK.Note("NUL 0A0") ; #14
            NPK.Note("NUL 0A0") ; #15

            NPK.Note("F#4 980") ; #16 - 1
            NPK.Note("NUL 080") ; #17
            NPK.Note("D#4 980") ; #18
            NPK.Note("NUL 080") ; #19
            NPK.Note("NUL 080") ; #20 - 2
            NPK.Note("NUL 080") ; #21
            NPK.Note("NUL 080") ; #22
            NPK.Note("NUL 080") ; #23
            NPK.Note("F#4 9E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("D#4 9E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("NUL 0E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pv24: NPK.Begin(32)
            NPK.Note("F#4 9A0") ; #00 - 1
            NPK.Note("NUL 0A0") ; #01
            NPK.Note("D#4 9A0") ; #02
            NPK.Note("NUL 0A0") ; #03
            NPK.Note("NUL 0A0") ; #04 - 2
            NPK.Note("NUL 0A0") ; #05
            NPK.Note("NUL 0A0") ; #06
            NPK.Note("NUL 0A0") ; #07
            NPK.Note("F#4 980") ; #08 - 3
            NPK.Note("NUL 080") ; #09
            NPK.Note("D#4 980") ; #10
            NPK.Note("NUL 080") ; #11
            NPK.Note("NUL 080") ; #12 - 4
            NPK.Note("NUL 080") ; #13
            NPK.Note("NUL 080") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("F#4 960") ; #16 - 1
            NPK.Note("NUL 060") ; #17
            NPK.Note("D#4 960") ; #18
            NPK.Note("NUL 060") ; #19
            NPK.Note("NUL 060") ; #20 - 2
            NPK.Note("NUL 060") ; #21
            NPK.Note("NUL 060") ; #22
            NPK.Note("NUL 060") ; #23
            NPK.Note("F#4 940") ; #24 - 3
            NPK.Note("NUL 040") ; #25
            NPK.Note("D#4 940") ; #26
            NPK.Note("NUL 040") ; #27
            NPK.Note("NUL 040") ; #28 - 4
            NPK.Note("NUL 040") ; #29
            NPK.Note("NUL 040") ; #30
            NPK.Note("NUL 040") ; #31
        NPK.End

@@pv25: NPK.Begin(32)
            NPK.Note("F#4 9A0") ; #00 - 1
            NPK.Note("NUL 0A0") ; #01
            NPK.Note("D#4 9A0") ; #02
            NPK.Note("NUL 0A0") ; #03
            NPK.Note("NUL 0A0") ; #04 - 2
            NPK.Note("NUL 0A0") ; #05
            NPK.Note("NUL 0A0") ; #06
            NPK.Note("NUL 0A0") ; #07
            NPK.Note("F#4 980") ; #08 - 3
            NPK.Note("NUL 080") ; #09
            NPK.Note("D#4 980") ; #10
            NPK.Note("NUL 080") ; #11
            NPK.Note("NUL 080") ; #12 - 4
            NPK.Note("NUL 080") ; #13
            NPK.Note("NUL 080") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("F#4 960") ; #16 - 1
            NPK.Note("NUL 060") ; #17
            NPK.Note("D#4 960") ; #18
            NPK.Note("NUL 060") ; #19
            NPK.Note("NUL 060") ; #20 - 2
            NPK.Note("NUL 060") ; #21
            NPK.Note("NUL 060") ; #22
            NPK.Note("NUL 060") ; #23
            NPK.Note("F#4 940") ; #24 - 3
            NPK.Note("NUL 040") ; #25
            NPK.Note("D#4 5B0") ; #26
            NPK.Note("NUL 0B0") ; #27
            NPK.Note("D#4 5C0") ; #28 - 4
            NPK.Note("D#4 5C0") ; #29
            NPK.Note("D#4 5C0") ; #30
            NPK.Note("NUL 0C0") ; #31
        NPK.End

@@pv26: NPK.Begin(32)
            NPK.Note("F#5 8D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("D#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("F#5 8A0") ; #04 - 2
            NPK.Note("NUL 0A0") ; #05
            NPK.Note("D#5 8A0") ; #06
            NPK.Note("NUL 0A0") ; #07
            NPK.Note("F#5 890") ; #08 - 3
            NPK.Note("NUL 090") ; #09
            NPK.Note("D#5 890") ; #10
            NPK.Note("NUL 090") ; #11
            NPK.Note("F#5 880") ; #12 - 4
            NPK.Note("NUL 080") ; #13
            NPK.Note("D#5 880") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("F#5 870") ; #16 - 1
            NPK.Note("NUL 070") ; #17
            NPK.Note("D#5 870") ; #18
            NPK.Note("NUL 070") ; #19
            NPK.Note("F#5 860") ; #20 - 2
            NPK.Note("NUL 060") ; #21
            NPK.Note("D#5 860") ; #22
            NPK.Note("NUL 060") ; #23
            NPK.Note("F#5 850") ; #24 - 3
            NPK.Note("NUL 050") ; #25
            NPK.Note("D#5 850") ; #26
            NPK.Note("NUL 050") ; #27
            NPK.Note("F#5 840") ; #28 - 4
            NPK.Note("NUL 040") ; #29
            NPK.Note("D#5 840") ; #30
            NPK.Note("NUL 040") ; #31
        NPK.End

@@pv31: NPK.Begin(32)
            NPK.Note("F#5 8D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("D#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("F#5 8A0") ; #04 - 2
            NPK.Note("NUL 0A0") ; #05
            NPK.Note("D#5 8A0") ; #06
            NPK.Note("NUL 0A0") ; #07
            NPK.Note("F#5 890") ; #08 - 3
            NPK.Note("NUL 090") ; #09
            NPK.Note("D#5 890") ; #10
            NPK.Note("NUL 090") ; #11
            NPK.Note("F#5 880") ; #12 - 4
            NPK.Note("NUL 080") ; #13
            NPK.Note("D#5 880") ; #14
            NPK.Note("NUL 080") ; #15

            NPK.Note("F#5 870") ; #16 - 1
            NPK.Note("NUL 070") ; #17
            NPK.Note("D#5 870") ; #18
            NPK.Note("NUL 070") ; #19
            NPK.Note("F#5 860") ; #20 - 2
            NPK.Note("NUL 060") ; #21
            NPK.Note("D#5 860") ; #22
            NPK.Note("NUL 060") ; #23
            NPK.Note("F#5 850") ; #24 - 3
            NPK.Note("NUL 050") ; #25
            NPK.Note("D#5 850") ; #26
            NPK.Note("NUL 050") ; #27
            NPK.Note("F#5 840") ; #28 - 4
            NPK.Note("NUL 040") ; #29
            NPK.Note("D#5 840") ; #30
            NPK.Note("NUL 040") ; #31
        NPK.End

@@pv33: NPK.Begin(32)
            NPK.Note("F#4 9E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("D#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("F#4 9A0") ; #08 - 3
            NPK.Note("NUL 0A0") ; #09
            NPK.Note("D#4 0A0") ; #10
            NPK.Note("NUL 0A0") ; #11
            NPK.Note("NUL 0A0") ; #12 - 4
            NPK.Note("NUL 0A0") ; #13
            NPK.Note("NUL 0A0") ; #14
            NPK.Note("NUL 0A0") ; #15

            NPK.Note("F#4 980") ; #16 - 1
            NPK.Note("NUL 080") ; #17
            NPK.Note("D#4 980") ; #18
            NPK.Note("NUL 080") ; #19
            NPK.Note("NUL 080") ; #20 - 2
            NPK.Note("NUL 080") ; #21
            NPK.Note("NUL 080") ; #22
            NPK.Note("NUL 080") ; #23
            NPK.Note("F#4 960") ; #24 - 3
            NPK.Note("NUL 060") ; #25
            NPK.Note("D#4 960") ; #26
            NPK.Note("NUL 060") ; #27
            NPK.Note("NUL 060") ; #28 - 4
            NPK.Note("NUL 060") ; #29
            NPK.Note("NUL 060") ; #30
            NPK.Note("NUL 060") ; #31
        NPK.End

@@pv35: NPK.Begin(32)
            NPK.Note("A#4 9C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("NUL 0C0") ; #02
            NPK.Note("NUL 0C0") ; #03
            NPK.Note("A#4 9C0") ; #05 - 2
            NPK.Note("NUL 0C0") ; #05
            NPK.Note("A#4 9C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("NUL 0C0") ; #08 - 3
            NPK.Note("NUL 0C0") ; #09
            NPK.Note("A#4 9C0") ; #10
            NPK.Note("NUL 0C0") ; #11
            NPK.Note("G#4 9C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("NUL 0C0") ; #14
            NPK.Note("NUL 0C0") ; #15

            NPK.Note("NUL 0C0") ; #16 - 1
            NPK.Note("NUL 0C0") ; #17
            NPK.Note("C#5 9C0") ; #18
            NPK.Note("NUL 0C0") ; #19
            NPK.Note("G#4 9C0") ; #20 - 2
            NPK.Note("NUL 0C0") ; #21
            NPK.Note("NUL 0C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("A#4 9C0") ; #25 - 3
            NPK.Note("NUL 0C0") ; #25
            NPK.Note("G#4 9C0") ; #26
            NPK.Note("NUL 0C0") ; #27
            NPK.Note("NUL 0C0") ; #28 - 4
            NPK.Note("NUL 0C0") ; #29
            NPK.Note("NUL 0C0") ; #30
            NPK.Note("NUL 0C0") ; #31
        NPK.End

@@pv36: NPK.Begin(32)
            NPK.Note("A#4 9C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("NUL 0C0") ; #02
            NPK.Note("NUL 0C0") ; #03
            NPK.Note("NUL 0C0") ; #05 - 2
            NPK.Note("NUL 0C0") ; #05
            NPK.Note("A#4 9C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("NUL 0C0") ; #08 - 3
            NPK.Note("NUL 0C0") ; #09
            NPK.Note("G#4 0C0") ; #10
            NPK.Note("NUL 0C0") ; #11
            NPK.Note("NUL 0C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("NUL 0C0") ; #14
            NPK.Note("NUL 0C0") ; #15

            NPK.Note("G#4 9C0") ; #16 - 1
            NPK.Note("NUL 0C0") ; #17
            NPK.Note("F#4 9C0") ; #18
            NPK.Note("NUL 0C0") ; #19
            NPK.Note("A#4 9C0") ; #20 - 2
            NPK.Note("NUL 0C0") ; #21
            NPK.Note("NUL 0C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("NUL 0C0") ; #25 - 3
            NPK.Note("NUL 0C0") ; #25
            NPK.Note("F#4 9C0") ; #26
            NPK.Note("NUL 0C0") ; #27
            NPK.Note("NUL 0C0") ; #28 - 4
            NPK.Note("NUL 0C0") ; #29
            NPK.Note("A#4 9C0") ; #30
            NPK.Note("NUL 0C0") ; #31
        NPK.End

@@pv37: NPK.Begin(32)
            NPK.Note("G#4 9C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("NUL 0C0") ; #02
            NPK.Note("NUL 0C0") ; #03
            NPK.Note("D#4 9C0") ; #05 - 2
            NPK.Note("NUL 0C0") ; #05
            NPK.Note("C#4 9C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("NUL 0C0") ; #08 - 3
            NPK.Note("NUL 0C0") ; #09
            NPK.Note("D#4 9C0") ; #10
            NPK.Note("NUL 0C0") ; #11
            NPK.Note("NUL 0C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("NUL 0C0") ; #14
            NPK.Note("NUL 0C0") ; #15

            NPK.Note("F-4 9C0") ; #16 - 1
            NPK.Note("NUL 0C0") ; #17
            NPK.Note("D#4 9C0") ; #18
            NPK.Note("NUL 0C0") ; #19
            NPK.Note("NUL 0C0") ; #20 - 2
            NPK.Note("NUL 0C0") ; #21
            NPK.Note("A#3 9C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("C#4 9C0") ; #25 - 3
            NPK.Note("NUL 0C0") ; #25
            NPK.Note("NUL 0C0") ; #26
            NPK.Note("NUL 0C0") ; #27
            NPK.Note("D#4 9C0") ; #28 - 4
            NPK.Note("NUL 0C0") ; #29
            NPK.Note("F#4 9C0") ; #30
            NPK.Note("NUL 0C0") ; #31
        NPK.End

@@pv38: NPK.Begin(32)
            NPK.Note("NUL 0C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("D#4 9C0") ; #02
            NPK.Note("NUL 0C0") ; #03
            NPK.Note("NUL 0C0") ; #05 - 2
            NPK.Note("NUL 0C0") ; #05
            NPK.Note("NUL 0C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("NUL 0C0") ; #08 - 3
            NPK.Note("NUL 0C0") ; #09
            NPK.Note("A#4 9C0") ; #10
            NPK.Note("NUL 0C0") ; #11
            NPK.Note("NUL 0C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("A#4 9C0") ; #14
            NPK.Note("NUL 0C0") ; #15

            NPK.Note("C#5 9C0") ; #16 - 1
            NPK.Note("NUL 0C0") ; #17
            NPK.Note("NUL 0C0") ; #18
            NPK.Note("NUL 0C0") ; #19
            NPK.Note("G#4 9C0") ; #20 - 2
            NPK.Note("NUL 0C0") ; #21
            NPK.Note("F#4 9C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("NUL 0C0") ; #25 - 3
            NPK.Note("NUL 0C0") ; #25
            NPK.Note("NUL 0C0") ; #26
            NPK.Note("NUL 0C0") ; #27
            NPK.Note("G#4 9C0") ; #28 - 4
            NPK.Note("NUL 0C0") ; #29
            NPK.Note("NUL 0C0") ; #30
            NPK.Note("NUL 0C0") ; #31
        NPK.End

            ; ------------------
            ; pc##: Chorus Vox
            ; ------------------
@@pc01: NPK.Begin(32)
            NPK.Note("A#5 8D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("NUL 0D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #04 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("F#5 8D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("F#5 8D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("NUL 0D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("A#5 8D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("A#5 8D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("NUL 0D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("F-5 8D0") ; #24 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("F-5 8D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("NUL 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("A#5 8D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pc02: NPK.Begin(32)
            NPK.Note("NUL 0D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("A#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #04 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("A#5 8D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("C#6 8D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("NUL 0D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("A#5 8D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("C#6 8D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("NUL 0D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("A#5 8D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("NUL 0D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("NUL 0D0") ; #24 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("NUL 0D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("NUL 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("G#5 8D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pc03: NPK.Begin(32)
            NPK.Note("NUL 0D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("F#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("G#5 8D0") ; #04 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("F#5 8D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("G#5 8D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("G#5 8D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("NUL 0D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("F#5 8D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("G#5 8D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("F#5 8D0") ; #24 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("NUL 0D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("NUL 0D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("G#5 8D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pc04: NPK.Begin(32)
            NPK.Note("NUL 0D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("F#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("G#5 8D0") ; #04 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0D0") ; #06
            NPK.Note("NUL 0D0") ; #07
            NPK.Note("F#5 8D0") ; #08 - 3
            NPK.Note("NUL 0D0") ; #09
            NPK.Note("G#5 8D0") ; #10
            NPK.Note("NUL 0D0") ; #11
            NPK.Note("NUL 0D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("G#5 8D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("NUL 0D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("F#5 8D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("G#5 8D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0D0") ; #22
            NPK.Note("NUL 0D0") ; #23
            NPK.Note("F#5 8D0") ; #24 - 3
            NPK.Note("NUL 0D0") ; #25
            NPK.Note("NUL 0D0") ; #26
            NPK.Note("NUL 0D0") ; #27
            NPK.Note("G#5 8D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pc05: NPK.Begin(32)
            NPK.Note("F#5 8D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("D#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #04 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("D#5 8D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("D#5 8D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("F-5 8D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("C#5 8D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("NUL 0D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("G#5 8D0") ; #28 - 4
            NPK.Note("NUL 0D0") ; #29
            NPK.Note("NUL 0D0") ; #30
            NPK.Note("NUL 0D0") ; #31
        NPK.End

@@pc06: NPK.Begin(32)
            NPK.Note("F#5 8D0") ; #00 - 1
            NPK.Note("NUL 0D0") ; #01
            NPK.Note("D#5 8D0") ; #02
            NPK.Note("NUL 0D0") ; #03
            NPK.Note("NUL 0D0") ; #04 - 2
            NPK.Note("NUL 0D0") ; #05
            NPK.Note("NUL 0C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("D#5 8D0") ; #12 - 4
            NPK.Note("NUL 0D0") ; #13
            NPK.Note("D#5 8D0") ; #14
            NPK.Note("NUL 0D0") ; #15

            NPK.Note("F-5 8D0") ; #16 - 1
            NPK.Note("NUL 0D0") ; #17
            NPK.Note("C#5 8D0") ; #18
            NPK.Note("NUL 0D0") ; #19
            NPK.Note("NUL 0D0") ; #20 - 2
            NPK.Note("NUL 0D0") ; #21
            NPK.Note("NUL 0C0") ; #22
            NPK.Note("NUL 0C0") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

@@pc11: NPK.Begin(32)
            NPK.Note("A#4 9E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("NUL 0E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("F#4 9E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("NUL 0E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("NUL 0E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("A#4 9E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("NUL 0E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("NUL 0E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("F-4 9E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("A#4 9E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pc12: NPK.Begin(32)
            NPK.Note("NUL 0E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("A#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("A#4 9E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("C#5 9E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("A#4 9E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("C#5 9E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("NUL 0E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("A#4 9E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("NUL 0E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("G#4 9E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pc13: NPK.Begin(32)
            NPK.Note("NUL 0E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("F#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("G#4 9E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("F#4 9E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("G#4 9E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("NUL 0E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("G#4 9E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("NUL 0E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("F#4 9E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("G#4 9E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("F#4 9E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("G#4 9E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pc14: NPK.Begin(32)
            NPK.Note("NUL 0E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("F#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("G#4 9E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("F#4 9E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("G#4 9E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("NUL 0E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("G#4 9E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("NUL 0E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("F#4 9E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("G#4 9E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("F#4 9E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("G#4 9E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("NUL 0E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pc15: NPK.Begin(32)
            NPK.Note("F#4 9E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("D#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("NUL 0E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("D#4 9E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("D#4 9E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("F-4 9E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("C#4 9E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("NUL 0E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("G#4 9E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("NUL 0E0") ; #30
            NPK.Note("NUL 0E0") ; #31
        NPK.End

@@pc16: NPK.Begin(32)
            NPK.Note("F#4 9E0") ; #00 - 1
            NPK.Note("NUL 0E0") ; #01
            NPK.Note("D#4 9E0") ; #02
            NPK.Note("NUL 0E0") ; #03
            NPK.Note("NUL 0E0") ; #04 - 2
            NPK.Note("NUL 0E0") ; #05
            NPK.Note("NUL 0E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("NUL 0E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("D#4 9E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("D#4 9E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("F-4 9E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("C#4 9E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("NUL 0E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("C#4 090") ; #24 - 3
            NPK.Note("NUL 090") ; #25
            NPK.Note("NUL 090") ; #26
            NPK.Note("NUL 090") ; #27
            NPK.Note("NUL 090") ; #28 - 4
            NPK.Note("NUL 090") ; #29
            NPK.Note("NUL 090") ; #30
            NPK.Note("NUL 090") ; #31
        NPK.End

            ; ------------------
            ; pg##: Buzzy Guitar
            ; ------------------
@@pg00: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("NUL 000") ; #02
            NPK.Note("NUL 000") ; #03
            NPK.Note("NUL 000") ; #04 - 2
            NPK.Note("NUL 000") ; #05
            NPK.Note("NUL 000") ; #06
            NPK.Note("NUL 000") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("NUL 000") ; #12 - 4
            NPK.Note("NUL 000") ; #13
            NPK.Note("NUL 000") ; #14
            NPK.Note("NUL 000") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("NUL 000") ; #20 - 2
            NPK.Note("NUL 000") ; #21
            NPK.Note("NUL 000") ; #22
            NPK.Note("NUL 000") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("NUL 000") ; #26
            NPK.Note("NUL 000") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("D#1 3F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pg01: NPK.Begin(32)
            NPK.Note("NUL 0F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("F#1 3F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("A#1 3F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("F#2 3E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("D#2 3E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("NUL 0E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("F-2 3E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("NUL 0E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("D#2 3E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("C#2 4E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("C#2 4E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("D#1 3F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pg02: NPK.Begin(32)
            NPK.Note("NUL 0F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("F#1 3F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("A#1 3F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("F#2 3E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("D#2 3E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("NUL 0E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("F-2 3E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("NUL 0E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("D#2 3E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("C#2 4E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 0E0") ; #28 - 4
            NPK.Note("NUL 0E0") ; #29
            NPK.Note("D#1 3F0") ; #30
            NPK.Note("NUL 0F0") ; #31
        NPK.End

@@pg03: NPK.Begin(32)
            NPK.Note("NUL 0F0") ; #00 - 1
            NPK.Note("NUL 0F0") ; #01
            NPK.Note("F#1 3F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("A#1 3F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("F#2 3E0") ; #06
            NPK.Note("NUL 0E0") ; #07
            NPK.Note("D#2 3E0") ; #08 - 3
            NPK.Note("NUL 0E0") ; #09
            NPK.Note("NUL 0E0") ; #10
            NPK.Note("NUL 0E0") ; #11
            NPK.Note("NUL 0E0") ; #12 - 4
            NPK.Note("NUL 0E0") ; #13
            NPK.Note("F-2 3E0") ; #14
            NPK.Note("NUL 0E0") ; #15

            NPK.Note("NUL 0E0") ; #16 - 1
            NPK.Note("NUL 0E0") ; #17
            NPK.Note("D#2 3E0") ; #18
            NPK.Note("NUL 0E0") ; #19
            NPK.Note("C#2 4E0") ; #20 - 2
            NPK.Note("NUL 0E0") ; #21
            NPK.Note("NUL 0E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("C#2 460") ; #26
            NPK.Note("NUL 060") ; #27
            NPK.Note("NUL 060") ; #28 - 4
            NPK.Note("NUL 060") ; #29
            NPK.Note("NUL 060") ; #30
            NPK.Note("NUL 060") ; #31
        NPK.End

@@pg21: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("D#2 4F0") ; #02
            NPK.Note("NUL 0F0") ; #03
            NPK.Note("D#2 4F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("NUL 0F0") ; #06
            NPK.Note("NUL 0F0") ; #07
            NPK.Note("D#2 4F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("NUL 0F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("NUL 0F0") ; #12 - 4
            NPK.Note("NUL 0F0") ; #13
            NPK.Note("D#2 4F0") ; #14
            NPK.Note("NUL 0F0") ; #15

            NPK.Note("D#2 4F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("D#2 4F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("NUL 0F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("NUL 0F0") ; #26
            NPK.Note("NUL 0F0") ; #27
            NPK.Note("NUL 0F0") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End

            ; -------------------
            ; pr##: Rhythm Guitar
            ; -------------------
@@pr00: NPK.Begin(32)
            NPK.Note("NUL 000") ; #00 - 1
            NPK.Note("NUL 000") ; #01
            NPK.Note("NUL 000") ; #02
            NPK.Note("NUL 000") ; #03
            NPK.Note("NUL 000") ; #04 - 2
            NPK.Note("NUL 000") ; #05
            NPK.Note("NUL 000") ; #06
            NPK.Note("NUL 000") ; #07
            NPK.Note("NUL 000") ; #08 - 3
            NPK.Note("NUL 000") ; #09
            NPK.Note("NUL 000") ; #10
            NPK.Note("NUL 000") ; #11
            NPK.Note("NUL 000") ; #12 - 4
            NPK.Note("NUL 000") ; #13
            NPK.Note("NUL 000") ; #14
            NPK.Note("NUL 000") ; #15

            NPK.Note("NUL 000") ; #16 - 1
            NPK.Note("NUL 000") ; #17
            NPK.Note("NUL 000") ; #18
            NPK.Note("NUL 000") ; #19
            NPK.Note("NUL 000") ; #20 - 2
            NPK.Note("NUL 000") ; #21
            NPK.Note("NUL 000") ; #22
            NPK.Note("NUL 000") ; #23
            NPK.Note("NUL 000") ; #24 - 3
            NPK.Note("NUL 000") ; #25
            NPK.Note("D#4 5B0") ; #26
            NPK.Note("NUL 0B0") ; #27
            NPK.Note("D#4 5C0") ; #28 - 4
            NPK.Note("D#4 5C0") ; #29
            NPK.Note("D#4 5B0") ; #30
            NPK.Note("NUL 0B0") ; #31
        NPK.End

@@pr01: NPK.Begin(32)
            NPK.Note("D#4 5C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("D#4 7D0") ; #02
            NPK.Note("D#4 7D0") ; #03
            NPK.Note("F#4 7F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("D#4 5C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("F#4 7F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("D#4 6F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("D#4 5C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("D#4 7F0") ; #14
            NPK.Note("D#4 7F0") ; #15

            NPK.Note("F-4 7F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("F-4 7F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("C#4 6F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("D#4 5B0") ; #26
            NPK.Note("NUL 0B0") ; #27
            NPK.Note("D#4 5C0") ; #28 - 4
            NPK.Note("D#4 5C0") ; #29
            NPK.Note("D#4 5B0") ; #30
            NPK.Note("NUL 0B0") ; #31
        NPK.End

@@pr02: NPK.Begin(32)
            NPK.Note("D#4 5C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("D#4 7D0") ; #02
            NPK.Note("D#4 7D0") ; #03
            NPK.Note("F#4 7F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("D#4 5C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("F#4 7F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("D#4 6F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("D#4 5C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("D#4 7F0") ; #14
            NPK.Note("D#4 7F0") ; #15

            NPK.Note("F-4 7F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("F-4 7F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("C#4 6F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("C#4 5C0") ; #26
            NPK.Note("NUL 0C0") ; #27
            NPK.Note("C#3 5B0") ; #28 - 4
            NPK.Note("NUL 0B0") ; #29
            NPK.Note("NUL 0B0") ; #30
            NPK.Note("NUL 0B0") ; #31
        NPK.End

@@pr21: NPK.Begin(32)
            NPK.Note("D#4 5C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("D#4 7D0") ; #02
            NPK.Note("D#4 7D0") ; #03
            NPK.Note("F#4 7F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("D#4 5C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("F#4 7F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("D#4 6F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("D#4 5C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("D#4 7F0") ; #14
            NPK.Note("D#4 7F0") ; #15

            NPK.Note("F#4 7F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("F#4 7F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("D#4 6F0") ; #22
            NPK.Note("NUL 0F0") ; #23
            NPK.Note("NUL 0F0") ; #24 - 3
            NPK.Note("NUL 0F0") ; #25
            NPK.Note("D#4 5B0") ; #26
            NPK.Note("NUL 0B0") ; #27
            NPK.Note("D#4 5C0") ; #28 - 4
            NPK.Note("D#4 5C0") ; #29
            NPK.Note("D#4 5B0") ; #30
            NPK.Note("NUL 0B0") ; #31
        NPK.End

@@pr22: NPK.Begin(32)
            NPK.Note("D#4 5C0") ; #00 - 1
            NPK.Note("NUL 0C0") ; #01
            NPK.Note("D#4 7D0") ; #02
            NPK.Note("D#4 7D0") ; #03
            NPK.Note("F#4 7F0") ; #04 - 2
            NPK.Note("NUL 0F0") ; #05
            NPK.Note("D#4 5C0") ; #06
            NPK.Note("NUL 0C0") ; #07
            NPK.Note("F#4 7F0") ; #08 - 3
            NPK.Note("NUL 0F0") ; #09
            NPK.Note("D#4 6F0") ; #10
            NPK.Note("NUL 0F0") ; #11
            NPK.Note("D#4 5C0") ; #12 - 4
            NPK.Note("NUL 0C0") ; #13
            NPK.Note("D#4 7F0") ; #14
            NPK.Note("D#4 7F0") ; #15

            NPK.Note("F#4 7F0") ; #16 - 1
            NPK.Note("NUL 0F0") ; #17
            NPK.Note("NUL 0F0") ; #18
            NPK.Note("NUL 0F0") ; #19
            NPK.Note("F#4 7F0") ; #20 - 2
            NPK.Note("NUL 0F0") ; #21
            NPK.Note("D#4 6E0") ; #22
            NPK.Note("NUL 0E0") ; #23
            NPK.Note("NUL 0E0") ; #24 - 3
            NPK.Note("NUL 0E0") ; #25
            NPK.Note("NUL 0E0") ; #26
            NPK.Note("NUL 0E0") ; #27
            NPK.Note("NUL 000") ; #28 - 4
            NPK.Note("NUL 000") ; #29
            NPK.Note("NUL 000") ; #30
            NPK.Note("NUL 000") ; #31
        NPK.End
            ENDP

;; ======================================================================== ;;
;;  End of File:  BeatIt.asm                                                ;;
;; ======================================================================== ;;
