import axios from "axios";
import { getToken } from "@/lib/tokenManager";
import { NEET_API_URL } from "@/api/neetApiBase";

/**
 * Authenticated client for procounsel-neet-api (FastAPI), called directly in dev
 * and prod (the API allows cross-origin requests). Every request carries the
 * login JWT issued by the Java backend, which the Python API verifies.
 */
export const procounselApi = axios.create({ baseURL: `${NEET_API_URL}/api/v1`, timeout: 30000 });

procounselApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ProcounselMe {
  userId: string;
  phoneNumber: string;
  role: string;
}

/** Who the current login token belongs to, as the Python API sees it. */
export async function fetchProcounselMe(): Promise<ProcounselMe> {
  const { data } = await procounselApi.get<ProcounselMe>("/auth/me");
  return data;
}
