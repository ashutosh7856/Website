// Codemod: add loading="lazy" decoding="async" to every <img> that lacks a
// loading= attribute. Skips the home hero (Admissions.tsx) so LCP isn't delayed.
// Adds NOTHING to paths/src — purely additive attributes. Run:
//   node scripts/add-lazy-loading.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
// Files whose above-the-fold hero images must stay eager for LCP.
const EXCLUDE = new Set([path.resolve(root, 'pages/Revamp/Admissions.tsx')]);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.tsx')) out.push(p);
  }
  return out;
}

let filesChanged = 0, imgsChanged = 0;
for (const file of walk(root)) {
  if (EXCLUDE.has(file)) continue;
  const src = readFileSync(file, 'utf8');
  let n = 0;
  // Match a full <img ...> tag (attrs may span lines; no nested '>' expected).
  const out = src.replace(/<img\b([^>]*?)(\/?)>/g, (full, attrs, selfClose) => {
    if (/\bloading\s*=/.test(attrs)) return full; // already set — leave it
    n++;
    return `<img loading="lazy" decoding="async"${attrs}${selfClose}>`;
  });
  if (n > 0) { writeFileSync(file, out); filesChanged++; imgsChanged += n; }
}
console.log(`Added lazy loading to ${imgsChanged} <img> tags across ${filesChanged} files.`);
