import { useEffect, useRef, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { buildShareText, buildShareUrl, buildWhatsAppHref } from "@/lib/predictorShare";
import { trackEvent } from "@/lib/analytics";

type AnalyticsWindow = Window & { dataLayer?: Record<string, unknown>[] };

interface WhatsAppShareProps {
  /** Short, honest summary of the result on screen. No name/phone. */
  summary: string;
  /** Site path of the predictor page, e.g. "/neet-rank-predictor". */
  path: string;
  /** Predictor id used for utm_campaign and analytics, e.g. "neet_rank_predictor". */
  predictor: string;
  className?: string;
}

function track(event: string, predictor: string) {
  try {
    const w = window as AnalyticsWindow;
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event, predictor });
  } catch {
    // analytics must never break the page
  }
  trackEvent("share", {
    method: event === "predictor_share_whatsapp" ? "whatsapp" : "copy_link",
    content_type: "predictor_result",
    item_id: predictor,
  });
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.07c0 2 .52 3.95 1.52 5.67L.6 23.28l5.67-1.49a11.33 11.33 0 0 0 5.78 1.47h.01c6.25 0 11.34-5.09 11.35-11.35a11.28 11.28 0 0 0-3.33-8.03z" />
    </svg>
  );
}

/**
 * "Share on WhatsApp" for a predictor result, with a "Copy link" fallback.
 * Render only once a result exists.
 */
export default function WhatsAppShare({ summary, path, predictor, className = "" }: WhatsAppShareProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const shareUrl = buildShareUrl(path, predictor);
  const href = buildWhatsAppHref(buildShareText(summary, shareUrl));
  const copyUrl = buildShareUrl(path, predictor, "copy_link");

  const handleCopy = async () => {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(copyUrl);
        ok = true;
      }
    } catch {
      ok = false;
    }
    setCopyState(ok ? "copied" : "failed");
    if (ok) track("predictor_share_copy_link", predictor);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2500);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        onClick={() => track("predictor_share_whatsapp", predictor)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]/40"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Share on WhatsApp
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
      >
        {copyState === "copied" ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copyState === "copied" ? "Link copied" : "Copy link"}
      </button>
      {copyState === "failed" && (
        <span role="status" className="text-xs text-gray-500 break-all">
          Couldn't copy — link: {copyUrl}
        </span>
      )}
    </div>
  );
}
