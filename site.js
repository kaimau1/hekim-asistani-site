// ═══ Site navigasyon + sekme geçişi ═══

const SITE_ICON_PATHS = {
  stethoscope: '<path d="M6 3v5a6 6 0 0 0 12 0V3"/><path d="M8 3v5a4 4 0 0 0 8 0V3"/><path d="M12 14v3a4 4 0 0 0 8 0v-1"/><circle cx="20" cy="16" r="2"/>',
  cloud: '<path d="M17.5 19H7a4 4 0 0 1-.7-7.94A6 6 0 0 1 17.2 8.4 4.5 4.5 0 0 1 17.5 19Z"/>',
  power: '<path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.8 0"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 1 1 0 12h-2"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v6h6"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16v-5M12 16V8M16 16v-9"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  sparkles: '<path d="M12 3 9.8 8.8 4 11l5.8 2.2L12 19l2.2-5.8L20 11l-5.8-2.2Z"/><path d="M5 3v4M3 5h4M19 17v4M17 19h4"/>',
  columns: '<path d="M4 5h16M4 12h16M4 19h16"/><path d="M9 5v14M15 5v14"/>',
  moveHorizontal: '<path d="m18 8 4 4-4 4"/><path d="M2 12h20"/><path d="m6 8-4 4 4 4"/>',
  settings: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.38.16.72.38 1 .6.28.22.6.4 1 .4H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  alert: '<path d="m12 3 10 18H2Z"/><path d="M12 9v4M12 17h.01"/>',
  pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 0 0-7-7l-10 10a4.95 4.95 0 0 0 7 7Z"/><path d="m8.5 8.5 7 7"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  thumbsUp: '<path d="M7 10v11"/><path d="M15 5.5 14 10h5.2a2 2 0 0 1 2 2.3l-1.1 7a2 2 0 0 1-2 1.7H7a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4h1l4.2-6.3A2 2 0 0 1 15 5.5Z"/>',
  flask: '<path d="M9 2h6"/><path d="M10 2v6.5L4.8 18a3 3 0 0 0 2.6 4h9.2a3 3 0 0 0 2.6-4L14 8.5V2"/><path d="M7 16h10"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-5"/>',
  xCircle: '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>',
  library: '<path d="M4 19.5V5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-1.5Z"/><path d="M9 3h6v18H9z"/><path d="M15 3h3a2 2 0 0 1 2 2v14.5a2 2 0 0 1-2 1.5h-3z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/>',
  calculator: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  hourglass: '<path d="M6 2h12M6 22h12"/><path d="M8 2v6a4 4 0 0 0 2 3.5L12 12l2-0.5A4 4 0 0 0 16 8V2"/><path d="M8 22v-6a4 4 0 0 1 2-3.5L12 12l2 .5A4 4 0 0 1 16 16v6"/>',
  hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v7"/><path d="M10 10V6a2 2 0 0 0-4 0v9a6 6 0 0 0 12 0v-4a2 2 0 0 0-4 0v1"/>',
  circle: '<circle cx="12" cy="12" r="8"/>'
};

const SITE_ICON_ALIASES = new Map([
  ['👩‍⚕️', 'stethoscope'], ['👩‍⚕', 'stethoscope'], ['👩', 'stethoscope'], ['⚕️', 'stethoscope'], ['⚕', 'stethoscope'], ['🩺', 'stethoscope'], ['☁', 'cloud'], ['⏻', 'power'],
  ['☰', 'menu'], ['✕', 'x'], ['×', 'x'], ['←', 'arrowLeft'], ['→', 'arrowRight'],
  ['↩', 'undo'], ['↺', 'reset'], ['💾', 'save'], ['📊', 'chart'], ['🎯', 'target'],
  ['✨', 'sparkles'], ['⫴', 'columns'], ['↔', 'moveHorizontal'], ['⚙', 'settings'],
  ['ℹ️', 'info'], ['ℹ', 'info'], ['⚠️', 'alert'], ['⚠', 'alert'], ['💊', 'pill'],
  ['📘', 'book'], ['💙', 'heart'], ['👍', 'thumbsUp'], ['🧪', 'flask'], ['🙅', 'ban'],
  ['✓', 'check'], ['✅', 'checkCircle'], ['❌', 'xCircle'], ['📚', 'library'],
  ['🗑', 'trash'], ['📥', 'download'], ['🌐', 'globe'], ['🧮', 'calculator'],
  ['🔄', 'reset'], ['⏳', 'hourglass'], ['👥', 'users'], ['📝', 'fileText'],
  ['🖐', 'hand'], ['✉', 'mail'], ['♙', 'users'], ['⚪', 'circle'], ['📈', 'chart']
]);
const SITE_ICON_KEYS = Array.from(SITE_ICON_ALIASES.keys()).sort((a, b) => b.length - a.length);

function _siteIconOlustur(token) {
  const ad = SITE_ICON_ALIASES.get(token);
  const path = SITE_ICON_PATHS[ad];
  if (!path) return null;
  const span = document.createElement('span');
  span.className = `site-inline-icon site-icon-${ad}`;
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${path}</svg>`;
  return span;
}

function _siteTextNodeIkonlastir(node) {
  const metin = node.nodeValue;
  if (!metin || !SITE_ICON_KEYS.some(k => metin.includes(k))) return;
  const frag = document.createDocumentFragment();
  let i = 0;
  while (i < metin.length) {
    const token = SITE_ICON_KEYS.find(k => metin.startsWith(k, i));
    if (token) {
      const icon = _siteIconOlustur(token);
      if (icon) frag.appendChild(icon);
      i += token.length;
      continue;
    }
    let sonraki = metin.length;
    for (const k of SITE_ICON_KEYS) {
      const idx = metin.indexOf(k, i + 1);
      if (idx !== -1 && idx < sonraki) sonraki = idx;
    }
    frag.appendChild(document.createTextNode(metin.slice(i, sonraki)));
    i = sonraki;
  }
  node.replaceWith(frag);
}

function siteIkonlariDonustur(kok = document.body) {
  if (!kok) return;
  const root = kok.nodeType === Node.TEXT_NODE ? kok.parentElement : kok;
  if (!root) return;
  const gezici = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !SITE_ICON_KEYS.some(k => node.nodeValue.includes(k))) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest('script, style, textarea, input, .site-inline-icon')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (gezici.nextNode()) nodes.push(gezici.currentNode);
  nodes.forEach(_siteTextNodeIkonlastir);
}
window.siteIkonlariDonustur = siteIkonlariDonustur;

function _siteIkonGozlemciBaslat() {
  if (!document.body || document.body.dataset.siteIkonGozlemci === '1') return;
  document.body.dataset.siteIkonGozlemci = '1';
  let bekliyor = false;
  const tara = () => {
    if (bekliyor) return;
    bekliyor = true;
    requestAnimationFrame(() => {
      bekliyor = false;
      siteIkonlariDonustur(document.body);
    });
  };
  new MutationObserver((degisimler) => {
    if (degisimler.some(d => d.type === 'characterData' || d.addedNodes.length)) tara();
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
  siteIkonlariDonustur(document.body);
  _siteIkonGozlemciBaslat();
});

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
      kartSecici: '#hypV2NufusKart',
      hedefSecici: null,
      geriSecici: ':scope'
    },
    {
      mobilAlanId: 'ascMobilNufusAlan',
      stickySecici: '#panel-asc .ust-kartlar-sticky',
      kartSecici: '#ascNufusKart',
      hedefSecici: null,
      geriSecici: ':scope'
    }
  ];

  alanlar.forEach(({ mobilAlanId, stickySecici, kartSecici }) => {
    const mobilAlan = document.getElementById(mobilAlanId);
    const stickyAlan = document.querySelector(stickySecici);
    const kart = document.querySelector(kartSecici);
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

function _hesaplaCalismaAlaninaGit() {
  const hedef = document.querySelector('#panel-hypv2 .hesap-ust-aksiyon')
    || document.getElementById('panel-hypv2')
    || document.getElementById('hesapla');
  if (!hedef) return;
  const ustPay = 6;
  const y = hedef.getBoundingClientRect().top + window.scrollY - ustPay;
  window.scrollTo({ top: Math.max(0, y), left: 0, behavior: 'auto' });
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

  document.querySelectorAll('a[href="#hesapla"], a[href$="index.html#hesapla"]').forEach(a => {
    a.addEventListener('click', () => {
      requestAnimationFrame(() => setTimeout(_hesaplaCalismaAlaninaGit, 80));
    });
  });

  if (window.location.hash === '#hesapla') {
    requestAnimationFrame(() => {
      setTimeout(_hesaplaCalismaAlaninaGit, 120);
      setTimeout(_hesaplaCalismaAlaninaGit, 420);
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

  const HYP_V2_SON_VERI_CEKIM_KEY = 'hypV2_son_veri_cekim_tarihi';

  function _sonVeriCekimTsAl(raw) {
    const ts = Number(raw);
    return Number.isFinite(ts) && ts > 0 ? ts : 0;
  }

  function _sonVeriCekimFormatla(ts) {
    const dt = new Date(ts);
    if (!Number.isFinite(dt.getTime())) return '';
    return dt.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function _sonVeriCekimGoster(ts) {
    const wrap = document.getElementById('hypV2SonVeriCekim');
    const deger = document.getElementById('hypV2SonVeriCekimDeger');
    if (!wrap || !deger) return;
    const temizTs = _sonVeriCekimTsAl(ts);
    const metin = temizTs ? _sonVeriCekimFormatla(temizTs) : '';
    if (!metin) {
      wrap.hidden = true;
      deger.textContent = '—';
      return;
    }
    deger.textContent = metin;
    wrap.hidden = false;
    wrap.title = `Eklentiden son veri çekimi: ${metin}`;
  }

  function _sonVeriCekimKaydet(ts) {
    const temizTs = _sonVeriCekimTsAl(ts) || Date.now();
    try { localStorage.setItem(HYP_V2_SON_VERI_CEKIM_KEY, String(temizTs)); } catch (_) {}
    _sonVeriCekimGoster(temizTs);
  }

  function _sonVeriCekimYukle() {
    let ts = 0;
    try {
      ts = _sonVeriCekimTsAl(localStorage.getItem(HYP_V2_SON_VERI_CEKIM_KEY));
      if (!ts) {
        const kayit = JSON.parse(localStorage.getItem('hesap_verileri_v1') || 'null');
        ts = _sonVeriCekimTsAl(kayit?.hypV2?.veriCekimTarihi);
      }
    } catch (_) {}
    _sonVeriCekimGoster(ts);
  }

  _sonVeriCekimYukle();
  window.addEventListener('hesap-eklenti-veri-geldi', (e) => {
    const ts = _sonVeriCekimTsAl(e?.detail?.veriCekimTarihi);
    if (ts) _sonVeriCekimKaydet(ts);
    else _sonVeriCekimYukle();
  });

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
    let sayac = 0;
    const nufusEl = document.getElementById('hypV2Nufus');
    if (nufusEl && Object.prototype.hasOwnProperty.call(resp, 'nufus')) nufusEl.value = resp.nufus || '';
    const nufusTipEl = document.getElementById('hypV2NufusTip');
    if (nufusTipEl && resp.nufusTip) nufusTipEl.value = resp.nufusTip;
    const nufusPuaniEl = document.getElementById('hypV2NufusPuani');
    if (nufusPuaniEl && Object.prototype.hasOwnProperty.call(resp, 'nufusPuani')) nufusPuaniEl.value = resp.nufusPuani || '';
    _sonVeriCekimKaydet(resp.veriCekimTarihi || resp.guncellenme || Date.now());
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
