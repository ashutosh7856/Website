import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import type { CourseType } from "@/types/course";
import { BookOpen, Clock3, Lock, Star, Users } from "lucide-react";
import TestGroupCard from "./TestGroupCard";
import { SeeAllButton } from "../components/LeftRightButton";
import TestGroupReviewsCard from "./TestGroupReviewsCard";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  buyTestGroup,
  getAllTestGroupsForGuest,
  getAllTestGroupsForLoggedInUser,
  getTestGroupByIdForUser,
} from "@/api/testGroup";

interface TestWithMeta extends CourseType {
  description: string;
  isPurchased: boolean;
  isTrending: boolean;
  price: string;
  totalTests: number;
  totalStudents: number;
}

interface TestGroupReview {
  reviewId: string;
  userId: string;
  userFullName?: string;
  rating: number;
  reviewText: string;
  createdAt: { seconds: number; nanos: number };
}

interface TestGroupReviewData {
  reviews: TestGroupReview[];
  bought: boolean;
  rating: number | null;
}

interface TestSeriesItem {
  id: string;
  name: string;
  durationInMinutes: number;
  totalQuestions: number;
}

interface TestGroupDetailView {
  id: string;
  name: string;
  description: string;
  bannerImage: string;
  rating: number;
  ratingCount: number;
  soldCount: number;
  priceType: string;
  priceValue: number;
  priceLabel: string;
  bought: boolean;
  counsellorId: string;
  attachedTests: TestSeriesItem[];
}

const formatPriceLabel = (priceType: string, price: number) => {
  if (String(priceType).toUpperCase() === "FREE") {
    return "Free";
  }
  return Number(price || 0).toLocaleString("en-IN");
};

const normalizeTestGroupDetails = (responseData: any): TestGroupDetailView | null => {
  if (!responseData) return null;

  const tg = responseData?.testGroup ?? responseData;
  const attachedTestsRaw = Array.isArray(responseData?.attachedTests)
    ? responseData.attachedTests
    : Array.isArray(tg?.attachedTests)
      ? tg.attachedTests
      : [];

  const attachedTests = attachedTestsRaw.map((test: any, index: number) => {
    const sections = Array.isArray(test?.listOfSection) ? test.listOfSection : [];
    const totalQuestionsFromSections = sections.reduce(
      (sum: number, section: any) => sum + Number(section?.totalQuestionsAdded ?? 0),
      0
    );

    return {
      id: String(test?.testSeriesId ?? test?.id ?? `attached-test-${index}`),
      name: String(test?.testName ?? test?.name ?? `Test ${index + 1}`),
      durationInMinutes: Number(test?.durationInMinutes ?? 0),
      totalQuestions: Number(test?.totalQuestions ?? totalQuestionsFromSections ?? 0),
    };
  });

  const priceType = String(tg?.priceType ?? "PAID");
  const priceValue = Number(tg?.price ?? 0);

  return {
    id: String(tg?.testGroupId ?? responseData?.testGroupId ?? ""),
    name: String(tg?.testGroupName ?? "Test Group"),
    description: String(tg?.testGroupDescription ?? ""),
    bannerImage: String(tg?.bannerImagUrl ?? tg?.bannerImageUrl ?? "/course/1.jpg"),
    rating: Number(tg?.rating ?? 0),
    ratingCount: Number(tg?.ratingCount ?? responseData?.reviews?.length ?? 0),
    soldCount: Number(tg?.soldCount ?? 0),
    priceType,
    priceValue,
    priceLabel: formatPriceLabel(priceType, priceValue),
    bought: Boolean(responseData?.bought ?? responseData?.brought ?? false),
    counsellorId: String(tg?.counsellorId ?? responseData?.counsellorId ?? ""),
    attachedTests,
  };
};

const normalizeTestGroups = (response: any): TestWithMeta[] => {
  const rawList = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.testGroups)
        ? response.testGroups
        : [];

  return rawList.map((item: any, index: number) => {
    const tg = item?.testGroup ?? item;
    const soldCount = Number(tg?.soldCount ?? item?.soldCount ?? 0);
    const totalTests = Number(
      item?.attachedTests?.length ??
      tg?.attachedTests?.length ??
      item?.totalTests ??
      item?.testSeriesCount ??
      0
    );

    return {
      id: String(tg?.testGroupId ?? item?.testGroupId ?? item?.id ?? `test-${index}`),
      image: String(
        tg?.bannerImagUrl ??
        tg?.bannerImageUrl ??
        item?.bannerImagUrl ??
        item?.bannerImageUrl ??
        "/course/2.png"
      ),
      rating: String(
        tg?.rating ??
        item?.rating ??
        "0.0"
      ),
      price:
        String(tg?.priceType ?? item?.priceType ?? "").toUpperCase() === "FREE"
          ? "Free"
          : `₹${Number(tg?.price ?? item?.price ?? 0).toLocaleString("en-IN")}`,
      name: String(
        tg?.testGroupName ??
        item?.testGroupName ??
        item?.name ??
        "Test Group"
      ),
      description: String(
        tg?.testGroupDescription ??
        item?.testGroupDescription ??
        item?.description ??
        ""
      ),
      subject: String(item?.subject ?? "Test"),
      isPurchased: Boolean(item?.bought ?? item?.purchasedByMe ?? item?.isPurchased ?? false),
      isTrending: Boolean(item?.isTrending ?? soldCount > 25),
      totalTests: totalTests > 0 ? totalTests : 1,
      totalStudents: soldCount,
    };
  });
};

const addTrackpadScrolling = (emblaApi: EmblaCarouselType) => {
  const SCROLL_COOLDOWN_MS = 300;
  let isThrottled = false;

  const wheelListener = (event: WheelEvent) => {
    if (isThrottled) return;

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      event.preventDefault();
      isThrottled = true;

      if (event.deltaX > 0) {
        emblaApi.scrollNext();
      } else {
        emblaApi.scrollPrev();
      }

      setTimeout(() => {
        isThrottled = false;
      }, SCROLL_COOLDOWN_MS);
    }
  };

  const containerNode = emblaApi.containerNode();
  containerNode.addEventListener("wheel", wheelListener);

  return () => containerNode.removeEventListener("wheel", wheelListener);
};

export default function TestGroupCardDetails() {
  const { testGroupId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("phone") || "";
  const token = localStorage.getItem("jwt") || "";
  const role = (localStorage.getItem("role") || "user") as "user" | "student" | "counselor";
  const isUserLoggedIn = Boolean(userId && token);

  const [reviewsData, setReviewsData] = useState<TestGroupReviewData>({
    reviews: [],
    bought: false,
    rating: null,
  });
  const [recommendedTests, setRecommendedTests] = useState<TestWithMeta[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [testGroupDetails, setTestGroupDetails] = useState<TestGroupDetailView | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);
  const [visibleAttachedTestsCount, setVisibleAttachedTestsCount] = useState(2);

  const fetchRecommendedTests = async () => {
    try {
      setRecommendedLoading(true);
      const response = isUserLoggedIn
        ? await getAllTestGroupsForLoggedInUser(userId)
        : await getAllTestGroupsForGuest();
      setRecommendedTests(normalizeTestGroups(response));
    } catch (error) {
      console.error("Failed to fetch recommended test groups:", error);
      setRecommendedTests([]);
    } finally {
      setRecommendedLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendedTests();
  }, [isUserLoggedIn, userId]);

  const fetchTestGroupDetails = async () => {
    if (!testGroupId) return;

    setDetailsLoading(true);

    if (!isUserLoggedIn) {
      const fallback = recommendedTests.find((item) => item.id === testGroupId);
      if (fallback) {
        setTestGroupDetails({
          id: fallback.id,
          name: fallback.name,
          description: fallback.description,
          bannerImage: fallback.image,
          rating: Number(fallback.rating ?? 0),
          ratingCount: 0,
          soldCount: fallback.totalStudents,
          priceType: fallback.price.toLowerCase() === "free" ? "FREE" : "PAID",
          priceValue: fallback.price.toLowerCase() === "free" ? 0 : Number(String(fallback.price).replace(/[^0-9.]/g, "")),
          priceLabel: fallback.price,
          bought: false,
          counsellorId: "",
          attachedTests: Array.from({ length: Math.max(1, fallback.totalTests) }).map((_, index) => ({
            id: `${fallback.id}-placeholder-${index}`,
            name: `Test ${index + 1}`,
            durationInMinutes: 0,
            totalQuestions: 0,
          })),
        });
      }

      setDetailsLoading(false);
      return;
    }

    try {
      setDetailsLoading(true);
      const response = await getTestGroupByIdForUser(userId, testGroupId);
      if (response?.status && response?.data) {
        const normalizedDetails = normalizeTestGroupDetails(response.data);
        if (normalizedDetails) {
          setTestGroupDetails(normalizedDetails);
        }

        const nextReviews = Array.isArray(response.data.reviews)
          ? response.data.reviews
          : [];
        setReviewsData({
          reviews: nextReviews,
          bought: Boolean(response.data.bought),
          rating: response.data?.testGroup?.rating ?? null,
        });
      }
    } catch (error) {
      console.error("Failed to fetch test group details:", error);
      toast.error("Failed to load test group details");
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestGroupDetails();
  }, [testGroupId, userId, isUserLoggedIn, recommendedTests]);

  useEffect(() => {
    setVisibleAttachedTestsCount(2);
  }, [testGroupId]);

  const handleBuyTestGroup = async () => {
    if (!isUserLoggedIn) {
      toast.error("Please login to buy this test group");
      return;
    }

    if (!testGroupDetails || !testGroupId) return;

    if (testGroupDetails.bought || reviewsData.bought) {
      toast.success("You have already purchased this test group");
      return;
    }

    if (!testGroupDetails.counsellorId) {
      toast.error("Missing counsellor details for this test group");
      return;
    }

    try {
      setBuyLoading(true);
      const response = await buyTestGroup(
        userId,
        testGroupDetails.counsellorId,
        testGroupId,
        testGroupDetails.priceValue,
        null
      );

      if (response?.status) {
        toast.success("Test group purchased successfully");
        await fetchTestGroupDetails();
        await fetchRecommendedTests();
      } else {
        toast.error(response?.message || "Failed to purchase test group");
      }
    } catch (error) {
      console.error("Failed to purchase test group:", error);
      toast.error("Failed to purchase test group");
    } finally {
      setBuyLoading(false);
    }
  };

  const effectiveBought = Boolean(testGroupDetails?.bought || reviewsData.bought);
  const ratingValue = Number(
    reviewsData.rating ?? testGroupDetails?.rating ?? 0
  ).toFixed(1);
  const reviewCount =
    reviewsData.reviews.length || testGroupDetails?.ratingCount || 0;
  const attachedTests = testGroupDetails?.attachedTests || [];
  const visibleAttachedTests = attachedTests.slice(0, visibleAttachedTestsCount);
  const hasMoreAttachedTests = visibleAttachedTestsCount < attachedTests.length;

  const handleOpenTestInfo = (testId: string) => {
    if (!testId || testId.includes("placeholder")) {
      toast.error("Test details are not available yet.");
      return;
    }

    navigate(`/test-info/${testId}`, { state: { testGroupId } });
  };

  return (
    <div className="bg-[#F5F5F7] min-h-screen">
      {/* phone view */}
      <div className="block md:hidden">
          <div className="flex flex-col gap-6 p-3">
            {/* test  details and listing */}
            <div className="flex flex-col gap-6 bg-white w-full shadow-sm h-full rounded-2xl p-3">
              {detailsLoading || !testGroupDetails ? (
                <div className="flex flex-col gap-4 animate-pulse">
                  <div className="flex gap-2">
                    <div className="w-18 h-18 rounded-xl bg-[#F3F4F6]" />
                    <div className="flex-1 flex flex-col gap-3 pt-1">
                      <div className="h-4 w-2/3 rounded bg-[#F3F4F6]" />
                      <div className="h-3 w-full rounded bg-[#F3F4F6]" />
                      <div className="h-3 w-5/6 rounded bg-[#F3F4F6]" />
                      <div className="flex gap-3">
                        <div className="h-3 w-16 rounded bg-[#F3F4F6]" />
                        <div className="h-3 w-20 rounded bg-[#F3F4F6]" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-2">
                    <div className="h-4 w-32 rounded bg-[#F3F4F6]" />
                    <div className="h-16 rounded-2xl bg-[#F3F4F6]" />
                    <div className="h-16 rounded-2xl bg-[#F3F4F6]" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <img loading="lazy" decoding="async"
                      src={testGroupDetails?.bannerImage || "/course/1.jpg"}
                      alt={testGroupDetails?.name || "Test group"}
                      className="w-[4.5rem] h-[4.5rem] rounded-[8px] object-cover"
                    />
                    <div className="flex flex-col gap-2">
                      <h1 className="text-(--text-main) font-semibold text-sm">
                        {testGroupDetails?.name || "Test Group"}
                      </h1>
                      <p className="text-(--text-muted) font-normal text-xs">
                        {testGroupDetails?.description || "No description available."}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-medium text-(--text-muted)">
                          <div className="flex items-center gap-1">
                          <Star size={16} className="text-[#FACC14] fill-[#FACC14]" />
                          <p>
                            {ratingValue} <span className="font-normal">({reviewCount})</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={18} />
                          <p>{testGroupDetails?.soldCount || 0}+ students</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <h1 className="text-(--text-main) font-semibold text-[1rem]">
                      Test Series ({testGroupDetails?.attachedTests?.length || 0} tests)
                    </h1>

                    {attachedTests.length ? (
                      <>
                      {visibleAttachedTests.map((test, index) => (
                        <motion.div
                          key={test.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.55,
                            delay: index * 0.06,
                            ease: "easeOut",
                          }}
                          className="flex items-center justify-between w-full rounded-2xl border border-[#E5E7EB] bg-white p-[0.62rem] cursor-pointer hover:border-[#2F43F2]/45 transition-colors"
                          onClick={() => handleOpenTestInfo(test.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[#2F43F20D] flex items-center justify-center">
                              <img loading="lazy" decoding="async" src="/course/book.svg" alt="" />
                            </div>

                            <div className="flex flex-col gap-1 text-(--text-muted) font-normal text-xs">
                              <h3 className="text-(--text-main) font-semibold text-[1rem]">{test.name}</h3>
                              <div className="flex items-center gap-2.5">
                                <div className="flex items-center gap-1">
                                  <Clock3 size={14} />
                                  <p>{test.durationInMinutes > 0 ? `${test.durationInMinutes} min` : "Duration N/A"}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                  <BookOpen size={14} />
                                  <p>{test.totalQuestions > 0 ? `${test.totalQuestions} Questions` : "Questions N/A"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!effectiveBought && <Lock size={20} className="text-[#2F43F2]" />}
                        </motion.div>
                      ))}
                      {hasMoreAttachedTests && (
                        <button
                          onClick={() =>
                            setVisibleAttachedTestsCount((prev) =>
                              Math.min(prev + 5, attachedTests.length)
                            )
                          }
                          className="self-start text-sm font-semibold text-[#0E1629] hover:underline"
                        >
                          See more
                        </button>
                      )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#D1D5DB] p-4 text-sm text-[#6B7280]">
                        No tests attached yet.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-10">
              {/* features of  test */}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <ButtonCard
                  priceLabel={testGroupDetails?.priceLabel || "0"}
                  isFree={String(testGroupDetails?.priceType || "").toUpperCase() === "FREE"}
                  isPurchased={effectiveBought}
                  isBuying={buyLoading}
                  onBuy={handleBuyTestGroup}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <FeatureCard
                  totalTests={testGroupDetails?.attachedTests?.length || 0}
                  totalStudents={testGroupDetails?.soldCount || 0}
                />
              </motion.div>

            </div>
          </div>
          <RecomemdedSection
            tests={recommendedTests}
            isLoadingTests={recommendedLoading}
          />

         <div className="p-3">
           <TestGroupReviewsCard
            testGroupId={testGroupId || ""}
            isPurchased={effectiveBought}
            role={role}
            reviews={reviewsData.reviews}
            rating={reviewsData.rating}
            onReviewSubmitted={fetchTestGroupDetails}
          />
         </div>
        </div>

      {/* desktop and laptops */}
      <div className="hidden md:block w-full mx-auto max-w-[90rem] px-[3.75rem] py-10">
        <div>
          <div className="flex gap-6">
            {/* test  details and listing */}
            <div className="flex flex-col gap-6 bg-white w-[44.75rem] shadow-sm h-full rounded-2xl p-3">
              {detailsLoading || !testGroupDetails ? (
                <div className="flex flex-col gap-5 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-34 h-30 rounded-xl bg-[#F3F4F6]" />
                    <div className="flex-1 flex flex-col gap-4 pt-1">
                      <div className="h-6 w-1/2 rounded bg-[#F3F4F6]" />
                      <div className="h-4 w-full rounded bg-[#F3F4F6]" />
                      <div className="h-4 w-5/6 rounded bg-[#F3F4F6]" />
                      <div className="flex gap-4">
                        <div className="h-4 w-24 rounded bg-[#F3F4F6]" />
                        <div className="h-4 w-28 rounded bg-[#F3F4F6]" />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-[#F3F4F6]" />

                  <div className="flex flex-col gap-3">
                    <div className="h-5 w-44 rounded bg-[#F3F4F6]" />
                    <div className="h-16 rounded-2xl bg-[#F3F4F6]" />
                    <div className="h-16 rounded-2xl bg-[#F3F4F6]" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <img loading="lazy" decoding="async"
                      src={testGroupDetails?.bannerImage || "/course/1.jpg"}
                      alt={testGroupDetails?.name || "Test group"}
                      className="w-[8.5rem] h-[7.5rem] rounded-[8px] object-cover"
                    />
                    <div className="flex flex-col gap-3">
                      <h1 className="text-(--text-main) font-semibold text-2xl">
                        {testGroupDetails?.name || "Test Group"}
                      </h1>
                      <p className="text-(--text-muted) font-normal text-sm">
                        {testGroupDetails?.description || "No description available."}
                      </p>

                      <div className="flex items-center gap-4 text-sm font-medium text-(--text-muted)">
                        <div className="flex items-center gap-1">
                          <Star size={18} className="text-[#FACC14] fill-[#FACC14]" />
                          <p>
                            {ratingValue} <span className="font-normal">({reviewCount} reviews)</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Users size={18} />
                          <p>{testGroupDetails?.soldCount || 0}+ students helped</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <hr className="h-px bg-(--text-muted)" />

                  <div className="flex flex-col gap-3">
                    <h1 className="text-(--text-main) font-semibold text-xl">
                      Test Series ({testGroupDetails?.attachedTests?.length || 0} tests)
                    </h1>

                    {attachedTests.length ? (
                      <>
                      {visibleAttachedTests.map((test, index) => (
                        <motion.div
                          key={test.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.55,
                            delay: index * 0.06,
                            ease: "easeOut",
                          }}
                          className="flex items-center justify-between w-full rounded-2xl border border-[#E5E7EB] bg-white p-[0.62rem] cursor-pointer hover:border-[#2F43F2]/45 transition-colors"
                          onClick={() => handleOpenTestInfo(test.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[#2F43F20D] flex items-center justify-center">
                              <BookOpen size={22} className="text-[#2F43F2]" />
                            </div>

                            <div className="flex flex-col gap-1 text-(--text-muted) font-normal text-xs">
                              <h3 className="text-(--text-main) font-semibold text-[1rem]">{test.name}</h3>
                              <div className="flex items-center gap-2.5">
                                <div className="flex items-center gap-1">
                                  <Clock3 size={14} />
                                  <p>{test.durationInMinutes > 0 ? `${test.durationInMinutes} min` : "Duration N/A"}</p>
                                </div>

                                <div className="flex items-center gap-1">
                                  <BookOpen size={14} />
                                  <p>{test.totalQuestions > 0 ? `${test.totalQuestions} Questions` : "Questions N/A"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {!effectiveBought && <Lock size={20} className="text-[#2F43F2]" />}
                        </motion.div>
                      ))}
                      {hasMoreAttachedTests && (
                        <button
                          onClick={() =>
                            setVisibleAttachedTestsCount((prev) =>
                              Math.min(prev + 5, attachedTests.length)
                            )
                          }
                          className="self-start text-sm font-semibold text-[#0E1629] hover:underline"
                        >
                          See more
                        </button>
                      )}
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#D1D5DB] p-4 text-sm text-[#6B7280]">
                        No tests attached yet.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col gap-10">
              {/* features of  test */}

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <ButtonCard
                  priceLabel={testGroupDetails?.priceLabel || "0"}
                  isFree={String(testGroupDetails?.priceType || "").toUpperCase() === "FREE"}
                  isPurchased={effectiveBought}
                  isBuying={buyLoading}
                  onBuy={handleBuyTestGroup}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <FeatureCard
                  totalTests={testGroupDetails?.attachedTests?.length || 0}
                  totalStudents={testGroupDetails?.soldCount || 0}
                />
              </motion.div>

            </div>
          </div>
          <RecomemdedSection
            tests={recommendedTests}
            isLoadingTests={recommendedLoading}
          />

          <TestGroupReviewsCard
            testGroupId={testGroupId || ""}
            isPurchased={effectiveBought}
            role={role}
            reviews={reviewsData.reviews}
            rating={reviewsData.rating}
            onReviewSubmitted={fetchTestGroupDetails}
          />
        </div>
      </div>
    </div>
  );
}


function RecomemdedSection({
  tests,
  isLoadingTests,
}: {
  tests: TestWithMeta[];
  isLoadingTests: boolean;
}) {
  const autoplay = useRef(
    Autoplay({
      delay: 4200,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnLastSnap: false,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: tests.length > 1,
      align: "start",
      slidesToScroll: 1,
    },
    [autoplay.current]
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const updateSelectedIndex = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    updateSelectedIndex(emblaApi);
    emblaApi.on("select", updateSelectedIndex);
    const removeTrackpadScrolling = addTrackpadScrolling(emblaApi);
    return () => {
      emblaApi.off("select", updateSelectedIndex);
      removeTrackpadScrolling();
    };
  }, [emblaApi, updateSelectedIndex]);

  const snapCount = emblaApi?.scrollSnapList().length ?? Math.max(tests.length, 1);

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 60,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div>
      <div className="block py-[15px] pl-5 bg-[#F5F5F7] md:hidden">
        <div className="flex flex-col  justify-start items-start gap-3 pr-0">
          <div className="flex items-center gap-2 bg-white px-3 py-1 ">
            <div className="w-4 h-4 bg-[#0E1629]" />
            <p className="font-[Poppins] font-semibold text-xs text-[#0E1629] uppercase tracking-wider">
              Recommonded tests
            </p>
          </div>

          <p className="font-[Poppins] font-medium  text-xs text-start text-[#0E1629] max-w-[682px] leading-normal">
            Discover curated tests across mental wellness, assessments,
            admissions, and upskilling led by experienced professionals, built
            around your needs.
          </p>

          <div className="w-full">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {tests.map((test) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="shrink-0"
                >
                  <TestGroupCard
                    testGroupId={test.id}
                    image={test.image}
                    rating={test.rating ?? "0.0"}
                    price={test.price}
                    title={test.name}
                    description={test.description}
                    totalTests={test.totalTests || 1}
                    totalStudents={test.totalStudents || 0}
                    isBaught={test.isPurchased}
                    isMyTestsCard={test.isPurchased}
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-2 h-1 w-20 bg-[#EDEDED] rounded-[48px] overflow-hidden">
              <div
                className="h-full bg-[#0E1629] rounded-[48px] transition-all duration-200"
                style={{ width: `${78}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block w-full py-10">
        <div className="max-w-[1440px] h-full mx-auto ">
          <div className="max-w-[1323px] mx-auto">
            <div className="flex justify-between items-start mb-10">
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md">
                <div className="w-4 h-4 bg-[#0E1629]" />
                <p className="font-[Poppins] font-semibold text-[14px] text-[#0E1629] uppercase tracking-wider">
                  Recommended tests
                </p>
              </div>

              <p className="font-[Poppins] font-medium text-[24px] text-[#0E1629] max-w-[682px] leading-normal">
                Discover curated tests across mental wellness, assessments,
                admissions, and upskilling led by experienced professionals, built
                around your needs.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {isLoadingTests ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring" as const, damping: 20 }}
                  className="flex gap-[25px] justify-center mb-6 min-h-[451px] items-start"
                >
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <motion.div
                      key={`skeleton-${idx}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring" as const,
                        stiffness: 100,
                        damping: 12,
                        delay: idx * 0.1,
                      }}
                      className="w-[312px] h-[420px] rounded-2xl bg-[#F3F4F6] animate-pulse"
                    />
                  ))}
                </motion.div>
              ) : tests.length > 0 ? (
                <div className="relative mt-2 lg:mt-8">
                  <div className="overflow-hidden px-2 py-4" ref={emblaRef}>
                    <div className="flex gap-[25px] px-1">
                      {tests.map((test) => (
                        <motion.div
                          key={test.id}
                          variants={cardVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ duration: 0.7, ease: "easeOut" }}
                          className="shrink-0 pb-1"
                        >
                      <TestGroupCard
                        testGroupId={test.id}
                        image={test.image}
                        rating={test.rating ?? "0.0"}
                        price={test.price}
                        title={test.name}
                        description={test.description}
                        totalTests={test.totalTests || 1}
                        totalStudents={test.totalStudents || 0}
                        isBaught={test.isPurchased}
                        isMyTestsCard={test.isPurchased}
                      />
                        </motion.div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: "spring" as const, damping: 20 }}
                  className="flex justify-center mb-6 min-h-[451px] items-center"
                >
                  <p className="font-[Poppins] text-[14px] text-[#6B7280] self-center">
                    No tests found.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-[262px] h-1 bg-[#EDEDED] rounded-[48px] overflow-hidden">
                  <div
                    className="h-full bg-[#0E1629] rounded-[48px] transition-all duration-300"
                    style={{ width: snapCount > 1 ? `${((selectedIndex + 1) / snapCount) * 100}%` : "100%" }}
                  />
                </div>
              </div>

              <SeeAllButton
                text="See all"
                onClick={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function ButtonCard({
  priceLabel,
  isFree,
  isPurchased,
  isBuying,
  onBuy,
}: {
  priceLabel: string;
  isFree: boolean;
  isPurchased: boolean;
  isBuying: boolean;
  onBuy: () => Promise<void>;
}) {
  return (
    <div className="bg-white shadow-sm rounded-[8px] md:rounded-[16px] p-[12px] w-[350px] mx-auto md:w-full xl:w-[580px] h-[161px] md:h-auto font-['Poppins']">

      <div className="mt-[4px] md:mt-3 flex items-center gap-[8px] md:gap-3">
        {!isFree && <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-4 h-4 md:w-5 md:h-5" />}
        <p className="font-semibold text-[#0e1629] text-[16px] md:text-lg">
          {priceLabel}
        </p>
        {/* {!isFree && !isPurchased && (
          <p className="font-normal text-[#6b7280] text-[12px] md:text-sm line-through [text-decoration-skip-ink:none]">
            Original Price
          </p>
        )} */}
      </div>

      <button
        onClick={onBuy}
        disabled={isPurchased || isBuying}
        className="mt-[12px] md:mt-3 w-full bg-(--text-main) h-[44px] md:h-auto rounded-[12px] px-4 py-2.5 font-medium text-[16px] text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPurchased ? "Purchased" : isBuying ? "Processing..." : isFree ? "Enroll Now" : "Buy Now"}
      </button>

      <p className="mt-[8px] md:mt-2.5 text-center font-normal md:font-medium text-[#6b7280] text-[12px] md:text-sm">
        {isPurchased ? "You already have access to this test group" : "Instant access after successful purchase"}
      </p>
    </div>
  );
}

function FeatureCard({
  totalTests,
  totalStudents,
}: {
  totalTests: number;
  totalStudents: number;
}) {
  return (
    <div className="bg-white w-full  md:w-[36.25rem] rounded-2xl shadow-sm p-3">
      <h1 className="text-(--text-main) font-semibold text-[1rem] md:text-[1.125rem]">This test group includes:</h1>
      <div className="flex flex-col gap-3 pt-5">
        {[
          "Full Lifetime Access",
          `${totalTests} Complete tests`,
          `${totalStudents}+ learners enrolled`,
        ].map((text) => (
          <div key={text} className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <g clip-path="url(#clip0_299_1245)">
                <path d="M12 2C11.782 2 11.568 2.002 11.358 2.005L10.742 2.022L10.443 2.035L9.864 2.069L9.311 2.115C4.526 2.579 2.579 4.526 2.115 9.311L2.069 9.864L2.035 10.443C2.03 10.541 2.025 10.641 2.022 10.742L2.005 11.358L2.001 11.676L2 12C2 12.218 2.002 12.432 2.005 12.642L2.022 13.258L2.035 13.557L2.069 14.136L2.115 14.689C2.579 19.474 4.526 21.421 9.311 21.885L9.864 21.931L10.443 21.965C10.541 21.97 10.641 21.975 10.742 21.978L11.358 21.995L12 22L12.642 21.995L13.258 21.978L13.557 21.965L14.136 21.931L14.689 21.885C19.474 21.421 21.421 19.474 21.885 14.689L21.931 14.136L21.965 13.557C21.97 13.459 21.975 13.359 21.978 13.258L21.995 12.642L22 12L21.995 11.358L21.978 10.742L21.965 10.443L21.931 9.864L21.885 9.311C21.421 4.526 19.474 2.579 14.689 2.115L14.136 2.069L13.557 2.035C13.4574 2.03014 13.3577 2.0258 13.258 2.022L12.642 2.005L12.324 2.001L12 2ZM14.293 9.293C14.473 9.11365 14.7144 9.00953 14.9684 9.00177C15.2223 8.99402 15.4697 9.08321 15.6603 9.25125C15.8508 9.41928 15.9703 9.65355 15.9944 9.90647C16.0185 10.1594 15.9454 10.412 15.79 10.613L15.707 10.707L11.707 14.707C11.5348 14.8792 11.3057 14.9826 11.0627 14.9979C10.8197 15.0132 10.5794 14.9393 10.387 14.79L10.293 14.707L8.293 12.707C8.11365 12.527 8.00953 12.2856 8.00177 12.0316C7.99402 11.7777 8.08321 11.5303 8.25125 11.3397C8.41928 11.1492 8.65355 11.0297 8.90647 11.0056C9.1594 10.9815 9.41201 11.0546 9.613 11.21L9.707 11.293L11 12.585L14.293 9.293Z" fill="#2F43F2" />
              </g>
              <defs>
                <clipPath id="clip0_299_1245">
                  <rect width="24" height="24" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <p
              className="text-(--text-main) font-medium text-sm md:text-[1rem]"
            >{text}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

