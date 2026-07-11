import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router-dom";
import TestGroupCard from "./TestGroupCard";
import { SeeAllButton } from "../components/LeftRightButton";
import {
  getAllTestGroupsForGuest,
  getAllTestGroupsForLoggedInUser,
  getUserBoughtTestGroups,
} from "@/api/testGroup";

type TestTab = "my-tests" | "trending" | "all-tests";

interface TestWithMeta {
  id: string;
  image: string;
  rating?: string;
  price: string;
  name: string;
  subject?: string;
  description: string;
  isPurchased: boolean;
  isTrending: boolean;
  totalTests: number;
  totalStudents: number;
}

const tabOptions: { id: TestTab; label: string }[] = [
  { id: "my-tests", label: "My Tests" },
  { id: "trending", label: "Trending" },
];

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
        "/course/2.webp"
      ),
      rating: String(
        tg?.rating ??
        item?.rating ??
        "0.0"
      ),
      price:
        String(tg?.priceType ?? item?.priceType ?? "").toUpperCase() === "FREE"
          ? "Free"
          : `${Number(tg?.price ?? item?.price ?? 0).toLocaleString("en-IN")}`,
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

export default function TestSection() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("phone") || "";
  const token = localStorage.getItem("jwt") || "";
  const isUserLoggedIn = Boolean(userId && token);

  const [activeTab, setActiveTab] = useState<TestTab>("my-tests");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: allTestsResponse, isLoading: isLoadingAllTests } = useQuery({
    queryKey: ["revamp-all-tests", isUserLoggedIn ? userId : "guest"],
    queryFn: () =>
      isUserLoggedIn
        ? getAllTestGroupsForLoggedInUser(userId)
        : getAllTestGroupsForGuest(),
    enabled: !isUserLoggedIn || Boolean(userId),
  });

  const { data: myTestsResponse, isLoading: isLoadingMyTests } = useQuery({
    queryKey: ["revamp-my-tests", userId],
    queryFn: () => getUserBoughtTestGroups(userId),
    enabled: isUserLoggedIn && Boolean(userId),
  });

  const testsData = useMemo(
    () => normalizeTestGroups(allTestsResponse),
    [allTestsResponse]
  );

  const myTestsData = useMemo(
    () => normalizeTestGroups(myTestsResponse),
    [myTestsResponse]
  );

  const hasPurchasedTests = myTestsData.length > 0;
  // Only show the tabs (My Tests + Trending) when the user actually has
  // purchased tests. With nothing in "My Tests", a lone Trending tab is
  // pointless, so hide the tabs entirely.
  const visibleTabOptions = isUserLoggedIn && hasPurchasedTests ? tabOptions : [];

  useEffect(() => {
    if (isUserLoggedIn && !hasPurchasedTests && activeTab === "my-tests") {
      setActiveTab("trending");
    }
  }, [isUserLoggedIn, hasPurchasedTests, activeTab]);

  const isLoadingTests = isUserLoggedIn
    ? activeTab === "my-tests"
      ? isLoadingMyTests
      : isLoadingAllTests
    : isLoadingAllTests;

  const filteredTests = useMemo(() => {
    if (!isUserLoggedIn) return testsData;

    if (activeTab === "my-tests") {
      return myTestsData;
    }

    if (activeTab === "trending") {
      return testsData.filter(
        (test) => !test.isPurchased,
      );
    }

    return testsData;
  }, [activeTab, isUserLoggedIn, testsData, myTestsData]);

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
      loop: filteredTests.length > 1,
      align: "start",
      slidesToScroll: 1,
    },
    [autoplay.current]
  );

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

  useEffect(() => {
    emblaApi?.scrollTo(0);
  }, [activeTab, emblaApi]);

  const snapCount = emblaApi?.scrollSnapList().length ?? Math.max(filteredTests.length, 1);

  const handleTabChange = (tab: TestTab) => {
    setActiveTab(tab);
  };

  const shouldShowInlineTestUpsell =
    isUserLoggedIn && activeTab === "my-tests" && filteredTests.length <= 1 && !isLoadingTests;

  return (
    <div>
      {/* phone view */}

      <div className="block py-[15px] pl-5 bg-[#F5F5F7] md:hidden">
        <div className="flex flex-col  justify-start items-start gap-3 pr-0">
          <div className="flex items-center gap-2 bg-white px-3 py-1 ">
            <div className="w-4 h-4 bg-[#0E1629]" />
            <p className="font-[Poppins] font-semibold text-xs text-[#0E1629] uppercase tracking-wider">
              Tests
            </p>
          </div>

          <p className="font-[Poppins] font-medium  text-xs text-start text-[#0E1629] max-w-[682px] leading-normal">
            Discover curated tests across mental wellness, assessments,
            admissions, and upskilling led by experienced professionals, built
            around your needs.
          </p>

          {isUserLoggedIn && visibleTabOptions.length > 0 && (
            <div className="flex gap-2.5 pt-2">
              {visibleTabOptions.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border border-(--text-main) py-1.5 px-3 rounded-[5px] text-xs font-medium cursor-pointer ${activeTab === tab.id ? "bg-(--text-main) text-white" : "text-(--text-main) bg-none"}`}
                >
                  {tab.label}
                </div>
              ))}
            </div>
          )}

          <div className="w-full">
            <div
              className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            >
              {filteredTests.map((test) => (
                <div key={test.id} className="shrink-0">
                  <TestGroupCard
                    testGroupId={test.id}
                    image={test.image}
                    rating={test.rating ?? "0.0"}
                    price={test.price}
                    title={test.name}
                    description={test.description}
                    totalTests={test.totalTests || 1}
                    totalStudents={test.totalStudents || 0}
                    isBaught={isUserLoggedIn ? (activeTab === "trending" ? false : true) : true}
                    isMyTestsCard={isUserLoggedIn ? activeTab === "my-tests" : false}
                  />
                </div>
              ))}

              {shouldShowInlineTestUpsell && (
                <div className="self-center shrink-0 w-[250px] h-[150px] rounded-2xl p-3 flex items-center justify-center text-center">
                  <div className="w-full flex flex-col items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0E1629]">Grow your test library</p>
                      <p className="mt-2 text-xs text-[#6B7280] leading-relaxed">
                        Add more test series to practice consistently and track better progress.
                      </p>
                    </div>
                    <button
                      onClick={() => handleTabChange("trending")}
                      className="w-full hover:cursor-pointer rounded-lg bg-[#0E1629] px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                    >
                      Explore Trending
                    </button>
                  </div>
                </div>
              )}
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

      {/* laptopp desktop view */}
      <div className="hidden md:block w-full py-10">
        <div className="max-w-[1440px] h-full mx-auto px-[60px]">
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-md">
              <div className="w-4 h-4 bg-[#0E1629]" />
              <p className="font-[Poppins] font-semibold text-[14px] text-[#0E1629] uppercase tracking-wider">
                TESTS
              </p>
            </div>

            <p className="font-[Poppins] font-medium text-[24px] text-[#0E1629] max-w-[682px] leading-normal">
              Discover curated tests across mental wellness, assessments,
              admissions, and upskilling led by experienced professionals, built
              around your needs.
            </p>
          </div>

          {isUserLoggedIn && visibleTabOptions.length > 0 && (
            <div className="flex justify-center gap-[60px] mb-10">
              {visibleTabOptions.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{
                    type: "spring" as const,
                    stiffness: 300,
                    damping: 20,
                  }}
                  className={`px-5 py-2.5 rounded-[5px] w-[200px] hover:cursor-pointer font-[Poppins] font-medium text-[14px] capitalize transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-[#0E1629] text-white shadow-lg"
                      : "border border-[rgba(14,22,41,0.25)] text-[#0E1629] hover:border-[#0E1629] hover:shadow-md"
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>
          )}

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
            ) : filteredTests.length > 0 || shouldShowInlineTestUpsell ? (
              <div className="relative mt-2 lg:mt-8">
                <div className="overflow-x-hidden px-0.5 py-4" ref={emblaRef}>
                  <div className="flex gap-[25px] px-3 lg:px-6">
                    {filteredTests.map((test) => (
                      <div key={test.id} className="shrink-0">
                    <TestGroupCard
                      testGroupId={test.id}
                      image={test.image}
                      rating={test.rating ?? "0.0"}
                      price={test.price}
                      title={test.name}
                      description={test.description}
                      totalTests={test.totalTests || 1}
                      totalStudents={test.totalStudents || 0}
                      isBaught={isUserLoggedIn ? (activeTab === "trending" ? false : true) : true}
                      isMyTestsCard={isUserLoggedIn ? activeTab === "my-tests" : false}
                    />
                      </div>
                    ))}

                    {shouldShowInlineTestUpsell && (
                      <div className="self-center shrink-0 w-[24rem] h-[12.5rem] rounded-2xl p-5 flex items-center justify-center text-center">
                        <div className="w-full flex flex-col items-center gap-4">
                          <div>
                            <p className="text-lg font-semibold text-[#0E1629]">Build stronger preparation</p>
                            <p className="mt-2 text-sm text-[#6B7280] leading-relaxed max-w-[20rem] mx-auto">
                              Add more test groups to practice across topics and improve your outcomes.
                            </p>
                          </div>
                          <button
                            onClick={() => handleTabChange("trending")}
                            className="rounded-xl hover:cursor-pointer bg-[#0E1629] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                          >
                            Explore Trending
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring" as const, damping: 20 }}
                className="flex justify-center mb-6 min-h-[451px] items-center"
              >
                {isUserLoggedIn && activeTab === "my-tests" ? (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-xl font-semibold text-[#0E1629]">Keep Learning</p>
                    <p className="text-sm text-[#6B7280] leading-relaxed max-w-[20rem] mx-auto">
                      You haven't purchased any test series yet. Explore trending tests and start practising.
                    </p>
                    <button
                      onClick={() => handleTabChange("trending")}
                      className="rounded-xl hover:cursor-pointer bg-[#0E1629] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Explore Trending
                    </button>
                  </div>
                ) : (
                  <p className="font-[Poppins] text-[14px] text-[#6B7280] self-center">No tests found.</p>
                )}
              </motion.div>
            )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-[262px] h-1 bg-[#EDEDED] rounded-[48px] overflow-hidden">
                <div
                  className="h-full bg-[#0E1629] rounded-[48px] transition-all duration-300"
                  style={{
                    width: snapCount > 1 ? `${((selectedIndex + 1) / snapCount) * 100}%` : "100%",
                  }}
                />
              </div>
            </div>

            <SeeAllButton
              text="See all"
              onClick={() => {
                if (isUserLoggedIn && activeTab === "my-tests") {
                  navigate(window.innerWidth < 768
                    ? "/dashboard-student?activeTab=Test Series"
                    : "/profile?activeTab=My Tests"
                  );
                } else {
                  navigate("/courses/test-listing");
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
