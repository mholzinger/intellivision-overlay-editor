' SP0256-AL2 Allophone Capture for IntelliVoice Builder
' Plays 61 allophones sequentially (one per VOICE PLAY WAIT call).
' Run with: jzintv -v1 --voicefiles=/tmp/ivc_ <rom> --rompath=~/jzintv/bin
' Creates /tmp/ivc_0000.wav through /tmp/ivc_0060.wav (one per allophone).
'
' Capture order matches ALLOPHONES array in allophonesDict.js:
'  0=PA1  1=PA2  2=PA3  3=PA4  4=PA5
'  5=OY   6=AY   7=EH   8=IH   9=AX  10=IY  11=EY  12=UW1 13=AO  14=AA
' 15=YY2 16=AE1 17=UH  18=UW2 19=AW  20=OW
' 21=KK3 22=PP  23=JH  24=NN1 25=TT2 26=RR1 27=MM  28=TT1 29=DH1 30=DD1
' 31=HH1 32=BB1 33=TH  34=DD2 35=GG3 36=VV  37=GG1 38=ZZ  39=KK2 40=KK1
' 41=NG1 42=FF  43=ZH  44=WH  45=WW  46=LL  47=YY1 48=CH  49=DH2 50=SS
' 51=NN2 52=HH2 53=GG2 54=BB2
' 55=ER1 56=ER2 57=OR2 58=AR  59=YR  60=EL

    VOICE INIT
    ' -- Pauses --
    VOICE PLAY WAIT a00
    VOICE PLAY WAIT a01
    VOICE PLAY WAIT a02
    VOICE PLAY WAIT a03
    VOICE PLAY WAIT a04
    ' -- Vowels --
    VOICE PLAY WAIT a05
    VOICE PLAY WAIT a06
    VOICE PLAY WAIT a07
    VOICE PLAY WAIT a08
    VOICE PLAY WAIT a09
    VOICE PLAY WAIT a10
    VOICE PLAY WAIT a11
    VOICE PLAY WAIT a12
    VOICE PLAY WAIT a13
    VOICE PLAY WAIT a14
    VOICE PLAY WAIT a15
    VOICE PLAY WAIT a16
    VOICE PLAY WAIT a17
    VOICE PLAY WAIT a18
    VOICE PLAY WAIT a19
    VOICE PLAY WAIT a20
    ' -- Consonants --
    VOICE PLAY WAIT a21
    VOICE PLAY WAIT a22
    VOICE PLAY WAIT a23
    VOICE PLAY WAIT a24
    VOICE PLAY WAIT a25
    VOICE PLAY WAIT a26
    VOICE PLAY WAIT a27
    VOICE PLAY WAIT a28
    VOICE PLAY WAIT a29
    VOICE PLAY WAIT a30
    VOICE PLAY WAIT a31
    VOICE PLAY WAIT a32
    VOICE PLAY WAIT a33
    VOICE PLAY WAIT a34
    VOICE PLAY WAIT a35
    VOICE PLAY WAIT a36
    VOICE PLAY WAIT a37
    VOICE PLAY WAIT a38
    VOICE PLAY WAIT a39
    VOICE PLAY WAIT a40
    VOICE PLAY WAIT a41
    VOICE PLAY WAIT a42
    VOICE PLAY WAIT a43
    VOICE PLAY WAIT a44
    VOICE PLAY WAIT a45
    VOICE PLAY WAIT a46
    VOICE PLAY WAIT a47
    VOICE PLAY WAIT a48
    VOICE PLAY WAIT a49
    VOICE PLAY WAIT a50
    VOICE PLAY WAIT a51
    VOICE PLAY WAIT a52
    VOICE PLAY WAIT a53
    VOICE PLAY WAIT a54
    ' -- Special --
    VOICE PLAY WAIT a55
    VOICE PLAY WAIT a56
    VOICE PLAY WAIT a57
    VOICE PLAY WAIT a58
    VOICE PLAY WAIT a59
    VOICE PLAY WAIT a60
done:   GOTO done

' ---- Pause allophones ----
a00:    VOICE PA1,0   ' index 0  code PA1  ~10ms
a01:    VOICE PA2,0   ' index 1  code PA2  ~30ms
a02:    VOICE PA3,0   ' index 2  code PA3  ~50ms
a03:    VOICE PA4,0   ' index 3  code PA4  ~100ms
a04:    VOICE PA5,0   ' index 4  code PA5  ~200ms
' ---- Vowels ----
a05:    VOICE OY,0    ' index 5  code OY   bOY
a06:    VOICE AY,0    ' index 6  code AY   skY
a07:    VOICE EH,0    ' index 7  code EH   End
a08:    VOICE IH,0    ' index 12 code IH   sIt
a09:    VOICE AX,0    ' index 15 code AX   succEss (schwa)
a10:    VOICE IY,0    ' index 19 code IY   sEE
a11:    VOICE EY,0    ' index 20 code EY   dAY
a12:    VOICE UW1,0   ' index 22 code UW1  tO (short oo)
a13:    VOICE AO,0    ' index 23 code AO   hOt
a14:    VOICE AA,0    ' index 24 code AA   fAther
a15:    VOICE YY2,0   ' index 25 code YY2  Year
a16:    VOICE AE1,0   ' index 26 code AE   cAt  (IntyBASIC name: AE1)
a17:    VOICE UH,0    ' index 30 code UH   bOOk
a18:    VOICE UW2,0   ' index 31 code UW2  fOOd (long oo)
a19:    VOICE AW,0    ' index 32 code AW   OUt
a20:    VOICE OW,0    ' index 50 code OW   gO
' ---- Consonants ----
a21:    VOICE KK3,0   ' index 8  code KK3  COmb (hard k)
a22:    VOICE PP,0    ' index 9  code PP   Pow
a23:    VOICE JH,0    ' index 10 code JH   doDGE
a24:    VOICE NN1,0   ' index 11 code NN1  thiN (final n)
a25:    VOICE TT2,0   ' index 13 code TT2  Top (aspirated t)
a26:    VOICE RR1,0   ' index 14 code RR1  Rural
a27:    VOICE MM,0    ' index 16 code MM   Milk
a28:    VOICE TT1,0   ' index 17 code TT1  parT (final t)
a29:    VOICE DH1,0   ' index 18 code DH1  THey (voiced th)
a30:    VOICE DD1,0   ' index 21 code DD1  coulD
a31:    VOICE HH1,0   ' index 27 code HH1  He
a32:    VOICE BB1,0   ' index 28 code BB1  Business
a33:    VOICE TH,0    ' index 29 code TH   THin (unvoiced th)
a34:    VOICE DD2,0   ' index 33 code DD2  Do (initial d)
a35:    VOICE GG3,0   ' index 34 code GG3  wiG (final g)
a36:    VOICE VV,0    ' index 35 code VV   Very
a37:    VOICE GG1,0   ' index 36 code GG1  Got (initial g)
a38:    VOICE ZZ,0    ' index 37 code ZZ   Zoo
a39:    VOICE KK2,0   ' index 38 code KK2  Can't
a40:    VOICE KK1,0   ' index 39 code KK1  CooL
a41:    VOICE NG1,0   ' index 40 code NG   thiNG  (IntyBASIC name: NG1)
a42:    VOICE FF,0    ' index 41 code FF   Food
a43:    VOICE ZH,0    ' index 42 code ZH   aZure
a44:    VOICE WH,0    ' index 43 code WH   WHig
a45:    VOICE WW,0    ' index 44 code WW   Wool
a46:    VOICE LL,0    ' index 45 code LL   Lake
a47:    VOICE YY1,0   ' index 46 code YY1  Yes (initial y)
a48:    VOICE CH,0    ' index 47 code CH   CHurch
a49:    VOICE DH2,0   ' index 51 code DH2  THe (light voiced th)
a50:    VOICE SS,0    ' index 52 code SS   veSt
a51:    VOICE NN2,0   ' index 53 code NN2  No (initial n)
a52:    VOICE HH2,0   ' index 54 code HH2  He (variant)
a53:    VOICE GG2,0   ' index 58 code GG2  Got (variant)
a54:    VOICE BB2,0   ' index 60 code BB2  Business (variant)
' ---- Special ----
a55:    VOICE ER1,0   ' index 48 code ER1  fEar (r-colored)
a56:    VOICE ER2,0   ' index 49 code ER2  bURn
a57:    VOICE OR2,0   ' index 55 code OR   stORe  (IntyBASIC name: OR2)
a58:    VOICE AR,0    ' index 56 code AR   alARm
a59:    VOICE YR,0    ' index 57 code YR   EAR
a60:    VOICE EL,0    ' index 59 code EL   saddLE (syllabic l)
