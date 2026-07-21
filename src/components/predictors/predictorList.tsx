import { TrendingUp, GraduationCap, Stethoscope, TableProperties } from "lucide-react";

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
      "Find the MBBS and medical colleges you can target by rank, category, quota and state.",
    path: "/neet-college-predictor",
    icon: <Stethoscope className="h-6 w-6" />,
    accent: "#0D9488",
    tint: "linear-gradient(135deg, #ECFEFF 0%, #FFFFFF 100%)",
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
];
