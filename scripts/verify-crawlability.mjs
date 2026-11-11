import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { SITE_ORIGIN, stripTrailingSlash } from "../src/lib/siteUrl.mjs";

/**
 * Every URL we submit in the sitemap must also be reachable by following a real
 * <a href> from some other prerendered page.
 *
 * A sitemap-only URL — one with no inbound internal link — gets the lowest
 * crawl priority Google assigns, and stalls in "Discovered - currently not
 * indexed" indefinitely. That is how ~200 detail pages on this site ended up
 * unindexed: the cards linking to them were <div onClick={navigate(...)}>,
 * which a crawler cannot follow, and the listing pages rendered their error
 * state during the prerender because the API is blocked at build time.
 *
 * Run after `npm run build`. Exits non-zero if any sitemap URL is orphaned.
 */

const DIST = path.resolve("dist");
const ORIGIN = SITE_ORIGIN;

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const sitemap = await readFile(path.join(DIST, "sitemap.xml"), "utf8");
const sitemapPaths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
  // Sitemap <loc>s carry a trailing slash and internal hrefs usually do not;
  // compare both sides slash-stripped so either form counts as a link.
  .map((m) => stripTrailingSlash(m[1].replace(ORIGIN, "").trim()))
  .filter((p) => p && p !== "/");

const pages = await htmlFiles(DIST);
const linked = new Set();
const linkedFrom = new Map();

for (const file of pages) {
  const html = await readFile(file, "utf8");
  const self = "/" + path.relative(DIST, file).replace(/\/?index\.html$/, "");
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = stripTrailingSlash(m[1]);
    if (href === self) continue; // self-links do not count as a crawl path
    linked.add(href);
    if (!linkedFrom.has(href)) linkedFrom.set(href, self);
  }
}

const orphans = sitemapPaths.filter((p) => !linked.has(p));

const byType = (p) => {
  const seg = p.split("/").filter(Boolean);
  if (p.startsWith("/counsellor-details/")) return "counsellor-details";
  if (p.startsWith("/college-details/")) return "college-details";
  if (p.startsWith("/admissions/deadlines/")) return "deadlines";
  if (p.startsWith("/admissions/blogs/")) return "blogs";
  if (p.startsWith("/counselling/")) return "counselling-city";
  return seg[0] ? `/${seg[0]}` : "/";
};

const counts = {};
for (const p of sitemapPaths) {
  const t = byType(p);
  counts[t] ??= { total: 0, orphan: 0 };
  counts[t].total++;
  if (!linked.has(p)) counts[t].orphan++;
}

console.log(`[crawlability] ${pages.length} prerendered pages, ${sitemapPaths.length} sitemap URLs\n`);
console.log("  page type                total   linked   orphaned");
console.log("  ----------------------  ------  -------  --------");
for (const [type, c] of Object.entries(counts).sort()) {
  const flag = c.orphan > 0 ? "  <== ORPHANED" : "";
  console.log(
    `  ${type.padEnd(22)}  ${String(c.total).padStart(6)}  ${String(c.total - c.orphan).padStart(7)}  ${String(c.orphan).padStart(8)}${flag}`,
  );
}

if (orphans.length) {
  console.error(`\n[crawlability] FAIL — ${orphans.length} sitemap URL(s) have no inbound internal link:`);
  for (const p of orphans.slice(0, 25)) console.error(`  ${p}`);
  if (orphans.length > 25) console.error(`  ...and ${orphans.length - 25} more`);
  process.exit(1);
}

console.log(`\n[crawlability] OK — every sitemap URL is reachable by a real <a href>.`);
