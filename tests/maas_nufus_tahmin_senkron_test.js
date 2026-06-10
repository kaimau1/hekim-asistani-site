const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const maas = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'maas-hesaplama.js'), 'utf8');
const hesapla = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'hesapla.js'), 'utf8');

assert(
  maas.includes('const TAHMINI_NUFUS_PUANI_CARPANI = 0.85;') &&
    maas.includes('function hesabaEsasNufusPuaniBilgisi') &&
    maas.includes('form.elements?.hesabaEsasNufusPuani') &&
    maas.includes('form.elements?.hesabaEsasNufusPuaniTahmini') &&
    maas.includes("document.getElementById('maasHesabaEsasTahminUyari')") &&
    maas.includes("const hypDahilPuan = Math.max(0, sayi(veri, 'manuelNufusPuani'));") &&
    maas.includes('const hesabaEsasPuan = hamPuan > 0 ? netHamPuan : tahminiPuan;'),
  'Maasta Hesaba esas puaniniz otomatik alan olmali; eski nihai puan HYP Dahil Hesaba esas olarak korunmali.'
);

assert(
  hesapla.includes('gelmeyenNufusPuani: bordro.gelmeyenPuan') &&
    hesapla.includes('kayit?.hesabaEsasNufusPuani') &&
    hesapla.includes("kaynak: 'hesaba-esas-alan'") &&
    hesapla.includes('tahminiNufusPuani: bordro.tahmini') &&
    hesapla.includes('const tamamlanmisMaasKatsayi = _v2TavanKS(bordro.nufus, bordro.nufusTip);') &&
    maas.includes('const gelmeyenNufusPuani = Math.max(0, Number(event.data.gelmeyenNufusPuani) || 0);') &&
    maas.includes('const netNufusPuani = Math.max(0, hamNufusPuani - gelmeyenNufusPuani);') &&
    maas.includes('maasaEsasPuan: netNufusPuani * canliHypKatsayi') &&
    maas.includes('maasaEsasPuan: netNufusPuani * tamamlanmisHypKatsayi'),
  'HYP canli maas senaryosu Hesaba esas puaniniz alanini tek nufus puani kaynagi olarak kullanmali.'
);

assert(
  hesapla.includes("const hypNufus = parseInt(document.getElementById('hypV2Nufus')?.value, 10) || 0;") &&
    hesapla.includes("kaynak: 'hyp-nufus'") &&
    hesapla.includes('puan: tahminNufus * HYP2_TAHMINI_NUFUS_PUANI_CARPANI') &&
    hesapla.includes('function _v2MaasTahminUyarisiGuncelle(goster)'),
  'HYP canlı maaş sadece HYP nüfusu girilince de tahmini puanla çalışmalı.'
);

assert(
  maas.includes('function hypNufusunuMaasFormunaSenkronla') &&
    maas.includes("form.elements.manuelToplamNufus.dataset.hypSenkron = '1'") &&
    maas.includes('hypNufusunuMaasFormunaSenkronla();'),
  'Maaş hesaplama sayfası HYP nüfus alanını boş maaş nüfus alanına senkronlamalı.'
);

assert(
  hesapla.includes('function _aktifMaasDonemiOku()') &&
    hesapla.includes('hesapAy: aktifMaasDonemi.ay') &&
    hesapla.includes('hesapYil: aktifMaasDonemi.yil') &&
    maas.includes("if (Number.isFinite(secenekler.hesapAy)) veri.set('hesapAy', String(secenekler.hesapAy));") &&
    maas.includes("if (Number.isFinite(secenekler.hesapYil)) veri.set('hesapYil', String(secenekler.hesapYil));"),
  'HYP canlı maaş hesabı seçili HYP ayını ve yılını maaş motoruna aktarmalı.'
);

console.log('maas_nufus_tahmin_senkron_test OK');
