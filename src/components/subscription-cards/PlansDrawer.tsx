/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import { Badge } from "../ui";
import "./PlansDrawer.css";
import { useState, useEffect } from "react";
import type { CounselorDetails } from "@/types";
import { useAuthStore } from "@/store/AuthStore";
import { useNavigate } from "react-router-dom";
import { transferAmount, subscribeCounselor, manualPaymentApproval, upgradeSubscriptionPlan, type UpgradePlanPayload } from "@/api/wallet";
import startRecharge from "@/api/wallet";
import { getLoggedInPhone, formatPhoneForRazorpay } from "@/lib/phone";
import toast from 'react-hot-toast';
import type { SubscribedCounsellor } from "@/types/user";
import { ConfirmationModal } from '@/components/shared/ConfirmationModal';
import AddFundsPanel from '@/components/student-dashboard/AddFundsPanel';
import { encodeCounselorId } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: unknown;
  }
}
type RazorpayConstructor = new (opts: unknown) => { open: () => void };

type PlansResponse = {
  benefits?: Array<any>;
  elite?: string[];
  pro?: string[];
  plus?: string[];
  prices?: { elite?: string; pro?: string; plus?: string };
  seats?: { elite?: string; pro?: string; plus?: string };
  desc?: { elite?: string; pro?: string; plus?: string };
  counselor?: CounselorDetails;
};

export default function PlansDrawer({
  open,
  onClose,
  planKey,
  plan,
  planTitle,
  price,
  counselor,
  isUpgrade,
  currentPlan
}: {
  open: boolean;
  onClose: () => void;
  planKey?: string | null;
  plan?: PlansResponse;
  planTitle?: string | null;
  price?: string | undefined;
  counselor?: CounselorDetails;
  isUpgrade?: boolean;
  currentPlan?: SubscribedCounsellor | null;
}) {
  const [payingOffline, setPayingOffline] = useState(false);
  const [approved, setApproved] = useState(false)
  const [offlineAck, setOfflineAck] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const navigate = useNavigate();
  const  fullName = (counselor?.firstName ?? '') + (counselor?.lastName ?? '')
  const userImageFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=E0E7FF&color=4F46E5&size=128`;
  const getPlanPrice = (planName: string | null | undefined): number => {
    if (!planName || !counselor) return 0;
    const lowerCasePlanName = planName.toLowerCase();
    if (lowerCasePlanName === 'plus') return counselor.plusAmount;
    if (lowerCasePlanName === 'pro') return counselor.proAmount;
    if (lowerCasePlanName === 'elite') return counselor.eliteAmount;
    return 0;
  };

  const newPlanPrice = getPlanPrice(planTitle);
  const currentPlanPrice = isUpgrade ? getPlanPrice(currentPlan?.plan) : 0;
  const priceToPay = newPlanPrice - currentPlanPrice;

  async function subscribe() {
    const wallet = user?.walletAmount ?? 0;
    const priceNum = isUpgrade ? priceToPay : newPlanPrice;
    
    if (wallet < priceNum) {
      toast.error('Insufficient balance. Please add funds to your wallet.');
      setAddFundsOpen(true);
      return;
    }
    if (!counselor?.userName || !user?.userName) {
      toast.error("Missing counselor or user identifier.");
      return;
    }

    const toastId = toast.loading('Processing your request...');

    try {
      const transferRes = await transferAmount(counselor.userName, user.userName, priceNum);
      if (!transferRes || (transferRes as any).status === false) {
        throw new Error('Payment transfer failed. Please try again.');
      }
      if (isUpgrade) {
        toast.loading('Upgrading your plan...', { id: toastId });
        const payload: UpgradePlanPayload = {
          userId: user.userName,
          counsellorId: counselor.userName,
          receiverFcmToken: null,
          amount: priceNum,
          plan: (planTitle ?? '').toLowerCase() as 'plus' | 'pro' | 'elite',
          subscriptionMode: 'online',
          subscriptionType: 'upgrade',
        };
        await upgradeSubscriptionPlan(payload);
      } else {
        toast.loading('Completing your subscription...', { id: toastId });
        await subscribeCounselor(counselor.userName, user.userName, priceNum, (planTitle ?? '').toLowerCase());
      }
      
      await refreshUser(true);
      toast.success(isUpgrade ? 'Upgrade successful! Redirecting...' : 'Subscription successful! Redirecting...', { id: toastId });

      setTimeout(() => {
        navigate(`/counsellor/${encodeCounselorId(counselor.userName)}`);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Subscription/Upgrade flow failed', err);
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred.', { id: toastId });
    }
  }

  async function offlinePayment() {
  const priceNum = isUpgrade ? priceToPay : newPlanPrice;
  if (!counselor?.userName || !user?.userName) {
    toast.error('Counselor or user ID is missing.');
    return;
  }
  const toastId = toast.loading('Sending offline request...');
  try {
    const subscriptionType = isUpgrade ? 'upgrade' : '';
    const offlinePaymentResult = await manualPaymentApproval(
      counselor.userName,
      user.userName,
      priceNum,
      (planTitle ?? '').toLowerCase(),
      subscriptionType
    );

    console.log('Offline payment response: ', offlinePaymentResult);
    
    if (offlinePaymentResult?.status) {
      toast.success('Offline request sent successfully!', { id: toastId });
      setApproved(true);
      setPayingOffline(false);
    } else {
      throw new Error(offlinePaymentResult?.message || 'Failed to send offline request.');
    }

  } catch (e) {
    console.error(e);
    toast.error(e instanceof Error ? e.message : 'An unknown error occurred.', { id: toastId });
  }
}

  const handleRecharge = async (amount: number) => {
    if (!amount || amount <= 0) {
      console.error('A valid amount is required.');
      return;
    }
    try {
      const order = await startRecharge(user?.userName ?? '', amount);
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "ProCounsel Wallet",
        description: "Wallet Recharge",
        prefill: {
          contact: formatPhoneForRazorpay(getLoggedInPhone()),
          email: user?.email || "",
          name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
        },
        notes: { userId: user?.userName },
        handler: async function () {
          toast.success("Payment successful. Your balance will be updated shortly.");
          try {
            await refreshUser(true);
          } catch (err) {
            console.error('Failed to refresh user balance after payment.', err);
          } finally {
            setAddFundsOpen(false);
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Razorpay modal dismissed.');
          }
        },
        theme: { color: "#3399cc" },
      };

      const Rz = (window as unknown as { Razorpay: RazorpayConstructor }).Razorpay;
      const rzp = new Rz(options);
      rzp.open();

    } catch (error) {
      console.error("Failed to initiate Razorpay order.", error);
      toast.error("Could not start the payment process. Please try again later.");
    }
  };

  useEffect(() => {
    if (!open) return;
    void refreshUser(true);
    // small mount animation trigger
    setMounted(true);
    return () => setMounted(false);
  }, [open, refreshUser]);

  if (!open) return null;

  const desc = plan?.desc ? (plan?.desc as any)?.[planKey ?? ""] : undefined;

  if (payingOffline) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-auto">
        <div
          className={`absolute inset-0 cursor-pointer bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />

        <aside className={`absolute inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 
                           w-full md:w-[460px] p-4 md:p-7 bg-white shadow-xl 
                           transform transition-all duration-300 
                           ${mounted 
                             ? 'opacity-100 translate-y-0 md:translate-x-0' 
                             : 'opacity-0 translate-y-4 md:translate-y-0 md:opacity-100 md:translate-x-6'}`}>
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center">
              <h1 className="text-lg md:text-[20px] font-semibold text-[#343C6A]">
                Offline Payment
              </h1>
              <button
                className="flex items-center justify-center group hover:bg-[#232323] rounded-full w-6 h-6"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="group-hover:text-white group-hover:cursor-pointer text-gray-500" size={17} />
              </button>
            </div>

            {/* Scrollable content area (header/footer stay fixed) */}
            <div className="flex-1 overflow-auto plans-drawer-content py-4">
              <div className="flex justify-between items-center mt-1 md:mt-5">
                <div className="flex gap-2">
                  <img loading="lazy" decoding="async" src="/payoffline.svg" alt="" />
                  <h1 className="flex flex-col  text-[#343C6A] text-base md:text-lg font-semibold">
                    Payment Initiated
                  </h1>
                </div>
              </div>

              <p className="font-normal text-sm text-[#232323] py-3">
                Your offline payment request has been recorded. Please complete
                the payment as instructed below
              </p>

              <div className="flex items-center justify-center gap-2 mb-5 mt-2">
                <hr className="w-full bg-[#D0D0D0] h-px" />
              </div>

              <div className="flex items-center justify-start gap-2">
                <img loading="lazy" decoding="async" src="/greenwallet.svg" alt="" />
                <h1 className="text-base md:text-lg text-[#343C6A] font-semibold">
                  Payment Instruction
                </h1>
              </div>

              <div className="py-4 flex gap-2 items-start">
                <img loading="lazy" decoding="async" src="/one.svg" alt="" className="mt-1" />
                <h1 className="flex flex-col gap-2 font-medium text-sm md:text-[16px] text-[#232323]">
                  Transfer the subscription amount
                  <span className="text-sm text-[#718EBF] font-normal">
                    Use your preferred payment method{" "}
                    <span className="font-medium">
                      (bank transfer, UPI, cash){" "}
                    </span>
                    to pay the counsellor directly.
                  </span>
                </h1>
              </div>

              <div className="py-4 flex gap-2 items-start">
                <img loading="lazy" decoding="async" src="/two.svg" alt="" className="mt-1" />
                <h1 className="flex flex-col gap-2 font-medium text-sm md:text-[16px] text-[#232323]">
                  Keep the payment proof
                  <span className="text-sm text-[#718EBF] font-normal">
                    Save your transaction receipt or take a photo as proof of
                    payment.
                  </span>
                </h1>
              </div>

              <div className="py-4 flex gap-2 items-start">
                <img loading="lazy" decoding="async" src="/three.svg" alt="" className="mt-1" />
                <h1 className="flex flex-col gap-2 font-medium text-sm md:text-[16px] text-[#232323]">
                  Confirm and Send request
                  <span className="text-sm text-[#718EBF] font-normal">
                    Acknowledge your payment below and send the subscription
                    request.
                  </span>
                </h1>
              </div>

              <div className="flex text-xs font-normal bg-[#F9FAFB] border border-[#F9FAFB] rounded-[12px] p-4 w-full md:w-[404px]">
                <div className="flex items-center gap-3">
                  <input
                    id="default-checkbox"
                    type="checkbox"
                    checked={offlineAck}
                    onChange={(e) => setOfflineAck(e.target.checked)}
                    className="w-5 h-5 text-[#ff660a] bg-gray-100 border-gray-300 rounded-sm hover:cursor-pointer"
                  />

                  <p className=" text-[#232323]">
                    I hereby acknowledge that I have paid the agreed amount to
                    the counsellor in offline mode.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 my-5">
                <hr className="w-full bg-[#D0D0D0] h-px" />
              </div>

              <div className="flex flex-col gap-4 w-full md:max-w-[404px]">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 items-center">
                    <img loading="lazy" decoding="async"
                      src={counselor?.photoUrlSmall || userImageFallback}
                      alt={counselor?.firstName}
                      className="h-[72px] w-[72px] rounded-xl"
                    />
                    <h1 className="flex flex-col gap-2 text-base font-semibold text-[#343C6A]">
                      {`${counselor?.firstName} ${counselor?.lastName}`}
                      <span className="text-[#718EBF] text-xs font-normal">{`${counselor?.fullOfficeAddress.city} ${counselor?.organisationName}`}</span>
                    </h1>
                  </div>
                  {/* <img loading="lazy" decoding="async" src="/fav.svg" alt="" className="cursor-pointer" /> */}
                </div>

                <button
                  onClick={offlinePayment}
                  disabled={!offlineAck}
                  aria-disabled={!offlineAck}
                  className={`my-4 py-3 px-2 rounded-[12px] flex items-center justify-center text-base font-semibold w-full
                    ${
                    offlineAck
                      ? 'bg-[#EA5C19] text-white hover:cursor-pointer'
                      : 'bg-[#919191] text-white cursor-not-allowed'
                  }`}
                >
                  Send request
                </button>

                <div className="flex justify-center">
                  <div
                    onClick={() => setPayingOffline(!payingOffline)}
                    className="hover:cursor-pointer mb-20 md:mb-[190px] mt-3 text-xs font-normal text-[#707070]"
                  >
                    Click here to return to online payment
                  </div>
                </div>
              </div>

              <div></div>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 z-50 pointer-events-auto">
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      <aside className={`absolute inset-0 md:inset-auto md:right-0 md:top-0 md:bottom-0 
                         w-full md:w-[460px] p-4 md:p-7 bg-white shadow-xl 
                         transform transition-all duration-300 
                         ${mounted 
                           ? 'opacity-100 translate-y-0 md:translate-x-0' 
                           : 'opacity-0 translate-y-4 md:translate-y-0 md:opacity-100 md:translate-x-6'}`}>
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center">
            <h1 className="text-lg md:text-[20px] font-semibold text-[#343C6A]">
              {planTitle} Membership Details
            </h1>
            <button
              className="flex items-center cursor-pointer justify-center group hover:bg-[#232323] rounded-full w-6 h-6"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="group-hover:text-white group-hover:cursor-pointer text-gray-500" size={17} />
            </button>
          </div>

          {/* Scrollable content area (header/footer stay fixed) */}
          <div className="flex-1 overflow-auto plans-drawer-content py-4">
            <div className="flex justify-between items-center mt-1 md:mt-5">
              <div className="flex gap-2">
                <img loading="lazy" decoding="async" src="/plus.svg" alt="" />
                <h1 className="flex flex-col  text-[#343C6A] text-base md:text-lg font-semibold">
                  {" "}
                  {planTitle} <span className="text-sm flex gap-1"><img loading="lazy" decoding="async" src="/coin.svg" alt="procoin-icon" />{price}</span>
                </h1>
              </div>

              <Badge
                variant="outline"
                className="bg-[rgba(234,92,25,0.1)] text-xs text-[rgb(236,94,26)] rounded-2xl px-4 py-1 h-6"
              >
                Limited Access
              </Badge>
            </div>

            <p className="font-normal text-sm text-[#232323] py-3">
              {desc}
            </p>

            <div className="flex items-center justify-center gap-2 mb-5 mt-2">
              <hr className="w-full md:w-[108px] bg-[#D0D0D0] h-px" />
              <p className="text-[#232323] text-base md:text-lg font-semibold whitespace-nowrap">
                Exclusive Benefits
              </p>
              <hr className="w-full md:w-[108px] bg-[#D0D0D0] h-px" />
            </div>

            <div className="flex flex-col gap-3">
              {(() => {
                if (!planKey || !plan) return null;
                const key = planKey as "plus" | "pro" | "elite";
                const features = (plan as any)[key] as string[] | undefined;

                if (!features || features.length === 0) {
                  return (
                    <p className="text-sm text-gray-500">
                      No benefits available.
                    </p>
                  );
                }

                return features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <img loading="lazy" decoding="async" src="/tick.svg" alt="" className="mt-1 shrink-0" />
                    <p className="text-sm text-[#232323]">{feat}</p>
                  </div>
                ));
              })()}
            </div>

            <hr className="w-full h-px bg-[#D0D0D0] my-5" />

            <div className="flex flex-col gap-3 text-sm font-normal text-[#232323] bg-[#F9FAFB] border border-[#F9FAFB] rounded-[12px] p-4 w-full md:w-[404px]">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <img loading="lazy" decoding="async" src="/planImage.svg" alt="plan icon" />
                  <span>{planTitle} Plan</span>
                </div>
                <span className="text-base font-medium text-[#232323] flex gap-1">
                  <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin-icon" />{newPlanPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <img loading="lazy" decoding="async" src="/wallet.svg" alt="wallet icon" />
                  <p>Wallet Balance</p>
                </div>
                <span className="text-base font-medium text-[#232323] flex gap-1">
                  <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin-icon" />{(user?.walletAmount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>

              {isUpgrade && currentPlanPrice > 0 && (
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center text-green-600">
                    <p><span className="capitalize">{currentPlan?.plan}</span> Plan Credit</p>
                  </div>
                  <span className="text-base font-medium text-green-600 flex gap-1">
                    - <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin-icon" />{currentPlanPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <hr className="my-2 border-gray-300" />
              <div className="flex justify-between items-center">
                <p className="text-base font-bold text-[#343C6A]">Price to Pay</p>
                <span className="text-xl font-bold text-orange-600 flex gap-1">
                  <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin-icon" />{(isUpgrade ? priceToPay : newPlanPrice).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsConfirmModalOpen(true)}
              disabled={approved}
              aria-disabled={approved}
              className={`${approved ? 'bg-[#919191]': 'bg-[#EA5C19]'} hover:cursor-pointer w-full md:w-[404px] my-5 py-3 px-2 rounded-[12px] flex items-center justify-center text-base text-white font-semibold`}
            >
              Subscribe
            </button>

            <div className="w-full flex items-center justify-center">
             {approved ? (
               <div
                className="flex gap-2 p-2.5 bg-[#F0F2F5] border border-[#E5E7EB] rounded-[12px]"
              >
                <img loading="lazy" decoding="async" src="/pending.svg" alt="" />
                <button className="text-[#232323] text-sm font-medium">
                  Request Pending
                </button>
              </div>
             ):(
               <div
                onClick={() => setPayingOffline(!payingOffline)}
                className="flex gap-2 p-2.5 bg-[#F0F2F5] hover:cursor-pointer border border-[#E5E7EB] rounded-[12px] w-auto md:w-[130px]"
              >
                <img loading="lazy" decoding="async" src="/pay.svg" alt="pay-offline" />
                <button className="text-[#232323] hover:cursor-pointer text-sm font-medium">
                  Pay offline
                </button>
              </div>
             )
            }
            </div>

            <div className="flex justify-center">
              <div className="mb-20 md:mb-[190px] mt-3 text-xs font-normal text-[#707070]">
                Bank transfer or cash payment available
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
    <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={subscribe}
        title={isUpgrade ? "Confirm Plan Upgrade" : "Confirm Subscription"}
        message={`Are you sure you want to ${isUpgrade ? 'upgrade to' : 'subscribe to'} the ${planTitle} plan for ${(isUpgrade ? priceToPay : newPlanPrice).toLocaleString('en-IN')} ProCoins? This amount will be deducted from your wallet.`}
        confirmText={isUpgrade ? "Yes, Upgrade" : "Yes, Subscribe"}
      />
      
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-100 transition-opacity duration-300 ${addFundsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <AddFundsPanel
          isOpen={addFundsOpen}
          onClose={() => setAddFundsOpen(false)}
          balance={user?.walletAmount ?? 0}
          onAddMoney={handleRecharge}
        />
      </div>
      </>
  );
}
