// Shrinks raster images embedded as base64 data-URIs inside SVGs, IN PLACE
// (same filename — no path change). The SVGs display small, so the embedded
// bitmap is downscaled to a sane size and recompressed. Run:
//   node scripts/optimize-embedded-svg.mjs
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['public/admissions/admission.svg', 'public/admissions/deadline.svg'];
const MAX = 700; // px — generous vs the ~245px display box

const kb = (n) => (n / 1024).toFixed(0) + ' KB';

for (const rel of files) {
  const abs = path.join(root, rel);
  const before = statSync(abs).size;
  let svg = readFileSync(abs, 'utf8');

  const re = /data:image\/(png|jpeg|jpg);base64,([A-Za-z0-9+/=]+)/g;
  let m, replaced = 0;
  const edits = [];
  while ((m = re.exec(svg))) {
    const buf = Buffer.from(m[2], 'base64');
    // eslint-disable-next-line no-await-in-loop
    const meta = await sharp(buf).metadata();
    const hasAlpha = !!meta.hasAlpha;
    const pipe = sharp(buf).resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true });
    // Photos without alpha -> JPEG; anything with transparency -> PNG.
    // eslint-disable-next-line no-await-in-loop
    const out = hasAlpha
      ? await pipe.png({ compressionLevel: 9, palette: true, quality: 80 }).toBuffer()
      : await pipe.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    const mime = hasAlpha ? 'image/png' : 'image/jpeg';
    edits.push({ from: m[0], to: `data:${mime};base64,${out.toString('base64')}` });
    replaced++;
  }
  for (const e of edits) svg = svg.replace(e.from, e.to);
  writeFileSync(abs, svg);
  const after = statSync(abs).size;
  console.log(`${rel}: ${kb(before)} -> ${kb(after)}  (${replaced} embedded image(s))`);
}
