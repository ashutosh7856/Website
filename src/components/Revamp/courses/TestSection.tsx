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
import { TEST_COUNT_BY_GROUP, TEST_GROUPS_SNAPSHOT } from "@/data/contentSnapshot";
import type { RawListResponse, RawTestGroupRow } from "./rawListRows";

// Build-time seed so /courses prerenders real test series instead of the
// "No tests found" empty state (the API is unreachable during the prerender).
const TESTS_SEED = TEST_GROUPS_SNAPSHOT.length
  ? { status: "snapshot", data: TEST_GROUPS_SNAPSHOT }
  : undefined;

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

const normalizeTestGroups = (response: unknown): TestWithMeta[] => {
  const res = response as RawListResponse<RawTestGroupRow>;
  const rawList: RawTestGroupRow[] = Array.isArray(res)
    ? res
    : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.testGroups)
        ? res.testGroups
        : [];

  return rawList.map((item, index) => {
    const tg = item?.testGroup ?? item;
    const soldCount = Number(tg?.soldCount ?? item?.soldCount ?? 0);
    // The list endpoint returns neither `attachedTests` nor a usable count, so
    // this used to fall through to the "1 test" default. Prefer resolved rows,
    // then the build-time resolved count; `attachedTestIds` is only a last
    // resort because it still names deleted tests and overstates the total.
    const groupId = String(tg?.testGroupId ?? item?.testGroupId ?? item?.id ?? "");
    const totalTests = Number(
      item?.attachedTests?.length ??
      tg?.attachedTests?.length ??
      TEST_COUNT_BY_GROUP[groupId] ??
      item?.totalTests ??
      item?.testSeriesCount ??
      tg?.attachedTestIds?.length ??
      item?.attachedTestIds?.length ??
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
    initialData: TESTS_SEED,
    initialDataUpdatedAt: 0,
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

  // Signed-out visitor with nothing to show gets no section at all, rather than
  // a "No tests found" placeholder baked into the crawlable HTML.
  if (!isUserLoggedIn && !isLoadingTests && testsData.length === 0) return null;

  // One responsive tree. This used to be a `md:hidden` phone block and a
  // `hidden md:block` desktop block, each rendering the full test list, so
  // every test title shipped twice in the HTML — and Banner mounted this
  // component twice on top of that. The embla carousel is touch-first, so both
  // breakpoints share it; mobile also picks up the real progress indicator that
  // replaces the hard-coded 78% bar it used to show.
  return (
    <div className="w-full bg-[#F5F5F7] py-[15px] md:py-10">
      <div className="pl-5 md:pl-0 md:mx-auto md:h-full md:max-w-[1440px] md:px-[60px]">
        <div className="flex flex-col items-start gap-3 pr-0 md:mb-10 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex shrink-0 items-center gap-2 bg-white px-3 py-1 md:rounded-md">
            <div className="h-4 w-4 bg-[#0E1629]" />
            <p className="font-[Poppins] text-xs font-semibold uppercase tracking-wider text-[#0E1629] md:text-[14px]">
              Tests
            </p>
          </div>

          <p className="max-w-[682px] text-start font-[Poppins] text-xs font-medium leading-normal text-[#0E1629] md:text-[24px]">
            Discover curated tests across mental wellness, assessments,
            admissions, and upskilling led by experienced professionals, built
            around your needs.
          </p>
        </div>

        {isUserLoggedIn && visibleTabOptions.length > 0 && (
          <div className="flex gap-2.5 pt-2 md:mb-10 md:justify-center md:gap-[60px] md:pt-0">
            {visibleTabOptions.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring" as const, stiffness: 300, damping: 20 }}
                className={`cursor-pointer rounded-[5px] px-3 py-1.5 font-[Poppins] text-xs font-medium capitalize transition-all duration-300 md:w-[200px] md:px-5 md:py-2.5 md:text-[14px] ${
                  activeTab === tab.id
                    ? "bg-[#0E1629] text-white md:shadow-lg"
                    : "border border-[rgba(14,22,41,0.25)] text-[#0E1629] hover:border-[#0E1629] md:hover:shadow-md"
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
            className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-2 md:mb-6 md:min-h-[451px] md:justify-center md:gap-[25px] md:pb-0"
          >
            {Array.from({ length: 4 }).map((_, idx) => (
              <motion.div
                key={`skeleton-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring" as const, stiffness: 100, damping: 12, delay: idx * 0.1 }}
                className="h-[220px] w-[250px] shrink-0 animate-pulse rounded-2xl bg-[#F3F4F6] md:h-[420px] md:w-[312px]"
              />
            ))}
          </motion.div>
        ) : filteredTests.length > 0 || shouldShowInlineTestUpsell ? (
          <div className="relative mt-2 lg:mt-8">
            <div className="overflow-x-hidden py-2 md:px-0.5 md:py-4" ref={emblaRef}>
              <div className="flex gap-3 md:gap-[25px] md:px-3 lg:px-6">
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
                  <div className="flex h-[150px] w-[250px] shrink-0 items-center justify-center self-center rounded-2xl p-3 text-center md:h-[12.5rem] md:w-[24rem] md:p-5">
                    <div className="flex w-full flex-col items-center gap-3 md:gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#0E1629] md:text-lg">
                          Build stronger preparation
                        </p>
                        <p className="mx-auto mt-2 max-w-[20rem] text-xs leading-relaxed text-[#6B7280] md:text-sm">
                          Add more test groups to practice across topics and improve your outcomes.
                        </p>
                      </div>
                      <button
                        onClick={() => handleTabChange("trending")}
                        className="w-full cursor-pointer rounded-lg bg-[#0E1629] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 md:w-auto md:rounded-xl md:px-4 md:text-sm"
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
            className="flex items-center justify-center py-10 md:mb-6 md:min-h-[451px] md:py-0"
          >
            {isUserLoggedIn && activeTab === "my-tests" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-lg font-semibold text-[#0E1629] md:text-xl">Keep Learning</p>
                <p className="mx-auto max-w-[20rem] text-sm leading-relaxed text-[#6B7280]">
                  You haven't purchased any test series yet. Explore trending tests and start practising.
                </p>
                <button
                  onClick={() => handleTabChange("trending")}
                  className="cursor-pointer rounded-xl bg-[#0E1629] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Explore Trending
                </button>
              </div>
            ) : (
              <p className="self-center font-[Poppins] text-[14px] text-[#6B7280]">No tests found.</p>
            )}
          </motion.div>
        )}

        <div className="mt-2 flex items-center justify-between md:mt-0">
          <div className="flex items-center gap-4">
            <div className="h-1 w-20 overflow-hidden rounded-[48px] bg-[#EDEDED] md:w-[262px]">
              <div
                className="h-full rounded-[48px] bg-[#0E1629] transition-all duration-300"
                style={{
                  width: snapCount > 1 ? `${((selectedIndex + 1) / snapCount) * 100}%` : "100%",
                }}
              />
            </div>
          </div>

          {/* "See all" stays desktop-only, as it was before the merge. */}
          <div className="hidden md:block">
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
