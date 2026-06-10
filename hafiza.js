// hafiza.js — "Buluta Kaydet" / "Buluttan Çek" butonları (manuel bulut senkronu)
// Otomatik Firestore senkronu kapalı; kullanıcı aktif ayın HYP/ASÇ verisini bu iki
// butonla buluta yazar / buluttan getirir. Firebase erişimi auth.js'in expose ettiği
// window.hesapBulut.kaydet() / .cek() üzerinden yapılır.

(function () {
  const SON_BULUT_KAYIT_KEY = 'ahek-hyp-son-bulut-kayit-zamani-v1';
  const CEK_BEKLEME_MS = 60000;
  const BULUTA_KAYDET_TITLE = 'Aktif ayın değerlerini hesabına buluta kaydet — başka cihazda "Buluttan Çek" ile getir';
  const BULUTTAN_CEK_METIN = '⬇ Buluttan Çek';
  const BULUTTAN_CEK_TITLE = 'Buluttaki kaydı bu cihaza getir (mevcut değerleri değiştirir)';
  let cekBeklemeTimer = null;
  let cekBeklemeBitis = 0;

  function toast(msg, tip) {
    if (typeof window.siteToast === 'function') window.siteToast(msg, tip);
    else console.log('[bulut]', msg);
  }

  function saatStr() {
    return new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function zamanMs(zaman) {
    if (!zaman) return 0;
    if (typeof zaman === 'number') return Number.isFinite(zaman) ? zaman : 0;
    if (typeof zaman === 'string') {
      const parsed = Date.parse(zaman);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    if (typeof zaman.toMillis === 'function') return zaman.toMillis();
    if (typeof zaman.seconds === 'number') return zaman.seconds * 1000;
    return 0;
  }

  function tarihStr(zaman) {
    const ms = zamanMs(zaman);
    if (!ms) return '';
    return new Date(ms).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function sonKayitZamaniOku() {
    try {
      return Number(localStorage.getItem(SON_BULUT_KAYIT_KEY) || '0') || 0;
    } catch (_) {
      return 0;
    }
  }

  function bulutaKaydetTitleGuncelle(zaman) {
    const btn = document.getElementById('btnHafizaAl');
    if (!btn) return;
    const tarih = tarihStr(zaman || sonKayitZamaniOku());
    btn.title = BULUTA_KAYDET_TITLE + (tarih ? `\nSon bulut kaydı: ${tarih}` : '\nSon bulut kaydı: Henüz bilinmiyor');
  }

  function sonKayitZamaniYaz(zaman) {
    const ms = zamanMs(zaman);
    if (!ms) return;
    try {
      localStorage.setItem(SON_BULUT_KAYIT_KEY, String(ms));
    } catch (_) {}
    bulutaKaydetTitleGuncelle(ms);
  }

  function cekBeklemeKalanSn() {
    if (!cekBeklemeBitis) return 0;
    return Math.max(0, Math.ceil((cekBeklemeBitis - Date.now()) / 1000));
  }

  function cekBeklemeGuncelle() {
    const btn = document.getElementById('btnHafizaGetir');
    if (!btn) return;
    const kalan = cekBeklemeKalanSn();
    if (kalan > 0) {
      btn.disabled = true;
      btn.textContent = `⬇ ${kalan} sn`;
      btn.title = `Yeni bulut kaydının oturması için ${kalan} sn bekleyin`;
      return;
    }
    if (cekBeklemeTimer) {
      clearInterval(cekBeklemeTimer);
      cekBeklemeTimer = null;
    }
    cekBeklemeBitis = 0;
    btn.disabled = false;
    btn.textContent = BULUTTAN_CEK_METIN;
    btn.title = BULUTTAN_CEK_TITLE;
  }

  function cekBeklemeBaslat(ms = CEK_BEKLEME_MS) {
    cekBeklemeBitis = Date.now() + ms;
    if (cekBeklemeTimer) clearInterval(cekBeklemeTimer);
    cekBeklemeGuncelle();
    cekBeklemeTimer = setInterval(cekBeklemeGuncelle, 1000);
  }

  async function bulutaKaydet() {
    if (!window.hesapBulut?.kaydet) {
      toast('⚠ Bulut bağlantısı hazır değil — sayfayı yenileyip tekrar dene', 'uyari');
      return;
    }
    const btn = document.getElementById('btnHafizaAl');
    const cekBtn = document.getElementById('btnHafizaGetir');
    if (btn) btn.disabled = true;
    if (cekBtn) cekBtn.disabled = true;
    try {
      toast('☁ Buluta gönderiliyor, lütfen bekleyin…', 'bilgi');
      const sonuc = await window.hesapBulut.kaydet();
      if (sonuc?.ok) {
        sonKayitZamaniYaz(sonuc.zaman || Date.now());
        cekBeklemeBaslat(CEK_BEKLEME_MS);
        toast('☁ Buluta kaydedildi (' + saatStr() + '). Buluttan Çek 1 dk sonra açılacak', 'ok');
      } else if (sonuc?.sebep === 'giris-yok') {
        toast('⚠ Buluta kaydetmek için giriş yapın', 'uyari');
      } else if (sonuc?.sebep === 'kurallar') {
        toast('⚠ Bulut kuralları ayarlanmamış', 'uyari');
      } else if (sonuc?.sebep === 'kayit-suruyor') {
        toast('☁ Buluta gönderim devam ediyor; Kaydedildi yazısını bekleyin', 'bilgi');
      } else {
        toast('⚠ Buluta kaydedilemedi', 'uyari');
      }
    } finally {
      if (btn) btn.disabled = false;
      if (cekBtn && cekBeklemeKalanSn() <= 0) cekBtn.disabled = false;
    }
  }

  async function buluttanCek() {
    if (!window.hesapBulut?.cek) {
      toast('⚠ Bulut bağlantısı hazır değil — sayfayı yenileyip tekrar dene', 'uyari');
      return;
    }
    const kalanSn = cekBeklemeKalanSn();
    if (kalanSn > 0) {
      toast(`☁ Buluttan Çek ${kalanSn} sn sonra açılacak`, 'bilgi');
      return;
    }
    if (!confirm('Bu cihazdaki değerler buluttaki kayıtla değiştirilecek. Emin misiniz?')) return;
    const btn = document.getElementById('btnHafizaGetir');
    if (btn) btn.disabled = true;
    try {
      let hedefAy = '';
      try { hedefAy = typeof window.hesapAktifAyOku === 'function' ? window.hesapAktifAyOku() : ''; } catch (_) {}
      const sonuc = await window.hesapBulut.cek(hedefAy);
      if (sonuc?.ok) {
        sonKayitZamaniYaz(sonuc.zaman);
        toast('⬇ Buluttan getirildi', 'ok');
      } else if (sonuc?.sebep === 'giris-yok') {
        toast('⚠ Buluttan çekmek için giriş yapın', 'uyari');
      } else if (sonuc?.sebep === 'kayit-yok') {
        toast('ℹ Bulutta kayıt yok — önce "Buluta Kaydet" ile gönder', 'bilgi');
      } else if (sonuc?.sebep === 'kayit-suruyor') {
        toast('☁ Buluta gönderim devam ediyor; çekmeden önce Kaydedildi yazısını bekleyin', 'bilgi');
      } else if (sonuc?.sebep === 'bekleme') {
        const kalan = Math.max(1, Math.ceil(Number(sonuc.kalanMs || 0) / 1000));
        cekBeklemeBaslat(kalan * 1000);
        toast(`☁ Buluttan Çek ${kalan} sn sonra açılacak`, 'bilgi');
      } else {
        toast('⚠ Buluttan getirilemedi', 'uyari');
      }
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  function baglantiKur() {
    bulutaKaydetTitleGuncelle();
    document.getElementById('btnHafizaAl')?.addEventListener('click', bulutaKaydet);
    document.getElementById('btnHafizaGetir')?.addEventListener('click', buluttanCek);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baglantiKur, { once: true });
  } else {
    baglantiKur();
  }

  window.hesapBulutButon = { kaydet: bulutaKaydet, cek: buluttanCek };
})();
