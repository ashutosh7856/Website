import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  predictJEEColleges,
  type JEECollegePredictionResponse,
} from "@/api/jee";
import {
  Loader2,
  GraduationCap,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";
import PageSEO from "@/components/SEO/PageSEO";
import OtherPredictors from "@/components/predictors/OtherPredictors";

type PredictionMode = "marks" | "percentile";

export default function JEECollegePredictor() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PredictionMode>("marks");
  const [marks, setMarks] = useState<string>("");
  const [percentile, setPercentile] = useState<string>("");
  const [shiftLevel, setShiftLevel] = useState<string>("moderate");
  const [category, setCategory] = useState<string>("General");
  const [quota, setQuota] = useState<string>("All India");
  const [pool, setPool] = useState<string>("Gender-Neutral");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] =
    useState<JEECollegePredictionResponse | null>(null);
  const { isAuthenticated, toggleLogin } = useAuthStore();

  // Filter and sort states
  const [instituteFilter, setInstituteFilter] =
    useState<string>("All Institutes");
  const [sortBy, setSortBy] = useState<string>("Ascending");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const collegesPerPage = 10;
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(
    new Set(),
  );

  // Helper function to fetch actual API data
  // Track last submitted values to avoid unnecessary API calls
  const lastParamsRef = useRef<{
    mode: string;
    marks: string;
    percentile: string;
    shiftLevel: string;
    category: string;
    quota: string;
    pool: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation based on mode
    if (mode === "marks") {
      if (!marks) {
        toast.error("Please enter your JEE marks");
        return;
      }
      const marksValue = parseFloat(marks);
      if (isNaN(marksValue) || marksValue < 0) {
        toast.error("Please enter a valid marks value");
        return;
      }
    } else {
      if (!percentile) {
        toast.error("Please enter your JEE percentile");
        return;
      }
      const percentileValue = parseFloat(percentile);
      if (
        isNaN(percentileValue) ||
        percentileValue < 0 ||
        percentileValue > 100
      ) {
        toast.error("Please enter a valid percentile (0-100)");
        return;
      }
    }

    setIsLoading(true);
    setPrediction(null);
      // Check if params actually changed
      const currentParams = { mode, marks, percentile, shiftLevel, category, quota, pool };
      const paramsChanged = !lastParamsRef.current || 
        JSON.stringify(lastParamsRef.current) !== JSON.stringify(currentParams);


    try {
      // If user is not authenticated, use dummy data
      if (!isAuthenticated) {
        // Generate dummy college prediction data
        const marksValue = mode === "marks" ? parseFloat(marks) : null;
        const percentileValue = mode === "percentile" ? parseFloat(percentile) : null;
        
        // Estimate rank from marks or percentile
        let estimatedRank: number;
        if (marksValue !== null) {
          const basePercentile = Math.min(99.9, Math.max(50, 100 - (300 - marksValue) * 0.15));
          estimatedRank = Math.max(1, Math.floor(1000000 * (1 - basePercentile / 100)));
        } else if (percentileValue !== null) {
          estimatedRank = Math.max(1, Math.floor(1000000 * (1 - percentileValue / 100)));
        } else {
          estimatedRank = 50000;
        }

        // Generate dummy colleges list
        const dummyColleges = [
          {
            institute_short: "NIT Trichy",
            program_name: ["Computer Science and Engineering", "Mechanical Engineering"],
            closing_rank: estimatedRank - 5000,
            chance: "High"
          },
          {
            institute_short: "NIT Surathkal",
            program_name: ["Electronics and Communication Engineering"],
            closing_rank: estimatedRank - 2000,
            chance: "High"
          },
          {
            institute_short: "NIT Warangal",
            program_name: ["Electrical Engineering", "Civil Engineering"],
            closing_rank: estimatedRank + 2000,
            chance: "Moderate"
          },
          {
            institute_short: "IIIT Hyderabad",
            program_name: ["Computer Science and Engineering"],
            closing_rank: estimatedRank - 8000,
            chance: "Very High"
          },
          {
            institute_short: "NIT Calicut",
            program_name: ["Mechanical Engineering"],
            closing_rank: estimatedRank + 5000,
            chance: "Moderate"
          },
          {
            institute_short: "NIT Rourkela",
            program_name: ["Chemical Engineering", "Metallurgical Engineering"],
            closing_rank: estimatedRank + 3000,
            chance: "Moderate"
          },
          {
            institute_short: "IIIT Bangalore",
            program_name: ["Information Technology"],
            closing_rank: estimatedRank - 3000,
            chance: "High"
          },
          {
            institute_short: "NIT Durgapur",
            program_name: ["Computer Science and Engineering"],
            closing_rank: estimatedRank + 8000,
            chance: "Low"
          },
        ];

        const dummyPrediction: JEECollegePredictionResponse = {
          estimated_rank: estimatedRank,
          colleges: dummyColleges
        };
        
        setPrediction(dummyPrediction);
        lastParamsRef.current = currentParams;
        toast.success("Prediction generated! Login to view detailed results.");
      } else {
        // Only call API if params changed
        if (paramsChanged) {
          const requestData: any = {
            shift_level: shiftLevel,
            category,
            quota,
            pool,
          };

          // Add only marks OR percentile, not both
          if (mode === "marks") {
            requestData.marks = parseFloat(marks);
          } else {
            requestData.percentile = parseFloat(percentile);
          }

          const response = await predictJEEColleges(requestData);
          setPrediction(response);
          lastParamsRef.current = currentParams;
          toast.success("Colleges predicted successfully!");
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to predict colleges";
      toast.error(errorMessage);
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatRank = (rank: number | null) => {
    if (rank === null || rank === undefined) return "N/A";
    return rank.toLocaleString("en-IN");
  };

  const getChanceText = (chance: string) => {
    const lowerChance = chance.toLowerCase();
    if (lowerChance.includes("high") || lowerChance.includes("very high")) {
      return "HIGH CHANCE";
    } else if (
      lowerChance.includes("moderate") ||
      lowerChance.includes("medium")
    ) {
      return "MEDIUM CHANCE";
    } else if (lowerChance.includes("low")) {
      return "LOW CHANCE";
    }
    return chance.toUpperCase();
  };

  const getChanceBadgeStyle = (chance: string) => {
    const lowerChance = chance.toLowerCase();
    if (lowerChance.includes("high") || lowerChance.includes("very high")) {
      return "bg-green-100 text-green-700";
    } else if (
      lowerChance.includes("moderate") ||
      lowerChance.includes("medium")
    ) {
      return "bg-amber-100 text-amber-700";
    } else if (lowerChance.includes("low")) {
      return "bg-gray-100 text-gray-600";
    }
    return "bg-gray-100 text-gray-600";
  };

  const togglePrograms = (index: number) => {
    setExpandedPrograms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  // Filter and sort colleges
  const filteredAndSortedColleges = useMemo(() => {
    if (!prediction?.colleges) return [];

    let filtered = [...prediction.colleges];

    // Filter by institute type
    if (instituteFilter !== "All Institutes") {
      filtered = filtered.filter((college) => {
        const name = college.institute_short.toUpperCase();
        if (instituteFilter === "NITs") {
          return name.includes("NIT");
        } else if (instituteFilter === "IIITs") {
          return name.includes("IIIT");
        } else if (instituteFilter === "GFTIs") {
          return (
            !name.includes("NIT") &&
            !name.includes("IIIT") &&
            !name.includes("IIT")
          );
        }
        return true;
      });
    }

    // Sort by closing rank
    filtered.sort((a, b) => {
      if (sortBy === "Ascending") {
        return a.closing_rank - b.closing_rank;
      } else {
        return b.closing_rank - a.closing_rank;
      }
    });

    return filtered;
  }, [prediction?.colleges, instituteFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedColleges.length / collegesPerPage,
  );
  const startIndex = (currentPage - 1) * collegesPerPage;
  const endIndex = startIndex + collegesPerPage;
  const paginatedColleges = filteredAndSortedColleges.slice(
    startIndex,
    endIndex,
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [instituteFilter, sortBy]);

  // Clear prediction when category, quota, pool, or shift level changes to force re-fetch
  useEffect(() => {
    setPrediction(null);
  }, [category, quota, pool, shiftLevel]);

  return (
    <>
      <PageSEO
        title="JEE College Predictor 2025 – Find Colleges by Rank & Category"
        description="Predict which IITs, NITs, and IIITs you can get admission to based on your JEE Main/Advanced rank. Free JEE college predictor tool by ProCounsel."
        canonical="/jee-college-predictor"
        keywords="JEE college predictor, JEE Main college list, NIT predictor, IIT predictor, JOSAA counseling, JEE rank college admission"
      />
    <div className="min-h-screen bg-gray-50 pb-8">
      <h1 className="sr-only">JEE College Predictor 2025 — Find IITs, NITs &amp; IIITs by Rank</h1>
      <div className="sm:hidden w-full bg-white border-b border-[#E3E8F4]">
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-(--text-main) cursor-pointer text-[16px] font-semibold"
            aria-label="Go back"
          >
            {"<"}
          </button>
          <span className="text-[16px] font-semibold text-(--text-main) truncate">
            JEE College Predictor
          </span>
        </div>
      </div>

      <div className="hidden sm:block w-full border-b border-[#E3E8F4] bg-white">
        <div className="max-w-[1440px] mx-auto px-5 md:px-[60px] pt-3 pb-3 text-[0.875rem] text-(--text-muted) font-medium">
          <Link to="/" className="hover:underline cursor-pointer">Home</Link>
          <span className="mx-1">{">"}</span>
          <span className="text-(--text-main)">JEE College Predictor</span>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-[60px] py-6 sm:py-8">

        {/* Two Column Layout when results are available */}
        {prediction ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Form */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-[#2F43F2]/10 shadow-lg p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-6">
                  <GraduationCap className="h-5 w-5 text-[#2F43F2]" />
                  <h2 className="text-lg font-bold text-gray-800">
                    Enter Details
                  </h2>
                </div>
                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("marks");
                      setPercentile("");
                      setPrediction(null);
                    }}
                    className={`pb-3 px-1 text-sm font-medium transition-colors cursor-pointer ${
                      mode === "marks"
                        ? "text-[#2F43F2] border-b-2 border-[#2F43F2]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Marks Basis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("percentile");
                      setMarks("");
                      setPrediction(null);
                    }}
                    className={`pb-3 px-1 text-sm font-medium transition-colors cursor-pointer ${
                      mode === "percentile"
                        ? "text-[#2F43F2] border-b-2 border-[#2F43F2]"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Percentile Basis
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Marks/Percentile Input */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {mode === "marks"
                        ? "Enter Your JEE Marks"
                        : "Enter Your JEE Percentile"}
                    </label>
                    <input
                      type="number"
                      step={mode === "marks" ? "1" : "0.0000001"}
                      min="0"
                      max={mode === "percentile" ? "100" : undefined}
                      value={mode === "marks" ? marks : percentile}
                      onChange={(e) => {
                        if (mode === "marks") {
                          setMarks(e.target.value);
                        } else {
                          setPercentile(e.target.value);
                        }
                      }}
                      placeholder={
                        mode === "marks" ? "e.g. 300" : "e.g. 99.4523810"
                      }
                      className="w-full h-12 px-4 bg-white border border-[#13097D66] rounded-xl text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#2F43F2] focus:ring-2 focus:ring-blue-100 transition-all"
                      required
                    />
                  </div>

                  {/* Shift Level Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift Level
                    </label>
                    <Select value={shiftLevel} onValueChange={setShiftLevel}>
                      <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                        <SelectValue placeholder="Select shift level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="difficult">Difficult</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="OBC">OBC</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                        <SelectItem value="ST">ST</SelectItem>
                        <SelectItem value="EWS">EWS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quota Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quota
                    </label>
                    <Select value={quota} onValueChange={setQuota}>
                      <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                        <SelectValue placeholder="Select quota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All India">All India</SelectItem>
                        <SelectItem value="Home State">Home State</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pool Dropdown */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pool
                    </label>
                    <Select value={pool} onValueChange={setPool}>
                      <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                        <SelectValue placeholder="Select pool" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gender-Neutral">
                          Gender-Neutral
                        </SelectItem>
                        <SelectItem value="Female-Only">Female-Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 mt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-[#2F43F2] hover:bg-[#2F43F2]/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Predicting...
                        </>
                      ) : (
                        <>
                          Predict Colleges
                          <GraduationCap className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </aside>

            {/* Right Column - Results */}
            <section className="lg:col-span-8 space-y-6 relative">
              {/* Content wrapper with blur */}
              <div className={`space-y-6 ${!isAuthenticated ? 'blur-sm pointer-events-none' : ''}`}>
              {/* Dashboard Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    Predicted Colleges
                  </h1>
                  <p className="text-sm text-gray-500">
                    Based on JoSAA Round 6 & CSAB Special Round Data
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-[#2F43F2]/5">
                <span className="text-xs font-bold text-gray-400 uppercase ml-2">
                  SHOW:
                </span>
                {["All Institutes", "NITs", "IIITs", "GFTIs"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setInstituteFilter(filter);
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                      instituteFilter === filter
                        ? "bg-[#2F43F2] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-[#2F43F2]/10"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 pr-2">
                  <span className="text-xs font-medium text-gray-700">
                    Sort by Rank:
                  </span>
                  <Select
                    value={sortBy}
                    onValueChange={(value) => {
                      setSortBy(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="bg-transparent border-none text-xs font-bold text-[#2F43F2] cursor-pointer outline-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ascending">Ascending</SelectItem>
                      <SelectItem value="Descending">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Table/List */}
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="w-full md:flex-1">
                          <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                              <div key={i} className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded w-full" />
                                <div className="h-4 bg-gray-200 rounded w-full" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedColleges.length > 0 ? (
                <div className="space-y-4">
                  {paginatedColleges.map((college, index) => {
                    const actualIndex = startIndex + index;
                    const isExpanded = expandedPrograms.has(actualIndex);
                    const hasMultiplePrograms =
                      college.program_name && college.program_name.length > 1;

                    return (
                      <div
                        key={actualIndex}
                        className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-5 flex flex-col md:flex-row gap-4">
                          {/* Building Icon */}
                          <div className="shrink-0">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-8 w-8 text-gray-400" />
                            </div>
                          </div>

                          {/* College Info */}
                          <div className="grow">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="text-lg font-bold text-gray-800">
                                {college.institute_short}
                              </h3>
                              <span
                                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${getChanceBadgeStyle(
                                  college.chance,
                                )}`}
                              >
                                {getChanceText(college.chance)}
                              </span>
                            </div>

                            {/* Program Name */}
                            {college.program_name &&
                              college.program_name.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-sm font-medium text-gray-600">
                                    {college.program_name.length}{" "}
                                    {college.program_name.length === 1
                                      ? "Program"
                                      : "Programs"}
                                  </p>

                                  {/* Show All Programs Button */}
                                  {hasMultiplePrograms && (
                                    <button
                                      onClick={() =>
                                        togglePrograms(actualIndex)
                                      }
                                      className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#2F43F2] hover:text-[#2F43F2]/80 transition-colors cursor-pointer"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="h-3 w-3" />
                                          Hide Programs
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-3 w-3" />
                                          View All Programs
                                        </>
                                      )}
                                    </button>
                                  )}

                                  {/* Expanded Programs List */}
                                  {isExpanded && hasMultiplePrograms && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                                      {college.program_name.map(
                                        (program, idx) => (
                                          <div
                                            key={idx}
                                            className="text-sm text-gray-700"
                                          >
                                            {program}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                  Quota
                                </p>
                                <p className="text-xs font-semibold text-gray-900">
                                  {quota}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                  Category
                                </p>
                                <p className="text-xs font-semibold text-gray-900">
                                  {category}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                  Closing Rank
                                </p>
                                <p className="text-xs font-bold text-[#2F43F2]">
                                  {formatRank(college.closing_rank)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">
                                  NIRF Ranking
                                </p>
                                <p className="text-xs font-semibold text-gray-900">
                                  -
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No colleges found matching your criteria.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 hover:bg-[#2F43F2]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 flex items-center justify-center rounded text-sm font-medium transition-colors cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-[#2F43F2] text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-[#2F43F2]/5"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  {totalPages > 5 && (
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-10 h-10 flex items-center justify-center rounded text-sm font-medium transition-colors cursor-pointer ${
                        currentPage === totalPages
                          ? "bg-[#2F43F2] text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-[#2F43F2]/5"
                      }`}
                    >
                      {totalPages}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="w-10 h-10 flex items-center justify-center rounded border border-gray-200 hover:bg-[#2F43F2]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}
              </div>

              {/* Login Overlay - Only show if not authenticated */}
              {!isAuthenticated && prediction && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 rounded-lg z-10">
                  <Lock className="h-16 w-16 text-[#2F43F2] mb-4" />
                  <h4 className="text-xl font-bold text-gray-800 mb-2">
                    Login to View Results
                  </h4>
                  <p className="text-sm text-gray-600 text-center mb-6 max-w-md px-4">
                    Please login to see your personalized college prediction results and unlock all features.
                  </p>
                  <Button
                    onClick={() => toggleLogin()}
                    className="bg-[#2F43F2] hover:bg-[#2F43F2]/90 text-white px-8 py-2 rounded-xl font-semibold cursor-pointer"
                  >
                    Login Now
                  </Button>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Single Column Layout when no results */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 md:p-10">
              <div className="bg-[#2F43F2] text-white rounded-lg p-4 mb-6 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                <h2 className="font-semibold text-lg">Enter Details</h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode("marks");
                    setPercentile("");
                  }}
                  className={`pb-3 px-1 text-base sm:text-lg font-medium transition-colors cursor-pointer ${
                    mode === "marks"
                      ? "text-[#2F43F2] border-b-2 border-[#2F43F2]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Marks Basis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("percentile");
                    setMarks("");
                  }}
                  className={`pb-3 px-1 text-base sm:text-lg font-medium transition-colors cursor-pointer ${
                    mode === "percentile"
                      ? "text-[#2F43F2] border-b-2 border-[#2F43F2]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Percentile Basis
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Marks/Percentile Input */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {mode === "marks"
                      ? "Enter Your JEE Marks"
                      : "Enter Your JEE Percentile"}
                  </label>
                  <input
                    type="number"
                    step={mode === "marks" ? "1" : "0.0000001"}
                    min="0"
                    max={mode === "percentile" ? "100" : undefined}
                    value={mode === "marks" ? marks : percentile}
                    onChange={(e) => {
                      if (mode === "marks") {
                        setMarks(e.target.value);
                      } else {
                        setPercentile(e.target.value);
                      }
                    }}
                    placeholder={
                      mode === "marks" ? "e.g. 300" : "e.g. 99.4523810"
                    }
                    className="w-full h-12 px-4 bg-white border border-[#13097D66] rounded-xl text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#2F43F2] focus:ring-2 focus:ring-blue-100 transition-all"
                    required
                  />
                </div>

                {/* Shift Level Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shift Level
                  </label>
                  <Select value={shiftLevel} onValueChange={setShiftLevel}>
                    <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                      <SelectValue placeholder="Select shift level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="difficult">Difficult</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="OBC">OBC</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="ST">ST</SelectItem>
                      <SelectItem value="EWS">EWS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Quota Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quota
                  </label>
                  <Select value={quota} onValueChange={setQuota}>
                    <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                      <SelectValue placeholder="Select quota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All India">All India</SelectItem>
                      <SelectItem value="Home State">Home State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pool Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pool
                  </label>
                  <Select value={pool} onValueChange={setPool}>
                    <SelectTrigger className="w-full h-12 border border-[#13097D66] rounded-xl text-base text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#2F43F2] cursor-pointer">
                      <SelectValue placeholder="Select pool" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gender-Neutral">
                        Gender-Neutral
                      </SelectItem>
                      <SelectItem value="Female-Only">Female-Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Submit Button */}
                <div className="pt-4 mt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-[#2F43F2] hover:bg-[#2F43F2]/90 text-white text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Predicting...
                      </>
                    ) : (
                      <>
                        Predict Colleges
                        <GraduationCap className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Information/SEO Section */}
        <section className="mt-16 bg-white p-8 rounded-2xl border border-gray-200">
          <h2 className="text-xl font-bold mb-6 text-gray-800">
            About JEE Main College Predictor
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600 leading-relaxed">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">
                How does it work?
              </h3>
              <p>
                Our JEE Main College Predictor tool uses advanced algorithms to
                compare your JEE rank against historical cutoff data from JoSAA
                (Joint Seat Allocation Authority) and CSAB (Central Seat
                Allocation Board). We analyze opening and closing ranks across
                multiple rounds to provide the most accurate predictions
                possible for NITs, IIITs, and GFTIs.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Disclaimer</h3>
              <p>
                Please note that the predictions provided are based on previous
                year trends and should be used for informational purposes only.
                Actual seat allocation depends on various factors including the
                total number of applicants, seat availability, and specific
                preferences of other candidates in the current counseling year.
              </p>
            </div>
          </div>
        </section>
      </div>

      <OtherPredictors currentPath="/jee-college-predictor" accent="#2F43F2" />
    </div>
    </>
  );
}

