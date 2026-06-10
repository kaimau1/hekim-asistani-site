const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');

const indexHtml = oku('index.html');
const siteJs = oku('site.js');
const authJs = oku('auth.js');
const hafizaJs = oku('hafiza.js');
const maasHtml = oku('maas-hesaplama.html');
const maasJs = oku('maas-hesaplama.js');
const backgroundJs = fs.readFileSync(path.join(kok, '..', 'Ahek Plus', 'background.js'), 'utf8');

assert(authJs.includes('return { ok: true, zaman: veri.istemciGuncellenme };'), 'auth.js: kaydet sonucu son bulut kayit zamanini dondurmeli');
assert(authJs.includes("return { ok: true, zaman: veri?.istemciGuncellenme || veri?.senkron?.istemciGuncellenme || null };"), 'auth.js: cek sonucu buluttaki kayit zamanini dondurmeli');
assert(hafizaJs.includes('ahek-hyp-son-bulut-kayit-zamani-v1'), 'hafiza.js: son bulut kayit zamanini yerel teknik bilgi olarak saklamali');
assert(hafizaJs.includes('Son bulut kayd'), 'hafiza.js: Buluta Kaydet title metninde son bulut kaydi gosterilmeli');
assert(hafizaJs.includes('sonKayitZamaniYaz(sonuc.zaman || Date.now())'), 'hafiza.js: Buluta Kaydet basarili olunca hover tarihini guncellemeli');
assert(hafizaJs.includes('sonKayitZamaniYaz(sonuc.zaman);'), 'hafiza.js: Buluttan Cek basarili olunca bulut kayit tarihini guncellemeli');
assert(hafizaJs.includes('hedefAy = typeof window.hesapAktifAyOku') &&
  hafizaJs.includes('window.hesapBulut.cek(hedefAy)'),
  'hafiza.js: Buluttan Cek acik olan HYP ayini auth.js cek akisina hedef ay olarak gondermeli');
assert(!hafizaJs.includes('hesap-eklenti-veri-geldi'), 'hafiza.js: Buluttan Cek eklenti veri geldi olayini ay bilgisiz tetiklememeli');

// ── Item 1: Son veri çekimi kaldırıldı ──
assert(!indexHtml.includes('hypV2SonVeriCekim'), 'index.html: son veri çekimi span kaldırılmalı');
assert(!siteJs.includes('_sonVeriCekim'), 'site.js: _sonVeriCekim fonksiyonları kaldırılmalı');
assert(!siteJs.includes('HYP_V2_SON_VERI_CEKIM_KEY'), 'site.js: son veri çekim anahtarı kaldırılmalı');

// ── Item 2: HYP butonları bulut butonuna dönüştü ──
assert(indexHtml.includes('☁ Buluta Kaydet'), 'index.html: Buluta Kaydet butonu olmalı');
assert(indexHtml.includes('⬇ Buluttan Çek'), 'index.html: Buluttan Çek butonu olmalı');
assert(!indexHtml.includes('Hafızaya Al'), 'index.html: eski Hafızaya Al kaldırılmalı');
assert(!indexHtml.includes('Geri Getir'), 'index.html: eski Geri Getir kaldırılmalı');

// ── Item 2: auth.js manuel bulut + otomatik senkron kapalı ──
assert(authJs.includes('window.hesapBulut'), 'auth.js: window.hesapBulut export edilmeli');
assert(/hesapBulut\s*=\s*\{[\s\S]*kaydet[\s\S]*cek/.test(authJs), 'auth.js: hesapBulut kaydet+cek içermeli');
assert(authJs.includes('function _ayAnahtariGecerliMi') &&
  authJs.includes('function _bulutHedefAySec') &&
  authJs.includes('_formaUygula(veri, { hedefAy, tekAy: true })'),
  'auth.js: Buluttan Cek bulut aktif ayina degil, kullanicinin acik tuttugu hedef aya uygulanmali');
assert(!authJs.includes('_profilYukle(user.uid)'), 'auth.js: girişte otomatik _profilYukle çağrısı kaldırılmalı');
assert(!authJs.includes("addEventListener('hesap-verisi-degisti', _profilKaydetDebounced)"), 'auth.js: otomatik yazma listener kaldırılmalı');
assert(!authJs.includes("window.addEventListener('pagehide', _profilHemenKaydet)"), 'auth.js: pagehide flush kaldırılmalı');
assert(!backgroundJs.includes('_firestoreHesapYazBG(sonAyar)'), 'background.js: site veri cekme akisi Buluta Kaydet olmadan Firestore hesap kaydi yazmamali');

// ── Item 2: hafiza.js bulut bağlama ──
assert(hafizaJs.includes('window.hesapBulut'), 'hafiza.js: window.hesapBulut kullanmalı');
assert(!hafizaJs.includes('hesap_hafiza_v1'), 'hafiza.js: eski yerel snapshot anahtarı kaldırılmalı');
assert(hafizaJs.includes('confirm('), 'hafiza.js: Buluttan Çek onay sormalı');

// ── Item 2: Maaş manuel bulut ──
assert(maasHtml.includes('maasBuluttanCek'), 'maas html: Buluttan Çek butonu olmalı');
assert(maasHtml.includes('⬇ Buluttan Çek'), 'maas html: Buluttan Çek etiketi olmalı');
assert(maasHtml.includes('☁ Buluta Kaydet'), 'maas html: Buluta Kaydet etiketi olmalı');
assert(maasJs.includes("getElementById('maasBuluttanCek')"), 'maas js: Buluttan Çek handler olmalı');
assert(!maasJs.includes("firebase-hazir', () => maasBulutKaydiniYukle"), 'maas js: firebase-hazir otomatik yükleme kaldırılmalı');

console.log('manuel_bulut_senkron_test OK');
