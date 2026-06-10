(function () {
  'use strict';

  const PARAMETRE = {
    nufusKatsayilari: [
      ['yenidogan', 'Yeni doğan', 3],
      ['bebek', 'Bebek', 3],
      ['gebe', 'Gebe', 3],
      ['lohusa', 'Lohusa', 3],
      ['cezaevi', 'Cezaevi', 2.25],
      ['cocuk', '0-59 ay', 1.6],
      ['yasli', '65 yaş üstü', 1.6],
      ['yas60_64', '60-64 yaş', 1.48],
      ['yas55_59', '55-59 yaş', 1.26],
      ['yas50_54', '50-54 yaş', 1.04],
      ['mobil', 'Mobil nüfus', 1],
      ['yas45_49', '45-49 yaş', 0.89],
      ['yas5_9', '5-9 yaş', 0.82],
      ['yas40_44', '40-44 yaş', 0.78],
      ['yas10_14', '10-14 yaş', 0.58],
      ['yas35_39', '35-39 yaş', 0.58],
      ['yas15_19', '15-19 yaş', 0.55],
      ['yas30_34', '30-34 yaş', 0.52],
      ['yas20_24', '20-24 yaş', 0.49],
      ['yas25_29', '25-29 yaş', 0.49]
    ],
    temel: {
      tabip: { ilkPuan: 1000, ilkOran: 0.785, yeniIlkPuan: 2000, yeniIlkOran: 1.31 },
      aileUzmani: { ilkPuan: 1000, ilkOran: 1.135, yeniIlkPuan: 2000, yeniIlkOran: 1.66 },
      fazlaPuanOrani: 0.000522
    },
    tesvik: {
      muayeneAzamiOran: 0.441,
      muayeneAltEsik: 0.5
    },
    performansKesintiKademeleri: [
      { alt: 96.01, ust: 98, oran: 0.02 },
      { alt: 94.01, ust: 96, oran: 0.04 },
      { alt: 89.01, ust: 94, oran: 0.06 },
      { alt: 85.01, ust: 89, oran: 0.08 },
      { alt: 0, ust: 85, oran: 0.10 }
    ],
    ilaveOdemeTablosu: {
      '2025-7': 18682.42, '2025-8': 18682.42, '2025-9': 18682.42, '2025-10': 18682.42, '2025-11': 18682.42, '2025-12': 18682.42,
      '2026-1': 22157.36, '2026-2': 22157.36, '2026-3': 22157.36, '2026-4': 22157.36, '2026-5': 22157.36, '2026-6': 22157.36
    },
    ekTabanAylikTablosu: {
      '2025-7': 0, '2025-8': 0, '2025-9': 0, '2025-10': 0, '2025-11': 0, '2025-12': 0,
      '2026-1': 1000.65, '2026-2': 1000.65, '2026-3': 1000.65, '2026-4': 1000.65, '2026-5': 1000.65, '2026-6': 1000.65
    },
    sendikaOdenegiTablosu: {
      '2026-1': 918.34, '2026-2': 918.34, '2026-3': 918.34, '2026-4': 918.34, '2026-5': 918.34, '2026-6': 918.34
    },
    varsayilanSgkMatrahi2026: 43530,
    sgkOranlari: {
      emekliSandigi: 0.09,
      ssp: 0.05,
      devletEmekliSandigi: 0.12,
      devletSsp: 0.075
    },
    ilceParametreleri: window.AHEK_MAAS_IL_ILCE_PARAMETRELERI || { iller: {} },
    vergiDilimleri2026: [
      { ust: 190000, oran: 0.15 },
      { ust: 400000, oran: 0.20 },
      { ust: 1500000, oran: 0.27 },
      { ust: 5300000, oran: 0.35 },
      { ust: Infinity, oran: 0.40 }
    ]
  };

  const $ = (secici, kok = document) => kok.querySelector(secici);
  const form = $('#maasForm');
  const hesapYilEl = form?.elements?.hesapYil;
  if (hesapYilEl) {
    hesapYilEl.value = String(new Date().getFullYear());
  }
  const ozet = $('#maasOzet');
  const dokum = $('#maasDokum');
  const ustNet = $('#maasUstNet');
  const ustCari = $('#maasUstCari');
  const ustToplam = $('#maasUstToplam');
  const ustVergiDilimi = $('#maasUstVergiDilimi');
  const izinNetBilgi = $('#maasIzinNetBilgi');
  const KAYIT_ANAHTARI = 'ahek-maas-hesaplama-form-v1';
  const KAYIT_META_ANAHTARI = 'ahek-maas-hesaplama-form-meta-v1';
  const SONUC_KAYIT_ANAHTARI = 'ahek-maas-hesaplama-sonuc-v1';
  const KAYIT_SURUM_ANAHTARI = 'ahek-maas-hesaplama-form-surum';
  const KAYIT_SURUM = '2026-06-maas-zam-1375-varsayilan';
  const MAAS_FIREBASE_KAYIT_SURUMU = 'maas-form-v1';
  const HYP_HESAP_KAYIT_ANAHTAR_BAZ = 'hesap_verileri_v1';
  const HYP_KATSAYI_MIN = 0.9;
  const HYP_KATSAYI_TAVAN_MAX = 1.5;
  const TESSERACT_SCRIPT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const TESSERACT_WORKER_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js';
  const TESSERACT_CORE_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js';
  const TESSERACT_LANG_URL = 'https://tessdata.projectnaptha.com/4.0.0';
  const TAHMINI_NUFUS_PUANI_CARPANI = 0.85;
  let kayitYukleniyor = false;
  let kayitTimer = null;
  let maasFirebaseKayitTimer = null;
  let hypKatsayiCanliTimer = null;
  let tesseractYuklemePromise = null;
  let maasBulutYuklenenUid = '';
  let maasFirebaseKaydediliyor = false;
  let maasYerelDegisimZamani = 0;
  let maasSonYerelKayitZamani = 0;

  const para = (deger) => new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 2
  }).format(Number.isFinite(deger) ? deger : 0);

  const sayi = (veri, ad) => {
    const ham = String(veri.get(ad) || '').replace(',', '.').trim();
    if (ham === '') return 0;
    const deger = Number(ham);
    return Number.isFinite(deger) ? deger : 0;
  };

  const yuzde = (deger) => `${(deger * 100).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}%`;
  const kisitla = (deger, min, max) => Math.min(max, Math.max(min, deger));
  const zamCarpani = (oran) => 1 + (Math.max(0, Number.isFinite(oran) ? oran : 0) / 100);
  const normalizeBirimTipi = (tip) => (tip === 'normalYeni' ? 'sifir' : tip);
  const normalLimitliBirimMi = (tip) => tip === 'normal' || tip === 'sifir' || tip === 'yeni';
  const dusukTavanliBirimMi = (tip) => tip === 'dusuk' || tip === 'entegre';
  const entegreTutulmayanNobetSaati = (veri) => {
    const saat = Math.max(0, sayi(veri, 'entegreTutulmayanNobet'));
    return Math.min(96, Math.floor(saat / 8) * 8);
  };
  const ayYilAnahtari = (veri) => {
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    const yil = Math.floor(sayi(veri, 'hesapYil') || 2026);
    return `${yil}-${ay}`;
  };
  const ayGunSayisi = (veri) => {
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    const yil = Math.floor(sayi(veri, 'hesapYil') || 2026);
    return new Date(yil, ay, 0).getDate();
  };

  function tabloDegeri(tablosu, veri, varsayilan) {
    const anahtar = ayYilAnahtari(veri);
    return tablosu[anahtar] != null ? tablosu[anahtar] : varsayilan;
  }

  function tahminiZamOrani(veri) {
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    if (ay < 7) return 0;
    const senaryo = String(veri.get('temmuzZamSenaryosu') || '0');
    if (senaryo === 'manuel') return Math.max(0, sayi(veri, 'temmuzZamOrani'));
    const oran = Number(senaryo);
    return Number.isFinite(oran) ? Math.max(0, oran) : 0;
  }

  function secilenTemmuzZamOrani(veri) {
    const senaryo = String(veri.get('temmuzZamSenaryosu') || '0');
    if (senaryo === 'manuel') return Math.max(0, sayi(veri, 'temmuzZamOrani'));
    const oran = Number(senaryo);
    return Number.isFinite(oran) ? Math.max(0, oran) : 0;
  }

  function elleZamSenaryosunuUygula() {
    if (!form) return;
    const oranEl = form.elements?.temmuzZamOrani;
    const senaryoEl = form.elements?.temmuzZamSenaryosu;
    if (!oranEl || !senaryoEl) return;
    const ham = String(oranEl.value || '').trim();
    if (ham !== '' && senaryoEl.value !== 'manuel') senaryoEl.value = 'manuel';
    elleZamAlaniGorunumunuUygula();
  }

  function elleZamAlaniGorunumunuUygula() {
    if (!form) return;
    const alan = form.querySelector('[data-elle-zam-alani="1"]');
    const senaryoEl = form.elements?.temmuzZamSenaryosu;
    if (!alan || !senaryoEl) return;
    alan.hidden = String(senaryoEl.value || '') !== 'manuel';
  }

  function sabitEkGelirleriUygula() {
    if (!form) return;
    const veri = new FormData(form);
    const kamuCalisani = String(veri.get('kadroDurumu') || 'kamu') === 'kamu';
    const ilaveEl = form.elements?.ilaveOdeme;
    const ekTabanEl = form.elements?.ekTabanAylik;
    if (!ilaveEl || !ekTabanEl) return;
    const carp = zamCarpani(tahminiZamOrani(veri));
    const ilave = kamuCalisani ? tabloDegeri(PARAMETRE.ilaveOdemeTablosu, veri, 22157.36) * carp : 0;
    const ekTaban = kamuCalisani ? tabloDegeri(PARAMETRE.ekTabanAylikTablosu, veri, 1000.65) * carp : 0;
    if (document.activeElement !== ilaveEl && (ilaveEl.dataset.otomatik === '1' || !Number(ilaveEl.value))) {
      ilaveEl.value = ilave.toFixed(2);
      ilaveEl.dataset.otomatik = '1';
    }
    if (document.activeElement !== ekTabanEl && (ekTabanEl.dataset.otomatik === '1' || !Number(ekTabanEl.value))) {
      ekTabanEl.value = ekTaban.toFixed(2);
      ekTabanEl.dataset.otomatik = '1';
    }
  }

  function sendikaOdenegiUygula() {
    if (!form) return;
    const veri = new FormData(form);
    const uye = String(veri.get('sendikaUyeligi') || '0') === '1';
    const odenekEl = form.elements?.sendikaOdenegi;
    if (!odenekEl) return;
    const odenek = uye ? tabloDegeri(PARAMETRE.sendikaOdenegiTablosu, veri, 918.34) * zamCarpani(tahminiZamOrani(veri)) : 0;
    if (document.activeElement !== odenekEl && (odenekEl.dataset.otomatik === '1' || !Number(odenekEl.value))) {
      odenekEl.value = odenek.toFixed(2);
      odenekEl.dataset.otomatik = '1';
    }
  }

  function sendikaDurumunuUygula() {
    if (!form) return;
    const veri = new FormData(form);
    const uye = String(veri.get('sendikaUyeligi') || '0') === '1';
    const kesintiEl = form.elements?.sendikaKesinti;
    const odenekEl = form.elements?.sendikaOdenegi;
    if (kesintiEl) {
      kesintiEl.disabled = !uye;
      if (!uye) kesintiEl.value = '0';
    }
    if (odenekEl) {
      odenekEl.disabled = !uye;
      if (!uye) {
        odenekEl.value = '0';
        odenekEl.dataset.otomatik = '1';
      }
    }
  }

  function formVerisiniTopla() {
    const veri = {};
    const elemanlar = Array.from(form.elements || {});
    const liste = elemanlar.length ? elemanlar : Object.values(form.elements || {});
    liste.forEach((el) => {
      if (!el.name || el.type === 'submit' || el.type === 'button') return;
      veri[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      if (el.dataset?.otomatik) veri[`${el.name}__otomatik`] = el.dataset.otomatik;
    });
    return veri;
  }

  function formVerisiniUygula(veri, secenekler = {}) {
    if (!veri || typeof veri !== 'object') return false;
    const tumAlanlariUygula = secenekler.tumAlanlariUygula === true;
    const kayitliIlce = Object.prototype.hasOwnProperty.call(veri, 'calisilanIlce')
      ? veri.calisilanIlce
      : null;
    kayitYukleniyor = true;
    Object.entries(veri).forEach(([ad, deger]) => {
      if (ad.endsWith('__otomatik')) return;
      if (ad === 'nufusDetayAcik') return;
      if (ad === 'calisilanIlce') return;
      const el = form.elements?.[ad];
      if (!el) return;
      if (!tumAlanlariUygula && ad === 'ayItibariyleKumulatifMatrah') {
        el.value = '';
        return;
      }
      if (!tumAlanlariUygula && ad === 'oncekiAylikMatrah') {
        el.value = '';
        return;
      }
      if (!tumAlanlariUygula && ad === 'manuelMatrah') {
        el.value = '';
        return;
      }
      if (el.type === 'checkbox') el.checked = deger === true;
      else el.value = deger;
      if (veri[`${ad}__otomatik`] && el.dataset) el.dataset.otomatik = veri[`${ad}__otomatik`];
    });
    if (kayitliIlce != null && form.elements?.calisilanIlce) {
      ilceSecimleriniGuncelle();
      form.elements.calisilanIlce.value = kayitliIlce;
    }
    kayitYukleniyor = false;
    return true;
  }

  function yerelKayitYukle() {
    try {
      const ham = localStorage.getItem(KAYIT_ANAHTARI);
      if (ham) formVerisiniUygula(JSON.parse(ham));
      maasSonYerelKayitZamani = yerelKayitMetaOku();
    } catch (_) {}
  }

  function yerelKayitMetaOku() {
    try {
      const ham = localStorage.getItem(KAYIT_META_ANAHTARI);
      if (!ham) return 0;
      const meta = JSON.parse(ham);
      const zaman = Number(meta?.guncellenme || 0);
      return Number.isFinite(zaman) ? zaman : 0;
    } catch (_) {
      return 0;
    }
  }

  function yerelKayitMetaYaz(guncellenme) {
    try {
      localStorage.setItem(KAYIT_META_ANAHTARI, JSON.stringify({ guncellenme }));
    } catch (_) {}
  }

  function yerelKayitYaz(zaman) {
    try {
      hesabaEsasNufusPuaniAlaniniGuncelle();
      const veri = formVerisiniTopla();
      localStorage.setItem(KAYIT_ANAHTARI, JSON.stringify(veri));
      yerelKayitMetaYaz(zaman);
      maasSonYerelKayitZamani = zaman;
      if (typeof chrome !== 'undefined' && chrome.storage?.local?.set) {
        chrome.storage.local.set({ [KAYIT_ANAHTARI]: veri });
      }
    } catch (_) {}
  }

  function yerelKayitPlanla(secenekler = {}) {
    if (kayitYukleniyor) return;
    const yerelDegisim = secenekler.yerelDegisim !== false;
    const zaman = yerelDegisim ? Date.now() : (maasSonYerelKayitZamani || Date.now());
    if (yerelDegisim) maasYerelDegisimZamani = zaman;
    clearTimeout(kayitTimer);
    kayitTimer = null;
    yerelKayitYaz(zaman);
  }

  function maasKayitDurumuYaz(metin, durum = 'bilgi') {
    const durumEl = document.getElementById('maasKayitDurumu');
    if (!durumEl) return;
    durumEl.textContent = metin || '';
    durumEl.dataset.durum = durum;
  }

  function maasBulutFormunuUygula(veri) {
    if (!formVerisiniUygula(veri, { tumAlanlariUygula: true })) return false;
    ilIlceSecimleriniHazirla();
    ilceParametreleriniUygula();
    manuelNufusModunuUygula();
    nufusPuaniModuGorunumunuUygula();
    manuelPuanOncelikDurumunuUygula();
    birimTipiYeniBirimSenkranize();
    hypKatsayiCanliCekDurumunuUygula();
    ekGostergeyiHekimTipindenUygula();
    elleZamSenaryosunuUygula();
    elleZamAlaniGorunumunuUygula();
    sabitEkGelirleriUygula();
    sendikaOdenegiUygula();
    sendikaDurumunuUygula();
    formVerisiniUygula(veri, { tumAlanlariUygula: true });
    yerelKayitPlanla({ yerelDegisim: false });
    render();
    return true;
  }

  async function maasBilgileriniFirebaseKaydet(secenekler = {}) {
    if (maasFirebaseKaydediliyor) {
      return;
    }
    clearTimeout(maasFirebaseKayitTimer);
    maasFirebaseKayitTimer = null;
    const uid = String(window._currentUid || '').trim();
    const firebase = window._firebase;
    if (!uid) {
      maasKayitDurumuYaz('Bilgileri diğer cihazlarda görmek için giriş yapın.', 'hata');
      return;
    }
    if (!firebase?.db || !firebase?.doc || !firebase?.setDoc || !firebase?.serverTimestamp) {
      maasKayitDurumuYaz('Firebase bağlantısı hazırlanıyor. Lütfen kısa süre sonra tekrar deneyin.', 'hata');
      return;
    }

    const dugme = document.getElementById('maasBilgileriKaydet');
    maasFirebaseKaydediliyor = true;
    if (dugme) dugme.disabled = true;
    maasKayitDurumuYaz('Bilgiler hesabınıza kaydediliyor...', 'bilgi');
    try {
      const veri = formVerisiniTopla();
      const istemciGuncellenme = Date.now();
      const ref = firebase.doc(firebase.db, 'users', uid, 'veriler', 'maas');
      await firebase.setDoc(ref, {
        form: veri,
        surum: MAAS_FIREBASE_KAYIT_SURUMU,
        istemciGuncellenme,
        guncellenme: firebase.serverTimestamp(),
      }, { merge: true });
      maasBulutYuklenenUid = uid;
      maasYerelDegisimZamani = 0;
      maasSonYerelKayitZamani = istemciGuncellenme;
      yerelKayitMetaYaz(istemciGuncellenme);
      maasKayitDurumuYaz('Bilgiler hesabınıza kaydedildi.', 'basarili');
    } catch (err) {
      console.warn('Maaş bilgileri kaydedilemedi:', err?.message || 'Bilinmeyen hata');
      maasKayitDurumuYaz('Bilgiler kaydedilemedi. Lütfen tekrar deneyin.', 'hata');
    } finally {
      maasFirebaseKaydediliyor = false;
      if (dugme) dugme.disabled = false;
    }
  }

  async function maasBulutKaydiniYukle(uid = window._currentUid) {
    const temizUid = String(uid || '').trim();
    const firebase = window._firebase;
    if (!temizUid || maasBulutYuklenenUid === temizUid) return;
    if (!firebase?.db || !firebase?.doc || !firebase?.getDoc) return;

    maasBulutYuklenenUid = temizUid;
    maasKayitDurumuYaz('Hesabınızdaki maaş bilgileri yükleniyor...', 'bilgi');
    try {
      const ref = firebase.doc(firebase.db, 'users', temizUid, 'veriler', 'maas');
      const snap = await firebase.getDoc(ref);
      if (!snap.exists()) {
        maasKayitDurumuYaz('Bu hesapta kaydedilmiş maaş bilgisi yok.', 'bilgi');
        return;
      }
      const kayit = snap.data();
      if (!kayit?.form || typeof kayit.form !== 'object') {
        maasKayitDurumuYaz('Kayıtlı maaş bilgileri okunamadı.', 'hata');
        return;
      }
      const uzakGuncellenme = Number(kayit.istemciGuncellenme || 0);
      const yerelGuncellenme = Math.max(maasYerelDegisimZamani, maasSonYerelKayitZamani);
      if (yerelGuncellenme && (!uzakGuncellenme || uzakGuncellenme < yerelGuncellenme)) {
        maasKayitDurumuYaz('Bu cihazdaki daha yeni degisiklik korunuyor. Buluttaki eski kayit uygulanmadi.', 'bilgi');
        return;
      }
      if (uzakGuncellenme) maasSonYerelKayitZamani = uzakGuncellenme;
      maasBulutFormunuUygula(kayit.form);
      maasYerelDegisimZamani = 0;
      if (uzakGuncellenme) {
        maasSonYerelKayitZamani = uzakGuncellenme;
        yerelKayitMetaYaz(uzakGuncellenme);
      }
      maasKayitDurumuYaz('Hesabınızdaki maaş bilgileri otomatik yüklendi.', 'basarili');
    } catch (err) {
      maasBulutYuklenenUid = '';
      console.warn('Maaş bilgileri yüklenemedi:', err?.message || 'Bilinmeyen hata');
      maasKayitDurumuYaz('Hesabınızdaki maaş bilgileri yüklenemedi.', 'hata');
    }
  }

  function maasAuthDurumunuUygula(event) {
    const uid = event?.detail?.user?.uid || window._currentUid || '';
    if (!uid) {
      maasBulutYuklenenUid = '';
      clearTimeout(maasFirebaseKayitTimer);
      maasFirebaseKayitTimer = null;
      maasKayitDurumuYaz('Giriş yaptığınızda maaş bilgilerinizi "Buluta Kaydet" ile saklayabilirsiniz.', 'bilgi');
      return;
    }
    // Manuel senkron: girişte otomatik yükleme yapılmaz; "Buluttan Çek" ile getirilir.
  }

  function nufusSsDurumYaz(metin, durum = 'bilgi') {
    const durumEl = document.getElementById('maasNufusSsDurum');
    if (!durumEl) return;
    durumEl.textContent = metin || '';
    durumEl.dataset.durum = durum;
    durumEl.hidden = !metin;
  }

  function tesseractYukle() {
    if (window.Tesseract?.recognize) return Promise.resolve(window.Tesseract);
    if (tesseractYuklemePromise) return tesseractYuklemePromise;

    tesseractYuklemePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TESSERACT_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        if (window.Tesseract?.recognize) resolve(window.Tesseract);
        else reject(new Error('OCR kütüphanesi yüklenemedi.'));
      };
      script.onerror = () => reject(new Error('OCR kütüphanesi indirilemedi.'));
      document.head.appendChild(script);
    });

    return tesseractYuklemePromise;
  }

  function nufusSsSonucUygula(sonuc) {
    const parser = window.AhekMaasNufusSsParser;
    if (!parser?.grupAlanlari) throw new Error('Nüfus SS parseri hazır değil.');

    let aktarilan = 0;
    parser.grupAlanlari().forEach((ad) => {
      const satir = sonuc?.[ad];
      const toplamEl = form.elements?.[ad];
      const gelmeyenEl = form.elements?.[`${ad}Gelmeyen`];
      if (!satir || !toplamEl || !gelmeyenEl) return;
      toplamEl.value = String(Math.max(0, Math.round(Number(satir.toplam) || 0)));
      gelmeyenEl.value = String(Math.max(0, Math.round(Number(satir.gelmeyen) || 0)));
      aktarilan += 1;
    });

    if (!aktarilan) throw new Error('Tabloda uygun nüfus grubu bulunamadı.');

    const modEl = form.elements?.nufusPuaniModu;
    if (modEl) modEl.value = 'otomatik';
    const detayKutu = form.querySelector('.maas-nufus-detay-popup');
    if (detayKutu) detayKutu.open = true;
    nufusPuaniModuGorunumunuUygula();
    yerelKayitPlanla();
    render();
    return aktarilan;
  }

  function detayliNufusAlanlariniTemizle() {
    const parser = window.AhekMaasNufusSsParser;
    const alanlar = parser?.grupAlanlari?.() || PARAMETRE.nufusKatsayilari.map(([ad]) => ad);
    alanlar.forEach((ad) => {
      const toplamEl = form.elements?.[ad];
      const gelmeyenEl = form.elements?.[`${ad}Gelmeyen`];
      if (toplamEl) toplamEl.value = '0';
      if (gelmeyenEl) gelmeyenEl.value = '0';
    });
    if (form.elements?.detayliNufusPuaniSonuc) form.elements.detayliNufusPuaniSonuc.value = '0';
    const modEl = form.elements?.nufusPuaniModu;
    if (modEl) modEl.value = 'otomatik';
    nufusPuaniModuGorunumunuUygula();
    yerelKayitPlanla();
    render();
  }

  async function nufusSsDosyasiniOku(dosya) {
    if (!dosya) return;
    const inputEl = document.getElementById('maasNufusSsInput');
    try {
      nufusSsDurumYaz('SS okunuyor...', 'bilgi');
      const Tesseract = await tesseractYukle();
      const sonuc = await Tesseract.recognize(dosya, 'tur+eng', {
        workerPath: TESSERACT_WORKER_URL,
        corePath: TESSERACT_CORE_URL,
        langPath: TESSERACT_LANG_URL,
        logger: (m) => {
          if (m?.status === 'recognizing text' && Number.isFinite(m.progress)) {
            nufusSsDurumYaz(`SS okunuyor... %${Math.round(m.progress * 100)}`, 'bilgi');
          }
        }
      });
      const metin = sonuc?.data?.text || '';
      const parser = window.AhekMaasNufusSsParser;
      const aktarilan = nufusSsSonucUygula(parser?.parse ? parser.parse(metin) : {});
      nufusSsDurumYaz(`${aktarilan} nüfus grubu aktarıldı.`, 'basarili');
    } catch (err) {
      nufusSsDurumYaz(`SS okunamadı: ${err?.message || 'Bilinmeyen hata'}`, 'hata');
    } finally {
      if (inputEl) inputEl.value = '';
    }
  }

  function performansAlanlariniSifirla() {
    const adlar = [
      'perfasiGereken',
      'perfasiYapilan',
      'perfbebekGereken',
      'perfbebekYapilan',
      'perfcocukGereken',
      'perfcocukYapilan',
      'perfgebeGereken',
      'perfgebeYapilan',
      'perflohusaGereken',
      'perflohusaYapilan',
      'performansKesintiOrani'
    ];
    adlar.forEach((ad) => {
      const el = form?.elements?.[ad];
      if (el) el.value = '0';
    });
  }

  function varsayilanGecisleriniUygula() {
    try {
      const surum = localStorage.getItem(KAYIT_SURUM_ANAHTARI);
      if (surum === KAYIT_SURUM) return;
      performansAlanlariniSifirla();
      const nufusPuaniModuEl = form.elements?.nufusPuaniModu;
      if (nufusPuaniModuEl) nufusPuaniModuEl.value = 'manuel';
      const temmuzZamSenaryosuEl = form.elements?.temmuzZamSenaryosu;
      if (temmuzZamSenaryosuEl && (!temmuzZamSenaryosuEl.value || temmuzZamSenaryosuEl.value === '0')) {
        temmuzZamSenaryosuEl.value = '13.75';
      }
      localStorage.setItem(KAYIT_SURUM_ANAHTARI, KAYIT_SURUM);
      yerelKayitPlanla();
    } catch (_) {}
  }

  function yerelMaasOnizlemeMi() {
    const host = location.hostname;
    return location.protocol === 'file:' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '::1';
  }

  function adminKilitHazirla() {
    const korumali = document.querySelector('[data-maas-admin-korumali]');
    const kilit = document.querySelector('[data-maas-admin-kilit]');
    const ustOzet = document.querySelector('[data-maas-ust-ozet]');
    const yerelOnizleme = yerelMaasOnizlemeMi();
    if (!korumali || !kilit) return;
    window.__AHEK_MAAS_MODULU_ACIK = true;
    if (yerelOnizleme) document.documentElement.classList.add('ahek-maas-yerel-onizleme');
    korumali.hidden = false;
    kilit.hidden = true;
    if (ustOzet) ustOzet.hidden = false;
  }

  function vergiHesapla(matrah) {
    let kalan = Math.max(0, matrah);
    let oncekiUst = 0;
    let vergi = 0;
    for (const dilim of PARAMETRE.vergiDilimleri2026) {
      const aralik = Math.min(kalan, dilim.ust - oncekiUst);
      if (aralik > 0) vergi += aralik * dilim.oran;
      kalan -= aralik;
      oncekiUst = dilim.ust;
      if (kalan <= 0) break;
    }
    return vergi;
  }

  function vergiDilimiDokumu(kumulatif, aylikMatrah) {
    const baslangic = Math.max(0, kumulatif);
    const bitis = Math.max(baslangic, baslangic + Math.max(0, aylikMatrah));
    let oncekiUst = 0;
    return PARAMETRE.vergiDilimleri2026
      .map((dilim) => {
        const dilimBaslangic = oncekiUst;
        const dilimBitis = dilim.ust;
        const tutar = Math.max(0, Math.min(bitis, dilimBitis) - Math.max(baslangic, dilimBaslangic));
        oncekiUst = dilim.ust;
        return {
          alt: dilimBaslangic,
          ust: dilimBitis,
          oran: dilim.oran,
          tutar,
          vergi: tutar * dilim.oran
        };
      })
      .filter((satir) => satir.tutar > 0);
  }

  function aylikGelirVergisiDetay(kumulatif, aylikMatrah, istisna) {
    const dilimler = vergiDilimiDokumu(kumulatif, aylikMatrah);
    const ham = dilimler.reduce((toplam, satir) => toplam + satir.vergi, 0);
    return {
      dilimler,
      ham,
      istisna,
      net: Math.max(0, ham - istisna)
    };
  }

  function kumulatifMatrahHesapla(veri, aylikMatrah) {
    const manuelKumulatif = String(veri.get('kumulatifMatrah') || '').trim();
    if (manuelKumulatif) return Math.max(0, sayi(veri, 'kumulatifMatrah'));
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    const oncekiAylik = String(veri.get('oncekiAylikMatrah') || '').trim()
      ? Math.max(0, sayi(veri, 'oncekiAylikMatrah'))
      : aylikMatrah;
    return Math.max(0, (ay - 1) * oncekiAylik);
  }

  function ayItibariyleKumulatifMatrahGirildiMi(veri) {
    const ay = kisitla(Math.floor(sayi(veri, 'kumulatifMatrahAyi') || 0), 0, 12);
    const tutar = String(veri.get('ayItibariyleKumulatifMatrah') || '').trim();
    return ay > 0 && tutar !== '';
  }

  function ayItibariyleKumulatifMatrahHesapla(veri, aylikMatrah, oncekiAylarMatrahi) {
    const hesapAy = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    const referansAy = kisitla(Math.floor(sayi(veri, 'kumulatifMatrahAyi') || 0), 0, 12);
    const referansTutar = Math.max(0, sayi(veri, 'ayItibariyleKumulatifMatrah'));
    const oncekiAylik = String(veri.get('oncekiAylikMatrah') || '').trim()
      ? Math.max(0, sayi(veri, 'oncekiAylikMatrah'))
      : Math.max(0, oncekiAylarMatrahi || aylikMatrah);
    return Math.max(0, referansTutar + ((hesapAy - referansAy - 1) * oncekiAylik));
  }

  function otomatikKumulatifMatrahHesapla(veri, aylikMatrah, otomatikMatrah, oncekiAylarMatrahi) {
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    const oncekiAylikManuel = String(veri.get('oncekiAylikMatrah') || '').trim();
    if (oncekiAylikManuel) return Math.max(0, (ay - 1) * sayi(veri, 'oncekiAylikMatrah'));

    const secilenZam = secilenTemmuzZamOrani(veri);
    const ayZamliMi = ay >= 7;
    const bazMatrah = Math.max(0, (oncekiAylarMatrahi || otomatikMatrah || aylikMatrah) / (ayZamliMi ? zamCarpani(secilenZam) : 1));
    const zamliMatrah = secilenZam > 0 ? bazMatrah * zamCarpani(secilenZam) : bazMatrah;
    const ocakBaslangicMatrahi = bazMatrah * 0.85;
    if (ay === 1) return Math.max(0, ocakBaslangicMatrahi);
    if (ay <= 7) return Math.max(0, ocakBaslangicMatrahi + ((ay - 1) * bazMatrah));
    return Math.max(0, ocakBaslangicMatrahi + (6 * bazMatrah) + ((ay - 7) * zamliMatrah));
  }

  function gelirVergisiBaslangicMatrahi(veri, aylikMatrah, otomatikMatrah, oncekiAylarMatrahi) {
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    if (ay === 12) return 0;
    const manuelKumulatif = String(veri.get('kumulatifMatrah') || '').trim();
    if (manuelKumulatif) return kumulatifMatrahHesapla(veri, aylikMatrah);
    if (ayItibariyleKumulatifMatrahGirildiMi(veri)) return ayItibariyleKumulatifMatrahHesapla(veri, aylikMatrah, oncekiAylarMatrahi);
    return otomatikKumulatifMatrahHesapla(veri, aylikMatrah, otomatikMatrah, oncekiAylarMatrahi);
  }

  function aralikVergisiOcakAktarimiMi(veri) {
    const ay = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    return ay === 12;
  }

  function sgkMatrahiHesapla(veri, zamOrani) {
    const manuelSgkMatrahi = String(veri.get('sgkMatrahi') || '').trim();
    if (manuelSgkMatrahi) return Math.max(0, sayi(veri, 'sgkMatrahi'));

    const baslangicYil = Math.floor(sayi(veri, 'sgkBaslangicYil'));
    const baslangicAy = kisitla(Math.floor(sayi(veri, 'sgkBaslangicAy') || 1), 1, 12);
    const hesapYil = Math.floor(sayi(veri, 'hesapYil') || new Date().getFullYear());
    const hesapAy = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12);
    const kidemAyi = baslangicYil > 0 ? Math.max(0, (hesapYil * 12 + hesapAy) - (baslangicYil * 12 + baslangicAy)) : 0;
    const kidemYili = Math.floor(kidemAyi / 12);
    const kidemFarki = kidemYili * Math.max(0, sayi(veri, 'sgkYillikMatrahFarki'));
    const varsayilanMatrah = sayi(veri, 'sgkVarsayilanMatrahi') || PARAMETRE.varsayilanSgkMatrahi2026;
    return Math.max(0, (varsayilanMatrah + kidemFarki) * zamCarpani(zamOrani));
  }

  function sendikaHesapla(veri) {
    const girilenOdenek = sayi(veri, 'sendikaOdenegi');
    const uye = String(veri.get('sendikaUyeligi') || '0') === '1';
    const esKesinti = uye ? girilenOdenek : 0;
    return {
      uye,
      kesinti: esKesinti,
      odenek: uye ? girilenOdenek : 0
    };
  }

  function nufusPuaniHesapla(veri, secenekler = {}) {
    const mod = String(veri.get('nufusPuaniModu') || 'manuel');
    if (mod === 'manuel') {
      const hypDahilPuan = Math.max(0, sayi(veri, 'manuelNufusPuani'));
      const hamPuan = Math.max(0, sayi(veri, 'hamNufusPuani'));
      const gelmeyenPuan = secenekler.gelmeyenNufusYok ? 0 : Math.max(0, sayi(veri, 'gelmeyenNufusPuani'));
      const netHamPuan = Math.max(0, hamPuan - gelmeyenPuan);
      const manuelToplam = Math.max(0, Math.floor(sayi(veri, 'manuelToplamNufus')));
      const hypDahilPuanAktif = hypDahilPuan > 0;
      const tahminiPuan = hamPuan > 0 || hypDahilPuanAktif ? 0 : manuelToplam * TAHMINI_NUFUS_PUANI_CARPANI;
      const hesabaEsasPuan = hamPuan > 0 ? netHamPuan : tahminiPuan;
      const hypUygula = !hypDahilPuanAktif && hesabaEsasPuan > 0;
      const araPuan = hypDahilPuanAktif ? hypDahilPuan : hesabaEsasPuan;
      return {
        mod,
        tip: normalizeBirimTipi(String(veri.get('birimTipi') || 'normal')),
        limit: 0,
        toplamNufus: manuelToplam,
        asilanNufus: 0,
        araPuan,
        hypUygula,
        tahminiPuan,
        hesabaEsasPuan,
        gelmeyenEtkiPuan: hypDahilPuanAktif ? 0 : (hamPuan > 0 ? Math.min(hamPuan, gelmeyenPuan) : 0),
        satirlar: [{
          etiket: hypDahilPuanAktif ? 'HYP dahil hesaba esas' : (tahminiPuan > 0 ? 'Tahmini hesaba esas puan' : 'Hesaba esas puan'),
          adet: manuelToplam,
          gelmeyen: 0,
          sayilan: manuelToplam,
          katsayi: hypDahilPuanAktif ? 'HYP dahil' : (tahminiPuan > 0 ? 'Tahmini' : 'HYP uygulanacak'),
          puan: araPuan
        }]
      };
    }

    const tip = normalizeBirimTipi(String(veri.get('birimTipi') || 'normal'));
    const limit = normalLimitliBirimMi(tip) ? 3500 : 2400;
    const gruplar = PARAMETRE.nufusKatsayilari
      .map(([ad, etiket, katsayi]) => {
        const adet = Math.max(0, Math.floor(sayi(veri, ad)));
        const gelmeyen = secenekler.gelmeyenNufusYok ? 0 : Math.min(adet, Math.max(0, Math.floor(sayi(veri, `${ad}Gelmeyen`))));
        return { ad, etiket, katsayi, adet, gelmeyen };
      })
      .sort((a, b) => b.katsayi - a.katsayi);

    let kalanKisi = limit;
    let hamPuan = 0;
    let gelmeyenEtkiPuan = 0;
    const satirlar = [];

    for (const grup of gruplar) {
      const sayilan = Math.min(grup.adet, kalanKisi);
      kalanKisi -= sayilan;
      const gelmeyen = Math.min(sayilan, grup.gelmeyen);
      let puan = sayilan * grup.katsayi - (gelmeyen * grup.katsayi * 0.5);
      let puanGelmeyenYok = sayilan * grup.katsayi;

      if (tip === 'dusuk') {
        const ilkKisi = Math.min(sayilan, Math.max(0, 1350 - satirlar.reduce((t, s) => t + s.sayilan, 0)));
        const ikinciKisi = sayilan - ilkKisi;
        puan = ilkKisi * grup.katsayi * 2 + ikinciKisi * grup.katsayi - (gelmeyen * grup.katsayi * 0.5);
        puanGelmeyenYok = ilkKisi * grup.katsayi * 2 + ikinciKisi * grup.katsayi;
      }

      hamPuan += puan;
      gelmeyenEtkiPuan += Math.max(0, puanGelmeyenYok - puan);
      satirlar.push({ ...grup, sayilan, gelmeyen, puan });
      if (kalanKisi <= 0) break;
    }

    const toplamNufus = PARAMETRE.nufusKatsayilari.reduce((t, [ad]) => t + Math.max(0, Math.floor(sayi(veri, ad))), 0);
    const asilanNufus = Math.max(0, toplamNufus - limit);
    if (toplamNufus <= 0) {
      return {
        mod,
        tip,
        limit,
        toplamNufus,
        asilanNufus,
        araPuan: 0,
        detayZorunluEksik: true,
        gelmeyenEtkiPuan: 0,
        satirlar: [{
          etiket: 'Detaylı nüfus grupları',
          adet: 0,
          gelmeyen: 0,
          sayilan: 0,
          katsayi: 'Doldurulmalı',
          puan: 0
        }]
      };
    }
    let araPuan = tip === 'entegre' ? hamPuan * 1.65 : hamPuan;
    if (tip === 'entegre') gelmeyenEtkiPuan *= 1.65;
    if (normalLimitliBirimMi(tip) && toplamNufus > 3500 && araPuan < 3000) araPuan = 3000;

    return { mod, tip, limit, toplamNufus, asilanNufus, araPuan, gelmeyenEtkiPuan, satirlar };
  }

  function hypKatsayiTavaniniHesapla(nufus, veri) {
    const tip = normalizeBirimTipi(String(nufus?.tip || veri.get('birimTipi') || 'normal'));
    if (tip === 'sifir') return 1;
    const toplamNufus = Math.max(0, Number(nufus?.toplamNufus || 0));
    if (!Number.isFinite(toplamNufus) || toplamNufus <= 0) return HYP_KATSAYI_TAVAN_MAX;
    const dusukTip = dusukTavanliBirimMi(tip);
    const cap = dusukTip ? 2400 : 3500;
    const baz = dusukTip ? 2400 : 4000;
    const etkinNufus = Math.min(toplamNufus, cap);
    return Math.min(baz / Math.max(1, etkinNufus), HYP_KATSAYI_TAVAN_MAX);
  }

  function hypKatsayiKabulDegeri(hamKatsayi, nufus, veri) {
    const tavan = Math.max(HYP_KATSAYI_MIN, hypKatsayiTavaniniHesapla(nufus, veri));
    const katsayi = Number.isFinite(hamKatsayi) ? hamKatsayi : 1;
    return kisitla(katsayi, HYP_KATSAYI_MIN, tavan);
  }

  function temelUcretHesapla(veri, maasaEsasPuan, tavan) {
    const hekimTipi = String(veri.get('hekimTipi') || 'tabip');
    const kural = PARAMETRE.temel[hekimTipi] || PARAMETRE.temel.tabip;
    const yeniBirim = veri.get('yeniBirim') === 'on';
    const ilkPuan = yeniBirim ? kural.yeniIlkPuan : kural.ilkPuan;
    const ilkOran = yeniBirim ? kural.yeniIlkOran : kural.ilkOran;
    const ilkOdeme = tavan * ilkOran;
    const fazlaPuan = Math.max(0, maasaEsasPuan - ilkPuan);
    const fazlaOdeme = fazlaPuan * tavan * PARAMETRE.temel.fazlaPuanOrani;
    return { ilkPuan, ilkOran, ilkOdeme, fazlaPuan, fazlaOdeme, toplam: ilkOdeme + fazlaOdeme };
  }

  function entegreTutulmayanNobetUygula(veri, maasaEsasPuan) {
    const tip = normalizeBirimTipi(String(veri.get('birimTipi') || 'normal'));
    if (tip !== 'entegre') return { maasaEsasPuan, saat: 0, carpan: 1, oncekiPuan: maasaEsasPuan };
    const saat = entegreTutulmayanNobetSaati(veri);
    if (saat <= 0) return { maasaEsasPuan, saat: 0, carpan: 1, oncekiPuan: maasaEsasPuan };
    const carpan = Math.pow(0.92, saat / 8);
    return {
      maasaEsasPuan: Math.max(1000, maasaEsasPuan * carpan),
      saat,
      carpan,
      oncekiPuan: maasaEsasPuan
    };
  }

  function muayeneTesvikHesapla(veri, tavan) {
    const hedef = Math.max(0, sayi(veri, 'muayeneHedef'));
    const ortalamaMuayene = Math.max(0, sayi(veri, 'muayeneOrtalama'));
    const basariOrani = hedef > 0 ? ortalamaMuayene / hedef : 0;
    const hakEdisOrani = basariOrani >= PARAMETRE.tesvik.muayeneAltEsik
      ? Math.min(PARAMETRE.tesvik.muayeneAzamiOran, PARAMETRE.tesvik.muayeneAzamiOran * basariOrani)
      : 0;
    return {
      hedef,
      ortalamaMuayene,
      basariOrani,
      hakEdisOrani,
      tutar: tavan * hakEdisOrani
    };
  }

  function performansKesintiOraniHesapla(basariYuzdesi) {
    if (basariYuzdesi > 98) return 0;
    if (basariYuzdesi > 96) return 0.02;
    if (basariYuzdesi > 94) return 0.04;
    if (basariYuzdesi > 89) return 0.06;
    if (basariYuzdesi > 85) return 0.08;
    return 0.10;
  }

  function performansKesintiHesapla(veri, kesintiMatrahi) {
    const kategoriler = [
      ['asi', 'Aşı'],
      ['bebek', 'Bebek izlem'],
      ['cocuk', 'Çocuk izlem'],
      ['gebe', 'Gebe izlem'],
      ['lohusa', 'Lohusa izlem']
    ];

    const detay = kategoriler.map(([anahtar, etiket]) => {
      const gereken = Math.max(0, sayi(veri, `perf${anahtar}Gereken`));
      const yapilan = Math.max(0, sayi(veri, `perf${anahtar}Yapilan`));
      const basariYuzdesi = gereken > 0 ? Math.min(100, (yapilan / gereken) * 100) : 100;
      const oran = gereken > 0 ? performansKesintiOraniHesapla(basariYuzdesi) : 0;
      return {
        anahtar,
        etiket,
        gereken,
        yapilan,
        basariYuzdesi,
        oran,
        tutar: kesintiMatrahi * oran
      };
    });

    const manuelOran = Math.max(0, sayi(veri, 'performansKesintiOrani') / 100);
    const manuelTutar = kesintiMatrahi * manuelOran;
    const otomatikOran = detay.reduce((toplam, item) => toplam + item.oran, 0);
    const otomatikTutar = detay.reduce((toplam, item) => toplam + item.tutar, 0);
    const azamiTutar = kesintiMatrahi * 0.20;
    const toplamTutar = Math.min(azamiTutar, otomatikTutar + manuelTutar);
    return {
      detay,
      otomatikOran,
      manuelOran,
      manuelTutar,
      azamiTutar,
      toplamTutar,
      toplamOran: kesintiMatrahi > 0 ? toplamTutar / kesintiMatrahi : 0
    };
  }

  function izinKesintiHesapla(veri, izinKesintiMatrahi) {
    const durum = String(veri.get('izinDurumu') || 'yok');
    const izinAyGunSayisi = ayGunSayisi(veri);
    const gun = Math.min(izinAyGunSayisi, Math.max(0, sayi(veri, 'izinGun')));
    const manuel = sayi(veri, 'izinRaporKesinti');
    const izinKesintiOrani = durum === 'vekaletsiz' ? 0.5 : (durum === 'rapor' ? 1 : 0);
    const otomatik = izinKesintiOrani > 0 ? (izinKesintiMatrahi * izinKesintiOrani / izinAyGunSayisi) * gun : 0;
    return {
      durum,
      gun,
      izinAyGunSayisi,
      manuel,
      izinKesintiMatrahi,
      izinKesintiOrani,
      otomatik,
      tutar: manuel > 0 ? manuel : otomatik
    };
  }

  function hesapla(secenekler = {}) {
    const veri = new FormData(form);
    if (Number.isFinite(secenekler.hesapAy)) veri.set('hesapAy', String(secenekler.hesapAy));
    if (Number.isFinite(secenekler.hesapYil)) veri.set('hesapYil', String(secenekler.hesapYil));
    const zamOrani = tahminiZamOrani(veri);
    const tavanBaz = Math.max(0, sayi(veri, 'tavanUcret'));
    const tavan = tavanBaz * zamCarpani(zamOrani);
    const nufus = nufusPuaniHesapla(veri, secenekler);
    const rawHypKatsayi = Number.isFinite(secenekler.hypKatsayi) ? secenekler.hypKatsayi : (sayi(veri, 'hypKatsayi') || 1);
    const hypKatsayi = kisitla(rawHypKatsayi, 0, 2);
    const hypKatsayiTavani = hypKatsayiTavaniniHesapla(nufus, veri);
    const kabulEdilenHypKatsayi = hypKatsayiKabulDegeri(rawHypKatsayi, nufus, veri);
    const maasaEsasPuanHam = Number.isFinite(secenekler.maasaEsasPuan)
      ? Math.max(0, secenekler.maasaEsasPuan)
      : (nufus.mod === 'manuel' ? (nufus.hypUygula ? nufus.araPuan * kabulEdilenHypKatsayi : nufus.araPuan) : nufus.araPuan * kabulEdilenHypKatsayi);
    const entegreNobet = entegreTutulmayanNobetUygula(veri, maasaEsasPuanHam);
    const maasaEsasPuan = entegreNobet.maasaEsasPuan;
    const temel = temelUcretHesapla(veri, maasaEsasPuan, tavan);

    const sosyo = sayi(veri, 'odemeGosterge') * tavan * 0.174;
    const sagp = sayi(veri, 'sagp') || 1;
    const asmOran = sayi(veri, 'asmGrubu');
    const asmTemel = tavan * sagp * 0.50;
    const asmGrup = tavan * sagp * asmOran;
    const geziciKm = sayi(veri, 'geziciKm') * tavan * 0.0005;
    const geziciNufus = sayi(veri, 'geziciNufus') * tavan * 0.000075;
    const geziciToplam = geziciKm + geziciNufus;
    const sgkOrani = sayi(veri, 'sgkOrani');
    const damgaOrani = sayi(veri, 'damgaOrani');
    const asgariBrut = sayi(veri, 'asgariBrut');
    const gvIstisna = sayi(veri, 'gvIstisna') || vergiHesapla(asgariBrut * Math.max(0, 1 - sgkOrani));
    const dvIstisna = sayi(veri, 'dvIstisna') || asgariBrut * damgaOrani;

    const khtOrani = Number.isFinite(secenekler.khtOrani) ? Math.max(0, secenekler.khtOrani) : sayi(veri, 'khtOrani');
    const kht = tavan * khtOrani;
    const basvuru = tavan * sayi(veri, 'basvuruOrani');
    const destek = tavan * sayi(veri, 'destekOrani');
    const muayeneDetay = muayeneTesvikHesapla(veri, tavan);
    const muayene = muayeneDetay.tutar;
    const recete = tavan * sayi(veri, 'akilciIlacOrani');
    const memnuniyet = tavan * sayi(veri, 'memnuniyetOrani');
    const digerEk = sayi(veri, 'digerEkOdeme');
    const ilaveOdeme = sayi(veri, 'ilaveOdeme');
    const ekTabanAylik = sayi(veri, 'ekTabanAylik');
    const gccGun = sayi(veri, 'gccKisiBasi');
    const gccKisiBasi = Math.max(0, gccGun) * tavan / 30;
    const manuelGunlukCalismaBrut = sayi(veri, 'gunlukCalismaBrut');
    const vekaletUcreti = sayi(veri, 'vekaletUcreti');
    const gorev = sayi(veri, 'gorevlendirme');
    const sendika = sendikaHesapla(veri);
    const tesvikToplam = kht + basvuru + muayene + recete + memnuniyet;

    const ilaveEkToplam = ilaveOdeme + ekTabanAylik + gccKisiBasi + vekaletUcreti;
    const gunlukCalismaBrut = manuelGunlukCalismaBrut || (temel.toplam + destek + tesvikToplam + digerEk + gorev + gccKisiBasi + vekaletUcreti);
    const izinKesintiMatrahi = manuelGunlukCalismaBrut || temel.toplam;
    const izinDetay = secenekler.izinYok
      ? { durum: 'yok', gun: 0, izinAyGunSayisi: ayGunSayisi(veri), manuel: 0, izinKesintiMatrahi, izinKesintiOrani: 0, otomatik: 0, tutar: 0 }
      : izinKesintiHesapla(veri, izinKesintiMatrahi);
    const izinRaporKesinti = izinDetay.tutar;
    const hesabaEsasBrut = Math.max(0, gunlukCalismaBrut - izinRaporKesinti);
    const gelirVergiliBrut = hesabaEsasBrut + ekTabanAylik + sendika.odenek;
    const sabitEkGelirToplam = ilaveOdeme + ekTabanAylik + sendika.odenek;
    const cariGiderBrut = asmTemel + asmGrup + geziciToplam;
    const devletPayiGelir = 0;
    const maasBrutToplam = hesabaEsasBrut + sosyo + ilaveOdeme + ekTabanAylik + sendika.odenek;
    // Sendika ödeneği ile kesintisi eşit (üyelikte birebir aynı tutar) → net etki SIFIR olmalı.
    // Ödeneği damga matrahına, kesintiyi gelir vergisi matrahına asimetrik koymak hayalî
    // ~200 TL artış yaratıyordu; her ikisini de vergi matrahından çıkarıp çifti tam nötrledik.
    const damgaMatrahi = gunlukCalismaBrut + ilaveOdeme + ekTabanAylik + geziciToplam + sosyo;
    const sgkMatrahi = sgkMatrahiHesapla(veri, zamOrani);
    const sgkEmekliSandigiOrani = PARAMETRE.sgkOranlari.emekliSandigi;
    const sgkSspOrani = sgkOrani > 0
      ? Math.max(0, sgkOrani - sgkEmekliSandigiOrani)
      : PARAMETRE.sgkOranlari.ssp;
    const sgkEmekliSandigi = Math.max(0, sgkMatrahi * sgkEmekliSandigiOrani);
    const sgkSsp = Math.max(0, sgkMatrahi * sgkSspOrani);
    const sgkDevletEmekliSandigi = Math.max(0, sgkMatrahi * PARAMETRE.sgkOranlari.devletEmekliSandigi);
    const sgkDevletSsp = Math.max(0, sgkMatrahi * PARAMETRE.sgkOranlari.devletSsp);
    const sgk = sgkEmekliSandigi + sgkSsp;
    const otomatikMatrah = Math.max(0, hesabaEsasBrut + ekTabanAylik - sgk - sayi(veri, 'ozelSigorta'));
    const manuelMatrah = String(veri.get('manuelMatrah') || '').trim();
    const aylikMatrah = manuelMatrah ? Math.max(0, sayi(veri, 'manuelMatrah')) : otomatikMatrah;
    const oncekiAylarMatrahi = Math.max(0, otomatikMatrah + izinRaporKesinti);
    const kumulatifMatrah = gelirVergisiBaslangicMatrahi(veri, aylikMatrah, otomatikMatrah, oncekiAylarMatrahi);
    const aralikVergisiOcakAktarimi = aralikVergisiOcakAktarimiMi(veri);
    const ayItibariyleKumulatifMatrah = ayItibariyleKumulatifMatrahGirildiMi(veri) && !String(veri.get('kumulatifMatrah') || '').trim() && !aralikVergisiOcakAktarimi;
    const ocakOncekiAralikMatrahi = kisitla(Math.floor(sayi(veri, 'hesapAy') || 1), 1, 12) === 1 && !String(veri.get('kumulatifMatrah') || '').trim() && !ayItibariyleKumulatifMatrah;
    const gelirVergisiDetay = aylikGelirVergisiDetay(kumulatifMatrah, aylikMatrah, gvIstisna);
    const gelirVergisi = gelirVergisiDetay.net;
    const damga = Math.max(0, damgaMatrahi * damgaOrani - dvIstisna);
    const performansDetay = performansKesintiHesapla(veri, hesabaEsasBrut);
    const performansKesinti = performansDetay.toplamTutar;
    const aylikKesinti = sayi(veri, 'aylikKesinti');
    const fiiliGider = sayi(veri, 'fiiliGider');
    const zorunluBesKesinti = sayi(veri, 'zorunluBesKesinti');
    const besKesinti = sayi(veri, 'besKesinti');
    const icraKesinti = sayi(veri, 'icraKesinti');
    const nafakaKesinti = sayi(veri, 'nafakaKesinti');
    const lojmanKesinti = sayi(veri, 'lojmanKesinti');
    const vergiBorcuKesinti = sayi(veri, 'vergiBorcuKesinti');
    const anaMaasKesintileri = zorunluBesKesinti + besKesinti + icraKesinti + nafakaKesinti + vergiBorcuKesinti;
    const cariGiderKesintileri = aylikKesinti + fiiliGider + lojmanKesinti;
    const netCariGider = Math.max(0, cariGiderBrut - cariGiderKesintileri);
    const digerKesintiler = anaMaasKesintileri;
    const kesintiToplam = sgk + gelirVergisi + damga + performansKesinti + sendika.kesinti + anaMaasKesintileri;
    const toplamGelir = maasBrutToplam + cariGiderBrut;
    const netMaas = maasBrutToplam - kesintiToplam;
    const toplamHakEdis = netMaas + netCariGider;
    const izinYokHesap = !secenekler.izinYok && izinRaporKesinti > 0 ? hesapla({ ...secenekler, izinYok: true }) : null;
    const netIzinKesintisi = izinYokHesap ? Math.max(0, izinYokHesap.netMaas - netMaas) : 0;
    const gelmeyenNufusYokHesap = !secenekler.gelmeyenNufusYok && nufus.gelmeyenEtkiPuan > 0
      ? hesapla({ ...secenekler, gelmeyenNufusYok: true })
      : null;
    const netGelmeyenNufusKesintisi = gelmeyenNufusYokHesap ? Math.max(0, gelmeyenNufusYokHesap.netMaas - netMaas) : 0;

    return {
      tavan,
      tavanBaz,
      zamOrani,
      nufus,
      hypKatsayi,
      hypKatsayiTavani,
      kabulEdilenHypKatsayi,
      entegreNobet,
      maasaEsasPuan,
      temel,
      sosyo,
      asmTemel,
      asmGrup,
      geziciToplam,
      cariGiderBrut,
      cariGiderKesintileri,
      netCariGider,
      maasBrutToplam,
      kht,
      basvuru,
      destek,
      muayene,
      muayeneDetay,
      recete,
      memnuniyet,
      tesvikToplam,
      digerEk,
      ilaveOdeme,
      ekTabanAylik,
      gccKisiBasi,
      gccGun,
      gunlukCalismaBrut,
      izinKesintiMatrahi,
      hesabaEsasBrut,
      izinRaporKesinti,
      netIzinKesintisi,
      netGelmeyenNufusKesintisi,
      izinDetay,
      vekaletUcreti,
      ilaveEkToplam,
      gorev,
      sendika,
      gelirVergiliBrut,
      sabitEkGelirToplam,
      devletPayiGelir,
      toplamGelir,
      toplamHakEdis,
      sgkMatrahi,
      sgkEmekliSandigiOrani,
      sgkSspOrani,
      sgkEmekliSandigi,
      sgkSsp,
      sgkDevletEmekliSandigi,
      sgkDevletSsp,
      sgk,
      otomatikMatrah,
      aylikMatrah,
      kumulatifMatrah,
      aralikVergisiOcakAktarimi,
      ocakOncekiAralikMatrahi,
      ayItibariyleKumulatifMatrah,
      gelirVergisiDetay,
      gelirVergisi,
      damgaMatrahi,
      damga,
      performansDetay,
      performansKesinti,
      aylikKesinti,
      fiiliGider,
      zorunluBesKesinti,
      besKesinti,
      icraKesinti,
      nafakaKesinti,
      lojmanKesinti,
      vergiBorcuKesinti,
      anaMaasKesintileri,
      digerKesintiler,
      kesintiToplam,
      netMaas
    };
  }

  function ozetKarti(etiket, deger, alt) {
    return `<article><span>${etiket}</span><strong>${deger}</strong>${alt ? `<small>${alt}</small>` : ''}</article>`;
  }

  function satir(ad, deger, not) {
    return `<tr><td>${ad}</td><td>${para(deger)}</td></tr>`;
  }

  function satirMetin(ad, deger, not) {
    return `<tr><td>${ad}</td><td>${deger}</td><td>${not || ''}</td></tr>`;
  }

  function toplamSatir(ad, deger, not) {
    return `<tr class="maas-toplam-satir"><td>${ad}</td><td>${para(deger)}</td></tr>`;
  }

  function yuzdeSatir(ad, deger, oran, not) {
    return `<tr><td>${ad}</td><td>${deger}</td><td>${yuzde(oran)}</td><td>${not || ''}</td></tr>`;
  }

  function vergiDilimiMetni(detay) {
    if (!detay.dilimler.length) return 'Vergi oluşmadı';
    const enYuksekOran = detay.dilimler.reduce((enYuksek, satir) => (
      Math.max(enYuksek, Number(satir.oran) || 0)
    ), 0);
    return `Diliminiz: ${yuzde(enYuksekOran)}`;
  }


  function gelirVergisiSatirNotu(h) {
    const dilimMetni = vergiDilimiMetni(h.gelirVergisiDetay);
    const aralikNotu = h.aralikVergisiOcakAktarimi ? '; Aralık ödemesi Ocak vergisi gibi yeni yıl diliminden başlatıldı' : '';
    const ocakNotu = h.ocakOncekiAralikMatrahi ? '; Ocak hesabı geçen yıldan gelen teorik Aralık matrahıyla başlatıldı' : '';
    const ayItibariyleNot = h.ayItibariyleKumulatifMatrah ? '; Ay sonu kümülatif referansından yürütüldü' : '';
    return `${dilimMetni}; Aylık matrah: ${para(h.aylikMatrah)}; Ham: ${para(h.gelirVergisiDetay.ham)}; istisna: ${para(h.gelirVergisiDetay.istisna)}${aralikNotu}${ocakNotu}${ayItibariyleNot}`;
  }

  function render() {
    hesabaEsasNufusPuaniAlaniniGuncelle();
    const h = hesapla();
    try {
      localStorage.setItem(SONUC_KAYIT_ANAHTARI, JSON.stringify({
        netMaas: h.netMaas,
        cariGiderBrut: h.cariGiderBrut,
        netCariGider: h.netCariGider,
        guncellenme: Date.now()
      }));
    } catch (_) {}
    if (ustNet) ustNet.textContent = para(h.netMaas);
    if (ustCari) ustCari.textContent = para(h.netCariGider);
    if (ustToplam) ustToplam.textContent = para(h.toplamHakEdis);
    if (ustVergiDilimi) ustVergiDilimi.textContent = vergiDilimiMetni(h.gelirVergisiDetay).replace('Diliminiz: ', '');
    const hypKatsayiKabulEdilenEl = form.elements?.hypKatsayiKabulEdilen;
    const hypKatsayiBilgiEl = $('.maas-hyp-katsayi-bilgi');
    if (hypKatsayiKabulEdilenEl) hypKatsayiKabulEdilenEl.value = h.kabulEdilenHypKatsayi.toFixed(4);
    if (hypKatsayiBilgiEl) {
      hypKatsayiBilgiEl.textContent = `Kullanılabilecek aralık: 0,9000 - ${h.hypKatsayiTavani.toFixed(4)}. Maaş hesabında ${h.kabulEdilenHypKatsayi.toFixed(4)} kabul edildi.`;
    }
    const nufusBilgiEl = document.getElementById('maasManuelPuanBilgi');
    const detayliNufusPuaniSonucEl = form.elements?.detayliNufusPuaniSonuc;
    if (detayliNufusPuaniSonucEl && h.nufus.mod !== 'manuel') {
      detayliNufusPuaniSonucEl.value = h.nufus.detayZorunluEksik
        ? 'Detay girilmeli'
        : h.nufus.araPuan.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    }
    if (nufusBilgiEl) {
      const manuelPuanEl = form.elements?.manuelNufusPuani;
      const manuelPuanAktif = Math.max(0, sayi(new FormData(form), 'manuelNufusPuani')) > 0;
      if (h.nufus.detayZorunluEksik) {
        nufusBilgiEl.hidden = false;
        nufusBilgiEl.innerHTML = '<span>Detaylı nüfus grupları gerekli</span><small>Detaylı nüfus modu seçili. Hesap için detaylı nüfus gruplarını doldurun.</small>';
      } else if (h.nufus.tahminiPuan > 0 && !manuelPuanAktif) {
        nufusBilgiEl.hidden = true;
        nufusBilgiEl.textContent = '';
      } else if (!manuelPuanAktif) {
        nufusBilgiEl.hidden = true;
        nufusBilgiEl.textContent = '';
      } else if (manuelPuanEl) {
        manuelPuanOncelikDurumunuUygula();
      }
    }
    if (izinNetBilgi) {
      const kesintiVar = h.netIzinKesintisi > 0.005;
      izinNetBilgi.hidden = !kesintiVar;
      izinNetBilgi.innerHTML = kesintiVar
        ? `<span>Net izin kesintisi</span><strong>${para(h.netIzinKesintisi)}</strong><small>Brüt kesinti ${para(h.izinRaporKesinti)}; ${h.izinDetay.gun.toLocaleString('tr-TR')}/${h.izinDetay.izinAyGunSayisi} gün</small>`
        : '';
    }

    ozet.innerHTML = [
      ozetKarti('Net maaş', para(h.netMaas), 'Ana brüt - kesinti'),
      ozetKarti('Cari gider', para(h.netCariGider), h.cariGiderKesintileri > 0 ? 'Gider kesintisi sonrası' : 'Ayrı ödeme'),
      ozetKarti('Toplam hakediş', para(h.toplamHakEdis), 'Net maaş + net cari gider'),
      ozetKarti('Vergi dilimi', vergiDilimiMetni(h.gelirVergisiDetay).replace('Diliminiz: ', ''), `Aylık matrah: ${para(h.aylikMatrah)}`)
    ].join('');
    const netMaasOzetAlt = ozet.querySelector('article:first-child small');
    if (netMaasOzetAlt) {
      netMaasOzetAlt.textContent = h.netGelmeyenNufusKesintisi > 0
        ? `Gelmeyen nüfus net etkisi: -${para(h.netGelmeyenNufusKesintisi)}`
        : '';
      netMaasOzetAlt.hidden = !netMaasOzetAlt.textContent;
    }

    const nufusSatirlari = h.nufus.satirlar.map(s => (
      `<tr><td>${s.etiket}</td><td>${s.adet.toLocaleString('tr-TR')}</td><td>${s.gelmeyen.toLocaleString('tr-TR')}</td><td>${s.sayilan.toLocaleString('tr-TR')}</td><td>${s.katsayi}</td><td>${s.puan.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td></tr>`
    )).join('');
    const vergiDilimiSatirlari = h.gelirVergisiDetay.dilimler.map(s => (
      yuzdeSatir(`${para(s.alt)} - ${s.ust === Infinity ? 'üstü' : para(s.ust)}`, para(s.tutar), s.oran, `${para(s.vergi)} vergi`)
    )).join('');
    const performansSatirlari = h.performansDetay.detay.map(s => (
      `<tr><td>${s.etiket}</td><td>${s.gereken.toLocaleString('tr-TR')}</td><td>${s.yapilan.toLocaleString('tr-TR')}</td><td>${s.basariYuzdesi.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}%</td><td>${yuzde(s.oran)}</td><td>${para(s.tutar)}</td></tr>`
    )).join('');
    const entegreNobetNotu = h.entegreNobet.saat > 0
      ? ` Entegre tutulmayan nöbet ${h.entegreNobet.saat} saat: hesaba esas puan ${h.entegreNobet.oncekiPuan.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} × ${h.entegreNobet.carpan.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} = ${h.maasaEsasPuan.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}; 1000 puanın altına düşürülmez.`
      : '';

    dokum.innerHTML = `
      <div class="maas-dokum-grid">
        <div class="maas-tablo-kutu">
          <h3>Gelir</h3>
          <table>
            <tbody>
              ${satir(`İlk ${h.temel.ilkPuan} puan`, h.temel.ilkOdeme, yuzde(h.temel.ilkOran))}
              ${satir('Zamlı tavan ücret', h.tavan, `Baz: ${para(h.tavanBaz)}; zam: ${yuzde(h.zamOrani / 100)}`)}
              ${satir('Fazla puan ödemesi', h.temel.fazlaOdeme, `${h.temel.fazlaPuan.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} puan`)}
              ${satir('Destek ödemesi', h.destek, 'Tavan ücretin %42 oranı')}
              ${satir('KHT teşvik', h.kht, 'Tavan ücret oranı')}
              ${satir('Baçvuru teşvik', h.basvuru, 'Tavan ücret oranı')}
              ${satir('Muayene teşvik', h.muayene, `${yuzde(h.muayeneDetay.hakEdisOrani)} hakediş`)}
              ${satir('Akılcı ilaç + memnuniyet', h.recete + h.memnuniyet, 'Tavan ücret oranı')}
              ${satir('Sosyoekonomik Ödeme', h.sosyo, 'Ödeme göstergesi × tavan × %17,4')}
              ${satir('İlave Ödeme', h.ilaveOdeme, 'Ana brüt toplamına eklendi')}
              ${satir('Ek taban aylık', h.ekTabanAylik, 'Ana brüt toplamına eklendi')}
              ${satir('GCC kişi başı ücret', h.gccKisiBasi, `${h.gccGun.toLocaleString('tr-TR')} gün × tavan / 30`)}
              ${satir('Günlük çalışma brüt', h.gunlukCalismaBrut, 'Performans/izin öncesi brüt')}
              ${satir('Vekalet ücreti', h.vekaletUcreti, 'Elle girilen brüt')}
              ${satir('İzin/rapor kesintisi', -h.izinRaporKesinti, h.izinDetay.manuel > 0 ? 'Manuel girildi' : (h.izinDetay.durum === 'vekaletsiz' ? `Vekaletsiz izin: temel matrahın %50'si; ${h.izinDetay.gun.toLocaleString('tr-TR')}/${h.izinDetay.izinAyGunSayisi} gün; matrah ${para(h.izinKesintiMatrahi)}` : `${h.izinDetay.gun.toLocaleString('tr-TR')}/${h.izinDetay.izinAyGunSayisi} gün; ${h.izinDetay.durum}; matrah ${para(h.izinKesintiMatrahi)}`))}
              ${satir('Hesaba esas brüt', h.hesabaEsasBrut, 'Günlük brüt - izin/rapor')}
              ${satir('%12 Em. San. (Devlet payı)', h.sgkDevletEmekliSandigi, 'Bilgi amaçlı; net maaşa eklenmez')}
              ${satir('%7,5 SSP (Devlet payı)', h.sgkDevletSsp, 'Bilgi amaçlı; net maaşa eklenmez')}
              ${satir('Sendika Ödeneği', h.sendika.odenek, h.sendika.uye ? 'Ana brüt/net hesabına eklendi' : 'Yok')}
              ${satir('Diğer/görevlendirme', h.digerEk + h.gorev, 'Elle girilen brüt ekler')}
              ${toplamSatir('Ana maaş brüt toplamı', h.maasBrutToplam, 'Net hesabında kullanılan brüt')}
            </tbody>
          </table>
        </div>
        <div class="maas-tablo-kutu">
          <h3>Gider / kesinti</h3>
          <table>
            <tbody>
              ${satir('ASM gider ödemesi', h.asmTemel + h.asmGrup, 'Ana maaştan ayrı cari gelir')}
              ${satir('Gezici hizmet', h.geziciToplam, 'Cari gider tarafında izlenir')}
              ${satir(`${yuzde(h.sgkEmekliSandigiOrani)} Em. San.`, h.sgkEmekliSandigi, `Zamlı matrah: ${para(h.sgkMatrahi)}`)}
              ${satir(`${yuzde(h.sgkSspOrani)} SSP`, h.sgkSsp, `Zamlı matrah: ${para(h.sgkMatrahi)}`)}
              ${satir('Gelir vergisi', h.gelirVergisi, gelirVergisiSatirNotu(h))}
              ${satir('Damga vergisi', h.damga, `Matrah: ${para(h.damgaMatrahi)}; cari gider hariç`)}
              ${satir('Performans kesintisi', h.performansKesinti, `${yuzde(h.performansDetay.toplamOran)}; azami ${para(h.performansDetay.azamiTutar)}`)}
              ${satir('Sendika kesintisi', h.sendika.kesinti, h.sendika.uye ? 'Üyelik kesintisi' : 'Yok')}
              ${satir('ASM kirası/gider kesintisi', h.fiiliGider, 'Cari giderden ayrı izlenen gider')}
              ${satir('Zorunlu BES kesintisi', h.zorunluBesKesinti, 'Elle girilen')}
              ${satir('BES kesintisi', h.besKesinti, 'Elle girilen')}
              ${satir('İcra', h.icraKesinti, 'Elle girilen')}
              ${satir('Nafaka', h.nafakaKesinti, 'Elle girilen')}
              ${satir('Lojman/ASM kirası', h.lojmanKesinti, 'Cari giderden düşülür')}
              ${satir('Kişi vergi borcu', h.vergiBorcuKesinti, 'Elle girilen')}
              ${satir('Diğer aylık kesinti', h.aylikKesinti, 'Cari giderden düşülür')}
              ${satir('Net cari gider', h.netCariGider, `Brüt cari gider ${para(h.cariGiderBrut)} - gider kesintileri ${para(h.cariGiderKesintileri)}`)}
              ${satir('Kesintiler toplamı', h.kesintiToplam, '')}
              ${toplamSatir('Net maaş sonucu', h.netMaas, 'Ana maaş brüt toplamı - kesintiler')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="maas-dokum-grid maas-dokum-grid-vergi">
        <div class="maas-tablo-kutu">
          <h3>Vergi Dilimi</h3>
          <table>
            <thead><tr><th>Dilim</th><th>Bu ay düşen matrah</th><th>Oran</th><th>Vergi</th></tr></thead>
            <tbody>
              ${vergiDilimiSatirlari || '<tr><td colspan="4">Vergi matrahı oluşmadı.</td></tr>'}
            </tbody>
          </table>
          <p class="maas-dokum-not">${h.aralikVergisiOcakAktarimi ? 'Aralık hakedişi Ocak ayında yatacağı için gelir vergisi yeni yıl başlangıcı gibi 0 kümülatif matrahla hesaplanır.' : (h.ocakOncekiAralikMatrahi ? `Ocak hesabında geçen yıldan gelen Aralık ödemesi varsayımıyla teorik başlangıç matrahı ${para(h.kumulatifMatrah)} alınır; bu ay ${para(h.aylikMatrah)} eklenir.` : (h.ayItibariyleKumulatifMatrah ? `Seçilen ay sonu kümülatif matrah referans alınarak bu ayın başlangıç matrahı ${para(h.kumulatifMatrah)} hesaplandı; bu ay ${para(h.aylikMatrah)} eklenir.` : `Kümülatif önceki matrah ${para(h.kumulatifMatrah)} üzerine bu ay ${para(h.aylikMatrah)} eklenerek dilimler arası geçiş gösterilir.`))}</p>
        </div>
      </div>
      <div class="maas-dokum-kontrol-grid">
        <details class="maas-tablo-kutu maas-acilir-kutu">
          <summary>Muayene hedefi kontrolü</summary>
          <table>
            <tbody>
              ${satirMetin('Muayene hedefi (MH)', h.muayeneDetay.hedef.toLocaleString('tr-TR', { maximumFractionDigits: 2 }), 'Günlük hedef')}
              ${satirMetin('Ortalama muayene', h.muayeneDetay.ortalamaMuayene.toLocaleString('tr-TR', { maximumFractionDigits: 2 }), 'Günlük ortalama')}
              ${satirMetin('Ortalama/hedef başarı oranı', yuzde(h.muayeneDetay.basariOrani), '%50 altı ödeme üretmez')}
              ${satirMetin('Muayene hakediş oranı', yuzde(h.muayeneDetay.hakEdisOrani), 'Azami %44,1')}
            </tbody>
          </table>
        </details>
        <details class="maas-tablo-kutu maas-acilir-kutu">
          <summary>Performans kesinti kontrolü</summary>
          <table>
            <thead><tr><th>Alan</th><th>Gereken</th><th>Yapılan</th><th>Başarı</th><th>Kesinti</th><th>Tutar</th></tr></thead>
            <tbody>
              ${performansSatirlari}
              ${h.performansDetay.manuelOran > 0 ? `<tr><td>Manuel ek kesinti</td><td>-</td><td>-</td><td>-</td><td>${yuzde(h.performansDetay.manuelOran)}</td><td>${para(h.performansDetay.manuelTutar)}</td></tr>` : ''}
            </tbody>
          </table>
          <p class="maas-dokum-not">Kesinti matrahı hesaba esas brüttür; toplam kesinti yönetmelikteki %20 tavanını aşamaz.</p>
        </details>
      </div>
      <details class="maas-tablo-kutu maas-acilir-kutu">
        <summary>Nüfus puanı kontrolü</summary>
        <table>
          <thead><tr><th>Grup</th><th>Girilen</th><th>Gelmeyen</th><th>Sayılmış</th><th>Katsayı</th><th>Puan</th></tr></thead>
          <tbody>${nufusSatirlari}</tbody>
        </table>
        <p class="maas-dokum-not">${h.nufus.mod === 'manuel' ? 'KONAHED mantığıyla bordrodaki maaşa esas puan HYP hesaplanmış puandır; bu modda HYP katsayısı ikinci kez uygulanmaz.' : `Toplam nüfus ${h.nufus.toplamNufus.toLocaleString('tr-TR')}; ${h.nufus.limit.toLocaleString('tr-TR')} kişi sınırı sonrası dışarıda kalan nüfus ${h.nufus.asilanNufus.toLocaleString('tr-TR')}. Detaylı gruplarda gelmeyen kişi girilirse her biri katsayının yarısı kadar düşülür.`}${entegreNobetNotu}</p>
      </details>
    `;
  }

  if (!form) return;

  function ilIlceSecimleriniHazirla() {
    const ilSelect = $('#calisilanIl');
    const ilceSelect = $('#calisilanIlce');
    const iller = PARAMETRE.ilceParametreleri.iller || {};
    if (!ilSelect || !ilceSelect || !Object.keys(iller).length) return;
    const mevcutIl = ilSelect.value || 'Ankara';
    ilSelect.innerHTML = '<option value="">İl seçiniz</option>' + Object.keys(iller)
      .sort((a, b) => a.localeCompare(b, 'tr'))
      .map(il => `<option value="${il}">${il}</option>`)
      .join('');
    ilSelect.value = iller[mevcutIl] ? mevcutIl : 'Ankara';
    ilceSecimleriniGuncelle();
  }

  function ilceSecimleriniGuncelle() {
    const ilSelect = $('#calisilanIl');
    const ilceSelect = $('#calisilanIlce');
    const iller = PARAMETRE.ilceParametreleri.iller || {};
    const il = ilSelect?.value;
    if (!ilSelect || !ilceSelect || !il || !iller[il]) return;
    const mevcutIlce = ilceSelect.value || (il === 'Ankara' ? 'Mamak' : (il === 'Konya' ? 'Karatay' : ''));
    const ilceler = iller[il].ilceler || [];
    ilceSelect.innerHTML = '<option value="">İlçe seçiniz</option>' + ilceler
      .map(ilce => `<option value="${ilce.ad}">${ilce.ad}</option>`)
      .join('');
    ilceSelect.value = ilceler.some(ilce => ilce.ad === mevcutIlce)
      ? mevcutIlce
      : (ilceler[0]?.ad || '');
  }

  function ilceParametreleriniUygula() {
    const veri = new FormData(form);
    const il = String(veri.get('calisilanIl') || '');
    const ilce = String(veri.get('calisilanIlce') || '');
    const ilParametre = PARAMETRE.ilceParametreleri.iller?.[il];
    const ilceParametre = ilParametre?.ilceler?.find(item => item.ad === ilce);
    if (!ilParametre || !ilceParametre) return;
    const odemeGostergeEl = form.elements?.odemeGosterge;
    const sagpEl = form.elements?.sagp;
    if (odemeGostergeEl && document.activeElement !== odemeGostergeEl) odemeGostergeEl.value = String(ilceParametre.gosterge);
    if (sagpEl && document.activeElement !== sagpEl) sagpEl.value = String(ilParametre.parite);
  }

  function hesabaEsasNufusPuaniBilgisi(veri = new FormData(form)) {
    const hamPuan = Math.max(0, sayi(veri, 'hamNufusPuani'));
    const gelmeyenPuan = Math.max(0, sayi(veri, 'gelmeyenNufusPuani'));
    const toplamNufus = Math.max(0, Math.floor(sayi(veri, 'manuelToplamNufus')));
    if (hamPuan > 0) {
      return {
        puan: Math.max(0, hamPuan - gelmeyenPuan),
        tahmini: false,
        kaynak: 'nufus-puani'
      };
    }
    if (toplamNufus > 0) {
      return {
        puan: toplamNufus * TAHMINI_NUFUS_PUANI_CARPANI,
        tahmini: true,
        kaynak: 'nufus-tahmini'
      };
    }
    return { puan: 0, tahmini: false, kaynak: '' };
  }

  function hesabaEsasNufusPuaniAlaniniGuncelle() {
    if (!form) return { puan: 0, tahmini: false, kaynak: '' };
    const bilgi = hesabaEsasNufusPuaniBilgisi(new FormData(form));
    const alan = form.elements?.hesabaEsasNufusPuani;
    const tahminAlan = form.elements?.hesabaEsasNufusPuaniTahmini;
    const uyari = document.getElementById('maasHesabaEsasTahminUyari');
    if (alan) {
      alan.value = bilgi.puan > 0
        ? bilgi.puan.toFixed(2).replace(/\.00$/, '')
        : '';
    }
    if (tahminAlan) tahminAlan.value = bilgi.tahmini ? '1' : '0';
    if (uyari) uyari.hidden = !bilgi.tahmini;
    return bilgi;
  }

  function manuelNufusModunuUygula() {
    if (!form) return;
    const puanEl = form.elements?.manuelNufusPuani;
    const modEl = form.elements?.nufusPuaniModu;
    if (!puanEl || !modEl) return;
    const ham = String(puanEl.value || '').replace(',', '.').trim();
    const deger = Number(ham);
    if (ham !== '' && Number.isFinite(deger) && deger > 0) {
      modEl.value = 'manuel';
    }
  }

  function manuelPuanOncelikDurumunuUygula() {
    if (!form) return;
    const manuelEl = form.elements?.manuelNufusPuani;
    const hamEl = form.elements?.hamNufusPuani;
    const gelmeyenEl = form.elements?.gelmeyenNufusPuani;
    const hypEl = form.elements?.hypKatsayi;
    const hypCanliEl = form.elements?.hypKatsayiCanliCek;
    const bilgiEl = document.getElementById('maasManuelPuanBilgi');
    if (!manuelEl || !hamEl || !gelmeyenEl || !hypEl || !hypCanliEl || !bilgiEl) return;
    const ham = String(manuelEl.value || '').replace(',', '.').trim();
    const deger = Number(ham);
    const manuelPuanAktif = ham !== '' && Number.isFinite(deger) && deger > 0;

    hypEl.disabled = manuelPuanAktif;
    hypCanliEl.disabled = manuelPuanAktif;

    if (manuelPuanAktif) {
      clearInterval(hypKatsayiCanliTimer);
      hypKatsayiCanliTimer = null;
      hypEl.readOnly = true;
      bilgiEl.hidden = false;
      bilgiEl.innerHTML = '<span>HYP dahil hesaba esas puan kullanılıyor</span><small>Bu alan dolu olduğu için HYP katsayısı ikinci kez uygulanmaz. Bordroda görünen nihai puan esas alınır.</small>';
      return;
    }

    bilgiEl.hidden = true;
    bilgiEl.textContent = '';
    hypKatsayiCanliCekDurumunuUygula();
  }

  function nufusPuaniModuGorunumunuUygula() {
    if (!form) return;
    const modEl = form.elements?.nufusPuaniModu;
    if (!modEl) return;
    const manuelAlanlar = form.querySelectorAll('[data-manuel-nufus-alani="1"]');
    const detaySonucAlanlari = form.querySelectorAll('[data-detay-nufus-sonuc-alani="1"]');
    const detayKutu = form.querySelector('.maas-detay-kutu');
    const manuelMod = String(modEl.value || 'manuel') === 'manuel';
    manuelAlanlar.forEach((alan) => {
      alan.hidden = !manuelMod;
    });
    detaySonucAlanlari.forEach((alan) => {
      alan.hidden = manuelMod;
    });
    if (detayKutu && manuelMod) detayKutu.open = false;
  }

  function entegreNobetAlaniGorunumunuUygula() {
    if (!form) return;
    const birimTipiEl = form.elements?.birimTipi;
    const entegreNobetEl = form.elements?.entegreTutulmayanNobet;
    const alan = form.querySelector('[data-entegre-nobet-alani="1"]');
    if (!birimTipiEl || !entegreNobetEl || !alan) return;
    const entegre = String(birimTipiEl.value || '') === 'entegre';
    alan.hidden = !entegre;
    entegreNobetEl.disabled = !entegre;
    if (!entegre) entegreNobetEl.value = '0';
  }

  function birimTipiYeniBirimSenkranize(etkinAlan) {
    if (!form) return;
    const birimTipiEl = form.elements?.birimTipi;
    const yeniBirimEl = form.elements?.yeniBirim;
    if (!birimTipiEl || !yeniBirimEl) return;
    if (etkinAlan === 'birimTipi') {
      yeniBirimEl.checked = birimTipiEl.value === 'normalYeni';
      entegreNobetAlaniGorunumunuUygula();
      return;
    }
    if (etkinAlan === 'yeniBirim') {
      if (yeniBirimEl.checked && birimTipiEl.value === 'normal') birimTipiEl.value = 'normalYeni';
      if (!yeniBirimEl.checked && birimTipiEl.value === 'normalYeni') birimTipiEl.value = 'normal';
      return;
    }
    if (yeniBirimEl.checked && birimTipiEl.value === 'normal') {
      birimTipiEl.value = 'normalYeni';
    } else if (!yeniBirimEl.checked && birimTipiEl.value === 'normalYeni') {
      birimTipiEl.value = 'normal';
    } else {
      yeniBirimEl.checked = birimTipiEl.value === 'normalYeni';
    }
    entegreNobetAlaniGorunumunuUygula();
  }

  function hypKaydiniOku() {
    if (typeof localStorage === 'undefined') return null;
    let enGuncelKayit = null;
    let enGuncelTs = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const anahtar = localStorage.key(i);
      if (!anahtar) continue;
      if (anahtar !== HYP_HESAP_KAYIT_ANAHTAR_BAZ && !anahtar.startsWith(`${HYP_HESAP_KAYIT_ANAHTAR_BAZ}:uid:`)) continue;
      try {
        const ham = localStorage.getItem(anahtar);
        if (!ham) continue;
        const kayit = JSON.parse(ham);
        const ts = Number(kayit?.guncellenme || kayit?.hypV2?.guncellenme || kayit?.asc?.guncellenme || 0);
        if (ts >= enGuncelTs) {
          enGuncelTs = ts;
          enGuncelKayit = kayit;
        }
      } catch (_) {}
    }
    return enGuncelKayit;
  }

  function hypMaasaEsasKatsayiBul(kayit) {
    if (!kayit || typeof kayit !== 'object') return null;
    const hamHekimKs = Number(kayit?.asc?.hekimKS || 0);
    if (!Number.isFinite(hamHekimKs) || hamHekimKs <= 0) return null;
    const nufus = Number(kayit?.hypV2?.nufus || 0);
    const nufusTip = String(kayit?.hypV2?.nufusTip || '3500');
    if (!Number.isFinite(nufus) || nufus <= 0) return kisitla(hamHekimKs, 0.9, 2);
    const dusukTip = nufusTip === 'dusuk' || nufusTip === '2400';
    const cap = dusukTip ? 2400 : 3500;
    const baz = dusukTip ? 2400 : 4000;
    const eff = Math.min(nufus, cap);
    const tavanKs = Math.min(baz / Math.max(1, eff), 1.5);
    return kisitla(Math.min(hamHekimKs, tavanKs), 0.9, 2);
  }

  function hypNufusunuMaasFormunaSenkronla() {
    if (!form) return false;
    const kayit = hypKaydiniOku();
    const nufus = Math.max(0, Math.floor(Number(kayit?.hypV2?.nufus || 0)));
    const nufusEl = form.elements?.manuelToplamNufus;
    if (!nufusEl || nufus <= 0) return false;

    const elleDegismis = nufusEl.value && nufusEl.dataset.hypSenkron !== '1';
    if (elleDegismis) return false;

    nufusEl.value = String(nufus);
    form.elements.manuelToplamNufus.dataset.hypSenkron = '1';

    const tip = String(kayit?.hypV2?.nufusTip || '');
    const birimTipiEl = form.elements?.birimTipi;
    if (birimTipiEl && (tip === 'dusuk' || tip === '2400') && birimTipiEl.dataset.hypSenkron !== 'elle') {
      birimTipiEl.value = 'dusuk';
      birimTipiEl.dataset.hypSenkron = '1';
    }

    return true;
  }

  function hypKatsayiCanliCekUygula() {
    if (!form) return false;
    const otoEl = form.elements?.hypKatsayiCanliCek;
    const hypEl = form.elements?.hypKatsayi;
    if (!otoEl || !hypEl) return false;
    if (!otoEl.checked) return false;
    const kayit = hypKaydiniOku();
    const katsayi = hypMaasaEsasKatsayiBul(kayit);
    if (!Number.isFinite(katsayi) || katsayi <= 0) return false;
    const yeniDeger = katsayi.toFixed(4);
    if (hypEl.value !== yeniDeger) hypEl.value = yeniDeger;
    return true;
  }

  function hypKatsayiCanliCekDurumunuUygula() {
    if (!form) return;
    const otoEl = form.elements?.hypKatsayiCanliCek;
    const hypEl = form.elements?.hypKatsayi;
    if (!otoEl || !hypEl) return;
    if (otoEl.checked) {
      hypEl.readOnly = true;
      hypKatsayiCanliCekUygula();
      clearInterval(hypKatsayiCanliTimer);
      hypKatsayiCanliTimer = setInterval(() => {
        if (!form.elements?.hypKatsayiCanliCek?.checked) return;
        if (hypKatsayiCanliCekUygula()) render();
      }, 1200);
    } else {
      hypEl.readOnly = hypEl.disabled;
      clearInterval(hypKatsayiCanliTimer);
      hypKatsayiCanliTimer = null;
    }
  }

  function ekGostergeyiHekimTipindenUygula() {
    if (!form) return;
    const hekimTipiEl = form.elements?.hekimTipi;
    const ekGostergeEl = form.elements?.ekGosterge;
    if (!hekimTipiEl || !ekGostergeEl) return;
    const hekimTipi = String(hekimTipiEl.value || 'tabip');
    if (hekimTipi === 'aileUzmani') ekGostergeEl.value = '5300';
    else if (hekimTipi === 'tabip') ekGostergeEl.value = '4200';
  }

  function maasMesajHedefOrigin(hedefOrigin) {
    if (!hedefOrigin || hedefOrigin === 'null' || location.protocol === 'file:' || location.origin === 'null') return '*';
    return hedefOrigin;
  }

  function maasMotorHazirMesajiGonder(hedefOrigin) {
    if (window.parent === window) return;
    window.parent.postMessage({
      type: 'ahek-maas-motor-hazir'
    }, maasMesajHedefOrigin(hedefOrigin));
  }

  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    if (event.data?.type === 'ahek-maas-motor-durum-sor') {
      maasMotorHazirMesajiGonder(event.origin);
      return;
    }
    if (event.data?.type !== 'ahek-maas-senaryo-hesapla') return;
    // Gizli motor iframe'i formu yalnızca açılışta yüklüyordu; maaş sayfasında sonradan
    // girilen parametreler (destek/sendika/kira/il/KHT) yansımıyor, kart maaş hesabından
    // ~3,5K düşük çıkıyordu. Her hesaptan önce güncel kaydı yeniden yükle → birebir uyum.
    yerelKayitYukle();
    const hamNufusPuani = Math.max(0, Number(event.data.hamNufusPuani) || 0);
    const gelmeyenNufusPuani = Math.max(0, Number(event.data.gelmeyenNufusPuani) || 0);
    const netNufusPuani = Math.max(0, hamNufusPuani - gelmeyenNufusPuani);
    const canliHypKatsayi = Math.max(0, Number(event.data.canliHypKatsayi) || 0);
    const tamamlanmisHypKatsayi = Math.max(0, Number(event.data.tamamlanmisHypKatsayi) || 0);
    const canliKhtOrani = Math.max(0, Number(event.data.canliKhtOrani) || 0);
    // Ay/yıl: HYP Hesapla'daki AKTİF aydan hesaplanır (örn. Haziran'daysak Haziran).
    // Maaş kümülatif gelir vergisi nedeniyle aya duyarlıdır; kart, seçili aktif ayın maaşını gösterir.
    const hesapAy = Math.max(1, Math.min(12, Number(event.data.hesapAy) || 1));
    const hesapYil = Math.max(2000, Number(event.data.hesapYil) || new Date().getFullYear());
    if (!netNufusPuani || !canliHypKatsayi || !tamamlanmisHypKatsayi) return;

    const canli = hesapla({
      maasaEsasPuan: netNufusPuani * canliHypKatsayi,
      khtOrani: canliKhtOrani,
      hesapAy,
      hesapYil
    });
    // "HYP tamamlanırsa" senaryosu. KHT'yi sabit 0.378 yerine formdaki gerçek KHT oranından oku
    // (khtOrani'yı geçme); ay/yıl aktif aydan gelir.
    const tamamlanmis = hesapla({
      maasaEsasPuan: netNufusPuani * tamamlanmisHypKatsayi,
      hesapAy,
      hesapYil
    });

    window.parent.postMessage({
      type: 'ahek-maas-senaryo-sonuc',
      istekId: event.data.istekId,
      netMaas: canli.netMaas,
      tamamlanmisNetMaas: tamamlanmis.netMaas,
      canliKhtYuzde: event.data.canliKhtYuzde
    }, maasMesajHedefOrigin(event.origin));
  });

  maasMotorHazirMesajiGonder();

  window.AHEK_MAAS_HESAPLAYICI = {
    hesapla,
    nufusSsSonucUygula,
    ilIlceSecimleriniHazirla,
    ilceSecimleriniGuncelle,
    ilceParametreleriniUygula
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    ilceParametreleriniUygula();
    render();
  });

  form.addEventListener('input', (e) => {
    if (['ilaveOdeme', 'ekTabanAylik', 'sendikaOdenegi'].includes(e.target?.name)) e.target.dataset.otomatik = '0';
    if (e.target?.name === 'manuelToplamNufus') e.target.dataset.hypSenkron = 'elle';
    if (e.target?.name === 'manuelNufusPuani') manuelNufusModunuUygula();
    if (['manuelNufusPuani', 'hamNufusPuani'].includes(e.target?.name)) manuelPuanOncelikDurumunuUygula();
    if (e.target?.name === 'temmuzZamOrani') {
      elleZamSenaryosunuUygula();
      sabitEkGelirleriUygula();
      sendikaOdenegiUygula();
      sendikaDurumunuUygula();
    }
    yerelKayitPlanla();
    render();
  });
  form.addEventListener('change', (e) => {
    if (e.target?.name === 'nufusPuaniModu') nufusPuaniModuGorunumunuUygula();
    if (e.target?.name === 'birimTipi') {
      e.target.dataset.hypSenkron = 'elle';
      birimTipiYeniBirimSenkranize('birimTipi');
    }
    if (e.target?.name === 'yeniBirim') birimTipiYeniBirimSenkranize('yeniBirim');
    if (e.target?.name === 'hypKatsayiCanliCek') hypKatsayiCanliCekDurumunuUygula();
    if (e.target?.name === 'calisilanIl') ilceSecimleriniGuncelle();
    if (e.target?.name === 'hekimTipi') ekGostergeyiHekimTipindenUygula();
    ilceParametreleriniUygula();
    if (e.target?.name === 'temmuzZamOrani') elleZamSenaryosunuUygula();
    if (e.target?.name === 'temmuzZamSenaryosu') elleZamAlaniGorunumunuUygula();
    if (['hesapAy', 'hesapYil', 'kadroDurumu', 'temmuzZamSenaryosu', 'temmuzZamOrani'].includes(e.target?.name)) sabitEkGelirleriUygula();
    if (['hesapAy', 'hesapYil', 'sendikaUyeligi', 'temmuzZamSenaryosu', 'temmuzZamOrani'].includes(e.target?.name)) {
      sendikaOdenegiUygula();
      sendikaDurumunuUygula();
    }
    yerelKayitPlanla();
    render();
  });
  form.querySelector('[data-nufus-detay-kapat="1"]')?.addEventListener('click', () => {
    const detayKutu = form.querySelector('.maas-nufus-detay-popup');
    if (detayKutu) detayKutu.open = false;
    yerelKayitPlanla();
  });
  form.querySelector('[data-nufus-detay-temizle="1"]')?.addEventListener('click', detayliNufusAlanlariniTemizle);
  document.getElementById('maasBilgileriKaydet')?.addEventListener('click', maasBilgileriniFirebaseKaydet);
  document.getElementById('maasBuluttanCek')?.addEventListener('click', async () => {
    const uid = String(window._currentUid || '').trim();
    if (!uid) { maasKayitDurumuYaz('Buluttan çekmek için giriş yapın.', 'hata'); return; }
    if (!confirm('Bu cihazdaki maaş bilgileri buluttaki kayıtla değiştirilecek. Emin misiniz?')) return;
    // Çakışma korumasını atla — kullanıcı açıkça buluttan istedi (bulut kazanır).
    maasBulutYuklenenUid = '';
    maasYerelDegisimZamani = 0;
    maasSonYerelKayitZamani = 0;
    await maasBulutKaydiniYukle(uid);
  });
  // Manuel senkron: girişte/firebase-hazır otomatik yükleme kaldırıldı; UID takibi için auth dinlenir.
  window.addEventListener('hekim-auth-durum-degisti', maasAuthDurumunuUygula);
  window.addEventListener('pagehide', () => {
    if (!kayitYukleniyor) yerelKayitYaz(maasYerelDegisimZamani || Date.now());
  });
  document.getElementById('maasNufusSsInput')?.addEventListener('change', (e) => {
    nufusSsDosyasiniOku(e.target?.files?.[0]);
  });
  document.addEventListener('click', (e) => {
    const detayKutu = form.querySelector('.maas-nufus-detay-popup');
    if (!detayKutu?.open) return;
    const hedef = e.target;
    if (detayKutu.contains(hedef)) return;
    detayKutu.open = false;
    yerelKayitPlanla();
  });
  adminKilitHazirla();
  yerelKayitYukle();
  varsayilanGecisleriniUygula();
  ilIlceSecimleriniHazirla();
  ilceParametreleriniUygula();
  manuelNufusModunuUygula();
  nufusPuaniModuGorunumunuUygula();
  manuelPuanOncelikDurumunuUygula();
  birimTipiYeniBirimSenkranize();
  hypNufusunuMaasFormunaSenkronla();
  hypKatsayiCanliCekDurumunuUygula();
  ekGostergeyiHekimTipindenUygula();
  elleZamSenaryosunuUygula();
  elleZamAlaniGorunumunuUygula();
  sabitEkGelirleriUygula();
  sendikaOdenegiUygula();
  sendikaDurumunuUygula();
  render();
})();
