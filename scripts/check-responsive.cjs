'use strict';
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
const problems = [];

const requiredClasses = ['zs-hdr-top', 'zs-hdr-brandtxt', 'zs-hdr-cta', 'zs-hdr-navwrap'];
for (const cls of requiredClasses) {
  if (!src.includes('class="' + cls + '"')) problems.push('falta class ' + cls + ' en el header');
}

const mq = src.match(/@media \(max-width:\s*700px\)\s*\{/);
if (!mq) {
  problems.push('falta @media (max-width:700px)');
} else {
  if (!src.includes('.zs-hdr-top{padding:10px 16px;gap:8px;flex-wrap:wrap}')) {
    problems.push('.zs-hdr-top no usa flex-wrap:wrap en el media query');
  }
}

if (problems.length > 0) {
  for (const p of problems) console.error('Navbar responsive: ' + p);
  process.exit(1);
}
console.log('OK · navbar responsive configurado (clases + media query + wrap).');