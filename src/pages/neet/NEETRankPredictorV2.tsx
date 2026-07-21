import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  predictNEETRank,
  estimateNEETRank,
  type NEETRankResponse,
} from "@/api/neetV2";
import {
  Loader2,
  Lock,
  Stethoscope,
  TrendingUp,
  Target,
  Award,
  TableProperties,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/AuthStore";
import { Link, useNavigate } from "react-router-dom";
import PageSEO from "@/components/SEO/PageSEO";
import OtherPredictors from "@/components/predictors/OtherPredictors";
import { persistPredictorSearch } from "@/lib/predictorIntent";

const ACCENT = "#059669";

export default function NEETRankPredictorV2() {
  const navigate = useNavigate();
  const [marks, setMarks] = useState("");
  const [year, setYear] = useState("2025");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<NEETRankResponse | null>(null);
  const { isAuthenticated, toggleLogin } = useAuthStore();

  const lastParamsRef = useRef<{ marks: string; year: string } | null>(null);

  useEffect(() => setPrediction(null), [year]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marks) return toast.error("Please enter your NEET marks");
    const marksValue = parseFloat(marks);
    if (isNaN(marksValue) || marksValue < 0 || marksValue > 720)
      return toast.error("Please enter valid NEET marks (0 - 720)");

    persistPredictorSearch({ exam: "NEET", tool: "Rank Predictor", summary: `${marksValue}/720 marks` });

    setIsLoading(true);
    setPrediction(null);

    try {
      const currentParams = { marks, year };
      const paramsChanged =
        !lastParamsRef.current ||
        JSON.stringify(lastParamsRef.current) !== JSON.stringify(currentParams);

      if (!isAuthenticated) {
        const estimatedRank = estimateNEETRank(marksValue);
        const spread = Math.max(5, Math.floor(estimatedRank * 0.08));
        setPrediction({
          marks: marksValue,
          year: parseInt(year, 10),
          predicted_rank: estimatedRank,
          rank_range: `${Math.max(1, estimatedRank - spread)} - ${estimatedRank + spread}`,
          rank_min: Math.max(1, estimatedRank - spread),
          rank_max: estimatedRank + spread,
        });
        lastParamsRef.current = currentParams;
        toast.success("Prediction ready! Login to view your detailed results.");
      } else if (paramsChanged) {
        const response = await predictNEETRank({ marks: marksValue, year: parseInt(year, 10) });
        setPrediction(response);
        lastParamsRef.current = currentParams;
        toast.success("Rank predicted successfully!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to predict rank");
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRank = (rank: number | null | undefined) =>
    rank === null || rank === undefined ? "N/A" : rank.toLocaleString("en-IN");

  return (
    <>
      <PageSEO
        title="NEET Rank Predictor 2026 – Predict Your NEET UG Rank from Marks"
        description="Free NEET Rank Predictor: estimate your NEET UG All India Rank from your expected marks, built on real 2025 marks-vs-rank cutoff data. Then check the MBBS colleges you can get."
        canonical="/neet-rank-predictor"
        keywords="NEET rank predictor, NEET 2026 rank, NEET marks vs rank, NEET UG rank calculator, NEET AIR predictor"
      />

      <div className="min-h-screen bg-[#F4FBF8] pb-12">
        <div className="hidden sm:block w-full border-b border-[#D6EFE4] bg-white">
          <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] py-3 text-[0.875rem] text-gray-500 font-medium">
            <Link to="/" className="hover:underline cursor-pointer">Home</Link>
            <span className="mx-1">{">"}</span>
            <span className="text-gray-800">NEET Rank Predictor</span>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(120deg, #064E3B 0%, #047857 45%, #059669 100%)" }}
          />
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-emerald-300/20 blur-2xl" />
          <div className="relative max-w-[1100px] mx-auto px-4 sm:px-8 pt-10 pb-16 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold text-emerald-50 ring-1 ring-white/25">
              <Stethoscope className="h-3.5 w-3.5" />
              NEET UG 2026 · Real Cutoff Data
            </span>
            <h1 className="mt-5 text-3xl md:text-[42px] font-bold text-white leading-tight">
              NEET Rank Predictor
            </h1>
            <p className="mt-3 text-emerald-50/90 text-sm md:text-base max-w-2xl mx-auto">
              Enter your expected NEET score and get an accurate All India Rank estimate,
              modelled on lakhs of past aspirants and verified NEET cutoff trends.
            </p>
          </div>
        </div>

        <div className="max-w-[760px] mx-auto px-4 sm:px-6 -mt-9 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-emerald-900/5 p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">
                  Your NEET Marks <span className="text-gray-400 font-normal">(out of 720)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="720"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  placeholder="e.g. 650"
                  className="w-full h-12 px-4 bg-white border border-emerald-200 rounded-xl text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Cutoff Reference Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-full h-12 border border-emerald-200 rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 cursor-pointer">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2 pt-1">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-white text-base font-semibold rounded-xl transition-all cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: ACCENT }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    "Predict My Rank"
                  )}
                </Button>
              </div>
            </form>

            {prediction && (
              <div className="mt-7 relative">
                <div className={`${!isAuthenticated ? "blur-sm select-none pointer-events-none" : ""}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="h-5 w-5" style={{ color: ACCENT }} />
                    <h3 className="text-lg font-bold text-gray-800">Your Predicted Rank</h3>
                  </div>

                  <div
                    className="rounded-2xl p-6 text-center text-white mb-4"
                    style={{ background: "linear-gradient(120deg, #047857 0%, #059669 60%, #10B981 100%)" }}
                  >
                    <p className="text-emerald-50/80 text-xs font-semibold uppercase tracking-wider mb-1">
                      Expected All India Rank
                    </p>
                    <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                      {formatRank(prediction.predicted_rank)}
                    </p>
                    <p className="text-emerald-50/90 text-sm mt-2">
                      for {prediction.marks} marks · NEET {prediction.year}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Best Case Rank" value={formatRank(prediction.rank_min)} />
                    <StatTile icon={<Target className="h-4 w-4" />} label="Likely Range" value={prediction.rank_range} />
                    <StatTile icon={<TrendingUp className="h-4 w-4 rotate-180" />} label="Worst Case Rank" value={formatRank(prediction.rank_max)} />
                  </div>

                  <div className="mt-5 grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/neet-college-predictor")}
                      className="h-11 rounded-xl border border-emerald-200 bg-emerald-50/60 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      See which medical colleges you can get →
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/neet-cutoffs")}
                      className="h-11 rounded-xl border border-emerald-200 bg-white text-sm font-semibold text-emerald-800 hover:bg-emerald-50 transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <TableProperties className="h-4 w-4" />
                      Browse round-wise cutoffs
                    </button>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-[2px] rounded-xl">
                    <Lock className="h-14 w-14 mb-3" style={{ color: ACCENT }} />
                    <h4 className="text-xl font-bold text-gray-800 mb-1">Login to View Results</h4>
                    <p className="text-sm text-gray-600 text-center mb-5 max-w-md px-4">
                      Please login to unlock your personalized NEET rank prediction.
                    </p>
                    <Button
                      onClick={() => toggleLogin()}
                      className="text-white px-8 py-2 rounded-xl font-semibold cursor-pointer hover:opacity-95"
                      style={{ backgroundColor: ACCENT }}
                    >
                      Login Now
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <section className="mt-10 bg-white rounded-2xl border border-emerald-100 p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-5 text-gray-800">About the NEET Rank Predictor</h2>
            <div className="grid md:grid-cols-2 gap-7 text-sm text-gray-600 leading-relaxed">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">How does it work?</h3>
                <p>
                  Our predictor maps your NEET score against historical marks-versus-rank data
                  published by the NTA. It accounts for the number of test takers and difficulty
                  trends to estimate your expected All India Rank along with a realistic range.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Disclaimer</h3>
                <p>
                  Predictions are based on previous-year trends and are intended for guidance only.
                  Your actual rank depends on this year's total candidates, paper difficulty, and
                  normalization by the NTA.
                </p>
              </div>
            </div>
          </section>
        </div>

        <OtherPredictors currentPath="/neet-rank-predictor" accent="#059669" />
      </div>
    </>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
      <div className="flex items-center gap-1.5 text-emerald-700 mb-1.5">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-base font-bold text-gray-800 break-words">{value}</p>
    </div>
  );
}
