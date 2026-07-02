const assert = require('assert');
const fs = require('fs');
const path = require('path');

const kok = path.resolve(__dirname, '..', '..');
const maas = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'maas-hesaplama.js'), 'utf8');
const html = fs.readFileSync(path.join(kok, 'ahek-plus-web', 'maas-hesaplama.html'), 'utf8');

assert(
  maas.includes("const dusukTavanliBirimMi = (tip) => tip === 'dusuk' || tip === 'entegre';") &&
    maas.includes("if (tip === 'sifir') return 1;") &&
    maas.includes('const dusukTip = dusukTavanliBirimMi(tip);'),
  'Entegre birim HYP/Tarama-Takip tavanı düşük nüfus gibi 2400/nüfus hesaplanmalı; 0 nüfus tavanı 1 olmalı.'
);

assert(
  html.includes('name="entegreTutulmayanNobet"') &&
    html.includes('data-entegre-nobet-alani="1"') &&
    maas.includes('function entegreNobetAlaniGorunumunuUygula()') &&
    maas.includes("const entegre = String(birimTipiEl.value || '') === 'entegre';") &&
    maas.includes("if (!entegre) entegreNobetEl.value = '0';"),
  'Entegre tutulmayan nöbet alanı sadece entegre birimde görünür ve diğer birimlerde sıfırlanır.'
);

assert(
  maas.includes('function entegreTutulmayanNobetUygula(veri, maasaEsasPuan)') &&
    maas.includes('const carpan = Math.pow(0.92, saat / 8);') &&
    maas.includes('maasaEsasPuan: Math.max(1000, maasaEsasPuan * carpan)') &&
    maas.includes('entegreNobet,'),
  'Entegre tutulmayan nöbet, her 8 saat için hesaba esas puanı 0,92 ile çarpmalı ve 1000 puan altına indirmemeli.'
);

const tavan = 67718.06;
const fazlaPuanOrani = 0.000522;
const ilkOdeme = tavan * 0.785;
const puanSaat48 = Math.max(1000, 2200 * Math.pow(0.92, 6));
const temelSaat48 = ilkOdeme + Math.max(0, puanSaat48 - 1000) * tavan * fazlaPuanOrani;

assert(Math.abs(puanSaat48 - 1333.98) < 0.01, 'DİYAHED 48 saat entegre referansı hesaba esas puan 1333,98 olmalı.');
assert(Math.abs(temelSaat48 - 64964.51) < 0.03, 'DİYAHED 48 saat entegre referansı temel ücret 64.964,51 TL olmalı.');

console.log('maas_birim_tipi_kurallari_test OK');
