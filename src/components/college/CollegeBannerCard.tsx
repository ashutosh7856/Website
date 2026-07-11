import React from 'react';

interface CollegeBannerProps {
  name?: string;
  location?: string;
  imageUrl?: string;
}

const CollegeBannerCard: React.FC<CollegeBannerProps> = ({
  name = "IIT Delhi",
  location = "New Delhi, Delhi",
  imageUrl = "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2866&auto=format&fit=crop"
}) => {
  return (
    <div 
      className="bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] relative flex flex-col items-center p-3 md:p-4 w-full"
    >
      <div 
        className="w-full bg-[#F5F5F5] rounded-t-[10px] md:rounded-t-[12px] overflow-hidden h-[147px] md:h-[296px]"
      >
        <img loading="lazy" decoding="async" 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-row justify-between items-end w-full px-1 mt-3 md:mt-4">
        <div className="flex flex-col gap-1">
          <h1 
            className="text-[#343C6A] font-semibold text-[18px] leading-[120%] md:text-[24px] md:leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            {name}
          </h1>
          
          <p 
            className="text-[#718EBF] font-normal text-[13px] leading-tight md:text-[16px] md:leading-3"
            style={{ fontFamily: 'Poppins' }}
          >
            {location}
          </p>
        </div>
        
        <div className="bg-[#E8F0FE] px-2.5 py-1 md:px-3 md:py-1 rounded-full shrink-0">
            <span 
              className="text-[#13097D] font-medium text-[10px] md:text-sm" 
              style={{ fontFamily: 'Poppins' }}
            >
              Top Rated
            </span>
        </div>
      </div>
    </div>
  );
};

export default CollegeBannerCard;