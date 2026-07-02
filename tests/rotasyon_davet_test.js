const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');
const giris = oku('giris.html');
const auth = oku('auth.js');
const style = oku('style.css');
const functions = fs.readFileSync(path.resolve(kok, '..', 'firebase-functions/src/rotasyonServisi.ts'), 'utf8');

assert(giris.includes('data-rotasyon-davet-panel'), 'giris.html rotasyon davet paneli icermeli');
assert(giris.includes('Ankara Tip SAHU'), 'giris.html Ankara Tip SAHU metni icermeli');
assert(auth.includes("httpsCallable(functions, 'rotasyonDavetKayitOl')"), 'auth.js rotasyonDavetKayitOl callable kullanmali');
assert(auth.includes('rotasyonDavetModuAktifMi'), 'auth.js davet modu tespit fonksiyonu olmali');
assert(auth.includes('googleButonlariniRotasyonDavetindeGizle'), 'auth.js davet modunda Google butonlarini gizlemeli');
assert(auth.includes('kayitAd.required = true'), 'auth.js davet modunda ad soyad zorunlu olmali');
assert(functions.includes('createCustomToken'), 'rotasyonDavetKayitOl custom token uretmeli');
assert(functions.includes('members/${user.uid}'), 'rotasyonDavetKayitOl member dokumani yazmali');
assert(style.includes('.rotasyon-davet-panel'), 'style.css davet paneli stili icermeli');

console.log('rotasyon_davet_test OK');
