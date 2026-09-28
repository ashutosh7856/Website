import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { academicApi } from "@/api/academic";

export interface SearchResult {
  id: string;
  name: string;
  type: 'counsellor' | 'college';
  subtitle?: string;
  imageUrl?: string;
  description?: string;
  url: string;
}

type SearchState = {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  isSearchOpen: boolean;
  
  setQuery: (query: string) => void;
  performSearch: (query: string) => Promise<void>;
  setSearchOpen: (open: boolean) => void;
  clearResults: () => void;
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      query: "",
      results: [],
      isSearching: false,
      isSearchOpen: false,

      setQuery: (query: string) => set({ query }),

      performSearch: async (query: string) => {
        if (!query.trim()) {
          set({ results: [] });
          return;
        }

        set({ isSearching: true, query });

        try {

          const [counselorsResponse, collegesResponse] = await Promise.all([
            academicApi.searchAllLoggedOutCounsellors({ search: query }).catch((err) => {
                console.error("Counselor search failed", err);
                return { counsellors: [] };
            }),
            academicApi.getColleges().catch((err) => {
              console.error("College search failed", err);
              return [];
            }),
          ]);

          const results: SearchResult[] = [];

          if (counselorsResponse?.counsellors && Array.isArray(counselorsResponse.counsellors)) {
            counselorsResponse.counsellors.forEach((counselor: any) => {
              const fullName = `${counselor.firstName} ${counselor.lastName}`;
              results.push({
                id: counselor.counsellorId,
                name: fullName,
                type: 'counsellor',
                subtitle: `${counselor.city} • ${counselor.languagesKnow?.join(', ')}`,
                imageUrl: counselor.photoUrlSmall || undefined,
                url: `/counselors/${counselor.counsellorId}`
              });
            });
          }

          if (Array.isArray(collegesResponse)) {
            collegesResponse.forEach((college) => {
            results.push({
              id: String(college.collegeId),
              name: college.collegeName,
              type: "college",
              subtitle: [college.collegesLocationCity, college.collegesLocationState].filter(Boolean).join(" • "),
              imageUrl: college.logoUrl || undefined,
              url: `/college-details/${college.collegeId}`,
            });
            });
          }

          const searchLower = query.toLowerCase();
          const dedupedResults = results.filter((result, index, array) => {
            return array.findIndex((candidate) => candidate.type === result.type && candidate.id === result.id) === index;
          }).filter((result) => {
            return (
              result.name.toLowerCase().includes(searchLower) ||
              (result.subtitle || "").toLowerCase().includes(searchLower)
            );
          });

          dedupedResults.sort((a, b) => {
             const aExact = a.name.toLowerCase() === searchLower ? 1 : 0;
             const bExact = b.name.toLowerCase() === searchLower ? 1 : 0;
             if (aExact !== bExact) return bExact - aExact;
             
             const aStarts = a.name.toLowerCase().startsWith(searchLower) ? 1 : 0;
             const bStarts = b.name.toLowerCase().startsWith(searchLower) ? 1 : 0;
             return bStarts - aStarts;
          });

          set({ results: dedupedResults, isSearching: false });

        } catch (error) {
          console.error('Search error:', error);
          set({ results: [], isSearching: false });
        }
      },

      setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),

      clearResults: () => set({ results: [], query: "" })
    }),
    {
      name: "search-store",
      storage: createJSONStorage(() => localStorage),
      partialize: () => ({}),
    }
  )
);
