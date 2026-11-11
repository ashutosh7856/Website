import { Helmet } from 'react-helmet-async';
import { absoluteUrl } from '@/lib/siteUrl.mjs';

const DEFAULT_IMAGE = absoluteUrl('/og-image.png');
const SITE_NAME = 'ProCounsel';

interface PageSEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: object | object[];
  keywords?: string;
}

export default function PageSEO({
  title,
  description,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  jsonLd,
  keywords,
}: PageSEOProps) {
  // Case-insensitive so a title already mentioning the brand (e.g. "Procounsel")
  // doesn't get "| ProCounsel" appended, producing a duplicate brand mention.
  const fullTitle = title.toLowerCase().includes(SITE_NAME.toLowerCase())
    ? title
    : `${title} | ${SITE_NAME}`;
  // Always the trailing-slash form Cloudflare Pages serves (see lib/siteUrl.mjs).
  // Without an explicit canonical, use the current path minus query/hash — a
  // ?utm_source=... must never become the canonical.
  const canonicalUrl = absoluteUrl(
    canonical ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
  );

  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {/* noindex still FOLLOWS: a thin listing page should not be indexed, but
          the real articles and profiles it links to must stay discoverable.
          nofollow here would strand them. */}
      <meta name="robots" content={noIndex ? 'noindex,follow' : 'index,follow,max-image-preview:large'} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
