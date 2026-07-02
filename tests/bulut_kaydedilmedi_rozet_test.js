// "Buluta kaydedilmedi" güvenlik butonu regresyon testi.
// Kullanıcı yereldeki HYP/ASÇ değişikliğini buluta kaydetmediyse görünür bir
// kaydetme butonu gösterilmeli; çekiş/kaydet sonrası yanlış pozitif olmamalı.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');

const indexHtml = oku('index.html');
const hafizaJs = oku('hafiza.js');
const styleCss = oku('style.css');

// ── index.html: kirli uyarısı Buluta Kaydet yerine geçen buton olarak gizli başlar ──
assert(indexHtml.includes('id="hafizaKaydedilmedi"'),
  'index.html: "Buluta kaydedilmedi" butonu bulunmalı');
assert(indexHtml.includes('<button id="hafizaKaydedilmedi" type="button"'),
  'index.html: "Buluta kaydedilmedi" tıklanabilir button olmalı');
assert(/id="hafizaKaydedilmedi"[^>]*\shidden/.test(indexHtml),
  'index.html: kirli butonu varsayılan gizli (hidden) olmalı');

// ── hafiza.js: dirty-kontrol mantığı ──
assert(hafizaJs.includes("getElementById('hafizaKaydedilmedi')"),
  'hafiza.js: kirli butonunu güncelleyen mantık olmalı');
assert(hafizaJs.includes("const kaydetBtn = document.getElementById('btnHafizaAl');") &&
  hafizaJs.includes('if (kaydetBtn) kaydetBtn.hidden = !girisVar || kaydedilmedi;'),
  'hafiza.js: kaydedilmedi durumunda normal Buluta Kaydet butonu gizlenmeli');
assert(hafizaJs.includes("document.getElementById('hafizaKaydedilmedi')?.addEventListener('click', bulutaKaydet);"),
  'hafiza.js: Buluta kaydedilmedi butonu Buluta Kaydet akisini calistirmali');
assert(hafizaJs.includes('window.hesapYerelGuncellenmeOku'),
  'hafiza.js: yerel son düzenleme zamanını okumalı');
assert(hafizaJs.includes('window._currentUid'),
  'hafiza.js: kirli butonu yalnız giriş yapılmışsa gösterilmeli (anonimde bulut yok)');
assert(hafizaJs.includes('let buOturumdaKaydedilecekDegisiklikVar = false;') &&
  hafizaJs.includes('buOturumdaKaydedilecekDegisiklikVar &&') &&
  hafizaJs.includes("window.addEventListener('hesap-verisi-degisti', kaydedilecekDegisiklikIsaretle);"),
  'hafiza.js: rozet sayfa açılışında değil, bu oturumda gerçek değişiklik olunca görünmeli');
assert(hafizaJs.includes("const KAYDEDILDI_SAYILAN_KAYNAKLAR = new Set(['cloud', 'yerel-acilis', 'yerel']);"),
  'hafiza.js: cloud/açılış/giriş kaynaklı yerel yükleme olayları kirli değişiklik sayılmamalı');

// Çekiş sonrası yanlış pozitif olmaması için ayrı "son senkron" damgası kullanılmalı,
// dirty-kontrolü doğrudan "son bulut kaydı" damgasına bakmamalı.
assert(hafizaJs.includes('ahek-hyp-son-senk-zamani-v1'),
  'hafiza.js: dirty-kontrolü için ayrı son senkron zamanı anahtarı olmalı');
assert(hafizaJs.includes('sonSenkZamaniYaz(Date.now());'),
  'hafiza.js: Buluta Kaydet/Buluttan Çek başarısında son senkron zamanı yazılmalı');

// KVKK: rozet mantığı yalnız zaman damgası/giriş bayrağı kullanır — bu bir teknik
// işaret kontrolüdür, hasta verisine dokunmaz (regresyon hatırlatması).

// ── style.css: kirli buton stili + performans kuralı (yalnız opacity animasyonu) ──
assert(styleCss.includes('.hafiza-kaydedilmedi'),
  'style.css: kirli buton stili tanımlı olmalı');
assert(styleCss.includes('cursor: pointer;') &&
  styleCss.includes('.hafiza-kaydedilmedi:hover'),
  'style.css: kirli buton tıklanabilir görünmeli');
assert(indexHtml.includes('Kaydetmek için tıkla') &&
  styleCss.includes('.hafiza-kaydedilmedi::after'),
  'index/style: kirli buton kaydetmek için tıklanacağını açık göstermeli');
assert(styleCss.includes('@keyframes hafiza-kaydedilmedi-bel'),
  'style.css: kirli buton animasyonu tanımlı olmalı');
assert(!/@keyframes hafiza-kaydedilmedi-bel\s*\{[^}]*(transform|box-shadow|filter|width|height|margin|left|top)/.test(styleCss),
  'style.css: kirli buton animasyonu yalnız opacity olmalı (performans kuralı)');

console.log('bulut_kaydedilmedi_rozet_test OK');
