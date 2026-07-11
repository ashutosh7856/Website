import { useRef, useState } from 'react';
import {  useParams } from 'react-router-dom';
import {  MapPin, Users, Link2, Phone, AlertTriangle } from 'lucide-react';
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { FaInstagram, FaLinkedin, FaStar,} from 'react-icons/fa6';
import { FaCheckCircle } from 'react-icons/fa';
import ReviewSection from '@/components/Revamp/common/ReviewSection';
import RequestCallbackPopUp from '@/components/Revamp/probuddies/RequestCallbackPopup';
import AddFundsPanel from '@/components/student-dashboard/AddFundsPanel';
import { useMutation, useQuery } from '@tanstack/react-query';
import { probuddiesApi } from '@/api/pro-buddies';
import startRecharge from '@/api/wallet';
import { getLoggedInPhone, formatPhoneForRazorpay } from '@/lib/phone';
import ProBuddyProfileSkeleton from '@/components/skeletons/probuddies/ProBuddyProfileSkeleton';
import ProBuddyProfileError from '@/components/Revamp/error/ProBuddyErrorPage';
import { decodeCounselorId, formatAcademicYearLabel } from '@/lib/utils';
import { useAuthStore } from '@/store/AuthStore';
import toast from 'react-hot-toast';

declare global {
  interface Window { Razorpay: unknown; }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };
const OFFERING_FIELDS = ['Mess Food', 'Attendance', 'Campus Vibe', 'Faculty Quality', 'Exam Strategy'] as const;
const clampOfferingValue = (value: number) => Math.min(10, Math.max(0, Number.isFinite(value) ? value : 0));

const getSocialIconType = (rawUrl: string, type?: string) => {
    const normalizedType = String(type ?? '').toLowerCase();
    const normalizedUrl = rawUrl.toLowerCase();

    if (normalizedType.includes('instagram') || normalizedUrl.includes('instagram')) {
        return 'instagram';
    }

    if (normalizedType.includes('linkedin') || normalizedUrl.includes('linkedin')) {
        return 'linkedin';
    }

    return 'custom';
};

function BookingCard({price, onRequestCall, onInstantCallback}:{price:string; onRequestCall: () => void; onInstantCallback: () => void}) {
    return (
        <div className="bg-white rounded-[8px] md:rounded-[16px] p-[12px] w-[350px] mx-auto md:w-full xl:w-[580px] h-full md:h-auto font-['Poppins']">

            <div className="mt-[4px] md:mt-3 flex items-center gap-[8px] md:gap-3">
                <p className="font-semibold text-[#0e1629] text-[16px] md:text-lg">
                    ₹ {price}
                </p>
                <p className="font-normal text-[#6b7280] text-[12px] md:text-sm [text-decoration-skip-ink:none]">
                    /min
                </p>
            </div>

            <button
                onClick={onInstantCallback}
                className="mt-[12px] md:mt-3 w-full bg-[#2F43F2] h-[44px] md:h-auto rounded-[12px] px-4 py-2.5 font-medium text-[16px] text-white cursor-pointer flex items-center justify-center gap-2 hover:bg-[#253ce0] transition-colors"
            >
                <Phone className="w-[18px] h-[18px]" />
                Get Instant Callback
            </button>

            <button
                onClick={onRequestCall}
                className="mt-[8px] md:mt-2.5 w-full bg-white border border-[#0e1629] h-[44px] md:h-auto rounded-[12px] px-4 py-2.5 font-medium text-[16px] text-[#0e1629] cursor-pointer hover:bg-[#f5f5f5] transition-colors"
            >
                Request a Call
            </button>

            <p className="mt-[8px] md:mt-2.5 text-center font-normal md:font-medium text-[#6b7280] text-[12px] md:text-sm">
                100% satisfaction guarantee
            </p>
        </div>
    );
}

function InstantCallbackConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    ratePerMinute,
    proBuddyName,
    walletBalance,
    isConnecting,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    ratePerMinute: number;
    proBuddyName: string;
    walletBalance: number;
    isConnecting: boolean;
}) {
    if (!isOpen) return null;
    const minCost = ratePerMinute * 30;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] font-['Poppins'] px-4">
            <div className="bg-white rounded-[20px] p-6 max-w-[420px] w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-[#EEF1FE] flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5 text-[#2F43F2]" />
                    </div>
                    <div>
                        <h2 className="text-[18px] font-semibold text-[#0E1629] leading-tight">Get Instant Callback</h2>
                        <p className="text-[13px] text-[#6B7280] mt-0.5">with {proBuddyName}</p>
                    </div>
                </div>

                <div className="bg-[#FFF8ED] border border-[#FDE68A] rounded-[12px] p-4 mb-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[13px] font-semibold text-[#92400E]">First 5 minutes are on us</p>
                        <p className="text-[12px] text-[#B45309] mt-1 leading-relaxed">
                            Start risk-free and get clarity with a free first 5 minutes. To continue the call for up to 30 minutes, recharge your wallet and activate the 30-minute plan.
                        </p>
                    </div>
                </div>

                <div className="bg-[#F9FAFB] rounded-[12px] p-4 mb-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#6B7280]">Rate</span>
                        <span className="text-[14px] font-semibold text-[#0E1629]">₹{ratePerMinute}/min</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#6B7280]">Min. Charged Duration</span>
                        <span className="text-[14px] font-semibold text-[#0E1629]">30 minutes</span>
                    </div>
                    <div className="h-px bg-[#EFEFEF]" />
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-[#0E1629]">Amount Reserved</span>
                        <span className="text-[15px] font-bold text-[#2F43F2]">₹{minCost.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[13px] text-[#6B7280]">Your Balance</span>
                        <span className="text-[14px] font-semibold text-[#22C55E]">₹{walletBalance.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isConnecting}
                        className="flex-1 h-[44px] rounded-[12px] border border-[#E5E7EB] text-[#6B7280] font-medium text-[15px] cursor-pointer hover:bg-[#F9FAFB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isConnecting}
                        className="flex-1 h-[44px] rounded-[12px] bg-[#2F43F2] text-white font-medium text-[15px] cursor-pointer hover:bg-[#253ce0] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isConnecting ? (
                            <>
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Phone className="w-4 h-4" />
                                Confirm
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Divider() {
    return <div className="h-px w-full bg-[#efefef]" />;
}

export default function ProBuddyProfilePage() {
    const {id} = useParams();
    const { user, userId, isAuthenticated, toggleLogin, refreshUser } = useAuthStore();
    const [isReadMore, setIsReadMore] = useState(false);
    const [showCallbackPopup, setShowCallbackPopup] = useState(false);
    const [showPostReviewForm, setShowPostReviewForm] = useState(false);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [showInstantCallbackConfirm, setShowInstantCallbackConfirm] = useState(false);
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [isRecharging, setIsRecharging] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [displayBalance, setDisplayBalance] = useState(0);
    const reviewFormRef = useRef<HTMLDivElement | null>(null);

    const {data:probuddy ,isLoading, isError, refetch} = useQuery({
        queryKey:[`probuddy-profile`, id, userId ?? 'guest'],
        queryFn: () => probuddiesApi.profileUser(userId ?? null, decodeCounselorId(id as string)),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })
    const avatarName = `${probuddy?.firstName ?? ''} ${probuddy?.lastName ?? ''}`.trim() || 'ProBuddy';
    const displayImage =
    probuddy?.photoUrl||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=6B7280&color=ffffff&size=400`;

    const formatReviewDate = (timestamp: { seconds: number; nanos: number } | null | undefined) => {
        if (!timestamp?.seconds) {
            return 'Recently';
        }

        const date = new Date(timestamp.seconds * 1000 + Math.floor((timestamp.nanos ?? 0) / 1_000_000));
        if (Number.isNaN(date.getTime())) {
            return 'Recently';
        }

        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const buildAvatarUrl = (fullName: string | null | undefined) => {
        const fallbackName = fullName?.trim() || 'Student';
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackName)}&background=6B7280&color=ffffff&size=400`;
    };

    const callbackInfo = {
        name: `${probuddy?.firstName ?? ''} ${probuddy?.lastName ?? ''}`.trim() || 'ProBuddy',
        city: `${probuddy?.city ?? ''}${probuddy?.state ? `, ${probuddy.state}` : ''}`,
        imageUrl: displayImage,
        proBuddyId: probuddy?.proBuddyId || String(id ?? ''),
        rating: Number(probuddy?.rating ?? 0),
        reviewsCount: Number(probuddy?.noOfRatingsReceived ?? 0),
    };

    const displayRating = Number(probuddy?.rating ?? 0);
    const displayReviewsCount = Number(probuddy?.noOfRatingsReceived ?? 0);
    const ratingLabel = displayRating > 0 ? displayRating.toFixed(1) : 'NA';
    const reviewCountLabel = displayReviewsCount > 0 ? String(displayReviewsCount) : 'NA';
    const proBuddyDisplayName = `${probuddy?.firstName ?? ''} ${probuddy?.lastName ?? ''}`.trim() || 'this ProBuddy';
    const canWriteReview = ((probuddy as { canWriteReview?: boolean } | null)?.canWriteReview) === true;
    const aboutMeText = String(probuddy?.aboutMe?.aboutMe ?? '');
    const shouldShowReadMore = aboutMeText.length > 60;
    const radarData = OFFERING_FIELDS.map((field) => ({
        subject: field,
        score: clampOfferingValue(Number(probuddy?.offerings?.[field] ?? 0)),
        fullMark: 5,
    }));

    const mappedReviews = (probuddy?.reviewsReceivedForUser ?? []).map((review, index) => {
        const fullName = review.userFullName ?? `Student ${index + 1}`;
        const imageUrl = review.imageUrl ?? buildAvatarUrl(fullName);

        return {
            name: String(fullName),
            date: formatReviewDate(review.timestamp),
            rating: Math.min(5, Math.max(1, Number(review.rating ?? 1))),
            text: String(review.reviewText ?? 'No review text provided.'),
            image: imageUrl,
        };
    });

    const withLoginGuard = async (action: () => void | Promise<void>) => {
        if (!isAuthenticated || !userId) {
            toggleLogin(() => {
                void action();
            });
            return;
        }
        await action();
    };

    const openPostReviewForm = () => {
        setShowPostReviewForm(true);
        requestAnimationFrame(() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
    };

    const postReviewMutation = useMutation({
        mutationFn: async () => {
            if (!probuddy?.proBuddyId || !userId) {
                throw new Error('Missing ProBuddy or user details');
            }

            return probuddiesApi.postReview({
                proBuddyId: probuddy.proBuddyId,
                userId,
                rating: reviewRating,
                reviewText: reviewText.trim() ? reviewText.trim() : null,
            });
        },
        onSuccess: async () => {
            toast.success('Review posted successfully');
            setReviewText('');
            setReviewRating(5);
            setShowPostReviewForm(false);
            await refetch();
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to post review';
            toast.error(message);
        }
    });

    const handlePostReview = () => {
        if (!canWriteReview) {
            toast.error('You can write a review only after completing an eligible call.');
            return;
        }

        if (!showPostReviewForm) {
            openPostReviewForm();
            return;
        }

        postReviewMutation.mutate();
    };

    const handleOpenCallback = () => {
        void withLoginGuard(() => setShowCallbackPopup(true));
    };

    const handleInstantCallback = () => {
        void withLoginGuard(async () => {
        const ratePerMin = probuddy?.ratePerMinute ?? 0;
        const minRequired = 30 * ratePerMin;
        let walletBalance = user?.walletAmount ?? 0;

        // Always re-check wallet right before call flow so we don't open Add Money on stale state.
        try {
            const refreshedUser = await refreshUser(true);
            if (refreshedUser && typeof refreshedUser.walletAmount === 'number') {
                walletBalance = refreshedUser.walletAmount;
            }
        } catch {
            // Keep existing in-memory balance if refresh fails.
        }

        setDisplayBalance(walletBalance);
        if (walletBalance < minRequired) {
            setShowInstantCallbackConfirm(false);
            setShowAddFunds(true);
        } else {
            setShowAddFunds(false);
            setShowInstantCallbackConfirm(true);
        }
        });
    };

    const handleRecharge = async (amount: number) => {
        if (!user?.userName || amount <= 0 || isRecharging) return;
        setIsRecharging(true);
        try {
            const order = await startRecharge(user.userName, amount);
            const options = {
                key: order.keyId,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'ProCounsel Wallet',
                description: 'Add ProCoins',
                prefill: {
                  contact: formatPhoneForRazorpay(getLoggedInPhone()),
                  email: user?.email || '',
                  name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
                },
                notes: { userId: user.userName },
                handler: async () => {
                    toast.success('Payment successful! Balance updated shortly.');
                    try {
                        const updatedUser = await refreshUser(true);
                        if (updatedUser && typeof updatedUser.walletAmount === 'number') {
                            setDisplayBalance(updatedUser.walletAmount);
                        }
                    } finally {
                        setIsRecharging(false);
                        setShowAddFunds(false);
                    }
                },
                modal: { ondismiss: () => setIsRecharging(false) },
                theme: { color: '#2F43F2' },
            };
            const Rz = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
            new Rz(options).open();
        } catch {
            toast.error('Could not start payment. Please try again.');
            setIsRecharging(false);
        }
    };

    const handleConfirmInstantCallback = async () => {
        if (!probuddy || !userId) return;
        setIsConnecting(true);
        try {
            await probuddiesApi.connectInstantCall({
                from: userId,
                to: probuddy.phoneNumber,
                userId,
                proBuddyId: probuddy.proBuddyId,
            });
            setShowInstantCallbackConfirm(false);
            toast.success('Connecting you now — you\'ll receive a call shortly!');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to connect call';
            toast.error(msg);
        } finally {
            setIsConnecting(false);
        }
    };

    const requestCallbackMutation = useMutation({
        mutationFn: async ({ scheduledDate, scheduledTime }: { scheduledDate: string; scheduledTime: string }) => {
            if (!probuddy?.proBuddyId || !userId) {
                throw new Error('Missing ProBuddy or user details');
            }

            return probuddiesApi.createCallRequest({
                proBuddyId: probuddy.proBuddyId,
                userId,
                scheduledDate,
                scheduledTime,
            });
        },
        onSuccess: () => {
            toast.success('Callback request submitted successfully');
            setShowCallbackPopup(false);
        },
        onError: (error: unknown) => {
            const message = error instanceof Error ? error.message : 'Failed to request callback';
            toast.error(message);
        },
    });

    const handleRequestCallbackSubmit = async ({
        scheduledDate,
        scheduledTime,
    }: {
        scheduledDate: string;
        scheduledTime: string;
    }) => {
        await requestCallbackMutation.mutateAsync({ scheduledDate, scheduledTime });
    };


    if(isLoading){
        return <ProBuddyProfileSkeleton />
    }

    if(isError || !probuddy){
        return <ProBuddyProfileError onRetry={() => refetch()} />
    }



    return (
        <div
            className="w-full min-h-screen"
            style={{
                background:
                    'linear-gradient(0deg, rgba(198, 221, 240, 0.25), rgba(198, 221, 240, 0.25)), #FFFFFF',
            }}
        >
            <div className="max-w-[1440px] mx-auto">

                {/* Profile + Booking */}
                <div className="px-4 md:px-16 pt-6 md:pt-10 pb-6 md:pb-10">
                    <div className="flex flex-col xl:flex-row gap-6 items-start">
                        <div className="bg-white rounded-[8px] md:rounded-[16px] p-[12px] w-[350px] mx-auto md:w-full xl:max-w-[716px] h-auto relative font-['Poppins']">
                            {/* Mobile Header Layout (Absolute/Positioned style based on CSS) */}
                            <div className="relative md:h-auto md:overflow-visible">
                                {/* Profile Header Part */}
                                <div className="md:flex md:gap-[12px]">
                                    {/* Profile Image */}
                                    <div className="absolute left-0 top-0 md:relative shrink-0 w-[60px] h-[60px] md:w-[119px] md:h-[119px] rounded-[4.9px] md:rounded-[8px] border border-[#efefef] overflow-hidden bg-[#d9d9d9]">
                                        <img loading="lazy" decoding="async"
                                            src={displayImage}
                                            alt={probuddy.firstName}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    {/* Info Block */}
                                    <div className="absolute left-[64px] top-0 md:relative md:left-0 md:top-0 md:flex-1 min-w-0">
                                        <div className="flex justify-between items-start w-[250px] md:w-full">
                                            <p className="font-semibold text-[#0e1629] text-[14px] md:text-[24px] leading-[1.25]">
                                                {[probuddy.firstName, probuddy.lastName].filter(Boolean).join(' ')}
                                            </p>
                                            {/* Rating on Mobile (absolute top-right in CSS) */}
                                            <div className="flex items-center gap-[4px] md:hidden">
                                                <FaStar className="text-[#FACC14] text-[15px]" />
                                                <p className="text-[#6b7280] text-[12px] tracking-[0.02em]">
                                                    {ratingLabel} ({reviewCountLabel})
                                                </p>
                                            </div>
                                        </div>

                                        <p className="mt-[2px] md:mt-[8px] font-medium md:font-semibold text-[#2f43f2] text-[12px] md:text-[16px] leading-[18px] md:leading-[1.25] line-clamp-1">
                                            {`${formatAcademicYearLabel(probuddy.currentYear)} ${probuddy.course} student`.trim()}
                                        </p>
                                        <p className="mt-[2px] md:mt-[8px] font-normal md:font-medium text-[#6b7280] text-[12px] md:text-[14px] leading-[18px] tracking-[0.02em] md:tracking-[0.28px] line-clamp-1">
                                            {`${probuddy.collegeName} • ${probuddy.course}`}
                                        </p>

                                        {/* Desktop Stats (Hidden on mobile as they're moved below) */}
                                        <div className="hidden md:flex mt-[12px] flex-col gap-[8px]">
                                            <div className="flex flex-wrap items-center gap-[16px]">
                                                <div className="flex items-center gap-[8px]">
                                                    <FaStar className="text-[#FACC14] text-[20px]" />
                                                    <p className="text-[#6b7280] text-[14px] tracking-[0.32px]">
                                                        <span className="font-medium">{ratingLabel} </span>
                                                        <span className="font-normal">({reviewCountLabel} reviews)</span>
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-[4px]">
                                                    <Users className="w-[20px] h-[20px] text-[#6b7280]" />
                                                    <p className="font-medium text-[#6b7280] text-[14px] tracking-[0.28px]">
                                                        850+ students helped
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-[4px]">
                                                    <MapPin className="w-[20px] h-[20px] text-[#6b7280]" />
                                                    <p className="font-medium text-[#6b7280] text-[14px] tracking-[0.28px]">
                                                        {probuddy.city+", "+probuddy.state}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-[8px]">
                                                {probuddy.languagesKnow.map((lang)=>(
                                                    <div key={lang} className="min-w-[80px] flex items-center justify-center bg-[#e6efec] rounded-[16px] px-[12px] py-[4px]">
                                                    <p className="font-medium text-[#25a777] text-[12px] leading-[normal]">
                                                        {lang}
                                                    </p>
                                                </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Stats (Group 1410128149 style) */}
                                <div className="absolute left-0 top-[70px] flex flex-col gap-[4px] md:hidden">
                                    <div className="flex items-center gap-[4px]">
                                        <Users className="w-[15px] h-[15px] text-[#6b7280]" />
                                        <p className="text-[#6b7280] text-[12px] font-normal leading-[18px] tracking-[0.02em]">
                                            850+ students helped
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-[4px]">
                                        <MapPin className="w-[15px] h-[15px] text-[#6b7280]" />
                                        <p className="text-[#6b7280] text-[12px] font-normal leading-[18px] tracking-[0.02em]">
                                            {probuddy.city}, {probuddy.state}
                                        </p>
                                    </div>
                                </div>

                                {/* Dividers & Socials */}
                                <div className="hidden md:block mt-[12px]">
                                    <Divider />
                                    <div className="py-[8px] flex items-center gap-[12px]">
                                        {(() => {
                                            const links = probuddy.links ?? [];
                                            if (links.length === 0) {
                                                return (
                                                    <p className="font-normal text-[#9ca3af] text-[13px] italic">
                                                        No social links added
                                                    </p>
                                                );
                                            }
                                            return links.map((linkItem, i) => {
                                                const rawUrl = typeof linkItem === 'string' ? linkItem : String(linkItem.url ?? '');
                                                const normalized = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
                                                const iconType = getSocialIconType(rawUrl, typeof linkItem === 'string' ? '' : linkItem.type);
                                                return (
                                                    <a
                                                        key={i}
                                                        href={normalized}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={normalized}
                                                        title={normalized}
                                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6b7280] hover:bg-[#E8EDF3] hover:text-[#0e1629] transition-colors"
                                                    >
                                                        {iconType === 'instagram' ? (
                                                            <FaInstagram className="text-[20px] text-[#E4405F] shrink-0" />
                                                        ) : iconType === 'linkedin' ? (
                                                            <FaLinkedin className="text-[20px] text-[#0A66C2] shrink-0" />
                                                        ) : (
                                                            <Link2 className="w-5 h-5 text-[#6b7280] shrink-0" strokeWidth={1.5} />
                                                        )}
                                                    </a>
                                                );
                                            });
                                        })()}
                                    </div>
                                    <Divider />
                                </div>

                                {/* Mobile spacer: reserves space for the absolutely-positioned
                                    header (image/name/stats) above so the sections below flow normally. */}
                                <div className="h-[122px] md:hidden" aria-hidden="true" />

                                {/* About Me Section */}
                                <p className="md:mt-[16px] font-semibold text-[#0e1629] text-[16px] md:text-[20px] leading-normal">
                                    About me
                                </p>

                                <div className="w-full mt-[12px] bg-[#f3f7f6] rounded-[4px] md:rounded-[12px] p-[12px]">
                                    <div className="flex gap-[12px] items-start">
                                        <img loading="lazy" decoding="async"
                                            src="/probuddies_career_icon.png"
                                            alt="Career Transition"
                                            className="w-[30px] h-[30px] md:w-[48px] md:h-[48px] shrink-0 rounded-[6.67px] md:rounded-[10.67px] object-cover"
                                        />
                                        <div className="flex-1">
                                            <p className="font-semibold text-[#0e1629] text-[14px] md:text-[16px] leading-[21px] md:leading-normal">
                                                {probuddy.aboutMe.heading}
                                            </p>
                                            <p className="font-normal text-[#6b7280] text-[12px] leading-[18px] md:leading-normal">
                                                Specialised in {probuddy.aboutMe.subHeading}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="mt-[12px] font-normal text-[#6b7280] text-[12px] md:text-[14px] leading-[18px] md:leading-normal">
                                        {shouldShowReadMore ? (isReadMore ? aboutMeText : `${aboutMeText.slice(0, 60)}...`) : aboutMeText}
                                        {shouldShowReadMore && (
                                            <span
                                                onClick={() => setIsReadMore(!isReadMore)}
                                                className="text-[#2F43F2] cursor-pointer ml-1"
                                            >
                                                {isReadMore ? "Read Less" : "Read More"}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                {/* Who Should Connect Section */}
                                <p className="mt-[16px] md:mt-[20px] font-semibold text-[#0e1629] text-[16px] md:text-[20px] leading-normal">
                                    Who Should Connect With Me?
                                </p>
                                <p className="mt-[12px] font-medium text-[#6b7280] text-[12px] md:text-[16px] leading-[18px] md:leading-normal w-full overflow-hidden text-ellipsis line-clamp-3 break-words">
                                    {probuddy.whoShouldConnect}
                                </p>
                            </div>
                        </div>

                        {/* Right Card - Booking */}
                        <div className="w-full xl:w-auto xl:sticky xl:top-4">
                            <BookingCard
                                price={probuddy.ratePerMinute?.toFixed(2).toString() || 'NA'}
                                onRequestCall={handleOpenCallback}
                                onInstantCallback={handleInstantCallback}
                            />
                        </div>
                    </div>
                </div>

                {/* How I Can Help You */}
                <div className="mt-6 md:mt-10 md:px-16 pb-6 md:pb-10 bg-[#F0F6FB] md:bg-transparent">
                    <div className="px-5 md:px-0 py-6 md:py-0">
                        <p className="font-semibold text-[#0e1629] text-[16px] md:text-xl sm:text-2xl leading-normal mb-5">
                            How I Can Help You
                        </p>

                        <div className="flex flex-col xl:flex-row gap-6 items-start">
                            {/* Radar Chart */}
                            <div className="w-full xl:w-[656px] h-[220px] sm:h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius={window.innerWidth < 768 ? "60%" : "70%"} data={radarData}>
                                        <PolarGrid stroke="#B7BEFA95" strokeWidth={2}/>
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{
                                                fill: '#2f43f2',
                                                fontSize: window.innerWidth < 768 ? 10 : 12,
                                                fontFamily: 'Poppins',
                                            }}
                                        />
                                        <Radar
                                            name="Score"
                                            dataKey="score"
                                            stroke="#2f43f2"
                                            strokeWidth={2}
                                            fill="#2f43f2"
                                            fillOpacity={0.12}
                                        />
                                        <Tooltip cursor={false} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Rating + Key Insights */}
                            <div className="w-full xl:flex-1">
                                <p className="font-medium text-[#0e1629] text-sm sm:text-base leading-normal">
                                    Overall Rating
                                </p>

                                <div className="mt-3 flex justify-between font-medium text-[#0e1629] text-sm leading-normal">
                                    <span>1</span>
                                    <span>3</span>
                                    <span>5</span>
                                </div>
                                <div
                                    className="mt-2.5 h-6 sm:h-7 rounded-3xl"
                                    style={{
                                        background:
                                            'linear-gradient(90deg, rgb(250, 102, 15) 0%, rgb(255, 214, 66) 36.01%, rgb(129, 192, 65) 64.368%, rgb(34, 197, 93) 100%)',
                                    }}
                                />
                                <p className="mt-2.5 font-normal text-[#6b7280] text-xs sm:text-sm leading-normal">
                                    Hover over the chart to see detailed scores
                                </p>

                                <div className="mt-4 sm:mt-5 bg-white rounded-[16px] border border-[#efefef] p-4">
                                    <p className="font-semibold text-[#0e1629] text-base sm:text-lg leading-normal">
                                        Key Insights
                                    </p>

                                    <div className="mt-4 space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <FaCheckCircle className="text-[#2f43f2] text-lg mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-[#0e1629] text-sm sm:text-base leading-normal">
                                                    Interview Prep
                                                </p>
                                                <p className="mt-1.5 font-normal text-[#6b7280] text-xs sm:text-sm leading-normal">
                                                    Real prep strategies for internships and placements based on actual
                                                    experiences
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-start">
                                            <FaCheckCircle className="text-[#2f43f2] text-lg mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-[#0e1629] text-sm sm:text-base leading-normal">
                                                    Exam Strategy
                                                </p>
                                                <p className="mt-1.5 font-normal text-[#6b7280] text-xs sm:text-sm leading-normal">
                                                    Effective study techniques that work - not just theoretical advice.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-start">
                                            <FaCheckCircle className="text-[#2f43f2] text-lg mt-0.5 shrink-0" />
                                            <div>
                                                <p className="font-medium text-[#0e1629] text-sm sm:text-base leading-normal">
                                                    Placement Tips
                                                </p>
                                                <p className="mt-1.5 font-normal text-[#6b7280] text-xs sm:text-sm leading-normal">
                                                    Insights on 98.6% percentile preparation strategies.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Success Stories Section */}
           <ReviewSection
                reviews={mappedReviews}
                onWriteReview={canWriteReview ? handlePostReview : undefined}
                writeReviewLabel={showPostReviewForm ? (postReviewMutation.isPending ? 'Posting...' : 'Post Review') : 'Write Review'}
                writeReviewDisabled={postReviewMutation.isPending}
                composer={
                    canWriteReview && showPostReviewForm ? (
                        <div ref={reviewFormRef} className="max-w-[520px] space-y-3 font-['Poppins']">
                            <div>
                                <label className="block text-xs text-[#6b7280] mb-1">Rating</label>
                                <select
                                    value={reviewRating}
                                    onChange={(e) => setReviewRating(Number(e.target.value))}
                                    className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2 text-sm bg-white"
                                >
                                    <option value={5}>5</option>
                                    <option value={4}>4</option>
                                    <option value={3}>3</option>
                                    <option value={2}>2</option>
                                    <option value={1}>1</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-[#6b7280] mb-1">Review (optional)</label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    rows={3}
                                    placeholder="Share your experience"
                                    className="w-full border border-[#E5E7EB] rounded-[10px] px-3 py-2 text-sm resize-none bg-white"
                                />
                            </div>
                        </div>
                    ) : null
                }
            />

            {/* Spacer */}
            <div className="h-8 md:h-10" />

            {/* Footer CTA */}
            <div className="bg-white">
                <div className="max-w-[1440px] mx-auto md:border-t md:border-[#E5E7EB]">
                    <div className="py-0 md:py-16 text-center">
                        {/* Mobile View */}
                        <div className="md:hidden bg-gradient-to-t from-[#2F43F2] to-[#1B278C] rounded-none h-[310px] relative overflow-hidden">
                            <p className="absolute left-1/2 -translate-x-1/2 top-[40px] w-[309px] font-['Poppins'] font-semibold text-white text-[16px] leading-[1.25]">
                                Ready to Make Your College Decision?
                            </p>
                            <p className="absolute left-1/2 -translate-x-1/2 top-[80px] w-[316px] font-['Poppins'] font-normal text-[#F5F5F5] text-[14px] leading-[21px] text-center">
                                Book a session with {proBuddyDisplayName} and get personalized guidance for your unique situation
                            </p>
                            <button onClick={handleInstantCallback} className="absolute left-1/2 -translate-x-1/2 top-[163px] w-[246px] h-[48px] bg-white rounded-[12px] font-['Poppins'] font-medium text-[16px] text-[#2F43F2] cursor-pointer flex items-center justify-center gap-2">
                                <Phone className="w-4 h-4" />
                                Get Instant Callback
                            </button>
                            <button onClick={handleOpenCallback} className="absolute left-1/2 -translate-x-1/2 top-[223px] w-[246px] h-[48px] border border-white/60 rounded-[12px] font-['Poppins'] font-medium text-[16px] text-white/90 cursor-pointer">
                                Request a Callback
                            </button>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block px-4">
                            <p className="font-['Poppins'] font-semibold text-[#0e1629] text-2xl leading-snug">
                                Ready to Make Your College Decision?
                            </p>
                            <p className="mt-3 font-['Poppins'] font-normal text-[#6b7280] text-base leading-normal">
                                Book a session with {proBuddyDisplayName} and get personalized guidance for your unique situation
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-[500px] mx-auto">
                                <button onClick={handleInstantCallback} className="bg-[#2f43f2] rounded-[12px] px-4 py-2.5 w-full max-w-[240px] font-['Poppins'] font-medium text-base text-white cursor-pointer flex items-center justify-center gap-2 hover:bg-[#253ce0] transition-colors">
                                    <Phone className="w-[18px] h-[18px]" />
                                    Get Instant Callback
                                </button>
                                <button onClick={handleOpenCallback} className="border border-[#0e1629] rounded-[12px] px-4 py-2.5 w-full max-w-[240px] font-['Poppins'] font-medium text-base text-[#0e1629] cursor-pointer hover:bg-[#f5f5f5] transition-colors">
                                    Request a Callback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showCallbackPopup && (
                <RequestCallbackPopUp
                    isOpen={showCallbackPopup}
                    onClose={() => setShowCallbackPopup(false)}
                    info={callbackInfo}
                    onSubmit={handleRequestCallbackSubmit}
                    isSubmitting={requestCallbackMutation.isPending}
                />
            )}

            <InstantCallbackConfirmModal
                isOpen={showInstantCallbackConfirm}
                onClose={() => setShowInstantCallbackConfirm(false)}
                onConfirm={handleConfirmInstantCallback}
                ratePerMinute={probuddy.ratePerMinute ?? 0}
                proBuddyName={`${probuddy.firstName} ${probuddy.lastName}`.trim()}
                walletBalance={displayBalance}
                isConnecting={isConnecting}
            />

            <AddFundsPanel
                isOpen={showAddFunds}
                onClose={() => setShowAddFunds(false)}
                balance={displayBalance}
                onAddMoney={handleRecharge}
                isProcessing={isRecharging}
            />
        </div>
    );
}
