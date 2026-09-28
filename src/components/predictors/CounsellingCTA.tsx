import { useNavigate } from "react-router-dom";
import { Users, GraduationCap, University } from "lucide-react";

interface CounsellingCTAProps {
  /** Accent color that drives the band (matches the host predictor page). */
  accent?: string;
  /** Exam/context word used in the copy, e.g. "NEET", "JEE", "MHT-CET". */
  exam?: string;
  /**
   * Width cap for the band. Defaults to the 1100px every other predictor page
   * uses; pass a wider one where the host page's cards are wider, so the band
   * does not read as a narrower card floating in the middle.
   */
  containerClass?: string;
}

/**
 * Conversion band shown at the bottom of every predictor/tool page. Predictor
 * visitors are the highest-intent slice of our audience — they've just seen
 * their rank/colleges and are deciding what to do next. This routes them into
 * the core ProCounsel offering (counsellors, college seniors, colleges)
 * instead of dead-ending on "other predictors". Plain internal <button>s that
 * navigate client-side; the surrounding OtherPredictors handles cross-links.
 */
export default function CounsellingCTA({
  accent = "#2F43F2",
  exam,
  containerClass = "max-w-[1100px]",
}: CounsellingCTAProps) {
  const navigate = useNavigate();
  const examLabel = exam ? `${exam} ` : "";

  return (
    <section className="w-full">
      <div className={`${containerClass} mx-auto px-4 sm:px-6 py-8`}>
        <div className="rounded-2xl overflow-hidden">
          <div className="relative px-6 py-8 sm:px-10 sm:py-9 text-white" style={{ background: accent }}>
            <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
            <div className="relative max-w-3xl">
              <h2 className="text-xl sm:text-2xl font-bold">
                A prediction is a starting point — not your final college list.
              </h2>
              <p className="mt-2 text-white/90 text-sm sm:text-base">
                The hard part of {examLabel}admission is choice-filling in the right order,
                understanding fees &amp; cutoffs, and not losing a seat you deserved. Talk to a
                verified counsellor, get honest advice from college seniors, or explore verified
                college profiles — free to start.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/counsellor-listing")}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold hover:opacity-95 cursor-pointer"
                  style={{ color: accent }}
                >
                  <Users className="h-4 w-4" />
                  Talk to a counsellor
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pro-buddies")}
                  className="inline-flex items-center gap-2 rounded-xl bg-black/15 ring-1 ring-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/25 cursor-pointer"
                >
                  <GraduationCap className="h-4 w-4" />
                  Ask a college senior
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/colleges")}
                  className="inline-flex items-center gap-2 rounded-xl bg-black/15 ring-1 ring-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/25 cursor-pointer"
                >
                  <University className="h-4 w-4" />
                  Browse colleges
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
