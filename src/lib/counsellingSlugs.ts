/**
 * The counselling landing-page slugs, and nothing else.
 *
 * ─── Why these are literals and not derived ─────────────────────────────────
 *
 * `COUNSELLING_CATEGORY_SLUGS` and `COUNSELLING_EXAM_SLUGS` already exist in
 * `counsellingCategories.ts` / `counsellingExams.ts` as `.map((c) => c.slug)`
 * over the full page data. Deriving them means the data has to exist to compute
 * them — so `AppRoutes`, which needs only the slugs to register a route each,
 * pulled 166 KB of page copy into the EAGER entry chunk. Every visitor to the
 * home page downloaded all five category pages and all eight exam pages before
 * anything rendered.
 *
 * The route table needs thirteen strings. It gets thirteen strings, and the
 * copy now loads with the lazy page that renders it.
 *
 * ─── Keeping them honest ────────────────────────────────────────────────────
 *
 * This is the third copy of these lists — `scripts/site-routes.mjs` holds one
 * too, because a `.mjs` build script cannot import a `.ts` module. All three
 * are pinned together by `src/test/counsellingSlugs.test.ts`, which fails if
 * any of them drifts. A slug added to the data and not here would 404; a slug
 * here and not in the data would render an empty page; either is caught before
 * it ships.
 *
 * Routes are registered one slug at a time rather than as a `/:category`
 * catch-all on purpose — see the comment at the call site in AppRoutes. An
 * unknown top-level path must still 404.
 */

export const COUNSELLING_CATEGORY_SLUGS = [
  'engineering-counselling',
  'medical-counselling',
  'mba-counselling',
  'law-counselling',
  'career-counselling',
] as const;

export const COUNSELLING_EXAM_SLUGS = [
  'mht-cet-counselling',
  'comedk-counselling',
  'jee-counselling',
  'wbjee-counselling',
  'srmjeee-counselling',
  'met-counselling',
  'cat-counselling',
  'xat-counselling',
] as const;
