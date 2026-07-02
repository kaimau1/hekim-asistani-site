import { getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
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
const functions = getFunctions(app, 'us-central1');

const api = {
  durumGetir: httpsCallable(functions, 'rotasyonDurumGetir'),
  islemBaslat: httpsCallable(functions, 'rotasyonIslemBaslat'),
  islemBitir: httpsCallable(functions, 'rotasyonIslemBitir'),
  planGetir: httpsCallable(functions, 'rotasyonPlanGetir'),
  buluttanCek: httpsCallable(functions, 'rotasyonBuluttanCek'),
  bulutaGonder: httpsCallable(functions, 'rotasyonBulutaGonder'),
  donemOnayla: httpsCallable(functions, 'rotasyonDonemOnayla'),
  temsilciAta: httpsCallable(functions, 'rotasyonTemsilciAta'),
  davetLinkiYenile: httpsCallable(functions, 'rotasyonDavetLinkiYenile'),
  uyeDuzenle: httpsCallable(functions, 'rotasyonUyeDuzenle'),
  kisiGecmisi: httpsCallable(functions, 'rotasyonKisiGecmisi'),
  tamamlananGuncelle: httpsCallable(functions, 'rotasyonTamamlananGuncelle'),
  asistanBaslangicKaydet: httpsCallable(functions, 'rotasyonAsistanBaslangicKaydet'),
};

// Secmeli stajlar: bu uctan en az BIRI alinmis/tamamlanmissa digerleri "gerek yok" sayilir.
const SECMELI_ROTASYONLAR = ['ftr', 'genel-cerrahi', 'noroloji'];

const ROTASYON_VARSAYILANLARI = [
  { key: 'dahiliye', ad: 'Dahiliye', sureAy: 4, kapasite: 12 },
  { key: 'pediatri', ad: 'Pediatri', sureAy: 4, kapasite: 8 },
  { key: 'kadin-dogum', ad: 'Kadin dogum', sureAy: 3, kapasite: 4 },
  { key: 'psikiyatri', ad: 'Psikiyatri', sureAy: 2, kapasite: 4 },
  { key: 'kardiyoloji', ad: 'Kardiyoloji', sureAy: 1, kapasite: 3 },
  { key: 'gogus', ad: 'Gogus', sureAy: 1, kapasite: 2 },
  { key: 'acil', ad: 'Acil', sureAy: 1, kapasite: 10 },
  { key: 'dermatoloji', ad: 'Dermatoloji', sureAy: 1, kapasite: 2 },
  { key: 'ftr', ad: 'FTR', sureAy: 1, kapasite: 1 },
  { key: 'noroloji', ad: 'Noroloji', sureAy: 1, kapasite: 2 },
  { key: 'genel-cerrahi', ad: 'Genel cerrahi', sureAy: 1, kapasite: 2 },
];

const ROTASYON_VARSAYILAN_DONEM = '2026-2027';

const durumEl = document.getElementById('rotasyonDurum');
const kotaEl = document.getElementById('rotasyonKota');
const donemSec = document.getElementById('rotasyonDonemSec');
const yetkiUyari = document.getElementById('rotasyonYetkiUyari');
const mesajlarEl = document.getElementById('rotasyonMesajlar');
const tabloEl = document.getElementById('rotasyonTablo');
const canliEl = document.getElementById('rotasyonCanli');
const kendiListeEl = document.getElementById('rotasyonKendiListe');
const adminPanelEl = document.getElementById('rotasyonAdminPanel');
const btnIslemBaslat = document.getElementById('btnRotasyonIslemBaslat');
const btnBulutaGonder = document.getElementById('btnRotasyonBulutaGonder');
const btnIslemBitir = document.getElementById('btnRotasyonIslemBitir');
const hedefKisiSec = document.getElementById('rotasyonHedefKisiSec');
const rolSec = document.getElementById('rotasyonRolSec');
const btnTemsilciAta = document.getElementById('btnRotasyonTemsilciAta');
const btnDonemOnayla = document.getElementById('btnRotasyonDonemOnayla');
const btnDavetYenile = document.getElementById('btnRotasyonDavetYenile');
const davetLinkiInput = document.getElementById('rotasyonDavetLinki');
const listePanel = document.getElementById('rotasyonListePanel');
const listeIcerik = document.getElementById('rotasyonListeIcerik');
const btnListeTum = document.getElementById('btnListeTum');
const btnListeYaklasan = document.getElementById('btnListeYaklasan');
const btnListeExcel = document.getElementById('btnListeExcel');
const calismaEl = document.querySelector('.rotasyon-calisma');
const yatayKaydirEl = document.getElementById('rotasyonYatayKaydir');
const yatayKaydirIcEl = yatayKaydirEl?.querySelector('.rotasyon-yatay-kaydir-ic');
// Sayfa asagi kayinca viewport ustune sabitlenen ay/tarih basligi klonu (tabloyla yatay senkron).
const sabitBaslikEl = document.createElement('div');
sabitBaslikEl.className = 'rotasyon-sabit-baslik';
sabitBaslikEl.hidden = true;
sabitBaslikEl.setAttribute('aria-hidden', 'true');
document.body.appendChild(sabitBaslikEl);
let sabitBaslikSurum = 0;
const gateBaslikEl = document.getElementById('rotasyonGateBaslik');
const gateMesajEl = document.getElementById('rotasyonGateMesaj');
const gateGirisEl = document.getElementById('rotasyonGateGiris');
const gateIkonEl = document.querySelector('#rotasyonGate .rotasyon-gate-ikon');
const gateSifreAlani = document.getElementById('rotasyonGateSifreAlani');
const gateSifreInput = document.getElementById('rotasyonGateSifreInput');
const gateSifreBtn = document.getElementById('rotasyonGateSifreBtn');
const gateSifreHata = document.getElementById('rotasyonGateSifreHata');
const btnUyeAdDuzenle = document.getElementById('btnRotasyonUyeAdDuzenle');
const uyeYeniAdInput = document.getElementById('rotasyonUyeYeniAd');
const asistanBaslangicInput = document.getElementById('rotasyonAsistanBaslangicTarihi');
const btnRotasyonBaslangicKaydet = document.getElementById('btnRotasyonBaslangicKaydet');
const baslangicDurumEl = document.getElementById('rotasyonBaslangicDurum');

// Bir donemde alinabilecek en fazla rotasyon: 6 ay = 186 gun. 187 ve uzeri yasak.
const DONEM_GUN_SINIRI = 186;

let aktifKullanici = null;
let aktifKilit = null;
let aktifPeriod = null;
let aktifKota = null;
let yerelTaslak = null;
let komsuPeriodlar = {};
let kaydedilmemisDegisiklikVar = false;
let hedefKullaniciUid = '';
let sayacTimer = null;
let sayfaSifresiDogrulandi = false;
const SAYFA_SIFRESI = 'au20262027';
// Ilk auth durumu (onAuthStateChanged) henuz gelmeden "Giris Yap" karti gosterilmesin;
// kontrol bitene kadar yuklenme ekrani gosterilir.
let authKontrolEdildi = false;
// Tablo ilk cizilince donem basina kaydirilir; sonraki cizimlerde konum korunur (ekleme/silme).
let tabloScrollBaslatildi = false;
// Kullanicinin TUM donemlerdeki kendi kayitlari + el ile "gecmiste tamamladim" isaretleri.
let benimGecmisKayitlar = [];
let benimTamamlanan = [];
// "Gecmiste tamamladigim rotasyonlar" acilir listesi yeniden cizimde acik kalsin diye durum bayragi.
let tamamlananDropdownAcik = false;
// Duzenleme oturumunda (kilit bizdeyken) her donemin taslagi RAM'de saklanir; donemler
// arasi gecis kaydedilmemis degisiklikleri SILMEZ. periodId -> { period, taslak, dirty }.
// KVKK: sadece RAM (Map), sayfa kapaninca kaybolur; kalici ortama yazilmaz.
const taslakOnbellek = new Map();

// Dar ekranlarda genis kaydirmali grid yerine dikey kart gorunumu cizilir.
const mobilSorgu = window.matchMedia('(max-width: 720px)');
mobilSorgu.addEventListener('change', () => rotasyonGorunumunuCiz());
// Mobil alt gorunum: null=otomatik (kaydi olana 'benim'), 'benim' | 'tum'
let mobilGorunum = null;

// Islem Baslat sonrasi kalan duzenleme suresini gosteren kucuk sayac.
const sayacEl = document.createElement('span');
sayacEl.className = 'rotasyon-sayac';
sayacEl.hidden = true;
btnBulutaGonder?.parentElement?.appendChild(sayacEl);

// Plan getirilirken/kaydedilirken kullaniciyi bilgilendiren tam ekran bekleme penceresi.
const yuklemeEl = document.createElement('div');
yuklemeEl.className = 'rotasyon-yukleme';
yuklemeEl.hidden = true;
yuklemeEl.setAttribute('role', 'status');
yuklemeEl.setAttribute('aria-live', 'assertive');
yuklemeEl.innerHTML = '<div class="rotasyon-yukleme-kutu">'
  + '<span class="rotasyon-yukleme-spin" aria-hidden="true"></span>'
  + '<span class="rotasyon-yukleme-metin"></span>'
  + '<span class="rotasyon-yukleme-alt">Veriler hazirlaniyor, lutfen bu pencereyi kapatmayin.</span>'
  + '</div>';
document.body.appendChild(yuklemeEl);
const yuklemeMetinEl = yuklemeEl.querySelector('.rotasyon-yukleme-metin');
function yuklemeAc(metin) {
  yuklemeMetinEl.textContent = metin || 'Lutfen bekleyin...';
  yuklemeEl.hidden = false;
}
function yuklemeKapat() {
  yuklemeEl.hidden = true;
}

window.addEventListener('beforeunload', (event) => {
  // Aktif donem veya baska donemlerde (onbellek) kaydedilmemis degisiklik varsa uyar.
  if (!kirliTaslakVarMi()) return;
  event.preventDefault();
  event.returnValue = 'Kaydedilmemis degisiklikler var.';
});

function kopya(veri) {
  return JSON.parse(JSON.stringify(veri));
}

function tarih(iso) {
  return new Date(`${iso}T00:00:00.000Z`);
}

function isoGun(date) {
  return date.toISOString().slice(0, 10);
}

function ayEkle(iso, aySayisi) {
  const d = tarih(iso);
  d.setUTCMonth(d.getUTCMonth() + aySayisi);
  return isoGun(d);
}

function gunEkle(iso, gunSayisi) {
  const d = tarih(iso);
  d.setUTCDate(d.getUTCDate() + gunSayisi);
  return isoGun(d);
}

function rotasyonBitisHesapla(baslangic, sureAy) {
  return gunEkle(ayEkle(baslangic, sureAy), -1);
}

function aktifAyAraliklari(baslangic, bitis) {
  const araliklar = [];
  let cursor = baslangic;
  while (cursor <= bitis) {
    const aralikBitis = gunEkle(ayEkle(cursor, 1), -1);
    araliklar.push({ baslangic: cursor, bitis: aralikBitis <= bitis ? aralikBitis : bitis });
    cursor = gunEkle(aralikBitis, 1);
  }
  return araliklar;
}

function araliklarKesisiyor(aBas, aBit, bBas, bBit) {
  return aBas <= bBit && bBas <= aBit;
}

function donemSinirlari(periodId) {
  const yil = Number(String(periodId).split('-')[0]);
  return { baslangic: `${yil}-09-01`, bitis: `${yil + 1}-08-31` };
}

function gunFarkiDahil(baslangic, bitis) {
  return Math.floor((tarih(bitis).getTime() - tarih(baslangic).getTime()) / 86400000) + 1;
}

function tarihGecerliMi(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(iso || '')) && Number.isFinite(tarih(iso).getTime());
}

function donemdeKalanGunSayisi(baslangic, bitis, periodId) {
  const donem = donemSinirlari(periodId);
  const bas = baslangic > donem.baslangic ? baslangic : donem.baslangic;
  const son = bitis < donem.bitis ? bitis : donem.bitis;
  if (bas > son) return 0;
  return gunFarkiDahil(bas, son);
}

function kisiselDonemSinirlari(asistanBaslangicTarihi, referansTarih) {
  if (!tarihGecerliMi(asistanBaslangicTarihi)) return null;
  const yil = Number(String(referansTarih || asistanBaslangicTarihi).slice(0, 4));
  const ayGun = asistanBaslangicTarihi.slice(4);
  let baslangic = `${yil}${ayGun}`;
  if (referansTarih < baslangic) baslangic = `${yil - 1}${ayGun}`;
  return {
    baslangic,
    bitis: gunEkle(ayEkle(baslangic, 12), -1),
  };
}

function kisiselDonemdeKalanGunSayisi(baslangic, bitis, asistanBaslangicTarihi, referansTarih) {
  const donem = kisiselDonemSinirlari(asistanBaslangicTarihi, referansTarih || baslangic);
  if (!donem) return 0;
  const bas = baslangic > donem.baslangic ? baslangic : donem.baslangic;
  const son = bitis < donem.bitis ? bitis : donem.bitis;
  if (bas > son) return 0;
  return gunFarkiDahil(bas, son);
}

function uyeBilgisi(uid) {
  if (!uid || !aktifKullanici) return null;
  if (uid === aktifKullanici.uid) return aktifKullanici;
  return aktifKullanici.uyeler?.find((u) => u.uid === uid) || null;
}

function hedefBaslangicTarihi(hedef = hedefKullanici()) {
  return String(hedef?.asistanBaslangicTarihi || '').trim();
}

function aktifRotasyonlar() {
  return yerelTaslak?.rotasyonlar?.length ? yerelTaslak.rotasyonlar : ROTASYON_VARSAYILANLARI;
}

function periodBaslangicYili(periodId) {
  return Number(String(periodId || ROTASYON_VARSAYILAN_DONEM).split('-')[0]);
}

function donemKaydir(periodId, fark) {
  const yil = periodBaslangicYili(periodId) + fark;
  return `${yil}-${yil + 1}`;
}

// Aktif donemin gorunur penceresi (3 ay onceki sarkma + 12 ay + 3 ay sonraki sarkma).
// Komsu donem kayitlari yalniz bu pencereye TASARSA gosterilir; tamamen disarda
// kalan (ornegin onceki donemin erken aylari) kayitlar listelere sizmamali.
function gorunumPenceresi() {
  const araliklar = donemAraliklari(aktifDonemId());
  return { bas: araliklar[0].baslangic, son: araliklar[araliklar.length - 1].bitis };
}

function gorunumKayitlari() {
  const pencere = gorunumPenceresi();
  const komsular = [
    ...(komsuPeriodlar.onceki?.kayitlar || []),
    ...(komsuPeriodlar.sonraki?.kayitlar || []),
  ].filter((kayit) => kayit && araliklarKesisiyor(kayit.baslangic, kayit.bitis, pencere.bas, pencere.son));
  const birlesik = [...komsular, ...(yerelTaslak?.kayitlar || [])];
  const benzersiz = new Map();
  birlesik.forEach((kayit) => {
    if (kayit?.id) benzersiz.set(kayit.id, kayit);
  });
  return [...benzersiz.values()];
}

function kapasiteUyarisiBul(kayitlar = yerelTaslak?.kayitlar || []) {
  for (const kayit of kayitlar) {
    const tanim = aktifRotasyonlar().find((r) => r.key === kayit.rotasyonKey);
    if (!tanim) continue;
    for (const aralik of aktifAyAraliklari(kayit.baslangic, kayit.bitis)) {
      const aktifSayi = kayitlar.filter((diger) =>
        diger.rotasyonKey === kayit.rotasyonKey &&
        araliklarKesisiyor(aralik.baslangic, aralik.bitis, diger.baslangic, diger.bitis)
      ).length;
      if (aktifSayi > tanim.kapasite) {
        return `${tanim.ad}, ${ayAdiTam(aralik.baslangic)} ayinda kapasitenin uzerinde (${aktifSayi}/${tanim.kapasite} kisi).`;
      }
    }
  }
  return '';
}

function kisiCakismaUyarisiBul(kayitlar = yerelTaslak?.kayitlar || []) {
  for (const kayit of kayitlar) {
    const cakisan = kayitlar.find((diger) =>
      diger.id !== kayit.id &&
      diger.uid === kayit.uid &&
      araliklarKesisiyor(kayit.baslangic, kayit.bitis, diger.baslangic, diger.bitis)
    );
    if (cakisan) {
      return `${kayit.adSoyad} ayni tarihlerde birden fazla rotasyonda gorunuyor.`;
    }
  }
  return '';
}

function gunSiniriUyarisiBul(kayitlar = yerelTaslak?.kayitlar || []) {
  const uidSet = [...new Set(kayitlar.map((k) => k.uid))];
  for (const uid of uidSet) {
    const kisiKayitlari = kayitlar.filter((k) => k.uid === uid);
    const uye = uyeBilgisi(uid);
    const asistanBaslangicTarihi = hedefBaslangicTarihi(uye);
    if (!asistanBaslangicTarihi) {
      return `${kisiKayitlari[0]?.adSoyad || 'Bir kisi'} icin asistanliga baslangic tarihi eksik. Tarih girilmeden rotasyon eklenemez.`;
    }
    const referansTarih = kisiKayitlari[0]?.baslangic || asistanBaslangicTarihi;
    const toplam = kisiKayitlari.reduce((acc, kayit) => acc + kisiselDonemdeKalanGunSayisi(kayit.baslangic, kayit.bitis, asistanBaslangicTarihi, referansTarih), 0);
    if (toplam > DONEM_GUN_SINIRI) {
      return `Asistanliga baslangic tarihinden itibaren en fazla 6 ay (${DONEM_GUN_SINIRI} gun) rotasyon alinabilir. ${kisiKayitlari[0]?.adSoyad || 'Bir kisi'} icin ${toplam} gun oluyor.`;
    }
  }
  return '';
}

function canliUyarilariHesapla() {
  // Uyarilari aktif donem + komsu donemlerden tasan kayitlarla birlikte hesapla; boylece
  // donem sinirindaki kapasite/cakisma/gun-siniri sorunlari (diger donemler) de gorulur.
  const kayitlar = gorunumKayitlari();
  return [
    kapasiteUyarisiBul(kayitlar),
    kisiCakismaUyarisiBul(kayitlar),
    gunSiniriUyarisiBul(kayitlar),
    kirliTaslakVarMi() ? 'Henuz kaydetmediniz. Bitince "Islemi Bitir" dugmesine basin.' : '',
  ].filter(Boolean);
}

const toastEl = document.createElement('div');
toastEl.className = 'rotasyon-toast';
toastEl.setAttribute('role', 'status');
toastEl.setAttribute('aria-live', 'polite');
document.body.appendChild(toastEl);
let toastTimer = null;

function toastGoster(metin, tip) {
  if (!metin) return;
  toastEl.textContent = metin;
  toastEl.dataset.tip = tip || 'bilgi';
  toastEl.classList.add('acik');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('acik'), 3500);
}

function mesajYaz(metin, tip = 'bilgi') {
  // Eski alan (durum satiri) korunur; onemli mesajlar ayrica ustte toast olarak da gosterilir.
  if (durumEl) {
    durumEl.textContent = metin || '';
    durumEl.dataset.tip = tip;
  }
  // Erisim acilmadan (giris/uye/sayfa sifresi) toast gosterme; "plan yuklendi" gibi mesajlar
  // sifre ekraninda yaniltici cikiyordu.
  if (metin && (tip === 'hata' || tip === 'ok') && erisimVarMi()) {
    toastGoster(metin, tip);
  }
}

function mesajlariCiz() {
  if (!mesajlarEl) return;
  const uyarilar = canliUyarilariHesapla();
  mesajlarEl.innerHTML = '';
  if (!uyarilar.length) {
    mesajlarEl.textContent = 'Her sey yolunda, uyari yok.';
    return;
  }
  uyarilar.forEach((uyari) => {
    const satir = document.createElement('div');
    satir.className = 'rotasyon-mesaj';
    satir.textContent = uyari;
    mesajlarEl.appendChild(satir);
  });
}

function baslangicDurumuYaz(metin, tip = 'bilgi') {
  if (!baslangicDurumEl) return;
  baslangicDurumEl.textContent = metin || '';
  baslangicDurumEl.dataset.tip = tip;
}

function asistanBaslangicFormunuCiz() {
  if (!asistanBaslangicInput) return;
  const tarihDegeri = hedefBaslangicTarihi(aktifKullanici);
  if (document.activeElement !== asistanBaslangicInput) {
    asistanBaslangicInput.value = tarihDegeri;
  }
  asistanBaslangicInput.disabled = !aktifKullanici;
  if (btnRotasyonBaslangicKaydet) btnRotasyonBaslangicKaydet.disabled = !aktifKullanici;
  if (!aktifKullanici) {
    baslangicDurumuYaz('Giris yapinca kendi baslangic tarihinizi kaydedebilirsiniz.', 'bilgi');
  } else if (!tarihDegeri) {
    baslangicDurumuYaz('Rotasyon eklemek icin once kendi baslangic tarihinizi kaydedin.', 'hata');
  } else {
    baslangicDurumuYaz(`Kayitli tarih: ${tarihDegeri}`, 'ok');
  }
}

function aktifDonemId() {
  if (donemSec?.value) return donemSec.value;
  return ROTASYON_VARSAYILAN_DONEM;
}

function donemSecenekleriniHazirla() {
  if (!donemSec) return;
  const simdi = new Date();
  const yil = simdi.getFullYear();
  const varsayilanYil = periodBaslangicYili(ROTASYON_VARSAYILAN_DONEM);
  const aktif = ROTASYON_VARSAYILAN_DONEM;
  const secenekler = [...new Set([varsayilanYil - 1, varsayilanYil, varsayilanYil + 1, yil - 1, yil, yil + 1])]
    .sort((a, b) => a - b)
    .map((bas) => `${bas}-${bas + 1}`);
  donemSec.innerHTML = '';
  secenekler.forEach((periodId) => {
    const option = document.createElement('option');
    option.value = periodId;
    option.textContent = periodId;
    option.selected = periodId === aktif;
    donemSec.appendChild(option);
  });
}

const AY_ADLARI = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
const AY_KISA = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function ayAdiTam(iso) {
  return `${AY_ADLARI[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

function gunAyKisa(iso) {
  return `${Number(iso.slice(8, 10))} ${AY_KISA[Number(iso.slice(5, 7)) - 1]}`;
}

// Donem 12 ay (Eylul-Agustos). Iki yana 3'er soluk "sarkma" ayi eklenir:
// onceki donemden gelen + sonraki doneme tasan rotasyonlar donem degistirmeden gorulsun.
const SARKMA_AY = 3;

function donemAraliklari(periodId) {
  const yil = Number(periodId.split('-')[0]);
  const araliklar = [];
  let cursor = ayEkle(`${yil}-09-15`, -SARKMA_AY);
  const toplam = SARKMA_AY + 12 + SARKMA_AY;
  for (let i = 0; i < toplam; i += 1) {
    const bitis = gunEkle(ayEkle(cursor, 1), -1);
    const onceki = i < SARKMA_AY;
    const sonraki = i >= SARKMA_AY + 12;
    araliklar.push({
      baslangic: cursor,
      bitis,
      ayAdi: ayAdiTam(cursor),
      aralikMetni: `${gunAyKisa(cursor)} - ${gunAyKisa(bitis)}`,
      sarkma: onceki || sonraki,
      onceki,
      ayracMi: i === SARKMA_AY || i === SARKMA_AY + 12,
    });
    cursor = ayEkle(cursor, 1);
  }
  return araliklar;
}

function yetkiUyarisiGoster(metin) {
  if (!yetkiUyari) return;
  yetkiUyari.textContent = metin;
  yetkiUyari.hidden = !metin;
}

function kilitBendeMi() {
  return !!aktifKilit && !!auth.currentUser && aktifKilit.uid === auth.currentUser.uid;
}

function hedefKullanici() {
  if (!aktifKullanici) return null;
  if (!hedefKullaniciUid || hedefKullaniciUid === aktifKullanici.uid) return aktifKullanici;
  const bulunan = aktifKullanici.uyeler?.find((u) => u.uid === hedefKullaniciUid);
  return bulunan || aktifKullanici;
}

function hedefAd(hedef) {
  return hedef.adSoyad || hedef.email || 'Kisi';
}

function rotasyonAdi(key) {
  return aktifRotasyonlar().find((r) => r.key === key)?.ad || key;
}

function silebilirMi(kayit) {
  if (!aktifKullanici) return false;
  if (aktifKullanici.rol === 'admin' || aktifKullanici.rol === 'temsilci') return true;
  return kayit.uid === aktifKullanici.uid;
}

// Kayit aktif donemin KENDI taslaginda mi? Komsu donemden TASAN (gorunumKayitlari ile
// gelen, baslangici baska donemde olan) kayitlar yerelTaslak'ta DEGILDIR; kayitSil onlari
// bulamaz -> silme calismaz. Bu yuzden onlara silme dugmesi (x) gosterilmez; silmek icin
// ust menuden ilgili donem secilmeli (kanit: gorunumKayitlari komsu birlestirme).
function kayitYerelMi(kayit) {
  return (yerelTaslak?.kayitlar || []).some((k) => k.id === kayit?.id);
}

// Isim normalizasyonu: TR kucuk harf + tek bosluk. Vurgu eslesmesi icin.
function adAnahtari(deger) {
  return String(deger || '').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

// Kayit kullanicinin kendisine mi ait? Once uid karsilastirir; uid tutmazsa kanonik
// ad ile eslesir. Excel'den toplu yuklenen kayitlar `seed-<sicil>` uid'i tasir ve gercek
// Firebase uid'i ile eslesmez; bu yuzden kisi kendini "claim" etmeden de tablo/listede
// vurgulanmiyordu. Ad eslesmesi bunu cozer (seed kaydi ve uye dokumani ayni kanonik adi
// kullanir). Not: bu yalnizca GORSEL vurgu icindir; silme yetkisi (silebilirMi) uid esasli kalir.
function benimKaydimMi(kayit) {
  if (!aktifKullanici || !kayit) return false;
  if (kayit.uid && kayit.uid === aktifKullanici.uid) return true;
  const benim = adAnahtari(aktifKullanici.adSoyad);
  return !!benim && adAnahtari(kayit.adSoyad ?? kayit.ad) === benim;
}

function kisiCakismasiVarMi(uid, baslangic, bitis, haricId) {
  return (yerelTaslak?.kayitlar || []).some((k) =>
    k.uid === uid &&
    k.id !== haricId &&
    araliklarKesisiyor(baslangic, bitis, k.baslangic, k.bitis)
  );
}

// Kullanici duzenleme yapamayacak durumdayken hangi dugmeye basmasi gerektigini
// yanip sondurerek gosterir; uygunsa true doner.
function duzenlenebilirMi() {
  if (!aktifKullanici) {
    mesajYaz('Bu sayfayi kullanmak icin once giris yapin.', 'hata');
    return false;
  }
  if (!kilitBendeMi()) {
    mesajYaz('Once "Islem Baslat" dugmesine basin.', 'hata');
    butonuYakSondur(btnIslemBaslat);
    return false;
  }
  if (!yerelTaslak) {
    mesajYaz('Plan henuz hazir degil. Once "Islem Baslat" dugmesine basin.', 'hata');
    butonuYakSondur(btnIslemBaslat);
    return false;
  }
  return true;
}

function butonuYakSondur(btn) {
  if (!btn) return;
  btn.classList.remove('rotasyon-yanip-sonen');
  void btn.offsetWidth;
  btn.classList.add('rotasyon-yanip-sonen');
  setTimeout(() => btn.classList.remove('rotasyon-yanip-sonen'), 2400);
}

function sayaciDurdur() {
  if (sayacTimer) {
    clearInterval(sayacTimer);
    sayacTimer = null;
  }
}

function sayacGuncelle() {
  if (!aktifKilit || !kilitBendeMi() || !aktifKilit.bitisMs) {
    sayacEl.hidden = true;
    sayaciDurdur();
    return;
  }
  const kalan = aktifKilit.bitisMs - Date.now();
  if (kalan <= 0) {
    sayacEl.hidden = true;
    sayaciDurdur();
    aktifKilit = null;
    mesajYaz('Duzenleme sureniz doldu. Devam etmek icin tekrar "Islem Baslat" dugmesine basin.', 'hata');
    ekraniCiz();
    return;
  }
  const dk = Math.floor(kalan / 60000);
  const sn = Math.floor((kalan % 60000) / 1000);
  sayacEl.hidden = false;
  sayacEl.textContent = `Kalan sureniz ${dk}:${String(sn).padStart(2, '0')}`;
}

function sayacKontrol() {
  if (aktifKilit && kilitBendeMi() && aktifKilit.bitisMs) {
    if (!sayacTimer) sayacTimer = setInterval(sayacGuncelle, 1000);
    sayacGuncelle();
  } else {
    sayaciDurdur();
    sayacEl.hidden = true;
  }
}

function aksiyonDurumunuGuncelle() {
  const girisVar = !!aktifKullanici;
  const adminMi = aktifKullanici?.rol === 'admin';
  const temsilciMi = aktifKullanici?.rol === 'temsilci';
  // Islem Baslat: duzenleme bizde degilken acik (basinca kilit alir + guncel plani ceker).
  if (btnIslemBaslat) btnIslemBaslat.disabled = !girisVar || kilitBendeMi();
  // Buluta Kaydet: aktif veya onbellekteki (baska donem) kaydedilmemis degisiklik varken acik.
  if (btnBulutaGonder) btnBulutaGonder.disabled = !girisVar || !kilitBendeMi() || !kirliTaslakVarMi();
  // Islemi Bitir: kilit bizdeyse her zaman acik (varsa kaydeder + kilidi birakir).
  if (btnIslemBitir) btnIslemBitir.disabled = !girisVar || !kilitBendeMi();
  if (btnTemsilciAta) btnTemsilciAta.disabled = !adminMi || !hedefKisiSec?.value;
  if (btnDonemOnayla) btnDonemOnayla.disabled = !adminMi || !aktifPeriod;
  if (btnDavetYenile) btnDavetYenile.disabled = !adminMi;
  if (rolSec) rolSec.disabled = !adminMi;
  if (hedefKisiSec) hedefKisiSec.disabled = !(adminMi || temsilciMi);
}

// Ekran genisligine gore tablo (genis) veya kart (dar) gorunumunu secer.
function rotasyonGorunumunuCiz() {
  const mobil = mobilSorgu.matches;
  tabloEl?.classList.toggle('rotasyon-tablo-mobil', mobil);
  if (mobil) rotasyonKartlariniCiz();
  else rotasyonTablosunuCiz();
}

// Her rotasyona gorsel ayrim icin sabit bir vurgu rengi.
const ROTASYON_RENK = ['#0e7490', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#ca8a04', '#dc2626', '#0d9488', '#9333ea'];

function bugunIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tarihUzun(iso) {
  return `${gunAyKisa(iso)} ${iso.slice(0, 4)}`;
}

// Bir rotasyon araliginin bugune gore durumu (gecmis / aktif / yaklasan).
function mobilDurum(baslangic, bitis) {
  const bugun = bugunIso();
  if (bitis < bugun) return { etiket: 'Tamamlandi', sinif: 'gecmis' };
  if (baslangic > bugun) return { etiket: 'Yaklasan', sinif: 'yaklasan' };
  return { etiket: 'Su an', sinif: 'aktif' };
}

// Dar ekran (telefon) gorunumu. Iki alt gorunum: "Benim Planim" (kisisel zaman cizelgesi)
// ve "Tum Rotasyonlar" (rotasyona gore acilir kartlar). Ayni veri + kisiEkle/kayitSil.
function rotasyonKartlariniCiz() {
  if (!tabloEl) return;
  tabloEl.innerHTML = '';
  const kayitlar = gorunumKayitlari();
  const benimKayitlar = kayitlar.filter((k) => benimKaydimMi(k)).slice()
    .sort((a, b) => a.baslangic.localeCompare(b.baslangic));
  const aktifGorunum = mobilGorunum || (benimKayitlar.length ? 'benim' : 'tum');

  // Gorunum secici (segment)
  const segment = document.createElement('div');
  segment.className = 'rotasyon-mseg';
  [
    { id: 'benim', etiket: 'Benim Planim', sayi: benimKayitlar.length },
    { id: 'tum', etiket: 'Tum Rotasyonlar', sayi: 0 },
  ].forEach((g) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `rotasyon-mseg-btn${aktifGorunum === g.id ? ' aktif' : ''}`;
    btn.setAttribute('aria-pressed', String(aktifGorunum === g.id));
    btn.textContent = g.etiket;
    if (g.sayi) {
      const s = document.createElement('span');
      s.className = 'rotasyon-mseg-sayi';
      s.textContent = String(g.sayi);
      btn.appendChild(s);
    }
    btn.addEventListener('click', () => { mobilGorunum = g.id; rotasyonKartlariniCiz(); });
    segment.appendChild(btn);
  });
  tabloEl.appendChild(segment);

  if (!yerelTaslak) {
    const not = document.createElement('p');
    not.className = 'rotasyon-tablo-not';
    not.textContent = 'Guncel plani duzenlemek icin "Islem Baslat" dugmesine basin (plan otomatik getirilir).';
    tabloEl.appendChild(not);
  }

  // "Tum Rotasyonlar"da yalniz tablo kalsin: kisisel/yonetim bolumlerini (benim rotasyonlarim,
  // rotasyonda olanlar, admin) gizle. "Benim Planim"da goster (CSS .rotasyon-mobil-tum).
  calismaEl?.classList.toggle('rotasyon-mobil-tum', aktifGorunum === 'tum');

  if (aktifGorunum === 'benim') benimPlanimCiz();
  else tumRotasyonlariCiz(kayitlar);
}

// "Benim Planim" (mobil): TUM rotasyonlar tek listede, kisisel durum rozetiyle (tum donemler
// + el ile tamamlananlar). Masaustu "Benim rotasyonlarim" ile ayni mantik.
function benimPlanimCiz() {
  if (!aktifKullanici) {
    const bos = document.createElement('div');
    bos.className = 'rotasyon-mbos';
    const baslik = document.createElement('div');
    baslik.className = 'rotasyon-mbos-baslik';
    baslik.textContent = 'Once giris yapin';
    const alt = document.createElement('p');
    alt.className = 'rotasyon-mbos-alt';
    alt.textContent = 'Kendi rotasyon planinizi gormek icin giris yapmaniz gerekir.';
    bos.append(baslik, alt);
    tabloEl.appendChild(bos);
    return;
  }
  const satirlar = aktifRotasyonlar().map((rot) => ({ rot, durum: rotasyonKisiselDurum(rot.key) }));
  satirlar.sort((a, b) =>
    (DURUM_SIRA[a.durum.sinif] ?? 9) - (DURUM_SIRA[b.durum.sinif] ?? 9)
    || a.rot.ad.localeCompare(b.rot.ad, 'tr'));

  const zaman = document.createElement('div');
  zaman.className = 'rotasyon-zaman';
  satirlar.forEach(({ rot, durum }) => {
    const kart = document.createElement('div');
    kart.className = `rotasyon-zk rotasyon-zk-${durum.sinif}`;
    const ic = document.createElement('div');
    ic.className = 'rotasyon-zk-ic';
    const ust = document.createElement('div');
    ust.className = 'rotasyon-zk-ust';
    const ad = document.createElement('span');
    ad.className = 'rotasyon-zk-ad';
    ad.textContent = rot.ad;
    const pil = document.createElement('span');
    pil.className = `rotasyon-zk-pil rotasyon-zk-pil-${durum.sinif}`;
    pil.textContent = durum.etiket;
    ust.append(ad, pil);
    ic.appendChild(ust);
    if (durum.not) {
      const aralik = document.createElement('div');
      aralik.className = 'rotasyon-zk-aralik';
      aralik.textContent = durum.not;
      ic.appendChild(aralik);
    }
    kart.appendChild(ic);
    zaman.appendChild(kart);
  });
  tabloEl.appendChild(zaman);
  tabloEl.appendChild(tamamlananDropdownCiz());
}

// "Tum Rotasyonlar": her rotasyon acilir-kapanir bir kart; aylar dikey listelenir.
function tumRotasyonlariCiz(kayitlar) {
  const araliklar = donemAraliklari(aktifDonemId());
  const duzenlenebilir = kilitBendeMi() && !!yerelTaslak;
  if (aktifKullanici && !duzenlenebilir) {
    const ipucu = document.createElement('div');
    ipucu.className = 'rotasyon-mhint';
    ipucu.textContent = 'Eklemek veya cikarmak icin once ustteki "Islem Baslat" dugmesine basin.';
    tabloEl.appendChild(ipucu);
  }
  const liste = document.createElement('div');
  liste.className = 'rotasyon-mobil';

  aktifRotasyonlar().forEach((rotasyon, i) => {
    const rotKayitlari = kayitlar.filter((k) => k.rotasyonKey === rotasyon.key);
    const kisiSayisi = new Set(rotKayitlari.map((k) => k.uid)).size;
    const bendeVar = rotKayitlari.some((k) => benimKaydimMi(k));

    const kart = document.createElement('details');
    kart.className = `rotasyon-mk${bendeVar ? ' rotasyon-mk-benim' : ''}`;
    kart.style.setProperty('--rot-accent', ROTASYON_RENK[i % ROTASYON_RENK.length]);
    kart.open = duzenlenebilir || bendeVar || (!!kisiSayisi && aktifRotasyonlar().length <= 6);

    const ozet = document.createElement('summary');
    ozet.className = 'rotasyon-mk-bas';
    const sol = document.createElement('span');
    sol.className = 'rotasyon-mk-sol';
    const ad = document.createElement('span');
    ad.className = 'rotasyon-mk-ad';
    ad.textContent = rotasyon.ad;
    const meta = document.createElement('span');
    meta.className = 'rotasyon-mk-meta';
    meta.textContent = `${rotasyon.sureAy} ay · ${rotasyon.kapasite} kisi/ay`;
    sol.appendChild(ad);
    sol.appendChild(meta);
    // Kullanicinin bu rotasyondaki kisisel durumu
    if (aktifKullanici) {
      const kd = rotasyonKisiselDurum(rotasyon.key);
      const kdRozet = document.createElement('span');
      kdRozet.className = `rotasyon-mk-durum rotasyon-mk-durum-${kd.sinif}`;
      kdRozet.textContent = kd.etiket;
      sol.appendChild(kdRozet);
    }
    const rozet = document.createElement('span');
    rozet.className = `rotasyon-mk-rozet${bendeVar ? ' rotasyon-mk-rozet-benim' : ''}`;
    rozet.textContent = bendeVar ? 'Siz dahil' : (kisiSayisi ? `${kisiSayisi} kisi` : 'Bos');
    ozet.appendChild(sol);
    ozet.appendChild(rozet);
    kart.appendChild(ozet);

    const govde = document.createElement('div');
    govde.className = 'rotasyon-mk-govde';
    let gosterilenAy = 0;
    araliklar.forEach((aralik) => {
      const aktifler = rotKayitlari.filter((kayit) =>
        araliklarKesisiyor(aralik.baslangic, aralik.bitis, kayit.baslangic, kayit.bitis));
      const doluMu = !aralik.sarkma && aktifler.length >= rotasyon.kapasite;
      const eklenebilir = duzenlenebilir && !aralik.sarkma && !doluMu;
      // Sarkma (onceki/sonraki donem) aylari yalniz dolu ise gosterilir; donem aylari
      // bos olsa bile gosterilir ki kullanici nereye ekleyebilecegini net gorsun.
      if (aralik.sarkma && !aktifler.length) return;
      gosterilenAy += 1;

      const ay = document.createElement('div');
      ay.className = `rotasyon-mk-ay${aralik.sarkma ? ' rotasyon-mk-ay-sarkma' : ''}`;
      const ayBas = document.createElement('div');
      ayBas.className = 'rotasyon-mk-ay-bas';
      const ayAd = document.createElement('span');
      ayAd.className = 'rotasyon-mk-ay-ad';
      ayAd.textContent = aralik.ayAdi;
      const ayAralik = document.createElement('span');
      ayAralik.className = 'rotasyon-mk-ay-aralik';
      ayAralik.textContent = aralik.sarkma
        ? `${aralik.aralikMetni} · ${aralik.onceki ? 'onceki' : 'sonraki'} donem`
        : aralik.aralikMetni;
      ayBas.appendChild(ayAd);
      ayBas.appendChild(ayAralik);
      if (doluMu) {
        const d = document.createElement('span');
        d.className = 'rotasyon-mk-dolu';
        d.textContent = 'DOLU';
        ayBas.appendChild(d);
      }
      ay.appendChild(ayBas);

      const kisiler = document.createElement('div');
      kisiler.className = 'rotasyon-mk-kisiler';
      aktifler
        .slice()
        .sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || '', 'tr'))
        .forEach((kayit) => {
          const cip = document.createElement('span');
          cip.className = `rotasyon-mk-cip${benimKaydimMi(kayit) ? ' rotasyon-mk-cip-benim' : ''}`;
          const cad = document.createElement('span');
          cad.className = 'rotasyon-mk-cip-ad';
          cad.textContent = kayit.adSoyad;
          cip.appendChild(cad);
          // Komsu donemden tasan kayit (yerelTaslak'ta degil) salt-okunur: silmek icin o donem secilmeli.
          if (!aralik.sarkma && silebilirMi(kayit) && kayitYerelMi(kayit)) {
            const sil = document.createElement('button');
            sil.type = 'button';
            sil.className = 'rotasyon-mk-sil';
            sil.textContent = '×';
            sil.setAttribute('aria-label', `${kayit.adSoyad} sil`);
            sil.addEventListener('click', (e) => { e.stopPropagation(); kayitSil(kayit); });
            cip.appendChild(sil);
          } else if (!aralik.sarkma && silebilirMi(kayit) && !kayitYerelMi(kayit)) {
            cip.title = `${kayit.adSoyad} — baska doneme ait; silmek icin ust menuden o donemi secin.`;
          }
          kisiler.appendChild(cip);
        });
      if (eklenebilir) {
        const ekle = document.createElement('button');
        ekle.type = 'button';
        ekle.className = 'rotasyon-mk-ekle';
        ekle.textContent = aktifler.length ? '+ Kisi ekle' : '+ Bu aya ekle';
        ekle.setAttribute('aria-label', `${rotasyon.ad} ${aralik.ayAdi} ekle`);
        ekle.addEventListener('click', () => kisiEkle(rotasyon, aralik.baslangic));
        kisiler.appendChild(ekle);
      } else if (!aktifler.length) {
        // Bos ay, duzenleme kapali: yine de gorunur olsun (nereye eklenebilecegi belli olsun).
        const bosAy = document.createElement('span');
        bosAy.className = 'rotasyon-mk-bosay';
        bosAy.textContent = doluMu ? 'Dolu' : 'Henuz kimse yok';
        kisiler.appendChild(bosAy);
      }
      ay.appendChild(kisiler);
      govde.appendChild(ay);
    });

    if (!gosterilenAy) {
      const bos = document.createElement('p');
      bos.className = 'rotasyon-mk-bos';
      bos.textContent = 'Bu donemde gosterilecek ay yok.';
      govde.appendChild(bos);
    }
    kart.appendChild(govde);
    liste.appendChild(kart);
  });

  tabloEl.appendChild(liste);
}

function rotasyonTablosunuCiz() {
  if (!tabloEl) return;
  calismaEl?.classList.remove('rotasyon-mobil-tum'); // masaustu: tum bolumler gorunur
  // Yeniden cizimden once mevcut yatay kaydirmayi sakla; ekleme/silme sonrasi sola sicrama olmasin.
  const korunanScroll = tabloEl.scrollLeft;
  tabloEl.innerHTML = '';
  const veriVar = !!yerelTaslak;
  if (!veriVar) {
    const not = document.createElement('p');
    not.className = 'rotasyon-tablo-not';
    not.textContent = 'Asagidaki tablo ornek gorunumdur. Duzenlemek icin "Islem Baslat" dugmesine basin (plan otomatik getirilir).';
    tabloEl.appendChild(not);
  }
  const kayitlar = gorunumKayitlari();
  const araliklar = donemAraliklari(aktifDonemId());
  const table = document.createElement('table');
  table.className = 'rotasyon-grid';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.appendChild(document.createElement('th')).textContent = 'Rotasyon';
  araliklar.forEach((aralik) => {
    const th = document.createElement('th');
    if (aralik.sarkma) th.classList.add('rotasyon-sarkma');
    if (aralik.ayracMi) th.classList.add('rotasyon-ayrac');
    const ay = document.createElement('span');
    ay.className = 'rotasyon-gh-ay';
    ay.textContent = aralik.ayAdi;
    const ara = document.createElement('span');
    ara.className = 'rotasyon-gh-aralik';
    if (aralik.sarkma) {
      ara.textContent = `${aralik.aralikMetni} (${aralik.onceki ? 'onceki' : 'sonraki'} donem)`;
    } else {
      ara.textContent = aralik.aralikMetni;
    }
    th.appendChild(ay);
    th.appendChild(ara);
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  aktifRotasyonlar().forEach((rotasyon) => {
    const tr = document.createElement('tr');
    const baslik = document.createElement('th');
    const rad = document.createElement('span');
    rad.className = 'rotasyon-rh-ad';
    rad.textContent = rotasyon.ad;
    const rmeta = document.createElement('span');
    rmeta.className = 'rotasyon-rh-meta';
    rmeta.textContent = `${rotasyon.sureAy} ay · ${rotasyon.kapasite} kisi`;
    baslik.appendChild(rad);
    baslik.appendChild(rmeta);
    // Kullanicinin bu rotasyondaki kisisel durumu (Tamamladiniz / Planladiniz / Devam / Almadiniz)
    if (aktifKullanici) {
      const kd = rotasyonKisiselDurum(rotasyon.key);
      const krozet = document.createElement('span');
      krozet.className = `rotasyon-rh-durum rotasyon-rh-durum-${kd.sinif}`;
      krozet.textContent = kd.etiket;
      baslik.appendChild(krozet);
    }
    tr.appendChild(baslik);
    araliklar.forEach((aralik) => {
      const td = document.createElement('td');
      td.dataset.key = rotasyon.key;
      td.dataset.bas = aralik.baslangic;
      td.dataset.bit = aralik.bitis;
      if (aralik.sarkma) td.classList.add('rotasyon-sarkma');
      if (aralik.ayracMi) td.classList.add('rotasyon-ayrac');
      const hucre = document.createElement('div');
      hucre.className = 'rotasyon-hucre';
      const aktifler = kayitlar.filter((kayit) =>
        kayit.rotasyonKey === rotasyon.key &&
        araliklarKesisiyor(aralik.baslangic, aralik.bitis, kayit.baslangic, kayit.bitis)
      );
      const doluMu = !aralik.sarkma && aktifler.length >= rotasyon.kapasite;
      if (doluMu) {
        td.classList.add('rotasyon-dolu');
        const rozet = document.createElement('span');
        rozet.className = 'rotasyon-dolu-rozet';
        rozet.textContent = 'DOLU';
        hucre.appendChild(rozet);
      }
      aktifler.forEach((kayit) => {
        const cip = document.createElement('span');
        cip.className = 'rotasyon-atama';
        if (benimKaydimMi(kayit)) {
          cip.classList.add('rotasyon-atama-benim');
        }
        cip.title = kayit.adSoyad;
        const ad = document.createElement('span');
        ad.className = 'rotasyon-atama-ad';
        ad.textContent = kayit.adSoyad;
        cip.appendChild(ad);
        // Sarkma (sonraki donem) sutunlari salt-okunur: silme/ekleme yok, sadece gorunur.
        // Komsu donemden tasan kayit (yerelTaslak'ta degil) de salt-okunur: silmek icin o donem secilmeli.
        if (!aralik.sarkma && silebilirMi(kayit) && kayitYerelMi(kayit)) {
          const sil = document.createElement('button');
          sil.type = 'button';
          sil.className = 'rotasyon-sil';
          sil.textContent = '×';
          sil.title = `${kayit.adSoyad} - rotasyondan cikar`;
          sil.setAttribute('aria-label', `${kayit.adSoyad} sil`);
          sil.addEventListener('click', (e) => {
            e.stopPropagation();
            kayitSil(kayit);
          });
          cip.appendChild(sil);
        } else if (!aralik.sarkma && silebilirMi(kayit) && !kayitYerelMi(kayit)) {
          cip.title = `${kayit.adSoyad} — bu rotasyon baska doneme ait; silmek/duzenlemek icin ust menuden o donemi secin.`;
        }
        hucre.appendChild(cip);
      });
      // Dolu hucrede normalde ekleme yok; ancak admin kapasiteyi istisna olarak
      // (onay diyaloguyla) asabilsin diye admin'e "+" yine gosterilir.
      const adminMi = aktifKullanici?.rol === 'admin';
      if (!aralik.sarkma && (!doluMu || adminMi)) {
        const ekle = document.createElement('button');
        ekle.type = 'button';
        ekle.className = aktifler.length ? 'rotasyon-ekle' : 'rotasyon-ekle rotasyon-ekle-bos';
        if (doluMu) ekle.classList.add('rotasyon-ekle-asim');
        ekle.textContent = '+';
        ekle.title = doluMu
          ? `${rotasyon.ad} - ${aralik.ayAdi} dolu; admin istisnasiyla ekle`
          : `${rotasyon.ad} - ${aralik.ayAdi} icin ekle`;
        ekle.setAttribute('aria-label', `${rotasyon.ad} ${aralik.ayAdi} ekle`);
        ekle.addEventListener('click', () => kisiEkle(rotasyon, aralik.baslangic, doluMu));
        hucre.appendChild(ekle);
      }
      td.appendChild(hucre);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  tabloEl.appendChild(table);
  // Ilk cizimde donem basi (Eylul) sola gelsin; onceki donem aylari sola kaydirinca gorulur.
  // Sonraki cizimlerde (ekleme/silme) kullanicinin kaydirma konumu korunur.
  if (!tabloScrollBaslatildi) {
    const basliklar = [...table.querySelectorAll('thead th')];
    let oncekiGenislik = 0;
    for (let i = 1; i <= SARKMA_AY && i < basliklar.length; i += 1) {
      oncekiGenislik += basliklar[i].offsetWidth;
    }
    tabloEl.scrollLeft = oncekiGenislik;
    tabloScrollBaslatildi = true;
  } else {
    tabloEl.scrollLeft = korunanScroll;
  }
  yatayKaydirGuncelle();
  sabitBaslikSurum += 1; // tablo yeniden cizildi -> sabit baslik klonu tazelensin
  sabitBaslikPlanla();
}

// Fixed yatay kaydirma cubugunu tabloya hizalar ve gorunurlugunu ayarlar.
function _yatayKaydirUygula() {
  if (!yatayKaydirEl || !yatayKaydirIcEl || !tabloEl) return;
  const tasma = tabloEl.scrollWidth - tabloEl.clientWidth;
  if (mobilSorgu.matches || tasma <= 2) { yatayKaydirEl.hidden = true; return; }
  const r = tabloEl.getBoundingClientRect();
  const vy = window.innerHeight;
  // Tablo viewport icinde mi (alti viewport altinda olsa bile ustu gorunur)?
  const gorunur = r.top < (vy - 24) && r.bottom > 90;
  if (!gorunur) { yatayKaydirEl.hidden = true; return; }
  const sol = Math.max(0, r.left);
  const sag = Math.min(window.innerWidth, r.right);
  yatayKaydirEl.hidden = false;
  yatayKaydirEl.style.left = `${sol}px`;
  yatayKaydirEl.style.width = `${Math.max(0, sag - sol)}px`;
  yatayKaydirIcEl.style.width = `${tabloEl.scrollWidth}px`;
  yatayKaydirEl.scrollLeft = tabloEl.scrollLeft;
}
let _yatayKaydirBekliyor = false;
function yatayKaydirGuncelle() {
  if (_yatayKaydirBekliyor) return;
  _yatayKaydirBekliyor = true;
  requestAnimationFrame(() => { _yatayKaydirBekliyor = false; _yatayKaydirUygula(); });
}

// Tablo <-> cubuk yatay kaydirma senkronu (geri besleme dongusu engellenir).
let _yatayKaydirSenk = false;
tabloEl?.addEventListener('scroll', () => {
  if (_yatayKaydirSenk || !yatayKaydirEl || yatayKaydirEl.hidden) return;
  _yatayKaydirSenk = true;
  yatayKaydirEl.scrollLeft = tabloEl.scrollLeft;
  _yatayKaydirSenk = false;
}, { passive: true });
yatayKaydirEl?.addEventListener('scroll', () => {
  if (_yatayKaydirSenk || !tabloEl) return;
  _yatayKaydirSenk = true;
  tabloEl.scrollLeft = yatayKaydirEl.scrollLeft;
  _yatayKaydirSenk = false;
}, { passive: true });
window.addEventListener('resize', () => yatayKaydirGuncelle());
window.addEventListener('scroll', () => yatayKaydirGuncelle(), { passive: true });

// ── Sabit (fixed) ay/tarih basligi: sayfa asagi kayinca tablo basligi viewport ustunde kalir ──
function sabitBaslikKlonOlustur(realTable) {
  const realThead = realTable.querySelector('thead');
  if (!realThead) return;
  const klon = document.createElement('table');
  klon.className = 'rotasyon-grid rotasyon-sabit-grid';
  klon.style.width = `${realTable.getBoundingClientRect().width}px`;
  klon.appendChild(realThead.cloneNode(true));
  // Kolon genisliklerini gercek tablodan birebir kopyala (hizalama icin).
  const realCells = realThead.querySelectorAll('tr:first-child > th');
  const klonCells = klon.querySelectorAll('tr:first-child > th');
  realCells.forEach((c, i) => {
    const w = c.getBoundingClientRect().width;
    if (klonCells[i]) {
      klonCells[i].style.width = `${w}px`;
      klonCells[i].style.minWidth = `${w}px`;
      klonCells[i].style.maxWidth = `${w}px`;
    }
  });
  sabitBaslikEl.innerHTML = '';
  sabitBaslikEl.appendChild(klon);
}

function sabitBaslikGuncelle() {
  if (!tabloEl || mobilSorgu.matches) { sabitBaslikEl.hidden = true; return; }
  const realTable = tabloEl.querySelector('table.rotasyon-grid');
  if (!realTable) { sabitBaslikEl.hidden = true; return; }
  const r = tabloEl.getBoundingClientRect();
  // Tablonun ustu viewport ustune kaymis ve tablo hala gorunur durumda mi?
  const goster = r.top < 0 && r.bottom > 140;
  if (!goster) { sabitBaslikEl.hidden = true; return; }
  if (sabitBaslikEl.dataset.surum !== String(sabitBaslikSurum) || !sabitBaslikEl.firstElementChild) {
    sabitBaslikKlonOlustur(realTable);
    sabitBaslikEl.dataset.surum = String(sabitBaslikSurum);
  }
  sabitBaslikEl.hidden = false;
  const sol = Math.max(0, r.left);
  sabitBaslikEl.style.left = `${sol}px`;
  sabitBaslikEl.style.width = `${Math.min(window.innerWidth, r.right) - sol}px`;
  sabitBaslikEl.scrollLeft = tabloEl.scrollLeft; // yatay senkron (sticky ilk kolon korunur)
}
let _sabitBaslikBekliyor = false;
function sabitBaslikPlanla() {
  if (_sabitBaslikBekliyor) return;
  _sabitBaslikBekliyor = true;
  requestAnimationFrame(() => { _sabitBaslikBekliyor = false; sabitBaslikGuncelle(); });
}
// Tablo yatay kayinca sabit baslik da ayni oranda kaysin.
tabloEl?.addEventListener('scroll', () => {
  if (!sabitBaslikEl.hidden) sabitBaslikEl.scrollLeft = tabloEl.scrollLeft;
}, { passive: true });
window.addEventListener('scroll', sabitBaslikPlanla, { passive: true });
window.addEventListener('resize', () => { sabitBaslikSurum += 1; sabitBaslikPlanla(); });

// Durum siralama onceligi: devam > planli/yaklasan > alinmasi gereken > tamamlandi > secmeli-gerek yok
const DURUM_SIRA = { aktif: 0, yaklasan: 1, ileride: 2, almadi: 3, gecmis: 4, 'secmeli-ok': 5 };

function kendiListeyiCiz() {
  if (!kendiListeEl) return;
  kendiListeEl.innerHTML = '<h2>Benim rotasyonlarim</h2>';
  if (!aktifKullanici) {
    const bos = document.createElement('p');
    bos.className = 'rotasyon-kendi-bos';
    bos.textContent = 'Once giris yapin.';
    kendiListeEl.appendChild(bos);
    return;
  }
  // TUM rotasyonlar (alinan + alinmayan) tek listede; tum donem gecmisi + tamamlananlar.
  const satirlar = aktifRotasyonlar().map((rot) => ({ rot, durum: rotasyonKisiselDurum(rot.key) }));
  satirlar.sort((a, b) =>
    (DURUM_SIRA[a.durum.sinif] ?? 9) - (DURUM_SIRA[b.durum.sinif] ?? 9)
    || a.rot.ad.localeCompare(b.rot.ad, 'tr'));

  const ul = document.createElement('ul');
  ul.className = 'rotasyon-kendi-ul';
  satirlar.forEach(({ rot, durum }) => {
    const li = document.createElement('li');
    li.className = `rotasyon-kendi-oge rotasyon-kendi-${durum.sinif}`;
    const ust = document.createElement('div');
    ust.className = 'rotasyon-kendi-ust';
    const ad = document.createElement('span');
    ad.className = 'rotasyon-kendi-ad';
    ad.textContent = rot.ad;
    const rozet = document.createElement('span');
    rozet.className = `rotasyon-kendi-rozet rotasyon-kendi-rozet-${durum.sinif}`;
    rozet.textContent = durum.etiket;
    ust.append(ad, rozet);
    li.appendChild(ust);
    if (durum.not) {
      const not = document.createElement('div');
      not.className = 'rotasyon-kendi-not';
      not.textContent = durum.not;
      li.appendChild(not);
    }
    ul.appendChild(li);
  });
  kendiListeEl.appendChild(ul);
  kendiListeEl.appendChild(tamamlananDropdownCiz());
}

// "Gecmiste tamamladigim rotasyonlar" acilir-kapanir listesi: her rotasyon icin onay kutusu.
// Gercek (tarihli) kaydi olanlar otomatik isaretli ve kilitli; digerleri el ile isaretlenir.
function tamamlananDropdownCiz() {
  const detay = document.createElement('details');
  detay.className = 'rotasyon-tmm-detay';
  detay.open = tamamlananDropdownAcik; // yeniden cizimde acik kalsin (onay kutusu secince kapanmasin)
  detay.addEventListener('toggle', () => { tamamlananDropdownAcik = detay.open; });
  const ozet = document.createElement('summary');
  ozet.className = 'rotasyon-tmm-bas';
  ozet.textContent = 'Gecmiste tamamladigim rotasyonlar';
  detay.appendChild(ozet);

  const aciklama = document.createElement('p');
  aciklama.className = 'rotasyon-tmm-aciklama';
  aciklama.textContent = 'Sistemden once tamamladiginiz rotasyonlari isaretleyin. Planlanmis kayitlar otomatik isaretlidir.';
  detay.appendChild(aciklama);

  const liste = document.createElement('div');
  liste.className = 'rotasyon-tmm-liste';
  const tumKayit = benimTumKayitlar();
  aktifRotasyonlar().forEach((rot) => {
    const kayitVar = tumKayit.some((k) => k.rotasyonKey === rot.key);
    const label = document.createElement('label');
    label.className = 'rotasyon-tmm-oge';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = kayitVar || benimTamamlanan.includes(rot.key);
    cb.disabled = kayitVar; // gercek kaydi olan rotasyon el ile degistirilemez
    cb.addEventListener('change', () => tamamlananDegistir(rot.key, cb.checked));
    const sp = document.createElement('span');
    sp.textContent = rot.ad + (kayitVar ? ' (planli/tamamlandi)' : '');
    label.append(cb, sp);
    liste.appendChild(label);
  });
  detay.appendChild(liste);
  return detay;
}

async function tamamlananDegistir(rotasyonKey, isaretli) {
  const set = new Set(benimTamamlanan);
  if (isaretli) set.add(rotasyonKey); else set.delete(rotasyonKey);
  benimTamamlanan = [...set];
  ekraniCiz(); // anlik gorsel guncelleme
  try {
    await api.tamamlananGuncelle({ tamamlanan: benimTamamlanan });
    mesajYaz('Tamamlanan rotasyonlar guncellendi.', 'ok');
  } catch (err) {
    mesajYaz(hataMetni(err, 'Tamamlanan rotasyonlar kaydedilemedi.'), 'hata');
  }
}

// Gun farki hesabi icin yerel tarih (saat dilimi etkisiz, 00:00).
function tarih2(iso) {
  return new Date(`${iso}T00:00:00`).getTime();
}

// Bir kaydin durumu (rozet + alt not). "Yaklasan" yalniz 45 gun icinde baslayacaklar;
// daha uzaktakiler "Planli" (notr). bgn = bugun (ms).
const YAKLASAN_GUN = 45;
function kayitDurumu(baslangic, bitis, bgn) {
  const bas = tarih2(baslangic);
  const bit = tarih2(bitis);
  if (bit < bgn) return { sinif: 'gecmis', etiket: 'Tamamlandi', not: '' };
  if (bas <= bgn) {
    const kalan = Math.max(0, Math.round((bit - bgn) / 86400000));
    return { sinif: 'aktif', etiket: 'Su an', not: kalan <= 0 ? 'Bugun bitiyor' : `Su an devam ediyor · ${kalan} gun kaldi` };
  }
  const kalan = Math.round((bas - bgn) / 86400000);
  if (kalan <= YAKLASAN_GUN) {
    return { sinif: 'yaklasan', etiket: 'Yaklasan', not: kalan <= 1 ? 'Yarin basliyor' : `${kalan} gun sonra basliyor` };
  }
  return { sinif: 'ileride', etiket: 'Planli', not: `${kalan} gun sonra basliyor` };
}

// "2027-02-15" -> "15.02.2027"
function tarihNokta(iso) {
  if (!iso || iso.length < 10) return iso || '';
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;
}

// Toast/mesaj yalniz erisim acikken gosterilsin (sifre girilmeden "plan yuklendi" cikmasin).
function erisimVarMi() {
  return !!auth.currentUser && !!aktifKullanici && sayfaSifresiDogrulandi;
}

// Kullanicinin TUM kayitlari: buluttaki tum donem gecmisi + aktif/komsu gorunum + diger donem
// taslaklari (kaydedilmemis dahil). Boylece eklenen rotasyon aninda "Benim rotasyonlarim"da gorunur.
function benimTumKayitlar() {
  const map = new Map();
  benimGecmisKayitlar.forEach((k) => { if (k?.id) map.set(k.id, k); });
  gorunumKayitlari().forEach((k) => { if (k?.id && benimKaydimMi(k)) map.set(k.id, k); });
  taslakOnbellek.forEach((v) => (v.taslak?.kayitlar || []).forEach((k) => {
    if (k?.id && benimKaydimMi(k)) map.set(k.id, k);
  }));
  return [...map.values()];
}

// Secmelilerden (FTR/Genel cerrahi/Noroloji) en az biri alinmis/tamamlanmis mi?
function secmeliKarsilandiMi() {
  const tum = benimTumKayitlar();
  return SECMELI_ROTASYONLAR.some((key) =>
    tum.some((k) => k.rotasyonKey === key) || benimTamamlanan.includes(key));
}

// Kullanicinin bir rotasyon icin kisisel durumu (tum donemler + el ile tamamlananlar).
// Donen: { sinif, etiket (tablo rozeti), not (alt aciklama) }.
function rotasyonKisiselDurum(rotasyonKey) {
  const bgn = tarih2(bugunIso());
  const kayitlar = benimTumKayitlar()
    .filter((k) => k.rotasyonKey === rotasyonKey && k.baslangic && k.bitis)
    .sort((a, b) => (a.baslangic || '').localeCompare(b.baslangic || ''));
  if (kayitlar.length) {
    const aktif = kayitlar.find((k) => tarih2(k.baslangic) <= bgn && tarih2(k.bitis) >= bgn);
    if (aktif) {
      const kalan = Math.max(0, Math.round((tarih2(aktif.bitis) - bgn) / 86400000));
      return { sinif: 'aktif', etiket: 'Devam ediyor', not: kalan <= 0 ? 'Bugun bitiyor' : `${kalan} gun kaldi` };
    }
    const gelecek = kayitlar.find((k) => tarih2(k.baslangic) > bgn);
    if (gelecek) {
      const d = kayitDurumu(gelecek.baslangic, gelecek.bitis, bgn);
      return { sinif: d.sinif, etiket: `Planladiniz (${tarihNokta(gelecek.baslangic)})`, not: d.not };
    }
    const son = kayitlar[kayitlar.length - 1];
    return { sinif: 'gecmis', etiket: 'Tamamladiniz', not: `${tarihNokta(son.baslangic)} - ${tarihNokta(son.bitis)}` };
  }
  if (benimTamamlanan.includes(rotasyonKey)) {
    return { sinif: 'gecmis', etiket: 'Tamamladiniz', not: 'Gecmiste tamamlandi (isaretlendi)' };
  }
  if (SECMELI_ROTASYONLAR.includes(rotasyonKey) && secmeliKarsilandiMi()) {
    return { sinif: 'secmeli-ok', etiket: 'Secmeli (gerek yok)', not: 'Secmeli staj kosulu baska bir rotasyonla karsilandi' };
  }
  if (SECMELI_ROTASYONLAR.includes(rotasyonKey)) {
    return { sinif: 'almadi', etiket: 'Almadiniz', not: 'Secmeli: FTR / Genel cerrahi / Noroloji uclusunden biri yeterli' };
  }
  return { sinif: 'almadi', etiket: 'Almadiniz', not: 'Bu rotasyon henuz planlanmadi' };
}

// Kullanicinin tum donem gecmisini + tamamlanan isaretlerini buluttan yukler.
async function benimGecmisiYukle() {
  if (!aktifKullanici) { benimGecmisKayitlar = []; benimTamamlanan = []; return; }
  try {
    const sonuc = await api.kisiGecmisi({});
    // Eksik tarihli/anahtar bozuk kayitlari ele (siralama/tarih hesaplari guvende kalsin).
    benimGecmisKayitlar = (Array.isArray(sonuc.data?.kayitlar) ? sonuc.data.kayitlar : [])
      .filter((k) => k && k.rotasyonKey && k.baslangic && k.bitis);
    benimTamamlanan = Array.isArray(sonuc.data?.tamamlanan) ? sonuc.data.tamamlanan : [];
  } catch (_) {
    // Sessiz: gecmis alinamadiysa yalniz aktif donem gorunur.
  }
}

function adminPaneliniCiz() {
  if (!adminPanelEl) return;
  const adminMi = aktifKullanici?.rol === 'admin' || aktifKullanici?.rol === 'temsilci';
  adminPanelEl.hidden = !adminMi;
  if (listePanel) listePanel.hidden = !adminMi;
  if (!adminMi) return;
  // Kendini (admin/temsilci) her zaman secilebilir yap; uye dokumanin olmasa da listeye eklenir.
  const digerleri = (aktifKullanici?.uyeler || []).filter((u) => u && u.uid !== aktifKullanici.uid);
  const uyeler = [aktifKullanici, ...digerleri];
  if (hedefKisiSec) {
    const onceki = hedefKisiSec.value || hedefKullaniciUid || aktifKullanici.uid;
    hedefKisiSec.innerHTML = '';
    uyeler.forEach((uye) => {
      const option = document.createElement('option');
      option.value = uye.uid;
      const etiket = uye.adSoyad || uye.email || 'Kullanici';
      option.textContent = uye.uid === aktifKullanici.uid ? `${etiket} (ben)` : `${etiket} (${uye.rol || 'asistan'})`;
      option.selected = uye.uid === onceki;
      hedefKisiSec.appendChild(option);
    });
    hedefKullaniciUid = hedefKisiSec.value || aktifKullanici.uid;
  }
  const secili = hedefKullanici();
  if (rolSec && secili) rolSec.value = secili.rol === 'temsilci' ? 'temsilci' : 'asistan';
  if (btnDonemOnayla) btnDonemOnayla.textContent = aktifPeriod?.onayli ? 'Donem Onayini Kaldir' : 'Donemi Onayla';
  adminPanelEl.querySelectorAll('[data-rotasyon-admin-only]').forEach((el) => {
    el.hidden = aktifKullanici?.rol !== 'admin';
  });
}

function erisimKapisiniGuncelle() {
  if (!calismaEl) return false;
  // Auth durumu daha gelmediyse: "Giris Yap" yerine yuklenme ekrani goster (yanlis flash onlenir).
  if (!authKontrolEdildi) {
    calismaEl.classList.add('rotasyon-erisim-yok');
    if (gateSifreAlani) gateSifreAlani.hidden = true;
    if (gateGirisEl) gateGirisEl.hidden = true;
    if (gateIkonEl) gateIkonEl.classList.add('rotasyon-gate-spinner');
    if (gateBaslikEl) gateBaslikEl.textContent = 'Yukleniyor...';
    if (gateMesajEl) gateMesajEl.textContent = 'Oturum bilgileri kontrol ediliyor, lutfen bekleyin.';
    return true;
  }
  if (gateIkonEl) gateIkonEl.classList.remove('rotasyon-gate-spinner');
  const girisVar = !!auth.currentUser;
  const uyeVar = !!aktifKullanici;
  const erisimYok = !girisVar || !uyeVar || !sayfaSifresiDogrulandi;
  calismaEl.classList.toggle('rotasyon-erisim-yok', erisimYok);
  if (gateSifreAlani) gateSifreAlani.hidden = true;
  if (erisimYok) {
    if (!girisVar) {
      if (gateBaslikEl) gateBaslikEl.textContent = 'Rotasyon sayfasi uyelere ozel';
      if (gateMesajEl) gateMesajEl.textContent = 'Bu sayfa yalnizca Ankara Tip SAHU rotasyon grubu uyelerine aciktir. Devam etmek icin giris yapin.';
      if (gateGirisEl) gateGirisEl.hidden = false;
    } else if (!uyeVar) {
      if (gateBaslikEl) gateBaslikEl.textContent = 'Bu hesabin rotasyon yetkisi yok';
      if (gateMesajEl) gateMesajEl.textContent = 'Rotasyon grubuna kayitli degilsiniz. Davet ile kayit olmaniz veya yoneticinizle iletisime gecmeniz gerekir.';
      if (gateGirisEl) gateGirisEl.hidden = true;
    } else {
      if (gateBaslikEl) gateBaslikEl.textContent = 'Sayfa sifresi gerekli';
      if (gateMesajEl) gateMesajEl.textContent = 'Rotasyon sayfasina erismek icin sayfa sifresini girin.';
      if (gateGirisEl) gateGirisEl.hidden = true;
      if (gateSifreAlani) gateSifreAlani.hidden = false;
    }
  }
  return erisimYok;
}

function ekraniCiz() {
  if (erisimKapisiniGuncelle()) return; // erisim yoksa calisma alani cizilmez
  // Her bolum ayri korunur: birinde hata olursa digerleri (ozellikle admin paneli) yine cizilir.
  const bolumler = [asistanBaslangicFormunuCiz, canliOzetCiz, rotasyonGorunumunuCiz, kendiListeyiCiz, adminPaneliniCiz, mesajlariCiz, aksiyonDurumunuGuncelle, kotaGoster, sayacKontrol];
  bolumler.forEach((ciz) => {
    try { ciz(); } catch (e) { console.error('[rotasyon] cizim hatasi:', e?.message || e); }
  });
}

// Bir rotasyon kaydinin hedef ay icin kacinci ayinda oldugunu hesaplar (1 = ilk ay).
function ayIndeksiHesapla(baslangic, hedefAyBas) {
  const [yb, mb] = baslangic.split('-').map(Number);
  const [yh, mh] = hedefAyBas.split('-').map(Number);
  return (yh - yb) * 12 + (mh - mb) + 1;
}

// "Bu ay" ve "Gelecek ay" rotasyonda olanlari canli (her cizimde guncel) gosterir.
// Her kisinin rotasyonunun kacinci ayinda oldugu (or. "2. ay") rozetle belirtilir;
// o rotasyona ilk defa baslayanlar ("Yeni basliyor") ayri renkte vurgulanir.
function canliOzetCiz() {
  if (!canliEl) return;
  const kayitlar = gorunumKayitlari();
  if (!kayitlar.length) { canliEl.hidden = true; canliEl.innerHTML = ''; return; }
  canliEl.hidden = false;
  canliEl.innerHTML = '';

  const detay = document.createElement('details');
  detay.className = 'rotasyon-canli-detay';
  detay.open = true; // tum asistanlar acilista listeyi gorsun (varsayilan acik)
  const ozet = document.createElement('summary');
  ozet.className = 'rotasyon-canli-baslik';

  const buAy = aktifRotasyonAyi();
  const buAyBit = gunEkle(ayEkle(buAy, 1), -1);
  const gelBas = ayEkle(buAy, 1);
  const gelBit = gunEkle(ayEkle(gelBas, 1), -1);
  const buAySay = kayitlar.filter((k) => araliklarKesisiyor(buAy, buAyBit, k.baslangic, k.bitis)).length;
  const gelSay = kayitlar.filter((k) => araliklarKesisiyor(gelBas, gelBit, k.baslangic, k.bitis)).length;
  const topSay = new Set([
    ...kayitlar.filter((k) => araliklarKesisiyor(buAy, buAyBit, k.baslangic, k.bitis)).map((k) => k.id),
    ...kayitlar.filter((k) => araliklarKesisiyor(gelBas, gelBit, k.baslangic, k.bitis)).map((k) => k.id)
  ]).size;

  ozet.innerHTML = `Rotasyonda olanlar <span class="rotasyon-canli-baslik-rozet">${buAySay + gelSay} kisi</span>`;
  detay.appendChild(ozet);
  canliEl.appendChild(detay);

  const grid = document.createElement('div');
  grid.className = 'rotasyon-canli-grid';
  [{ etiket: 'Bu ay', bas: buAy }, { etiket: 'Gelecek ay', bas: ayEkle(buAy, 1) }].forEach(({ etiket, bas }) => {
    const bit = gunEkle(ayEkle(bas, 1), -1);
    const aktifler = kayitlar
      .filter((k) => araliklarKesisiyor(bas, bit, k.baslangic, k.bitis))
      .map((k) => ({ k, ayIdx: Math.max(1, ayIndeksiHesapla(k.baslangic, bas)) }))
      .sort((a, b) =>
        rotasyonAdi(a.k.rotasyonKey).localeCompare(rotasyonAdi(b.k.rotasyonKey), 'tr')
        || (a.k.adSoyad || '').localeCompare(b.k.adSoyad || '', 'tr'));

    const kol = document.createElement('div');
    kol.className = 'rotasyon-canli-kol';
    const kbas = document.createElement('div');
    kbas.className = 'rotasyon-canli-kbas';
    const e1 = document.createElement('span');
    e1.className = 'rotasyon-canli-ay';
    e1.textContent = etiket;
    const e2 = document.createElement('span');
    e2.className = 'rotasyon-canli-aytarih';
    e2.textContent = ayAdiTam(bas);
    const e3 = document.createElement('span');
    e3.className = 'rotasyon-canli-say';
    e3.textContent = `${aktifler.length} kisi`;
    kbas.append(e1, e2, e3);
    kol.appendChild(kbas);

    if (!aktifler.length) {
      const bos = document.createElement('p');
      bos.className = 'rotasyon-canli-bos';
      bos.textContent = 'Rotasyonda kimse yok.';
      kol.appendChild(bos);
    } else {
      aktifler.forEach(({ k, ayIdx }) => {
        const ilk = ayIdx === 1;
        const satir = document.createElement('div');
        satir.className = `rotasyon-canli-kisi${ilk ? ' rotasyon-canli-yeni' : ''}${benimKaydimMi(k) ? ' rotasyon-canli-benim' : ''}`;
        const sol = document.createElement('div');
        sol.className = 'rotasyon-canli-kisi-sol';
        const ad = document.createElement('span');
        ad.className = 'rotasyon-canli-isim';
        ad.textContent = k.adSoyad;
        const rot = document.createElement('span');
        rot.className = 'rotasyon-canli-rot';
        rot.textContent = rotasyonAdi(k.rotasyonKey);
        sol.append(ad, rot);
        const rozet = document.createElement('span');
        rozet.className = `rotasyon-canli-rozet${ilk ? ' rotasyon-canli-rozet-yeni' : ''}`;
        rozet.textContent = ilk ? 'Yeni basliyor' : `${ayIdx}. ay`;
        satir.append(sol, rozet);
        kol.appendChild(satir);
      });
    }
    grid.appendChild(kol);
  });
  detay.appendChild(grid);
}

// Asistanin haftalik islem baslatma hakkini gorunur sekilde gosterir.
// Admin/temsilcide limit yoktur; onlarda gizli kalir.
function kotaGoster() {
  if (!kotaEl) return;
  if (!aktifKullanici || aktifKullanici.rol !== 'asistan' || !aktifKota) {
    kotaEl.hidden = true;
    kotaEl.textContent = '';
    return;
  }
  const kalan = Math.max(0, Number(aktifKota.kalanHak || 0));
  const bitisMs = Number(aktifKota.pencereBitisMs || 0);
  const sifirlanma = bitisMs > 0
    ? new Date(bitisMs).toLocaleString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '';
  if (kalan <= 0) {
    kotaEl.dataset.tip = 'dolu';
    kotaEl.innerHTML = `Bu haftaki islem baslatma hakkiniz <b>doldu</b>.${sifirlanma ? ` Sonraki sifirlanma: <b>${sifirlanma}</b>` : ''}`;
  } else {
    kotaEl.dataset.tip = 'normal';
    kotaEl.innerHTML = `<b>${kalan}</b> islem baslatma hakkiniz kaldi.${sifirlanma ? ` Sonraki sifirlanma: <b>${sifirlanma}</b>` : ''}`;
  }
  kotaEl.hidden = false;
}

function kisiEkle(rotasyon, baslangic, kapasiteAsim = false) {
  if (!duzenlenebilirMi()) return;
  const hedef = hedefKullanici();
  if (!hedef) return;
  const asistanBaslangicTarihi = hedefBaslangicTarihi(hedef);
  if (!asistanBaslangicTarihi) {
    mesajYaz('Asistanliga baslangic tarihinizi kaydetmeden rotasyon ekleyemezsiniz.', 'hata');
    butonuYakSondur(btnRotasyonBaslangicKaydet);
    return;
  }
  if (baslangic < asistanBaslangicTarihi) {
    mesajYaz(`${hedefAd(hedef)} icin asistanliga baslangic tarihinden once rotasyon eklenemez.`, 'hata');
    return;
  }
  // Kapasite (kisi siniri) dolu hucreye admin ekliyor: engelleme yok, onayli uyari.
  if (kapasiteAsim && aktifKullanici?.rol === 'admin') {
    const onay = window.confirm(`${rotasyon.ad} rotasyonu ${ayAdiTam(baslangic)} ayinda dolu (kapasite ${rotasyon.kapasite} kisi). Admin istisnasi ile yine de eklensin mi?`);
    if (!onay) return;
  }
  const bitis = rotasyonBitisHesapla(baslangic, rotasyon.sureAy);
  const id = `${hedef.uid}-${rotasyon.key}-${baslangic}`;
  if (yerelTaslak.kayitlar.some((kayit) => kayit.id === id)) {
    mesajYaz(`${hedefAd(hedef)} bu rotasyona zaten ekli.`, 'hata');
    return;
  }
  // Ayni tarihlerde baska rotasyonu varsa hic ekleme.
  if (kisiCakismasiVarMi(hedef.uid, baslangic, bitis, id)) {
    mesajYaz(`${hedefAd(hedef)} bu tarihlerde zaten baska bir rotasyonda. Once onu silmelisiniz.`, 'hata');
    return;
  }
  // Bir rotasyon kisi basina yalnizca BIR KEZ alinabilir (tum donemler dahil).
  if (kisininRotasyonlari(hedef.uid).has(rotasyon.key)) {
    mesajYaz(`${hedefAd(hedef)} daha once ${rotasyon.ad} rotasyonunu almis. Bir rotasyon yalnizca bir kez alinabilir.`, 'hata');
    return;
  }
  // 6 ay (186 gun) ustu eklemeyi kisinin kendi asistanlik baslangic tarihine gore engelle.
  const mevcutGun = yerelTaslak.kayitlar
    .filter((k) => k.uid === hedef.uid)
    .reduce((acc, k) => acc + kisiselDonemdeKalanGunSayisi(k.baslangic, k.bitis, asistanBaslangicTarihi, baslangic), 0);
  const yeniToplam = mevcutGun + kisiselDonemdeKalanGunSayisi(baslangic, bitis, asistanBaslangicTarihi, baslangic);
  if (yeniToplam > DONEM_GUN_SINIRI) {
    mesajYaz(`Asistanliga baslangic tarihinden itibaren en fazla 6 ay (${DONEM_GUN_SINIRI} gun) rotasyon alinabilir. ${hedefAd(hedef)} icin bu ekleme ile ${yeniToplam} gun olur, eklenemez.`, 'hata');
    return;
  }
  yerelTaslak.kayitlar.push({
    id,
    uid: hedef.uid,
    adSoyad: hedefAd(hedef),
    rotasyonKey: rotasyon.key,
    baslangic,
    bitis,
    sureAy: rotasyon.sureAy,
  });
  kaydedilmemisDegisiklikVar = true;
  mesajYaz(`${hedefAd(hedef)}, ${rotasyon.ad} rotasyonuna eklendi.`, 'ok');
  ekraniCiz();
}

// Bir kisinin (uid) bu oturumda gorulebilen TUM rotasyon anahtarlari: aktif donem gorunumu
// (komsu donemler dahil) + diger donem taslak onbellegi. "Bir rotasyon bir kez" kurali icin.
function kisininRotasyonlari(uid) {
  const keyler = new Set();
  gorunumKayitlari().forEach((k) => { if (k.uid === uid) keyler.add(k.rotasyonKey); });
  taslakOnbellek.forEach((v) => (v.taslak?.kayitlar || []).forEach((k) => {
    if (k.uid === uid) keyler.add(k.rotasyonKey);
  }));
  return keyler;
}

function kayitSil(kayit) {
  if (!duzenlenebilirMi()) return;
  if (!silebilirMi(kayit)) {
    mesajYaz('Bu kaydi silme yetkiniz yok.', 'hata');
    return;
  }
  // Yanlislikla silmeyi onlemek icin: admin/temsilci BASKASININ kaydini silerken onay iste.
  const baskasininKaydi = kayit.uid && aktifKullanici && kayit.uid !== aktifKullanici.uid;
  if (baskasininKaydi) {
    const onay = window.confirm(
      `${kayit.adSoyad} adli kisinin ${rotasyonAdi(kayit.rotasyonKey)} rotasyonunu `
      + `(${tarihNokta(kayit.baslangic)} - ${tarihNokta(kayit.bitis)}) silmek istediginize emin misiniz?`
    );
    if (!onay) return;
  }
  const index = yerelTaslak.kayitlar.findIndex((k) => k.id === kayit.id);
  if (index < 0) return;
  yerelTaslak.kayitlar.splice(index, 1);
  kaydedilmemisDegisiklikVar = true;
  mesajYaz(`${kayit.adSoyad}, ${rotasyonAdi(kayit.rotasyonKey)} rotasyonundan cikarildi.`, 'ok');
  ekraniCiz();
}

function hataMetni(err, varsayilan) {
  const kod = String(err?.code || '').replace('functions/', '');
  if (kod === 'internal' || kod === 'not-found' || kod === 'unavailable') {
    return 'Rotasyon servisine ulasilamiyor. Servis henuz hazir olmayabilir, lutfen daha sonra tekrar deneyin.';
  }
  if (kod === 'unauthenticated') {
    return 'Bu islem icin once giris yapmalisiniz.';
  }
  if (kod === 'permission-denied') {
    return err?.message || 'Bu islem icin yetkiniz yok.';
  }
  return err?.message || varsayilan;
}

async function durumYukle() {
  try {
    const sonuc = await api.durumGetir({});
    aktifKullanici = sonuc.data?.uye || null;
    if (aktifKullanici) aktifKullanici.uyeler = sonuc.data?.uyeler || [];
    aktifKilit = sonuc.data?.kilit || null;
    aktifKota = sonuc.data?.kota || null;
    if (!aktifKullanici) {
      yetkiUyarisiGoster('Bu sayfayi kullanma yetkiniz yok. Lutfen yoneticinizle iletisime gecin.');
      mesajYaz('Bu sayfayi kullanma yetkiniz yok.', 'hata');
    } else {
      yetkiUyarisiGoster('');
      mesajYaz('Hos geldiniz. Duzenlemeye baslamak icin "Islem Baslat" dugmesine basin.', 'ok');
    }
  } catch (err) {
    aktifKullanici = null;
    aktifKilit = null;
    aktifKota = null;
    const metin = hataMetni(err, 'Rotasyon durumu alinamadi.');
    yetkiUyarisiGoster(metin);
    mesajYaz(metin, 'hata');
  }
  await benimGecmisiYukle(); // tum donem kisisel gecmis + tamamlananlar
  ekraniCiz();
}

async function rotasyonPeriodiniOku(periodId) {
  const sonuc = await api.planGetir({ periodId });
  return sonuc.data?.period || null;
}

async function komsuDonemleriBuluttanCek(periodId) {
  const [onceki, sonraki] = await Promise.allSettled([
    rotasyonPeriodiniOku(donemKaydir(periodId, -1)),
    rotasyonPeriodiniOku(donemKaydir(periodId, 1)),
  ]);
  return {
    onceki: onceki.status === 'fulfilled' ? onceki.value : null,
    sonraki: sonraki.status === 'fulfilled' ? sonraki.value : null,
  };
}

// Sayfa acilisinda (ve donem degisince) buluttaki plani kilit almadan, salt-okunur olarak yukler.
async function planOtoYukle({ beklemePenceresi = false } = {}) {
  if (!aktifKullanici || kaydedilmemisDegisiklikVar) return;
  if (beklemePenceresi) yuklemeAc('Buluttan guncel rotasyon plani aliniyor...');
  try {
    const periodId = aktifDonemId();
    const [period, komsular] = await Promise.all([
      rotasyonPeriodiniOku(periodId),
      komsuDonemleriBuluttanCek(periodId),
    ]);
    aktifPeriod = period;
    yerelTaslak = aktifPeriod ? kopya(aktifPeriod) : null;
    komsuPeriodlar = komsular;
    kaydedilmemisDegisiklikVar = false;
    mesajYaz('Guncel plan yuklendi. Duzenlemek icin "Islem Baslat" dugmesine basin.', 'ok');
  } catch (_) {
    // Sessiz: yetki yoksa veya ulasilamiyorsa iskelet gorunum kalir.
    komsuPeriodlar = {};
  } finally {
    if (beklemePenceresi) yuklemeKapat();
  }
  ekraniCiz();
}

// "Islem Baslat": duzenleme kilidini alir VE guncel plani otomatik ceker (manuel "Buluttan
// Cek" yerine, kontrol amacli). Islem boyunca tam ekran bekleme penceresi gosterilir.
btnIslemBaslat?.addEventListener('click', async () => {
  if (kilitBendeMi()) return;
  yuklemeAc('Duzenleme hazirlaniyor ve guncel plan getiriliyor...');
  mesajYaz('Hazirlaniyor...', 'bilgi');
  try {
    const baslat = await api.islemBaslat({});
    aktifKilit = { uid: auth.currentUser?.uid, bitisMs: baslat.data?.bitisMs };
    if (Number(baslat.data?.pencereBitisMs) > 0) {
      aktifKota = { kalanHak: baslat.data?.kalanHak, pencereBitisMs: baslat.data?.pencereBitisMs };
    }
    taslakOnbellek.clear(); // yeni oturum: onceki oturumun taslaklarini temizle
    const cek = await api.buluttanCek({ periodId: aktifDonemId() });
    aktifPeriod = cek.data?.period || null;
    yerelTaslak = aktifPeriod ? kopya(aktifPeriod) : null;
    komsuPeriodlar = await komsuDonemleriBuluttanCek(aktifDonemId());
    kaydedilmemisDegisiklikVar = false;
    aktifTaslagiOnbellegeYaz();
    mesajYaz('Plan hazir. Donemler arasi gecebilir, hepsini "Islemi Bitir" ile kaydedebilirsiniz.', 'ok');
  } catch (err) {
    mesajYaz(hataMetni(err, 'Su an baslatilamadi, biraz sonra tekrar deneyin.'), 'hata');
  } finally {
    ekraniCiz();
    yuklemeKapat();
  }
});

// "Buluta Kaydet": degisiklikleri buluta yazar, duzenleme kilidini KORUR (devam edilebilir).
btnBulutaGonder?.addEventListener('click', async () => {
  if (!kilitBendeMi()) {
    mesajYaz('Once "Islem Baslat" dugmesine basin.', 'hata');
    butonuYakSondur(btnIslemBaslat);
    return;
  }
  if (!aktifPeriod || !yerelTaslak) {
    mesajYaz('Plan henuz hazir degil. Once "Islem Baslat".', 'hata');
    butonuYakSondur(btnIslemBaslat);
    return;
  }
  aktifTaslagiOnbellegeYaz();
  if (!kirliTaslakVarMi()) {
    mesajYaz('Kaydedilecek degisiklik yok.', 'bilgi');
    return;
  }
  yuklemeAc('Degisiklikler buluta kaydediliyor...');
  mesajYaz('Kaydediliyor...', 'bilgi');
  try {
    const adet = await tumKirliTaslaklariKaydet();
    await benimGecmisiYukle(); // kisisel durum/gecmis guncel kalsin
    mesajYaz(`${adet} donem kaydedildi. Duzenlemeye devam edebilir veya "Islemi Bitir" diyebilirsiniz.`, 'ok');
  } catch (err) {
    mesajYaz(hataMetni(err, 'Kaydedilemedi, lutfen tekrar deneyin.'), 'hata');
  } finally {
    ekraniCiz();
    yuklemeKapat();
  }
});

// "Islemi Bitir": (varsa) kaydeder + duzenleme kilidini birakir. Baska kisi hemen baslayabilir.
btnIslemBitir?.addEventListener('click', async () => {
  if (!kilitBendeMi()) {
    mesajYaz('Once "Islem Baslat" dugmesine basin.', 'hata');
    butonuYakSondur(btnIslemBaslat);
    return;
  }
  aktifTaslagiOnbellegeYaz();
  const kirliVar = kirliTaslakVarMi();
  yuklemeAc(kirliVar ? 'Tum donemler kaydedilip islem bitiriliyor...' : 'Islem bitiriliyor...');
  mesajYaz(kirliVar ? 'Kaydediliyor...' : 'Bitiriliyor...', 'bilgi');
  try {
    if (kirliVar) { await tumKirliTaslaklariKaydet(); await benimGecmisiYukle(); }
    // Kilidi GUVENILIR sekilde birak: basarisizsa kilit sunucuda kalir ve baska kullanici
    // "... islem yapiyor" gorur. Bu yuzden sessizce yutmak yerine bir kez daha denenir;
    // yine olmazsa kullanici uyarilir (kilit suresi dolunca da serbest kalir).
    let kilitBirakildi = false;
    try {
      await api.islemBitir({});
      kilitBirakildi = true;
    } catch (_) {
      try { await api.islemBitir({}); kilitBirakildi = true; } catch (_) { /* asagida uyarilir */ }
    }
    if (kilitBirakildi) {
      aktifKilit = null;
      sayaciDurdur();
      sayacEl.hidden = true;
      taslakOnbellek.clear(); // oturum bitti, taslaklari temizle
      mesajYaz('Islem tamamlandi. Tum donem degisiklikleri kaydedildi ve duzenleme birakildi.', 'ok');
    } else {
      // Degisiklikler kaydedildi ama kilit birakilamadi; tekrar denemesi icin kilit korunur.
      mesajYaz('Degisiklikler kaydedildi ancak duzenleme kilidi birakilamadi. Lutfen "Islemi Bitir" dugmesine tekrar basin.', 'hata');
    }
  } catch (err) {
    mesajYaz(hataMetni(err, 'Islem bitirilemedi, lutfen tekrar deneyin.'), 'hata');
  } finally {
    ekraniCiz();
    yuklemeKapat();
  }
});

// ── Per-donem taslak onbellegi (donemler arasi gecis kaydedilmemis degisiklikleri korur) ──
// Aktif donemin taslagini onbellege yaz (mevcut kaydedilmemis durumu ile birlikte).
function aktifTaslagiOnbellegeYaz() {
  if (!aktifPeriod || !yerelTaslak) return;
  taslakOnbellek.set(aktifPeriod.periodId, {
    period: aktifPeriod,
    taslak: yerelTaslak,
    dirty: kaydedilmemisDegisiklikVar,
  });
}

// Hedef donem onbellekte varsa aktif degiskenlere yukle (true doner); yoksa false.
function onbellektenTaslakYukle(periodId) {
  const kayit = taslakOnbellek.get(periodId);
  if (!kayit) return false;
  aktifPeriod = kayit.period;
  yerelTaslak = kayit.taslak;
  kaydedilmemisDegisiklikVar = kayit.dirty;
  return true;
}

// Aktif veya onbellekteki herhangi bir donemde kaydedilmemis degisiklik var mi?
function kirliTaslakVarMi() {
  if (kaydedilmemisDegisiklikVar) return true;
  for (const v of taslakOnbellek.values()) if (v.dirty) return true;
  return false;
}

// Bu oturumda duzenlenen TUM donemlerin kaydedilmemis degisikliklerini buluta yazar.
// Donem basina optimistik surum kontrolu (beklenenSurum) ile gonderir; basarili olani
// onbellekte temiz isaretler. Hata olursa o donem kirli kalir, kilit korunur.
async function tumKirliTaslaklariKaydet() {
  aktifTaslagiOnbellegeYaz(); // aktif donemi de onbellege al
  const kaydedilecekler = [...taslakOnbellek.entries()].filter(([, v]) => v.dirty);
  for (const [periodId, kayit] of kaydedilecekler) {
    const eskiSayi = kayit.period?.kayitlar?.length || 0;
    const yeniSayi = kayit.taslak?.kayitlar?.length || 0;
    const sonuc = await api.bulutaGonder({
      periodId,
      beklenenSurum: kayit.period.surum,
      kayitlar: kayit.taslak.kayitlar,
      ozet: `Kayit sayisi ${eskiSayi} -> ${yeniSayi}`,
    });
    const yeniPeriod = sonuc.data?.period || kayit.period;
    taslakOnbellek.set(periodId, { period: yeniPeriod, taslak: kopya(yeniPeriod), dirty: false });
    if (periodId === aktifDonemId()) {
      aktifPeriod = yeniPeriod;
      yerelTaslak = kopya(yeniPeriod);
      kaydedilmemisDegisiklikVar = false;
    }
  }
  return kaydedilecekler.length;
}

// Kilit bizdeyken bir donemin duzenlenebilir planini buluttan ceker (onbellekte yoksa).
async function islemDonemiHazirla(periodId) {
  yuklemeAc('Donem plani getiriliyor...');
  mesajYaz('Donem plani getiriliyor...', 'bilgi');
  try {
    const cek = await api.buluttanCek({ periodId });
    aktifPeriod = cek.data?.period || null;
    yerelTaslak = aktifPeriod ? kopya(aktifPeriod) : null;
    komsuPeriodlar = await komsuDonemleriBuluttanCek(periodId);
    kaydedilmemisDegisiklikVar = false;
    aktifTaslagiOnbellegeYaz(); // bu donemi de oturuma kaydet (temiz)
    mesajYaz('Donem plani hazir. Eklemek icin "+", silmek icin "×". Bitince "Islemi Bitir".', 'ok');
  } catch (err) {
    mesajYaz(hataMetni(err, 'Donem plani getirilemedi.'), 'hata');
  } finally {
    ekraniCiz();
    yuklemeKapat();
  }
}

donemSec?.addEventListener('change', async () => {
  tabloScrollBaslatildi = false; // donem degisince tablo yeniden donem basina kaydirilsin
  // Kilit bizdeyse: oturum ici cok-donem duzenleme. Mevcut taslagi sakla, hedefi onbellekten
  // ya da buluttan getir; kaydedilmemis degisiklikler korunur.
  if (kilitBendeMi()) {
    aktifTaslagiOnbellegeYaz();
    const yeniDonem = aktifDonemId();
    if (onbellektenTaslakYukle(yeniDonem)) {
      yuklemeAc('Donem yukleniyor...');
      try { komsuPeriodlar = await komsuDonemleriBuluttanCek(yeniDonem); }
      catch (_) { komsuPeriodlar = {}; }
      yuklemeKapat();
      ekraniCiz();
    } else {
      aktifPeriod = null;
      yerelTaslak = null;
      komsuPeriodlar = {};
      kaydedilmemisDegisiklikVar = false;
      ekraniCiz();
      await islemDonemiHazirla(yeniDonem);
    }
    return;
  }
  // Kilit yoksa salt-okunur: temiz yukle.
  aktifPeriod = null;
  yerelTaslak = null;
  komsuPeriodlar = {};
  kaydedilmemisDegisiklikVar = false;
  ekraniCiz();
  planOtoYukle({ beklemePenceresi: true });
});

hedefKisiSec?.addEventListener('change', () => {
  hedefKullaniciUid = hedefKisiSec.value;
  ekraniCiz();
});

asistanBaslangicInput?.addEventListener('change', () => {
  baslangicDurumuYaz('Tarihi kaydetmek icin "Tarihi Kaydet" dugmesine basin.', 'bilgi');
});

btnRotasyonBaslangicKaydet?.addEventListener('click', async () => {
  if (!aktifKullanici) {
    mesajYaz('Baslangic tarihi kaydetmek icin once giris yapin.', 'hata');
    return;
  }
  const asistanBaslangicTarihi = String(asistanBaslangicInput?.value || '').trim();
  if (!tarihGecerliMi(asistanBaslangicTarihi)) {
    baslangicDurumuYaz('Gecerli bir baslangic tarihi secin.', 'hata');
    mesajYaz('Gecerli bir baslangic tarihi secin.', 'hata');
    return;
  }
  baslangicDurumuYaz('Kaydediliyor...', 'bilgi');
  try {
    const sonuc = await api.asistanBaslangicKaydet({ asistanBaslangicTarihi });
    aktifKullanici.asistanBaslangicTarihi = sonuc.data?.asistanBaslangicTarihi || asistanBaslangicTarihi;
    const kendiUye = aktifKullanici.uyeler?.find((u) => u.uid === aktifKullanici.uid);
    if (kendiUye) kendiUye.asistanBaslangicTarihi = aktifKullanici.asistanBaslangicTarihi;
    baslangicDurumuYaz('Baslangic tarihi kaydedildi.', 'ok');
    mesajYaz('Asistanliga baslangic tarihiniz kaydedildi.', 'ok');
  } catch (err) {
    const metin = hataMetni(err, 'Baslangic tarihi kaydedilemedi.');
    baslangicDurumuYaz(metin, 'hata');
    mesajYaz(metin, 'hata');
  }
  ekraniCiz();
});

btnTemsilciAta?.addEventListener('click', async () => {
  if (!hedefKisiSec?.value || !rolSec?.value) return;
  mesajYaz('Rol kaydediliyor...', 'bilgi');
  try {
    await api.temsilciAta({ uid: hedefKisiSec.value, rol: rolSec.value });
    mesajYaz('Rol guncellendi.', 'ok');
    await durumYukle();
  } catch (err) {
    mesajYaz(err.message || 'Rol kaydedilemedi.', 'hata');
  }
});

btnDonemOnayla?.addEventListener('click', async () => {
  if (!aktifPeriod) {
    mesajYaz('Once "Islem Baslat" ile donem planini alin.', 'hata');
    return;
  }
  mesajYaz('Donem onay durumu guncelleniyor...', 'bilgi');
  try {
    const sonuc = await api.donemOnayla({
      periodId: aktifPeriod.periodId,
      onayli: !aktifPeriod.onayli,
    });
    aktifPeriod = sonuc.data?.period || aktifPeriod;
    yerelTaslak = kopya(aktifPeriod);
    kaydedilmemisDegisiklikVar = false;
    mesajYaz(aktifPeriod.onayli ? 'Donem onaylandi.' : 'Donem onayi kaldirildi.', 'ok');
  } catch (err) {
    mesajYaz(err.message || 'Donem onayi guncellenemedi.', 'hata');
  }
  ekraniCiz();
});

btnDavetYenile?.addEventListener('click', async () => {
  mesajYaz('Davet linki yenileniyor...', 'bilgi');
  try {
    const sonuc = await api.davetLinkiYenile({});
    const yol = sonuc.data?.davetYolu || '';
    const tamLink = yol ? new URL(yol, location.origin + location.pathname.replace(/[^/]*$/, '')).href : '';
    if (davetLinkiInput) {
      davetLinkiInput.value = tamLink;
      davetLinkiInput.focus();
      davetLinkiInput.select();
    }
    mesajYaz('Davet linki yenilendi. Eski link artik kullanilmaz.', 'ok');
  } catch (err) {
    mesajYaz(err.message || 'Davet linki yenilenemedi.', 'hata');
  }
});

// ── Admin listeleri ──────────────────────────────────────────
function tumKayitlar() {
  return gorunumKayitlari().sort((a, b) =>
    (a.adSoyad || '').localeCompare(b.adSoyad || '', 'tr') || a.baslangic.localeCompare(b.baslangic));
}

function aktifRotasyonAyi() {
  const t = new Date();
  let y = t.getFullYear();
  let m = t.getMonth() + 1;
  if (t.getDate() < 15) { m -= 1; if (m < 1) { m = 12; y -= 1; } }
  return `${y}-${String(m).padStart(2, '0')}-15`;
}

function listeBosMu() {
  if (!yerelTaslak) {
    listeIcerik.innerHTML = '<p class="rotasyon-liste-bos">Once "Islem Baslat" ile plani getirin.</p>';
    return true;
  }
  return false;
}

function adVurgu(kayit) {
  return benimKaydimMi(kayit) ? ' rotasyon-liste-benim' : '';
}

function listeTumCiz() {
  if (listeBosMu()) return;
  const kayitlar = tumKayitlar();
  if (!kayitlar.length) { listeIcerik.innerHTML = '<p class="rotasyon-liste-bos">Bu donemde kayit yok.</p>'; return; }
  const gruplar = new Map();
  kayitlar.forEach((k) => {
    if (!gruplar.has(k.uid)) gruplar.set(k.uid, { ad: k.adSoyad, uid: k.uid, kayitlar: [] });
    gruplar.get(k.uid).kayitlar.push(k);
  });
  listeIcerik.innerHTML = '';
  [...gruplar.values()].sort((a, b) => (a.ad || '').localeCompare(b.ad || '', 'tr')).forEach((g) => {
    const blok = document.createElement('div');
    blok.className = `rotasyon-liste-kisi${benimKaydimMi({ uid: g.uid, adSoyad: g.ad }) ? ' rotasyon-liste-benim' : ''}`;
    const isim = document.createElement('div');
    isim.className = 'rotasyon-liste-isim';
    isim.textContent = g.ad;
    blok.appendChild(isim);
    g.kayitlar.forEach((k) => {
      const satir = document.createElement('div');
      satir.className = 'rotasyon-liste-satir';
      satir.textContent = `${rotasyonAdi(k.rotasyonKey)}: ${k.baslangic} → ${k.bitis}`;
      blok.appendChild(satir);
    });
    listeIcerik.appendChild(blok);
  });
}

function listeYaklasanCiz() {
  if (listeBosMu()) return;
  const buAy = aktifRotasyonAyi();
  const gelecekAy = ayEkle(buAy, 1);
  listeIcerik.innerHTML = '';
  [{ baslik: 'Bu ay', bas: buAy }, { baslik: 'Gelecek ay', bas: gelecekAy }].forEach(({ baslik, bas }) => {
    const bit = gunEkle(ayEkle(bas, 1), -1);
    const aktifler = gorunumKayitlari()
      .filter((k) => araliklarKesisiyor(bas, bit, k.baslangic, k.bitis))
      .sort((a, b) => (a.adSoyad || '').localeCompare(b.adSoyad || '', 'tr'));
    const blok = document.createElement('div');
    blok.className = 'rotasyon-liste-kisi';
    const isim = document.createElement('div');
    isim.className = 'rotasyon-liste-isim';
    isim.textContent = `${baslik} — ${ayAdiTam(bas)} (${aktifler.length} kisi)`;
    blok.appendChild(isim);
    if (!aktifler.length) {
      const s = document.createElement('div');
      s.className = 'rotasyon-liste-satir';
      s.textContent = 'Rotasyonda kimse yok.';
      blok.appendChild(s);
    }
    aktifler.forEach((k) => {
      const satir = document.createElement('div');
      satir.className = `rotasyon-liste-satir${adVurgu(k)}`;
      satir.textContent = `${k.adSoyad} — ${rotasyonAdi(k.rotasyonKey)} (${k.baslangic} → ${k.bitis})`;
      blok.appendChild(satir);
    });
    listeIcerik.appendChild(blok);
  });
}

function listeyiExceleAktar() {
  if (!yerelTaslak) { mesajYaz('Once "Islem Baslat" ile plani getirin.', 'hata'); return; }
  const kayitlar = tumKayitlar();
  if (!kayitlar.length) { mesajYaz('Aktarilacak kayit yok.', 'hata'); return; }
  const satirlar = [['Ad Soyad', 'Rotasyon', 'Baslangic', 'Bitis', 'Sure (ay)']];
  kayitlar.forEach((k) => satirlar.push([k.adSoyad, rotasyonAdi(k.rotasyonKey), k.baslangic, k.bitis, String(k.sureAy || '')]));
  // Excel TR icin ; ayirici + UTF-8 BOM
  const csv = '﻿' + satirlar.map((r) => r.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rotasyon-plani-${aktifDonemId()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  mesajYaz('Liste Excel (CSV) olarak indirildi.', 'ok');
}

btnListeTum?.addEventListener('click', listeTumCiz);
btnListeYaklasan?.addEventListener('click', listeYaklasanCiz);
btnListeExcel?.addEventListener('click', listeyiExceleAktar);

function sayfaSifresiniKontrolEt() {
  const girilen = gateSifreInput?.value || '';
  if (girilen === SAYFA_SIFRESI) {
    sayfaSifresiDogrulandi = true;
    if (gateSifreHata) gateSifreHata.hidden = true;
    ekraniCiz();
  } else {
    if (gateSifreHata) gateSifreHata.hidden = false;
  }
}
gateSifreBtn?.addEventListener('click', sayfaSifresiniKontrolEt);
gateSifreInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') sayfaSifresiniKontrolEt(); });

btnUyeAdDuzenle?.addEventListener('click', async () => {
  const hedefUid = hedefKisiSec?.value;
  const yeniAd = uyeYeniAdInput?.value?.trim();
  if (!hedefUid || !yeniAd || yeniAd.length < 3) {
    mesajYaz('Gecerli bir ad soyad girin (en az 3 karakter).', 'hata');
    return;
  }
  mesajYaz('Uye adi guncelleniyor...', 'bilgi');
  try {
    await api.uyeDuzenle({ uid: hedefUid, adSoyad: yeniAd });
    mesajYaz('Uye adi guncellendi.', 'ok');
    if (uyeYeniAdInput) uyeYeniAdInput.value = '';
    await durumYukle();
  } catch (err) {
    mesajYaz(err.message || 'Uye adi guncellenemedi.', 'hata');
  }
});

donemSecenekleriniHazirla();
ekraniCiz();

onAuthStateChanged(auth, async (user) => {
  authKontrolEdildi = true; // Ilk durum geldi; artik gercek erisim karti gosterilebilir.
  if (!user) {
    aktifKullanici = null;
    aktifKilit = null;
    aktifPeriod = null;
    yerelTaslak = null;
    komsuPeriodlar = {};
    mesajYaz('Rotasyon ekranini kullanmak icin giris yapin.', 'hata');
    ekraniCiz();
    return;
  }
  await durumYukle();
  await planOtoYukle({ beklemePenceresi: true });
});
