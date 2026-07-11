// Converts referenced raster images (>30KB) in public/ to WebP, then rewrites
// every static reference in src/ from the old extension to .webp.
// SAFETY: originals are kept in place. All local image refs are static strings
// (verified), and WebP has ~universal browser support in 2026, so no <picture>
// fallback is needed — but if any dynamic ref is missed, it still resolves to
// the (already-optimized) original. Excludes social/brand-critical images.
// Run:  node scripts/convert-to-webp.mjs
import sharp from 'sharp';
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(root, 'public');
const SRC = path.join(root, 'src');

// Never convert: og:image + favicon must stay PNG for social/browser compatibility.
const EXCLUDE = new Set(['og-image.png', 'favicon.png']);
const MIN_KB = 30;

function walk(dir, exts, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, out);
    else if (exts.some((x) => p.toLowerCase().endsWith(x))) out.push(p);
  }
  return out;
}

// 1) find + convert candidate rasters
const rasters = walk(PUB, ['.jpg', '.jpeg', '.png']);
const kb = (n) => (n / 1024).toFixed(0) + ' KB';
const mappings = []; // { relOld: 'admissions/pro.jpg', relNew: 'admissions/pro.webp' }
let before = 0, after = 0;

for (const abs of rasters) {
  const rel = path.relative(PUB, abs).split(path.sep).join('/');
  const base = path.basename(rel);
  if (EXCLUDE.has(base)) continue;
  const size = statSync(abs).size;
  if (size / 1024 < MIN_KB) continue;

  const webpAbs = abs.replace(/\.(jpe?g|png)$/i, '.webp');
  const relNew = rel.replace(/\.(jpe?g|png)$/i, '.webp');
  let buf;
  try {
    // eslint-disable-next-line no-await-in-loop
    buf = await sharp(abs).webp({ quality: 80, effort: 5 }).toBuffer();
  } catch (e) {
    console.log(`  skip ${rel}: unreadable image (${e.message.split('\n')[0]})`);
    continue;
  }
  // Only adopt WebP if it's actually smaller than the (already optimized) original.
  if (buf.length >= size) {
    console.log(`  skip ${rel}: webp not smaller (${kb(buf.length)} >= ${kb(size)})`);
    continue;
  }
  writeFileSync(webpAbs, buf);
  mappings.push({ relOld: rel, relNew });
  before += size; after += buf.length;
  console.log(`  ${rel} -> ${path.basename(relNew)}  ${kb(size)} -> ${kb(buf.length)}`);
}

// 2) rewrite references in src/ (.tsx/.ts/.css). Match a path that is preceded by
//    a quote/paren/slash and followed by a quote/paren/query/whitespace so we only
//    hit real asset references, never a mid-string coincidence.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const codeFiles = walk(SRC, ['.tsx', '.ts', '.css']);
let refFilesChanged = 0, refsChanged = 0;

for (const file of codeFiles) {
  let txt = readFileSync(file, 'utf8');
  let n = 0;
  for (const { relOld, relNew } of mappings) {
    const re = new RegExp(`(["'(\\/])${esc(relOld)}(?=["')?\\s])`, 'g');
    txt = txt.replace(re, (_m, pre) => { n++; return pre + relNew; });
  }
  if (n > 0) { writeFileSync(file, txt); refFilesChanged++; refsChanged += n; }
}

console.log(`\nConverted ${mappings.length} images: ${kb(before)} -> ${kb(after)} (saved ${kb(before - after)}).`);
console.log(`Rewrote ${refsChanged} references across ${refFilesChanged} files. Originals kept as fallback.`);
