import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { getPrerenderRoutes } from "./site-routes.mjs";

const require = createRequire(import.meta.url);

// react-snap bundles an ancient Chromium (puppeteer 1.20). Prefer a modern
// system Chrome/Chromium when one is available — far more reliable to launch.
if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
  const candidates = [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((p) => existsSync(p));
  if (found) {
    process.env.PUPPETEER_EXECUTABLE_PATH = found;
    console.log(`[react-snap] Using system Chrome: ${found}`);
  }
}

const { run } = require("react-snap");

/**
 * Collapses the prerender's relayed browser console into one summary.
 *
 * react-snap pipes every `console.*` from every prerendered page to stdout,
 * prefixed "💬 console.log at <route>:" whatever the original method was. On a
 * full run that is ~2,500 lines out of ~3,100, and almost all of it is one
 * message: `Failed to load resource: net::ERR_FAILED`, which is Chrome
 * reporting a request that `skipThirdPartyRequests: true` blocked ON PURPOSE.
 * The rest are our own `console.error` calls reacting to those same blocked
 * fetches — also expected, and already handled by the snapshot fallbacks.
 *
 * None of it is wrong, and all of it drowned the things that are: the "404 page
 * title" warning and the crawlability report were somewhere in the scroll.
 *
 * So these lines are tallied rather than printed, and the tally is printed at
 * the end — nothing is hidden, it is just counted. Only messages carrying
 * react-snap's own console prefix are touched; its warnings, its `🔥 error at`
 * lines and every page error still print immediately and in full.
 *
 * PRERENDER_VERBOSE=1 restores the raw firehose when a page is misbehaving and
 * you need to see which route said what.
 */
function quietRelayedConsole() {
  if (process.env.PRERENDER_VERBOSE === "1") return () => {};

  const original = console.log;
  const tally = new Map();
  const RELAYED = /^\s*(?:️)*💬\s+console\.log at (\S+):\s*([\s\S]*)$/;

  console.log = (...args) => {
    const first = typeof args[0] === "string" ? args[0] : "";
    const match = RELAYED.exec(first);
    if (!match) return original(...args);

    const message = [match[2], ...args.slice(1)]
      .filter((part) => part !== undefined && part !== "")
      .join(" ")
      .trim();
    tally.set(message, (tally.get(message) ?? 0) + 1);
  };

  return () => {
    console.log = original;
    const total = [...tally.values()].reduce((sum, n) => sum + n, 0);
    if (!total) return;

    original(
      `\n[react-snap] ${total} console message(s) from the prerendered pages, ` +
        `grouped (PRERENDER_VERBOSE=1 for the raw output):`,
    );
    for (const [message, count] of [...tally].sort((a, b) => b[1] - a[1])) {
      const short = message.length > 96 ? `${message.slice(0, 93)}...` : message;
      original(`  ${String(count).padStart(5)} x  ${short}`);
    }
    original(
      "  ^ 'net::ERR_FAILED' is skipThirdPartyRequests blocking the API, which is\n" +
        "    deliberate — the pages render from the build-time snapshots instead.\n",
    );
  };
}

async function main() {
  const routes = getPrerenderRoutes();
  const restoreConsole = quietRelayedConsole();

  try {
    await run({
      source: "dist",
      include: routes,
      crawl: true,
      publicPath: "/",
      // Keep third-party (incl. the app's own Cloud Run API) blocked: relying on
      // that backend at build time is unreliable (it 503s/cold-starts), which
      // would silently ship a home page without prerendered content.
      skipThirdPartyRequests: true,
      waitFor: 2000,
      // Chrome's SUID sandbox often can't launch on Linux/CI ("No usable sandbox!").
      // Disable it for this build-time prerender (safe: we only render our own dist).
      puppeteerArgs: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  } finally {
    // In `finally` so a failed prerender still prints what the pages said —
    // that tally is exactly what you need when it is the pages that broke.
    restoreConsole();
  }

  console.log(`[react-snap] Prerendered ${routes.length} public routes`);
}

main().catch((error) => {
  console.error("[react-snap] Prerender failed:", error);
  process.exit(1);
});
