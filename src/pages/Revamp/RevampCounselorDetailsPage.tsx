import { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useCounselorById, THIN_PROFILE_BIO_CHARS, COUNSELLOR_PROFILES_INDEXABLE } from '@/hooks/useCounselors';
import { useAuthStore } from '@/store/AuthStore';
import {
  getSubscribedCounsellors,
  addFav,
  isManualSubscriptionRequest,
  postReview,
  getReviewsByCounselorId,
} from '@/api/counsellor';
import { updateUserProfile } from '@/api/user';
import { updateUserReview } from '@/api/review';
import { unlockScroll } from '@/lib/scrollLock';
import { decodeCounselorId } from '@/lib/utils';
import toast from 'react-hot-toast';

import type { SubscribedCounsellor } from '@/types/user';
import type { CounselorReview } from '@/types/counselorReview';
import EditProfileModal from '@/components/student-dashboard/EditProfileModal';
import { RevampCounselorProfileCard } from '@/components/Revamp/counsellor-details/RevampCounselorProfileCard';
import { RevampFreeCareerAssessmentCard } from '@/components/Revamp/counsellor-details/FreeCareerAssessmentCard';
import RevampCounselorCoursesCard from '@/components/Revamp/counsellor-details/CounselorCoursesCard';
import RevampCounselorTestsCard from '@/components/Revamp/counsellor-details/CounselorTestsCard';
import { RevampCounselorReviews } from '@/components/Revamp/counsellor-details/CounselorReviews';
import PageSEO from '@/components/SEO/PageSEO';
import { COUNSELLORS_SNAPSHOT } from '@/data/counsellorsSnapshot';
// The bios live in their own module and are imported ONLY here. This is the one
// page that renders one, and it is a lazy route — keeping them out of
// counsellorsSnapshot.ts is what stops 68 KB of prose riding along with the
// home page's counsellor carousel. See generate-content-snapshot.mjs.
import { COUNSELLOR_BIOS } from '@/data/counsellorBios';
import type { CounselorDetails } from '@/types/academic';

type ApiSubscribedCounselor = {
  counsellorId: string;
  plan: string | null;
  subscriptionMode: string | null;
};

export default function RevampCounselorDetailsPage() {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  type LocationState = { id?: string } | undefined;
  const state = location.state as LocationState;
  const queryId = searchParams.get('id');

  const decodedParamId = paramId ? decodeCounselorId(paramId) : null;
  const computedId = decodedParamId || queryId || state?.id;

  const { counselor: liveCounselor, loading, error } = useCounselorById(computedId ?? '');

  /**
   * Build-time copy of this counsellor's public profile.
   *
   * The prerender runs with the API blocked, so without this the crawler saw
   * "Loading Profile..." and the page shipped the home page's title,
   * description and canonical — 120 URLs that all looked like duplicates of the
   * home page. The snapshot renders the real profile immediately; the live API
   * replaces it on mount for anything that has changed since the build.
   */
  const seedCounselor = useMemo(() => {
    const row = COUNSELLORS_SNAPSHOT.find(
      (c) => c.encodedId === paramId || (computedId && c.counsellorId === computedId),
    );
    if (!row) return null;
    return {
      counsellorId: row.counsellorId,
      userName: row.counsellorId,
      firstName: row.firstName,
      lastName: row.lastName,
      photoUrl: row.photoUrl,
      photoUrlSmall: row.photoUrl,
      rating: row.rating,
      numberOfRatings: String(row.numberOfRatings),
      experience: String(row.experience),
      languagesKnow: row.languagesKnow,
      expertise: row.expertise,
      states: row.states,
      city: row.city,
      description: COUNSELLOR_BIOS[row.counsellorId] ?? '',
      organisationName: row.organisationName,
      ratePerYear: row.ratePerYear,
      plusAmount: row.plusAmount,
      proAmount: row.proAmount,
      eliteAmount: row.eliteAmount,
      fullOfficeAddress: { city: row.city },
      workingDays: [],
      verified: true,
    };
  }, [paramId, computedId]);

  // Live data wins the moment it lands; the snapshot only covers the gap.
  // The seed carries every field this page and its cards actually read;
  // the cast is for the rest of the wide CounselorDetails interface.
  const counselor = liveCounselor ?? (seedCounselor as unknown as CounselorDetails | undefined);
  const { user, userId, refreshUser, role, isAuthenticated, toggleLogin } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const storedPhone = localStorage.getItem('phone');

  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscribedCounsellor | null>(null);
  const [reviews, setReviews] = useState<CounselorReview[]>([]);
  const [userReview, setUserReview] = useState<CounselorReview | null>(null);
  
  const [loadingData, setLoadingData] = useState(true);
  const [isFavourite, setIsFavourite] = useState(false);
  const [isTogglingFavourite, setIsTogglingFavourite] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const isCurrentUserCounselor = (role as string) === 'counselor';

  useEffect(() => {
    unlockScroll();
  }, []);

  useEffect(() => {
    if (user && computedId) {
      const favIds = user.favouriteCounsellorIds || [];
      setIsFavourite(favIds.includes(computedId));
    }
  }, [user, computedId]);

  const fetchReviews = async () => {
    if (!computedId) return;
    try {
      const fetchedReviews = await getReviewsByCounselorId(computedId);
      setReviews(fetchedReviews);
      
      if (userId && !isCurrentUserCounselor) {
        const foundReview = fetchedReviews.find(r => r.userName === userId);
        setUserReview(foundReview || null);
      } else {
        setUserReview(null);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      setReviews([]);
      setUserReview(null);
    }
  };

  useEffect(() => {
    if (!computedId) {
      setLoadingData(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoadingData(true);

        if (!userId || !token) {
          setSubscriptionDetails(null);
          const fetchedReviews = await getReviewsByCounselorId(computedId);
          setReviews(fetchedReviews);
          setUserReview(null);
          return;
        }

        if (isCurrentUserCounselor) {
          setSubscriptionDetails(null);
          const fetchedReviews = await getReviewsByCounselorId(computedId);
          setReviews(fetchedReviews);
          setUserReview(null);
          return;
        }

        const results = await Promise.allSettled([
          getSubscribedCounsellors(userId, token),
          getReviewsByCounselorId(computedId)
        ]);

        // Handle Subscription
        if (results[0].status === "fulfilled") {
          const subscribedList: ApiSubscribedCounselor[] = results[0].value;
          const currentApiSubscription = subscribedList.find(c => c.counsellorId === computedId);
          if (currentApiSubscription && currentApiSubscription.plan) {
            setSubscriptionDetails({
              counsellorId: currentApiSubscription.counsellorId,
              plan: currentApiSubscription.plan,
              subscriptionMode: currentApiSubscription.subscriptionMode ?? "unknown",
            });
          } else {
            setSubscriptionDetails(null);
          }
        }

        // Handle Reviews
        if (results[1].status === "fulfilled") {
          const fetchedReviews = results[1].value;
          setReviews(fetchedReviews);
          
          if (userId && !isCurrentUserCounselor) {
            const foundReview = fetchedReviews.find(r => r.userName === userId);
            setUserReview(foundReview || null);
          } else {
            setUserReview(null);
          }
        } else {
          setReviews([]);
          setUserReview(null);
        }

      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [userId, token, computedId, isCurrentUserCounselor]);

  useEffect(() => {
    if (isCurrentUserCounselor) {
      setPendingApproval(false);
      return;
    }
    if (!subscriptionDetails && storedPhone && counselor?.userName) {
      isManualSubscriptionRequest(storedPhone, counselor.userName)
        .then(res => setPendingApproval(Boolean(res?.pendingApproval)))
        .catch(err => console.error('Manual subscription check failed', err));
    }
  }, [isCurrentUserCounselor, subscriptionDetails, storedPhone, counselor?.userName]);

  const handleProfileIncomplete = (action: () => void) => {
    setPendingAction(() => action);
    setIsEditProfileModalOpen(true);
  };

  const handleUpdateProfile = async (updatedData: { firstName: string; lastName: string; email: string }) => {
    if (!userId || !token) throw new Error("User not authenticated");
    await updateUserProfile(userId, updatedData, token);
    await refreshUser(true);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleSubmitReview = async (reviewText: string, rating: number) => {
    if (!userId || !computedId || !token || !user) {
      toast.error("You must be logged in to post a review.");
      return;
    }
    const optimisticReview: CounselorReview = {
      reviewId: `temp-${Date.now()}`,
      userFullName: String(user.fullName || "Your Name"),
      userPhotoUrl: user.photoSmall || `https://ui-avatars.com/api/?name=${user.fullName || 'U'}`,
      reviewText,
      rating,
      timestamp: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
      userName: userId,
    };
    setReviews(prev => [optimisticReview, ...prev]);
    const loadingToastId = toast.loading("Submitting review...");
    try {
      const response = await postReview({ userId, counsellorId: computedId, reviewText, rating, receiverFcmToken: null, token });
      toast.dismiss(loadingToastId);
      if (response.status === 'success') {
        toast.success("Review posted successfully!");
        await fetchReviews();
      } else {
        throw new Error(response.message || "Failed to post review.");
      }
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error((err as Error).message || "Could not post review.");
      setReviews(prev => prev.filter(r => r.reviewId !== optimisticReview.reviewId));
    }
  };

  const handleUpdateReview = async (reviewText: string, rating: number) => {
    if (!userId || !computedId || !token || !userReview?.reviewId) {
      toast.error("Could not find review ID to update.");
      return;
    }
    const loadingToastId = toast.loading("Updating review...");
    try {
      await updateUserReview({ reviewId: userReview.reviewId, userId, counsellorId: computedId, reviewText, rating }, token);
      toast.dismiss(loadingToastId);
      toast.success("Review updated successfully!");
      await fetchReviews();
    } catch (err) {
      toast.dismiss(loadingToastId);
      toast.error((err as Error).message || "Could not update review.");
    }
  };

  const handleToggleFavourite = async () => {
    const toggleFavAction = async () => {
      const freshUserId = localStorage.getItem('phone');
      const freshToken = localStorage.getItem('jwt');

      if (!freshUserId || !computedId || !freshToken) return;

      setIsTogglingFavourite(true);
      setIsFavourite(prev => !prev);

      try {
        await addFav(freshUserId, computedId);
        await refreshUser(true);
        toast.success("Favourite status updated!");
      } catch (err) {
        setIsFavourite(prev => !prev);
        toast.error("Could not update favourite status.");
      } finally {
        setIsTogglingFavourite(false);
      }
    };

    if (!isAuthenticated) return toggleLogin(toggleFavAction);
    if (!user?.firstName || !user?.email) return handleProfileIncomplete(toggleFavAction);
    await toggleFavAction();
  };

  const handleSubscribeClick = (isUpgrade = false) => {
    if (isCurrentUserCounselor) return toast.error("Counselors cannot subscribe to other counselors.");
    
    const subscribeAction = () => {
      const freshUserId = localStorage.getItem('phone');
      if (!freshUserId || !counselor) return;

      const getUpgradePlan = () => {
        const planHierarchy = ['plus', 'pro', 'elite'];
        const currentPlanIndex = planHierarchy.indexOf(subscriptionDetails?.plan?.toLowerCase() ?? '');
        if (currentPlanIndex === -1 || currentPlanIndex === planHierarchy.length - 1) return null;
        return planHierarchy[currentPlanIndex + 1];
      };

      navigate('/subscribe', { 
        state: { 
          counselorId: counselor.userName, 
          userId: freshUserId, 
          counselor: counselor,
          isUpgrade: isUpgrade,
          ...(isUpgrade && { currentPlan: subscriptionDetails }),
          autoOpenPlan: isUpgrade ? getUpgradePlan() : null,
        } 
      });
    };

    if (!isAuthenticated) return toggleLogin(subscribeAction);
    if (!user?.firstName || !user?.email) return handleProfileIncomplete(subscribeAction);
    subscribeAction();
  };

  if (!computedId) return <div className="p-8 text-center text-red-500">Error: Counsellor ID is missing.</div>;
  if ((loading || loadingData) && !counselor) return <div className="flex h-screen items-center justify-center">Loading Profile...</div>;
  if (!counselor) return <div className="flex h-screen items-center justify-center text-red-500">{error || "Counsellor not found."}</div>;

  const counsellorName = `${counselor.firstName ?? ''} ${counselor.lastName ?? ''}`.trim() || 'Counsellor';
  const counsellorCity = counselor.fullOfficeAddress?.city || seedCounselor?.city || '';
  const expertiseList = (counselor.expertise ?? []).slice(0, 4).join(', ');
  // A profile with no bio is a name, a photo and a price — nothing worth
  // indexing, and 14 such pages drag the whole site's content quality down.
  // It stays fully visible and shareable; it just isn't submitted to Google.
  const isThinProfile =
    !COUNSELLOR_PROFILES_INDEXABLE ||
    (counselor.description || '').trim().length < THIN_PROFILE_BIO_CHARS;
  const seoDescription = (counselor.description || '').trim()
    ? `${counselor.description!.trim().slice(0, 155)}`
    : `${counsellorName} is a verified admission counsellor on ProCounsel${
        counsellorCity ? ` in ${counsellorCity}` : ''
      }${expertiseList ? `, guiding students on ${expertiseList}` : ''}. Book a call or subscribe for one-to-one guidance.`;

  return (
    <div style={{ backgroundColor: '#C6DDF040' }} className="min-h-screen flex flex-col">
      <PageSEO
        title={`${counsellorName} — Admission Counsellor${counsellorCity ? ` in ${counsellorCity}` : ''}`}
        description={seoDescription}
        canonical={paramId ? `/counsellor-details/${paramId}` : undefined}
        image={counselor.photoUrl || undefined}
        type="website"
        noIndex={isThinProfile}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: counsellorName,
            jobTitle: 'Admission Counsellor',
            image: counselor.photoUrl || undefined,
            description: counselor.description || undefined,
            worksFor: { '@type': 'Organization', name: counselor.organisationName || 'ProCounsel' },
            knowsAbout: counselor.expertise ?? [],
            knowsLanguage: counselor.languagesKnow ?? [],
            ...(counsellorCity ? { address: { '@type': 'PostalAddress', addressLocality: counsellorCity } } : {}),
          },
        }}
      />
      
      <div className="py-6 md:py-10 px-3 sm:px-6 lg:px-10 flex flex-col items-center flex-1">
        <div className="w-full max-w-[1330px] flex flex-col xl:flex-row gap-6 md:gap-8">
          
          {/* Left Column (Profile & About) */}
          <div className="flex-1 flex flex-col gap-8 items-center xl:items-end">
            <RevampCounselorProfileCard 
              counselor={counselor}
              subscription={subscriptionDetails}
              isFavourite={isFavourite}
              onToggleFavourite={handleToggleFavourite}
              isTogglingFavourite={isTogglingFavourite}
              user={user}
              onSubscribeClick={handleSubscribeClick}
              pendingApproval={pendingApproval}
              isCurrentUserCounselor={isCurrentUserCounselor}
            />
          </div>

          {/* Right Column (Assessments, Courses, etc.) */}
          <div className="w-full xl:w-[580px] shrink-0 flex flex-col gap-6 md:gap-8 items-center xl:items-start">
            <RevampFreeCareerAssessmentCard 
              counselor={counselor}
              user={user}
              onProfileIncomplete={handleProfileIncomplete}
            />

            <RevampCounselorCoursesCard 
              counsellorId={computedId} 
              userRole={(role as "counselor" | "user" | "student" | "proBuddy") || "user"} 
            />

            <RevampCounselorTestsCard
              counsellorId={computedId}
              userRole={(role as "counselor" | "user" | "student" | "proBuddy") || "user"}
            />
          </div>
          
        </div>
      </div>

      <div className="w-full mt-auto">
        <RevampCounselorReviews 
          reviews={reviews}
          isSubscribed={!!subscriptionDetails}
          counsellorId={computedId}
          onSubmitReview={handleSubmitReview}
          userReview={userReview}
          onUpdateReview={handleUpdateReview}
        />
      </div>

      {user && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => {
            setIsEditProfileModalOpen(false);
            setPendingAction(null);
          }}
          user={user}
          onUpdate={handleUpdateProfile}
          onUploadComplete={() => {}}
        />
      )}
    </div>
  );
}