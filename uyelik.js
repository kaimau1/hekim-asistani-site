// uyelik.js — İletişim formu Firestore'a talep yazar.
import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js';
import { getFirestore, collection, addDoc } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';

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
const db = getFirestore(app);

const form = document.getElementById('talepForm');
const durum = document.getElementById('formDurum');

// İletişim bölümü gizliyse script'i atla (form/durum DOM'da hidden section içinde, listener gerekmez).
if (!form || !durum || form.closest('[hidden]')) {
  // no-op
} else {

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  durum.textContent = '';
  durum.className = 'form-durum';

  const fd = new FormData(form);
  const email = (fd.get('email') || '').trim();
  const ckysKodu = String(fd.get('ckysKodu') || '').replace(/\D+/g, '');
  const istenenTier = fd.get('istenenTier');
  const mesaj = (fd.get('mesaj') || '').slice(0, 500);

  if (!email || !ckysKodu || !istenenTier) {
    durum.textContent = 'E-posta, ÇKYS kodu ve üyelik seçimi zorunlu.';
    durum.classList.add('hata');
    return;
  }
  if (ckysKodu.length < 3 || ckysKodu.length > 20) {
    durum.textContent = 'Geçerli bir ÇKYS kodu girin.';
    durum.classList.add('hata');
    return;
  }
  if (fd.get('ckysOnay') !== 'on') {
    durum.textContent = 'ÇKYS kodunun sabitleneceğine dair onay gerekli.';
    durum.classList.add('hata');
    return;
  }

  try {
    const talep = {
      email,
      ckysKodu,
      istenenTier,
      mesaj,
      tarih: new Date().toISOString(),
      durum: 'bekliyor',
    };
    if (auth.currentUser) talep.uid = auth.currentUser.uid;

    await addDoc(collection(db, 'uyelikTalepleri'), talep);

    durum.textContent = '✓ Talebiniz alındı. En kısa sürede geri dönüş yapacağız.';
    durum.classList.add('basari');
    form.reset();
  } catch (err) {
    console.warn('[uyelik] Talep gönderim hatası:', err);
    durum.textContent = 'Gönderim başarısız, lütfen tekrar deneyin.';
    durum.classList.add('hata');
  }
});

}
