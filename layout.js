// ═══ Drag-drop kriter satırı + sütun sıralama (SortableJS ile) ═══
// SortableJS native HTML5 drag yerine pointer events kullanır — mobile'de
// dokunmatikle yumuşak çalışır. CDN ile dahil edildi (index.html'de).
// Default OLARAK KAPALI — kullanıcı "⇅ Sırala" butonuna basınca aktif olur,
// tekrar basınca kapanır. Yanlış sürüklemeleri engeller.
// localStorage'a kaydeder; auth.js Firestore'a senkronlar.

(function() {
  const LS_KEY = 'hesap_layout_v1';
  const SIRA_MODU_KEY = 'hyp_sira_modu_v1';
  // SINA "Gerçekleşme Tablosu" sırası (kullanıcının ekran görüntüsünden) —
  // prefix-bazlı; reorder yalnız satır görünümünü değiştirir, veri (G/Y/D)
  // kriterin prefix'ine bağlı olduğu için ASLA karışmaz. İnme ve Otizm en altta.
  const HYP_SINA_SIRA = [
    'kvrTakip', 'obzTarama', 'dmTarama', 'kah', 'kvrTarama', 'kbh', 'astim',
    'dmTakip', 'htTarama', 'htTakip', 'kolorektal', 'meme', 'serviks', 'koah',
    'obzTakip', 'yasli', 'inme', 'otizm',
  ];
  // Aktif sortable instance'ları (toggle için): { tabloId: [Sortable, ...] }
  const _instances = {};

  function _layoutOku() {
    try {
      const ham = localStorage.getItem(LS_KEY);
      return ham ? JSON.parse(ham) : {};
    } catch (_) { return {}; }
  }
  function _layoutYaz(layout) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(layout)); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('hesap-layout-degisti')); } catch (_) {}
  }
  function _kaydet(tabloId, tip, sira) {
    const layout = _layoutOku();
    layout[tabloId] = layout[tabloId] || {};
    layout[tabloId][tip] = sira;
    _layoutYaz(layout);
  }
  function _oku(tabloId, tip) {
    const layout = _layoutOku();
    return layout[tabloId]?.[tip];
  }

  // ── Kriter satır sırasını DOM'a uygula ──
  function _kriterSiraUygula(tablo) {
    const sira = _oku(tablo.id, 'kriter');
    if (!Array.isArray(sira) || !sira.length) return;
    const tbody = tablo.querySelector('tbody');
    if (!tbody) return;
    const map = {};
    tbody.querySelectorAll('tr[data-prefix]').forEach(tr => { map[tr.dataset.prefix] = tr; });
    sira.forEach(p => { if (map[p]) tbody.appendChild(map[p]); });
  }

  // ── Sütun sırasını DOM'a uygula (her satır için cell'leri yeniden yerleştir) ──
  function _sutunSiraUygula(tablo) {
    const sira = _oku(tablo.id, 'sutun');
    if (!Array.isArray(sira) || !sira.length) return;
    tablo.querySelectorAll('thead tr, tbody tr').forEach(tr => {
      const cellsByKolon = {};
      Array.from(tr.children).forEach(cell => {
        const k = cell.dataset.kolon;
        if (k) cellsByKolon[k] = cell;
      });
      sira.forEach(k => {
        const cell = cellsByKolon[k];
        if (cell) tr.appendChild(cell);
      });
    });
  }

  // ── SortableJS ile kriter satırı drag-drop ──
  function _kriterDragBagla(tablo) {
    const tbody = tablo.querySelector('tbody');
    if (!tbody || tbody.dataset.sortableBagli === '1') return;
    if (typeof Sortable === 'undefined') return;
    tbody.dataset.sortableBagli = '1';

    // HYP v2 2-sütun modunda ikinci tablo ile aynı grupta olsun ki satırlar
    // sağ/sol sütun arasında sürüklenebilsin.
    const iseHypV2 = tablo.id === 'hypV2Tablo';
    const grup = iseHypV2 ? 'hypv2-kriter' : undefined;

    const kaydetCombineli = () => {
      let siraliSatirlar;
      if (iseHypV2) {
        const tbody2 = document.getElementById('hypV2KriterlerBody2');
        siraliSatirlar = [
          ...Array.from(tbody.querySelectorAll('tr[data-prefix]')),
          ...(tbody2 ? Array.from(tbody2.querySelectorAll('tr[data-prefix]')) : []),
        ];
      } else {
        siraliSatirlar = Array.from(tbody.querySelectorAll('tr[data-prefix]'));
      }
      const yeniSira = siraliSatirlar.map(r => r.dataset.prefix);
      _kaydet(tablo.id, 'kriter', yeniSira);
    };

    const inst1 = Sortable.create(tbody, {
      handle: '[data-kolon="kriter"]',   // hem ⋮⋮ hem kriter adı üzerinden
      animation: 150,
      delay: 100,           // long-press gecikmesi (mobile'de yanlış sürüklemeyi engeller)
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      ghostClass: 'sira-ghost',
      chosenClass: 'sira-chosen',
      dragClass: 'sira-drag',
      group: grup,
      disabled: true,       // Default kapalı — "⇅ Sırala" butonuyla açılır
      onEnd: kaydetCombineli,
    });
    _instances[tablo.id] = _instances[tablo.id] || [];
    _instances[tablo.id].push(inst1);

    // İkinci tabloya da aynı grupla bağla (HYP v2)
    if (iseHypV2) {
      const tbody2 = document.getElementById('hypV2KriterlerBody2');
      if (tbody2 && tbody2.dataset.sortableBagli !== '1') {
        tbody2.dataset.sortableBagli = '1';
        const inst2 = Sortable.create(tbody2, {
          handle: '[data-kolon="kriter"]',
          animation: 150,
          delay: 100,
          delayOnTouchOnly: true,
          touchStartThreshold: 5,
          ghostClass: 'sira-ghost',
          chosenClass: 'sira-chosen',
          dragClass: 'sira-drag',
          group: grup,
          disabled: true,
          onEnd: kaydetCombineli,
        });
        _instances[tablo.id].push(inst2);
      }
    }
  }

  // ── SortableJS ile sütun (thead) drag-drop ──
  function _sutunDragBagla(tablo) {
    const thead = tablo.querySelector('thead tr');
    if (!thead || thead.dataset.sortableBagli === '1') return;
    if (typeof Sortable === 'undefined') return;
    thead.dataset.sortableBagli = '1';
    const instTh = Sortable.create(thead, {
      animation: 150,
      delay: 100,
      delayOnTouchOnly: true,
      filter: '[data-kolon="kriter"], button',  // Kriter sütunu sabit + butonlara dokunma
      preventOnFilter: false,
      disabled: true,                            // Default kapalı
      onMove: (evt) => evt.related.dataset.kolon !== 'kriter',
      onEnd: () => {
        const yeniSira = Array.from(thead.children)
          .map(t => t.dataset.kolon).filter(Boolean);
        _kaydet(tablo.id, 'sutun', yeniSira);
        // tbody satırlarında da aynı sırayı uygula
        _sutunSiraUygula(tablo);
      },
    });
    _instances[tablo.id] = _instances[tablo.id] || [];
    _instances[tablo.id].push(instTh);
  }

  // ── Sıralama modu toggle ──
  function _siralamaToggle(tabloId) {
    const insts = _instances[tabloId] || [];
    if (!insts.length) return false;
    const yeniDurum = insts[0].option('disabled');   // şu an disabled mı?
    const aktif = yeniDurum;                          // disabled true ise aktif et
    insts.forEach(s => s.option('disabled', !aktif));
    document.body.classList.toggle('sirala-aktif', aktif);
    document.body.dataset.siralaTablo = aktif ? tabloId : '';
    // Buton görünümünü güncelle
    document.querySelectorAll('.btn-sirala-toggle').forEach(b => {
      const isThis = b.dataset.siralaTablo === tabloId;
      b.classList.toggle('aktif', isThis && aktif);
      if (isThis) b.textContent = aktif ? '✓ Bitir' : '⇅ Sırala';
    });
    if (aktif && typeof window.siteToast === 'function') {
      window.siteToast('🖐 Kriter satırlarını sürükle-bırak ile yeniden sırala — bitince "✓ Bitir" tuşuna bas', 'bilgi');
    }
    return aktif;
  }

  function init() {
    const tablolar = ['hypV2Tablo', 'ascTablo']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    // Sütun sıralama kaldırıldı — sadece kriter satırı drag
    tablolar.forEach(t => {
      _kriterSiraUygula(t);
      _kriterDragBagla(t);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 100);
    // Sıralama toggle butonu (her tablo için)
    document.querySelectorAll('.btn-sirala-toggle').forEach(btn => {
      btn.addEventListener('click', () => _siralamaToggle(btn.dataset.siralaTablo));
    });
  });

  // ── Hazır sıra (Klasik / SINA) uygula — prefix-bazlı, veri güvenli ──
  function _siraModu() {
    try { return localStorage.getItem(SIRA_MODU_KEY) === 'sina' ? 'sina' : 'klasik'; }
    catch (_) { return 'klasik'; }
  }
  function _siraPreset(tabloId, mod) {
    const tablo = document.getElementById(tabloId);
    if (!tablo) return;
    // Tabloda fiilen bulunan prefix'ler (2-sütunda satırlar iki tbody'ye bölünür)
    const tablo2 = tabloId === 'hypV2Tablo' ? document.getElementById('hypV2Tablo2') : null;
    const mevcut = new Set();
    [tablo, tablo2].forEach(t => t && t.querySelectorAll('tr[data-prefix]').forEach(tr => mevcut.add(tr.dataset.prefix)));
    const klasik = (typeof window.hesapKlasikSira === 'function')
      ? window.hesapKlasikSira()
      : (window.HYP2_KRITERLER || []).map(k => k.prefix);
    let sira = (mod === 'sina' ? HYP_SINA_SIRA : klasik).filter(p => mevcut.has(p));
    // Listede olmayan prefix kalırsa sona ekle (eksiksiz olsun)
    mevcut.forEach(p => { if (!sira.includes(p)) sira.push(p); });
    _kaydet(tabloId, 'kriter', sira);     // layout (prefix sırası) — veri değil
    try { localStorage.setItem(SIRA_MODU_KEY, mod === 'sina' ? 'sina' : 'klasik'); } catch (_) {}
    // 2-sütun varsa: tüm satırları ilk tbody'de topla, sırala, sonra yeniden böl
    if (tablo2) {
      const tbody1 = tablo.querySelector('tbody');
      const tbody2 = tablo2.querySelector('tbody');
      if (tbody1 && tbody2) Array.from(tbody2.children).forEach(tr => tbody1.appendChild(tr));
    }
    _kriterSiraUygula(tablo);
    if (typeof window.hypV2GoruntuYenile === 'function') window.hypV2GoruntuYenile();
    try { window.dispatchEvent(new CustomEvent('hesap-layout-degisti')); } catch (_) {}
  }

  // Public API
  window.hesapSiralamaToggle = _siralamaToggle;
  window.hesapSiraPreset = _siraPreset;
  window.hesapSiraModu = _siraModu;
  window.hesapKriterSiraUygula = _kriterSiraUygula; // hesapla.js 2-sütun render'ı sırayı uygular

  window.addEventListener('hesap-layout-uygula', () => {
    document.querySelectorAll('#hypV2Tablo, #ascTablo').forEach(t => {
      _kriterSiraUygula(t);
    });
  });

  window.hesapLayoutOku = _layoutOku;
  window.hesapLayoutYaz = (layout) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(layout || {})); } catch (_) {}
    document.querySelectorAll('#hypV2Tablo, #ascTablo').forEach(t => {
      _kriterSiraUygula(t);
    });
  };
})();
