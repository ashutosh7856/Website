// Build-time MBA / CAT snapshot generator.
//
// Why this exists
// ---------------
// The public MBA pages (/mba-admission-2027, /mba-colleges/..., /mba-entrance-exams/...,
// /cat-college-predictor and the rest of docs/MBA-SEO-BLUEPRINT.md) are prerendered
// by react-snap, which blocks every API call at build time. A page that read its
// numbers from the API would therefore ship its empty state to crawlers. Those
// pages render from this snapshot instead.
//
// The source of truth is the official data kept in procounsel-neet-api:
//   ../procounsel-neet-api/data/mba/cat_exam.json            (required)
//   ../procounsel-neet-api/data/mba/programs/<slug>.json     (required; the IIMs)
//   ../procounsel-neet-api/data/mba/colleges/<slug>.json     (optional; other institutes)
//   ../procounsel-neet-api/data/mba/exams/<id>.json          (optional; XAT, SNAP, ...)
//   ../procounsel-neet-api/data/mba/cat-cutoffs/<slug>.json  (optional; published CAT cut-offs)
//   ../procounsel-neet-api/data/mba/nirf-management.json     (optional; NIRF Management ranking)
//   ../procounsel-neet-api/data/mba/specialisations.json     (optional; which institutes offer which
//                                                             specialisation, each with an official source)
// (override the directory with MBA_DATA_DIR). Every figure in those files carries
// an official source. Each source also has a verbatim `quote` kept for audit;
// quotes are stripped here and never shipped to the browser.
//
// The optional folders are validated one entity at a time: a college, exam or
// cut-off file that is incomplete or has a figure without an official source is
// left out (with a warning) rather than failing the whole snapshot, so research
// that is still in progress never blocks a build and never ships unverified.
//
// Writes:
//   1. src/data/mbaSnapshot.ts  — the bundled data the public pages render.
//   2. scripts/mba-routes.json  — every MBA URL the snapshot can render, from
//                                 src/lib/mbaRoutes.mjs; read by
//                                 scripts/site-routes.mjs (prerender + sitemap).
//
// Resilience mirrors generate-content-snapshot.mjs: never fail the build, and
// never overwrite a good committed snapshot with an empty or invalid one. When
// the data directory is missing (e.g. a CI checkout of this repo alone) the
// committed snapshot is kept as is.

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { MBA_EXAMS, citySlugFor, mbaPublishedRoutes, specialisationSlugFor } from "../src/lib/mbaRoutes.mjs";

const ROOT = process.cwd();
const DEFAULT_DATA_DIR = path.resolve(ROOT, "../procounsel-neet-api/data/mba");
const TS_PATH = path.resolve(ROOT, "src/data/mbaSnapshot.ts");
const ROUTES_PATH = path.resolve(ROOT, "scripts/mba-routes.json");
const CAP_PATH = path.resolve(ROOT, "src/data/mahCapCutoffs.ts");

// Same wording as the API's dataFreshness.note (procounsel-neet-api api/mba/programs.py).
export const FRESHNESS_NOTE =
  "Official data retrieved on the date shown. Thresholds are minimum shortlisting criteria from " +
  "each IIM's admission policy for the batch shown.";

const CATEGORIES = new Set(["General", "EWS", "NC-OBC", "SC", "ST"]);
const GENDERS = new Set(["Male", "Female", "Transgender"]);

/** Remove every `quote` key, at any depth. Returns a new value. */
export function stripQuotes(value) {
  if (Array.isArray(value)) return value.map(stripQuotes);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, inner] of Object.entries(value)) {
      if (key === "quote") continue;
      out[key] = stripQuotes(inner);
    }
    return out;
  }
  return value;
}

const numOrNull = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const strOrNull = (v) => (typeof v === "string" && v.trim() ? v : null);

function officialSource(src, where) {
  if (src === null || src === undefined) return null;
  if (typeof src !== "object") throw new Error(`${where}: source is not an object`);
  if (src.kind !== "official") throw new Error(`${where}: source kind must be "official"`);
  if (!strOrNull(src.title) || !strOrNull(src.url)) throw new Error(`${where}: source needs a title and url`);
  if (!/^https?:\/\//.test(src.url)) throw new Error(`${where}: source url is not http(s)`);
  return {
    kind: "official",
    title: src.title,
    url: src.url,
    year: numOrNull(src.year),
    retrievedAt: strOrNull(src.retrievedAt) ?? "",
  };
}

function sourcesOf(inst) {
  const out = [];
  for (const p of inst.programs) {
    for (const s of [p.feeSource, p.intakeSource, p.salarySource]) if (s) out.push(s);
  }
  for (const c of inst.cutoffs) out.push(c.source);
  return out;
}

function freshness(institutes) {
  const dates = institutes.flatMap((i) => sourcesOf(i).map((s) => s.retrievedAt)).filter(Boolean).sort();
  const batches = [...new Set(institutes.flatMap((i) => i.cutoffs.map((c) => c.policyBatch)))].sort();
  return { retrievedAt: dates.length ? dates[dates.length - 1] : null, cutoffPolicyBatches: batches, note: FRESHNESS_NOTE };
}

/**
 * One programmes file → the contract's `InstituteDetail` (what GET /programs/{slug}
 * returns): programme code resolved on every cutoff, distinct sources listed,
 * per-institute freshness. Throws on anything the API would reject.
 */
export function buildInstitute(raw, expectedSlug) {
  const data = stripQuotes(raw);
  const where = expectedSlug ?? data?.slug ?? "?";
  if (!data || typeof data !== "object") throw new Error(`${where}: not an object`);
  if (expectedSlug && data.slug !== expectedSlug) throw new Error(`${where}: slug "${data.slug}" does not match the file name`);
  for (const key of ["slug", "name", "shortName"]) {
    if (!strOrNull(data[key])) throw new Error(`${where}: missing ${key}`);
  }
  if (!Array.isArray(data.programs) || !Array.isArray(data.cutoffs)) throw new Error(`${where}: programs/cutoffs must be arrays`);

  const programs = data.programs.map((p, i) => {
    if (!strOrNull(p.code) || !strOrNull(p.name)) throw new Error(`${where}: programme ${i} needs code and name`);
    return {
      code: p.code,
      name: p.name,
      durationYears: numOrNull(p.durationYears),
      feeTotal: numOrNull(p.feeTotal),
      intake: numOrNull(p.intake),
      medianSalary: numOrNull(p.medianSalary),
      medianSalaryYear: numOrNull(p.medianSalaryYear),
      feeNote: strOrNull(p.feeNote),
      feeSource: officialSource(p.feeSource, `${where} ${p.code} fee`),
      intakeNote: strOrNull(p.intakeNote),
      intakeSource: officialSource(p.intakeSource, `${where} ${p.code} intake`),
      salaryNote: strOrNull(p.salaryNote),
      salarySource: officialSource(p.salarySource, `${where} ${p.code} salary`),
    };
  });
  const flagship = programs[0]?.code ?? null;

  const cutoffs = data.cutoffs.map((c, i) => {
    const at = `${where} cutoff ${i}`;
    if (!CATEGORIES.has(c.category)) throw new Error(`${at}: unknown category ${c.category}`);
    if (c.gender !== null && c.gender !== undefined && !GENDERS.has(c.gender)) throw new Error(`${at}: unknown gender ${c.gender}`);
    if (!strOrNull(c.policyBatch)) throw new Error(`${at}: missing policyBatch`);
    const source = officialSource(c.source, at);
    if (!source) throw new Error(`${at}: missing source`);
    return {
      policyBatch: c.policyBatch,
      stage: "shortlisting",
      programCode: c.programCode ?? flagship,
      category: c.category,
      pwd: c.pwd === true,
      gender: c.gender ?? null,
      overall: numOrNull(c.overall),
      varc: numOrNull(c.varc),
      dilr: numOrNull(c.dilr),
      qa: numOrNull(c.qa),
      notes: strOrNull(c.notes),
      source,
    };
  });

  const base = {
    slug: data.slug,
    name: data.name,
    shortName: data.shortName,
    city: strOrNull(data.city),
    state: strOrNull(data.state),
    website: strOrNull(data.website),
    programs,
    cutoffs,
  };
  const seen = new Map();
  for (const s of sourcesOf(base)) {
    const key = `${s.url}\u0000${s.title}`;
    if (!seen.has(key)) seen.set(key, s);
  }
  return {
    slug: base.slug,
    name: base.name,
    shortName: base.shortName,
    city: base.city,
    state: base.state,
    website: base.website,
    programs,
    hasCutoffs: cutoffs.length > 0,
    dataFreshness: freshness([base]),
    cutoffs,
    cutoffNotes: strOrNull(data.cutoffNotes),
    sources: [...seen.values()],
  };
}

/** cat_exam.json → the contract's `Exam`, quotes stripped, sources validated. */
export function buildExam(raw) {
  const data = stripQuotes(raw);
  if (!data || data.id !== "cat" || !Array.isArray(data.versions) || data.versions.length === 0) {
    throw new Error("cat_exam.json: expected { id: 'cat', versions: [...] }");
  }
  return {
    id: "cat",
    name: data.name,
    conductingBody: data.conductingBody,
    officialUrl: data.officialUrl,
    versions: [...data.versions]
      .sort((a, b) => b.year - a.year)
      .map((v) => ({
        year: v.year,
        sections: v.sections.map((s) => ({
          id: s.id,
          name: s.name,
          questionCount: numOrNull(s.questionCount),
          durationMinutes: s.durationMinutes,
        })),
        marking: v.marking.map((m) => ({ type: m.type, correct: m.correct, incorrect: m.incorrect, unanswered: m.unanswered })),
        totalDurationMinutes: v.totalDurationMinutes,
        sectionOrderLocked: v.sectionOrderLocked === true,
        source: officialSource(v.source, `cat_exam ${v.year}`),
      })),
  };
}

// ── Optional folders: colleges/, exams/, cat-cutoffs/, nirf-management.json ──
//
// These are written by research passes that may still be in progress, so each
// entity is validated on its own and skipped (with a warning) when it is not
// complete. The rule is the same as for programs/: every figure that reaches a
// page carries an official source with an http(s) URL.

/**
 * A source from the optional folders. `kind` may be omitted (NIRF and exam
 * bodies' own pages are official by definition) but, when present, must be
 * "official": a coaching or aggregator source never reaches a page.
 */
function looseSource(src, where) {
  if (src === null || src === undefined) return null;
  if (typeof src !== "object") throw new Error(`${where}: source is not an object`);
  if (src.kind !== undefined && src.kind !== "official") throw new Error(`${where}: source kind must be "official"`);
  if (!strOrNull(src.title) || !strOrNull(src.url)) throw new Error(`${where}: source needs a title and url`);
  if (!/^https?:\/\//.test(src.url)) throw new Error(`${where}: source url is not http(s)`);
  return { kind: "official", title: src.title, url: src.url, year: numOrNull(src.year), retrievedAt: strOrNull(src.retrievedAt) ?? "" };
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return String(url);
  }
}

const EXAM_IDS = new Set(MBA_EXAMS.map((e) => e.id));
/** "CAT", "MAH-CET", "MAH MBA/MMS CET" → the MBA_EXAMS ids. */
export function examIdFor(value) {
  const n = String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!n) return null;
  if (EXAM_IDS.has(n)) return n;
  if (n.startsWith("mah") || n.includes("mms-cet") || n === "maharashtra-cet") return "mah-mba-cet";
  if (n.startsWith("nmat")) return "nmat";
  if (n.startsWith("gmat")) return "gmat";
  if (n.startsWith("snap")) return "snap";
  if (n.startsWith("xat")) return "xat";
  if (n.startsWith("cmat")) return "cmat";
  if (n.startsWith("cat")) return "cat";
  if (n === "mat" || n.startsWith("mat-")) return "mat";
  return null;
}

const textOf = (v) => (typeof v === "string" ? v : v && typeof v === "object" ? (v.name ?? v.title ?? v.id ?? v.exam) : null);

/** Labelled facts ({label, value, note?, source}) — every one must be sourced. */
function buildFacts(list, fallbackSource, where) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const [i, f] of list.entries()) {
    if (!f || !strOrNull(f.label)) continue;
    const value = typeof f.value === "number" ? String(f.value) : strOrNull(f.value);
    if (!value) continue;
    const source = looseSource(f.source, `${where} fact ${i}`) ?? fallbackSource;
    if (!source) throw new Error(`${where}: fact "${f.label}" has no source`);
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(String(f.iso ?? "")) ? f.iso : null;
    out.push({ label: f.label, value, note: strOrNull(f.note), tentative: f.tentative === true, source, ...(iso ? { iso } : {}) });
  }
  return out;
}

function dedupeSources(list) {
  const seen = new Map();
  for (const s of list) if (s && !seen.has(`${s.url}\u0000${s.title}`)) seen.set(`${s.url}\u0000${s.title}`, s);
  return [...seen.values()];
}

/** "PGDM-HRM" from "Post Graduate Diploma in Management - Human Resource Management (PGDM-HRM)". */
function programmeCode(name, i) {
  const paren = /\(([A-Z][A-Za-z0-9&+\- ]{1,24})\)\s*$/.exec(name);
  if (paren && !/full|part|time/i.test(paren[1])) return paren[1].trim().replace(/\s+/g, "-");
  const head = /^(MBA|PGDM|PGP|PGPM|MMS|PGDBA)\b/.exec(name);
  return head ? head[1] : `P${i + 1}`;
}

/** "2024-26 batch final placements" → 2026; "Class of 2026" → 2026. */
function graduatingYear(label) {
  const text = String(label ?? "");
  const range = /(20\d{2})\s*[-–]\s*(\d{2,4})/.exec(text);
  if (range) return range[2].length === 2 ? Number(`20${range[2]}`) : Number(range[2]);
  const year = /(20\d{2})/.exec(text);
  return year ? Number(year[1]) : null;
}

/**
 * The research passes write colleges/ in a flatter shape than programs/:
 * sources are URLs keyed by what they support (`sources.fee`), titled once in a
 * top-level `sources` list; cut-offs are `officialCutoffs` with a `sectional`
 * map; dates are `keyDates`. This converts that shape to the programs/ one so
 * a single validator applies to every institute. Returns the input unchanged
 * when it is already in the programs/ shape.
 */
export function adaptResearchCollege(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.programs)) return data;
  const isResearch =
    Array.isArray(data.officialCutoffs) ||
    data.keyDates !== undefined ||
    data.programs.some((p) => p && typeof p.sources === "object" && !Array.isArray(p.sources));
  if (!isResearch) return data;

  const titled = new Map(
    (Array.isArray(data.sources) ? data.sources : [])
      .filter((s) => s && strOrNull(s.url))
      .map((s) => [s.url, s]),
  );
  const src = (url, year = null) => {
    if (!strOrNull(url)) return null;
    const known = titled.get(url);
    let host = url;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      /* not a URL; looseSource rejects it below */
    }
    return {
      kind: "official",
      title: strOrNull(known?.title) ?? `${data.shortName ?? data.name} official document (${host})`,
      url,
      year: numOrNull(year),
      retrievedAt: strOrNull(known?.retrievedAt) ?? "",
    };
  };

  const programs = data.programs.map((p, i) => {
    const s = p.sources && typeof p.sources === "object" ? p.sources : {};
    const feeYear = graduatingYear(p.feeYear) ? Number(String(p.feeYear).slice(0, 4)) : null;
    return {
      code: strOrNull(p.code) ?? programmeCode(String(p.name ?? ""), i),
      name: p.name,
      durationYears: p.durationYears,
      feeTotal: p.feeTotal,
      feeNote: [strOrNull(p.feeYear) ? `Fee for the ${p.feeYear} batch.` : null, strOrNull(p.feeNote)].filter(Boolean).join(" ") || null,
      feeSource: numOrNull(p.feeTotal) !== null ? src(s.fee, feeYear) : null,
      intake: p.intake,
      intakeNote: p.intakeNote ?? null,
      intakeSource: numOrNull(p.intake) !== null ? src(s.intake) : null,
      medianSalary: p.medianSalary,
      medianSalaryYear: graduatingYear(p.salaryYear),
      salaryNote: [strOrNull(p.salaryYear) ? `${p.salaryYear}.` : null, strOrNull(p.placementNote)].filter(Boolean).join(" ") || null,
      salarySource: numOrNull(p.medianSalary) !== null ? src(s.salary, graduatingYear(p.salaryYear)) : null,
    };
  });
  const admissionUrl = data.programs.map((p) => p?.sources?.admission).find((u) => strOrNull(u)) ?? null;

  const cutoffs = (Array.isArray(data.officialCutoffs) ? data.officialCutoffs : [])
    .filter((c) => c && examIdFor(c.exam ?? "CAT") === "cat")
    // A composite score or shortlisting index is not a CAT percentile.
    .filter((c) => !strOrNull(c.metric) || (/percentile/i.test(c.metric) && !/not (a )?cat percentile|composite|index/i.test(c.metric)))
    .flatMap((c) => categoriesFor(c.category).map((category) => ({ ...c, category })))
    .map((c) => {
      const sec = c.sectional && typeof c.sectional === "object" ? c.sectional : {};
      return {
        policyBatch: strOrNull(c.batch) ?? String(c.year ?? ""),
        stage: "shortlisting",
        programCode: strOrNull(c.programCode) ?? programs[0]?.code ?? null,
        category: c.category ?? "General",
        pwd: c.pwd === true,
        gender: c.gender ?? null,
        overall: c.overall ?? null,
        varc: sec.VARC ?? c.varc ?? null,
        dilr: sec.DILR ?? c.dilr ?? null,
        qa: sec.QA ?? c.qa ?? null,
        notes: strOrNull(c.notes) ?? (strOrNull(c.stage) ? `Published as a ${c.stage} minimum.` : null),
        source: src(c.source, c.year),
      };
    });

  const facts = [];
  // Composite or index cut-offs (e.g. SJMSOM, DMS IIT Delhi) are kept as labelled facts, never as CAT percentiles.
  for (const c of Array.isArray(data.officialCutoffs) ? data.officialCutoffs : []) {
    if (!c || examIdFor(c.exam ?? "CAT") !== "cat" || !strOrNull(c.metric) || numOrNull(c.overall) === null) continue;
    if (/percentile/i.test(c.metric) && !/not (a )?cat percentile|composite|index/i.test(c.metric)) continue;
    const source = src(c.source, c.year);
    if (!source) continue;
    facts.push({
      label: `Shortlisting cut-off, ${c.category}${c.batch ? ` (${c.batch})` : ""}`,
      value: `${c.overall} — ${c.metric}`,
      note: "A composite or index score, not a CAT percentile.",
      source,
    });
  }
  // Cut-offs on another exam's basis (e.g. MAH-CET CAP closing figures) are labelled with that basis.
  for (const c of Array.isArray(data.officialCutoffs) ? data.officialCutoffs : []) {
    if (!c || examIdFor(c.exam ?? "CAT") === "cat" || numOrNull(c.overall) === null) continue;
    const source = src(c.source, c.year);
    if (!source) continue;
    const basis = /mah|cet/i.test(String(c.exam)) ? "State CET Cell CAP, MAH-CET basis" : `${c.exam} basis`;
    facts.push({
      label: `${c.stage === "final" ? "Closing" : "Published"} ${c.exam} figure, ${c.category}${c.batch ? ` (${c.batch})` : ""}`,
      value: String(c.overall),
      note: [`${basis}; not a CAT percentile.`, strOrNull(c.note)].filter(Boolean).join(" "),
      source,
    });
  }
  const kd = data.keyDates && typeof data.keyDates === "object" ? data.keyDates : null;
  const kdSource = kd ? src(kd.source) : null;
  // Kept structured too, for the deadline tracker: exact days (YYYY-MM-DD) or months (YYYY-MM) only.
  const dateOrMonth = (v) => (/^\d{4}-\d{2}(-\d{2})?$/.test(String(v ?? "")) ? v : null);
  const keyDates =
    kd && kdSource && [kd.applicationOpens, kd.applicationDeadline, kd.examDate].some(dateOrMonth)
      ? {
          applicationOpens: dateOrMonth(kd.applicationOpens),
          applicationDeadline: dateOrMonth(kd.applicationDeadline),
          examDate: dateOrMonth(kd.examDate),
          notes: strOrNull(kd.notes),
          tentative: kd.tentative === true || /\btentative\b/i.test(String(kd.notes ?? "")),
          source: kdSource,
        }
      : null;
  if (kd && kdSource) {
    const day = (iso) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ""))) return null;
      const [y, m, d] = iso.split("-").map(Number);
      return `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${y}`;
    };
    if (day(kd.applicationOpens)) facts.push({ label: "Applications open", value: day(kd.applicationOpens), source: kdSource });
    if (day(kd.applicationDeadline)) facts.push({ label: "Application deadline", value: day(kd.applicationDeadline), note: strOrNull(kd.notes), source: kdSource });
  }

  const weight = data.selectionWeightage && typeof data.selectionWeightage === "object" ? data.selectionWeightage : null;
  const selectionSource = src(weight?.source ?? admissionUrl);
  const selectionProcess = (Array.isArray(data.selectionProcess) ? data.selectionProcess : [])
    .filter((st) => st && strOrNull(st.name))
    .map((st, i) => ({
      stage: numOrNull(st.stage) ?? i + 1,
      name: st.name,
      weightage: strOrNull(st.weightage),
      detail: strOrNull(st.detail),
    }));

  const nirfId = strOrNull(data.nirf?.nirfInstituteId);
  return {
    slug: data.slug,
    name: data.name,
    shortName: data.shortName,
    city: data.city,
    state: data.state,
    website: data.website,
    type: data.type,
    programs,
    cutoffs,
    cutoffNotes: null,
    facts,
    acceptedExams: [...new Set(data.programs.flatMap((p) => (Array.isArray(p.examsAccepted) ? p.examsAccepted : [])))],
    acceptedExamsSource: src(admissionUrl),
    specialisations: [...new Set(data.programs.flatMap((p) => (Array.isArray(p.specialisations) ? p.specialisations : [])))],
    specialisationsSource: src(admissionUrl),
    selectionProcess,
    selectionSource,
    nirfInstituteId: nirfId,
    keyDates,
  };
}

/**
 * colleges/<slug>.json → an InstituteDetail plus profile extras. Same shape as a
 * programs/ file (so a research pass can copy that template), with optional
 * `ownership`, `acceptedExams`, `specialisations`, `facts` and `establishedYear`.
 * Throws when the file has no verified figure at all — no page for an entity
 * we cannot say anything sourced about.
 */
export function buildCollege(raw, expectedSlug) {
  const data = adaptResearchCollege(stripQuotes(raw));
  const where = `colleges/${expectedSlug ?? data?.slug ?? "?"}`;
  if (!data || typeof data !== "object") throw new Error(`${where}: not an object`);
  if (!strOrNull(data.slug) && expectedSlug) data.slug = expectedSlug;
  if (!strOrNull(data.shortName)) data.shortName = data.name;
  if (!Array.isArray(data.programs)) data.programs = [];
  if (!Array.isArray(data.cutoffs)) data.cutoffs = [];
  data.programs = data.programs.map((p, i) => ({ ...p, code: strOrNull(p?.code) ?? `P${i + 1}` }));
  const inst = buildInstitute(data, expectedSlug);
  if (!inst.city) throw new Error(`${where}: missing city`);
  const top = looseSource(data.source, `${where} source`);
  const facts = buildFacts(data.facts, top, where);
  const examSource = looseSource(data.acceptedExamsSource, `${where} acceptedExams`) ?? top;
  const acceptedExams = [
    ...new Set((Array.isArray(data.acceptedExams) ? data.acceptedExams : []).map((e) => examIdFor(textOf(e))).filter(Boolean)),
  ];
  const specSource = looseSource(data.specialisationsSource, `${where} specialisations`) ?? top;
  const specialisations = (Array.isArray(data.specialisations) ? data.specialisations : []).map(textOf).filter((s) => strOrNull(s));
  // Publish gate: a sourced fee or median salary AND sourced admission information
  // (published cut-offs, selection process, or accepted exams with a source).
  const money = inst.programs.some((p) => (p.feeTotal !== null && p.feeSource) || (p.medianSalary !== null && p.salarySource));
  if (!money) throw new Error(`${where}: no fee or salary with an official source`);
  const selectionSourced = Array.isArray(data.selectionProcess) && data.selectionProcess.length > 0 && Boolean(looseSource(data.selectionSource, `${where} selection`) ?? top);
  const admission = inst.cutoffs.length > 0 || selectionSourced || (acceptedExams.length > 0 && Boolean(examSource));
  if (!admission) throw new Error(`${where}: no admission or selection information with an official source`);
  if (acceptedExams.length && !examSource) throw new Error(`${where}: acceptedExams need a source`);
  if (specialisations.length && !specSource) throw new Error(`${where}: specialisations need a source`);
  const selectionSource = looseSource(data.selectionSource, `${where} selection`) ?? top;
  const selectionProcess = Array.isArray(data.selectionProcess) && selectionSource ? data.selectionProcess : [];
  const keyDates = buildKeyDates(data.keyDates, where);
  return {
    ...inst,
    sources: dedupeSources([
      ...inst.sources,
      top,
      ...facts.map((f) => f.source),
      acceptedExams.length ? examSource : null,
      specialisations.length ? specSource : null,
      selectionProcess.length ? selectionSource : null,
      keyDates?.source ?? null,
    ]),
    ...collegeExtras({
      ownership: strOrNull(data.ownership) ?? strOrNull(data.type),
      acceptedExams,
      specialisations,
      facts,
      establishedYear: numOrNull(data.establishedYear),
      selectionProcess,
      selectionSource: selectionProcess.length ? selectionSource : null,
      nirfInstituteId: strOrNull(data.nirfInstituteId),
      keyDates,
      acceptedExamsSource: acceptedExams.length ? examSource : null,
    }),
  };
}

/**
 * An institute's admission dates: exact days or months, each tied to the
 * official page that states them. Null when nothing dated and sourced remains.
 */
function buildKeyDates(kd, where) {
  if (!kd || typeof kd !== "object") return null;
  let source = null;
  try {
    const raw = typeof kd.source === "string" ? { title: `Official admission page (${hostOf(kd.source)})`, url: kd.source } : kd.source;
    source = looseSource(raw, `${where} keyDates`);
  } catch (error) {
    console.warn(`[mba-snapshot] ${where}: key dates left out (${error.message}).`);
    return null;
  }
  if (!source) return null;
  const ok = (v) => (/^\d{4}-\d{2}(-\d{2})?$/.test(String(v ?? "")) ? v : null);
  const out = {
    applicationOpens: ok(kd.applicationOpens),
    applicationDeadline: ok(kd.applicationDeadline),
    examDate: ok(kd.examDate),
    notes: strOrNull(kd.notes),
    tentative: kd.tentative === true || /\btentative\b/i.test(String(kd.notes ?? "")),
    source,
  };
  return out.applicationOpens || out.applicationDeadline || out.examDate ? out : null;
}

/** The profile fields every institute carries (IIMs get theirs from data). */
function collegeExtras({
  group = "Other",
  ownership = null,
  acceptedExams = [],
  specialisations = [],
  facts = [],
  establishedYear = null,
  selectionProcess = [],
  selectionSource = null,
  nirfInstituteId = null,
  keyDates = null,
  acceptedExamsSource = null,
} = {}) {
  return {
    group,
    ownership,
    acceptedExams,
    acceptedExamsSource,
    specialisations,
    facts,
    establishedYear,
    selectionProcess,
    selectionSource,
    nirfInstituteId,
    keyDates,
  };
}

/** One exam section, from either the cat_exam shape or a looser `pattern`. */
function buildSection(s) {
  if (!s || !strOrNull(s.name ?? s.id)) return null;
  return {
    id: strOrNull(s.id) ?? s.name,
    name: strOrNull(s.name) ?? s.id,
    questionCount: numOrNull(s.questionCount),
    durationMinutes: numOrNull(s.durationMinutes),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayLabel = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(iso ?? ""))) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

/**
 * The research passes write exams/<id>.json with one `sources` list (each entry
 * says what it `supports`) rather than a source per figure. Each fact is tied
 * to the first source whose `supports` mentions it, else the first source —
 * the exam body's own bulletin. Returns the input unchanged if it is already in
 * the per-figure shape.
 */
export function adaptResearchExam(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.sources) || data.facts) return data;
  const list = data.sources
    .filter((s) => s && strOrNull(s.url) && strOrNull(s.title))
    .map((s) => ({ ...s, kind: "official", supports: String(s.supports ?? "").toLowerCase() }));
  if (list.length === 0) return data;
  const pick = (re) => {
    const hit = list.find((s) => re.test(s.supports)) ?? list[0];
    return { kind: "official", title: hit.title, url: hit.url, year: numOrNull(hit.year), retrievedAt: strOrNull(hit.retrievedAt) ?? "" };
  };
  const p = data.pattern && typeof data.pattern === "object" ? data.pattern : null;
  const facts = [];
  const add = (label, value, re, note = null) => {
    const v = typeof value === "number" ? String(value) : strOrNull(value);
    if (v) facts.push({ label, value: v, note, source: pick(re) });
  };
  add("Exam cycle", data.cycle, /cycle|date|bulletin/);
  add("Conducted by", data.conductingBody, /conduct|body|bulletin/);
  add("Mode", data.mode, /mode|online|computer|centre|center/);
  add("How often it is held", data.frequency, /frequen|date|slot|window|attempt/);
  add("Eligibility", data.eligibility, /eligib/);
  add("Score validity", data.scoreValidity, /valid/);
  for (const f of Array.isArray(data.registrationFee) ? data.registrationFee : []) {
    const amount = numOrNull(f?.amount);
    if (amount === null || !strOrNull(f?.category)) continue;
    const money = f.currency && f.currency !== "INR" ? `${f.currency} ${amount.toLocaleString("en-IN")}` : `₹${Math.round(amount).toLocaleString("en-IN")}`;
    add(`Fee: ${f.category}`, money, /fee/);
  }
  const dates = [];
  for (const d of Array.isArray(data.keyDates) ? data.keyDates : []) {
    const value = dayLabel(d?.date) ?? strOrNull(d?.dateText);
    if (!value || !strOrNull(d?.event)) continue;
    dates.push({
      label: d.event,
      value,
      tentative: d.tentative === true,
      // The machine-readable day, for the deadline tracker and calendar files; only exact days have one.
      iso: dayLabel(d?.date) ? d.date : null,
      source: pick(/date|registration|admit|result|schedule/),
    });
  }
  const accepting = data.acceptingInstitutes && typeof data.acceptingInstitutes === "object" ? data.acceptingInstitutes : {};
  return {
    id: data.id,
    name: strOrNull(data.fullName) ? `${data.fullName} (${data.name})` : data.name,
    shortName: data.name,
    conductingBody: data.conductingBody,
    officialUrl: data.officialUrl,
    source: list[0],
    pattern: p
      ? {
          sections: (Array.isArray(p.sections) ? p.sections : []).map((x) => ({ name: x?.name, questionCount: x?.questions ?? null, durationMinutes: x?.minutes ?? null })),
          totalDurationMinutes: p.totalMinutes ?? null,
          source: pick(/pattern|section|marking|question|syllabus/),
        }
      : null,
    markingText: strOrNull(p?.marking),
    patternNotes: strOrNull(p?.notes),
    syllabusAreas: Array.isArray(data.syllabusAreas) ? data.syllabusAreas.filter((x) => strOrNull(x)) : [],
    resultAndCounselling: strOrNull(data.resultAndCounselling),
    resultSource: strOrNull(data.resultAndCounselling) ? pick(/result|counsel|selection|score card/) : null,
    facts,
    dates,
    acceptedBy: Array.isArray(accepting.notable) ? accepting.notable : [],
    acceptedByUrl: strOrNull(accepting.officialListUrl),
    acceptedByNote: strOrNull(accepting.note),
  };
}

/**
 * exams/<id>.json → ExamInfo. Accepts the cat_exam.json shape (`versions`) or a
 * flatter one (`pattern`, `facts`, `dates`). Needs a name, the official site,
 * at least one official source and at least three sourced facts, dates or
 * sections — otherwise the exam page would be a stub.
 */
export function buildExamInfo(raw, expectedId) {
  const data = adaptResearchExam(stripQuotes(raw));
  const where = `exams/${expectedId ?? data?.id ?? "?"}`;
  if (!data || typeof data !== "object") throw new Error(`${where}: not an object`);
  const id = examIdFor(data.id ?? expectedId);
  if (!id) throw new Error(`${where}: unknown exam id ${data.id}`);
  if (expectedId && examIdFor(expectedId) !== id) throw new Error(`${where}: id "${data.id}" does not match the file name`);
  if (!strOrNull(data.name)) throw new Error(`${where}: missing name`);
  const officialUrl = strOrNull(data.officialUrl) ?? strOrNull(data.website);
  if (!officialUrl || !/^https?:\/\//.test(officialUrl)) throw new Error(`${where}: missing officialUrl`);
  const top = looseSource(data.source, `${where} source`);

  const version = Array.isArray(data.versions) && data.versions.length
    ? [...data.versions].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]
    : data.pattern ?? null;
  const patternSource = version ? looseSource(version.source, `${where} pattern`) ?? top : null;
  const sections = version && Array.isArray(version.sections) ? version.sections.map(buildSection).filter(Boolean) : [];
  if (sections.length && !patternSource) throw new Error(`${where}: pattern has no source`);
  const marking = version && Array.isArray(version.marking)
    ? version.marking
        .filter((m) => strOrNull(m?.type) && typeof m.correct === "number")
        .map((m) => ({ type: m.type, correct: m.correct, incorrect: numOrNull(m.incorrect) ?? 0, unanswered: numOrNull(m.unanswered) ?? 0 }))
    : [];

  const facts = buildFacts(data.facts, top, where);
  for (const [key, label] of [["conductingBody", "Conducted by"], ["eligibility", "Eligibility"], ["scoreValidity", "Score validity"], ["mode", "Mode"]]) {
    const v = data[key];
    const text = typeof v === "string" ? v : v && typeof v === "object" ? strOrNull(v.text ?? v.value) : null;
    if (!text || facts.some((f) => f.label === label)) continue;
    const source = (v && typeof v === "object" ? looseSource(v.source, `${where} ${key}`) : null) ?? top;
    if (source) facts.push({ label, value: text, note: null, tentative: false, source });
  }
  if (data.fee && typeof data.fee === "object") {
    const amount = numOrNull(data.fee.amount);
    const text = strOrNull(data.fee.text) ?? (amount !== null ? `₹${Math.round(amount).toLocaleString("en-IN")}` : null);
    const source = looseSource(data.fee.source, `${where} fee`) ?? top;
    if (text && source) facts.push({ label: "Application fee", value: text, note: strOrNull(data.fee.note), tentative: false, source });
  }
  const dates = buildFacts(data.dates, top, `${where} dates`);
  const evidence = facts.length + dates.length + sections.length;
  if (evidence < 3) throw new Error(`${where}: fewer than three sourced facts`);

  return {
    id,
    name: data.name,
    shortName: strOrNull(data.shortName) ?? MBA_EXAMS.find((e) => e.id === id)?.short ?? data.name,
    conductingBody: typeof data.conductingBody === "string" ? data.conductingBody : strOrNull(data.conductingBody?.text),
    officialUrl,
    year: numOrNull(version?.year) ?? numOrNull(data.year),
    sections,
    totalDurationMinutes: numOrNull(version?.totalDurationMinutes),
    marking,
    patternSource,
    facts,
    dates,
    acceptedBy: (Array.isArray(data.acceptedBy) ? data.acceptedBy : []).map(textOf).filter((s) => strOrNull(s)),
    acceptedByUrl: strOrNull(data.acceptedByUrl),
    acceptedByNote: strOrNull(data.acceptedByNote),
    markingText: strOrNull(data.markingText),
    patternNotes: strOrNull(data.patternNotes),
    syllabusAreas: Array.isArray(data.syllabusAreas) ? data.syllabusAreas : [],
    resultAndCounselling: strOrNull(data.resultAndCounselling),
    notes: strOrNull(data.notes),
    sources: dedupeSources([top, patternSource, ...facts.map((f) => f.source), ...dates.map((d) => d.source), looseSource(data.resultSource, `${where} result`)]),
  };
}

const CUTOFF_KINDS = { minimum: "minimum", minimum_to_apply: "minimum", shortlisting: "shortlisting", closing: "closing", final: "final", previous_year_final: "final" };
const ALL_CATEGORIES = ["General", "EWS", "NC-OBC", "SC", "ST"];
/** "UR", "Open", "OBC-NCL" → our categories; "All" → every category; anything else (e.g. "All India (AI)") → none. */
export function categoriesFor(value) {
  const n = String(value ?? "General").trim().toLowerCase();
  if (n === "all" || n === "all categories") return ALL_CATEGORIES;
  const one = (t) => {
    if (["general", "gen", "gn", "ur", "open", "unreserved", "general (ur)"].includes(t)) return "General";
    if (["obc", "nc-obc", "obc-ncl", "ncl-obc", "obc (ncl)", "ncobc"].includes(t)) return "NC-OBC";
    if (t === "ews" || t === "gen-ews") return "EWS";
    if (t === "sc") return "SC";
    if (t === "st") return "ST";
    return null;
  };
  // "GN/EWS" or "General/KM/AF/EWS": one row that applies to several groups.
  return [...new Set(n.split(/\s*\/\s*/).map(one).filter(Boolean))];
}

/**
 * cat-cutoffs/<slug>.json → one institute's published CAT figures. Each record
 * needs a percentile, a stage and an official source. A record whose category
 * is not one of ours (for example an exam-agnostic "All India" CAP merit score)
 * is dropped: it is not a CAT percentile.
 */
export function buildCatCutoffSet(raw, expectedSlug) {
  const data = stripQuotes(raw);
  const where = `cat-cutoffs/${expectedSlug ?? "?"}`;
  const list = Array.isArray(data) ? data : Array.isArray(data?.records) ? data.records : Array.isArray(data?.cutoffs) ? data.cutoffs : null;
  if (!list) throw new Error(`${where}: expected records`);
  const slug = strOrNull(data?.slug) ?? expectedSlug;
  if (expectedSlug && slug !== expectedSlug) throw new Error(`${where}: slug "${slug}" does not match the file name`);
  const top = looseSource(data?.source, `${where} source`);
  const records = [];
  for (const [i, r] of list.entries()) {
    try {
      const cats = categoriesFor(r.category);
      if (cats.length === 0) throw new Error(`category "${r.category}" is not a CAT category`);
      const overall = numOrNull(r.overall ?? r.percentile ?? r.overallPercentile);
      const source = looseSource(r.source, `${where} record ${i}`) ?? top;
      if (!source) throw new Error("no source");
      if (overall === null && [r.varc, r.dilr, r.qa].every((v) => numOrNull(v) === null)) throw new Error("no percentile");
      const kind = CUTOFF_KINDS[String(r.kind ?? r.stage ?? "minimum").toLowerCase()];
      if (!kind) throw new Error(`unknown stage ${r.stage}`);
      const allNote = cats.length > 1 ? "Published for all categories." : null;
      for (const category of cats) {
        records.push({
          label: strOrNull(r.policyBatch) ?? strOrNull(r.batch) ?? (numOrNull(r.year) ? String(r.year) : null) ?? "",
          kind,
          programme: strOrNull(r.programme) ?? strOrNull(r.program) ?? strOrNull(data?.program) ?? null,
          category,
          pwd: r.pwd === true,
          gender: GENDERS.has(r.gender) ? r.gender : null,
          overall,
          varc: numOrNull(r.varc),
          dilr: numOrNull(r.dilr),
          qa: numOrNull(r.qa),
          notes: [allNote, strOrNull(r.notes) ?? strOrNull(r.note)].filter(Boolean).join(" ") || null,
          source,
        });
      }
    } catch (error) {
      console.warn(`[mba-snapshot] ${where}: record ${i} left out (${error.message}).`);
    }
  }
  if (records.length === 0) throw new Error(`${where}: no valid records`);
  return {
    slug,
    name: strOrNull(data?.name),
    shortName: strOrNull(data?.shortName),
    city: strOrNull(data?.city),
    records,
    // `statusNote` qualifies the whole set (e.g. "standing regulation, not a batch-specific notice").
    notes: [strOrNull(data?.notes), strOrNull(data?.statusNote)].filter(Boolean).join(" ") || null,
  };
}

/** nirf-management.json → the official ranking table. */
export function buildNirf(raw) {
  const data = stripQuotes(raw);
  if (!data || typeof data !== "object") throw new Error("nirf-management.json: not an object");
  const found = looseSource(data.source, "nirf-management.json source");
  if (!found) throw new Error("nirf-management.json: missing source");
  const source = { ...found, year: found.year ?? numOrNull(data.year) };
  const rows = Array.isArray(data.rankings) ? data.rankings : Array.isArray(data.rows) ? data.rows : [];
  const rankings = rows
    .filter((r) => numOrNull(r?.rank) !== null && strOrNull(r?.name))
    .map((r) => ({
      rank: r.rank,
      name: r.name,
      city: strOrNull(r.city) ?? "",
      state: strOrNull(r.state) ?? "",
      score: numOrNull(r.score),
      slug: strOrNull(r.slug),
      nirfInstituteId: strOrNull(r.nirfInstituteId),
    }))
    .sort((a, b) => a.rank - b.rank);
  if (rankings.length === 0) throw new Error("nirf-management.json: no rankings");
  return {
    year: numOrNull(data.year),
    edition: strOrNull(data.edition),
    releasedOn: strOrNull(data.releasedOn),
    source,
    releaseSource: (() => {
      try {
        return looseSource(data.releaseSource, "nirf releaseSource");
      } catch {
        return null;
      }
    })(),
    rankings,
  };
}

/**
 * specialisations.json → which institutes offer which specialisation:
 * `{ specialisations: { "<name>": [{ slug, institute, programme, evidence, source }] } }`.
 * Each name must map to a specialisation page (src/lib/mbaRoutes.mjs) and each
 * entry needs an official source URL; anything else is left out with a warning.
 * `profileSlug` links the entry to a published profile when we have one.
 */
export function buildSpecialisationListings(raw, profiles = []) {
  const data = stripQuotes(raw);
  const map = data?.specialisations;
  if (!map || typeof map !== "object" || Array.isArray(map)) throw new Error("specialisations.json: expected { specialisations: { <name>: [...] } }");
  const out = [];
  const seen = new Set();
  for (const [name, list] of Object.entries(map)) {
    const spec = specialisationSlugFor(name);
    if (!spec) {
      console.warn(`[mba-snapshot] specialisations.json: "${name}" matches no specialisation page; left out.`);
      continue;
    }
    for (const [i, e] of (Array.isArray(list) ? list : []).entries()) {
      const where = `specialisations.json ${name} #${i}`;
      try {
        if (!strOrNull(e?.slug) || !strOrNull(e?.institute)) throw new Error("needs slug and institute");
        const rawSource =
          typeof e.source === "string" ? { title: `${e.institute} official programme page (${hostOf(e.source)})`, url: e.source } : e.source;
        const source = looseSource(rawSource, where);
        if (!source) throw new Error("no official source url");
        // Exact slug, then exact name, then a unique "<slug>-<city>" profile.
        const prefixed = profiles.filter((c) => c.slug.startsWith(`${e.slug}-`));
        const profileSlug =
          profiles.find((c) => c.slug === e.slug)?.slug ??
          profiles.find((c) => [c.name, c.shortName].some((n) => normName(n) === normName(e.institute)))?.slug ??
          (prefixed.length === 1 ? prefixed[0].slug : null);
        const key = `${spec}|${profileSlug ?? e.slug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          spec,
          slug: e.slug,
          profileSlug,
          institute: e.institute,
          programme: strOrNull(e.programme) ?? strOrNull(e.program),
          // How the institute offers it: "dedicated programme", "named specialisation", "area of specialisation (electives)".
          basis: strOrNull(e.basis),
          evidence: strOrNull(e.evidence),
          source,
        });
      } catch (error) {
        console.warn(`[mba-snapshot] ${where} left out: ${error.message}`);
      }
    }
  }
  return out.sort((a, b) => a.spec.localeCompare(b.spec) || a.institute.localeCompare(b.institute));
}

/**
 * cat-cutoffs/ files that are excluded from every CAT percentile band and page
 * by editorial decision, with the reason.
 *  - tezpur-university: its notice gives "cut-off marks" with no unit, so the
 *    figure is not verifiably a CAT percentile.
 */
export const EXCLUDED_CUTOFF_SETS = new Map([
  ["tezpur-university", 'its notice gives "cut-off marks" with no unit, so it is not verifiably a CAT percentile'],
]);

/** Run `build` over each entry, keeping the ones that validate. */
function keepValid(entries, build, label) {
  const out = [];
  for (const { slug, data } of entries ?? []) {
    try {
      out.push(build(data, slug));
    } catch (error) {
      console.warn(`[mba-snapshot] ${label}/${slug} left out: ${error.message}`);
    }
  }
  return out;
}

// ── Previous-year CAT papers (content/<paperId>/) ────────────────────────────
//
// The actual CAT papers (paper.json with source.kind "official" and an integer
// year and slot) that the student app offers as timed tests. Only the paper's
// identity and its question count per section reach the snapshot — never a
// question, an option, an answer or a solution.

const PYQ_SECTIONS = [
  ["VARC", "varc.json"],
  ["DILR", "dilr.json"],
  ["QA", "qa.json"],
];
const isInt = (v) => Number.isInteger(v);

/** { paper, counts: { VARC: n, DILR: n, QA: n, solutions: n } } → a PyqPaper (throws when incomplete). */
export function buildPyqPaper(raw, expectedId) {
  const paper = raw?.paper;
  if (!paper || typeof paper !== "object") throw new Error("paper.json is missing");
  const { year, slot } = paper;
  if (!isInt(year) || !isInt(slot) || slot < 1) throw new Error("year and slot must be integers");
  const id = strOrNull(paper.id) ?? `cat-${year}-slot${slot}`;
  if (expectedId && id !== expectedId) throw new Error(`id ${id} does not match its folder`);
  const versionYear = isInt(paper.examVersionYear) ? paper.examVersionYear : year;
  const sections = PYQ_SECTIONS.map(([sid]) => ({ id: sid, questionCount: raw.counts?.[sid] ?? 0 })).filter(
    (s) => s.questionCount > 0,
  );
  if (sections.length !== PYQ_SECTIONS.length) throw new Error("every section (VARC, DILR, QA) needs questions");
  return {
    id,
    year,
    slot,
    title: strOrNull(paper.title) ?? `CAT ${year} Slot ${slot}`,
    examVersionYear: versionYear,
    questionCount: sections.reduce((n, s) => n + s.questionCount, 0),
    // How many questions have a written solution (a count only; solutions stay in the app).
    solutionCount: isInt(raw.counts?.solutions) ? raw.counts.solutions : 0,
    sections,
    source: officialSource(paper.source, `content/${id}`),
  };
}

// ── MAH-MBA/MMS CAP cut-offs (exams/mah-mba-cap-cutoffs.json) ────────────────
//
// 4,400 rows from the State CET Cell's CAP round PDF. The pages show only the
// OPEN columns (state-level, home-university and other-than-home-university
// seats), so only those are kept, one compact row per institute-course, in a
// separate module that only the MAH-CET page and the Maharashtra city pages
// load. The closing figure is a MAH-CET percentile, never a CAT one.

const CAP_COLUMNS = ["GOPENS", "GOPENH", "GOPENO"];

/** "Pune." → "Pune"; null city → the place after the last comma in the name. */
function capCity(row) {
  const c = strOrNull(row.city)?.replace(/[.\s]+$/, "");
  if (c) return c;
  const tail = /,\s*([A-Za-z .]+?)\s*\.?$/.exec(String(row.instituteName ?? ""));
  return tail ? tail[1].trim() : null;
}

export function buildCapCutoffs(raw) {
  const data = stripQuotes(raw);
  if (!data || !Array.isArray(data.rows)) throw new Error("mah-mba-cap-cutoffs.json: expected rows");
  const listingUrl = strOrNull(data.sourceListingUrl);
  if (!listingUrl || !/^https?:\/\//.test(listingUrl)) throw new Error("mah-mba-cap-cutoffs.json: missing sourceListingUrl");
  const byCourse = new Map();
  for (const r of data.rows) {
    if (!CAP_COLUMNS.includes(r?.categoryCode)) continue;
    const pct = numOrNull(r.closingPercentile);
    if (pct === null || !strOrNull(r.instituteName)) continue;
    const key = `${r.instituteCode}|${r.courseCode ?? r.courseName}`;
    if (!byCourse.has(key)) {
      byCourse.set(key, {
        code: String(r.instituteCode ?? ""),
        institute: String(r.instituteName).replace(/\s+/g, " ").trim(),
        city: capCity(r),
        course: strOrNull(r.courseName)?.replace(/\s+/g, " ") ?? "",
        status: strOrNull(r.instituteStatus),
        GOPENS: null,
        GOPENH: null,
        GOPENO: null,
      });
    }
    const row = byCourse.get(key);
    const v = Math.round(pct * 100) / 100;
    // Several seat-type blocks can carry the same column; keep the lowest closing figure.
    row[r.categoryCode] = row[r.categoryCode] === null ? v : Math.min(row[r.categoryCode], v);
  }
  const rows = [...byCourse.values()].sort((a, b) => (b.GOPENS ?? b.GOPENH ?? b.GOPENO ?? 0) - (a.GOPENS ?? a.GOPENH ?? a.GOPENO ?? 0));
  if (rows.length === 0) throw new Error("mah-mba-cap-cutoffs.json: no OPEN rows");
  return {
    meta: {
      title: strOrNull(data.title) ?? "MAH-MBA/MMS CAP cut-off",
      round: strOrNull(data.round) ?? "",
      academicYear: strOrNull(data.academicYear) ?? strOrNull(data.year) ?? "",
      seatPool: strOrNull(data.seatPool),
      publisher: strOrNull(data.publisher) ?? "State Common Entrance Test Cell, Maharashtra",
      source: { kind: "official", title: `${strOrNull(data.title) ?? "CAP cut-off"} (${data.publisher ?? "State CET Cell, Maharashtra"})`, url: listingUrl, year: null, retrievedAt: strOrNull(data.retrievedAt) ?? "" },
    },
    rows,
  };
}

/** Institutes per city in the CAP data (distinct institute codes). */
function capCityCounts(cap, citySlugOf) {
  const sets = {};
  for (const r of cap?.rows ?? []) {
    const slug = citySlugOf(r.city);
    if (!slug) continue;
    (sets[slug] ??= new Set()).add(r.code);
  }
  return Object.fromEntries(Object.entries(sets).map(([k, v]) => [k, v.size]));
}

export function renderCapModule(cap) {
  // Rows as tuples, not objects: the same 400-odd courses without 400 copies of every key.
  const tuples = cap.rows.map((r) => [r.code, r.institute, r.city, r.course, r.status, r.GOPENS, r.GOPENH, r.GOPENO]);
  return [
    "// AUTO-GENERATED by scripts/generate-mba-snapshot.mjs — do not edit by hand.",
    "// Source: State CET Cell, Maharashtra — MBA/MMS CAP round cut-offs (OPEN columns only).",
    "// Closing figures are MAH-MBA/MMS CET percentiles, not CAT percentiles.",
    'import type { CapCutoffs, CapMeta, CapRow } from "@/data/mbaSnapshotTypes";',
    "",
    "type Tuple = [string, string, string | null, string, string | null, number | null, number | null, number | null];",
    `const META: CapMeta | null = ${JSON.stringify(cap.meta)};`,
    `const ROWS: Tuple[] = ${JSON.stringify(tuples)};`,
    "",
    "export const MAH_CAP_CUTOFFS: CapCutoffs = {",
    "  meta: META,",
    "  rows: ROWS.map(([code, institute, city, course, status, GOPENS, GOPENH, GOPENO]): CapRow => ({ code, institute, city, course, status, GOPENS, GOPENH, GOPENO })),",
    "};",
    "",
  ].join("\n");
}

const normName = (s) => String(s ?? "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();

/** The profile a cat-cutoffs set belongs to: same slug, "<slug>-<city>", or same name. */
function profileSlugFor(set, profiles) {
  const exact = profiles.find((c) => c.slug === set.slug);
  if (exact) return exact.slug;
  const prefixed = profiles.find((c) => c.slug.startsWith(`${set.slug}-`));
  if (prefixed) return prefixed.slug;
  const name = normName(set.name);
  return profiles.find((c) => name && (normName(c.name) === name || normName(c.shortName) === name))?.slug ?? null;
}

/** Everything the public pages need, from already-parsed JSON. */
export function buildMbaSnapshot({
  catExam,
  programs,
  colleges = [],
  exams = [],
  catCutoffs = [],
  nirf = null,
  catCutoffIndex = null,
  capCutoffs = null,
  specialisations = null,
  pyqPapers = [],
}) {
  const extraFor = new Map();
  const otherColleges = [];
  for (const college of keepValid(colleges, buildCollege, "colleges")) {
    if (programs.some((p) => p.slug === college.slug)) extraFor.set(college.slug, college);
    else otherColleges.push(college);
  }

  const institutes = programs
    .map(({ slug, data }) => {
      const inst = buildInstitute(data, slug);
      const extra = extraFor.get(slug);
      // An IIM's own policy is a CAT policy: CAT is the accepted exam when it has thresholds.
      return {
        ...inst,
        sources: extra ? dedupeSources([...inst.sources, ...extra.sources]) : inst.sources,
        ...collegeExtras({
          group: "IIM",
          ownership: extra?.ownership ?? null,
          acceptedExams: [...new Set([...(inst.cutoffs.length ? ["cat"] : []), ...(extra?.acceptedExams ?? [])])],
          specialisations: extra?.specialisations ?? [],
          facts: extra?.facts ?? [],
          establishedYear: extra?.establishedYear ?? null,
          selectionProcess: extra?.selectionProcess ?? [],
          selectionSource: extra?.selectionSource ?? null,
          nirfInstituteId: extra?.nirfInstituteId ?? null,
          keyDates: extra?.keyDates ?? null,
          // CAT comes from the IIM's own admission policy; other exams from its colleges/ entry.
          acceptedExamsSource: extra?.acceptedExamsSource ?? inst.cutoffs[0]?.source ?? null,
        }),
      };
    })
    .sort((a, b) => a.shortName.toLowerCase().localeCompare(b.shortName.toLowerCase()));
  if (institutes.length === 0) throw new Error("no programme files");
  const exam = buildExam(catExam);
  const dataFreshness = freshness(institutes);
  const examDates = exam.versions.map((v) => v.source.retrievedAt).filter(Boolean).sort();

  let nirfTable = null;
  if (nirf) {
    try {
      nirfTable = buildNirf(nirf);
    } catch (error) {
      console.warn(`[mba-snapshot] nirf-management.json left out: ${error.message}`);
    }
  }
  const examInfos = keepValid(exams, buildExamInfo, "exams").sort((a, b) => a.id.localeCompare(b.id));
  otherColleges.sort((a, b) => a.shortName.toLowerCase().localeCompare(b.shortName.toLowerCase()));
  const profiles = [...institutes, ...otherColleges];
  const cutoffSets = keepValid(
    catCutoffs.filter(({ slug }) => {
      if (!EXCLUDED_CUTOFF_SETS.has(slug)) return true;
      console.warn(`[mba-snapshot] cat-cutoffs/${slug} left out: ${EXCLUDED_CUTOFF_SETS.get(slug)}`);
      return false;
    }),
    buildCatCutoffSet,
    "cat-cutoffs",
  )
    .map((set) => ({ ...set, profileSlug: profileSlugFor(set, profiles) }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  // Schools checked for an official CAT cut-off and found to publish none.
  const catCutoffNotPublished = (Array.isArray(catCutoffIndex?.checkedNoOfficialCutoff) ? catCutoffIndex.checkedNoOfficialCutoff : [])
    .filter((x) => strOrNull(x?.slug) && strOrNull(x?.name))
    .map((x) => ({ slug: x.slug, name: x.name, profileSlug: profileSlugFor(x, profiles) }));
  let specialisationListings = [];
  if (specialisations) {
    try {
      specialisationListings = buildSpecialisationListings(specialisations, profiles);
    } catch (error) {
      console.warn(`[mba-snapshot] specialisations.json left out: ${error.message}`);
    }
  }
  let cap = null;
  if (capCutoffs) {
    try {
      cap = buildCapCutoffs(capCutoffs);
    } catch (error) {
      console.warn(`[mba-snapshot] mah-mba-cap-cutoffs.json left out: ${error.message}`);
    }
  }

  const pyq = keepValid(pyqPapers, buildPyqPaper, "content").sort((a, b) => b.year - a.year || a.slot - b.slot);

  const allDates = [
    dataFreshness.retrievedAt,
    examDates[examDates.length - 1],
    ...otherColleges.flatMap((c) => c.sources.map((s) => s.retrievedAt)),
    ...examInfos.flatMap((e) => e.sources.map((s) => s.retrievedAt)),
    ...cutoffSets.flatMap((c) => c.records.map((r) => r.source.retrievedAt)),
    ...specialisationListings.map((l) => l.source.retrievedAt),
    nirfTable?.source.retrievedAt,
  ].filter(Boolean);
  const retrievedAt = allDates.sort().pop() ?? null;
  return {
    retrievedAt,
    dataFreshness,
    catExam: exam,
    institutes,
    colleges: otherColleges,
    exams: examInfos,
    catCutoffs: cutoffSets,
    catCutoffNotPublished,
    specialisationListings,
    pyqPapers: pyq,
    nirf: nirfTable,
    capMeta: cap ? { ...cap.meta, cityCounts: capCityCounts(cap, citySlugFor), rows: cap.rows.length } : null,
    // Not part of the bundled snapshot: written to its own module by main().
    __cap: cap,
  };
}

export function renderSnapshotModule(snapshot) {
  return [
    "// AUTO-GENERATED by scripts/generate-mba-snapshot.mjs — do not edit by hand.",
    "// Source: procounsel-neet-api/data/mba (official IIM / CAT Centre / NIRF / exam-body documents).",
    "// Verbatim source quotes are stripped; every figure keeps its official source.",
    'import type { MbaSnapshot } from "@/data/mbaSnapshotTypes";',
    "",
    'export type { MbaSnapshot } from "@/data/mbaSnapshotTypes";',
    "",
    `export const MBA_SNAPSHOT: MbaSnapshot = ${JSON.stringify(snapshot, null, 2)};`,
    "",
  ].join("\n");
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, "utf8"));
}

/** Every *.json in a folder as { slug, data }; [] when the folder is missing. */
async function readFolder(dir) {
  let files;
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const file of files) {
    try {
      out.push({ slug: file.replace(/\.json$/, ""), data: await readJson(path.join(dir, file)) });
    } catch (error) {
      console.warn(`[mba-snapshot] ${path.basename(dir)}/${file} is not valid JSON (${error.message}); left out.`);
    }
  }
  return out;
}

/** Reads the data directory; resolves to null when it does not exist. */
export async function loadMbaData(dataDir) {
  try {
    await fs.access(path.join(dataDir, "programs"));
  } catch {
    return null;
  }
  const catExam = await readJson(path.join(dataDir, "cat_exam.json"));
  const files = (await fs.readdir(path.join(dataDir, "programs"))).filter((f) => f.endsWith(".json")).sort();
  const programs = [];
  for (const file of files) {
    programs.push({ slug: file.replace(/\.json$/, ""), data: await readJson(path.join(dataDir, "programs", file)) });
  }
  let nirf = null;
  try {
    nirf = await readJson(path.join(dataDir, "nirf-management.json"));
  } catch (error) {
    if (error.code !== "ENOENT") console.warn(`[mba-snapshot] nirf-management.json unreadable (${error.message}); left out.`);
  }
  return {
    catExam,
    programs,
    colleges: await readFolder(path.join(dataDir, "colleges")),
    // A "*-cutoffs.json" in exams/ is an allotment dataset (e.g. MAH-MBA CAP
    // round cut-offs), not an exam description; no page template reads it yet.
    exams: (await readFolder(path.join(dataDir, "exams"))).filter(({ slug }) => !slug.endsWith("-cutoffs")),
    catCutoffs: (await readFolder(path.join(dataDir, "cat-cutoffs"))).filter(({ slug }) => slug !== "index"),
    catCutoffIndex: await readJson(path.join(dataDir, "cat-cutoffs", "index.json")).catch(() => null),
    capCutoffs: await readJson(path.join(dataDir, "exams", "mah-mba-cap-cutoffs.json")).catch(() => null),
    specialisations: await readJson(path.join(dataDir, "specialisations.json")).catch((error) => {
      if (error.code !== "ENOENT") console.warn(`[mba-snapshot] specialisations.json unreadable (${error.message}); left out.`);
      return null;
    }),
    nirf,
    pyqPapers: await readPyqPapers(path.join(dataDir, "content")),
  };
}

/**
 * content/<paperId>/ folders whose paper.json is an official, dated paper, as
 * { slug, data: { paper, counts } }. Question files are read only to count them.
 */
async function readPyqPapers(dir) {
  let names;
  try {
    names = (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  } catch {
    return [];
  }
  const out = [];
  for (const name of names) {
    let paper;
    try {
      paper = await readJson(path.join(dir, name, "paper.json"));
    } catch {
      continue; // no paper.json yet (a conversion in progress)
    }
    if (paper?.source?.kind !== "official") continue; // ProCounsel originals are not previous-year papers
    const counts = {};
    try {
      for (const [sid, file] of PYQ_SECTIONS) {
        const fragment = await readJson(path.join(dir, name, file)).catch((error) => {
          if (error.code === "ENOENT") return null;
          throw error;
        });
        const questions = Array.isArray(fragment?.questions) ? fragment.questions : [];
        counts[sid] = questions.length;
        counts.solutions = (counts.solutions ?? 0) + questions.filter((q) => strOrNull(q?.solutionHtml)).length;
      }
    } catch (error) {
      console.warn(`[mba-snapshot] content/${name} left out: ${error.message}`);
      continue;
    }
    out.push({ slug: name, data: { paper, counts } });
  }
  return out;
}

export async function main({ dataDir = process.env.MBA_DATA_DIR || DEFAULT_DATA_DIR, tsPath = TS_PATH, routesPath = ROUTES_PATH, capPath = CAP_PATH } = {}) {
  let raw;
  try {
    raw = await loadMbaData(dataDir);
  } catch (error) {
    console.warn(`[mba-snapshot] Could not read ${dataDir}: ${error.message}. Keeping the committed snapshot.`);
    return { written: false };
  }
  if (!raw) {
    console.log(`[mba-snapshot] ${dataDir} not found — keeping the committed snapshot.`);
    return { written: false };
  }

  let snapshot;
  try {
    snapshot = buildMbaSnapshot(raw);
  } catch (error) {
    console.warn(`[mba-snapshot] Data failed validation (${error.message}). Keeping the committed snapshot.`);
    return { written: false };
  }

  const { __cap: cap, ...bundled } = snapshot;
  snapshot = bundled;
  const moduleText = renderSnapshotModule(snapshot);
  // The CAP module always exists so the pages can import it; empty when there is no data.
  const capText = renderCapModule(cap ?? { meta: null, rows: [] });
  let previousCap = "";
  try {
    previousCap = await fs.readFile(capPath, "utf8");
  } catch {
    /* first run */
  }
  if (previousCap !== capText) await fs.writeFile(capPath, capText);
  const routes = mbaPublishedRoutes(snapshot);
  const routesText = `${JSON.stringify(routes, null, 2)}\n`;
  let previous = "";
  try {
    previous = await fs.readFile(tsPath, "utf8");
  } catch {
    /* first run */
  }
  if (previous !== moduleText) await fs.writeFile(tsPath, moduleText);
  await fs.writeFile(routesPath, routesText);
  console.log(
    `[mba-snapshot] ${snapshot.institutes.length} IIMs, ${snapshot.colleges.length} other colleges, ` +
      `${snapshot.exams.length} exam files, ${snapshot.catCutoffs.length} cut-off sets, ` +
      `${snapshot.specialisationListings.length} specialisation listings, ${snapshot.pyqPapers.length} previous-year papers, ` +
      `NIRF ${snapshot.nirf ? `${snapshot.nirf.year} (${snapshot.nirf.rankings.length} rows)` : "none"}; ` +
      `${routes.length} public routes; CAT versions ${snapshot.catExam.versions.map((v) => v.year).join("/")}, ` +
      `retrieved ${snapshot.retrievedAt}${previous === moduleText ? " (unchanged)" : ""}.`,
  );
  return { written: previous !== moduleText, snapshot, routes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Never fail the build over this snapshot — the committed copy still works.
    console.warn("[mba-snapshot] Unexpected error, keeping the committed snapshot:", error);
  });
}
