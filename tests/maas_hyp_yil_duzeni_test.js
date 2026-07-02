const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(kok, 'maas-hesaplama.html'), 'utf8');
const js = fs.readFileSync(path.join(kok, 'maas-hesaplama.js'), 'utf8');
const css = fs.readFileSync(path.join(kok, 'style.css'), 'utf8').replace(/\r\n/g, '\n');

assert(
  html.includes('<label class="maas-onemli-alan maas-yil-secici">Yıl') &&
    html.includes('name="hesapYil"') &&
    html.includes('Hesaplanacak ay'),
  'Maas ekraninda Hesaplanacak ay alaninin ustunde ayri yil secici olmali.'
);

assert(
  html.includes('<input name="hypKatsayiCanliCek" type="checkbox"> Oto Çek') &&
    html.includes('<label class="maas-hyp-kabul-alani">Kabul edilen') &&
    /class="maas-hyp-katsayi-bilgi" role="note" hidden/.test(html),
  'Maas HYP alanlarinda Oto Cek ve Kabul edilen etiketleri kullanilmali; bilgi notu gizlenmeli.'
);

assert(
  html.includes('class="maas-manuel-nufus-alani"><span class="maas-alan-etiket">Nüfus <span class="maas-puan-uyari maas-nufus-uyari"') &&
    html.includes('Nüfus Puanınız <span class="maas-puan-uyari maas-nufus-uyari"') &&
    html.includes('Gelmeyen Nüfus Puanınız <span class="maas-puan-uyari maas-nufus-uyari"') &&
    js.includes('function manuelNufusUyariDurumunuGuncelle()') &&
    js.includes("const adlar = ['manuelToplamNufus', 'hamNufusPuani', 'gelmeyenNufusPuani'];"),
  'Manuel nufus alanlari bos birakildiginda unlem uyarisi gostermeli.'
);

assert(
  html.includes('name="muayeneHedef"') &&
    html.includes('name="muayeneOrtalama"') &&
    html.includes('class="maas-tesvik-etiket">Muayene hedefi</span>') &&
    html.includes('class="maas-tesvik-etiket">Ortalama Muayene</span>') &&
    html.includes('class="maas-puan-uyari maas-muayene-uyari"') &&
    js.includes('function muayeneUyariDurumunuGuncelle()') &&
    js.includes("const adlar = ['muayeneHedef', 'muayeneOrtalama'];"),
  'Muayene hedefi ve ortalama alanlari 0 iken unlem uyarisi gostermeli.'
);

assert(
  html.includes('<option value="13.96" selected>%13,96 piyasa tahmini</option>') &&
    html.includes('<option value="7" selected>%7,00 piyasa tahmini</option>') &&
    js.includes("temmuzZamSenaryosuEl.value === '13.75'") &&
    js.includes("temmuzZamSenaryosuEl.value = '13.96';"),
  'Temmuz varsayilani %13,96; Ocak varsayilani ise %7,00 piyasa tahmini olmali.'
);

assert(
  css.includes('.maas-muayene-uyari[hidden] {') &&
    css.includes('.maas-tesvik-muayene.maas-muayene-eksik {') &&
    css.includes('.maas-alan-etiket {') &&
    css.includes('.maas-manuel-nufus-alani.maas-manuel-nufus-eksik {') &&
    css.includes('.maas-kart.maas-hepsi-onemli .maas-tesvik-kolon:not(.maas-tesvik-kolon-tek):last-child > label.maas-tesvik-muayene {') &&
    css.includes('.maas-tesvik-muayene > .maas-tesvik-etiket {') &&
    css.includes('.maas-tesvik-muayene > .maas-muayene-uyari {') &&
    css.includes('grid-column: 3 !important;') &&
    css.includes('.maas-yil-secici {'),
  'Muayene uyari rozeti ayni satirda kalmali ve yil secici icin ozel stil bulunmali.'
);

console.log('maas_hyp_yil_duzeni_test OK');
