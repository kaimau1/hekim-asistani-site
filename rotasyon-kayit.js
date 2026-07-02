import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, updateProfile, sendEmailVerification, setPersistence, browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-functions.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4qoG_wGN4tmXxdBDEP_ZvsjWjAOQ0-5o",
  authDomain: "hekim-asistani.firebaseapp.com",
  projectId: "hekim-asistani",
  storageBucket: "hekim-asistani.firebasestorage.app",
  messagingSenderId: "660353778151",
  appId: "1:660353778151:web:8fee3d1eeb4f56df023d42",
  measurementId: "G-56PPSQLEBW"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.languageCode = 'tr';
setPersistence(auth, browserLocalPersistence).catch(() => {});
const functions = getFunctions(app, 'us-central1');
const rotasyonDavetKayitOl = httpsCallable(functions, 'rotasyonDavetKayitOl');

const TURNSTILE_SITE_KEY = '0x4AAAAAADXauKbGgFf9tzCp';
const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&hl=tr';

const form = document.getElementById('rotasyonKayitForm');
const durumEl = document.getElementById('rkDurum');
const gonderBtn = document.getElementById('rkGonder');
const turnstileAlan = document.getElementById('rkTurnstile');
let turnstileWidgetId = null;

function durum(metin, tip = 'bilgi') {
  durumEl.textContent = metin || '';
  durumEl.dataset.tip = tip;
}

function davetToken() {
  const p = new URLSearchParams(location.search);
  return p.get('davet') || p.get('rotasyonDavet') || '';
}

function turnstileYukle() {
  return new Promise((resolve, reject) => {
    if (window.turnstile?.render) return resolve(window.turnstile);
    const s = document.createElement('script');
    s.src = TURNSTILE_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => reject(new Error('turnstile-yuklenemedi'));
    document.head.appendChild(s);
  });
}

async function turnstileRender() {
  try {
    const ts = await turnstileYukle();
    if (turnstileWidgetId !== null) return;
    turnstileWidgetId = ts.render(turnstileAlan, { sitekey: TURNSTILE_SITE_KEY, action: 'rotasyon_kayit' });
  } catch (_) {
    // Turnstile yuklenemese de form gozuksun; gonderimde tekrar denenir.
  }
}

function turnstileToken() {
  try {
    return window.turnstile?.getResponse(turnstileWidgetId ?? undefined) || '';
  } catch (_) {
    return '';
  }
}

function turnstileSifirla() {
  try {
    window.turnstile?.reset(turnstileWidgetId ?? undefined);
  } catch (_) {}
}

function hataMetni(err) {
  const kod = String(err?.code || '').replace('functions/', '');
  if (kod === 'already-exists') return 'Bu e-posta zaten kayıtlı. Giriş sekmesinden giriş yapın.';
  if (kod === 'permission-denied') return 'Davet linki geçersiz veya süresi dolmuş. Yöneticinizden yeni link isteyin.';
  if (kod === 'failed-precondition') return err?.message || 'Davet linki henüz hazır değil. Yöneticinizle iletişime geçin.';
  if (kod === 'invalid-argument') return err?.message || 'Girdiğiniz bilgileri kontrol edin.';
  if (kod === 'unavailable' || kod === 'internal') return 'Sunucuya ulaşılamadı. Lütfen birazdan tekrar deneyin.';
  return err?.message || 'Kayıt tamamlanamadı. Lütfen tekrar deneyin.';
}

document.getElementById('rkSifreGoster')?.addEventListener('click', () => {
  const inp = document.getElementById('rkSifre');
  const goster = inp.type === 'password';
  inp.type = goster ? 'text' : 'password';
  const btn = document.getElementById('rkSifreGoster');
  btn.textContent = goster ? 'Gizle' : 'Göster';
  btn.setAttribute('aria-pressed', String(goster));
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = davetToken();
  if (!token) {
    durum('Bu sayfaya geçerli bir davet linkiyle gelmelisiniz.', 'hata');
    return;
  }
  const ad = document.getElementById('rkAd').value.trim();
  const email = document.getElementById('rkEmail').value.trim();
  const sifre = document.getElementById('rkSifre').value;
  const onay = document.getElementById('rkOnay').checked;

  if (ad.length < 3) { durum('Ad soyad zorunludur.', 'hata'); return; }
  if (!email) { durum('E-posta girin.', 'hata'); return; }
  if (sifre.length < 6) { durum('Şifre en az 6 karakter olmalı.', 'hata'); return; }
  if (!onay) { durum('Devam etmek için onay kutusunu işaretleyin.', 'hata'); return; }

  await turnstileRender();
  const tToken = turnstileToken();
  if (!tToken) { durum('Lütfen "Başarılı" görene kadar bot doğrulamasını bekleyin.', 'hata'); return; }

  gonderBtn.disabled = true;
  durum('Kaydınız oluşturuluyor...', 'bilgi');
  try {
    const sonuc = await rotasyonDavetKayitOl({ ad, email, sifre, sicil: '', davetToken: token, turnstileToken: tToken });
    if (!sonuc?.data?.ok) throw new Error('Kayıt tamamlanamadı.');
    // Hesap olusturuldu; girdigi e-posta/sifre ile giris yap (custom token'a gerek yok).
    const cred = await signInWithEmailAndPassword(auth, email, sifre);
    const isim = sonuc?.data?.adSoyad || ad;
    if (cred.user) {
      try { await updateProfile(cred.user, { displayName: isim }); } catch (_) {}
      try { await sendEmailVerification(cred.user); } catch (_) {}
    }
    const eslesti = sonuc?.data?.eslesti;
    const adet = sonuc?.data?.aktarilanKayit || 0;
    durum(eslesti
      ? `Hoş geldiniz ${isim}. ${adet} planlı rotasyonunuz yüklendi, yönlendiriliyorsunuz...`
      : 'Kaydınız oluşturuldu, yönlendiriliyorsunuz...', 'ok');
    setTimeout(() => { location.href = 'rotasyon.html'; }, 1200);
  } catch (err) {
    const kod = String(err?.code || '').replace('functions/', '');
    // Kurtarma: ilk denemede sunucu/ag hatasi olduysa hesap ASLINDA olusmus olabilir
    // (sonraki deneme "already-exists" der). Girdigi sifreyle giris dene; olursa yonlendir.
    if (kod === 'already-exists' || kod === 'unavailable' || kod === 'internal') {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, sifre);
        if (cred?.user) {
          durum('Hesabınız zaten oluşturulmuş, giriş yapıldı. Yönlendiriliyorsunuz...', 'ok');
          setTimeout(() => { location.href = 'rotasyon.html'; }, 1000);
          return;
        }
      } catch (_) {
        // Giris olmadi: gercekten baskasinin hesabi ya da sifre farkli -> normal hata mesaji.
      }
    }
    durum(hataMetni(err), 'hata');
    turnstileSifirla();
    gonderBtn.disabled = false;
  }
});

if (!davetToken()) {
  durum('Bu sayfaya geçerli bir davet linkiyle gelmelisiniz.', 'hata');
}
turnstileRender();
