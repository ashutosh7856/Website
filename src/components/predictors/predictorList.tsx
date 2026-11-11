import { TrendingUp, GraduationCap, Stethoscope, TableProperties, Globe2, Briefcase, Calculator, Scale, IndianRupee, CalendarClock } from "lucide-react";

export interface PredictorItem {
  title: string;
  exam: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  accent: string;
  tint: string;
}

export const PREDICTORS: PredictorItem[] = [
  {
    title: "Study Abroad College Predictor",
    exam: "Global admissions",
    description:
      "Match your marks, budget, course and target intake with an AI-assisted country and university shortlist.",
    path: "/study-abroad/university-predictor",
    icon: <Globe2 className="h-6 w-6" />,
    accent: "#2F43F2",
    tint: "linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)",
  },
  {
    title: "NEET Rank Predictor",
    exam: "NEET UG",
    description:
      "Convert your expected NEET marks into an accurate All India Rank estimate built on real cutoff data.",
    path: "/neet-rank-predictor",
    icon: <TrendingUp className="h-6 w-6" />,
    accent: "#059669",
    tint: "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)",
  },
  {
    title: "NEET College Predictor",
    exam: "NEET UG",
    description:
      "Browse medical colleges state by state, then predict the ones your NEET rank can target \u2014 with round-wise cutoffs, seats and fees.",
    path: "/neet-college-predictor",
    icon: <Stethoscope className="h-6 w-6" />,
    accent: "#059669",
    tint: "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)",
  },
  {
    title: "NEET Round-wise Cutoff Analyzer",
    exam: "NEET UG",
    description:
      "Look up round-wise closing ranks and scores for any MBBS/BDS college — AIQ & state quota, every category, 2022–2025.",
    path: "/neet-cutoffs",
    icon: <TableProperties className="h-6 w-6" />,
    accent: "#0F766E",
    tint: "linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 100%)",
  },
  {
    title: "JEE Rank Predictor",
    exam: "JEE Main",
    description:
      "Estimate your JEE Main rank from your marks and benchmark your next preparation steps.",
    path: "/jee-rank-predictor",
    icon: <TrendingUp className="h-6 w-6" />,
    accent: "#2F43F2",
    tint: "linear-gradient(135deg, #EEF1FF 0%, #FFFFFF 100%)",
  },
  {
    title: "JEE College Predictor",
    exam: "JEE Main",
    description:
      "Discover the NITs, IIITs and GFTIs that match your expected JEE rank and category.",
    path: "/jee-college-predictor",
    icon: <GraduationCap className="h-6 w-6" />,
    accent: "#4338CA",
    tint: "linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)",
  },
  {
    title: "MHT-CET College Predictor",
    exam: "MHT-CET",
    description:
      "Discover likely MHT-CET colleges from your marks, rank or percentile and plan your choices.",
    path: "/mhtcet-college-predictor",
    icon: <GraduationCap className="h-6 w-6" />,
    accent: "#0E7490",
    tint: "linear-gradient(135deg, #ECFEFF 0%, #FFFFFF 100%)",
  },
  {
    title: "CAT College Predictor",
    exam: "CAT / MBA",
    description:
      "Enter your CAT percentile and see which MBA colleges you can target, based on published cut-offs.",
    path: "/cat-college-predictor",
    icon: <Briefcase className="h-6 w-6" />,
    accent: "#7B1FA2",
    tint: "linear-gradient(135deg, #F7EEFB 0%, #FFFFFF 100%)",
  },
  {
    title: "CAT Score Calculator",
    exam: "CAT / MBA",
    description:
      "Enter your correct and wrong answers per section to get your CAT raw score on the official marking scheme.",
    path: "/cat-score-calculator",
    icon: <Calculator className="h-6 w-6" />,
    accent: "#7B1FA2",
    tint: "linear-gradient(135deg, #F7EEFB 0%, #FFFFFF 100%)",
  },
  {
    title: "Compare MBA Colleges",
    exam: "CAT / MBA",
    description:
      "Put up to four IIMs and B-schools side by side: fees, median salaries, CAT figures and NIRF rank, from official sources.",
    path: "/mba-colleges/compare",
    icon: <Scale className="h-6 w-6" />,
    accent: "#7B1FA2",
    tint: "linear-gradient(135deg, #F7EEFB 0%, #FFFFFF 100%)",
  },
  {
    title: "MBA Fees & ROI Calculator",
    exam: "CAT / MBA",
    description:
      "Start from an institute's official fee and median salary, add your loan, and see the EMI, total cost and payback.",
    path: "/mba-fees-roi-calculator",
    icon: <IndianRupee className="h-6 w-6" />,
    accent: "#7B1FA2",
    tint: "linear-gradient(135deg, #F7EEFB 0%, #FFFFFF 100%)",
  },
  {
    title: "MBA Admission Deadlines",
    exam: "CAT / MBA",
    description:
      "Every official 2027-intake application deadline and exam date we track, filterable by exam, with calendar export.",
    path: "/mba-admission-deadlines",
    icon: <CalendarClock className="h-6 w-6" />,
    accent: "#7B1FA2",
    tint: "linear-gradient(135deg, #F7EEFB 0%, #FFFFFF 100%)",
  },
];
