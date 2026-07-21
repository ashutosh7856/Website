import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, MapPin } from "lucide-react";
import { searchNEETColleges, type NEETCollegeSuggestion } from "@/api/neetV2";

interface CollegeAutocompleteProps {
  value: string;
  onChange: (college: string) => void;
  state?: string;
  placeholder?: string;
  accent?: string;
}

/**
 * Debounced college-name search box backed by GET /api/colleges.
 * Picking a suggestion sets the exact college name used for the cutoff query.
 */
export default function CollegeAutocomplete({
  value,
  onChange,
  state = "All",
  placeholder = "Search a medical college…",
  accent = "#059669",
}: CollegeAutocompleteProps) {
  const [text, setText] = useState(value);
  const [suggestions, setSuggestions] = useState<NEETCollegeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Keep local text in sync when the parent clears/sets the value externally.
  useEffect(() => {
    setText(value);
  }, [value]);

  // Debounced fetch.
  useEffect(() => {
    const q = text.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      const results = await searchNEETColleges({ q, state, limit: 8 });
      if (active) {
        setSuggestions(results);
        setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [text, state]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const pick = (college: string) => {
    setText(college);
    onChange(college);
    setOpen(false);
  };

  const clear = () => {
    setText("");
    onChange("");
    setSuggestions([]);
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full h-12 pl-10 pr-10 bg-white border border-emerald-200 rounded-xl text-base text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
        />
        {text && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear college"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && text.trim().length >= 2 && (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-emerald-100 bg-white shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: accent }} />
              Searching…
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="max-h-72 overflow-auto">
              {suggestions.map((s) => (
                <li key={`${s.college}-${s.state}`}>
                  <button
                    type="button"
                    onClick={() => pick(s.college)}
                    className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-semibold text-gray-800 leading-snug">{s.college}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      {s.state}
                      {s.type ? ` · ${s.type}` : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">No colleges found.</div>
          )}
        </div>
      )}
    </div>
  );
}
