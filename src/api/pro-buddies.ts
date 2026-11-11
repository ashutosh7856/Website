import type {
  ListingProBudddy,
  PostReview,
  ProBuddyLink,
  ProBuddyProfileForProBuddy,
  ProBuddyReviewForUser,
  ProBuddyUserSide,
  WorkingDay,
} from "@/types/probuddies";
import { API_CONFIG } from "./config";
import type { collegeProbuddy } from "@/components/Revamp/probuddies/CollegeSection";
import { getToken, getStoredPhone } from '@/lib/tokenManager';

export type FeaturedCollegeInIndia = {
  country: string;
  domains: string[];
  "state-province": string;
  name: string;
  alpha_two_code: string;
  web_pages: string[];
};

export type ProBuddyListingFilters = {
  collegeName?: string;
  state?: string;
  city?: string;
  course?: string;
  languagesKnow?: string;
  workingDays?: string;
  minRatePerMinute?: number;
  maxRatePerMinute?: number;
  minRating?: number;
  maxRating?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type CreateProBuddyCallRequestPayload = {
  proBuddyId: string;
  userId: string;
  scheduledTime: string;
  scheduledDate: string;
};

export type UpdateProBuddyProfilePayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  collegeName: string;
  collegeId: string | null;
  currentYear: string;
  course: string;
  city: string;
  state: string;
  languagesKnow: string[];
  aboutMe: {
    heading: string;
    subHeading: string;
    aboutMe: string;
  };
  whoShouldConnect: string;
  links: ProBuddyLink[];
  offerings: Record<string, number>;
  ratePerMinute: number | null;
  workingDays: WorkingDay[];
  officeStartTime: string;
  officeEndTime: string;
};

const getAuthToken = () => getToken() ?? "";
const getStoredUserId = () => getStoredPhone() ?? "";

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

const appendQueryParam = (params: URLSearchParams, key: string, value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return;
  }
  params.append(key, String(value));
};

const buildApiUrl = (endpoint: string, query?: Record<string, string>) => {
  const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (!value) {
        return;
      }
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
};

const parseApiResponse = async (response: Response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

/** Treat a parsed JSON value as a plain object for optional field lookups. */
const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" ? (value as Record<string, unknown>) : undefined;

const normalizeProBuddyListResponse = (data: unknown): ListingProBudddy[] => {
  const obj = asRecord(data);
  let list: ListingProBudddy[] = [];

  if (Array.isArray(data)) {
    list = data;
  } else if (Array.isArray(obj?.proBuddies)) {
    list = obj.proBuddies;
  } else if (Array.isArray(obj?.data)) {
    list = obj.data;
  } else if (Array.isArray(obj?.result)) {
    list = obj.result;
  }

  // Hide only ProBuddies explicitly marked unverified; show the rest
  // (including those where the API omits the `verified` field).
  return list.filter((item) => item?.verified !== false);
};

const normalizeProBuddyReviewsResponse = (data: unknown): ProBuddyReviewForUser[] => {
  const obj = asRecord(data);
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(obj?.data)) {
    return obj.data;
  }

  if (Array.isArray(obj?.reviews)) {
    return obj.reviews;
  }

  return [];
};

const normalizeFeaturedCollegesResponse = (data: unknown): FeaturedCollegeInIndia[] => {
  const obj = asRecord(data);
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(obj?.data)) {
    return obj.data;
  }

  if (Array.isArray(obj?.colleges)) {
    return obj.colleges;
  }

  if (Array.isArray(obj?.result)) {
    return obj.result;
  }

  return [];
};

export const registerProBuddy = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.proBuddySignup}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Failed to register ProBuddy");
  // Success is decided by the response body, not the HTTP status (may be 200).
  // Only treat registration as successful when statusCode is "CREATED".
  if (data?.statusCode !== "CREATED") {
    throw new Error(data?.message || data?.error || "Failed to register ProBuddy");
  }
  return data;
};

export const registerProBuddyWithUploads = async (
  payload: Record<string, unknown>,
  photo?: File | null,
  idCard?: File | null
) => {
  console.info("registerProBuddyWithUploads: starting registration", { payload, hasPhoto: !!photo, hasIdCard: !!idCard });
  const data = await registerProBuddy(payload);

  console.info("registerProBuddyWithUploads: registration result", data);

  const extractId = (value: unknown): string | null => {
    const obj = asRecord(value);
    if (!obj) return null;
    const candidates = [
      obj.id,
      obj.proBuddyId,
      obj.counsellorId,
      obj._id,
      obj.pro_buddy_id,
      obj.probuddyId,
    ];

    for (const c of candidates) {
      if (c) return String(c);
    }

    // look into common nested containers
    if (obj.data && typeof obj.data === "object") {
      const nested = extractId(obj.data);
      if (nested) return nested;
    }

    if (obj.result && typeof obj.result === "object") {
      const nested = extractId(obj.result);
      if (nested) return nested;
    }

    return null;
  };

  // Prefer the phoneNumber from the payload as the canonical proBuddy ID (signup uses phone as identifier).
  const newBuddyId = payload?.phoneNumber ? String(payload.phoneNumber) : (extractId(data) || extractId(data?.data) || extractId(data?.result) || null);

  if (!newBuddyId) {
    console.warn("registerProBuddyWithUploads: could not determine new proBuddyId from response or payload; skipping uploads", { data, payload });
    return data;
  }

  if (!newBuddyId) {
    console.warn("registerProBuddyWithUploads: could not determine new proBuddyId from response; skipping uploads", { data, payload });
    return data;
  }

  let photoResult: unknown = null;
  let idCardResult: unknown = null;

  if (photo) {
    try {
      console.info("registerProBuddyWithUploads: uploading photo", { newBuddyId, photoName: photo.name });
      photoResult = await uploadProBuddyPhoto(newBuddyId, photo);
      console.info("registerProBuddyWithUploads: photo upload result", photoResult);
    } catch (err) {
      console.error("Photo upload failed during register:", err);
      throw err;
    }
  }

  if (idCard) {
    try {
      console.info("registerProBuddyWithUploads: uploading idCard", { newBuddyId, idCardName: idCard.name });
      idCardResult = await uploadProBuddyIdCardPhoto(newBuddyId, idCard);
      console.info("registerProBuddyWithUploads: idCard upload result", idCardResult);
    } catch (err) {
      console.error("ID card upload failed during register:", err);
      throw err;
    }
  }

  return { ...data, photoResult, idCardResult };
};

export const uploadProBuddyPhoto = async (proBuddyId: string, photo: File) => {
  console.info("uploadProBuddyPhoto called", { proBuddyId, fileName: photo?.name });
  const formData = new FormData();
  formData.append("proBuddyId", proBuddyId);
  formData.append("photo", photo);

  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.proBuddyUploadPhoto}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      Accept: "application/json",
    },
    body: formData,
  });

  const data = await parseApiResponse(response);
  if (!response.ok) {
    throw new Error(
      typeof data === "object" && data !== null
        ? (data as { message?: string; error?: string }).message ||
            (data as { message?: string; error?: string }).error ||
            "Failed to upload photo"
        : "Failed to upload photo"
    );
  }
  return data;
};

export const uploadProBuddyIdCardPhoto = async (proBuddyId: string, photo: File) => {
  console.info("uploadProBuddyIdCardPhoto called", { proBuddyId, fileName: photo?.name });
  const formData = new FormData();
  formData.append("proBuddyId", proBuddyId);
  formData.append("photo", photo);

  const response = await fetch(
    `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.proBuddyUploadIdCardPhoto}`,
    {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Accept": "application/json"
    },
    body: formData,
    }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Failed to upload ID Card");
  return data;
};

export const getAllCollegesListInIndia = async (): Promise<FeaturedCollegeInIndia[]> => {
  const response = await fetch(`${API_CONFIG.baseUrl}/api/featured_colleges/getAllCollegesListInIndia`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    redirect: "follow",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get colleges list");
  }

  return normalizeFeaturedCollegesResponse(data);
};





export const getAllProBudddiesUser = async (
  userId: string | null,
  filters: ProBuddyListingFilters = {}
): Promise<ListingProBudddy[]> => {
  const token = getAuthToken();
  const effectiveUserId = userId || getStoredUserId();
  const isLoggedInUser = Boolean(effectiveUserId && token);
  const endpoint = isLoggedInUser ? "/api/user/getAllProBuddies" : "/api/shared/getAllProBuddies";

  const queryParams = new URLSearchParams();
  if (isLoggedInUser) {
    appendQueryParam(queryParams, "userId", effectiveUserId);
  }

  appendQueryParam(queryParams, "collegeName", filters.collegeName);
  appendQueryParam(queryParams, "state", filters.state);
  appendQueryParam(queryParams, "city", filters.city);
  appendQueryParam(queryParams, "course", filters.course);
  appendQueryParam(queryParams, "languagesKnow", filters.languagesKnow);
  appendQueryParam(queryParams, "workingDays", filters.workingDays);
  appendQueryParam(queryParams, "minRatePerMinute", filters.minRatePerMinute);
  appendQueryParam(queryParams, "maxRatePerMinute", filters.maxRatePerMinute);
  appendQueryParam(queryParams, "minRating", filters.minRating);
  appendQueryParam(queryParams, "maxRating", filters.maxRating);
  appendQueryParam(queryParams, "sortBy", filters.sortBy ?? "rating");
  appendQueryParam(queryParams, "sortOrder", filters.sortOrder ?? "desc");
  appendQueryParam(queryParams, "page", filters.page ?? 0);
  appendQueryParam(queryParams, "pageSize", filters.pageSize ?? 200);

  const response = await fetch(`${API_CONFIG.baseUrl}${endpoint}?${queryParams.toString()}`, {
    method: "GET",
    headers: {
      ...(isLoggedInUser ? getAuthHeaders() : {}),
      Accept: "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get probuddies");
  }

  return normalizeProBuddyListResponse(data);
};


export const getProBuddyForUser = async (userId: string | null, proBuddyId: string): Promise<ProBuddyUserSide> => {
  const token = getAuthToken();
  const effectiveUserId = userId || getStoredUserId();

  const reviewsPromise = getAllReviewsReceivedByAProBuddyForUser(proBuddyId).catch(() => [] as ProBuddyReviewForUser[]);

  if (!effectiveUserId || !token) {
    // // call non jwt api here and return the profile
    // const data: ProBuddyUserSide = {
    //   "proBuddyId": "2400000000",
    //   "role": "proBuddy",
    //   "firstName": "Ashutosh",
    //   "lastName": "Kumar",
    //   "phoneNumber": "2400000000",
    //   "email": "ar216589.5@gmail.com",
    //   "photoUrl": null,
    //   "collegeName": "Sharda University",
    //   "currentYear": "3",
    //   "course": "Btech Information Technology",
    //   "noOfRatingsReceived": null,
    //   "rating": null,
    //   "city": "Greater  Noida",
    //   "state": "Greater  Noida",
    //   "languagesKnow": [
    //     "Hindi",
    //     "English"
    //   ],
    //   "aboutMe": {
    //     "heading": "Deep learning",
    //     "subHeading": "Btech ",
    //     "aboutMe": "I've helped 850+ aspiring students navigate their college journey at IIT Delhi. Passionate about making the admission process less stressful and sharing real college insights that matter. Currently in 3rd year, been through it all - exams, placements, hostel life, branch selection"
    //   },
    //   "whoShouldConnect": "Connect with me if you want real, unfiltered advice about IIT admission, competitive exam preparation, and actual college life (not just the Instagram version!)",
    //   "links": null,
    //   "offerings": {
    //     "Attendance": 5,
    //     "Campus Vibe": 5,
    //     "Mess Food": 5,
    //     "Faculty Quality": 5
    //   },
    //   "ratePerMinute": 150,
    //   "workingDays": [
    //     "Monday",
    //     "Tuesday",
    //     "Wednesday",
    //     "Thursday",
    //     "Friday"
    //   ],
    //   "officeStartTime": "09:00",
    //   "officeEndTime": "18:00",
    //   "walletAmount": 0,
    //   "fcmToken": null,
    //   "voipToken": null,
    //   "verified": false
    // }

    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.proBuddyProfileForUserGuest, { proBuddyId }), {
      headers: {
        Accept: 'application/json'
      }
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || data.error || "Failed to get profile details")

    const reviews = await reviewsPromise;
    const backendCount = Number(data?.noOfRatingsReceived ?? 0);
    const resolvedCount = reviews.length > 0 ? reviews.length : backendCount;

    return {
      ...data,
      noOfRatingsReceived: resolvedCount > 0 ? resolvedCount : null,
      reviewsReceivedForUser: reviews,
      reviewsCountForUser: resolvedCount,
    };

  } else {
    const response = await fetch(buildApiUrl(API_CONFIG.endpoints.proBuddyProfileForUser, {
      userId: effectiveUserId,
      proBuddyId,
    }),
      {
        headers: {
          ...getAuthHeaders(),
          Accept: 'application/json'
        }
      }
    )
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || data.error || "Failed to get profile details")

    const reviews = await reviewsPromise;
    const backendCount = Number(data?.noOfRatingsReceived ?? 0);
    const resolvedCount = reviews.length > 0 ? reviews.length : backendCount;

    return {
      ...data,
      noOfRatingsReceived: resolvedCount > 0 ? resolvedCount : null,
      reviewsReceivedForUser: reviews,
      reviewsCountForUser: resolvedCount,
    }
  }
}


export const getAllReviewsReceivedByAProBuddyForUser = async (proBuddyId: string): Promise<ProBuddyReviewForUser[]> => {
  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyReviewsForUser, { proBuddyId }),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get ProBuddy reviews");
  }

  return normalizeProBuddyReviewsResponse(data);
};



export const postReview = async (params: PostReview) => {
  if (!getAuthToken()) {
    throw new Error("Please login to post a review")
  }
  if (!params.proBuddyId || !params.userId || params.rating === null || params.rating === undefined) {
    throw new Error("Some required fields are missing for review")
  }
  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.proBuddyPostReview}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/json',
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params)
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || data.error || "Failed to post review")
  return data
}

export const getProBuddyProfileGuest = async (proBuddyId: string): Promise<ProBuddyUserSide> => {
  if (!proBuddyId) throw new Error('proBuddyId is required');

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyProfileForUserGuest, { proBuddyId }),
    { headers: { Accept: 'application/json' } }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Failed to get ProBuddy profile');
  return data;
};

export const getProBuddyByIdForProBuddy = async (proBuddyId: string): Promise<{
  message?: string;
  status?: boolean;
  data: ProBuddyProfileForProBuddy;
}> => {
  if (!proBuddyId) {
    throw new Error("proBuddyId is required");
  }

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyProfileForProBuddy, { proBuddyId }),
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get ProBuddy profile details");
  }

  return data;
}

export const updateProBuddyProfile = async (
  proBuddyId: string,
  payload: Partial<UpdateProBuddyProfilePayload>
) => {
  if (!proBuddyId) {
    throw new Error("proBuddyId is required");
  }

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyUpdateProfile, { proBuddyId }),
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to update ProBuddy profile");
  }

  return data;
};

export const getRequestsReceivedByProBuddy = async (proBuddyId: string) => {
  if (!proBuddyId) {
    throw new Error("proBuddyId is required");
  }

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyRequestsReceived, { proBuddyId }),
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get requests received by ProBuddy");
  }

  return data;
};

export const getProBuddyCallHistory = async (proBuddyId: string) => {
  if (!proBuddyId) {
    throw new Error("proBuddyId is required");
  }

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyCallHistory, { proBuddyId }),
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get ProBuddy call history");
  }

  return data;
};

export const getUserCallHistory = async (userId: string) => {
  if (!userId) {
    throw new Error("userId is required");
  }

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.userCallHistory, { userId }),
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get user call history");
  }

  return data;
};

export const createProBuddyCallRequest = async (payload: CreateProBuddyCallRequestPayload) => {
  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.proBuddyCreateCallRequest}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to create ProBuddy call request");
  }

  return data;
};

export const getAllReviewsReceivedByAProBuddyForProBuddy = async (proBuddyId: string) => {
  if (!proBuddyId) {
    throw new Error("proBuddyId is required");
  }

  const response = await fetch(
    buildApiUrl(API_CONFIG.endpoints.proBuddyReviewsForProBuddy, { proBuddyId }),
    {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        Accept: "application/json",
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Failed to get ProBuddy reviews for ProBuddy");
  }

  return data;
};



const getAllProBuddyColleges = async ():Promise<collegeProbuddy[]>  =>
{
  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.proBuddyColleges}`, 
    {
      headers:{
        Accept:'application/json'
      }
    }
  )
  if(!response.ok){
    throw Error("failed to load  colleges")
  }
  const data  = await response.json()
  return data;
}





export type ConnectCallPayload = {
  from: string;
  to: string;
  userId: string;
  proBuddyId: string;
};

export const connectInstantCall = async (payload: ConnectCallPayload) => {
  const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.connectCall}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to connect call');
  }
  return data;
};

/**
 * The listing, forced onto the public route.
 *
 * `getAllProBudddiesUser` upgrades itself to `/api/user/getAllProBuddies`
 * whenever a token and a stored user id are present — which is exactly the
 * situation a signed-in school student is in. That route is scoped to a `users`
 * row, and school-student signup deletes theirs, so it is the wrong endpoint
 * for this role even though the call looks like it should work.
 *
 * This asks for `/api/shared/getAllProBuddies` and cannot be talked out of it.
 * Used by the school shell, which is browse-only: nothing there books, calls or
 * pays, so nothing there needs a user-scoped response.
 */
export const getAllProBuddiesPublic = async (
  filters: ProBuddyListingFilters = {}
): Promise<ListingProBudddy[]> => {
  const queryParams = new URLSearchParams();
  appendQueryParam(queryParams, "collegeName", filters.collegeName);
  appendQueryParam(queryParams, "state", filters.state);
  appendQueryParam(queryParams, "city", filters.city);
  appendQueryParam(queryParams, "course", filters.course);
  appendQueryParam(queryParams, "languagesKnow", filters.languagesKnow);
  appendQueryParam(queryParams, "workingDays", filters.workingDays);

  const query = queryParams.toString();
  const response = await fetch(
    `${API_CONFIG.baseUrl}/api/shared/getAllProBuddies${query ? `?${query}` : ""}`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: Failed to load ProBuddies`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

export const probuddiesApi = {
  uploadPhoto: (proBuddyId: string, photo: File) => uploadProBuddyPhoto(proBuddyId, photo),
  uploadIdCard: (proBuddyId: string, photo: File) => uploadProBuddyIdCardPhoto(proBuddyId, photo),
  registerWithUploads: (payload: Record<string, unknown>, photo?: File | null, idCard?: File | null) =>
    registerProBuddyWithUploads(payload, photo, idCard),
  listing: (userId: string | null, filters?: ProBuddyListingFilters) => getAllProBudddiesUser(userId, filters),
  /** Browse-only listing that never uses the user-scoped route. */
  listingPublic: (filters?: ProBuddyListingFilters) => getAllProBuddiesPublic(filters),
  profileUser: (userId: string | null, proBudddyId: string) => getProBuddyForUser(userId, proBudddyId),
  reviewsForUser: (proBuddyId: string) => getAllReviewsReceivedByAProBuddyForUser(proBuddyId),
  postReview: (params: PostReview) => postReview(params),
  profileGuest: (proBuddyId: string) => getProBuddyProfileGuest(proBuddyId),
  profileForProBuddy: (proBuddyId: string) => getProBuddyByIdForProBuddy(proBuddyId),
  updateProfile: (proBuddyId: string, payload: Partial<UpdateProBuddyProfilePayload>) =>
    updateProBuddyProfile(proBuddyId, payload),
  requestsReceivedByProBuddy: (proBuddyId: string) => getRequestsReceivedByProBuddy(proBuddyId),
  proBuddyCallHistory: (proBuddyId: string) => getProBuddyCallHistory(proBuddyId),
  userCallHistory: (userId: string) => getUserCallHistory(userId),
  createCallRequest: (payload: CreateProBuddyCallRequestPayload) => createProBuddyCallRequest(payload),
  reviewsForProBuddy: (proBuddyId: string) => getAllReviewsReceivedByAProBuddyForProBuddy(proBuddyId),
  getColleges: () => getAllProBuddyColleges(),
  connectInstantCall: (payload: ConnectCallPayload) => connectInstantCall(payload),
}

