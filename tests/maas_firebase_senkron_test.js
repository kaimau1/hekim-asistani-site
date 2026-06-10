const fs = require('fs');
const path = require('path');
const assert = require('assert');

const js = fs.readFileSync(path.resolve(__dirname, '..', 'maas-hesaplama.js'), 'utf8');

assert(js.includes("KAYIT_META_ANAHTARI = 'ahek-maas-hesaplama-form-meta-v1'"), 'yerel kayit meta anahtari olmali');
assert(js.includes('let maasYerelDegisimZamani = 0;'), 'yerel degisim zamani takip edilmeli');
assert(js.includes('function yerelKayitMetaOku()'), 'yerel meta okuma fonksiyonu olmali');
assert(js.includes('function yerelKayitMetaYaz(guncellenme)'), 'yerel meta yazma fonksiyonu olmali');
assert(js.includes('const istemciGuncellenme = Date.now();'), 'Firebase kaydina istemci guncellenme zamani yazilmali');
assert(js.includes('istemciGuncellenme,'), 'Firebase payload istemci guncellenme zamanini icermeli');
assert(js.includes('const uzakGuncellenme = Number(kayit.istemciGuncellenme || 0);'), 'bulut kaydinin zamani okunmali');
assert(js.includes('const yerelGuncellenme = Math.max(maasYerelDegisimZamani, maasSonYerelKayitZamani);'), 'yerel ve bulut zamani karsilastirilmali');
assert(js.includes('uzakGuncellenme < yerelGuncellenme'), 'eski bulut kaydi yerel veriyi ezmemeli');
assert(js.includes('Buluttaki eski kayit uygulanmadi'), 'kullaniciya eski bulut kaydinin uygulanmadigi yazilmali');
assert(js.includes('yerelKayitPlanla({ yerelDegisim: false });'), 'buluttan gelen kayit yerel degisim gibi isaretlenmemeli');

console.log('maas_firebase_senkron_test OK');
