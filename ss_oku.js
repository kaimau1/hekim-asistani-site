// ═══ Ahek Plus — Ekran görüntüsünden (SS) YAPILAN okuma ═══
// SINA / e-Nabız özet panosu ekran görüntüsünü tarayıcı içi OCR (Tesseract.js)
// ile okur, kriter başına sayıyı HYP tablosunun YAPILAN (Y) sütununa yazar.
// Görsel ve dil verisi hiçbir sunucuya GİTMEZ — işlem %100 tarayıcıda.
// Okunan sayılar agregat (hasta verisi değil); sayfa kapanınca iz kalmaz.

(function () {
  'use strict';

  // SINA/e-Nabız "Takip İşlemi İstatistikleri" panosu SABİT 4 sütunlu ızgaradır.
  // Etiket başlıkları (renkli zemin üzeri küçük yazı + ikon) OCR'da güvenilir OKUNMUYOR;
  // sayılar ise konumlarıyla net okunuyor. Bu yüzden eşleme ETİKET değil KONUM (satır,sütun)
  // ile yapılır: her hücre, panonun sabit sırasındaki kritere atanır.
  // Satır-major (soldan sağa, üstten alta). null = HYP'ye yazılmaz (OSB / Genel Risk).
  const IZGARA = [
    ['htTarama', 'htTakip', 'kvrTarama', 'kvrTakip'],
    ['dmTarama', 'dmTakip', 'obzTarama', 'obzTakip'],
    ['kah',      'yasli',   'inme',      'kbh'],
    ['koah',     'astim',   null,        null],
  ];

  // Tesseract blocks → düz satır listesi { metin, bbox }
  function _satirlariCikar(data) {
    const satirlar = [];
    const bloklar = data && data.blocks ? data.blocks : [];
    bloklar.forEach(blok => {
      (blok.paragraphs || []).forEach(par => {
        (par.lines || []).forEach(line => {
          const metin = (line.text || '').trim();
          if (metin && line.bbox) satirlar.push({ metin, bbox: line.bbox });
        });
      });
    });
    return satirlar;
  }

  const _merkezX = b => (b.x0 + b.x1) / 2;
  const _merkezY = b => (b.y0 + b.y1) / 2;

  // 1B kümeleme: tol'dan büyük boşlukta yeni grup başlat; her elemana grup indeksi (artan) ver.
  function _kumele(merkezler, tol) {
    const idx = merkezler.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    let grupNo = 0;
    const ata = {};
    idx.forEach((o, k) => {
      if (k > 0 && o.v - idx[k - 1].v > tol) grupNo++;
      ata[o.i] = grupNo;
    });
    return { ata, sayi: grupNo + 1 };
  }

  // Sayıları (bbox'lu) sabit 4 sütunlu ızgara hücresine göre kritere eşle.
  // sayilar: [{ deger, bbox }]. imgW/imgH kümeleme toleransı için.
  function _izgaraEslestir(sayilar, imgW, imgH) {
    if (!sayilar || !sayilar.length) return {};
    const col = _kumele(sayilar.map(s => _merkezX(s.bbox)), (imgW || 1000) * 0.08);
    const row = _kumele(sayilar.map(s => _merkezY(s.bbox)), (imgH || 1000) * 0.05);
    const sonuc = {};
    sayilar.forEach((s, i) => {
      const r = row.ata[i], c = col.ata[i];
      const prefix = IZGARA[r] && IZGARA[r][c];
      if (prefix && sonuc[prefix] == null) sonuc[prefix] = s.deger;
    });
    return sonuc;
  }

  // ── OCR motoru ──
  // Yolları mutlak yap — blob worker bağlamında göreli yol çözümü güvenilmez.
  function _vendorBase() {
    try { return new URL('vendor/tesseract/', document.baseURI).href; }
    catch (e) { return 'vendor/tesseract/'; }
  }
  let _worker = null;
  async function _workerAl(ilerleCb) {
    if (_worker) return _worker;
    if (!window.Tesseract) throw new Error('OCR motoru yüklenemedi (Tesseract).');
    const base = _vendorBase();
    _worker = await window.Tesseract.createWorker('tur', 1, {
      workerPath: base + 'worker.min.js',
      corePath: base,
      langPath: base,
      gzip: true,
      logger: m => { if (ilerleCb && m && m.status) ilerleCb(m); },
    });
    return _worker;
  }

  // Gorseli canvas'a ciz; kucuk gorseli buyut (kucuk rakamlar OCR'da kayboluyor).
  // binarize: renkli yaziyi (ozellikle renkli sayilari) esikle siyah/beyaza cevirir.
  function _canvasCiz(img, olcek, binarize) {
    const gw = img.naturalWidth || img.width || 1000;
    const gh = img.naturalHeight || img.height || 1000;
    const cv = document.createElement('canvas');
    cv.width = Math.min(Math.round(gw * olcek), 4000);
    cv.height = Math.round(gh * (cv.width / gw));
    const cx = cv.getContext('2d');
    cx.imageSmoothingEnabled = true;
    cx.imageSmoothingQuality = 'high';
    cx.drawImage(img, 0, 0, cv.width, cv.height);
    if (binarize) {
      const id = cx.getImageData(0, 0, cv.width, cv.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const v = l < 160 ? 0 : 255;
        d[i] = d[i + 1] = d[i + 2] = v;
      }
      cx.putImageData(id, 0, 0);
    }
    return cv;
  }

  // Bir promise'i zaman asimiyla yaris — tek bir OCR cagrisi takilsa bile tum islem kilitlenmesin.
  function _zamanAsimli(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, red) => setTimeout(() => red(new Error('zaman asimi')), ms)),
    ]);
  }

  // SS okuma: sayilari TEK geciste (rakam-whitelist) oku, sonra KONUM-IZGARASIYLA kritere esle.
  // Etiket OCR'i gercek panolarda guvenilir degil (renkli zemin+ikon); pano duzeni sabit
  // oldugu icin sayinin (satir,sutun) hucresi kriteri belirler. Kucuk gorsel buyutulur.
  async function _oku(gorsel, ilerleCb, asamaCb) {
    const worker = await _workerAl(ilerleCb);
    const gw = gorsel.naturalWidth || gorsel.width || 1000;
    if (asamaCb) asamaCb('sayi');
    // Kucuk/dusuk cozunurluklu gorseli buyut (renkli sayilar aksi halde okunmaz); buyukse birak.
    const olcek = gw < 1600 ? Math.max(1, Math.min(3, 2400 / gw)) : 1;
    const canvas = _canvasCiz(gorsel, olcek, false);
    await worker.setParameters({ tessedit_pageseg_mode: '11', tessedit_char_whitelist: '0123456789' });
    const data = (await _zamanAsimli(worker.recognize(canvas, {}, { blocks: true }), 30000)).data;
    const sayilar = _satirlariCikar(data)
      .map(s => { const m = (s.metin || '').replace(/\D/g, ''); return { deger: parseInt(m, 10), m: m, bbox: s.bbox }; })
      .filter(s => /^\d{1,4}$/.test(s.m));
    return _izgaraEslestir(sayilar, canvas.width, canvas.height);
  }

  // ── UI ──
  let _gorselURL = null;

  function _kriterListesi() {
    return (typeof HYP2_KRITERLER !== 'undefined') ? HYP2_KRITERLER : [];
  }

  function _onizlemeYap(sonuc) {
    const tbody = document.getElementById('ssOkuSonucBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    let eslesen = 0;
    _kriterListesi().forEach(k => {
      const deger = sonuc[k.prefix];
      const dolu = deger != null;
      if (dolu) eslesen++;
      const tr = document.createElement('tr');
      tr.className = dolu ? 'ss-oku-dolu' : 'ss-oku-bos';
      tr.innerHTML =
        `<td>${k.ad}</td>` +
        `<td><input class="ss-oku-sayi sayi-inp" data-ss-prefix="${k.prefix}" type="number" min="0" inputmode="numeric" value="${dolu ? deger : ''}" placeholder="—"></td>`;
      tbody.appendChild(tr);
    });
    const ozet = document.getElementById('ssOkuOzet');
    if (ozet) ozet.textContent = `${eslesen} / ${_kriterListesi().length} kriter okundu. Okunamayanları (—) elle doldurun, yanlış varsa düzeltip uygulayın.`;
    const sonucAlan = document.getElementById('ssOkuSonucAlan');
    if (sonucAlan) sonucAlan.hidden = false;
    const uygulaBtn = document.getElementById('ssOkuUygula');
    if (uygulaBtn) uygulaBtn.disabled = eslesen === 0;
  }

  function _durum(metin, hata) {
    const el = document.getElementById('ssOkuDurum');
    if (!el) return;
    el.textContent = metin || '';
    el.classList.toggle('hata', !!hata);
  }

  function _gorseliGoster(blob) {
    if (_gorselURL) { URL.revokeObjectURL(_gorselURL); _gorselURL = null; }
    _gorselURL = URL.createObjectURL(blob);
    const img = document.getElementById('ssOkuOnizleme');
    if (img) { img.src = _gorselURL; img.hidden = false; }
    const okuBtn = document.getElementById('ssOkuBaslat');
    if (okuBtn) { okuBtn.disabled = false; okuBtn.dataset.hazir = '1'; }
    _durum('Görsel hazır. "Oku" ile metni çıkarın.');
    const sonucAlan = document.getElementById('ssOkuSonucAlan');
    if (sonucAlan) sonucAlan.hidden = true;
  }

  function _dosyaAl(dosya) {
    if (!dosya || !/^image\//.test(dosya.type)) {
      _durum('Lütfen bir görsel (ekran görüntüsü) verin.', true);
      return;
    }
    _gorseliGoster(dosya);
  }

  async function _okumaBaslat() {
    const img = document.getElementById('ssOkuOnizleme');
    if (!img || img.hidden || !_gorselURL) { _durum('Önce bir görsel ekleyin.', true); return; }
    const okuBtn = document.getElementById('ssOkuBaslat');
    if (okuBtn) okuBtn.disabled = true;
    _durum('OCR motoru hazırlanıyor… (ilk kullanımda dil verisi yüklenir)');
    try {
      const sonuc = await _oku(
        img,
        m => { if (m.status === 'recognizing text' && m.progress != null) { /* ayrinti asamaCb'de */ } },
        (asama, i, n) => {
          if (asama === 'etiket') _durum('Kriter başlıkları okunuyor…');
          else if (asama === 'sayi') _durum(n ? `Sayılar okunuyor… (${i}/${n})` : 'Sayılar okunuyor…');
        }
      );
      const adet = Object.keys(sonuc).length;
      _durum(
        adet
          ? 'Okuma tamam. Eşleşmeyen kriterleri elle doldurup uygulayın.'
          : 'Hiç kriter okunamadı — sadece kart alanını içeren daha büyük/net bir görsel deneyin (tüm pencere yerine).',
        adet === 0
      );
      _onizlemeYap(sonuc);
    } catch (e) {
      _durum('Okuma hatası: ' + (e && e.message ? e.message : 'bilinmeyen'), true);
    } finally {
      if (okuBtn) okuBtn.disabled = false;
    }
  }

  function _uygula() {
    const inputlar = document.querySelectorAll('#ssOkuSonucBody input[data-ss-prefix]');
    let n = 0;
    inputlar.forEach(inp => {
      const val = inp.value.trim();
      if (val === '') return;
      const prefix = inp.dataset.ssPrefix;
      const hedef = document.querySelector(`input[data-hypv2="${prefix}-Y"]`);
      if (hedef) { hedef.value = String(parseInt(val, 10) || 0); n++; }
    });
    if (n > 0) {
      const ilk = document.querySelector('input[data-hypv2]');
      if (ilk) ilk.dispatchEvent(new Event('input', { bubbles: true }));
      if (typeof hypV2Hesapla === 'function') hypV2Hesapla();
    }
    _durum(`${n} kriterin YAPILAN değeri tabloya yazıldı.`);
    // Modal kapanışını butondaki data-modal-kapat-sonra (site.js) yönetir.
  }

  function _temizle() {
    if (_gorselURL) { URL.revokeObjectURL(_gorselURL); _gorselURL = null; }
    const img = document.getElementById('ssOkuOnizleme');
    if (img) { img.src = ''; img.hidden = true; }
    const sonucAlan = document.getElementById('ssOkuSonucAlan');
    if (sonucAlan) sonucAlan.hidden = true;
    const okuBtn = document.getElementById('ssOkuBaslat');
    if (okuBtn) okuBtn.disabled = true;
    _durum('');
  }

  function _bagla() {
    const modal = document.getElementById('ssOkuModal');
    if (!modal) return;

    const dosyaInp = document.getElementById('ssOkuDosya');
    if (dosyaInp) {
      dosyaInp.addEventListener('change', () => {
        if (dosyaInp.files && dosyaInp.files[0]) _dosyaAl(dosyaInp.files[0]);
      });
    }

    const drop = document.getElementById('ssOkuDrop');
    if (drop) {
      ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault(); drop.classList.add('uzerinde');
      }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
        e.preventDefault(); drop.classList.remove('uzerinde');
      }));
      drop.addEventListener('drop', e => {
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) _dosyaAl(f);
      });
      drop.addEventListener('click', () => dosyaInp && dosyaInp.click());
    }

    // Pano yapıştır — yalnız modal açıkken
    document.addEventListener('paste', e => {
      if (modal.hidden) return;
      const items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (const it of items) {
        if (it.type && it.type.indexOf('image') === 0) {
          const f = it.getAsFile();
          if (f) { _dosyaAl(f); e.preventDefault(); break; }
        }
      }
    });

    const okuBtn = document.getElementById('ssOkuBaslat');
    if (okuBtn) okuBtn.addEventListener('click', _okumaBaslat);
    const uygulaBtn = document.getElementById('ssOkuUygula');
    if (uygulaBtn) uygulaBtn.addEventListener('click', _uygula);
    const temizleBtn = document.getElementById('ssOkuTemizle');
    if (temizleBtn) temizleBtn.addEventListener('click', _temizle);
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _bagla);
    } else {
      _bagla();
    }
  }

  // Test/erişim için
  if (typeof window !== 'undefined') {
    window._ssOku = { _izgaraEslestir, _kumele, _oku, IZGARA };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { _izgaraEslestir, _kumele, IZGARA };
  }
})();
