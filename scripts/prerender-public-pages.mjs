import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { STATIC_ROUTES } from "./site-routes.mjs";

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

async function main() {
  const routes = STATIC_ROUTES;

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

  console.log(`[react-snap] Prerendered ${routes.length} public routes`);
}

main().catch((error) => {
  console.error("[react-snap] Prerender failed:", error);
  process.exit(1);
});
