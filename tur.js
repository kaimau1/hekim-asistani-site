// ═══ Site Tanıtım Turu ═══
// Hafif, bağımlılıksız. Kullanıcı "🎯 Tanıtım Turu" butonuna bastığında açılır.
// Hedef element'i vurgular, yanında tooltip gösterir, İleri/Geri/Atla butonları.

(function () {
  const ADIMLAR = [
    {
      hedef: '.ust-kartlar-sticky',
      panel: 'hypv2',
      baslik: '📊 Özet Kartları',
      metin: 'Nüfus, Başarı Katsayısı (tavan ile birlikte) ve KHT % özeti burada. Nüfus girince tavan hesaplanır.',
    },
    {
      hedef: '#hypV2Nufus',
      panel: 'hypv2',
      baslik: '👥 Nüfus Girişi',
      metin: 'Hekim nüfusunuzu buraya yazın. Tavan katsayısı: 4000 / nüfus (maks 1.5).',
    },
    {
      hedef: '#hypV2Tablo tbody tr[data-prefix]:first-child',
      panel: 'hypv2',
      baslik: '📝 Kriter Girişleri',
      metin: 'Her kriter için <b>Gereken</b> (hedef popülasyon), <b>Yapılan</b> (fiili) ve <b>Devir</b> (önceki dönem) değerlerini girin. Elle girilebilir veya Chrome eklentisi ile resmi HYP sayfasından otomatik çekilir.',
    },
    {
      hedef: '#hypV2Tablo tbody tr[data-prefix]:first-child .bar-tum',
      panel: 'hypv2',
      baslik: '🎯 Hedef Barı',
      metin: 'Her kriter için: turuncu işaret <b>asgari</b>, yeşil işaret <b>tavan</b>, mavi işaret <b>hedefiniz</b>. Mavi çubuğu sürükleyerek hedefi değiştirin veya sayıyı doğrudan yazın.',
    },
    {
      hedef: '.ai-hedef-kart',
      panel: 'hypv2',
      baslik: '✨ AI ile Hedef Hesapla',
      metin: '<b>⚙ Ayarla</b> ile her kriter için efor düzeyi ve öncelik belirleyin. Sonra <b>✨ Hesapla</b> tavanı aşmadan, profil tercihinize göre tüm hedefleri akıllıca dağıtır.',
    },
    {
      hedef: '.profil-sablon-bar',
      panel: 'hypv2-ayarla',
      baslik: '📚 Hazır Şablonlar',
      metin: 'Genel şablonlar (🌐) hazır gelir; kendi profilinizi kaydedip sonra tekrar yükleyebilirsiniz.',
    },
    {
      hedef: '.sekme-btn[data-sekme="asc"]',
      panel: 'hypv2',
      baslik: '👩‍⚕️ ASÇ Hesaplama',
      metin: 'Aile Sağlığı Çalışanları için ayrı sekme. 2 kriter, hekim HYP\'nin %75\'ini aşma şartı.',
    },
    {
      hedef: '.auth-alan',
      panel: 'hypv2',
      baslik: '☁ Buluta Senkronizasyon',
      metin: 'Giriş yaparsanız verileriniz tüm cihazlarınızda otomatik senkronize olur. Ücretsiz.',
    },
  ];

  let iAdim = 0;
  let kurulduMu = false;

  function _el(tag, sinif, icerik) {
    const e = document.createElement(tag);
    if (sinif) e.className = sinif;
    if (icerik != null) e.innerHTML = icerik;
    return e;
  }

  function _kur() {
    if (kurulduMu) return;
    kurulduMu = true;
    const backdrop = _el('div', 'tur-backdrop');
    backdrop.id = 'turBackdrop';
    const spot = _el('div', 'tur-spot');
    spot.id = 'turSpot';
    const tip = _el('div', 'tur-tooltip');
    tip.id = 'turTooltip';
    tip.innerHTML = `
      <div class="tur-tip-basini">
        <span class="tur-tip-sayac" id="turSayac"></span>
        <button type="button" class="tur-kapat" id="turKapat" aria-label="Turu kapat">✕</button>
      </div>
      <div class="tur-tip-baslik" id="turBaslik"></div>
      <div class="tur-tip-metin" id="turMetin"></div>
      <div class="tur-tip-btnler">
        <button type="button" class="btn tur-btn-geri" id="turGeri">‹ Geri</button>
        <button type="button" class="btn btn-birincil tur-btn-ileri" id="turIleri">İleri ›</button>
      </div>`;
    document.body.appendChild(backdrop);
    document.body.appendChild(spot);
    document.body.appendChild(tip);

    document.getElementById('turKapat').addEventListener('click', _kapat);
    document.getElementById('turGeri').addEventListener('click', () => _git(iAdim - 1));
    document.getElementById('turIleri').addEventListener('click', () => _git(iAdim + 1));
    backdrop.addEventListener('click', _kapat);
    window.addEventListener('resize', _konumla);
    window.addEventListener('scroll', _konumla, { passive: true });
    document.addEventListener('keydown', (e) => {
      if (!document.body.classList.contains('tur-aktif')) return;
      if (e.key === 'Escape') _kapat();
      else if (e.key === 'ArrowRight') _git(iAdim + 1);
      else if (e.key === 'ArrowLeft') _git(iAdim - 1);
    });
  }

  function _panelAc(panel) {
    // HYP v2 / ASÇ sekme + Ayarla modal
    if (panel && panel.startsWith('hypv2')) {
      document.querySelector('.sekme-btn[data-sekme="hypv2"]')?.click();
    }
    if (panel === 'hypv2-ayarla') {
      const m = document.getElementById('hypV2ProfilModal');
      if (m && m.hidden) document.querySelector('[data-modal-ac="hypV2ProfilModal"]')?.click();
    } else {
      // Başka adımdaysak ayarla modalını kapat
      const m = document.getElementById('hypV2ProfilModal');
      if (m && !m.hidden) document.querySelector('#hypV2ProfilModal [data-modal-kapat]')?.click();
    }
  }

  function _konumla() {
    if (!document.body.classList.contains('tur-aktif')) return;
    const adim = ADIMLAR[iAdim];
    if (!adim) return;
    const hedefEl = document.querySelector(adim.hedef);
    const spot = document.getElementById('turSpot');
    const tip = document.getElementById('turTooltip');
    if (!hedefEl || !spot || !tip) return;
    const r = hedefEl.getBoundingClientRect();
    const ped = 8;
    // Spot (vurgu)
    spot.style.top = (r.top + window.scrollY - ped) + 'px';
    spot.style.left = (r.left + window.scrollX - ped) + 'px';
    spot.style.width = (r.width + ped * 2) + 'px';
    spot.style.height = (r.height + ped * 2) + 'px';
    // Tooltip konumu
    const tipR = tip.getBoundingClientRect();
    const vpW = window.innerWidth, vpH = window.innerHeight;
    let tipTop = r.bottom + window.scrollY + 12;
    let tipLeft = r.left + window.scrollX + r.width / 2 - tipR.width / 2;
    // Alt taşarsa üstte göster
    if (r.bottom + tipR.height + 20 > vpH) {
      tipTop = r.top + window.scrollY - tipR.height - 12;
    }
    // Yatay sınırla
    tipLeft = Math.max(10 + window.scrollX, Math.min(tipLeft, vpW - tipR.width - 10 + window.scrollX));
    tip.style.top = tipTop + 'px';
    tip.style.left = tipLeft + 'px';
  }

  function _git(idx) {
    if (idx < 0) return _kapat();
    if (idx >= ADIMLAR.length) return _kapat();
    iAdim = idx;
    const adim = ADIMLAR[iAdim];
    _panelAc(adim.panel);
    // Element oluşana kadar kısa bekle
    setTimeout(() => {
      const hedefEl = document.querySelector(adim.hedef);
      if (!hedefEl) { _git(idx + 1); return; }
      hedefEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        document.getElementById('turBaslik').textContent = adim.baslik || '';
        document.getElementById('turMetin').innerHTML = adim.metin || '';
        document.getElementById('turSayac').textContent = `${iAdim + 1} / ${ADIMLAR.length}`;
        document.getElementById('turGeri').disabled = iAdim === 0;
        document.getElementById('turIleri').textContent = iAdim === ADIMLAR.length - 1 ? 'Bitir ✓' : 'İleri ›';
        _konumla();
      }, 200);
    }, 120);
  }

  function _kapat() {
    document.body.classList.remove('tur-aktif');
    document.getElementById('turBackdrop')?.setAttribute('hidden', '');
    document.getElementById('turSpot')?.setAttribute('hidden', '');
    document.getElementById('turTooltip')?.setAttribute('hidden', '');
    try { localStorage.setItem('site_tur_izlendi', '1'); } catch (_) {}
  }

  function _basla() {
    _kur();
    document.body.classList.add('tur-aktif');
    document.getElementById('turBackdrop').removeAttribute('hidden');
    document.getElementById('turSpot').removeAttribute('hidden');
    document.getElementById('turTooltip').removeAttribute('hidden');
    // Hesapla section'a kaydır
    document.getElementById('hesapla')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => _git(0), 300);
  }

  window.siteTuruBaslat = _basla;
  window.siteTuruKapat = () => {
    const sarmal = document.getElementById('turBaslatSarmal');
    if (sarmal) sarmal.hidden = true;
    try { localStorage.setItem('site_turu_buton_gizli', '1'); } catch (_) {}
    _kapat();
  };

  function _ilkZiyaretIpucu() {
    let izlendi = false;
    try { izlendi = localStorage.getItem('site_tur_izlendi') === '1'; } catch (_) {}
    if (izlendi) return;
    const ipucu = document.getElementById('turIlkIpucu');
    if (!ipucu) return;
    setTimeout(() => { ipucu.hidden = false; }, 1200);
    document.getElementById('turIpucuKapat')?.addEventListener('click', (e) => {
      e.stopPropagation();
      ipucu.hidden = true;
      try { localStorage.setItem('site_tur_izlendi', '1'); } catch (_) {}
    });
  }

  function _turButonuKur() {
    const sarmal = document.getElementById('turBaslatSarmal');
    const kapatBtn = document.getElementById('btnSiteTuruKapat');
    const anaBtn = document.getElementById('btnSiteTuru');
    let gizli = false;
    try { gizli = localStorage.getItem('site_turu_buton_gizli') === '1'; } catch (_) {}
    if (sarmal && gizli) sarmal.hidden = true;
    kapatBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      window.siteTuruKapat?.();
    });
    anaBtn?.addEventListener('dblclick', () => {
      if (sarmal) sarmal.hidden = false;
      try { localStorage.removeItem('site_turu_buton_gizli'); } catch (_) {}
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-site-turu').forEach(b => b.addEventListener('click', _basla));
    _ilkZiyaretIpucu();
    _turButonuKur();
  });
})();
