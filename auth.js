// ═══ Firebase Authentication — Ahek Plus Tanıtım Sitesi ═══
// Email/şifre + Google OAuth + Şifre sıfırlama
// SDK sürümü Firebase Console tarafından üretilen config ile uyumlu

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendPasswordResetEmail, sendEmailVerification, updateProfile,
  GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, serverTimestamp,
  collection, writeBatch, increment
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

// v1.24.2: uyelik.js gibi başka modüller Firebase'i zaten init etmiş olabilir — duplicate önle
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// Cihazda giriş kalıcı olsun (varsayılan zaten local ama explicit olalım)
setPersistence(auth, browserLocalPersistence).catch(() => {});
// Firebase mailleri (şifre sıfırlama, doğrulama) Türkçe olsun
auth.languageCode = 'tr';

// Firestore helper'larını module dışındaki script'lere aç (anket.js vb.)
window._firebase = {
  db, doc, setDoc, getDoc, onSnapshot, serverTimestamp,
  collection, writeBatch, increment
};
try { window.dispatchEvent(new CustomEvent('firebase-hazir')); } catch (_) {}

// ─────────────────────────────────────────
// Hata & Durum mesajları
// ─────────────────────────────────────────

const HATA_ESLEME = {
  'auth/invalid-email': 'Geçersiz e-posta adresi.',
  'auth/user-disabled': 'Bu hesap devre dışı bırakılmış.',
  'auth/user-not-found': 'Bu e-posta ile kayıtlı kullanıcı yok.',
  'auth/wrong-password': 'Şifre hatalı.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/email-already-in-use': 'Bu e-posta adresi zaten kayıtlı.',
  'auth/weak-password': 'Şifre çok zayıf. En az 6 karakter olmalı.',
  'auth/popup-closed-by-user': 'Giriş penceresi kapatıldı.',
  'auth/popup-blocked': 'Tarayıcı popup\'ı engelledi — lütfen izin verin.',
  'auth/cancelled-popup-request': 'Giriş işlemi iptal edildi.',
  'auth/network-request-failed': 'İnternet bağlantısı yok.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı — birkaç dakika bekleyin.',
  'auth/unauthorized-domain': 'Bu domain henüz yetkili listede değil.',
  'auth/missing-email': 'E-posta adresi girilmedi.',
};

function hataMesaji(err) {
  if (!err) return 'Bir hata oluştu.';
  return HATA_ESLEME[err.code] || err.message || 'Bir hata oluştu.';
}

function durumGoster(mesaj, tip) {
  const el = document.getElementById('authDurum');
  if (!el) return;
  el.textContent = mesaj || '';
  el.className = 'auth-durum' + (tip ? ' ' + tip : '');
  clearTimeout(el._t);
  if (mesaj && tip !== 'hata') {
    el._t = setTimeout(() => {
      el.textContent = '';
      el.className = 'auth-durum';
    }, 5000);
  }
}

// ─────────────────────────────────────────
// Modal aç/kapat + sekme geçişi
// ─────────────────────────────────────────

function modalAc(sekme) {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add('modal-acik');
  sekmeGec(sekme || 'giris');
  setTimeout(() => {
    const ilkInp = modal.querySelector('.auth-form.aktif input');
    if (ilkInp) ilkInp.focus();
  }, 80);
}

function modalKapat() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-acik');
  durumGoster('');
}

function _authSayfasiMi() {
  return document.body.classList.contains('auth-sayfasi') || location.pathname.endsWith('/giris.html');
}

function _sonraHedefi() {
  try {
    const sonra = new URLSearchParams(location.search).get('sonra');
    if (sonra === 'destek.html') return sonra;
  } catch (_) {}
  return '';
}

function _girisSonrasiYonu() {
  const sonra = _sonraHedefi();
  if (sonra) return sonra;
  return 'index.html#hesapla';
}

function _authDurumuYay(user) {
  try {
    window.dispatchEvent(new CustomEvent('hekim-auth-durum-degisti', {
      detail: user ? {
        user: {
          uid: user.uid || '',
          email: user.email || '',
          displayName: user.displayName || '',
        },
      } : { user: null },
    }));
  } catch (_) {}
}

function _hypBilgiNotuGuncelle(user) {
  const hypBilgiNotu = document.querySelector('#panel-hypv2 .bilgi-notu');
  if (!hypBilgiNotu) return;

  if (user) {
    hypBilgiNotu.innerHTML = '✅ Giriş yapıldı. Değerleriniz bu cihazda korunur ve hesabınızla güvenle senkronize edilir.';
    return;
  }

  hypBilgiNotu.innerHTML = 'ℹ️ Değerler bu cihazda saklanır, sayfayı kapatsanız da kalır. <a href="giris.html"><b>Giriş yaparsanız</b></a> tüm cihazlarınız arasında otomatik senkronize olur.';
}

function sekmeGec(sekme) {
  document.querySelectorAll('.auth-sekme-btn').forEach(b => {
    b.classList.toggle('aktif', b.dataset.authSekme === sekme);
  });
  document.querySelectorAll('.auth-form').forEach(f => {
    f.classList.toggle('aktif', f.dataset.form === sekme);
  });
  durumGoster('');
  const aktifForm = document.querySelector(`.auth-form[data-form="${sekme}"]`);
  if (aktifForm) {
    setTimeout(() => {
      const ilkAlan = aktifForm.querySelector('input, button, select, textarea');
      if (ilkAlan) ilkAlan.focus();
    }, 50);
    if (_authSayfasiMi()) {
      try { aktifForm.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
    }
  }
}

// ─────────────────────────────────────────
// Kullanıcı menüsü (dropdown)
// ─────────────────────────────────────────

function kullaniciMenuToggle() {
  const drop = document.getElementById('authKullaniciDrop');
  if (drop) drop.hidden = !drop.hidden;
}
function kullaniciMenuKapat() {
  const drop = document.getElementById('authKullaniciDrop');
  if (drop) drop.hidden = true;
}

// ─────────────────────────────────────────
// Firestore — Profil verisi senkronu
// Yol: /users/{uid}/veriler/hesap
// Giriş anında çekilir, her input değişiminde otomatik yazılır.
// ─────────────────────────────────────────

let _aktifUid = null;
let _snapshotAbort = null;  // onSnapshot unsubscribe
let _kaydetTimer = null;
let _uygulamaSirasi = false; // Yüklerken tetiklenen input event'lerini yok say
let _ilkCloudYuklemeHazir = false;
let _yerelKayitBekliyor = false;
let _sonYerelDegisimZamani = 0;
let _sonCloudHesapVerisi = null;
let _authIlkDurumGeldi = false;
let _sonCikisIstegiZamani = 0;
let _sonGirisIstegiZamani = 0;
let _bekleyenCloudHesapVerisi = null;
let _senkBeklemeTimer = null;
const _CIKIS_YENILEME_KEY = 'ahek_cikis_yenileme_bekliyor';

function _senkStatus(metin, tip) {
  const el = document.getElementById('authSenkStatus');
  if (!el) return;
  el.textContent = metin || '';
  el.title = metin || '';
  el.className = 'auth-senk-status' + (tip ? ' ' + tip : '');
}

function _toast(mesaj, tip) {
  try {
    if (typeof window.siteToast === 'function') window.siteToast(mesaj, tip);
  } catch (_) {}
}

function _girisButonuYerelMod(girisBtn, aktif) {
  if (!girisBtn) return;
  girisBtn.textContent = aktif ? 'Yerel Mod · Giriş Yap' : 'Giriş Yap';
  girisBtn.title = aktif
    ? 'Çıkış yapıldı. Şu an sadece bu cihaza kayıtlı yerel veriler gösteriliyor.'
    : 'Giriş Yap';
}

function _hesapFormlariHazirMi() {
  if (!document.getElementById('panel-hypv2') && !document.getElementById('panel-asc')) return true;
  return !!document.querySelector('input[data-hypv2], input[data-asc]');
}

function _aktifHesapAlaniYaziliyorMu() {
  const ae = document.activeElement;
  return !!(ae && ae.matches && ae.matches('input, select, textarea') &&
    ae.closest('#panel-hypv2, #panel-asc, .modal'));
}

function _senkBeklemeToparla(ms = 1400) {
  clearTimeout(_senkBeklemeTimer);
  _senkBeklemeTimer = setTimeout(() => {
    if (!_aktifUid) return;
    if (_yerelKayitBekliyor) {
      _senkStatus('☁ Kaydediliyor…', 'info');
      return;
    }
    if (_bekleyenCloudHesapVerisi && !_aktifHesapAlaniYaziliyorMu()) {
      _bekleyenCloudVerisiniUygula();
      return;
    }
    _senkStatus(_sonCloudHesapVerisi ? '☁ Senkronize' : '☁ Kaydedildi', 'ok');
  }, ms);
}

function _cikisSonrasiBirKezYenile() {
  if (_authSayfasiMi()) return;
  try {
    if (sessionStorage.getItem(_CIKIS_YENILEME_KEY) === '1') return;
    sessionStorage.setItem(_CIKIS_YENILEME_KEY, '1');
  } catch (_) {}
  setTimeout(() => {
    try { window.location.reload(); } catch (_) {}
  }, 700);
}

function _cloudVerisiniUygulaVeHazirla(veri) {
  if (!_formaUygula(veri)) {
    _senkStatus('☁ Hesap formu hazırlanıyor…', 'info');
    return false;
  }
  _ilkCloudYuklemeHazir = true;
  _senkStatus('☁ Senkronize', 'ok');
  return true;
}

function _bekleyenCloudVerisiniUygula() {
  if (!_bekleyenCloudHesapVerisi || !_hesapFormlariHazirMi()) return;
  if (_aktifHesapAlaniYaziliyorMu()) {
    _senkBeklemeToparla();
    return;
  }
  const veri = _bekleyenCloudHesapVerisi;
  _bekleyenCloudHesapVerisi = null;
  _cloudVerisiniUygulaVeHazirla(veri);
}

window.addEventListener('hesap-formlari-hazir', _bekleyenCloudVerisiniUygula);
window.addEventListener('focusout', () => _senkBeklemeToparla(250), true);

// HYP v2 + ASÇ formlarından verileri topla (kriter + profil)
function _formdanTopla() {
  const v2Kriterler = {};
  const v2Profil = {};
  if (window.HYP2_KRITERLER) {
    window.HYP2_KRITERLER.forEach(k => {
      v2Kriterler[k.prefix] = {
        g: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-G"]`)?.value) || 0,
        y: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-Y"]`)?.value) || 0,
        d: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-D"]`)?.value) || 0,
        h: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-H"]`)?.value) || 0,
      };
      v2Profil[k.prefix] = {
        max: parseInt(document.querySelector(`input[data-v2-profil="${k.prefix}-max"]`)?.value) || 0,
        efor: parseInt(document.querySelector(`select[data-v2-profil="${k.prefix}-efor"]`)?.value) || 3,
        oncelik: parseInt(document.querySelector(`select[data-v2-profil="${k.prefix}-oncelik"]`)?.value) || 5,
      };
    });
  }
  const ascKriterler = {};
  const ascProfil = {};
  if (window.ASC_KRITERLER) {
    window.ASC_KRITERLER.forEach(k => {
      ascKriterler[k.prefix] = {
        g: parseInt(document.querySelector(`input[data-asc="${k.prefix}-G"]`)?.value) || 0,
        y: parseInt(document.querySelector(`input[data-asc="${k.prefix}-Y"]`)?.value) || 0,
        d: parseInt(document.querySelector(`input[data-asc="${k.prefix}-D"]`)?.value) || 0,
        h: parseInt(document.querySelector(`input[data-asc="${k.prefix}-H"]`)?.value) || 0,
      };
      ascProfil[k.prefix] = {
        max: parseInt(document.querySelector(`input[data-asc-profil="${k.prefix}-max"]`)?.value) || 0,
        efor: parseInt(document.querySelector(`select[data-asc-profil="${k.prefix}-efor"]`)?.value) || 3,
        oncelik: parseInt(document.querySelector(`select[data-asc-profil="${k.prefix}-oncelik"]`)?.value) || 5,
      };
    });
  }
  // Layout (kriter satır + sütun sırası) — layout.js tarafından yönetilir
  let layout = {};
  try { if (typeof window.hesapLayoutOku === 'function') layout = window.hesapLayoutOku(); } catch (_) {}
  // Şablon kütüphanesi — sablon.js tarafından yönetilir
  let sablonlar = {};
  try { if (typeof window.hesapSablonOku === 'function') sablonlar = window.hesapSablonOku(); } catch (_) {}

  return {
    hypV2: {
      nufus: parseInt(document.getElementById('hypV2Nufus')?.value) || 0,
      nufusTip: document.getElementById('hypV2NufusTip')?.value || '3500',
      nufusPuani: parseFloat(document.getElementById('hypV2NufusPuani')?.value) || 0,
      kriterler: v2Kriterler,
      profil: v2Profil,
    },
    asc: {
      hekimKS: parseFloat(document.getElementById('ascHekimKS')?.value) || 0,
      nufus: parseInt(document.getElementById('ascNufus')?.value) || 0,
      nufusTip: document.getElementById('ascNufusTip')?.value || '3500',
      kriterler: ascKriterler,
      profil: ascProfil,
    },
    layout,
    sablonlar,
  };
}

// Firestore verisini formlara uygula + localStorage'a da mirror et
function _formaUygula(d) {
  if (!_hesapFormlariHazirMi()) {
    _bekleyenCloudHesapVerisi = d;
    return false;
  }
  _uygulamaSirasi = true;
  try {
    if (d.hypV2) {
      document.querySelectorAll('input[data-hypv2]').forEach(el => { el.value = ''; });
      document.querySelectorAll('input[data-v2-profil]').forEach(el => { el.value = ''; });
      document.querySelectorAll('select[data-v2-profil]').forEach(el => {
        if (el.dataset.v2Profil?.endsWith('-efor')) el.value = '3';
        if (el.dataset.v2Profil?.endsWith('-oncelik')) el.value = '5';
      });
      const nufusEl = document.getElementById('hypV2Nufus');
      if (nufusEl) nufusEl.value = d.hypV2.nufus || '';
      const nufusTipEl = document.getElementById('hypV2NufusTip');
      if (nufusTipEl && d.hypV2.nufusTip) nufusTipEl.value = d.hypV2.nufusTip;
      const nufusPuaniEl = document.getElementById('hypV2NufusPuani');
      if (nufusPuaniEl && Object.prototype.hasOwnProperty.call(d.hypV2, 'nufusPuani')) nufusPuaniEl.value = d.hypV2.nufusPuani || '';
      Object.entries(d.hypV2.kriterler || {}).forEach(([prefix, kay]) => {
        ['g','y','d','h'].forEach(suf => {
          const el = document.querySelector(`input[data-hypv2="${prefix}-${suf.toUpperCase()}"]`);
          if (el) el.value = kay[suf] || '';
        });
      });
      Object.entries(d.hypV2.profil || {}).forEach(([prefix, p]) => {
        const maxEl = document.querySelector(`input[data-v2-profil="${prefix}-max"]`);
        const eforEl = document.querySelector(`select[data-v2-profil="${prefix}-efor"]`);
        const oncelikEl = document.querySelector(`select[data-v2-profil="${prefix}-oncelik"]`);
        if (maxEl) maxEl.value = p.max || '';
        if (eforEl) eforEl.value = p.efor || 3;
        if (oncelikEl && p.oncelik) oncelikEl.value = p.oncelik;
        if (oncelikEl) oncelikEl.hidden = parseInt(eforEl?.value) !== 6;
      });
      if (typeof window.hypV2Hesapla === 'function') window.hypV2Hesapla();
    }
    if (d.asc) {
      document.querySelectorAll('input[data-asc]').forEach(el => { el.value = ''; });
      document.querySelectorAll('input[data-asc-profil]').forEach(el => { el.value = ''; });
      document.querySelectorAll('select[data-asc-profil]').forEach(el => {
        if (el.dataset.ascProfil?.endsWith('-efor')) el.value = '3';
        if (el.dataset.ascProfil?.endsWith('-oncelik')) el.value = '5';
      });
      const ksEl = document.getElementById('ascHekimKS');
      if (ksEl) ksEl.value = d.asc.hekimKS || '';
      const ascNufusEl = document.getElementById('ascNufus');
      if (ascNufusEl && Object.prototype.hasOwnProperty.call(d.asc, 'nufus')) ascNufusEl.value = d.asc.nufus || '';
      const ascNufusTipEl = document.getElementById('ascNufusTip');
      if (ascNufusTipEl && d.asc.nufusTip) ascNufusTipEl.value = d.asc.nufusTip;
      Object.entries(d.asc.kriterler || {}).forEach(([prefix, kay]) => {
        ['g','y','d','h'].forEach(suf => {
          const el = document.querySelector(`input[data-asc="${prefix}-${suf.toUpperCase()}"]`);
          if (el) el.value = kay[suf] || '';
        });
      });
      Object.entries(d.asc.profil || {}).forEach(([prefix, p]) => {
        const maxEl = document.querySelector(`input[data-asc-profil="${prefix}-max"]`);
        const eforEl = document.querySelector(`select[data-asc-profil="${prefix}-efor"]`);
        const oncelikEl = document.querySelector(`select[data-asc-profil="${prefix}-oncelik"]`);
        if (maxEl) maxEl.value = p.max || '';
        if (eforEl) eforEl.value = p.efor || 3;
        if (oncelikEl && p.oncelik) oncelikEl.value = p.oncelik;
        if (oncelikEl) oncelikEl.hidden = parseInt(eforEl?.value) !== 6;
      });
      if (typeof window.ascHesapla === 'function') window.ascHesapla();
    }
    // Layout uygula (kriter satır + sütun sırası)
    if (d.layout && typeof window.hesapLayoutYaz === 'function') {
      window.hesapLayoutYaz(d.layout);
    }
    // Şablon kütüphanesini uygula (dropdown da güncellenir)
    if (d.sablonlar && typeof window.hesapSablonYaz === 'function') {
      window.hesapSablonYaz(d.sablonlar);
    }
    // Cloud'dan geleni cihaz cache'ine de yaz — logout sonrası local'de kalsın
    if (typeof window.hesapLocalKaydet === 'function') window.hesapLocalKaydet();
    try {
      window.dispatchEvent(new CustomEvent('hesap-verisi-degisti', { detail: { kaynak: 'cloud' } }));
    } catch (_) {}
    return true;
  } finally {
    setTimeout(() => { _uygulamaSirasi = false; }, 50);
  }
}

// Realtime dinle (başka cihazdan değişiklik gelirse otomatik yansır)
async function _profilYukle(uid) {
  try {
    const ref = doc(db, 'users', uid, 'veriler', 'hesap');
    if (_snapshotAbort) { _snapshotAbort(); _snapshotAbort = null; }
    _snapshotAbort = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        if (uid !== _aktifUid) return;
        _ilkCloudYuklemeHazir = true;
        _sonCloudHesapVerisi = null;
        _senkStatus('☁ Hesap verisi yok', 'info');
        return;
      }
      if (uid !== _aktifUid) return; // Başka kullanıcıya geçildiyse yok say
      // Kendi yazdığımız (henüz server'a doğrulanmamış) değişiklikleri yok say
      // — aksi halde kullanıcı yazarken alanlar clobber olur.
      if (snap.metadata && snap.metadata.hasPendingWrites) return;
      const veri = snap.data();
      _sonCloudHesapVerisi = veri;
      // Kullanıcı aktif olarak bir hesap girdisi üzerindeyse senkron ertelenir.
      if (_aktifHesapAlaniYaziliyorMu()) {
        _bekleyenCloudHesapVerisi = veri;
        _senkStatus('☁ Bekliyor (yazıyor)…', 'info');
        _senkBeklemeToparla();
        return;
      }
      if (window._eklentiVerisiZamani && Date.now() - window._eklentiVerisiZamani < 10000) {
        _senkStatus('☁ Eklenti verisi korunuyor…', 'info');
        _senkBeklemeToparla(10000);
        return;
      }
      const uzakRev = Number(veri?.istemciGuncellenme) || 0;
      if (window._hesapTemizlemeZamani && Date.now() - window._hesapTemizlemeZamani < 10000 &&
          (!uzakRev || uzakRev < window._hesapTemizlemeZamani)) {
        _senkStatus('☁ Temizleme korunuyor…', 'info');
        _senkBeklemeToparla(10000);
        return;
      }
      if (_sonYerelDegisimZamani && uzakRev && uzakRev < _sonYerelDegisimZamani) {
        _senkStatus('☁ Yerel değişiklik korunuyor…', 'info');
        _senkBeklemeToparla();
        return;
      }
      if (_yerelKayitBekliyor && Date.now() - _sonYerelDegisimZamani < 6000) {
        _senkStatus('☁ Yerel değişiklik kaydediliyor…', 'info');
        _senkBeklemeToparla(1200);
        return;
      }
      _cloudVerisiniUygulaVeHazirla(veri);
    }, (err) => {
      console.warn('Firestore dinleme hatası:', err);
      if (err.code === 'permission-denied') {
        _senkStatus('☁ Kurallar ayarlanmamış', 'hata');
      } else {
        _senkStatus('☁ Senkron hatası', 'hata');
      }
    });
  } catch (err) {
    console.warn('Profil yükleme hatası:', err);
  }
}

// Debounced yazım — her değişimde 600ms bekle, toplu yaz
function _profilKaydetDebounced(e) {
  if (!_aktifUid) return;
  if (_uygulamaSirasi) return;       // Yükleme esnasında yazma
  if (!_ilkCloudYuklemeHazir) {
    _senkStatus('☁ Hesap verisi yükleniyor', 'info');
    return;
  }
  if (typeof window.hesapYerelYuklemeAktifMi === 'function' && window.hesapYerelYuklemeAktifMi()) return;
  if (e?.detail?.islem === 'temizle') {
    window._hesapTemizlemeZamani = Number(e.detail.temizlemeZamani) || Date.now();
  }
  _yerelKayitBekliyor = true;
  _sonYerelDegisimZamani = Date.now();
  clearTimeout(_kaydetTimer);
  _senkStatus('☁ Kaydediliyor…', 'info');
  _kaydetTimer = setTimeout(async () => {
    try {
      const ref = doc(db, 'users', _aktifUid, 'veriler', 'hesap');
      const veri = _formdanTopla();
      if (_sonCloudHesapVerisi?.birim) veri.birim = _sonCloudHesapVerisi.birim;
      veri.istemciGuncellenme = _sonYerelDegisimZamani || Date.now();
      veri.guncellenme = serverTimestamp();
      await setDoc(ref, veri);
      _yerelKayitBekliyor = false;
      _senkStatus('☁ Kaydedildi', 'ok');
      _senkBeklemeToparla(1800);
    } catch (err) {
      _yerelKayitBekliyor = false;
      console.warn('Kaydetme hatası:', err);
      if (err.code === 'permission-denied') {
        _senkStatus('☁ Kurallar ayarlanmamış', 'hata');
      } else {
        _senkStatus('☁ Kaydedilemedi', 'hata');
      }
    }
  }, 700);
}

// Hesap tablolarındaki değişimi dinle (hesapla.js tarafından fırlatılır)
window.addEventListener('hesap-verisi-degisti', _profilKaydetDebounced);
// Layout değişimi (drag-drop) — layout.js tarafından fırlatılır
window.addEventListener('hesap-layout-degisti', _profilKaydetDebounced);
// Şablon değişimi (kaydet/sil) — sablon.js tarafından fırlatılır
window.addEventListener('hesap-sablon-degisti', _profilKaydetDebounced);

// ─────────────────────────────────────────
// Auth state değişimi → header UI güncellemesi + veri senkronu
// ─────────────────────────────────────────

// Eklenti "Siteden Giriş" akışı için currentUser referansı + token erişimi
let _currentUser = null;
window.hesapAuthTokenleriAl = async () => {
  if (!_currentUser) return null;
  try {
    const idToken = await _currentUser.getIdToken();
    return {
      idToken,
      refreshToken: _currentUser.refreshToken || '',
      uid: _currentUser.uid,
      email: _currentUser.email || '',
      displayName: _currentUser.displayName || '',
    };
  } catch (_) { return null; }
};

// İzole dünya köprüsü — content script (site_content.js) sayfa JS global'ine
// erişemez. window.postMessage (structured clone) ile güvenilir ikili yönlü iletişim.
window.addEventListener('message', async (e) => {
  if (e.source !== window) return;
  if (!e.data || e.data.type !== 'hekim-asistan-token-iste') return;
  const tokens = await window.hesapAuthTokenleriAl();
  window.postMessage({ type: 'hekim-asistan-token-hazir', tokens: tokens || null }, '*');
});

// v1.22.1 (site): Firestore /users/{uid} dokümanını senkronize tut
// Site'de giriş yapan/kaydolan her kullanıcı için parent doc oluşur → admin listeleyebilir,
// tier değişimi vs. yönetebilir. Mevcut tier alanına dokunmayız (merge:true).
async function _ensureUserDoc(user) {
  if (!user || !user.uid) return;
  try {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const data = {
      email: user.email || '',
      displayName: user.displayName || '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      data.tier = 'free';
      data.tierUntil = null;
      data.createdAt = serverTimestamp();
    } else {
      const mevcut = snap.data() || {};
      if (!Object.prototype.hasOwnProperty.call(mevcut, 'tier')) data.tier = 'free';
      if (!Object.prototype.hasOwnProperty.call(mevcut, 'tierUntil')) data.tierUntil = null;
    }
    await setDoc(ref, data, { merge: true });
  } catch (e) {
    console.warn('[auth] /users doküman senkronu hatası:', e);
  }
}

onAuthStateChanged(auth, (user) => {
  const ilkDurum = !_authIlkDurumGeldi;
  _authIlkDurumGeldi = true;
  _currentUser = user || null;
  window._currentUser = _currentUser;
  window._currentUid = user ? user.uid : null;
  if (user) _ensureUserDoc(user);
  _authDurumuYay(user);
  _hypBilgiNotuGuncelle(user);
  const girisBtn = document.getElementById('btnAuthGiris');
  const kullaniciKart = document.getElementById('authKullanici');
  const avatar = document.getElementById('authAvatar');
  const avatarInit = document.getElementById('authAvatarInit');
  const isim = document.getElementById('authIsim');
  const mail = document.getElementById('authMail');

  if (user) {
    _girisButonuYerelMod(girisBtn, false);
    if (girisBtn) girisBtn.hidden = true;
    if (kullaniciKart) kullaniciKart.hidden = false;
    // Mobil menü link'i: girişi gizle, çıkışı göster
    const mobilGiris = document.getElementById('mobilAuthGiris');
    const mobilProfil = document.getElementById('mobilAuthProfil');
    const mobilCikis = document.getElementById('mobilAuthCikis');
    if (mobilGiris) mobilGiris.hidden = true;
    if (mobilProfil) mobilProfil.hidden = false;
    if (mobilCikis) mobilCikis.hidden = false;
    const ad = user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı');
    if (isim) isim.textContent = ad;
    if (mail) mail.textContent = user.email || '';
    if (avatar && avatarInit) {
      if (user.photoURL) {
        avatar.src = user.photoURL;
        avatar.hidden = false;
        avatarInit.hidden = true;
      } else {
        avatar.hidden = true;
        avatarInit.hidden = false;
        avatarInit.textContent = (ad[0] || '?').toUpperCase();
      }
    }
    if (_authSayfasiMi()) {
      window.location.href = _girisSonrasiYonu();
      return;
    } else {
      modalKapat();
    }
    // Profil verilerini yükle (realtime)
    const hesapDegisti = _aktifUid && _aktifUid !== user.uid;
    if (hesapDegisti) {
      clearTimeout(_kaydetTimer);
      _yerelKayitBekliyor = false;
      _sonYerelDegisimZamani = 0;
      _sonCloudHesapVerisi = null;
      _bekleyenCloudHesapVerisi = null;
    }
    _aktifUid = user.uid;
    _ilkCloudYuklemeHazir = false;
    try { window.hesapAktifUidAyarla?.(user.uid); } catch (_) {}
    _senkStatus('☁ Hesap verisi yükleniyor…', 'info');
    if (!ilkDurum && Date.now() - _sonGirisIstegiZamani < 15000) {
      _toast('Giriş yapıldı. Hesaba ait veriler yükleniyor.', 'bilgi');
    }
    _profilYukle(user.uid);
  } else {
    _girisButonuYerelMod(girisBtn, !ilkDurum);
    if (girisBtn) girisBtn.hidden = false;
    if (kullaniciKart) kullaniciKart.hidden = true;
    // Mobil menü link'i: girişi göster, çıkışı gizle
    const mobilGiris = document.getElementById('mobilAuthGiris');
    const mobilProfil = document.getElementById('mobilAuthProfil');
    const mobilCikis = document.getElementById('mobilAuthCikis');
    if (mobilGiris) mobilGiris.hidden = false;
    if (mobilProfil) mobilProfil.hidden = true;
    if (mobilCikis) mobilCikis.hidden = true;
    kullaniciMenuKapat();
    // Snapshot'u kapat (cloud bağlantısı kesilsin)
    // NOT: Form değerleri + localStorage silinmez — anonim modda cihazda kalsın
    _aktifUid = null;
    _ilkCloudYuklemeHazir = false;
    clearTimeout(_kaydetTimer);
    _yerelKayitBekliyor = false;
    _sonYerelDegisimZamani = 0;
    _sonCloudHesapVerisi = null;
    _bekleyenCloudHesapVerisi = null;
    if (_snapshotAbort) { _snapshotAbort(); _snapshotAbort = null; }
    try { window.hesapAktifUidAyarla?.(null); } catch (_) {}
    if (!ilkDurum && Date.now() - _sonCikisIstegiZamani < 15000) {
      _toast('Çıkış yapıldı. Yerel veriler gösteriliyor.', 'basari');
      const bilgi = document.querySelector('#panel-hypv2 .bilgi-notu');
      if (bilgi) {
        bilgi.innerHTML = 'Çıkış yapıldı. Şu an sadece bu cihazdaki yerel veriler gösteriliyor. <a href="giris.html"><b>Giriş yaparsanız</b></a> hesabınıza ait veriler yüklenir.';
      }
      _cikisSonrasiBirKezYenile();
    }
    _senkStatus('');
    if (_authSayfasiMi()) {
      const formKutu = document.getElementById('girisFormlar');
      if (formKutu) formKutu.hidden = false;
      _authSayfaArtiklariniTemizle();
    }
  }
});

// ─────────────────────────────────────────
// Form submit handler'ları + buton olayları
// ─────────────────────────────────────────

async function girisYap(email, sifre) {
  durumGoster('Giriş yapılıyor…', 'info');
  try {
    _sonGirisIstegiZamani = Date.now();
    await signInWithEmailAndPassword(auth, email, sifre);
  } catch (err) {
    durumGoster(hataMesaji(err), 'hata');
  }
}

async function kayitOl(ad, email, sifre) {
  durumGoster('Hesap oluşturuluyor…', 'info');
  try {
    _sonGirisIstegiZamani = Date.now();
    const cred = await createUserWithEmailAndPassword(auth, email, sifre);
    if (ad && cred.user) {
      try { await updateProfile(cred.user, { displayName: ad }); } catch (_) {}
    }
    // Doğrulama maili (best effort)
    try { await sendEmailVerification(cred.user); } catch (_) {}
    durumGoster('Kayıt başarılı — hoş geldiniz!', 'ok');
  } catch (err) {
    durumGoster(hataMesaji(err), 'hata');
  }
}

async function sifreSifirla(email) {
  if (!email) { durumGoster('Lütfen e-posta girin.', 'hata'); return; }
  durumGoster('Sıfırlama maili gönderiliyor…', 'info');
  try {
    await sendPasswordResetEmail(auth, email);
    sekmeGec('giris');
    durumGoster('Sıfırlama bağlantısı e-postanıza gönderildi. Gelen kutunuzda yoksa spam/gereksiz klasörünü kontrol edin.', 'ok');
    const girisEmail = document.getElementById('girisEmail');
    if (girisEmail) girisEmail.focus();
  } catch (err) {
    durumGoster(hataMesaji(err), 'hata');
  }
}

async function googleIle() {
  durumGoster('Google hesabınız açılıyor…', 'info');
  try {
    _sonGirisIstegiZamani = Date.now();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  } catch (err) {
    durumGoster(hataMesaji(err), 'hata');
  }
}

async function cikisYap() {
  try {
    _sonCikisIstegiZamani = Date.now();
    _senkStatus('Çıkış yapılıyor…', 'info');
    await signOut(auth);
  } catch (err) {
    alert(hataMesaji(err));
  }
}

function _authSayfaArtiklariniTemizle() {
  if (!_authSayfasiMi()) return;
  document.querySelectorAll('.giris-sol, .giris-gorsel-kart, #girisBasariKarti').forEach((node) => {
    node.remove();
  });
}

// ─────────────────────────────────────────
// DOMContentLoaded — olay bağlama
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  try { sessionStorage.removeItem(_CIKIS_YENILEME_KEY); } catch (_) {}
  _authSayfaArtiklariniTemizle();

  // v1.24.2: Sayfada auth alanı/modalı eksikse enjekte et (tahmini, uyelik gibi alt sayfalar için).
  _authHtmlEnjekteEt();

  // Eklentiden yönlendirilmiş çıkış: site açılır açılmaz oturumu kapat.
  const urlParam = new URLSearchParams(window.location.search);
  if (urlParam.get('cikis') === '1' || urlParam.get('logout') === '1') {
    durumGoster('Çıkış yapıldı. Tekrar giriş yapabilirsiniz.', 'ok');
    cikisYap().finally(() => {
      try {
        const temizUrl = new URL(window.location.href);
        temizUrl.search = '';
        window.history.replaceState({}, '', temizUrl.toString());
      } catch (_) {}
      if (location.pathname.endsWith('/profil.html')) {
        window.location.href = 'giris.html';
      }
    });
  }

  // Modal açan butonlar
  const girisSayfasiUrl = 'giris.html';
  document.getElementById('btnAuthGiris')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = girisSayfasiUrl;
  });

  // Mobil header'da da buton varsa (aynı id farklı konum)
  document.querySelectorAll('[data-auth-ac]').forEach(b =>
    b.addEventListener('click', () => {
      window.location.href = girisSayfasiUrl;
    })
  );

  // Modal kapat
  document.querySelectorAll('[data-modal-kapat]').forEach(el =>
    el.addEventListener('click', modalKapat)
  );

  // Sekme geçişleri
  document.querySelectorAll('[data-auth-sekme]').forEach(b =>
    b.addEventListener('click', () => sekmeGec(b.dataset.authSekme))
  );
  document.querySelectorAll('[data-sifre-sifirla]').forEach(b =>
    b.addEventListener('click', () => {
      sekmeGec('sifirla');
      durumGoster('Şifre sıfırlama bölümü açıldı. E-posta adresinizi girin.', 'info');
      const sifirlaEmail = document.getElementById('sifirlaEmail');
      if (sifirlaEmail) sifirlaEmail.focus();
    })
  );
  document.querySelectorAll('[data-sekme-geri]').forEach(b =>
    b.addEventListener('click', () => sekmeGec(b.dataset.sekmeGeri))
  );

  document.querySelectorAll('[data-sifre-goster]').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.sifreGoster || '');
      if (!input) return;
      const gosteriliyor = input.type === 'text';
      input.type = gosteriliyor ? 'password' : 'text';
      btn.textContent = gosteriliyor ? 'Göster' : 'Gizle';
      btn.setAttribute('aria-label', gosteriliyor ? 'Şifreyi göster' : 'Şifreyi gizle');
      btn.setAttribute('aria-pressed', String(!gosteriliyor));
      input.focus();
    });
  });

  // Giriş formu
  document.getElementById('authGirisForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('girisEmail').value.trim();
    const sifre = document.getElementById('girisSifre').value;
    girisYap(email, sifre);
  });

  // Kayıt formu
  document.getElementById('authKayitForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ad = document.getElementById('kayitAd').value.trim();
    const email = document.getElementById('kayitEmail').value.trim();
    const sifre = document.getElementById('kayitSifre').value;
    kayitOl(ad, email, sifre);
  });

  // Şifre sıfırlama
  document.getElementById('authSifirlaForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('sifirlaEmail').value.trim();
    sifreSifirla(email);
  });

  // Google butonları
  document.querySelectorAll('[data-google-giris]').forEach(b =>
    b.addEventListener('click', googleIle)
  );

  // Kullanıcı menüsü
  document.getElementById('authAvatarBtn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    kullaniciMenuToggle();
  });
  document.getElementById('btnAuthProfil')?.addEventListener('click', () => {
    window.location.href = 'profil.html';
  });
  document.getElementById('btnAuthCikis')?.addEventListener('click', () => {
    kullaniciMenuKapat();
    cikisYap();
  });
  // Mobil menüden çıkış
  document.getElementById('mobilAuthProfil')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'profil.html';
  });
  document.getElementById('mobilAuthCikis')?.addEventListener('click', (e) => {
    e.preventDefault();
    cikisYap();
    // Mobil paneli kapat
    const panel = document.getElementById('mobilPanel');
    if (panel) panel.hidden = true;
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#authKullanici')) kullaniciMenuKapat();
  });

  // Escape = modal/dropdown kapat
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('authModal');
    if (modal && !modal.hidden) { modalKapat(); return; }
    kullaniciMenuKapat();
  });
});

// ─────────────────────────────────────────
// v1.24.2: Auth UI otomatik enjekte
// tahmini.html, uyelik.html gibi alt sayfalara auth.js dahil edildiğinde
// header-inner içine auth-alan ve body'e auth modalı yoksa yerleştirir.
// index.html'de zaten mevcut — o zaman no-op.
// ─────────────────────────────────────────

const _AUTH_ALAN_HTML = `
  <div class="auth-alan">
    <a id="btnAuthGiris" class="btn-auth-giris" href="giris.html">Giriş Yap</a>
    <div id="authKullanici" class="auth-kullanici" hidden>
      <button id="authAvatarBtn" class="auth-avatar-btn" type="button" aria-haspopup="true">
        <img id="authAvatar" class="auth-avatar" alt="" hidden>
        <span id="authAvatarInit" class="auth-avatar-init">?</span>
      </button>
      <span id="authSenkStatus" class="auth-senk-status">☁ Senkronize</span>
      <div id="authKullaniciDrop" class="auth-kullanici-drop" hidden>
        <div class="auth-drop-basini">
          <div class="auth-drop-isim" id="authIsim">—</div>
          <div class="auth-drop-mail" id="authMail">—</div>
        </div>
        <div class="auth-drop-ayrac"></div>
        <button id="btnAuthProfil" class="auth-drop-btn" type="button">👤 Profil Sayfam</button>
        <button id="btnAuthCikis" class="auth-drop-btn" type="button">⏻ Çıkış Yap</button>
      </div>
    </div>
  </div>
`;

const _AUTH_MODAL_HTML = `
  <div id="authModal" class="modal" hidden>
    <div class="modal-backdrop" data-modal-kapat></div>
    <div class="modal-icerik" role="dialog" aria-labelledby="authBaslik" aria-modal="true">
      <button class="modal-kapat" type="button" data-modal-kapat aria-label="Kapat">×</button>
      <div id="authBaslik" class="auth-modal-baslik">
        <span class="auth-modal-ikon">🩺</span>
        <div>
          <div class="auth-modal-baslik-ana">Ahek Plus Hesabı</div>
          <div class="auth-modal-baslik-alt">Ahek Plus ile giriş yap veya yeni hesap aç</div>
        </div>
      </div>
      <div class="auth-sekme-bar" role="tablist">
        <button class="auth-sekme-btn aktif" type="button" data-auth-sekme="giris" role="tab">Giriş</button>
        <button class="auth-sekme-btn" type="button" data-auth-sekme="kayit" role="tab">Kayıt</button>
      </div>
      <form class="auth-form aktif" id="authGirisForm" data-form="giris" novalidate>
        <button type="button" class="btn-google btn-google-ust" data-google-giris>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Google ile Giriş Yap</span>
        </button>
        <div class="auth-ayrac"><span>veya e-posta ile</span></div>
        <label class="auth-label"><span>E-posta</span><input type="email" id="girisEmail" placeholder="ornek@mail.com" required autocomplete="email" inputmode="email"></label>
        <div class="auth-label"><label class="auth-label-baslik" for="girisSifre">Şifre</label><span class="auth-sifre-alan"><input type="password" id="girisSifre" placeholder="••••••••" required autocomplete="current-password" minlength="6"><button type="button" class="auth-sifre-goster" data-sifre-goster="girisSifre" aria-label="Şifreyi göster" aria-pressed="false">Göster</button></span></div>
        <button type="submit" class="btn btn-birincil btn-blok">Giriş Yap</button>
        <button type="button" class="btn-metinsel" data-sifre-sifirla>Şifremi unuttum</button>
      </form>
      <form class="auth-form" id="authKayitForm" data-form="kayit" novalidate>
        <button type="button" class="btn-google btn-google-ust" data-google-giris>
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Google ile Kayıt Ol</span>
        </button>
        <div class="auth-ayrac"><span>veya e-posta ile</span></div>
        <label class="auth-label"><span>Ad Soyad <em>(opsiyonel)</em></span><input type="text" id="kayitAd" placeholder="Dr. Ad Soyad" autocomplete="name"></label>
        <label class="auth-label"><span>E-posta</span><input type="email" id="kayitEmail" placeholder="ornek@mail.com" required autocomplete="email" inputmode="email"></label>
        <div class="auth-label"><label class="auth-label-baslik" for="kayitSifre">Şifre <em>(min. 6 karakter)</em></label><span class="auth-sifre-alan"><input type="password" id="kayitSifre" placeholder="••••••••" required autocomplete="new-password" minlength="6"><button type="button" class="auth-sifre-goster" data-sifre-goster="kayitSifre" aria-label="Şifreyi göster" aria-pressed="false">Göster</button></span></div>
        <button type="submit" class="btn btn-birincil btn-blok">Kayıt Ol</button>
        <p class="auth-kvkk">Kayıt olarak <b>KVKK</b> kapsamında e-posta adresinizin giriş amacıyla işlenmesini onaylarsınız. Sağlık/hasta verisi saklanmaz.</p>
      </form>
      <form class="auth-form" id="authSifirlaForm" data-form="sifirla" novalidate>
        <p class="auth-bilgi">Ahek Plus hesabınıza bağlı e-posta adresinizi girin — sıfırlama bağlantısı gönderelim.<br><small style="color:#d97706">⚠️ Mail gelmezse <b>spam/gereksiz</b> klasörünü kontrol edin.</small></p>
        <label class="auth-label"><span>E-posta</span><input type="email" id="sifirlaEmail" placeholder="ornek@mail.com" required autocomplete="email" inputmode="email"></label>
        <button type="submit" class="btn btn-birincil btn-blok">Sıfırlama Maili Gönder</button>
        <button type="button" class="btn-metinsel" data-sekme-geri="giris">← Giriş ekranına dön</button>
      </form>
      <div class="auth-durum" id="authDurum" role="status" aria-live="polite"></div>
    </div>
  </div>
`;

function _authHtmlEnjekteEt() {
  if (_authSayfasiMi() || location.pathname.endsWith('/destek.html')) return;

  // header-inner içine auth-alan (eksikse)
  const headerInner = document.querySelector('.header-inner');
  if (headerInner && !headerInner.querySelector('.auth-alan')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = _AUTH_ALAN_HTML.trim();
    const authAlan = tempDiv.firstChild;
    // Mobil butondan önce eklemeye çalış; yoksa sona
    const mobilBtn = headerInner.querySelector('.nav-mobil');
    if (mobilBtn) headerInner.insertBefore(authAlan, mobilBtn);
    else headerInner.appendChild(authAlan);
  }

  // body'e authModal (eksikse)
  if (!document.getElementById('authModal')) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = _AUTH_MODAL_HTML.trim();
    document.body.appendChild(tempDiv.firstChild);
  }
}
