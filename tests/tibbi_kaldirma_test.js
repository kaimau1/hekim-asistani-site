const fs = require('fs');
const path = require('path');
const assert = require('assert');

const kok = path.resolve(__dirname, '..');
const hedef = ['tibbi', '-hesaplamalar'].join('');
const medcalc = ['med', 'calc'].join('');
const taranacakUzantilar = new Set(['.html', '.js', '.css']);

assert(!fs.existsSync(path.join(kok, `${hedef}.html`)), 'tibbi hesaplamalar HTML dosyasi silinmeli');
assert(!fs.existsSync(path.join(kok, `${hedef}.js`)), 'tibbi hesaplamalar JS dosyasi silinmeli');

function dosyalariTopla(dizin) {
  return fs.readdirSync(dizin, { withFileTypes: true }).flatMap((girdi) => {
    const tamYol = path.join(dizin, girdi.name);
    if (girdi.isDirectory()) {
      if (girdi.name === 'tests') return [];
      return dosyalariTopla(tamYol);
    }
    return taranacakUzantilar.has(path.extname(girdi.name)) ? [tamYol] : [];
  });
}

for (const dosya of dosyalariTopla(kok)) {
  const icerik = fs.readFileSync(dosya, 'utf8');
  assert(!icerik.includes(hedef), `${path.relative(kok, dosya)} tibbi hesaplamalar referansi icermemeli`);
  assert(!icerik.includes(medcalc), `${path.relative(kok, dosya)} medcalc stili veya kodu icermemeli`);
}

console.log('tibbi_kaldirma_test OK');
