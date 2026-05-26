import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  collectionGroup,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4qoG_wGN4tmXxdBDEP_ZvsjWjAOQ0-5o",
  authDomain: "hekim-asistani.firebaseapp.com",
  projectId: "hekim-asistani",
  storageBucket: "hekim-asistani.firebasestorage.app",
  messagingSenderId: "660353778151",
  appId: "1:660353778151:web:8fee3d1eeb4f56df023d42",
  measurementId: "G-56PPSQLEBW",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

const DOM = {
  destekPanel: document.getElementById('destekPanel'),
  destekOzet: document.getElementById('destekOzet'),
  destekToplamTalep: document.getElementById('destekToplamTalep'),
  destekAcikTalep: document.getElementById('destekAcikTalep'),
  destekBekleyenTalep: document.getElementById('destekBekleyenTalep'),
  destekTalepSayisi: document.getElementById('destekTalepSayisi'),
  destekTalepListesi: document.getElementById('destekTalepListesi'),
  destekMesajBos: document.getElementById('destekMesajBos'),
  destekMesajListesi: document.getElementById('destekMesajListesi'),
  aktifTalepKonu: document.getElementById('aktifTalepKonu'),
  aktifTalepAlt: document.getElementById('aktifTalepAlt'),
  aktifTalepRozetler: document.getElementById('aktifTalepRozetler'),
  yeniTalepForm: document.getElementById('yeniTalepForm'),
  talepKonu: document.getElementById('talepKonu'),
  talepKategori: document.getElementById('talepKategori'),
  talepMesaj: document.getElementById('talepMesaj'),
  yeniTalepDurum: document.getElementById('yeniTalepDurum'),
  btnYeniTalepAc: document.getElementById('btnYeniTalepAc'),
  btnTalepFormKapat: document.getElementById('btnTalepFormKapat'),
  yanitForm: document.getElementById('yanitForm'),
  yanitMetni: document.getElementById('yanitMetni'),
  yanitDurum: document.getElementById('yanitDurum'),
  btnYanitTemizle: document.getElementById('btnYanitTemizle'),
};

const KATEGORILER = new Set(['Site', 'Hesap', 'Eklenti', 'Yazıcı', 'Diğer']);

let aktifUid = null;
let aktifKullanici = null;
let isAdmin = false;
let talepler = [];
let aktifTalepId = '';
let abonelikTaleplerRoot = null;
let abonelikTaleplerKullanici = null;
let abonelikMesajlar = null;
let abonelikRol = null;
let aktifMesajlar = [];
let yeniTalepAcik = false;
let destekAuthHazirlandi = false;
let aktifTalepYolu = '';

function el(id) {
  return document.getElementById(id);
}

function temizMetin(deger, fallback = '—') {
  const metin = String(deger || '').trim();
  return metin || fallback;
}

function htmlKacis(metin, fallback = '—') {
  return temizMetin(metin, fallback)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function tarihYaz(value) {
  if (!value) return '—';
  const ts = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(ts.getTime())) return '—';
  return ts.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
}

function msYaz(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value?.toMillis) return value.toMillis();
  if (value?.seconds) return value.seconds * 1000;
  return 0;
}

function durumEtiketi(durum) {
  switch (String(durum || '').toLowerCase()) {
    case 'beklemede': return 'Beklemede';
    case 'cozuldu': return 'Çözüldü';
    case 'kapali': return 'Kapalı';
    default: return 'Açık';
  }
}

function durumSinifi(durum) {
  switch (String(durum || '').toLowerCase()) {
    case 'beklemede': return 'beklemede';
    case 'cozuldu': return 'cozuldu';
    case 'kapali': return 'kapali';
    default: return 'acik';
  }
}

function kisalt(metin, limit = 84) {
  const t = temizMetin(metin, '');
  if (t.length <= limit) return t || '—';
  return `${t.slice(0, limit - 1).trimEnd()}…`;
}

function durumYaz(alan, metin, tip = '') {
  if (!alan) return;
  alan.textContent = metin || '';
  alan.className = 'destek-durum' + (tip ? ` ${tip}` : '');
}

function ticketRef(talepId) {
  return `#${String(talepId || '').slice(0, 6).toUpperCase()}`;
}

function ayiklaKullanici(user) {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Kullanıcı'),
  };
}

function kullaniciyiOturumaAl(user) {
  if (!user) return false;
  aktifUid = user.uid;
  aktifKullanici = ayiklaKullanici(user);
  return true;
}

function destekDokumanRef(yol) {
  const parcalar = String(yol || '').split('/').filter(Boolean);
  if (!parcalar.length) return null;
  return doc(db, ...parcalar);
}

function destekMesajKoleksiyonu(yol) {
  const parcalar = String(yol || '').split('/').filter(Boolean);
  if (!parcalar.length) return null;
  return collection(db, ...parcalar, 'mesajlar');
}

function destekTalepYolu(id, uid = aktifUid, kaynak = 'root') {
  if (!id) return '';
  if (String(kaynak) === 'kullanici' && uid) {
    return `users/${uid}/destekTalepleri/${id}`;
  }
  return `destekTalepleri/${id}`;
}

async function oturumuTazele() {
  const user = auth.currentUser || window._currentUser || null;
  if (!user || !kullaniciyiOturumaAl(user)) return false;
  try {
    await user.getIdToken?.(true);
  } catch (_) {}
  return true;
}

function oturumuTemizle() {
  aktifUid = null;
  aktifKullanici = null;
  isAdmin = false;
  talepler = [];
  aktifTalepId = '';
  aktifTalepYolu = '';
  if (abonelikTaleplerRoot) { abonelikTaleplerRoot.unsub(); abonelikTaleplerRoot = null; }
  if (abonelikTaleplerKullanici) { abonelikTaleplerKullanici.unsub(); abonelikTaleplerKullanici = null; }
  if (abonelikMesajlar) { abonelikMesajlar(); abonelikMesajlar = null; }
  if (abonelikRol) { abonelikRol(); abonelikRol = null; }
  anaGorunumuAyarla(false);
}

function destekOturumuYansit(user) {
  if (!user) {
    oturumuTemizle();
    return;
  }

  kullaniciyiOturumaAl(user);
  const hashTalep = location.hash.replace('#', '').trim();
  aktifTalepId = hashTalep;
  anaGorunumuAyarla(true);

  if (abonelikRol) {
    abonelikRol();
    abonelikRol = null;
  }
  abonelikRol = onSnapshot(doc(db, 'users', user.uid), (snap) => {
    const veri = snap.exists() ? snap.data() : {};
    const yeniAdmin = String(veri.role || '').toLowerCase() === 'admin';
    if (yeniAdmin !== isAdmin) {
      isAdmin = yeniAdmin;
      destekDinle(user.uid);
    } else if (!abonelikTaleplerRoot && !abonelikTaleplerKullanici) {
      destekDinle(user.uid);
    }
  }, (err) => {
    console.warn('[destek] rol dinleme hatası:', err);
    destekDinle(user.uid);
  });
}

function anaGorunumuAyarla(girisVarMi) {
  if (DOM.destekPanel) DOM.destekPanel.hidden = true;
  if (DOM.destekOzet) DOM.destekOzet.hidden = true;
}

function yeniTalepFormunuAyarla(acik) {
  yeniTalepAcik = !!acik;
  if (DOM.yeniTalepForm) DOM.yeniTalepForm.hidden = !yeniTalepAcik;
  if (DOM.btnYeniTalepAc) DOM.btnYeniTalepAc.textContent = yeniTalepAcik ? 'Kapat' : 'Aç';
}

function destekHataMesaji(err, varsayilanMesaj) {
  const kod = String(err?.code || '').toLowerCase();
  if (kod.includes('permission-denied')) {
    return 'İşlem tamamlanamadı: destek yazma izni reddedildi. Lütfen tekrar giriş yapıp deneyin.';
  }
  if (kod.includes('unavailable') || kod.includes('deadline-exceeded')) {
    return 'İşlem tamamlanamadı: bağlantı geçici olarak kesildi. Lütfen tekrar deneyin.';
  }
  return varsayilanMesaj;
}

function aktifRozetleriGoster(talep) {
  if (!DOM.aktifTalepRozetler) return;
  const rozetler = [];
  if (talep?.kategori) rozetler.push(`<span class="destek-chip">${htmlKacis(talep.kategori)}</span>`);
  if (talep?.status) rozetler.push(`<span class="destek-chip destek-chip-${durumSinifi(talep.status)}">${htmlKacis(durumEtiketi(talep.status))}</span>`);
  if (talep?.talepId) rozetler.push(`<span class="destek-chip destek-chip-soluk">${htmlKacis(ticketRef(talep.talepId))}</span>`);
  DOM.aktifTalepRozetler.innerHTML = rozetler.join('');
  DOM.aktifTalepRozetler.hidden = rozetler.length === 0;
}

function ticketListesiniCiz() {
  if (!DOM.destekTalepListesi) return;
  const sirali = [...talepler].sort((a, b) => (msYaz(b.guncellenmeMs || b.createdAtMs) - msYaz(a.guncellenmeMs || a.createdAtMs)));

  DOM.destekTalepSayisi.textContent = String(sirali.length);
  DOM.destekToplamTalep.textContent = String(sirali.length);
  DOM.destekAcikTalep.textContent = String(sirali.filter(t => String(t.status || '').toLowerCase() === 'acik').length);
  DOM.destekBekleyenTalep.textContent = String(sirali.filter(t => String(t.status || '').toLowerCase() === 'beklemede').length);

  if (!sirali.length) {
    DOM.destekTalepListesi.innerHTML = '<div class="destek-bos-kart">Henüz bir destek talebiniz yok.</div>';
    if (!aktifTalepId) aktifTalepYok();
    return;
  }

  DOM.destekTalepListesi.innerHTML = sirali.map((talep) => {
    const aktif = talep.id === aktifTalepId ? ' aktif' : '';
    const status = durumSinifi(talep.status);
    const kullaniciBilgi = isAdmin
      ? `<div class="destek-talep-meta"><span>${htmlKacis(kisalt(talep.displayName || 'Kullanıcı', 26))}</span><span>${htmlKacis(kisalt(talep.email || '', 36))}</span><span>${htmlKacis(ticketRef(talep.id))}</span></div>`
      : '';
    return `
      <button type="button" class="destek-talep-item${aktif}" data-talep-id="${htmlKacis(talep.id, '')}" data-talep-yol="${htmlKacis(talep.kaynakYol || '', '')}">
        <div class="destek-talep-item-ust">
          <strong>${htmlKacis(kisalt(talep.subject || talep.konu || 'Başlıksız talep', 54))}</strong>
          <span class="destek-chip destek-chip-${status}">${htmlKacis(durumEtiketi(talep.status))}</span>
        </div>
        <div class="destek-talep-meta">
          <span>${htmlKacis(talep.kategori || 'Diğer')}</span>
          <span>${htmlKacis(tarihYaz(talep.guncellenmeAt || talep.createdAt))}</span>
        </div>
        ${kullaniciBilgi}
        <p>${htmlKacis(kisalt(talep.sonMesaj || talep.summary || 'İlk talep oluşturuldu.', 96))}</p>
      </button>
    `;
  }).join('');

  DOM.destekTalepListesi.querySelectorAll('[data-talep-id]').forEach((btn) => {
    btn.addEventListener('click', () => talepSec(btn.getAttribute('data-talep-id'), btn.getAttribute('data-talep-yol')));
  });

  if (!aktifTalepId || !sirali.some(t => t.id === aktifTalepId)) {
    talepSec(sirali[0].id, sirali[0].kaynakYol);
  } else {
    aktifKartGuncelle();
  }
}

function aktifKartGuncelle() {
  if (!DOM.destekTalepListesi) return;
  DOM.destekTalepListesi.querySelectorAll('.destek-talep-item').forEach((item) => {
    item.classList.toggle('aktif', item.getAttribute('data-talep-id') === aktifTalepId);
  });
}

function aktifTalepYok() {
  aktifTalepId = '';
  aktifTalepYolu = '';
  if (abonelikMesajlar) {
    abonelikMesajlar();
    abonelikMesajlar = null;
  }
  aktifMesajlar = [];
  if (DOM.aktifTalepKonu) DOM.aktifTalepKonu.textContent = 'Bir talep seçin';
  if (DOM.aktifTalepAlt) DOM.aktifTalepAlt.textContent = 'Listeden bir talep seçtiğinizde konuşma burada görünecek.';
  if (DOM.aktifTalepRozetler) {
    DOM.aktifTalepRozetler.hidden = true;
    DOM.aktifTalepRozetler.innerHTML = '';
  }
  if (DOM.destekMesajBos) {
    DOM.destekMesajBos.hidden = false;
    DOM.destekMesajBos.textContent = 'Henüz bir konuşma yok. Soldan bir talep seçin ya da yeni bir talep açın.';
  }
  if (DOM.destekMesajListesi) {
    DOM.destekMesajListesi.hidden = true;
    DOM.destekMesajListesi.innerHTML = '';
  }
  if (DOM.yanitForm) {
    DOM.yanitForm.hidden = true;
    DOM.yanitForm.style.display = 'none';
  }
}

function mesajlariCiz() {
  if (!DOM.destekMesajListesi || !DOM.destekMesajBos) return;
  const seciliTalep = talepler.find((t) => t.id === aktifTalepId) || null;
  const gorunecekMesajlar = aktifMesajlar.length ? aktifMesajlar : (
    seciliTalep?.sonMesaj
      ? [{
        id: `${seciliTalep.id}-ozet`,
        rol: seciliTalep.sonMesajRol || 'kullanici',
        isim: seciliTalep.sonMesajAd || (seciliTalep.sonMesajRol === 'destek' ? 'Destek ekibi' : aktifKullanici?.displayName || 'Siz'),
        metin: seciliTalep.sonMesaj,
        createdAt: seciliTalep.sonMesajAt || seciliTalep.createdAt,
        createdAtMs: seciliTalep.sonMesajMs || seciliTalep.createdAtMs,
      }]
      : []
  );

  if (!gorunecekMesajlar.length) {
    DOM.destekMesajBos.hidden = false;
    DOM.destekMesajBos.textContent = 'Bu talepte henüz mesaj yok.';
    DOM.destekMesajListesi.hidden = true;
    DOM.destekMesajListesi.innerHTML = '';
    return;
  }

  DOM.destekMesajBos.hidden = true;
  DOM.destekMesajListesi.hidden = false;
  DOM.destekMesajListesi.innerHTML = gorunecekMesajlar.map((mesaj) => {
    const rol = String(mesaj.rol || 'kullanici');
    const taraf = rol === 'destek' ? 'destek' : 'kullanici';
    const ad = htmlKacis(mesaj.isim || (rol === 'destek' ? 'Destek ekibi' : aktifKullanici?.displayName || 'Siz'));
    return `
      <article class="destek-mesaj ${taraf}">
        <div class="destek-mesaj-ust">
          <strong>${ad}</strong>
          <span>${htmlKacis(tarihYaz(mesaj.createdAt || mesaj.createdAtMs))}</span>
        </div>
        <p>${htmlKacis(temizMetin(mesaj.metin, '—')).replaceAll('\n', '<br>')}</p>
      </article>
    `;
  }).join('');
  DOM.destekMesajListesi.scrollTop = DOM.destekMesajListesi.scrollHeight;
}

function talepSec(talepId, kaynakYol = '') {
  if (!talepId) return;
  aktifTalepId = talepId;
  aktifTalepYolu = kaynakYol || destekTalepYolu(talepId);
  aktifKartGuncelle();
  const talep = talepler.find(t => t.id === talepId && (!kaynakYol || t.kaynakYol === kaynakYol)) || talepler.find(t => t.id === talepId);
  if (!talep) return;

  if (DOM.aktifTalepKonu) DOM.aktifTalepKonu.textContent = temizMetin(talep.subject || talep.konu, 'Başlıksız talep');
  if (DOM.aktifTalepAlt) {
    const kimeAit = isAdmin ? ` · ${temizMetin(talep.displayName || talep.email || 'Kullanıcı')}` : '';
    DOM.aktifTalepAlt.textContent = `${talep.kategori || 'Diğer'} · ${ticketRef(talep.id)}${kimeAit} · Son güncelleme: ${tarihYaz(talep.guncellenmeAt || talep.createdAt)}`;
  }
  aktifRozetleriGoster({ ...talep, talepId: talep.id });
  if (DOM.yanitForm) {
    DOM.yanitForm.hidden = !isAdmin;
    DOM.yanitForm.style.display = isAdmin ? '' : 'none';
  }
  if (DOM.yanitDurum) durumYaz(DOM.yanitDurum, '');
  if (DOM.yanitMetni) DOM.yanitMetni.value = '';

  if (abonelikMesajlar) {
    abonelikMesajlar();
    abonelikMesajlar = null;
  }

  const mesajlarKoleksiyonu = destekMesajKoleksiyonu(aktifTalepYolu);
  if (!mesajlarKoleksiyonu) return;
  const mesajlarRef = query(mesajlarKoleksiyonu, orderBy('createdAtMs', 'asc'));
  abonelikMesajlar = onSnapshot(mesajlarRef, (snap) => {
    aktifMesajlar = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    mesajlariCiz();
  }, (err) => {
    console.warn('[destek] mesaj dinleme hatası:', err);
    durumYaz(DOM.yanitDurum, 'Mesajlar yüklenemedi.', 'hata');
  });

  try {
    history.replaceState(null, '', `#${talepId}`);
  } catch (_) {}
}

function yeniTalepFormunuTemizle() {
  if (DOM.talepKonu) DOM.talepKonu.value = '';
  if (DOM.talepKategori) DOM.talepKategori.value = '';
  if (DOM.talepMesaj) DOM.talepMesaj.value = '';
}

async function yeniTalepOlustur(e) {
  e.preventDefault();
  if ((!aktifUid || !aktifKullanici) && await oturumuTazele()) {
    destekOturumuYansit(auth.currentUser || window._currentUser);
  } else {
    await oturumuTazele();
  }
  if (!aktifUid || !aktifKullanici) {
    durumYaz(DOM.yeniTalepDurum, 'Talep oluşturmak için önce giriş yapın.', 'hata');
    return;
  }
  durumYaz(DOM.yeniTalepDurum, '');

  const konu = temizMetin(DOM.talepKonu?.value, '');
  const kategori = temizMetin(DOM.talepKategori?.value, '');
  const mesaj = temizMetin(DOM.talepMesaj?.value, '');

  if (!konu || !kategori || !mesaj) {
    durumYaz(DOM.yeniTalepDurum, 'Konu, kategori ve mesaj zorunlu.', 'hata');
    return;
  }
  if (!KATEGORILER.has(kategori)) {
    durumYaz(DOM.yeniTalepDurum, 'Kategori seçimi geçersiz.', 'hata');
    return;
  }

  durumYaz(DOM.yeniTalepDurum, 'Talep oluşturuluyor…', 'info');
  try {
    const rootTalepRef = doc(collection(db, 'destekTalepleri'));
    const kullaniciTalepRef = destekDokumanRef(destekTalepYolu(rootTalepRef.id, aktifUid, 'kullanici'));
    const zaman = Date.now();
    const tarih = new Date(zaman);
    const talepVerisi = {
      uid: aktifUid,
      email: aktifKullanici.email || '',
      displayName: aktifKullanici.displayName || '',
      subject: konu,
      konu,
      kategori,
      status: 'acik',
      createdAt: tarih,
      createdAtMs: zaman,
      guncellenmeAt: tarih,
      guncellenmeMs: zaman,
      sonMesaj: mesaj,
      sonMesajRol: 'kullanici',
      sonMesajAd: aktifKullanici.displayName || '',
      sonMesajAt: tarih,
      sonMesajMs: zaman,
      mesajSayisi: 1,
    };

    let talepRef = rootTalepRef;
    let kaynak = 'root';
    try {
      await setDoc(rootTalepRef, talepVerisi);
    } catch (rootErr) {
      console.warn('[destek] root talep yazımı başarısız, kullanıcı alanına düşülüyor:', rootErr?.code || rootErr?.message || rootErr);
      if (!kullaniciTalepRef) throw rootErr;
      await setDoc(kullaniciTalepRef, talepVerisi);
      talepRef = kullaniciTalepRef;
      kaynak = 'kullanici';
    }

    try {
      const mesajlarRef = destekMesajKoleksiyonu(talepRef.path);
      if (mesajlarRef) {
        await addDoc(mesajlarRef, {
          uid: aktifUid,
          rol: 'kullanici',
          isim: aktifKullanici.displayName || '',
          email: aktifKullanici.email || '',
          metin: mesaj,
          createdAt: tarih,
          createdAtMs: zaman,
        });
      }
    } catch (mesajErr) {
      console.warn('[destek] ilk mesaj ayrı kaydedilemedi:', mesajErr);
    }

    durumYaz(DOM.yeniTalepDurum, 'Talep alındı. Konuşma açıldı.', 'basari');
    yeniTalepFormunuTemizle();
    yeniTalepFormunuAyarla(false);
    aktifTalepId = talepRef.id;
    aktifTalepYolu = destekTalepYolu(talepRef.id, aktifUid, kaynak);
    try {
      history.replaceState(null, '', `#${talepRef.id}`);
    } catch (_) {}
  } catch (err) {
    console.warn('[destek] yeni talep hatası:', err?.code || err?.message || err);
    durumYaz(DOM.yeniTalepDurum, destekHataMesaji(err, 'Talep oluşturulamadı. Lütfen tekrar deneyin.'), 'hata');
  }
}

async function yanitGonder(e) {
  e.preventDefault();
  if ((!aktifUid || !aktifKullanici) && await oturumuTazele()) {
    destekOturumuYansit(auth.currentUser || window._currentUser);
  } else {
    await oturumuTazele();
  }
  if (!isAdmin) {
    durumYaz(DOM.yanitDurum, 'Bu alan yalnızca destek ekibi için görünür.', 'hata');
    return;
  }
  if (!aktifUid || !aktifKullanici || !aktifTalepId) {
    durumYaz(DOM.yanitDurum, 'Yanıt göndermek için önce giriş yapın ve bir talep seçin.', 'hata');
    return;
  }
  if (!aktifTalepYolu) {
    durumYaz(DOM.yanitDurum, 'Önce bir talep seçin.', 'hata');
    return;
  }
  durumYaz(DOM.yanitDurum, '');
  const metin = temizMetin(DOM.yanitMetni?.value, '');
  if (!metin) {
    durumYaz(DOM.yanitDurum, 'Yanıt metni boş olamaz.', 'hata');
    return;
  }

  durumYaz(DOM.yanitDurum, 'Gönderiliyor…', 'info');
  try {
    const zaman = Date.now();
    const tarih = new Date(zaman);
    const rol = isAdmin ? 'destek' : 'kullanici';
    const isim = isAdmin ? (aktifKullanici.displayName || 'Destek ekibi') : (aktifKullanici.displayName || '');
    try {
      const mesajlarRef = destekMesajKoleksiyonu(aktifTalepYolu);
      if (mesajlarRef) {
        await addDoc(mesajlarRef, {
          uid: aktifUid,
          rol,
          isim,
          email: aktifKullanici.email || '',
          metin,
          createdAt: tarih,
          createdAtMs: zaman,
        });
      }
    } catch (mesajErr) {
      console.warn('[destek] yanıt ayrı kaydedilemedi:', mesajErr);
    }

    const talepRef = destekDokumanRef(aktifTalepYolu);
    if (!talepRef) {
      throw new Error('Talep yolu bulunamadı');
    }
    await setDoc(talepRef, {
      sonMesaj: metin,
      sonMesajRol: rol,
      sonMesajAd: isim,
      sonMesajAt: tarih,
      sonMesajMs: zaman,
      guncellenmeAt: tarih,
      guncellenmeMs: zaman,
      status: isAdmin ? 'acik' : 'beklemede',
      mesajSayisi: (aktifMesajlar.length || 0) + 1,
    }, { merge: true });

    if (DOM.yanitMetni) DOM.yanitMetni.value = '';
    durumYaz(DOM.yanitDurum, 'Yanıt gönderildi.', 'basari');
  } catch (err) {
    console.warn('[destek] yanıt hatası:', err?.code || err?.message || err);
    durumYaz(DOM.yanitDurum, destekHataMesaji(err, 'Yanıt gönderilemedi.'), 'hata');
  }
}

function destekTalepleriBirlesikYansit() {
  const harita = new Map();
  [...(abonelikTaleplerRoot?.veri || []), ...(abonelikTaleplerKullanici?.veri || [])].forEach((talep) => {
    if (!harita.has(talep.id)) harita.set(talep.id, talep);
  });
  talepler = [...harita.values()];
  ticketListesiniCiz();
}

function destekTalepleriDinle(uid) {
  if (abonelikTaleplerRoot) {
    abonelikTaleplerRoot.unsub();
    abonelikTaleplerRoot = null;
  }
  if (abonelikTaleplerKullanici) {
    abonelikTaleplerKullanici.unsub();
    abonelikTaleplerKullanici = null;
  }

  const rootKaynak = isAdmin
    ? collection(db, 'destekTalepleri')
    : query(collection(db, 'destekTalepleri'), where('uid', '==', uid));
  const kullaniciKaynak = isAdmin
    ? collectionGroup(db, 'destekTalepleri')
    : query(collectionGroup(db, 'destekTalepleri'), where('uid', '==', uid));

  abonelikTaleplerRoot = {
    veri: [],
    unsub: onSnapshot(rootKaynak, (snap) => {
      abonelikTaleplerRoot.veri = snap.docs.map((d) => ({ id: d.id, kaynakYol: d.ref.path, ...d.data() }));
      destekTalepleriBirlesikYansit();
    }, (err) => {
      console.warn('[destek] root talep dinleme hatası:', err);
      abonelikTaleplerRoot.veri = [];
      destekTalepleriBirlesikYansit();
    }),
  };

  abonelikTaleplerKullanici = {
    veri: [],
    unsub: onSnapshot(kullaniciKaynak, (snap) => {
      abonelikTaleplerKullanici.veri = snap.docs.map((d) => ({ id: d.id, kaynakYol: d.ref.path, ...d.data() }));
      destekTalepleriBirlesikYansit();
    }, (err) => {
      console.warn('[destek] kullanıcı talep dinleme hatası:', err);
      abonelikTaleplerKullanici.veri = [];
      destekTalepleriBirlesikYansit();
    }),
  };
}

function destekDinle(uid) {
  destekTalepleriDinle(uid);
}

function olaylariBagla() {
  DOM.btnYeniTalepAc?.addEventListener('click', () => yeniTalepFormunuAyarla(!yeniTalepAcik));
  DOM.btnTalepFormKapat?.addEventListener('click', () => yeniTalepFormunuAyarla(false));
  DOM.yeniTalepForm?.addEventListener('submit', yeniTalepOlustur);
  DOM.yanitForm?.addEventListener('submit', yanitGonder);
  DOM.btnYanitTemizle?.addEventListener('click', () => {
    if (DOM.yanitMetni) DOM.yanitMetni.value = '';
    durumYaz(DOM.yanitDurum, '');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  olaylariBagla();
  yeniTalepFormunuAyarla(true);
  window.addEventListener('hekim-auth-durum-degisti', (e) => {
    destekOturumuYansit(e?.detail?.user || null);
  });

  const authDinle = (user) => destekOturumuYansit(user || null);
  onAuthStateChanged(auth, authDinle);

  if (!destekAuthHazirlandi) {
    destekAuthHazirlandi = true;
    Promise.resolve(auth.authStateReady?.()).then(() => {
      const mevcutUser = auth.currentUser || window._currentUser || null;
      if (mevcutUser) {
        destekOturumuYansit(mevcutUser);
      } else {
        oturumuTemizle();
      }
    }).catch(() => {
      const mevcutUser = auth.currentUser || window._currentUser || null;
      destekOturumuYansit(mevcutUser);
    });
  }
});
