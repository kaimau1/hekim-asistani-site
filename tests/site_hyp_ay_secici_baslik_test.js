const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const hesapla = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'hesapla.js'), 'utf8');
const index = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'style.css'), 'utf8').replace(/\r\n/g, '\n');

const hedefBaslikSatirBaslangic = index.indexOf('<div class="hedef-baslik-satir">');
const hedefAltSatirBaslangic = index.indexOf('<div class="hedef-alt-satir">', hedefBaslikSatirBaslangic);
const ipucuBaslangic = index.indexOf('hedef-surukle-ipucu', hedefBaslikSatirBaslangic);

assert(
  hesapla.includes('const _HESAP_AY_SECICI_LIMIT = 3;') &&
    hesapla.includes('const _HESAP_AY_LIMIT = 6;') &&
    hesapla.includes('function _sonAyAnahtarlari(') &&
    !hesapla.includes('function _sonAltiAyAnahtarlari(') &&
    hesapla.includes('const anahtarlar = new Set(_sonAyAnahtarlari(_ayAnahtari()));') &&
    hesapla.includes('.slice(0, _HESAP_AY_SECICI_LIMIT)'),
  'HYP ay secici son 3 ayi gostermeli; arsiv budama limiti 6 ay olarak korunmali.'
);

assert(
  hesapla.includes("return `${HESAP_AY_ADLARI[ay - 1] || ay}`;") &&
    !hesapla.includes("return `${HESAP_AY_ADLARI[ay - 1] || ay} ${yil}`;"),
  'HYP ay secicide Haziran 2026 yerine yalniz Haziran gibi kisa ay adi gorunmeli.'
);

assert(
  hesapla.includes("const _LS_HESAP_AY_UYARI_KAPALI_KEY = 'ahek-hyp-ay-degisti-uyari-kapali-v1';") &&
    hesapla.includes('const _HESAP_AY_UYARI_GUN_LIMIT = 5;') &&
    hesapla.includes('function _ayDegisimIlkGunlerindeMi(') &&
    hesapla.includes('gun >= 1 && gun <= _HESAP_AY_UYARI_GUN_LIMIT') &&
    hesapla.includes('_aktifHesapAy === oncekiAy') &&
    hesapla.includes('!_ayDegistiUyarisiKapaliMi(buAy)') &&
    hesapla.includes("document.getElementById('hypV2YeniAyUyariKapat')?.addEventListener('click', _ayDegistiUyarisiKapat);"),
  'HYP ay degisti uyarisi ilk 5 gun, onceki ay aciksa gorunmeli ve kapatilabilir olmali.'
);

assert(
  index.includes('<div class="hyp-yeni-ay-uyari" id="hypV2YeniAyUyari" hidden>') &&
    index.includes('id="hypV2YeniAyUyariKapat"') &&
    index.indexOf('id="hypV2YeniAyUyari"') < index.indexOf('id="ssOkuAc"'),
  'HYP ay degisti uyarisi bulut kayit satirinda, kapatma dugmesiyle yer almali.'
);

assert(
  css.includes('.hyp-ay-secici.hyp-ay-degisti-vurgu') &&
    css.includes('@keyframes hyp-ay-secici-yanip-son') &&
    css.includes('.hyp-yeni-ay-kapat') &&
    css.includes('.hyp-yeni-ay-uyari {\n  flex: 1 1 330px;'),
  'HYP aktif ay secici ilk 5 gun vurgulanmali ve uyarisi ust satira sigacak kompakt stilde olmali.'
);

assert(!/@keyframes hyp-ay-secici-yanip-son\s*\{[^}]*(transform|box-shadow|filter|width|height|margin|left|top)/.test(css),
  'HYP aktif ay yanip sonme animasyonu yalniz opacity kullanmali.');

assert(
  ipucuBaslangic > hedefBaslikSatirBaslangic &&
    ipucuBaslangic < hedefAltSatirBaslangic &&
    css.includes('.hedef-baslik-ust-satir {\n  display: flex;') &&
    css.includes('flex-direction: column;') &&
    css.includes('.hedef-baslik-ust-satir .hedef-surukle-ipucu {') &&
    css.includes('align-self: center;') &&
    css.includes('body.hyp-v2-2sutun .hedef-baslik-ust-satir .hedef-surukle-ipucu {'),
  'Mavi cizgiyi surukle ipucu Hedef & Sonuc yazisinin alt satirinda gorunmeli.'
);

assert(
  css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="kriter"],\nbody.hyp-v2-2sutun .kriter-tablo td[data-kolon="kriter"] { width: 14% !important; }') &&
    css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="sayilan"],\nbody.hyp-v2-2sutun .kriter-tablo td[data-kolon="sayilan"] { width: 5% !important; }') &&
    css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="hedef"],\nbody.hyp-v2-2sutun .kriter-tablo td[data-kolon="hedef"] { width: 48% !important; max-width: 48% !important; }') &&
    css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="g"],\nbody.hyp-v2-2sutun .kriter-tablo td[data-kolon="g"] { width: 11% !important; }') &&
    css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="y"],\nbody.hyp-v2-2sutun .kriter-tablo td[data-kolon="y"] { width: 11% !important; }') &&
    css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="d"],\nbody.hyp-v2-2sutun .kriter-tablo td[data-kolon="d"] { width: 11% !important; }'),
  'Iki sutunda kriter 14, dar sayilan kolonu 5, hedef 48 olmali; G/Y/D kolonlari ayni kalmali.'
);

console.log('site_hyp_ay_secici_baslik_test OK');
