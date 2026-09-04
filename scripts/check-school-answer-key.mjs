#!/usr/bin/env node
/**
 * Audits the school-games answer key against the live schedule.
 *
 * `src/data/schoolGameAnswers.ts` says to run this whenever a set is published,
 * and it did not exist. It does now, because "every game type can be marked" is
 * a claim about live data and the only honest way to hold it is to check.
 *
 * For every date the backend has scheduled, it resolves the day the way the app
 * does — graded route first, ungraded schedule behind it — then fetches that
 * day's pack and asks whether each item can be marked:
 *
 *   quiz / myth_fact   an entry in MCQ_ANSWERS whose option id still exists
 *   flag_guess         a filename in imageUrl matching one of the options
 *   word_guess         an entry in WORD_ANSWERS of the right length and shape
 *   sudoku             always markable: the grid is its own solution
 *
 * Exits non-zero if any scheduled item cannot be marked, so it can gate a
 * release. Usage:  node scripts/check-school-answer-key.mjs [from] [to]
 */

import { readFileSync } from 'node:fs';

const BASE =
  process.env.VITE_API_BASE_URL ??
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .find((line) => line.startsWith('VITE_API_BASE_URL='))
    ?.slice('VITE_API_BASE_URL='.length)
    .trim();

if (!BASE) {
  console.error('No VITE_API_BASE_URL in the environment or .env.');
  process.exit(2);
}

const ROOT = `${BASE}/api/schoolStudent`;

/** The backend sends its "nothing here" envelope under a 500. That is not an error. */
async function get(path) {
  const response = await fetch(`${ROOT}${path}`, { headers: { Accept: 'application/json' } });
  const raw = await response.text();
  let data = null;
  try {
    data = raw.trim() ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`${path}: unparseable response (HTTP ${response.status})`);
  }
  if (data && typeof data === 'object' && data.success === false) return null;
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return data;
}

// ── The key, read straight out of the TypeScript module ──────────────────────
// A tiny parse beats a build step: both tables are plain `key: 'value',` lines.

const source = readFileSync(new URL('../src/data/schoolGameAnswers.ts', import.meta.url), 'utf8');

const tableAfter = (name) => {
  const start = source.indexOf(`export const ${name}`);
  if (start < 0) throw new Error(`${name} not found in schoolGameAnswers.ts`);
  const body = source.slice(source.indexOf('{', start), source.indexOf('\n};', start));
  return Object.fromEntries(
    [...body.matchAll(/^\s*(\w+):\s*'([^']*)'/gm)].map((m) => [m[1], m[2]]),
  );
};

const MCQ_ANSWERS = tableAfter('MCQ_ANSWERS');
const WORD_ANSWERS = tableAfter('WORD_ANSWERS');

// ── Can one item be marked? Mirrors lib/schoolMarking exactly ────────────────

const normalise = (text) => text.trim().toLowerCase().replace(/\s+/g, ' ');

const countryFromImage = (url) => {
  const file = (url ?? '').split('/').pop();
  if (!file) return null;
  return file.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().toLowerCase();
};

function verdict(item) {
  const { gameId, itemId, content = {} } = item;

  if (gameId === 'sudoku') return { ok: true, note: 'grid is its own solution' };

  if (gameId === 'word_guess') {
    const word = WORD_ANSWERS[itemId]?.toUpperCase();
    if (!word) return { ok: false, note: 'no entry in WORD_ANSWERS' };
    const length = content.length ?? word.length;
    if (word.length !== length) {
      return { ok: false, note: `key is ${word.length} letters, item declares ${length}` };
    }
    const pattern = (content.displayPattern ?? '').toUpperCase();
    if (pattern.length === length && ![...pattern].every((ch, i) => ch === '_' || ch === word[i])) {
      return { ok: false, note: `key "${word}" does not fit pattern ${pattern}` };
    }
    return { ok: true, note: word };
  }

  const options = content.options ?? [];

  if (gameId === 'flag_guess') {
    const country = countryFromImage(content.imageUrl);
    const match = options.find((o) => normalise(o.text) === country);
    if (match) return { ok: true, note: `${country} → ${match.id}` };
    if (!MCQ_ANSWERS[itemId]) {
      return { ok: false, note: `"${country}" matches none of: ${options.map((o) => o.text).join(', ')}` };
    }
  }

  const keyed = MCQ_ANSWERS[itemId];
  if (!keyed) return { ok: false, note: 'no entry in MCQ_ANSWERS' };
  if (!options.some((o) => o.id === keyed)) {
    return { ok: false, note: `key "${keyed}" is not an option any more — set was re-authored` };
  }
  return { ok: true, note: keyed };
}

// ── Walk the schedule the way the app resolves it ────────────────────────────

const packFor = (byGrade, grade) => {
  const exact = grade != null ? byGrade?.[String(grade)] : null;
  if (exact) return exact;
  const packs = [
    ...new Map(
      Object.values(byGrade ?? {}).map((e) => [`${e?.setId ?? ''}|${e?.itemId ?? ''}`, e]),
    ).values(),
  ];
  return packs[0] ?? { setId: null, itemId: null };
};

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (from, n) => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

const from = process.argv[2] ?? '2026-09-01';
const to = process.argv[3] ?? addDays(from, 120);

const dates = [];
for (let d = from; d <= to; d = addDays(d, 1)) dates.push(d);

console.log(`Auditing ${from} → ${to} against ${BASE}\n`);

const problems = [];
const byEngine = new Map();
let scheduledDays = 0;

const setCache = new Map();
const loadItems = async (setId) => {
  if (!setCache.has(setId)) {
    setCache.set(setId, get(`/getItemsBySetId?setId=${encodeURIComponent(setId)}`));
  }
  return (await setCache.get(setId)) ?? [];
};

for (const date of dates) {
  const day = await get(`/getTodayGame?date=${date}`);
  if (!day?.gameId) continue;
  scheduledDays += 1;

  const pack = packFor(day.byGrade, null);
  let items = [];
  if (pack.itemId) {
    const one = await get(`/getGameItemById?itemId=${encodeURIComponent(pack.itemId)}`);
    if (one) items = [one];
  } else if (pack.setId) {
    items = await loadItems(pack.setId);
  }

  if (!items.length) {
    problems.push(`${date}  ${day.gameId}: scheduled but no items could be fetched`);
    continue;
  }

  const stats = byEngine.get(day.gameId) ?? { ok: 0, bad: 0 };
  for (const item of items) {
    const result = verdict(item);
    if (result.ok) stats.ok += 1;
    else {
      stats.bad += 1;
      problems.push(`${date}  ${item.itemId} (${day.gameId}): ${result.note}`);
    }
  }
  byEngine.set(day.gameId, stats);
}

console.log(`${scheduledDays} scheduled days\n`);
for (const [gameId, stats] of [...byEngine].sort()) {
  const mark = stats.bad ? '✗' : '✓';
  console.log(`  ${mark} ${gameId.padEnd(12)} ${stats.ok} markable, ${stats.bad} not`);
}

if (problems.length) {
  console.log(`\n${problems.length} item(s) cannot be marked:\n`);
  for (const line of problems) console.log(`  ${line}`);
  process.exit(1);
}

console.log('\nEvery scheduled item can be marked.');
