const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const hesapla = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'hesapla.js'), 'utf8');
const index = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'style.css'), 'utf8').replace(/\r\n/g, '\n');

assert(
  hesapla.includes('function _kriterAdiTikiGuncelle(') &&
    hesapla.includes("tavanUlasildi ? 'Tavana ulaşıldı' : 'Hedefe ulaşıldı'") &&
    hesapla.includes("_kriterAdiTikiGuncelle(container, false, '');"),
  'Kriter adi yanindaki tik _barCiz icinde tavan/hedef durumuna gore guncellenmeli; bos barda kaldirilmali.'
);

assert(
  css.includes('.kriter-ad .kriter-ad-tik {'),
  'Kriter adi tiki icin stil tanimli olmali.'
);

assert(
  css.includes('body.hyp-v2-2sutun .ikinci-tablo .hedef-ai-header--pasif { display: none; }') &&
    css.includes('min-height: 46px;'),
  'Iki sutun modunda klon baslik gizli AI buton alanini rezerve etmemeli; hedef baslik satiri 46px min yukseklikle esitlenmeli.'
);

assert(
  index.includes('style.css?v=') &&
    index.includes('hesapla.js?v=') &&
    !index.includes('style.css?v=20260609') &&
    !index.includes('hesapla.js?v=20260604'),
  'index.html style/hesapla cache bust parametresi tasimali ve bilinen bayat surumlere donmemeli.'
);

console.log('site_kriter_tik_ve_baslik_esit_test OK');
