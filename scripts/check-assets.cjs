'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'index.html',
  '404.html',
  'css/fonts.css',
  'css/styles.css',
  'js/main.js'
];

const patterns = {
  html: /(?:src|href)\s*=\s*"([^"]+)"/gi,
  css: /url\(\s*['"]?([^'")]+)['"]?\s*\)/gi,
  js: /fetch\(\s*['"]([^'"]+)['"]/gi
};

function isExternal(ref) {
  return /^(https?:|data:|mailto:|tel:|#)/i.test(ref) || ref.startsWith('//');
}

let checked = 0;
let missing = 0;

for (const file of files) {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) {
    console.error('MISSING source file: ' + file);
    missing++;
    continue;
  }
  const source = fs.readFileSync(abs, 'utf8');
  const ext = path.extname(file).slice(1);
  // url() de CSS se resuelve relativa al archivo CSS; src/href de HTML y
  // fetch() de JS se resuelven relativos al documento (index/404 en la raíz).
  const baseDir = ext === 'css' ? path.dirname(abs) : root;
  const re = patterns[ext] || /(?:src|href)\s*=\s*"([^"]+)"/gi;
  let match;
  while ((match = re.exec(source)) !== null) {
    let ref = match[1].split('?')[0].split('#')[0].trim();
    if (!ref || isExternal(ref)) continue;
    const target = ref.startsWith('/') ? path.join(root, ref.slice(1)) : path.join(baseDir, ref);
    checked++;
    if (!fs.existsSync(target)) {
      console.error(`MISSING ref in ${file}: ${ref} -> ${path.relative(root, target)}`);
      missing++;
    }
  }
}

if (missing > 0) {
  console.error(`\n${missing} referencia(s) local(es) rota(s) sobre ${checked} revisadas.`);
  process.exit(1);
}
console.log(`OK · ${checked} referencias locales verificadas, todas existen.`);