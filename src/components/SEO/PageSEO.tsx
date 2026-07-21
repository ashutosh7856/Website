import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.procounsel.co.in';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
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
  const canonicalUrl = canonical
    ? `${SITE_URL}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
    : typeof window !== 'undefined'
    ? window.location.href
    : SITE_URL;

  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'} />
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
