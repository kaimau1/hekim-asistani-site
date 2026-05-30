(function () {
  'use strict';

  const kategoriler = ['Tümü', 'Metabolizma', 'Böbrek', 'Elektrolit', 'Gebelik', 'Pediatri', 'Kan gazı'];
  let aktifKategori = 'Tümü';
  let arama = '';

  const $ = (secici, kok = document) => kok.querySelector(secici);
  const sayi = (veri, anahtar) => {
    const ham = String(veri.get(anahtar) || '').replace(',', '.');
    const deger = Number(ham);
    return Number.isFinite(deger) ? deger : NaN;
  };
  const tarih = (veri, anahtar) => {
    const ham = String(veri.get(anahtar) || '');
    const deger = ham ? new Date(`${ham}T00:00:00`) : null;
    return deger && !Number.isNaN(deger.getTime()) ? deger : null;
  };
  const fmt = (deger, basamak = 2) => Number.isFinite(deger) ? deger.toFixed(basamak).replace(/\.?0+$/, '') : '-';
  const gunEkle = (d, gun) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + gun);
  const tarihYaz = (d) => d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  const hata = (metin) => ({ ana: 'Eksik bilgi', detay: metin, durum: 'uyari' });
  const sonuc = (ana, detay, ek = {}) => ({ ana, detay, ...ek });

  const alan = (ad, etiket, tip = 'number', birim = '', attrs = '') => ({ ad, etiket, tip, birim, attrs });

  function bmiYorum(bmi) {
    if (bmi < 18.5) return 'Düşük kilo aralığı';
    if (bmi < 25) return 'Normal kilo aralığı';
    if (bmi < 30) return 'Fazla kilo aralığı';
    if (bmi < 35) return 'Obezite sınıf I';
    if (bmi < 40) return 'Obezite sınıf II';
    return 'Obezite sınıf III';
  }

  function homaYorum(v) {
    if (v < 2) return 'Genellikle düşük/normal insülin direnci aralığı';
    if (v < 2.9) return 'Sınırda yükseklik olabilir';
    return 'İnsülin direnci lehine yorumlanabilir';
  }

  function kanGaziYorum(ph, pco2, hco3) {
    const asidemi = ph < 7.35;
    const alkalemi = ph > 7.45;
    if (!asidemi && !alkalemi) return 'pH normal aralıkta; karma bozukluk dışlanamaz.';
    if (asidemi && hco3 < 22) return 'Primer metabolik asidoz olası. Winter beklenen pCO₂: ' + fmt(1.5 * hco3 + 8, 1) + ' ±2 mmHg.';
    if (asidemi && pco2 > 45) return 'Primer respiratuvar asidoz olası.';
    if (alkalemi && hco3 > 26) return 'Primer metabolik alkaloz olası.';
    if (alkalemi && pco2 < 35) return 'Primer respiratuvar alkaloz olası.';
    return 'Karma veya kompanse bozukluk olabilir.';
  }

  const hesaplayicilar = [
    {
      id: 'homa-ir',
      baslik: 'HOMA-IR insülin direnci',
      kategori: 'Metabolizma',
      etiketler: ['insülin', 'glukoz', 'homa'],
      not: 'Açlık glukozu mg/dL ve açlık insülini µIU/mL ile hesaplanır.',
      alanlar: [alan('glukoz', 'Açlık glukozu', 'number', 'mg/dL'), alan('insulin', 'Açlık insülini', 'number', 'µIU/mL')],
      hesapla: (v) => {
        const glukoz = sayi(v, 'glukoz'), insulin = sayi(v, 'insulin');
        if (!glukoz || !insulin) return hata('Glukoz ve insülin değerlerini girin.');
        const deger = glukoz * insulin / 405;
        return sonuc(fmt(deger, 2), homaYorum(deger), { rozet: 'HOMA-IR' });
      }
    },
    {
      id: 'mentzer',
      baslik: 'Mentzer indeksi',
      kategori: 'Metabolizma',
      etiketler: ['anemi', 'talasemi', 'mcv', 'rbc'],
      not: 'MCV / eritrosit sayısı. Mikrositer anemi ayrımında yardımcıdır.',
      alanlar: [alan('mcv', 'MCV', 'number', 'fL'), alan('rbc', 'Eritrosit', 'number', 'milyon/µL')],
      hesapla: (v) => {
        const mcv = sayi(v, 'mcv'), rbc = sayi(v, 'rbc');
        if (!mcv || !rbc) return hata('MCV ve eritrosit değerlerini girin.');
        const deger = mcv / rbc;
        return sonuc(fmt(deger, 1), deger < 13 ? 'Talasemi taşıyıcılığı lehine olabilir.' : 'Demir eksikliği lehine olabilir.', { rozet: 'Mentzer' });
      }
    },
    {
      id: 'egfr-mdrd',
      baslik: 'eGFR (MDRD)',
      kategori: 'Böbrek',
      etiketler: ['gfr', 'mdrd', 'kreatinin'],
      not: 'Erişkinlerde serum kreatinin, yaş ve cinsiyet ile tahmini GFR hesaplar.',
      alanlar: [alan('kreatinin', 'Serum kreatinin', 'number', 'mg/dL'), alan('yas', 'Yaş', 'number', 'yıl'), alan('cinsiyet', 'Cinsiyet', 'select')],
      secenekler: { cinsiyet: [['erkek', 'Erkek'], ['kadin', 'Kadın']] },
      hesapla: (v) => {
        const cr = sayi(v, 'kreatinin'), yas = sayi(v, 'yas'), kadin = v.get('cinsiyet') === 'kadin';
        if (!cr || !yas) return hata('Kreatinin ve yaş değerlerini girin.');
        const deger = 175 * Math.pow(cr, -1.154) * Math.pow(yas, -0.203) * (kadin ? 0.742 : 1);
        return sonuc(`${fmt(deger, 1)} mL/dk/1.73 m²`, deger < 60 ? 'Azalmış eGFR aralığı; klinik bağlam ve tekrar ölçüm önemlidir.' : '60 üstü aralıkta.', { rozet: 'MDRD' });
      }
    },
    {
      id: 'kreatinin-klerensi',
      baslik: 'Kreatinin klerensi (Cockcroft-Gault)',
      kategori: 'Böbrek',
      etiketler: ['crcl', 'cockcroft', 'kreatinin'],
      not: 'Erişkin kreatinin klerensi tahmini. İlaç dozunda tek başına karar aracı değildir.',
      alanlar: [alan('kreatinin', 'Serum kreatinin', 'number', 'mg/dL'), alan('yas', 'Yaş', 'number', 'yıl'), alan('kilo', 'Kilo', 'number', 'kg'), alan('cinsiyet', 'Cinsiyet', 'select')],
      secenekler: { cinsiyet: [['erkek', 'Erkek'], ['kadin', 'Kadın']] },
      hesapla: (v) => {
        const cr = sayi(v, 'kreatinin'), yas = sayi(v, 'yas'), kilo = sayi(v, 'kilo'), kadin = v.get('cinsiyet') === 'kadin';
        if (!cr || !yas || !kilo) return hata('Kreatinin, yaş ve kilo değerlerini girin.');
        const deger = ((140 - yas) * kilo * (kadin ? 0.85 : 1)) / (72 * cr);
        return sonuc(`${fmt(deger, 1)} mL/dk`, 'Cockcroft-Gault tahmini kreatinin klerensi.', { rozet: 'CrCl' });
      }
    },
    {
      id: 'schwartz',
      baslik: 'Çocuk eGFR (Schwartz)',
      kategori: 'Böbrek',
      etiketler: ['pediatri', 'gfr', 'schwartz'],
      not: 'Bedside Schwartz katsayısı varsayılan 0.413 alınır.',
      alanlar: [alan('boy', 'Boy', 'number', 'cm'), alan('kreatinin', 'Serum kreatinin', 'number', 'mg/dL'), alan('k', 'k katsayısı', 'number', '', 'value="0.413" step="0.001"')],
      hesapla: (v) => {
        const boy = sayi(v, 'boy'), cr = sayi(v, 'kreatinin'), k = sayi(v, 'k') || 0.413;
        if (!boy || !cr) return hata('Boy ve kreatinin değerlerini girin.');
        return sonuc(`${fmt(k * boy / cr, 1)} mL/dk/1.73 m²`, 'Schwartz formülü ile pediatrik eGFR tahmini.', { rozet: 'Schwartz' });
      }
    },
    {
      id: 'yagsiz-vucut-agirligi',
      baslik: 'Yağsız vücut ağırlığı',
      kategori: 'Metabolizma',
      etiketler: ['lbw', 'kilo', 'boy'],
      not: 'Janmahasatian yaklaşımı ile tahmini yağsız vücut ağırlığı.',
      alanlar: [alan('boy', 'Boy', 'number', 'cm'), alan('kilo', 'Kilo', 'number', 'kg'), alan('cinsiyet', 'Cinsiyet', 'select')],
      secenekler: { cinsiyet: [['erkek', 'Erkek'], ['kadin', 'Kadın']] },
      hesapla: (v) => {
        const boy = sayi(v, 'boy'), kilo = sayi(v, 'kilo'), kadin = v.get('cinsiyet') === 'kadin';
        if (!boy || !kilo) return hata('Boy ve kilo değerlerini girin.');
        const bmi = kilo / Math.pow(boy / 100, 2);
        const lbw = kadin ? (9270 * kilo) / (8780 + 244 * bmi) : (9270 * kilo) / (6680 + 216 * bmi);
        return sonuc(`${fmt(lbw, 1)} kg`, `BKİ: ${fmt(bmi, 1)} kg/m²`, { rozet: 'LBW' });
      }
    },
    {
      id: 'osmolal-gap',
      baslik: 'Osmolal gap',
      kategori: 'Elektrolit',
      etiketler: ['osmolalite', 'sodyum', 'bun'],
      not: 'Hesaplanan osmolalite: 2×Na + glukoz/18 + BUN/2.8 + etanol/4.6.',
      alanlar: [alan('olculen', 'Ölçülen osmolalite', 'number', 'mOsm/kg'), alan('na', 'Sodyum', 'number', 'mEq/L'), alan('glukoz', 'Glukoz', 'number', 'mg/dL'), alan('bun', 'BUN', 'number', 'mg/dL'), alan('etanol', 'Etanol', 'number', 'mg/dL', 'value="0"')],
      hesapla: (v) => {
        const olculen = sayi(v, 'olculen'), na = sayi(v, 'na'), glukoz = sayi(v, 'glukoz'), bun = sayi(v, 'bun'), etanol = sayi(v, 'etanol') || 0;
        if (!olculen || !na || !glukoz || !bun) return hata('Ölçülen osmolalite, Na, glukoz ve BUN değerlerini girin.');
        const hesap = 2 * na + glukoz / 18 + bun / 2.8 + etanol / 4.6;
        const gap = olculen - hesap;
        return sonuc(`${fmt(gap, 1)} mOsm/kg`, `Hesaplanan osmolalite: ${fmt(hesap, 1)} mOsm/kg`, { rozet: 'Gap' });
      }
    },
    {
      id: 'duzeltilmis-kalsiyum',
      baslik: 'Albümin için düzeltilmiş kalsiyum',
      kategori: 'Elektrolit',
      etiketler: ['kalsiyum', 'albümin'],
      not: 'mg/dL birimiyle: Ca + 0.8 × (4 - albümin).',
      alanlar: [alan('ca', 'Total kalsiyum', 'number', 'mg/dL'), alan('albumin', 'Albümin', 'number', 'g/dL')],
      hesapla: (v) => {
        const ca = sayi(v, 'ca'), albumin = sayi(v, 'albumin');
        if (!ca || !albumin) return hata('Kalsiyum ve albümin değerlerini girin.');
        return sonuc(`${fmt(ca + 0.8 * (4 - albumin), 2)} mg/dL`, 'Albümin düşüklüğüne göre düzeltilmiş kalsiyum.', { rozet: 'Ca' });
      }
    },
    {
      id: 'ldl-friedewald',
      baslik: 'LDL kolesterol (Friedewald)',
      kategori: 'Metabolizma',
      etiketler: ['ldl', 'kolesterol', 'trigliserid'],
      not: 'TG 400 mg/dL altında ve açlık örneğinde daha anlamlıdır.',
      alanlar: [alan('total', 'Total kolesterol', 'number', 'mg/dL'), alan('hdl', 'HDL', 'number', 'mg/dL'), alan('tg', 'Trigliserid', 'number', 'mg/dL')],
      hesapla: (v) => {
        const total = sayi(v, 'total'), hdl = sayi(v, 'hdl'), tg = sayi(v, 'tg');
        if (!total || !hdl || !tg) return hata('Total kolesterol, HDL ve TG değerlerini girin.');
        if (tg >= 400) return hata('TG 400 mg/dL ve üzerindeyse Friedewald formülü önerilmez.');
        return sonuc(`${fmt(total - hdl - tg / 5, 1)} mg/dL`, 'Friedewald formülü ile hesaplanan LDL.', { rozet: 'LDL' });
      }
    },
    {
      id: 'duzeltilmis-sodyum',
      baslik: 'Hiperglisemide düzeltilmiş sodyum',
      kategori: 'Elektrolit',
      etiketler: ['sodyum', 'glukoz', 'hiperglisemi'],
      not: 'Katz yaklaşımı: Her 100 mg/dL glukoz artışı için +1.6 mEq/L.',
      alanlar: [alan('na', 'Ölçülen sodyum', 'number', 'mEq/L'), alan('glukoz', 'Glukoz', 'number', 'mg/dL')],
      hesapla: (v) => {
        const na = sayi(v, 'na'), glukoz = sayi(v, 'glukoz');
        if (!na || !glukoz) return hata('Sodyum ve glukoz değerlerini girin.');
        return sonuc(`${fmt(na + 1.6 * ((glukoz - 100) / 100), 1)} mEq/L`, '1.6 düzeltme katsayısı ile hesaplandı.', { rozet: 'Na' });
      }
    },
    {
      id: 'duzeltilmis-sodyum-24',
      baslik: 'Hiperglisemide düzeltilmiş sodyum 2.4',
      kategori: 'Elektrolit',
      etiketler: ['sodyum', 'glukoz', 'hillier'],
      not: 'Hillier yaklaşımı: Her 100 mg/dL glukoz artışı için +2.4 mEq/L.',
      alanlar: [alan('na', 'Ölçülen sodyum', 'number', 'mEq/L'), alan('glukoz', 'Glukoz', 'number', 'mg/dL')],
      hesapla: (v) => {
        const na = sayi(v, 'na'), glukoz = sayi(v, 'glukoz');
        if (!na || !glukoz) return hata('Sodyum ve glukoz değerlerini girin.');
        return sonuc(`${fmt(na + 2.4 * ((glukoz - 100) / 100), 1)} mEq/L`, '2.4 düzeltme katsayısı ile hesaplandı.', { rozet: 'Na 2.4' });
      }
    },
    {
      id: 'tahmini-dogum',
      baslik: 'Tahmini doğum tarihi',
      kategori: 'Gebelik',
      etiketler: ['gebelik', 'sat', 'doğum'],
      not: 'Son adet tarihine 280 gün eklenir.',
      alanlar: [alan('sat', 'Son adet tarihi', 'date')],
      hesapla: (v) => {
        const sat = tarih(v, 'sat');
        if (!sat) return hata('Son adet tarihini seçin.');
        const tdt = gunEkle(sat, 280);
        const hafta = Math.floor((Date.now() - sat.getTime()) / 86400000 / 7);
        return sonuc(tarihYaz(tdt), `Bugüne göre yaklaşık gebelik haftası: ${Math.max(0, hafta)} hafta`, { rozet: 'TDT' });
      }
    },
    {
      id: 'bmh',
      baslik: 'Bazal metabolik hız',
      kategori: 'Metabolizma',
      etiketler: ['bmr', 'bmh', 'kalori'],
      not: 'Mifflin-St Jeor formülü ile tahmini bazal enerji tüketimi.',
      alanlar: [alan('kilo', 'Kilo', 'number', 'kg'), alan('boy', 'Boy', 'number', 'cm'), alan('yas', 'Yaş', 'number', 'yıl'), alan('cinsiyet', 'Cinsiyet', 'select')],
      secenekler: { cinsiyet: [['erkek', 'Erkek'], ['kadin', 'Kadın']] },
      hesapla: (v) => {
        const kilo = sayi(v, 'kilo'), boy = sayi(v, 'boy'), yas = sayi(v, 'yas'), kadin = v.get('cinsiyet') === 'kadin';
        if (!kilo || !boy || !yas) return hata('Kilo, boy ve yaş değerlerini girin.');
        const bmr = 10 * kilo + 6.25 * boy - 5 * yas + (kadin ? -161 : 5);
        return sonuc(`${fmt(bmr, 0)} kcal/gün`, 'İstirahat enerji tüketimi tahmini.', { rozet: 'BMH' });
      }
    },
    {
      id: 'hipernatremi-sivi-acigi',
      baslik: 'Hipernatremide serbest su açığı',
      kategori: 'Elektrolit',
      etiketler: ['hipernatremi', 'sodyum', 'sıvı'],
      not: 'Serbest su açığı = TBW × (Na/140 - 1).',
      alanlar: [alan('kilo', 'Kilo', 'number', 'kg'), alan('na', 'Sodyum', 'number', 'mEq/L'), alan('tbw', 'TBW katsayısı', 'number', '', 'value="0.6" step="0.05"')],
      hesapla: (v) => {
        const kilo = sayi(v, 'kilo'), na = sayi(v, 'na'), tbw = sayi(v, 'tbw') || 0.6;
        if (!kilo || !na) return hata('Kilo ve sodyum değerlerini girin.');
        const acik = kilo * tbw * (na / 140 - 1);
        return sonuc(`${fmt(Math.max(0, acik), 2)} L`, 'Düzeltme hızı klinik duruma göre planlanmalıdır.', { rozet: 'Su açığı' });
      }
    },
    {
      id: 'yenidogan-sarilik',
      baslik: 'Yenidoğan sarılık takibi',
      kategori: 'Pediatri',
      etiketler: ['bilirubin', 'yenidoğan', 'sarılık'],
      not: 'Basitleştirilmiş izlem tablosudur; fototerapi kararı için güncel nomogram kullanın.',
      alanlar: [alan('saat', 'Postnatal yaş', 'number', 'saat'), alan('bilirubin', 'Total bilirubin', 'number', 'mg/dL')],
      hesapla: (v) => {
        const saat = sayi(v, 'saat'), bili = sayi(v, 'bilirubin');
        if (!saat || !bili) return hata('Saat ve bilirubin değerlerini girin.');
        let yorum = 'Düşük-orta izlem aralığı olabilir.';
        if ((saat < 24 && bili >= 8) || (saat < 48 && bili >= 12) || (saat >= 48 && bili >= 15)) yorum = 'Yakın izlem/nomogramla değerlendirme gerekir.';
        return sonuc(`${fmt(bili, 1)} mg/dL`, yorum, {
          rozet: 'Bilirubin',
          tablo: [['Yaş', 'Kontrol notu'], ['<24 saat', 'Erken sarılıkta dikkatli değerlendirme'], ['24-48 saat', 'Risk faktörlerine göre tekrar ölçüm'], ['>48 saat', 'Nomogram ve klinik risklerle birlikte karar']]
        });
      }
    },
    {
      id: 'bki',
      baslik: 'Vücut kitle indeksi',
      kategori: 'Metabolizma',
      etiketler: ['bki', 'bmi', 'kilo'],
      not: 'BKİ = kilo / boy².',
      alanlar: [alan('kilo', 'Kilo', 'number', 'kg'), alan('boy', 'Boy', 'number', 'cm')],
      hesapla: (v) => {
        const kilo = sayi(v, 'kilo'), boy = sayi(v, 'boy');
        if (!kilo || !boy) return hata('Kilo ve boy değerlerini girin.');
        const bki = kilo / Math.pow(boy / 100, 2);
        return sonuc(`${fmt(bki, 1)} kg/m²`, bmiYorum(bki), { rozet: 'BKİ' });
      }
    },
    {
      id: 'bsa',
      baslik: 'Vücut yüzey alanı',
      kategori: 'Metabolizma',
      etiketler: ['bsa', 'mosteller', 'yüzey'],
      not: 'Mosteller: √(boy × kilo / 3600).',
      alanlar: [alan('kilo', 'Kilo', 'number', 'kg'), alan('boy', 'Boy', 'number', 'cm')],
      hesapla: (v) => {
        const kilo = sayi(v, 'kilo'), boy = sayi(v, 'boy');
        if (!kilo || !boy) return hata('Kilo ve boy değerlerini girin.');
        return sonuc(`${fmt(Math.sqrt((boy * kilo) / 3600), 2)} m²`, 'Mosteller formülü ile vücut yüzey alanı.', { rozet: 'BSA' });
      }
    },
    {
      id: 'fena',
      baslik: 'Fraksiyonel sodyum ekskresyonu',
      kategori: 'Böbrek',
      etiketler: ['fena', 'sodyum', 'aki'],
      not: 'FENa = (idrar Na × serum Cr) / (serum Na × idrar Cr) × 100.',
      alanlar: [alan('una', 'İdrar sodyum', 'number', 'mEq/L'), alan('scr', 'Serum kreatinin', 'number', 'mg/dL'), alan('sna', 'Serum sodyum', 'number', 'mEq/L'), alan('ucr', 'İdrar kreatinin', 'number', 'mg/dL')],
      hesapla: (v) => {
        const una = sayi(v, 'una'), scr = sayi(v, 'scr'), sna = sayi(v, 'sna'), ucr = sayi(v, 'ucr');
        if (!una || !scr || !sna || !ucr) return hata('Tüm serum/idrar değerlerini girin.');
        const fena = (una * scr) / (sna * ucr) * 100;
        return sonuc(`${fmt(fena, 2)}%`, fena < 1 ? 'Prerenal tablo lehine olabilir.' : 'İntrensek renal tablo lehine olabilir.', { rozet: 'FENa' });
      }
    },
    {
      id: 'cocuk-boy-kilo',
      baslik: 'Çocuklarda boy-kilo değerlendirme',
      kategori: 'Pediatri',
      etiketler: ['çocuk', 'boy', 'kilo', 'bki'],
      not: 'Persentil hesabı değildir; hızlı BKİ ve beklenen kilo aralığı için yardımcıdır.',
      alanlar: [alan('yas', 'Yaş', 'number', 'yıl'), alan('boy', 'Boy', 'number', 'cm'), alan('kilo', 'Kilo', 'number', 'kg')],
      hesapla: (v) => {
        const yas = sayi(v, 'yas'), boy = sayi(v, 'boy'), kilo = sayi(v, 'kilo');
        if (!yas || !boy || !kilo) return hata('Yaş, boy ve kilo değerlerini girin.');
        const bki = kilo / Math.pow(boy / 100, 2);
        const beklenen = yas >= 1 && yas <= 10 ? 2 * yas + 8 : NaN;
        return sonuc(`${fmt(bki, 1)} kg/m²`, Number.isFinite(beklenen) ? `Yaklaşık beklenen kilo: ${fmt(beklenen, 1)} kg. Persentil için büyüme eğrisi gerekir.` : 'Persentil için yaş-cinsiyet büyüme eğrisi gerekir.', { rozet: 'Pediatri' });
      }
    },
    {
      id: 'yenidogan-transfuzyon',
      baslik: 'Yenidoğanda transfüzyon kriterleri',
      kategori: 'Pediatri',
      etiketler: ['yenidoğan', 'transfüzyon', 'hemoglobin'],
      not: 'Kurum protokolünün yerine geçmez; hızlı hatırlatma tablosudur.',
      alanlar: [alan('hb', 'Hemoglobin', 'number', 'g/dL'), alan('destek', 'Solunum/klinik destek', 'select')],
      secenekler: { destek: [['yok', 'Destek yok / stabil'], ['var', 'Solunum desteği veya semptom var']] },
      hesapla: (v) => {
        const hb = sayi(v, 'hb'), destek = v.get('destek') === 'var';
        if (!hb) return hata('Hemoglobin değerini girin.');
        const yorum = destek ? (hb < 10 ? 'Klinik protokole göre transfüzyon eşiğine yakın/altında olabilir.' : 'Destek var; klinik bulgularla birlikte izlem.') : (hb < 7 ? 'Stabil bebekte eşik altında olabilir.' : 'Stabil izlem aralığında olabilir.');
        return sonuc(`${fmt(hb, 1)} g/dL`, yorum, {
          rozet: 'Hb',
          tablo: [['Klinik durum', 'Hatırlatma'], ['Stabil', 'Daha düşük Hb eşikleri kullanılabilir'], ['Oksijen/ventilasyon/semptom', 'Daha yüksek eşikler tercih edilebilir'], ['Prematüre', 'Gebelik haftası ve güncel protokol belirleyicidir']]
        });
      }
    },
    {
      id: 'kan-gazi',
      baslik: 'Kan gazı değerlendirme',
      kategori: 'Kan gazı',
      etiketler: ['ph', 'pco2', 'hco3', 'asidoz'],
      not: 'Primer asit-baz bozukluğu için hızlı ön değerlendirme yapar.',
      alanlar: [alan('ph', 'pH', 'number', '', 'step="0.01"'), alan('pco2', 'pCO₂', 'number', 'mmHg'), alan('hco3', 'HCO₃', 'number', 'mEq/L')],
      hesapla: (v) => {
        const ph = sayi(v, 'ph'), pco2 = sayi(v, 'pco2'), hco3 = sayi(v, 'hco3');
        if (!ph || !pco2 || !hco3) return hata('pH, pCO₂ ve HCO₃ değerlerini girin.');
        return sonuc(ph < 7.35 ? 'Asidemi' : ph > 7.45 ? 'Alkalemi' : 'pH normal', kanGaziYorum(ph, pco2, hco3), { rozet: 'Kan gazı' });
      }
    }
  ];

  function inputHtml(h, a) {
    if (a.tip === 'select') {
      const opts = (h.secenekler?.[a.ad] || []).map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
      return `<label class="medcalc-label"><span>${a.etiket}</span><select name="${a.ad}">${opts}</select></label>`;
    }
    return `<label class="medcalc-label"><span>${a.etiket}</span><div class="medcalc-input-wrap"><input name="${a.ad}" type="${a.tip}" inputmode="${a.tip === 'number' ? 'decimal' : ''}" ${a.attrs || ''}>${a.birim ? `<em>${a.birim}</em>` : ''}</div></label>`;
  }

  function tabloHtml(tablo) {
    if (!Array.isArray(tablo) || tablo.length < 2) return '';
    const [baslik, ...satirlar] = tablo;
    return `<table class="medcalc-tablo"><thead><tr>${baslik.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${satirlar.map(s => `<tr>${s.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function hesaplayiciKart(h) {
    return `<article class="medcalc-kart" data-medcalc-id="${h.id}" data-kategori="${h.kategori}">
      <div class="medcalc-kart-ust">
        <span class="medcalc-kategori">${h.kategori}</span>
        <h2>${h.baslik}</h2>
        <p>${h.not}</p>
      </div>
      <form class="medcalc-form" data-id="${h.id}">
        <div class="medcalc-form-grid">${h.alanlar.map(a => inputHtml(h, a)).join('')}</div>
        <div class="medcalc-actions">
          <button class="btn btn-birincil" type="submit">Hesapla</button>
          <button class="btn btn-ikincil" type="reset">Sıfırla</button>
        </div>
      </form>
      <div class="medcalc-sonuc" id="sonuc-${h.id}" hidden></div>
    </article>`;
  }

  function filtreliListe() {
    const q = arama.trim().toLocaleLowerCase('tr');
    return hesaplayicilar.filter(h => {
      const kategoriUyar = aktifKategori === 'Tümü' || h.kategori === aktifKategori;
      const metin = [h.baslik, h.kategori, h.not, ...(h.etiketler || [])].join(' ').toLocaleLowerCase('tr');
      return kategoriUyar && (!q || metin.includes(q));
    });
  }

  function renderKategoriler() {
    const alan = $('#medcalcKategoriler');
    if (!alan) return;
    alan.innerHTML = kategoriler.map(k => `<button type="button" class="${k === aktifKategori ? 'aktif' : ''}" data-kategori="${k}">${k}</button>`).join('');
    alan.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        aktifKategori = btn.dataset.kategori || 'Tümü';
        render();
      });
    });
  }

  function render() {
    renderKategoriler();
    const grid = $('#medcalcGrid');
    if (!grid) return;
    const liste = filtreliListe();
    grid.innerHTML = liste.length ? liste.map(hesaplayiciKart).join('') : '<div class="medcalc-bos">Bu aramada hesaplama bulunamadı.</div>';
    grid.querySelectorAll('.medcalc-form').forEach(form => {
      form.addEventListener('submit', hesapla);
      form.addEventListener('reset', () => {
        const sonucAlani = $(`#sonuc-${form.dataset.id}`);
        if (sonucAlani) {
          sonucAlani.hidden = true;
          sonucAlani.innerHTML = '';
        }
      });
    });
  }

  function hesapla(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const h = hesaplayicilar.find(x => x.id === form.dataset.id);
    if (!h) return;
    const veri = new FormData(form);
    const r = h.hesapla(veri);
    const sonucAlani = $(`#sonuc-${h.id}`);
    if (!sonucAlani) return;
    sonucAlani.hidden = false;
    sonucAlani.classList.toggle('uyari', r.durum === 'uyari');
    sonucAlani.innerHTML = `
      <div class="medcalc-sonuc-rozet">${r.rozet || 'Sonuç'}</div>
      <strong>${r.ana}</strong>
      <p>${r.detay || ''}</p>
      ${tabloHtml(r.tablo)}
    `;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const ara = $('#medcalcAra');
    if (ara) {
      ara.addEventListener('input', () => {
        arama = ara.value || '';
        render();
      });
    }
    render();
  });
})();
