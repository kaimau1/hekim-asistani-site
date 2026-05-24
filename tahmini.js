// tahmini.js — Sonraki ay HYP tahmini hesabı
// Eklenti HYP Kayıtlı Hasta Takibi sekmesinden veri çeker, burada hesaplanır.

(function () {
  'use strict';

  const EKLENTI_ID = 'dbodkaociggagccjjnobjefpjhpmkjif';

  // Kriter tanımları — her biri için DOM başlığı, bölen (N), ilkTakipMi, renk
  const KRITERLER = [
    { key: 'htTarama',  ad: 'HT Tarama',   baslik: 'HİPERTANSİYON TARAMA',       bolen: 12, ilkTakip: false, renk: '#2563eb' },
    { key: 'htIzlem',   ad: 'HT İzlem',    baslik: 'HİPERTANSİYON İZLEM',         bolen: 6,  ilkTakip: false, renk: '#1d4ed8' },
    { key: 'dmTarama',  ad: 'DM Tarama',   baslik: 'DİYABET TARAMA',              bolen: 24, ilkTakip: true,  renk: '#059669' },
    { key: 'dmIzlem',   ad: 'DM İzlem',    baslik: 'DİYABET İZLEM',               bolen: 6,  ilkTakip: false, renk: '#047857' },
    { key: 'kvrTarama', ad: 'KVR Tarama',  baslik: 'KARDİYOVASKÜLER RİSK TARAMA', bolen: 12, ilkTakip: true,  renk: '#db2777' },
    { key: 'kvrIzlem',  ad: 'KVR İzlem',   baslik: 'KARDİYOVASKÜLER RİSK İZLEM',  bolen: 24, ilkTakip: false, renk: '#be185d' },
    { key: 'obzTarama', ad: 'OB Tarama',   baslik: 'OBEZİTE TARAMA',              bolen: 12, ilkTakip: false, renk: '#d97706' },
    { key: 'obzIzlem',  ad: 'OB İzlem',    baslik: 'OBEZİTE İZLEM',               bolen: 6,  ilkTakip: false, renk: '#b45309' },
    { key: 'yasliIzlem', ad: 'Yaşlı',      baslik: 'YAŞLI DEĞERLENDİRME',         bolen: 12, ilkTakip: false, renk: '#7c3aed' },
    { key: 'kahIzlem',  ad: 'KAH',         baslik: 'KORONER ARTER HASTALIĞI',     bolen: 12, ilkTakip: false, renk: '#dc2626' },
    { key: 'kbhIzlem',  ad: 'KBH',         baslik: 'KRONİK BÖBREK HASTALIĞI',     bolen: 12, ilkTakip: false, renk: '#0891b2' },
    { key: 'astimIzlem', ad: 'Astım',      baslik: 'ASTIM',                       bolen: 12, ilkTakip: false, renk: '#0369a1' },
    { key: 'koahIzlem', ad: 'KOAH',        baslik: 'KRONİK OBSTRÜKTİF',           bolen: 6,  ilkTakip: false, renk: '#475569' },
    { key: 'inmeIzlem', ad: 'İnme',        baslik: 'İNME',                        bolen: 12, ilkTakip: false, renk: '#a21caf' },
    { key: 'osbTarama', ad: 'OSB Tarama',  baslik: 'OSB TARAMA',                  bolen: 3,  ilkTakip: false, renk: '#65a30d' }
  ];

  const $ = (id) => document.getElementById(id);

  function durumGoster(metin, tip) {
    const el = $('tahminiDurum');
    if (!el) return;
    el.hidden = false;
    el.textContent = metin;
    el.className = 'tahmini-durum' + (tip === 'hata' ? ' hata' : tip === 'basarili' ? ' basarili' : '');
  }
  function durumGizle() { const el = $('tahminiDurum'); if (el) el.hidden = true; }

  function tahminiArtisiHesapla(k, veri) {
    if (!veri) return 0;
    if (k.key === 'osbTarama' && typeof veri.buAySayilacak === 'number') {
      return Math.max(0, veri.buAySayilacak);
    }
    const toplam = veri.toplam || 0;
    const zamaninda = veri.zamaninda || 0;
    const hicTakip = veri.hicTakip || 0;
    const pay = k.ilkTakip ? hicTakip : Math.max(0, toplam - zamaninda);
    return k.bolen > 0 ? pay / k.bolen : 0;
  }

  function yeniden() {
    const kayit = _tahminiYukle();
    const grid = $('tahminiGrid');
    const gncEl = $('tahminiGuncel');

    if (!kayit || !kayit.kriterler) {
      grid.innerHTML = '<div class="tahmini-bos">Henüz veri yok — yukarıdaki <b>Tahmini Verileri Hesapla</b> butonuna basın.</div>';
      gncEl.textContent = '';
      return;
    }

    // Grid kartları
    const kartHtml = KRITERLER.map(k => {
      let v = kayit.kriterler[k.key];
      if (k.key === 'osbTarama') {
        // OSB, kayıtlı hasta takibi kartından değil OSB Ay Oku sonucundan hesaplanır.
        if (!v || typeof v.buAySayilacak !== 'number') v = null;
      }
      if (!v) {
        return `<div class="tahmini-kart" style="--tahmini-renk:${k.renk};--tahmini-ton:${k.renk}">
          <div class="tahmini-kart-baslik">${k.ad}</div>
          <div class="tahmini-kart-val">—</div>
          <div class="tahmini-kart-alt">veri yok</div>
        </div>`;
      }
      const artis = tahminiArtisiHesapla(k, v);
      const artisYuvar = Math.round(artis);
      const formul = k.key === 'osbTarama' && typeof v.buAySayilacak === 'number'
        ? `OSB Ay Oku: bu ay sayılacak ${v.buAySayilacak}`
        : k.ilkTakip
        ? `Hiç taranmayan ${v.hicTakip} / ${k.bolen}`
        : `(Toplam ${v.toplam} − Zamanında ${v.zamaninda}) / ${k.bolen}`;

      return `<div class="tahmini-kart dolu" style="--tahmini-renk:${k.renk};--tahmini-ton:${k.renk}">
        <div class="tahmini-kart-baslik">${k.ad}</div>
        <div class="tahmini-kart-val">${artisYuvar}</div>
        <div class="tahmini-kart-alt">${formul}</div>
      </div>`;
    }).join('');
    grid.innerHTML = kartHtml;

    // Son güncelleme
    if (kayit.guncellenme) {
      const dt = new Date(kayit.guncellenme);
      gncEl.textContent = 'Son güncelleme: ' + dt.toLocaleString('tr-TR');
    }
  }

  function _tahminiYukle() {
    try { return JSON.parse(localStorage.getItem('hesap_tahmini_v1') || 'null'); } catch (_) { return null; }
  }
  function _tahminiKaydet(d) {
    try { localStorage.setItem('hesap_tahmini_v1', JSON.stringify(d)); } catch (_) {}
  }

  async function hesaplaTetikle() {
    const btn = $('btnTahminiHesapla');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = '⏳ Hesaplanıyor…';

    // Zaman bazlı ilerleme mesajları — sessizlik olmasın
    const asamalar = [
      { sn: 0,  metin: '🔄 HYP sekmesi aranıyor / açılıyor...' },
      { sn: 3,  metin: '🔄 HYP dashboard yükleniyor...' },
      { sn: 7,  metin: '🔄 Kayıtlı Hasta Takibi sekmesi açılıyor...' },
      { sn: 11, metin: '📊 Hastalık kartları okunuyor...' },
      { sn: 18, metin: '⏳ Veriler toplanıyor (biraz daha)...' },
      { sn: 28, metin: '⏳ HYP yavaş yanıt veriyor — biraz bekleyin...' }
    ];
    let noktaSayaci = 0;
    let asamaIdx = 0;
    const basladi = Date.now();
    const intervalId = setInterval(() => {
      noktaSayaci = (noktaSayaci + 1) % 4;
      const gecenSn = Math.floor((Date.now() - basladi) / 1000);
      while (asamaIdx + 1 < asamalar.length && asamalar[asamaIdx + 1].sn <= gecenSn) asamaIdx++;
      const nokta = '.'.repeat(noktaSayaci);
      durumGoster(asamalar[asamaIdx].metin.replace('...', nokta.padEnd(3, ' ')) + `  (${gecenSn}sn)`, 'info');
    }, 500);

    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        throw new Error('Eklenti bulunamadı — Chrome eklentisi kurulu ve aktif olmalı.');
      }
      const resp = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(EKLENTI_ID, { type: 'tahminiVeriCek' }, (r) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(r);
        });
      });
      clearInterval(intervalId);
      if (!resp || !resp.ok) throw new Error(resp?.hata || 'Veri alınamadı');

      _tahminiKaydet({ kriterler: resp.kriterler, guncellenme: Date.now() });
      const kriterSayisi = Object.keys(resp.kriterler || {}).length;
      let mesaj = `✓ Veriler alındı — ${kriterSayisi} kriter hesaplandı`;
      if (resp.eslesmeyenler && resp.eslesmeyenler.length) {
        mesaj += ` (eşleşmeyen: ${resp.eslesmeyenler.join(', ')})`;
      }
      durumGoster(mesaj, 'basarili');
      yeniden();
      setTimeout(durumGizle, 5000);
    } catch (e) {
      clearInterval(intervalId);
      durumGoster('Hata: ' + (e?.message || e) + ' — HYP sekmesi açıksa giriş yapıp tekrar deneyin.', 'hata');
    } finally {
      btn.disabled = false;
      btn.textContent = '🧮 Tahmini Verileri Hesapla';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = $('btnTahminiHesapla');
    if (btn) btn.addEventListener('click', hesaplaTetikle);
    yeniden();
  });

  // Storage değişimi — site_content.js mirror'layabilir
  window.addEventListener('hesap-tahmini-veri-geldi', yeniden);
})();
