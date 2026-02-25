/**
 * allophonesDict.js — SP0256-AL2 Allophone Reference
 *
 * 64 allophones indexed by their ALD (Address Load) value.
 * Each entry: { index, code, desc, group }
 *
 * ALD index N → allophone N in the SP0256-AL2 ROM.
 * Indices verified against:
 *   1. GI SP0256-AL2 datasheet (primary authority)
 *   2. MAME sp0256.cpp allophone table (cross-reference)
 *   3. ROM execution trace + full synthesis survey (empirical confirmation)
 *
 * Key corrections vs. earlier versions:
 *   - ALDs 37-42: ZZ, KK2, KK1, NG, FF, ZH  (not SH/ZH/RR2/FF/KK2/KK1)
 *   - ALDs 43-47: WH, WW, LL, YY1, CH        (stub allophones, need ext. ROM)
 *   - ALD 50    : OW  (not CH — the real 1565ms OW vowel is here)
 *   - ALD 53    : NN2 (not OW — OW was NEVER at 53)
 *   - Removed   : SH (not in SP0256-AL2; use ZH), RR2, XR
 *   - ALDs 61-63: undefined (removed)
 */

export const ALLOPHONES = [
    // ── Pauses ──────────────────────────────────────────────────────────────────
    { index:  0, code: 'PA1', desc: 'Pause ~10ms',              group: 'pause'     },
    { index:  1, code: 'PA2', desc: 'Pause ~30ms',              group: 'pause'     },
    { index:  2, code: 'PA3', desc: 'Pause ~50ms',              group: 'pause'     },
    { index:  3, code: 'PA4', desc: 'Pause ~100ms',             group: 'pause'     },
    { index:  4, code: 'PA5', desc: 'Pause ~200ms',             group: 'pause'     },

    // ── Vowels ───────────────────────────────────────────────────────────────────
    { index:  5, code: 'OY',  desc: '"bOY"',                    group: 'vowel'     },
    { index:  6, code: 'AY',  desc: '"skY"',                    group: 'vowel'     },
    { index:  7, code: 'EH',  desc: '"End"',                    group: 'vowel'     },
    { index: 12, code: 'IH',  desc: '"sIt"',                    group: 'vowel'     },
    { index: 15, code: 'AX',  desc: '"succEss" (schwa)',        group: 'vowel'     },
    { index: 19, code: 'IY',  desc: '"sEE"',                    group: 'vowel'     },
    { index: 20, code: 'EY',  desc: '"dAY"',                    group: 'vowel'     },
    { index: 22, code: 'UW1', desc: '"tO" (short oo)',          group: 'vowel'     },
    { index: 23, code: 'AO',  desc: '"hOt"',                    group: 'vowel'     },
    { index: 24, code: 'AA',  desc: '"fAther"',                 group: 'vowel'     },
    { index: 25, code: 'YY2', desc: '"Year"',                   group: 'vowel'     },
    { index: 26, code: 'AE',  desc: '"cAt"',                    group: 'vowel'     },
    { index: 30, code: 'UH',  desc: '"bOOk"',                   group: 'vowel'     },
    { index: 31, code: 'UW2', desc: '"fOOd" (long oo)',         group: 'vowel'     },
    { index: 32, code: 'AW',  desc: '"OUt"',                    group: 'vowel'     },
    { index: 50, code: 'OW',  desc: '"gO"',                     group: 'vowel'     },

    // ── Consonants ───────────────────────────────────────────────────────────────
    { index:  8, code: 'KK3', desc: '"COmb" (hard k)',          group: 'consonant' },
    { index:  9, code: 'PP',  desc: '"Pow"',                    group: 'consonant' },
    { index: 10, code: 'JH',  desc: '"doDGE"',                  group: 'consonant' },
    { index: 11, code: 'NN1', desc: '"thiN" (final n)',         group: 'consonant' },
    { index: 13, code: 'TT2', desc: '"Top" (aspirated t)',      group: 'consonant' },
    { index: 14, code: 'RR1', desc: '"Rural"',                  group: 'consonant' },
    { index: 16, code: 'MM',  desc: '"Milk"',                   group: 'consonant' },
    { index: 17, code: 'TT1', desc: '"parT" (final t)',         group: 'consonant' },
    { index: 18, code: 'DH1', desc: '"THey" (voiced th)',       group: 'consonant' },
    { index: 21, code: 'DD1', desc: '"coulD"',                  group: 'consonant' },
    { index: 27, code: 'HH1', desc: '"He"',                     group: 'consonant' },
    { index: 28, code: 'BB1', desc: '"Business"',               group: 'consonant' },
    { index: 29, code: 'TH',  desc: '"THin" (unvoiced th)',     group: 'consonant' },
    { index: 33, code: 'DD2', desc: '"Do" (initial d)',         group: 'consonant' },
    { index: 34, code: 'GG3', desc: '"wiG" (final g)',          group: 'consonant' },
    { index: 35, code: 'VV',  desc: '"Very"',                   group: 'consonant' },
    { index: 36, code: 'GG1', desc: '"Got" (initial g)',        group: 'consonant' },
    { index: 37, code: 'ZZ',  desc: '"Zoo"',                    group: 'consonant' },
    { index: 38, code: 'KK2', desc: '"Can\'t"',                 group: 'consonant' },
    { index: 39, code: 'KK1', desc: '"CooL"',                   group: 'consonant' },
    { index: 40, code: 'NG',  desc: '"thiNG"',                  group: 'consonant' },
    { index: 41, code: 'FF',  desc: '"Food"',                   group: 'consonant' },
    { index: 42, code: 'ZH',  desc: '"aZure" / approx SH',     group: 'consonant' },
    { index: 43, code: 'WH',  desc: '"WHig" (stub)',            group: 'consonant' },
    { index: 44, code: 'WW',  desc: '"Wool" (stub)',            group: 'consonant' },
    { index: 45, code: 'LL',  desc: '"Lake" (stub)',            group: 'consonant' },
    { index: 46, code: 'YY1', desc: '"Yes" (initial y, stub)', group: 'consonant' },
    { index: 47, code: 'CH',  desc: '"CHurch" (stub)',          group: 'consonant' },
    { index: 51, code: 'DH2', desc: '"THe" (light voiced th)', group: 'consonant' },
    { index: 52, code: 'SS',  desc: '"veSt" (stub)',            group: 'consonant' },
    { index: 53, code: 'NN2', desc: '"No" (initial n)',         group: 'consonant' },
    { index: 54, code: 'HH2', desc: '"He" (variant)',           group: 'consonant' },
    { index: 58, code: 'GG2', desc: '"Got" (variant)',          group: 'consonant' },
    { index: 60, code: 'BB2', desc: '"Business" (variant)',     group: 'consonant' },

    // ── Special (r-colored vowels and syllabics) ─────────────────────────────────
    { index: 48, code: 'ER1', desc: '"fEar" (r-colored)',       group: 'special'   },
    { index: 49, code: 'ER2', desc: '"bURn"',                   group: 'special'   },
    { index: 55, code: 'OR',  desc: '"stORe"',                  group: 'special'   },
    { index: 56, code: 'AR',  desc: '"alARm"',                  group: 'special'   },
    { index: 57, code: 'YR',  desc: '"EAR"',                    group: 'special'   },
    { index: 59, code: 'EL',  desc: '"saddLE" (syllabic l)',    group: 'special'   },
];

// Sorted by index for O(1) lookup
export const ALLOPHONE_BY_INDEX = new Array(64).fill(null);
for (const a of ALLOPHONES) {
    ALLOPHONE_BY_INDEX[a.index] = a;
}

// Lookup by code string
export const ALLOPHONE_BY_CODE = {};
for (const a of ALLOPHONES) {
    ALLOPHONE_BY_CODE[a.code] = a;
}

// ============================================================================
//  PREVIEW SUBSTITUTION TABLE
//
//  Many SP0256-AL2 allophones require external cartridge ROM pages (4, 5, 6)
//  that the browser synthesizer does not have loaded.  When those JSR targets
//  fall on missing pages, sp0256.js decodes zeros as an immediate RTS, so the
//  formant interpolation subroutines are silently skipped.  The allophone still
//  runs for its full duration (from internal repeat counters) but sounds wrong.
//
//  Maps real ALD index → synthesizable substitute for PREVIEW AUDIO ONLY.
//  The VOICE output always uses the real ALD index.
//
//  Stubs (≤128 internal samples): 43 WH, 44 WW, 45 LL, 46 YY1, 47 CH
//  Near-stub (~6ms):              52 SS
//  External-ROM formant bodies:   48 ER1, 49 ER2, 50 OW, 51 DH2, 54 HH2,
//                                 55 OR, 57 YR, 58 GG2, 60 BB2
//  Very short internal:           56 AR (~19ms)
// ============================================================================
export const ALLOPHONE_PREVIEW_ALD = {
    43: 27,  // WH  (stub, 13ms)       → HH1 (aspirated approximation)
    44: 30,  // WW  (stub, 13ms)       → UH  (lip-rounded approximation)
    45: 14,  // LL  (stub, 13ms)       → RR1 (liquid approximation)
    46: 25,  // YY1 (stub, 13ms)       → YY2 (same glide, internal ROM)
    47: 10,  // CH  (stub, 13ms)       → JH  (voiced affricate approximation)
    48: 14,  // ER1 (ext. ROM needed)  → RR1 (r-colored approximation)
    49: 14,  // ER2 (ext. ROM needed)  → RR1 (r-colored approximation)
    50: 23,  // OW  (ext. ROM needed)  → AO  (back vowel; "hot" ≈ "go" in preview)
    51: 18,  // DH2 (ext. ROM needed)  → DH1 (same voiced-th, internal ROM)
    52: 37,  // SS  (stub, ~6ms)       → ZZ  (voiced sibilant approximation)
    54: 27,  // HH2 (ext. ROM needed)  → HH1 (same aspirate class)
    55: 23,  // OR  (ext. ROM needed)  → AO  (back vowel approximation)
    56: 24,  // AR  (19ms, too short)  → AA  (open vowel approximation)
    57: 14,  // YR  (ext. ROM needed)  → RR1 (r-colored approximation)
    58: 36,  // GG2 (ext. ROM needed)  → GG1 (same velar stop class)
    60: 28,  // BB2 (ext. ROM needed)  → BB1 (same bilabial stop class)
};

// Grouped for UI rendering
export const ALLOPHONE_GROUPS = [
    { label: 'Pauses',     key: 'pause'     },
    { label: 'Vowels',     key: 'vowel'     },
    { label: 'Consonants', key: 'consonant' },
    { label: 'Special',    key: 'special'   },
];

// ============================================================================
//  WORD LOOKUP TABLE
//  Common Intellivision game vocabulary → allophone sequences.
//
//  Notes on allophone choices:
//  - SH does not exist in SP0256-AL2; use ZH (palatal fricative) instead
//  - OW = long-O as in "go" — ALD 50 (1565ms vowel, real hardware)
//  - ZZ = voiced S as in "zoo" — ALD 37 (433ms, full internal ROM)
//  - LL, WH, WW, YY1, CH, SS require external ROM; preview uses substitutes
//  - Vowel guide: AO="hOt", AW="OUt"/ow-in-cow, OW="gO"/long-o diphthong
// ============================================================================
export const WORD_LOOKUP = {
    // ── Pauses / control ────────────────────────────────────
    'pause':     ['PA2'],
    'short':     ['PA1'],
    'long':      ['PA5'],

    // ── Numbers ─────────────────────────────────────────────
    'zero':      ['ZZ','IY','RR1','OW'],
    'one':       ['WW','AX','NN1'],
    'two':       ['TT2','UW2'],
    'three':     ['TH','RR1','IY'],
    'four':      ['FF','AO','RR1'],
    'five':      ['FF','AY','VV'],
    'six':       ['SS','IH','KK3','SS'],
    'seven':     ['SS','EH','VV','AX','NN1'],
    'eight':     ['EY','TT1'],
    'nine':      ['NN1','AY','NN1'],
    'ten':       ['TT2','EH','NN1'],
    'eleven':    ['IH','LL','EH','VV','AX','NN1'],
    'twelve':    ['TT2','WW','EH','LL','VV'],
    'thirteen':  ['TH','ER2','TT2','IY','NN1'],
    'fourteen':  ['FF','AO','RR1','TT2','IY','NN1'],
    'fifteen':   ['FF','IH','FF','TT2','IY','NN1'],
    'sixteen':   ['SS','IH','KK3','SS','TT2','IY','NN1'],
    'twenty':    ['TT2','WW','EH','NN1','TT1','IY'],
    'hundred':   ['HH1','AX','NN1','DD1','RR1','AX','DD1'],
    'thousand':  ['TH','AO','ZZ','AX','NN1','DD1'],

    // ── Greetings / responses ───────────────────────────────
    'hello':     ['HH1','EH','LL','OW'],
    'hi':        ['HH1','AY'],
    'bye':       ['BB1','AY'],
    'yes':       ['YY1','EH','SS'],
    'no':        ['NN2','OW'],
    'okay':      ['AO','KK3','EY'],
    'good':      ['GG1','UH','DD1'],
    'bad':       ['BB1','AE','DD1'],
    'great':     ['GG1','RR1','EY','TT1'],
    'nice':      ['NN2','AY','SS'],
    'well':      ['WW','EH','LL'],
    'help':      ['HH1','EH','LL','PP'],

    // ── Common short words ──────────────────────────────────
    'the':       ['DH2','AX'],
    'a':         ['AX'],
    'an':        ['AX','NN1'],
    'and':       ['AE','NN1','DD1'],
    'or':        ['OR'],
    'not':       ['NN1','AO','TT1'],
    'in':        ['IH','NN1'],
    'on':        ['AO','NN1'],
    'up':        ['AX','PP'],
    'by':        ['BB1','AY'],
    'with':      ['WW','IH','TH'],
    'at':        ['AE','TT1'],
    'for':       ['FF','AO','RR1'],
    'of':        ['AX','VV'],
    'to':        ['TT2','UW2'],
    'my':        ['MM','AY'],
    'your':      ['YY1','OR'],
    'you':       ['YY1','UW2'],
    'we':        ['WW','IY'],
    'are':       ['AR'],
    'is':        ['IH','ZZ'],
    'it':        ['IH','TT1'],
    'be':        ['BB1','IY'],
    'do':        ['DD1','UW2'],
    'can':       ['KK3','AE','NN1'],

    // ── Game flow ───────────────────────────────────────────
    'fire':      ['FF','AY','ER1'],
    'player':    ['PP','LL','EY','ER1'],
    'press':     ['PP','RR1','EH','SS'],
    'enter':     ['EH','NN1','TT1','ER1'],
    'game':      ['GG1','EY','MM'],
    'over':      ['OW','VV','ER1'],
    'score':     ['SS','KK3','AO','RR1'],
    'level':     ['LL','EH','VV','AX','LL'],
    'play':      ['PP','LL','EY'],
    'start':     ['SS','TT2','AA','RR1','TT1'],
    'ready':     ['RR1','EH','DD1','IY'],
    'go':        ['GG1','OW'],
    'stop':      ['SS','TT2','AO','PP'],
    'win':       ['WW','IH','NN1'],
    'winner':    ['WW','IH','NN1','ER1'],
    'lose':      ['LL','UW2','ZZ'],
    'loser':     ['LL','UW2','ZZ','ER1'],
    'hit':       ['HH1','IH','TT1'],
    'miss':      ['MM','IH','SS'],
    'bonus':     ['BB1','OW','NN1','AX','SS'],
    'points':    ['PP','OY','NN1','TT1','SS'],
    'point':     ['PP','OY','NN1','TT1'],
    'high':      ['HH1','AY'],
    'next':      ['NN1','EH','KK3','SS','TT1'],
    'reset':     ['RR1','IH','SS','EH','TT1'],
    'quit':      ['KK3','IH','TT1'],
    'save':      ['SS','EY','VV'],
    'load':      ['LL','OW','DD1'],
    'select':    ['SS','IH','LL','EH','KK3','TT1'],
    'choose':    ['CH','UW2','ZZ'],
    'try':       ['TT2','RR1','AY'],
    'again':     ['AX','GG1','EH','NN1'],
    'new':       ['NN2','UW2'],
    'round':     ['RR1','AW','NN1','DD1'],
    'stage':     ['SS','TT2','EY','JH'],
    'wave':      ['WW','AY','VV'],
    'zone':      ['ZZ','OW','NN1'],
    'time':      ['TT2','AY','MM'],
    'life':      ['LL','AY','FF'],
    'lives':     ['LL','AY','VV','ZZ'],
    'extra':     ['EH','KK3','SS','TT2','RR1','AX'],
    'free':      ['FF','RR1','IY'],
    'speed':     ['SS','PP','IY','DD1'],
    'fast':      ['FF','AE','SS','TT1'],
    'slow':      ['SS','LL','OW'],
    'power':     ['PP','AW','ER1'],
    'energy':    ['EH','NN1','ER2','JH','IY'],
    'shield':    ['ZH','IY','LL','DD1'],
    'armor':     ['AR','MM','ER2'],
    'health':    ['HH1','EH','LL','TH'],
    'dead':      ['DD1','EH','DD1'],
    'death':     ['DD1','EH','TH'],
    'kill':      ['KK3','IH','LL'],
    'die':       ['DD1','AY'],

    // ── Actions ─────────────────────────────────────────────
    'run':       ['RR1','AX','NN1'],
    'jump':      ['JH','AX','MM','PP'],
    'shoot':     ['ZH','UW2','TT1'],
    'throw':     ['TH','RR1','AO'],
    'drop':      ['DD1','RR1','AO','PP'],
    'catch':     ['KK3','AE','CH'],
    'get':       ['GG1','EH','TT1'],
    'take':      ['TT2','EY','KK3'],
    'use':       ['YY1','UW2','ZZ'],
    'move':      ['MM','UW2','VV'],
    'turn':      ['TT2','ER2','NN1'],
    'push':      ['PP','UH','ZH'],
    'pull':      ['PP','UH','LL'],
    'dodge':     ['DD1','AO','JH'],
    'open':      ['AO','PP','AX','NN1'],
    'close':     ['KK3','LL','OW','ZZ'],
    'hold':      ['HH1','OW','LL','DD1'],
    'block':     ['BB1','LL','AO','KK3'],

    // ── Directions ──────────────────────────────────────────
    'left':      ['LL','EH','VV','TT1'],
    'right':     ['RR1','AY','TT1'],
    'down':      ['DD1','AO','NN1'],
    'north':     ['NN1','AO','RR1','TH'],
    'south':     ['SS','AO','TH'],
    'east':      ['IY','SS','TT1'],
    'west':      ['WW','EH','SS','TT1'],
    'forward':   ['FF','AO','RR1','WW','ER2','DD1'],
    'back':      ['BB1','AE','KK3'],

    // ── Combat / space game ─────────────────────────────────
    'mattel':    ['MM','AE','TT2','AX','LL'],
    'intellivision': ['IH','NN1','TT2','EH','LL','IH','VV','IH','SS','AX','NN1'],
    'activate':  ['AE','KK3','TT2','IH','VV','EY','TT1'],
    'attack':    ['AX','TT2','AE','KK3'],
    'defend':    ['DD1','IH','VV','EH','NN1','DD1'],
    'launch':    ['LL','AO','NN1','CH'],
    'warning':   ['WW','AO','RR1','NN1','IH','NG'],
    'danger':    ['DD1','EY','NN1','JH','ER1'],
    'mission':   ['MM','IH','ZH','AX','NN1'],
    'complete':  ['KK3','AX','MM','PP','LL','IY','TT1'],
    'target':    ['TT2','AR','GG1','IH','TT1'],
    'enemy':     ['EH','NN1','AX','MM','IY'],
    'base':      ['BB1','EY','SS'],
    'sector':    ['SS','EH','KK3','TT2','ER1'],
    'battle':    ['BB1','AE','TT2','AX','LL'],
    'destroy':   ['DD1','IH','SS','TT2','RR1','OY'],
    'retreat':   ['RR1','IH','TT2','RR1','IY','TT1'],
    'charge':    ['CH','AR','JH'],
    'bomb':      ['BB1','AO','MM'],
    'missile':   ['MM','IH','SS','AX','LL'],
    'rocket':    ['RR1','AO','KK3','IH','TT1'],
    'laser':     ['LL','EY','ZZ','ER1'],
    'tank':      ['TT2','AE','NG','KK3'],
    'ship':      ['ZH','IH','PP'],
    'space':     ['SS','PP','EY','SS'],
    'planet':    ['PP','LL','AE','NN1','IH','TT1'],
    'star':      ['SS','TT2','AR'],
    'orbit':     ['OR','BB1','IH','TT1'],
    'alien':     ['EY','LL','IY','AX','NN1'],

    // ── Sports / racing ─────────────────────────────────────
    'race':      ['RR1','EY','SS'],
    'track':     ['TT2','RR1','AE','KK3'],
    'ball':      ['BB1','AO','LL'],
    'goal':      ['GG1','OW','LL'],
    'team':      ['TT2','IY','MM'],
    'sport':     ['SS','PP','AO','RR1','TT1'],
    'pass':      ['PP','AE','SS'],
    'kick':      ['KK3','IH','KK3'],
    'tackle':    ['TT2','AE','KK3','AX','LL'],
    'touchdown': ['TT2','AX','CH','DD1','AO','NN1'],
    'home':      ['HH1','OW','MM'],
    'field':     ['FF','IY','LL','DD1'],
    'court':     ['KK3','OR','TT1'],
    'champion':  ['CH','AE','MM','PP','IY','AX','NN1'],
    'master':    ['MM','AE','SS','TT2','ER1'],
    'victory':   ['VV','IH','KK3','TT2','ER1','IY'],
    'defeat':    ['DD1','IH','VV','IY','TT1'],

    // ── Environment ─────────────────────────────────────────
    'sea':       ['SS','IY'],
    'land':      ['LL','AE','NN1','DD1'],
    'sky':       ['SS','KK3','AY'],
    'wall':      ['WW','AO','LL'],
    'door':      ['DD1','OR'],
    'key':       ['KK3','IY'],
    'map':       ['MM','AE','PP'],
    'flag':      ['FF','LL','AE','GG1'],
    'gold':      ['GG1','OW','LL','DD1'],
    'coin':      ['KK3','OY','NN1'],
    'gem':       ['JH','EH','MM'],
    'ring':      ['RR1','IH','NG'],
    'rock':      ['RR1','AO','KK3'],
    'cave':      ['KK3','EY','VV'],
    'tower':     ['TT2','AO','ER1'],
    'city':      ['SS','IH','TT2','IY'],
    'world':     ['WW','ER2','LL','DD1'],

    // ── Vehicles ────────────────────────────────────────────
    'car':       ['KK3','AR'],
    'plane':     ['PP','LL','EY','NN1'],
    'robot':     ['RR1','OW','BB1','AO','TT1'],
    'chopper':   ['CH','AO','PP','ER1'],

    // ── Words from actual INTV voice games ──────────────────
    'number':    ['NN1','AX','MM','BB1','ER1'],
    'second':    ['SS','EH','KK3','AX','NN1','DD1'],
    'third':     ['TH','ER2','DD1'],
    'first':     ['FF','ER2','SS','TT1'],
    'last':      ['LL','AE','SS','TT1'],
    'final':     ['FF','AY','NN1','AX','LL'],
    'total':     ['TT2','OW','TT2','AX','LL'],
    'name':      ['NN1','EY','MM'],
    'word':      ['WW','ER2','DD1'],
    'voice':     ['VV','OY','SS'],
    'speak':     ['SS','PP','IY','KK3'],
    'say':       ['SS','EY'],
    'sound':     ['SS','AW','NN1','DD1'],
    'music':     ['MM','YY1','UW2','ZZ','IH','KK3'],
    'gun':       ['GG1','AX','NN1'],
    'sword':     ['SS','AO','RR1','DD1'],
    'magic':     ['MM','AE','JH','IH','KK3'],
    'dragon':    ['DD1','RR1','AE','GG1','AX','NN1'],
    'horse':     ['HH1','OR','SS'],
    'king':      ['KK3','IH','NG'],
    'queen':     ['KK3','WW','IY','NN1'],
    'knight':    ['NN1','AY','TT1'],
    'castle':    ['KK3','AE','SS','AX','LL'],
    'arrow':     ['ER1','AO'],
    'bow':       ['BB1','OW'],
};
