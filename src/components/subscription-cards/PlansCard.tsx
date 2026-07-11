import { useState } from "react";
import PlansDrawer from "./PlansDrawer";
import { Check, X } from "lucide-react";
import type { CounselorDetails } from "@/types";
import type { SubscribedCounsellor } from "@/types/user";

type PlansResponse = {
  benefits?: Array<any>;
  elite?: string[];
  pro?: string[];
  plus?: string[];
  prices?: { elite?: string; pro?: string; plus?: string };
  seats?: { elite?: string; pro?: string; plus?: string };
  desc?: { elite?: string; pro?:string; plus?: string };
};

function ValueCell({ value }: { value: any }) {
  const isTrue = value === true || value === "true";
  const isFalse = value === false || value === "false";

  if (isTrue)
    return (
      <span className="inline-flex items-center justify-center w-full">
        <Check size={14} className="text-[#07B02E] md:size={16}" />
      </span>
    );
  if (isFalse)
    return (
      <span className="inline-flex items-center justify-center w-full">
        <X size={14} className="text-[#FF3B30] md:size={16}" />
      </span>
    );

  return (
    <span className="inline-flex items-center justify-center w-full text-[#13097D] font-medium text-xs md:text-sm">
      {String(value ?? "-")}
    </span>
  );
}

export default function PlansCard({ 
  plan, 
  counselor, 
  isUpgrade, 
  currentPlan,
  initialSelectedPlan
}: { 
  plan?: PlansResponse, 
  counselor?: CounselorDetails,
  isUpgrade?: boolean,
  currentPlan?: SubscribedCounsellor | null,
  initialSelectedPlan?: string | null
}) {
  const columns: Array<{ key: string; title: string; icon?: string }> = [
    { key: "plus", title: "Plus", icon: "/plusIcon.svg" },
    { key: "pro", title: "Pro", icon: "/proIcon.svg" },
    { key: "elite", title: "Elite", icon: "/eliteIcon.svg" },
  ];
  const [selected, setSelected] = useState<string | null>(initialSelectedPlan || "elite");
  const [drawerOpen, setDrawerOpen] = useState(!!initialSelectedPlan);
  const planHierarchy = ['plus','pro','elite'];

  const formatPlanPrice = (priceString: string | undefined): string => {
    if (priceString == null || priceString.trim() === '') return 'N/A';
    const priceNum = Number(priceString);
    if (isNaN(priceNum) || priceNum === 0) {
        return 'N/A';
    }
    return priceString;
  };

  const currentPlanIndex = (isUpgrade && currentPlan?.plan)
    ? planHierarchy.indexOf(currentPlan.plan.toLowerCase())
    : -1;

  const rowHeight = "h-14 md:h-16"; 
  const headerRowHeight = "h-20 md:h-24";

  const selectedPlanPrice = formatPlanPrice((plan?.prices as any)?.[selected ?? ""]);
  const isSelectedPlanAvailable = selectedPlanPrice !== 'N/A';

  return (
    <div className="bg-white w-full max-w-[1092px] p-2 md:pl-6 md:pr-6 md:py-6 rounded-[20px]">
      <div>
        <div className="flex flex-row">
          <div className="w-1/3 max-w-[280px] md:w-[333px] pr-2 md:pr-4">
            <div className={`flex flex-col justify-start ${headerRowHeight}`}>
              <h1 className="text-[#343C6A] text-base md:text-2xl font-semibold">Benefits</h1>
              <p className="text-[#232323] text-xs md:text-base font-normal mt-1">
                To drive your passion
              </p>
            </div>
            
            <div className="flex flex-col">
              {plan?.benefits?.map((benefit, idx) => (
                <div
                  key={idx}
                  className={`text-[#232323] text-xs md:text-sm font-medium py-1.5 flex items-center ${rowHeight}`}
                >
                  {benefit.name ?? "-"}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-row gap-1 md:gap-6">
            {columns.map((col) => {
              const isSelected = selected === col.key;
              const columnIndex = planHierarchy.indexOf(col.key);
              const isDisabled = isUpgrade && currentPlanIndex != -1 && columnIndex <= currentPlanIndex;
              return (
                <button
                  key={col.key}
                  type="button"
                  disabled={isDisabled}
                  aria-disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setSelected(isSelected ? null : col.key)
                  }}
                  className={`flex-1 p-2 md:p-4 transition-colors duration-150 rounded-2xl text-center border-2 box-border hover:cursor-pointer ${
                    isSelected
                      ? "border-[#EC5E1A] bg-linear-to-b from-[#FFF4EB] to-[#FFF1E6]"
                      : "border-transparent bg-transparent"
                  } ${
                    isDisabled ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  aria-pressed={isSelected}
                >
                  <div className={`flex flex-col items-center ${headerRowHeight}`}>
                    <div
                      className={`flex gap-1 md:gap-2.5 text-base md:text-2xl font-normal items-center ${
                        isSelected ? "text-[#EC5E1A]" : "text-[#13097D]"
                      }`}
                    >
                      <img loading="lazy" decoding="async"
                        src={col.icon}
                        alt=""
                        className="h-4 w-4 md:h-5 md:w-5 object-contain"
                      />
                      {col.title}
                    </div>
                    <p
                      className={`flex items-center gap-1 ${
                        isSelected ? "text-[#EC5E1A]" : "text-[#13097D]"
                      } text-sm md:text-xl font-semibold mt-1`}
                    >
                      <img loading="lazy" decoding="async" src="/coin.svg" alt="" className="inline" />
                      {formatPlanPrice((plan?.prices as any)?.[col.key])}
                    </p>
                  </div>

                  <div className="w-full">
                    {plan?.benefits?.map((benefit, idx) => (
                      <div
                        key={`${col.key}-${idx}`}
                        className={`py-1.5 text-xs md:text-sm text-center font-semibold w-full flex items-center justify-center ${rowHeight}`}
                      >
                        <ValueCell value={(benefit as any)[col.key]} />
                      </div>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-12 flex justify-center">
        <button
          type="button"
          onClick={() => {
            if (!selected || !isSelectedPlanAvailable) return;
            setDrawerOpen(true);
          }}
          className={`w-full lg:w-[586px] h-12 rounded-md text-base md:text-lg font-semibold transition-colors duration-150 ${
            selected && isSelectedPlanAvailable
              ? "bg-[#EC5E1A] text-white hover:cursor-pointer"
              : "bg-white text-[#EC5E1A] border border-[#EC5E1A] opacity-50 cursor-not-allowed"
          }`}
          disabled={!selected || !isSelectedPlanAvailable}
        >
          Buy Membership
        </button>
      </div>

      <PlansDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        planKey={selected}
        plan={plan}
        planTitle={columns.find((c) => c.key === selected)?.title}
        price={(plan?.prices as any)?.[selected ?? ""]}
        counselor={counselor}
        isUpgrade={isUpgrade}
        currentPlan={currentPlan}
      />
    </div>
  );
}

