import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface FilterProps {
  selectedTypes: string[];
  setSelectedTypes: React.Dispatch<React.SetStateAction<string[]>>;
  onClearFilters: () => void;
}

export default function DeadlineFilters({
  selectedTypes,
  setSelectedTypes,
  onClearFilters,
}: FilterProps) {
  const [openSection, setOpenSection] = useState<"type" | null>("type");
  
  const deadlineTypes = [
    { id: "exam", label: "Exam" },
    { id: "event", label: "Event" },
    { id: "deadline", label: "Deadline" },
    { id: "application", label: "Application" },
  ];

  const toggleType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      setSelectedTypes(selectedTypes.filter((id) => id !== typeId));
    } else {
      setSelectedTypes([...selectedTypes, typeId]);
    }
  };

  const activeFilterCount = selectedTypes.length

  const toggleSection = (section: "type") => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="hidden lg:flex sticky top-0 z-20 box-border flex-row justify-between items-center px-5 py-4 w-full h-[64px] bg-white border border-[#E6E6E6] rounded-[8px]">
        <div className="flex flex-row justify-center items-center gap-[12px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0E1629" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
            <circle cx="8" cy="6" r="2" fill="white" />
            <circle cx="16" cy="12" r="2" fill="white" />
            <circle cx="11" cy="18" r="2" fill="white" />
          </svg>
          <span className="font-[Poppins] font-semibold text-[16px] text-[#0E1629]">Filters</span>
        </div>
        {activeFilterCount > 0 && (
          <div className="flex flex-col justify-center items-center w-[24px] h-[24px] bg-[#0E1629] rounded-[4px]">
            <span className="font-[Arial] font-semibold text-[12px] text-white">{activeFilterCount}</span>
          </div>
        )}
      </div>

      {/* Deadline Type Section */}
      <div className={`box-border flex flex-col items-start mt-0 lg:mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "type" ? "pb-[16px]" : "pb-0"}`}>
        <button type="button" onClick={() => toggleSection("type")} className="box-border flex flex-row justify-between items-center px-5 py-4 w-full border-b border-[#E6E6E6] cursor-pointer">
          <span className="font-[Poppins] font-medium text-[16px] text-[#242645]">Deadline Type</span>
          {openSection === "type" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
        </button>
        {openSection === "type" && (
        <div className="flex flex-col gap-[14px] w-full px-5">
          {deadlineTypes.map((type) => {
            const isChecked = selectedTypes.includes(type.id);
            return (
              <div 
                key={type.id} 
                className="flex flex-row items-center gap-[12px] cursor-pointer" 
                onClick={() => toggleType(type.id)}
              >
                <div className={`box-border w-[18px] h-[18px] flex justify-center items-center rounded-[2px] transition-colors ${isChecked ? 'bg-[#0E1629] border-[#0E1629]' : 'bg-white border border-[#CED1D9]'}`}>
                  {isChecked && (
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={`font-[Poppins] text-[14px] leading-none ${isChecked ? 'font-medium text-[#0E1629]' : 'font-normal text-[#6B7280]'}`}>
                  {type.label}
                </span>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Fees Section */}
      {/* <div className={`box-border flex flex-col items-start mt-[12px] w-full bg-white border border-[#E6E6E6] rounded-[8px] ${openSection === "fees" ? "pb-[16px] gap-[16px]" : "pb-0 gap-0"}`}>
        <button type="button" onClick={() => toggleSection("fees")} className="box-border flex flex-row justify-between items-center px-5 py-4 w-full border-b border-[#E6E6E6] cursor-pointer">
          <span className="flex items-center gap-2 font-[Poppins] font-medium text-[16px] text-[#242645]">
            Fees
            <span className="relative group inline-flex">
              <Info
                className="w-4 h-4 text-[#9CA3AF] cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFeesTooltip((prev) => !prev);
                }}
              />
              <span className={`absolute left-1/2 -translate-x-1/2 top-full mt-1 ${showFeesTooltip ? "flex" : "hidden"} lg:group-hover:flex items-center justify-center min-w-[84px] gap-1.5 bg-[#0E1629] text-white text-[12px] leading-none rounded px-2.5 py-1.5 whitespace-nowrap z-20 shadow-[0_6px_18px_rgba(0,0,0,0.25)]`}>
                <img loading="lazy" decoding="async" src="/coin.svg" alt="coin" className="w-3 h-3" />
                <span className="font-semibold">1 = ₹1</span>
              </span>
            </span>
          </span>
          {openSection === "fees" ? <ChevronDown className="w-5 h-5 text-[#242645]" /> : <ChevronRight className="w-5 h-5 text-[#242645]" />}
        </button>
        {openSection === "fees" && (
        <div className="w-full px-5 flex flex-col gap-2">
           <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={feesRange}
            onChange={(e) => setFeesRange(Number(e.target.value))}
            className="w-full accent-[#0E1629] cursor-pointer"
           />
          <div className="flex justify-between w-full mt-2">
             <span className="font-[Poppins] text-[12px] font-medium text-[#6B7280]">0</span>
             <span className="font-[Poppins] text-[12px] font-medium text-[#0E1629]">{feesRange}</span>
             <span className="font-[Poppins] text-[12px] font-medium text-[#6B7280]">100</span>
          </div>
        </div>
      </div> */}

      <div className="hidden lg:block w-full mt-4 mb-[70px]">
        <button
          onClick={onClearFilters}
          disabled={activeFilterCount === 0}
          className={`w-full h-[48px] rounded-[8px] font-[Poppins] font-medium text-[16px] transition-all border outline-none ${
            activeFilterCount > 0
              ? 'bg-white border-[#0E1629] text-[#0E1629] hover:bg-[#F8F9FA] cursor-pointer'
              : 'bg-[#F9F9F9] border-[#E6E6E6] text-[#A0A0A0] cursor-not-allowed'
          }`}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}