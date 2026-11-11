/**
 * The one place absolute procounsel.co.in URLs are built.
 *
 * Production is Cloudflare Pages serving the prerendered `dist/<route>/index.html`
 * files. For those, Cloudflare answers `/cat-counselling` with a 308 to
 * `/cat-counselling/` — so the trailing-slash form is the URL that actually
 * returns 200, and it is the form every canonical, og:url, JSON-LD url/@id and
 * sitemap <loc> must use. (Routes that are not prerendered fall through to the
 * SPA index.html and answer 200 on both forms, so the slash form is right for
 * them too.) Pointing a canonical at a redirect makes Google pick its own
 * canonical and treat the sitemap as a list of redirects.
 *
 * Plain `.mjs` so the Node build scripts (scripts/site-routes.mjs,
 * scripts/verify-crawlability.mjs) and the app import the same code.
 * Types live in siteUrl.d.mts.
 *
 * Internal <Link to="/foo"> navigation is unaffected: react-router matches
 * `/foo` and `/foo/` alike.
 */

export const SITE_ORIGIN = "https://procounsel.co.in";

// A path whose last segment is a real file keeps its exact form —
// `/sitemap.xml/` or `/og-image.png/` would 404.
const FILE_PATH = /\.(xml|txt|json|png|jpe?g|webp|gif|svg|ico|pdf|html?|js|css|woff2?)$/i;

const SAME_SITE = /^https?:\/\/(?:www\.)?procounsel\.co\.in(?=\/|$|[?#])/i;

/**
 * Normalise a site path to its served form: leading slash, no query/hash,
 * no duplicate slashes, and a trailing slash unless it is the root or a file.
 * Accepts an absolute procounsel.co.in URL as well.
 */
export function canonicalPath(input = "/") {
  let path = String(input ?? "").trim().replace(SAME_SITE, "");
  path = path.split(/[?#]/)[0];
  if (!path.startsWith("/")) path = `/${path}`;
  path = path.replace(/\/{2,}/g, "/");
  if (path === "/" || path.endsWith("/") || FILE_PATH.test(path)) return path;
  return `${path}/`;
}

/** Absolute, trailing-slash URL for a site path. The root is `https://procounsel.co.in/`. */
export function absoluteUrl(path = "/", origin = SITE_ORIGIN) {
  return `${String(origin).replace(/\/+$/, "")}${canonicalPath(path)}`;
}

/** `/foo/` -> `/foo`; the root stays `/`. For comparing links regardless of slash. */
export function stripTrailingSlash(path) {
  const stripped = String(path).replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
}
