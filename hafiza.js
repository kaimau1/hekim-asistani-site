// hafiza.js — "Hafızaya Al" ve "Geri Getir" butonları
// Kullanıcı mevcut kriter değerlerini tek tuşla yedekleyip senaryo denemeleri
// sonrası eski değerlere dönebilir. Tek hafıza slotu — hem HYP v2 hem ASÇ
// aynı anda yedeklenir (localStorage.hesap_verileri_v1'in kopyası).

(function () {
  const LS_KEY = 'hesap_verileri_v1';
  const HAFIZA_KEY = 'hesap_hafiza_v1';
  const HAFIZA_TS_KEY = 'hesap_hafiza_ts_v1';

  function aktifKey() {
    try { return window.hesapLocalAktifKey?.() || LS_KEY; } catch (_) { return LS_KEY; }
  }
  function hafizaKey() {
    return HAFIZA_KEY + ':' + aktifKey();
  }
  function hafizaTsKey() {
    return HAFIZA_TS_KEY + ':' + aktifKey();
  }

  function toast(msg, tip) {
    if (typeof window.siteToast === 'function') window.siteToast(msg, tip);
    else console.log('[hafiza]', msg);
  }

  function hafizadaVarMi() {
    return !!localStorage.getItem(hafizaKey());
  }

  function hafizaZamaniOku() {
    return localStorage.getItem(hafizaTsKey()) || '';
  }

  function hafizayaAl() {
    const raw = localStorage.getItem(aktifKey());
    if (!raw) {
      toast('⚠ Kaydedilecek değer yok — önce kriterleri gir', 'uyari');
      return;
    }
    try {
      localStorage.setItem(hafizaKey(), raw);
      const ts = new Date();
      const tsStr = ts.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem(hafizaTsKey(), tsStr);
      butonDurumGuncelle();
      toast('💾 Değerler hafızaya alındı (' + tsStr + ')', 'ok');
    } catch (e) {
      toast('⚠ Hafızaya alınamadı: ' + (e?.message || 'hata'), 'uyari');
    }
  }

  function geriGetir() {
    const raw = localStorage.getItem(hafizaKey());
    if (!raw) {
      toast('⚠ Hafıza boş — önce "Hafızaya Al" butonuna bas', 'uyari');
      return;
    }
    try {
      localStorage.setItem(aktifKey(), raw);
      localStorage.setItem(LS_KEY, raw);
      // 1) Inputları yeniden yükle + tablo hesapla (hesapla.js handler)
      window.dispatchEvent(new CustomEvent('hesap-eklenti-veri-geldi'));
      // 2) Eklenti (chrome.storage.local.hypAyarlar) senkronu için detail'siz
      //    event — site_content.js echo'lamıyor, yazEklentiye tetikleniyor
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('hesap-verisi-degisti'));
      }, 30);
      const ts = hafizaZamaniOku();
      toast('↩ Hafızadaki değerler geri yüklendi' + (ts ? ' (' + ts + ')' : ''), 'ok');
    } catch (e) {
      toast('⚠ Geri getirilemedi: ' + (e?.message || 'hata'), 'uyari');
    }
  }

  function butonDurumGuncelle() {
    const btnGeri = document.getElementById('btnHafizaGetir');
    if (!btnGeri) return;
    const var_ = hafizadaVarMi();
    btnGeri.disabled = !var_;
    btnGeri.style.opacity = var_ ? '1' : '.5';
    if (var_) {
      const ts = hafizaZamaniOku();
      btnGeri.title = 'Hafızada kayıtlı değerleri geri yükle' + (ts ? ' (' + ts + ')' : '');
    } else {
      btnGeri.title = 'Hafıza boş — önce "Hafızaya Al" ile değerleri kaydet';
    }
  }

  function baglantiKur() {
    const btnAl = document.getElementById('btnHafizaAl');
    const btnGeri = document.getElementById('btnHafizaGetir');
    if (btnAl) btnAl.addEventListener('click', hafizayaAl);
    if (btnGeri) btnGeri.addEventListener('click', geriGetir);
    butonDurumGuncelle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', baglantiKur, { once: true });
  } else {
    baglantiKur();
  }

  // Dışarıdan erişim (opsiyonel, tanı için)
  window.hesapHafiza = { al: hafizayaAl, getir: geriGetir, var: hafizadaVarMi };
})();
