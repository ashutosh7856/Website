import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { academicApi } from '@/api/academic';
import type { CollegeDetails } from '@/types';
import PageSEO from '@/components/SEO/PageSEO';
import CollegeBannerCard from '@/components/college/CollegeBannerCard';
import CollegeTabs from '@/components/college/CollegeTabs';
import AdmissionCard from '@/components/college/AdmissionCard';
// import CollegeMapCard from '@/components/college/CollegeMapCard';
import InfoTab from '@/components/college/tabs/InfoTab';
import CoursesTab from '@/components/college/tabs/CoursesTab';
import CounsellorsTab from '@/components/college/tabs/CounsellorsTab';
import InfrastructureTab from '@/components/college/tabs/InfrastructureTab';
import ScholarshipsTab from '@/components/college/tabs/ScholarshipsTab';
import EventsTab from '@/components/college/tabs/EventsTab';
import AluminiTab from '@/components/college/tabs/AluminiTab';
import ExamsTab from '@/components/college/tabs/ExamsTab';
import ImportantDatesTab from '@/components/college/tabs/ImportantDatesTab';

const CollegeDetailsPageNew = () => {
  const { id } = useParams();
  const collegeTabStorageKey = id ? `college-details-active-tab:${id}` : 'college-details-active-tab';

  const [activeTab, setActiveTab] = useState(() => {
    if (!id) return 'Info';

    try {
      return sessionStorage.getItem(collegeTabStorageKey) || 'Info';
    } catch {
      return 'Info';
    }
  });
  const [collegeData, setCollegeData] = useState<CollegeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollegeDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await academicApi.getCollegeById(id);
        setCollegeData(response);
      } catch (error) {
        console.error("Failed to fetch college details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollegeDetails();
  }, [id]);

  useEffect(() => {
    if (!id) {
      setActiveTab('Info');
      return;
    }

    try {
      setActiveTab(sessionStorage.getItem(collegeTabStorageKey) || 'Info');
    } catch {
      setActiveTab('Info');
    }
  }, [collegeTabStorageKey, id]);

  useEffect(() => {
    if (!id) return;

    try {
      sessionStorage.setItem(collegeTabStorageKey, activeTab);
    } catch {
      // Ignore sessionStorage failures and keep the in-memory tab state.
    }
  }, [activeTab, collegeTabStorageKey, id]);

  const renderTabContent = () => {
    if (!collegeData) return null;

    switch (activeTab) {
      case "Info":
        return <InfoTab data={collegeData} />;
      case "Courses":
        return <CoursesTab />;
      case "Counsellors":
        return <CounsellorsTab />;
      case "Infrastructure":
        return <InfrastructureTab />;
      case "Scholarships":
        return <ScholarshipsTab />;
      case "Events":
        return <EventsTab />
      case "Alumini":
        return <AluminiTab />
      case "Exams":
        return <ExamsTab />
      case "Important Dates":
        return <ImportantDatesTab />;
      default:
        return (
          <div className="p-4 min-h-[300px] rounded-lg flex items-center justify-center text-gray-400">
            Content for {activeTab} coming soon...
          </div>
        );
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!collegeData) {
    return <div className="min-h-screen flex items-center justify-center">College not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <PageSEO
        title={`${collegeData.collegeName} — Admissions, Courses, Cutoffs & Reviews | ProCounsel`}
        description={`Explore ${collegeData.collegeName}: courses, fees, admissions, cutoffs, scholarships, placements and reviews. Get expert admission counselling from ProCounsel.`}
        canonical={`/college-details/${id}`}
      />
      <div className="max-w-7xl mx-auto md:mt-14 px-4 md:px-8 md:pt-10">
        <div className="mb-6 md:mb-8">
          
          <p 
            className="text-[#8C8CA1] font-medium mt-1 md:mt-2 text-[14px] md:text-[18px] leading-[135%] md:leading-[125%]"
            style={{ fontFamily: 'Montserrat' }}
          >
            Discover their expertise and find the right guidance for your future
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 relative">
          <div className="flex-1 w-full lg:w-[70%]">
            <CollegeBannerCard 
              name={collegeData.collegeName} 
              location={`${collegeData.collegesLocationCity}, ${collegeData.collegesLocationState}`}
              imageUrl={collegeData.bannerUrl}
            />

            <div className="mt-6 md:mt-8">
               <CollegeTabs activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div className="mt-4 md:mt-6">
               {renderTabContent()}
            </div>
          </div>

          <div className="w-full lg:w-[30%] max-w-[400px] shrink-0 flex flex-col gap-6 sticky top-24 self-start h-fit">
             <AdmissionCard />
             {/* <CollegeMapCard address={collegeData.collegeFullAddress} /> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDetailsPageNew;