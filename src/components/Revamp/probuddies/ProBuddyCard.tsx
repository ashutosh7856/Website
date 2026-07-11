import { encodeCounselorId } from "@/lib/utils";
import { Star, GraduationCap, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface ProBuddyCardProps {
  id:string
  name: string;
  imageUrl: string;
  rating: number;
  yearLabel: string;
  city: string;
  proCoins?: number;
}

export default function ProBuddyCard({
  id,
  name,
  imageUrl,
  rating,
  yearLabel,
  city,
  proCoins,
}: ProBuddyCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const displayImage =
    imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "ProBuddy")}&background=6B7280&color=ffffff&size=400`;

  return (
    <Link
      to={`/pro-buddies/profile/${encodeCounselorId(id)}`}
      className="relative cursor-pointer shrink-0 block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="md:hidden relative w-50 h-68.75 cursor-pointer shrink-0">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 244 367"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M234.615 0C239.798 5.03664e-06 244 5.83355 244 13.0296V300C244 306.627 238.627 312 232 312H203.381C197.421 312 192.364 316.375 191.506 322.273L186.494 356.727C185.636 362.625 180.579 367 174.619 367H9.38461C4.20164 367 6.61314e-08 361.166 0 353.97V13.0296C1.66273e-06 5.83355 4.20164 2.62325e-07 9.38461 0H234.615Z"
            fill="white"
          />
        </svg>

        <div className="w-full relative h-full p-3 flex flex-col">
          <div className="absolute top-5 left-5 flex items-center gap-1 z-10">
            <Star size={16} fill="#0E1629" className="text-[#0E1629]" />
            <p className="font-[Poppins] font-medium text-[12px] text-[#0E1629] tracking-[0.28px]">
              {rating?.toFixed(1) || "N/A"}
            </p>
          </div>

          <img
            src={displayImage}
            alt={name}
            loading="lazy"
            decoding="async"
            width={176}
            height={135}
            className="w-44 h-33.75 rounded-[10px] object-cover shrink-0"
          />

          <div className="mt-2">
            <p className="font-[Poppins] font-medium text-[16px] text-[#0E1629] leading-normal truncate">
              {name}
            </p>
          </div>

          <div className="flex flex-col gap-1 mt-1.5">
            <div className="flex items-center gap-1">
              <GraduationCap size={16} className="text-[#6B7280] shrink-0" strokeWidth={1.5} />
              <p className="font-[Poppins] font-normal text-[12px] text-[#6B7280] truncate">
                {yearLabel || "1st year"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={16} className="text-[#6B7280] shrink-0" strokeWidth={1.5} />
              <p className="font-[Poppins] font-normal text-[12px] text-[#6B7280] truncate">
                {city || "Not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-1.5">
            <div className="w-6 h-6 flex items-center justify-center">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-full h-full" />
            </div>
            <p className="font-[Poppins] font-medium text-[14px] text-[#0E1629]">
              {proCoins ?? "NA"} ProCoins
            </p>
          </div>
        </div>

        <div className="absolute -right-px bottom-[1.5px] overflow-hidden w-10.75 h-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="43"
            height="40"
            viewBox="0 0 43 40"
            preserveAspectRatio="none"
            fill="none"
            className="w-10.75 h-10 transition-all duration-300"
          >
            <path
              d="M4.95793 6.43108C5.7058 2.69168 8.98912 0 12.8026 0H34.2441C38.6623 0 42.2441 3.58172 42.2441 8V32C42.2441 36.4183 38.6623 40 34.2441 40H8.00258C2.95421 40 -0.832141 35.3814 0.157926 30.4311L4.95793 6.43108Z"
              fill={isHovered ? "white" : "#0E1629"}
              className="transition-colors duration-300"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-7.5 opacity-0" : "translate-x-0 opacity-100"
                }`}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-0 opacity-100" : "-translate-x-7.5 opacity-0"
                }`}
              style={{ filter: "brightness(0)" }}
            />
          </div>
        </div>
      </div>

      <div className="hidden md:block relative w-61 h-91.75">
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 244 367"
          preserveAspectRatio="none"
          fill="none"
        >
          <path
            d="M234.615 0C239.798 5.03664e-06 244 5.83355 244 13.0296V300C244 306.627 238.627 312 232 312H203.381C197.421 312 192.364 316.375 191.506 322.273L186.494 356.727C185.636 362.625 180.579 367 174.619 367H9.38461C4.20164 367 6.61314e-08 361.166 0 353.97V13.0296C1.66273e-06 5.83355 4.20164 2.62325e-07 9.38461 0H234.615Z"
            fill="white"
          />
        </svg>

        <div className="w-full relative h-full p-3 flex flex-col">
          <div className="absolute top-5 left-5 flex items-center gap-1 z-10">
            <Star size={16} fill="#0E1629" className="text-[#0E1629]" />
            <p className="font-[Poppins] font-medium text-[14px] text-[#0E1629] tracking-[0.28px]">
              {rating?.toFixed(1) || "N/A"}
            </p>
          </div>

          <img
            src={displayImage}
            alt={name}
            loading="lazy"
            decoding="async"
            width={220}
            height={208}
            className="w-55 h-52 rounded-[10px] object-cover shrink-0"
          />

          <div className="mt-2">
            <p className="font-[Poppins] font-medium text-[18px] text-[#0E1629] leading-normal truncate">
              {name}
            </p>
          </div>

          <div className="flex flex-col gap-1 mt-3">
            <div className="flex items-center gap-1">
              <GraduationCap size={16} className="w-5 h-5 text-[#6B7280] shrink-0" strokeWidth={1.5} />
              <p className="font-[Poppins] font-normal text-[14px] text-[#6B7280] truncate">
                {yearLabel || "1st year"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <MapPin size={16} className="w-5 h-5 text-[#6B7280] shrink-0" strokeWidth={1.5} />
              <p className="font-[Poppins] font-normal text-[14px] text-[#6B7280] truncate">
                {city || "Not specified"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-full h-full" />
            </div>
            <p className="font-[Poppins] font-medium text-[16px] text-[#0E1629]">
              {(proCoins !== null && proCoins! > 0) ? proCoins : "NA"} ProCoins
            </p>
          </div>
        </div>

        <div className="absolute -right-px bottom-[1.5px] overflow-hidden w-13.25 h-12.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 50"
            preserveAspectRatio="none"
            fill="none"
            className="w-13.25 h-12.5 transition-all duration-300"
          >
            <path
              d="M4.1 7.05536C4.57855 3.03083 7.99114 0 12.044 0H43.9934C48.4117 0 51.9934 3.58172 51.9934 8V42C51.9934 46.4183 48.4117 50 43.9934 50H8.00107C3.20833 50 -0.508886 45.8146 0.0570345 41.0554L4.1 7.05536Z"
              fill={isHovered ? "white" : "#0E1629"}
              className="transition-colors duration-300"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5">
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-7.5 opacity-0" : "translate-x-0 opacity-100"
                }`}
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <img loading="lazy" decoding="async"
              src="/arrow.svg"
              alt="arrow"
              className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-0 opacity-100" : "-translate-x-7.5 opacity-0"
                }`}
              style={{ filter: "brightness(0)" }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}




export function ProbuddyPhoneListinCard(
  {
    id,
    name,
    imageUrl,
    rating,
    yearLabel,
    city,
    proCoins,
  }: ProBuddyCardProps
) {
  const [isHovered, setIsHovered] = useState(false);
  const displayImage =
    imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "ProBuddy")}&background=6B7280&color=ffffff&size=400`;

  return <Link
    to={`/pro-buddies/profile/${id}`}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    className="md:hidden relative w-42.25 h-66.5 cursor-pointer shrink-0 block">
   <svg className="absolute inset-0 w-full h-full" width="169" height="266" viewBox="0 0 169 266" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M162.5 0C166.09 3.65054e-06 169 4.22813 169 9.44379V209C169 215.627 163.627 221 157 221H137.838C132.117 221 127.192 225.038 126.071 230.647L120.929 256.353C119.808 261.962 114.883 266 109.162 266H6.5C2.91015 266 4.58041e-08 261.772 0 256.556V9.44379C1.15165e-06 4.22813 2.91015 1.90132e-07 6.5 0H162.5Z" fill="white"/>
</svg>


    <div className="absolute inset-0 z-10 w-full h-full p-3 flex flex-col">
      <div className="absolute top-5 left-5 flex items-center gap-1 z-10">
        <Star size={16} fill="#0E1629" className="text-[#0E1629]" />
        <p className="font-[Poppins] font-medium text-[12px] text-[#0E1629] tracking-[0.28px]">
          {rating?.toFixed(1) || "N/A"}
        </p>
      </div>

      <img
        src={displayImage}
        alt={name}
        loading="lazy"
        decoding="async"
        width={169}
        height={135}
        className="w-full h-33.75 rounded-[10px] object-cover shrink-0"
      />

      <div className="mt-2">
        <p className="font-[Poppins] font-medium text-[16px] text-[#0E1629] leading-normal truncate">
          {name}
        </p>
      </div>

      <div className="flex flex-col gap-1 mt-1.5">
        <div className="flex items-center gap-1">
          <GraduationCap size={16} className="text-[#6B7280] shrink-0" strokeWidth={1.5} />
          <p className="font-[Poppins] font-normal text-[12px] text-[#6B7280] truncate">
            {yearLabel || "1st year"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <MapPin size={16} className="text-[#6B7280] shrink-0" strokeWidth={1.5} />
          <p className="font-[Poppins] font-normal text-[12px] text-[#6B7280] truncate">
            {city || "Not specified"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-1.5">
        <div className="w-6 h-6 flex items-center justify-center">
          <img loading="lazy" decoding="async" src="/coin.svg" alt="procoin_icon" className="w-full h-full" />
        </div>
        <p className="font-[Poppins] font-medium text-[14px] text-[#0E1629]">
          {proCoins ?? "NA"} ProCoins
        </p>
      </div>
    </div>

    <div className="absolute -right-px bottom-[1.5px] overflow-hidden w-10.75 h-10">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="43"
        height="40"
        viewBox="0 0 43 40"
        preserveAspectRatio="none"
        fill="none"
        className="w-10.75 h-10 transition-all duration-300"
      >
        <path
          d="M4.95793 6.43108C5.7058 2.69168 8.98912 0 12.8026 0H34.2441C38.6623 0 42.2441 3.58172 42.2441 8V32C42.2441 36.4183 38.6623 40 34.2441 40H8.00258C2.95421 40 -0.832141 35.3814 0.157926 30.4311L4.95793 6.43108Z"
          fill={isHovered ? "white" : "#0E1629"}
          className="transition-colors duration-300"
        />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
        <img loading="lazy" decoding="async"
          src="/arrow.svg"
          alt="arrow"
          className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-7.5 opacity-0" : "translate-x-0 opacity-100"
            }`}
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <img loading="lazy" decoding="async"
          src="/arrow.svg"
          alt="arrow"
          className={`absolute inset-0 w-full h-full transition-all duration-600 ${isHovered ? "translate-x-0 opacity-100" : "-translate-x-7.5 opacity-0"
            }`}
          style={{ filter: "brightness(0)" }}
        />
      </div>
    </div>
  </Link>
}

