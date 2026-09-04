/**
 * Types for `site-routes.mjs`, so TypeScript can import it.
 *
 * The module itself is plain `.mjs` on purpose: it is loaded by the sitemap and
 * prerender build steps, which run as bare Node with no compile step. That makes
 * it invisible to `tsc`, and the one place that matters is
 * `src/test/counsellingSlugs.test.ts` — the test that stops the slug lists in
 * here, in `src/lib/counsellingSlugs.ts` and in the page data from drifting
 * apart. Without a declaration that import fails the build with TS7016.
 *
 * Only what a TypeScript caller actually uses is declared. The build scripts
 * import the rest from JavaScript and need nothing here.
 */

export declare const SITE_URL: string;
export declare const COUNSELLING_EXAM_SLUGS: string[];
export declare const COUNSELLING_CATEGORY_SLUGS: string[];
export declare const STATIC_ROUTES: string[];
export declare const SITEMAP_EXCLUDED_ROUTES: Set<string>;

export declare function toSlug(value: string): string;
export declare function encodeCounselorId(id: string): string;
export declare function getPrerenderRoutes(): string[];
export declare function getPublicRoutes(): Promise<string[]>;
