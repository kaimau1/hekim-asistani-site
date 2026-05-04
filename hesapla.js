// ═══ Ahek Plus — Tanıtım sitesi hesaplama motoru ═══
// Kaynaklar (eklentiden adapte): popup_hyp_v2.js + popup_asc.js
// Storage yok — girdiler runtime'da, sayfa yenilenince silinir.

// ──────────────────────────────────────────
// HYP v2 (Yeni HYP Hesapla) — 17 kriter
// ──────────────────────────────────────────

const HYP2_KRITERLER = [
  { ad: 'HT Tarama',     prefix: 'htTarama',  grup: 'HIPERTANSIYON' },
  { ad: 'HT İzlem',      prefix: 'htTakip',   grup: 'HIPERTANSIYON' },
  { ad: 'DM Tarama',     prefix: 'dmTarama',  grup: 'DIYABET' },
  { ad: 'DM İzlem',      prefix: 'dmTakip',   grup: 'DIYABET' },
  { ad: 'Obz Tarama',    prefix: 'obzTarama', grup: 'OBEZITE' },
  { ad: 'Obz İzlem',     prefix: 'obzTakip',  grup: 'OBEZITE' },
  { ad: 'Serviks Tarama',    prefix: 'serviks',    grup: 'KANSER' },
  { ad: 'Kolorektal Tarama',  prefix: 'kolorektal', grup: 'KANSER' },
  { ad: 'Mamografi Tarama',    prefix: 'meme',       grup: 'KANSER' },
  { ad: 'KVR Tarama',    prefix: 'kvrTarama', grup: 'KVR' },
  { ad: 'KVR İzlem',     prefix: 'kvrTakip',  grup: 'KVR' },
  { ad: 'Yaşlı İzlem',   prefix: 'yasli',     grup: 'KRONIK' },
  { ad: 'KAH İzlem',     prefix: 'kah',       grup: 'KRONIK' },
  { ad: 'İnme İzlem',    prefix: 'inme',      grup: 'KRONIK' },
  { ad: 'KBH İzlem',     prefix: 'kbh',       grup: 'KRONIK' },
  { ad: 'KOAH İzlem',    prefix: 'koah',      grup: 'KRONIK' },
  { ad: 'Astım İzlem',   prefix: 'astim',     grup: 'KRONIK' },
  { ad: 'Otizm Tarama',   prefix: 'otizm',     grup: 'KRONIK' },
];

const HYP2_TABLO = {
  htTarama: { asgari: 40, azami: 90, belowMin: 0.993999, maxCoeff: 1.023440 },
  htTakip:  { asgari: 50, azami: 90, belowMin: 0.996994, maxCoeff: 1.011652 },
  dmTarama: { asgari: 40, azami: 90, belowMin: 0.993999, maxCoeff: 1.023440 },
  dmTakip:  { asgari: 50, azami: 90, belowMin: 0.996994, maxCoeff: 1.011652 },
  obzTarama:{ asgari: 40, azami: 90, belowMin: 0.996994, maxCoeff: 1.011652 },
  obzTakip: { asgari: 50, azami: 90, belowMin: 0.993997, maxCoeff: 1.023440 },
  serviks:    { asgari: 50, azami: 90, belowMin: 0.99101, maxCoeff: 1.035365 },
  kolorektal: { asgari: 50, azami: 90, belowMin: 0.99101, maxCoeff: 1.035365 },
  meme:       { asgari: 40, azami: 90, belowMin: 0.99101, maxCoeff: 1.035365 },
  kvrTarama: { asgari: 40, azami: 90, belowMin: 0.993999, maxCoeff: 1.023440 },
  kvrTakip:  { asgari: 50, azami: 90, belowMin: 0.996994, maxCoeff: 1.011652 },
  yasli: { asgari: 50, azami: 90, belowMin: 0.993997, maxCoeff: 1.023440 },
  kah:   { asgari: 40, azami: 85, belowMin: 0.993997, maxCoeff: 1.023440 },
  inme:  { asgari: 40, azami: 85, belowMin: 0.993997, maxCoeff: 1.023440 },
  kbh:   { asgari: 40, azami: 85, belowMin: 0.993997, maxCoeff: 1.023440 },
  koah:  { asgari: 40, azami: 85, belowMin: 0.993997, maxCoeff: 1.023440 },
  astim: { asgari: 40, azami: 85, belowMin: 0.993997, maxCoeff: 1.023440 },
  otizm: { asgari: 40, azami: 90, belowMin: 0.993997, maxCoeff: 1.023440 },
};

const HYP2_SUREC = { asgari: 50, azami: 80, belowMin: 1, maxCoeff: 1 };
const HYP2_MAX_TAVAN = Object.values(HYP2_TABLO).reduce((p, t) => p * t.maxCoeff, 1) * HYP2_SUREC.maxCoeff;

const HYP2_GRUPLAR = [
  { tip: 'HIPERTANSIYON', ad: 'Hipertansiyon' },
  { tip: 'DIYABET',       ad: 'Diyabet' },
  { tip: 'OBEZITE',       ad: 'Obezite' },
  { tip: 'KVR',           ad: 'Kardiyovasküler Risk' },
  { tip: 'KRONIK',        ad: 'Kronik Hastalık Takibi' },
  { tip: 'KANSER',        ad: 'Kanser Tarama' },
];

function hypKatsayi(oran, t) {
  if (oran < t.asgari) return t.belowMin;
  if (oran >= t.azami) return t.maxCoeff;
  return 1 + (t.maxCoeff - 1) * (oran - t.asgari) / (t.azami - t.asgari);
}

// Mobilde iki sütun kullanılabilir mi? (tablet + altında zorla tek sütun)
function _ikiSutunMumkunMu() {
  return window.innerWidth >= 900;
}

function hypV2TabloKur() {
  const tbody = document.getElementById('hypV2KriterlerBody');
  if (!tbody || tbody.dataset.kuruldu === '1') return;
  tbody.dataset.kuruldu = '1';

  HYP2_GRUPLAR.forEach(grup => {
    const grupKriterler = HYP2_KRITERLER.filter(k => k.grup === grup.tip);
    grupKriterler.forEach((k) => {
      const tr = document.createElement('tr');
      tr.dataset.prefix = k.prefix;
      tr.innerHTML =
        `<td data-kolon="kriter"><span class="drag-handle" title="Sürükle-bırak ile sırala">⋮⋮</span><span class="kriter-ad">${k.ad}</span></td>` +
        `<td data-kolon="g"><input class="sayi-inp" data-hypv2="${k.prefix}-G" type="number" min="0" inputmode="numeric" placeholder="—"></td>` +
        `<td data-kolon="y"><input class="sayi-inp" data-hypv2="${k.prefix}-Y" type="number" min="0" inputmode="numeric" placeholder="—"></td>` +
        `<td data-kolon="d"><input class="sayi-inp" data-hypv2="${k.prefix}-D" type="number" min="0" inputmode="numeric" placeholder="—"></td>` +
        `<td data-kolon="hedef" class="hedef-cell">` +
          `<div class="bar-tum" id="hypV2_${k.prefix}_BT">` +
            `<div class="bar-ust">` +
              `<span class="bar-pct" id="hypV2_${k.prefix}_P">—</span>` +
              `<span class="bar-ks-deger" id="hypV2_${k.prefix}_KS">—</span>` +
              `<span class="bar-hedef-ulasildi"></span>` +
              `<input class="hedef-inp bar-hedef-inp" data-hypv2="${k.prefix}-H" type="number" min="0" inputmode="numeric" placeholder="—">` +
            `</div>` +
            `<div class="bar-oluk"><div class="bar-dolgu"></div></div>` +
            `<div class="bar-alt-etiketler"></div>` +
          `</div>` +
        `</td>`;
      tbody.appendChild(tr);
      // Hedef bar sürükleme bağla
      const btDiv = tr.querySelector('.bar-tum');
      if (btDiv) _barHedefDragBagla(btDiv, 'data-hypv2', k.prefix);
    });
  });

  const _hypV2InputHandler = (e) => {
    if (e.target && e.target.matches('input[data-hypv2]')) {
      hypV2Hesapla();
      _veriDegistiSinyali();
    }
  };
  tbody.addEventListener('input', _hypV2InputHandler);
  // 2-sütun modunda tbody2'e taşınan satırlar için de dinle
  const tbody2 = document.getElementById('hypV2KriterlerBody2');
  if (tbody2) tbody2.addEventListener('input', _hypV2InputHandler);
  document.getElementById('hypV2Nufus')?.addEventListener('input', (e) => {
    // HYP v2 → ASÇ nüfus senkronu
    const ascN = document.getElementById('ascNufus');
    if (ascN) ascN.value = e.target.value;
    hypV2Hesapla();
    if (typeof ascHesapla === 'function') ascHesapla();
    _veriDegistiSinyali();
  });
  document.getElementById('hypV2NufusTip')?.addEventListener('change', (e) => {
    const ascT = document.getElementById('ascNufusTip');
    if (ascT) ascT.value = e.target.value;
    hypV2Hesapla();
    if (typeof ascHesapla === 'function') ascHesapla();
    _veriDegistiSinyali();
  });

  // Görünüm toggle: tek sütun ↔ iki sütun (sadece masaüstü)
  document.getElementById('hypV2GoruntuToggle')?.addEventListener('click', () => {
    if (!_ikiSutunMumkunMu()) return;    // mobilde devre dışı
    const aktif = document.body.classList.toggle('hyp-v2-2sutun');
    _hypV2GoruntuUygula(aktif);
    try { localStorage.setItem('hypV2Goruntu2Sutun', aktif ? '1' : '0'); } catch (_) {}
  });
  try {
    if (_ikiSutunMumkunMu() && localStorage.getItem('hypV2Goruntu2Sutun') === '1') {
      document.body.classList.add('hyp-v2-2sutun');
      _hypV2GoruntuUygula(true);
    }
  } catch (_) {}

  // Viewport mobile'a küçülürse iki sütun modunu kapat
  window.addEventListener('resize', () => {
    if (!_ikiSutunMumkunMu() && document.body.classList.contains('hyp-v2-2sutun')) {
      document.body.classList.remove('hyp-v2-2sutun');
      _hypV2GoruntuUygula(false);
    }
  });
}

// İki sütun modunda: thead'i 2. tabloya klonla, satırları yarıya böl.
// Tek sütuna dönüşte: tüm satırları ilk tbody'e geri taşı, 2. tabloyu gizle.
function _hypV2GoruntuUygula(ikiSutun) {
  const btn = document.getElementById('hypV2GoruntuToggle');
  if (btn) btn.textContent = ikiSutun ? '☰ Tek Sütun' : '⫴ İki Sütun';
  const tbody1 = document.getElementById('hypV2KriterlerBody');
  const tbody2 = document.getElementById('hypV2KriterlerBody2');
  const tablo2 = document.getElementById('hypV2Tablo2');
  if (!tbody1 || !tbody2 || !tablo2) return;

  if (ikiSutun) {
    // thead'i klonla (ilk kurulumda)
    const thead1 = document.querySelector('#hypV2Tablo thead');
    const thead2 = tablo2.querySelector('thead');
    if (thead1 && thead2 && thead2.children.length === 0) {
      thead2.innerHTML = thead1.innerHTML;
      thead2.querySelectorAll('.hedef-ai-header').forEach(el => {
        el.classList.add('hedef-ai-header--pasif');
        el.setAttribute('aria-hidden', 'true');
        el.querySelectorAll('button').forEach(btn => {
          btn.tabIndex = -1;
          btn.setAttribute('aria-hidden', 'true');
        });
      });
      thead2.querySelectorAll('.btn-tumu-sifirla').forEach(el => {
        el.classList.add('kriter-tumu-sifirla--pasif');
        el.tabIndex = -1;
        el.setAttribute('aria-hidden', 'true');
      });
    }
    // Önce tüm satırları tbody1'e topla (önceki yarım bölümü sıfırla)
    Array.from(tbody2.children).forEach(tr => tbody1.appendChild(tr));
    // Şimdi yarıya böl — ilk yarı tbody1'de, ikinci yarı tbody2'ye
    const satirlar = Array.from(tbody1.querySelectorAll('tr[data-prefix]'));
    const orta = Math.ceil(satirlar.length / 2);
    satirlar.slice(orta).forEach(tr => tbody2.appendChild(tr));
    tablo2.hidden = false;
  } else {
    // Tek sütun: 2. tbody'deki tüm satırları geri taşı
    Array.from(tbody2.children).forEach(tr => tbody1.appendChild(tr));
    tablo2.hidden = true;
  }
}

// Profil senkronu için sinyal — auth.js dinler (Firestore senkronu)
// Ayrıca her değişiklikte localStorage'a da yazar — anonim kullanımda da veri kalıcı olsun
function _veriDegistiSinyali() {
  _localStorageYaz();
  try { window.dispatchEvent(new CustomEvent('hesap-verisi-degisti')); } catch (_) {}
}

// ──────────────────────────────────────────
// localStorage — anonim kullanıcılar için yerel cache
// Giriş yapılmamışsa bile veriler cihazda kalır, sayfa yenilense
// de silinmez. Hasta verisi değil (sadece kriter sayıları),
// kullanım alışkanlığı / taslak niteliğindedir.
// ──────────────────────────────────────────

const _LS_HESAP_KEY = 'hesap_verileri_v1';

function _localStorageYaz() {
  try {
    const veri = {
      hypV2: {
        nufus: parseInt(document.getElementById('hypV2Nufus')?.value) || 0,
        nufusTip: document.getElementById('hypV2NufusTip')?.value || '3500',
        kriterler: {},
        profil: {},
      },
      asc: {
        hekimKS: parseFloat(document.getElementById('ascHekimKS')?.value) || 0,
        nufus: parseInt(document.getElementById('ascNufus')?.value) || 0,
        nufusTip: document.getElementById('ascNufusTip')?.value || '3500',
        kriterler: {},
        profil: {},
      },
    };
    HYP2_KRITERLER.forEach(k => {
      veri.hypV2.kriterler[k.prefix] = {
        g: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-G"]`)?.value) || 0,
        y: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-Y"]`)?.value) || 0,
        d: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-D"]`)?.value) || 0,
        h: parseInt(document.querySelector(`input[data-hypv2="${k.prefix}-H"]`)?.value) || 0,
      };
      veri.hypV2.profil[k.prefix] = {
        max: parseInt(document.querySelector(`input[data-v2-profil="${k.prefix}-max"]`)?.value) || 0,
        efor: parseInt(document.querySelector(`select[data-v2-profil="${k.prefix}-efor"]`)?.value) || 3,
        oncelik: parseInt(document.querySelector(`select[data-v2-profil="${k.prefix}-oncelik"]`)?.value) || ONCELIK_DEFAULT,
      };
    });
    ASC_KRITERLER.forEach(k => {
      veri.asc.kriterler[k.prefix] = {
        g: parseInt(document.querySelector(`input[data-asc="${k.prefix}-G"]`)?.value) || 0,
        y: parseInt(document.querySelector(`input[data-asc="${k.prefix}-Y"]`)?.value) || 0,
        d: parseInt(document.querySelector(`input[data-asc="${k.prefix}-D"]`)?.value) || 0,
        h: parseInt(document.querySelector(`input[data-asc="${k.prefix}-H"]`)?.value) || 0,
      };
      veri.asc.profil[k.prefix] = {
        max: parseInt(document.querySelector(`input[data-asc-profil="${k.prefix}-max"]`)?.value) || 0,
        efor: parseInt(document.querySelector(`select[data-asc-profil="${k.prefix}-efor"]`)?.value) || 3,
        oncelik: parseInt(document.querySelector(`select[data-asc-profil="${k.prefix}-oncelik"]`)?.value) || ONCELIK_DEFAULT,
      };
    });
    localStorage.setItem(_LS_HESAP_KEY, JSON.stringify(veri));
  } catch (_) { /* quota veya erişim engelli */ }
}

function _localStorageYukle() {
  let d;
  try {
    const raw = localStorage.getItem(_LS_HESAP_KEY);
    if (!raw) return;
    d = JSON.parse(raw);
  } catch (_) { return; }
  if (!d) return;

  if (d.hypV2) {
    const nufusEl = document.getElementById('hypV2Nufus');
    if (nufusEl && d.hypV2.nufus) nufusEl.value = d.hypV2.nufus;
    const nufusTipEl = document.getElementById('hypV2NufusTip');
    if (nufusTipEl && d.hypV2.nufusTip) nufusTipEl.value = d.hypV2.nufusTip;
    Object.entries(d.hypV2.kriterler || {}).forEach(([prefix, kay]) => {
      ['g','y','d','h'].forEach(suf => {
        const el = document.querySelector(`input[data-hypv2="${prefix}-${suf.toUpperCase()}"]`);
        if (el && kay[suf]) el.value = kay[suf];
      });
    });
    Object.entries(d.hypV2.profil || {}).forEach(([prefix, p]) => {
      const maxEl = document.querySelector(`input[data-v2-profil="${prefix}-max"]`);
      const eforEl = document.querySelector(`select[data-v2-profil="${prefix}-efor"]`);
      const oncelikEl = document.querySelector(`select[data-v2-profil="${prefix}-oncelik"]`);
      if (maxEl && p.max) maxEl.value = p.max;
      if (eforEl && p.efor) eforEl.value = p.efor;
      if (oncelikEl && p.oncelik) oncelikEl.value = p.oncelik;
      if (oncelikEl) oncelikEl.hidden = parseInt(eforEl?.value) !== EFOR_MECBUR;
    });
  }
  if (d.asc) {
    const ksEl = document.getElementById('ascHekimKS');
    if (ksEl && d.asc.hekimKS) ksEl.value = d.asc.hekimKS;
    const ascNufusEl = document.getElementById('ascNufus');
    if (ascNufusEl && d.asc.nufus) ascNufusEl.value = d.asc.nufus;
    const ascNufusTipEl = document.getElementById('ascNufusTip');
    if (ascNufusTipEl && d.asc.nufusTip) ascNufusTipEl.value = d.asc.nufusTip;
    Object.entries(d.asc.kriterler || {}).forEach(([prefix, kay]) => {
      ['g','y','d','h'].forEach(suf => {
        const el = document.querySelector(`input[data-asc="${prefix}-${suf.toUpperCase()}"]`);
        if (el && kay[suf]) el.value = kay[suf];
      });
    });
    Object.entries(d.asc.profil || {}).forEach(([prefix, p]) => {
      const maxEl = document.querySelector(`input[data-asc-profil="${prefix}-max"]`);
      const eforEl = document.querySelector(`select[data-asc-profil="${prefix}-efor"]`);
      const oncelikEl = document.querySelector(`select[data-asc-profil="${prefix}-oncelik"]`);
      if (maxEl && p.max) maxEl.value = p.max;
      if (eforEl && p.efor) eforEl.value = p.efor;
      if (oncelikEl && p.oncelik) oncelikEl.value = p.oncelik;
      if (oncelikEl) oncelikEl.hidden = parseInt(eforEl?.value) !== EFOR_MECBUR;
    });
  }
}

// auth.js'nin cloud'dan veri alıp formlara uyguladıktan sonra çağırabilmesi için
window.hesapLocalKaydet = _localStorageYaz;

// Sayı inputları odaktayken mouse tekerleği değeri değiştirmesin;
// event iptal edilmediği için sayfa scroll'u normal akmaya devam eder.
document.addEventListener('wheel', (e) => {
  const hedef = e.target;
  if (hedef?.matches?.('input[type="number"]') && document.activeElement === hedef) {
    hedef.blur();
  }
}, { passive: true, capture: true });

function _v2Deger(prefix, suf) {
  const el = document.querySelector(`input[data-hypv2="${prefix}-${suf}"]`);
  return parseInt(el?.value) || 0;
}

// ──────────────────────────────────────────────────────────────
// Bar üzerinde pointer ile hedef değerini sürükleyebilme
// ──────────────────────────────────────────────────────────────
function _barHedefDragBagla(container, dataAttr, prefix) {
  const oluk = container.querySelector('.bar-oluk');
  if (!oluk || oluk.dataset.dragBagli === '1') return;
  oluk.dataset.dragBagli = '1';

  let dragAktif = false;

  const guncelle = (clientX) => {
    const rect = oluk.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const gEl = document.querySelector(`input[${dataAttr}="${prefix}-G"]`);
    const hEl = document.querySelector(`input[${dataAttr}="${prefix}-H"]`);
    const G = parseInt(gEl?.value) || 0;
    if (G <= 0 || !hEl) return;
    const yeniHedef = Math.max(0, Math.min(G, Math.round(G * pct / 100)));
    hEl.value = yeniHedef || '';
    hEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const bas = (e) => {
    // Sadece hedef tick üzerine basıldığında sürüklemeye başla
    if (!e.target.classList?.contains('tick-hedef')) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX == null) return;
    e.preventDefault();
    dragAktif = true;
    container.classList.add('bar-surukleniyor');
    try { oluk.setPointerCapture(e.pointerId); } catch (_) {}
    guncelle(clientX);
  };
  const hareket = (e) => {
    if (!dragAktif) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (clientX == null) return;
    guncelle(clientX);
  };
  const bitir = () => {
    dragAktif = false;
    container.classList.remove('bar-surukleniyor');
  };

  oluk.addEventListener('pointerdown', bas);
  oluk.addEventListener('pointermove', hareket);
  oluk.addEventListener('pointerup', bitir);
  oluk.addEventListener('pointercancel', bitir);
  oluk.addEventListener('pointerleave', bitir);
}

// ──────────────────────────────────────────────────────────────
// Tek-bar görseli: Asgari / Hedef / Tavan işaretleri üzerinde,
// 0-%100 ölçeğinde yapılan+devir oranı dolgusuyla.
// ──────────────────────────────────────────────────────────────
function _barCiz(container, { G, Y, D, hedef, asgari, azami }) {
  if (!container) return;
  const etkDevir = (G > 0 && Y >= G * 0.10) ? D : 0;
  const ilerlemePct = G > 0 ? Math.min(100, Math.max(0, ((Y + etkDevir) / G) * 100)) : 0;
  const hedefPct = G > 0 && hedef > 0 ? Math.min(100, (hedef / G) * 100) : 0;
  const alt = container.querySelector('.bar-alt-etiketler');
  const oluk = container.querySelector('.bar-oluk');
  const dolgu = container.querySelector('.bar-dolgu');
  const inp = container.querySelector('.bar-hedef-inp');
  if (!alt || !oluk || !dolgu) return;

  if (G <= 0) {
    alt.innerHTML = '';
    dolgu.style.width = '0%';
    oluk.querySelectorAll('.bar-tick').forEach(t => t.remove());
    if (inp) {
      inp.style.left = '';
      inp.classList.remove('ulasildi');
    }
    const ulasildiEl = container.querySelector('.bar-hedef-ulasildi');
    if (ulasildiEl) {
      ulasildiEl.className = 'bar-hedef-ulasildi';
      ulasildiEl.textContent = '';
    }
    container.classList.add('bos');
    return;
  }
  container.classList.remove('bos');

  // Dolgu (yapılan + devir)
  dolgu.style.width = ilerlemePct.toFixed(1) + '%';
  dolgu.classList.toggle('iyi', ilerlemePct >= azami);
  dolgu.classList.toggle('kotu', ilerlemePct < asgari);

  // Tick'ler
  oluk.querySelectorAll('.bar-tick').forEach(t => t.remove());
  const tickYap = (pct, sinif) => {
    const t = document.createElement('div');
    t.className = 'bar-tick ' + sinif;
    t.style.left = pct.toFixed(1) + '%';
    oluk.appendChild(t);
  };
  tickYap(asgari, 'tick-asgari');
  tickYap(azami, 'tick-tavan');
  if (hedefPct > 0) tickYap(hedefPct, 'tick-hedef');

  // Hedef input'u bar üzerinde hedef pozisyonuna yerleştir
  const tamam = Y + etkDevir;
  const hedefUlasildi = hedef > 0 && tamam >= hedef;
  if (inp) {
    inp.style.left = hedefPct > 0 ? hedefPct.toFixed(1) + '%' : '';
    inp.classList.toggle('pozisyonlu', hedefPct > 0);
    inp.classList.toggle('ulasildi', hedefUlasildi);
  }

  // Alt satır: Asgari ve Tavan — ulaşıldığında ✓ ekle
  const asgariY = Math.ceil(G * asgari / 100);
  const azamiY = Math.ceil(G * azami / 100);
  const asgariUlasildi = ilerlemePct >= asgari;
  const tavanUlasildi = ilerlemePct >= azami;
  alt.innerHTML =
    `<span class="bar-et et-asgari${asgariUlasildi ? ' ulasildi' : ''}" style="left:${asgari}%"><span class="et-deger">${asgariY}${asgariUlasildi ? ' ✓' : ''}</span></span>` +
    `<span class="bar-et et-tavan${tavanUlasildi ? ' ulasildi' : ''}" style="left:${azami}%"><span class="et-deger">${azamiY}${tavanUlasildi ? ' ✓' : ''}</span></span>`;

  // Hedef durumu pill'i — detaylı (desktop tek sütun'da görünür)
  const ulasildiEl = container.querySelector('.bar-hedef-ulasildi');
  if (ulasildiEl) {
    ulasildiEl.className = 'bar-hedef-ulasildi';
    const hedefGecerli = hedef > 0;
    if (tavanUlasildi) {
      ulasildiEl.textContent = '✓ Tavana ulaşıldı';
      ulasildiEl.classList.add('tavan');
    } else if (hedefUlasildi) {
      const kalan = Math.max(0, azamiY - tamam);
      ulasildiEl.textContent = kalan > 0
        ? `✓ Hedefe ulaşıldı · Tavana ${kalan} kaldı`
        : '✓ Hedefe ulaşıldı';
    } else if (asgariUlasildi) {
      let ekstra = '';
      if (hedefGecerli && hedef > asgariY) {
        ekstra = ` · Hedefe ${hedef - tamam} kaldı`;
      } else {
        const kalan = Math.max(0, azamiY - tamam);
        if (kalan > 0) ekstra = ` · Tavana ${kalan} kaldı`;
      }
      ulasildiEl.textContent = '✓ Asgariye ulaşıldı' + ekstra;
      ulasildiEl.classList.add('asgari');
    } else if (hedefGecerli) {
      ulasildiEl.textContent = `Hedefe ${hedef - tamam} kaldı`;
      ulasildiEl.classList.add('kaldi');
    } else if (asgariY > 0 && G > 0) {
      ulasildiEl.textContent = `Asgariye ${asgariY - tamam} kaldı`;
      ulasildiEl.classList.add('kaldi');
    } else {
      ulasildiEl.textContent = '';
    }
  }
}

// Nüfus tipi başına tavan hesabı
// 3500  tipi  : tavan = 4000 / min(nüfus, 3500),  max 1.5
// düşük tipi  : tavan = 2400 / min(nüfus, 2400),  max 1.5
const HYP2_TAVAN_MAX = 1.5;
function _v2NufusTip() {
  return document.getElementById('hypV2NufusTip')?.value || '3500';
}
function _v2TavanKS(nufus) {
  if (nufus <= 0) return HYP2_TAVAN_MAX;
  const tip = _v2NufusTip();
  const cap = tip === 'dusuk' ? 2400 : 3500;
  const baz = tip === 'dusuk' ? 2400 : 4000;
  const eff = Math.min(nufus, cap);
  return Math.min(baz / eff, HYP2_TAVAN_MAX);
}

function hypV2Hesapla() {
  const nufus = parseInt(document.getElementById('hypV2Nufus')?.value) || 0;
  let basariKS = 1;

  HYP2_KRITERLER.forEach(k => {
    const G = _v2Deger(k.prefix, 'G');
    const Y = _v2Deger(k.prefix, 'Y');
    const D_ham = _v2Deger(k.prefix, 'D');
    const tablo = HYP2_TABLO[k.prefix];
    if (!tablo) return;

    const D = (G > 0 && Y >= G * 0.10) ? D_ham : 0;
    const oran = G > 0 ? (Y + D) / G * 100 : 0;
    const katsayi = hypKatsayi(oran, tablo);
    basariKS *= katsayi;

    const pctEl = document.getElementById(`hypV2_${k.prefix}_P`);
    if (pctEl) {
      pctEl.textContent = G > 0 ? Math.round(oran) + '%' : '—';
      pctEl.className = 'bar-pct' + (G > 0 && oran >= tablo.azami ? ' iyi' : G > 0 && oran < tablo.asgari ? ' kotu' : '');
    }
    const ksEl = document.getElementById(`hypV2_${k.prefix}_KS`);
    if (ksEl) {
      ksEl.textContent = G > 0 ? katsayi.toFixed(4) : '—';
      ksEl.className = 'bar-ks-deger' + (katsayi > 1 ? ' artida' : katsayi < 1 ? ' eksi' : '');
    }
    // Tek uzun bar — Asgari / Hedef / Tavan işaretleri + mevcut dolgu
    const hedef = _v2Deger(k.prefix, 'H');
    const btEl = document.getElementById(`hypV2_${k.prefix}_BT`);
    if (btEl) _barCiz(btEl, { G, Y, D, hedef, asgari: tablo.asgari, azami: tablo.azami });
  });

  basariKS *= hypKatsayi(80, HYP2_SUREC);
  const basariHamKS = basariKS;
  const tavanKS = _v2TavanKS(nufus);
  const maasKS = Math.min(basariHamKS, tavanKS);
  window.hypV2HamBasariKS = basariHamKS;

  // HYP başarı KS → ASÇ Hekim HYP otomatik yansıt (ASÇ eşiği için)
  const ascHekimEl = document.getElementById('ascHekimKS');
  if (ascHekimEl) {
    ascHekimEl.value = basariHamKS > 0 ? basariHamKS.toFixed(4) : '';
    if (typeof ascHesapla === 'function') ascHesapla();
  }

  // "Hedef tutarsa" hypotetik katsayı — H toplam (Y+D) hedefidir; D tekrar eklenmez
  let hedefKS = 1;
  let hedefVarSayi = 0;
  HYP2_KRITERLER.forEach(k => {
    const G = _v2Deger(k.prefix, 'G');
    const Y = _v2Deger(k.prefix, 'Y');
    const D_ham = _v2Deger(k.prefix, 'D');
    const H = _v2Deger(k.prefix, 'H');
    const tablo = HYP2_TABLO[k.prefix];
    if (!tablo) return;
    const D = (G > 0 && Y >= G * 0.10) ? D_ham : 0;
    const oran = G > 0 ? (H > 0 ? H / G * 100 : (Y + D) / G * 100) : 0;
    hedefKS *= hypKatsayi(oran, tablo);
    if (H > 0) hedefVarSayi++;
  });
  hedefKS *= hypKatsayi(80, HYP2_SUREC);
  const hedefMaasKS = Math.min(hedefKS, tavanKS);

  const fmt = (v) => v.toFixed(4);
  const maasEl = document.getElementById('hypV2MaasKS');
  const tavEl = document.getElementById('hypV2TavanKS');
  const hamEl = document.getElementById('hypV2HamKS');
  const durumEl = document.getElementById('hypV2BasariDurum');
  const basarili = tavanKS > 0 && basariHamKS >= tavanKS - 0.0001;
  if (maasEl) {
    maasEl.textContent = fmt(maasKS);
    // Tavana yaklaştıkça kırmızı → yeşil HSL geçişi (0.9 altı = tam kırmızı)
    if (tavanKS > 0 && maasKS > 0) {
      const alt = 0.9;
      const ust = tavanKS;
      const oran = ust > alt ? Math.max(0, Math.min(1, (maasKS - alt) / (ust - alt))) : 1;
      const hue = Math.round(120 * oran); // 0.9 veya altı=red, tavan=green
      maasEl.style.color = 'hsl(' + hue + ', 75%, 38%)';
    } else {
      maasEl.style.color = '';
    }
  }
  if (tavEl) tavEl.textContent = fmt(tavanKS);
  if (hamEl) hamEl.textContent = fmt(basariHamKS);
  if (durumEl) {
    durumEl.dataset.gizli = basarili ? '0' : '1';
  }
  if (maasEl) maasEl.style.color = basarili ? 'var(--yesil)' : maasEl.style.color;

  // Hedef KS göstergesi — hidden yerine data-gizli ile (layout korunur, scroll sıçramaz)
  const hedefSatir = document.getElementById('hypV2HedefKSSatir');
  const hedefEl = document.getElementById('hypV2HedefKS');
  if (hedefSatir && hedefEl) {
    hedefEl.textContent = hedefVarSayi > 0 ? fmt(hedefMaasKS) : '—';
    hedefSatir.dataset.gizli = hedefVarSayi > 0 ? '0' : '1';
    hedefSatir.classList.toggle('artmaz', hedefVarSayi > 0 && hedefMaasKS <= maasKS + 0.0001);
  }

  // KHT oranı (HT+Obz+KVR+DM Tarama) — her kriter %100 cap'li, Y+D dahil
  // Hedef KHT: H (Y+D hedefi) dolu kriterler için H kullan, yoksa mevcut Y+D
  let gT=0, yT=0, yTHedef=0, hVarmi=false;
  ['htTarama','obzTarama','kvrTarama','dmTarama'].forEach(p => {
    const G = _v2Deger(p, 'G');
    const Y = _v2Deger(p, 'Y');
    const D = _v2Deger(p, 'D');
    const H = _v2Deger(p, 'H');
    gT += G;
    yT += Math.min(Y + D, G);
    if (H > 0) { yTHedef += Math.min(H, G); hVarmi = true; }
    else { yTHedef += Math.min(Y + D, G); }
  });
  const khtOran = gT > 0 ? yT / gT * 100 : 0;
  const hedefKhtOran = gT > 0 ? yTHedef / gT * 100 : 0;
  const khtVal = document.getElementById('hypV2KhtVal');
  const khtDol = document.getElementById('hypV2KhtDolgu');
  const khtOranEl = document.getElementById('hypV2KhtOran');
  if (khtVal) {
    khtVal.textContent = gT > 0 ? Math.round(khtOran) + '%' : '—';
    khtVal.style.color = gT === 0 ? 'var(--text-zayif)' :
                         khtOran >= 70 ? 'var(--yesil)' :
                         khtOran >= 40 ? 'var(--turuncu)' : 'var(--kirmizi)';
  }
  if (khtOranEl) {
    if (gT > 0) {
      const durum = khtOran >= 70
        ? '<span class="kht-durum basarili">✓ Başarılı</span>'
        : '';
      khtOranEl.innerHTML = `${yT} / ${gT} ${durum}`;
    } else {
      khtOranEl.textContent = '—';
    }
  }
  if (khtDol) khtDol.style.width = Math.min(100, khtOran) + '%';

  // Hedef KHT satırı — en az 1 KHT kriterinde H varsa göster
  const hedefKhtSatir = document.getElementById('hypV2HedefKhtSatir');
  const hedefKhtEl = document.getElementById('hypV2HedefKht');
  if (hedefKhtSatir && hedefKhtEl) {
    if (hVarmi && gT > 0) {
      hedefKhtSatir.dataset.gizli = '0';
      hedefKhtEl.textContent = Math.round(hedefKhtOran) + '%';
      hedefKhtEl.style.color = hedefKhtOran >= 70 ? 'var(--yesil)' :
                                hedefKhtOran >= 40 ? 'var(--turuncu)' : 'var(--kirmizi)';
      hedefKhtSatir.classList.toggle('artmaz', hedefKhtOran <= khtOran + 0.001);
    } else {
      hedefKhtSatir.dataset.gizli = '1';
      hedefKhtEl.textContent = '—';
    }
  }
  const ger40El = document.getElementById('hypV2Kht40Ger');
  const ger70El = document.getElementById('hypV2Kht70Ger');
  if (ger40El && ger70El) {
    if (gT > 0) {
      const ger40 = Math.max(0, Math.ceil(gT * 0.40) - yT);
      const ger70 = Math.max(0, Math.ceil(gT * 0.70) - yT);
      ger40El.textContent = ger40 > 0 ? `+${ger40}` : '✓';
      ger70El.textContent = ger70 > 0 ? `+${ger70}` : '✓';
    } else {
      ger40El.textContent = '';
      ger70El.textContent = '';
    }
  }
}

// ──────────────────────────────────────────
// ASÇ (Aile Sağlığı Çalışanları) — 2 kriter
// ──────────────────────────────────────────

const ASC_KRITERLER = [
  { ad: 'Vital Bulgular',                  alt: 'Tarama-Takip', prefix: 'vital' },
  { ad: 'Çok Yönlü Yaşlı Sağlığı Değerl.', alt: 'Tarama-Takip', prefix: 'cokyonlu' },
];
const ASC_TABLO = {
  vital:    { asgari: 40, azami: 90, belowMin: 0.93, interpMax: 1.06, maxCoeff: 1.0611 },
  cokyonlu: { asgari: 40, azami: 90, belowMin: 0.97, interpMax: 1.13, maxCoeff: 1.1309 },
};
const ASC_MAX_TAVAN = Object.values(ASC_TABLO).reduce((p, t) => p * t.maxCoeff, 1);

function ascKatsayi(oran, t) {
  if (oran < t.asgari) return t.belowMin;
  if (oran >= t.azami) return t.maxCoeff;
  return 1 + (t.interpMax - 1) * (oran - t.asgari) / (t.azami - t.asgari);
}

function ascTabloKur() {
  const tbody = document.getElementById('ascKriterlerBody');
  if (!tbody || tbody.dataset.kuruldu === '1') return;
  tbody.dataset.kuruldu = '1';

  ASC_KRITERLER.forEach(k => {
    const tr = document.createElement('tr');
    tr.dataset.prefix = k.prefix;
    tr.innerHTML =
      `<td data-kolon="kriter"><span class="drag-handle" title="Sürükle-bırak ile sırala">⋮⋮</span><span class="kriter-ad">${k.ad}</span><div class="ad-kisa">${k.alt}</div></td>` +
      `<td data-kolon="g"><input class="sayi-inp" data-asc="${k.prefix}-G" type="number" min="0" inputmode="numeric" placeholder="—"></td>` +
      `<td data-kolon="y"><input class="sayi-inp" data-asc="${k.prefix}-Y" type="number" min="0" inputmode="numeric" placeholder="—"></td>` +
      `<td data-kolon="d"><input class="sayi-inp" data-asc="${k.prefix}-D" type="number" min="0" inputmode="numeric" placeholder="—"></td>` +
      `<td data-kolon="hedef" class="hedef-cell">` +
        `<div class="bar-tum" id="asc_${k.prefix}_BT">` +
          `<div class="bar-ust">` +
            `<span class="bar-pct" id="asc_${k.prefix}_P">—</span>` +
            `<span class="bar-ks-deger" id="asc_${k.prefix}_KS">—</span>` +
            `<span class="bar-hedef-ulasildi"></span>` +
            `<input class="hedef-inp bar-hedef-inp" data-asc="${k.prefix}-H" type="number" min="0" inputmode="numeric" placeholder="—">` +
          `</div>` +
          `<div class="bar-oluk"><div class="bar-dolgu"></div></div>` +
          `<div class="bar-alt-etiketler"></div>` +
        `</div>` +
      `</td>`;
    tbody.appendChild(tr);
    // Hedef bar sürükleme bağla
    const btDiv = tr.querySelector('.bar-tum');
    if (btDiv) _barHedefDragBagla(btDiv, 'data-asc', k.prefix);
  });

  tbody.addEventListener('input', (e) => {
    if (e.target && e.target.matches('input[data-asc]')) {
      ascHesapla();
      _veriDegistiSinyali();
    }
  });
  const _hekimInp = document.getElementById('ascHekimKS');
  _hekimInp?.addEventListener('input', () => {
    // Hekim HYP max 1.5 — üstüne yazılırsa otomatik clamp + toast uyarı
    const v = parseFloat(_hekimInp.value);
    if (!isNaN(v) && v > 1.5) {
      _hekimInp.value = '1.5';
      if (typeof window.siteToast === 'function') {
        window.siteToast('⚠ Hekim HYP katsayısı en fazla 1.5 olabilir', 'uyari');
      }
    }
    ascHesapla();
    _veriDegistiSinyali();
  });
  document.getElementById('ascNufus')?.addEventListener('input', (e) => {
    // ASÇ → HYP v2 nüfus senkronu
    const hypN = document.getElementById('hypV2Nufus');
    if (hypN) hypN.value = e.target.value;
    ascHesapla();
    if (typeof hypV2Hesapla === 'function') hypV2Hesapla();
    _veriDegistiSinyali();
  });
  document.getElementById('ascNufusTip')?.addEventListener('change', (e) => {
    const hypT = document.getElementById('hypV2NufusTip');
    if (hypT) hypT.value = e.target.value;
    ascHesapla();
    if (typeof hypV2Hesapla === 'function') hypV2Hesapla();
    _veriDegistiSinyali();
  });
}

function _ascDeger(prefix, suf) {
  const el = document.querySelector(`input[data-asc="${prefix}-${suf}"]`);
  return parseInt(el?.value) || 0;
}

// ASÇ için de nüfus-tabanlı tavan (HYP ile aynı formül):
//  3500 tip  : tavan = 4000 / min(nüfus,3500),  max 1.5
//  düşük tip : tavan = 2400 / min(nüfus,2400),  max 1.5
function _ascTavanKS(nufus) {
  if (nufus <= 0) return HYP2_TAVAN_MAX;
  const tip = document.getElementById('ascNufusTip')?.value || '3500';
  const cap = tip === 'dusuk' ? 2400 : 3500;
  const baz = tip === 'dusuk' ? 2400 : 4000;
  const eff = Math.min(nufus, cap);
  return Math.min(baz / eff, HYP2_TAVAN_MAX);
}

function ascHesapla() {
  let ascKS = 1;
  ASC_KRITERLER.forEach(k => {
    const G = _ascDeger(k.prefix, 'G');
    const Y = _ascDeger(k.prefix, 'Y');
    const D_ham = _ascDeger(k.prefix, 'D');
    const t = ASC_TABLO[k.prefix];
    const D = (G > 0 && Y >= G * 0.10) ? D_ham : 0;
    const oran = G > 0 ? (Y + D) / G * 100 : 0;
    const katsayi = ascKatsayi(oran, t);
    ascKS *= katsayi;

    const pctEl = document.getElementById(`asc_${k.prefix}_P`);
    if (pctEl) {
      pctEl.textContent = G > 0 ? Math.round(oran) + '%' : '—';
      pctEl.className = 'bar-pct' + (G > 0 && oran >= t.azami ? ' iyi' : G > 0 && oran < t.asgari ? ' kotu' : '');
    }
    const ksEl = document.getElementById(`asc_${k.prefix}_KS`);
    if (ksEl) {
      ksEl.textContent = G > 0 ? katsayi.toFixed(4) : '—';
      ksEl.className = 'bar-ks-deger' + (katsayi > 1 ? ' artida' : katsayi < 1 ? ' eksi' : '');
    }

    // Tek uzun bar — Asgari / Hedef / Tavan işaretleri + mevcut dolgu
    const hedef = _ascDeger(k.prefix, 'H');
    const btEl = document.getElementById(`asc_${k.prefix}_BT`);
    if (btEl) _barCiz(btEl, { G, Y, D: D_ham, hedef, asgari: t.asgari, azami: t.azami });
  });

  // "Hedef tutarsa" hypotetik katsayı — H toplam (Y+D) hedefidir; D tekrar eklenmez
  let ascHedefKS = 1;
  let hedefVar = 0;
  ASC_KRITERLER.forEach(k => {
    const G = _ascDeger(k.prefix, 'G');
    const Y = _ascDeger(k.prefix, 'Y');
    const D_ham = _ascDeger(k.prefix, 'D');
    const H = _ascDeger(k.prefix, 'H');
    const t = ASC_TABLO[k.prefix];
    const D = (G > 0 && Y >= G * 0.10) ? D_ham : 0;
    const oran = G > 0 ? (H > 0 ? H / G * 100 : (Y + D) / G * 100) : 0;
    ascHedefKS *= ascKatsayi(oran, t);
    if (H > 0) hedefVar++;
  });

  const fmt = (v) => v.toFixed(4);
  const ksEl = document.getElementById('ascKS');
  const gerEl = document.getElementById('ascGerekenMax');
  if (ksEl) ksEl.textContent = fmt(ascKS);
  const ascNufus = parseInt(document.getElementById('ascNufus')?.value) || 0;
  const ascTavan = _ascTavanKS(ascNufus);
  // "Hekim Max olursa gereken" — hekim HYP'nin nüfusa göre tavanı × 0.75
  // (Nüfus 3050 → tavan 1.3115 → × 0.75 = 0.9836)
  if (gerEl) gerEl.textContent = ascNufus > 0 ? fmt(ascTavan * 0.75) : fmt(1.5 * 0.75);

  // Hedef KS göstergesi — data-gizli (layout korunur)
  const hedefSatir = document.getElementById('ascHedefKSSatir');
  const hedefEl = document.getElementById('ascHedefKS');
  if (hedefSatir && hedefEl) {
    hedefEl.textContent = hedefVar > 0 ? fmt(ascHedefKS) : '—';
    hedefSatir.dataset.gizli = hedefVar > 0 ? '0' : '1';
    hedefSatir.classList.toggle('artmaz', hedefVar > 0 && ascHedefKS <= ascKS + 0.0001);
  }

  // Şartlar
  const hekimKS = parseFloat(document.getElementById('ascHekimKS')?.value) || 0;
  const esikVal = hekimKS > 0 ? hekimKS * 0.75 : null;
  const esikEl = document.getElementById('ascEsik');
  if (esikEl) esikEl.textContent = esikVal ? fmt(esikVal) : '—';

  const sart1 = ascKS > 1;
  const sart2 = esikVal != null && ascKS > esikVal;

  // Tek satır kompakt durum: 2 şart + sonuç (+ hedef tutarsa tahmini)
  const durumEl = document.getElementById('ascDurum');
  if (durumEl) {
    const ik = (ok, bekliyor) => bekliyor ? '⚪' : (ok ? '✅' : '❌');
    const s1 = `<span class="sart-oz">${ik(sart1, ascKS === 1)} <b>Şart 1:</b> 1'den büyük olması</span>`;
    const s2 = esikVal == null
      ? `<span class="sart-oz">⚪ <b>Şart 2:</b> Hekim HYP'sinin %75'inden büyük olması <small>(Hekim HYP girin)</small></span>`
      : `<span class="sart-oz">${ik(sart2, false)} <b>Şart 2:</b> Hekim HYP'sinin %75'inden büyük olması</span>`;

    let sonuc, sinif;
    if (esikVal == null) { sonuc = 'Kriterleri girerek başlayın'; sinif = ''; }
    else if (sart1 && sart2) { sonuc = '✓ BAŞARILI'; sinif = 'basarili'; }
    else { sonuc = '✕ BAŞARISIZ'; sinif = 'basarisiz'; }

    let hedefHtml = '';
    if (hedefVar > 0) {
      const hSart1 = ascHedefKS > 1;
      const hSart2 = esikVal == null ? null : (ascHedefKS > esikVal);
      let hMetin;
      if (hSart2 === null) hMetin = `${fmt(ascHedefKS)} (hekim HYP girilince netleşir)`;
      else if (hSart1 && hSart2) hMetin = `✓ BAŞARILI olur (${fmt(ascHedefKS)})`;
      else hMetin = `✕ yetersiz (${fmt(ascHedefKS)})`;
      hedefHtml = `<span class="hedef-oz">🎯 Hedef tutarsa: ${hMetin}</span>`;
    }

    durumEl.innerHTML = `${s1}${s2}<span class="sonuc-oz">${sonuc}</span>${hedefHtml}`;
    durumEl.className = 'asc-durum-strip' + (sinif ? ' ' + sinif : '');
  }

  // ASÇ Katsayısı kartı — başarı durumuna göre renklendirme
  const ksKart = document.getElementById('ascKatsayiKart');
  if (ksKart) {
    ksKart.classList.remove('kart-basarili', 'kart-basarisiz');
    if (esikVal != null && ascKS > 1) {
      ksKart.classList.add(sart1 && sart2 ? 'kart-basarili' : 'kart-basarisiz');
    } else if (esikVal != null) {
      ksKart.classList.add('kart-basarisiz');
    }
  }
}

// ──────────────────────────────────────────
// AI Hedef Hesaplama
// ──────────────────────────────────────────

// Efor düzeyi ağırlıkları — yüksek eforAg = daha erken azaltılır (sondan başla)
// "Mecbur" (6) özel: son çare — baştan hedef=0, öncelik (1-9) sırasıyla engaje olur
const EFOR_AGIRLIK = { 1: 0.5, 2: 0.75, 3: 1.0, 4: 1.5, 5: 2.0, 6: 1.0 };
const EFOR_MECBUR = 6;
const EFOR_ETIKETLERI = [
  { val: 1, ad: 'Ç.Kolay', aciklama: 'Çok Kolay (×0.5) — az çabayla yapılabilir, öncelikli olarak tercih edilir' },
  { val: 2, ad: 'Kolay',   aciklama: 'Kolay (×0.75) — makul çaba, yapılması kolay kriterler' },
  { val: 3, ad: 'Orta',    aciklama: 'Orta (×1.0) — standart çaba, nötr değerlendirme' },
  { val: 4, ad: 'Zor',     aciklama: 'Zor (×1.5) — yüksek çaba, azaltılırken korunmaya çalışılır' },
  { val: 5, ad: 'Ç.Zor',   aciklama: 'Çok Zor (×2.0) — en yüksek çaba, mümkünse dokunulmaz' },
  { val: 6, ad: 'Mecbur kalırsa', aciklama: 'Mecbur kalırsa (son çare) — baştan hedef=0; diğerleri yetmezse öncelik sırasıyla devreye girer' },
];
const EFOR_OZET_TOOLTIP =
  'Efor düzeyleri:\n' +
  '• Ç.Kolay (×0.5) — öncelikle tercih\n' +
  '• Kolay (×0.75)\n' +
  '• Orta (×1.0) — varsayılan\n' +
  '• Zor (×1.5)\n' +
  '• Ç.Zor (×2.0) — korunur\n' +
  '• Mecbur kalırsa — son çare; yanında öncelik (1-9)';
const ONCELIK_TOOLTIP =
  'Mecbur öncelik (1-9)\n' +
  '1 = ilk devreye girer, 9 = en son.\n' +
  'Aynı öncelikteki Mecbur\'lar birlikte değerlendirilir.';
const ONCELIK_DEFAULT = 5;
// Efor cell HTML — Mecbur seçilince öncelik (1-9) select görünür
function _eforHucresiHtml(dataAttr, prefix) {
  const eforOpts = EFOR_ETIKETLERI.map(e =>
    `<option value="${e.val}"${e.val === 3 ? ' selected' : ''} title="${e.aciklama}">${e.ad}</option>`
  ).join('');
  const oncelikOpts = Array.from({ length: 9 }, (_, i) =>
    `<option value="${i + 1}"${(i + 1) === ONCELIK_DEFAULT ? ' selected' : ''}>${i + 1}</option>`
  ).join('');
  return (
    `<td>` +
      `<div class="efor-oncelik-grup">` +
        `<select class="profil-sel" data-${dataAttr}="${prefix}-efor" title="${EFOR_OZET_TOOLTIP}">${eforOpts}</select>` +
        `<select class="profil-sel profil-sel-oncelik" data-${dataAttr}="${prefix}-oncelik" hidden title="${ONCELIK_TOOLTIP}">${oncelikOpts}</select>` +
      `</div>` +
    `</td>`
  );
}

// HYP v2: Basit (slider) — tüm kriterler ortak yüzde
function hypV2AIUygula() {
  const yuzde = parseInt(document.getElementById('hypV2AIYuzde')?.value) || 80;
  HYP2_KRITERLER.forEach(k => {
    const G = _v2Deger(k.prefix, 'G');
    const el = document.querySelector(`input[data-hypv2="${k.prefix}-H"]`);
    if (!el) return;
    el.value = G > 0 ? Math.ceil(G * yuzde / 100) : '';
  });
  hypV2Hesapla();
}

function hypV2HedefSifirla() {
  HYP2_KRITERLER.forEach(k => {
    const el = document.querySelector(`input[data-hypv2="${k.prefix}-H"]`);
    if (el) el.value = '';
  });
  hypV2Hesapla();
}

// ── HYP v2: Profil tablosu (her kriter için hedef % + efor + öncelik) ──
function hypV2ProfilKur() {
  const tbody = document.getElementById('hypV2ProfilBody');
  if (!tbody || tbody.dataset.kuruldu === '1') return;
  tbody.dataset.kuruldu = '1';
  HYP2_KRITERLER.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${k.ad}</td>` +
      `<td><input class="profil-inp" data-v2-profil="${k.prefix}-max" type="number" min="0" max="95" placeholder="—"></td>` +
      _eforHucresiHtml('v2-profil', k.prefix);
    tbody.appendChild(tr);
  });
  // Efor değişince öncelik dropdown'ını göster/gizle
  tbody.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.matches('select[data-v2-profil$="-efor"]')) {
      const prefix = t.dataset.v2Profil.replace('-efor', '');
      const oncelikEl = tbody.querySelector(`select[data-v2-profil="${prefix}-oncelik"]`);
      if (oncelikEl) oncelikEl.hidden = parseInt(t.value) !== EFOR_MECBUR;
    }
  });
  // Profil değişimlerinde kayıt tetikle
  tbody.addEventListener('input', _veriDegistiSinyali);
  tbody.addEventListener('change', _veriDegistiSinyali);
}

function _v2ProfilOku() {
  const profil = {};
  HYP2_KRITERLER.forEach(k => {
    const maxEl = document.querySelector(`input[data-v2-profil="${k.prefix}-max"]`);
    const eforEl = document.querySelector(`select[data-v2-profil="${k.prefix}-efor"]`);
    const oncelikEl = document.querySelector(`select[data-v2-profil="${k.prefix}-oncelik"]`);
    profil[k.prefix] = {
      max: parseInt(maxEl?.value) || 0,
      efor: parseInt(eforEl?.value) || 3,
      oncelik: parseInt(oncelikEl?.value) || ONCELIK_DEFAULT,
    };
  });
  return profil;
}

// HYP v2 Greedy Optimize
// Mantık:
//  1) Non-Mecbur kriterler profildeki max'ta başlar, Mecbur kriterler 0'da
//  2) KS tavanı aşarsa: non-Mecbur'lardan en az zararlı olanı azalt (greedy)
//  3) KS tavanın altındaysa: Mecbur kriterleri ÖNCELİK SIRASINA göre engaje et
//     — Öncelik 1'deki Mecbur'lar önce, hepsi profildeki max'a ulaştırılır;
//       tavan aşılırsa son adım geri alınır ve durulur
//     — Yetmezse Öncelik 2, ... 9
//     — Aynı öncelikte: en yüksek kazançlı greedy
function hypV2AIOptimize() {
  const nufus = parseInt(document.getElementById('hypV2Nufus')?.value) || 0;
  const tavanKS = _v2TavanKS(nufus);
  const surecCoeff = hypKatsayi(80, HYP2_SUREC);
  const profil = _v2ProfilOku();

  const kriterler = HYP2_KRITERLER.map(k => {
    const G = _v2Deger(k.prefix, 'G');
    const Y = _v2Deger(k.prefix, 'Y');
    const D = _v2Deger(k.prefix, 'D');
    const tablo = HYP2_TABLO[k.prefix];
    const p = profil[k.prefix];
    const maxEtkin = Math.min(Math.max(0, p.max || 0), tablo.azami || 90);
    const asgariMinY = G > 0 ? Math.ceil(G * tablo.asgari / 100) : 0;
    // Y zemindir: "zaten yapılmış iş geri alınamaz" — minY hiçbir zaman Y'nin altına düşmez
    const minY = Math.max(asgariMinY, Y);
    const isMecbur = (p.efor === EFOR_MECBUR);
    const maxEtkinY = G > 0 ? Math.max(Math.ceil(G * maxEtkin / 100), Y) : Y;
    // Mecbur Y asgari altındaysa 0'dan başlar (engage edince direkt minY'ye atlar);
    // Y asgariyi aşmışsa hedefY = Y (zaten engajlı kabul)
    let hedefY;
    if (isMecbur) {
      hedefY = (Y >= asgariMinY) ? Y : 0;
    } else {
      hedefY = maxEtkinY;
      if (hedefY > 0 && hedefY < minY) hedefY = minY;
    }
    return {
      prefix: k.prefix, G, Y, D, tablo,
      efor: p.efor, oncelik: p.oncelik || ONCELIK_DEFAULT,
      hedefY, minY, maxEtkinY,
    };
  });

  if (!kriterler.some(k => k.G > 0)) {
    alert('Önce kriterlere Gereken değerlerini gir.');
    return;
  }

  // Oran = (hedefY + D) / G * 100, 10% eşiği gated (hedefY >= G*10% ise D katılır)
  const _oran = (k, Y) => {
    if (k.G <= 0) return 0;
    const D = Y >= k.G * 0.10 ? k.D : 0;
    return (Y + D) / k.G * 100;
  };

  function hesaplaKS() {
    let ks = surecCoeff;
    kriterler.forEach(k => {
      ks *= hypKatsayi(_oran(k, k.hedefY), k.tablo);
    });
    return ks;
  }

  // Hedef KS bandı: üst sınır tavan × 1.001 (binde 1), alt sınır tavan × 0.9997 (on binde 3)
  const ustSinir = tavanKS * 1.001;
  const altSinirHyp = tavanKS * 0.9997;

  // PHASE 1: Azaltma — non-Mecbur profildeki max'tan fazla ise azalt.
  // altSinirHyp altına düşürecek azaltma atlanır (on binde 3 sapma sınırı).
  const _enAzAzaltIdx = () => {
    let enAzIdx = -1, enAzKayip = Infinity;
    for (let j = 0; j < kriterler.length; j++) {
      const k = kriterler[j];
      if (k.efor === EFOR_MECBUR) continue;
      if (k.G <= 0 || k.hedefY <= 0) continue;
      if (k.hedefY <= k.minY) continue;
      // Bu azaltma altSinirHyp'in altına düşürüyor mu? Düşürüyorsa atla.
      const eskiHedef = k.hedefY;
      k.hedefY--;
      const yeniKS = hesaplaKS();
      k.hedefY = eskiHedef;
      if (yeniKS < altSinirHyp) continue;
      const eski = hypKatsayi(_oran(k, k.hedefY), k.tablo);
      const yeni = hypKatsayi(_oran(k, k.hedefY - 1), k.tablo);
      const kayip = yeni > 0 ? eski / yeni : Infinity;
      const eforAg = EFOR_AGIRLIK[k.efor] || 1;
      const efektifKayip = kayip / eforAg;
      if (efektifKayip < enAzKayip) { enAzKayip = efektifKayip; enAzIdx = j; }
    }
    return enAzIdx;
  };

  for (let i = 0; i < 5000; i++) {
    if (hesaplaKS() <= ustSinir) break;
    const idx = _enAzAzaltIdx();
    if (idx < 0) {
      // Hiçbir azaltma bandın içinde kalamıyor — band dışı (üstünde) bırak
      break;
    }
    kriterler[idx].hedefY--;
  }

  // PHASE 2: Mecbur engaje — hedef KS tavanın binde 1'i içinde (±0.1%) kalsın
  // Öncelik tier'ı sırayla (1, 2, ... 9); her tier'da tavanı aşmayan en yüksek kazançlı
  // Önemli: Mecbur 0'dan engaje edilince direkt minY'ye atlanır — 1..minY-1 arası
  // asgari eşiğin altında olup katsayıya zarar verir (boşa efor).
  // maxEtkinY < minY olan Mecbur'lar hiç engaje edilmez (anlamsız).
  const mecburOncelikler = [...new Set(
    kriterler.filter(k => k.efor === EFOR_MECBUR && k.G > 0 && k.maxEtkinY >= k.minY && k.maxEtkinY > 0)
             .map(k => k.oncelik)
  )].sort((a, b) => a - b);

  for (const prio of mecburOncelikler) {
    if (hesaplaKS() >= altSinirHyp) break;
    const _enIyiArtirIdx = () => {
      let enIyiIdx = -1, enIyiKazanc = -Infinity, enIyiHedef = 0;
      for (let j = 0; j < kriterler.length; j++) {
        const k = kriterler[j];
        if (k.efor !== EFOR_MECBUR || k.oncelik !== prio) continue;
        if (k.G <= 0 || k.hedefY >= k.maxEtkinY) continue;
        if (k.maxEtkinY < k.minY) continue;              // asgari altında anlamsız
        // 0'dan ilk adım direkt minY'ye (1..minY-1 boşa iş); sonra +1
        const hedefSonraki = (k.hedefY === 0 && k.minY > 0)
          ? Math.min(k.minY, k.maxEtkinY)
          : k.hedefY + 1;
        const eskiY = k.hedefY;
        k.hedefY = hedefSonraki;
        const yeniKS = hesaplaKS();
        k.hedefY = eskiY;
        if (yeniKS > ustSinir) continue;                 // tavanı aşıyor — atla
        const eski = hypKatsayi(_oran(k, eskiY), k.tablo);
        const yeni = hypKatsayi(_oran(k, hedefSonraki), k.tablo);
        const kazanc = yeni > 0 ? yeni / Math.max(eski, 1e-6) : 0;
        if (kazanc > enIyiKazanc) { enIyiKazanc = kazanc; enIyiIdx = j; enIyiHedef = hedefSonraki; }
      }
      return { idx: enIyiIdx, hedef: enIyiHedef };
    };
    for (let i = 0; i < 5000; i++) {
      if (hesaplaKS() >= altSinirHyp) break;
      const { idx, hedef } = _enIyiArtirIdx();
      if (idx < 0) break;
      kriterler[idx].hedefY = hedef;
    }
  }

  _uygulaHypV2(kriterler);
}

function _uygulaHypV2(kriterler) {
  HYP2_KRITERLER.forEach(k => {
    const el = document.querySelector(`input[data-hypv2="${k.prefix}-H"]`);
    if (el) el.value = '';
  });
  kriterler.forEach(k => {
    if (k.G > 0 && k.hedefY > 0) {
      const el = document.querySelector(`input[data-hypv2="${k.prefix}-H"]`);
      if (el) el.value = k.hedefY;
    }
  });
  hypV2Hesapla();
}

function hypV2ProfilTemizle() {
  HYP2_KRITERLER.forEach(k => {
    const maxEl = document.querySelector(`input[data-v2-profil="${k.prefix}-max"]`);
    const eforEl = document.querySelector(`select[data-v2-profil="${k.prefix}-efor"]`);
    const oncelikEl = document.querySelector(`select[data-v2-profil="${k.prefix}-oncelik"]`);
    if (maxEl) maxEl.value = '';
    if (eforEl) eforEl.value = '3';
    if (oncelikEl) { oncelikEl.value = String(ONCELIK_DEFAULT); oncelikEl.hidden = true; }
  });
}

// "Bana Bırak" varsayılan profili — nüfusu düşük (<2900) hekimler için önerilen set
// Ekran görüntüsündeki değerler baz alındı; kullanıcı isterse elle değiştirebilir
const HYP2_BANA_BIRAK = {
  htTarama:  { max: 100, efor: 3 },
  htTakip:   { max: 100, efor: 3 },
  dmTarama:  { max: 100, efor: 3 },
  dmTakip:   { max: 100, efor: 3 },
  obzTarama: { max: 80,  efor: 2 },
  obzTakip:  { max: 100, efor: 3 },
  serviks:    { max: 90,  efor: 5 },
  kolorektal: { max: 90,  efor: 5 },
  meme:       { max: 90,  efor: 5 },
  kvrTarama: { max: 100, efor: 3 },
  kvrTakip:  { max: 100, efor: 1 },
  yasli:     { max: 100, efor: 2 },
  kah:       { max: 100, efor: 2 },
  inme:      { max: 100, efor: 3 },
  kbh:       { max: 80,  efor: 3 },
  koah:      { max: 80,  efor: 3 },
  astim:     { max: 80,  efor: 3 },
  otizm:     { max: 80,  efor: 2 },
};

function hypV2BanaBirak() {
  HYP2_KRITERLER.forEach(k => {
    const v = HYP2_BANA_BIRAK[k.prefix];
    if (!v) return;
    const maxEl = document.querySelector(`input[data-v2-profil="${k.prefix}-max"]`);
    const eforEl = document.querySelector(`select[data-v2-profil="${k.prefix}-efor"]`);
    const oncelikEl = document.querySelector(`select[data-v2-profil="${k.prefix}-oncelik"]`);
    if (maxEl) maxEl.value = v.max;
    if (eforEl) eforEl.value = v.efor;
    if (oncelikEl) oncelikEl.hidden = v.efor !== EFOR_MECBUR;
  });
}

// ASÇ: Basit (slider) — tüm kriterler ortak yüzde
function ascAIUygula() {
  const yuzde = parseInt(document.getElementById('ascAIYuzde')?.value) || 80;
  ASC_KRITERLER.forEach(k => {
    const G = _ascDeger(k.prefix, 'G');
    const el = document.querySelector(`input[data-asc="${k.prefix}-H"]`);
    if (!el) return;
    el.value = G > 0 ? Math.ceil(G * yuzde / 100) : '';
  });
  ascHesapla();
}

function ascHedefSifirla() {
  ASC_KRITERLER.forEach(k => {
    const el = document.querySelector(`input[data-asc="${k.prefix}-H"]`);
    if (el) el.value = '';
  });
  ascHesapla();
}

// ── ASÇ: Profil tablosu (her kriter için hedef % + efor + öncelik) ──
function ascProfilKur() {
  const tbody = document.getElementById('ascProfilBody');
  if (!tbody || tbody.dataset.kuruldu === '1') return;
  tbody.dataset.kuruldu = '1';
  ASC_KRITERLER.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${k.ad}</td>` +
      `<td><input class="profil-inp" data-asc-profil="${k.prefix}-max" type="number" min="0" max="95" placeholder="—"></td>` +
      _eforHucresiHtml('asc-profil', k.prefix);
    tbody.appendChild(tr);
  });
  // Efor değişince öncelik dropdown'ını göster/gizle
  tbody.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.matches('select[data-asc-profil$="-efor"]')) {
      const prefix = t.dataset.ascProfil.replace('-efor', '');
      const oncelikEl = tbody.querySelector(`select[data-asc-profil="${prefix}-oncelik"]`);
      if (oncelikEl) oncelikEl.hidden = parseInt(t.value) !== EFOR_MECBUR;
    }
  });
  // Profil değişimlerinde kayıt tetikle
  tbody.addEventListener('input', _veriDegistiSinyali);
  tbody.addEventListener('change', _veriDegistiSinyali);
}

function _ascProfilOku() {
  const profil = {};
  ASC_KRITERLER.forEach(k => {
    const maxEl = document.querySelector(`input[data-asc-profil="${k.prefix}-max"]`);
    const eforEl = document.querySelector(`select[data-asc-profil="${k.prefix}-efor"]`);
    const oncelikEl = document.querySelector(`select[data-asc-profil="${k.prefix}-oncelik"]`);
    profil[k.prefix] = {
      max: parseInt(maxEl?.value) || 0,
      efor: parseInt(eforEl?.value) || 3,
      oncelik: parseInt(oncelikEl?.value) || ONCELIK_DEFAULT,
    };
  });
  return profil;
}

// ASÇ Greedy Optimize
// Mantık:
//  1) Non-Mecbur kriterler profildeki max'ta başlar, Mecbur kriterler 0'da
//  2) KS tavanı aşarsa: non-Mecbur'lardan azalt
//  3) Alt eşik tutmazsa: Mecbur kriterleri ÖNCELİK SIRASINA göre engaje et
//     (öncelik 1 önce, aynı tier'da en yüksek kazanç greedy; tavan korunur)
function ascAIOptimize() {
  const hekimKS = parseFloat(document.getElementById('ascHekimKS')?.value) || 0;
  const esikMin = 1.0001;
  const esikHekim = hekimKS > 0 ? hekimKS * 0.75 * 1.0001 : 0;
  const altSinir = Math.max(esikMin, esikHekim);
  const ustSinir = ASC_MAX_TAVAN * 1.001;
  const profil = _ascProfilOku();

  const kriterler = ASC_KRITERLER.map(k => {
    const G = _ascDeger(k.prefix, 'G');
    const Y = _ascDeger(k.prefix, 'Y');
    const D = _ascDeger(k.prefix, 'D');
    const tablo = ASC_TABLO[k.prefix];
    const p = profil[k.prefix];
    const maxEtkin = Math.min(Math.max(0, p.max || tablo.azami), tablo.azami);
    const asgariMinY = G > 0 ? Math.ceil(G * tablo.asgari / 100) : 0;
    const minY = Math.max(asgariMinY, Y);
    const isMecbur = (p.efor === EFOR_MECBUR);
    const maxEtkinY = G > 0 ? Math.max(Math.ceil(G * maxEtkin / 100), Y) : Y;
    let hedefY;
    if (isMecbur) {
      hedefY = (Y >= asgariMinY) ? Y : 0;
    } else {
      hedefY = maxEtkinY;
      if (hedefY > 0 && hedefY < minY) hedefY = minY;
    }
    return {
      prefix: k.prefix, G, Y, D, tablo,
      efor: p.efor, oncelik: p.oncelik || ONCELIK_DEFAULT,
      hedefY, minY, maxEtkinY,
    };
  });

  if (!kriterler.some(k => k.G > 0)) {
    alert('Önce kriterlere Gereken değerlerini gir.');
    return;
  }

  // Oran = (hedefY + D) / G * 100, 10% eşiği gated
  const _oran = (k, Y) => {
    if (k.G <= 0) return 0;
    const D = Y >= k.G * 0.10 ? k.D : 0;
    return (Y + D) / k.G * 100;
  };

  function hesaplaKS() {
    let ks = 1;
    kriterler.forEach(k => {
      ks *= ascKatsayi(_oran(k, k.hedefY), k.tablo);
    });
    return ks;
  }

  if (altSinir > ustSinir) {
    alert(`Başarı eşiği (${altSinir.toFixed(4)}) tavanı aşıyor — bu kriterlerle mümkün değil.`);
    return;
  }

  // PHASE 1: Azaltma — altSinir altına düşürecek azaltma atlanır (bant sınırı)
  const _ascAzaltIdx = () => {
    let enAzIdx = -1, enAzKayip = Infinity;
    for (let j = 0; j < kriterler.length; j++) {
      const k = kriterler[j];
      if (k.efor === EFOR_MECBUR) continue;
      if (k.G <= 0 || k.hedefY <= 0) continue;
      if (k.hedefY <= k.minY) continue;
      const eskiHedef = k.hedefY;
      k.hedefY--;
      const yeniKS = hesaplaKS();
      k.hedefY = eskiHedef;
      if (yeniKS < altSinir) continue;
      const eski = ascKatsayi(_oran(k, k.hedefY), k.tablo);
      const yeni = ascKatsayi(_oran(k, k.hedefY - 1), k.tablo);
      const kayip = yeni > 0 ? eski / yeni : Infinity;
      const eforAg = EFOR_AGIRLIK[k.efor] || 1;
      const efektifKayip = kayip / eforAg;
      if (efektifKayip < enAzKayip) { enAzKayip = efektifKayip; enAzIdx = j; }
    }
    return enAzIdx;
  };

  for (let i = 0; i < 2000; i++) {
    if (hesaplaKS() <= ustSinir) break;
    const idx = _ascAzaltIdx();
    if (idx < 0) break; // bandın içinde kalan azaltma yok
    kriterler[idx].hedefY--;
  }

  // PHASE 2: Alt eşiği sağlamak için Mecbur engaje — öncelik tier'ı sırayla
  // Mecbur 0'dan engaje edilince direkt minY'ye atlanır (1..minY-1 boşa iş);
  // maxEtkinY < minY olan Mecbur'lar hiç engaje edilmez.
  const mecburOncelikler = [...new Set(
    kriterler.filter(k => k.efor === EFOR_MECBUR && k.G > 0 && k.maxEtkinY >= k.minY && k.maxEtkinY > 0)
             .map(k => k.oncelik)
  )].sort((a, b) => a - b);

  for (const prio of mecburOncelikler) {
    if (hesaplaKS() >= altSinir) break;
    const _ascMecburArtirIdx = () => {
      let enIyiIdx = -1, enIyiKazanc = -Infinity, enIyiHedef = 0;
      for (let j = 0; j < kriterler.length; j++) {
        const k = kriterler[j];
        if (k.efor !== EFOR_MECBUR || k.oncelik !== prio) continue;
        if (k.G <= 0 || k.hedefY >= k.maxEtkinY) continue;
        if (k.maxEtkinY < k.minY) continue;
        const hedefSonraki = (k.hedefY === 0 && k.minY > 0)
          ? Math.min(k.minY, k.maxEtkinY)
          : k.hedefY + 1;
        const eskiY = k.hedefY;
        k.hedefY = hedefSonraki;
        const yeniKS = hesaplaKS();
        k.hedefY = eskiY;
        if (yeniKS > ustSinir) continue;
        const eski = ascKatsayi(_oran(k, eskiY), k.tablo);
        const yeni = ascKatsayi(_oran(k, hedefSonraki), k.tablo);
        const kazanc = yeni > 0 ? yeni / Math.max(eski, 1e-6) : 0;
        if (kazanc > enIyiKazanc) { enIyiKazanc = kazanc; enIyiIdx = j; enIyiHedef = hedefSonraki; }
      }
      return { idx: enIyiIdx, hedef: enIyiHedef };
    };
    for (let i = 0; i < 2000; i++) {
      if (hesaplaKS() >= altSinir) break;
      const { idx, hedef } = _ascMecburArtirIdx();
      if (idx < 0) break;
      kriterler[idx].hedefY = hedef;
    }
  }

  // Hedefleri tabloya uygula
  ASC_KRITERLER.forEach(k => {
    const el = document.querySelector(`input[data-asc="${k.prefix}-H"]`);
    if (el) el.value = '';
  });
  kriterler.forEach(k => {
    if (k.G > 0 && k.hedefY > 0) {
      const el = document.querySelector(`input[data-asc="${k.prefix}-H"]`);
      if (el) el.value = k.hedefY;
    }
  });
  ascHesapla();
}

function ascProfilTemizle() {
  ASC_KRITERLER.forEach(k => {
    const maxEl = document.querySelector(`input[data-asc-profil="${k.prefix}-max"]`);
    const eforEl = document.querySelector(`select[data-asc-profil="${k.prefix}-efor"]`);
    const oncelikEl = document.querySelector(`select[data-asc-profil="${k.prefix}-oncelik"]`);
    if (maxEl) maxEl.value = '';
    if (eforEl) eforEl.value = '3';
    if (oncelikEl) { oncelikEl.value = String(ONCELIK_DEFAULT); oncelikEl.hidden = true; }
  });
}

const ASC_BANA_BIRAK = {
  vital:    { max: 100, efor: 3 },
  cokyonlu: { max: 100, efor: 2 },
};

function ascBanaBirak() {
  ASC_KRITERLER.forEach(k => {
    const v = ASC_BANA_BIRAK[k.prefix];
    if (!v) return;
    const maxEl = document.querySelector(`input[data-asc-profil="${k.prefix}-max"]`);
    const eforEl = document.querySelector(`select[data-asc-profil="${k.prefix}-efor"]`);
    const oncelikEl = document.querySelector(`select[data-asc-profil="${k.prefix}-oncelik"]`);
    if (maxEl) maxEl.value = v.max;
    if (eforEl) eforEl.value = v.efor;
    if (oncelikEl) oncelikEl.hidden = v.efor !== EFOR_MECBUR;
  });
}

// ──────────────────────────────────────────
// Başlangıç
// ──────────────────────────────────────────

// Auth/profil senkronu için kritik değişkenleri ve fonksiyonları window'a expose et
window.HYP2_KRITERLER = HYP2_KRITERLER;
window.ASC_KRITERLER = ASC_KRITERLER;
window.hypV2Hesapla = hypV2Hesapla;
window.ascHesapla = ascHesapla;
window.hypV2AIOptimize = hypV2AIOptimize;
window.ascAIOptimize = ascAIOptimize;

document.addEventListener('DOMContentLoaded', () => {
  hypV2TabloKur();
  ascTabloKur();
  hypV2ProfilKur();
  ascProfilKur();
  _localStorageYukle();       // v: önceki kaldığı yerden devam et
  hypV2Hesapla();
  ascHesapla();

  // Eklentiden (SINA/HYP akışı) veri gelince tabloyu güncelle.
  // _veriDegistiSinyali YERİNE detay'lı event: site_content.js bu event'i
  // yakalayıp eklentiye geri yazmasın (aksi halde HYP'nin yazdığı `y` değerleri
  // siteye gidip input stale'i ile birlikte geri eziliyor — v1.20.3 bug).
  window.addEventListener('hesap-eklenti-veri-geldi', () => {
    window._eklentiVerisiZamani = Date.now(); // Firestore snapshot'ını 10sn blokla
    _localStorageYukle();
    // Nüfus geldiyse (HYP sayfasından auto-pull sonrası) ve profil boşsa Genel — Optimal
    // şablonunu otomatik uygula — hesapla'dan ÖNCE ki tavanKS doğru hesaplansın
    try {
      const nufus = parseInt(document.getElementById('hypV2Nufus')?.value) || 0;
      if (nufus > 0 && typeof window.hesapSablonGenelVarsayilan === 'function') {
        window.hesapSablonGenelVarsayilan();
      }
    } catch (_) {}
    hypV2Hesapla();
    ascHesapla();
    // LS zaten güncel (site_content mirror'ı yazdı) — sadece Firestore sync tetikle
    try {
      window.dispatchEvent(new CustomEvent('hesap-verisi-degisti', { detail: { kaynak: 'eklenti' } }));
    } catch (_) {}
  });

  // HYP v2 — Optimize + Sıfırla + Bana Bırak
  const _v2Sarmal = (fn) => () => { fn(); _veriDegistiSinyali(); };
  document.getElementById('hypV2HedefSifirla')?.addEventListener('click', _v2Sarmal(hypV2HedefSifirla));
  document.getElementById('hypV2AIOptimize')?.addEventListener('click', _v2Sarmal(hypV2AIOptimize));
  document.getElementById('hypV2ProfilTemizle')?.addEventListener('click', _v2Sarmal(hypV2ProfilTemizle));
  document.getElementById('hypV2BanaBirak')?.addEventListener('click', _v2Sarmal(hypV2BanaBirak));

  // ASÇ — Optimize + Sıfırla + Bana Bırak
  const _ascSarmal = (fn) => () => { fn(); _veriDegistiSinyali(); };
  document.getElementById('ascHedefSifirla')?.addEventListener('click', _ascSarmal(ascHedefSifirla));
  document.getElementById('ascAIOptimize')?.addEventListener('click', _ascSarmal(ascAIOptimize));
  document.getElementById('ascProfilTemizle')?.addEventListener('click', _ascSarmal(ascProfilTemizle));
  document.getElementById('ascBanaBirak')?.addEventListener('click', _ascSarmal(ascBanaBirak));
});
