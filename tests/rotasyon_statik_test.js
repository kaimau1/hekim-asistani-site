const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');
const html = oku('rotasyon.html');
const js = oku('rotasyon.js');
const css = oku('style.css');
const index = oku('index.html');

[
  'btnRotasyonIslemBaslat',
  'btnRotasyonBulutaGonder',
  'btnRotasyonIslemBitir',
  'rotasyonDurum',
  'rotasyonTablo',
  'rotasyonKendiListe',
  'rotasyonAdminPanel',
  'rotasyonAsistanBaslangicTarihi',
  'btnRotasyonBaslangicKaydet',
].forEach((id) => assert(html.includes(`id="${id}"`), `rotasyon.html ${id} icermeli`));

assert(html.includes('auth.js'), 'rotasyon.html auth.js yuklemeli');
assert(html.includes('rotasyon.js'), 'rotasyon.html rotasyon.js yuklemeli');
assert(js.includes("httpsCallable(functions, 'rotasyonDurumGetir')"), 'rotasyon.js durum callable kullanmali');
assert(js.includes("httpsCallable(functions, 'rotasyonIslemBaslat')"), 'rotasyon.js islem baslat callable kullanmali');
assert(js.includes("httpsCallable(functions, 'rotasyonBuluttanCek')"), 'rotasyon.js buluttan cek callable kullanmali');
assert(js.includes("httpsCallable(functions, 'rotasyonBulutaGonder')"), 'rotasyon.js buluta gonder callable kullanmali');
assert(js.includes('beforeunload'), 'rotasyon.js kaydedilmemis degisiklik uyarisi icermeli');
assert(!js.includes('onSnapshot'), 'rotasyon.js otomatik bulut snapshot kullanmamali');
assert(css.includes('.rotasyon-sayfasi'), 'style.css rotasyon sayfasi stili icermeli');
assert(index.includes('rotasyon.html'), 'ana nav rotasyon linki icermeli');
assert(js.includes('yerelTaslak'), 'rotasyon.js yerel taslak state tutmali');
assert(js.includes('canliUyarilariHesapla'), 'rotasyon.js canli uyari hesaplamali');
assert(js.includes('kapasiteUyarisiBul'), 'rotasyon.js kapasite uyarisi hesaplamali');
assert(js.includes('kisiCakismaUyarisiBul'), 'rotasyon.js cakisma uyarisi hesaplamali');
assert(js.includes('gunSiniriUyarisiBul'), 'rotasyon.js 183 gun uyarisi hesaplamali');
assert(js.includes('kaydedilmemisDegisiklikVar = true'), 'rotasyon.js taslak degisince kaydedilmemis bayragi set etmeli');
assert(js.includes('beklenenSurum'), 'rotasyon.js buluta gonderirken beklenen surum yollamali');
assert(html.includes('btnRotasyonDonemOnayla'), 'rotasyon.html donem onay butonu icermeli');
assert(html.includes('btnRotasyonDavetYenile'), 'rotasyon.html davet yenile butonu icermeli');
assert(js.includes("httpsCallable(functions, 'rotasyonDonemOnayla')"), 'rotasyon.js donem onay callable kullanmali');
assert(js.includes("httpsCallable(functions, 'rotasyonTemsilciAta')"), 'rotasyon.js temsilci ata callable kullanmali');
assert(js.includes("httpsCallable(functions, 'rotasyonDavetLinkiYenile')"), 'rotasyon.js davet linki callable kullanmali');
assert(js.includes("httpsCallable(functions, 'rotasyonAsistanBaslangicKaydet')"), 'rotasyon.js asistan baslangic tarihi kaydet callable kullanmali');
assert(js.includes('temsilci'), 'rotasyon.js temsilci rolunu UI yetkisinde kullanmali');
assert(js.includes("ROTASYON_VARSAYILAN_DONEM = '2026-2027'"), 'rotasyon ilk acilista 2026-2027 donemini secmeli');
assert(js.includes("api.planGetir"), 'rotasyon.js ilk acilista kilitsiz planGetir callable ile buluttan okumali');
assert(js.includes('planOtoYukle({ beklemePenceresi: true })'), 'rotasyon.js ilk acilista tablo hazir olana kadar bekleme penceresi gostermeli');
assert(css.includes('.rotasyon-yukleme'), 'style.css rotasyon yukleme penceresi stili icermeli');
assert(js.includes('komsuDonemleriBuluttanCek'), 'rotasyon.js tasan onceki/sonraki donem kayitlarini da cekmeli');
assert(js.includes('const SARKMA_AY = 3'), 'rotasyon tablosu onceki ve sonraki tasan ay kolonlarini icermeli');
assert(js.includes('gorunumKayitlari'), 'rotasyon.js tabloyu komsu donem kayitlariyla birlikte cizmeli');
assert(js.includes('asistanBaslangicTarihi'), 'rotasyon.js kullanicinin asistanliga baslangic tarihini takip etmeli');
assert(js.includes('Asistanliga baslangic tarihinizi kaydetmeden rotasyon ekleyemezsiniz'), 'rotasyon.js tarih yokken rotasyon eklemeyi engelleyen uyari vermeli');
assert(js.includes('btnRotasyonBaslangicKaydet'), 'rotasyon.js baslangic tarihi kaydet butonunu baglamali');

console.log('rotasyon_statik_test OK');
