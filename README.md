# ProCounsellor — Website

Opinionated README for the ProCounsellor front-end (Vite + React + TypeScript).

This repository contains the marketing and product front-end used by the ProCounsellor team. It's built with Vite, React (TS), Tailwind and several small UI utilities. The app is optimized for perceived performance (shimmer skeletons, lazy-loaded routes, and a SmartImage helper). This README covers how to run, build, and maintain the project.

## Quick links
- Node / OS: Linux (development notes assume zsh)
- Scripts: `dev`, `build`, `preview`, `lint`
- Main entry: `index.html` → `src/main.tsx`
- Router: `react-router-dom` (routes in `src/routes/AppRoutes.tsx`)

## Tech stack

- Vite (build & dev)
- React 19 + TypeScript
- Tailwind CSS
- react-router-dom (v7)
- Zustand (state), axios (API), embla-carousel (carousels)
- shadcn/ui, Radix primitives, lucide/react icons

## Local setup

Prerequisites

- Node.js (v18+ recommended)
- pnpm (the project pins it via `packageManager` in package.json; `corepack enable` picks up the right version)

Steps

1. Install dependencies

```bash
pnpm install
```

2. Run dev server (with network host enabled in package.json)

```bash
pnpm run dev
```

3. Open http://localhost:5173 or the host/port printed by Vite.

4. Build for production

```bash
pnpm run build
pnpm run preview   # serve the /dist for a quick smoke test
```

5. Lint

```bash
pnpm run lint
```

## Project structure (important files)

- `index.html` — app HTML; meta tags and critical preloads live here.
- `src/main.tsx` — app entry & router mounting.
- `src/routes/AppRoutes.tsx` — central route definitions; uses React.lazy for heavy pages.
- `src/components` — reusable components, cards, skeletons, layout and ui helpers.
  - `ui/SmartImage.tsx` — lightweight image helper used across the app (native lazy loading + optional preload for priority images).
  - `skeletons/CounselorSkeletons.tsx` — shimmer placeholders; sizes match the real counselor cards.
- `src/pages` — top-level pages (counselors, colleges, courses, dashboard, etc.)
- `public/` — static files copied to the build output.
- `vite.config.ts` — vite configuration (path aliases, plugins).

## Notable patterns & decisions

- Perceived performance: skeleton placeholders (`animate-shimmer`) are used while data loads. Skeletons mirror the real component sizes to avoid layout shifts.
- Image handling: `SmartImage` centralizes native lazy loading, `priority` preload links and width/height attributes to reduce CLS. For production, convert critical assets to responsive `srcset` or serve via a CDN that supports automatic format conversion (AVIF/WebP).
- Routing privacy: counselor profile navigation uses `navigate('/counselors/profile', { state: { id } })` to avoid exposing raw numeric IDs in the URL for internal navigations. Note: direct bookmarks to `/counselors/:id` remain supported for compatibility.
- Code-splitting: large listing and detail pages are lazy-loaded in `AppRoutes.tsx`.

## Troubleshooting

- Build EISDIR errors during `vite build`: this usually indicates Vite tried to read a path that is a directory (not a file) while transforming asset URLs. Check for accidental imports that resolve to `/` or `index.html` (look for literal `src="/"` or `href="/"`) or meta tags pointing at the site root. Ensure `index.html` is a file (not a directory) and `public/` doesn't contain directories with the same name as files.
- If TypeScript/JSX errors mention `Cannot find namespace 'JSX'` or unused `React` imports, ensure `tsconfig.json` has proper `jsx` settings (e.g., `"jsx": "react-jsx"`) and that types are installed (`@types/react`, `@types/react-dom`).
- Linting: run `pnpm run lint` and fix or autofix issues. The project uses ESLint with the React plugin.

## Contributing guidelines (local)

- Create feature branches from `develop`.
- Keep changes small and focused. Add tests where appropriate (unit or snapshot) and verify `pnpm run build` before opening a PR.
- If you introduce new images, prefer `SmartImage` or adding width/height to avoid CLS.

## Common developer tasks

- Add a new page: create a new component in `src/pages`, add a route in `src/routes/AppRoutes.tsx` (use React.lazy if page is heavy), and export the route.
- Add a new component: put it under `src/components/*`. Keep presentational components pure and typed.
- Replace a raw `<img>` with `SmartImage` and provide `width`/`height` props. Use `priority` for hero images only.

## Deployment notes

- The built assets are output to `dist/`. Static files in `public/` are copied as-is.
- For Netlify or Vercel, use the standard static hosting flow. If using client-side routing, ensure a fallback rewrite to `index.html` is configured (Netlify `_redirects` or `netlify.toml` already present).

## Useful commands quick reference

```bash
# install
pnpm install

# development
pnpm run dev

# production build
pnpm run build
pnpm run preview

# lint
pnpm run lint
```

## Where to look next

- `src/components/ui/SmartImage.tsx` — image optimization helper
- `src/components/skeletons/CounselorSkeletons.tsx` — updated skeleton sizing and shimmer
- `src/routes/AppRoutes.tsx` — see how pages are lazy-loaded

If you want, I can also:
- Add a short CONTRIBUTING.md and PR template.
- Add per-route meta handling with `react-helmet-async` for better SEO.
- Run a build and debug the EISDIR issue step-by-step if you still see it.

---
Generated README — feel free to tell me where to expand or what project-specific details you'd like added (branding copy, architecture diagrams, CI steps, etc.).
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
