const assert = require('assert');
const { parse } = require('../maas-nufus-ss-parser.js');

const ornekSinaMetni = `
Son Takvime Göre Gelmeyenler
Yaş Grubu Katsayı Nüfus Nüfus Puanı Gelmeyen Sayısı Gelmeyen Puanı
0-28 GÜN 5,00 0 0 0 0,00
29-365 GÜN 2,00 19 38 0 0,00
1-5 YAŞ 1,60 94 150,4 2 1,60
6-9 YAŞ 0,82 152 124,64 23 9,43
10-14 YAŞ 0,58 207 120,06 48 13,92
15-19 YAŞ 0,55 237 130,35 48 13,20
20-24 YAŞ 0,49 227 111,23 56 13,72
25-29 YAŞ 0,49 213 104,37 56 13,72
30-34 YAŞ 0,52 187 97,24 53 13,78
35-39 YAŞ 0,58 204 118,32 53 15,37
40-44 YAŞ 0,78 227 177,06 59 23,01
45-49 YAŞ 0,89 263 234,07 69 30,70
50-54 YAŞ 1,04 273 283,92 42 21,84
55-59 YAŞ 1,26 229 288,54 41 25,83
60-64 YAŞ 1,48 203 300,44 26 19,24
65 YAŞ ÜSTÜ 1,60 295 472 39 31,20
`;

const sonuc = parse(ornekSinaMetni);

assert.deepStrictEqual(sonuc.yenidogan, { toplam: 0, gelmeyen: 0 });
assert.deepStrictEqual(sonuc.bebek, { toplam: 19, gelmeyen: 0 });
assert.deepStrictEqual(sonuc.cocuk, { toplam: 94, gelmeyen: 2 });
assert.deepStrictEqual(sonuc.yas5_9, { toplam: 152, gelmeyen: 23 });
assert.deepStrictEqual(sonuc.yas10_14, { toplam: 207, gelmeyen: 48 });
assert.deepStrictEqual(sonuc.yas45_49, { toplam: 263, gelmeyen: 69 });
assert.deepStrictEqual(sonuc.yasli, { toplam: 295, gelmeyen: 39 });
assert.strictEqual(Object.keys(sonuc).length, 16);

const satirBolunmusOcrMetni = `
Yaş Grubu Katsayı Nüfus Nüfus Puanı Gelmeyen Sayısı Gelmeyen Puanı
0 - 28 GÜN
5,00 3 15,00 1 2,50
29 - 365 GÜN 2,00 18 36,00 4 4,00
13 - 59 AY 1,60 91 145,60 12 9,60
65 YAŞ ÜSTÜ
1,60 301 481,60 40 32,00
`;

const bolunmus = parse(satirBolunmusOcrMetni);
assert.deepStrictEqual(bolunmus.yenidogan, { toplam: 3, gelmeyen: 1 });
assert.deepStrictEqual(bolunmus.bebek, { toplam: 18, gelmeyen: 4 });
assert.deepStrictEqual(bolunmus.cocuk, { toplam: 91, gelmeyen: 12 });
assert.deepStrictEqual(bolunmus.yasli, { toplam: 301, gelmeyen: 40 });

console.log('maas_nufus_ss_parser_test OK');
