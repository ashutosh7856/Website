import { useState, useEffect, useMemo } from 'react';
import { getSates } from '@/api/auth';
import type { StatesApiResponse } from '@/types';
import { Loader2, Search, Check } from 'lucide-react';

interface StateSelectionStepProps {
  selectedStates: string[];
  onStateSelect: (stateName: string) => void;
}

// Cache for states to prevent reloading
let cachedStates: StatesApiResponse[] | null = null;
let statesFetchPromise: Promise<StatesApiResponse[]> | null = null;

export default function StateSelectionStep({ selectedStates, onStateSelect }: StateSelectionStepProps) {
  const [states, setStates] = useState<StatesApiResponse[]>(cachedStates || []);
  const [loading, setLoading] = useState(!cachedStates);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // If we already have cached data, use it
    if (cachedStates) {
      setStates(cachedStates);
      setLoading(false);
      return;
    }

    // If a fetch is already in progress, wait for it
    if (statesFetchPromise) {
      statesFetchPromise
        .then(data => {
          cachedStates = data;
          setStates(data);
          setLoading(false);
        })
        .catch(err => {
          setError(err instanceof Error ? err.message : 'Failed to fetch states');
          setLoading(false);
        });
      return;
    }

    // Start a new fetch
    const fetchStates = async () => {
      try {
        const stateData = await getSates();
        cachedStates = stateData;
        setStates(stateData);
        return stateData;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch states');
        throw err;
      } finally {
        setLoading(false);
        statesFetchPromise = null;
      }
    };

    statesFetchPromise = fetchStates();
  }, []);

  const filteredStates = useMemo(() =>
    states.filter(state =>
      state.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [states, searchTerm]
  );

  if (loading) {
    return <div className="flex justify-center items-center p-10"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="font-montserrat">
        <div className="relative mb-3 md:mb-6">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-[#FA660F]" size={18} />
            <input
                type="text"
                placeholder="Search States"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white text-[#B2B2B2] py-2 md:py-3 pl-10 md:pl-12 pr-4 text-sm md:text-base shadow-2xs focus:border-[#FA660F] focus:outline-none"
            />
        </div>

        <div className="p-1">
          <div className="grid grid-cols-2 gap-2 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStates.map((state) => {
                const isSelected = selectedStates.includes(state.name);
                return (
                    <button
                        key={state.name}
                        onClick={() => onStateSelect(state.name)}
                      className={`relative flex flex-col items-center justify-center rounded-xl border p-3 md:p-6 transition-colors duration-200 cursor-pointer ${
                            isSelected ? 'border-transparent bg-[#13097D] text-white' : 'bg-white hover:shadow-lg border-gray-200'
                        }`}
                    >
                        <img loading="lazy" decoding="async" src={state.imageStorage} alt={`${state.name} icon`} className="mb-2 md:mb-3 h-10 w-10 md:h-12 md:w-12 object-contain" />
                        <h3 className="text-xs md:text-base font-semibold text-center line-clamp-2">{state.name}</h3>
                        <div
                            className={`absolute right-2 top-2 md:right-3 md:top-3 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded border-2 ${
                                isSelected ? 'border-white bg-white text-[#13097D]' : 'border-gray-300'
                            }`}
                        >
                            {isSelected && <Check size={12} className="md:w-3.5 md:h-3.5" strokeWidth={3} />}
                        </div>
                    </button>
                );
            })}
          </div>
        </div>
    </div>
  );
}