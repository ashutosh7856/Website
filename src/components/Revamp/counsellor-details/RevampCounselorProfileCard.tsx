import type { CounselorDetails } from '@/types/academic';
import type { SubscribedCounsellor, User } from '@/types/user';
import { Bookmark, Lock, Star, Share2, Check, MessageCircle, Phone } from 'lucide-react';
import { useState } from 'react';
import { encodeCounselorId } from '@/lib/utils';
import toast from 'react-hot-toast';

type Props = {
  counselor: CounselorDetails;
  subscription: SubscribedCounsellor | null;
  isFavourite: boolean;
  onToggleFavourite: () => void;
  isTogglingFavourite: boolean;
  user: User | null;
  onSubscribeClick: (isUpgrade?: boolean) => void;
  pendingApproval: boolean;
  isCurrentUserCounselor: boolean;
};

export function RevampCounselorProfileCard({
  counselor,
  subscription,
  isFavourite,
  onToggleFavourite,
  isTogglingFavourite,
  onSubscribeClick,
  pendingApproval,
  isCurrentUserCounselor,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const fullName = `${counselor.firstName} ${counselor.lastName}`;
  const imageUrl = counselor.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=E0E7FF&color=4F46E5&size=128`;
  const rating = counselor.rating || 0;

  const formatAmount = (amount: number | null | undefined) => {
    if (amount == null || amount === 0) return 'N/A';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleCopyLink = () => {
    const encodedId = encodeCounselorId(counselor.userName);
    const shareableLink = `${window.location.origin}/counsellor-details/${encodedId}`;
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      toast.success('Profile link copied!', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Language Badges Logic
  const languages = counselor.languagesKnow || ['English'];
  const displayLanguages = languages.slice(0, 2);
  const remainingLanguagesCount = languages.length - 2;

  // Subscription Logic
  const getUpgradePlan = () => {
    const planHierarchy = ['plus', 'pro', 'elite'];
    const currentPlanIndex = planHierarchy.indexOf(subscription?.plan?.toLowerCase() ?? '');
    if (currentPlanIndex === -1 || currentPlanIndex === planHierarchy.length - 1) return null;
    return planHierarchy[currentPlanIndex + 1];
  };
  const upgradePlan = getUpgradePlan();

  return (
    <div className="w-full max-w-[716px] bg-white rounded-[16px] p-3 sm:p-6 shadow-sm font-poppins relative">
      <div className="flex flex-row items-start gap-3 sm:gap-4 relative">
        <div className="relative shrink-0">
          <img loading="lazy" decoding="async"
            src={imageUrl}
            alt={fullName}
            className="w-[96px] h-[96px] sm:w-[119px] sm:h-[119px] rounded-[8px] border border-[#EFEFEF] object-cover"
          />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white border border-[#EFEFEF] rounded-full px-2 py-0.5 flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-current text-[#F59E0B]" />
            <span className="text-[10px] font-semibold text-[#0E1629] leading-none">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-1 sm:mt-2 flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h1 className="text-[20px] sm:text-[24px] font-semibold text-[#0E1629] leading-[125%] truncate">
              {fullName}
            </h1>
            {/* Action Buttons: Share, Bookmark */}
            <div className="flex items-center gap-3 sm:gap-[16px] shrink-0 ml-2">
              <button onClick={handleCopyLink} className="text-gray-400 hover:text-[#2F43F2] cursor-pointer transition-colors">
                {copied ? <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> : <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button
                onClick={onToggleFavourite}
                disabled={isTogglingFavourite}
                className="text-gray-400 hover:text-[#2F43F2] cursor-pointer transition-colors disabled:cursor-not-allowed"
              >
                <Bookmark className={`w-5 h-5 sm:w-6 sm:h-6 ${isFavourite ? 'fill-[#2F43F2] text-[#2F43F2]' : ''}`} />
              </button>
            </div>
          </div>

          <p className="text-[14px] sm:text-[16px] font-semibold text-[#2F43F2] leading-[125%]">
            {counselor.fullOfficeAddress?.city || 'Location'} • {counselor.experience || '0'}+ Years of experience
          </p>

          {/* Languages & Rating Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-2 sm:gap-4">
            <div 
              className="flex gap-2 overflow-x-auto whitespace-nowrap items-center pb-1 flex-1 min-w-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {showAllLanguages ? (
                languages.map((lang) => (
                  <span key={lang} className="bg-[#E6EFEC] text-[#25A777] px-[12px] py-[4px] rounded-[16px] text-[12px] font-medium leading-none shrink-0">
                    {lang}
                  </span>
                ))
              ) : (
                <>
                  {displayLanguages.map((lang) => (
                    <span key={lang} className="bg-[#E6EFEC] text-[#25A777] px-[12px] py-[4px] rounded-[16px] text-[12px] font-medium leading-none shrink-0">
                      {lang}
                    </span>
                  ))}
                  {remainingLanguagesCount > 0 && (
                    <button 
                      onClick={() => setShowAllLanguages(true)}
                      className="bg-[#25A777] text-white px-[12px] py-[4px] rounded-[16px] text-[12px] font-medium leading-none cursor-pointer hover:bg-green-600 transition-colors shrink-0"
                    >
                      +{remainingLanguagesCount} more
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="text-[11px] sm:text-[12px] text-[#6B7280] font-medium">
              {counselor.experience || '0'}+ years exp.
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      {!subscription && (
        <>
          <hr className="border-[#F3F7F6] my-[24px]" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            <h2 className="text-[18px] font-medium text-[#232323] sm:w-[85px] leading-[125%]">
              Available Plans
            </h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
              
              {/* Plus Plan */}
              <div 
                className="min-w-0 h-[50px] sm:h-[55px] rounded-[8px] p-[2px]"
                style={{ background: 'linear-gradient(265.56deg, rgba(113, 142, 191, 0.4) -99.75%, rgba(192, 215, 253, 0.4) 91.52%)' }}
              >
                <div className="w-full h-full rounded-[7px] flex flex-col items-center justify-center bg-gradient-to-r from-[rgba(222,237,255,0.4)] to-[rgba(126,136,211,0.4)]">
                  <span className="text-[11px] sm:text-[13px] text-[#1447E7] font-normal leading-[125%]">Plus</span>
                  <span className="text-[11px] sm:text-[14px] text-[#1447E7] font-semibold leading-[125%] truncate px-1">{formatAmount(counselor.plusAmount)}</span>
                </div>
              </div>

              {/* Pro Plan */}
              <div 
                className="min-w-0 h-[50px] sm:h-[55px] rounded-[8px] p-[2px]"
                style={{ background: 'linear-gradient(265.56deg, rgba(232, 212, 255, 0.4) -99.75%, rgba(192, 215, 253, 0.4) 91.52%)' }}
              >
                <div className="w-full h-full rounded-[7px] flex flex-col items-center justify-center bg-gradient-to-r from-[rgba(244,232,255,0.4)] to-[rgba(250,244,255,0.4)]">
                  <span className="text-[11px] sm:text-[13px] text-[#8200DA] font-normal leading-[125%]">Pro</span>
                  <span className="text-[11px] sm:text-[14px] text-[#8200DA] font-medium leading-[125%] truncate px-1">{formatAmount(counselor.proAmount)}</span>
                </div>
              </div>

              {/* Elite Plan */}
              <div 
                className="min-w-0 h-[50px] sm:h-[55px] rounded-[8px] p-[2px]"
                style={{ background: 'linear-gradient(265.56deg, rgba(255, 251, 237, 0.4) -99.75%, rgba(234, 197, 145, 0.4) 91.52%)' }}
              >
                <div className="w-full h-full rounded-[7px] flex flex-col items-center justify-center bg-gradient-to-r from-[rgba(255,245,206,0.4)] to-[rgba(255,250,230,0.4)]">
                  <span className="text-[11px] sm:text-[13px] text-[#B94C00] font-normal leading-[125%]">Elite</span>
                  <span className="text-[11px] sm:text-[14px] text-[#B94C00] font-medium leading-[125%] truncate px-1">{formatAmount(counselor.eliteAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <hr className="border-[#F3F7F6] my-[24px]" />

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-[16px]">
          <button
            disabled={!subscription}
            className={`w-full sm:flex-1 min-w-0 h-[44px] sm:h-[46px] rounded-[12px] border flex items-center justify-center gap-2 text-[14px] sm:text-[15px] font-semibold transition-colors ${subscription ? 'bg-white border-[#2F43F2] text-[#2F43F2] hover:bg-blue-50 cursor-pointer' : 'bg-[#F9FAFC] border-[#F5F5F5] text-[#B2B9C5] cursor-not-allowed'}`}
          >
            {subscription ? <MessageCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="truncate">Chat</span>
          </button>
          <button
            disabled={!subscription}
            className={`w-full sm:flex-1 min-w-0 h-[44px] sm:h-[46px] rounded-[12px] border flex items-center justify-center gap-2 text-[14px] sm:text-[15px] font-semibold transition-colors ${subscription ? 'bg-white border-[#2F43F2] text-[#2F43F2] hover:bg-blue-50 cursor-pointer' : 'bg-[#F9FAFC] border-[#F5F5F5] text-[#B2B9C5] cursor-not-allowed'}`}
          >
            {subscription ? <Phone className="w-4 h-4 sm:w-[18px] sm:h-[18px]" /> : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            <span className="truncate">Call</span>
          </button>
        </div>

        {subscription ? (
          upgradePlan ? (
            <button
              onClick={() => onSubscribeClick(true)}
              disabled={isCurrentUserCounselor}
              className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[14px] sm:text-[16px] font-semibold text-white bg-[#2F43F2] hover:bg-blue-700 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Upgrade to {upgradePlan.charAt(0).toUpperCase() + upgradePlan.slice(1)}
            </button>
          ) : (
            <button
              disabled
              className="w-full h-[44px] rounded-[12px] flex items-center justify-center text-[14px] sm:text-[16px] font-semibold text-[#B94C00] bg-[#fffbed] border border-[#f3dcb1] cursor-default"
            >
              You are already an Elite member
            </button>
          )
        ) : (
          <button
            onClick={() => onSubscribeClick(false)}
            disabled={pendingApproval || isCurrentUserCounselor}
            className={`w-full h-[44px] rounded-[12px] flex items-center justify-center text-[14px] sm:text-[16px] font-semibold text-white transition-colors ${
              pendingApproval || isCurrentUserCounselor
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#2F43F2] hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {pendingApproval ? 'Request Pending' : isCurrentUserCounselor ? 'Cannot Subscribe' : 'Subscribe Now'}
          </button>
        )}
        
        {!subscription && (
          <p className="text-[12px] text-[#232323] flex items-center gap-1 mt-1 ml-[2px] sm:ml-[4px]">
            <span className="w-[20px] h-[20px] bg-[#0E1629] rounded-full flex items-center justify-center shrink-0">
              <Lock className="w-[13.5px] h-[13.5px] text-white" />
            </span>
            Subscribe to unlock chat and call features
          </p>
        )}
      </div>

      <hr className="border-[#F3F7F6] my-[24px]" />

      {/* About Me Section */}
      <div>
        <h3 className="text-[20px] font-semibold text-[#0E1629] leading-none mb-[16px]">
          About me
        </h3>
        <div className="bg-[#F3F7F6] rounded-[12px] p-[12px] flex flex-col gap-[12px]">
          <div>
            <h4 className="text-[16px] font-semibold text-[#0E1629] leading-none mb-1">
              From {counselor.organisationName}
            </h4>
            <p className="text-[12px] text-[#6B7280] leading-none">
              {counselor.fullOfficeAddress?.city || 'Location'} Office
            </p>
          </div>
          <p className="text-[14px] text-[#6B7280] leading-[150%]">
            {counselor.description || 'Experienced education counsellor with a strong track record helping students choose suitable colleges and programs.'}
          </p>
        </div>
      </div>

      {/* Career Specialisation */}
      <div className="mt-[16px]">
        <h3 className="text-[20px] font-semibold text-[#0E1629] leading-none mb-[12px]">
          Career Specialisation
        </h3>
        <div className="flex flex-wrap gap-[12px]">
          {(counselor.expertise.length > 0 ? counselor.expertise : ["Career Guidance", "College Admission"]).map(spec => (
            <span 
              key={spec} 
              className="px-[16px] py-[8px] bg-white border border-[#2F43F2] rounded-[12px] text-[14px] font-medium text-[#2F43F2] leading-none cursor-default"
            >
              {spec}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}



