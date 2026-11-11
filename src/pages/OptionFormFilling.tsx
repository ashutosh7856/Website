import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Check,
  Loader2,
  Lock,
  ShieldCheck,
  Wallet,
  X,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { optionFormContent } from "@/components/SEO/seoContent";
import { useAuthStore } from "@/store/AuthStore";
import startRecharge from "@/api/wallet";
import { getLoggedInPhone, formatPhoneForRazorpay } from "@/lib/phone";
import {
  OPTION_FORM_PRICE,
  payOptionFormFromWallet,
  registerOptionForm,
  type OptionFormRequirement,
} from "@/api/optionForm";
import { absoluteUrl } from "@/lib/siteUrl.mjs";

type RazorpayConstructor = new (opts: unknown) => { open: () => void };

const STATES = [
  "Maharashtra", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir",
  "Ladakh", "Lakshadweep", "Puducherry",
];

/**
 * Launch offer. The struck-through figure is the standard fee; the timer below
 * is what makes it an offer rather than just a lower price.
 *
 * Ends 31 July 2026, 12:00 AM IST. Move this date to extend the offer — the
 * countdown, the banner and the strike-through all read from it, and everything
 * quietly reverts to the plain price once it passes.
 */
const OFFER_ENDS_AT = Date.parse("2026-07-31T00:00:00+05:30");

const PLANS: {
  id: OptionFormRequirement;
  name: string;
  price: number;
  mrp: number;
  tagline: string;
  includes: string[];
}[] = [
  {
    id: "NEW",
    name: "Full option form",
    price: OPTION_FORM_PRICE.NEW,
    mrp: 6000,
    tagline: "We build your preference list from scratch.",
    includes: [
      "Call or WhatsApp within 4 hours of payment",
      "Complete choice list, ordered college by college",
      "Filled and verified with you before you lock it",
    ],
  },
  {
    id: "REVISED",
    name: "Form revision",
    price: OPTION_FORM_PRICE.REVISED,
    mrp: 4000,
    tagline: "You already have a list. We fix the order.",
    includes: [
      "Call or WhatsApp within 4 hours of payment",
      "Line-by-line review of your existing choices",
      "Reordering based on this year's cutoff movement",
      "Missing colleges and branches added",
    ],
  },
];

// The hero's signature element: a preference list that reorders itself once on
// load. Numbering is honest here — an option form IS an ordered list, and the
// order is the entire product.
const CHOICES_BEFORE = [
  { college: "GCOE Amravati", branch: "Mechanical Engineering" },
  { college: "SPIT Mumbai", branch: "Computer Engineering" },
  { college: "COEP Pune", branch: "Computer Engineering" },
  { college: "VJTI Mumbai", branch: "Information Technology" },
  { college: "PICT Pune", branch: "Electronics & Telecom" },
];
const CHOICES_AFTER = [
  CHOICES_BEFORE[2],
  CHOICES_BEFORE[3],
  CHOICES_BEFORE[1],
  CHOICES_BEFORE[4],
  CHOICES_BEFORE[0],
];

const MISTAKES = [
  {
    title: "Safe colleges left off the list",
    body: "Students fill fifteen dream choices and stop. One bad round and there is nothing below to catch you.",
  },
  {
    title: "Order copied from a rank list",
    body: "College reputation is not the same as your admission chance. The order has to follow your percentile and category, not a magazine ranking.",
  },
  {
    title: "Home university seats ignored",
    body: "Your home university quota is the cheapest seat you will ever get. Most forms bury it below outside choices that will never open.",
  },
];

const STEPS = [
  { label: "Register", body: "Enter your marks, percentile or rank and your domicile below, then complete the payment." },
  { label: "We call you", body: "Within 4 hours an MHT-CET counsellor reaches you on call or WhatsApp to understand your branch priority, budget and location limits." },
  { label: "Draft list", body: "You get a full choice list, ordered and explained — why each college sits where it sits." },
  { label: "Lock it in", body: "We fill and verify the form with you, well before the CAP deadline." },
];

const rupees = (value: number) => `₹${value.toLocaleString("en-IN")}`;

const FAQS = [
  {
    q: "What is MHT-CET option form filling?",
    a: "After the MHT-CET result, admission happens through CAP rounds. You submit an option form — an ordered list of college and branch choices. The order decides which seat you get, so a student with a lower percentile and a smarter list often lands a better college than someone above them.",
  },
  {
    q: "What happens after I pay?",
    a: "Our counsellor will contact you on call or WhatsApp within 4 hours of your payment, on the number you register with. They understand your priorities, build your choice list in order, and fill and verify the form with you before the deadline.",
  },
  {
    q: "How much does it cost?",
    a: `A full option form built from scratch is ${rupees(OPTION_FORM_PRICE.NEW)}. If you have already filled a form and want an expert to correct and reorder it, a revision is ${rupees(OPTION_FORM_PRICE.REVISED)}. Both are one-time payments.`,
  },
  {
    q: "How do I pay?",
    a: "The amount is taken from your ProCounsel wallet. If your balance is short, add money on the same page with any UPI app, card or netbanking — the amount is then deducted straight away and your registration is confirmed.",
  },
  {
    q: "I have already filled my form. Can you correct it?",
    a: "Yes — that is what the revision is for. A counsellor reviews your existing list line by line, adds colleges and branches you have missed, and corrects the order against this year's cutoff movement.",
  },
];

export default function OptionFormFilling() {
  const user = useAuthStore((s) => s.user);
  const userId = useAuthStore((s) => s.userId);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const toggleLogin = useAuthStore((s) => s.toggleLogin);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  // A first-time student is sent through onboarding / profile completion after
  // the OTP. Payment has to wait for those to finish, not be dropped.
  const needsOnboarding = useAuthStore((s) => s.needsOnboarding);
  const needsProfileCompletion = useAuthStore((s) => s.needsProfileCompletion);
  const isProfileCompletionOpen = useAuthStore((s) => s.isProfileCompletionOpen);
  const reduceMotion = useReducedMotion();

  const [plan, setPlan] = useState<OptionFormRequirement>("NEW");
  // Until a plan is actually picked, showing one plan's price would hide the
  // other. The phone bar stays a "choose" prompt up to that point.
  const [hasChosenPlan, setHasChosenPlan] = useState(false);
  const [name, setName] = useState("");
  const [marks, setMarks] = useState("");
  const [stateDomicile, setStateDomicile] = useState("Maharashtra");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "paying" | "done">("idle");
  const [sorted, setSorted] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [msLeft, setMsLeft] = useState(() => OFFER_ENDS_AT - Date.now());

  const resumeAfterAuthRef = useRef(false);
  const formRef = useRef<HTMLDivElement>(null);

  const price = OPTION_FORM_PRICE[plan];
  const balance = user?.walletAmount ?? 0;
  // The reorder is a desktop flourish. On a phone the same motion reads as rows
  // jumping around a cramped card, so small screens get the finished list.
  const animateReorder = isWide && !reduceMotion;
  const choices = sorted || !animateReorder ? CHOICES_AFTER : CHOICES_BEFORE;

  // Prefill from the logged-in profile so a returning student only picks a plan.
  // The phone is overwritten rather than merely defaulted: the registration is
  // created under the login number, so showing any other number would be a lie.
  useEffect(() => {
    if (!user) return;
    setName((prev) => prev || `${user.firstName || ""} ${user.lastName || ""}`.trim());
    const loginPhone = (getLoggedInPhone() || user.phoneNumber || "").replace(/\D/g, "").slice(-10);
    if (loginPhone) setPhone(loginPhone);
  }, [user]);

  /**
   * Someone opening a shared link is asked to log in on arrival.
   *
   * The login card opens OVER the page — the page still renders underneath, so
   * Google, the sitemap prerender and link previews all see the full content.
   * The prerender crawler itself is skipped so the built HTML stays clean.
   */
  const isReactSnap = typeof navigator !== "undefined" && navigator.userAgent === "ReactSnap";
  const authLoading = useAuthStore((s) => s.loading);
  useEffect(() => {
    // Wait for the store to rehydrate, or it prompts a logged-in student too.
    if (isReactSnap || authLoading || isAuthenticated) return;
    toggleLogin();
    // Once, on arrival — not every time the login card is dismissed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  // Ticks once a second while the offer is live, then stops for good.
  useEffect(() => {
    if (msLeft <= 0) return;
    const timer = setInterval(() => setMsLeft(OFFER_ENDS_AT - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [msLeft]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || !isWide) return;
    const timer = setTimeout(() => setSorted(true), 1400);
    return () => clearTimeout(timer);
  }, [reduceMotion, isWide]);

  // Phone users are most of this page's traffic and the pay button sits far
  // below the fold, so once they scroll past the hero the price and CTA follow
  // them down the page.
  useEffect(() => {
    const onScroll = () => setShowStickyBar(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const validationError = useMemo(() => {
    if (!name.trim()) return "Enter your full name.";
    const scoreValue = Number(marks);
    if (!marks.trim() || Number.isNaN(scoreValue) || scoreValue <= 0)
      return "Enter your MHT-CET marks, percentile or rank.";
    if (!stateDomicile) return "Select your state of domicile.";
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10))) return "Enter a 10-digit phone number.";
    return null;
  }, [name, marks, stateDomicile, phone]);

  /**
   * The wallet is credited by the payment webhook, so the money does not always
   * show up on the very first read after Razorpay returns. Poll for it instead
   * of failing with "couldn't fetch funds" the moment it isn't there yet.
   */
  const waitForWalletCredit = async (target: number): Promise<boolean> => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const fresh = await refreshUser(true);
      // refreshUser logs the user out if the profile call fails, so a null here
      // means the session is gone — polling on would be pointless and would
      // leave the student staring at a spinner.
      if (!fresh) {
        throw new Error(
          "Your payment went through, but we lost your login on this device. Log in again and tap Pay — the money is in your wallet, you won't be charged twice."
        );
      }
      if ((fresh.walletAmount ?? 0) >= target) return true;
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
    return false;
  };

  /**
   * Charges the shortfall on Razorpay and resolves only once that money is
   * actually visible in the wallet, so the caller can debit straight after.
   */
  const topUpWallet = async (walletId: string, amount: number, target: number) => {
    const order = await startRecharge(walletId, amount);
    if (!order || typeof order === "string" || !order.orderId) {
      throw new Error("Could not start the payment. Please try again.");
    }

    await new Promise<void>((resolve, reject) => {
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ProCounsel",
        description:
          plan === "NEW" ? "MHT-CET option form filling" : "MHT-CET option form revision",
        prefill: {
          contact: formatPhoneForRazorpay(getLoggedInPhone()),
          email: user?.email || "",
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        },
        notes: { userId: walletId, service: "mhtcet-option-form" },
        handler: () => {
          void (async () => {
            const credited = await waitForWalletCredit(target);
            if (credited) {
              resolve();
              return;
            }
            reject(
              new Error(
                "Payment went through but your balance hasn't updated yet. Give it a minute and tap Pay again — you won't be charged twice."
              )
            );
          })();
        },
        modal: { ondismiss: () => reject(new Error("Payment cancelled.")) },
        theme: { color: "#FA660F" },
      };

      const Rz = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
      new Rz(options).open();
    });
  };

  const runPayment = async () => {
    // One identity throughout: the backend finds the wallet AND the registration
    // row from this same id, so the registration must be created under the
    // logged-in phone or the payment call won't find it.
    const walletId = getLoggedInPhone() || userId;
    if (!walletId) {
      // Open the login sheet rather than just telling them to log in.
      toast.error("Please log in to continue.");
      toggleLogin();
      return;
    }

    setStatus("paying");
    try {
      // registerOptionForm is idempotent — on a retry the row is already there,
      // so it makes no request and we resume at the payment step.
      await registerOptionForm({
        name: name.trim(),
        marks: Number(marks),
        stateDomicile,
        phoneNumber: walletId,
        optionFormRequirement: plan,
      });

      // Read the balance from the server, not the cached profile. A cached
      // number here would charge the wrong amount, so a failed read aborts
      // rather than guesses.
      const fresh = await refreshUser(true);
      if (!fresh) {
        toggleLogin();
        throw new Error("We couldn't read your account just now. Log in again and tap Pay.");
      }
      const shortfall = price - (fresh.walletAmount ?? 0);

      if (shortfall > 0) {
        // Straight to Razorpay for exactly what's missing — no separate
        // "add money to your wallet" detour.
        await topUpWallet(walletId, shortfall, price);
      }

      // Deducts and marks the registration paid in one call, so it can no
      // longer half-succeed. Deliberately not retried: a repeat could deduct
      // twice unless the backend makes it idempotent.
      await payOptionFormFromWallet(walletId, price);

      await refreshUser(true);
      setStatus("done");
      setSuccessOpen(true);
      toast.success("Payment received. Our counsellor will contact you within 4 hours.");
    } catch (error) {
      console.error("Option form payment failed:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setStatus("idle");
    }
  };

  const handlePay = () => {
    if (status === "paying") return;
    if (validationError) {
      toast.error(validationError);
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!isAuthenticated) {
      // Login opens over this page — no navigation, so nothing typed is lost.
      // The resume flag (not the login callback alone) is what carries the
      // payment through: a brand-new student goes on to onboarding and profile
      // completion, and the store's onLoginSuccess never fires for them.
      resumeAfterAuthRef.current = true;
      // The login card sits below the sheet in the stacking order, so the sheet
      // steps aside; the resume effect brings it back.
      setSheetOpen(false);
      toggleLogin();
      return;
    }
    runPayment();
  };

  // Resume the payment once the student is through every auth step.
  useEffect(() => {
    if (!resumeAfterAuthRef.current) return;
    if (!isAuthenticated) return;
    if (needsOnboarding || needsProfileCompletion || isProfileCompletionOpen) return;
    if (status !== "idle") return;

    resumeAfterAuthRef.current = false;
    if (!isWide) setSheetOpen(true);
    const timer = setTimeout(() => runPayment(), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, needsOnboarding, needsProfileCompletion, isProfileCompletionOpen, status]);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  /**
   * Login gate for the checkout buttons — NOT for the page. The route stays
   * public so it keeps ranking; only starting a purchase needs an account, which
   * is what keeps the registration on the same number they logged in with.
   * Returns false when it opened the login card instead.
   */
  const requireLogin = () => {
    if (isAuthenticated) return true;
    setSheetOpen(false);   // the login card sits below the sheet
    toggleLogin();
    return false;
  };

  /**
   * Phone users can't see the plan cards and the detail fields at the same time,
   * so on small screens checkout is a sheet that holds both. Desktop keeps the
   * side-by-side panel and just scrolls to it.
   */
  const startCheckout = () => {
    if (!requireLogin()) return;
    // On a phone, send them to the plans first — the details sheet only opens
    // once they've actually picked one.
    if (typeof window !== "undefined" && window.innerWidth < 1024 && hasChosenPlan) {
      setSheetOpen(true);
      return;
    }
    scrollToForm();
  };

  /** Picking a plan on the page is what opens the details sheet on mobile. */
  const choosePlan = (id: OptionFormRequirement) => {
    if (!requireLogin()) return;
    setPlan(id);
    setHasChosenPlan(true);
    if (typeof window !== "undefined" && window.innerWidth < 1024) setSheetOpen(true);
  };

  useEffect(() => {
    if (status === "done") setSheetOpen(false);
  }, [status]);

  // Hold the page still behind the sheet.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sheetOpen]);

  const offerLive = msLeft > 0;
  const countdown = (() => {
    const total = Math.max(0, Math.floor(msLeft / 1000));
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
      h: pad(Math.floor(total / 3600)),
      m: pad(Math.floor((total % 3600) / 60)),
      s: pad(total % 60),
    };
  })();

  // Quiet on the dark hero — a thin line of text, not a coloured slab.
  const offerTimer = offerLive ? (
    <span className="inline-flex items-center gap-2 text-[13px] text-white/50">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      Offer ends in
      <span className="font-['Montserrat'] font-semibold tabular-nums text-white/80">
        {countdown.h}:{countdown.m}:{countdown.s}
      </span>
    </span>
  ) : null;

  const fieldClass =
    "mt-1.5 h-11 w-full rounded-xl border border-[#E4E7F1] bg-[#FAFBFF] px-3.5 text-[15px] text-[#0B1020] outline-none transition-colors placeholder:text-[#A8AEC6] focus:border-[#FA660F] focus:bg-white";
  const labelClass = "text-[12px] font-medium text-[#5A6180]";

  // Shared between the desktop panel and the mobile sheet — one set of fields,
  // one piece of state, rendered in whichever surface fits the screen.
  const detailFields = (
    <div
      className="space-y-4"
      // The desktop panel sits open on the page, so the fields are reachable
      // without pressing any button. Touching one asks for login first.
      onPointerDownCapture={(e) => { if (!requireLogin()) e.preventDefault(); }}
    >
      <label className="block">
        <span className={labelClass}>Full name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="As per your MHT-CET application"
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        {/* One number, whichever the student knows — the counsellor sorts out
            which it is on the call. The API carries it as `marks`. */}
        <label className="block">
          <span className={labelClass}>Marks, percentile or rank</span>
          <input
            value={marks}
            onChange={(e) => setMarks(e.target.value.replace(/[^\d.]/g, ""))}
            inputMode="decimal"
            placeholder="e.g. 142 or 98.6"
            className={`${fieldClass} tabular-nums`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>
            Phone {isAuthenticated && <span className="text-[#8189A6]">(your login number)</span>}
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="10-digit number"
            readOnly={isAuthenticated}
            className={`${fieldClass} tabular-nums ${isAuthenticated ? "text-[#5A6180]" : ""}`}
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClass}>State of domicile</span>
        <select
          value={stateDomicile}
          onChange={(e) => setStateDomicile(e.target.value)}
          className={`${fieldClass} px-3 cursor-pointer`}
        >
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  const summaryBox = (
    <div className="rounded-2xl bg-[#F6F7FB] p-4">
      <div className="flex items-center justify-between text-[13px] text-[#5A6180]">
        <span>{plan === "NEW" ? "Full option form" : "Form revision"}</span>
        <span className="font-semibold tabular-nums text-[#0B1020]">{rupees(price)}</span>
      </div>
      {isAuthenticated && (
        <div className="mt-2 flex items-center justify-between text-[13px] text-[#5A6180]">
          <span className="inline-flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Wallet balance
          </span>
          <span
            className={`font-semibold tabular-nums ${
              balance < price ? "text-[#D9480F]" : "text-[#12A150]"
            }`}
          >
            {rupees(balance)}
          </span>
        </div>
      )}
    </div>
  );

  const payButton = (
    <button
      type="button"
      onClick={handlePay}
      disabled={status === "paying"}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FA660F] text-[15px] font-semibold text-white transition-colors hover:bg-[#e25a0b] disabled:cursor-not-allowed disabled:bg-[#F3B48D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FA660F] cursor-pointer"
    >
      {status === "paying" ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Processing…
        </>
      ) : (
        <>Pay {rupees(price)}</>
      )}
    </button>
  );

  const payFootnote = (
    <p className="text-center text-[12px] leading-relaxed text-[#8189A6]">
      {isAuthenticated
        ? "Pay by UPI, card or netbanking — the payment window opens right here."
        : "You'll be asked to log in here — nothing you typed is lost."}
    </p>
  );

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "MHT-CET option form filling",
    name: "MHT-CET Option Form Filling by ProCounsel",
    description:
      "Expert MHT-CET CAP round option form filling and revision. A counsellor builds and orders your college preference list and fills the form with you before the deadline.",
    provider: {
      "@type": "Organization",
      name: "ProCounsel",
      url: absoluteUrl("/"),
      telephone: "+91-7004789484",
    },
    areaServed: { "@type": "State", name: "Maharashtra" },
    url: absoluteUrl("/mhtcet-option-form-filling"),
    offers: PLANS.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: String(p.price),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/mhtcet-option-form-filling"),
    })),
  };

  // One FAQPage for the page, covering both the buying questions above the fold
  // and the process questions in the guide below — duplicate FAQPage blocks on a
  // single URL are ignored by Google.
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      ...FAQS.map((f) => ({ question: f.q, answer: f.a })),
      ...optionFormContent.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    ].map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Admissions",
        item: absoluteUrl("/admissions"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "MHT-CET Option Form Filling",
        item: absoluteUrl("/mhtcet-option-form-filling"),
      },
    ],
  };

  return (
    <>
      <PageSEO
        title="MHT-CET Option Form Filling 2026 — Expert CAP Round Choice Filling Help"
        description={`Get your MHT-CET option form filled by an admission counsellor. Full preference list built from scratch at ${rupees(OPTION_FORM_PRICE.NEW)}, or an expert revision of your existing form at ${rupees(OPTION_FORM_PRICE.REVISED)}. A counsellor contacts you on call or WhatsApp within 4 hours.`}
        canonical="/mhtcet-option-form-filling"
        keywords="mht cet option form filling, option form filling, mhtcet choice filling, cap round option form, mht cet option form help, option form filling service, mht cet cap round counselling, maharashtra engineering admission counselling, mhtcet form filling near me, how to fill mht cet option form, home university quota mht cet"
        jsonLd={[serviceSchema, faqSchema, breadcrumbSchema]}
      />

      {/* Bottom padding clears the mobile pay bar so it never covers content. */}
      <main className="bg-white font-['Poppins'] pb-24 lg:pb-0">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0B1020] text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-40 -right-24 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
            style={{ background: "radial-gradient(circle,#FA660F 0%,transparent 70%)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-48 -left-32 h-[460px] w-[460px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle,#2F43F2 0%,transparent 70%)" }}
          />

          <div className="relative mx-auto max-w-[1180px] px-5 py-11 sm:px-8 sm:py-14 lg:py-20">
            <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
              <div>
                <p className="font-['Montserrat'] text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FFB489]">
                  MHT-CET · CAP rounds
                </p>
                <h1 className="mt-4 font-['Montserrat'] text-[31px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:mt-5 sm:text-[46px] lg:text-[54px]">
                  Your option form decides your college.
                  <span className="block text-[#FA660F]">Not your percentile.</span>
                </h1>
                <p className="mt-5 max-w-[520px] text-[15px] leading-relaxed text-white/70 sm:text-base">
                  Two students with the same score end up in different colleges because
                  one ordered the list better. Have an MHT-CET counsellor build yours —
                  college by college, with a reason for every position.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2.5 sm:mt-8">
                  <button
                    type="button"
                    onClick={startCheckout}
                    className="inline-flex items-center gap-2 rounded-full bg-[#FA660F] px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#e25a0b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white cursor-pointer sm:px-7 sm:py-3.5 sm:text-sm"
                  >
                    Fill my option form
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  {offerTimer}
                </div>

                <dl className="mt-7 grid max-w-[520px] grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 text-center sm:mt-10">
                  {[
                    ["10,000+", "students guided"],
                    ["4 hrs", "to first call"],
                    ["1-on-1", "counsellor call"],
                  ].map(([value, label]) => (
                    <div key={label} className="bg-[#0B1020] px-1.5 py-3 sm:px-3 sm:py-4">
                      <dt className="font-['Montserrat'] text-[14px] font-bold tracking-tight sm:text-lg">
                        {value}
                      </dt>
                      <dd className="mt-1 text-[10px] leading-tight text-white/50 sm:text-[11px]">{label}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Signature: the option form itself. It reorders once on desktop;
                  phones get the finished list, still and readable. */}
              <div className="relative">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-sm sm:rounded-[26px] sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 sm:pb-4">
                    <p className="font-['Montserrat'] text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50 sm:text-[11px]">
                      Preference list
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FA660F]/15 px-2.5 py-1 text-[10px] font-semibold text-[#FFA36B] sm:px-3 sm:text-[11px]">
                      <ShieldCheck className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                      Counsellor ordered
                    </span>
                  </div>

                  <ul className="mt-1 divide-y divide-white/[0.06] sm:mt-2">
                    {choices.map((choice, index) => (
                      <motion.li
                        key={choice.college}
                        layout={animateReorder}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        className="flex items-center gap-3 py-3 sm:gap-4 sm:py-3.5"
                      >
                        <span
                          className={`w-6 shrink-0 text-right font-['Montserrat'] text-[15px] font-bold tabular-nums sm:w-7 sm:text-lg ${
                            index === 0 ? "text-[#FA660F]" : "text-white/25"
                          }`}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-white/90 sm:text-[13.5px]">
                            {choice.college}
                          </span>
                          <span className="block truncate text-[11.5px] text-white/45 sm:text-[12px]">
                            {choice.branch}
                          </span>
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <p className="mt-2 flex items-center gap-2 border-t border-white/10 pt-3 text-[11.5px] text-white/45 sm:mt-3 sm:pt-4 sm:text-[12px]">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    Verified with you before the CAP deadline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── What goes wrong ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-[1180px] px-5 py-12 sm:py-16 sm:px-8">
          <h2 className="max-w-[640px] font-['Montserrat'] text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#0B1020] sm:text-[32px]">
            Three ways a good score still loses a good seat
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-[#E7E9F2] sm:grid-cols-3">
            {MISTAKES.map((item) => (
              <div key={item.title} className="bg-white p-6 sm:p-7">
                <h3 className="font-['Montserrat'] text-[17px] font-bold tracking-tight text-[#0B1020]">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5A6180]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="bg-[#F6F7FB] py-12 sm:py-16">
          <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
            <h2 className="font-['Montserrat'] text-[26px] font-bold tracking-[-0.02em] text-[#0B1020] sm:text-[32px]">
              How it works
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <li key={step.label} className="relative">
                  <div className="flex items-center gap-3">
                    <span className="font-['Montserrat'] text-[13px] font-bold tabular-nums text-[#FA660F]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-[#DEE1EE]" />
                  </div>
                  <h3 className="mt-4 font-['Montserrat'] text-[17px] font-bold tracking-tight text-[#0B1020]">
                    {step.label}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#5A6180]">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Plans + registration ──────────────────────────────────────── */}
        <section ref={formRef} id="register" className="mx-auto max-w-[1180px] scroll-mt-24 px-5 py-12 sm:py-16 sm:px-8">
          {status === "done" ? (
            <div className="mx-auto max-w-[640px] rounded-[26px] border border-[#CFE9DA] bg-[#F2FBF5] p-8 text-center sm:p-12">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12A150] text-white">
                <Check className="h-7 w-7" />
              </span>
              <h2 className="mt-6 font-['Montserrat'] text-[26px] font-bold tracking-[-0.02em] text-[#0B1020]">
                Payment received
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#4A5470]">
                We have your {plan === "NEW" ? "full option form" : "form revision"} request and{" "}
                {rupees(price)} has been deducted from your wallet. Our counsellor will contact you on
                call or WhatsApp at {phone.replace(/\D/g, "").slice(-10)} within 4 hours and take you
                through the whole process.
              </p>
              <p className="mt-4 text-[13px] text-[#6B7392]">
                Keep your phone reachable. Wallet balance now {rupees(user?.walletAmount ?? 0)}.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-10">
              {/* Plans */}
              <div>
                <h2 className="font-['Montserrat'] text-[26px] font-bold tracking-[-0.02em] text-[#0B1020] sm:text-[32px]">
                  Choose what you need
                </h2>
                <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-[#5A6180]">
                  One-time payment, taken from your ProCounsel wallet. Pick the one that
                  matches where you are right now.
                </p>

                {/* The offer repeated where the decision is actually made. */}
                {offerLive && (
                  <div className="mt-5 inline-flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-[#FFD9C2] bg-[#FFF7F2] px-3.5 py-2.5">
                    <Clock className="h-4 w-4 shrink-0 text-[#D9480F]" />
                    <span className="text-[13px] font-semibold text-[#0B1020]">Launch pricing ends in</span>
                    <span className="font-['Montserrat'] text-[15px] font-extrabold tabular-nums text-[#D9480F]">
                      {countdown.h}:{countdown.m}:{countdown.s}
                    </span>
                  </div>
                )}

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {PLANS.map((item) => {
                    const active = plan === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => choosePlan(item.id)}
                        className={`rounded-2xl border p-6 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FA660F] ${
                          active
                            ? "border-[#FA660F] bg-[#FFF7F2] shadow-[0_10px_30px_-18px_rgba(250,102,15,0.8)]"
                            : "border-[#E4E7F1] bg-white hover:border-[#C9CFE4]"
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-['Montserrat'] text-[17px] font-bold tracking-tight text-[#0B1020]">
                            {item.name}
                          </span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                              active ? "border-[#FA660F] bg-[#FA660F]" : "border-[#C9CFE4]"
                            }`}
                          >
                            {active && <Check className="h-3 w-3 text-white" />}
                          </span>
                        </span>
                        {/* Current price leads, original struck beside it, saving
                            named in rupees — the layout people already read on
                            every store page. */}
                        <span className="mt-4 block">
                          <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                            <span className="font-['Montserrat'] text-[32px] font-extrabold tabular-nums leading-none tracking-tight text-[#0B1020]">
                              {rupees(item.price)}
                            </span>
                            <span className="text-[15px] font-medium tabular-nums text-[#A8AEC6] line-through">
                              {rupees(item.mrp)}
                            </span>
                            <span className="rounded-md bg-[#12A150]/10 px-1.5 py-0.5 text-[11px] font-bold text-[#12A150]">
                              {Math.round(((item.mrp - item.price) / item.mrp) * 100)}% OFF
                            </span>
                          </span>
                          <span className="mt-1.5 block text-[12px] text-[#8189A6]">
                            One-time · you save {rupees(item.mrp - item.price)}
                          </span>
                        </span>
                        <span className="mt-1 block text-[13px] text-[#5A6180]">{item.tagline}</span>
                        <ul className="mt-5 space-y-2.5">
                          {item.includes.map((line) => (
                            <li key={line} className="flex gap-2.5 text-[13px] leading-snug text-[#414A69]">
                              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FA660F]" />
                              {line}
                            </li>
                          ))}
                        </ul>
                      </button>
                    );
                  })}
                </div>

                {/* Phone: the plan cards are the whole choice, then one button
                    opens the sheet that collects the details. */}
                <button
                  type="button"
                  onClick={() => requireLogin() && setSheetOpen(true)}
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FA660F] text-[15px] font-semibold text-white lg:hidden cursor-pointer"
                >
                  Continue with {plan === "NEW" ? "full option form" : "form revision"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Registration + payment (desktop) */}
              <div className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
                <div className="rounded-[26px] border border-[#E4E7F1] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,16,32,0.6)] sm:p-7">
                  <h3 className="font-['Montserrat'] text-[19px] font-bold tracking-tight text-[#0B1020]">
                    Your details
                  </h3>
                  <div className="mt-5">{detailFields}</div>
                  <div className="mt-6">{summaryBox}</div>
                  <div className="mt-5">{payButton}</div>
                  <div className="mt-3">{payFootnote}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section className="bg-[#F6F7FB] py-12 sm:py-16">
          <div className="mx-auto max-w-[820px] px-5 sm:px-8">
            <h2 className="font-['Montserrat'] text-[26px] font-bold tracking-[-0.02em] text-[#0B1020] sm:text-[32px]">
              Questions students ask
            </h2>
            <div className="mt-8 divide-y divide-[#E1E4EF] border-y border-[#E1E4EF]">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-['Montserrat'] text-[16px] font-semibold tracking-tight text-[#0B1020]">
                    {faq.q}
                    <span className="shrink-0 text-[#FA660F] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-[#5A6180]">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Long-form, crawlable guide — the substance this page ranks on */}
        <SeoArticle
          {...optionFormContent}
          accent="#FA660F"
          eyebrow="MHT-CET Option Form Guide"
        />

        {/* Internal links: the neighbouring pages a CAP-round student needs */}
        <section className="mx-auto max-w-[1180px] px-5 py-12 sm:px-8">
          <h2 className="font-['Montserrat'] text-[20px] font-bold tracking-[-0.02em] text-[#0B1020]">
            Before you fill the form
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                to: "/mhtcet-college-predictor",
                title: "MHT-CET College Predictor",
                body: "See which colleges your percentile realistically opens, free.",
              },
              {
                to: "/counselling/pune",
                title: "Counselling in Pune",
                body: "Admission counsellors for Pune colleges and CAP guidance.",
              },
              {
                to: "/counselling/mumbai",
                title: "Counselling in Mumbai",
                body: "Talk to counsellors who handle Mumbai region admissions.",
              },
              {
                to: "/counsellor-listing",
                title: "All admission counsellors",
                body: "Browse verified counsellors and book a call directly.",
              },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-2xl border border-[#E4E7F1] bg-white p-5 transition-colors hover:border-[#FA660F]"
              >
                <span className="block font-['Montserrat'] text-[15px] font-bold tracking-tight text-[#0B1020]">
                  {link.title}
                </span>
                <span className="mt-1.5 block text-[13px] leading-relaxed text-[#5A6180]">
                  {link.body}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Confirmation popup — the success section further up the page is easy to
          scroll past, and the 4-hour callback promise is the one thing they must
          leave with. */}
      {status === "done" && successOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSuccessOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-[440px] rounded-t-3xl bg-white p-6 text-center sm:rounded-3xl sm:p-8"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#12A150] text-white">
              <Check className="h-7 w-7" />
            </span>
            <h2 className="mt-5 font-['Montserrat'] text-[22px] font-bold tracking-[-0.02em] text-[#0B1020]">
              Payment received
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[#4A5470]">
              {rupees(price)} has been deducted for your{" "}
              {plan === "NEW" ? "full option form" : "form revision"}. Our counsellor will call or
              WhatsApp you on{" "}
              <span className="font-semibold text-[#0B1020]">
                {phone.replace(/\D/g, "").slice(-10)}
              </span>{" "}
              <span className="font-semibold text-[#0B1020]">within 4 hours</span>.
            </p>
            <p className="mt-3 text-[12.5px] text-[#6B7392]">
              Keep your phone reachable. Wallet balance now {rupees(user?.walletAmount ?? 0)}.
            </p>
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="mt-6 h-12 w-full rounded-xl bg-[#FA660F] text-[15px] font-semibold text-white cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Mobile pay bar — opens the sheet so the plan and the fields are always
          on screen together. */}
      {status !== "done" && !sheetOpen && (
        <div
          className={`fixed inset-x-0 bottom-0 z-[60] border-t border-[#E4E7F1] bg-white/95 px-4 py-3 backdrop-blur-sm transition-transform duration-300 lg:hidden ${
            showStickyBar ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          {/* Before a plan is picked this is a prompt, not a price — quoting one
              plan would hide the other. */}
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              {hasChosenPlan ? (
                <>
                  <p className="truncate text-[11px] text-[#5A6180]">
                    {plan === "NEW" ? "Full option form" : "Form revision"}
                  </p>
                  <p className="flex items-baseline gap-1.5">
                    <span className="font-['Montserrat'] text-[19px] font-extrabold tabular-nums leading-none text-[#0B1020]">
                      {rupees(price)}
                    </span>
                    <span className="text-[11.5px] tabular-nums text-[#A8AEC6] line-through">
                      {rupees(PLANS.find((p) => p.id === plan)?.mrp ?? 0)}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[13px] font-semibold text-[#0B1020]">Two plans available</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#5A6180]">
                    New form or revision
                    {offerLive && (
                      <span className="text-[#D9480F]">
                        {" "}· ends {countdown.h}:{countdown.m}
                      </span>
                    )}
                  </p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => requireLogin() && (hasChosenPlan ? setSheetOpen(true) : scrollToForm())}
              className="ml-auto flex h-12 min-w-0 flex-1 max-w-[190px] items-center justify-center gap-2 rounded-xl bg-[#FA660F] text-[15px] font-semibold text-white cursor-pointer"
            >
              {hasChosenPlan ? "Continue" : "Choose plan"}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile checkout sheet: plan + details + pay, all in one view. It sits
          above the site header and the floating chatbot (both z-50) and below
          the wallet panel (z-200); login is z-50, so the sheet closes first. */}
      {sheetOpen && status !== "done" && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => status !== "paying" && setSheetOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Option form checkout"
            className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white"
            /* Extra bottom room so the last line clears the site's floating
               chat widget, which paints above everything. */
            style={{ paddingBottom: "calc(3.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#EEF0F7] bg-white px-5 pb-3 pt-4">
              <h2 className="font-['Montserrat'] text-[17px] font-bold tracking-tight text-[#0B1020]">
                Book option form filling
              </h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                disabled={status === "paying"}
                aria-label="Close"
                className="-mr-1 rounded-full p-1.5 text-[#5A6180] disabled:opacity-40 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pt-4">
              {offerLive && (
                <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#FFF7F2] px-3 py-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-[#D9480F]" />
                  <span className="text-[12px] text-[#5A6180]">Launch pricing ends in</span>
                  <span className="ml-auto font-['Montserrat'] text-[13px] font-extrabold tabular-nums text-[#D9480F]">
                    {countdown.h}:{countdown.m}:{countdown.s}
                  </span>
                </div>
              )}

              {/* The plan was chosen on the page — this confirms it and gets out
                  of the way, rather than repeating the whole picker. */}
              <div className="flex items-center gap-3 rounded-2xl border border-[#FA660F] bg-[#FFF7F2] p-3.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#0B1020]">
                    {plan === "NEW" ? "Full option form" : "Form revision"}
                  </p>
                  <p className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="font-['Montserrat'] text-[20px] font-extrabold tabular-nums leading-none text-[#0B1020]">
                      {rupees(price)}
                    </span>
                    <span className="text-[12px] tabular-nums text-[#A8AEC6] line-through">
                      {rupees(PLANS.find((p) => p.id === plan)?.mrp ?? 0)}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSheetOpen(false); scrollToForm(); }}
                  className="ml-auto shrink-0 rounded-lg border border-[#FA660F]/40 px-3 py-2 text-[12.5px] font-semibold text-[#D9480F] cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="mt-5">{detailFields}</div>
              <div className="mt-5">{summaryBox}</div>
              <div className="mt-4">{payButton}</div>
              <div className="mt-3">{payFootnote}</div>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
