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

const DEFAULT_PREFS = {
  veriSenkronu: true,
  sablonSenkronu: true,
  otomatikYazdirma: true,
};

let _aktifUid = null;
let _abonelik = null;
let _kayitKendiDegisimi = false;

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

function profilGorunumuAyarla(girisVarMi) {
  const topbarAksiyon = el('profilTopbarGiris');
  const yaziciKurulum = el('yaziciKurulum');
  const hesapIslemleri = el('hesapIslemleri');
  const destekMerkezi = el('btnDestekMerkezi');
  const uyelikMenu = document.querySelector('a[href="uyelik.html"]');
  const yaziciMenu = document.querySelector('a[href="#yaziciKurulum"]');
  const cikisButonu = el('btnCikisYap');
  const cikisSagButonu = el('btnCikisYapSag');

  if (topbarAksiyon) {
    topbarAksiyon.textContent = girisVarMi ? 'Üyeliği Yükselt' : 'Giriş Yap';
    topbarAksiyon.href = girisVarMi ? 'uyelik.html' : 'giris.html';
  }

  if (yaziciKurulum) yaziciKurulum.hidden = !girisVarMi;
  if (hesapIslemleri) hesapIslemleri.hidden = !girisVarMi;
  if (destekMerkezi) destekMerkezi.hidden = !girisVarMi;
  if (uyelikMenu) uyelikMenu.hidden = !girisVarMi;
  if (yaziciMenu) yaziciMenu.hidden = !girisVarMi;
  if (cikisButonu) cikisButonu.hidden = !girisVarMi;
  if (cikisSagButonu) cikisSagButonu.hidden = !girisVarMi;
}

function yaziciKurulumDurumunuAyarla(tier) {
  const premiumMi = ['premium', 'max'].includes(String(tier || 'free').toLowerCase());
  const anaAksiyon = el('btnYaziciKurulum');
  const kaldirAksiyon = el('btnYaziciKaldir');
  if (!anaAksiyon) return;

  if (premiumMi) {
    anaAksiyon.textContent = 'Kuruluma Başla';
    anaAksiyon.href = 'https://raw.githubusercontent.com/kaimau1/hekim-asistani/main/kurulum-dosyalari/HekimPlus_YaziciKurulum.exe';
    anaAksiyon.setAttribute('download', '');
    anaAksiyon.removeAttribute('aria-disabled');
    anaAksiyon.removeAttribute('tabindex');
    anaAksiyon.classList.remove('btn-kilitli');
    if (kaldirAksiyon) kaldirAksiyon.hidden = false;
    return;
  }

  anaAksiyon.textContent = 'Premium Gerekli';
  anaAksiyon.href = 'uyelik.html';
  anaAksiyon.removeAttribute('download');
  anaAksiyon.setAttribute('aria-disabled', 'true');
  anaAksiyon.setAttribute('tabindex', '-1');
  anaAksiyon.classList.add('btn-kilitli');
  if (kaldirAksiyon) kaldirAksiyon.hidden = true;
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
  el('profilEmail').textContent = '—';
  el('profilOlusma').textContent = '—';
  const durumBaslik = el('profilDurumBaslik');
  const durumMetin = el('profilDurumMetin');
  if (durumBaslik) durumBaslik.textContent = 'Giriş bekleniyor';
  if (durumMetin) durumMetin.textContent = 'Profil bilgilerini görmek için oturum açın.';
  yaziciKurulumDurumunuAyarla('free');
  profilKontrolleriniAyarla(true);
  profilGorunumuAyarla(false);
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
  el('profilEmail').textContent = email || '—';
  el('profilOlusma').textContent = tarihYaz(veri.createdAt);
  yaziciKurulumDurumunuAyarla(tier);
  const durumBaslik = el('profilDurumBaslik');
  const durumMetin = el('profilDurumMetin');
  if (durumBaslik) durumBaslik.textContent = 'Giriş yapıldı';
  if (durumMetin) durumMetin.textContent = 'Hesabınıza güvenli şekilde bağlısınız.';
  profilGorunumuAyarla(true);
  profilKontrolleriniAyarla(false);
}

function profilDinle(uid) {
  if (_abonelik) {
    _abonelik();
    _abonelik = null;
  }
  const ref = doc(db, 'users', uid);
  _abonelik = onSnapshot(ref, (snap) => {
    const veri = snap.exists() ? snap.data() : {};
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
}

document.addEventListener('DOMContentLoaded', () => {
  profilKartlariniTemizle();
  olaylariBagla();
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      _aktifUid = null;
      if (_abonelik) {
        _abonelik();
        _abonelik = null;
      }
      profilKartlariniTemizle();
      el('profilOzet').classList.add('profil-ozet-giris-yok');
      durumYaz('Profilinize erişmek için önce giriş yapın.', 'info');
      profilGorunumuAyarla(false);
      return;
    }

    _aktifUid = user.uid;
    el('profilOzet').classList.remove('profil-ozet-giris-yok');
    profilDinle(user.uid);
    profiliYansit({ email: user.email, displayName: user.displayName, tier: 'free' });
    profilGorunumuAyarla(true);
  });
});
