import type { ListingProBudddy } from "@/types/probuddies";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { formatAcademicYearLabel } from "@/lib/utils";
import { SeeAllButton } from "../components/LeftRightButton";
import ProBuddyCard from "./ProBuddyCard";

interface param {
  probuddyList: ListingProBudddy[];
  isLoading?: boolean;
}

export default function ProBuddiesSection({ probuddyList, isLoading = false }: param) {
  const navigate = useNavigate();
  const hasAnimated = useRef(false);
  const displayBuddies = probuddyList.slice(0, 5);

  if (displayBuddies.length > 0 && !hasAnimated.current) {
    hasAnimated.current = true;
  }
  const shouldAnimate = !hasAnimated.current;

  const containerVariants = shouldAnimate
    ? {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.05 },
        },
      }
    : {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      };

  const cardVariants = shouldAnimate
    ? {
        hidden: { opacity: 0, y: 24, scale: 0.97 },
        visible: { opacity: 1, y: 0, scale: 1 },
      }
    : {
        hidden: { opacity: 1, y: 0, scale: 1 },
        visible: { opacity: 1, y: 0, scale: 1 },
      };

  return (
    <div className="w-full py-6 md:py-10">
      <div className="max-w-360 mx-auto pl-4 pr-0 md:px-15">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-10 gap-3 md:gap-0">
          <div className="flex items-center justify-center gap-2 bg-white px-3 py-1 rounded-md h-7 shrink-0">
            <div className="bg-(--text-main) h-4 w-4 md:h-5 md:w-5"></div>
            <p className="font-[Poppins] font-semibold text-[12px] md:text-[14px] text-[#0E1629] uppercase tracking-[0.07em] md:tracking-wider leading-none md:leading-normal">
              PROBUDDIES
            </p>
          </div>

          <h2 className="text-(--text-main) text-xs md:text-2xl font-medium max-w-202.75 leading-snug md:leading-normal">
            Discover curated programs across mental wellness, assessments,
            admissions, and upskilling led by experienced professionals, built
            around your needs.
          </h2>
        </div>

        {isLoading ? (
          <div className="flex gap-3 md:gap-6 justify-start md:justify-center overflow-x-auto pb-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`probuddy-skeleton-${index}`} className="relative w-42.25 h-66.5 md:w-61 md:h-91.75 shrink-0">
                <div className="absolute inset-0 rounded-[10px] bg-white animate-pulse" />
                <div className="absolute inset-0 z-10 flex flex-col p-3">
                  <div className="h-33.75 w-full rounded-[10px] bg-gray-200 shrink-0" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-gray-200" />
                  <div className="flex flex-col gap-1 mt-1.5">
                    <div className="h-3 w-3/5 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="w-6 h-6 rounded-full bg-gray-200" />
                    <div className="h-4 w-20 rounded bg-gray-200" />
                  </div>
                </div>
                <div className="absolute -right-px bottom-[1.5px] overflow-hidden w-10.75 h-10 md:w-13.25 md:h-12.5">
                  <div className="w-full h-full rounded-tr-[20px] rounded-br-[20px] bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : displayBuddies.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-3 md:gap-6 justify-start md:justify-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2"
          >
            {displayBuddies.map((buddy) => (
              <motion.div key={buddy.proBuddyId} variants={cardVariants} className="shrink-0">
                <ProBuddyCard
                  id={buddy.proBuddyId as string}
                  name={`${buddy.firstName ?? ""} ${buddy.lastName ?? ""}`.trim()}
                  imageUrl={buddy.photoUrl ?? ""}
                  rating={Number(buddy.rating) ?? 0.0}
                  yearLabel={formatAcademicYearLabel(buddy.currentYear, "1st year")}
                  city={buddy.city ?? ""}
                  proCoins={Number(buddy.ratePerMinute) ?? 0}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex justify-center min-h-45 md:min-h-70 items-center">
            <p className="font-[Poppins] text-[14px] text-[#6B7280]">No ProBuddies available right now</p>
          </div>
        )}

        <div className="flex justify-end mt-4 pr-4 pb-2 md:pb-0 w-full">
          <div className="scale-[0.9] md:scale-100 origin-right">
            <SeeAllButton onClick={() => navigate("/pro-buddies/listing")} />
          </div>
        </div>
      </div>
    </div>
  );
}
