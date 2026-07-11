// One-off image optimizer: recompresses large public/ images IN PLACE,
// keeping the same filename + format so no code/CSS references break.
// Originals are recoverable via git. Run: node scripts/optimize-images.mjs
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (f) => path.join(root, 'public', f);

// [file, maxDimension, quality]  — format is inferred from the extension and preserved.
const targets = [
  // Full-bleed backgrounds / hero photos — cap at 1920
  ['admissions/pro.jpg', 1920, 80],
  ['admissions/course.jpg', 1920, 80],
  ['admissions/community.jpg', 1920, 80],
  ['collegeFallback.jpg', 1600, 80],
  ['probuddiesbg.jpg', 1920, 80],
  ['profilebg.jpg', 1920, 80],
  ['discover-imageCounselor2.jpg', 1600, 80],
  ['profile2.jpg', 1400, 80],
  // Guide / people portrait photos — displayed small, cap at 1000
  ['guide_prathmesh.jpg', 1000, 80],
  // PNGs (may carry alpha — palette-quantize, keep PNG)
  ['all maharashtra ranking.png', 1600, 82], // decorative object-cover bg
  ['guide_shiv.png', 1000, 82],
  ['guide_soham.png', 1000, 82],
  ['imageClient.png', 1200, 82],
];

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
let before = 0, after = 0;

for (const [file, maxDim, quality] of targets) {
  const abs = P(file);
  let origSize;
  try { origSize = statSync(abs).size; } catch { console.warn('  skip (missing):', file); continue; }

  const ext = path.extname(file).toLowerCase();
  const img = sharp(abs, { failOn: 'none' }).rotate(); // respect EXIF orientation
  const meta = await img.metadata();
  const pipeline = img.resize({
    width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true,
  });

  let out;
  if (ext === '.jpg' || ext === '.jpeg') {
    out = pipeline.jpeg({ quality, mozjpeg: true, progressive: true });
  } else if (ext === '.png') {
    out = pipeline.png({ compressionLevel: 9, palette: true, quality, effort: 8 });
  } else {
    console.warn('  skip (unsupported ext):', file); continue;
  }

  const buf = await out.toBuffer();
  // Only write if we actually saved space.
  if (buf.length < origSize) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(abs, buf);
    before += origSize; after += buf.length;
    console.log(`  ${file}: ${kb(origSize)} -> ${kb(buf.length)}  (${meta.width}x${meta.height})`);
  } else {
    console.log(`  ${file}: kept original (${kb(origSize)}, recompress was larger)`);
  }
}

console.log(`\nTotal: ${kb(before)} -> ${kb(after)}  (saved ${kb(before - after)}, ${((1 - after / before) * 100).toFixed(0)}%)`);
