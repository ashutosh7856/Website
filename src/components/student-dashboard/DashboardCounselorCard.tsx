import { Star } from "lucide-react";
import { TbBriefcase2 } from "react-icons/tb";
import type { Counsellor } from "@/types/counsellor";

interface CounselorCardProps {
  counselor: Counsellor;
}

export function DashboardCounselorCard({ counselor }: CounselorCardProps){
  const fullName = `${counselor.firstName} ${counselor.lastName}`;
  const imageUrl = counselor.photoUrlSmall || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  const languages = counselor.languagesKnow || [];
  const description = languages.slice(0, 2).join(' | ');

  const hasPlan = counselor.plan && counselor.plan.trim() !== "";

  return (
    <>
      <img loading="lazy" decoding="async"
       src={imageUrl}
       alt={fullName}
       className="w-full h-[124px] object-cover rounded-lg mb-2 sm:aspect-square sm:h-auto sm:mb-3"
       onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`; }}
      />
      <div className="flex flex-col">
        <h4 className="font-semibold text-sm sm:text-lg text-[#242645] truncate">{fullName}</h4>
        <p className="text-xs sm:text-sm text-[#8C8CA1] truncate">{description}</p>
        <p className="text-xs sm:text-sm text-[#8C8CA1] truncate">{counselor.city}</p>
        
        <div className="flex items-center text-xs sm:text-sm text-gray-600 gap-4 my-2">
            <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500" fill="currentColor"/>
                {counselor.rating ?? 'N/A'}
            </span>
            <span className="flex items-center gap-1">
                <TbBriefcase2 className="w-4 h-4 text-blue-500"/>
                {counselor.experience ?? 'N/A'}+ Yrs
            </span>
        </div>
        
        <hr className="my-1 border-[#F5F5F5]"/>
        
        {hasPlan ? (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs sm:text-sm text-nowrap font-semibold text-[#343c6a] capitalize -mt-0.5">
              Active Subscription: {counselor.plan}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <img loading="lazy" decoding="async" src='/Procoin.jpg' alt="procoin_icon" className="w-5 h-5 sm:w-6 sm:h-6 -mt-2"/>
            <span className="text-xs sm:text-sm text-nowrap font-semibold text-[#343c6a] -mt-1.5">
              {counselor.ratePerYear?.toLocaleString('en-IN') ?? 'N/A'} ProCoins
            </span>
          </div>
        )}
      </div>
    </>
  );
}