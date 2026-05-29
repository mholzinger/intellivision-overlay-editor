;* ======================================================================== *;
;*  This code is placed into the public domain by its collective authors.   *;
;*  All copyright rights are hereby relinquished on the code and data in    *;
;*  this file.                                                              *;
;*      -- James Pujals, 2020                                               *;
;*      -- Anders Carlsson, 2020                                            *;
;* ======================================================================== *;

;; ======================================================================== ;;
;;  SONG: Voyage Theme                                                      ;;
;;      This song was composed for the "Voyage: An Intv Journey" demo for   ;;
;;      the @Party in Boston, MA, 2017.  It was donated by its author to    ;;
;;      serve as an example of a 6-channel track, so that others may learn  ;;
;;      from it.                                                            ;;
;;                                                                          ;;
;;      Composed By:    Anders Carlsson (Zapac)                             ;;
;;      Tracked By:     Anders Carlsson (Zapac)                             ;;
;;      Remixed By:     James Pujals (DZ-Jay)                               ;;
;; ======================================================================== ;;
VOYAGE      PROC

; ------------------------------------------------------------------------- ;
;  Song Header                                                              ;
; ------------------------------------------------------------------------- ;
            DECLE   4, @@patterns, @@instr, @@drums

; ------------------------------------------------------------------------- ;
;  Sequence                                                                 ;
; ------------------------------------------------------------------------- ;
    DECLE 14, -1
            DECLE   15,  0,  1,  2,  3              ; Intro
                                                    ; Part I:
            DECLE        4,  5,  4,  5              ;   First Verse
            DECLE        6,  7,  8,  9              ;   Second Verse
            DECLE        4,  5,  4,  5              ;   First Verse
            DECLE       10, 11, 12, 13              ;   Third Verse
                                                    ;
                                                    ; Part II:
            DECLE        4,  5,  4,  5              ;   First Verse
            DECLE       10, 11, 12, 14              ;   Third Verse
                                                    ;
                                                    ; Mid-Break:
            DECLE       16, 17, 16, 18              ;   Out-Bass
            DECLE       19, 20, 21, 22              ;   Beat
            DECLE       23, 24, 23, 25              ;   In-Bass
                                                    ;
            DECLE       26, 27, 28, 29              ; Interlude
                                                    ;
                                                    ; Part III:
            DECLE        4,  5,  4,  5              ;   First Verse
            DECLE       10, 11, 12, 13              ;   Third Verse
                                                    ;
            DECLE       19, 30, 31, 20              ; End-Break
                                                    ;
            DECLE   32, TRK_END_SONG                ; The End.

; ------------------------------------------------------------------------- ;
;  Channel Patterns                                                         ;
; ------------------------------------------------------------------------- ;
            ;            Beat     Bass     Synth   Percss.   Arps    Melody
            ;           -------  -------  -------  -------  -------  -------
@@patterns: DECLE   64, @@p5_20, @@p1_00, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #0
            DECLE   64, @@p5_21, @@p1_00, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #1
            DECLE   64, @@p0_01, @@p1_00, @@p0_00, @@p5_35, @@p4_02, @@p0_00 ; #2
            DECLE   64, @@p0_02, @@p1_00, @@p0_00, @@p0_00, @@p4_02, @@p0_00 ; #3

            DECLE   64, @@p0_01, @@p1_00, @@p2_03, @@p5_35, @@p4_02, @@p3_03 ; #4
            DECLE   64, @@p0_03, @@p1_00, @@p2_04, @@p0_00, @@p4_03, @@p3_04 ; #5

            DECLE   64, @@p0_01, @@p1_05, @@p2_05, @@p0_00, @@p4_05, @@p3_05 ; #6
            DECLE   64, @@p0_03, @@p1_06, @@p2_06, @@p0_00, @@p4_06, @@p3_06 ; #7
            DECLE   64, @@p0_01, @@p1_07, @@p2_07, @@p0_00, @@p4_07, @@p3_07 ; #8
            DECLE   64, @@p0_02, @@p1_08, @@p2_08, @@p0_00, @@p4_08, @@p3_08 ; #9

            DECLE   64, @@p0_01, @@p1_09, @@p2_09, @@p0_00, @@p4_09, @@p3_09 ; #10
            DECLE   64, @@p0_03, @@p1_10, @@p2_10, @@p0_00, @@p4_10, @@p3_10 ; #11
            DECLE   64, @@p0_01, @@p1_11, @@p2_11, @@p0_00, @@p4_11, @@p3_11 ; #12
            DECLE   64, @@p0_02, @@p1_12, @@p2_12, @@p0_00, @@p4_08, @@p3_12 ; #13

            DECLE   64, @@p0_22, @@p1_22, @@p2_22, @@p0_00, @@p4_08, @@p3_22 ; #14
            DECLE   32, @@p5_00, @@p0_00, @@p0_00, @@p5_10, @@p0_00, @@p0_00 ; #15

            DECLE   64, @@p0_01, @@p1_12, @@p0_00, @@p5_35, @@p0_00, @@p0_00 ; #16
            DECLE   64, @@p0_03, @@p1_12, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #17
            DECLE   64, @@p0_32, @@p1_12, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #18

            DECLE   64, @@p5_22, @@p6_12, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #19
            DECLE   64, @@p5_23, @@p0_00, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #20
            DECLE   64, @@p5_22, @@p0_00, @@p0_00, @@p6_20, @@p0_00, @@p0_00 ; #21
            DECLE   64, @@p5_23, @@p0_00, @@p0_00, @@p6_20, @@p0_00, @@p0_00 ; #22

            DECLE   64, @@p0_01, @@p1_06, @@p0_00, @@p5_35, @@p0_00, @@p0_00 ; #23
            DECLE   64, @@p0_03, @@p1_06, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #24
            DECLE   64, @@p0_32, @@p1_06, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #25

            DECLE   64, @@p0_01, @@p1_05, @@p2_15, @@p5_35, @@p0_00, @@p0_00 ; #26
            DECLE   64, @@p0_03, @@p1_06, @@p2_16, @@p0_00, @@p0_00, @@p0_00 ; #27
            DECLE   64, @@p0_01, @@p1_07, @@p2_17, @@p0_00, @@p2_27, @@p0_00 ; #28
            DECLE   64, @@p0_02, @@p1_08, @@p2_18, @@p0_00, @@p3_28, @@p0_00 ; #29

            DECLE   64, @@p5_24, @@p0_00, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #30
            DECLE   64, @@p5_22, @@p0_00, @@p0_00, @@p0_00, @@p0_00, @@p0_00 ; #31

            DECLE   16, @@p5_25, @@p0_00, @@p0_00, @@p5_35, @@p0_00, @@p0_00 ; #32

; ------------------------------------------------------------------------- ;
;  Instruments                                                              ;
; ------------------------------------------------------------------------- ;
@@instr:    DECLE   MUSIC.pitch01, 0, MUSIC.env03       ; #1: Short bass
            DECLE   MUSIC.pitch04, 0, MUSIC.env05       ; #2: Arpeggio 037
            DECLE   MUSIC.pitch05, 0, MUSIC.env05       ; #3: Arpeggio 047
            DECLE   MUSIC.pitch14, 0, MUSIC.env05       ; #4: Arpeggio 046
            DECLE   MUSIC.pitch15, 0, MUSIC.env05       ; #5: Arpeggio 038
            DECLE   MUSIC.pitch16, 0, MUSIC.env05       ; #6: Arpeggio 058
            DECLE   MUSIC.pitch06, 0, MUSIC.env05       ; #7: Arpeggio 04A
            DECLE   MUSIC.pitch17, 0, MUSIC.env05       ; #8: Arpeggio 028
            DECLE   MUSIC.pitch18, 0, MUSIC.env05       ; #9: Arpeggio 049
            DECLE   MUSIC.pitch03, 0, MUSIC.env05       ; #A: Arpeggio 059
            DECLE   MUSIC.pitch01, 1, MUSIC.env10       ; #B: Submelody
            DECLE   MUSIC.pitch01, 0, MUSIC.env08       ; #C: Sequencer
            DECLE   MUSIC.pitch01, 3, MUSIC.env10       ; #D: Melody

            DECLE   MUSIC.pitch01, 2, MUSIC.env11       ; #E
            DECLE   MUSIC.pitch19, 1, MUSIC.env10       ; #F
            DECLE   MUSIC.pitch01, 2, MUSIC.env01       ; #G

; ------------------------------------------------------------------------- ;
;  Drum Kit                                                                 ;
; ------------------------------------------------------------------------- ;
@@drums:    DECLE   MUSIC.bassdrum                      ; #1
            DECLE   MUSIC.snare                         ; #2
            DECLE   MUSIC.hh_dbl_tap                    ; #3
            DECLE   MUSIC.cowbell                       ; #4
            DECLE   MUSIC.hh_closed                     ; #5
            DECLE   MUSIC.hh_open                       ; #6

; ------------------------------------------------------------------------- ;
;  Sub-Patterns                                                             ;
; ------------------------------------------------------------------------- ;
@@p0_00:    NOTES("NUL 10F", "NUL 00F", "NUL 00F", "NUL 00F")

@@p1_00:    NOTES("F-1 1F0", "NUL 000", "F-1 0F1", "F-2 0F0")
            NOTES("NUL 000", "F-1 0F0", "NUL 000", "F-1 0F0")
            NOTES("NUL 000", "F-1 0F1", "F-2 0F0", "NUL 000")
            NOTES("F-1 0F0", "NUL 000", "F-1 0F0", "NUL 000")
            NOTES("F-1 0F1", "F-2 0F0", "NUL 000", "F-1 0F0")
            NOTES("NUL 000", "F-1 0F0", "NUL 000", "D#1 0F3")
            NOTES("E-1 0F1", "F-1 0F0", "NUL 000", "F-1 0F1")
            NOTES("F-2 0F0", "NUL 000", "F-1 0F0", "NUL 000")
            NOTES("F-1 0F0", "NUL 000", "F-1 0F1", "F-2 0F0")
            NOTES("NUL 000", "F-1 0F0", "NUL 000", "F-1 0F0")
            NOTES("NUL 000", "F-1 0F1", "F-2 0F0", "NUL 000")
            NOTES("F-1 0F0", "NUL 000", "F-1 0F0", "NUL 000")
            NOTES("D#1 0F3", "E-1 0F1", "", "")

@@p0_01:    NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F0", "DRM 1F0")
            NOTES("DRM 2F1", "DRM 3F1", "", "")

@@p0_02:    NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 2F1", "DRM 2F1")
            NOTES("DRM 2F1", "DRM 1F1", "DRM 2F1", "")
            NOTES("DRM 2F1", "DRM 2F0", "DRM 2F0", "")

@@p0_22:    NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 2F1")
            NOTES("DRM 1F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 2F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 2F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 2F1", "", "", "")

@@p0_32:    NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 1F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 1F1", "DRM 1F1")
            NOTES("DRM 1F0", "DRM 1F0", "DRM 1F0", "DRM 3F0")
            NOTES("DRM 2F1", "DRM 2F1", "DRM 2F0", "DRM 2F0")
            NOTES("DRM 2F0", "DRM 2F0", "", "")

@@p0_03:    NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 2F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 2F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F0", "DRM 1F0")
            NOTES("DRM 2F1", "DRM 2F1", "", "")

@@p4_02:    NOTES("NUL 10D", "F-4 2F9", "G-4 2F7","NUL 00D")
            NOTES("G#4 3F9", "G-4 2F7", "", "")

@@p2_03:    NOTES("NUL 105", "F-3 BFD", "C-4 0F3", "A#3 0F1")
            NOTES("G#3 0F1", "F-3 0F1", "D#3 0F1", "G#3 0F5")
            NOTES("F-3 0FD", "C-3 0F3", "A#3 0F1", "G#3 0F1")
            NOTES("F-3 0F1", "D#3 0F1", "", "")

@@p3_03:    NOTES("NUL 101", "C-4 DF1", "F-4 0F1", "G-4 0F1")
            NOTES("G#4 0F1", "A#4 0F1", "C-5 0F1", "D#5 0F9")
            NOTES("D-5 0F3", "C#5 0F3", "C-5 0FB", "A#4 0F1")
            NOTES("C-5 0FB", "C-5 0F1", "A#4 0F1", "G#4 0F1")

@@p4_03:    NOTES("NUL 10D", "F-4 2F9", "NUL 007", "NUL 00D")
            NOTES("G#4 3F9", "G-4 2F7", "", "")

@@p2_04:    NOTES("C#3 BFF", "NUL 0F9", "D#3 0F1", "C#3 0F1")
            NOTES("A#2 0F1", "C-3 0FF", "NUL 0FF", "" )

@@p3_04:    NOTES("F-4 DFF", "NUL 0F3", "C-5 0F3", "A#4 0F3")
            NOTES("G#4 0F3", "F-4 0FB", "D#4 0F1", "F-4 0FF")
            NOTES("NUL 0F1", "", "", "")

@@p1_05:    NOTES("G#1 1F0", "NUL 000", "G#1 0F1", "G#2 0F0")
            NOTES("NUL 000", "G#1 0F0", "NUL 000", "G#1 0F0")
            NOTES("NUL 000", "G#1 0F1", "G#2 0F0", "NUL 000")
            NOTES("G#1 0F0", "NUL 000", "G#1 0F0", "NUL 000")
            NOTES("G#1 0F1", "G#2 0F0", "NUL 000", "G#1 0F0")
            NOTES("NUL 000", "G#1 0F0", "NUL 000", "C#1 0F3")
            NOTES("D-1 0F1", "D#1 0F0", "NUL 000", "D#1 0F1")
            NOTES("D#2 0F0", "NUL 000", "D#1 0F0", "NUL 000")
            NOTES("D#1 0F0", "NUL 000", "D#1 0F1", "D#2 0F0")
            NOTES("NUL 000", "D#1 0F0", "NUL 000", "D#1 0F0")
            NOTES("NUL 000", "D#1 0F1", "D#2 0F0", "NUL 000")
            NOTES("D#1 0F0", "NUL 000", "D#1 0F0", "NUL 000")
            NOTES("G-1 0F3", "G#1 0F1", "", "")

@@p2_05:    NOTES("C-4 BF5", "G#3 0FD", "C-4 0F3", "C#4 0F1")
            NOTES("C-4 0F1", "A#3 0F1", "G#3 0F1", "A#3 0F5")
            NOTES("D#3 0F5", "D-3 0F1", "D#3 0F5", "C#4 0F3")
            NOTES("C-4 0F1", "A#3 0F1", "G#3 0F1", "G-3 0F1")

@@p3_05:    NOTES("NUL 101", "D#4 DF1", "G#4 0F1", "A#4 0F1")
            NOTES("C-5 0F1", "C#5 0F1", "F-5 0F1", "D#5 0F9")
            NOTES("F-5 0F3", "D#5 0F1", "C#5 0F1", "G-5 0FB")
            NOTES("F-5 0F1", "G-5 0FB", "D#5 0F1", "C#5 0F1")
            NOTES("C-5 0F1", "", "", "")

@@p4_05:    NOTES("NUL 10D", "G#4 3F9", "A-4 4F7", "NUL 00D")
            NOTES("G-4 5F9", "G#4 5F7", "", "")

@@p1_06:    NOTES("A#1 1F0", "NUL 000", "A#1 0F1", "A#2 0F0")
            NOTES("NUL 000", "A#1 0F0", "NUL 000", "A#1 0F0")
            NOTES("NUL 000", "A#1 0F1", "A#2 0F0", "NUL 000")
            NOTES("A#1 0F0", "NUL 000", "A#1 0F0", "NUL 000")
            NOTES("A#1 0F1", "A#2 0F0", "NUL 000", "A#1 0F0")
            NOTES("NUL 000", "A#1 0F0", "NUL 000", "D#1 0F3")
            NOTES("E-1 0F1", "F-1 0F0", "NUL 000", "F-1 0F1")
            NOTES("F-2 0F0", "NUL 000", "F-1 0F0", "NUL 000")
            NOTES("F-1 0F0", "NUL 000", "F-1 0F1", "F-2 0F0")
            NOTES("NUL 000", "F-1 0F0", "NUL 000", "F-1 0F0")
            NOTES("NUL 000", "F-1 0F1", "F-2 0F0", "NUL 000")
            NOTES("F-1 0F0", "NUL 000", "F-1 0F0", "NUL 000")
            NOTES("D#1 0F3", "C#1 0F1", "", "")

@@p2_06:    NOTES("F-3 BF5", "A#3 0FF", "NUL 0F3", "C-4 0F1")
            NOTES("A#3 0F1", "G-3 0F1", "G#3 0FF", "NUL 0F9")
            NOTES("A#3 0F1", "G#3 0F1", "G-3 0F1", "")

@@p3_06:    NOTES("C#5 DFF", "NUL 0F3", "F-5 0F3", "D#5 0F3")
            NOTES("C#5 0F1", "C-5 0FF", "NUL 0FB", "C#5 0F1")
            NOTES("C-5 0F1", "A#4 0F1", "", "")

@@p4_06:    NOTES("NUL 10D", "F-4 6F9", "G-4 2F7", "NUL 00D")
            NOTES("F-4 2F9", "G-4 0F7", "", "")

@@p1_07:    NOTES("C#1 1F0", "NUL 000", "C#1 0F1", "C#2 0F0")
            NOTES("NUL 000", "C#1 0F0", "NUL 000", "C#1 0F0")
            NOTES("NUL 000", "C#1 0F1", "C#2 0F0", "NUL 000")
            NOTES("C#1 0F0", "NUL 000", "C#1 0F0", "NUL 000")
            NOTES("C#1 0F1", "C#2 0F0", "NUL 000", "C#1 0F0")
            NOTES("NUL 000", "C#1 0F0", "NUL 000", "F-1 0F3")
            NOTES("G-1 0F1", "G#1 0F0", "NUL 000", "G#1 0F1")
            NOTES("G#2 0F0", "NUL 000", "G#1 0F0", "NUL 000")
            NOTES("G#1 0F0", "NUL 000", "G#1 0F1", "G#2 0F0")
            NOTES("NUL 000", "G#1 0F0", "NUL 000", "G#1 0F0")
            NOTES("NUL 000", "G#1 0F1", "G#2 0F0", "NUL 000")
            NOTES("G#1 0F0", "NUL 000", "G#1 0F0", "NUL 000")
            NOTES("D#1 0F3", "F-1 0F1", "", "")

@@p2_07:    NOTES("F-3 BF5", "G#3 0FD", "C#4 0F3", "C-4 0F1")
            NOTES("A#3 0F1", "G#3 0F1", "A#3 0F1", "C-4 0F5")
            NOTES("G#3 0FD", "C-4 0F3", "A#3 0F1", "G#3 0F1")
            NOTES("G-3 0F1", "G#3 0F1", "", "")

@@p3_07:    NOTES("NUL 101", "G#4 DF1", "C#5 0F1", "D#5 0F1")
            NOTES("F-5 0F1", "D#5 0F1", "C#5 0F1", "G#5 0F9")
            NOTES("F-5 0F3", "D#5 0F1", "C#5 0F1", "D#5 0FB")
            NOTES("C#5 0F1", "D#5 0FB", "F-5 0F1", "D#5 0F1")
            NOTES("C#5 0F1", "", "", "")

@@p4_07:    NOTES("NUL 10D", "F-4 5F9", "F#4 3F7", "NUL 00D")
            NOTES("G#4 3F9", "A-4 4F7", "", "")

@@p1_08:    NOTES("G-1 1F0", "NUL 000", "G-1 0F1", "G-2 0F0")
            NOTES("NUL 000", "G-1 0F0", "NUL 000", "G-1 0F0")
            NOTES("NUL 000", "G-1 0F1", "G-2 0F0", "NUL 000")
            NOTES("G-1 0F0", "NUL 000", "G-1 0F0", "NUL 000")
            NOTES("G-1 0F1", "G-2 0F0", "NUL 000", "G-1 0F0")
            NOTES("NUL 000", "G-1 0F0", "NUL 000", "A#1 0F3")
            NOTES("B-1 0F1", "C-2 0F0", "NUL 000", "C-1 0F1")
            NOTES("C-2 0F0", "NUL 000", "C-1 0F0", "NUL 000")
            NOTES("C-1 0F0", "NUL 000", "C-1 0F1", "C-2 0F0")
            NOTES("NUL 000", "C-1 0F0", "NUL 000", "C-1 0F0")
            NOTES("NUL 000", "C-1 0F1", "C-2 0F0", "NUL 000")
            NOTES("C-1 0F0", "NUL 000", "C-1 0F0", "NUL 000")
            NOTES("D#1 0F3", "E-1 0F1", "", "")

@@p2_08:    NOTES("G-3 BF5", "F-3 0F5", "A-3 0F1", "B-3 0F3")
            NOTES("G-3 0F3", "C-4 0F1", "A#3 0F3", "G#3 0F3")
            NOTES("G-3 0F7", "C-4 CF0", "B-3 0F0", "A#3 0F0")
            NOTES("A-3 0F0", "G#3 0F0", "G-3 0F0", "F#3 0F0")
            NOTES("F-3 0F0", "E-3 0F0", "D#3 0F0", "D-3 0F0")
            NOTES("C#3 0F0", "C-3 0F0", "B-2 0F0", "A#2 0F0")
            NOTES("A-2 0F0", "G#2 0F0", "G-2 0F0", "F#2 0F0")
            NOTES("F-2 0F0", "E-2 0F0", "D#2 0F0", "D-2 0F0")
            NOTES("C#2 0F0", "", "", "")

@@p3_08:    NOTES("D-5 DFF", "NUL 0F3", "B-4 0F3", "C-5 0F3")
            NOTES("D-5 0F3", "E-5 0F7", "C-3 CF0", "C#3 0F0")
            NOTES("D-3 0F0", "D#3 0F0", "E-3 0F0", "F-3 0F0")
            NOTES("F#3 0F0", "G-3 0F0", "G#3 0F0", "A-3 0F0")
            NOTES("A#3 0F0", "B-3 0F0", "C-4 0F0", "C#4 0F0")
            NOTES("D-4 0F0", "D#4 0F0", "E-4 0F0", "F-4 0F0")
            NOTES("F#4 0F0", "G-4 0F0", "G#4 0F0", "A-4 0F0")
            NOTES("A#4 0F0", "B-4 0F0", "", "")

@@p4_08:    NOTES("NUL 10D", "G-4 3F9", "G-4 7F7", "NUL 00F")
            NOTES("NUL 00F", "", "", "")

@@p1_09:    NOTES("C#1 1F0", "NUL 000", "C#1 0F1", "C#2 0F0")
            NOTES("NUL 000", "C#1 0F0", "NUL 000", "C#1 0F0")
            NOTES("NUL 000", "C#1 0F1", "C#2 0F0", "NUL 000")
            NOTES("C#1 0F0", "NUL 000", "C#1 0F0", "NUL 000")
            NOTES("C#1 0F1", "C#2 0F0", "NUL 000", "C#1 0F0")
            NOTES("NUL 000", "C#1 0F0", "NUL 000", "F#1 0F3")
            NOTES("G-1 0F1", "G#1 0F0", "NUL 000", "G#1 0F1")
            NOTES("G#2 0F0", "NUL 000", "G#1 0F0", "NUL 000")
            NOTES("G#1 0F0", "NUL 000", "G#1 0F1", "G#2 0F0")
            NOTES("NUL 000", "G#1 0F0", "NUL 000", "G#1 0F0")
            NOTES("NUL 000", "G#1 0F1", "G#2 0F0", "NUL 000")
            NOTES("G#1 0F0", "NUL 000", "G#1 0F0", "NUL 000")
            NOTES("C-1 0F3", "C#1 0F1", "", "")

@@p2_09:    NOTES("G#3 BF5", "F-3 0FD", "G#3 0F3", "A#3 0F1")
            NOTES("G#3 0F1", "F#3 0F1", "A#3 0F1", "C-4 0F5")
            NOTES("D#3 0F3", "C#3 0F3", "D#3 0F5", "C-4 0F3")
            NOTES("A#3 0F1", "G#3 0F1", "F#3 0F1", "F-3 0F1")

@@p3_09:    NOTES("NUL 101", "F-5 DF1", "G#5 0F1", "C#5 0FD")
            NOTES("F-5 0F3", "F#5 0F1", "F-5 0F1", "D#5 0F1")
            NOTES("C#5 0F1", "NUL 001", "D#5 0F1", "G#5 0F1")
            NOTES("C-5 0F3", "A#4 0F3", "C-5 0F3", "G#5 0F3")
            NOTES("F#5 0F3", "F-5 0F1", "D#5 0F1", "C#5 0F1")

@@p4_09:    NOTES("NUL 10D", "F-4 5F9", "F#4 8F7", "NUL 00D")
            NOTES("G#4 3F9", "A-4 0F7", "", "")

@@p1_10:    NOTES("D#1 1F0", "NUL 000", "D#1 0F1", "D#2 0F0")
            NOTES("NUL 000", "D#1 0F0", "NUL 000", "D#1 0F0")
            NOTES("NUL 000", "D#1 0F1", "D#2 0F0", "NUL 000")
            NOTES("D#1 0F0", "NUL 000", "D#1 0F0", "NUL 000")
            NOTES("D#1 0F1", "D#2 0F0", "NUL 000", "D#1 0F0")
            NOTES("NUL 000", "D#1 0F0", "NUL 000", "G#1 0F3")
            NOTES("A-1 0F1", "A#1 0F0", "NUL 000", "A#1 0F1")
            NOTES("A#2 0F0", "NUL 000", "A#1 0F0", "NUL 000")
            NOTES("A#1 0F0", "NUL 000", "A#1 0F1", "A#2 0F0")
            NOTES("NUL 000", "A#1 0F0", "NUL 000", "A#1 0F0")
            NOTES("NUL 000", "A#1 0F1", "A#2 0F0", "NUL 000")
            NOTES("A#1 0F0", "NUL 000", "A#1 0F0", "NUL 000")
            NOTES("G#1 0F3", "F#1 0F1", "", "")

@@p2_10:    NOTES("A#3 BF5", "F#3 0FF", "NUL 0F3", "F#3 0F1")
            NOTES("D#3 0F1", "C-3 0F1", "C#3 0FF", "NUL 0F9")
            NOTES("D#4 0F1", "C#4 0F1", "C-4 0F1", "")

@@p3_10:    NOTES("NUL 101", "D#5 DF1", "F#5 0F1", "A#4 0FF")
            NOTES("NUL 0F3", "G#5 0F1", "F#5 0F1", "D#5 0F1")
            NOTES("F-5 0FF", "NUL 0F9", "F#5 0F1", "F-5 0F1")
            NOTES("D#5 0F1", "", "", "")

@@p4_10:    NOTES("NUL 10D", "F#4 9F9", "G-4 6F7", "NUL 00D")
            NOTES("F-4 6F9", "G-4 0F7", "", "")

@@p1_11:    NOTES("F#1 1F0", "NUL 000", "F#1 0F1", "F#2 0F0")
            NOTES("NUL 000", "F#1 0F0", "NUL 000", "F#1 0F0")
            NOTES("NUL 000", "F#1 0F1", "F#2 0F0", "NUL 000")
            NOTES("F#1 0F0", "NUL 000", "F#1 0F0", "NUL 000")
            NOTES("F#1 0F1", "F#2 0F0", "NUL 000", "F#1 0F0")
            NOTES("NUL 000", "F#1 0F0", "NUL 000", "E-1 0F3")
            NOTES("D#1 0F1", "C#1 0F0", "NUL 000", "C#1 0F1")
            NOTES("C#2 0F0", "NUL 000", "C#1 0F0", "NUL 000")
            NOTES("C#1 0F0", "NUL 000", "C#1 0F1", "C#2 0F0")
            NOTES("NUL 000", "C#1 0F0", "NUL 000", "C#1 0F0")
            NOTES("NUL 000", "C#1 0F1", "C#2 0F0", "NUL 000")
            NOTES("C#1 0F0", "NUL 000", "C#1 0F0", "NUL 000")
            NOTES("F-1 0F3", "F#1 0F1", "", "")

@@p2_11:    NOTES("A#3 BF5", "F#3 0FD", "A#3 0F3", "A#3 0F1")
            NOTES("G#3 0F1", "A-3 0F1", "A#3 0F1", "G#3 0F5")
            NOTES("F-3 0FF", "NUL 0F1", "D#3 0F1", "C#3 0F1")
            NOTES("C-3 0F1", "A#2 0F1", "", "")

@@p3_11:    NOTES("NUL 101", "C#5 DF1", "F#5 0F1", "A#4 0FD")
            NOTES("C#5 0F3", "D#5 0F1", "C#5 0F1", "C-5 0F1")
            NOTES("C#5 0F1", "NUL 001", "F-5 0F1", "G#5 0F1")
            NOTES("C#5 0FF", "NUL 0F1", "F#5 0F1", "F-5 0F1")
            NOTES("D#5 0F1", "C#5 0F1", "", "")

@@p4_11:    NOTES("NUL 10D", "F#4 3F9", "F#4 AF7", "NUL 00D")
            NOTES("F-4 5F9", "F#4 8F7", "", "")

@@p1_12:    NOTES("G-1 1F0", "NUL 000", "G-1 0F1", "G-2 0F0")
            NOTES("NUL 000", "G-1 0F0", "NUL 000", "G-1 0F0")
            NOTES("NUL 000", "G-1 0F1", "G-2 0F0", "NUL 000")
            NOTES("G-1 0F0", "NUL 000", "G-1 0F0", "NUL 000")
            NOTES("G-1 0F1", "G-2 0F0", "NUL 000", "G-1 0F0")
            NOTES("NUL 000", "G-1 0F0", "NUL 000", "A-1 0F3")
            NOTES("B-1 0F1", "C-2 0F0", "NUL 000", "C-1 0F1")
            NOTES("C-2 0F0", "NUL 000", "C-1 0F0", "NUL 000")
            NOTES("C-1 0F0", "NUL 000", "C-1 0F1", "C-2 0F0")
            NOTES("NUL 000", "C-1 0F0", "NUL 000", "C-1 0F0")
            NOTES("NUL 000", "C-1 0F1", "C-2 0F0", "NUL 000")
            NOTES("C-1 0F0", "NUL 000", "C-1 0F0", "NUL 000")
            NOTES("D#1 0F3", "E-1 0F1", "", "")

@@p1_22:    NOTES("G-1 1F0", "NUL 000", "G-1 0F1", "G-2 0F0")
            NOTES("NUL 000", "G-1 0F0", "NUL 000", "G-1 0F0")
            NOTES("NUL 000", "G-1 0F1", "G-2 0F0", "NUL 000")
            NOTES("G-1 0F0", "NUL 000", "G-1 0F0", "NUL 000")
            NOTES("G-1 0F1", "G-2 0F0", "NUL 000", "G-1 0F0")
            NOTES("NUL 000", "G-1 0F0", "NUL 000", "A-1 0F3")

            NOTES("B-1 0F1", "C-2 1F0", "NUL 000", "C-1 0F1")
            NOTES("C-2 0F0", "NUL 000", "C-1 0F0", "NUL 000")

            NOTES("C-2 1F0", "NUL 000", "C-1 0F1", "C-2 0F0")
            NOTES("NUL 000", "C-1 0F0", "NUL 000", "")

            NOTES("C-2 1F0", "NUL 000", "C-1 0F0", "NUL 0B0")
            NOTES("C-2 1F0", "NUL 000", "C-1 0F0", "NUL 0B0")
            NOTES("C-2 1F0", "NUL 000", "C-1 0F0", "NUL 0B0")
            NOTES("C-2 1F0", "NUL 000", "C-2 1F0", "NUL 000")

@@p2_12:    NOTES("B-2 BF5", "D-3 0F5", "E-3 0F1", "F-3 0F3")
            NOTES("G-3 0F3", "F-3 0F1", "E-3 0F3", "D-3 0F3")
            NOTES("C-3 0F7", "C-4 CF0", "B-3 0F0", "A#3 0F0")
            NOTES("A-3 0F0", "G#3 0F0", "G-3 0F0", "F#3 0F0")
            NOTES("F-3 0F0", "E-3 0F0", "D#3 0F0", "D-3 0F0")
            NOTES("C#3 0F0", "C-3 0F0", "B-2 0F0", "A#2 0F0")
            NOTES("A-2 0F0", "G#2 0F0", "G-2 0F0", "F#2 0F0")
            NOTES("F-2 0F0", "E-2 0F0", "D#2 0F0", "D-2 0F0")
            NOTES("C#2 0F0", "", "", "")

@@p2_22:    NOTES("B-2 BF5", "D-3 0F5", "E-3 0F1", "F-3 0F3")
            NOTES("G-3 0F3", "F-3 0F1", "E-3 0F3", "D-3 0F3")
            NOTES("C-3 BF3", "NUL 0B3", "C-3 BF3", "NUL 0B3")
            NOTES("C-3 BF2", "NUL 0B0", "C-3 BF2", "NUL 0B0")
            NOTES("C-3 BF2", "NUL 0B0", "C-3 BF0", "NUL 000")
            NOTES("C-3 BF0", "NUL 000", "", "")

@@p3_12:    NOTES("NUL 101", "F-5 DF1", "G-5 0F1", "D-5 0FD")
            NOTES("B-4 0F3", "C-5 0F3", "D-5 0F3", "E-5 0F7")
            NOTES("C-3 CF0", "C#3 0F0", "D-3 0F0", "D#3 0F0")
            NOTES("E-3 0F0", "F-3 0F0", "F#3 0F0", "G-3 0F0")
            NOTES("G#3 0F0", "A-3 0F0", "A#3 0F0", "B-3 0F0")
            NOTES("C-4 0F0", "C#4 0F0", "D-4 0F0", "D#4 0F0")
            NOTES("E-4 0F0", "F-4 0F0", "F#4 0F0", "G-4 0F0")
            NOTES("G#4 0F0", "A-4 0F0", "A#4 0F0", "B-4 0F0")

@@p3_22:    NOTES("NUL 101", "F-5 DF1", "G-5 0F1", "D-5 0FD")
            NOTES("B-4 0F3", "C-5 0F3", "D-5 0F3", "E-5 DF3")
            NOTES("F-3 0F0", "NUL 000", "F-3 0F0", "NUL 000")
            NOTES("E-5 DF3", "F-3 0F0", "NUL 000", "F-3 0F0")
            NOTES("NUL 000", "E-5 DF2", "", "")
            NOTES("NUL 0B0", "E-5 DF2", "NUL 0B0", "E-5 DF2")
            NOTES("NUL 0B0", "F-3 0F0", "NUL 000", "F-3 0F0")
            NOTES("NUL 000", "", "", "")

@@p2_15:    NOTES("C-4 EF5", "G#3 0FD", "C-4 0F3", "C#4 0F1")
            NOTES("C-4 0F1", "A#3 0F1", "G#3 0F1", "A#3 0F5")
            NOTES("D#3 0F5", "D-3 0F1", "D#3 0F5", "C#4 0F3")
            NOTES("C-4 0F1", "A#3 0F1", "G#3 0F1", "G-3 0F1")


@@p2_16:    NOTES("F-3 EF5", "A#3 0FF", "NUL 0F3", "C-4 0F1")
            NOTES("A#3 0F1", "G-3 0F1", "G#3 0FF", "NUL 0F9")
            NOTES("A#3 0F1", "G#3 0F1", "G-3 0F1", "")

@@p2_17:    NOTES("F-3 EF5", "G#3 0FD", "C#4 0F3", "C-4 0F1")
            NOTES("A#3 0F1", "G#3 0F1", "A#3 0F1", "C-4 0F5")
            NOTES("G#3 0FD", "C-4 0F3", "A#3 0F1", "G#3 0F1")
            NOTES("G-3 0F1", "G#3 0F1", "", "")

@@p2_18:    NOTES("G-3 EF5", "F-3 0F5", "A-3 0F1", "B-3 0F3")
            NOTES("G-3 0F3", "C-4 0F1", "A#3 0F3", "G#3 0F3")
            NOTES("G-3 0F7", "NUL 0FF", "NUL 0F7", "")

@@p2_27:    NOTES("F-4 FE5", "G#4 0ED", "C#5 0E3", "C-5 0E1")
            NOTES("A#4 0E1", "G#4 0E1", "A#4 0E1", "C-5 0E5")
            NOTES("G#4 0ED", "C-5 0E3", "A#4 0E1", "G#4 0E1")
            NOTES("G-4 0E1", "G#4 0E1", "", "")

@@p3_28:    NOTES("G-4 FE5", "F-4 0E9",  "F-4 0E3", "B-4 0E3")
            NOTES("C-5 0E3", "D-5 0E3", "E-5 0E7", "NUL 0EF")
            NOTES("NUL 0E7", "", "", "")

@@p5_00:    NOTES("DRM 4F7", "DRM 4F7", "DRM 4F3", "DRM 4F3")
            NOTES("DRM 4F3", "DRM 4F3", "", "")

@@p5_10:    NOTES("DRM 5B7", "DRM 5B7", "DRM 5B7", "DRM 5B7")
            NOTES("DRM 5B7", "DRM 5B7", "", "")

@@p5_20:    NOTES("DRM 1FF", "NUL 00F", "DRM 1FF", "NUL 00F")

@@p5_21:    NOTES("DRM 1F1", "DRM 3F1", "DRM 3F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 3F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 3F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 3F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 3F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 3F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 3F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F0", "DRM 1F0")
            NOTES("DRM 1F1", "DRM 3F1", "", "")

@@p5_22:    NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 1F1", "DRM 1F1")
            NOTES("DRM 1F1", "", "", "")

@@p5_23:    NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 1F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 2F0", "DRM 2F0", "DRM 2F1", "DRM 2F1")
            NOTES("DRM 2F1", "DRM 2F1", "", "")

@@p5_24:    NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F1", "DRM 1F1", "DRM 3F1")
            NOTES("DRM 1F1", "DRM 3F0", "DRM 1F0", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F1", "DRM 3F1", "DRM 1F1")
            NOTES("DRM 3F1", "DRM 1F0", "DRM 1F0", "DRM 1F1")
            NOTES("DRM 1F1", "DRM 1F1", "", "")

@@p5_25:    NOTES("DRM 1FF", "", "", "")

@@p5_35:    NOTES("DRM 6F1", "DRM 6AD", "NUL 00F", "NUL 00F")
            NOTES("NUL 00F", "", "", "")

@@p6_20:    NOTES("NUL 001", "DRM 4F1", "NUL 001", "DRM 4F1")
            NOTES("NUL 001", "DRM 4F1", "NUL 001", "DRM 4F1")

            NOTES("NUL 001", "DRM 4F1", "NUL 001", "DRM 4F1")
            NOTES("NUL 001", "DRM 4F1", "NUL 001", "DRM 4F1")

            NOTES("DRM 4F1", "DRM 4F1", "NUL 001", "DRM 4F1")
            NOTES("NUL 001", "DRM 4F1", "NUL 001", "DRM 4F1")

            NOTES("NUL 001", "DRM 4F1", "NUL 001", "DRM 4F1")
            NOTES("NUL 001", "NUL 001", "NUL 001", "NUL 001")

@@p6_12:    NOTES("C-1 GDF", "NUL 0DF", "NUL 0DF", "NUL 0DF")

            ENDP

;; ======================================================================== ;;
;;  End of File:  voyage-6ch.asm                                            ;;
;; ======================================================================== ;;
