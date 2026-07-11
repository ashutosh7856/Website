import { ChevronDown, ChevronRight } from "lucide-react";
import { type FC } from "react";

interface Props {
  slots: string[];
  selectedSlot?: string | null;
  onSelectSlot?: (slot: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  disabledSlotIds?: Set<string>;
}

const MorningSlots: FC<Props> = ({ slots, selectedSlot = null, onSelectSlot = () => {}, isOpen = false, onToggle = () => {}, disabledSlotIds = new Set<string>() }) => {
    
  return (
    <div className="flex flex-col gap-4 bg-white border border-[#f5f5f5] shadow-md p-5 w-full rounded-[12px] hover:cursor-pointer"
    onClick={onToggle}
    >
      <div className="flex justify-between text-[#242645]">
        <p className="flex gap-6 text-[#343c6a] text-[16px] font-medium">
          <span className="bg-[#343c6a] h-6 w-6 p-0.5 rounded-md">
            <img loading="lazy" decoding="async" src="/morning.svg" alt="" className="w-5 h-5" />
          </span>
          Morning Slots
        </p>
        <button onClick={e => {
          e.stopPropagation()
          onToggle()
        }}>
          {isOpen ? (
            <ChevronDown className="w-6 h-6 text-[#3537b4] hover:cursor-pointer" />
          ) : (
            <ChevronRight className="w-6 h-6 text-[#3537b4] hover:cursor-pointer" />
          )}
        </button>
      </div>
  {isOpen && (
        <div className="flex flex-col gap-4 text-[#232323]" onClick={e => e.stopPropagation()}>
          <hr className="h-px" />
            <div className="grid lg:grid-cols-3 gap-2">
            {slots.map((u) => {
              const id = `slot-${u.replace(/[:\s-]/g, "")}`;
              const disabled = disabledSlotIds.has(id);
              return (
                <label
                  key={u}
                  htmlFor={id}
                  className={`w-[190px] py-3 px-4 flex items-center gap-3 justify-center text-[14px] text-[#232323]/50 rounded-[12px] transition-colors duration-150 ${disabled ? 'bg-[#ee1c1f]/10  cursor-not-allowed' : 'bg-[#f5f5f5] text-[rgba(35,35,35,0.8)] cursor-pointer [&:has(input:checked)]:bg-[#3537b4] [&:has(input:checked)]:text-white'}`}
                >
                  <input
                    type="radio"
                    name="slot"
                    id={id}
                    checked={selectedSlot === id}
                    onChange={() => !disabled && onSelectSlot(id)}
                    className="h-4 w-4"
                    style={{ accentColor: "#ffffff" }}
                    aria-label={`${u} AM`}
                    disabled={disabled}
                  />
                  <span className="select-none">{u} AM</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default MorningSlots;
