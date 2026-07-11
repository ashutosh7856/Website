import React from 'react';

type Props = {
  heading: string;
  aboutText: string;
  whoShouldConnect: string;
};

const ProBuddyOverviewTab: React.FC<Props> = ({ heading, aboutText, whoShouldConnect }) => {
  return (
    <div className="pt-3 pl-3 pr-3 sm:pt-[24px] sm:pl-[24px] sm:pr-0 font-poppins">
      <h2 className="w-auto sm:w-[118px] h-[24px] text-[14px] sm:text-[16px] font-medium text-[#0E1629] leading-none mb-3 sm:mb-[16px]">
        About Yourself
      </h2>

      <div className="w-full sm:w-[880px] h-auto sm:h-[144px] rounded-[12px] border border-[#EFEFEF] bg-white shadow-[0px_1px_4px_0px_rgba(14,22,41,0.2)] relative mb-3 sm:mb-[24px] pb-4 sm:pb-0">
        <img loading="lazy" decoding="async"
          src='/graduationCap.svg'
          alt='graduation-cap'
          className='absolute top-3 sm:top-[18px] left-3 sm:left-[16px] w-5 h-5 sm:w-[28px] sm:h-[28px]'
        />

        <h3 className="relative sm:absolute top-0 sm:top-[18px] left-0 sm:left-[52px] w-full sm:w-[269px] h-auto sm:h-[30px] text-[16px] sm:text-[20px] font-semibold text-[#0E1629] truncate pl-10 sm:pl-0 pr-4 sm:pr-0 pt-3 sm:pt-0">
          {heading}
        </h3>

        <p className="relative sm:absolute top-0 sm:top-[56px] left-0 sm:left-[16px] w-full sm:w-[848px] h-auto sm:h-[72px] text-[13px] sm:text-[16px] font-medium text-[#6B7280] leading-5 sm:leading-[24px] overflow-hidden px-3 sm:px-0 pt-2 sm:pt-0">
          {aboutText}
        </p>
      </div>

      <div className="w-full sm:w-[880px] h-auto sm:h-[125px] rounded-[12px] border border-[#EFEFEF] bg-white shadow-[0px_1px_4px_0px_rgba(14,22,41,0.2)] relative pb-4 sm:pb-0">
        <h3 className="relative sm:absolute top-0 sm:top-[20px] left-0 sm:left-[16px] w-full sm:w-[320px] h-auto sm:h-[30px] text-[16px] sm:text-[20px] font-semibold text-[#0E1629] leading-none px-3 sm:px-0 pt-4 sm:pt-0">
          Who Should Connect With You?
        </h3>

        <p className="relative sm:absolute top-0 sm:top-[57px] left-0 sm:left-[16px] w-full sm:w-[848px] h-auto sm:h-[48px] text-[13px] sm:text-[16px] font-medium text-[#6B7280] leading-5 sm:leading-[24px] overflow-hidden px-3 sm:px-0 pt-2 sm:pt-0">
          {whoShouldConnect}
        </p>
      </div>

    </div>
  );
};

export default ProBuddyOverviewTab;
