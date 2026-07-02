const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');

const authJs = oku('auth.js');
const girisHtml = oku('giris.html');
const indexHtml = oku('index.html');
const profilHtml = oku('profil.html');
const functionsTs = fs.readFileSync(path.resolve(kok, '..', 'firebase-functions', 'src', 'index.ts'), 'utf8');

assert(authJs.includes("httpsCallable(functions, 'turnstileDogrula')"), 'auth.js Turnstile callable kullanmali');
assert(authJs.includes("giris: { formId: 'authGirisForm'"), 'giris formu Turnstile ayari olmali');
assert(authJs.includes("kayit: { formId: 'authKayitForm'"), 'kayit formu Turnstile ayari olmali');
assert(authJs.includes('async function turnstileGirisDogrula'), 'giris icin bot dogrulama fonksiyonu olmali');
assert(authJs.includes("await turnstileGirisDogrula('giris')"), 'e-posta girisi bot dogrulamadan gecmeli');
assert(authJs.includes('const botGecti = await turnstileGirisDogrula(amac);'), 'Google girisi bot dogrulamadan gecmeli');
assert(authJs.includes("setTimeout(() => { turnstileRenderEt('giris'); }, 120);"), 'giris Turnstile kutusu ilk acilista yuklenmeli');
assert(authJs.includes('data-turnstile-giris'), 'modal giris formunda Turnstile alani olmali');
assert(authJs.includes('data-turnstile-kayit'), 'modal kayit formunda Turnstile alani olmali');

for (const [ad, html] of [['giris.html', girisHtml], ['index.html', indexHtml]]) {
  assert(html.includes('data-turnstile-giris'), `${ad} giris formunda Turnstile alani olmali`);
  assert(html.includes('data-turnstile-kayit'), `${ad} kayit formunda Turnstile alani olmali`);
}

assert(profilHtml.includes('class="auth-alan auth-bekliyor"'), 'profil sayfasinda ust profil/auth alani olmali');
assert(profilHtml.includes('src="auth.js'), 'profil sayfasi auth.js yuklemeli');
assert(functionsTs.includes('export const turnstileDogrula = onCall'), 'Firebase tarafinda turnstileDogrula callable olmali');
assert(functionsTs.includes('await turnstileTokenDogrula(turnstileToken'), 'callable Turnstile tokenini dogrulamali');

console.log('auth_turnstile_test OK');
