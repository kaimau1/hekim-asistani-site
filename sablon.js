// ═══ Şablon Kütüphanesi + Tümünü Sıfırla ═══
// Profil snapshotlarını ad vererek kaydet, dropdown'dan yükle, sil.
// localStorage 'hesap_sablonlar_v1' altında; auth.js Firestore'a senkronlar.

(function() {
  const LS_KEY = 'hesap_sablonlar_v1';

  // ── GENEL (built-in) şablonlar — her kullanıcıda görünür, silinemez ──
  // Efor kodları: 1=Ç.Kolay(0.5×), 2=Kolay(0.75×), 3=Orta(1×),
  //                4=Zor(1.5×), 5=Ç.Zor(2×), 6=Mecbur (öncelik 1-9 ile)
  const GENEL_SABLONLAR = {
    hypv2: {
      '🌐 Genel — Optimal': {
        htTarama:   { max: 85,  efor: 2, oncelik: 5 },
        htTakip:    { max: 85,  efor: 4, oncelik: 5 },
        dmTarama:   { max: 100, efor: 1, oncelik: 5 },
        dmTakip:    { max: 100, efor: 3, oncelik: 5 },
        obzTarama:  { max: 85,  efor: 2, oncelik: 5 },
        obzTakip:   { max: 100, efor: 3, oncelik: 5 },
        serviks:    { max: 90,  efor: 6, oncelik: 5 },
        kolorektal: { max: 90,  efor: 6, oncelik: 1 },
        meme:       { max: 90,  efor: 6, oncelik: 5 },
        kvrTarama:  { max: 100, efor: 3, oncelik: 5 },
        kvrTakip:   { max: 100, efor: 1, oncelik: 5 },
        yasli:      { max: 100, efor: 2, oncelik: 5 },
        kah:        { max: 90,  efor: 2, oncelik: 5 },
        inme:       { max: 90,  efor: 3, oncelik: 5 },
        kbh:        { max: 90,  efor: 3, oncelik: 5 },
        koah:       { max: 90,  efor: 3, oncelik: 5 },
        astim:      { max: 90,  efor: 3, oncelik: 5 },
        otizm:      { max: 90,  efor: 3, oncelik: 5 },
      },
    },
    asc: {
      '🌐 Genel — Dengeli': {
        vital:    { max: 100, efor: 3, oncelik: 5 },
        cokyonlu: { max: 100, efor: 2, oncelik: 5 },
      },
    },
  };
  const GENEL_VARSAYILAN = {
    hypv2: '🌐 Genel — Optimal',
    asc: '🌐 Genel — Dengeli',
  };

  function _genelMi(tabloAd, ad) {
    return !!GENEL_SABLONLAR[tabloAd]?.[ad];
  }

  function _oku() {
    let kullanici = { hypv2: {}, asc: {} };
    try {
      const ham = localStorage.getItem(LS_KEY);
      if (ham) kullanici = JSON.parse(ham);
    } catch (_) {}
    // Kullanıcı şablonları GENEL'in üzerine binebilir (aynı adla kaydederse)
    return {
      hypv2: { ...GENEL_SABLONLAR.hypv2, ...(kullanici.hypv2 || {}) },
      asc:   { ...GENEL_SABLONLAR.asc,   ...(kullanici.asc   || {}) },
    };
  }
  function _okuKullanici() {
    try {
      const ham = localStorage.getItem(LS_KEY);
      return ham ? JSON.parse(ham) : { hypv2: {}, asc: {} };
    } catch (_) { return { hypv2: {}, asc: {} }; }
  }
  function _yaz(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('hesap-sablon-degisti')); } catch (_) {}
  }

  function _durumMetni(tabloAd) {
    const hazir = Object.keys(GENEL_SABLONLAR[tabloAd] || {}).length;
    const ozel = Object.keys(_okuKullanici()[tabloAd] || {}).length;
    if (hazir && ozel) return `${hazir} hazır şablon · ${ozel} kişisel kayıt`;
    if (hazir) return `${hazir} hazır şablon`;
    if (ozel) return `${ozel} kişisel kayıt`;
    return 'Şablon yok';
  }

  function _durumGuncelle() {
    document.querySelectorAll('[data-sablon-durum]').forEach(el => {
      const tabloAd = el.dataset.sablonDurum;
      el.textContent = _durumMetni(tabloAd);
    });
  }

  function _krIcin(tabloAd) {
    return tabloAd === 'hypv2' ? (window.HYP2_KRITERLER || []) : (window.ASC_KRITERLER || []);
  }
  function _profilSecAttr(tabloAd) {
    return tabloAd === 'hypv2' ? 'data-v2-profil' : 'data-asc-profil';
  }
  function _veriSecAttr(tabloAd) {
    return tabloAd === 'hypv2' ? 'data-hypv2' : 'data-asc';
  }

  function dropdownDoldur() {
    const sablonlar = _oku();
    ['hypv2', 'asc'].forEach(t => {
      document.querySelectorAll(`select.profil-sablon-sec[data-sablon-tablo="${t}"]`).forEach(sel => {
        const mevcut = sel.value;
        sel.innerHTML = '<option value="">— Şablon seç —</option>';
        Object.keys(sablonlar[t] || {}).sort().forEach(ad => {
          const opt = document.createElement('option');
          opt.value = ad; opt.textContent = ad;
          sel.appendChild(opt);
        });
        if (mevcut && sablonlar[t]?.[mevcut]) sel.value = mevcut;
      });
    });
    _durumGuncelle();
  }

  function yukle(tabloAd) {
    const sel = document.querySelector(`select.profil-sablon-sec[data-sablon-tablo="${tabloAd}"]`);
    const ad = sel?.value;
    if (!ad) {
      if (window.siteToast) window.siteToast('Önce dropdown\'dan şablon seçin', 'uyari');
      return;
    }
    const profil = _oku()[tabloAd]?.[ad];
    if (!profil) return;
    const attr = _profilSecAttr(tabloAd);
    _krIcin(tabloAd).forEach(k => {
      const v = profil[k.prefix];
      const maxEl = document.querySelector(`input[${attr}="${k.prefix}-max"]`);
      const eforEl = document.querySelector(`select[${attr}="${k.prefix}-efor"]`);
      const oncelikEl = document.querySelector(`select[${attr}="${k.prefix}-oncelik"]`);
      if (maxEl) maxEl.value = v?.max || '';
      if (eforEl) eforEl.value = v?.efor || 3;
      if (oncelikEl) {
        oncelikEl.value = v?.oncelik || 5;
        oncelikEl.hidden = parseInt(eforEl?.value) !== 6;
      }
    });
    if (window.siteToast) window.siteToast(`📥 "${ad}" yüklendi`, 'bilgi');
    try { window.dispatchEvent(new CustomEvent('hesap-verisi-degisti')); } catch (_) {}
  }

  function kaydet(tabloAd) {
    const ad = prompt('Şablon adı:\n(Mevcut profil yeni isimle kaydedilecek)', 'Yeni Şablon');
    if (!ad) return;
    const temiz = ad.trim();
    if (!temiz) return;

    const profil = {};
    const attr = _profilSecAttr(tabloAd);
    _krIcin(tabloAd).forEach(k => {
      const max = parseInt(document.querySelector(`input[${attr}="${k.prefix}-max"]`)?.value) || 0;
      const efor = parseInt(document.querySelector(`select[${attr}="${k.prefix}-efor"]`)?.value) || 3;
      const oncelik = parseInt(document.querySelector(`select[${attr}="${k.prefix}-oncelik"]`)?.value) || 5;
      if (max > 0 || efor !== 3) profil[k.prefix] = { max, efor, oncelik };
    });

    if (!Object.keys(profil).length) {
      if (window.siteToast) window.siteToast('Profil boş — kaydedilecek değer yok', 'uyari');
      return;
    }

    const sablonlar = _okuKullanici();
    sablonlar[tabloAd] = sablonlar[tabloAd] || {};
    if ((sablonlar[tabloAd][temiz] || _genelMi(tabloAd, temiz)) && !confirm(`"${temiz}" zaten var. Üzerine yazılsın mı?`)) return;
    sablonlar[tabloAd][temiz] = profil;
    _yaz(sablonlar);
    dropdownDoldur();
    const sel = document.querySelector(`select.profil-sablon-sec[data-sablon-tablo="${tabloAd}"]`);
    if (sel) sel.value = temiz;
    if (window.siteToast) window.siteToast(`💾 "${temiz}" kaydedildi`, 'bilgi');
  }

  function sil(tabloAd) {
    const sel = document.querySelector(`select.profil-sablon-sec[data-sablon-tablo="${tabloAd}"]`);
    const ad = sel?.value;
    if (!ad) {
      if (window.siteToast) window.siteToast('Önce silinecek şablonu seçin', 'uyari');
      return;
    }
    if (_genelMi(tabloAd, ad)) {
      if (window.siteToast) window.siteToast('Genel şablon silinemez', 'uyari');
      return;
    }
    if (!confirm(`"${ad}" şablonu silinsin mi?`)) return;
    const sablonlar = _okuKullanici();
    if (sablonlar[tabloAd]) delete sablonlar[tabloAd][ad];
    _yaz(sablonlar);
    dropdownDoldur();
    if (window.siteToast) window.siteToast(`🗑 "${ad}" silindi`, 'uyari');
  }

  function tumunuSifirla(tabloAd) {
    if (!confirm('Tablodaki gereken, yapılan, devir ve hedef değerleri temizlensin mi?\n(AI hedef/profil ayarları korunur)')) return;
    const veriAttr = _veriSecAttr(tabloAd);
    _krIcin(tabloAd).forEach(k => {
      ['G','Y','D','H'].forEach(s => {
        const e = document.querySelector(`input[${veriAttr}="${k.prefix}-${s}"]`);
        if (e) e.value = '';
      });
    });
    if (tabloAd === 'hypv2') {
      if (window.hypV2Hesapla) window.hypV2Hesapla();
    } else {
      if (window.ascHesapla) window.ascHesapla();
    }
    try {
      window.dispatchEvent(new CustomEvent('hesap-verisi-degisti', {
        detail: { islem: 'temizle', tablo: tabloAd, temizlemeZamani: Date.now() },
      }));
    } catch (_) {}
    if (window.siteToast) window.siteToast('🗑 Tablo ve hedef değerleri temizlendi', 'uyari');
  }

  // Public API — auth.js Firestore senkronu için
  // Belirli bir şablonu sessizce uygula (toast göstermeden — otomatik default için)
  function _sessizUygula(tabloAd, ad) {
    const profil = _oku()[tabloAd]?.[ad];
    if (!profil) return false;
    const attr = _profilSecAttr(tabloAd);
    _krIcin(tabloAd).forEach(k => {
      const v = profil[k.prefix];
      const maxEl = document.querySelector(`input[${attr}="${k.prefix}-max"]`);
      const eforEl = document.querySelector(`select[${attr}="${k.prefix}-efor"]`);
      const oncelikEl = document.querySelector(`select[${attr}="${k.prefix}-oncelik"]`);
      if (maxEl) maxEl.value = v?.max || '';
      if (eforEl) eforEl.value = v?.efor || 3;
      if (oncelikEl) {
        oncelikEl.value = v?.oncelik || 5;
        oncelikEl.hidden = parseInt(eforEl?.value) !== 6;
      }
    });
    const sel = document.querySelector(`select.profil-sablon-sec[data-sablon-tablo="${tabloAd}"]`);
    if (sel) sel.value = ad;
    return true;
  }

  // İlk ziyarette HYP v2 için 'Genel — Optimal' şablonunu varsayılan olarak yükle
  function _varsayilanSablon(tabloAd) {
    const hedefler = tabloAd ? [tabloAd] : ['hypv2', 'asc'];
    hedefler.forEach(t => {
      const kriterler = _krIcin(t);
      const veriAttr = _veriSecAttr(t);
      const hepsiBos = !kriterler.some(k => {
        const v = parseInt(document.querySelector(`input[${veriAttr}="${k.prefix}-max"]`)?.value) || 0;
        return v > 0;
      });
      if (!hepsiBos) return;  // kullanıcının profili var — dokunma
      const ad = GENEL_VARSAYILAN[t];
      if (ad) _sessizUygula(t, ad);
    });
  }

  window.hesapSablonOku = _oku;
  window.hesapSablonYaz = (s) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s || { hypv2: {}, asc: {} })); } catch (_) {}
    dropdownDoldur();
  };

  // Eklenti veri çekimi sonrası otomatik şablon uygulama — profil boşsa Genel — Optimal yükle.
  // Zaten _varsayilanSablon idempotent; dışarıdan tetiklenebilir olsun diye expose ediyoruz.
  window.hesapSablonGenelVarsayilan = _varsayilanSablon;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      dropdownDoldur();
      _varsayilanSablon();    // profil boşsa yerleşik şablonları uygula
    }, 120);

    // Şablon seçimleri otomatik yüklensin; butonlar yalnızca kaydet / sil için kalsın
    document.querySelectorAll('.profil-sablon-sec').forEach(sel => {
      sel.addEventListener('change', () => {
        const tabloAd = sel.dataset.sablonTablo;
        if (sel.value) yukle(tabloAd);
      });
    });

    // Şablon butonları (kaydet / sil)
    document.querySelectorAll('.profil-sablon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.sablonTablo;
        const a = btn.dataset.sablonAksiyon;
        if (a === 'yukle') yukle(t);
        else if (a === 'kaydet') kaydet(t);
        else if (a === 'sil') sil(t);
      });
    });

    // Tümünü Sıfırla butonu
    document.querySelectorAll('.btn-tumu-sifirla').forEach(btn => {
      btn.addEventListener('click', () => tumunuSifirla(btn.dataset.tumuTablo));
    });
  });
})();
