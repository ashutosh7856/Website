import { useQuery } from "@tanstack/react-query";
import { academicApi } from '@/api/academic';
import { useAuthStore } from '@/store/AuthStore';
import type { AllCounselor, ExamApiResponse } from "@/types/academic";

const transformCounselor = (apiData: AllCounselor): AllCounselor => {
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
};

export function useHomeCounselors(limit: number = 8) {
  const userId = useAuthStore((state) => state.userId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);

  return useQuery({
    queryKey: ["home-counselors", isAuthenticated, userId, role, limit], 
    queryFn: async () => {
      if (isAuthenticated && role === 'user' && userId) {
        return academicApi.getTopCounsellorsAuth(userId, limit);
      }
      return academicApi.getTopCounsellorsPublic(limit);
    },
    select: (data) => (data?.counsellors || []).map(transformCounselor),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useHomeExams(limit: number = 8) {
  return useQuery({
    queryKey: ["home-exams", limit],
    queryFn: () => academicApi.getTopExams(limit),
    select: (data) => {
      const list = data.content || data.exams || data.counsellors || [];
      return list.map((exam: ExamApiResponse) => ({
        id: exam.examId,
        name: exam.examName,
        level: exam.examLevel,
        bannerUrl: exam.bannerUrl || exam.iconUrl,
        iconUrl: exam.iconUrl,
      }));
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}