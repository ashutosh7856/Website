import { Star } from "lucide-react";

export interface StoryItem {
  name: string;
  role: string;
  rating: number;
  text: string;
  image: string;
}

function RatingStars({ rating }: { rating: number }) {
  const stars = Array.from({ length: 5 }, (_, index) => {
    const fillPercent = Math.max(0, Math.min(100, (rating - index) * 100));
    return { key: index, fillPercent };
  });

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <div key={star.key} className="relative h-4 w-4">
          <Star className="absolute inset-0 h-4 w-4 text-[#D1D5DB]" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${star.fillPercent}%` }}
          >
            <Star className="h-4 w-4 text-[#FBBF24]" fill="#FBBF24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StoriesCard({ active, story }: { active: boolean; story: StoryItem }) {
  return (
    <div
      className={`relative shrink-0 w-[290px] h-[181px] md:w-auto md:h-auto ${active ? "md:min-h-[320px] xl:min-h-[362px]" : "md:min-h-[286px] xl:min-h-[317px]"} ${active ? "md:max-w-[420px] xl:max-w-[498px]" : "md:max-w-[320px] xl:max-w-[370px]"}
    ${active ? "bg-[#0E1629] md:bg-(--text-main)" : "bg-white"} rounded-[15px]
    md:py-7 xl:py-9 md:px-4 flex flex-col md:gap-5 xl:gap-[30px]
    `}
    >
      {/* --- MOBILE VIEW --- */}
      <div className="md:hidden flex flex-col p-[12px] w-full h-full">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-[10px]">
            <img loading="lazy" decoding="async" src={story.image} alt={story.name} className="w-[36px] h-[36px] rounded-full object-cover"/>
            <div className="flex flex-col">
              <h3 className={`${active ? "text-white" : "text-[#0E1629]"} font-[Poppins] font-semibold text-[16px] leading-none`}>{story.name}</h3>
              <p className={`${active ? "text-white" : "text-[#6B7280]"} font-[Poppins] font-normal text-[12px] leading-none mt-1`}>{story.role}</p>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <RatingStars rating={story.rating} />
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <p className={`${active ? "text-white" : "text-[#0E1629]"} font-[Poppins] font-medium text-[14px] leading-none text-left`}>It was a very good experience</p>
          <p className={`${active ? "text-white" : "text-[#6B7280]"} font-[Poppins] font-normal text-[12px] leading-[1.3] text-left line-clamp-3`}>
            {story.text}
          </p>
        </div>
      </div>

      <div className="hidden md:flex justify-between w-full">
        <div className="flex items-center gap-4">
          <img loading="lazy" decoding="async" src={story.image} alt={story.name} className={`${active ? "h-[72px] w-[72px] xl:h-20 xl:w-20" : "w-[64px] h-[64px] xl:w-[75px] xl:h-[75px]"} rounded-full object-cover`}/>

          <div className="flex flex-col">
            <h3 className={`${active ? "text-[24px] xl:text-[30px] text-white": "text-[20px] xl:text-[22.5px] text-(--text-main) " } font-semibold`}>{story.name}</h3>
            <p className={`${active ? "text-white text-[17px] xl:text-[22px]" : "text-(--text-muted) text-[14px] xl:text-[15px]"} font-normal`}>{story.role}</p>
          </div>
        </div>

        <div className="flex items-end gap-2">
            <RatingStars rating={story.rating} />
        </div>
      </div>

      <div className="hidden md:flex flex-col gap-4 items-center w-full">
        <p className={`${active ? "text-[21px] xl:text-2xl text-white": "text-(--text-main) text-[19px] xl:text-[22.5px]"} font-medium`}>It was a very good experience</p>
        <p className={`text-center ${active ? "text-white text-[14px] xl:text-[1rem]" : "text-[13px] xl:text-sm text-(--text-muted)"} font-normal`}>{story.text}</p>
      </div>
    </div>
  );
}