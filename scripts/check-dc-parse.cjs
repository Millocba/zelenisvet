'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const m = src.match(/<script[^>]*data-dc-script[^>]*>([\s\S]*?)<\/script>/i);
if (!m) {
  console.error('data-dc-script no encontrado');
  process.exit(1);
}
try {
  new Function(m[1]);
} catch (e) {
  console.error('Error de sintaxis en data-dc-script: ' + e.message);
  process.exit(1);
}
console.log('OK · data-dc-script parsea correctamente.');