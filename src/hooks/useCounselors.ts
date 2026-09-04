import { useQuery } from "@tanstack/react-query";
import { academicApi } from '@/api/academic';
import type { Counselor, AllCounselor, CounsellorApiResponse } from '@/types/academic';
import { useAuthStore } from '@/store/AuthStore';
import { COUNSELLORS_SNAPSHOT } from '@/data/counsellorsSnapshot';
import seoConfig from '@/config/seo.json';

// Build-time snapshot of every published counsellor, mapped onto the shape the
// live API returns. Blogs and deadlines already seed their lists this way
// (useBlogs / useDeadlines); counsellors did not, so during the prerender —
// where the Cloud Run API is deliberately blocked — every counsellor list
// rendered its error state. Googlebot saw "Failed to load counsellors" and not
// one link to the 102 profiles in the sitemap, leaving them all orphan URLs
// that Search Console reports as "Discovered - currently not indexed".
export const COUNSELLORS_SNAPSHOT_LIST: AllCounselor[] = COUNSELLORS_SNAPSHOT.map((c) => ({
  counsellorId: c.counsellorId,
  firstName: c.firstName,
  lastName: c.lastName,
  photoUrlSmall: c.photoUrl || null,
  rating: c.rating,
  ratePerYear: c.ratePerYear,
  experience: c.experience ? String(c.experience) : null,
  languagesKnow: c.languagesKnow,
  city: c.city,
  states: c.states,
  numberOfRatings: String(c.numberOfRatings ?? 0),
  plusAmount: c.plusAmount,
  proAmount: c.proAmount,
  eliteAmount: c.eliteAmount,
  expertise: c.expertise,
  organisationName: c.organisationName,
}));

/**
 * The one rule for whether a counsellor profile is worth indexing. It is
 * mirrored by scripts/generate-content-snapshot.mjs (which writes
 * `counsellorsThin`, driving what the sitemap includes) and by the `noIndex`
 * on RevampCounselorDetailsPage. All three must agree — the sitemap, the page's
 * robots tag, and the crawlable index that links to it — or Google receives
 * contradictory signals about the same URL.
 */
export const THIN_PROFILE_BIO_CHARS = 120;

/**
 * Whether counsellor profiles are submitted to Google at all. Read from
 * src/config/seo.json so the page's robots tag and the sitemap (built by
 * scripts/site-routes.mjs) always agree. See that file for why it is off.
 */
export const COUNSELLOR_PROFILES_INDEXABLE = seoConfig.counsellorProfilesIndexable;

/**
 * Profiles with a real bio, used for the browse-all list on /counsellor-listing.
 * This is a *navigation* decision, not an indexing one: the grid paginates 9 at
 * a time behind infinite scroll, so without this list the rest of the profiles
 * are unreachable by link. It stays useful to readers (and keeps the pages
 * discoverable if they are re-indexed later) even while they are noindexed.
 */
export const LISTED_COUNSELLORS = COUNSELLORS_SNAPSHOT.filter(
  (c) => Boolean(c.encodedId) && c.bioLength >= THIN_PROFILE_BIO_CHARS,
);

/**
 * The shared `['revamp-counsellors']` list used by the Admissions and Courses
 * counsellor carousels. Seeded from the snapshot so it renders real, linked
 * cards during the prerender; `initialDataUpdatedAt: 0` marks that data stale
 * so the client still refetches live results on mount.
 */
export function useCounsellorsList() {
  return useQuery({
    queryKey: ["revamp-counsellors"],
    queryFn: () => academicApi.getLoggedOutCounsellors(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    initialData: COUNSELLORS_SNAPSHOT_LIST.length ? COUNSELLORS_SNAPSHOT_LIST : undefined,
    initialDataUpdatedAt: 0,
  });
}


function transformCounselorData(apiData: CounsellorApiResponse): Counselor {
  const fullName = `${apiData.firstName} ${apiData.lastName}`;
  const specialization = apiData.languagesKnow.slice(0, 2).join(', ');
  const experience = apiData.experience ?
    (apiData.experience.includes('year') ? apiData.experience : `${apiData.experience} Yrs`) :
    'N/A';

  const imageUrl = apiData.photoUrlSmall || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=6B7280&color=ffffff&size=400`;

  return {
    id: apiData.counsellorId,
    name: fullName,
    description: specialization,
    experience: experience,
    imageUrl: imageUrl,
    verified: true,
  };
}

function transformAllCounselorData(apiData: AllCounselor): AllCounselor {
  return {
    counsellorId: apiData.counsellorId,
    firstName: apiData.firstName,
    lastName: apiData.lastName,
    photoUrlSmall: apiData.photoUrlSmall || null,
    rating: apiData.rating || 0,
    ratePerYear: apiData.ratePerYear || 0,
    experience: apiData.experience || "0",
    languagesKnow: apiData.languagesKnow || [],
    city: apiData.city || "",
    workingDays: apiData.workingDays || [],
    plan: apiData.plan || null,
    subscriptionMode: apiData.subscriptionMode || null,
    numberOfRatings: apiData.numberOfRatings || "0",
    states: apiData.states || [],
    plusAmount: apiData.plusAmount,
    proAmount: apiData.proAmount,
    eliteAmount: apiData.eliteAmount,
  };
}

export function useCounselors(limit?: number) {

  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);

  const {
    data,
    isLoading: loading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["counselors", "default", { role, userId }],
    queryFn: academicApi.getCounsellors,

    select: (apiData) => {
      let transformedData = apiData.map(transformCounselorData);
      if (role === "counselor" && userId) {
        transformedData = transformedData.filter((c) => c.id !== userId);
      }
      return limit ? transformedData.slice(0, limit) : transformedData;
    },
  });

  const error = isError
    ? (queryError as Error)?.message || "Failed to load counselors."
    : null;

  return { data, loading, error, refetch };
}

export function useAllCounselors(limit?: number) {
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.loading);

  const {
    data,
    isLoading: queryLoading,
    isError,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["counselors", "all", { isAuthenticated, role, userId }],
    queryFn: async () => {
      const currentUserId = useAuthStore.getState().userId;
      const currentRole = useAuthStore.getState().role;
      const currentIsAuthenticated = useAuthStore.getState().isAuthenticated;
      const currentToken = localStorage.getItem('jwt');

      if (currentIsAuthenticated && currentRole === 'user' && currentUserId && currentToken) {
        return academicApi.getLoggedInCounsellors(currentUserId, currentToken);
      }

      return academicApi.getLoggedOutCounsellors();
    },

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: !authLoading,
    // Seeded from the build-time snapshot: the /counselling/[city] pages read
    // this list, and with the API blocked during the prerender they otherwise
    // rendered "no counsellors here yet" with no profile links for Googlebot.
    // Logged-in users still get their personalised list on refetch.
    initialData: COUNSELLORS_SNAPSHOT_LIST.length ? COUNSELLORS_SNAPSHOT_LIST : undefined,
    initialDataUpdatedAt: 0,
    select: (apiData) => {
      let transformedData = apiData.map(transformAllCounselorData);
      if (role === "counselor" && userId) {
        transformedData = transformedData.filter(
          (c) => c.counsellorId !== userId
        );
      }
      return limit ? transformedData.slice(0, limit) : transformedData;
    },
  });

  const error = isError
    ? (queryError as Error)?.message || "Failed to load counselors."
    : null;

  return { data, loading: authLoading || queryLoading, error, refetch };
}

export function useCounselorById(counsellorId: string) {
  const {
    data: counselor,
    isLoading: loading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["counselor", counsellorId],
    queryFn: () => academicApi.getCounselorById(counsellorId),
    enabled: !!counsellorId,
    staleTime: 5 * 60 * 1000,  // 5 minutes — don't refetch on navigate back
    gcTime: 10 * 60 * 1000,    // 10 minutes cache
  });

  const error = isError
    ? (queryError as Error)?.message || "Failed to load counselor data."
    : !counsellorId && !loading
      ? "Counselor ID is not provided."
      : null;

  return { counselor, loading, error };
}