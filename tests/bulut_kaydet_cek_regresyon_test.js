const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');

const authJs = oku('auth.js');
const maasJs = oku('maas-hesaplama.js');
const hafizaJs = oku('hafiza.js');
const hesaplaJs = oku('hesapla.js');

const manuelKaydetBaslangic = authJs.indexOf('async kaydet()');
const formToplama = authJs.indexOf('const veri = _formdanTopla();', manuelKaydetBaslangic);
const localFlush = authJs.indexOf('window.hesapLocalKaydet?.();', manuelKaydetBaslangic);
assert(
  manuelKaydetBaslangic >= 0 && localFlush > manuelKaydetBaslangic && localFlush < formToplama,
  'auth.js: Buluta Kaydet, _formdanTopla oncesinde aktif ekrani aylik arsive flush etmeli'
);

assert(
  authJs.includes('function _bulutAyKaydiSec') &&
    authJs.includes('function _bulutKaydiBirlestir') &&
    authJs.includes('_veriDoluMu(ayKaydi)') &&
    authJs.includes('_veriDoluMu(rootKayit)') &&
    authJs.includes('rootKayit.ayAnahtari === hedefAy'),
  'auth.js: Buluttan Cek, hedef ayin aylik kaydi bos/stale ise ayni aya ait dolu root kaydi kurtarmali'
);

assert(
  authJs.includes('function _bulutKriterHaritasiBirlestir') &&
    authJs.includes('hypV2: _bulutHesapBolumuBirlestir(rootKayit?.hypV2, ayKaydi?.hypV2)') &&
    authJs.includes('asc: _bulutHesapBolumuBirlestir(rootKayit?.asc, ayKaydi?.asc)'),
  'auth.js: Buluttan Cek, kismi aylik kaydi root HYP/ASC kaydiyla derin birlestirmeli'
);

assert(
  authJs.includes('function _aktifAyKaydiniBulutaAyna') &&
    authJs.includes('kayitlar[aktifAy] = _bulutKaydiBirlestir(kayitlar[aktifAy], kokKayit);') &&
    authJs.includes('_aktifAyKaydiniBulutaAyna(veri);'),
  'auth.js: Buluta Kaydet, aktif ayin tam root kaydini aylik.kayitlar[aktifAy] alanina aynalamali'
);

const manuelSetDoc = authJs.indexOf('await setDoc(ref, veri, { merge: true });', manuelKaydetBaslangic);
const sunucuOnayi = authJs.indexOf('await _bulutSunucuOnayiBekle();', manuelKaydetBaslangic);
const manuelOk = authJs.indexOf('return { ok: true, zaman: veri.istemciGuncellenme };', manuelKaydetBaslangic);
assert(
  authJs.includes('waitForPendingWrites') &&
    authJs.includes('async function _bulutSunucuOnayiBekle') &&
    manuelSetDoc > manuelKaydetBaslangic &&
    sunucuOnayi > manuelSetDoc &&
    sunucuOnayi < manuelOk,
  'auth.js: Buluta Kaydet, Kaydedildi sonucunu sunucu pending write onayindan sonra dondurmeli'
);

assert(
  authJs.includes("_senkStatus('☁ Buluta gönderiliyor…', 'kaydediliyor');") &&
    authJs.includes("_senkStatus('☁ Buluta kaydedildi', 'ok');") &&
    authJs.includes("if (_manuelBulutKaydetPromise) return { ok: false, sebep: 'kayit-suruyor' };"),
  'auth.js: Kaydetme sirasinda kullaniciya gonderiliyor bilgisi verilmeli ve es zamanli cek engellenmeli'
);

assert(
  authJs.includes('let _manuelBulutKaydetPromise = null;') &&
    authJs.includes('_manuelBulutKaydetPromise = kaydetPromise;') &&
    authJs.includes('if (_manuelBulutKaydetPromise === kaydetPromise) _manuelBulutKaydetPromise = null;'),
  'auth.js: manuel bulut kayit promise durumu takip edilmeli'
);

assert(
  authJs.includes('const _BULUT_CEK_BEKLEME_MS = 60000;') &&
    authJs.includes('let _sonManuelBulutKayitOnayZamani = 0;') &&
    authJs.includes('_sonManuelBulutKayitOnayZamani = Date.now();') &&
    authJs.includes("return { ok: false, sebep: 'bekleme', kalanMs };"),
  'auth.js: Buluta Kaydet sonrasi Buluttan Cek en az 1 dakika engellenmeli'
);

assert(
  hafizaJs.includes("toast('☁ Buluta gönderiliyor, lütfen bekleyin…', 'bilgi');") &&
    hafizaJs.includes("const cekBtn = document.getElementById('btnHafizaGetir');") &&
    hafizaJs.includes('if (cekBtn) cekBtn.disabled = true;') &&
    hafizaJs.includes('if (cekBtn && cekBeklemeKalanSn() <= 0) cekBtn.disabled = false;') &&
    hafizaJs.includes("sonuc?.sebep === 'kayit-suruyor'"),
  'hafiza.js: kayit sirasinda kullanici bilgilendirilmeli ve Buluttan Cek gecici kilitlenmeli'
);

assert(
  hafizaJs.includes('const CEK_BEKLEME_MS = 60000;') &&
    hafizaJs.includes('function cekBeklemeBaslat') &&
    hafizaJs.includes('cekBeklemeBaslat(CEK_BEKLEME_MS);') &&
    hafizaJs.includes('Buluttan Çek 1 dk sonra açılacak') &&
    hafizaJs.includes("sonuc?.sebep === 'bekleme'"),
  'hafiza.js: Kaydet basarisi sonrasi Buluttan Cek butonu 20 saniye geri sayimla pasif kalmali'
);

assert(
  !maasJs.includes('maasBulutKaydiniYukle(window._currentUid);'),
  'maas-hesaplama.js: Maas bulut kaydi sayfa acilisinda otomatik cekilmemeli, yalniz Buluttan Cek ile gelmeli'
);

// Manuel "Buluttan Cek" kullanici tarafindan onaylanir (bulut kazanir):
// elle duzenlenmis (kirli) alanlar da ezilmeli. cek, _formaUygula'dan ONCE
// hesapKirliAlanTemizle ile kirli kumeyi temizlemeli; aksi halde _alanDegeriYaz
// kirli alani atlar ve cek no-op olur (Haziran htTarama-G manuel duzenleme bug'i).
const cekBaslangic = authJs.indexOf('async cek(hedefAy)');
const cekKirliTemizle = authJs.indexOf('window.hesapKirliAlanTemizle?.();', cekBaslangic);
const cekFormaUygula = authJs.indexOf('_formaUygula(veri, { hedefAy, tekAy: true })', cekBaslangic);
assert(
  cekBaslangic >= 0 &&
    cekKirliTemizle > cekBaslangic &&
    cekFormaUygula > cekKirliTemizle,
  'auth.js: Buluttan Cek, _formaUygula oncesinde kirli alanlari temizlemeli (elle duzenleneni bulut ezmeli)'
);

// Manuel "Buluttan Cek" YALNIZ aktif aya islem yapmali (diger aylara dokunmamali).
// cek, _formaUygula'ya tekAy:true gecmeli; _formaUygula tekAy'da hesapAylikKayitlarYaz
// (tum aylari ezer) yerine hesapTekAyKaydiYaz (tek ay merge) kullanmali; hesapla.js
// bu tek-ay fonksiyonunu _aylikKayitYaz ile (mevcut arsive merge) saglamali.
assert(
  authJs.includes('_formaUygula(veri, { hedefAy, tekAy: true })'),
  'auth.js: cek, manuel cekiste _formaUygula\'ya tekAy:true gecmeli'
);
assert(
  authJs.includes('if (opts.tekAy && hedefAy && typeof window.hesapTekAyKaydiYaz === \'function\')') &&
    authJs.includes('window.hesapTekAyKaydiYaz(hedefKayit, hedefAy);'),
  'auth.js: _formaUygula, tekAy modunda yalniz hedef ayi yazmali (hesapTekAyKaydiYaz)'
);
assert(
  hesaplaJs.includes('window.hesapTekAyKaydiYaz = function') &&
    hesaplaJs.includes('_aylikKayitYaz(ayKaydi, ayAnahtari, { aktifAyGuncelle: true })'),
  'hesapla.js: hesapTekAyKaydiYaz, mevcut arsive merge ederek yalniz hedef ayi guncellemeli'
);

console.log('bulut_kaydet_cek_regresyon_test OK');
