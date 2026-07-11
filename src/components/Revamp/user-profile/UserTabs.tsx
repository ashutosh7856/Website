import { useState, useLayoutEffect, useRef, type ReactNode } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/AuthStore";
import { getUserAppointments, cancelAppointment } from "@/api/appointment";
import { getUserReviews, updateUserReview } from "@/api/review";
import type { Appointment } from "@/types/appointment";
import type { Review } from "@/types/review";
import AppointmentDetailsModal from "@/components/student-dashboard/AppointmentDetailsModal";
import CancelAppointmentModal from "@/components/student-dashboard/CancelAppointmentModal";
import RescheduleModalWrapper from "@/components/student-dashboard/RescheduleModalWrapper";
import EditReviewModal from "@/components/student-dashboard/EditReviewModal";
import { encodeCounselorId } from "@/lib/utils";
import { getBoughtCourses, getBookmarkedCourses } from "@/api/course";
import { getSubscribedCounsellors, getFavouriteCounsellors, addFav } from "@/api/counsellor";
import { getUserBoughtTestGroups, getUserBookmarkedTestGroups } from "@/api/testGroup";
import { probuddiesApi } from "@/api/pro-buddies";
import FancyCard from "@/components/Revamp/admissions/counsellor/counsellorCard";
import ProfileCourseCard from "@/components/Revamp/user-profile/ProfileCourseCard";
import ProfileTestCard from "@/components/Revamp/user-profile/ProfileTestCard";
import ReviewCard from "@/components/Revamp/user-profile/ReviewCard";
import OldTransactionsTab from "@/components/student-dashboard/TransactionsTab";
import AddFundsPanel from "@/components/student-dashboard/AddFundsPanel";
import EditPreferencesModal from "@/components/student-dashboard/EditPreferencesModal";
import startRecharge from "@/api/wallet";
import { getLoggedInPhone, formatPhoneForRazorpay } from "@/lib/phone";
import toast from "react-hot-toast";
import type { Transaction } from "@/types/user";
import { Loader2, Plus, Pencil, CalendarClock, XCircle } from "lucide-react";

type RazorpayConstructor = new (opts: unknown) => { open: () => void };

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const tabs = [
  { title: "My Info", id: 1 },
  { title: "Appointments", id: 2 },
  { title: "Call History", id: 8 },
  { title: "Counsellors", id: 3 },
  { title: "My Courses", id: 5 },
  { title: "My Tests", id: 6 },
  { title: "Transactions", id: 4 },
  { title: "My Reviews", id: 7 },
];

export default function UserTabs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('activeTab');
  const initialTabId = urlTab ? (tabs.find(t => t.title === urlTab)?.id ?? 1) : 1;
  const [active, setActive] = useState(initialTabId);
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync active tab with URL params
  useLayoutEffect(() => {
    const newTabId = urlTab ? (tabs.find(t => t.title === urlTab)?.id ?? 1) : 1;
    setActive(newTabId);
  }, [urlTab]);

  const handleTabChange = (tabId: number) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActive(tabId);
      setSearchParams({ activeTab: tab.title });
    }
  };

  return (
    <div
      className="relative bg-white rounded-2xl w-232 h-153.75 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 6)}
    >
      <div
        className={`sticky top-0 z-10 px-6 w-full flex h-14.75 border-b border-[#E3E8F4] backdrop-blur-md transition-colors ${
          isScrolled ? "bg-[#C6DDF0]/75" : "bg-[#C6DDF0]/40"
        }`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className="relative flex hover:cursor-pointer pt-[1.38rem] justify-center pr-5 pl-2.5 items-center text-[0.9rem] leading-none"
          >
            <div
              className={`absolute bottom-0 left-0 right-0 h-0.75 ${active === tab.id ? "bg-(--text-main) rounded-t-[0.125rem]" : "bg-none"}`}
            />
            {tab.title}
          </button>
        ))}
      </div>
      <div className="pt-6 px-6 pb-6">{renderTabContent(active)}</div>
    </div>
  );
}

// ─── StatesChips ──────────────────────────────────────────────────────────────
// Only shows "See More" when chips genuinely overflow 2 rows (measured via ref).

const TWO_ROW_MAX_H = 72;

function StatesChips({ states }: { states: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const saved = el.style.maxHeight;
    el.style.maxHeight = 'none';
    const h = el.scrollHeight;
    el.style.maxHeight = saved;
    setOverflows(h > TWO_ROW_MAX_H + 2);
  }, [states]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={ref}
        className="flex flex-wrap gap-2 overflow-hidden"
        style={{ maxHeight: !showAll && overflows ? TWO_ROW_MAX_H : undefined }}
      >
        {states.map((s) => (
          <span key={s} className="px-3 py-1 rounded-full bg-[#F0F3FF] text-(--text-muted) font-medium text-[0.875rem] whitespace-nowrap">
            {s}
          </span>
        ))}
      </div>
      {overflows && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="self-start text-[0.875rem] font-semibold text-[#2f43f2] hover:underline cursor-pointer"
        >
          {showAll ? 'See Less' : 'See More'}
        </button>
      )}
    </div>
  );
}

// ─── EditIconBtn ──────────────────────────────────────────────────────────────

function EditIconBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F0F3FF] hover:bg-[#e0e7ff] transition-colors cursor-pointer"
      aria-label={label}
    >
      <Pencil className="w-3.5 h-3.5 text-[#2f43f2]" />
    </button>
  );
}

// ─── MyInfoTab ────────────────────────────────────────────────────────────────

function MyInfoTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const walletAmount = user?.walletAmount || 0;
  const totalCredit = (user?.transactions || [])
    .filter((t: Transaction) => t.type === 'credit')
    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);
  const totalDebit = (user?.transactions || [])
    .filter((t: Transaction) => t.type === 'debit')
    .reduce((sum: number, t: Transaction) => sum + (t.amount || 0), 0);

  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [prefsMode, setPrefsMode] = useState<'course' | 'states' | null>(null);

  const { mutate: handleAddFunds, isPending: isStartingPayment } = useMutation({
    mutationFn: async (amount: number) => {
      if (!amount || amount <= 0) throw new Error('A valid amount is required.');
      if (!user?.userName) throw new Error('User data not found.');
      setIsAddFundsOpen(false);
      return await startRecharge(user.userName, amount);
    },
    onSuccess: (order) => {
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'ProCounsel Wallet',
        description: 'Wallet Recharge',
        prefill: {
          contact: formatPhoneForRazorpay(getLoggedInPhone()),
          email: user?.email || '',
          name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        },
        notes: { userId: user?.userName },
        handler: () => {
          toast.success('Payment successful. Your balance will be updated shortly.');
          queryClient.invalidateQueries({ queryKey: ['user'] });
        },
        theme: { color: '#3399cc' },
      };
      const Rz = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
      const rzp = new Rz(options);
      rzp.open();
    },
    onError: () => {
      toast.error('Could not start the payment process. Please try again later.');
    },
  });

  const states: string[] = user?.userInterestedStateOfCounsellors || [];

  const handlePrefsClose = () => {
    setPrefsMode(null);
    queryClient.invalidateQueries({ queryKey: ['user'] });
  };

  return (
    <>
      <div className="flex flex-col items-start justify-center gap-6">

        <InfoCard
          gap={3}
          action={<EditIconBtn onClick={() => setPrefsMode('course')} label="Edit preferred course" />}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="27" height="18" viewBox="0 0 27 18" fill="none">
              <path d="M26.6 5.37142C26.6 5.72532 26.3813 6.04241 26.0505 6.16804L24.6361 6.70906V13.0565C25.3973 13.3923 25.8885 14.1458 25.8886 14.9777V17.0438C25.8886 17.5144 25.5071 17.8958 25.0366 17.8958H22.536C22.0654 17.8958 21.684 17.5144 21.684 17.0438V14.9777C21.6828 14.1477 22.1726 13.3955 22.9321 13.0607V7.36084L21.1216 8.05096L19.4176 8.70275L14.8211 10.4621C13.8417 10.8364 12.7588 10.8364 11.7794 10.4621L7.1829 8.70274L5.4789 8.05096L0.550071 6.16804C0.110109 6.00116 -0.111268 5.50922 0.0556105 5.06926C0.142084 4.84128 0.322091 4.66127 0.550071 4.5748L11.7794 0.280715C12.7588 -0.0935718 13.8417 -0.0935718 14.8211 0.280715L26.0505 4.5748C26.3813 4.70044 26.6 5.01752 26.6 5.37142ZM14.8211 12.1661C13.8417 12.5404 12.7588 12.5404 11.7794 12.1661L7.1829 10.4067L5.4789 9.75497V13.3163C5.47768 13.6219 5.64024 13.9048 5.9049 14.0576C8.19061 15.243 10.7255 15.868 13.3003 15.8809C15.8747 15.8693 18.4095 15.2458 20.6956 14.0618C20.9603 13.909 21.1228 13.6262 21.1216 13.3206V9.75497L19.4176 10.4067L14.8211 12.1661Z" fill="#0E1629" />
            </svg>
          }
          title="Preferred Course"
        >
          <div className="flex flex-wrap gap-2">
            {user?.interestedCourse
              ? <span className="px-3 py-1 rounded-full bg-[#F0F3FF] text-(--text-muted) font-medium text-[0.875rem]">{user.interestedCourse}</span>
              : <span className="text-(--text-muted) font-medium text-[1rem]">Not specified</span>
            }
          </div>
        </InfoCard>

        <InfoCard
          gap={3}
          action={<EditIconBtn onClick={() => setPrefsMode('states')} label="Edit preferred states" />}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <g clipPath="url(#clip0_230_915)">
                <path d="M21.4247 5.40889C23.3524 7.33638 24.455 9.93803 24.4992 12.6637C24.5434 15.3894 23.5258 18.0254 21.6616 20.0144L21.4247 20.2594L16.4746 25.2084C15.8465 25.8361 15.0032 26.2016 14.1157 26.2308C13.2282 26.2601 12.3628 25.9509 11.6947 25.3659L11.5267 25.2084L6.5754 20.2582C4.60625 18.2891 3.5 15.6184 3.5 12.8336C3.5 10.0488 4.60625 7.37804 6.5754 5.40889C8.54454 3.43975 11.2153 2.3335 14.0001 2.3335C16.7849 2.3335 19.4556 3.43975 21.4247 5.40889ZM14.0001 9.33356C13.5404 9.33356 13.0853 9.42409 12.6607 9.59998C12.236 9.77587 11.8502 10.0337 11.5252 10.3587C11.2002 10.6837 10.9424 11.0695 10.7665 11.4942C10.5906 11.9188 10.5001 12.3739 10.5001 12.8336C10.5001 13.2932 10.5906 13.7483 10.7665 14.173C10.9424 14.5976 11.2002 14.9834 11.5252 15.3084C11.8502 15.6334 12.236 15.8912 12.6607 16.0671C13.0853 16.243 13.5404 16.3336 14.0001 16.3336C14.9283 16.3336 15.8186 15.9648 16.4749 15.3084C17.1313 14.6521 17.5001 13.7618 17.5001 12.8336C17.5001 11.9053 17.1313 11.0151 16.4749 10.3587C15.8186 9.70231 14.9283 9.33356 14.0001 9.33356Z" fill="#0E1629" />
              </g>
              <defs>
                <clipPath id="clip0_230_915">
                  <rect width="28" height="28" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }
          title="Preferred States"
        >
          {states.length > 0
            ? <StatesChips states={states} />
            : <span className="text-(--text-muted) font-medium text-[1rem]">Not specified</span>
          }
        </InfoCard>

        <InfoCard
          gap={1}
          action={
            <button
              onClick={() => setIsAddFundsOpen(true)}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[#0E1629] hover:bg-[#2f43f2] transition-colors cursor-pointer"
              aria-label="Add money to wallet"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          }
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.83333 7.29102C4.98243 7.29102 4.16638 7.62904 3.5647 8.23071C2.96302 8.83239 2.625 9.64845 2.625 10.4993V20.9993C2.625 21.8503 2.96302 22.6663 3.5647 23.268C4.16638 23.8697 4.98243 24.2077 5.83333 24.2077H22.1667C23.0176 24.2077 23.8336 23.8697 24.4353 23.268C25.037 22.6663 25.375 21.8503 25.375 20.9993V10.4993C25.375 9.64845 25.037 8.83239 24.4353 8.23071C23.8336 7.62904 23.0176 7.29102 22.1667 7.29102H5.83333ZM19.25 14.291C18.8632 14.291 18.4923 14.4447 18.2188 14.7182C17.9453 14.9916 17.7917 15.3626 17.7917 15.7493C17.7917 16.1361 17.9453 16.5071 18.2188 16.7805C18.4923 17.054 18.8632 17.2077 19.25 17.2077C19.6368 17.2077 20.0077 17.054 20.2812 16.7805C20.5547 16.5071 20.7083 16.1361 20.7083 15.7493C20.7083 15.3626 20.5547 14.9916 20.2812 14.7182C20.0077 14.4447 19.6368 14.291 19.25 14.291Z" fill="#0E1629" />
              <path d="M19.2325 3.57868C19.5779 3.48663 19.9399 3.47518 20.2904 3.54521C20.641 3.61524 20.9708 3.76489 21.2543 3.98259C21.5379 4.2003 21.7676 4.48024 21.9258 4.80082C22.084 5.1214 22.1664 5.47404 22.1667 5.83152H10.5L19.2325 3.57868Z" fill="#0E1629" />
            </svg>
          }
          title="Wallet Balance"
        >
          <div>
            <h1 className="flex text-[#28A745] text-[2.25rem] font-medium">
              {`₹${formatCurrency(walletAmount)}`}
            </h1>
            <div className="flex gap-15">
              <div className="flex items-center gap-3">
                <svg width="47" height="47" viewBox="0 0 47 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="47" height="47" rx="12" fill="#E30004" />
                  <path d="M28.4497 18.5493L18.5502 28.4488M28.4497 18.5493V27.0346M28.4497 18.5493H19.9644" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[#E30004] text-[1.25rem] font-medium">-₹{formatCurrency(totalDebit)}</p>
              </div>
              <div className="flex items-center gap-3">
                <svg width="47" height="47" viewBox="0 0 47 47" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="47" y="47" width="47" height="47" rx="12" transform="rotate(180 47 47)" fill="#28A745" />
                  <path d="M18.5503 28.4507L28.4498 18.5512M18.5503 28.4507V19.9654M18.5503 28.4507H27.0356" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-[#28A745] font-medium text-[1.25rem] font-montserrat">+₹{formatCurrency(totalCredit)}</p>
              </div>
            </div>
          </div>
        </InfoCard>

      </div>

      <AddFundsPanel
        isOpen={isAddFundsOpen}
        onClose={() => setIsAddFundsOpen(false)}
        balance={walletAmount}
        onAddMoney={handleAddFunds}
        isProcessing={isStartingPayment}
      />

      {prefsMode && user && (
        <EditPreferencesModal
          mode={prefsMode}
          currentUser={user}
          onClose={handlePrefsClose}
        />
      )}
    </>
  );
}

// ─── InfoCard ─────────────────────────────────────────────────────────────────

interface infoTitle {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  gap: Number;
  action?: ReactNode;
}

function InfoCard({ icon, title, children, gap, action }: infoTitle) {
  return (
    <div className={`flex flex-col gap-${gap} w-full bg-white border border-[#efefef] p-4 rounded-[0.75rem]`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-(--text-main) font-semibold text-xl">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── CounsellorsTab ───────────────────────────────────────────────────────────

const counsellor_tabs = [
  { title: "Subscribed", id: 1 },
  { title: "Favourite", id: 2 },
];


function CounsellorsTab() {
  const [active, setActive] = useState(1);
  const { userId } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const queryClient = useQueryClient();

  const { data: subscribedCounsellors = [], isLoading: loadingSub } = useQuery({
    queryKey: ['subscribedCounsellors', userId],
    queryFn: () => getSubscribedCounsellors(userId!, token!),
    enabled: !!userId && !!token,
  });
  const { data: favouriteCounsellors = [], isLoading: loadingFav } = useQuery({
    queryKey: ['favouriteCounsellors', userId],
    queryFn: () => getFavouriteCounsellors(userId!, token!),
    enabled: !!userId && !!token,
  });

  const favSet = new Set(favouriteCounsellors.map((c: any) => c.counsellorId));

  const { mutate: toggleFav } = useMutation({
    mutationFn: (counsellorId: string) => {
      if (!userId) return Promise.reject(new Error('Not authenticated'));
      return addFav(userId, counsellorId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favouriteCounsellors', userId] });
    },
    onError: () => {
      toast.error('Failed to update favourite.');
    },
  });

  const handleBookmark = (counsellorId: string) => {
    if (!userId) {
      toast.error('Please login to save counsellors.');
      return;
    }
    toggleFav(counsellorId);
  };

  const counsellorsToDisplay = active === 1 ? subscribedCounsellors : favouriteCounsellors;
  const isLoading = active === 1 ? loadingSub : loadingFav;

  return (
    <div className="flex flex-col items-start">
      <div className="flex gap-1">
        {counsellor_tabs.map((tab) => (
          <div
            key={tab.id}
            className={`hover:cursor-pointer px-4 flex items-center py-2.5 rounded-3xl text-[1rem] ${active === tab.id ? "bg-[rgba(14,22,41,0.10)] text-(--text-main) font-normal" : "bg-none text-(--text-muted) font-normal"}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-6">
        {isLoading ? (
          <div className="flex justify-center w-full py-10"><Loader2 className="w-8 h-8 animate-spin text-[#13097D]" /></div>
        ) : counsellorsToDisplay.length > 0 ? (
          counsellorsToDisplay.map((card: any) => (
            <FancyCard
              key={card.counsellorId}
              counsellorId={card.counsellorId}
              name={[card.firstName, card.lastName].filter(Boolean).join(' ') || 'Counsellor'}
              imageUrl={card.photoUrlSmall || ''}
              rating={card.newRating || card.rating || 0}
              experience={card.experience ? `${card.experience} yrs exp` : ''}
              city={card.city || ''}
              showBookmark={true}
              isBookmarked={active === 2 ? true : favSet.has(card.counsellorId)}
              onBookmarkClick={() => handleBookmark(card.counsellorId)}
            />
          ))
        ) : (
          <p className="text-(--text-muted)">No counsellors found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Transaction ──────────────────────────────────────────────────────────────

function Transaction() {
  const { user } = useAuthStore();
  return (
    <OldTransactionsTab
      transactions={user?.transactions || []}
      offlineTransactions={user?.offlineTransactions || []}
    />
  );
}

// ─── MyCourse ─────────────────────────────────────────────────────────────────

const course_tabs = [
  { title: "Purchased", id: 1 },
  { title: "Saved", id: 2 },
];

function MyCourse() {
  const [active, setActive] = useState(1);
  const { userId } = useAuthStore();

  const { data: purchasedData, isLoading: loadingPurchased } = useQuery({
    queryKey: ['boughtCourses', userId],
    queryFn: () => getBoughtCourses(userId as string),
    enabled: !!userId,
  });
  const { data: bookmarkedData, isLoading: loadingBookmarked } = useQuery({
    queryKey: ['bookmarkedCourses', userId],
    queryFn: () => getBookmarkedCourses(userId as string),
    enabled: !!userId,
  });

  const purchasedIds = new Set((purchasedData?.data || []).map((c: any) => c.courseId));
  const currentData = active === 1 ? purchasedData : bookmarkedData;
  const isLoading = active === 1 ? loadingPurchased : loadingBookmarked;
  const courses = (currentData?.data || []).map((c: any) => ({
    courseId: c.courseId,
    name: c.courseName || '',
    image: c.courseThumbnailUrl || '',
    price: `₹${c.coursePriceAfterDiscount || 0}`,
    isBought: active === 1 || purchasedIds.has(c.courseId),
  }));

  return (
    <div className="flex flex-col items-start">
      <div className="flex gap-1">
        {course_tabs.map((tab) => (
          <div
            key={tab.id}
            className={`hover:cursor-pointer px-4 flex items-center py-2.5 rounded-3xl text-[1rem] ${active === tab.id ? "bg-[rgba(14,22,41,0.10)] text-(--text-main) font-normal" : "bg-none text-(--text-muted) font-normal"}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-6">
        {isLoading ? (
          <div className="flex justify-center w-full py-10"><Loader2 className="w-8 h-8 animate-spin text-[#13097D]" /></div>
        ) : courses.length > 0 ? (
          courses.map((course) => (
            <ProfileCourseCard
              key={course.courseId}
              courseId={course.courseId}
              name={course.name}
              image={course.image}
              price={course.price}
              isBought={course.isBought}
            />
          ))
        ) : (
          <p className="text-(--text-muted)">No courses found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

function Reviews() {
  const { userId } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const queryClient = useQueryClient();

  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['userReviews', userId],
    queryFn: () => getUserReviews(userId!, token!),
    enabled: !!userId && !!token,
  });

  const { mutate: updateReview, isPending: isUpdating } = useMutation({
    mutationFn: (data: { reviewText: string; rating: number }) => {
      if (!editingReview || !userId || !token) throw new Error('Missing data');
      return updateUserReview(
        {
          ...data,
          reviewId: editingReview.reviewId,
          userId,
          counsellorId: editingReview.counsellorName,
        },
        token
      );
    },
    onSuccess: () => {
      toast.success('Review updated!');
      setEditingReview(null);
      queryClient.invalidateQueries({ queryKey: ['userReviews', userId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update review.');
    },
  });

  const handleUpdate = (data: { reviewText: string; rating: number }) =>
    new Promise<void>((resolve, reject) =>
      updateReview(data, { onSuccess: () => resolve(), onError: (e) => reject(e) })
    );

  return (
    <>
      <div>
        <h2 className="text-(--text-main) text-[1rem] font-medium mb-6">My Reviews</h2>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#13097D]" /></div>
        ) : reviews.length > 0 ? (
          <div className="flex flex-col gap-4">
            {reviews.map((review: any) => (
              <ReviewCard key={review.reviewId} review={review} onEdit={setEditingReview} />
            ))}
          </div>
        ) : (
          <p className="text-(--text-muted)">No reviews yet</p>
        )}
      </div>

      {editingReview && (
        <EditReviewModal
          isOpen={!!editingReview}
          review={editingReview}
          onClose={() => setEditingReview(null)}
          onUpdate={handleUpdate}
          isSubmitting={isUpdating}
        />
      )}
    </>
  );
}

// ─── Appointments ─────────────────────────────────────────────────────────────

const appointments_tabs = [
  { title: "All", id: 1 },
  { title: "Upcoming", id: 2 },
  { title: "Complete", id: 3 },
  { title: "Cancelled", id: 4 },
];

type AppointmentStatus = "completed" | "cancelled" | "upcoming" | "booked" | "rescheduled";

type AppointmentItem = {
  id: string;
  doctorName: string;
  sessionTitle: string;
  dateLabel: string;
  timeLabel: string;
  status: AppointmentStatus;
  photo?: string;
  raw: Appointment;
};

const appointments_type: Record<string, string> = {
  completed: "Completed",
  cancelled: "Cancelled",
  upcoming: "Upcoming",
  booked: "Upcoming",
  rescheduled: "Rescheduled",
};

function AppointmentsCard({
  appointment,
  onCardClick,
  onCancelClick,
  onRescheduleClick,
}: {
  appointment: AppointmentItem;
  onCardClick: (raw: Appointment) => void;
  onCancelClick: (raw: Appointment) => void;
  onRescheduleClick: (raw: Appointment) => void;
}) {
  const statusStyles: Record<string, string> = {
    completed: "bg-[#28A7451A] text-[#28A745]",
    cancelled: "bg-[#EE1C1F1A] text-[#EE1C1F]",
    upcoming: "bg-[#13097D1A] text-[#13097D]",
    booked: "bg-[#13097D1A] text-[#13097D]",
    rescheduled: "bg-[#F2C94C1A] text-[#F2994A]",
  };

  const isActionable = ['upcoming', 'booked', 'rescheduled'].includes(appointment.status);

  return (
    <div
      className="flex items-center gap-4 w-full py-3.5 cursor-pointer hover:bg-[#F9FAFB] rounded-lg px-2 -mx-2 transition-colors"
      onClick={() => onCardClick(appointment.raw)}
    >
      {/* Counsellor photo + name */}
      <div className="flex items-center gap-3 w-[40%] min-w-0">
        <img loading="lazy" decoding="async"
          src={appointment.photo || "/aditya.svg"}
          alt=""
          className="w-10 h-10 rounded-lg shrink-0 object-cover"
        />
        <div className="min-w-0">
          <h4 className="font-semibold text-left text-base text-[#242645] truncate">{appointment.doctorName}</h4>
          <p className="text-sm font-medium text-[#8C8CA1] truncate">{appointment.sessionTitle}</p>
        </div>
      </div>

      {/* Date and time */}
      <div className="flex items-center gap-4 w-[35%]">
        <p className="font-medium text-base text-[#242645] truncate w-1/2">{appointment.dateLabel || '—'}</p>
        <p className="font-medium text-base text-[#242645] truncate w-1/2">{appointment.timeLabel || '—'}</p>
      </div>

      {/* Status badge + action icons */}
      <div className="flex items-center justify-end gap-2 w-[25%]">
        {isActionable && (
          <>
            <button
              title="Reschedule"
              onClick={(e) => { e.stopPropagation(); onRescheduleClick(appointment.raw); }}
              className="p-1.5 rounded-full hover:bg-[#E8E7F2] transition-colors cursor-pointer"
            >
              <CalendarClock size={15} className="text-[#6B7280]" />
            </button>
            <button
              title="Cancel"
              onClick={(e) => { e.stopPropagation(); onCancelClick(appointment.raw); }}
              className="p-1.5 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
            >
              <XCircle size={15} className="text-[#EE1C1F]" />
            </button>
          </>
        )}
        <span className={`px-3 py-1 flex items-center justify-center font-semibold text-sm rounded-3xl whitespace-nowrap ${statusStyles[appointment.status]}`}>
          {appointments_type[appointment.status]}
        </span>
      </div>
    </div>
  );
}

function Appointments() {
  const [active, setActive] = useState(1);
  const { userId, user } = useAuthStore();
  const token = localStorage.getItem('jwt');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['userAppointments', userId],
    queryFn: () => getUserAppointments(userId!, token!),
    enabled: !!userId && !!token,
    staleTime: 30000,
  });

  const { mutate: doCancel, isPending: isCancelling } = useMutation({
    mutationFn: (reason: string) => {
      if (!cancelAppt || !userId || !token) throw new Error('Missing data');
      return cancelAppointment(
        {
          userId,
          appointmentId: cancelAppt.appointmentId,
          receiverFcmToken: cancelAppt.counsellorFCMToken || null,
          reason,
        },
        token
      );
    },
    onSuccess: () => {
      toast.success('Appointment cancelled.');
      setCancelAppt(null);
      queryClient.invalidateQueries({ queryKey: ['userAppointments', userId] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel appointment.');
    },
  });

  const mappedAppointments: AppointmentItem[] = appointments.map((a: any) => {
    const status: AppointmentStatus = a.status === 'booked' ? 'upcoming' : a.status;
    const dateObj = a.date ? new Date(a.date) : null;
    const dateLabel = dateObj
      ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'long' })
      : '';
    return {
      id: a.appointmentId || a.id,
      doctorName: a.counsellorFullName || a.counsellorId || '',
      sessionTitle: user?.interestedCourse
        ? `${user.interestedCourse} Counselling Session`
        : 'Counselling Session',
      dateLabel,
      timeLabel: `${a.startTime || ''} - ${a.endTime || ''}`,
      status,
      photo: a.counsellorPhootoSmall || '',
      raw: a as Appointment,
    };
  });

  const filteredAppointments = mappedAppointments.filter((a) => {
    if (active === 1) return true;
    if (active === 2) return a.status === 'upcoming' || a.status === 'booked' || a.status === 'rescheduled';
    if (active === 3) return a.status === 'completed';
    return a.status === 'cancelled';
  });

  return (
    <>
      <div className="flex flex-col">
        <div className="flex gap-1">
          {appointments_tabs.map((tab) => (
            <div
              key={tab.id}
              className={`hover:cursor-pointer px-4 flex items-center py-2.5 rounded-3xl text-[1rem] ${active === tab.id ? "bg-[rgba(14,22,41,0.10)] text-(--text-main) font-normal" : "bg-none text-(--text-muted) font-normal"}`}
              onClick={() => setActive(tab.id)}
            >
              {tab.title}
            </div>
          ))}
        </div>

        <div className="flex flex-col divide-y divide-[#EFEFEF]">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#13097D]" /></div>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <AppointmentsCard
                key={appointment.id}
                appointment={appointment}
                onCardClick={setSelectedAppt}
                onCancelClick={setCancelAppt}
                onRescheduleClick={setRescheduleAppt}
              />
            ))
          ) : (
            <p className="text-(--text-muted) py-4">No appointments in this filter.</p>
          )}
        </div>
      </div>

      <AppointmentDetailsModal
        isOpen={!!selectedAppt}
        onClose={() => setSelectedAppt(null)}
        appointment={selectedAppt}
        onNavigateToCounselor={(id) => {
          navigate(`/counsellor-details/${encodeCounselorId(id)}`);
          setSelectedAppt(null);
        }}
      />

      <CancelAppointmentModal
        isOpen={!!cancelAppt}
        onClose={() => setCancelAppt(null)}
        onConfirm={(reason) => doCancel(reason)}
        onReschedule={() => {
          setRescheduleAppt(cancelAppt);
          setCancelAppt(null);
        }}
        isSubmitting={isCancelling}
      />

      {rescheduleAppt && (
        <RescheduleModalWrapper
          appointment={rescheduleAppt}
          onClose={() => setRescheduleAppt(null)}
          onRescheduleSuccess={() => {
            setRescheduleAppt(null);
            queryClient.invalidateQueries({ queryKey: ['userAppointments', userId] });
          }}
        />
      )}
    </>
  );
}

// ─── MyTests ──────────────────────────────────────────────────────────────────

const tests_tabs = [
  { title: "Purchased", id: 1 },
  { title: "Saved", id: 2 },
];

function MyTests() {
  const [active, setActive] = useState(1);
  const { userId } = useAuthStore();

  const { data: purchasedData, isLoading: loadingPurchased } = useQuery({
    queryKey: ['boughtTestGroups', userId],
    queryFn: () => getUserBoughtTestGroups(userId!),
    enabled: !!userId,
  });
  const { data: bookmarkedData, isLoading: loadingBookmarked } = useQuery({
    queryKey: ['bookmarkedTestGroups', userId],
    queryFn: () => getUserBookmarkedTestGroups(userId!),
    enabled: !!userId,
  });

  const purchasedIds = new Set((purchasedData?.data || []).map((t: any) => t.testGroupId));
  const currentData = active === 1 ? purchasedData : bookmarkedData;
  const isLoading = active === 1 ? loadingPurchased : loadingBookmarked;
  const testGroups = (currentData?.data || []).map((t: any) => ({
    testGroupId: t.testGroupId,
    title: t.testGroupName || '',
    image: t.bannerImagUrl || '/discover-exam.jpg',
    totalTests: t.attachedTestIds?.length || 0,
    totalStudents: t.soldCount || 0,
    rating: t.rating?.toFixed(1) || '0',
    isBought: active === 1 || purchasedIds.has(t.testGroupId),
  }));

  return (
    <div className="flex flex-col items-start">
      <div className="flex gap-1">
        {tests_tabs.map((tab) => (
          <div
            key={tab.id}
            className={`hover:cursor-pointer px-4 flex items-center py-2.5 rounded-3xl text-[1rem] ${active === tab.id ? "bg-[rgba(14,22,41,0.10)] text-(--text-main) font-normal" : "bg-none text-(--text-muted) font-normal"}`}
            onClick={() => setActive(tab.id)}
          >
            {tab.title}
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-6">
        {isLoading ? (
          <div className="flex justify-center w-full py-10"><Loader2 className="w-8 h-8 animate-spin text-[#13097D]" /></div>
        ) : testGroups.length > 0 ? (
          testGroups.map(
            (test: {
              testGroupId: string;
              title: string;
              image: string;
              totalTests: number;
              totalStudents: number;
              rating: string;
              isBought: boolean;
            }) => (
              <ProfileTestCard
          key={test.testGroupId}
          testGroupId={test.testGroupId}
          title={test.title}
          image={test.image}
          totalTests={test.totalTests}
          totalStudents={test.totalStudents}
          rating={test.rating}
          isBought={test.isBought}
              />
            )
          )
        ) : (
          <p className="text-(--text-muted)">No test series found.</p>
        )}
      </div>
    </div>
  );
}

// ─── Call History ───────────────────────────────────────────────────────────

type AnyMap = Record<string, unknown>;

const isAnyMap = (value: unknown): value is AnyMap =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toHistoryArray = (payload: unknown): AnyMap[] => {
  if (Array.isArray(payload)) return payload.filter(isAnyMap);
  if (!isAnyMap(payload)) return [];
  const candidateKeys = ['data', 'result', 'items', 'callHistory', 'history', 'calls'];
  for (const key of candidateKeys) {
    const node = payload[key];
    if (Array.isArray(node)) return node.filter(isAnyMap);
  }
  if (isAnyMap(payload.data)) {
    for (const key of candidateKeys) {
      const node = payload.data[key];
      if (Array.isArray(node)) return node.filter(isAnyMap);
    }
  }
  return [];
};

const toStr = (value: unknown, fallback = 'NA') => {
  if (typeof value !== 'string') return fallback;
  const t = value.trim();
  return t.length > 0 ? t : fallback;
};

const parseDateTime = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return { dateLabel: 'NA', timeLabel: 'NA' };
  const parsed = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return { dateLabel: value, timeLabel: 'NA' };
  return {
    dateLabel: parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    timeLabel: parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
};

const formatSeconds = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 'NA';
  if (num === 0) return '0s';
  const m = Math.floor(num / 60);
  const s = num % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
};

const CALL_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  completed: { bg: 'bg-[#28A7451A]', text: 'text-[#28A745]' },
  failed:    { bg: 'bg-[#EE1C1F1A]', text: 'text-[#EE1C1F]'  },
  missed:    { bg: 'bg-[#F2C94C1A]', text: 'text-[#F2994A]'  },
  busy:      { bg: 'bg-orange-50',   text: 'text-orange-500'  },
};

const getCallStatusStyle = (s: string) =>
  CALL_STATUS_STYLES[s.toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-500' };

function CallHistory() {
  const { userId } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['userCallHistory', userId],
    queryFn: () => probuddiesApi.userCallHistory(userId!),
    enabled: !!userId,
  });

  const rows = toHistoryArray(data).map((item, index) => {
    const { dateLabel, timeLabel } = parseDateTime(item.startTime ?? item.callDateTime ?? item.createdAt);
    const rawStatus = toStr(item.status ?? item.callStatus, 'completed');
    const statusStyle = getCallStatusStyle(rawStatus);
    const paymentSettled = item.paymentSettled;
    const proCoin = item.proCoinTransferred != null ? Number(item.proCoinTransferred) : null;

    return {
      id: toStr(item.id ?? item.callSid ?? `${index}`, `${index}`),
      proBuddyId: toStr(item.proBuddyId ?? null, 'ProBuddy'),
      name: toStr(item.userFullName ?? item.proBuddyFullName ?? item.proBuddyName ?? null, 'ProBuddy'),
      photoUrl: toStr(item.userPhotoUrl ?? null, ''),
      dateLabel,
      timeLabel,
      durationLabel: formatSeconds(item.conversationDuration ?? item.duration ?? item.callDuration),
      statusLabel: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1),
      statusStyle,
      paymentSettled: paymentSettled === true ? true : paymentSettled === false ? false : null,
      proCoin,
      eventType: toStr(item.eventType ?? null, ''),
    };
  });

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-[#13097D]" /></div>;
  }

  if (error instanceof Error) {
    return <p className="text-[#EE1C1F]">{error.message}</p>;
  }

  if (rows.length === 0) {
    return <p className="text-(--text-muted)">No call history found.</p>;
  }

  return (
    <div className="w-full rounded-xl border border-[#EFEFEF] overflow-hidden bg-white">
      <div className="max-h-136 overflow-y-auto divide-y divide-[#EFEFEF]">
        {rows.map((row) => (
          <div key={row.id} className="px-4 py-3.5 flex items-center gap-3">
            {/* Avatar */}
            <div className="shrink-0 w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
              {row.photoUrl ? (
                <img loading="lazy" decoding="async" src={row.photoUrl} alt={row.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[13px] font-semibold text-[#6B7280]">
                  {row.name !== 'ProBuddy' ? row.name.charAt(0).toUpperCase() : 'P'}
                </span>
              )}
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#0E1629] truncate">{row.name}</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">{row.dateLabel} · {row.timeLabel}</p>
              {row.eventType && (
                <p className="text-[11px] text-[#9CA3AF] capitalize">{row.eventType.replace(/_/g, ' ')}</p>
              )}
            </div>

            {/* Duration */}
            <div className="text-right shrink-0">
              <p className="text-[11px] text-[#9CA3AF]">Duration</p>
              <p className="text-[13px] font-semibold text-[#0E1629]">{row.durationLabel}</p>
              {row.proCoin != null && (
                <p className="text-[11px] font-medium text-[#2F43F2]">
                  {row.proCoin > 0 ? `−${row.proCoin}` : row.proCoin} coins
                </p>
              )}
            </div>

            {/* Right side: call status + payment status stacked */}
            <div className="shrink-0 flex flex-col items-end gap-1">
              {/* Call status */}
              <span className={`px-2.5 py-0.5 rounded-3xl text-[11px] font-semibold ${row.statusStyle.bg} ${row.statusStyle.text}`}>
                {row.statusLabel}
              </span>

              {/* Payment status — only for completed calls, labeled to avoid confusion */}
              {row.statusLabel.toLowerCase() === 'completed' && row.paymentSettled !== null && (
                <span className={`px-2.5 py-0.5 rounded-3xl text-[11px] font-medium ${
                  row.paymentSettled
                    ? 'bg-[#28A7451A] text-[#28A745]'
                    : 'bg-[#FEF9C3] text-[#B45309]'
                }`}>
                  {row.paymentSettled ? '₹ Paid' : '₹ Pending'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── renderTabContent ─────────────────────────────────────────────────────────

function renderTabContent(tabId: number) {
  switch (tabId) {
    case 1: return <MyInfoTab />;
    case 2: return <Appointments />;
    case 8: return <CallHistory />;
    case 3: return <CounsellorsTab />;
    case 4: return <Transaction />;
    case 5: return <MyCourse />;
    case 6: return <MyTests />;
    case 7: return <Reviews />;
    default: return <MyInfoTab />;
  }
}
