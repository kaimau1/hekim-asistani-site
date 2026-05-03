// ═══ Site navigasyon + sekme geçişi ═══

// Header yüksekliğini dinamik hesapla — sticky özet kartının doğru hizalanması için
function _headerYukseklikGuncelle() {
  const h = document.querySelector('.site-header')?.offsetHeight || 56;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}

function _mobilHesapYerlesiminiAyarla() {
  const mobilMi = window.innerWidth <= 639;

  const alanlar = [
    {
      mobilAlanId: 'hypV2MobilNufusAlan',
      stickySecici: '#panel-hypv2 .ust-kartlar-sticky',
      kartSecici: '#panel-hypv2 .ust-kartlar-sticky .nufus-kart',
      hedefSecici: null,
      geriSecici: ':scope'
    },
    {
      mobilAlanId: 'ascMobilNufusAlan',
      stickySecici: '#panel-asc .ust-kartlar-sticky',
      kartSecici: '#panel-asc .ust-kartlar-sticky .nufus-kart',
      hedefSecici: null,
      geriSecici: ':scope'
    }
  ];

  alanlar.forEach(({ mobilAlanId, stickySecici, kartSecici }) => {
    const mobilAlan = document.getElementById(mobilAlanId);
    const stickyAlan = document.querySelector(stickySecici);
    const kart = document.querySelector(kartSecici) || mobilAlan?.querySelector('.nufus-kart');
    if (!mobilAlan || !stickyAlan || !kart) return;

    if (mobilMi) {
      if (kart.parentElement !== mobilAlan) mobilAlan.appendChild(kart);
      mobilAlan.hidden = false;
    } else {
      if (kart.parentElement !== stickyAlan) stickyAlan.prepend(kart);
      mobilAlan.hidden = true;
    }
  });

  const mobilHedefAlan = document.getElementById('hypV2MobilHedefAksiyon');
  const masaustuHedefAlan = document.querySelector('#hypV2Tablo .hedef-ai-actions');
  const mobilBaslik = mobilHedefAlan?.querySelector('.mobil-hedef-aksiyon-baslik');
  const mobildeTasinaButonlar = mobilHedefAlan?.querySelector('.btn, .btn-ai, .btn-ai-vurgu, .btn-ai-ghost')
    ? Array.from(mobilHedefAlan.querySelectorAll('.btn, .btn-ai, .btn-ai-vurgu, .btn-ai-ghost'))
        .filter(btn => !btn.classList.contains('mobil-tumu-sifirla'))
    : [];
  const masaustundeButonlar = masaustuHedefAlan
    ? Array.from(masaustuHedefAlan.querySelectorAll('.btn, .btn-ai, .btn-ai-vurgu, .btn-ai-ghost'))
    : [];

  if (mobilHedefAlan && masaustuHedefAlan && mobilBaslik) {
    if (mobilMi) {
      masaustundeButonlar.forEach((btn) => mobilHedefAlan.appendChild(btn));
      mobilHedefAlan.hidden = false;
    } else {
      mobildeTasinaButonlar.forEach((btn) => masaustuHedefAlan.appendChild(btn));
      mobilHedefAlan.hidden = true;
    }
  }
}

document.addEventListener('DOMContentLoaded', _headerYukseklikGuncelle);
window.addEventListener('load', _headerYukseklikGuncelle);
window.addEventListener('resize', () => {
  _headerYukseklikGuncelle();
  _mobilHesapYerlesiminiAyarla();
});

document.addEventListener('DOMContentLoaded', () => {
  // ── Mobil menü ──
  const btnMobil = document.getElementById('btnMobilNav');
  const panel = document.getElementById('mobilPanel');
  if (btnMobil && panel) {
    btnMobil.addEventListener('click', () => {
      const acik = !panel.hidden;
      panel.hidden = acik;
      btnMobil.setAttribute('aria-expanded', String(!acik));
      btnMobil.textContent = acik ? '☰' : '✕';
    });
    // Link tıklanınca kapansın
    panel.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        panel.hidden = true;
        btnMobil.setAttribute('aria-expanded', 'false');
        btnMobil.textContent = '☰';
      });
    });
  }

  // ── Hesapla sekmeleri ──
  const sekmeBtnler = document.querySelectorAll('.sekme-btn[data-sekme]');
  sekmeBtnler.forEach(btn => {
    btn.addEventListener('click', () => {
      const hedef = btn.dataset.sekme;
      sekmeBtnler.forEach(b => {
        const aktif = b === btn;
        b.classList.toggle('aktif', aktif);
        b.setAttribute('aria-selected', String(aktif));
      });
      document.querySelectorAll('.hesap-panel').forEach(p => {
        p.classList.toggle('aktif', p.id === 'panel-' + hedef);
      });
    });
  });

  // ── Generic modal aç/kapat (auth.js kendi handler'ı ile çakışmaz) ──
  function _modalAc(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.hidden = false;
    document.body.classList.add('modal-acik');
  }
  function _modalKapat(id) {
    const m = id ? document.getElementById(id) : document.querySelector('.modal:not([hidden]):not(#authModal)');
    if (!m) return;
    m.hidden = true;
    // Başka açık modal yoksa body class kaldır
    if (!document.querySelector('.modal:not([hidden])')) {
      document.body.classList.remove('modal-acik');
    }
  }

  document.querySelectorAll('[data-modal-ac]').forEach(btn => {
    btn.addEventListener('click', () => _modalAc(btn.dataset.modalAc));
  });

  // Modal içindeki kapat butonları ve backdrop (auth modal dışındakiler)
  document.querySelectorAll('.modal:not(#authModal) [data-modal-kapat]').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.currentTarget.closest('.modal');
      if (modal) _modalKapat(modal.id);
    });
  });

  // Optimize vb. işlem sonrası modal kapatma — data-modal-kapat-sonra
  document.querySelectorAll('[data-modal-kapat-sonra]').forEach(btn => {
    btn.addEventListener('click', () => {
      // Asıl click handler (hesapla.js) önce çalışsın, sonra kapat
      setTimeout(() => _modalKapat(btn.dataset.modalKapatSonra), 60);
    });
  });

  // Escape ile non-auth modal kapat (auth.js kendi escape'ini yönetir)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const acikModal = document.querySelector('.modal:not([hidden]):not(#authModal)');
    if (acikModal) _modalKapat(acikModal.id);
  });

  // ── Genel toast bildirimi ──
  function _toast(mesaj, tip) {
    let t = document.getElementById('siteToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'siteToast';
      t.className = 'site-toast';
      document.body.appendChild(t);
    }
    t.textContent = mesaj;
    t.className = 'site-toast goster ' + (tip || '');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.classList.remove('goster'); }, 4500);
  }
  window.siteToast = _toast;

  // ── HYP Verilerini Çek butonu — Chrome eklentisi köprüsü ──
  // Eklenti manifest'inde externally_connectable ile bu domain izinli.
  // Yüklü değilse chrome.runtime.sendMessage çağrısı lastError döner.
  const EKLENTI_ID = 'dbodkaociggagccjjnobjefpjhpmkjif';
  document.getElementById('btnHypV2VeriCek')?.addEventListener('click', () => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
      _toast('📊 Chrome eklentisi yüklü değil. Kurduktan sonra tekrar dene.', 'uyari');
      return;
    }
    try {
      chrome.runtime.sendMessage(EKLENTI_ID, { type: 'hypVeriCek' }, (resp) => {
        if (chrome.runtime.lastError || !resp) {
          _toast('📊 Eklenti bulunamadı veya cevap vermedi. Chrome\'da yüklü olduğundan emin ol.', 'uyari');
          return;
        }
        if (!resp.ok) {
          if (resp.hata === 'veri-yok') {
            _toast('📊 Eklentide henüz veri yok. Önce HYP platformunu ziyaret edip eklenti üzerinden veri çek.', 'uyari');
          } else {
            _toast('📊 Veri alınamadı: ' + (resp.hata || 'bilinmeyen hata'), 'uyari');
          }
          return;
        }
        const sayac = _hypV2SiteVeriUygula(resp);
        _toast(`✓ ${sayac} kriter eklentiden yüklendi (Sonuç sütunu manuel girilmeli)`, 'basari');
      });
    } catch (e) {
      _toast('📊 Eklenti iletişiminde hata: ' + e.message, 'uyari');
    }
  });

  function _hypV2SiteVeriUygula(resp) {
    const nufusEl = document.getElementById('hypV2Nufus');
    if (nufusEl && resp.nufus) nufusEl.value = resp.nufus;
    let sayac = 0;
    Object.entries(resp.kriterler || {}).forEach(([prefix, k]) => {
      ['g','y','d'].forEach(suf => {
        const el = document.querySelector(`input[data-hypv2="${prefix}-${suf.toUpperCase()}"]`);
        if (el && k[suf]) { el.value = k[suf]; if (suf === 'g') sayac++; }
      });
    });
    if (typeof window.hypV2Hesapla === 'function') window.hypV2Hesapla();
    try { window.dispatchEvent(new CustomEvent('hesap-verisi-degisti')); } catch (_) {}
    return sayac;
  }

  // Sütun sıfırla butonları (kriter tablo th'lerinde)
  document.querySelectorAll('.kolon-sifirla').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabloAd = btn.dataset.tablo;        // 'hypv2' veya 'asc'
      const sufix = btn.dataset.sif;            // 'G','Y','D','H'
      const dataAttr = tabloAd === 'hypv2' ? 'data-hypv2' : 'data-asc';
      document.querySelectorAll(`input[${dataAttr}$="-${sufix}"]`).forEach(inp => {
        inp.value = '';
      });
      if (tabloAd === 'hypv2' && typeof window.hypV2Hesapla === 'function') window.hypV2Hesapla();
      if (tabloAd === 'asc'   && typeof window.ascHesapla   === 'function') window.ascHesapla();
      try { window.dispatchEvent(new CustomEvent('hesap-verisi-degisti')); } catch (_) {}
    });
  });

  // Hedef sütununda ✨ AI buton — modal açmadan doğrudan profil ile optimize
  document.querySelectorAll('[data-ai-tablo]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabloAd = btn.dataset.aiTablo; // 'hypv2' / 'asc'
      const fn = tabloAd === 'hypv2' ? window.hypV2AIOptimize : window.ascAIOptimize;
      if (typeof fn === 'function') {
        fn();
        try { window.dispatchEvent(new CustomEvent('hesap-verisi-degisti')); } catch (_) {}
        if (typeof window.siteToast === 'function') {
          window.siteToast('✨ Hedefler optimize edildi', 'bilgi');
        }
      }
    });
  });

  _mobilHesapYerlesiminiAyarla();
});

// Kolon genişlik ayarlama özelliği kaldırıldı — önceki kayıtlı inline widths'i
// sayfa açılışında temizle ki tablo orijinal % tabanlı genişliklerine dönsün.
document.addEventListener('DOMContentLoaded', () => {
  try { localStorage.removeItem('hypV2_kolonGenislik_v1'); } catch (_) {}
  document.querySelectorAll('.kriter-tablo th, .kriter-tablo td').forEach(el => {
    if (el.style.width) el.style.width = '';
    if (el.style.maxWidth) el.style.maxWidth = '';
  });
});

