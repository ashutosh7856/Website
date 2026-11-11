// The predictor always uses the deployed service, including during local
// frontend development, so dev and production exercise the same AI backend.
export const STUDY_ABROAD_PREDICTOR_API = "https://college-search-api.vercel.app";

export interface StudyAbroadPredictorInput {
  studyLevel: "Bachelors" | "Masters" | "MBA" | "PhD";
  fieldOfStudy: string;
  currentQualification: string;
  score: string;
  scoreScale: "Percentage" | "CGPA out of 10" | "GPA out of 4";
  backlogs: number;
  englishTest: "Not taken" | "IELTS" | "TOEFL" | "PTE" | "Duolingo";
  englishScore: string;
  annualBudget:
    | "Under INR 15 lakh per year"
    | "INR 15-25 lakh per year"
    | "INR 25-40 lakh per year"
    | "Above INR 40 lakh per year";
  intake: "January 2027" | "May 2027" | "September 2027" | "January 2028" | "Flexible";
  preferredCountries: string[];
  workExperienceYears: number;
}
export interface StudyAbroadPrediction {
  readinessScore: number;
  confidence: "High" | "Medium" | "Early estimate";
  profileSummary: string;
  countryMatches: Array<{
    country: string;
    fit: "Strong match" | "Good match" | "Consider with changes";
    reason: string;
    budgetReality: string;
    watchOut: string;
  }>;
  universityMatches: Array<{
    name: string;
    country: string;
    fitBand: "Ambitious" | "Target" | "Safer";
    suggestedProgram: string;
    whyItFits: string;
    budgetFit: "Likely within stated budget" | "May exceed stated budget" | "Verify funding and total cost";
    admissionWatchOut: string;
  }>;
  nextSteps: string[];
  importantNote: string;
  generatedAt: string;
}

export async function predictStudyAbroadColleges(
  input: StudyAbroadPredictorInput,
): Promise<StudyAbroadPrediction> {
  const response = await fetch(`${STUDY_ABROAD_PREDICTOR_API}/study-abroad/predict`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => ({})) as StudyAbroadPrediction & { error?: string };
  if (!response.ok) throw new Error(body.error || "Could not create university matches.");
  return body;
}
