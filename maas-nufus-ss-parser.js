(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AhekMaasNufusSsParser = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SATIRLAR = [
    { ad: 'yenidogan', desen: /0\s*[-–]\s*28\s*GUN/, etiketSayi: 2 },
    { ad: 'bebek', desen: /29\s*[-–]\s*365\s*GUN/, etiketSayi: 2 },
    { ad: 'cocuk', desen: /13\s*[-–]\s*59\s*AY|1\s*[-–]\s*5\s*YAS/, etiketSayi: 2 },
    { ad: 'yas5_9', desen: /6\s*[-–]\s*9\s*YAS|5\s*[-–]\s*9\s*YAS/, etiketSayi: 2 },
    { ad: 'yas10_14', desen: /10\s*[-–]\s*14\s*YAS/, etiketSayi: 2 },
    { ad: 'yas15_19', desen: /15\s*[-–]\s*19\s*YAS/, etiketSayi: 2 },
    { ad: 'yas20_24', desen: /20\s*[-–]\s*24\s*YAS/, etiketSayi: 2 },
    { ad: 'yas25_29', desen: /25\s*[-–]\s*29\s*YAS/, etiketSayi: 2 },
    { ad: 'yas30_34', desen: /30\s*[-–]\s*34\s*YAS/, etiketSayi: 2 },
    { ad: 'yas35_39', desen: /35\s*[-–]\s*39\s*YAS/, etiketSayi: 2 },
    { ad: 'yas40_44', desen: /40\s*[-–]\s*44\s*YAS/, etiketSayi: 2 },
    { ad: 'yas45_49', desen: /45\s*[-–]\s*49\s*YAS/, etiketSayi: 2 },
    { ad: 'yas50_54', desen: /50\s*[-–]\s*54\s*YAS/, etiketSayi: 2 },
    { ad: 'yas55_59', desen: /55\s*[-–]\s*59\s*YAS/, etiketSayi: 2 },
    { ad: 'yas60_64', desen: /60\s*[-–]\s*64\s*YAS/, etiketSayi: 2 },
    { ad: 'yasli', desen: /65\s*YAS\s*USTU|65\s*\+\s*YAS/, etiketSayi: 1 }
  ];

  function normalize(metin) {
    return String(metin || '')
      .toLocaleUpperCase('tr-TR')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\S\r\n]+/g, ' ')
      .trim();
  }

  function sayilariAl(satir) {
    return (String(satir || '').match(/\d+(?:[.,]\d+)?/g) || [])
      .map((ham) => Number(String(ham).replace(',', '.')))
      .filter((deger) => Number.isFinite(deger));
  }

  function nufusKolonlariniAl(satir, tanim) {
    const sayilar = sayilariAl(satir).slice(tanim.etiketSayi);
    if (sayilar.length < 5) return null;
    const kolonlar = sayilar.slice(-5);
    return {
      toplam: Math.max(0, Math.round(kolonlar[1])),
      gelmeyen: Math.max(0, Math.round(kolonlar[3]))
    };
  }

  function parse(metin) {
    const sonuc = {};
    const satirlar = String(metin || '').split(/\r?\n/);

    satirlar.forEach((hamSatir, index) => {
      const satir = normalize(hamSatir);
      if (!satir) return;
      const tanim = SATIRLAR.find((item) => item.desen.test(satir));
      if (!tanim || Object.prototype.hasOwnProperty.call(sonuc, tanim.ad)) return;

      const degerler = nufusKolonlariniAl(satir, tanim) ||
        nufusKolonlariniAl(`${satir} ${normalize(satirlar[index + 1] || '')}`, tanim);
      if (!degerler) return;
      sonuc[tanim.ad] = degerler;
    });

    return sonuc;
  }

  function grupAlanlari() {
    return SATIRLAR.map((item) => item.ad);
  }

  return { parse, grupAlanlari };
});
