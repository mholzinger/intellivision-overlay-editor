	ROMW 16
intybasic_map:	equ 0	; ROM map used
intybasic_jlp:	equ 0	; JLP is used
intybasic_cc3:	equ 0	; CC3 is used and where is RAM
intybasic_ecs:	equ 0	; Forces to include ECS startup
intybasic_voice:	equ 1	; Forces to include voice library
intybasic_flash:	equ 0	; Forces to include Flash memory library
	IF DEFINED __FEATURE.CFGVAR
		CFGVAR "voice" = 1
	ENDI
intybasic_scroll:	equ 0	; Forces to include scroll library
intybasic_col:	equ 0	; Forces to include collision detection
intybasic_keypad:	equ 0	; Forces to include keypad library
intybasic_music:	equ 0	; Forces to include music library
intybasic_music_ecs:	equ 0	; Forces to include music library
intybasic_music_volume:	equ 0	; Forces to include music volume change
intybasic_stack:	equ 0	; Forces to include stack overflow checking
intybasic_numbers:	equ 0	; Forces to include numbers library
intybasic_fastmult:	equ 0	; Forces to include fast multiplication
intybasic_fastdiv:	equ 0	; Forces to include fast division/remainder
	;
	; Prologue for IntyBASIC programs
	; by Oscar Toledo G.  http://nanochess.org/
	;
	; Revision: Jan/30/2014. Spacing adjustment and more comments.
	; Revision: Apr/01/2014. It now sets the starting screen pos. for PRINT
	; Revision: Aug/26/2014. Added PAL detection code.
	; Revision: Dec/12/2014. Added optimized constant multiplication routines.
	;                        by James Pujals.
	; Revision: Jan/25/2015. Added marker for automatic title replacement.
	;                        (option --title of IntyBASIC)
	; Revision: Aug/06/2015. Turns off ECS sound. Seed random generator using
	;                        trash in 16-bit RAM. Solved bugs and optimized
	;                        macro for constant multiplication.
	; Revision: Jan/12/2016. Solved bug in PAL detection.
	; Revision: May/03/2016. Changed in _mode_select initialization.
	; Revision: Jul/31/2016. Solved bug in multiplication by 126 and 127.
	; Revision: Sep/08/2016. Now CLRSCR initializes screen position for PRINT,
	;                        this solves bug when user programs goes directly
	;                        to PRINT.
	; Revision: Oct/21/2016. Accelerated MEMSET.
	; Revision: Jan/09/2018. Adjusted PAL/NTSC constant.
	; Revision: Feb/05/2018. Forces initialization of Intellivoice if included.
	;                        So VOICE INIT ceases to be dangerous.
	; Revision: Oct/30/2018. Redesigned PAL/NTSC detection using intvnut code,
	;                        also now compatible with Tutorvision. Reformatted.
	; Revision: Jan/10/2018. Added ECS detection.
	;

    LISTING "off"

;;==========================================================================;;
;; IntyBASIC SDK Library: romseg-bs.mac                                     ;;
;;--------------------------------------------------------------------------;;
;;  This macro library is used by the IntyBASIC SDK to manage ROM address   ;;
;;  segments and generate statistics on program ROM usage.  It is an        ;;
;;  extension of the "romseg.mac" macro library with added support for      ;;
;;  bank-switching.                                                         ;;
;;                                                                          ;;
;;  The library is based on a similar module created for the P-Machinery    ;;
;;  programming framework, which itself was based on the "CART.MAC" macro   ;;
;;  library originally created by Joe Zbiciak and distributed as part of    ;;
;;  the SDK-1600 development kit.                                           ;;
;;--------------------------------------------------------------------------;;
;;      The file is placed into the public domain by its author.            ;;
;;      All copyrights are hereby relinquished on the routines and data in  ;;
;;      this file.  -- James Pujals (DZ-Jay), 2024-2025                     ;;
;;==========================================================================;;

;; ======================================================================== ;;
;;  ROM MANAGEMENT STRUCTURES                                               ;;
;; ======================================================================== ;;

                ; Internal ROM information structure
_rom            STRUCT  0
@@null          QEQU    0
@@invalid       QEQU    -1

@@legacy        QEQU    0
@@static        QEQU    1
@@dynamic       QEQU    2

@@mapcnt        QEQU    9
@@pgsize        QEQU    4096

@@open          QSET    @@invalid
@@error         QSET    @@null

@@segcnt        QSET    0
@@segs          QSET    0
                ENDS

.ROM            STRUCT  0
@@CurrentSeg    QSET    _rom.invalid    ; No open segment

@@Size          QSET    0
@@Used          QSET    0
@@Available     QSET    0

                ; Initialize segment counters
@@Segments[_rom.legacy ]    QSET    0
@@Segments[_rom.static ]    QSET    0
@@Segments[_rom.dynamic]    QSET    0

                ENDS

_rom_stat       STRUCT  0
@@space         QEQU    "                                                                           " ; 75
@@single        QEQU    "---------------------------------------------------------------------------"
@@double        QEQU    "==========================================================================="
                ENDS


;; ======================================================================== ;;
;;  __rom_raise_error(err, desc)                                            ;;
;;  Generates an assembler error and sets the global error flag.            ;;
;;                                                                          ;;
;;  NOTE:   Both strings must be devoid of semi-colons and commas, or       ;;
;;          Bad Things(tm) may happen during pre-processing.                ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      err         The error message.                                      ;;
;;      desc        Optional error description, or _rom.null if none.       ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 (failed).                                            ;;
;; ======================================================================== ;;
MACRO   __rom_raise_error(err, desc)
;
    LISTING "off"

_rom.error      QSET    _rom.invalid

_rom.err_len    QSET    _rom.null
_rom.err_len    QSET    %desc%

        IF (_rom.err_len <> _rom.null)
            ERR  $(%err%, ": ", %desc%)
        ELSE
            ERR  $(%err%)
        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  __rom_reset_error                                                       ;;
;;  Resets the global error flag.                                           ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      None.                                                               ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  0 (no error)                                            ;;
;; ======================================================================== ;;
MACRO   __rom_reset_error
;
_rom.error      QSET    _rom.null
ENDM

;; ======================================================================== ;;
;;  __rom_validate_map(map)                                                 ;;
;;  Validates the requested ROM map.                                        ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      map         The ROM map selected. Valid values are 0 to 7.          ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_validate_map(map)
;
_rom.max        QSET    (_rom.mapcnt - 1)

        IF (((%map%) < 0) OR ((%map%) > _rom.max))
            __rom_raise_error(["Invalid ROM map number (", $#(%map%), ")"], ["Valid maps are from 0 to ", $#(_rom.max), "."])
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_validate_type(type)                                               ;;
;;  Validates the requested segment type symbol.                            ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      type        The segment type to validate.                           ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_validate_type(type)
;
        IF ((CLASSIFY(_rom.%type%) = -10000))
            __rom_raise_error("Invalid ROM segment type \"%type%\".", _rom.null)
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_validate_segment(seg)                                             ;;
;;  Validates the requested segment number to ensure it is supported by the ;;
;;  active memory map.                                                      ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The segment number to validate.                         ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_validate_segment(seg)
;
        IF ((CLASSIFY(_rom.segidx[%seg%]) = -10000))
            __rom_raise_error(["Invalid ROM segment number #", $#(%seg%), " for selected memory map."], _rom.null)
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_validate_seg_bank(seg, bank)                                      ;;
;;  Validates the requested dynamic segment and bank number to ensure it is ;;
;;  supported by the active memory map.                                     ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The segment number to validate, or -1 for the first one.;;
;;      bank        The dynamic segment bank number to validate.            ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_validate_seg_bank(seg, bank)
;
        ; First, check if the map supports dynamic segments at all
        IF (.ROM.Segments[_rom.dynamic] = 0)
                __rom_raise_error("The selected memory map does not support dynamic segments.", _rom.null)
        ENDI

        ; Validate the segment
        IF (_rom.error = _rom.null)
                __rom_validate_segment(%seg%)
        ENDI

        ; Validate the bank
        IF (_rom.error = _rom.null)

_rom.num    QSET    _rom.segidx[%seg%]
_rom.max    QSET    (_rom.bnkcnt[_rom.num] - 1)

            IF (((%bank%) < 0) OR ((%bank%) > _rom.max))
                __rom_raise_error(["Invalid bank number #", $#(%bank%), " for dynamic ROM segment #", $#(%seg%)], ["Must be between 0 and ", $#(_rom.max), "."])
            ENDI

        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_validate_segnum(segnum)                                           ;;
;;  Validates the requested internal segment number to ensure that it is    ;;
;;  valid within the active memory map.                                     ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal memory map segment number to validate.     ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_validate_segnum(segnum)
;
        IF _EXPMAC ((CLASSIFY(_rom.t[%segnum%]) = -10000))
            __rom_raise_error(["Unknown internal ROM segment number #", $#(%segnum%), "."], _rom.null)
        ELSE

_rom.type   QSET    _rom.t[%segnum%]
_rom.max    QSET    (.ROM.Segments[_rom.type] - 1)

            IF _EXPMAC (((%segnum%) < 0) OR ((%segnum%) > _rom.max))
                __rom_raise_error(["Invalid internal segment number #", $#(%segnum%), " for selected memory map"], ["Must be a value between 0 and ", $#(_rom.max), "."])
            ENDI

        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_assert_setup(label)                                               ;;
;;  Ensures that ROM.Setup has been called.                                 ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      label       A quoted-string containing the label of the asserting   ;;
;;                  macro or function.                                      ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_assert_setup(label)
;
        IF ((CLASSIFY(_rom.init) = -10000))
            __rom_raise_error(["ROM", ".Setup directive must be used before calling ROM.", %label%, "."], _rom.null)
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_assert_romseg_support(label)                                      ;;
;;  Prevents the invocation of a feature that is not supported by the       ;;
;;  legacy memory map when ROM map #0 is selected.                          ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      label       A quoted-string containing the label of the asserting   ;;
;;                  macro or function.                                      ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_assert_romseg_support(label)
;
        IF (_rom.map = 0)
            __rom_raise_error([%label%, " failed"], ["Legacy ROM map #", $#(_rom.map), " does not support it."])
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_assert_def_order(type)                                            ;;
;;  Ensures that segments are defined in the proper order:  all legacy and  ;;
;;  static segments first, followed by all dynamic ones.                    ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      type        The segment type to check.                              ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_assert_def_order(type)
;
_rom.type   QSET    _rom.%type%

        ; Make sure all dynamic segments are defined last
        IF (((_rom.type = _rom.legacy) OR (_rom.type = _rom.static)) AND (.ROM.Segments[_rom.dynamic] > 0))
            __rom_raise_error("Invalid ROM segment definition order", "All static and legacy segments must be defined before any dynamic ones.")
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_segmem_size(segnum)                                               ;;
;;  Computes the total size of a ROM segment.                               ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal segment for which to compute the size.     ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      None.                                                               ;;
;; ======================================================================== ;;
MACRO   __rom_segmem_size(segnum)
;
.ROM.SegSize[%segnum%]  QSET (_rom.e[%segnum%] - _rom.b[%segnum%] + 1)
ENDM

;; ======================================================================== ;;
;;  __rom_segmem_used(segnum)                                               ;;
;;  Computes the usage of a ROM segment.                                    ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal segment for which to compute the usage.    ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      None.                                                               ;;
;; ======================================================================== ;;
MACRO   __rom_segmem_used(segnum)
;
.ROM.SegUsed[%segnum%]  QSET (_rom.pos[%segnum%] - _rom.b[%segnum%])
ENDM

;; ======================================================================== ;;
;;  __rom_segmem_available(segnum)                                          ;;
;;  Computes the available space of a ROM segment.                          ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal segment for which to compute the available ;;
;;                  space.                                                  ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      None.                                                               ;;
;; ======================================================================== ;;
MACRO   __rom_segmem_available(segnum)
;
.ROM.SegAvlb[%segnum%]  QSET (_rom.e[%segnum%] - _rom.pos[%segnum%] + 1)
ENDM

;; ======================================================================== ;;
;;  __rom_calculate_stats                                                   ;;
;;  Computes the total ROM size and usage statistics.                       ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      None.                                                               ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      None.                                                               ;;
;; ======================================================================== ;;
MACRO   __rom_calculate_stats
;
_rom.segnum     QSET    0

            REPEAT (_rom.segcnt)

.ROM.Size       SET     (.ROM.Size      + .ROM.SegSize[_rom.segnum])
.ROM.Used       SET     (.ROM.Used      + .ROM.SegUsed[_rom.segnum])
.ROM.Available  SET     (.ROM.Available + .ROM.SegAvlb[_rom.segnum])

_rom.segnum     QSET    (_rom.segnum + 1)

            ENDR
ENDM

;; ======================================================================== ;;
;;  __rom_init_segmem(seg, start, end, page, type)                          ;;
;;  Initializes and configures the requested memory map segment indicated   ;;
;;  by "seg," using the provided arguments.  All internal data structures   ;;
;;  for memory integrity and accounting are also initialized.               ;;
;;                                                                          ;;
;;                                                                          ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The number of the segment to initialize.                ;;
;;      start       The start address of the segment.                       ;;
;;      end         The end address of the segment.                         ;;
;;      page        An optional page number to switch the segment to.       ;;
;;      type        The type of segment:  "legacy," "static," or "dynamic". ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_init_segmem(seg, start, end, page, type)
;
                __rom_validate_type(%type%)
                __rom_assert_def_order(%type%)

        IF (_rom.error = _rom.null)

_rom.type           QSET    _rom.%type%
_rom.num            QSET    _rom.segcnt                 ; New internal segment number
_rom.segcnt         QSET    (_rom.segcnt + 1)           ; Total internal segments (so far)

            ; Keep track of the index for the given segment
            IF ((CLASSIFY(_rom.segidx[%seg%]) = -10000))
_rom.segs           QSET    (_rom.segs + 1)
_rom.segidx[%seg%]  QSET    _rom.num
_rom.bnkcnt[%seg%]  QSET    0
            ENDI

_rom.b   [_rom.num] QSET    %start%                     ; Start address
_rom.e   [_rom.num] QSET    %end%                       ; End address
_rom.p   [_rom.num] QSET    %page%                      ; Page number
_rom.t   [_rom.num] QSET    _rom.type                   ; Segment type

            IF ((%page%) <> _rom.invalid)

_rom.sbase          QSET    (_rom.b[_rom.num] AND $F000)
_rom.send           QSET    (_rom.e[_rom.num] OR  $0FFF)
_rom.spages         QSET    (((_rom.send - _rom.sbase) + 1) / _rom.pgsize)

_rom.pgs [_rom.num] QSET    _rom.spages                 ; Physical pages in segment

                ; For dynamic segments, keep track of
                ; the number of banks.
                IF (_rom.type = _rom.dynamic)
_rom.bnk [_rom.num] QSET    _rom.bnkcnt[%seg%]          ; Logical bank number
_rom.bnkcnt[%seg%]  QSET    (_rom.bnkcnt[%seg%] + 1)    ; Banks in segment
                ENDI

            ELSE

_rom.bnk [_rom.num] QSET    _rom.invalid
_rom.pgs [_rom.num] QSET    _rom.invalid

            ENDI

_rom.seg [_rom.num] QSET    %seg%
_rom.pos [_rom.num] QSET    %start%                     ; Starting position

.ROM.Segments[_rom.type] QSET   (.ROM.Segments[_rom.type] + 1)

            IF (_rom.type <> _rom.legacy)
                ; Initialize accounting statistics
                __rom_segmem_size     (_rom.num)
                __rom_segmem_used     (_rom.num)
                __rom_segmem_available(_rom.num)
            ENDI
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_check_segmem_range(addr, segnum)                                  ;;
;;  Checks an address to make sure it falls within a given ROM segment.     ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      addr        The address to check.                                   ;;
;;      segnum      The internal segment for which to check the range.      ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;;      _rom.ovrflo The number of words in excess.                          ;;
;;      _rom.sidx   The logical segment number.                             ;;
;;      _rom.bidx   The logical bank number.                                ;;
;; ======================================================================== ;;
MACRO   __rom_check_segmem_range(addr, segnum)
;
        IF (_rom.open = %segnum%)
_rom.rbase      QSET    _rom.cb
_rom.rend       QSET    _rom.ce
        ELSE
_rom.rbase      QSET    _rom.b[%segnum%]
_rom.rend       QSET    _rom.e[%segnum%]
        ENDI


        IF _EXPMAC ((%addr%) < _rom.rbase) OR (((%addr%) - 1) > _rom.rend)

_rom.ovrflo     QSET    ((%addr%) - _rom.rend - 1)
_rom.sidx       QSET    _rom.seg[%segnum%]
_rom.bidx       QSET    _rom.bnk[%segnum%]

          ; NOTE: Overflows are significant, so we want to
          ;       display such errors in STDOUT as well.
          IF _EXPMAC (_rom.t[%segnum%] = _rom.dynamic)
            __rom_raise_error(["Dynamic ROM segment overflow in segment #", $#(_rom.sidx), ", bank #", $#(_rom.bidx)], ["Total ", $#(_rom.ovrflo), " words in excess."])

            SMSG $("ERROR: Overflow in dynamic ROM segment #", $#(_rom.sidx), ", bank #", $#(_rom.bidx), ": Total ", $#(_rom.ovrflo), " words in excess.")
          ELSE
            __rom_raise_error(["ROM segment overflow in segment #", $#(_rom.sidx)], ["Total ", $#(_rom.ovrflo), " words in excess."])

            SMSG $("ERROR: Overflow in ROM segment #", $#(_rom.sidx), ": Total ", $#(_rom.ovrflo), " words in excess.")
          ENDI
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_set_pc_addrs(addr, page)                                          ;;
;;  Relocates the program counter to the given address, selecting a         ;;
;;  specific page if requested.                                             ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      addr        The new address to set the program counter.             ;;
;;      page        An optional page to select (or _rom.invalid if none).   ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      None.                                                               ;;
;; ======================================================================== ;;
MACRO   __rom_set_pc_addrs(addr, page)
;
        IF (%page% <> _rom.invalid)

            LISTING "on"
                ; Open segment page
                ORG     %addr%:%page%
            LISTING "prev"

        ELSE

            LISTING "on"
                ; Open segment
                ORG     %addr%
            LISTING "prev"

        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_open_seg(segnum)                                                  ;;
;;  Opens a ROM segment.  If the segment is already open, it checks the     ;;
;;  current program counter to ensure it is still within valid range.       ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal memory map segment to open.                ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_open_seg(segnum)
;
                __rom_reset_error
                __rom_validate_segnum(%segnum%)

        IF _EXPMAC (_rom.error = _rom.null)

            IF _EXPMAC (_rom.open <> %segnum%)

_rom.cb         QSET    _rom.b  [%segnum%]      ; Current base address
_rom.ce         QSET    _rom.e  [%segnum%]      ; Current end address
_rom.cp         QSET    _rom.p  [%segnum%]      ; Current page

_rom.cpos       QSET    _rom.pos[%segnum%]

                __rom_set_pc_addrs(_rom.cpos, _rom.cp)

_rom.open       QSET    %segnum%
.ROM.CurrentSeg QSET    _rom.open

            ELSE

_rom.pc         QSET    $

                ; If the segment is already open, just
                ; verify we're still within in range.
                __rom_check_segmem_range(_rom.pc, %segnum%)

            ENDI

        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_close_seg(segnum)                                                 ;;
;;  Closes an open ROM segment.  It also checks that the current program    ;;
;;  counter falls within the valid range of the open segment.  Nothing will ;;
;;  be done if "segnum" is _rom.invalid.  An error is raised if the given   ;;
;;  segment is not open.                                                    ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal memory map segment to close.               ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_close_seg(segnum)
;
                __rom_reset_error

        IF ((%segnum%) <> _rom.invalid)

                __rom_validate_segnum(%segnum%)

          IF (_rom.error = _rom.null)

            IF (_rom.open <> %segnum%)
                IF (_rom.t[%segnum%] = _rom.dynamic)
                  __rom_raise_error("Dynamic ROM segment closure failed", ["Bank #", $#(_rom.bnk[%segnum%]), " is not opened."])
                ELSE
                  __rom_raise_error("ROM segment closure failed", ["Segment #", $#(_rom.seg[%segnum%]), " is not opened."])
                ENDI
            ELSE

_rom.pc             QSET $

              ; Ignore legacy segments
              IF (_rom.t[%segnum%] <> _rom.legacy)

                ; Close segment
                __rom_check_segmem_range(_rom.pc, %segnum%)

                ; Keep track of current segment position
_rom.pos[%segnum%]  QSET _rom.pc

                ; Compute usage statistics
                __rom_segmem_used(%segnum%)
                __rom_segmem_available(%segnum%)

              ENDI

_rom.open           QSET _rom.invalid                   ; Close segment %segnum%
.ROM.CurrentSeg     QSET _rom.open

            ENDI

          ENDI

        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_try_open_seg(segnum, min)                                         ;;
;;  Opens a given ROM segment if it has a minimum of "min" words available. ;;
;;                                                                          ;;
;;  NOTE:   If a ROM segment is currently opened, this macro will not do    ;;
;;          anything.  This lets us chain calls to __rom_try_open_seg() for ;;
;;          all available segments, in order to attempt to find one with    ;;
;;          sufficient capacity.                                            ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      segnum      The internal memory map segment to test and open.       ;;
;;      min         The minimum size required, in 16-bit words.             ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_try_open_seg(segnum, min)
;
        IF _EXPMAC ((_rom.open = _rom.invalid) AND (%segnum% < _rom.segcnt) AND ((_rom.pos[%segnum%] + (%min%)) < _rom.e[%segnum%]))
                __rom_open_seg(%segnum%)
        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_select_segment(seg)                                               ;;
;;  Relocates the program counter to a static ROM segment.  Also closes the ;;
;;  currently open segment, keeping track of its usage.                     ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The static ROM segment to open.                         ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_select_segment(seg)
;
        IF (_rom.error = _rom.null)
                __rom_validate_segment(%seg%)
        ENDI

        IF (_rom.error = _rom.null)

_rom.segnum     QSET    _rom.segidx[%seg%]
_rom.type       QSET    _rom.t[_rom.segnum]

            ; Fail if the segment is dynamic
            IF (_rom.type = _rom.dynamic)
                __rom_raise_error(["Cannot select ROM segment #", $#(%seg%), " without a bank"], "Segment is dynamic.")
            ENDI

            ; Open static segment
            IF (_rom.type = _rom.static)
                __rom_close_seg(_rom.open)
                __rom_open_seg(_rom.segnum)
            ENDI

        ENDI
ENDM

;; ======================================================================== ;;
;;  __rom_switch_mem_page(base, page)                                       ;;
;;  Switches a range of memory addresses to a target page.                  ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      base        The base address of the range to switch.                ;;
;;      page        The target page number.                                 ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   __rom_switch_mem_page(base, page)
;
_rom.b_addr     QSET    ((%base%) AND $F000)
_rom.b_src      QSET    (_rom.b_addr OR $0A50 OR (%page%))
_rom.b_trg      QSET    (_rom.b_addr OR $0FFF)

    LISTING "on"

                MVII    #_rom.b_src, R0                 ; \_ Switch bank: [$s000 - $sFFF] to page
                MVO     R0,     _rom.b_trg              ; /

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  __rom_stats_scale(val, scale)                                           ;;
;;  Returns value "val" scaled by "scale." The formula used for scaling is: ;;
;;                                                                          ;;
;;              return = ceil(val / scale)                                  ;;
;;                     = [((val * base) / scale) + (base - 1)] / base       ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      val         The value to scale.                                     ;;
;;      scale       The scale to apply.                                     ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      ceil(val / scale).                                                  ;;
;; ======================================================================== ;;
MACRO   __rom_stats_scale(val, scale)
    (((((%val%) * 10) / (%scale%)) + 9) / 10)
ENDM

;; ======================================================================== ;;
;;  __rom_stats_draw_line(style, len)                                       ;;
;;  Outputs a horizontal line, useful for displaying tabular information.   ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      style       The line style to draw.  Available values are:          ;;
;;                      single      Single (thin) line.                     ;;
;;                      double      Double (thick) line.                    ;;
;;                                                                          ;;
;;      len         The length of the line to draw, in characters.          ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      A horizontal line in the given style.                               ;;
;; ======================================================================== ;;
MACRO   __rom_stats_draw_line(style, len)
        _rom_stat.%style%[0, ((%len%) - 1)]
ENDM

;; ======================================================================== ;;
;;  __rom_stats_pad_left(str, len)                                          ;;
;;  Outputs a string in a field of "len" characters, justified to the right ;;
;;  and padded on the left with blank spaces.                               ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      str         The string to output.                                   ;;
;;      len         The length of the field, in characters.                 ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      The string, left-padded in the field.                               ;;
;; ======================================================================== ;;
MACRO   __rom_stats_pad_left(str, len)
        $(_rom_stat.space[0, ((%len%) - STRLEN(%str%) - 1)], %str%)
ENDM

;; ======================================================================== ;;
;;  __rom_stats_pad_right(str, len)                                         ;;
;;  Outputs a string in a field of "len" characters, justified to the left  ;;
;;  and padded on the right with blank spaces.                              ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      str         The string to output.                                   ;;
;;      len         The length of the field, in characters.                 ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      The string, right-padded in the field.                              ;;
;; ======================================================================== ;;
MACRO   __rom_stats_pad_right(str, len)
        $(%str%, _rom_stat.space[0, ((%len%) - STRLEN(%str%) - 1)])
ENDM

;; ======================================================================== ;;
;;  ROM.Setup map                                                           ;;
;;  Configures and initializes the memory map indicated by "map."           ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      map         The memory map number to initialize.                    ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.Setup map
;
    LISTING "code"

                __rom_reset_error

        ; Make sure the directive is called only once!
        IF ((CLASSIFY(_rom.init) = -10000))
                __rom_validate_map(%map%)
        ELSE
                __rom_raise_error(["ROM", ".Setup directive must be called only once per program."], _rom.null)
        ENDI

        IF (_rom.error = _rom.null)

_rom.init       QEQU    1
_rom.map        QSET    %map%
_rom.ecs_off    QSET    _rom.null
_rom.extra_rom  QSET    0

            IF (intybasic_ecs)
_rom.ecs_req    QSET    intybasic_ecs
            ELSE
_rom.ecs_req    QSET    _rom.null
            ENDI

            IF (intybasic_jlp)
_rom.jlp_req    QSET    intybasic_jlp
            ELSE
_rom.jlp_req    QSET    _rom.null
            ENDI

            IF (intybasic_cc3 OR intybasic_jlp)
_rom.cart_ram   QSET    1
            ELSE
_rom.cart_ram   QSET    _rom.null
            ENDI

            ; ---------------------------------------------------------
            ; Initialize ROM segments for active memory map.
            ;
            ; NOTE: Define below the segments available for each memory
            ;       map supported.  When defining a map, the following
            ;       rules must be observed:
            ;
            ;         - Map #0 must always be the "legacy" map.
            ;         - All static segments in a map must be defined
            ;           before any dynamic ones.
            ;         - Segment numbers must start at zero.
            ;         - Segment numbers should be defined in order.
            ;         - There must not be gaps in segment numbers.
            ; ---------------------------------------------------------

            ; MAP #0: Legacy memory map wit no ROM management
            IF (_rom.map = 0)
                __rom_init_segmem(0, $5000, $FFFF, _rom.invalid, legacy)
            ENDI

            ; MAP #1: Original Mattel 16K static memory map
            IF (_rom.map = 1)
                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $D000, $DFFF, _rom.invalid, static)
                __rom_init_segmem(2, $F000, $FFFF, _rom.invalid, static)
            ENDI

            ; MAP #2: JLP 42K static memory map
            IF (_rom.map = 2)
_rom.ecs_off    QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $A000, $BFFF, _rom.invalid, static)
                __rom_init_segmem(2, $C040, $FFFF, _rom.invalid, static)

              IF (_rom.jlp_req <> _rom.null)
                __rom_init_segmem(3, $2000, $2FFF, $F,           static)
                __rom_init_segmem(4, $7000, $7FFF, $F,           static)
              ELSE
                __rom_init_segmem(3, $2100, $2FFF, _rom.invalid, static)
                __rom_init_segmem(4, $7100, $7FFF, _rom.invalid, static)
              ENDI

                __rom_init_segmem(5, $4810, $4FFF, _rom.invalid, static)
            ENDI

            ; MAP #3: Dynamic bank-switching 98K memory map - 4K banks
            IF (_rom.map = 3)
_rom.ecs_off    QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $A000, $BFFF, _rom.invalid, static)
                __rom_init_segmem(2, $C040, $FFFF, _rom.invalid, static)
                __rom_init_segmem(3, $2000, $2FFF, $F,           static)
                __rom_init_segmem(4, $4810, $4FFF, _rom.invalid, static)

_rom.dynseg     QSET    _rom.segcnt

                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $1, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $2, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $3, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $4, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $5, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $6, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $7, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $8, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $9, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $A, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $B, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $C, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $D, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $E, dynamic)
                __rom_init_segmem(_rom.dynseg, $7000, $7FFF, $F, dynamic)
            ENDI

            ; MAP #4: Dynamic bank-switching 154K memory map - 8K banks
            IF (_rom.map = 4)
_rom.ecs_off    QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $A000, $BFFF, _rom.invalid, static)
                __rom_init_segmem(2, $C040, $DFFF, _rom.invalid, static)
                __rom_init_segmem(3, $2000, $2FFF, $F,           static)
                __rom_init_segmem(4, $7000, $7FFF, $F,           static)
                __rom_init_segmem(5, $4810, $4FFF, _rom.invalid, static)

_rom.dynseg     QSET    _rom.segcnt

                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $0, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $2, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $3, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $4, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $5, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $6, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $7, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $8, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $9, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $A, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $B, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $C, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $D, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $E, dynamic)
                __rom_init_segmem(_rom.dynseg, $E000, $FFFF, $F, dynamic)
            ENDI

            ; MAP #5: Dynamic bank-switching 254K memory map - 16K banks
            IF (_rom.map = 5)
_rom.ecs_off    QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $A000, $BFFF, _rom.invalid, static)
                __rom_init_segmem(2, $2000, $2FFF, $F,           static)
                __rom_init_segmem(3, $7000, $7FFF, $F,           static)
                __rom_init_segmem(4, $4810, $4FFF, _rom.invalid, static)

_rom.dynseg     QSET    _rom.segcnt

                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $0, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $2, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $3, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $4, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $5, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $6, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $7, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $8, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $9, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $A, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $B, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $C, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $D, dynamic)
                __rom_init_segmem(_rom.dynseg, $C040, $FFFF, $E, dynamic)
            ENDI

            ; MAP #6: Dynamic bank-switching 256K map -- 2 dynamic segments
            IF (_rom.map = 6)
_rom.ecs_off    QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $C040, $DFFF, _rom.invalid, static)

                __rom_init_segmem(2, $A000, $BFFF, $0,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $1,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $2,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $3,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $4,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $5,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $6,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $7,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $8,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $9,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $A,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $B,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $C,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $D,           dynamic)
                __rom_init_segmem(2, $A000, $BFFF, $E,           dynamic)

                __rom_init_segmem(3, $E000, $FFFF, $0,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $2,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $3,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $4,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $5,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $6,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $7,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $8,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $9,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $A,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $B,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $C,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $D,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $E,           dynamic)
                __rom_init_segmem(3, $E000, $FFFF, $F,           dynamic)
            ENDI


            ; MAP #7: Dynamic bank-switching 238K map -- 4 dynamic segments
            IF (_rom.map = 7)
_rom.ecs_off    QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $2000, $2FFF, $F,           static)
                __rom_init_segmem(2, $4810, $4FFF, _rom.invalid, static)

                __rom_init_segmem(3, $7000, $7FFF, $1,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $2,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $3,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $4,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $5,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $6,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $7,           dynamic)
                __rom_init_segmem(3, $7000, $7FFF, $8,           dynamic)

                __rom_init_segmem(4, $A000, $BFFF, $0,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $1,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $2,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $3,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $4,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $5,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $6,           dynamic)
                __rom_init_segmem(4, $A000, $BFFF, $7,           dynamic)

                __rom_init_segmem(5, $C040, $DFFF, $0,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $1,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $2,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $3,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $4,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $5,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $6,           dynamic)
                __rom_init_segmem(5, $C040, $DFFF, $7,           dynamic)

                __rom_init_segmem(6, $E000, $FFFF, $0,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $2,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $3,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $4,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $5,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $6,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $7,           dynamic)
                __rom_init_segmem(6, $E000, $FFFF, $8,           dynamic)
            ENDI

            ; MAP #8: 50K static memory map
            IF (_rom.map = 8)
_rom.extra_rom  QSET    1

                __rom_init_segmem(0, $5000, $6FFF, _rom.invalid, static)
                __rom_init_segmem(1, $A000, $BFFF, _rom.invalid, static)
                __rom_init_segmem(2, $C040, $FFFF, _rom.invalid, static)
                __rom_init_segmem(3, $2100, $2FFF, _rom.invalid, static)
                __rom_init_segmem(4, $7100, $7FFF, _rom.invalid, static)

                __rom_init_segmem(5, $4810, $4FFF, _rom.invalid, static)
                __rom_init_segmem(6, $8040, $9FFF, _rom.invalid, static)
            ENDI

        ENDI

        ; Check if cartridge RAM conflicts with extra ROM at $8040
        IF (_rom.cart_ram AND _rom.extra_rom)
          __rom_raise_error(["Map #", $#(_rom.map), " is not compatible with JLP or CC3 cartridge RAM."], _rom.null)

          SMSG $("ERROR: Map #", $#(_rom.map), " is not compatible with JLP or CC3 cartridge RAM.")
        ENDI

        IF (_rom.error = _rom.null)

                ; Disable ECS in advanced maps and when ECS is used.
            IF ((_rom.ecs_off <> _rom.null) OR (_rom.ecs_req))
                __rom_set_pc_addrs($4800, _rom.invalid) ; Set up bootstrap hook

                __rom_switch_mem_page($2000, $F)        ; \
                __rom_switch_mem_page($7000, $F)        ;  > Switch off ECS ROMs
                __rom_switch_mem_page($E000, $F)        ; /

                B       $1041                           ; resume boot
            ENDI

                ; Initialize ROM base to segment #0
                ;   ($5000 - $6FFF in all maps)
                __rom_open_seg(0)

                ; ------------------------------------------------
                ; Configure the ROM header (Universal Data Block)
                ; ------------------------------------------------
                BIDECLE _ZERO           ; MOB picture base
                BIDECLE _ZERO           ; Process table
                BIDECLE _MAIN           ; Program start
                BIDECLE _ZERO           ; Background base image
                BIDECLE _ONES           ; GRAM
                BIDECLE _TITLE          ; Cartridge title and date
                DECLE   $03C0           ; No ECS title, jump to code after title,
                                        ; ... no clicks

_ZERO:          DECLE   $0000           ; Border control
                DECLE   $0000           ; 0 = color stack, 1 = f/b mode

_ONES:          DECLE   $0001, $0001    ; Initial color stack 0 and 1: Blue
                DECLE   $0001, $0001    ; Initial color stack 2 and 3: Blue
                DECLE   $0001           ; Initial border color: Blue

        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  ROM.SelectDefaultSegment                                                ;;
;;  Relocates the program counter to the default ROM segment (#0).  Also    ;;
;;  closes the currently open segment, keeping track of its usage.          ;;
;;                                                                          ;;
;;  The macro will do nothing when the legacy map (#0) is selected.         ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      None.                                                               ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.SelectDefaultSegment
;
    LISTING "code"

                __rom_reset_error
                __rom_assert_setup("SelectSegment")

        IF (_rom.error = _rom.null)

            ; Ignore when the legacy map is selected
            IF (_rom.map > 0)
                __rom_select_segment(0)
            ENDI

        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  ROM.SelectSegment seg                                                   ;;
;;  Relocates the program counter to a static ROM segment.  Also closes the ;;
;;  currently open segment, keeping track of its usage.                     ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The static ROM segment to open.                         ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.SelectSegment seg
;
    LISTING "code"

                __rom_reset_error
                __rom_assert_romseg_support("Segment selection")
                __rom_assert_setup("SelectSegment")

        IF (_rom.error = _rom.null)
                __rom_select_segment(%seg%)
        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  ROM.SelectBank seg, bank                                                ;;
;;  Relocates the program counter to a dynamic ROM segment bank.  Also      ;;
;;  closes the currently open segment, keeping track of its usage.          ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The dynamic ROM segment, or -1 for the first one.       ;;
;;      bank        The segment bank number to open.                        ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.SelectBank seg, bank
;
    LISTING "code"

                __rom_reset_error
                __rom_assert_romseg_support("Dynamic segment bank selection")
                __rom_assert_setup("SelectBank")

        IF (_rom.error = _rom.null)

            ; Determine the logical segment number
            IF ((%seg%) = _rom.invalid)
_rom.num        QSET    .ROM.Segments[_rom.static]
            ELSE
_rom.num        QSET    %seg%
            ENDI

_rom.type       QSET    _rom.t[_rom.num]

            ; Fail if the segment is not dynamic
            IF (_rom.type <> _rom.dynamic)
                __rom_raise_error(["Cannot select bank on ROM segment #", $#(_rom.num)], "Segment is not dynamic.")
            ENDI

            ; Validate the segment and bank
            IF (_rom.error = _rom.null)
                __rom_validate_seg_bank(_rom.num, %bank%)
            ENDI

            IF (_rom.error = _rom.null)

_rom.segnum     QSET    (_rom.segidx[_rom.num] + (%bank%))

              IF (_rom.segnum <> _rom.open)
                ; Open dynamic segment bank
                IF (_rom.error = _rom.null)
                  __rom_close_seg(_rom.open)
                  __rom_open_seg(_rom.segnum)
                ENDI
              ENDI

            ENDI

        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  ROM.AutoSelectSegment min                                               ;;
;;  Finds a static ROM segment with the specified minimum available         ;;
;;  capacity, and relocates the program counter to it.  Also closes the     ;;
;;  currently open segment, keeping track of its usage statistics.          ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      min         The minimum capacity required, in 16-bit words.         ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.AutoSelectSegment min
;
    LISTING "code"

                __rom_reset_error
                __rom_assert_romseg_support("Automatic segment selection")
                __rom_assert_setup("AutoSelectSegment")

        IF (_rom.error = _rom.null)
                __rom_close_seg(_rom.open)
        ENDI

        IF (_rom.error = _rom.null)

_rom.segnum     QSET    0

            REPEAT (.ROM.Segments[_rom.static])
                __rom_try_open_seg(_rom.segnum, %min%)

_rom.segnum     QSET    (_rom.segnum + 1)
            ENDR

            ; Fail if no segment was found with enough space
            IF (_rom.open = _rom.invalid)
                __rom_raise_error("Automatic ROM segment selection failed", ["Could not find a suitable segment with ", $#(%min%), " words available."])
            ENDI

        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  ROM.SwitchBank seg, bank                                                ;;
;;  Switches a dynamic ROM segment to the requested bank.                   ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      seg         The dynamic ROM segment, or -1 for the first one.       ;;
;;      bank        The dynamic ROM segment bank number to activate.        ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.SwitchBank seg, bank
;
    LISTING "code"

                __rom_reset_error
                __rom_assert_romseg_support("Automatic segment selection")
                __rom_assert_setup("SwitchBank")

        IF (_rom.error = _rom.null)

            ; Determine the logical segment number
            IF ((%seg%) = _rom.invalid)
_rom.num        QSET    .ROM.Segments[_rom.static]
            ELSE
_rom.num        QSET    %seg%
            ENDI

_rom.type       QSET    _rom.t[_rom.num]

            ; Fail if the segment is not dynamic
            IF (_rom.type <> _rom.dynamic)
                __rom_raise_error(["Cannot switch bank on ROM segment #", $#(_rom.num)], "Segment is not dynamic.")
            ENDI

            ; Validate the segment and bank
            IF (_rom.error = _rom.null)
                __rom_validate_seg_bank(_rom.num, %bank%)
            ENDI

            IF (_rom.error = _rom.null)

_rom.segnum     QSET    (_rom.segidx[_rom.num] + (%bank%))

                ; Initialize REPEAT loop symbols
_rom.r_pgs      QSET    _rom.pgs[_rom.segnum]
_rom.r_addr     QSET    _rom.b  [_rom.segnum]
_rom.r_page     QSET    _rom.p  [_rom.segnum]

                ; Switch the physical pages that comprise
                ; the logical segment bank.
                REPEAT (_rom.r_pgs)
                    __rom_switch_mem_page(_rom.r_addr, _rom.r_page)
_rom.r_addr         QSET    (_rom.r_addr + _rom.pgsize)
                ENDR

            ENDI

        ENDI

    LISTING "prev"
ENDM


;; ======================================================================== ;;
;;  ROM.End                                                                 ;;
;;  Closes any open ROM segment, reports usage statistics, and finalizes    ;;
;;  the program.                                                            ;;
;;                                                                          ;;
;;  This macro must be called at the very end of the program.               ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      None.                                                               ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      _rom.error  -1 on failure.                                          ;;
;; ======================================================================== ;;
MACRO   ROM.End
;
    LISTING "code"

                __rom_reset_error
                __rom_assert_setup("End")

        IF (_rom.error = _rom.null)
                __rom_close_seg(_rom.open)

            ; The legacy map does not support usage statistics
            IF (_rom.map > 0)
                __rom_calculate_stats
            ENDI
        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  ROM.OutputRomStats                                                      ;;
;;  Outputs ROM usage statistics to STDOUT and to the listing file.         ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      None.                                                               ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      ROM usage statistics.                                               ;;
;; ======================================================================== ;;
MACRO   ROM.OutputRomStats
;
    LISTING "code"

_rom.hdr_len    QSET    55
_rom.fld_ttl    QSET    15
_rom.fld_mem    QSET    7
_rom.fld_bnk    QSET    3
_rom.fld_siz    QSET    4
_rom.fld_avl    QSET    8
_rom.scale      QSET    1024

_rom.static_sz  QSET    0
_rom.static_us  QSET    0
_rom.static_av  QSET    0

      IF (_rom.map > 0)

                ; Draw header
                SMSG ""
                SMSG $("ROM USAGE (MAP #", $#(_rom.map), "):")
                SMSG    $("    ", __rom_stats_draw_line(double, _rom.hdr_len))
                SMSG    $("    ", "    Segment        Size       Used      Available")
                SMSG    $("    ", __rom_stats_draw_line(double, _rom.hdr_len))

_rom.idx        QSET    0
_rom.cnt        QSET    .ROM.Segments[_rom.static]

        ; Static segments
        REPEAT (_rom.cnt)
_rom.segnum     QSET    _rom.segidx[_rom.idx]

_rom.size       QSET    .ROM.SegSize[_rom.segnum]
_rom.used       QSET    .ROM.SegUsed[_rom.segnum]
_rom.avlb       QSET    .ROM.SegAvlb[_rom.segnum]

_rom.size       QSET    __rom_stats_scale(_rom.size, _rom.scale)    ; Scaled to 1K

                ; Static ROM segment stats
                SMSG    $("    ", "Static Seg #", $#(_rom.idx), "     ", __rom_stats_pad_left($#(_rom.size), _rom.fld_siz), "K     ", __rom_stats_pad_left($#(_rom.used), _rom.fld_mem), "  ", __rom_stats_pad_left($#(_rom.avlb), _rom.fld_avl), " words")

_rom.static_sz  QSET    (_rom.static_sz + _rom.size)
_rom.static_us  QSET    (_rom.static_us + _rom.used)
_rom.static_av  QSET    (_rom.static_av + _rom.avlb)

_rom.idx        QSET    (_rom.idx + 1)
        ENDR

_rom.cnt        QSET    (_rom.segs - _rom.idx)

        ; Report static sub-total if there are dynamic segments.
        ; (When there are no dynamic segments, the final account
        ; is the total for static segments.)
        IF (_rom.cnt > 0)
                ; Draw footer
                SMSG    $("    ", __rom_stats_draw_line(single, _rom.hdr_len))
                SMSG    $("    ", __rom_stats_pad_left("SUB-TOTAL:", _rom.fld_ttl), "   ", __rom_stats_pad_left($#(_rom.static_sz), _rom.fld_siz), "K     ", __rom_stats_pad_left($#(_rom.static_us), _rom.fld_mem), "  ", __rom_stats_pad_left($#(_rom.static_av), _rom.fld_avl), " words")
        ENDI

        ; Dynamic segments
        REPEAT (_rom.cnt)
_rom.segnum     QSET    _rom.segidx[_rom.idx]

                ; Dynamic ROM segment header
                SMSG    $("    ", __rom_stats_draw_line(single, _rom.hdr_len))
                SMSG    $("    ", "Dynamic Seg #", $#(_rom.idx), ":")

_rom.bidx       QSET    0
_rom.bcnt       QSET    _rom.bnkcnt[_rom.idx]

            ; Dynamic segment banks
            REPEAT (_rom.bcnt)

_rom.segnum     QSET    (_rom.segidx[_rom.idx] + _rom.bidx)

_rom.size       QSET    .ROM.SegSize[_rom.segnum]
_rom.used       QSET    .ROM.SegUsed[_rom.segnum]
_rom.avlb       QSET    .ROM.SegAvlb[_rom.segnum]

_rom.size       QSET    __rom_stats_scale(_rom.size, _rom.scale)    ; Scaled to 1K

                SMSG    $("    ", "       Bank #", __rom_stats_pad_right($#(_rom.bidx), _rom.fld_bnk), "  ", __rom_stats_pad_left($#(_rom.size), _rom.fld_siz), "K     ", __rom_stats_pad_left($#(_rom.used), _rom.fld_mem), "  ", __rom_stats_pad_left($#(_rom.avlb), _rom.fld_avl), " words")

_rom.bidx       QSET    (_rom.bidx + 1)
            ENDR

_rom.idx        QSET    (_rom.idx + 1)
        ENDR

_rom.size       QSET    __rom_stats_scale(.ROM.Size, _rom.scale)    ; Scaled to 1K

                ; Draw footer
                SMSG    $("    ", __rom_stats_draw_line(double, _rom.hdr_len))
                SMSG    $("    ", __rom_stats_pad_left("TOTAL:", _rom.fld_ttl), "   ", __rom_stats_pad_left($#(_rom.size), _rom.fld_siz), "K     ", __rom_stats_pad_left($#(.ROM.Used), _rom.fld_mem), "  ", __rom_stats_pad_left($#(.ROM.Available), _rom.fld_avl), " words")
                SMSG    $("    ", __rom_stats_draw_line(double, _rom.hdr_len))
                SMSG ""

      ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  EOF: romseg-bs.mac                                                      ;;
;; ======================================================================== ;;

    LISTING "prev"

	ROM.Setup intybasic_map

	; This macro will 'eat' SRCFILE directives if the assembler doesn't support the directive.
	IF ( DEFINED __FEATURE.SRCFILE ) = 0
	    MACRO SRCFILE x, y
	    ; macro must be non-empty, but a comment works fine.
	    ENDM
	ENDI

CLRSCR:	MVII #$200,R4		; Used also for CLS
	MVO R4,_screen		; Set up starting screen position for PRINT
	MVII #$F0,R1
FILLZERO:
	CLRR R0
MEMSET:
	SARC R1,2
	BNOV $+4
	MVO@ R0,R4
	MVO@ R0,R4
	BNC $+3
	MVO@ R0,R4
	BEQ $+7
	MVO@ R0,R4
	MVO@ R0,R4
	MVO@ R0,R4
	MVO@ R0,R4
	DECR R1
	BNE $-5
	JR R5

	;
	; Title, Intellivision EXEC will jump over it and start
	; execution directly in _MAIN
	;
	; Note mark is for automatic replacement by IntyBASIC
_TITLE:
	BYTE 126,'IntyBASIC program',0
        
	;
	; Main program
	;
_MAIN:
	DIS			; Disable interrupts
	MVII #STACK,R6

	;
	; Clean memory
	;
	CALL CLRSCR		; Clean up screen, right here to avoid brief
				; screen display of title in Sears Intellivision.
	MVII #$00e,R1		; 14 of sound (ECS)
	MVII #$0f0,R4		; ECS PSG
	CALL FILLZERO
	MVII #$0fe,R1		; 240 words of 8 bits plus 14 of sound
	MVII #$100,R4		; 8-bit scratch RAM
	CALL FILLZERO

	; Seed random generator using 16 bit RAM (not cleared by EXEC)
	CLRR R0
	MVII #$02F0,R4
	MVII #$0110/4,R1	; Includes phantom memory for extra randomness
_MAIN4:				; This loop is courtesy of GroovyBee
	ADD@ R4,R0
	ADD@ R4,R0
	ADD@ R4,R0
	ADD@ R4,R0
	DECR R1
	BNE _MAIN4
	MVO R0,_rand

	MVII #$058,R1		; 88 words of 16 bits
	MVII #$308,R4		; 16-bit scratch RAM
	CALL FILLZERO

    IF intybasic_jlp
	MVII #$1F40,R1		; Words of 16 bits
	MVII #$8040,R4		; 16-bit scratch RAM
	CALL FILLZERO
    ENDI
    IF intybasic_cc3
	MVII #$1F40,R1		; Words of 16 bits
	MVII #intybasic_cc3*256+$40,R4	; 16-bit scratch RAM
	CALL FILLZERO
    ENDI

	; PAL/NTSC detect
	CALL _set_isr
	DECLE _pal1
	EIS
	DECR PC			; This is a kind of HALT instruction

	; First interrupt may come at a weird time on Tutorvision, or
	; if other startup timing changes.
_pal1:	SUBI #8,R6		; Drop interrupt stack.
	CALL _set_isr
	DECLE _pal2
	DECR PC

	; Second interrupt is safe for initializing MOBs.
	; We will know the screen is off after this one fires.
_pal2:	SUBI #8,R6		; Drop interrupt stack.
	CALL _set_isr
	DECLE _pal3
	; clear MOBs
	CLRR R0
	CLRR R4
	MVII #$18,R2
_pal2_lp:
	MVO@ R0,R4
	DECR R2
	BNE _pal2_lp
	MVO R0,$30		; Reset horizontal delay register
	MVO R0,$31		; Reset vertical delay register

	MVII #-1100,R2		; PAL/NTSC threshold
_pal2_cnt:
	INCR R2
	B _pal2_cnt

	; The final count in R2 will either be negative or positive.
	; If R2 is still -ve, NTSC; else PAL.
_pal3:	SUBI #8,R6		; Drop interrupt stack.
	RLC R2,1
	RLC R2,1
	ANDI #1,R2		; 1 = NTSC, 0 = PAL

	MVII #$55,R1
	MVO R1,$4040
	MVII #$AA,R1
	MVO R1,$4041
	MVI $4040,R1
	CMPI #$55,R1
	BNE _ecs1
	MVI $4041,R1
	CMPI #$AA,R1
	BNE _ecs1
	ADDI #2,R2		; ECS detected flag
_ecs1:
	MVO R2,_ntsc

	CALL _set_isr
	DECLE _int_vector

	CALL CLRSCR		; Because _screen was reset to zero
	CALL _wait
	CALL _init_music
	MVII #2,R0		; Color Stack mode
	MVO R0,_mode_select
	MVII #$038,R0
	MVO R0,$01F8		; Configures sound
	MVO R0,$00F8		; Configures sound (ECS)
	CALL IV_INIT_and_wait	; Setup Intellivoice

;* ======================================================================== *;
;*  These routines are placed into the public domain by their author.  All  *;
;*  copyright rights are hereby relinquished on the routines and data in    *;
;*  this file.  -- James Pujals (DZ-Jay), 2014                              *;
;* ======================================================================== *;

; Modified by Oscar Toledo G. (nanochess), Aug/06/2015
; * Tested all multiplications with automated test.
; * Accelerated multiplication by 7,14,15,28,31,60,62,63,112,120,124
; * Solved bug in multiplication by 23,39,46,47,55,71,78,79,87,92,93,94,95,103,110,111,119
; * Improved sequence of instructions to be more interruptible.

;; ======================================================================== ;;
;;  MULT reg, tmp, const                                                    ;;
;;  Multiplies "reg" by constant "const" and using "tmp" for temporary      ;;
;;  calculations.  The result is placed in "reg."  The multiplication is    ;;
;;  performed by an optimal combination of shifts, additions, and           ;;
;;  subtractions.                                                           ;;
;;                                                                          ;;
;;  NOTE:   The resulting contents of the "tmp" are undefined.              ;;
;;                                                                          ;;
;;  ARGUMENTS                                                               ;;
;;      reg         A register containing the multiplicand.                 ;;
;;      tmp         A register for temporary calculations.                  ;;
;;      const       The constant multiplier.                                ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      reg         Output value.                                           ;;
;;      tmp         Trashed.                                                ;;
;;      .ERR.Failed True if operation failed.                               ;;
;; ======================================================================== ;;
MACRO   MULT reg, tmp, const
;
    LISTING "code"

_mul.const      QSET    %const%
_mul.done       QSET    0

        IF (%const% > $7F)
_mul.const      QSET    (_mul.const SHR 1)
                SLL     %reg%,  1
        ENDI

        ; Multiply by $00 (0)
        IF (_mul.const = $00)
_mul.done       QSET    -1
                CLRR    %reg%
        ENDI

        ; Multiply by $01 (1)
        IF (_mul.const = $01)
_mul.done       QSET    -1
                ; Nothing to do
        ENDI

        ; Multiply by $02 (2)
        IF (_mul.const = $02)
_mul.done       QSET    -1
                SLL     %reg%,  1
        ENDI

        ; Multiply by $03 (3)
        IF (_mul.const = $03)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $04 (4)
        IF (_mul.const = $04)
_mul.done       QSET    -1
                SLL     %reg%,  2
        ENDI

        ; Multiply by $05 (5)
        IF (_mul.const = $05)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $06 (6)
        IF (_mul.const = $06)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $07 (7)
        IF (_mul.const = $07)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $08 (8)
        IF (_mul.const = $08)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
        ENDI

        ; Multiply by $09 (9)
        IF (_mul.const = $09)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $0A (10)
        IF (_mul.const = $0A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $0B (11)
        IF (_mul.const = $0B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $0C (12)
        IF (_mul.const = $0C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $0D (13)
        IF (_mul.const = $0D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $0E (14)
        IF (_mul.const = $0E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $0F (15)
        IF (_mul.const = $0F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $10 (16)
        IF (_mul.const = $10)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
        ENDI

        ; Multiply by $11 (17)
        IF (_mul.const = $11)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $12 (18)
        IF (_mul.const = $12)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $13 (19)
        IF (_mul.const = $13)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $14 (20)
        IF (_mul.const = $14)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $15 (21)
        IF (_mul.const = $15)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $16 (22)
        IF (_mul.const = $16)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $17 (23)
        IF (_mul.const = $17)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $18 (24)
        IF (_mul.const = $18)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $19 (25)
        IF (_mul.const = $19)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $1A (26)
        IF (_mul.const = $1A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $1B (27)
        IF (_mul.const = $1B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $1C (28)
        IF (_mul.const = $1C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $1D (29)
        IF (_mul.const = $1D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $1E (30)
        IF (_mul.const = $1E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $1F (31)
        IF (_mul.const = $1F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $20 (32)
        IF (_mul.const = $20)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
        ENDI

        ; Multiply by $21 (33)
        IF (_mul.const = $21)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $22 (34)
        IF (_mul.const = $22)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $23 (35)
        IF (_mul.const = $23)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $24 (36)
        IF (_mul.const = $24)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $25 (37)
        IF (_mul.const = $25)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $26 (38)
        IF (_mul.const = $26)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $27 (39)
        IF (_mul.const = $27)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $28 (40)
        IF (_mul.const = $28)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $29 (41)
        IF (_mul.const = $29)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $2A (42)
        IF (_mul.const = $2A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $2B (43)
        IF (_mul.const = $2B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $2C (44)
        IF (_mul.const = $2C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $2D (45)
        IF (_mul.const = $2D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $2E (46)
        IF (_mul.const = $2E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR	%tmp%,  %reg%
        ENDI

        ; Multiply by $2F (47)
        IF (_mul.const = $2F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR	%tmp%,  %reg%
        ENDI

        ; Multiply by $30 (48)
        IF (_mul.const = $30)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $31 (49)
        IF (_mul.const = $31)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $32 (50)
        IF (_mul.const = $32)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $33 (51)
        IF (_mul.const = $33)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $34 (52)
        IF (_mul.const = $34)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $35 (53)
        IF (_mul.const = $35)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $36 (54)
        IF (_mul.const = $36)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $37 (55)
        IF (_mul.const = $37)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
		SLL	%reg%,	1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $38 (56)
        IF (_mul.const = $38)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $39 (57)
        IF (_mul.const = $39)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $3A (58)
        IF (_mul.const = $3A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $3B (59)
        IF (_mul.const = $3B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $3C (60)
        IF (_mul.const = $3C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $3D (61)
        IF (_mul.const = $3D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $3E (62)
        IF (_mul.const = $3E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $3F (63)
        IF (_mul.const = $3F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $40 (64)
        IF (_mul.const = $40)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  2
        ENDI

        ; Multiply by $41 (65)
        IF (_mul.const = $41)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $42 (66)
        IF (_mul.const = $42)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $43 (67)
        IF (_mul.const = $43)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $44 (68)
        IF (_mul.const = $44)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $45 (69)
        IF (_mul.const = $45)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $46 (70)
        IF (_mul.const = $46)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $47 (71)
        IF (_mul.const = $47)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $48 (72)
        IF (_mul.const = $48)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $49 (73)
        IF (_mul.const = $49)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $4A (74)
        IF (_mul.const = $4A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $4B (75)
        IF (_mul.const = $4B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $4C (76)
        IF (_mul.const = $4C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $4D (77)
        IF (_mul.const = $4D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $4E (78)
        IF (_mul.const = $4E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $4F (79)
        IF (_mul.const = $4F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $50 (80)
        IF (_mul.const = $50)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $51 (81)
        IF (_mul.const = $51)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $52 (82)
        IF (_mul.const = $52)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $53 (83)
        IF (_mul.const = $53)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $54 (84)
        IF (_mul.const = $54)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $55 (85)
        IF (_mul.const = $55)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $56 (86)
        IF (_mul.const = $56)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $57 (87)
        IF (_mul.const = $57)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR    %reg%,	%tmp%
                SLL     %reg%,  2
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $58 (88)
        IF (_mul.const = $58)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $59 (89)
        IF (_mul.const = $59)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $5A (90)
        IF (_mul.const = $5A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $5B (91)
        IF (_mul.const = $5B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $5C (92)
        IF (_mul.const = $5C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $5D (93)
        IF (_mul.const = $5D)
_mul.done       QSET    -1
		MOVR	%reg%,	%tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $5E (94)
        IF (_mul.const = $5E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $5F (95)
        IF (_mul.const = $5F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                ADDR	%reg%,	%reg%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $60 (96)
        IF (_mul.const = $60)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $61 (97)
        IF (_mul.const = $61)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $62 (98)
        IF (_mul.const = $62)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $63 (99)
        IF (_mul.const = $63)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $64 (100)
        IF (_mul.const = $64)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $65 (101)
        IF (_mul.const = $65)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $66 (102)
        IF (_mul.const = $66)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $67 (103)
        IF (_mul.const = $67)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $68 (104)
        IF (_mul.const = $68)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $69 (105)
        IF (_mul.const = $69)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $6A (106)
        IF (_mul.const = $6A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $6B (107)
        IF (_mul.const = $6B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $6C (108)
        IF (_mul.const = $6C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $6D (109)
        IF (_mul.const = $6D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $6E (110)
        IF (_mul.const = $6E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $6F (111)
        IF (_mul.const = $6F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
		SUBR	%tmp%,	%reg%
        ENDI

        ; Multiply by $70 (112)
        IF (_mul.const = $70)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $71 (113)
        IF (_mul.const = $71)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $72 (114)
        IF (_mul.const = $72)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $73 (115)
        IF (_mul.const = $73)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $74 (116)
        IF (_mul.const = $74)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $75 (117)
        IF (_mul.const = $75)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $76 (118)
        IF (_mul.const = $76)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $77 (119)
        IF (_mul.const = $77)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $78 (120)
        IF (_mul.const = $78)
_mul.done       QSET    -1
                SLL     %reg%,  2
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $79 (121)
        IF (_mul.const = $79)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $7A (122)
        IF (_mul.const = $7A)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $7B (123)
        IF (_mul.const = $7B)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  1
                ADDR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $7C (124)
        IF (_mul.const = $7C)
_mul.done       QSET    -1
                SLL     %reg%,  2
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $7D (125)
        IF (_mul.const = $7D)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SUBR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
		ADDR	%reg%,	%reg%
                ADDR    %tmp%,  %reg%
        ENDI

        ; Multiply by $7E (126)
        IF (_mul.const = $7E)
_mul.done       QSET    -1
                SLL     %reg%,  1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  2
                SUBR    %tmp%,  %reg%
        ENDI

        ; Multiply by $7F (127)
        IF (_mul.const = $7F)
_mul.done       QSET    -1
                MOVR    %reg%,  %tmp%
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  2
                SLL     %reg%,  1
                SUBR    %tmp%,  %reg%
        ENDI

        IF  (_mul.done = 0)
            ERR $("Invalid multiplication constant \'%const%\', must be between 0 and ", $#($7F), ".")
        ENDI

    LISTING "prev"
ENDM

;; ======================================================================== ;;
;;  EOF: pm:mac:lang:mult                                                   ;;
;; ======================================================================== ;;

	; IntyBASIC compiler v1.5.1 May/10/2025
	;FILE sp0256_capture.bas
	;[1] ' SP0256-AL2 Allophone Capture for IntelliVoice Builder
	SRCFILE "sp0256_capture.bas",1
	;[2] ' Plays 61 allophones sequentially (one per VOICE PLAY WAIT call).
	SRCFILE "sp0256_capture.bas",2
	;[3] ' Run with: jzintv -v1 --voicefiles=/tmp/ivc_ <rom> --rompath=~/jzintv/bin
	SRCFILE "sp0256_capture.bas",3
	;[4] ' Creates /tmp/ivc_0000.wav through /tmp/ivc_0060.wav (one per allophone).
	SRCFILE "sp0256_capture.bas",4
	;[5] '
	SRCFILE "sp0256_capture.bas",5
	;[6] ' Capture order matches ALLOPHONES array in allophonesDict.js:
	SRCFILE "sp0256_capture.bas",6
	;[7] '  0=PA1  1=PA2  2=PA3  3=PA4  4=PA5
	SRCFILE "sp0256_capture.bas",7
	;[8] '  5=OY   6=AY   7=EH   8=IH   9=AX  10=IY  11=EY  12=UW1 13=AO  14=AA
	SRCFILE "sp0256_capture.bas",8
	;[9] ' 15=YY2 16=AE1 17=UH  18=UW2 19=AW  20=OW
	SRCFILE "sp0256_capture.bas",9
	;[10] ' 21=KK3 22=PP  23=JH  24=NN1 25=TT2 26=RR1 27=MM  28=TT1 29=DH1 30=DD1
	SRCFILE "sp0256_capture.bas",10
	;[11] ' 31=HH1 32=BB1 33=TH  34=DD2 35=GG3 36=VV  37=GG1 38=ZZ  39=KK2 40=KK1
	SRCFILE "sp0256_capture.bas",11
	;[12] ' 41=NG1 42=FF  43=ZH  44=WH  45=WW  46=LL  47=YY1 48=CH  49=DH2 50=SS
	SRCFILE "sp0256_capture.bas",12
	;[13] ' 51=NN2 52=HH2 53=GG2 54=BB2
	SRCFILE "sp0256_capture.bas",13
	;[14] ' 55=ER1 56=ER2 57=OR2 58=AR  59=YR  60=EL
	SRCFILE "sp0256_capture.bas",14
	;[15] 
	SRCFILE "sp0256_capture.bas",15
	;[16]     VOICE INIT
	SRCFILE "sp0256_capture.bas",16
	CALL IV_HUSH
	;[17]     ' -- Pauses --
	SRCFILE "sp0256_capture.bas",17
	;[18]     VOICE PLAY WAIT a00
	SRCFILE "sp0256_capture.bas",18
	MVII #label_A00,R0
	CALL IV_PLAYW.1
	;[19]     VOICE PLAY WAIT a01
	SRCFILE "sp0256_capture.bas",19
	MVII #label_A01,R0
	CALL IV_PLAYW.1
	;[20]     VOICE PLAY WAIT a02
	SRCFILE "sp0256_capture.bas",20
	MVII #label_A02,R0
	CALL IV_PLAYW.1
	;[21]     VOICE PLAY WAIT a03
	SRCFILE "sp0256_capture.bas",21
	MVII #label_A03,R0
	CALL IV_PLAYW.1
	;[22]     VOICE PLAY WAIT a04
	SRCFILE "sp0256_capture.bas",22
	MVII #label_A04,R0
	CALL IV_PLAYW.1
	;[23]     ' -- Vowels --
	SRCFILE "sp0256_capture.bas",23
	;[24]     VOICE PLAY WAIT a05
	SRCFILE "sp0256_capture.bas",24
	MVII #label_A05,R0
	CALL IV_PLAYW.1
	;[25]     VOICE PLAY WAIT a06
	SRCFILE "sp0256_capture.bas",25
	MVII #label_A06,R0
	CALL IV_PLAYW.1
	;[26]     VOICE PLAY WAIT a07
	SRCFILE "sp0256_capture.bas",26
	MVII #label_A07,R0
	CALL IV_PLAYW.1
	;[27]     VOICE PLAY WAIT a08
	SRCFILE "sp0256_capture.bas",27
	MVII #label_A08,R0
	CALL IV_PLAYW.1
	;[28]     VOICE PLAY WAIT a09
	SRCFILE "sp0256_capture.bas",28
	MVII #label_A09,R0
	CALL IV_PLAYW.1
	;[29]     VOICE PLAY WAIT a10
	SRCFILE "sp0256_capture.bas",29
	MVII #label_A10,R0
	CALL IV_PLAYW.1
	;[30]     VOICE PLAY WAIT a11
	SRCFILE "sp0256_capture.bas",30
	MVII #label_A11,R0
	CALL IV_PLAYW.1
	;[31]     VOICE PLAY WAIT a12
	SRCFILE "sp0256_capture.bas",31
	MVII #label_A12,R0
	CALL IV_PLAYW.1
	;[32]     VOICE PLAY WAIT a13
	SRCFILE "sp0256_capture.bas",32
	MVII #label_A13,R0
	CALL IV_PLAYW.1
	;[33]     VOICE PLAY WAIT a14
	SRCFILE "sp0256_capture.bas",33
	MVII #label_A14,R0
	CALL IV_PLAYW.1
	;[34]     VOICE PLAY WAIT a15
	SRCFILE "sp0256_capture.bas",34
	MVII #label_A15,R0
	CALL IV_PLAYW.1
	;[35]     VOICE PLAY WAIT a16
	SRCFILE "sp0256_capture.bas",35
	MVII #label_A16,R0
	CALL IV_PLAYW.1
	;[36]     VOICE PLAY WAIT a17
	SRCFILE "sp0256_capture.bas",36
	MVII #label_A17,R0
	CALL IV_PLAYW.1
	;[37]     VOICE PLAY WAIT a18
	SRCFILE "sp0256_capture.bas",37
	MVII #label_A18,R0
	CALL IV_PLAYW.1
	;[38]     VOICE PLAY WAIT a19
	SRCFILE "sp0256_capture.bas",38
	MVII #label_A19,R0
	CALL IV_PLAYW.1
	;[39]     VOICE PLAY WAIT a20
	SRCFILE "sp0256_capture.bas",39
	MVII #label_A20,R0
	CALL IV_PLAYW.1
	;[40]     ' -- Consonants --
	SRCFILE "sp0256_capture.bas",40
	;[41]     VOICE PLAY WAIT a21
	SRCFILE "sp0256_capture.bas",41
	MVII #label_A21,R0
	CALL IV_PLAYW.1
	;[42]     VOICE PLAY WAIT a22
	SRCFILE "sp0256_capture.bas",42
	MVII #label_A22,R0
	CALL IV_PLAYW.1
	;[43]     VOICE PLAY WAIT a23
	SRCFILE "sp0256_capture.bas",43
	MVII #label_A23,R0
	CALL IV_PLAYW.1
	;[44]     VOICE PLAY WAIT a24
	SRCFILE "sp0256_capture.bas",44
	MVII #label_A24,R0
	CALL IV_PLAYW.1
	;[45]     VOICE PLAY WAIT a25
	SRCFILE "sp0256_capture.bas",45
	MVII #label_A25,R0
	CALL IV_PLAYW.1
	;[46]     VOICE PLAY WAIT a26
	SRCFILE "sp0256_capture.bas",46
	MVII #label_A26,R0
	CALL IV_PLAYW.1
	;[47]     VOICE PLAY WAIT a27
	SRCFILE "sp0256_capture.bas",47
	MVII #label_A27,R0
	CALL IV_PLAYW.1
	;[48]     VOICE PLAY WAIT a28
	SRCFILE "sp0256_capture.bas",48
	MVII #label_A28,R0
	CALL IV_PLAYW.1
	;[49]     VOICE PLAY WAIT a29
	SRCFILE "sp0256_capture.bas",49
	MVII #label_A29,R0
	CALL IV_PLAYW.1
	;[50]     VOICE PLAY WAIT a30
	SRCFILE "sp0256_capture.bas",50
	MVII #label_A30,R0
	CALL IV_PLAYW.1
	;[51]     VOICE PLAY WAIT a31
	SRCFILE "sp0256_capture.bas",51
	MVII #label_A31,R0
	CALL IV_PLAYW.1
	;[52]     VOICE PLAY WAIT a32
	SRCFILE "sp0256_capture.bas",52
	MVII #label_A32,R0
	CALL IV_PLAYW.1
	;[53]     VOICE PLAY WAIT a33
	SRCFILE "sp0256_capture.bas",53
	MVII #label_A33,R0
	CALL IV_PLAYW.1
	;[54]     VOICE PLAY WAIT a34
	SRCFILE "sp0256_capture.bas",54
	MVII #label_A34,R0
	CALL IV_PLAYW.1
	;[55]     VOICE PLAY WAIT a35
	SRCFILE "sp0256_capture.bas",55
	MVII #label_A35,R0
	CALL IV_PLAYW.1
	;[56]     VOICE PLAY WAIT a36
	SRCFILE "sp0256_capture.bas",56
	MVII #label_A36,R0
	CALL IV_PLAYW.1
	;[57]     VOICE PLAY WAIT a37
	SRCFILE "sp0256_capture.bas",57
	MVII #label_A37,R0
	CALL IV_PLAYW.1
	;[58]     VOICE PLAY WAIT a38
	SRCFILE "sp0256_capture.bas",58
	MVII #label_A38,R0
	CALL IV_PLAYW.1
	;[59]     VOICE PLAY WAIT a39
	SRCFILE "sp0256_capture.bas",59
	MVII #label_A39,R0
	CALL IV_PLAYW.1
	;[60]     VOICE PLAY WAIT a40
	SRCFILE "sp0256_capture.bas",60
	MVII #label_A40,R0
	CALL IV_PLAYW.1
	;[61]     VOICE PLAY WAIT a41
	SRCFILE "sp0256_capture.bas",61
	MVII #label_A41,R0
	CALL IV_PLAYW.1
	;[62]     VOICE PLAY WAIT a42
	SRCFILE "sp0256_capture.bas",62
	MVII #label_A42,R0
	CALL IV_PLAYW.1
	;[63]     VOICE PLAY WAIT a43
	SRCFILE "sp0256_capture.bas",63
	MVII #label_A43,R0
	CALL IV_PLAYW.1
	;[64]     VOICE PLAY WAIT a44
	SRCFILE "sp0256_capture.bas",64
	MVII #label_A44,R0
	CALL IV_PLAYW.1
	;[65]     VOICE PLAY WAIT a45
	SRCFILE "sp0256_capture.bas",65
	MVII #label_A45,R0
	CALL IV_PLAYW.1
	;[66]     VOICE PLAY WAIT a46
	SRCFILE "sp0256_capture.bas",66
	MVII #label_A46,R0
	CALL IV_PLAYW.1
	;[67]     VOICE PLAY WAIT a47
	SRCFILE "sp0256_capture.bas",67
	MVII #label_A47,R0
	CALL IV_PLAYW.1
	;[68]     VOICE PLAY WAIT a48
	SRCFILE "sp0256_capture.bas",68
	MVII #label_A48,R0
	CALL IV_PLAYW.1
	;[69]     VOICE PLAY WAIT a49
	SRCFILE "sp0256_capture.bas",69
	MVII #label_A49,R0
	CALL IV_PLAYW.1
	;[70]     VOICE PLAY WAIT a50
	SRCFILE "sp0256_capture.bas",70
	MVII #label_A50,R0
	CALL IV_PLAYW.1
	;[71]     VOICE PLAY WAIT a51
	SRCFILE "sp0256_capture.bas",71
	MVII #label_A51,R0
	CALL IV_PLAYW.1
	;[72]     VOICE PLAY WAIT a52
	SRCFILE "sp0256_capture.bas",72
	MVII #label_A52,R0
	CALL IV_PLAYW.1
	;[73]     VOICE PLAY WAIT a53
	SRCFILE "sp0256_capture.bas",73
	MVII #label_A53,R0
	CALL IV_PLAYW.1
	;[74]     VOICE PLAY WAIT a54
	SRCFILE "sp0256_capture.bas",74
	MVII #label_A54,R0
	CALL IV_PLAYW.1
	;[75]     ' -- Special --
	SRCFILE "sp0256_capture.bas",75
	;[76]     VOICE PLAY WAIT a55
	SRCFILE "sp0256_capture.bas",76
	MVII #label_A55,R0
	CALL IV_PLAYW.1
	;[77]     VOICE PLAY WAIT a56
	SRCFILE "sp0256_capture.bas",77
	MVII #label_A56,R0
	CALL IV_PLAYW.1
	;[78]     VOICE PLAY WAIT a57
	SRCFILE "sp0256_capture.bas",78
	MVII #label_A57,R0
	CALL IV_PLAYW.1
	;[79]     VOICE PLAY WAIT a58
	SRCFILE "sp0256_capture.bas",79
	MVII #label_A58,R0
	CALL IV_PLAYW.1
	;[80]     VOICE PLAY WAIT a59
	SRCFILE "sp0256_capture.bas",80
	MVII #label_A59,R0
	CALL IV_PLAYW.1
	;[81]     VOICE PLAY WAIT a60
	SRCFILE "sp0256_capture.bas",81
	MVII #label_A60,R0
	CALL IV_PLAYW.1
	;[82] done:   GOTO done
	SRCFILE "sp0256_capture.bas",82
	; DONE
label_DONE:		B label_DONE
	;[83] 
	SRCFILE "sp0256_capture.bas",83
	;[84] ' ---- Pause allophones ----
	SRCFILE "sp0256_capture.bas",84
	;[85] a00:    VOICE PA1,0   ' index 0  code PA1  ~10ms
	SRCFILE "sp0256_capture.bas",85
	; A00
label_A00:		DECLE 5
	DECLE 0
	;[86] a01:    VOICE PA2,0   ' index 1  code PA2  ~30ms
	SRCFILE "sp0256_capture.bas",86
	; A01
label_A01:		DECLE 4
	DECLE 0
	;[87] a02:    VOICE PA3,0   ' index 2  code PA3  ~50ms
	SRCFILE "sp0256_capture.bas",87
	; A02
label_A02:		DECLE 3
	DECLE 0
	;[88] a03:    VOICE PA4,0   ' index 3  code PA4  ~100ms
	SRCFILE "sp0256_capture.bas",88
	; A03
label_A03:		DECLE 2
	DECLE 0
	;[89] a04:    VOICE PA5,0   ' index 4  code PA5  ~200ms
	SRCFILE "sp0256_capture.bas",89
	; A04
label_A04:		DECLE 1
	DECLE 0
	;[90] ' ---- Vowels ----
	SRCFILE "sp0256_capture.bas",90
	;[91] a05:    VOICE OY,0    ' index 5  code OY   bOY
	SRCFILE "sp0256_capture.bas",91
	; A05
label_A05:		DECLE _OY
	DECLE 0
	;[92] a06:    VOICE AY,0    ' index 6  code AY   skY
	SRCFILE "sp0256_capture.bas",92
	; A06
label_A06:		DECLE _AY
	DECLE 0
	;[93] a07:    VOICE EH,0    ' index 7  code EH   End
	SRCFILE "sp0256_capture.bas",93
	; A07
label_A07:		DECLE _EH
	DECLE 0
	;[94] a08:    VOICE IH,0    ' index 12 code IH   sIt
	SRCFILE "sp0256_capture.bas",94
	; A08
label_A08:		DECLE _IH
	DECLE 0
	;[95] a09:    VOICE AX,0    ' index 15 code AX   succEss (schwa)
	SRCFILE "sp0256_capture.bas",95
	; A09
label_A09:		DECLE _AX
	DECLE 0
	;[96] a10:    VOICE IY,0    ' index 19 code IY   sEE
	SRCFILE "sp0256_capture.bas",96
	; A10
label_A10:		DECLE _IY
	DECLE 0
	;[97] a11:    VOICE EY,0    ' index 20 code EY   dAY
	SRCFILE "sp0256_capture.bas",97
	; A11
label_A11:		DECLE _EY
	DECLE 0
	;[98] a12:    VOICE UW1,0   ' index 22 code UW1  tO (short oo)
	SRCFILE "sp0256_capture.bas",98
	; A12
label_A12:		DECLE _UW1
	DECLE 0
	;[99] a13:    VOICE AO,0    ' index 23 code AO   hOt
	SRCFILE "sp0256_capture.bas",99
	; A13
label_A13:		DECLE _AO
	DECLE 0
	;[100] a14:    VOICE AA,0    ' index 24 code AA   fAther
	SRCFILE "sp0256_capture.bas",100
	; A14
label_A14:		DECLE _AA
	DECLE 0
	;[101] a15:    VOICE YY2,0   ' index 25 code YY2  Year
	SRCFILE "sp0256_capture.bas",101
	; A15
label_A15:		DECLE _YY2
	DECLE 0
	;[102] a16:    VOICE AE1,0   ' index 26 code AE   cAt  (IntyBASIC name: AE1)
	SRCFILE "sp0256_capture.bas",102
	; A16
label_A16:		DECLE _AE1
	DECLE 0
	;[103] a17:    VOICE UH,0    ' index 30 code UH   bOOk
	SRCFILE "sp0256_capture.bas",103
	; A17
label_A17:		DECLE _UH
	DECLE 0
	;[104] a18:    VOICE UW2,0   ' index 31 code UW2  fOOd (long oo)
	SRCFILE "sp0256_capture.bas",104
	; A18
label_A18:		DECLE _UW2
	DECLE 0
	;[105] a19:    VOICE AW,0    ' index 32 code AW   OUt
	SRCFILE "sp0256_capture.bas",105
	; A19
label_A19:		DECLE _AW
	DECLE 0
	;[106] a20:    VOICE OW,0    ' index 50 code OW   gO
	SRCFILE "sp0256_capture.bas",106
	; A20
label_A20:		DECLE _OW
	DECLE 0
	;[107] ' ---- Consonants ----
	SRCFILE "sp0256_capture.bas",107
	;[108] a21:    VOICE KK3,0   ' index 8  code KK3  COmb (hard k)
	SRCFILE "sp0256_capture.bas",108
	; A21
label_A21:		DECLE _KK3
	DECLE 0
	;[109] a22:    VOICE PP,0    ' index 9  code PP   Pow
	SRCFILE "sp0256_capture.bas",109
	; A22
label_A22:		DECLE _PP
	DECLE 0
	;[110] a23:    VOICE JH,0    ' index 10 code JH   doDGE
	SRCFILE "sp0256_capture.bas",110
	; A23
label_A23:		DECLE _JH
	DECLE 0
	;[111] a24:    VOICE NN1,0   ' index 11 code NN1  thiN (final n)
	SRCFILE "sp0256_capture.bas",111
	; A24
label_A24:		DECLE _NN1
	DECLE 0
	;[112] a25:    VOICE TT2,0   ' index 13 code TT2  Top (aspirated t)
	SRCFILE "sp0256_capture.bas",112
	; A25
label_A25:		DECLE _TT2
	DECLE 0
	;[113] a26:    VOICE RR1,0   ' index 14 code RR1  Rural
	SRCFILE "sp0256_capture.bas",113
	; A26
label_A26:		DECLE _RR1
	DECLE 0
	;[114] a27:    VOICE MM,0    ' index 16 code MM   Milk
	SRCFILE "sp0256_capture.bas",114
	; A27
label_A27:		DECLE _MM
	DECLE 0
	;[115] a28:    VOICE TT1,0   ' index 17 code TT1  parT (final t)
	SRCFILE "sp0256_capture.bas",115
	; A28
label_A28:		DECLE _TT1
	DECLE 0
	;[116] a29:    VOICE DH1,0   ' index 18 code DH1  THey (voiced th)
	SRCFILE "sp0256_capture.bas",116
	; A29
label_A29:		DECLE _DH1
	DECLE 0
	;[117] a30:    VOICE DD1,0   ' index 21 code DD1  coulD
	SRCFILE "sp0256_capture.bas",117
	; A30
label_A30:		DECLE _DD1
	DECLE 0
	;[118] a31:    VOICE HH1,0   ' index 27 code HH1  He
	SRCFILE "sp0256_capture.bas",118
	; A31
label_A31:		DECLE _HH1
	DECLE 0
	;[119] a32:    VOICE BB1,0   ' index 28 code BB1  Business
	SRCFILE "sp0256_capture.bas",119
	; A32
label_A32:		DECLE _BB1
	DECLE 0
	;[120] a33:    VOICE TH,0    ' index 29 code TH   THin (unvoiced th)
	SRCFILE "sp0256_capture.bas",120
	; A33
label_A33:		DECLE _TH
	DECLE 0
	;[121] a34:    VOICE DD2,0   ' index 33 code DD2  Do (initial d)
	SRCFILE "sp0256_capture.bas",121
	; A34
label_A34:		DECLE _DD2
	DECLE 0
	;[122] a35:    VOICE GG3,0   ' index 34 code GG3  wiG (final g)
	SRCFILE "sp0256_capture.bas",122
	; A35
label_A35:		DECLE _GG3
	DECLE 0
	;[123] a36:    VOICE VV,0    ' index 35 code VV   Very
	SRCFILE "sp0256_capture.bas",123
	; A36
label_A36:		DECLE _VV
	DECLE 0
	;[124] a37:    VOICE GG1,0   ' index 36 code GG1  Got (initial g)
	SRCFILE "sp0256_capture.bas",124
	; A37
label_A37:		DECLE _GG1
	DECLE 0
	;[125] a38:    VOICE ZZ,0    ' index 37 code ZZ   Zoo
	SRCFILE "sp0256_capture.bas",125
	; A38
label_A38:		DECLE _ZZ
	DECLE 0
	;[126] a39:    VOICE KK2,0   ' index 38 code KK2  Can't
	SRCFILE "sp0256_capture.bas",126
	; A39
label_A39:		DECLE _KK2
	DECLE 0
	;[127] a40:    VOICE KK1,0   ' index 39 code KK1  CooL
	SRCFILE "sp0256_capture.bas",127
	; A40
label_A40:		DECLE _KK1
	DECLE 0
	;[128] a41:    VOICE NG1,0   ' index 40 code NG   thiNG  (IntyBASIC name: NG1)
	SRCFILE "sp0256_capture.bas",128
	; A41
label_A41:		DECLE _NG1
	DECLE 0
	;[129] a42:    VOICE FF,0    ' index 41 code FF   Food
	SRCFILE "sp0256_capture.bas",129
	; A42
label_A42:		DECLE _FF
	DECLE 0
	;[130] a43:    VOICE ZH,0    ' index 42 code ZH   aZure
	SRCFILE "sp0256_capture.bas",130
	; A43
label_A43:		DECLE _ZH
	DECLE 0
	;[131] a44:    VOICE WH,0    ' index 43 code WH   WHig
	SRCFILE "sp0256_capture.bas",131
	; A44
label_A44:		DECLE _WH
	DECLE 0
	;[132] a45:    VOICE WW,0    ' index 44 code WW   Wool
	SRCFILE "sp0256_capture.bas",132
	; A45
label_A45:		DECLE _WW
	DECLE 0
	;[133] a46:    VOICE LL,0    ' index 45 code LL   Lake
	SRCFILE "sp0256_capture.bas",133
	; A46
label_A46:		DECLE _LL
	DECLE 0
	;[134] a47:    VOICE YY1,0   ' index 46 code YY1  Yes (initial y)
	SRCFILE "sp0256_capture.bas",134
	; A47
label_A47:		DECLE _YY1
	DECLE 0
	;[135] a48:    VOICE CH,0    ' index 47 code CH   CHurch
	SRCFILE "sp0256_capture.bas",135
	; A48
label_A48:		DECLE _CH
	DECLE 0
	;[136] a49:    VOICE DH2,0   ' index 51 code DH2  THe (light voiced th)
	SRCFILE "sp0256_capture.bas",136
	; A49
label_A49:		DECLE _DH2
	DECLE 0
	;[137] a50:    VOICE SS,0    ' index 52 code SS   veSt
	SRCFILE "sp0256_capture.bas",137
	; A50
label_A50:		DECLE _SS
	DECLE 0
	;[138] a51:    VOICE NN2,0   ' index 53 code NN2  No (initial n)
	SRCFILE "sp0256_capture.bas",138
	; A51
label_A51:		DECLE _NN2
	DECLE 0
	;[139] a52:    VOICE HH2,0   ' index 54 code HH2  He (variant)
	SRCFILE "sp0256_capture.bas",139
	; A52
label_A52:		DECLE _HH2
	DECLE 0
	;[140] a53:    VOICE GG2,0   ' index 58 code GG2  Got (variant)
	SRCFILE "sp0256_capture.bas",140
	; A53
label_A53:		DECLE _GG2
	DECLE 0
	;[141] a54:    VOICE BB2,0   ' index 60 code BB2  Business (variant)
	SRCFILE "sp0256_capture.bas",141
	; A54
label_A54:		DECLE _BB2
	DECLE 0
	;[142] ' ---- Special ----
	SRCFILE "sp0256_capture.bas",142
	;[143] a55:    VOICE ER1,0   ' index 48 code ER1  fEar (r-colored)
	SRCFILE "sp0256_capture.bas",143
	; A55
label_A55:		DECLE _ER1
	DECLE 0
	;[144] a56:    VOICE ER2,0   ' index 49 code ER2  bURn
	SRCFILE "sp0256_capture.bas",144
	; A56
label_A56:		DECLE _ER2
	DECLE 0
	;[145] a57:    VOICE OR2,0   ' index 55 code OR   stORe  (IntyBASIC name: OR2)
	SRCFILE "sp0256_capture.bas",145
	; A57
label_A57:		DECLE _OR2
	DECLE 0
	;[146] a58:    VOICE AR,0    ' index 56 code AR   alARm
	SRCFILE "sp0256_capture.bas",146
	; A58
label_A58:		DECLE _AR
	DECLE 0
	;[147] a59:    VOICE YR,0    ' index 57 code YR   EAR
	SRCFILE "sp0256_capture.bas",147
	; A59
label_A59:		DECLE _YR
	DECLE 0
	;[148] a60:    VOICE EL,0    ' index 59 code EL   saddLE (syllabic l)
	SRCFILE "sp0256_capture.bas",148
	; A60
label_A60:		DECLE _EL
	DECLE 0
	;ENDFILE
	;ENDFILE
	SRCFILE "",0
	;
	; Epilogue for IntyBASIC programs
	; by Oscar Toledo G.  http://nanochess.org/
	;
	; Revision: Jan/30/2014. Moved GRAM code below MOB updates.
	;                        Added comments.
	; Revision: Feb/26/2014. Optimized access to collision registers
	;                        per DZ-Jay suggestion. Added scrolling
	;                        routines with optimization per intvnut
	;                        suggestion. Added border/mask support.
	; Revision: Apr/02/2014. Added support to set MODE (color stack
	;                        or foreground/background), added support
	;                        for SCREEN statement.
	; Revision: Aug/19/2014. Solved bug in bottom scroll, moved an
	;                        extra unneeded line.
	; Revision: Aug/26/2014. Integrated music player and NTSC/PAL
	;                        detection.
	; Revision: Oct/24/2014. Adjust in some comments.
	; Revision: Nov/13/2014. Integrated Joseph Zbiciak's routines
	;                        for printing numbers.
	; Revision: Nov/17/2014. Redesigned MODE support to use a single
	;                        variable.
	; Revision: Nov/21/2014. Added Intellivoice support routines made
	;                        by Joseph Zbiciak.
	; Revision: Dec/11/2014. Optimized keypad decode routines.
	; Revision: Jan/25/2015. Added marker for insertion of ON FRAME GOSUB
	; Revision: Feb/17/2015. Allows to deactivate music player (PLAY NONE)
	; Revision: Apr/21/2015. Accelerates common case of keypad not pressed.
	;                        Added ECS ROM disable code.
	; Revision: Apr/22/2015. Added Joseph Zbiciak accelerated multiplication
	;                        routines.
	; Revision: Jun/04/2015. Optimized play_music (per GroovyBee suggestion)
	; Revision: Jul/25/2015. Added infinite loop at start to avoid crashing
	;                        with empty programs. Solved bug where _color
	;                        didn't started with white.
	; Revision: Aug/20/2015. Moved ECS mapper disable code so nothing gets
	;                        after it (GroovyBee 42K sample code)
	; Revision: Aug/21/2015. Added Joseph Zbiciak routines for JLP Flash
	;                        handling.
	; Revision: Aug/31/2015. Added CPYBLK2 for SCREEN fifth argument.
	; Revision: Sep/01/2015. Defined labels Q1 and Q2 as alias.
	; Revision: Jan/22/2016. Music player allows not to use noise channel
	;                        for drums. Allows setting music volume.
	; Revision: Jan/23/2016. Added jump inside of music (for MUSIC JUMP)
	; Revision: May/03/2016. Preserves current mode in bit 0 of _mode_select
	; Revision: Oct/21/2016. Added C7 in notes table, it was missing. (thanks
	;                        mmarrero)
	; Revision: Jan/09/2018. Initializes scroll offset registers (useful when
	;                        starting from $4800). Uses slightly less space.
	; Revision: Feb/05/2018. Added IV_HUSH.
	; Revision: Mar/01/2018. Added support for music tracker over ECS.
	; Revision: Sep/25/2018. Solved bug in mixer for ECS drums.
	; Revision: Oct/30/2018. Small optimization in music player.
	; Revision: Jan/09/2019. Solved bug where it would play always like
	;                        PLAY SIMPLE NO DRUMS.
	; Revision: May/18/2019. Solved bug where drums failed in ECS side.
	;

	;
	; Avoids empty programs to crash
	; 
stuck:	B stuck

	ROM.SelectDefaultSegment

	;
	; Copy screen helper for SCREEN wide statement
	;

CPYBLK2:	PROC
	MOVR R0,R3		; Offset
	MOVR R5,R2
	PULR R0
	PULR R1
	PULR R5
	PULR R4
	PSHR R2
	SUBR R1,R3

@@1:	PSHR R3
	MOVR R1,R3		; Init line copy
@@2:	MVI@ R4,R2		; Copy line
	MVO@ R2,R5
	DECR R3
	BNE @@2
	PULR R3		 ; Add offset to start in next line
	ADDR R3,R4
	SUBR R1,R5
	ADDI #20,R5
	DECR R0		 ; Count lines
	BNE @@1

	RETURN
	ENDP

	;
	; Copy screen helper for SCREEN statement
	;
CPYBLK:	PROC
	BEGIN
	MOVR R3,R4
	MOVR R2,R5

@@1:	MOVR R1,R3	      ; Init line copy
@@2:	MVI@ R4,R2	      ; Copy line
	MVO@ R2,R5
	DECR R3
	BNE @@2
	MVII #20,R3	     ; Add offset to start in next line
	SUBR R1,R3
	ADDR R3,R4
	ADDR R3,R5
	DECR R0		 ; Count lines
	BNE @@1
	RETURN
	ENDP

	;
	; Wait for interruption
	;
_wait:  PROC

    IF intybasic_keypad
	MVI $01FF,R0
	COMR R0
	ANDI #$FF,R0
	CMP _cnt1_p0,R0
	BNE @@2
	CMP _cnt1_p1,R0
	BNE @@2
	TSTR R0		; Accelerates common case of key not pressed
	MVII #_keypad_table+13,R4
	BEQ @@4
	MVII #_keypad_table,R4
    REPEAT 6
	CMP@ R4,R0
	BEQ @@4
	CMP@ R4,R0
	BEQ @@4
    ENDR
	INCR R4
@@4:    SUBI #_keypad_table+1,R4
	MVO R4,_cnt1_key

@@2:    MVI _cnt1_p1,R1
	MVO R1,_cnt1_p0
	MVO R0,_cnt1_p1

	MVI $01FE,R0
	COMR R0
	ANDI #$FF,R0
	CMP _cnt2_p0,R0
	BNE @@5
	CMP _cnt2_p1,R0
	BNE @@5
	TSTR R0		; Accelerates common case of key not pressed
	MVII #_keypad_table+13,R4
	BEQ @@7
	MVII #_keypad_table,R4
    REPEAT 6
	CMP@ R4,R0
	BEQ @@7
	CMP@ R4,R0
	BEQ @@7
    ENDR

	INCR R4
@@7:    SUBI #_keypad_table+1,R4
	MVO R4,_cnt2_key

@@5:    MVI _cnt2_p1,R1
	MVO R1,_cnt2_p0
	MVO R0,_cnt2_p1
    ENDI

	CLRR    R0
	MVO     R0,_int	 ; Clears waiting flag
@@1:	CMP     _int,  R0       ; Waits for change
	BEQ     @@1
	JR      R5	      ; Returns
	ENDP

	;
	; Keypad table
	;
_keypad_table:	  PROC
	DECLE $48,$81,$41,$21,$82,$42,$22,$84,$44,$24,$88,$28
	ENDP

_set_isr:	PROC
	MVI@ R5,R0
	MVO R0,ISRVEC
	SWAP R0
	MVO R0,ISRVEC+1
	JR R5
	ENDP

	;
	; Interruption routine
	;
_int_vector:     PROC

    IF intybasic_stack
	CMPI #$308,R6
	BNC @@vs
	MVO R0,$20	; Enables display
	MVI $21,R0	; Activates Color Stack mode
	CLRR R0
	MVO R0,$28
	MVO R0,$29
	MVO R0,$2A
	MVO R0,$2B
	MVII #@@vs1,R4
	MVII #$200,R5
	MVII #20,R1
@@vs2:	MVI@ R4,R0
	MVO@ R0,R5
	DECR R1
	BNE @@vs2
	RETURN

	; Stack Overflow message
@@vs1:	DECLE 0,0,0,$33*8+7,$54*8+7,$41*8+7,$43*8+7,$4B*8+7,$00*8+7
	DECLE $4F*8+7,$56*8+7,$45*8+7,$52*8+7,$46*8+7,$4C*8+7
	DECLE $4F*8+7,$57*8+7,0,0,0

@@vs:
    ENDI

	MVII #1,R1
	MVO R1,_int	; Indicates interrupt happened.

	MVI _mode_select,R0
	SARC R0,2
	BNE @@ds
	MVO R0,$20	; Enables display
@@ds:	BNC @@vi14
	MVO R0,$21	; Foreground/background mode
	BNOV @@vi0
	B @@vi15

@@vi14:	MVI $21,R0	; Color stack mode
	BNOV @@vi0
	CLRR R1
	MVI _color,R0
	MVO R0,$28
	SWAP R0
	MVO R0,$29
	SLR R0,2
	SLR R0,2
	MVO R0,$2A
	SWAP R0
	MVO R0,$2B
@@vi15:
	MVO R1,_mode_select
	MVII #7,R0
	MVO R0,_color	   ; Default color for PRINT "string"
@@vi0:

	BEGIN

	MVI _border_color,R0
	MVO     R0,     $2C     ; Border color
	MVI _border_mask,R0
	MVO     R0,     $32     ; Border mask
    IF intybasic_col
	;
	; Save collision registers for further use and clear them
	;
	MVII #$18,R4
	MVII #_col0,R5
	MVI@ R4,R0
	MVO@ R0,R5  ; _col0
	MVI@ R4,R0
	MVO@ R0,R5  ; _col1
	MVI@ R4,R0
	MVO@ R0,R5  ; _col2
	MVI@ R4,R0
	MVO@ R0,R5  ; _col3
	MVI@ R4,R0
	MVO@ R0,R5  ; _col4
	MVI@ R4,R0
	MVO@ R0,R5  ; _col5
	MVI@ R4,R0
	MVO@ R0,R5  ; _col6
	MVI@ R4,R0
	MVO@ R0,R5  ; _col7
    ENDI
	
    IF intybasic_scroll

	;
	; Scrolling things
	;
	MVI _scroll_x,R0
	MVO R0,$30
	MVI _scroll_y,R0
	MVO R0,$31
    ENDI

	;
	; Updates sprites (MOBs)
	;
	MVII #_mobs,R4
	CLRR R5		; X-coordinates
    REPEAT 8
	MVI@ R4,R0
	MVO@ R0,R5
	MVI@ R4,R0
	MVO@ R0,R5
	MVI@ R4,R0
	MVO@ R0,R5
    ENDR
    IF intybasic_col
	CLRR R0		; Erase collision bits (R5 = $18)
	MVO@ R0,R5
	MVO@ R0,R5
	MVO@ R0,R5
	MVO@ R0,R5
	MVO@ R0,R5
	MVO@ R0,R5
	MVO@ R0,R5
	MVO@ R0,R5
    ENDI

    IF intybasic_music
     	MVI _ntsc,R0
	RRC R0,1	 ; PAL?
	BNC @@vo97      ; Yes, always emit sound
	MVI _music_frame,R0
	INCR R0
	CMPI #6,R0
	BNE @@vo14
	CLRR R0
@@vo14:	MVO R0,_music_frame
	BEQ @@vo15
@@vo97:	CALL _emit_sound
    IF intybasic_music_ecs
	CALL _emit_sound_ecs
    ENDI
@@vo15:
    ENDI

	;
	; Detect GRAM definition
	;
	MVI _gram_bitmap,R4
	TSTR R4
	BEQ @@vi1
	MVI _gram_target,R1
	SLL R1,2
	SLL R1,1
	ADDI #$3800,R1
	MOVR R1,R5
	MVI _gram_total,R0
@@vi3:
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	DECR R0
	BNE @@vi3
	MVO R0,_gram_bitmap
@@vi1:
	MVI _gram2_bitmap,R4
	TSTR R4
	BEQ @@vii1
	MVI _gram2_target,R1
	SLL R1,2
	SLL R1,1
	ADDI #$3800,R1
	MOVR R1,R5
	MVI _gram2_total,R0
@@vii3:
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	MVI@    R4,     R1
	MVO@    R1,     R5
	SWAP    R1
	MVO@    R1,     R5
	DECR R0
	BNE @@vii3
	MVO R0,_gram2_bitmap
@@vii1:

    IF intybasic_scroll
	;
	; Frame scroll support
	;
	MVI _scroll_d,R0
	TSTR R0
	BEQ @@vi4
	CLRR R1
	MVO R1,_scroll_d
	DECR R0     ; Left
	BEQ @@vi5
	DECR R0     ; Right
	BEQ @@vi6
	DECR R0     ; Top
	BEQ @@vi7
	DECR R0     ; Bottom
	BEQ @@vi8
	B @@vi4

@@vi5:  MVII #$0200,R4
	MOVR R4,R5
	INCR R5
	MVII #12,R1
@@vi12: MVI@ R4,R2
	MVI@ R4,R3
	REPEAT 8
	MVO@ R2,R5
	MVI@ R4,R2
	MVO@ R3,R5
	MVI@ R4,R3
	ENDR
	MVO@ R2,R5
	MVI@ R4,R2
	MVO@ R3,R5
	MVO@ R2,R5
	INCR R4
	INCR R5
	DECR R1
	BNE @@vi12
	B @@vi4

@@vi6:  MVII #$0201,R4
	MVII #$0200,R5
	MVII #12,R1
@@vi11:
	REPEAT 19
	MVI@ R4,R0
	MVO@ R0,R5
	ENDR
	INCR R4
	INCR R5
	DECR R1
	BNE @@vi11
	B @@vi4
    
	;
	; Complex routine to be ahead of STIC display
	; Moves first the top 6 lines, saves intermediate line
	; Then moves the bottom 6 lines and restores intermediate line
	;
@@vi7:  MVII #$0264,R4
	MVII #5,R1
	MVII #_scroll_buffer,R5
	REPEAT 20
	MVI@ R4,R0
	MVO@ R0,R5
	ENDR
	SUBI #40,R4
	MOVR R4,R5
	ADDI #20,R5
@@vi10:
	REPEAT 20
	MVI@ R4,R0
	MVO@ R0,R5
	ENDR
	SUBI #40,R4
	SUBI #40,R5
	DECR R1
	BNE @@vi10
	MVII #$02C8,R4
	MVII #$02DC,R5
	MVII #5,R1
@@vi13:
	REPEAT 20
	MVI@ R4,R0
	MVO@ R0,R5
	ENDR
	SUBI #40,R4
	SUBI #40,R5
	DECR R1
	BNE @@vi13
	MVII #_scroll_buffer,R4
	REPEAT 20
	MVI@ R4,R0
	MVO@ R0,R5
	ENDR
	B @@vi4

@@vi8:  MVII #$0214,R4
	MVII #$0200,R5
	MVII #$DC/4,R1
@@vi9:  
	REPEAT 4
	MVI@ R4,R0
	MVO@ R0,R5
	ENDR
	DECR R1
	BNE @@vi9
	B @@vi4

@@vi4:
    ENDI

    IF intybasic_voice
	;
	; Intellivoice support
	;
	CALL IV_ISR
    ENDI

	;
	; Random number generator
	;
	CALL _next_random

    IF intybasic_music
	; Generate sound for next frame
       	MVI _ntsc,R0
	RRC R0,1	 ; PAL?
	BNC @@vo98      ; Yes, always generate sound
	MVI _music_frame,R0
	TSTR R0
	BEQ @@vo16
@@vo98: CALL _generate_music
@@vo16:
    ENDI

	; Increase frame number
	MVI _frame,R0
	INCR R0
	MVO R0,_frame

	; This mark is for ON FRAME GOSUB support

	RETURN
	ENDP

	;
	; Generates the next random number
	;
_next_random:	PROC

MACRO _ROR
	RRC R0,1
	MOVR R0,R2
	SLR R2,2
	SLR R2,2
	ANDI #$0800,R2
	SLR R2,2
	SLR R2,2
	ANDI #$007F,R0
	XORR R2,R0
ENDM
	MVI _rand,R0
	SETC
	_ROR
	XOR _frame,R0
	_ROR
	XOR _rand,R0
	_ROR
	XORI #9,R0
	MVO R0,_rand
	JR R5
	ENDP

    IF intybasic_music

	;
	; Music player, comes from my game Princess Quest for Intellivision
	; so it's a practical tracker used in a real game ;) and with enough
	; features.
	;

	; NTSC frequency for notes (based on 3.579545 mhz)
ntsc_note_table:    PROC
	; Silence - 0
	DECLE 0
	; Octave 2 - 1
	DECLE 1721,1621,1532,1434,1364,1286,1216,1141,1076,1017,956,909
	; Octave 3 - 13
	DECLE 854,805,761,717,678,639,605,571,538,508,480,453
	; Octave 4 - 25
	DECLE 427,404,380,360,339,321,302,285,270,254,240,226
	; Octave 5 - 37
	DECLE 214,202,191,180,170,160,151,143,135,127,120,113
	; Octave 6 - 49
	DECLE 107,101,95,90,85,80,76,71,67,64,60,57
	; Octave 7 - 61
	DECLE 54
	; Space for two notes more
	ENDP

	; PAL frequency for notes (based on 4 mhz)
pal_note_table:    PROC
	; Silence - 0
	DECLE 0
	; Octava 2 - 1
	DECLE 1923,1812,1712,1603,1524,1437,1359,1276,1202,1136,1068,1016
	; Octava 3 - 13
	DECLE 954,899,850,801,758,714,676,638,601,568,536,506
	; Octava 4 - 25
	DECLE 477,451,425,402,379,358,338,319,301,284,268,253
	; Octava 5 - 37
	DECLE 239,226,213,201,190,179,169,159,150,142,134,127
	; Octava 6 - 49
	DECLE 120,113,106,100,95,89,84,80,75,71,67,63
	; Octava 7 - 61
	DECLE 60
	; Space for two notes more
	ENDP
    ENDI

	;
	; Music tracker init
	;
_init_music:	PROC
    IF intybasic_music
	MVI _ntsc,R0
	RRC R0,1
	MVII #ntsc_note_table,R0
	BC @@0
	MVII #pal_note_table,R0
@@0:	MVO R0,_music_table
	MVII #$38,R0	; $B8 blocks controllers o.O!
	MVO R0,_music_mix
    IF intybasic_music_ecs
	MVO R0,_music2_mix
    ENDI
	CLRR R0
    ELSE
	JR R5		; Tracker disabled (no PLAY statement used)
    ENDI
	ENDP

    IF intybasic_music
	;
	; Start music
	; R0 = Pointer to music
	;
_play_music:	PROC
	MVII #1,R1
	MOVR R1,R3
	MOVR R0,R2
	BEQ @@1
	MVI@ R2,R3
	INCR R2
@@1:	MVO R2,_music_p
	MVO R2,_music_start
	SWAP R2
	MVO R2,_music_start+1
	MVO R3,_music_t
	MVO R1,_music_tc
	JR R5

	ENDP

	;
	; Generate music
	;
_generate_music:	PROC
	BEGIN
	MVI _music_mix,R0
	ANDI #$C0,R0
	XORI #$38,R0
	MVO R0,_music_mix
    IF intybasic_music_ecs
	MVI _music2_mix,R0
	ANDI #$C0,R0
	XORI #$38,R0
	MVO R0,_music2_mix
    ENDI
	CLRR R1			; Turn off volume for the three sound channels
	MVO R1,_music_vol1
	MVO R1,_music_vol2
	MVI _music_tc,R3
	MVO R1,_music_vol3
    IF intybasic_music_ecs
	MVO R1,_music2_vol1
	NOP
	MVO R1,_music2_vol2
	MVO R1,_music2_vol3
    ENDI
	DECR R3
	MVO R3,_music_tc
	BNE @@6
	; R3 is zero from here up to @@6
	MVI _music_p,R4
@@15:	TSTR R4		; Silence?
	BEQ @@43	; Keep quiet
@@41:	MVI@ R4,R0
	MVI@ R4,R1
	MVI _music_t,R2
	CMPI #$FA00,R1	; Volume?
	BNC @@42
    IF intybasic_music_volume
	BEQ @@40
    ENDI
	CMPI #$FF00,R1	; Speed?
	BEQ @@39
	CMPI #$FB00,R1	; Return?
	BEQ @@38
	CMPI #$FC00,R1	; Gosub?
	BEQ @@37
	CMPI #$FE00,R1	; The end?
	BEQ @@36       ; Keep quiet
;	CMPI #$FD00,R1	; Repeat?
;	BNE @@42
	MVI _music_start+1,R0
	SWAP R0
	ADD _music_start,R0
	MOVR R0,R4
	B @@15

    IF intybasic_music_volume
@@40:	
	MVO R0,_music_vol
	B @@41
    ENDI

@@39:	MVO R0,_music_t
	MOVR R0,R2
	B @@41

@@38:	MVI _music_gosub,R4
	B @@15

@@37:	MVO R4,_music_gosub
@@36:	MOVR R0,R4	; Jump, zero will make it quiet
	B @@15

@@43:	MVII #1,R0
	MVO R0,_music_tc
	B @@0
	
@@42: 	MVO R2,_music_tc    ; Restart note time
     	MVO R4,_music_p
     	
	MOVR R0,R2
	ANDI #$FF,R2
	CMPI #$3F,R2	; Sustain note?
	BEQ @@1
	MOVR R2,R4
	ANDI #$3F,R4
	MVO R4,_music_n1	; Note
	MVO R3,_music_s1	; Waveform
	ANDI #$C0,R2
	MVO R2,_music_i1	; Instrument
	
@@1:	SWAP R0
	ANDI #$FF,R0
	CMPI #$3F,R0	; Sustain note?
	BEQ @@2
	MOVR R0,R4
	ANDI #$3F,R4
	MVO R4,_music_n2	; Note
	MVO R3,_music_s2	; Waveform
	ANDI #$C0,R0
	MVO R0,_music_i2	; Instrument
	
@@2:	MOVR R1,R2
	ANDI #$FF,R2
	CMPI #$3F,R2	; Sustain note?
	BEQ @@3
	MOVR R2,R4
	ANDI #$3F,R4
	MVO R4,_music_n3	; Note
	MVO R3,_music_s3	; Waveform
	ANDI #$C0,R2
	MVO R2,_music_i3	; Instrument
	
@@3:	SWAP R1
	MVO R1,_music_n4
	MVO R3,_music_s4
	
    IF intybasic_music_ecs
	MVI _music_p,R4
	MVI@ R4,R0
	MVI@ R4,R1
	MVO R4,_music_p

	MOVR R0,R2
	ANDI #$FF,R2
	CMPI #$3F,R2	; Sustain note?
	BEQ @@33
	MOVR R2,R4
	ANDI #$3F,R4
	MVO R4,_music_n5	; Note
	MVO R3,_music_s5	; Waveform
	ANDI #$C0,R2
	MVO R2,_music_i5	; Instrument
	
@@33:	SWAP R0
	ANDI #$FF,R0
	CMPI #$3F,R0	; Sustain note?
	BEQ @@34
	MOVR R0,R4
	ANDI #$3F,R4
	MVO R4,_music_n6	; Note
	MVO R3,_music_s6	; Waveform
	ANDI #$C0,R0
	MVO R0,_music_i6	; Instrument
	
@@34:	MOVR R1,R2
	ANDI #$FF,R2
	CMPI #$3F,R2	; Sustain note?
	BEQ @@35
	MOVR R2,R4
	ANDI #$3F,R4
	MVO R4,_music_n7	; Note
	MVO R3,_music_s7	; Waveform
	ANDI #$C0,R2
	MVO R2,_music_i7	; Instrument
	
@@35:	MOVR R1,R2
	SWAP R2
	MVO R2,_music_n8
	MVO R3,_music_s8
	
    ENDI

	;
	; Construct main voice
	;
@@6:	MVI _music_n1,R3	; Read note
	TSTR R3		; There is note?
	BEQ @@7		; No, jump
	MVI _music_s1,R1
	MVI _music_i1,R2
	MOVR R1,R0
	CALL _note2freq
	MVO R3,_music_freq10	; Note in voice A
	SWAP R3
	MVO R3,_music_freq11
	MVO R1,_music_vol1
	; Increase time for instrument waveform
	INCR R0
	CMPI #$18,R0
	BNE @@20
	SUBI #$08,R0
@@20:	MVO R0,_music_s1

@@7:	MVI _music_n2,R3	; Read note
	TSTR R3		; There is note?
	BEQ @@8		; No, jump
	MVI _music_s2,R1
	MVI _music_i2,R2
	MOVR R1,R0
	CALL _note2freq
	MVO R3,_music_freq20	; Note in voice B
	SWAP R3
	MVO R3,_music_freq21
	MVO R1,_music_vol2
	; Increase time for instrument waveform
	INCR R0
	CMPI #$18,R0
	BNE @@21
	SUBI #$08,R0
@@21:	MVO R0,_music_s2

@@8:	MVI _music_n3,R3	; Read note
	TSTR R3		; There is note?
	BEQ @@9		; No, jump
	MVI _music_s3,R1
	MVI _music_i3,R2
	MOVR R1,R0
	CALL _note2freq
	MVO R3,_music_freq30	; Note in voice C
	SWAP R3
	MVO R3,_music_freq31
	MVO R1,_music_vol3
	; Increase time for instrument waveform
	INCR R0
	CMPI #$18,R0
	BNE @@22
	SUBI #$08,R0
@@22:	MVO R0,_music_s3

@@9:	MVI _music_n4,R0	; Read drum
	DECR R0		; There is drum?
	BMI @@4		; No, jump
	MVI _music_s4,R1
	       		; 1 - Strong
	BNE @@5
	CMPI #3,R1
	BGE @@12
@@10:	MVII #5,R0
	MVO R0,_music_noise
	CALL _activate_drum
	B @@12

@@5:	DECR R0		;2 - Short
	BNE @@11
	TSTR R1
	BNE @@12
	MVII #8,R0
	MVO R0,_music_noise
	CALL _activate_drum
	B @@12

@@11:	;DECR R0	; 3 - Rolling
	;BNE @@12
	CMPI #2,R1
	BLT @@10
	MVI _music_t,R0
	SLR R0,1
	CMPR R0,R1
	BLT @@12
	ADDI #2,R0
	CMPR R0,R1
	BLT @@10
	; Increase time for drum waveform
@@12:   INCR R1
	MVO R1,_music_s4

@@4:
    IF intybasic_music_ecs
	;
	; Construct main voice
	;
	MVI _music_n5,R3	; Read note
	TSTR R3		; There is note?
	BEQ @@23	; No, jump
	MVI _music_s5,R1
	MVI _music_i5,R2
	MOVR R1,R0
	CALL _note2freq
	MVO R3,_music2_freq10	; Note in voice A
	SWAP R3
	MVO R3,_music2_freq11
	MVO R1,_music2_vol1
	; Increase time for instrument waveform
	INCR R0
	CMPI #$18,R0
	BNE @@24
	SUBI #$08,R0
@@24:	MVO R0,_music_s5

@@23:	MVI _music_n6,R3	; Read note
	TSTR R3		; There is note?
	BEQ @@25		; No, jump
	MVI _music_s6,R1
	MVI _music_i6,R2
	MOVR R1,R0
	CALL _note2freq
	MVO R3,_music2_freq20	; Note in voice B
	SWAP R3
	MVO R3,_music2_freq21
	MVO R1,_music2_vol2
	; Increase time for instrument waveform
	INCR R0
	CMPI #$18,R0
	BNE @@26
	SUBI #$08,R0
@@26:	MVO R0,_music_s6

@@25:	MVI _music_n7,R3	; Read note
	TSTR R3		; There is note?
	BEQ @@27		; No, jump
	MVI _music_s7,R1
	MVI _music_i7,R2
	MOVR R1,R0
	CALL _note2freq
	MVO R3,_music2_freq30	; Note in voice C
	SWAP R3
	MVO R3,_music2_freq31
	MVO R1,_music2_vol3
	; Increase time for instrument waveform
	INCR R0
	CMPI #$18,R0
	BNE @@28
	SUBI #$08,R0
@@28:	MVO R0,_music_s7

@@27:	MVI _music_n8,R0	; Read drum
	DECR R0		; There is drum?
	BMI @@0		; No, jump
	MVI _music_s8,R1
	       		; 1 - Strong
	BNE @@29
	CMPI #3,R1
	BGE @@31
@@32:	MVII #5,R0
	MVO R0,_music2_noise
	CALL _activate_drum_ecs
	B @@31

@@29:	DECR R0		;2 - Short
	BNE @@30
	TSTR R1
	BNE @@31
	MVII #8,R0
	MVO R0,_music2_noise
	CALL _activate_drum_ecs
	B @@31

@@30:	;DECR R0	; 3 - Rolling
	;BNE @@31
	CMPI #2,R1
	BLT @@32
	MVI _music_t,R0
	SLR R0,1
	CMPR R0,R1
	BLT @@31
	ADDI #2,R0
	CMPR R0,R1
	BLT @@32
	; Increase time for drum waveform
@@31:	INCR R1
	MVO R1,_music_s8

    ENDI
@@0:	RETURN
	ENDP

	;
	; Translates note number to frequency
	; R3 = Note
	; R1 = Position in waveform for instrument
	; R2 = Instrument
	;
_note2freq:	PROC
	ADD _music_table,R3
	MVI@ R3,R3
	SWAP R2
	BEQ _piano_instrument
	RLC R2,1
	BNC _clarinet_instrument
	BPL _flute_instrument
;	BMI _bass_instrument
	ENDP

	;
	; Generates a bass
	;
_bass_instrument:	PROC
	SLL R3,2	; Lower 2 octaves
	ADDI #_bass_volume,R1
	MVI@ R1,R1	; Bass effect
    IF intybasic_music_volume
	B _global_volume
    ELSE
	JR R5
    ENDI
	ENDP

_bass_volume:	PROC
	DECLE 12,13,14,14,13,12,12,12
	DECLE 11,11,12,12,11,11,12,12
	DECLE 11,11,12,12,11,11,12,12
	ENDP

	;
	; Generates a piano
	; R3 = Frequency
	; R1 = Waveform position
	;
	; Output:
	; R3 = Frequency.
	; R1 = Volume.
	;
_piano_instrument:	PROC
	ADDI #_piano_volume,R1
	MVI@ R1,R1
    IF intybasic_music_volume
	B _global_volume
    ELSE
	JR R5
    ENDI
	ENDP

_piano_volume:	PROC
	DECLE 14,13,13,12,12,11,11,10
	DECLE 10,9,9,8,8,7,7,6
	DECLE 6,6,7,7,6,6,5,5
	ENDP

	;
	; Generate a clarinet
	; R3 = Frequency
	; R1 = Waveform position
	;
	; Output:
	; R3 = Frequency
	; R1 = Volume
	;
_clarinet_instrument:	PROC
	ADDI #_clarinet_vibrato,R1
	ADD@ R1,R3
	CLRC
	RRC R3,1	; Duplicates frequency
	ADCR R3
	ADDI #_clarinet_volume-_clarinet_vibrato,R1
	MVI@ R1,R1
    IF intybasic_music_volume
	B _global_volume
    ELSE
	JR R5
    ENDI
	ENDP

_clarinet_vibrato:	PROC
	DECLE 0,0,0,0
	DECLE -2,-4,-2,0
	DECLE 2,4,2,0
	DECLE -2,-4,-2,0
	DECLE 2,4,2,0
	DECLE -2,-4,-2,0
	ENDP

_clarinet_volume:	PROC
	DECLE 13,14,14,13,13,12,12,12
	DECLE 11,11,11,11,12,12,12,12
	DECLE 11,11,11,11,12,12,12,12
	ENDP

	;
	; Generates a flute
	; R3 = Frequency
	; R1 = Waveform position
	;
	; Output:
	; R3 = Frequency
	; R1 = Volume
	;
_flute_instrument:	PROC
	ADDI #_flute_vibrato,R1
	ADD@ R1,R3
	ADDI #_flute_volume-_flute_vibrato,R1
	MVI@ R1,R1
    IF intybasic_music_volume
	B _global_volume
    ELSE
	JR R5
    ENDI
	ENDP

_flute_vibrato:	PROC
	DECLE 0,0,0,0
	DECLE 0,1,2,1
	DECLE 0,1,2,1
	DECLE 0,1,2,1
	DECLE 0,1,2,1
	DECLE 0,1,2,1
	ENDP
		 
_flute_volume:	PROC
	DECLE 10,12,13,13,12,12,12,12
	DECLE 11,11,11,11,10,10,10,10
	DECLE 11,11,11,11,10,10,10,10
	ENDP

    IF intybasic_music_volume

_global_volume:	PROC
	MVI _music_vol,R2
	ANDI #$0F,R2
	SLL R2,2
	SLL R2,2
	ADDR R1,R2
	ADDI #@@table,R2
	MVI@ R2,R1
	JR R5

@@table:
	DECLE 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
	DECLE 0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1
	DECLE 0,0,0,0,1,1,1,1,1,1,1,2,2,2,2,2
	DECLE 0,0,0,1,1,1,1,1,2,2,2,2,2,3,3,3
	DECLE 0,0,1,1,1,1,2,2,2,2,3,3,3,4,4,4
	DECLE 0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5
	DECLE 0,0,1,1,2,2,2,3,3,4,4,4,5,5,6,6
	DECLE 0,1,1,1,2,2,3,3,4,4,5,5,6,6,7,7
	DECLE 0,1,1,2,2,3,3,4,4,5,5,6,6,7,8,8
	DECLE 0,1,1,2,2,3,4,4,5,5,6,7,7,8,8,9
	DECLE 0,1,1,2,3,3,4,5,5,6,7,7,8,9,9,10
	DECLE 0,1,2,2,3,4,4,5,6,7,7,8,9,10,10,11
	DECLE 0,1,2,2,3,4,5,6,6,7,8,9,10,10,11,12
	DECLE 0,1,2,3,4,4,5,6,7,8,9,10,10,11,12,13
	DECLE 0,1,2,3,4,5,6,7,8,8,9,10,11,12,13,14
	DECLE 0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15

	ENDP

    ENDI

    IF intybasic_music_ecs
	;
	; Emits sound for ECS
	;
_emit_sound_ecs:	PROC
	MOVR R5,R1
	MVI _music_mode,R2
	SARC R2,1
	BEQ @@6
	MVII #_music2_freq10,R4
	MVII #$00F0,R5
	B _emit_sound.0

@@6:	JR R1

	ENDP

    ENDI

	;
	; Emits sound
	;
_emit_sound:	PROC
	MOVR R5,R1
	MVI _music_mode,R2
	SARC R2,1
	BEQ @@6
	MVII #_music_freq10,R4
	MVII #$01F0,R5
@@0:
	MVI@ R4,R0
	MVO@ R0,R5	; $01F0 - Channel A Period (Low 8 bits of 12)
	MVI@ R4,R0
	MVO@ R0,R5	; $01F1 - Channel B Period (Low 8 bits of 12)
	DECR R2
	BEQ @@1
	MVI@ R4,R0	
	MVO@ R0,R5	; $01F2 - Channel C Period (Low 8 bits of 12)
	INCR R5		; Avoid $01F3 - Enveloped Period (Low 8 bits of 16)
	MVI@ R4,R0
	MVO@ R0,R5	; $01F4 - Channel A Period (High 4 bits of 12)
	MVI@ R4,R0
	MVO@ R0,R5	; $01F5 - Channel B Period (High 4 bits of 12)
	MVI@ R4,R0
	MVO@ R0,R5	; $01F6 - Channel C Period (High 4 bits of 12)
	INCR R5		; Avoid $01F7 - Envelope Period (High 8 bits of 16)
	BC @@2		; Jump if playing with drums
	ADDI #2,R4
	ADDI #3,R5
	B @@3

@@2:	MVI@ R4,R0
	MVO@ R0,R5	; $01F8 - Enable Noise/Tone (bits 3-5 Noise : 0-2 Tone)
	MVI@ R4,R0	
	MVO@ R0,R5	; $01F9 - Noise Period (5 bits)
	INCR R5		; Avoid $01FA - Envelope Type (4 bits)
@@3:	MVI@ R4,R0
	MVO@ R0,R5	; $01FB - Channel A Volume
	MVI@ R4,R0
	MVO@ R0,R5	; $01FC - Channel B Volume
	MVI@ R4,R0
	MVO@ R0,R5	; $01FD - Channel C Volume
	JR R1

@@1:	INCR R4		
	INCR R5		; Avoid $01F2 and $01F3
	INCR R5		; Cannot use ADDI
	MVI@ R4,R0
	MVO@ R0,R5	; $01F4 - Channel A Period (High 4 bits of 12)
	MVI@ R4,R0
	MVO@ R0,R5	; $01F5 - Channel B Period (High 4 bits of 12)
	INCR R4
	INCR R5		; Avoid $01F6 and $01F7
	INCR R5		; Cannot use ADDI
	BC @@4		; Jump if playing with drums
	ADDI #2,R4
	ADDI #3,R5
	B @@5

@@4:	MVI@ R4,R0
	MVO@ R0,R5	; $01F8 - Enable Noise/Tone (bits 3-5 Noise : 0-2 Tone)
	MVI@ R4,R0
	MVO@ R0,R5	; $01F9 - Noise Period (5 bits)
	INCR R5		; Avoid $01FA - Envelope Type (4 bits)
@@5:	MVI@ R4,R0
	MVO@ R0,R5	; $01FB - Channel A Volume
	MVI@ R4,R0
	MVO@ R0,R5	; $01FC - Channel B Volume
@@6:	JR R1
	ENDP

	;
	; Activates drum
	;
_activate_drum:	PROC
    IF intybasic_music_volume
	BEGIN
    ENDI
	MVI _music_mode,R2
	SARC R2,1	; PLAY NO DRUMS?
	BNC @@0		; Yes, jump
	MVI _music_vol1,R0
	TSTR R0
	BNE @@1
	MVII #11,R1
    IF intybasic_music_volume
	CALL _global_volume
    ENDI
	MVO R1,_music_vol1
	MVI _music_mix,R0
	ANDI #$F6,R0
	XORI #$01,R0
	MVO R0,_music_mix
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

@@1:    MVI _music_vol2,R0
	TSTR R0
	BNE @@2
	MVII #11,R1
    IF intybasic_music_volume
	CALL _global_volume
    ENDI
	MVO R1,_music_vol2
	MVI _music_mix,R0
	ANDI #$ED,R0
	XORI #$02,R0
	MVO R0,_music_mix
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

@@2:    DECR R2		; PLAY SIMPLE?
	BEQ @@3		; Yes, jump
	MVI _music_vol3,R0
	TSTR R0
	BNE @@3
	MVII #11,R1
    IF intybasic_music_volume
	CALL _global_volume
    ENDI
	MVO R1,_music_vol3
	MVI _music_mix,R0
	ANDI #$DB,R0
	XORI #$04,R0
	MVO R0,_music_mix
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

@@3:    MVI _music_mix,R0
	ANDI #$EF,R0
	MVO R0,_music_mix
@@0:	
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

	ENDP

    IF intybasic_music_ecs
	;
	; Activates drum
	;
_activate_drum_ecs:	PROC
    IF intybasic_music_volume
	BEGIN
    ENDI
	MVI _music_mode,R2
	SARC R2,1	; PLAY NO DRUMS?
	BNC @@0		; Yes, jump
	MVI _music2_vol1,R0
	TSTR R0
	BNE @@1
	MVII #11,R1
    IF intybasic_music_volume
	CALL _global_volume
    ENDI
	MVO R1,_music2_vol1
	MVI _music2_mix,R0
	ANDI #$F6,R0
	XORI #$01,R0
	MVO R0,_music2_mix
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

@@1:    MVI _music2_vol2,R0
	TSTR R0
	BNE @@2
	MVII #11,R1
    IF intybasic_music_volume
	CALL _global_volume
    ENDI
	MVO R1,_music2_vol2
	MVI _music2_mix,R0
	ANDI #$ED,R0
	XORI #$02,R0
	MVO R0,_music2_mix
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

@@2:    DECR R2		; PLAY SIMPLE?
	BEQ @@3		; Yes, jump
	MVI _music2_vol3,R0
	TSTR R0
	BNE @@3
	MVII #11,R1
    IF intybasic_music_volume
	CALL _global_volume
    ENDI
	MVO R1,_music2_vol3
	MVI _music2_mix,R0
	ANDI #$DB,R0
	XORI #$04,R0
	MVO R0,_music2_mix
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

@@3:    MVI _music2_mix,R0
	ANDI #$EF,R0
	MVO R0,_music2_mix
@@0:	
    IF intybasic_music_volume
	RETURN
    ELSE
	JR R5
    ENDI

	ENDP

    ENDI

    ENDI
    
    IF intybasic_numbers

;;==========================================================================;;
;; IntyBASIC SDK Library: print-num.asm                                     ;;
;;--------------------------------------------------------------------------;;
;;  This library is based on a BCD display algorithm originally proposed by ;;
;;  Mark Ball (GroovyBee), with additional optimizations suggested by Joe   ;;
;;  Zbiciak (intvnut) in the AtariAge Intellivision Programming forum.  It  ;;
;;  is a novel implementation of Joe's PRNUM16() routine, intended to       ;;
;;  execute much faster.                                                    ;;
;;                                                                          ;;
;;  The algorithm was then further optimized and adapted for the            ;;
;;  P-Machinery framework by unrolling the loops, etc.  It was then         ;;
;;  modified once again to support the original PRNUM16() functionality and ;;
;;  invocation interface, and serve as a drop-in replacement in the         ;;
;;  IntyBASIC run-time framework.                                           ;;
;;--------------------------------------------------------------------------;;
;;      The file is placed into the public domain by its author.            ;;
;;      All copyrights are hereby relinquished on the routines and data in  ;;
;;      this file.  -- James Pujals (DZ-Jay), 2024                          ;;
;;==========================================================================;;

;; ======================================================================== ;;
;;  PRINT_NUM16_PAD                                                         ;;
;;  Procedure to print an unsigned 16-bit value as a decimal number, left-  ;;
;;  or right-justified, with optional pre-padding.  It also supports        ;;
;;  variable field widths.                                                  ;;
;;                                                                          ;;
;;  DESCRIPTION:                                                            ;;
;;      Depending on the entry point invoked, the number is printed in      ;;
;;      either left- or right-justified format.  Right-justified numbers    ;;
;;      are padded with leading zeros or blanks to fit the given width.     ;;
;;      Left-justified numbers are not padded, and the field width argument ;;
;;      is ignored.                                                         ;;
;;                                                                          ;;
;;      Examples:                                                           ;;
;;          Routine               Value      Field       Output             ;;
;;          ------------------  ---------  ----------  ----------           ;;
;;          PRINT_NUM16_PAD.l      123        N/A       "123"               ;;
;;          PRINT_NUM16_PAD.b      123         3        "123"               ;;
;;          PRINT_NUM16_PAD.b      123         4        " 123"              ;;
;;          PRINT_NUM16_PAD.b      123         7        "    123"           ;;
;;          PRINT_NUM16_PAD.z      123         3        "123"               ;;
;;          PRINT_NUM16_PAD.z      123         4        "0123"              ;;
;;          PRINT_NUM16_PAD.z      123         7        "0000123"           ;;
;;                                                                          ;;
;;      After doing some housekeeping preparations for the variant invoked, ;;
;;      the routine then identifies the lowest power-of-10 that is higher   ;;
;;      than the input number.  It then proceeds to divide the number by    ;;
;;      decreasing powers-of-ten to derive each digit to print, in          ;;
;;      succession.  All divisions are made by repeated subtraction.        ;;
;;                                                                          ;;
;;      The routine does not access any RAM (other than the stack), or      ;;
;;      depend on any external resources, so it is fully re-entrant.        ;;
;;                                                                          ;;
;;  CODESIZE:                                                               ;;
;;      132 words, including jump tables and unrolled loops.                ;;
;;                                                                          ;;
;; ------------------------------------------------------------------------ ;;
;;                                                                          ;;
;;  There are three entry points to this procedure:                         ;;
;;      PRINT_NUM16_PAD.l       Prints a left-justified 16-bit number.      ;;
;;                                                                          ;;
;;      PRINT_NUM16_PAD.z       Prints a right-justified 16-bit number,     ;;
;;                              padded with zeros.                          ;;
;;                                                                          ;;
;;      PRINT_NUM16_PAD.b       Prints a right-justified 16-bit number,     ;;
;;                              padded with blanks.                         ;;
;;                                                                          ;;
;;  NOTE:   The field width must be equal to, or wider than, the decimal    ;;
;;          number width, or else the output will be corrupted.  Also, the  ;;
;;          format word must be a valid BACKTAB color value.  If the format ;;
;;          includes any other bits, it may corrupt the output.             ;;
;;                                                                          ;;
;;          The routine also supports field widths larger than 5 positions, ;;
;;          padding them with zeros or blanks, as necessary.  However, no   ;;
;;          bounds-checking is performed, so it is possible to attemp to    ;;
;;          print beyond the BACKTAB bounds.                                ;;
;;                                                                          ;;
;;  INPUT for PRINT_NUM16_PAD (all variations)                              ;;
;;      R0      16-bit numeric value.                                       ;;
;;      R2      Print field width.                                          ;;
;;      R3      BACKTAB format word for prefix char.                        ;;
;;      R4      Pointer to BACKTAB destination.                             ;;
;;      R5      Pointer to invocation record, followed by return address.   ;;
;;                                                                          ;;
;;  OUTPUT                                                                  ;;
;;      R0      Trashed.                                                    ;;
;;      R1      Trashed.                                                    ;;
;;      R2      Trashed.                                                    ;;
;;      R3      Trashed (color).                                            ;;
;;      R4      Trashed  (1 word beyond end of number string in BACKTAB).   ;;
;; ======================================================================== ;;
PRNUM16		PROC
.max_width      QSET    5
.chr_clrmask    QSET    $FE07
.chr_offset     QSET    (1 SHL 3)
.digit_base     QSET    ('0' - ' ')
.lzero          QSET    (((.digit_base -  0) SHL 3) AND $FFFF)
.lzero_even     QSET    (((.digit_base -  1) SHL 3) AND $FFFF)
.lzero_odd      QSET    (((.digit_base + 10) SHL 3) AND $FFFF)

                ; --------------------------------------
                ; Left-Justified (No Padding)
                ; --------------------------------------
@@l:            BEGIN

                MVII    #.chr_offset,           R5      ; Initialize character advancement term

                ; --------------------------------------
                ; Find highest power of 10 to determine
                ; entry point to digits printing loop.
                ;   (The loop is unrolled for speed.)
                ;
                ;   pow = 4;
                ;   do {
                ;       if (val >= (10 ** pow--)) {
                ;           break;
                ;       }
                ;   } while (pow >= 0);
                ; --------------------------------------
@@__l_10_4:     CMPI    #10000, R0                      ;   if (val >= (10 ** pow--))
                BC      @@__pow4                        ;       break;

@@__l_10_3:     CMPI    #1000,  R0                      ;   if (val >= (10 ** pow--))
                BC      @@__fix_10_3                    ;       break;

@@__l_10_2:     CMPI    #100,   R0                      ;   if (val >= (10 ** pow--))
                BC      @@__pow2                        ;       break;

@@__l_10_1:     CMPI    #10,    R0                      ;   if (val >= (10 ** pow--))
                BC      @@__fix_10_1                    ;       break;

@@__l_10_0:     TSTR    R0                              ;   if (val != 0)
                BNZE    @@__pow0                        ;       break;
                B       @@__zero

                ; --------------------------------------
                ; Right-Justified: Zero-Padded
                ; --------------------------------------
@@z:            XORI    #.lzero,R3                      ; Initialize prefix to character "0" (zero).

                ; --------------------------------------
                ; Right-Justified: Blank-Padded
                ; --------------------------------------
@@b:            MOVR    R2,     R1                      ; \
                SUBI    #5,     R1                      ;  > Is field size greater than max width?
                BLE     @@__padding                     ; /     No:  Just pad field based on magnitude.
                                                        ;       Yes: Pad field until we reach max width.
                ; --------------------------------------
                ; Force padding until we reach max width
                ;   while (overflow > 0) {
                ;       print_at(prefix, pos++);
                ;       overflow--;
                ;   }
                ; --------------------------------------
                SUBR    R1,     R2                      ; R1 = overflow; R2 = max width
@@__pad_ovr:    MVO@    R3,     R4                      ; Print padding character ...
                DECR    R1                              ; \_ Is overflow done?
                BNZE    @@__pad_ovr                     ; /     No:  Continue padding.

@@__padding:    BEGIN

                MOVR    R3,     R1
                ANDI    #.chr_clrmask,          R3      ; Clear out prefix character
                MVII    #.chr_offset,           R5      ; Initialize character advancement term

                ADDI    #(@@__switch - 1),      R2      ; \_ Jump to entry point based on field width
                MVI@    R2,     PC                      ; /

@@__switch:     DECLE   @@__p_10_0  ; Width = 1: 10^0
                DECLE   @@__p_10_1  ; Width = 2: 10^1
                DECLE   @@__p_10_2  ; Width = 3: 10^2
                DECLE   @@__p_10_3  ; Width = 4: 10^3
                DECLE   @@__p_10_4  ; Width = 5: 10^4

                ; --------------------------------------
                ; Pad the field with prefix character
                ;   (The loop is unrolled for speed.)
                ;
                ;   pow = 4;  // 10^0..10^4
                ;   do {
                ;       if (val >= (10 ** pow--)) {
                ;           break;
                ;       }
                ;       print_at(prefix, pos++);
                ;   } while (pow >= 0);
                ; --------------------------------------
@@__p_10_4:     CMPI    #10000, R0                      ;   if (val >= (10 ** pow--))
                BC      @@__pow4                        ;       break;
                MVO@    R1,     R4                      ;   print_at(prefix, pos++);

@@__p_10_3:     CMPI    #1000,  R0                      ;   if (val >= (10 ** pow--))
                BC      @@__fix_10_3                    ;       break;
                MVO@    R1,     R4                      ;   print_at(prefix, pos++);

@@__p_10_2:     CMPI    #100,   R0                      ;   if (val >= (10 ** pow--))
                BC      @@__pow2                        ;       break;
                MVO@    R1,     R4                      ;   print_at(prefix, pos++);

@@__p_10_1:     CMPI    #10,    R0                      ;   if (val >= (10 ** pow--))
                BC      @@__fix_10_1                    ;       break;
                MVO@    R1,     R4                      ;   print_at(prefix, pos++);

@@__p_10_0:     TSTR    R0                              ;   if (val != 0)
                BNZE    @@__pow0                        ;       break;

                ; --------------------------------------
                ; Special case for when value is zero
                ; --------------------------------------
@@__zero:       XORI    #.lzero,R3                      ; Prepare formatted zero
                MVO@    R3,     R4                      ;       print_at(zero, pos++);
                RETURN

                ; --------------------------------------
                ; Adjust value of odd powers, for direct
                ; entry into the PRINT_NUM16() routine.
                ; --------------------------------------
@@__fix_10_1:   SUBI    #100,   R0                      ; \_ Adjust value to jump into 10^1 block
                B       @@__pow1                        ; /

@@__fix_10_3:   SUBI    #10000, R0                      ; \_ Adjust value to jump into 10^3 block
                B       @@__pow3                        ; /

                ; --------------------------------------
                ; Print decimal digits
                ; --------------------------------------

                ; 10^4: 10,000
                ; --------------------------------------
@@__pow4:       MVII    #.lzero_even,           R1      ; Prep GROM character.
                XORR    R3,     R1                      ; Mix in the STIC colors.
                MVII    #10000, R2

@@__d_10_4:     ADDR    R5,     R1
                SUBR    R2,     R0
                BC      @@__d_10_4
                MVO@    R1,     R4                      ; Output to BACKTAB screen buffer.

                ; 10^3: 1,000
                ; --------------------------------------
@@__pow3:       MVII    #.lzero_odd,            R1      ; Prep GROM character.
                XORR    R3,     R1                      ; Mix in the STIC colors.
                MVII    #1000,  R2

@@__d_10_3:     SUBR    R5,     R1
                ADDR    R2,     R0
                BNC     @@__d_10_3
                MVO@    R1,     R4                      ; Output to BACKTAB screen buffer.

                ; 10^2: 100
                ; --------------------------------------
@@__pow2:       MVII    #.lzero_even,           R1      ; Prep GROM character.
                XORR    R3,     R1                      ; Mix in the STIC colors.
                MVII    #100,   R2

@@__d_10_2:     ADDR    R5,     R1
                SUBR    R2,     R0
                BC      @@__d_10_2
                MVO@    R1,     R4                      ; Output to BACKTAB screen buffer.

                ; 10^1: 10
                ; --------------------------------------
@@__pow1:       MVII    #.lzero_odd,            R1      ; Prep GROM character.
                XORR    R3,     R1                      ; Mix in the STIC colors.
                MVII    #10,    R2

@@__d_10_1:     SUBR    R5,     R1
                ADDR    R2,     R0
                BNC     @@__d_10_1
                MVO@    R1,     R4                      ; Output to BACKTAB screen buffer.

                ; 10^0: 1
                ; --------------------------------------
@@__pow0:       ADDI    #.digit_base,           R0      ; Prep GROM character.
                SLL     R0,     2                       ; \
                SLL     R0,     1                       ;  > chr = ((chr << 3) ^ format);
                XORR    R3,     R0                      ; /
                MVO@    R0,     R4                      ; Output to BACKTAB screen buffer.

                ; All done!
                ; --------------------------------------
                RETURN

@@____size:     EQU     ($ - PRNUM16)
                ENDP

;; ======================================================================== ;;
;;  EOF: romseg-bs.mac                                                      ;;
;; ======================================================================== ;;

    ENDI

    IF intybasic_voice
;;==========================================================================;;
;;  SP0256-AL2 Allophones						   ;;
;;									  ;;
;;  This file contains the allophone set that was obtained from an	  ;;
;;  SP0256-AL2.  It is being provided for your convenience.		 ;;
;;									  ;;
;;  The directory "al2" contains a series of assembly files, each one       ;;
;;  containing a single allophone.  This series of files may be useful in   ;;
;;  situations where space is at a premium.				 ;;
;;									  ;;
;;  Consult the Archer SP0256-AL2 documentation (under doc/programming)     ;;
;;  for more information about SP0256-AL2's allophone library.	      ;;
;;									  ;;
;; ------------------------------------------------------------------------ ;;
;;									  ;;
;;  Copyright information:						  ;;
;;									  ;;
;;  The allophone data below was extracted from the SP0256-AL2 ROM image.   ;;
;;  The SP0256-AL2 allophones are NOT in the public domain, nor are they    ;;
;;  placed under the GNU General Public License.  This program is	   ;;
;;  distributed in the hope that it will be useful, but WITHOUT ANY	 ;;
;;  WARRANTY; without even the implied warranty of MERCHANTABILITY or       ;;
;;  FITNESS FOR A PARTICULAR PURPOSE.				       ;;
;;									  ;;
;;  Microchip, Inc. retains the copyright to the data and algorithms	;;
;;  contained in the SP0256-AL2.  This speech data is distributed with      ;;
;;  explicit permission from Microchip, Inc.  All such redistributions      ;;
;;  must retain this notice of copyright.				   ;;
;;									  ;;
;;  No copyright claims are made on this data by the author(s) of SDK1600.  ;;
;;  Please see http://spatula-city.org/~im14u2c/sp0256-al2/ for details.    ;;
;;									  ;;
;;==========================================================================;;

;; ------------------------------------------------------------------------ ;;
_AA:
    DECLE   _AA.end - _AA - 1
    DECLE   $0318, $014C, $016F, $02CE, $03AF, $015F, $01B1, $008E
    DECLE   $0088, $0392, $01EA, $024B, $03AA, $039B, $000F, $0000
_AA.end:  ; 16 decles
;; ------------------------------------------------------------------------ ;;
_AE1:
    DECLE   _AE1.end - _AE1 - 1
    DECLE   $0118, $038E, $016E, $01FC, $0149, $0043, $026F, $036E
    DECLE   $01CC, $0005, $0000
_AE1.end:  ; 11 decles
;; ------------------------------------------------------------------------ ;;
_AO:
    DECLE   _AO.end - _AO - 1
    DECLE   $0018, $010E, $016F, $0225, $00C6, $02C4, $030F, $0160
    DECLE   $024B, $0005, $0000
_AO.end:  ; 11 decles
;; ------------------------------------------------------------------------ ;;
_AR:
    DECLE   _AR.end - _AR - 1
    DECLE   $0218, $010C, $016E, $001E, $000B, $0091, $032F, $00DE
    DECLE   $018B, $0095, $0003, $0238, $0027, $01E0, $03E8, $0090
    DECLE   $0003, $01C7, $0020, $03DE, $0100, $0190, $01CA, $02AB
    DECLE   $00B7, $004A, $0386, $0100, $0144, $02B6, $0024, $0320
    DECLE   $0011, $0041, $01DF, $0316, $014C, $016E, $001E, $00C4
    DECLE   $02B2, $031E, $0264, $02AA, $019D, $01BE, $000B, $00F0
    DECLE   $006A, $01CE, $00D6, $015B, $03B5, $03E4, $0000, $0380
    DECLE   $0007, $0312, $03E8, $030C, $016D, $02EE, $0085, $03C2
    DECLE   $03EC, $0283, $024A, $0005, $0000
_AR.end:  ; 69 decles
;; ------------------------------------------------------------------------ ;;
_AW:
    DECLE   _AW.end - _AW - 1
    DECLE   $0010, $01CE, $016E, $02BE, $0375, $034F, $0220, $0290
    DECLE   $008A, $026D, $013F, $01D5, $0316, $029F, $02E2, $018A
    DECLE   $0170, $0035, $00BD, $0000, $0000
_AW.end:  ; 21 decles
;; ------------------------------------------------------------------------ ;;
_AX:
    DECLE   _AX.end - _AX - 1
    DECLE   $0218, $02CD, $016F, $02F5, $0386, $00C2, $00CD, $0094
    DECLE   $010C, $0005, $0000
_AX.end:  ; 11 decles
;; ------------------------------------------------------------------------ ;;
_AY:
    DECLE   _AY.end - _AY - 1
    DECLE   $0110, $038C, $016E, $03B7, $03B3, $02AF, $0221, $009E
    DECLE   $01AA, $01B3, $00BF, $02E7, $025B, $0354, $00DA, $017F
    DECLE   $018A, $03F3, $00AF, $02D5, $0356, $027F, $017A, $01FB
    DECLE   $011E, $01B9, $03E5, $029F, $025A, $0076, $0148, $0124
    DECLE   $003D, $0000
_AY.end:  ; 34 decles
;; ------------------------------------------------------------------------ ;;
_BB1:
    DECLE   _BB1.end - _BB1 - 1
    DECLE   $0318, $004C, $016C, $00FB, $00C7, $0144, $002E, $030C
    DECLE   $010E, $018C, $01DC, $00AB, $00C9, $0268, $01F7, $021D
    DECLE   $01B3, $0098, $0000
_BB1.end:  ; 19 decles
;; ------------------------------------------------------------------------ ;;
_BB2:
    DECLE   _BB2.end - _BB2 - 1
    DECLE   $00F4, $0046, $0062, $0200, $0221, $03E4, $0087, $016F
    DECLE   $02A6, $02B7, $0212, $0326, $0368, $01BF, $0338, $0196
    DECLE   $0002
_BB2.end:  ; 17 decles
;; ------------------------------------------------------------------------ ;;
_CH:
    DECLE   _CH.end - _CH - 1
    DECLE   $00F5, $0146, $0052, $0000, $032A, $0049, $0032, $02F2
    DECLE   $02A5, $0000, $026D, $0119, $0124, $00F6, $0000
_CH.end:  ; 15 decles
;; ------------------------------------------------------------------------ ;;
_DD1:
    DECLE   _DD1.end - _DD1 - 1
    DECLE   $0318, $034C, $016E, $0397, $01B9, $0020, $02B1, $008E
    DECLE   $0349, $0291, $01D8, $0072, $0000
_DD1.end:  ; 13 decles
;; ------------------------------------------------------------------------ ;;
_DD2:
    DECLE   _DD2.end - _DD2 - 1
    DECLE   $00F4, $00C6, $00F2, $0000, $0129, $00A6, $0246, $01F3
    DECLE   $02C6, $02B7, $028E, $0064, $0362, $01CF, $0379, $01D5
    DECLE   $0002
_DD2.end:  ; 17 decles
;; ------------------------------------------------------------------------ ;;
_DH1:
    DECLE   _DH1.end - _DH1 - 1
    DECLE   $0018, $034F, $016D, $030B, $0306, $0363, $017E, $006A
    DECLE   $0164, $019E, $01DA, $00CB, $00E8, $027A, $03E8, $01D7
    DECLE   $0173, $00A1, $0000
_DH1.end:  ; 19 decles
;; ------------------------------------------------------------------------ ;;
_DH2:
    DECLE   _DH2.end - _DH2 - 1
    DECLE   $0119, $034C, $016D, $030B, $0306, $0363, $017E, $006A
    DECLE   $0164, $019E, $01DA, $00CB, $00E8, $027A, $03E8, $01D7
    DECLE   $0173, $00A1, $0000
_DH2.end:  ; 19 decles
;; ------------------------------------------------------------------------ ;;
_EH:
    DECLE   _EH.end - _EH - 1
    DECLE   $0218, $02CD, $016F, $0105, $014B, $0224, $02CF, $0274
    DECLE   $014C, $0005, $0000
_EH.end:  ; 11 decles
;; ------------------------------------------------------------------------ ;;
_EL:
    DECLE   _EL.end - _EL - 1
    DECLE   $0118, $038D, $016E, $011C, $008B, $03D2, $030F, $0262
    DECLE   $006C, $019D, $01CC, $022B, $0170, $0078, $03FE, $0018
    DECLE   $0183, $03A3, $010D, $016E, $012E, $00C6, $00C3, $0300
    DECLE   $0060, $000D, $0005, $0000
_EL.end:  ; 28 decles
;; ------------------------------------------------------------------------ ;;
_ER1:
    DECLE   _ER1.end - _ER1 - 1
    DECLE   $0118, $034C, $016E, $001C, $0089, $01C3, $034E, $03E6
    DECLE   $00AB, $0095, $0001, $0000, $03FC, $0381, $0000, $0188
    DECLE   $01DA, $00CB, $00E7, $0048, $03A6, $0244, $016C, $01A8
    DECLE   $03E4, $0000, $0002, $0001, $00FC, $01DA, $02E4, $0000
    DECLE   $0002, $0008, $0200, $0217, $0164, $0000, $000E, $0038
    DECLE   $0014, $01EA, $0264, $0000, $0002, $0048, $01EC, $02F1
    DECLE   $03CC, $016D, $021E, $0048, $00C2, $034E, $036A, $000D
    DECLE   $008D, $000B, $0200, $0047, $0022, $03A8, $0000, $0000
_ER1.end:  ; 64 decles
;; ------------------------------------------------------------------------ ;;
_ER2:
    DECLE   _ER2.end - _ER2 - 1
    DECLE   $0218, $034C, $016E, $001C, $0089, $01C3, $034E, $03E6
    DECLE   $00AB, $0095, $0001, $0000, $03FC, $0381, $0000, $0190
    DECLE   $01D8, $00CB, $00E7, $0058, $01A6, $0244, $0164, $02A9
    DECLE   $0024, $0000, $0000, $0007, $0201, $02F8, $02E4, $0000
    DECLE   $0002, $0001, $00FC, $02DA, $0024, $0000, $0002, $0008
    DECLE   $0200, $0217, $0024, $0000, $000E, $0038, $0014, $03EA
    DECLE   $03A4, $0000, $0002, $0048, $01EC, $03F1, $038C, $016D
    DECLE   $021E, $0048, $00C2, $034E, $036A, $000D, $009D, $0003
    DECLE   $0200, $0047, $0022, $03A8, $0000, $0000
_ER2.end:  ; 70 decles
;; ------------------------------------------------------------------------ ;;
_EY:
    DECLE   _EY.end - _EY - 1
    DECLE   $0310, $038C, $016E, $02A7, $00BB, $0160, $0290, $0094
    DECLE   $01CA, $03A9, $00C1, $02D7, $015B, $01D4, $03CE, $02FF
    DECLE   $00EA, $03E7, $0041, $0277, $025B, $0355, $03C9, $0103
    DECLE   $02EA, $03E4, $003F, $0000
_EY.end:  ; 28 decles
;; ------------------------------------------------------------------------ ;;
_FF:
    DECLE   _FF.end - _FF - 1
    DECLE   $0119, $03C8, $0000, $00A7, $0094, $0138, $01C6, $0000
_FF.end:  ; 8 decles
;; ------------------------------------------------------------------------ ;;
_GG1:
    DECLE   _GG1.end - _GG1 - 1
    DECLE   $00F4, $00C6, $00C2, $0200, $0015, $03FE, $0283, $01FD
    DECLE   $01E6, $00B7, $030A, $0364, $0331, $017F, $033D, $0215
    DECLE   $0002
_GG1.end:  ; 17 decles
;; ------------------------------------------------------------------------ ;;
_GG2:
    DECLE   _GG2.end - _GG2 - 1
    DECLE   $00F4, $0106, $0072, $0300, $0021, $0308, $0039, $0173
    DECLE   $00C6, $00B7, $037E, $03A3, $0319, $0177, $0036, $0217
    DECLE   $0002
_GG2.end:  ; 17 decles
;; ------------------------------------------------------------------------ ;;
_GG3:
    DECLE   _GG3.end - _GG3 - 1
    DECLE   $00F8, $0146, $00F2, $0100, $0132, $03A8, $0055, $01F5
    DECLE   $00A6, $02B7, $0291, $0326, $0368, $0167, $023A, $01C6
    DECLE   $0002
_GG3.end:  ; 17 decles
;; ------------------------------------------------------------------------ ;;
_HH1:
    DECLE   _HH1.end - _HH1 - 1
    DECLE   $0218, $01C9, $0000, $0095, $0127, $0060, $01D6, $0213
    DECLE   $0002, $01AE, $033E, $01A0, $03C4, $0122, $0001, $0218
    DECLE   $01E4, $03FD, $0019, $0000
_HH1.end:  ; 20 decles
;; ------------------------------------------------------------------------ ;;
_HH2:
    DECLE   _HH2.end - _HH2 - 1
    DECLE   $0218, $00CB, $0000, $0086, $000F, $0240, $0182, $031A
    DECLE   $02DB, $0008, $0293, $0067, $00BD, $01E0, $0092, $000C
    DECLE   $0000
_HH2.end:  ; 17 decles
;; ------------------------------------------------------------------------ ;;
_IH:
    DECLE   _IH.end - _IH - 1
    DECLE   $0118, $02CD, $016F, $0205, $0144, $02C3, $00FE, $031A
    DECLE   $000D, $0005, $0000
_IH.end:  ; 11 decles
;; ------------------------------------------------------------------------ ;;
_IY:
    DECLE   _IY.end - _IY - 1
    DECLE   $0318, $02CC, $016F, $0008, $030B, $01C3, $0330, $0178
    DECLE   $002B, $019D, $01F6, $018B, $01E1, $0010, $020D, $0358
    DECLE   $015F, $02A4, $02CC, $016F, $0109, $030B, $0193, $0320
    DECLE   $017A, $034C, $009C, $0017, $0001, $0200, $03C1, $0020
    DECLE   $00A7, $001D, $0001, $0104, $003D, $0040, $01A7, $01CA
    DECLE   $018B, $0160, $0078, $01F6, $0343, $01C7, $0090, $0000
_IY.end:  ; 48 decles
;; ------------------------------------------------------------------------ ;;
_JH:
    DECLE   _JH.end - _JH - 1
    DECLE   $0018, $0149, $0001, $00A4, $0321, $0180, $01F4, $039A
    DECLE   $02DC, $023C, $011A, $0047, $0200, $0001, $018E, $034E
    DECLE   $0394, $0356, $02C1, $010C, $03FD, $0129, $00B7, $01BA
    DECLE   $0000
_JH.end:  ; 25 decles
;; ------------------------------------------------------------------------ ;;
_KK1:
    DECLE   _KK1.end - _KK1 - 1
    DECLE   $00F4, $00C6, $00D2, $0000, $023A, $03E0, $02D1, $02E5
    DECLE   $0184, $0200, $0041, $0210, $0188, $00C5, $0000
_KK1.end:  ; 15 decles
;; ------------------------------------------------------------------------ ;;
_KK2:
    DECLE   _KK2.end - _KK2 - 1
    DECLE   $021D, $023C, $0211, $003C, $0180, $024D, $0008, $032B
    DECLE   $025B, $002D, $01DC, $01E3, $007A, $0000
_KK2.end:  ; 14 decles
;; ------------------------------------------------------------------------ ;;
_KK3:
    DECLE   _KK3.end - _KK3 - 1
    DECLE   $00F7, $0046, $01D2, $0300, $0131, $006C, $006E, $00F1
    DECLE   $00E4, $0000, $025A, $010D, $0110, $01F9, $014A, $0001
    DECLE   $00B5, $01A2, $00D8, $01CE, $0000
_KK3.end:  ; 21 decles
;; ------------------------------------------------------------------------ ;;
_LL:
    DECLE   _LL.end - _LL - 1
    DECLE   $0318, $038C, $016D, $029E, $0333, $0260, $0221, $0294
    DECLE   $01C4, $0299, $025A, $00E6, $014C, $012C, $0031, $0000
_LL.end:  ; 16 decles
;; ------------------------------------------------------------------------ ;;
_MM:
    DECLE   _MM.end - _MM - 1
    DECLE   $0210, $034D, $016D, $03F5, $00B0, $002E, $0220, $0290
    DECLE   $03CE, $02B6, $03AA, $00F3, $00CF, $015D, $016E, $0000
_MM.end:  ; 16 decles
;; ------------------------------------------------------------------------ ;;
_NG1:
    DECLE   _NG1.end - _NG1 - 1
    DECLE   $0118, $03CD, $016E, $00DC, $032F, $01BF, $01E0, $0116
    DECLE   $02AB, $029A, $0358, $01DB, $015B, $01A7, $02FD, $02B1
    DECLE   $03D2, $0356, $0000
_NG1.end:  ; 19 decles
;; ------------------------------------------------------------------------ ;;
_NN1:
    DECLE   _NN1.end - _NN1 - 1
    DECLE   $0318, $03CD, $016C, $0203, $0306, $03C3, $015F, $0270
    DECLE   $002A, $009D, $000D, $0248, $01B4, $0120, $01E1, $00C8
    DECLE   $0003, $0040, $0000, $0080, $015F, $0006, $0000
_NN1.end:  ; 23 decles
;; ------------------------------------------------------------------------ ;;
_NN2:
    DECLE   _NN2.end - _NN2 - 1
    DECLE   $0018, $034D, $016D, $0203, $0306, $03C3, $015F, $0270
    DECLE   $002A, $0095, $0003, $0248, $01B4, $0120, $01E1, $0090
    DECLE   $000B, $0040, $0000, $0080, $015F, $019E, $01F6, $028B
    DECLE   $00E0, $0266, $03F6, $01D8, $0143, $01A8, $0024, $00C0
    DECLE   $0080, $0000, $01E6, $0321, $0024, $0260, $000A, $0008
    DECLE   $03FE, $0000, $0000
_NN2.end:  ; 43 decles
;; ------------------------------------------------------------------------ ;;
_OR2:
    DECLE   _OR2.end - _OR2 - 1
    DECLE   $0218, $018C, $016D, $02A6, $03AB, $004F, $0301, $0390
    DECLE   $02EA, $0289, $0228, $0356, $01CF, $02D5, $0135, $007D
    DECLE   $02B5, $02AF, $024A, $02E2, $0153, $0167, $0333, $02A9
    DECLE   $02B3, $039A, $0351, $0147, $03CD, $0339, $02DA, $0000
_OR2.end:  ; 32 decles
;; ------------------------------------------------------------------------ ;;
_OW:
    DECLE   _OW.end - _OW - 1
    DECLE   $0310, $034C, $016E, $02AE, $03B1, $00CF, $0304, $0192
    DECLE   $018A, $022B, $0041, $0277, $015B, $0395, $03D1, $0082
    DECLE   $03CE, $00B6, $03BB, $02DA, $0000
_OW.end:  ; 21 decles
;; ------------------------------------------------------------------------ ;;
_OY:
    DECLE   _OY.end - _OY - 1
    DECLE   $0310, $014C, $016E, $02A6, $03AF, $00CF, $0304, $0192
    DECLE   $03CA, $01A8, $007F, $0155, $02B4, $027F, $00E2, $036A
    DECLE   $031F, $035D, $0116, $01D5, $02F4, $025F, $033A, $038A
    DECLE   $014F, $01B5, $03D5, $0297, $02DA, $03F2, $0167, $0124
    DECLE   $03FB, $0001
_OY.end:  ; 34 decles
;; ------------------------------------------------------------------------ ;;
_PA1:
    DECLE   _PA1.end - _PA1 - 1
    DECLE   $00F1, $0000
_PA1.end:  ; 2 decles
;; ------------------------------------------------------------------------ ;;
_PA2:
    DECLE   _PA2.end - _PA2 - 1
    DECLE   $00F4, $0000
_PA2.end:  ; 2 decles
;; ------------------------------------------------------------------------ ;;
_PA3:
    DECLE   _PA3.end - _PA3 - 1
    DECLE   $00F7, $0000
_PA3.end:  ; 2 decles
;; ------------------------------------------------------------------------ ;;
_PA4:
    DECLE   _PA4.end - _PA4 - 1
    DECLE   $00FF, $0000
_PA4.end:  ; 2 decles
;; ------------------------------------------------------------------------ ;;
_PA5:
    DECLE   _PA5.end - _PA5 - 1
    DECLE   $031D, $003F, $0000
_PA5.end:  ; 3 decles
;; ------------------------------------------------------------------------ ;;
_PP:
    DECLE   _PP.end - _PP - 1
    DECLE   $00FD, $0106, $0052, $0000, $022A, $03A5, $0277, $035F
    DECLE   $0184, $0000, $0055, $0391, $00EB, $00CF, $0000
_PP.end:  ; 15 decles
;; ------------------------------------------------------------------------ ;;
_RR1:
    DECLE   _RR1.end - _RR1 - 1
    DECLE   $0118, $01CD, $016C, $029E, $0171, $038E, $01E0, $0190
    DECLE   $0245, $0299, $01AA, $02E2, $01C7, $02DE, $0125, $00B5
    DECLE   $02C5, $028F, $024E, $035E, $01CB, $02EC, $0005, $0000
_RR1.end:  ; 24 decles
;; ------------------------------------------------------------------------ ;;
_RR2:
    DECLE   _RR2.end - _RR2 - 1
    DECLE   $0218, $03CC, $016C, $030C, $02C8, $0393, $02CD, $025E
    DECLE   $008A, $019D, $01AC, $02CB, $00BE, $0046, $017E, $01C2
    DECLE   $0174, $00A1, $01E5, $00E0, $010E, $0007, $0313, $0017
    DECLE   $0000
_RR2.end:  ; 25 decles
;; ------------------------------------------------------------------------ ;;
_SH:
    DECLE   _SH.end - _SH - 1
    DECLE   $0218, $0109, $0000, $007A, $0187, $02E0, $03F6, $0311
    DECLE   $0002, $0126, $0242, $0161, $03E9, $0219, $016C, $0300
    DECLE   $0013, $0045, $0124, $0005, $024C, $005C, $0182, $03C2
    DECLE   $0001
_SH.end:  ; 25 decles
;; ------------------------------------------------------------------------ ;;
_SS:
    DECLE   _SS.end - _SS - 1
    DECLE   $0218, $01CA, $0001, $0128, $001C, $0149, $01C6, $0000
_SS.end:  ; 8 decles
;; ------------------------------------------------------------------------ ;;
_TH:
    DECLE   _TH.end - _TH - 1
    DECLE   $0019, $0349, $0000, $00C6, $0212, $01D8, $01CA, $0000
_TH.end:  ; 8 decles
;; ------------------------------------------------------------------------ ;;
_TT1:
    DECLE   _TT1.end - _TT1 - 1
    DECLE   $00F6, $0046, $0142, $0100, $0042, $0088, $027E, $02EF
    DECLE   $01A4, $0200, $0049, $0290, $00FC, $00E8, $0000
_TT1.end:  ; 15 decles
;; ------------------------------------------------------------------------ ;;
_TT2:
    DECLE   _TT2.end - _TT2 - 1
    DECLE   $00F5, $00C6, $01D2, $0100, $0335, $00E9, $0042, $027A
    DECLE   $02A4, $0000, $0062, $01D1, $014C, $03EA, $02EC, $01E0
    DECLE   $0007, $03A7, $0000
_TT2.end:  ; 19 decles
;; ------------------------------------------------------------------------ ;;
_UH:
    DECLE   _UH.end - _UH - 1
    DECLE   $0018, $034E, $016E, $01FF, $0349, $00D2, $003C, $030C
    DECLE   $008B, $0005, $0000
_UH.end:  ; 11 decles
;; ------------------------------------------------------------------------ ;;
_UW1:
    DECLE   _UW1.end - _UW1 - 1
    DECLE   $0318, $014C, $016F, $029E, $03BD, $03BD, $0271, $0212
    DECLE   $0325, $0291, $016A, $027B, $014A, $03B4, $0133, $0001
_UW1.end:  ; 16 decles
;; ------------------------------------------------------------------------ ;;
_UW2:
    DECLE   _UW2.end - _UW2 - 1
    DECLE   $0018, $034E, $016E, $02F6, $0107, $02C2, $006D, $0090
    DECLE   $03AC, $01A4, $01DC, $03AB, $0128, $0076, $03E6, $0119
    DECLE   $014F, $03A6, $03A5, $0020, $0090, $0001, $02EE, $00BB
    DECLE   $0000
_UW2.end:  ; 25 decles
;; ------------------------------------------------------------------------ ;;
_VV:
    DECLE   _VV.end - _VV - 1
    DECLE   $0218, $030D, $016C, $010B, $010B, $0095, $034F, $03E4
    DECLE   $0108, $01B5, $01BE, $028B, $0160, $00AA, $03E4, $0106
    DECLE   $00EB, $02DE, $014C, $016E, $00F6, $0107, $00D2, $00CD
    DECLE   $0296, $00E4, $0006, $0000
_VV.end:  ; 28 decles
;; ------------------------------------------------------------------------ ;;
_WH:
    DECLE   _WH.end - _WH - 1
    DECLE   $0218, $00C9, $0000, $0084, $038E, $0147, $03A4, $0195
    DECLE   $0000, $012E, $0118, $0150, $02D1, $0232, $01B7, $03F1
    DECLE   $0237, $01C8, $03B1, $0227, $01AE, $0254, $0329, $032D
    DECLE   $01BF, $0169, $019A, $0307, $0181, $028D, $0000
_WH.end:  ; 31 decles
;; ------------------------------------------------------------------------ ;;
_WW:
    DECLE   _WW.end - _WW - 1
    DECLE   $0118, $034D, $016C, $00FA, $02C7, $0072, $03CC, $0109
    DECLE   $000B, $01AD, $019E, $016B, $0130, $0278, $01F8, $0314
    DECLE   $017E, $029E, $014D, $016D, $0205, $0147, $02E2, $001A
    DECLE   $010A, $026E, $0004, $0000
_WW.end:  ; 28 decles
;; ------------------------------------------------------------------------ ;;
_XR2:
    DECLE   _XR2.end - _XR2 - 1
    DECLE   $0318, $034C, $016E, $02A6, $03BB, $002F, $0290, $008E
    DECLE   $004B, $0392, $01DA, $024B, $013A, $01DA, $012F, $00B5
    DECLE   $02E5, $0297, $02DC, $0372, $014B, $016D, $0377, $00E7
    DECLE   $0376, $038A, $01CE, $026B, $02FA, $01AA, $011E, $0071
    DECLE   $00D5, $0297, $02BC, $02EA, $01C7, $02D7, $0135, $0155
    DECLE   $01DD, $0007, $0000
_XR2.end:  ; 43 decles
;; ------------------------------------------------------------------------ ;;
_YR:
    DECLE   _YR.end - _YR - 1
    DECLE   $0318, $03CC, $016E, $0197, $00FD, $0130, $0270, $0094
    DECLE   $0328, $0291, $0168, $007E, $01CC, $02F5, $0125, $02B5
    DECLE   $00F4, $0298, $01DA, $03F6, $0153, $0126, $03B9, $00AB
    DECLE   $0293, $03DB, $0175, $01B9, $0001
_YR.end:  ; 29 decles
;; ------------------------------------------------------------------------ ;;
_YY1:
    DECLE   _YY1.end - _YY1 - 1
    DECLE   $0318, $01CC, $016E, $0015, $00CB, $0263, $0320, $0078
    DECLE   $01CE, $0094, $001F, $0040, $0320, $03BF, $0230, $00A7
    DECLE   $000F, $01FE, $03FC, $01E2, $00D0, $0089, $000F, $0248
    DECLE   $032B, $03FD, $01CF, $0001, $0000
_YY1.end:  ; 29 decles
;; ------------------------------------------------------------------------ ;;
_YY2:
    DECLE   _YY2.end - _YY2 - 1
    DECLE   $0318, $01CC, $016E, $0015, $00CB, $0263, $0320, $0078
    DECLE   $01CE, $0094, $001F, $0040, $0320, $03BF, $0230, $00A7
    DECLE   $000F, $01FE, $03FC, $01E2, $00D0, $0089, $000F, $0248
    DECLE   $032B, $03FD, $01CF, $0199, $01EE, $008B, $0161, $0232
    DECLE   $0004, $0318, $01A7, $0198, $0124, $03E0, $0001, $0001
    DECLE   $030F, $0027, $0000
_YY2.end:  ; 43 decles
;; ------------------------------------------------------------------------ ;;
_ZH:
    DECLE   _ZH.end - _ZH - 1
    DECLE   $0310, $014D, $016E, $00C3, $03B9, $01BF, $0241, $0012
    DECLE   $0163, $00E1, $0000, $0080, $0084, $023F, $003F, $0000
_ZH.end:  ; 16 decles
;; ------------------------------------------------------------------------ ;;
_ZZ:
    DECLE   _ZZ.end - _ZZ - 1
    DECLE   $0218, $010D, $016F, $0225, $0351, $00B5, $02A0, $02EE
    DECLE   $00E9, $014D, $002C, $0360, $0008, $00EC, $004C, $0342
    DECLE   $03D4, $0156, $0052, $0131, $0008, $03B0, $01BE, $0172
    DECLE   $0000
_ZZ.end:  ; 25 decles

;;==========================================================================;;
;;									  ;;
;;  Copyright information:						  ;;
;;									  ;;
;;  The above allophone data was extracted from the SP0256-AL2 ROM image.   ;;
;;  The SP0256-AL2 allophones are NOT in the public domain, nor are they    ;;
;;  placed under the GNU General Public License.  This program is	   ;;
;;  distributed in the hope that it will be useful, but WITHOUT ANY	 ;;
;;  WARRANTY; without even the implied warranty of MERCHANTABILITY or       ;;
;;  FITNESS FOR A PARTICULAR PURPOSE.				       ;;
;;									  ;;
;;  Microchip, Inc. retains the copyright to the data and algorithms	;;
;;  contained in the SP0256-AL2.  This speech data is distributed with      ;;
;;  explicit permission from Microchip, Inc.  All such redistributions      ;;
;;  must retain this notice of copyright.				   ;;
;;									  ;;
;;  No copyright claims are made on this data by the author(s) of SDK1600.  ;;
;;  Please see http://spatula-city.org/~im14u2c/sp0256-al2/ for details.    ;;
;;									  ;;
;;==========================================================================;;

;* ======================================================================== *;
;*  These routines are placed into the public domain by their author.  All  *;
;*  copyright rights are hereby relinquished on the routines and data in    *;
;*  this file.  -- Joseph Zbiciak, 2008				     *;
;* ======================================================================== *;

;; ======================================================================== ;;
;;  INTELLIVOICE DRIVER ROUTINES					    ;;
;;  Written in 2002 by Joe Zbiciak <intvnut AT gmail.com>		   ;;
;;  http://spatula-city.org/~im14u2c/intv/				  ;;
;; ======================================================================== ;;

;; ======================================================================== ;;
;;  GLOBAL VARIABLES USED BY THESE ROUTINES				 ;;
;;									  ;;
;;  Note that some of these routines may use one or more global variables.  ;;
;;  If you use these routines, you will need to allocate the appropriate    ;;
;;  space in either 16-bit or 8-bit memory as appropriate.  Each global     ;;
;;  variable is listed with the routines which use it and the required      ;;
;;  memory width.							   ;;
;;									  ;;
;;  Example declarations for these routines are shown below, commented out. ;;
;;  You should uncomment these and add them to your program to make use of  ;;
;;  the routine that needs them.  Make sure to assign these variables to    ;;
;;  locations that aren't used for anything else.			   ;;
;; ======================================================================== ;;

			; Used by       Req'd Width     Description
			;-----------------------------------------------------
;IV.QH      EQU $110    ; IV_xxx	8-bit	   Voice queue head
;IV.QT      EQU $111    ; IV_xxx	8-bit	   Voice queue tail
;IV.Q       EQU $112    ; IV_xxx	8-bit	   Voice queue  (8 bytes)
;IV.FLEN    EQU $11A    ; IV_xxx	8-bit	   Length of FIFO data
;IV.FPTR    EQU $320    ; IV_xxx	16-bit	  Current FIFO ptr.
;IV.PPTR    EQU $321    ; IV_xxx	16-bit	  Current Phrase ptr.

;; ======================================================================== ;;
;;  MEMORY USAGE							    ;;
;;									  ;;
;;  These routines implement a queue of "pending phrases" that will be      ;;
;;  played by the Intellivoice.  The user calls IV_PLAY to enqueue a	;;
;;  phrase number.  Phrase numbers indicate either a RESROM sample or       ;;
;;  a compiled in phrase to be spoken.				      ;;
;;									  ;;
;;  The user must compose an "IV_PHRASE_TBL", which is composed of	  ;;
;;  pointers to phrases to be spoken.  Phrases are strings of pointers      ;;
;;  and RESROM triggers, terminated by a NUL.			       ;;
;;									  ;;
;;  Phrase numbers 1 through 42 are RESROM samples.  Phrase numbers	 ;;
;;  43 through 255 index into the IV_PHRASE_TBL.			    ;;
;;									  ;;
;;  SPECIAL NOTES							   ;;
;;									  ;;
;;  Bit 7 of IV.QH and IV.QT is used to denote whether the Intellivoice     ;;
;;  is present.  If Intellivoice is present, this bit is clear.	     ;;
;;									  ;;
;;  Bit 6 of IV.QT is used to denote that we still need to do an ALD $00    ;;
;;  for FIFO'd voice data.						  ;;
;; ======================================================================== ;;
	    

;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_INIT     Initialize the Intellivoice			     ;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      15-Sep-2002 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_INIT						      ;;
;;      R5      Return address					      ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;      R0      0 if Intellivoice found, -1 if not.			 ;;
;;									  ;;
;;  DESCRIPTION							     ;;
;;      Resets Intellivoice, determines if it is actually there, and	;;
;;      then initializes the IV structure.				  ;;
;; ------------------------------------------------------------------------ ;;
;;		   Copyright (c) 2002, Joseph Zbiciak		     ;;
;; ======================================================================== ;;

IV_INIT     PROC
	    MVII    #$0400, R0	  ;
	    MVO     R0,     $0081       ; Reset the Intellivoice

	    MVI     $0081,  R0	  ; \
	    RLC     R0,     2	   ;  |-- See if we detect Intellivoice
	    BOV     @@no_ivoice	 ; /    once we've reset it.

	    CLRR    R0		  ; 
	    MVO     R0,     IV.FPTR     ; No data for FIFO
	    MVO     R0,     IV.PPTR     ; No phrase being spoken
	    MVO     R0,     IV.QH       ; Clear our queue
	    MVO     R0,     IV.QT       ; Clear our queue
	    JR      R5		  ; Done!

@@no_ivoice:
	    CLRR    R0
	    MVO     R0,     IV.FPTR     ; No data for FIFO
	    MVO     R0,     IV.PPTR     ; No phrase being spoken
	    DECR    R0
	    MVO     R0,     IV.QH       ; Set queue to -1 ("No Intellivoice")
	    MVO     R0,     IV.QT       ; Set queue to -1 ("No Intellivoice")
;	    JR      R5		 ; Done!
	    B       _wait	       ; Special for IntyBASIC!
	    ENDP

;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_ISR      Interrupt service routine to feed Intellivoice	  ;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      15-Sep-2002 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_ISR						       ;;
;;      R5      Return address					      ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;      R0, R1, R4 trashed.						 ;;
;;									  ;;
;;  NOTES								   ;;
;;      Call this from your main interrupt service routine.		 ;;
;; ------------------------------------------------------------------------ ;;
;;		   Copyright (c) 2002, Joseph Zbiciak		     ;;
;; ======================================================================== ;;
IV_ISR      PROC
	    ;; ------------------------------------------------------------ ;;
	    ;;  Check for Intellivoice.  Leave if none present.	     ;;
	    ;; ------------------------------------------------------------ ;;
	    MVI     IV.QT,  R1	  ; Get queue tail
	    SWAP    R1,     2
	    BPL     @@ok		; Bit 7 set? If yes: No Intellivoice
@@ald_busy:
@@leave     JR      R5		  ; Exit if no Intellivoice.

     
	    ;; ------------------------------------------------------------ ;;
	    ;;  Check to see if we pump samples into the FIFO.
	    ;; ------------------------------------------------------------ ;;
@@ok:       MVI     IV.FPTR, R4	 ; Get FIFO data pointer
	    TSTR    R4		  ; is it zero?
	    BEQ     @@no_fifodata       ; Yes:  No data for FIFO.
@@fifo_fill:
	    MVI     $0081,  R0	  ; Read speech FIFO ready bit
	    SLLC    R0,     1	   ; 
	    BC      @@fifo_busy     

	    MVI@    R4,     R0	  ; Get next word
	    MVO     R0,     $0081       ; write it to the FIFO

	    MVI     IV.FLEN, R0	 ;\
	    DECR    R0		  ; |-- Decrement our FIFO'd data length
	    MVO     R0,     IV.FLEN     ;/
	    BEQ     @@last_fifo	 ; If zero, we're done w/ FIFO
	    MVO     R4,     IV.FPTR     ; Otherwise, save new pointer
	    B       @@fifo_fill	 ; ...and keep trying to load FIFO

@@last_fifo MVO     R0,     IV.FPTR     ; done with FIFO loading.
					; fall into ALD processing.


	    ;; ------------------------------------------------------------ ;;
	    ;;  Try to do an Address Load.  We do this in two settings:     ;;
	    ;;   -- We have no FIFO data to load.			   ;;
	    ;;   -- We've loaded as much FIFO data as we can, but we	;;
	    ;;      might have an address load command to send for it.      ;;
	    ;; ------------------------------------------------------------ ;;
@@fifo_busy:
@@no_fifodata:
	    MVI     $0080,  R0	  ; Read LRQ bit from ALD register
	    SLLC    R0,     1
	    BNC     @@ald_busy	  ; LRQ is low, meaning we can't ALD.
					; So, leave.

	    ;; ------------------------------------------------------------ ;;
	    ;;  We can do an address load (ALD) on the SP0256.  Give FIFO   ;;
	    ;;  driven ALDs priority, since we already started the FIFO     ;;
	    ;;  load.  The "need ALD" bit is stored in bit 6 of IV.QT.      ;;
	    ;; ------------------------------------------------------------ ;;
	    ANDI    #$40,   R1	  ; Is "Need FIFO ALD" bit set?
	    BEQ     @@no_fifo_ald
	    XOR     IV.QT,  R1	  ;\__ Clear the "Need FIFO ALD" bit.
	    MVO     R1,     IV.QT       ;/
	    CLRR    R1
	    MVO     R1,     $80	 ; Load a 0 into ALD (trigger FIFO rd.)
	    JR      R5		  ; done!

	    ;; ------------------------------------------------------------ ;;
	    ;;  We don't need to ALD on behalf of the FIFO.  So, we grab    ;;
	    ;;  the next thing off our phrase list.			 ;;
	    ;; ------------------------------------------------------------ ;;
@@no_fifo_ald:
	    MVI     IV.PPTR, R4	 ; Get phrase pointer.
	    TSTR    R4		  ; Is it zero?
	    BEQ     @@next_phrase       ; Yes:  Get next phrase from queue.

	    MVI@    R4,     R0
	    TSTR    R0		  ; Is it end of phrase?
	    BNEQ    @@process_phrase    ; !=0:  Go do it.

	    MVO     R0,     IV.PPTR     ; 
@@next_phrase:
	    MVI     IV.QT,  R1	  ; reload queue tail (was trashed above)
	    MOVR    R1,     R0	  ; copy QT to R0 so we can increment it
	    ANDI    #$7,    R1	  ; Mask away flags in queue head
	    CMP     IV.QH,  R1	  ; Is it same as queue tail?
	    BEQ     @@leave	     ; Yes:  No more speech for now.

	    INCR    R0
	    ANDI    #$F7,   R0	  ; mask away the possible 'carry'
	    MVO     R0,     IV.QT       ; save updated queue tail

	    ADDI    #IV.Q,  R1	  ; Index into queue
	    MVI@    R1,     R4	  ; get next value from queue
	    CMPI    #43,    R4	  ; Is it a RESROM or Phrase?
	    BNC     @@play_resrom_r4
@@new_phrase:
;	    ADDI    #IV_PHRASE_TBL - 43, R4 ; Index into phrase table
;	    MVI@    R4,     R4	  ; Read from phrase table
	    MVO     R4,     IV.PPTR
	    JR      R5		  ; we'll get to this phrase next time.

@@play_resrom_r4:
	    MVO     R4,     $0080       ; Just ALD it
	    JR      R5		  ; and leave.

	    ;; ------------------------------------------------------------ ;;
	    ;;  We're in the middle of a phrase, so continue interpreting.  ;;
	    ;; ------------------------------------------------------------ ;;
@@process_phrase:
	    
	    MVO     R4,     IV.PPTR     ; save new phrase pointer
	    CMPI    #43,    R0	  ; Is it a RESROM cue?
	    BC      @@play_fifo	 ; Just ALD it and leave.
@@play_resrom_r0
	    MVO     R0,     $0080       ; Just ALD it
	    JR      R5		  ; and leave.
@@play_fifo:
	    MVI     IV.FPTR,R1	  ; Make sure not to stomp existing FIFO
	    TSTR    R1		  ; data.
	    BEQ     @@new_fifo_ok
	    DECR    R4		  ; Oops, FIFO data still playing,
	    MVO     R4,     IV.PPTR     ; so rewind.
	    JR      R5		  ; and leave.

@@new_fifo_ok:
	    MOVR    R0,     R4	  ;
	    MVI@    R4,     R0	  ; Get chunk length
	    MVO     R0,     IV.FLEN     ; Init FIFO chunk length
	    MVO     R4,     IV.FPTR     ; Init FIFO pointer
	    MVI     IV.QT,  R0	  ;\
	    XORI    #$40,   R0	  ; |- Set "Need ALD" bit in QT
	    MVO     R0,     IV.QT       ;/

  IF 1      ; debug code		;\
	    ANDI    #$40,   R0	  ; |   Debug code:  We should only
	    BNEQ    @@qtok	      ; |-- be here if "Need FIFO ALD" 
	    HLT     ;BUG!!	      ; |   was already clear.	 
@@qtok				  ;/    
  ENDI
	    JR      R5		  ; leave.

	    ENDP


;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_PLAY     Play a voice sample sequence.			   ;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      15-Sep-2002 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_PLAY						      ;;
;;      R5      Invocation record, followed by return address.	      ;;
;;		  1 DECLE    Phrase number to play.		       ;;
;;									  ;;
;;  INPUTS for IV_PLAY.1						    ;;
;;      R0      Address of phrase to play.				  ;;
;;      R5      Return address					      ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;      R0, R1  trashed						     ;;
;;      Z==0    if item not successfully queued.			    ;;
;;      Z==1    if successfully queued.				     ;;
;;									  ;;
;;  NOTES								   ;;
;;      This code will drop phrases if the queue is full.		   ;;
;;      Phrase numbers 1..42 are RESROM samples.  43..255 will index	;;
;;      into the user-supplied IV_PHRASE_TBL.  43 will refer to the	 ;;
;;      first entry, 44 to the second, and so on.  Phrase 0 is undefined.   ;;
;;									  ;;
;; ------------------------------------------------------------------------ ;;
;;		   Copyright (c) 2002, Joseph Zbiciak		     ;;
;; ======================================================================== ;;
IV_PLAY     PROC
	    MVI@    R5,     R0

@@1:	; alternate entry point
	    MVI     IV.QT,  R1	  ; Get queue tail
	    SWAP    R1,     2	   ;\___ Leave if "no Intellivoice"
	    BMI     @@leave	     ;/    bit it set.
@@ok:       
	    DECR    R1		  ;\
	    ANDI    #$7,    R1	  ; |-- See if we still have room
	    CMP     IV.QH,  R1	  ;/
	    BEQ     @@leave	     ; Leave if we're full

@@2:	MVI     IV.QH,  R1	  ; Get our queue head pointer
	    PSHR    R1		  ;\
	    INCR    R1		  ; |
	    ANDI    #$F7,   R1	  ; |-- Increment it, removing
	    MVO     R1,     IV.QH       ; |   carry but preserving flags.
	    PULR    R1		  ;/

	    ADDI    #IV.Q,  R1	  ;\__ Store phrase to queue
	    MVO@    R0,     R1	  ;/

@@leave:    JR      R5		  ; Leave.
	    ENDP

;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_PLAYW    Play a voice sample sequence.  Wait for queue room.     ;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      15-Sep-2002 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_PLAY						      ;;
;;      R5      Invocation record, followed by return address.	      ;;
;;		  1 DECLE    Phrase number to play.		       ;;
;;									  ;;
;;  INPUTS for IV_PLAY.1						    ;;
;;      R0      Address of phrase to play.				  ;;
;;      R5      Return address					      ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;      R0, R1  trashed						     ;;
;;									  ;;
;;  NOTES								   ;;
;;      This code will wait for a queue slot to open if queue is full.      ;;
;;      Phrase numbers 1..42 are RESROM samples.  43..255 will index	;;
;;      into the user-supplied IV_PHRASE_TBL.  43 will refer to the	 ;;
;;      first entry, 44 to the second, and so on.  Phrase 0 is undefined.   ;;
;;									  ;;
;; ------------------------------------------------------------------------ ;;
;;		   Copyright (c) 2002, Joseph Zbiciak		     ;;
;; ======================================================================== ;;
IV_PLAYW    PROC
	    MVI@    R5,     R0

@@1:	; alternate entry point
	    MVI     IV.QT,  R1	  ; Get queue tail
	    SWAP    R1,     2	   ;\___ Leave if "no Intellivoice"
	    BMI     IV_PLAY.leave       ;/    bit it set.
@@ok:       
	    DECR    R1		  ;\
	    ANDI    #$7,    R1	  ; |-- See if we still have room
	    CMP     IV.QH,  R1	  ;/
	    BEQ     @@1		 ; wait for room
	    B       IV_PLAY.2

	    ENDP

;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_HUSH     Flush the speech queue, and hush the Intellivoice.      ;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      02-Feb-2018 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_HUSH						      ;;
;;      None.							       ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;      R0 trashed.							 ;;
;;									  ;;
;;  NOTES								   ;;
;;      Returns via IV_WAIT.						;;
;;									  ;;
;; ======================================================================== ;;
IV_HUSH:    PROC
	    MVI     IV.QH,  R0
	    SWAP    R0,     2
	    BMI     IV_WAIT.leave

	    DIS
	    ;; We can't stop a phrase segment that's being FIFOed down.
	    ;; We need to remember if we've committed to pushing ALD.
	    ;; We _can_ stop new phrase segments from going down, and _can_
	    ;; stop new phrases from being started.

	    ;; Set head pointer to indicate we've inserted one item.
	    MVI     IV.QH,  R0  ; Re-read, as an interrupt may have occurred
	    ANDI    #$F0,   R0
	    INCR    R0
	    MVO     R0,     IV.QH

	    ;; Reset tail pointer, keeping "need ALD" bit and other flags.
	    MVI     IV.QT,  R0
	    ANDI    #$F0,   R0
	    MVO     R0,     IV.QT

	    ;; Reset the phrase pointer, to stop a long phrase.
	    CLRR    R0
	    MVO     R0,     IV.PPTR

	    ;; Queue a PA1 in the queue.  Since we're can't guarantee the user
	    ;; has included resrom.asm, let's just use the raw number (5).
	    MVII    #5,     R0
	    MVO     R0,     IV.Q

	    ;; Re-enable interrupts and wait for Intellivoice to shut up.
	    ;;
	    ;; We can't just jump to IV_WAIT.q_loop, as we need to reload
	    ;; IV.QH into R0, and I'm really committed to only using R0.
;	   JE      IV_WAIT
	    EIS
	    ; fallthrough into IV_WAIT
	    ENDP

;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_WAIT     Wait for voice queue to empty.			  ;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      15-Sep-2002 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_WAIT						      ;;
;;      R5      Return address					      ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;      R0      trashed.						    ;;
;;									  ;;
;;  NOTES								   ;;
;;      This waits until the Intellivoice is nearly completely quiescent.   ;;
;;      Some voice data may still be spoken from the last triggered	 ;;
;;      phrase.  To truly wait for *that* to be spoken, speak a 'pause'     ;;
;;      (eg. RESROM.pa1) and then call IV_WAIT.			     ;;
;; ------------------------------------------------------------------------ ;;
;;		   Copyright (c) 2002, Joseph Zbiciak		     ;;
;; ======================================================================== ;;
IV_WAIT     PROC
	    MVI     IV.QH,  R0
	    CMPI    #$80, R0	    ; test bit 7, leave if set.
	    BC      @@leave

	    ; Wait for queue to drain.
@@q_loop:   CMP     IV.QT,  R0
	    BNEQ    @@q_loop

	    ; Wait for FIFO and LRQ to say ready.
@@s_loop:   MVI     $81,    R0	  ; Read FIFO status.  0 == ready.
	    COMR    R0
	    AND     $80,    R0	  ; Merge w/ ALD status.  1 == ready
	    TSTR    R0
	    BPL     @@s_loop	    ; if bit 15 == 0, not ready.
	    
@@leave:    JR      R5
	    ENDP

;; ======================================================================== ;;
;;  End of File:  ivoice.asm						;;
;; ======================================================================== ;;

;* ======================================================================== *;
;*  These routines are placed into the public domain by their author.  All  *;
;*  copyright rights are hereby relinquished on the routines and data in    *;
;*  this file.  -- Joseph Zbiciak, 2008				     *;
;* ======================================================================== *;

;; ======================================================================== ;;
;;  NAME								    ;;
;;      IV_SAYNUM16 Say a 16-bit unsigned number using RESROM digits	;;
;;									  ;;
;;  AUTHOR								  ;;
;;      Joseph Zbiciak <intvnut AT gmail.com>			       ;;
;;									  ;;
;;  REVISION HISTORY							;;
;;      16-Sep-2002 Initial revision . . . . . . . . . . .  J. Zbiciak      ;;
;;									  ;;
;;  INPUTS for IV_SAYNUM16						  ;;
;;      R0      Number to "speak"					   ;;
;;      R5      Return address					      ;;
;;									  ;;
;;  OUTPUTS								 ;;
;;									  ;;
;;  DESCRIPTION							     ;;
;;      "Says" a 16-bit number using IV_PLAYW to queue up the phrase.       ;;
;;      Because the number may be built from several segments, it could     ;;
;;      easily eat up the queue.  I believe the longest number will take    ;;
;;      7 queue entries -- that is, fill the queue.  Thus, this code	;;
;;      could block, waiting for slots in the queue.			;;
;; ======================================================================== ;;

IV_SAYNUM16 PROC
	    PSHR    R5

	    TSTR    R0
	    BEQ     @@zero	  ; Special case:  Just say "zero"

	    ;; ------------------------------------------------------------ ;;
	    ;;  First, try to pull off 'thousands'.  We call ourselves      ;;
	    ;;  recursively to play the the number of thousands.	    ;;
	    ;; ------------------------------------------------------------ ;;
	    CLRR    R1
@@thloop:   INCR    R1
	    SUBI    #1000,  R0
	    BC      @@thloop

	    ADDI    #1000,  R0
	    PSHR    R0
	    DECR    R1
	    BEQ     @@no_thousand

	    CALL    IV_SAYNUM16.recurse

	    CALL    IV_PLAYW
	    DECLE   36  ; THOUSAND
	    
@@no_thousand
	    PULR    R1

	    ;; ------------------------------------------------------------ ;;
	    ;;  Now try to play hundreds.				   ;;
	    ;; ------------------------------------------------------------ ;;
	    MVII    #7-1, R0    ; ZERO
	    CMPI    #100,   R1
	    BNC     @@no_hundred

@@hloop:    INCR    R0
	    SUBI    #100,   R1
	    BC      @@hloop
	    ADDI    #100,   R1

	    PSHR    R1

	    CALL    IV_PLAYW.1

	    CALL    IV_PLAYW
	    DECLE   35  ; HUNDRED

	    PULR    R1
	    B       @@notrecurse    ; skip "PSHR R5"
@@recurse:  PSHR    R5	      ; recursive entry point for 'thousand'

@@no_hundred:
@@notrecurse:
	    MOVR    R1,     R0
	    BEQ     @@leave

	    SUBI    #20,    R1
	    BNC     @@teens

	    MVII    #27-1, R0   ; TWENTY
@@tyloop    INCR    R0
	    SUBI    #10,    R1
	    BC      @@tyloop
	    ADDI    #10,    R1

	    PSHR    R1
	    CALL    IV_PLAYW.1

	    PULR    R0
	    TSTR    R0
	    BEQ     @@leave

@@teens:
@@zero:     ADDI    #7, R0  ; ZERO

	    CALL    IV_PLAYW.1

@@leave     PULR    PC
	    ENDP

;; ======================================================================== ;;
;;  End of File:  saynum16.asm					      ;;
;; ======================================================================== ;;

IV_INIT_and_wait:     EQU IV_INIT

    ELSE

IV_INIT_and_wait:     EQU _wait	; No voice init; just WAIT.

    ENDI

	IF intybasic_flash

;; ======================================================================== ;;
;;  JLP "Save Game" support						 ;;
;; ======================================================================== ;;
JF.first    EQU     $8023
JF.last     EQU     $8024
JF.addr     EQU     $8025
JF.row      EQU     $8026
		   
JF.wrcmd    EQU     $802D
JF.rdcmd    EQU     $802E
JF.ercmd    EQU     $802F
JF.wrkey    EQU     $C0DE
JF.rdkey    EQU     $DEC0
JF.erkey    EQU     $BEEF

JF.write:   DECLE   JF.wrcmd,   JF.wrkey    ; Copy JLP RAM to flash row  
JF.read:    DECLE   JF.rdcmd,   JF.rdkey    ; Copy flash row to JLP RAM  
JF.erase:   DECLE   JF.ercmd,   JF.erkey    ; Erase flash sector 

;; ======================================================================== ;;
;;  JF.INIT	 Copy JLP save-game support routine to System RAM	;;
;; ======================================================================== ;;
JF.INIT     PROC
	    PSHR    R5	    
	    MVII    #@@__code,  R5
	    MVII    #JF.SYSRAM, R4
	    REPEAT  5       
	    MVI@    R5,	 R0      ; \_ Copy code fragment to System RAM
	    MVO@    R0,	 R4      ; /
	    ENDR
	    PULR    PC

	    ;; === start of code that will run from RAM
@@__code:   MVO@    R0,	 R1      ; JF.SYSRAM + 0: initiate command
	    ADD@    R1,	 PC      ; JF.SYSRAM + 1: Wait for JLP to return
	    JR      R5		  ; JF.SYSRAM + 2:
	    MVO@    R2,	 R2      ; JF.SYSRAM + 3: \__ simple ISR
	    JR      R5		  ; JF.SYSRAM + 4: /
	    ;; === end of code that will run from RAM
	    ENDP

;; ======================================================================== ;;
;;  JF.CMD	  Issue a JLP Flash command			       ;;
;;									  ;;
;;  INPUT								   ;;
;;      R0  Slot number to operate on				       ;;
;;      R1  Address to copy to/from in JLP RAM			      ;;
;;      @R5 Command to invoke:					      ;;
;;									  ;;
;;	      JF.write -- Copy JLP RAM to Flash			   ;;
;;	      JF.read  -- Copy Flash to JLP RAM			   ;;
;;	      JF.erase -- Erase flash sector			      ;;
;;									  ;;
;;  OUTPUT								  ;;
;;      R0 - R4 not modified.  (Saved and restored across call)	     ;;
;;      JLP command executed						;;
;;									  ;;
;;  NOTES								   ;;
;;      This code requires two short routines in the console's System RAM.  ;;
;;      It also requires that the system stack reside in System RAM.	;;
;;      Because an interrupt may occur during the code's execution, there   ;;
;;      must be sufficient stack space to service the interrupt (8 words).  ;;
;;									  ;;
;;      The code also relies on the fact that the EXEC ISR dispatch does    ;;
;;      not modify R2.  This allows us to initialize R2 for the ISR ahead   ;;
;;      of time, rather than in the ISR.				    ;;
;; ======================================================================== ;;
JF.CMD      PROC

	    MVO     R4,	 JF.SV.R4    ; \
	    MVII    #JF.SV.R0,  R4	  ;  |
	    MVO@    R0,	 R4	  ;  |- Save registers, but not on
	    MVO@    R1,	 R4	  ;  |  the stack.  (limit stack use)
	    MVO@    R2,	 R4	  ; /

	    MVI@    R5,	 R4	  ; Get command to invoke

	    MVO     R5,	 JF.SV.R5    ; save return address

	    DIS
	    MVO     R1,	 JF.addr     ; \_ Save SG arguments in JLP
	    MVO     R0,	 JF.row      ; /
					  
	    MVI@    R4,	 R1	  ; Get command address
	    MVI@    R4,	 R0	  ; Get unlock word
					  
	    MVII    #$100,      R4	  ; \
	    SDBD			    ;  |_ Save old ISR in save area
	    MVI@    R4,	 R2	  ;  |
	    MVO     R2,	 JF.SV.ISR   ; /
					  
	    MVII    #JF.SYSRAM + 3, R2      ; \
	    MVO     R2,	 $100	;  |_ Set up new ISR in RAM
	    SWAP    R2		      ;  |
	    MVO     R2,	 $101	; / 
					  
	    MVII    #$20,       R2	  ; Address of STIC handshake
	    JSRE    R5,  JF.SYSRAM	  ; Invoke the command
					  
	    MVI     JF.SV.ISR,  R2	  ; \
	    MVO     R2,	 $100	;  |_ Restore old ISR 
	    SWAP    R2		      ;  |
	    MVO     R2,	 $101	; /
					  
	    MVII    #JF.SV.R0,  R5	  ; \
	    MVI@    R5,	 R0	  ;  |
	    MVI@    R5,	 R1	  ;  |- Restore registers
	    MVI@    R5,	 R2	  ;  |
	    MVI@    R5,	 R4	  ; /
	    MVI@    R5,	 PC	  ; Return

	    ENDP


	ENDI

	IF intybasic_fastmult

; Quarter Square Multiplication
; Assembly code by Joe Zbiciak, 2015
; Released to public domain.

QSQR8_TBL:  PROC
	    DECLE   $3F80, $3F01, $3E82, $3E04, $3D86, $3D09, $3C8C, $3C10
	    DECLE   $3B94, $3B19, $3A9E, $3A24, $39AA, $3931, $38B8, $3840
	    DECLE   $37C8, $3751, $36DA, $3664, $35EE, $3579, $3504, $3490
	    DECLE   $341C, $33A9, $3336, $32C4, $3252, $31E1, $3170, $3100
	    DECLE   $3090, $3021, $2FB2, $2F44, $2ED6, $2E69, $2DFC, $2D90
	    DECLE   $2D24, $2CB9, $2C4E, $2BE4, $2B7A, $2B11, $2AA8, $2A40
	    DECLE   $29D8, $2971, $290A, $28A4, $283E, $27D9, $2774, $2710
	    DECLE   $26AC, $2649, $25E6, $2584, $2522, $24C1, $2460, $2400
	    DECLE   $23A0, $2341, $22E2, $2284, $2226, $21C9, $216C, $2110
	    DECLE   $20B4, $2059, $1FFE, $1FA4, $1F4A, $1EF1, $1E98, $1E40
	    DECLE   $1DE8, $1D91, $1D3A, $1CE4, $1C8E, $1C39, $1BE4, $1B90
	    DECLE   $1B3C, $1AE9, $1A96, $1A44, $19F2, $19A1, $1950, $1900
	    DECLE   $18B0, $1861, $1812, $17C4, $1776, $1729, $16DC, $1690
	    DECLE   $1644, $15F9, $15AE, $1564, $151A, $14D1, $1488, $1440
	    DECLE   $13F8, $13B1, $136A, $1324, $12DE, $1299, $1254, $1210
	    DECLE   $11CC, $1189, $1146, $1104, $10C2, $1081, $1040, $1000
	    DECLE   $0FC0, $0F81, $0F42, $0F04, $0EC6, $0E89, $0E4C, $0E10
	    DECLE   $0DD4, $0D99, $0D5E, $0D24, $0CEA, $0CB1, $0C78, $0C40
	    DECLE   $0C08, $0BD1, $0B9A, $0B64, $0B2E, $0AF9, $0AC4, $0A90
	    DECLE   $0A5C, $0A29, $09F6, $09C4, $0992, $0961, $0930, $0900
	    DECLE   $08D0, $08A1, $0872, $0844, $0816, $07E9, $07BC, $0790
	    DECLE   $0764, $0739, $070E, $06E4, $06BA, $0691, $0668, $0640
	    DECLE   $0618, $05F1, $05CA, $05A4, $057E, $0559, $0534, $0510
	    DECLE   $04EC, $04C9, $04A6, $0484, $0462, $0441, $0420, $0400
	    DECLE   $03E0, $03C1, $03A2, $0384, $0366, $0349, $032C, $0310
	    DECLE   $02F4, $02D9, $02BE, $02A4, $028A, $0271, $0258, $0240
	    DECLE   $0228, $0211, $01FA, $01E4, $01CE, $01B9, $01A4, $0190
	    DECLE   $017C, $0169, $0156, $0144, $0132, $0121, $0110, $0100
	    DECLE   $00F0, $00E1, $00D2, $00C4, $00B6, $00A9, $009C, $0090
	    DECLE   $0084, $0079, $006E, $0064, $005A, $0051, $0048, $0040
	    DECLE   $0038, $0031, $002A, $0024, $001E, $0019, $0014, $0010
	    DECLE   $000C, $0009, $0006, $0004, $0002, $0001, $0000
@@mid:
	    DECLE   $0000, $0000, $0001, $0002, $0004, $0006, $0009, $000C
	    DECLE   $0010, $0014, $0019, $001E, $0024, $002A, $0031, $0038
	    DECLE   $0040, $0048, $0051, $005A, $0064, $006E, $0079, $0084
	    DECLE   $0090, $009C, $00A9, $00B6, $00C4, $00D2, $00E1, $00F0
	    DECLE   $0100, $0110, $0121, $0132, $0144, $0156, $0169, $017C
	    DECLE   $0190, $01A4, $01B9, $01CE, $01E4, $01FA, $0211, $0228
	    DECLE   $0240, $0258, $0271, $028A, $02A4, $02BE, $02D9, $02F4
	    DECLE   $0310, $032C, $0349, $0366, $0384, $03A2, $03C1, $03E0
	    DECLE   $0400, $0420, $0441, $0462, $0484, $04A6, $04C9, $04EC
	    DECLE   $0510, $0534, $0559, $057E, $05A4, $05CA, $05F1, $0618
	    DECLE   $0640, $0668, $0691, $06BA, $06E4, $070E, $0739, $0764
	    DECLE   $0790, $07BC, $07E9, $0816, $0844, $0872, $08A1, $08D0
	    DECLE   $0900, $0930, $0961, $0992, $09C4, $09F6, $0A29, $0A5C
	    DECLE   $0A90, $0AC4, $0AF9, $0B2E, $0B64, $0B9A, $0BD1, $0C08
	    DECLE   $0C40, $0C78, $0CB1, $0CEA, $0D24, $0D5E, $0D99, $0DD4
	    DECLE   $0E10, $0E4C, $0E89, $0EC6, $0F04, $0F42, $0F81, $0FC0
	    DECLE   $1000, $1040, $1081, $10C2, $1104, $1146, $1189, $11CC
	    DECLE   $1210, $1254, $1299, $12DE, $1324, $136A, $13B1, $13F8
	    DECLE   $1440, $1488, $14D1, $151A, $1564, $15AE, $15F9, $1644
	    DECLE   $1690, $16DC, $1729, $1776, $17C4, $1812, $1861, $18B0
	    DECLE   $1900, $1950, $19A1, $19F2, $1A44, $1A96, $1AE9, $1B3C
	    DECLE   $1B90, $1BE4, $1C39, $1C8E, $1CE4, $1D3A, $1D91, $1DE8
	    DECLE   $1E40, $1E98, $1EF1, $1F4A, $1FA4, $1FFE, $2059, $20B4
	    DECLE   $2110, $216C, $21C9, $2226, $2284, $22E2, $2341, $23A0
	    DECLE   $2400, $2460, $24C1, $2522, $2584, $25E6, $2649, $26AC
	    DECLE   $2710, $2774, $27D9, $283E, $28A4, $290A, $2971, $29D8
	    DECLE   $2A40, $2AA8, $2B11, $2B7A, $2BE4, $2C4E, $2CB9, $2D24
	    DECLE   $2D90, $2DFC, $2E69, $2ED6, $2F44, $2FB2, $3021, $3090
	    DECLE   $3100, $3170, $31E1, $3252, $32C4, $3336, $33A9, $341C
	    DECLE   $3490, $3504, $3579, $35EE, $3664, $36DA, $3751, $37C8
	    DECLE   $3840, $38B8, $3931, $39AA, $3A24, $3A9E, $3B19, $3B94
	    DECLE   $3C10, $3C8C, $3D09, $3D86, $3E04, $3E82, $3F01, $3F80
	    DECLE   $4000, $4080, $4101, $4182, $4204, $4286, $4309, $438C
	    DECLE   $4410, $4494, $4519, $459E, $4624, $46AA, $4731, $47B8
	    DECLE   $4840, $48C8, $4951, $49DA, $4A64, $4AEE, $4B79, $4C04
	    DECLE   $4C90, $4D1C, $4DA9, $4E36, $4EC4, $4F52, $4FE1, $5070
	    DECLE   $5100, $5190, $5221, $52B2, $5344, $53D6, $5469, $54FC
	    DECLE   $5590, $5624, $56B9, $574E, $57E4, $587A, $5911, $59A8
	    DECLE   $5A40, $5AD8, $5B71, $5C0A, $5CA4, $5D3E, $5DD9, $5E74
	    DECLE   $5F10, $5FAC, $6049, $60E6, $6184, $6222, $62C1, $6360
	    DECLE   $6400, $64A0, $6541, $65E2, $6684, $6726, $67C9, $686C
	    DECLE   $6910, $69B4, $6A59, $6AFE, $6BA4, $6C4A, $6CF1, $6D98
	    DECLE   $6E40, $6EE8, $6F91, $703A, $70E4, $718E, $7239, $72E4
	    DECLE   $7390, $743C, $74E9, $7596, $7644, $76F2, $77A1, $7850
	    DECLE   $7900, $79B0, $7A61, $7B12, $7BC4, $7C76, $7D29, $7DDC
	    DECLE   $7E90, $7F44, $7FF9, $80AE, $8164, $821A, $82D1, $8388
	    DECLE   $8440, $84F8, $85B1, $866A, $8724, $87DE, $8899, $8954
	    DECLE   $8A10, $8ACC, $8B89, $8C46, $8D04, $8DC2, $8E81, $8F40
	    DECLE   $9000, $90C0, $9181, $9242, $9304, $93C6, $9489, $954C
	    DECLE   $9610, $96D4, $9799, $985E, $9924, $99EA, $9AB1, $9B78
	    DECLE   $9C40, $9D08, $9DD1, $9E9A, $9F64, $A02E, $A0F9, $A1C4
	    DECLE   $A290, $A35C, $A429, $A4F6, $A5C4, $A692, $A761, $A830
	    DECLE   $A900, $A9D0, $AAA1, $AB72, $AC44, $AD16, $ADE9, $AEBC
	    DECLE   $AF90, $B064, $B139, $B20E, $B2E4, $B3BA, $B491, $B568
	    DECLE   $B640, $B718, $B7F1, $B8CA, $B9A4, $BA7E, $BB59, $BC34
	    DECLE   $BD10, $BDEC, $BEC9, $BFA6, $C084, $C162, $C241, $C320
	    DECLE   $C400, $C4E0, $C5C1, $C6A2, $C784, $C866, $C949, $CA2C
	    DECLE   $CB10, $CBF4, $CCD9, $CDBE, $CEA4, $CF8A, $D071, $D158
	    DECLE   $D240, $D328, $D411, $D4FA, $D5E4, $D6CE, $D7B9, $D8A4
	    DECLE   $D990, $DA7C, $DB69, $DC56, $DD44, $DE32, $DF21, $E010
	    DECLE   $E100, $E1F0, $E2E1, $E3D2, $E4C4, $E5B6, $E6A9, $E79C
	    DECLE   $E890, $E984, $EA79, $EB6E, $EC64, $ED5A, $EE51, $EF48
	    DECLE   $F040, $F138, $F231, $F32A, $F424, $F51E, $F619, $F714
	    DECLE   $F810, $F90C, $FA09, $FB06, $FC04, $FD02, $FE01
	    ENDP

; R0 = R0 * R1, where R0 and R1 are unsigned 8-bit values
; Destroys R1, R4
qs_mpy8:    PROC
	    MOVR    R0,	     R4      ;   6
	    ADDI    #QSQR8_TBL.mid, R1      ;   8
	    ADDR    R1,	     R4      ;   6   a + b
	    SUBR    R0,	     R1      ;   6   a - b
@@ok:       MVI@    R4,	     R0      ;   8
	    SUB@    R1,	     R0      ;   8
	    JR      R5		      ;   7
					    ;----
					    ;  49
	    ENDP
	    

; R1 = R0 * R1, where R0 and R1 are 16-bit values
; destroys R0, R2, R3, R4, R5
qs_mpy16:   PROC
	    PSHR    R5		  ;   9
				   
	    ; Unpack lo/hi
	    MOVR    R0,	 R2      ;   6   
	    ANDI    #$FF,       R0      ;   8   R0 is lo(a)
	    XORR    R0,	 R2      ;   6   
	    SWAP    R2		  ;   6   R2 is hi(a)

	    MOVR    R1,	 R3      ;   6   R3 is orig 16-bit b
	    ANDI    #$FF,       R1      ;   8   R1 is lo(b)
	    MOVR    R1,	 R5      ;   6   R5 is lo(b)
	    XORR    R1,	 R3      ;   6   
	    SWAP    R3		  ;   6   R3 is hi(b)
					;----
					;  67
					
	    ; lo * lo		   
	    MOVR    R0,	 R4      ;   6   R4 is lo(a)
	    ADDI    #QSQR8_TBL.mid, R1  ;   8
	    ADDR    R1,	 R4      ;   6   R4 = lo(a) + lo(b)
	    SUBR    R0,	 R1      ;   6   R1 = lo(a) - lo(b)
					
@@pos_ll:   MVI@    R4,	 R4      ;   8   R4 = qstbl[lo(a)+lo(b)]
	    SUB@    R1,	 R4      ;   8   R4 = lo(a)*lo(b)
					;----
					;  42
					;  67 (carried forward)
					;----
					; 109
				       
	    ; lo * hi		  
	    MOVR    R0,	 R1      ;   6   R0 = R1 = lo(a)
	    ADDI    #QSQR8_TBL.mid, R3  ;   8
	    ADDR    R3,	 R1      ;   6   R1 = hi(b) + lo(a)
	    SUBR    R0,	 R3      ;   6   R3 = hi(b) - lo(a)
				       
@@pos_lh:   MVI@    R1,	 R1      ;   8   R1 = qstbl[hi(b)-lo(a)]
	    SUB@    R3,	 R1      ;   8   R1 = lo(a)*hi(b)
					;----
					;  42
					; 109 (carried forward)
					;----
					; 151
				       
	    ; hi * lo		  
	    MOVR    R5,	 R0      ;   6   R5 = R0 = lo(b)
	    ADDI    #QSQR8_TBL.mid, R2  ;   8
	    ADDR    R2,	 R5      ;   6   R3 = hi(a) + lo(b)
	    SUBR    R0,	 R2      ;   6   R2 = hi(a) - lo(b)
				       
@@pos_hl:   ADD@    R5,	 R1      ;   8   \_ R1 = lo(a)*hi(b)+hi(a)*lo(b)
	    SUB@    R2,	 R1      ;   8   /
					;----
					;  42
					; 151 (carried forward)
					;----
					; 193
				       
	    SWAP    R1		  ;   6   \_ shift upper product left 8
	    ANDI    #$FF00,     R1      ;   8   /
	    ADDR    R4,	 R1      ;   6   final product
	    PULR    PC		  ;  12
					;----
					;  32
					; 193 (carried forward)
					;----
					; 225
	    ENDP

	ENDI

	IF intybasic_fastdiv

; Fast unsigned division/remainder
; Assembly code by Oscar Toledo G. Jul/10/2015
; Released to public domain.

	; Ultrafast unsigned division/remainder operation
	; Entry: R0 = Dividend
	;	R1 = Divisor
	; Output: R0 = Quotient
	;	 R2 = Remainder
	; Worst case: 6 + 6 + 9 + 496 = 517 cycles
	; Best case: 6 + (6 + 7) * 16 = 214 cycles

uf_udiv16:	PROC
	CLRR R2		; 6
	SLLC R0,1	; 6
	BC @@1		; 7/9
	SLLC R0,1	; 6
	BC @@2		; 7/9
	SLLC R0,1	; 6
	BC @@3		; 7/9
	SLLC R0,1	; 6
	BC @@4		; 7/9
	SLLC R0,1	; 6
	BC @@5		; 7/9
	SLLC R0,1	; 6
	BC @@6		; 7/9
	SLLC R0,1	; 6
	BC @@7		; 7/9
	SLLC R0,1	; 6
	BC @@8		; 7/9
	SLLC R0,1	; 6
	BC @@9		; 7/9
	SLLC R0,1	; 6
	BC @@10		; 7/9
	SLLC R0,1	; 6
	BC @@11		; 7/9
	SLLC R0,1	; 6
	BC @@12		; 7/9
	SLLC R0,1	; 6
	BC @@13		; 7/9
	SLLC R0,1	; 6
	BC @@14		; 7/9
	SLLC R0,1	; 6
	BC @@15		; 7/9
	SLLC R0,1	; 6
	BC @@16		; 7/9
	JR R5

@@1:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@2:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@3:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@4:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@5:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@6:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@7:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@8:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@9:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@10:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@11:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@12:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@13:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@14:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@15:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
@@16:	RLC R2,1	; 6
	CMPR R1,R2	; 6
	BNC $+3		; 7/9
	SUBR R1,R2	; 6
	RLC R0,1	; 6
	JR R5
	
	ENDP

	ENDI

	ROM.End

	ROM.OutputRomStats

	ORG $200,$200,"-RWB"

Q2:	; Reserved label for #BACKTAB

	;
	; 16-bits variables
	; Note IntyBASIC variables grow up starting in $308.
	;

BASE_16BIT_SYSTEM_VARS: QSET $33f
    IF intybasic_voice
BASE_16BIT_SYSTEM_VARS: QSET BASE_16BIT_SYSTEM_VARS-10
    ENDI
    IF intybasic_col
BASE_16BIT_SYSTEM_VARS: QSET BASE_16BIT_SYSTEM_VARS-8
    ENDI
    IF intybasic_scroll
BASE_16BIT_SYSTEM_VARS: QSET BASE_16BIT_SYSTEM_VARS-20
    ENDI

	ORG BASE_16BIT_SYSTEM_VARS,BASE_16BIT_SYSTEM_VARS,"-RWB"

    IF intybasic_voice
IV.Q:      RMB 8    ; IV_xxx	16-bit	  Voice queue  (8 words)
IV.FPTR:   RMB 1    ; IV_xxx	16-bit	  Current FIFO ptr.
IV.PPTR:   RMB 1    ; IV_xxx	16-bit	  Current Phrase ptr.
    ENDI
    IF intybasic_col
_col0:      RMB 1       ; Collision status for MOB0
_col1:      RMB 1       ; Collision status for MOB1
_col2:      RMB 1       ; Collision status for MOB2
_col3:      RMB 1       ; Collision status for MOB3
_col4:      RMB 1       ; Collision status for MOB4
_col5:      RMB 1       ; Collision status for MOB5
_col6:      RMB 1       ; Collision status for MOB6
_col7:      RMB 1       ; Collision status for MOB7
    ENDI
    IF intybasic_scroll
_scroll_buffer: RMB 20  ; Sometimes this is unused
    ENDI
_music_gosub:	RMB 1	; GOSUB pointer
_music_table:	RMB 1	; Note table
_music_p:	RMB 1	; Pointer to music
_frame:		RMB 1   ; Current frame
_read:		RMB 1   ; Pointer to DATA
_gram_bitmap:   RMB 1   ; Bitmap for definition
_gram2_bitmap:  RMB 1   ; Secondary bitmap for definition
_screen:	RMB 1	; Pointer to current screen position
_color:		RMB 1	; Current color

Q1:			; Reserved label for #MOBSHADOW
_mobs:      RMB 3*8     ; MOB buffer

SCRATCH:    ORG $100,$100,"-RWBN"
	;
	; 8-bits variables
	;
ISRVEC:     RMB 2       ; Pointer to ISR vector (required by Intellivision ROM)
_int:       RMB 1       ; Signals interrupt received
_ntsc:      RMB 1       ; bit 0 = 1=NTSC, 0=PAL. Bit 1 = 1=ECS detected.
_rand:      RMB 1       ; Pseudo-random value
_gram_target:   RMB 1   ; Contains GRAM card number
_gram_total:    RMB 1   ; Contains total GRAM cards for definition
_gram2_target:  RMB 1   ; Contains GRAM card number
_gram2_total:   RMB 1   ; Contains total GRAM cards for definition
_mode_select:   RMB 1   ; Graphics mode selection
_border_color:  RMB 1   ; Border color
_border_mask:   RMB 1   ; Border mask
    IF intybasic_keypad
_cnt1_p0:   RMB 1       ; Debouncing 1
_cnt1_p1:   RMB 1       ; Debouncing 2
_cnt1_key:  RMB 1       ; Currently pressed key
_cnt2_p0:   RMB 1       ; Debouncing 1
_cnt2_p1:   RMB 1       ; Debouncing 2
_cnt2_key:  RMB 1       ; Currently pressed key
    ENDI
    IF intybasic_scroll
_scroll_x:  RMB 1       ; Scroll X offset
_scroll_y:  RMB 1       ; Scroll Y offset
_scroll_d:  RMB 1       ; Scroll direction
    ENDI
    IF intybasic_music
_music_start:	RMB 2	; Start of music

_music_mode: RMB 1      ; Music mode (0= Not using PSG, 2= Simple, 4= Full, add 1 if using noise channel for drums)
_music_frame: RMB 1     ; Music frame (for 50 hz fixed)
_music_tc:  RMB 1       ; Time counter
_music_t:   RMB 1       ; Time base
_music_i1:  RMB 1       ; Instrument 1 
_music_s1:  RMB 1       ; Sample pointer 1
_music_n1:  RMB 1       ; Note 1
_music_i2:  RMB 1       ; Instrument 2
_music_s2:  RMB 1       ; Sample pointer 2
_music_n2:  RMB 1       ; Note 2
_music_i3:  RMB 1       ; Instrument 3
_music_s3:  RMB 1       ; Sample pointer 3
_music_n3:  RMB 1       ; Note 3
_music_s4:  RMB 1       ; Sample pointer 4
_music_n4:  RMB 1       ; Note 4 (really it's drum)

_music_freq10:	RMB 1   ; Low byte frequency A
_music_freq20:	RMB 1   ; Low byte frequency B
_music_freq30:	RMB 1   ; Low byte frequency C
_music_freq11:	RMB 1   ; High byte frequency A
_music_freq21:	RMB 1   ; High byte frequency B
_music_freq31:	RMB 1   ; High byte frequency C
_music_mix:	RMB 1   ; Mixer
_music_noise:	RMB 1   ; Noise
_music_vol1:	RMB 1   ; Volume A
_music_vol2:	RMB 1   ; Volume B
_music_vol3:	RMB 1   ; Volume C
    ENDI
    IF intybasic_music_ecs
_music_i5:  RMB 1       ; Instrument 5
_music_s5:  RMB 1       ; Sample pointer 5
_music_n5:  RMB 1       ; Note 5
_music_i6:  RMB 1       ; Instrument 6
_music_s6:  RMB 1       ; Sample pointer 6
_music_n6:  RMB 1       ; Note 6
_music_i7:  RMB 1       ; Instrument 7
_music_s7:  RMB 1       ; Sample pointer 7
_music_n7:  RMB 1       ; Note 7
_music_s8:  RMB 1       ; Sample pointer 8
_music_n8:  RMB 1       ; Note 8 (really it's drum)

_music2_freq10:	RMB 1   ; Low byte frequency A
_music2_freq20:	RMB 1   ; Low byte frequency B
_music2_freq30:	RMB 1   ; Low byte frequency C
_music2_freq11:	RMB 1   ; High byte frequency A
_music2_freq21:	RMB 1   ; High byte frequency B
_music2_freq31:	RMB 1   ; High byte frequency C
_music2_mix:	RMB 1   ; Mixer
_music2_noise:	RMB 1   ; Noise
_music2_vol1:	RMB 1   ; Volume A
_music2_vol2:	RMB 1   ; Volume B
_music2_vol3:	RMB 1   ; Volume C
    ENDI
    IF intybasic_music_volume
_music_vol:	RMB 1	; Global music volume
    ENDI
    IF intybasic_voice
IV.QH:     RMB 1    ; IV_xxx	8-bit	   Voice queue head
IV.QT:     RMB 1    ; IV_xxx	8-bit	   Voice queue tail
IV.FLEN:   RMB 1    ; IV_xxx	8-bit	   Length of FIFO data
    ENDI

_SCRATCH:	EQU $

SYSTEM:	ORG $2F0, $2F0, "-RWBN"
STACK:	RMB 24
_SYSTEM:	EQU $
