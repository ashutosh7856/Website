import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/AuthStore";
import { updateUserProfile } from "@/api/user";
import { buyCourse, getBoughtCourses } from "@/api/course";
import EditProfileModal from "@/components/student-dashboard/EditProfileModal";
import CourseEnrollmentPopup from "@/components/landing-page/CourseEnrollmentPopup";
import FAQ from "@/components/landing-page/FAQ";
import { Carousel } from "@/components/landing-page/Carousel";
import { GuidanceSection } from "@/components/landing-page/GuidanceSection";
import toast from "react-hot-toast";
import startRecharge from "@/api/wallet";
import { getLoggedInPhone, formatPhoneForRazorpay } from "@/lib/phone";
import { useQuery } from "@tanstack/react-query";
import { FaWhatsapp } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

declare global {
  interface Window {
    Razorpay: unknown;
  }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };

const COURSE_ID = "a997f3a9-4a36-4395-9f90-847b739fb225";
const COURSE_NAME = "MHT-CET Mastery Course";
const COURSE_PRICE = 2499;
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/JahmZvJ4vslJTxX9thZDK6";
const TARGET_REFERRAL_CODES = [
  "SPARKKSIR",
  "Member1",
  "Member2",
  "Member3",
  "Member4",
  "Member5",
  "Member6",
  "Member7",
  "Member8",
  "Member9",
  "Member10",
];

export default function LandingPage() {
  const { user, userId, isAuthenticated, toggleLogin, refreshUser } =
    useAuthStore();
  const token = localStorage.getItem("jwt");
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam && TARGET_REFERRAL_CODES.includes(refParam)) {
      setReferralCode(refParam);
    } else {
      setReferralCode(null);
    }
  }, [searchParams]);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const storePendingAction = useAuthStore((s) => s.pendingAction);
  const setStorePendingAction = useAuthStore((s) => s.setPendingAction);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Counselor logic
  const storeRole = useAuthStore((s) => s.role);
  const isCounselor = storeRole === "counselor";

  const isUserLoaded = user !== null && user !== undefined;

  // Prevent API calls for counselors
  const {
    data: boughtCoursesData,
    isLoading: isLoadingBought,
    refetch,
  } = useQuery({
    queryKey: ["boughtCourses", userId],
    queryFn: () => {
      if (isCounselor) {
        return Promise.resolve({
          data: [],
          status: true,
          message: "Counselor cannot buy courses",
        });
      }
      return getBoughtCourses(userId as string);
    },
    enabled: isUserLoaded && !!userId && isAuthenticated && !isCounselor,
    staleTime: 5000,
  });

  const isCoursePurchased =
    boughtCoursesData?.data?.some((course) => course.courseId === COURSE_ID) ??
    false;

  // Removed unused handleProfileIncomplete - profile completion is handled inline in handleEnroll

  // ✅ ADDED: helper to check profile completeness
  const isProfileIncomplete = (user: any) => {
    return !user?.firstName || !user?.lastName || !user?.email;
  };

  const handleUpdateProfile = async (updatedData: {
    firstName: string;
    lastName: string;
    email: string;
  }) => {
    if (!userId || !token) throw new Error("User not authenticated");

    const payload = {
      ...updatedData,
      ...(referralCode && { referralCode }),
    };

    await updateUserProfile(userId, payload, token);
    await refreshUser(true);
    if (isAuthenticated) refetch();
    if (storePendingAction) {
      console.log(
        "AdityaLandingPage: invoking store pendingAction after profile update",
        { storePendingAction }
      );
      try {
        storePendingAction();
      } catch (err) {
        console.error("AdityaLandingPage: store pendingAction threw:", err);
      }
      setStorePendingAction(null);
    }
  };

  const handleCloseModal = () => {
    setIsEditProfileModalOpen(false);
    setStorePendingAction(null);
  };

  const handleDirectPayment = async (amount: number) => {
    const authState = useAuthStore.getState();
    const freshUser = authState.user;
    // Always use the number the user is LOGGED IN with (login/OTP phone),
    // never the editable profile field which may be a different number.
    const phoneNumber = getLoggedInPhone();

    if (!freshUser?.userName || !phoneNumber) {
      toast.error("User information not found. Please try logging in again.");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading("Initiating payment...");

    try {
      const order = await startRecharge(freshUser.userName, amount);

      // Razorpay expects digits only with country code, e.g. 919876543210
      const formattedPhone = formatPhoneForRazorpay(phoneNumber);

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ProCounsel",
        description: `${COURSE_NAME} - Course Enrollment`,
        prefill: {
          contact: formattedPhone,
          email: freshUser.email || "",
          name: `${freshUser.firstName || ""} ${
            freshUser.lastName || ""
          }`.trim(),
        },
        notes: {
          userId: freshUser.userName,
          courseId: COURSE_ID,
          courseName: COURSE_NAME,
        },
        handler: async () => {
          toast.dismiss(loadingToast);
          const purchaseToast = toast.loading("Enrolling you in the course...");

          try {
            const purchaseResponse = await buyCourse({
              userId: freshUser.userName,
              courseId: COURSE_ID,
              counsellorId: "",
              price: amount,
            });

            if (purchaseResponse.status) {
              toast.success("Enrollment successful!", { id: purchaseToast });
              refetch();
              await refreshUser(true);
              setShowSuccessPopup(true);
            } else {
              throw new Error(purchaseResponse.message || "Enrollment failed");
            }
          } catch (error) {
            toast.error(
              (error as Error).message ||
                "Payment succeeded but enrollment failed.",
              { id: purchaseToast }
            );
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.dismiss(loadingToast);
            setIsProcessing(false);
          },
        },
        theme: { color: "#13097D" },
      };

      const RZ = (window as unknown as { Razorpay: RazorpayConstructor })
        .Razorpay;
      const rzp = new RZ(options);
      rzp.open();
      toast.dismiss(loadingToast);
    } catch {
      toast.error("Could not start payment process. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleEnroll = async (amount: number) => {
    if (!isAuthenticated) {
      // Simplify: store a callback to re-run enrollment after login/onboarding/profile completion
      toggleLogin(() => handleEnroll(amount));
      return;
    }

    if (isCounselor) {
      toast.error("Counsellors cannot enroll in this course.");
      return;
    }

    if (isCoursePurchased) {
      toast.error("You are already enrolled.");
      return;
    }

    await refreshUser(true);
    const freshUser = useAuthStore.getState().user;
    if (freshUser?.role?.toLowerCase() === "counselor") {
      toast.error("Counsellors cannot enroll.");
      return;
    }

    // ✅ ADDED: profile completion check (LOGGED IN USERS)
    if (isProfileIncomplete(freshUser)) {
      setStorePendingAction(() => () => handleDirectPayment(amount));
      setIsEditProfileModalOpen(true);
      return;
    }

    const result = await refetch();
    const nowPurchased =
      result.data?.data?.some((c) => c.courseId === COURSE_ID) ?? false;

    if (nowPurchased) {
      toast.error("You are already enrolled.");
      return;
    }

    await handleDirectPayment(amount);
  };

  const WhatsAppButton = ({ mobile = false }: { mobile?: boolean }) => (
    <a
      href={WHATSAPP_GROUP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full flex items-center justify-center gap-2 bg-[#25D366] text-white font-medium rounded-[12px] transition-all duration-300 cursor-pointer hover:bg-[#1EBE59] ${
        mobile ? "text-[14px] py-2.5 mt-2" : "text-[16px] py-2 mt-2"
      }`}
    >
      <FaWhatsapp size={20} /> <span>Join WhatsApp Group Now!</span>
    </a>
  );

  const EnrollmentButton = ({ mobile = false }: { mobile?: boolean }) => {
    const classes = `w-full rounded-[12px] text-white font-medium disabled:cursor-not-allowed transition-all ${
      mobile ? "text-[14px] py-2.5 mt-3.5" : "text-lg py-3"
    }`;

    if (isCounselor)
      return (
        <button disabled className={`${classes} bg-red-500`}>
          Counsellors cannot enroll
        </button>
      );

    if (isCoursePurchased)
      return (
        <button disabled className={`${classes} bg-gray-400`}>
          Already Enrolled
        </button>
      );

    return (
      <button
        onClick={() => handleEnroll(COURSE_PRICE)}
        disabled={isProcessing || isLoadingBought}
        className={`${classes} bg-blue-700 cursor-pointer hover:bg-blue-800`}
      >
        {isLoadingBought
          ? "Checking enrollment..."
          : isProcessing
          ? "Processing..."
          : "Enroll Now"}
      </button>
    );
  };

  return (
    <div className="mx-auto mt-1 md:mt-20">
      {/* Mobile */}
      <div className="block md:hidden w-full h-full bg-[#F5F7FA] p-5 mt-14">
        <div className="w-full max-w-sm p-3 bg-white rounded-[12px] border border-[#EFEFEF]">
          <div>
            <div className="flex gap-3">
              <div className="bg-[#E3E1EF] w-21 h-21 rounded-xl">
                <img loading="lazy" decoding="async" src="/adityam.svg" alt="" />
              </div>

              <div className="flex flex-col gap-1.5">
                <h1 className="text-[0.875rem] font-semibold text-[#343C6A]">
                  GuruCool Crash Course for{" "}
                  <span>MHT-CET 2026 | Aaditya Coep</span>
                </h1>

                <img loading="lazy" decoding="async" src="/ratingandduration.svg" alt="" />

                <p className="flex gap-2 items-center">
                  <img loading="lazy" decoding="async" src="/4,999.svg" alt="" className="h-[15px]" />
                  <span className="text-[1rem] font-semibold text-[#232323]">
                    ₹{COURSE_PRICE}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <EnrollmentButton mobile />
          {isCoursePurchased && <WhatsAppButton mobile />}

          <hr className="h-px bg-#EFEFEF mt-4 mb-2" />

          <h1 className="text-[0.875rem] font-semibold text-[#343C6A]">
            Course Description
          </h1>
          <p className="text-xs text-[#8C8CA1]">
            The course is structured for fast learning, solid revision, and
            maximum marks.
          </p>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block w-full h-[34.313rem] bg-[#13097D1F] md:p-5">
        <div className="flex justify-between max-w-7xl h-[24.313rem] bg-white rounded-2xl mx-auto mt-16 px-10 pt-10">
          <div className="flex flex-col gap-3">
            <h1 className="text-[#13097D] font-semibold md:text-3xl lg:text-[2rem]">
              GuruCool Crash Course for MHT-CET <span>2026 | Aaditya Coep</span>
            </h1>

            <p className="text-[#232323] text-[1rem] font-medium">
              The course is structured to ensure fast learning, solid revision,
              and maximum marks.
            </p>

            <div className="flex gap-5">
              <div className="flex flex-col">
                <p className="flex gap-2 items-center">
                  <img loading="lazy" decoding="async" src="/star.svg" alt="" />
                  <span className="text-[#13097D] text-[1.25rem] font-semibold">
                    4.7
                  </span>
                </p>
                <span className="text-[1rem] font-medium">Course Rating</span>
              </div>

              <div className="flex flex-col">
                <p className="text-[#13097D] text-[1.25rem] font-semibold">
                  4 Months
                </p>
                <span className="text-[1rem] font-medium">Course Duration</span>
              </div>
            </div>

            <div className="flex gap-3 pt-5">
              <div className="flex flex-col w-[450px]">
                <EnrollmentButton />
                {isCoursePurchased && <WhatsAppButton />}
              </div>
              <p className="flex gap-2 items-center">
                <img loading="lazy" decoding="async" src="/4,999.svg" alt="" className="h-5" />
                <span className="text-[1.25rem] font-semibold text-[#232323]">
                  ₹{COURSE_PRICE.toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </div>

          <div>
            <div className="w-75 h-[17.313rem] bg-[#E3E1EF] rounded-[12px]">
              <img loading="lazy" decoding="async" src="/aditya.svg" alt="" />
            </div>
          </div>
        </div>
      </div>

      <Carousel />
      <GuidanceSection />
      <FAQ />

      {user && (
        <EditProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={handleCloseModal}
          user={user}
          onUpdate={handleUpdateProfile}
          onUploadComplete={() => {}}
        />
      )}

      {showSuccessPopup && (
        <CourseEnrollmentPopup
          courseName={COURSE_NAME}
          onClose={() => {
            setShowSuccessPopup(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
