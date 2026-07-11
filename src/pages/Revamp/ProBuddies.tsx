import { probuddiesApi } from "@/api/pro-buddies";
import AdvantageSection from "@/components/Revamp/probuddies/AdvantageSection";
import CollegeSection from "@/components/Revamp/probuddies/CollegeSection";
import ProBuddiesSection from "@/components/Revamp/probuddies/ProBuddiesSection";
import Stories from "@/components/Revamp/probuddies/Stories";
import { useAuthStore } from "@/store/AuthStore";
import { useQuery } from "@tanstack/react-query";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { probuddiesContent } from "@/components/SEO/seoContent";

const proBuddyHighlights = [
  {
    title: "Real insider perspective",
    description: "Talk to current students who know the campus, branch, hostel, and classroom reality.",
  },
  {
    title: "Know before you go",
    description: "See what life is actually like at a college before you make a final choice.",
  },
  {
    title: "Peer-to-peer admission help",
    description: "Get guidance on exams, documents, and interviews from someone who has done it.",
  },
];

const proBuddyStories = [
  {
    name: "Ashutosh",
    role: "Student",
    rating: 5,
    text: "Talking to a real senior about campus life cleared so many doubts. The advice was honest and practical, nothing like what you find online.",
    image: "/review1.webp",
  },
  {
    name: "Ananya",
    role: "Student",
    rating: 5,
    text: "My ProBuddy helped me understand hostel life, branch choices, and placements in one call. Felt like talking to an elder sibling, not a stranger.",
    image: "/review2.webp",
  },
  {
    name: "Shubham",
    role: "Student",
    rating: 4.5,
    text: "I was confused between two colleges and one session with a ProBuddy made it so much clearer. Real insights from someone who actually lived it.",
    image: "/review3.webp",
  },
];

export default function ProBuddies() {
  const {userId} = useAuthStore()
  const { data: probuddies = [], isLoading: isProbuddiesLoading } = useQuery({
    queryKey: ['revamp-probuddies', userId],
    queryFn: () => probuddiesApi.listing(userId as string),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: colleges = [], isLoading: isCollegesLoading } = useQuery({
    queryKey: ['revamp-probuddies-colleges', userId],
    queryFn: () => probuddiesApi.getColleges(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });




  return (
    <>
      <PageSEO
        title="ProBuddies – Connect with College Seniors & Peer Mentors"
        description="ProBuddies connects aspiring students with college seniors for real guidance on admissions, campus life, and course selection. Find your ProBuddy today."
        canonical="/pro-buddies"
        keywords="probuddy, college senior mentors, peer mentorship india, campus life guidance, admission peer help"
      />
    <div className="">
        <div className="w-full bg-[url('/probuddiesbg.webp')] bg-cover bg-center">
      <div className="w-full bg-[#0E1629A6]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-5 px-4 py-10 text-center md:gap-6 md:px-8 md:py-14">
          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            Peer mentorship from real students
          </div>

          <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white md:text-5xl">
            Find a ProBuddy for honest college guidance.
          </h1>

          <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-lg md:leading-8">
            ProBuddies are verified college seniors who share real campus insights, admission advice, hostel tips, and the small details that brochures miss.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {proBuddyHighlights.map((item) => (
              <div
                key={item.title}
                className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-medium text-white/90 backdrop-blur-sm md:px-4"
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className=" bg-[#C6DDF040] flex flex-col pb-20">
      <CollegeSection colleges={colleges} isLoading={isCollegesLoading} />
      <ProBuddiesSection probuddyList={probuddies} isLoading={isProbuddiesLoading} />
      <AdvantageSection/>
      <Stories stories={proBuddyStories} />
    </div>

    <SeoArticle {...probuddiesContent} eyebrow="ProBuddies Guide" />

    </div>
    </>
  );
}
