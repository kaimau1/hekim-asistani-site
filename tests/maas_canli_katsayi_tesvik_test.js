const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(kok, 'maas-hesaplama.html'), 'utf8');
const js = fs.readFileSync(path.join(kok, 'maas-hesaplama.js'), 'utf8');
const hesapla = fs.readFileSync(path.join(kok, 'hesapla.js'), 'utf8');
const css = fs.readFileSync(path.join(kok, 'style.css'), 'utf8');

assert(js.includes('hypBasariKSKriterlerden'), 'maas-hesaplama.js HYP katsayisini kayitli HYP kriterlerinden hesaplamali');
assert(!js.includes('kayit?.asc?.hekimKS'), 'maas canli HYP katsayisi ASÇ hekimKS alanina bagli kalmamali');
assert(js.includes('hypBasariHamKS'), 'maas canli HYP katsayisi son canli HYP katsayisi onbellegine dusebilmeli');
assert(hesapla.includes('hypKaydindanBasariKS'), 'ASÇ Hekim HYP prefill aktif/son kayitli HYP kriterlerinden hesaplamali');

[
  'maas-tesvik-kht',
  'maas-tesvik-ilac',
  'maas-tesvik-memnuniyet',
  'maas-tesvik-muayene',
  'maas-hyp-katsayi-alani',
].forEach((sinif) => {
  assert(html.includes(sinif), `maas-hesaplama.html ${sinif} sinifini icermeli`);
  assert(css.includes(`.${sinif}`), `style.css ${sinif} stilini icermeli`);
});

assert(js.includes('hypKatsayiZorunluDurumunuGuncelle'), 'HYP katsayi bos/hatali durumunu JS guncellemeli');
assert(css.includes('@keyframes maasHypKatsayiYanipSon'), 'HYP katsayi eksikken yanip sonme animasyonu olmali');
assert(css.includes('.maas-hyp-katsayi-eksik'), 'HYP katsayi eksik sinifi stillenmeli');

console.log('maas_canli_katsayi_tesvik_test OK');
