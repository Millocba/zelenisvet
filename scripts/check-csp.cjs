'use strict';
const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '..', 'index.html');
const src = fs.readFileSync(htmlPath, 'utf8');
const problems = [];

const tagRe = /<[a-zA-Z][^>]*>/g;
let match;
while ((match = tagRe.exec(src)) !== null) {
  const tag = match[0];
  if (/\sstyle\s*=/i.test(tag)) problems.push('atributo style inline: ' + tag);
  if (/\son[a-z]+\s*=/i.test(tag)) problems.push('handler inline: ' + tag);
}

const scriptRe = /<script\b[^>]*>/gi;
while ((match = scriptRe.exec(src)) !== null) {
  if (!/\bsrc\s*=/i.test(match[0])) problems.push('<script> inline sin src: ' + match[0]);
}

if (/<style\b/i.test(src)) problems.push('bloque <style> inline en index.html');
if (/javascript:/i.test(src)) problems.push('URL javascript: detectada');

if (problems.length > 0) {
  for (const p of problems) console.error('CSP violation: ' + p);
  process.exit(1);
}
console.log('OK · sin style/script/handlers inline acordes a la CSP estricta.');