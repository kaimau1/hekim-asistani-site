const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const ssOkuYol = path.join(kok, 'ahek-plus-web', 'ss_oku.js');
const index = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'style.css'), 'utf8');
const ssOku = require(ssOkuYol);

// ── 1) Konum-ızgara eşleme (gerçek pano: 4 sütun × 4 satır, satır-major) ──
// Gerçek hyp.png dashboard değerleriyle birebir senaryo. 4 sütun x≈, 4 satır y≈.
const X = [460, 1400, 2345, 3287];   // sütun merkezleri
const Y = [157, 396, 635, 875];      // satır merkezleri
function sayi(deger, c, r) {
  return { deger, bbox: { x0: X[c] - 25, y0: Y[r] - 35, x1: X[c] + 25, y1: Y[r] + 35 } };
}
const grid = [
  [32, 33, 15, 15],
  [11, 33, 35, 14],
  [7, 17, 3, 4],
  [1, 1, 2, 0],
];
const sayilar = [];
grid.forEach((satir, r) => satir.forEach((d, c) => sayilar.push(sayi(d, c, r))));
const sonuc = ssOku._izgaraEslestir(sayilar, 3400, 960);
const bekle = {
  htTarama: 32, htTakip: 33, kvrTarama: 15, kvrTakip: 15,
  dmTarama: 11, dmTakip: 33, obzTarama: 35, obzTakip: 14,
  kah: 7, yasli: 17, inme: 3, kbh: 4,
  koah: 1, astim: 1,
};
Object.entries(bekle).forEach(([k, v]) => {
  assert.strictEqual(sonuc[k], v, `Izgara eşleme: ${k}=${v} (bulunan: ${sonuc[k]})`);
});
// OSB (r3,c2) ve GENEL (r3,c3) hücreleri HYP'ye yazılmaz → sonuçta olmamalı
assert.strictEqual(Object.values(sonuc).length, 14, 'OSB+GENEL hariç 14 kriter eşleşmeli');

// Eksik sayı kayması yapmaz: bir hücre okunmazsa diğerleri doğru kalır
const eksik = sayilar.filter(s => !(s.deger === 11)); // dmTarama (r1,c0) kaçtı varsay
const sonuc2 = ssOku._izgaraEslestir(eksik, 3400, 960);
assert.strictEqual(sonuc2.dmTarama, undefined, 'Kaçan hücre boş kalmalı');
assert.strictEqual(sonuc2.dmTakip, 33, 'Komşu hücre kaymadan doğru kalmalı');
assert.strictEqual(sonuc2.obzTarama, 35, 'Aynı satır sonraki sütun doğru kalmalı');

// ── 3) UI / entegrasyon (kaynak string) ──
assert(index.includes('data-modal-ac="ssOkuModal"'), 'index.html SS oku açma butonu içermeli');
// SS'ten Oku yalnız admin'e açık olmalı (data-web-admin-only + başlangıçta hidden)
assert(
  /<button id="ssOkuAc"[^>]*data-web-admin-only="1"[^>]*hidden/.test(index),
  'SS oku butonu admin-only olmalı (data-web-admin-only="1" + hidden)'
);
assert(index.includes('id="ssOkuModal"'), 'index.html ssOkuModal modalını içermeli');
assert(index.includes('vendor/tesseract/tesseract.min.js'), 'index.html Tesseract self-host scriptini içermeli');
assert(index.includes('ss_oku.js?v='), 'index.html ss_oku.js scriptini cache-bust ile içermeli');
assert(
  index.includes("data-modal-kapat-sonra=\"ssOkuModal\""),
  'Uygula butonu modal kapatma için data-modal-kapat-sonra taşımalı'
);

// ── 4) CSP — WASM + worker + blob izinleri ──
const cspMatch = index.match(/Content-Security-Policy" content="([^"]+)"/);
assert(cspMatch, 'CSP meta etiketi bulunmalı');
const csp = cspMatch[1];
assert(/script-src[^;]*'wasm-unsafe-eval'/.test(csp), "CSP script-src 'wasm-unsafe-eval' içermeli (Tesseract WASM)");
assert(/worker-src[^;]*blob:/.test(csp), 'CSP worker-src blob: içermeli');
assert(/img-src[^;]*blob:/.test(csp), 'CSP img-src blob: içermeli (önizleme)');

// ── 5) Stil ──
assert(css.includes('.modal-ss-oku {') && css.includes('.ss-oku-drop {'), 'SS oku modal stilleri tanımlı olmalı');

// ── 6) Vendor asset'leri repoda mevcut ──
const vendor = path.join(kok, 'ahek-plus-web', 'vendor', 'tesseract');
['tesseract.min.js', 'worker.min.js', 'tur.traineddata.gz'].forEach(f => {
  assert(fs.existsSync(path.join(vendor, f)), `vendor/tesseract/${f} repoda bulunmalı`);
});

console.log('site_ss_oku_test OK');
