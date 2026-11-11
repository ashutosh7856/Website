import axios from "axios";

const JEE_RANK_PREDICTOR_BASE_URL = "https://chatbot-backend-364445951625.asia-south1.run.app";

export interface JEERankPredictionRequest {
  marks: number;
  shift_level: string;
}

export interface JEERankPredictionResponse {
  marks: number;
  shift_level: string;
  percentile_range: [number | null, number | null];
  estimated_rank: number;
  rank_range: [number | null, number | null];
  confidence: string;
}

export async function predictJEERank(
  data: JEERankPredictionRequest
): Promise<JEERankPredictionResponse> {
  try {
    const endpoint = `${JEE_RANK_PREDICTOR_BASE_URL}/jee-main/predict-rank`;
    
    const response = await axios.post<JEERankPredictionResponse>(
      endpoint,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          const errorMsg = detail.map((err: { msg?: string }) => err.msg || "Validation error").join(", ");
          throw new Error(errorMsg);
        }
      }
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to predict rank"
      );
    }
    throw new Error("Failed to predict rank");
  }
}

export interface JEECollegePredictionRequest {
  marks?: number;
  percentile?: number;
  shift_level: string;
  category: string;
  quota: string;
  pool: string;
}

export interface College {
  institute_short: string;
  program_name: string[];
  closing_rank: number;
  chance: string;
}

export interface JEECollegePredictionResponse {
  estimated_rank: number;
  colleges: College[];
}

export async function predictJEEColleges(
  data: JEECollegePredictionRequest
): Promise<JEECollegePredictionResponse> {
  try {
    const endpoint = `${JEE_RANK_PREDICTOR_BASE_URL}/jee-main/predict-colleges`;
    
    const response = await axios.post<JEECollegePredictionResponse>(
      endpoint,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const detail = error.response.data?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          const errorMsg = detail.map((err: { msg?: string }) => err.msg || "Validation error").join(", ");
          throw new Error(errorMsg);
        }
      }
      throw new Error(
        error.response?.data?.detail || error.message || "Failed to predict colleges"
      );
    }
    throw new Error("Failed to predict colleges");
  }
}

