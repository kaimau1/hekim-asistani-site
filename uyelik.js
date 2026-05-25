// uyelik.js — Premium denemeyi giriş yapan hesapta otomatik başlatır.
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyA4qoG_wGN4tmXxdBDEP_ZvsjWjAOQ0-5o',
  authDomain: 'hekim-asistani.firebaseapp.com',
  projectId: 'hekim-asistani',
  storageBucket: 'hekim-asistani.firebasestorage.app',
  messagingSenderId: '660353778151',
  appId: '1:660353778151:web:8fee3d1eeb4f56df023d42',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const PREMIUM_DENEME_FN = 'https://us-central1-hekim-asistani.cloudfunctions.net/premiumDenemeBaslat';

const form = document.getElementById('talepForm');
const durum = document.getElementById('formDurum');
const gonderBtn = form?.querySelector('button[type="submit"]');
let bekleyenDenemeCalisti = false;

// İletişim bölümü gizliyse script'i atla (form/durum DOM'da hidden section içinde, listener gerekmez).
if (!form || !durum || form.closest('[hidden]')) {
  // no-op
} else {

const emailInput = form.querySelector('input[name="email"]');
onAuthStateChanged(auth, (user) => {
  if (!emailInput || !user?.email) return;
  if (!emailInput.value.trim()) emailInput.value = user.email;
  kayitliCkysUygula();
  bekleyenDenemeyiBaslat().catch(() => {});
});

function durumYaz(metin, tip) {
  durum.textContent = metin || '';
  durum.className = 'form-durum';
  if (tip) durum.classList.add(tip);
}

function callableHataMesaji(error) {
  const durumKodu = String(error?.status || error?.code || error?.message || '').toLowerCase();
  const mesaj = String(error?.message || '');
  if (durumKodu.includes('already-exists')) {
    return 'Bu ÇKYS kodu için premium deneme hakkı daha önce kullanılmış. Aynı kodla devam etmek için normal abonelik satın alınabilir.';
  }
  if (durumKodu.includes('failed-precondition')) {
    return 'Bu hesapta ÇKYS kodu daha önce sabitlenmiş. Kod değiştirilemez.';
  }
  if (durumKodu.includes('unauthenticated')) {
    return 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.';
  }
  return mesaj || 'Premium deneme başlatılamadı.';
}

async function premiumDenemeBaslat(ckysKodu) {
  const user = auth.currentUser;
  if (!user) {
    try {
      sessionStorage.setItem('ahek_premium_deneme_ckys', ckysKodu);
      sessionStorage.setItem('ahek_premium_deneme_onay', '1');
    } catch (_) {}
    window.location.href = 'giris.html?sonra=uyelik.html';
    throw new Error('Premium deneme için önce giriş yapın.');
  }

  const idToken = await user.getIdToken(true);
  let resp;
  try {
    resp = await fetch(PREMIUM_DENEME_FN, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: { ckysKodu } }),
    });
  } catch (_) {
    throw new Error('Premium deneme servisine bağlanılamadı. Sayfayı yenileyip tekrar deneyin.');
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.error) throw new Error(callableHataMesaji(data.error || data));
  return data.result || {};
}

function kayitliCkysUygula() {
  try {
    const ckys = sessionStorage.getItem('ahek_premium_deneme_ckys') || '';
    if (!ckys) return;
    const input = form.querySelector('input[name="ckysKodu"]');
    if (input && !input.value.trim()) input.value = ckys;
    const onay = form.querySelector('input[name="ckysOnay"]');
    if (onay && sessionStorage.getItem('ahek_premium_deneme_onay') === '1') onay.checked = true;
  } catch (_) {}
}

kayitliCkysUygula();

function denemeBasariYaz(sonuc) {
  const bitis = sonuc.tierUntil ? new Date(sonuc.tierUntil).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) : '';
  durumYaz(`✓ Premium deneme başladı.${bitis ? ` Bitiş tarihi: ${bitis}.` : ''}`, 'basari');
  if (gonderBtn) {
    gonderBtn.disabled = true;
    gonderBtn.textContent = 'Premium Deneme Başladı';
  }
}

async function bekleyenDenemeyiBaslat() {
  if (bekleyenDenemeCalisti || !auth.currentUser) return;
  let ckys = '';
  let onay = '';
  try {
    ckys = sessionStorage.getItem('ahek_premium_deneme_ckys') || '';
    onay = sessionStorage.getItem('ahek_premium_deneme_onay') || '';
  } catch (_) {}
  if (!ckys || onay !== '1') return;

  bekleyenDenemeCalisti = true;
  if (gonderBtn) gonderBtn.disabled = true;
  durumYaz('Giriş tamamlandı, Premium deneme başlatılıyor...', 'bilgi');
  try {
    const sonuc = await premiumDenemeBaslat(ckys);
    try {
      sessionStorage.removeItem('ahek_premium_deneme_ckys');
      sessionStorage.removeItem('ahek_premium_deneme_onay');
    } catch (_) {}
    denemeBasariYaz(sonuc);
  } catch (err) {
    durumYaz(err?.message || 'Premium deneme başlatılamadı, lütfen tekrar deneyin.', 'hata');
    if (gonderBtn) gonderBtn.disabled = false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  durumYaz('');

  const fd = new FormData(form);
  const email = (fd.get('email') || '').trim();
  const ckysKodu = String(fd.get('ckysKodu') || '').replace(/\D+/g, '');
  const istenenTier = fd.get('istenenTier');

  if (!email || !ckysKodu || !istenenTier) {
    durumYaz('E-posta, ÇKYS kodu ve üyelik seçimi zorunlu.', 'hata');
    return;
  }
  if (ckysKodu.length < 3 || ckysKodu.length > 20) {
    durumYaz('Geçerli bir ÇKYS kodu girin.', 'hata');
    return;
  }
  if (fd.get('ckysOnay') !== 'on') {
    durumYaz('ÇKYS kodunun sabitleneceğine dair onay gerekli.', 'hata');
    return;
  }
  if (istenenTier !== 'premium') {
    durumYaz('Şu anda yalnızca Premium deneme başlatılabilir.', 'hata');
    return;
  }

  if (!auth.currentUser) {
    durumYaz('Premium denemeyi başlatmak için önce giriş yapın. Girişten sonra bu sayfaya döneceksiniz.', 'hata');
    try {
      sessionStorage.setItem('ahek_premium_deneme_ckys', ckysKodu);
      sessionStorage.setItem('ahek_premium_deneme_onay', '1');
    } catch (_) {}
    setTimeout(() => {
      window.location.href = 'giris.html?sonra=uyelik.html';
    }, 900);
    return;
  }

  try {
    if (gonderBtn) gonderBtn.disabled = true;
    durumYaz('Premium deneme başlatılıyor...', 'bilgi');
    const sonuc = await premiumDenemeBaslat(ckysKodu);
    try {
      sessionStorage.removeItem('ahek_premium_deneme_ckys');
      sessionStorage.removeItem('ahek_premium_deneme_onay');
    } catch (_) {}
    denemeBasariYaz(sonuc);
  } catch (err) {
    console.warn('[uyelik] Premium deneme başlatma hatası:', err?.message || err);
    durumYaz(err?.message || 'Premium deneme başlatılamadı, lütfen tekrar deneyin.', 'hata');
    if (gonderBtn) gonderBtn.disabled = false;
  }
});

}
