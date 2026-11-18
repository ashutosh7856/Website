import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Cloudflare Pages counts every rule from the first dynamic (splat/placeholder)
// one onward against a 100-rule cap and silently ignores everything after it.
// That is exactly how half of this file once stopped applying in production.
const rules = readFileSync(resolve(__dirname, "../../public/_redirects"), "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [from, to, status] = l.split(/\s+/);
    return { from, to, status };
  });

const isDynamic = (from: string) => /\*|\/:[A-Za-z]/.test(from);

describe("public/_redirects", () => {
  it("keeps every dynamic rule after every static rule", () => {
    const firstDynamic = rules.findIndex((r) => isDynamic(r.from));
    const staticAfter = rules.slice(firstDynamic).filter((r) => !isDynamic(r.from));
    expect(staticAfter.map((r) => r.from)).toEqual([]);
  });

  it("stays under Cloudflare's 100 dynamic-rule cap", () => {
    expect(rules.filter((r) => isDynamic(r.from)).length).toBeLessThanOrEqual(100);
  });

  it("serves non-prerendered app routes with a 200, not the 404 page", () => {
    const ok = new Set(rules.filter((r) => r.status === "200").map((r) => r.from));
    for (const path of ["/promo", "/subscribe", "/pro-buddies/register", "/mba/dashboard", "/take-test/*", "/t/*"]) {
      expect(ok.has(path), path).toBe(true);
    }
  });

  it("never rewrites a prerendered section to the bare SPA shell", () => {
    // A rule beats a static file on Cloudflare Pages: "/x/*" -> /200 would
    // replace every prerendered /x/... page with an empty shell.
    const prerenderedPrefixes = ["/admissions", "/college-details", "/counsellor-details", "/counselling", "/mba-colleges", "/pro-buddies/listing", "/study-abroad"];
    const shellRules = rules.filter((r) => r.to === "/200");
    for (const r of shellRules) {
      for (const p of prerenderedPrefixes) {
        expect(r.from === p || r.from.startsWith(`${p}/`), `${r.from} shadows ${p}`).toBe(false);
      }
    }
  });
});
