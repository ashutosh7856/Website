// Build-time blog snapshot generator.
//
// The blog list + bodies live behind the Cloud Run API, which is NOT reachable
// during the react-snap prerender (skipThirdPartyRequests, and it cold-starts /
// 500s). So blog article pages used to ship with NO crawlable content. This
// script fetches every blog (list + full body) at build time and writes a
// static snapshot that the app bundles, so each blog page prerenders its real
// title, body and SEO tags. The live API still refreshes it client-side.
//
// Resilience: the backend is flaky. We NEVER fail the build and NEVER overwrite
// a good snapshot with an empty one — if the API is down we keep the last good
// snapshot (scripts/blog-snapshot.json) and regenerate the TS from it.

import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const JSON_PATH = path.resolve(ROOT, "scripts/blog-snapshot.json");
const SLUGS_PATH = path.resolve(ROOT, "scripts/blog-slugs.json");
const TS_PATH = path.resolve(ROOT, "src/data/blogsSnapshot.ts");

async function readApiBaseUrl() {
  for (const f of [".env", ".env.local", ".env.example"]) {
    try {
      const content = await fs.readFile(path.resolve(ROOT, f), "utf8");
      for (const line of content.split(/\r?\n/)) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const [k, ...rest] = t.split("=");
        if (k.trim() === "VITE_API_BASE_URL" && rest.length) {
          const v = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
          if (v) return v;
        }
      }
    } catch {
      /* ignore */
    }
  }
  return "";
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {
    return null;
  }
}

/* ---- normalization (mirrors src/api/blogs.ts) ---- */

function pickString(...values) {
  for (const v of values) if (typeof v === "string" && v.trim()) return v.trim();
  return undefined;
}
function readMediaField(v) {
  if (typeof v === "string") return v.trim() || undefined;
  if (!v || typeof v !== "object") return undefined;
  return pickString(v.url, v.secure_url, v.imageUrl);
}
function resolveImage(raw, baseUrl) {
  const s = pickString(
    readMediaField(raw.photoUrl), readMediaField(raw.imageUrl), readMediaField(raw.photo),
    readMediaField(raw.thumbnailUrl), raw.bannerImageUrl, raw.blogImageUrl,
    raw.coverImageUrl, raw.bannerUrl,
  );
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const p = s.startsWith("/") ? s : `/${s}`;
  try { return new URL(p, baseUrl).toString(); } catch { return `${baseUrl}${p}`; }
}
function toMillis(value) {
  if (value == null) return undefined;
  if (typeof value === "number") return value < 1e12 ? value * 1000 : value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n < 1e12 ? n * 1000 : n;
    const d = new Date(value).getTime();
    return Number.isNaN(d) ? undefined : d;
  }
  if (typeof value === "object") {
    const sec = Number(value.seconds ?? value._seconds ?? value.sec ?? 0);
    const nanos = Number(value.nanos ?? value._nanoseconds ?? 0);
    if (!Number.isFinite(sec)) return undefined;
    return sec * 1000 + Math.floor(nanos / 1e6);
  }
  return undefined;
}
function publishedLine(millis) {
  if (millis == null || Number.isNaN(Number(millis))) return "Published on: —";
  const d = new Date(millis);
  return `Published on: ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}`;
}
function readTime(desc) {
  if (!desc || !desc.trim()) return "Article";
  const words = desc.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}
function parseList(v) {
  const out = [];
  for (const s of [v.keywords, v.keyword, v.tags, v.keyphrase]) {
    if (Array.isArray(s)) for (const i of s) { if (typeof i === "string") out.push(i); }
    else if (typeof s === "string") out.push(...s.split(","));
  }
  return [...new Set(out.map((x) => x.trim()).filter(Boolean))];
}
function slugify(raw, title, id) {
  const base = (raw.slug ?? "").trim() || title || id;
  return base.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
// Editors have pasted absolute URLs into the relative-link field, producing
// href="/https://procounsel.co.in/..." — a broken link for readers and a bogus
// route for the prerender crawler (it created a dist/https: directory).
function sanitizeBody(html) {
  return (html || "")
    .trim()
    .replace(/(href|src)=(["'])\/(https?:\/\/)/gi, "$1=$2$3");
}

function normalize(raw, baseUrl) {
  const id = String(raw.id ?? raw.blogId ?? raw._id ?? "");
  if (!id) return null;
  const title = (raw.title || "").trim() || "Untitled";
  const category = (raw.category || "").trim() || "General";
  const millis = toMillis(raw.publishedOnMillis) ?? toMillis(raw.publishedOn);
  const updatedAtMillis = toMillis(raw.updatedAtMillis) ?? toMillis(raw.updatedAt);
  return {
    id,
    slug: slugify(raw, title, id),
    title,
    metaTitle: (raw.metaTitle || "").trim() || title,
    author: (raw.publisherName || "").trim() || "—",
    publishedOn: publishedLine(millis),
    tag: category.replace(/_/g, " "),
    imageUrl: resolveImage(raw, baseUrl),
    readTime: readTime(raw.description),
    description: sanitizeBody(raw.description),
    category,
    keywords: parseList(raw),
    keyphrase: typeof raw.keyphrase === "string"
      ? raw.keyphrase.split(",").map((s) => s.trim()).filter(Boolean)
      : Array.isArray(raw.keyphrase) ? raw.keyphrase.filter((s) => typeof s === "string").map((s) => s.trim()).filter(Boolean) : [],
    publishedOnMillis: millis,
    ...(updatedAtMillis != null ? { updatedAtMillis } : {}),
  };
}

function parseListPayload(json) {
  if (Array.isArray(json)) return json;
  if (!json || typeof json !== "object") return [];
  for (const k of ["data", "blogs", "items", "content", "result", "payload"]) {
    if (Array.isArray(json[k])) return json[k];
  }
  return [];
}
function extractDetail(json) {
  if (!json || typeof json !== "object") return null;
  if (json.data && typeof json.data === "object" && !Array.isArray(json.data)) return json.data;
  return json;
}

async function getJson(url, timeoutMs = 30000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function withBodyCount(arr) {
  return arr.filter((b) => b.description && b.description.length > 40).length;
}

async function writeOutputs(blogs) {
  const banner = "// AUTO-GENERATED by scripts/generate-blog-snapshot.mjs — do not edit by hand.\n" +
    "// Build-time snapshot of published blogs so article pages ship crawlable\n" +
    "// content through the prerender. Live API refreshes this client-side.\n\n";
  const type =
    "export interface BlogSnapshotItem {\n" +
    "  id: string; slug: string; title: string; metaTitle: string;\n" +
    "  author: string; publishedOn: string; tag: string; imageUrl: string;\n" +
    "  readTime: string; description: string; category: string;\n" +
    "  keywords: string[]; keyphrase: string[]; publishedOnMillis?: number;\n" +
    "  updatedAtMillis?: number;\n" +
    "}\n\n";
  const ts = banner + type +
    `export const BLOGS_SNAPSHOT: BlogSnapshotItem[] = ${JSON.stringify(blogs, null, 2)};\n\n` +
    `export const BLOG_SNAPSHOT_SLUGS: string[] = ${JSON.stringify(blogs.map((b) => b.slug))};\n`;
  await fs.mkdir(path.dirname(TS_PATH), { recursive: true });
  await fs.writeFile(TS_PATH, ts, "utf8");
  await fs.writeFile(JSON_PATH, JSON.stringify(blogs, null, 2), "utf8");
  await fs.writeFile(SLUGS_PATH, JSON.stringify(blogs.map((b) => b.slug), null, 2), "utf8");
}

async function keepPrevious(prev, reason) {
  console.warn(`[blog-snapshot] ${reason} — keeping previous snapshot (${prev?.length ?? 0} blogs).`);
  if (prev && prev.length) {
    await writeOutputs(prev); // regenerate TS/slugs from the good JSON
  } else {
    await writeOutputs([]); // nothing yet — write empty so the import resolves
  }
}

async function main() {
  const baseUrl = await readApiBaseUrl();
  const prev = (await readJson(JSON_PATH)) || [];
  const prevMap = new Map(prev.map((b) => [b.id, b]));

  if (!baseUrl) {
    await keepPrevious(prev, "VITE_API_BASE_URL not set");
    return;
  }

  let listJson;
  try {
    listJson = await getJson(`${baseUrl}/api/blogs/list`);
  } catch (e) {
    await keepPrevious(prev, `blog list fetch failed (${e.message})`);
    return;
  }

  const listRows = parseListPayload(listJson);
  if (!listRows.length) {
    await keepPrevious(prev, "blog list empty");
    return;
  }

  const ids = listRows
    .map((r) => String(r.id ?? r.blogId ?? r._id ?? ""))
    .filter(Boolean);

  const blogs = [];
  for (const id of ids) {
    try {
      const detail = extractDetail(await getJson(`${baseUrl}/api/blogs/${encodeURIComponent(id)}`));
      const norm = detail ? normalize(detail, baseUrl) : null;
      if (norm && norm.description) {
        blogs.push(norm);
        continue;
      }
    } catch (e) {
      console.warn(`[blog-snapshot] detail ${id} failed (${e.message})`);
    }
    // Fall back to previous body, else the list meta (card still renders).
    const fallback = prevMap.get(id);
    if (fallback) {
      blogs.push(fallback);
    } else {
      const meta = normalize(listRows.find((r) => String(r.id ?? r.blogId ?? r._id) === id) || {}, baseUrl);
      if (meta) blogs.push(meta);
    }
  }

  // Guard: don't replace a body-rich snapshot with a body-less one.
  if (withBodyCount(blogs) === 0 && withBodyCount(prev) > 0) {
    await keepPrevious(prev, "fetched 0 bodies");
    return;
  }

  await writeOutputs(blogs);
  console.log(`[blog-snapshot] Wrote ${blogs.length} blogs (${withBodyCount(blogs)} with full body).`);
}

main().catch(async (e) => {
  console.warn(`[blog-snapshot] Unexpected error (${e.message}); keeping previous if any.`);
  const prev = (await readJson(JSON_PATH)) || [];
  try { await keepPrevious(prev, "unexpected error"); } catch { /* never fail the build */ }
});
