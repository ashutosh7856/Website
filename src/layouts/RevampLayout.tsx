import { useEffect, useRef, useState, lazy, Suspense } from "react";
import Footer from "@/components/layout/Footer";
import RevampHeader from "@/components/Revamp/RevampHeader";
import RevampBreadcrumbs from "@/components/Revamp/RevampBreadcrumbs";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/AuthStore";
import { useChatStore } from "@/store/ChatStore";
import EnquiryPopup from "@/components/Revamp/shared/EnquiryPopup";
import LoginPromptPopup from "@/components/Revamp/shared/LoginPromptPopup";
import InfoModal from "@/components/counselor-signup/InfoModal";
import CounselorSignupModal from "@/components/counselor-signup/CounselorSignupModal.tsx";
import AppInstallBanner from "@/components/shared/AppInstallBanner";

// Interaction-gated / conditional heavy components — lazy so they stay out of
// the main bundle that hydrates on every page load (Chatbot pulls in
// react-markdown; Lottie is a large animation lib; etc.).
const Lottie = lazy(() => import("lottie-react"));
const Chatbot = lazy(() => import("@/components/chatbot/Chatbot"));
const VoiceChat = lazy(() => import("@/components/chatbot/VoiceChat"));
const LiveStreamView = lazy(() => import("@/components/live/userView"));
const LoginCard = lazy(() => import("@/components/cards/LoginCard").then((m) => ({ default: m.LoginCard })));
const OnboardingCard = lazy(() => import("@/components/cards/OnboardingCard"));
const EditProfileModal = lazy(() => import("@/components/student-dashboard/EditProfileModal"));
import { useVoiceChatStore } from "@/store/VoiceChatStore";
import { useLiveStreamStore } from "@/store/LiveStreamStore";
import { updateUserProfile } from "@/api/user";
import { captureLeadFromUser } from "@/api/leads";

export default function RevampLayout() {
    const {
        isLoginToggle, role, isAuthenticated,
        needsOnboarding, needsProfileCompletion,
        isProfileCompletionOpen, toggleProfileCompletion,
        setIsProfileCompletionOpen, user, setNeedsOnboarding,
        setNeedsProfileCompletion, returnToPath, setReturnToPath,
        clearOnLoginSuccess, refreshUser,
    } = useAuthStore();
    const { isChatbotOpen, toggleChatbot } = useChatStore();
    const { isVoiceChatOpen } = useVoiceChatStore();
    const { isStreamActive } = useLiveStreamStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [chatbotAnimation, setChatbotAnimation] = useState<object | null>(null);
    const prevAuthenticatedRef = useRef(false);

    const shouldHideBanner =
        location.pathname.includes('/test-info') ||
        location.pathname.includes('/test-result') ||
        location.pathname.includes('/t/');

    const isPromoPage = ['/promo', '/testSeries/pcsat', '/testSeries/kurukshetra', '/testSeries/grand-mock-test'].includes(location.pathname);

    const shouldShowOnboarding =
        isAuthenticated && (role === "student" || role === "user") && needsOnboarding;
    const isRestrictedDashboardRoute =
        location.pathname.startsWith('/pro-buddies/dashboard') ||
        location.pathname.startsWith('/counsellor-dashboard') ||
        location.pathname === '/about' ||
        location.pathname === '/contact' ||
        location.pathname === '/privacy-policy' ||
        location.pathname === '/terms' ||
        location.pathname === '/cancellation-refund' ||
        location.pathname === '/shipping-exchange';

    useEffect(() => {
        let isMounted = true;

        fetch("/chatbot.json")
            .then((response) => response.json())
            .then((data) => {
                if (isMounted) {
                    setChatbotAnimation(data);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setChatbotAnimation(null);
                }
            });

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated && needsProfileCompletion && !needsOnboarding) {
            toggleProfileCompletion();
        }
    }, [isAuthenticated, needsProfileCompletion, needsOnboarding, toggleProfileCompletion]);

    const handleOnboardingComplete = () => {
        setNeedsOnboarding(false);
        if (user && !user.firstName) {
            setNeedsProfileCompletion(true);
            return;
        }
        const store = useAuthStore.getState();
        if (store.onLoginSuccess) {
            store.onLoginSuccess();
            clearOnLoginSuccess();
        } else if (returnToPath) {
            navigate(returnToPath);
            setReturnToPath(null);
        }
    };

    const handleProfileUpdate = async (updatedData: { firstName: string; lastName: string; email: string }) => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
            const uid = typeof window !== "undefined" ? localStorage.getItem("phone") : null;
            if (!uid || !token) return;
            await updateUserProfile(uid, updatedData, token);
            if (refreshUser) await refreshUser(true);

            // Enrich the captured lead with the completed profile (backend upserts by phone)
            captureLeadFromUser(useAuthStore.getState().user, uid, {
                update: true,
                extra: updatedData,
            });
            setNeedsProfileCompletion(false);
            setIsProfileCompletionOpen(false);
            const store = useAuthStore.getState();
            if (store.pendingAction) {
                try { store.pendingAction(); } catch (error) {
                    console.error("Pending action failed", error);
                }
                store.setPendingAction(null);
                return;
            }
            if (store.onLoginSuccess) {
                store.onLoginSuccess();
                clearOnLoginSuccess();
            } else if (returnToPath) {
                navigate(returnToPath);
                setReturnToPath(null);
            }
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            prevAuthenticatedRef.current = false;
            return;
        }

        const justLoggedIn = !prevAuthenticatedRef.current;
        prevAuthenticatedRef.current = true;

        if (role === 'proBuddy') {
            if (justLoggedIn) {
                navigate('/pro-buddies/dashboard', { replace: true });
                return;
            }
            const isAllowedPath =
                location.pathname === '/pro-buddies/dashboard' ||
                location.pathname.startsWith('/community') ||
                location.pathname === '/about' ||
                location.pathname === '/contact' ||
                location.pathname === '/privacy-policy' ||
                location.pathname === '/terms' ||
                location.pathname === '/cancellation-refund' ||
                location.pathname === '/shipping-exchange';
            if (!isAllowedPath) {
                navigate('/pro-buddies/dashboard', { replace: true });
            }
            return;
        }

        if (role === 'counselor') {
            if (justLoggedIn) {
                navigate('/counsellor-dashboard', { replace: true });
                return;
            }
            const isAllowedPath =
                location.pathname === '/counsellor-dashboard' ||
                location.pathname.startsWith('/counsellor-dashboard/') ||
                location.pathname.startsWith('/counselor-dashboard/') ||
                location.pathname.startsWith('/community') ||
                location.pathname.startsWith('/courses/detail/') ||
                location.pathname.startsWith('/detail/') ||
                location.pathname.startsWith('/counselor/test-groups') ||
                location.pathname.startsWith('/create-test') ||
                location.pathname.startsWith('/add-question/') ||
                location.pathname === '/about' ||
                location.pathname === '/contact' ||
                location.pathname === '/privacy-policy' ||
                location.pathname === '/terms' ||
                location.pathname === '/cancellation-refund' ||
                location.pathname === '/shipping-exchange';
            if (!isAllowedPath) {
                navigate('/counsellor-dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, role, location.pathname, navigate]);

    const isRestrictedRole =
        isAuthenticated && (role === 'proBuddy' || role === 'counselor');

    const shouldShowFooter = !isPromoPage && (!isRestrictedRole || isRestrictedDashboardRoute);

    return <div className="flex flex-col min-h-screen relative">
        {!shouldHideBanner && <AppInstallBanner />}
        <RevampHeader />
        <RevampBreadcrumbs />
        <div className="flex-1">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
                <Outlet />
            </motion.div>
        </div>
        {shouldShowFooter && <Footer />}
        {!isRestrictedRole && <EnquiryPopup />}
        {!isAuthenticated && <LoginPromptPopup />}

        <Suspense fallback={null}>
        {isLoginToggle && <LoginCard />}
        <InfoModal />
        <CounselorSignupModal />

        {shouldShowOnboarding && (
            <OnboardingCard onComplete={handleOnboardingComplete} />
        )}

        {isProfileCompletionOpen && user && (
            <EditProfileModal
                isOpen={isProfileCompletionOpen}
                onClose={() => {
                    setIsProfileCompletionOpen(false);
                    setNeedsProfileCompletion(false);
                }}
                user={user}
                onUpdate={handleProfileUpdate}
                onUploadComplete={() => {}}
            />
        )}

        {!isRestrictedRole && !isPromoPage && (
            <button
                onClick={toggleChatbot}
                className="fixed right-0 md:right-6 bottom-1 md:bottom-6 z-50 flex h-32 w-32 cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-110"
                aria-label="Toggle Chatbot"
            >
                {chatbotAnimation ? (
                    <Suspense fallback={<div className="h-16 w-16 rounded-full bg-[#0E1629]" />}>
                        <Lottie animationData={chatbotAnimation} loop autoplay className="h-full w-full" />
                    </Suspense>
                ) : (
                    <div className="h-16 w-16 rounded-full bg-[#0E1629]" />
                )}
            </button>
        )}

        {!isRestrictedRole && !isPromoPage && isChatbotOpen && <Chatbot />}
        {isVoiceChatOpen && <VoiceChat />}
        {isStreamActive && <LiveStreamView />}
        </Suspense>
    </div>
}
