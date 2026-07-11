interface Guide {
  name: string;
  description: string;
  image: string;
  reverse: boolean;
}

interface GuideCardProps {
  guide: Guide;
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <div
      className="w-full mx-auto shadow-sm border-[1.8px] border-[#13097D26] 
        rounded-xl bg-white p-4
        flex flex-col lg:flex-row
      "
    >

      <div
        className={`
          flex lg:hidden w-full 
          ${guide.reverse ? "flex-row-reverse" : "flex-row"}
          items-center gap-3
        `}
      >
        <img loading="lazy" decoding="async"
          src={guide.image}
          alt={guide.name}
          className="w-[60px] h-[60px] rounded-[4px] object-cover"
        />

        <h3 className="text-[16px] font-semibold text-[#343C6A]">
          {guide.name}
        </h3>
      </div>

      <p
        className="
          lg:hidden mt-3 text-[12px] text-[#718EBF] 
          leading-[120%] text-left
        "
      >
        {guide.description}
      </p>

      <div
        className={`
          hidden lg:block p-4 flex-shrink-0
          ${guide.reverse ? "order-2" : "order-1"}
        `}
      >
        <div className="w-[180px] h-[160px] rounded-lg overflow-hidden">
          <img loading="lazy" decoding="async"
            src={guide.image}
            alt={guide.name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div
        className={`
          hidden lg:flex flex-col justify-center flex-grow
          ${guide.reverse ? "order-1 lg:pl-10" : "order-2 lg:pr-10"}
        `}
      >
        <h3 className="text-[24px] font-semibold text-[#343C6A] mb-2">
          {guide.name}
        </h3>

        <p className="text-[16px] text-[#718EBF] leading-[125%] lg:h-[80px]">
          {guide.description}
        </p>
      </div>
    </div>
  );
}
