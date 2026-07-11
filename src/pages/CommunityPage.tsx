import { useState } from "react";
import CommunityActions from "@/components/community/CommunityActions";
import DashboardFeed from "@/components/community/DashboardFeed";
import CategorySidebar from "@/components/community/CategorySidebar";
import PageSEO from "@/components/SEO/PageSEO";

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <>
      <PageSEO
        title="Community – Ask Questions & Get Answers on Admissions"
        description="Join the ProCounsel community to ask questions, share experiences, and get answers about college admissions, JEE, NEET, study abroad, and career guidance from students and experts."
        canonical="/community"
        keywords="college admissions Q&A, JEE NEET student community, career guidance forum india, study abroad community"
      />
    <div className="bg-gray-50 min-h-screen p-4 md:p-8">
      <h1 className="sr-only">ProCounsel Community — Ask Questions &amp; Get Answers on Admissions, Exams &amp; Careers</h1>
      <div className="max-w-[1440px] mx-auto flex justify-center gap-3">
        <div className="hidden lg:block w-[191px] shrink-0">
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
        <div className="flex flex-col w-full max-w-[800px] shrink-0">
          <div className="w-full">
            <CommunityActions />
          </div>

          <div className="mt-4 w-full">
            <DashboardFeed selectedCategory={selectedCategory} />
          </div>

        </div>
        <div className="hidden xl:block w-[250px] shrink-0">
          {/* <RightSideAds /> */}
        </div>

      </div>
    </div>
    </>
  );
}