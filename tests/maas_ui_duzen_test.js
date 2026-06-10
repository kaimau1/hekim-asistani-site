const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const index = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'index.html'), 'utf8');
const auth = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'auth.js'), 'utf8');
const maasHtml = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'maas-hesaplama.html'), 'utf8');
const maas = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'maas-hesaplama.js'), 'utf8');
const hesapla = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'hesapla.js'), 'utf8');
const css = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'style.css'), 'utf8').replace(/\r\n/g, '\n');
const temmuzZamSelectBaslangic = maasHtml.indexOf('<select name="temmuzZamSenaryosu">');
const temmuzZamSelectHtml = maasHtml.slice(
  temmuzZamSelectBaslangic,
  maasHtml.indexOf('</select>', temmuzZamSelectBaslangic) + '</select>'.length
);

assert(
  maasHtml.includes('<strong id="maasUstVergiDilimi">-</strong>') &&
    maas.includes("const ustVergiDilimi = $('#maasUstVergiDilimi');") &&
    maas.includes("if (ustVergiDilimi) ustVergiDilimi.textContent = vergiDilimiMetni(h.gelirVergisiDetay).replace('Diliminiz: ', '');") &&
    css.includes('.maas-ust-ozet-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));') &&
    css.includes('.maas-ozet-grid {\n  display: grid;\n  grid-template-columns: repeat(4, minmax(0, 1fr));'),
  'Maas net/cari/toplam/vergi kartlari masaustunde ayni satirda dort kolon olmali.'
);

assert(
  maasHtml.includes('Giriş yapınca maaş bilgilerinizi buluta kaydedebilirsiniz.') &&
    css.includes('.maas-kayit-satiri {\n  display: flex;') &&
    css.includes('gap: 8px;\n  margin: 0 0 8px;') &&
    css.includes('padding: 6px 10px;\n  min-height: 42px;') &&
    css.includes('.maas-bilgileri-kaydet {\n  flex: 0 0 auto;') &&
    css.includes('min-height: 30px;\n  padding: 6px 12px;') &&
    css.includes('.maas-kayit-durumu {\n  min-width: 0;') &&
    css.includes('text-overflow: ellipsis;'),
  'Maas bulut kayit satiri kompakt yukseklikte kalmali.'
);

assert(
  css.includes('.maas-kart.maas-hepsi-onemli .maas-tesvik-grid {\n  width: 100%;\n  max-width: 100%;') &&
    css.includes('column-gap: 14px;\n  overflow: hidden;') &&
    css.includes('.maas-kart.maas-hepsi-onemli .maas-tesvik-kolon {\n  min-width: 0;\n  max-width: 100%;\n  overflow: hidden;') &&
    css.includes('grid-template-columns: minmax(72px, 0.75fr) minmax(0, 1.25fr);') &&
    css.includes('overflow-wrap: normal;\n  word-break: normal;') &&
    css.includes('.maas-kart.maas-hepsi-onemli .maas-tesvik-kolon:last-child > label:not(.maas-gizli-alan):not(.maas-hyp-canli-cek) {\n  grid-template-columns: minmax(132px, 1fr) minmax(84px, 0.64fr);') &&
    css.includes('white-space: nowrap;') &&
    css.includes('.maas-kart.maas-hepsi-onemli .maas-tesvik-kolon > label:not(.maas-gizli-alan) > input,\n.maas-kart.maas-hepsi-onemli .maas-tesvik-kolon > label:not(.maas-gizli-alan) > select {\n  min-width: 0;\n  max-width: 100%;\n  box-sizing: border-box;'),
  'Tesvik ve kesintiler kartindaki sag kolon inputlari kart disina tasmamali ve basliklar tek satir kalmali.'
);

assert(
  !index.includes('Standart (3500)') &&
    index.includes('<option value="3500" selected>3500</option>') &&
    index.includes('<option value="dusuk">2400</option>'),
  'HYP/ASC Ã¼st nÃ¼fus kartÄ±nda standart yazÄ±sÄ± kaldÄ±rÄ±lmalÄ±, seÃ§enekler kÄ±sa 3500/2400 gÃ¶rÃ¼nmeli.'
);

assert(
  css.includes('.ust-kartlar-sticky .nufus-kart .kart-etk') &&
    css.includes('font-size: 11px;') &&
    css.includes('min-width: 58px;'),
  'NÃ¼fus kartÄ± etiketi ve seÃ§im alanÄ± dar kartta sÄ±ÄŸacak ÅŸekilde kompakt olmalÄ±.'
);

assert(
  css.includes('#panel-hypv2 .ust-kartlar-sticky { grid-template-columns: 0.42fr 1.31fr 1.05fr 0.624fr; }'),
  'HYP ust kartlarda Basari/Maasa Esas karti genis, KHT karti yaklasik yuzde 15 dar kalmali.'
);

assert(
  css.includes('.site-header {\n  position: relative;\n  z-index: 120;') &&
    css.includes('.auth-kullanici {\n  position: relative;\n  z-index: 130;') &&
    css.includes('.auth-kullanici-drop {') &&
    css.includes('z-index: 140;') &&
    css.includes('.maas-sticky-ust {') &&
    css.includes('z-index: 90 !important;'),
  'Maas sayfasinda profil menusu maas ust ozet barinin altinda kalmamali.'
);

assert(
  css.includes('body.hyp-v2-2sutun .kriter-tablo th[data-kolon="kriter"],') &&
    css.includes('width: 14% !important;') &&
    css.includes('width: 48% !important; max-width: 48% !important;') &&
    css.includes('body.hyp-v2-2sutun .kriter-tablo .kriter-ad {') &&
    css.includes('transform: none;') &&
    css.includes('font-size: 10.7px;'),
  'HYP iki sutun gorunumunde kriter kolonu daralip bosluk hedef kolonuna aktarilmali; uzun kriter adlari okunur kalmali.'
);

assert(
  index.includes('Buluta Kaydet ile yedekleyebilir, Buluttan Çek ile diğer cihazlarınıza alabilirsiniz.') &&
    index.includes('Buluta Kaydet ile yedekleyebilir, Buluttan Çek ile geri alabilirsiniz.') &&
    auth.includes('Buluta Kaydet ile yedekleyebilir, Buluttan Çek ile geri alabilirsiniz.') &&
    auth.includes('Buluta Kaydet ile yedekleyebilir, Buluttan Çek ile diğer cihazlarınıza alabilirsiniz.') &&
    !index.includes('otomatik senkronize olur') &&
    !auth.includes('gÃ¼venle senkronize edilir'),
  'HYP bilgi metni yeni Buluta Kaydet/Buluttan Cek akisini anlatmali; otomatik senkron dili kalmamali.'
);

assert(
  css.includes('#btnHafizaAl,\n#btnHafizaGetir {\n  min-width: 98px;') &&
    css.includes('padding: 4px 8px;') &&
    css.includes('body.hyp-v2-2sutun #btnHafizaAl,\nbody.hyp-v2-2sutun #btnHafizaGetir {\n  min-width: 92px;'),
  'Buluta Kaydet ve Buluttan Cek butonlari ust aksiyon satirinda kompakt kalmali.'
);

assert(
  /<option value="13\.75" selected>/.test(temmuzZamSelectHtml) &&
    !/<option value="0" selected>/.test(temmuzZamSelectHtml) &&
    maas.includes("const KAYIT_SURUM = '2026-06-maas-zam-1375-varsayilan';") &&
    maas.includes("temmuzZamSenaryosuEl.value = '13.75';"),
  'Maas Temmuz zam senaryosu varsayilani %13,75 olmali.'
);

assert(
  !index.includes('HYP verilerini çekmek için eklentimiz ve mobil uygulamamız yakında') &&
    css.includes('.aksiyon-bilgi {\n  display: inline-flex;') &&
    css.includes('flex: 0 0 auto;') &&
    css.includes('max-width: 220px;') &&
    css.includes('white-space: nowrap;') &&
    css.includes('text-overflow: ellipsis;') &&
    css.includes('body.hyp-v2-2sutun .hesap-ust-aksiyon .aksiyon-bilgi {\n  max-width: 190px;'),
  'HYP ust aksiyon bilgi metni kisa ve kompakt kalmali.'
);

assert(
  maasHtml.includes('name="hesabaEsasNufusPuani"') &&
    maasHtml.includes('name="hesabaEsasNufusPuaniTahmini"') &&
    maasHtml.includes('HYP Dahil Hesaba esas') &&
    !maas.includes('hamEl.disabled = manuelPuanAktif;') &&
    !maas.includes('gelmeyenEl.disabled = manuelPuanAktif;') &&
    maas.includes('hypEl.disabled = manuelPuanAktif;') &&
    maas.includes('hypCanliEl.disabled = manuelPuanAktif;'),
  'HYP Dahil Hesaba esas doluyken HYP katsayisi kilitlenmeli; Hesaba esas puaniniz otomatik alan olarak kalmali.'
);

assert(
  maas.includes("ozetKarti('Vergi dilimi', vergiDilimiMetni(h.gelirVergisiDetay).replace('Diliminiz: ', '')") &&
    maas.includes("`Aylık matrah: ${para(h.aylikMatrah)}`"),
  'Hesaplanan maas ozetine vergi dilimi karti eklenmeli.'
);

assert(
  index.includes('id="hypV2HedefSifirla" type="button" class="btn btn-ai-ghost btn-temizle-hedef" title="Sadece hedefleri temizle" aria-label="Hedef temizle"><span aria-hidden="true">↺</span></button>') &&
    index.includes('id="ascHedefSifirla" type="button" class="btn btn-ai-ghost btn-temizle-hedef" title="Sadece hedefleri temizle" aria-label="Hedef temizle"><span aria-hidden="true">↺</span></button>') &&
    css.includes('.btn-profil-temizle,\n.btn-temizle-hedef {\n  width: 34px;') &&
    css.includes('justify-content: center;') &&
    !index.includes('↺ Hedef Temizle') &&
    !index.includes('↺ Hedef Sil'),
  'Hedef temizle butonlari yazisiz simge dugmesine donmeli; aciklama title/aria-label ile korunmali.'
);

const ustAksiyonBaslangic = index.indexOf('<div class="hesap-ust-aksiyon">');
const mobilNufusBaslangic = index.indexOf('<div class="mobil-nufus-kart-alan" id="hypV2MobilNufusAlan"');
const altBilgiBaslangic = index.indexOf('<div class="hyp-alt-bilgi-satir">');
const turBaslangic = index.indexOf('<div class="tur-baslat-sarmal" id="turBaslatSarmal">');
assert(
  turBaslangic > altBilgiBaslangic &&
    !(turBaslangic > ustAksiyonBaslangic && turBaslangic < mobilNufusBaslangic) &&
    css.includes('.hyp-alt-bilgi-satir .tur-baslat-sarmal {') &&
    css.includes('.hyp-alt-bilgi-satir .btn-site-turu {') &&
    css.includes('.hyp-alt-bilgi-satir .tur-turu-kapat {'),
  'Tanitim turu butonu HYP ust aksiyon satirindan alt bilgi satirina tasinmali.'
);

const ustAiHedefBaslangic = index.indexOf('<div class="ust-ai-hedef-grup"');
const gorunumToggleBaslangic = index.indexOf('id="hypV2GoruntuToggle"');
const hedefHeaderBaslangic = index.indexOf('<div class="hedef-ai-header">');
const hedefHesaplaBaslangic = index.indexOf('data-ai-tablo="hypv2"', hedefHeaderBaslangic);
const hedefAyarlaBaslangic = index.indexOf('data-modal-ac="hypV2ProfilModal"', hedefHeaderBaslangic);
const hedefBaslikSatirBaslangic = index.indexOf('<div class="hedef-baslik-satir">');
const hedefBaslikSatirBitis = index.indexOf('</th>', hedefBaslikSatirBaslangic);
assert(
  ustAiHedefBaslangic > ustAksiyonBaslangic &&
    ustAiHedefBaslangic < gorunumToggleBaslangic &&
    index.indexOf('data-modal-ac="hypV2ProfilModal"', ustAiHedefBaslangic) < gorunumToggleBaslangic &&
    hedefHesaplaBaslangic > hedefHeaderBaslangic &&
    index.includes('✨ Hedef Hesapla') &&
    hedefAyarlaBaslangic === -1 &&
    css.includes('.gor-toggle { margin-left: 0; }') &&
    css.includes('.ust-ai-hedef-grup + .gor-toggle') &&
    css.includes('.ust-ai-hedef-grup .ust-ai-hedef-metin') &&
    css.includes('.hesap-ust-aksiyon .ust-ai-hedef-grup {') &&
    css.includes('flex: 0 0 auto;\n  margin-left: auto;\n  min-height: var(--ust-aksiyon-yukseklik);'),
  'AI Hedef etiketi ve Ayarla dugmesi Tek Sutun dugmesinin soluna tasinmali; Hedef Hesapla hedef basliginda kalmali.'
);

assert(
  hedefHeaderBaslangic > hedefBaslikSatirBaslangic &&
    hedefHeaderBaslangic < hedefBaslikSatirBitis &&
    index.indexOf('hedef-surukle-ipucu', hedefBaslikSatirBaslangic) < hedefHeaderBaslangic &&
    index.includes('hedef-kolon-baslik') &&
    index.includes('Hedef &amp; Sonuç') &&
    /body\.hyp-v2-2sutun #hypV2Tablo \.hedef-surukle-ipucu \{\r?\n  display: none;\r?\n\}/.test(css) &&
    css.includes('.hedef-baslik-satir {') &&
    css.includes('flex-direction: column;') &&
    css.includes('.hedef-baslik-ust-satir {\n  display: flex;\n  flex-direction: column;') &&
    css.includes('.hedef-alt-satir {') &&
    css.includes('.hedef-baslik-satir .hedef-kolon-baslik {') &&
    css.includes('justify-content: center;') &&
    css.includes('font-size: 13.2px;') &&
    /width: 100%;\r?\n  min-width: 0;/.test(css) &&
    /body\.hyp-v2-2sutun \.hedef-baslik-satir \.hedef-kolon-baslik \{\r?\n  font-size: 10\.8px;/.test(css),
  'Hedef & Sonuc etiketi ustte, mavi cizgi ipucu alt satirda kalmali.'
);

assert(
  index.includes('<th data-kolon="kriter" class="kriter-tumu-th" aria-label="Kriter">') &&
    !index.includes('<span>Kriter</span>') &&
    index.indexOf('<label class="hyp-ay-secici"', index.indexOf('<th data-kolon="kriter" class="kriter-tumu-th"')) <
      index.indexOf('kriter-tumu-sifirla" data-tumu-tablo="hypv2"') &&
    !(index.indexOf('<label class="hyp-ay-secici"') > ustAksiyonBaslangic &&
      index.indexOf('<label class="hyp-ay-secici"') < mobilNufusBaslangic) &&
    /kriter-tumu-sifirla" data-tumu-tablo="hypv2"[^>]*>[^<]*Temizle<\/button>/.test(index) &&
    css.includes('.kriter-baslik-kapsam {\n  display: flex;\n  flex-direction: column;') &&
    css.includes('justify-content: center;') &&
    css.includes('.kriter-tumu-th .kriter-tumu-sifirla {\n  align-self: center;\n  min-height: 20px;') &&
    css.includes('.kriter-tumu-th .hyp-ay-secici {') &&
    css.includes('max-width: 160px;') &&
    css.includes('body.hyp-v2-2sutun .kriter-tumu-th .hyp-ay-secici {') &&
    css.includes('max-width: 124px;') &&
    !css.includes('.kriter-tumu-th .hyp-ay-secici--ayna') &&
    hesapla.includes("const etiket = el.closest('.hyp-ay-secici');") &&
    hesapla.includes('if (etiket) etiket.remove();') &&
    !hesapla.includes("el.dataset.hypAySeciciKopya = '1';") &&
    !hesapla.includes('select[data-hyp-ay-secici-kopya="1"]') &&
    css.includes('.kolon-sifirla, .kolon-ai {\n  display: inline-flex;') &&
    css.includes('width: 19px;\n  min-width: 19px;\n  height: 19px;') &&
    css.includes('.kolon-baslik {\n  display: flex;') &&
    css.includes('width: 100%;\n  color: var(--text-soluk);') &&
    css.includes('.kolon-sifirla { margin: 0 auto; }'),
  'HYP tablo ust basligi modern ve kompakt kalmali; ay secimi ustte, Temizle altta olmali, gorunen Kriter yazisi kalkmali.'
);

assert(
  css.includes('@media (max-width: 639px) {') &&
    /\.sekme-secici \{\r?\n    display: grid;\r?\n    grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\r?\n    width: 100%;\r?\n    max-width: 100%;\r?\n    overflow: hidden;/.test(css) &&
    css.includes('.hesap-ust-aksiyon {\n    display: grid;\n    grid-template-columns: repeat(2, minmax(0, 1fr));') &&
    css.includes('#btnHafizaAl,\n  #btnHafizaGetir {\n    white-space: normal !important;') &&
    css.includes('#hypV2OncekiAyGereken {\n    grid-column: 1 / -1;\n  }') &&
    css.includes('.hesap-ust-aksiyon .ust-ai-hedef-grup {\n    display: none !important;') &&
    css.includes('.ust-kartlar.ust-kartlar-sticky {\n    grid-template-columns: repeat(2, minmax(0, 1fr));') &&
    css.includes('.ust-kartlar-sticky .ust-kart {\n    min-width: 0;') &&
    css.includes('.kriter-tablo th[data-kolon="sayilan"],\n  .kriter-tablo td[data-kolon="sayilan"] { display: none !important; }') &&
    css.includes('.hedef-surukle-ipucu {\n    max-width: 98px;'),
  'Mobil HYP gorunumunde sekmeler, ust aksiyonlar, kartlar ve hedef ipucu dar ekranda tasmasiz kalmali.'
);

console.log('maas_ui_duzen_test OK');
