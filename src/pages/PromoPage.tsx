import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Clock, Users, ChevronUp, ChevronRight, Tag } from "lucide-react";
import SmartImage from "@/components/ui/SmartImage";
import { useAuthStore } from "@/store/AuthStore";
import { useQuery } from "@tanstack/react-query";
import { getBoughtCourses, buyCourse, applyCoupon } from "@/api/course";
import { FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import startRecharge from "@/api/wallet";
import { getLoggedInPhone, formatPhoneForRazorpay } from "@/lib/phone";
import CourseEnrollmentPopup from "@/components/landing-page/CourseEnrollmentPopup";
import CouponCodeModal from "@/components/modals/CouponCodeModal";

declare global {
  interface Window {
    Razorpay: unknown;
    fbq?: any;
    gtag?: any;
    dataLayer?: any[];
    __pc_fb_inited?: Record<string, boolean>;
    __fb_script_blocked?: boolean;
    __gtag_script_blocked?: boolean;
    [key: string]: any; // For dynamic pageview tracking flags
  }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };

// TODO: Update with the actual course ID for this promo page
const COURSE_ID = "a997f3a9-4a36-4395-9f90-847b739fb225"; // Update this with the correct course ID
const COURSE_NAME = "MHT-CET Crash Course";
export const PROMO_COURSE_PRICE = 2499; // Export so Header can use it
const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/JahmZvJ4vslJTxX9thZDK6"; // Update with correct WhatsApp link

export default function PromoPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const { user, userId, isAuthenticated, toggleLogin, refreshUser } =
    useAuthStore();

  // @ts-expect-error - Used in login callback
  const storePendingAction = useAuthStore((s) => s.pendingAction);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Coupon state
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number | null>(null);

  // Clear coupon on page load/refresh
  useEffect(() => {
    setAppliedCoupon(null);
    setDiscountedPrice(null);
    setDiscountPercentage(null);
  }, []);
  
  // ✅ Use ref to preserve payment callback across re-renders
  const paymentCallbackRef = useRef<(() => void) | null>(null);

  // Inject Meta Pixel and Google Ads scripts only on this page
  useEffect(() => {
    const FB_ID = "886599400370059";
    const FB_SCRIPT_SRC = "https://connect.facebook.net/en_US/fbevents.js";
    const PAGEVIEW_KEY = `__fb_pageview_${FB_ID}_tracked`;

    // Prevent duplicate PageView tracking
    if ((window as any)[PAGEVIEW_KEY]) {
      return;
    }

    const hasFbScript = !!document.querySelector(
      `script[src*="${FB_SCRIPT_SRC}"]`
    );
    const hasFbNoscript = !!document.querySelector(
      `img[src*="facebook.com/tr?id=${FB_ID}"]`
    );

    // Avoid double-init: use a window flag per pixel id
    const fbInitedMap = (window as any).__pc_fb_inited || {};

    // Helper function to track PageView once
    const trackPageViewOnce = () => {
      if ((window as any)[PAGEVIEW_KEY]) return;
      try {
        if ((window as any).fbq && !(window as any).__fb_script_blocked) {
          (window as any).fbq("track", "PageView");
          (window as any)[PAGEVIEW_KEY] = true;
        }
      } catch (e) {
        // Silently ignore errors
      }
    };

    if (!hasFbScript && !(fbInitedMap && fbInitedMap[FB_ID])) {
      try {
        (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function () {
            n.callMethod
              ? n.callMethod.apply(n, arguments)
              : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = !0;
          n.version = "2.0";
          n.queue = [];
          t = b.createElement(e);
          t.async = !0;
          t.src = v;
          t.onerror = () => {
            // Silently handle script loading errors (e.g., ad blockers)
            (window as any).__fb_script_blocked = true;
          };
          s = b.getElementsByTagName(e)[0];
          if (s && s.parentNode) {
            s.parentNode.insertBefore(t, s);
          }
        })(window, document, "script", FB_SCRIPT_SRC);

        // Wait a bit for script to load, then initialize
        setTimeout(() => {
          try {
            if ((window as any).fbq && !(window as any).__fb_script_blocked) {
              (window as any).fbq("init", FB_ID);
              trackPageViewOnce();
              (window as any).__pc_fb_inited = (window as any).__pc_fb_inited || {};
              (window as any).__pc_fb_inited[FB_ID] = true;
            }
          } catch (e) {
            // Silently ignore errors
          }
        }, 100);

        // noscript fallback image (only if not already present)
        try {
          if (!hasFbNoscript) {
            const img = document.createElement("img");
            img.height = 1;
            img.width = 1;
            img.style.display = "none";
            img.onerror = () => {
              // Silently handle image loading errors
            };
            img.src = `https://www.facebook.com/tr?id=${FB_ID}&ev=PageView&noscript=1`;
            document.body.appendChild(img);
          }
        } catch (e) {
          // Silently ignore errors
        }
      } catch (e) {
        // Silently ignore initialization errors
      }
    } else {
      // If script already exists or we previously initialized, just trigger PageView safely
      if ((window as any).fbq && !(window as any).__fb_script_blocked) {
        try {
          trackPageViewOnce();
          (window as any).__pc_fb_inited = (window as any).__pc_fb_inited || {};
          (window as any).__pc_fb_inited[FB_ID] = true;
        } catch (e) {
          // Silently ignore errors
        }
      } else if (hasFbScript) {
        // script present but fbq not yet available — attach load listener
        const s = document.querySelector(
          `script[src*="${FB_SCRIPT_SRC}"]`
        ) as HTMLScriptElement | null;
        if (s) {
          const onLoad = () => {
            try {
              if ((window as any).fbq && !(window as any).__fb_script_blocked) {
                (window as any).fbq("init", FB_ID);
                trackPageViewOnce();
                (window as any).__pc_fb_inited =
                  (window as any).__pc_fb_inited || {};
                (window as any).__pc_fb_inited[FB_ID] = true;
              }
            } catch (e) {
              // Silently ignore errors
            }
            s.removeEventListener("load", onLoad);
          };
          s.addEventListener("load", onLoad);
        }
      }
    }

    // Google Ads / gtag for conversion
    if (!(window as any).gtag) {
      try {
        const gt = document.createElement("script");
        gt.async = true;
        gt.src = "https://www.googletagmanager.com/gtag/js?id=AW-16515631489";
        gt.onerror = () => {
          // Silently handle script loading errors (e.g., ad blockers)
          (window as any).__gtag_script_blocked = true;
        };
        document.head.appendChild(gt);

        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).gtag = function () {
          if (!(window as any).__gtag_script_blocked) {
            (window as any).dataLayer.push(arguments);
          }
        };
        
        // Wait a bit for script to load, then initialize
        setTimeout(() => {
          try {
            if (!(window as any).__gtag_script_blocked) {
              (window as any).gtag("js", new Date());
              (window as any).gtag("config", "AW-16515631489");
            }
          } catch (e) {
            // Silently ignore errors
          }
        }, 100);
      } catch (e) {
        // Silently ignore initialization errors
      }
    }
  }, []);

  // Counselor logic
  const storeRole = useAuthStore((s) => s.role);
  const isCounselor = storeRole === "counselor";

  const isUserLoaded = user !== null && user !== undefined;

  // Fetch enrollment status automatically when logged in
  // This runs in parallel during login, so button state is always ready
  const {
    data: boughtCoursesData,
    // @ts-expect-error - Used in EnrollmentButton below
    isLoading: isLoadingBought,
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
    // Query runs automatically so enrollment status is known immediately
    refetchOnWindowFocus: false, // Don't refetch on focus to avoid interruptions
  });

  const isCoursePurchased =
    boughtCoursesData?.data?.some((course) => course.courseId === COURSE_ID) ??
    false;

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Coupon handlers
  const handleCouponApplied = (couponCode: string, finalPrice: number, percentage: number) => {
    setAppliedCoupon(couponCode);
    setDiscountedPrice(finalPrice);
    setDiscountPercentage(percentage);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
    setDiscountedPrice(null);
    setDiscountPercentage(null);
  };

  const applyCouponWrapper = async (userId: string, courseId: string, couponCode: string) => {
    return await applyCoupon({ userId, courseId, couponCode });
  };

  const handleCouponButtonClick = () => {
    // Don't allow enrolled users to apply coupons
    if (isCoursePurchased) {
      return;
    }
    
    if (!isAuthenticated) {
      // Set skip onboarding flag for promo page
      useAuthStore.getState().setSkipOnboardingForPromo(true);
      
      // Open login modal and then show coupon modal after login
      toggleLogin(async () => {
        try {
          await refreshUser(true);
          const freshState = useAuthStore.getState();
          
          // Check enrollment status after login
          const enrollmentData = await getBoughtCourses(freshState.user?.userName as string);
          const alreadyEnrolled = enrollmentData?.data?.some((c) => c.courseId === COURSE_ID) ?? false;
          
          if (!alreadyEnrolled) {
            // Only open coupon modal if not enrolled
            setTimeout(() => {
              setShowCouponModal(true);
            }, 100);
          }
        } catch (error) {
          // Silently handle error
        }
      });
      return;
    }
    setShowCouponModal(true);
  };


  const handleDirectPayment = async (amount: number) => {
    if (isProcessing) {
      return;
    }

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

    // Special case: Free course (100% discount)
    if (amount === 0) {
      const enrollToast = toast.loading("Enrolling you in the course for free...");
      try {
        const purchaseResponse = await buyCourse({
          userId: freshUser.userName,
          courseId: COURSE_ID,
          counsellorId: "",
          price: 0,
          couponCode: appliedCoupon,
        });

        if (purchaseResponse.status) {
          toast.success("Enrollment successful!", { id: enrollToast });
          await refreshUser(true);
          setShowSuccessPopup(true);
          
          // Fire Google Ads conversion and Meta Pixel purchase event for free enrollment
          try {
            if ((window as any).gtag && !(window as any).__gtag_script_blocked) {
              (window as any).gtag("event", "conversion", {
                send_to: "AW-16515631489/AmkNCMnpzNUbEIGTosM9",
                value: 0,
                currency: "INR",
              });
            }
          } catch (e) {
            console.error("Google Ads tracking error:", e);
          }

          // Track Purchase event for Meta Pixel when free enrollment is successful
          try {
            if ((window as any).fbq && !(window as any).__fb_script_blocked) {
              (window as any).fbq("track", "Purchase", {
                value: 0,
                currency: "INR",
                content_name: COURSE_NAME,
                content_ids: [COURSE_ID],
                content_type: "product",
                ...(appliedCoupon && { coupon: appliedCoupon }),
              });
            }
          } catch (e) {
            console.error("Facebook Pixel tracking error:", e);
          }
        } else {
          throw new Error(purchaseResponse.message || "Enrollment failed");
        }
      } catch (error) {
        toast.error(
          (error as Error).message || "Enrollment failed. Please contact support.",
          { id: enrollToast }
        );
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Regular payment flow for non-zero amounts
    const loadingToast = toast.loading("Initiating payment...");

    try {
      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error(
          "Payment system not loaded. Please refresh and try again."
        );
      }

      const order = await startRecharge(freshUser.userName, amount);

      if (!order || !order.orderId) {
        throw new Error("Failed to create payment order. Please try again.");
      }

      // Razorpay expects digits only with country code, e.g. 919876543210
      const formattedPhone = formatPhoneForRazorpay(phoneNumber);

      // Track InitiateCheckout event for Meta Pixel when Razorpay payment is initiated
      try {
        if ((window as any).fbq && !(window as any).__fb_script_blocked) {
          (window as any).fbq("track", "InitiateCheckout", {
            value: amount,
            currency: "INR",
            content_name: COURSE_NAME,
            content_ids: [COURSE_ID],
          });
        }
      } catch (e) {
        // Silently ignore errors
      }

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
          ...(appliedCoupon && { couponCode: appliedCoupon }),
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
              couponCode: appliedCoupon,
            });

            if (purchaseResponse.status) {
              toast.success("Enrollment successful!", { id: purchaseToast });
              await refreshUser(true);
              setShowSuccessPopup(true);
              
              // Fire Google Ads conversion and Meta Pixel purchase event
              try {
                if ((window as any).gtag && !(window as any).__gtag_script_blocked) {
                  (window as any).gtag("event", "conversion", {
                    send_to: "AW-16515631489/AmkNCMnpzNUbEIGTosM9",
                    value: amount,
                    currency: "INR",
                  });
                  console.log("Google Ads conversion tracked:", amount);
                } else {
                  console.warn("Google Ads tracking not available or blocked");
                }
              } catch (e) {
                console.error("Google Ads tracking error:", e);
              }

              // Track Purchase event for Meta Pixel when Razorpay payment is successful
              try {
                if ((window as any).fbq && !(window as any).__fb_script_blocked) {
                  (window as any).fbq("track", "Purchase", {
                    value: amount,
                    currency: "INR",
                    content_name: COURSE_NAME,
                    content_ids: [COURSE_ID],
                    content_type: "product",
                    ...(appliedCoupon && { coupon: appliedCoupon }),
                  });
                  console.log("Facebook Pixel Purchase tracked:", amount);
                } else {
                  console.warn("Facebook Pixel tracking not available or blocked");
                }
              } catch (e) {
                console.error("Facebook Pixel tracking error:", e);
              }
            } else {
              throw new Error(purchaseResponse.message || "Enrollment failed");
            }
          } catch (error) {
            toast.error(
              (error as Error).message ||
                "Payment succeeded but enrollment failed. Please contact support.",
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
      
      // Track AddPaymentInfo event for Meta Pixel when Razorpay modal opens
      try {
        if ((window as any).fbq && !(window as any).__fb_script_blocked) {
          (window as any).fbq("track", "AddPaymentInfo", {
            value: amount,
            currency: "INR",
            content_name: COURSE_NAME,
            content_ids: [COURSE_ID],
          });
        }
      } catch (e) {
        // Silently ignore errors
      }
      
      rzp.open();
      toast.dismiss(loadingToast);
    } catch (error) {
      const errorMessage =
        (error as Error).message ||
        "Could not start payment process. Please try again.";
      toast.error(errorMessage);
      toast.dismiss(loadingToast);
      setIsProcessing(false);
    }
  };

  const handleEnroll = async (amount: number) => {
    // Only check if already processing - no other blocking checks
    if (isProcessing) {
      return;
    }

    if (!isAuthenticated) {
      // For promo page we want new users to skip onboarding and go straight to payment.
      // Set a store flag so AuthStore.verifyOtp will not trigger onboarding for this login.
      useAuthStore.getState().setSkipOnboardingForPromo(true);

      // Store the payment callback in ref so it survives re-renders
      paymentCallbackRef.current = async () => {
        try {
          await refreshUser(true);
          const freshState = useAuthStore.getState();

          if (freshState.role === "counselor") {
            toast.error("Counsellors cannot enroll in this course.");
            paymentCallbackRef.current = null;
            return;
          }

          // ✅ Check if user already enrolled BEFORE opening Razorpay
          const enrollmentData = await getBoughtCourses(
            freshState.user?.userName as string
          );
          const alreadyEnrolled =
            enrollmentData?.data?.some((c) => c.courseId === COURSE_ID) ??
            false;

          if (alreadyEnrolled) {
            toast.success("You are already enrolled in this course!");
            paymentCallbackRef.current = null;
            return;
          }

          // For promo page, skip profile completion and go directly to payment
          // Use discounted price if coupon applied (handle 0 for 100% discount)
          const finalAmount = discountedPrice !== null ? discountedPrice : amount;
          await handleDirectPayment(finalAmount);
          paymentCallbackRef.current = null;
        } catch (error) {
          toast.error("Something went wrong. Please try again.");
          paymentCallbackRef.current = null;
        }
      };

      // After login, execute the payment callback
      toggleLogin(() => {
        // Use setTimeout to ensure state updates are complete
        setTimeout(() => {
          if (paymentCallbackRef.current) {
            paymentCallbackRef.current();
          }
        }, 100);
      });
      return;
    }

    // ---- LOGGED IN USERS ----
    // No enrollment checks here - button state already reflects enrollment status
    // Query ran automatically when page loaded, so isCoursePurchased is accurate

    if (isCounselor) {
      toast.error("Counsellors cannot enroll in this course.");
      return;
    }

    if (isCoursePurchased) {
      toast.error("You are already enrolled.");
      return;
    }

    try {
      // Use discounted price if coupon applied (handle 0 for 100% discount)
      const finalAmount = discountedPrice !== null ? discountedPrice : amount;
      await handleDirectPayment(finalAmount);
    } catch (error) {
      toast.error("Could not start payment. Please try again.");
    }
  };

  const handleEnrollNow = () => {
    handleEnroll(PROMO_COURSE_PRICE);
  };

  // Store on window so Header can access it
  (window as any).__promoPageEnroll = handleEnrollNow;

  const WhatsAppButton = () => (
    <a
      href={WHATSAPP_GROUP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1EBE59] text-white font-medium rounded-xl px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg transition-all duration-300 cursor-pointer"
    >
      <FaWhatsapp size={20} /> <span>Join WhatsApp Group Now!</span>
    </a>
  );

  const EnrollmentButton = () => {
    if (isCounselor) {
      return (
        <Button
          disabled
          className="bg-red-500 hover:bg-red-500 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-medium rounded-xl cursor-not-allowed"
        >
          Counsellors cannot enroll
        </Button>
      );
    }

    if (isCoursePurchased) {
      return (
        <Button
          disabled
          className="bg-gray-400 hover:bg-gray-400 text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-medium rounded-xl cursor-not-allowed"
        >
          Already Enrolled
        </Button>
      );
    }

    return (
      <Button
        onClick={handleEnrollNow}
        disabled={isProcessing}
        className="bg-[#FF660F] hover:bg-[#e15500] text-white px-6 sm:px-8 py-4 sm:py-6 text-sm sm:text-lg font-medium rounded-xl cursor-pointer"
      >
        {isProcessing ? "Processing..." : "Enroll Now"}
      </Button>
    );
  };

  const features = [
    {
      icon: "/what1.svg",
      title: "Live training sessions that focus on clarity and mastery",
      description:
        "Get a combination of live strategy/doubt sessions and recorded detailed lectures for fast understanding. Learn anytime, anywhere.",
    },
    {
      icon: "/what2.svg",
      title: "Dedicated personal mentor to eliminate weaknesses",
      description:
        "Get a dedicated personal mentor to eliminate weaknesses and provide one-on-one guidance throughout your journey.",
    },
    {
      icon: "/what3.svg",
      title: "Doubt-clearing access to ensure zero confusion",
      description:
        "Doubt-clearing access to ensure zero confusion. Get your questions answered quickly by experts.",
    },
    {
      icon: "/what4.svg",
      title: "Practical assignments and mock tests to build readiness",
      description:
        "Take CET-pattern full-length mock tests designed to match real exam difficulty, timing, and marking scheme.",
    },
    {
      icon: "/what5.svg",
      title: "Structured Chapter-wise PYQs for Students",
      description:
        "Access chapter-wise and topic-wise Previous Year Questions so you understand exactly which concepts repeat every year.",
    },
    {
      icon: "/what6.svg",
      title: "Tailored College Selection Guidance",
      description:
        "Guided college shortlisting to avoid guesswork. We help you pick the right colleges based on your profile.",
    },
  ];

  const benefits = [
    "Trained 1000+ students to date",
    "More than 80% success rate for top-tier college admissions",
    "Focus on strategy, not rote memory",
    "Scholarship and interview preparation included",
  ];

  const colleges = [
    "IITs",
    "NITs",
    "SP Jain",
    "NMIMS",
    "MIT Pune",
    "Christ University",
    "Symbiosis",
    "SRCC",
    "Leading DU Colleges",
  ];

  const defaultInstructors = [
    {
      name: "Shiv",
      role: "Mathematics Faculty",
      experience: "Experienced",
      description:
        "Shiv Sir is a highly experienced Mathematics faculty known for his clear explanations, smart shortcuts, and exam-oriented teaching. He specialises in simplifying tough concepts and helping students improve their solving speed and accuracy for MHT CET.",
      image: "/guide_shiv.png",
    },
    {
      name: "Soham Bingewar",
      role: "Chemistry Faculty",
      experience: "Experienced",
      description:
        "Soham Sir is an expert Chemistry faculty known for his NCERT-focused teaching, quick revision techniques, and exam-oriented approach. He simplifies Organic, Inorganic, and Physical Chemistry through smart tricks, memory cues, and high-weightage focus.",
      image: "/guide_soham.png",
    },
    {
      name: "Aaditya Dahale",
      role: "Strategy Planner & Mentor",
      experience: "Experienced",
      description:
        "Strategy Planner & Mentor, who has guided and mentored more than 75,000 MHT CET aspirants with clear planning, smart strategies, and result-oriented direction.",
      image: "/guide_aaditya.jpg",
    },
    {
      name: "Prathmesh Hatwar",
      role: "Physics Faculty",
      experience: "Experienced",
      description:
        "Prathmesh Sir makes Physics feel simple, logical, and fully exam-oriented. He focuses on conceptual understanding, derivation shortcuts, and high-weightage chapter coverage. His one-shot lectures and problem-solving sessions help students master theory + numericals in minimum time.",
      image: "/guide_prathmesh.jpg",
    },
  ];

  // Always use default instructors (do not fetch from API for this page)
  const instructors = defaultInstructors;

  const testimonials = [
    {
      name: "Ashutosh",
      role: "MHT-CET Student",
      rating: 5,
      text: "The biggest strength of this course is the structured planning designed by Aaditya Dahale sir. From weekly targets to CET-pattern full-length mock tests, everything followed a clear strategy. The mocks matched real exam difficulty, and the college selection guidance helped me shortlist colleges based on my performance instead of guesswork.",
      image: "/review1.jpeg",
    },
    {
      name: "Ananya",
      role: "MHT-CET Student",
      rating: 5,
      text: "Learning under Prathmesh Hatwar sir helped me build strong fundamentals while staying completely exam-oriented. The topic-wise coverage, regular doubt-clearing, and structured practice kept my preparation consistent. This course played a key role in maintaining discipline and steady progress throughout the preparation period.",
      image: "/review2.jpeg",
    },
    {
      name: "Shubham",
      role: "MHT-CET Student",
      rating: 5,
      text: "The Mathematics sessions by Shiv sir made complex concepts much easier to understand. The focus on problem-solving, exam-relevant shortcuts, and regular practice helped me improve accuracy and confidence. The course structure ensured I was always aligned with CET-level expectations. Soham sir’s in-depth approach to Chemistry, especially concept linking and exam-oriented problem solving, further strengthened my overall preparation.",
      image: "/review3.jpeg",
    },
  ];

  const faqs = [
    {
      question: "What is included in this Crash Course?",
      answer:
        "You will get one-shot revision lectures, short notes, formula sheets, high-weightage topics, chapter-wise PYQs, mock tests, practice questions, doubt support, and complete strategy sessions for both Attempt 1 and Attempt 2.",
    },
    {
      question: "Is this course enough to score high in MHT CET?",
      answer:
        "Yes. The course is designed to cover the entire PCM syllabus with CET-focused teaching, high-weightage topics, and fast revision. If you follow the plan and practice regularly, you can significantly improve your percentile.",
    },
    {
      question: "Will I get notes and PYQs?",
      answer:
        "Yes. You will get: • Chapter-wise short notes • Formula sheets • Topic-wise PYQs • High-weightage question sets — All in downloadable PDF format.",
    },
    {
      question: "Will classes be live or recorded?",
      answer:
        "The course includes LIVE + Recorded Lectures + live strategy and doubt sessions as required during exam weeks.",
    },
    {
      question: "What is the refund policy?",
      answer:
        "Since this is a digital course with instant access to all materials, we do not offer refunds after enrollment.",
    },
  ];

  return (
    <div className="min-h-screen bg-white font-poppins leading-[100%]">
      {/* Hero Section */}
      <section
        ref={heroSectionRef}
        className="pt-18 sm:pt-22 md:pt-30 pb-10 px-4 sm:px-6 lg:px-8 flex items-center overflow-hidden"
        style={{
          minHeight: "auto",
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 9.39%, #F5F6FF 83.91%)",
        }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12">
            {/* Left Content - 70% */}
            <div className="w-full lg:w-[60%] xl:w-[70%] space-y-4 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-[#FEECE199] rounded-full gap-2">
                <div className="w-2 h-2 bg-[#FA660F] rounded-full"></div>
                <span
                  className="text-[#FA660F] font-normal text-xs sm:text-base tracking-normal"
                  style={{ color: "#FA660F", fontWeight: 400 }}
                >
                  Seats are filling fast. A new batch is starting soon.
                </span>
              </div>

              <h1 className="text-[#232323] font-semibold text-2xl sm:text-3xl md:text-[36px] tracking-normal text-left">
                Take Off to Top Universities{" "}
                <span className="text-[#2F43F2]">
                  Faster Than Everyone Else
                </span>
              </h1>

              <p
                className="max-w-2xl text-sm sm:text-lg md:text-xl tracking-normal text-left"
                style={{ color: "#6B7280", fontWeight: 500 }}
              >
                Crack admissions with a proven structure, expert mentorship, and
                confidence-boosting support.
              </p>

              {/* Stats - Two Rows Layout */}
              <div className="flex items-center justify-center lg:justify-start gap-6 sm:gap-6 md:gap-8 flex-wrap">
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2">
                  <div className="flex items-center gap-2">
                    <Star
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: "#FA7415" }}
                      fill="#FA7415"
                    />
                    <span
                      className="text-sm sm:text-lg md:text-xl"
                      style={{ fontWeight: 600, color: "#232323" }}
                    >
                      4.7
                    </span>
                  </div>
                  <span
                    className="text-xs sm:text-base lg:mt-0 mt-1"
                    style={{ fontWeight: 400, color: "#6B7280" }}
                  >
                    Course Rating
                  </span>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2">
                  <div className="flex items-center gap-2">
                    <Clock
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: "#2137F2" }}
                    />
                    <span
                      className="text-sm sm:text-lg md:text-xl"
                      style={{ fontWeight: 600, color: "#232323" }}
                    >
                      4 Months
                    </span>
                  </div>
                  <span
                    className="text-xs sm:text-base lg:mt-0 mt-1"
                    style={{ fontWeight: 400, color: "#6B7280" }}
                  >
                    Course Duration
                  </span>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-2">
                  <div className="flex items-center gap-2">
                    <Users
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: "#22C55D" }}
                    />
                    <span
                      className="text-sm sm:text-lg md:text-xl"
                      style={{ fontWeight: 600, color: "#232323" }}
                    >
                      1000+
                    </span>
                  </div>
                  <span
                    className="text-xs sm:text-base lg:mt-0 mt-1"
                    style={{ fontWeight: 400, color: "#6B7280" }}
                  >
                    Students
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center lg:items-start gap-4 pt-4 w-full">
                {/* Price and Button - Always Row */}
                <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 flex-wrap">
                  {/* Price Display */}
                  <div className="flex flex-col gap-2">
                    {appliedCoupon && discountPercentage ? (
                      <>
                        {/* Discount Badge with savings */}
                        <div className="flex flex-col gap-1">
                          <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 px-3 py-1.5 rounded-full font-semibold text-xs sm:text-sm w-fit shadow-sm">
                            <span className="text-green-600">🎉</span>
                            <span>{discountPercentage}% OFF Applied</span>
                          </div>
                          <span className="text-xs text-green-600 font-medium">
                            You save ₹{(PROMO_COURSE_PRICE - (discountedPrice ?? 0)).toLocaleString("en-IN")}
                          </span>
                        </div>
                        {/* Pricing - Old price then new price side by side */}
                        <div className="flex items-baseline gap-3 flex-wrap">
                          <span className="text-base sm:text-lg text-gray-400 line-through font-medium">
                            ₹{PROMO_COURSE_PRICE.toLocaleString("en-IN")}
                          </span>
                          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#FF660F]">
                            ₹{(discountedPrice ?? 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-lg sm:text-xl md:text-2xl font-semibold text-[#232323]">
                        ₹{PROMO_COURSE_PRICE.toLocaleString("en-IN")}
                      </div>
                    )}
                  </div>
                  
                  <EnrollmentButton />
                </div>
                
                {/* Coupon Section - Always Centered Below */}
                {!isCoursePurchased && (
                  <div className="w-full max-w-md flex justify-center lg:justify-start">
                    {appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs text-green-600 font-medium">Coupon Applied</p>
                            <p className="text-sm font-mono text-green-800">{appliedCoupon}</p>
                          </div>
                        </div>
                        <button
                          onClick={handleCouponRemoved}
                          className="text-green-600 hover:text-green-800 text-sm font-medium cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleCouponButtonClick}
                        className="flex items-center justify-center gap-2 text-[#FF660F] hover:text-[#e55a0a] text-sm font-medium transition-colors cursor-pointer"
                      >
                        <Tag className="h-4 w-4" />
                        <span>Have a coupon code?</span>
                      </button>
                    )}
                  </div>
                )}
                
                {isCoursePurchased && (
                  <div className="w-full max-w-md">
                    <WhatsAppButton />
                  </div>
                )}
              </div>
            </div>

            {/* Right Image - 30% */}
            <div className="w-full lg:w-[30%] flex justify-center lg:justify-end">
              <div className="relative flex justify-center lg:max-w-none">
                <div
                  className="rounded-xl relative mx-auto w-[335px] h-[286px] lg:w-[442px] lg:h-[442px]"
                  style={{
                    background:
                      "linear-gradient(179.92deg, #E3D2C7 26.93%, #E6DAD3 99.93%)",
                  }}
                >
                  <SmartImage
                    src="/promophoto.png"
                    alt="Course Hero"
                    className="rounded-xl object-cover w-full h-full"
                    width={442}
                    height={442}
                  />
                  {/* Card Overlay */}
                  <div
                    className="absolute bottom-[-5%] left-[-1%] lg:left-[-10%] bg-white rounded-lg px-3 sm:px-4 py-2 sm:py-3 shadow-lg"
                    style={{
                      borderRadius: "16px",
                    }}
                  >
                    <p
                      className="font-medium text-base mb-1"
                      style={{ color: "#232323" }}
                    >
                      Lead Instructor
                    </p>
                    <p
                      className="text-xs font-normal"
                      style={{ color: "#6B7280" }}
                    >
                      10+ years experience
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What you'll get Section */}
      <section className="pt-12 sm:pt-16 pb-10 px-4 sm:px-5 lg:px-20">
        <div className="mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              What you'll get
            </h2>
            <p
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Benefits listed as features that deliver real outcomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              return (
                <Card
                  key={index}
                  className="group transition-all duration-300 w-full shadow-none py-0"
                  style={{
                    borderRadius: "24px",
                    border: "1px solid #E8EAED",
                    backgroundColor: "#FFFFFF",
                    borderWidth: "1px",
                    minHeight: "190px",
                    boxShadow: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#2F43F2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E8EAED";
                  }}
                >
                  <CardContent className="px-3 sm:px-6 h-full py-3 sm:py-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-shrink-0 mb-4">
                        <div className="rounded-lg flex items-center justify-center transition-all duration-300 bg-[#ECEEFE] group-hover:bg-[#2F43F2] w-7 h-7 sm:w-[56px] sm:h-[56px]">
                          <img loading="lazy" decoding="async"
                            src={feature.icon}
                            alt=""
                            className="icon-hover-white transition-all duration-300 w-4 h-4 sm:w-8 sm:h-8"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3
                          className="mb-2"
                          style={{
                            fontWeight: 500,
                            fontSize: "16px",
                            letterSpacing: "0%",
                            color: "#0E1629",
                          }}
                        >
                          <span className="sm:text-lg md:text-[20px]">
                            {feature.title}
                          </span>
                        </h3>
                        <p
                          className="font-normal text-[#6B7280]"
                          style={{ fontSize: "14px" }}
                        >
                          <span className="sm:text-base md:text-[18px]">
                            {feature.description}
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Statistics */}
      <section className="pt-0 pb-4 sm:pb-5 px-4 sm:px-5 lg:px-20">
        <div className="max-w-full mx-auto">
          <div className="bg-[#F9FAFB] rounded-lg px-4 sm:px-8 md:px-20 py-5 sm:py-7 flex flex-row items-center justify-center gap-4 sm:gap-6 md:gap-10">
            <div className="flex flex-col items-center">
              <p
                className="font-semibold text-[#2F43F2] mb-1 sm:mb-2"
                style={{ fontSize: "18px" }}
              >
                <span className="sm:text-2xl md:text-[24px]">6-8</span>
              </p>
              <p
                className="font-normal text-[#6B7280] text-center"
                style={{ fontSize: "11px" }}
              >
                <span className="sm:text-base text-[11px] ">
                  Hours per week
                </span>
              </p>
            </div>
            <div className="w-[1px] h-auto bg-gray-200 self-stretch"></div>
            <div className="flex flex-col items-center">
              <p
                className="font-semibold text-[#2F43F2] mb-1 sm:mb-2"
                style={{ fontSize: "18px" }}
              >
                <span className="sm:text-2xl md:text-[24px]">16</span>
              </p>
              <p
                className="font-normal text-[#6B7280] text-center"
                style={{ fontSize: "11px" }}
              >
                <span className="sm:text-base text-[11px]">Weeks program</span>
              </p>
            </div>
            <div className="w-[1px] h-auto bg-gray-200 self-stretch"></div>
            <div className="flex flex-col items-center">
              <p
                className="font-semibold text-[#2F43F2] mb-1 sm:mb-2"
                style={{ fontSize: "18px" }}
              >
                <span className="sm:text-2xl md:text-[24px]">100%</span>
              </p>
              <p
                className="font-normal text-[#6B7280] text-center"
                style={{ fontSize: "11px" }}
              >
                <span className="sm:text-base text-[11px]">
                  Practical Focused{" "}
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section
        className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.5) -10.21%, #F5F6FF 53.33%)",
        }}
      >
        <div className="mx-auto w-full">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Why Choose Us
            </h2>
            <p
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Unique Strengths That Set Us Apart.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 lg:items-center">
            {/* Left Column - Benefits */}
            <div className="w-full lg:w-[40%] space-y-4 sm:space-y-5 rounded-lg p-4 sm:p-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className="flex-shrink-0 self-start rounded w-6 h-6 sm:w-8 sm:h-8 p-[3px] sm:p-1"
                    style={{
                      backgroundColor: "#E9FBF0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img loading="lazy" decoding="async"
                      src="/checkcheck.svg"
                      alt="check"
                      className="w-[18px] h-[18px] sm:w-6 sm:h-6"
                    />
                  </div>
                  <p
                    style={{
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#0E1629",
                    }}
                  >
                    <span className="sm:text-lg">{benefit}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Right Column - Colleges */}
            <div className="w-full lg:w-[60%]">
              <Card
                className="bg-white border border-gray-200 rounded-2xl py-0"
                style={{
                  boxShadow: "0px 0px 4px 0px #18003326",
                }}
              >
                <CardContent style={{ padding: "20px" }}>
                  <h3 className="text-sm sm:text-lg font-semibold text-[#232323] mb-3 sm:mb-4">
                    Dream Colleges Our Students Made It To
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3.5 mb-4 sm:mb-6">
                    {colleges.map((college, index) => (
                      <span
                        key={index}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#ECEEFE] text-[#2F43F2] rounded-full text-xs sm:text-sm md:text-[14px] font-medium border border-[#C0C4F1]"
                      >
                        {college}
                      </span>
                    ))}
                  </div>
                  <div
                    className="p-4 sm:p-6 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(90deg, #F0F1FE 5.27%, #FDF8F5 66.38%)",
                    }}
                  >
                    <p className="text-[#232323] font-medium mb-2 text-xs sm:text-lg md:text-[20px]">
                      "Our students made it to these colleges. You are next."
                    </p>
                    <p
                      className="text-xs sm:text-base md:text-[18px]"
                      style={{ color: "#6B7280" }}
                    >
                      Build aspiration and credibility simultaneously.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* You Will Be Guided By Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20">
        <div className="mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              You Will Be Guided By
            </h2>
            <p
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Learn from industry experts with proven track records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {instructors.map((instructor, index) => (
              <Card
                key={index}
                className="py-0"
                style={{
                  borderRadius: "24px",
                  background:
                    "linear-gradient(101.59deg, #F0F1FE 0.68%, #FDF8F5 67.02%)",
                  boxShadow: "none",
                  border: "none",
                }}
              >
                <CardContent style={{ padding: "20px" }}>
                  <div className="flex flex-col gap-3">
                    {/* Row 1: Image + Details */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="rounded-xl overflow-hidden w-20 h-20 sm:w-24 sm:h-24 md:w-[114px] md:h-[114px]">
                          <SmartImage
                            src={instructor.image}
                            alt={instructor.name}
                            className="rounded-xl w-full h-full"
                            style={{
                              objectFit: "cover",
                              display: "block",
                            }}
                            width={114}
                            height={114}
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3
                          className="mb-1"
                          style={{
                            fontWeight: 600,
                            fontSize: "16px",
                            color: "#232323",
                          }}
                        >
                          <span className="sm:text-lg md:text-[20px]">
                            {instructor.name}
                          </span>
                        </h3>
                        <p
                          className="mb-2"
                          style={{
                            fontWeight: 500,
                            fontSize: "12px",
                            color: "#2F43F2",
                          }}
                        >
                          <span className="sm:text-base md:text-[18px]">
                            {instructor.role}
                          </span>
                        </p>
                        <div className="flex items-center gap-2">
                          <img loading="lazy" decoding="async"
                            src="/checkcheck.svg"
                            alt="check"
                            className="w-5 h-5 sm:w-6 sm:h-6"
                          />
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: "12px",
                              color: "#6B7280",
                            }}
                          >
                            <span className="sm:text-sm md:text-[16px]">
                              {instructor.experience}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Row 2: Description */}
                    <div>
                      <p
                        className="font-normal"
                        style={{ fontSize: "14px", color: "#6B7280" }}
                      >
                        <span className="sm:text-base">
                          {instructor.description}
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20 bg-white">
        <div className="mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Success Stories
            </h2>
            <p
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Real Students. Real Transformation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="rounded-2xl relative py-0 lg:min-w-[400px] lg:flex-1"
                style={{
                  border: "1px solid #E8EAED",
                  boxShadow: "0px 0px 4px 0px #BDC2FD26",
                }}
              >
                <CardContent style={{ padding: "20px" }}>
                  <div className="flex items-center gap-4 mb-4">
                    <SmartImage
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-17 h-17 rounded-full object-cover"
                      width={48}
                      height={48}
                    />
                    <div>
                      <h4 className="font-semibold text-[#232323]">
                        <span className="sm:text-xl">{testimonial.name}</span>
                      </h4>
                      <p
                        className="font-medium text-[#2F43F2]"
                        style={{ fontSize: "14px" }}
                      >
                        <span className="sm:text-sm">{testimonial.role}</span>
                      </p>
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 text-yellow-400"
                            fill="#FCD34D"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-[#6B7280] text-sm sm:text-lg">
                    {testimonial.text}
                  </p>
                  <img loading="lazy" decoding="async"
                    src="/quotes.svg"
                    alt="quotes"
                    className="text-[#ECEEFE] absolute top-6 right-6 w-12 h-12 sm:w-[61px] sm:h-[61px]"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section
        className="py-12 sm:py-16 px-4 sm:px-5 lg:px-20"
        style={{
          background:
            "linear-gradient(0deg, rgba(255, 255, 255, 0.5) -10.21%, #F5F6FF 53.33%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2
              className="mb-3 sm:mb-4 text-[18px] sm:text-3xl md:text-[32px]"
              style={{ fontWeight: 600, color: "#0E1629" }}
            >
              Frequently Asked Questions
            </h2>
            <p
              className="text-[12px] sm:text-lg"
              style={{ fontWeight: 400, color: "#6B7280" }}
            >
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="w-full rounded-2xl p-2 transition-all duration-300"
                style={{ borderBottom: "1px solid #EFEFEF" }}
              >
                <button
                  onClick={() => handleFaqToggle(index)}
                  className="w-full flex justify-between items-center text-left cursor-pointer"
                >
                  <h3 className="font-medium text-sm sm:text-xl text-[#232323] pr-4">
                    {faq.question}
                  </h3>
                  {openFaqIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-black flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-black flex-shrink-0" />
                  )}
                </button>
                {openFaqIndex === index && (
                  <div className="mt-4 transition-transform">
                    <p
                      className="text-xs sm:text-base"
                      style={{ color: "#6C6969", fontWeight: 400 }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {showSuccessPopup && (
        <CourseEnrollmentPopup
          courseName={COURSE_NAME}
          onClose={() => {
            setShowSuccessPopup(false);
            window.location.reload();
          }}
        />
      )}
      
      {/* Coupon Modal */}
      {userId && (
        <CouponCodeModal
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          courseId={COURSE_ID}
          userId={userId}
          originalPrice={PROMO_COURSE_PRICE}
          onCouponApplied={handleCouponApplied}
          onCouponRemoved={handleCouponRemoved}
          appliedCoupon={appliedCoupon}
          applyCouponApi={applyCouponWrapper}
        />
      )}
    </div>
  );
}
