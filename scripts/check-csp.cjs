'use strict';
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const ht = fs.readFileSync(path.join(dir, '.htaccess'), 'utf8');
const m = ht.match(/Header\s+(?:always\s+)?set\s+Content-Security-Policy\s+"([^"]+)"/i);
if (!m) {
  console.error('CSP no declarada en .htaccess');
  process.exit(1);
}
const csp = m[1];

const required = [
  ['default-src', "'self'"],
  ['script-src', "'self'"],
  ['script-src', "'unsafe-inline'"],
  ['script-src', "'unsafe-eval'"],
  ['script-src', 'https://unpkg.com'],
  ['style-src', "'self'"],
  ['style-src', "'unsafe-inline'"],
  ['style-src', 'https://fonts.googleapis.com'],
  ['font-src', 'https://fonts.gstatic.com'],
  ['img-src', "'self'"],
  ['frame-src', 'https://www.google.com'],
  ['form-action', "'self'"]
];

const dirs = {};
for (const part of csp.split(';')) {
  const t = part.trim().split(/\s+/);
  const name = t.shift();
  if (name) dirs[name] = dirs[name] ? dirs[name].concat(t) : t;
}

const missing = [];
for (const [d, tok] of required) {
  if (!(dirs[d] || []).includes(tok)) missing.push(d + ' -> ' + tok);
}

if (missing.length > 0) {
  for (const x of missing) console.error('Falta en CSP: ' + x);
  process.exit(1);
}
console.log('OK · .htaccess expone permisos compatibles con el mockup (script/style inline, unpkg, fuentes, maps).');