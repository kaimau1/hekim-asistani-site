import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut, deleteUser
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore, doc, onSnapshot, setDoc, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

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
const db = getFirestore(app);
const YAZICI_KURULUM_URL = '../kurulum-dosyalari/HekimPlus_YaziciKurulum.exe';
const YAZICI_KALDIR_URL = '../kurulum-dosyalari/HekimPlus_YaziciKaldir.exe';
const CKYS_DUZELTME_FN = 'https://us-central1-hekim-asistani.cloudfunctions.net/ckysDuzeltmeMailGonder';
const PROFIL_OZET_CACHE_KEY = 'ahek_profil_ozet_cache_v1';

const DEFAULT_PREFS = {
  veriSenkronu: true,
  sablonSenkronu: true,
  otomatikYazdirma: true,
};

let _aktifUid = null;
let _abonelik = null;
let _kayitKendiDegisimi = false;
let _sonProfilVerisi = {};

function el(id) {
  return document.getElementById(id);
}

function tarihYaz(value) {
  if (!value) return '—';
  const ts = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(ts.getTime())) return '—';
  return ts.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

function planEtiketi(tier) {
  const map = {
    free: 'Ücretsiz',
    premium: 'Premium',
    max: 'Max',
  };
  return map[String(tier || 'free').toLowerCase()] || 'Ücretsiz';
}

function tarihMs(value) {
  if (!value) return null;
  const tarih = value?.toDate ? value.toDate() : new Date(value);
  const ms = tarih.getTime();
  return Number.isFinite(ms) ? ms : null;
}

function kalanSureMetni(tierUntil, tier) {
  const etkinTier = String(tier || 'free').toLowerCase();
  if (etkinTier === 'free') return 'Ücretsiz paket';
  const bitis = tarihMs(tierUntil);
  if (!bitis) return 'Süre bilgisi yok';
  const fark = bitis - Date.now();
  const bitisMetni = new Date(bitis).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
  if (fark <= 0) return `Süre doldu (${bitisMetni})`;
  const gun = Math.floor(fark / 86400000);
  const saat = Math.floor((fark % 86400000) / 3600000);
  if (gun > 0) return `${gun} gün ${saat} saat kaldı (${bitisMetni})`;
  const dakika = Math.max(1, Math.floor((fark % 3600000) / 60000));
  return `${saat} saat ${dakika} dakika kaldı (${bitisMetni})`;
}

function durumYaz(metin, tip = '') {
  const alan = el('profilTercihDurum');
  if (!alan) return;
  alan.textContent = metin || '';
  alan.className = 'profil-durum' + (tip ? ' ' + tip : '');
}

function silDurumYaz(metin, tip = '') {
  const alan = el('profilSilDurum');
  if (!alan) return;
  alan.textContent = metin || '';
  alan.className = 'profil-durum' + (tip ? ' ' + tip : '');
}

function profilKontrolleriniAyarla(pasif) {
  ['btnCikisYap', 'btnCikisYapSag', 'btnSilOnayla']
    .forEach((id) => {
      const node = el(id);
      if (node) node.disabled = !!pasif;
    });
}

function profilOzetCacheOku(uid = '') {
  try {
    const ham = localStorage.getItem(PROFIL_OZET_CACHE_KEY);
    if (!ham) return null;
    const veri = JSON.parse(ham);
    const birHafta = 7 * 24 * 60 * 60 * 1000;
    if (!veri || !veri.uid || !veri.ts || Date.now() - veri.ts > birHafta) return null;
    if (uid && veri.uid !== uid) return null;
    return veri;
  } catch (_) {
    return null;
  }
}

function profilOzetCacheYaz(uid, veri = {}) {
  if (!uid) return;
  try {
    localStorage.setItem(PROFIL_OZET_CACHE_KEY, JSON.stringify({
      uid,
      displayName: veri.displayName || '',
      email: veri.email || '',
      tier: veri.tier || 'free',
      tierUntil: tarihMs(veri.tierUntil),
      lastLoginAt: tarihMs(veri.lastLoginAt),
      createdAt: tarihMs(veri.createdAt),
      role: veri.role || '',
      premiumDenemeDurum: veri.premiumDenemeDurum || '',
      premiumDenemeCkysHash: veri.premiumDenemeCkysHash || '',
      ckysKoduKilitli: veri.ckysKoduKilitli === true,
      uyelikKaynak: veri.uyelikKaynak || '',
      ts: Date.now(),
    }));
  } catch (_) {}
}

function profilOzetCacheSil() {
  try { localStorage.removeItem(PROFIL_OZET_CACHE_KEY); } catch (_) {}
}

function profilOzetCacheUygula(uid = '') {
  const cache = profilOzetCacheOku(uid);
  if (!cache) return false;
  profiliYansit(cache);
  profilGorunumuAyarla(true, adminMi(cache));
  return true;
}

function adminMi(veri = {}) {
  return String(veri.role || '').toLowerCase() === 'admin';
}

function denemeUyeliginiAlmisMi(veri = {}) {
  const kaynak = String(veri.uyelikKaynak || '').toLowerCase();
  return veri.premiumDenemeDurum === 'kullanildi' ||
    kaynak === 'premium_deneme' ||
    kaynak === 'premium_deneme_bitti' ||
    !!veri.premiumDenemeCkysHash ||
    veri.ckysKoduKilitli === true;
}

function profilCkysDuzeltmeGorunumunuAyarla(veri = {}) {
  const kart = el('profilCkysDuzeltme');
  if (!kart) return;
  kart.hidden = !_aktifUid || !denemeUyeliginiAlmisMi(veri);
  if (!kart.hidden && location.hash === '#profilCkysDuzeltme') {
    requestAnimationFrame(() => {
      kart.scrollIntoView({ behavior: 'smooth', block: 'start' });
      kart.querySelector('input[name="profilCkysDuzeltmeKodu"]')?.focus({ preventScroll: true });
    });
  }
}

function premiumDenemeAlaninaOdaklan(tier) {
  if (location.hash !== '#premiumDenemeAlani') return;
  const alan = el('premiumDenemeAlani');
  const aksiyon = el('btnUyelikYukselt');
  if (!alan || !aksiyon) return;
  const premiumMi = ['premium', 'max'].includes(String(tier || 'free').toLowerCase());
  if (premiumMi || aksiyon.hidden) return;
  requestAnimationFrame(() => {
    alan.scrollIntoView({ behavior: 'smooth', block: 'center' });
    aksiyon.focus({ preventScroll: true });
  });
}

function profilGorunumuAyarla(girisVarMi, adminYetkili = false) {
  const uyelikYukselt = el('btnUyelikYukselt');
  const yaziciKurulum = el('yaziciKurulum');
  const hesapIslemleri = el('hesapIslemleri');
  const destekMerkezi = el('btnDestekMerkezi');
  const uyelikMenu = document.querySelector('a[href="uyelik.html"]');
  const yaziciMenu = document.querySelector('a[href="#yaziciKurulum"]');
  const cikisButonu = el('btnCikisYap');
  const cikisSagButonu = el('btnCikisYapSag');
  const girisLink = document.querySelector('.profil-giris-link');

  if (uyelikYukselt) uyelikYukselt.hidden = !girisVarMi;
  if (yaziciKurulum) yaziciKurulum.hidden = !girisVarMi || !adminYetkili;
  if (hesapIslemleri) hesapIslemleri.hidden = !girisVarMi;
  if (destekMerkezi) destekMerkezi.hidden = !girisVarMi;
  if (uyelikMenu) uyelikMenu.hidden = !girisVarMi;
  if (yaziciMenu) yaziciMenu.hidden = !girisVarMi || !adminYetkili;
  if (cikisButonu) cikisButonu.hidden = !girisVarMi;
  if (cikisSagButonu) cikisSagButonu.hidden = !girisVarMi;
  if (girisLink) girisLink.hidden = !!girisVarMi;
}

function yaziciKurulumDurumunuAyarla(tier) {
  const premiumMi = ['premium', 'max'].includes(String(tier || 'free').toLowerCase());
  const anaAksiyon = el('btnYaziciKurulum');
  const kaldirAksiyon = el('btnYaziciKaldir');
  if (!anaAksiyon) return;

  if (premiumMi) {
    anaAksiyon.textContent = 'Kuruluma Başla';
    anaAksiyon.href = YAZICI_KURULUM_URL;
    anaAksiyon.setAttribute('download', '');
    anaAksiyon.removeAttribute('aria-disabled');
    anaAksiyon.removeAttribute('tabindex');
    anaAksiyon.classList.remove('btn-kilitli');
    if (kaldirAksiyon) {
      kaldirAksiyon.href = YAZICI_KALDIR_URL;
      kaldirAksiyon.hidden = false;
      kaldirAksiyon.style.display = '';
    }
    return;
  }

  anaAksiyon.textContent = 'Premium Gerekli';
  anaAksiyon.href = 'uyelik.html';
  anaAksiyon.removeAttribute('download');
  anaAksiyon.setAttribute('aria-disabled', 'true');
  anaAksiyon.setAttribute('tabindex', '-1');
  anaAksiyon.classList.add('btn-kilitli');
  if (kaldirAksiyon) {
    kaldirAksiyon.href = YAZICI_KALDIR_URL;
    kaldirAksiyon.hidden = true;
    kaldirAksiyon.style.display = 'none';
  }
}

function uyelikAksiyonunuAyarla(tier, veri = {}) {
  const aksiyon = el('btnUyelikYukselt');
  if (!aksiyon) return;
  const aktifTier = String(tier || 'free').toLowerCase();
  const premiumMi = ['premium', 'max'].includes(aktifTier);
  const denemeKullanilmisMi = denemeUyeliginiAlmisMi(veri);
  aksiyon.hidden = premiumMi || denemeKullanilmisMi || !_aktifUid;
  aksiyon.textContent = 'Premium Denemeyi Başlat';
  aksiyon.href = 'uyelik.html';
  premiumDenemeAlaninaOdaklan(aktifTier);
}

function destekMailiAc() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'giris.html?sonra=destek.html';
    return;
  }
  window.location.href = 'destek.html';
}

function profilKartlariniTemizle() {
  el('profilIsim').textContent = 'Giriş bekleniyor';
  const isimBuyuk = el('profilIsimBuyuk');
  if (isimBuyuk) isimBuyuk.textContent = 'Giriş bekleniyor';
  el('profilMail').textContent = 'Profil bilgileri yüklenmedi';
  el('profilAvatar').textContent = '?';
  const avatarBuyuk = el('profilAvatarBuyuk');
  if (avatarBuyuk) avatarBuyuk.textContent = '?';
  el('profilTier').textContent = 'Ücretsiz';
  el('profilSonGiris').textContent = '—';
  el('profilPlan').textContent = '—';
  el('profilKalanSure').textContent = '—';
  el('profilEmail').textContent = '—';
  el('profilOlusma').textContent = '—';
  const durumBaslik = el('profilDurumBaslik');
  const durumMetin = el('profilDurumMetin');
  if (durumBaslik) durumBaslik.textContent = 'Giriş bekleniyor';
  if (durumMetin) durumMetin.textContent = 'Profil bilgilerini görmek için oturum açın.';
  yaziciKurulumDurumunuAyarla('free');
  uyelikAksiyonunuAyarla('free');
  profilKontrolleriniAyarla(true);
  profilCkysDuzeltmeGorunumunuAyarla({});
  profilGorunumuAyarla(false, false);
  const silOnay = el('silOnay');
  if (silOnay) silOnay.value = '';
  durumYaz('');
  silDurumYaz('');
}

async function tercihleriKaydet() {
  if (!_aktifUid) return;
  if (_kayitKendiDegisimi) return;
  return;
}

function profiliYansit(veri = {}) {
  _sonProfilVerisi = veri || {};
  const user = auth.currentUser;
  const ad = veri.displayName || user?.displayName || (user?.email ? user.email.split('@')[0] : 'Kullanıcı');
  const email = veri.email || user?.email || '';
  const tier = String(veri.tier || 'free').toLowerCase();

  el('profilIsim').textContent = ad;
  const isimBuyuk = el('profilIsimBuyuk');
  if (isimBuyuk) isimBuyuk.textContent = ad;
  el('profilMail').textContent = email || '—';
  el('profilAvatar').textContent = (ad[0] || '?').toUpperCase();
  const avatarBuyuk = el('profilAvatarBuyuk');
  if (avatarBuyuk) avatarBuyuk.textContent = (ad[0] || '?').toUpperCase();
  el('profilTier').textContent = planEtiketi(tier);
  el('profilSonGiris').textContent = tarihYaz(veri.lastLoginAt);
  el('profilPlan').textContent = planEtiketi(tier);
  el('profilKalanSure').textContent = kalanSureMetni(veri.tierUntil, tier);
  el('profilEmail').textContent = email || '—';
  el('profilOlusma').textContent = tarihYaz(veri.createdAt);
  yaziciKurulumDurumunuAyarla(tier);
  const durumBaslik = el('profilDurumBaslik');
  const durumMetin = el('profilDurumMetin');
  if (durumBaslik) durumBaslik.textContent = 'Giriş yapıldı';
  if (durumMetin) durumMetin.textContent = 'Hesabınıza güvenli şekilde bağlısınız.';
  profilCkysDuzeltmeGorunumunuAyarla(veri);
  profilGorunumuAyarla(true, adminMi(veri));
  uyelikAksiyonunuAyarla(tier, veri);
  profilKontrolleriniAyarla(false);
}

function profilCkysDuzeltmeDurumYaz(metin, tip = '') {
  const alan = el('profilCkysDuzeltmeDurum');
  if (!alan) return;
  alan.textContent = metin || '';
  alan.className = 'form-durum' + (tip ? ' ' + tip : '');
}

function profilCkysDuzeltmeHataMesaji(veri, varsayilan) {
  return veri?.error?.message || veri?.message || varsayilan || 'Talep gönderilemedi.';
}

async function profilCkysDuzeltmeMailGonder(ckysKodu) {
  const user = auth.currentUser || null;
  if (!user) throw new Error('ÇKYS düzeltme talebi göndermek için önce giriş yapın.');
  const idToken = await user.getIdToken();
  const resp = await fetch(CKYS_DUZELTME_FN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ data: { ckysKodu, kaynak: 'profil' } }),
  });
  const veri = await resp.json().catch(() => ({}));
  if (!resp.ok || veri?.error) {
    throw new Error(profilCkysDuzeltmeHataMesaji(veri, 'ÇKYS düzeltme talebi gönderilemedi.'));
  }
  return veri?.result || {};
}

async function profilCkysDuzeltmeGonder(e) {
  e.preventDefault();
  const form = el('profilCkysDuzeltmeForm');
  const ckysKodu = String(new FormData(form).get('profilCkysDuzeltmeKodu') || '').replace(/\D+/g, '');
  const btn = form?.querySelector('button[type="submit"]');
  if (ckysKodu.length < 3 || ckysKodu.length > 20) {
    profilCkysDuzeltmeDurumYaz('Geçerli doğru ÇKYS kodunu girin.', 'hata');
    form?.querySelector('input[name="profilCkysDuzeltmeKodu"]')?.focus();
    return;
  }
  if (btn) btn.disabled = true;
  profilCkysDuzeltmeDurumYaz('Talep e-postası gönderiliyor...', 'bilgi');
  try {
    await profilCkysDuzeltmeMailGonder(ckysKodu);
    profilCkysDuzeltmeDurumYaz('Talebiniz bize otomatik e-posta olarak gönderildi.', 'basari');
    form?.reset();
  } catch (err) {
    profilCkysDuzeltmeDurumYaz(err?.message || 'Talep gönderilemedi, lütfen tekrar deneyin.', 'hata');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function profilDinle(uid) {
  if (_abonelik) {
    _abonelik();
    _abonelik = null;
  }
  const ref = doc(db, 'users', uid);
  _abonelik = onSnapshot(ref, (snap) => {
    const veri = snap.exists() ? snap.data() : {};
    profilOzetCacheYaz(uid, veri);
    profiliYansit(veri);
  }, (err) => {
    console.warn('[profil] profil dinleme hatası:', err);
    durumYaz('Profil verisi alınamadı.', 'hata');
  });
}

async function hesapSil() {
  const user = auth.currentUser;
  if (!user) return;
  if (el('silOnay').value.trim().toUpperCase() !== 'SIL') {
    silDurumYaz('Önce kutuya SİL yazın.', 'hata');
    return;
  }

  if (!confirm('Hesabınız ve profil kaydınız kalıcı olarak silinecek. Devam edilsin mi?')) {
    return;
  }

  silDurumYaz('Siliniyor…', 'info');
  try {
    try { await deleteDoc(doc(db, 'users', user.uid, 'veriler', 'hesap')); } catch (_) {}
    try { await deleteDoc(doc(db, 'users', user.uid)); } catch (_) {}
    await deleteUser(user);
    await signOut(auth);
    silDurumYaz('Hesap silindi.', 'ok');
    window.location.href = 'index.html';
  } catch (err) {
    console.warn('[profil] hesap silme hatası:', err);
    if (err?.code === 'auth/requires-recent-login') {
      silDurumYaz('Bu işlem için yeniden giriş yapmanız gerekiyor.', 'hata');
    } else {
      silDurumYaz('Hesap silinemedi.', 'hata');
    }
  }
}

function olaylariBagla() {
  el('btnDestekMerkezi')?.addEventListener('click', destekMailiAc);
  el('btnCikisYap').addEventListener('click', async () => {
    durumYaz('Çıkış yapılıyor…', 'info');
    setTimeout(() => {
      window.location.href = 'giris.html?cikis=1';
    }, 250);
  });
  el('btnCikisYapSag')?.addEventListener('click', async () => {
    durumYaz('Çıkış yapılıyor…', 'info');
    setTimeout(() => {
      window.location.href = 'giris.html?cikis=1';
    }, 250);
  });
  el('btnSilOnayla').addEventListener('click', hesapSil);
  el('profilCkysDuzeltmeForm')?.addEventListener('submit', profilCkysDuzeltmeGonder);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!profilOzetCacheUygula()) profilKartlariniTemizle();
  olaylariBagla();
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      _aktifUid = null;
      if (_abonelik) {
        _abonelik();
        _abonelik = null;
      }
      profilOzetCacheSil();
      profilKartlariniTemizle();
      el('profilOzet').classList.add('profil-ozet-giris-yok');
      durumYaz('Profilinize erişmek için önce giriş yapın.', 'info');
      profilGorunumuAyarla(false, false);
      return;
    }

    _aktifUid = user.uid;
    el('profilOzet').classList.remove('profil-ozet-giris-yok');
    profilDinle(user.uid);
    if (!profilOzetCacheUygula(user.uid)) {
      profiliYansit({ email: user.email, displayName: user.displayName, tier: 'free' });
    }
    profilGorunumuAyarla(true, false);
  });
});
