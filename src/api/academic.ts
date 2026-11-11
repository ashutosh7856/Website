import { API_CONFIG } from "./config";
import type { CollegeDetails,CollegeApiResponse, ExamApiResponse, CourseApiResponse, CounsellorApiResponse, AllCounselor, CounselorDetails } from "../types/academic";
import { getToken } from '@/lib/tokenManager';

interface BookingRequest {
  userId: string;
  counsellorId: string;
  date: string;
  startTime: string;
  mode: "offline" | "online";
  notes?: string;
  receiverFcmToken?: string | null;
}

interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: string;
}

// interface SearchResponse {
//   counsellors: AllCounselor[];
//   total: number;
//   totalPages: number;
//   currentPage: number;
// }

async function fetcher<T>(endpoint: string): Promise<T> {
  if (!API_CONFIG.baseUrl) {
    throw new Error('API base URL not configured. Please check environment variables.');
  }

  const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
    },
    // Safari aggressively caches GET requests — no-store forces a fresh fetch every time.
    cache: 'no-store',
    mode: 'cors',
    redirect: 'follow',
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

async function authFetcher<T>(endpoint: string, token: string): Promise<T> {
  if (!API_CONFIG.baseUrl) {
    throw new Error('API base URL not configured.');
  }

  const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
    mode: 'cors',
    redirect: 'follow',
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

export const academicApi = {
  getColleges: () => fetcher<CollegeApiResponse[]>(API_CONFIG.endpoints.getColleges),
  getCollegeById: (id: string) => fetcher<CollegeDetails>(`/api/featured_colleges/getCollegeById?collegeId=${id}`),
  getExams: () => fetcher<ExamApiResponse[]>(API_CONFIG.endpoints.getExams),
  getExamById: (id: string) => fetcher<unknown>(`/api/exams/getExamById?examId=${id}`),
  getCourses: () => fetcher<CourseApiResponse[]>(API_CONFIG.endpoints.getCourses),
  getCounsellors: () => fetcher<CounsellorApiResponse[]>(API_CONFIG.endpoints.getCounsellors),
  getLoggedOutCounsellors: () => fetcher<AllCounselor[]>(`/api/shared/getAllCounsellors`),
  getLoggedInCounsellors: (userId: string, token: string) => authFetcher<AllCounselor[]>(`/api/user/counsellorsAccordingToInterestedCourse/all?userName=${userId}`, token),
  getCounselorById: (id: string) => fetcher<CounselorDetails>(`${API_CONFIG.endpoints.getCounsellorById}?counsellorId=${id}`),
  getCounselorNonAvailability: async (userId: string, counsellorId: string) => {
  const token = getToken();
    if (!token) {
      throw new Error('Please log in to continue');
    }
    
    const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.getCounsellorNonAvailability}?userId=${userId}&counsellorId=${counsellorId}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error("Failed to fetch counselor availability");
    
    const data = await res.json();
    return data;
  },
  
  bookAppointment: async (bookingData: BookingRequest): Promise<BookingResponse> => {
  const token = getToken();
    if (!token) {
      throw new Error('Please log in to continue');
    }
    
    const res = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.bookAppointment}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!res.ok) throw new Error("Failed to book appointment");
    return res.json();
  },

  searchCounsellors: async (
    userName: string,
    filters: {
      city?: string;
      languagesKnow?: string;
      workingDays?: string;
      experience?: string;
      minPrice?: string;
      maxPrice?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    },
    page: number = 0,
    pageSize: number = 9
  ) => {
    const token = getToken();
    if (!token) throw new Error("Please log in to continue");

    const params = new URLSearchParams();

    params.append("userName", userName);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", filters.sortBy || "priority");
    params.append("sortOrder", filters.sortOrder || "desc");

    if (filters.city) params.append("city", filters.city);
    if (filters.languagesKnow) params.append("languagesKnow", filters.languagesKnow);
    if (filters.workingDays) params.append("workingDays", filters.workingDays);
    if (filters.experience) params.append("experience", filters.experience);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.search) params.append("search", filters.search);

    const endpoint = `${API_CONFIG.endpoints.searchCounsellors}?${params.toString()}`;

    const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to search counselors");
    return res.json();
  },

  searchAllLoggedOutCounsellors: async (
    filters: {
      city?: string;
      languagesKnow?: string;
      workingDays?: string;
      experience?: string;
      minPrice?: string;
      maxPrice?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    },
    page: number = 0,
    pageSize: number = 9
  ) => {
    const params = new URLSearchParams();
    
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", filters.sortBy || "priority");
    params.append("sortOrder", filters.sortOrder || "desc");

    if (filters.city) params.append("city", filters.city);
    if (filters.languagesKnow) params.append("languagesKnow", filters.languagesKnow);
    if (filters.workingDays) params.append("workingDays", filters.workingDays);
    if (filters.experience) params.append("experience", filters.experience);
    if (filters.minPrice) params.append("minPrice", filters.minPrice);
    if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
    if (filters.search) params.append("search", filters.search);

    const endpoint = `/api/shared/getAllCounsellors/search?${params.toString()}`;

    const res = await fetch(`${API_CONFIG.baseUrl}${endpoint}`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) throw new Error("Failed to search all counselors");
    return res.json();
  },

  searchExams: async (
    filters: {
      search?: string;
      level?: string;
      type?: string;
      sortBy?: string;
      sortOrder?: string;
    }, 
    page: number = 0, 
    pageSize: number = 9
  ) => {
    const params = new URLSearchParams();
    
    if (filters.search) params.append("search", filters.search);
    if (filters.level) params.append("examLevel", filters.level);
    if (filters.type) params.append("examType", filters.type);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
    
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    const res = await fetch(`${API_CONFIG.baseUrl}/api/exams/all/search?${params.toString()}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error("Failed to search exams");
    return res.json();
  },

  getTopCounsellorsAuth: async (userId: string, limit: number = 8) => {
    const token = getToken();
    if (!token) throw new Error('Please log in to continue');

    const res = await fetch(`${API_CONFIG.baseUrl}/api/user/topCounsellors?userId=${userId}&limit=${limit}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) throw new Error("Failed to fetch top counselors");
    return res.json();
  },

  getTopCounsellorsPublic: async (limit: number = 8) => {
    const res = await fetch(`${API_CONFIG.baseUrl}/api/shared/topCounsellors?limit=${limit}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error("Failed to fetch top counselors");
    return res.json();
  },

  getTopExams: async (limit: number = 8) => {
    const res = await fetch(`${API_CONFIG.baseUrl}/api/exams/topExams?limit=${limit}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) throw new Error("Failed to fetch top exams");
    return res.json();
  },
};
