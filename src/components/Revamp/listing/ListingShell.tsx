import { useState, type ReactNode } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from "@/components/ui/select";

type SortOption = {
  value: string;
  label: string;
};

type ListingShellProps = {
  title?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  sortValue: string;
  onSortChange: (value: string) => void;
  sortOptions: SortOption[];
  sidebar: ReactNode;
  content: ReactNode;
};

export default function ListingShell({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  sortValue,
  onSortChange,
  sortOptions,
  sidebar,
  content,
}: ListingShellProps) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-20 md:pb-8">
      <div className="mx-auto max-w-360 px-4 pt-6 md:px-15 md:pt-8">
        <div className="md:hidden">
          <div className="flex items-center gap-2 rounded-lg border border-[#D6DCE5] bg-white p-2">
            <div className="flex h-9 flex-1 items-center gap-2 rounded-md border border-[#D6DCE5] bg-white px-3">
              <Search className="h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-sm text-(--text-main) outline-none placeholder:text-[#9CA3AF]"
              />
            </div>
            <button
              onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
              className="flex h-9 items-center gap-1 rounded-md border border-[#D6DCE5] bg-white px-3 text-xs font-medium text-(--text-main)"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
          </div>

          {title ? <h1 className="mt-2 text-sm font-semibold text-(--text-main)">{title}</h1> : null}
        </div>

        <div className="mt-4 flex flex-col gap-4 md:mt-6 md:flex-row md:items-start md:gap-6">
          {/* translate3d forces Safari to keep this sticky element on its own GPU layer,
              preventing the blank-on-scroll repaint bug in Safari/WebKit. */}
          <aside className="hidden p-0 md:sticky md:top-24 md:block md:w-75 [transform:translate3d(0,0,0)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden]">
            {sidebar}
          </aside>

          <section className="min-w-0 flex-1 p-0 md:p-1">
            <div className="mb-4 hidden rounded-lg border border-[#D6DCE5] bg-white p-2 md:block">
              <div className={`flex items-center gap-4 ${title ? "justify-between" : "justify-end"}`}>
                {title ? <h2 className="text-base font-semibold text-(--text-main)">{title}</h2> : null}

                <div className="flex items-center gap-6">
                  <div className="flex h-10 w-75 items-center gap-2 rounded-md border border-[#D6DCE5] bg-white px-3">
                    <Search className="h-4 w-4 text-[#6B7280]" />
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) => onSearchChange(e.target.value)}
                      placeholder={searchPlaceholder}
                      className="w-full bg-transparent text-sm text-(--text-main) outline-none placeholder:text-[#9CA3AF]"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#525055]">Sort by:</span>
                    <Select value={sortValue} onValueChange={onSortChange}>
                      <SelectTrigger className="h-12 w-[170px] bg-white rounded-lg border border-transparent hover:border-gray-200 outline-none focus:ring-0 font-[Poppins] font-medium text-xs text-[#525055] shadow-none cursor-pointer">
                        <SelectValue placeholder={sortOptions[0]?.label ?? "Sort"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="font-[Poppins] text-xs cursor-pointer">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {content}
          </section>
        </div>

        {isMobileFiltersOpen && (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={() => setIsMobileFiltersOpen(false)}
              aria-label="Close filters"
            />
            <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl md:hidden">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#D1D5DB]" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-(--text-main)">Sort & Filter</h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="text-xs font-semibold text-[#2F43F2]"
                >
                  Done
                </button>
              </div>

              <div className="mb-4 rounded-lg border border-[#E5E7EB] bg-white p-3">
                <label className="mb-2 block text-sm font-semibold text-(--text-main)">Sort by</label>
                <Select value={sortValue} onValueChange={onSortChange}>
                  <SelectTrigger className="h-9 w-full rounded-md border border-[#D6DCE5] bg-white px-2 text-sm font-medium text-(--text-main) outline-none cursor-pointer">
                    <SelectValue placeholder={sortOptions[0]?.label ?? "Sort"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="font-[Poppins] cursor-pointer">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {sidebar}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
