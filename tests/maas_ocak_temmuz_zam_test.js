const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const oku = (dosya) => fs.readFileSync(path.join(kok, dosya), 'utf8');
const html = oku('maas-hesaplama.html');
const js = oku('maas-hesaplama.js');

assert(html.includes('name="ocakZamSenaryosu"'), 'Maas formunda Ocak zam senaryosu select alani olmali');
assert(html.includes('name="ocakZamOrani"'), 'Maas formunda Ocak elle zam orani inputu olmali');
assert(html.includes('data-elle-zam-alani="ocak"'), 'Ocak elle zam alani ayri gosterilip gizlenmeli');
assert(html.includes('Ocak zam senaryosu'), 'Kullanici Ocak zam senaryosunu net gormeli');
assert(html.includes('<option value="5">%5 toplu sözleşme</option>'), 'Ocak toplu sozlesme secenegi guncel %5 olmali');
assert(html.includes('<option value="7" selected>%7,00 piyasa tahmini</option>'), 'Ocak zam senaryosu varsayilani piyasa tahmini olmali');
assert(html.includes('Temmuz zam senaryosu'), 'Temmuz zam senaryosu korunmali');
assert(html.includes('name="hesapYil"'), 'Hesap yilini secmek icin ayri alan olmali');
assert(html.includes('<option value="2026" selected>2026</option>'), 'Yil secicisinde mevcut yil varsayilan secili olmali');
assert(html.includes('<option value="2027">2027</option>'), 'Yil secicisinde sonraki yil secenegi olmali');

assert(js.includes('function secilenOcakZamOrani'), 'Ocak zam orani ayri hesaplanmali');
assert(js.includes('function hesapDonemiOku'), 'Hesap ayi yil bilgisiyle okunmali');
assert(js.includes('function ocakZamHedefYili'), 'Ocak zammi sonraki yil hedefiyle sinirlanmali');
assert(js.includes('function etkiliZamOrani'), 'Ocak ve Temmuz zammini birlestiren etkili zam fonksiyonu olmali');
assert(js.includes('donem.yil >= ocakZamHedefYili() ? secilenOcakZamOrani(veri) : 0'), 'Ocak zammi mevcut yila uygulanmamali');
assert(js.includes('const temmuzZamAktif = donem.yil > varsayilanHesapYili() || donem.ay >= 7;'), 'Temmuz zammi sonraki yil Ocak hesabina da taban olmali');
assert(js.includes('const temmuzZam = temmuzZamAktif ? secilenTemmuzZamOrani(veri) : 0;'), 'Temmuz zammnin aktiflik durumu ayri okunmali');
assert(js.includes('ocakCarpani * temmuzCarpani - 1'), 'Temmuz sonrasi zam Ocak uzerine Temmuz olarak bilesik uygulanmali');
assert(js.includes("e.target?.name === 'ocakZamOrani'"), 'Ocak elle oran yazilinca senaryo manuel olmali');
assert(js.includes("if (e.target?.name === 'hesapYil') hesapAySecenekleriniHazirla();"), 'Yil secimi degisince ay listesi yeniden kurulmalı');
assert(js.includes("'ocakZamSenaryosu'"), 'Ocak zam senaryosu degisimleri hesap akisini tetiklemeli');
assert(js.includes('2026-06-maas-ocak-piyasa-tahmini'), 'Yerel kayit surumu Ocak piyasa tahmini gecisi icin guncellenmeli');
assert(js.includes("ocakZamSenaryosuEl.value === '10'"), 'Eski varsayilan %10 senaryosu yeni piyasa tahminine tasinmali');
assert(js.includes("ocakZamSenaryosuEl.value = '7'"), 'Ocak varsayilan gecisi %7,00 piyasa tahminini secmeli');
assert(js.includes("ocakZamSenaryosuEl.value === '6'"), 'Eski %6 toplu sozlesme secenegi yeni %5 degerine tasinmali');
assert(js.includes("ocakZamSenaryosuEl.value = '5'"), 'Ocak toplu sozlesme secenegi %5 olarak normalize edilmeli');

console.log('maas_ocak_temmuz_zam_test OK');
