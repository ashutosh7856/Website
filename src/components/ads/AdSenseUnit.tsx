import { useEffect } from "react";

const ADSENSE_CLIENT = "ca-pub-9093773137987991";
const CONTENT_AD_SLOT = "2659976369";
const LIVE_HOSTS = new Set(["procounsel.co.in", "www.procounsel.co.in"]);

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}
interface AdSenseUnitProps {
  className?: string;
}

/**
 * The single manual AdSense unit used on editorial and predictor pages.
 *
 * Auto ads are disabled in AdSense, so merely loading the global AdSense
 * script in index.html cannot put ads on the home page, forms, checkout or
 * dashboards. An ad can appear only where this component is deliberately
 * rendered.
 *
 * The push is production/domain gated so local development, preview deploys
 * and the build-time prerender never create invalid publisher traffic.
 */
export default function AdSenseUnit({ className = "" }: AdSenseUnitProps) {
  useEffect(() => {
    if (!import.meta.env.PROD || !LIVE_HOSTS.has(window.location.hostname)) return;
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      // An ad blocker or a failed third-party script must never break the page.
      console.warn("[ProCounsel] AdSense unit could not initialise", error);
    }
  }, []);

  return (
    <aside
      className={`mx-auto w-full max-w-[1100px] px-4 py-5 sm:px-6 ${className}`}
      aria-label="Advertisement"
    >
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
        Advertisement
      </p>
      <ins
        className="adsbygoogle min-h-[90px]"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={CONTENT_AD_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
