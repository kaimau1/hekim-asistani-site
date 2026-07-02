const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (ad) => fs.readFileSync(path.join(kok, ad), 'utf8');

const index = oku('index.html');
const asc = oku('asc-hesapla.html');
const hesapla = oku('hesapla.js');
const sitemap = oku('sitemap.xml');
const css = oku('style.css');

assert(index.includes('id="panel-asc"'), 'ASÇ paneli ana HYP sayfasinda olmali');
assert(index.indexOf('id="ascTablo"') > index.indexOf('id="hypV2Tablo"'), 'ASÇ tablosu HYP tablosunun altina tasinmali');
assert(!index.includes('href="asc-hesapla.html"'), 'Ana sayfada ayri ASÇ sayfasi linki kalmamali');
assert(!index.includes('id="ascNufusKart"'), 'ASÇ bolumunde ayri gorunur nufus karti olmamali');
assert(!index.includes('class="bolum-baslik asc-bolum-baslik"'), 'ASÇ bolum basligi ve aciklama alani kaldirilmali');
assert(index.includes('id="ascHekimKS"'), 'ASÇ bolumunde Hekim HYP alani korunmali');
assert(index.includes('type="hidden" id="ascHekimKS"'), 'ASÇ Hekim HYP degeri gorunur input olarak yer kaplamamali');
assert(index.includes('class="kart-deger asc-garanti-deger" id="ascGarantiKS"'), 'ASÇ garanti icin gereken deger orta kartta ana deger olarak gosterilmeli');
assert(index.indexOf('id="ascGarantiKS"') > index.indexOf('class="ust-kart asc-gereken-kart"'), 'ASÇ garanti degeri orta kartta yer almali');
assert(!index.includes('id="ascGarantiSatir"'), 'ASÇ garanti degeri katsayi kartinin alt satirinda kalmamali');
assert(!index.includes('Hekim HYP <small'), 'ASÇ ust kartlarinda Hekim HYP degeri tekrar yazilmamali');
assert(!index.includes("hekim HYP'nin"), 'ASÇ aciklama metninde Hekim HYP tekrar yazilmamali');
assert(!hesapla.includes("Hekim HYP'sinin"), 'ASÇ durum satirinda Hekim HYP tekrar yazilmamali');
assert(index.includes('class="kart-alt asc-esik-satir"><span>Gereken</span><b id="ascEsik">'), 'ASÇ orta kartinda gereken esik kisa etiketle alt bilgi olarak kalmali');
assert(index.includes('class="ust-kart asc-durum-kart"'), 'ASÇ durum ozeti ustte ucuncu kart olarak gosterilmeli');
assert(
  index.indexOf('id="ascDurum"') > index.indexOf('id="ascEsik"') &&
    index.indexOf('id="ascDurum"') < index.indexOf('id="ascTablo"'),
  'ASÇ durum alani tablo ustunde ve ust kart grubunun icinde kalmali'
);
assert(
  !index.includes('class="ai-hedef-kart asc-ai-hedef-kart"') &&
    index.includes('<span class="kolon-baslik hedef-kolon-baslik">Hedef &amp; Sonuç</span>') &&
    index.includes('class="hedef-ai-header asc-hedef-ai-header"') &&
    index.includes('data-ai-tablo="asc"') &&
    index.includes('class="kriter-tumu-th asc-kriter-tumu-th"') &&
    index.includes('data-tumu-tablo="asc"') &&
    !index.includes('AI ile ASÇ Hedef Hesapla'),
  'ASÇ AI hedef satiri hedef kolon basligina gomulu olmali; tumunu temizle kriter basliginda kalmali ve aciklama metni kalkmali'
);
assert(!index.includes('Tarama-Takip'), 'ASÇ kriterlerinde alt Tarama-Takip satirlari kaldirilmali');
assert(hesapla.includes("{ ad: 'Yaşlı İzlem',"), 'ASÇ ikinci kriter adi Yashli Izlem olarak guncellenmeli');
assert(
  css.includes('.asc-ust-kartlar .ust-kart') &&
    css.includes('min-height: 0;') &&
    css.includes('grid-template-areas:') &&
    css.includes('white-space: nowrap;'),
  'ASÇ ust kartlari kompakt ozet seridi gibi dusuk yukseklikte olmali'
);
assert(
  css.includes('.asc-ust-kartlar {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));') &&
    css.includes('.asc-gereken-kart .asc-esik-satir span {') &&
    css.includes('text-transform: uppercase;') &&
    css.includes('.asc-durum-kart .asc-durum-strip {') &&
    css.includes('.asc-durum-strip .sart-oz.basarili,') &&
    css.includes('.asc-durum-strip .sart-oz.basarisiz,') &&
    css.includes('.asc-hedef-ai-header {'),
  'ASÇ ust kartlari 3 kolon olmali; durum karti ve hedef kolonundaki AI basligi icin ozel stil tanimi bulunmali'
);

assert(asc.includes('noindex'), 'Eski ASÇ URL arama motorlarina noindex olmali');
assert(asc.includes('url=index.html#hesapla'), 'Eski ASÇ URL ana HYP hesaplama alanina yonlenmeli');
assert(!asc.includes('id="ascTablo"'), 'Eski ASÇ sayfasi artik hesaplama tablosu icermemeli');

assert(!sitemap.includes('asc-hesapla.html'), 'Sitemap ayri ASÇ sayfasini listelememeli');

assert(hesapla.includes('function _ascNufusOku'), 'ASÇ hesaplama ortak HYP nufusunu okuyabilmeli');
assert(hesapla.includes('function _ascNufusTipOku'), 'ASÇ hesaplama ortak HYP nufus tipini okuyabilmeli');
assert(hesapla.includes('const garantiKS = Math.max(1, esikVal ?? 0) + 0.0001;'), 'ASÇ garanti katsayisi iki sarti asacak sekilde hesaplanmali');
assert(hesapla.includes('function ascProfilVarsayilanlariniUygula'), 'ASÇ profil varsayilanlari ayri yardimciyla uygulanmali');
assert(hesapla.includes("vital:    { max: 100, efor: 6, oncelik: 5 }"), 'ASÇ varsayilan profilinde Vital Bulgular Mecbur 5 olmali');
assert(hesapla.includes("cokyonlu: { max: 100, efor: 2, oncelik: ONCELIK_DEFAULT }"), 'ASÇ varsayilan profilinde Yasli Izlem Kolay olmali');

console.log('asc_hyp_birlesik_sayfa_test OK');
