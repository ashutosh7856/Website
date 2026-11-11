import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";

const QR_CODE_IMAGE_PATH = "/qr_procounsel.jpg";

export const BANNER_DISMISS_EVENT = "appBannerDismissed";

const DISMISSED_KEY = "pc_app_banner_dismissed";
// Appears once the visitor has scrolled past the first screen, so it never sits on
// top of a page's hero (the first thing anyone should read).
const SHOW_AFTER_SCROLL_PX = 700;

export default function AppInstallBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const isPromoPage = location.pathname === "/promo";

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {
      // sessionStorage unavailable (private mode) — fall through and show it.
    }
    const onScroll = () => {
      if (window.scrollY < SHOW_AFTER_SCROLL_PX) return;
      setIsVisible(true);
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Not persisted; it stays closed for this page view.
    }
    window.dispatchEvent(new CustomEvent(BANNER_DISMISS_EVENT));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {!isPromoPage && (
        <>
          {/* The mobile variant of this banner was a plain `hidden` block — no
              responsive variant, so it never became visible at any width. It
              still shipped its heading and copy into the HTML of every page,
              duplicating both strings site-wide for crawlers. Removed; the
              desktop card below is the only banner that ever rendered. */}
          <div className="hidden md:flex fixed bottom-6 left-6 z-40 bg-white shadow-xl rounded-lg p-2 max-w-sm border border-gray-100">
            <div className="relative flex gap-4">
              <button
                onClick={handleDismiss}
                className="absolute -top-2 -right-2 p-1 rounded-full hover:cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-500"
                aria-label="Dismiss app download banner"
              >
                <X size={16} />
              </button>

              <div className="shrink-0">
                <SmartImage
                  src={QR_CODE_IMAGE_PATH}
                  alt="Download the app QR code"
                  width={100}
                  height={100}
                  className="w-24 h-24 rounded-md bg-gray-100"
                />
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-800">
                    Exclusive Offers On App!
                  </h4>
                  <p className="text-sm text-gray-600">
                    Experience the features on the app from anywhere!.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
