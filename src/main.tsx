import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { dropPrerenderedSeoWhenReplaced } from './lib/prerenderedSeo'
import { initAnalytics } from './lib/analytics'

// Cloudflare Pages serves every prerendered page at its trailing-slash URL
// (/about → /about/), but pages are prerendered — and route/path checks are
// written — without the slash. Normalise before React reads the location so the
// first render matches the prerendered HTML instead of failing hydration.
const { pathname, search, hash } = window.location
if (pathname.length > 1 && pathname.endsWith('/')) {
  window.history.replaceState(window.history.state, '', pathname.replace(/\/+$/, '') + search + hash)
}

// GA4 property on the existing gtag.js loader, only when VITE_GA4_MEASUREMENT_ID is set.
initAnalytics()

const rootElement = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, app)
  // Retires the prerendered <head> tags as React replaces them, so each page
  // ends up with exactly one title, canonical and description instead of two.
  // See the module for why this waits rather than deleting them outright.
  dropPrerenderedSeoWhenReplaced()
} else {
  createRoot(rootElement).render(app)
}
