import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { academicApi } from '@/api/academic';
import type { CollegeApiResponse, CollegeDetails } from '@/types';
import { COLLEGES_SNAPSHOT } from '@/data/contentSnapshot';
import { collegeStaticPath, withStaticFallback } from '@/lib/staticContent';
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
import { absoluteUrl } from "@/lib/siteUrl.mjs";

const COLLEGES_SEED = COLLEGES_SNAPSHOT as unknown as CollegeApiResponse[];

const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const CollegeDetailsPageNew = () => {
  const { id } = useParams();
  const collegeTabStorageKey = id ? `college-details-active-tab:${id}` : 'college-details-active-tab';

  const [activeTab, setActiveTab] = useState('Info');

  // Live API first, then the build-time static copy on public/data. Retries
  // cover Cloud Run cold starts, which is what produced the intermittent
  // "College not found" the AdSense reviewer hit.
  const {
    data: collegeData,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: ['college-details', id],
    queryFn: () =>
      withStaticFallback<CollegeDetails>(
        () => academicApi.getCollegeById(id as string),
        collegeStaticPath(id as string),
      ),
    enabled: Boolean(id),
    retry: 2,
    retryDelay: (attempt) => 800 * (attempt + 1),
    staleTime: 5 * 60 * 1000,
  });

  // The list endpoint is the only source of coursesOffered/examsAccepted, and
  // it is seeded from the snapshot so those tabs render during the prerender.
  const { data: allColleges = [] } = useQuery({
    queryKey: ['revamp-colleges'],
    queryFn: () => academicApi.getColleges(),
    staleTime: 5 * 60 * 1000,
    initialData: COLLEGES_SEED.length ? COLLEGES_SEED : undefined,
    initialDataUpdatedAt: 0,
  });

  const listEntry = useMemo(
    () => allColleges.find((college) => college.collegeId === id),
    [allColleges, id],
  );
  const coursesOffered = useMemo(() => listEntry?.coursesOffered ?? [], [listEntry]);

  // Only surface tabs that actually have content for this college — an empty
  // tab is thin content, and the hard-coded filler they used to show made every
  // college page a near-duplicate of the others.
  const availableTabs = useMemo(() => {
    if (!collegeData) return ['Info'];
    const tabs = ['Info'];
    if (coursesOffered.length) tabs.push('Courses');
    if (coursesOffered.some((course) => (course.examsAccepted || []).length)) tabs.push('Exams');
    if (collegeData.importantDates?.length) tabs.push('Important Dates');
    if (collegeData.scholarships?.length) tabs.push('Scholarships');
    if (collegeData.infrastructure?.length || collegeData.campusSize) tabs.push('Infrastructure');
    if (collegeData.events?.length) tabs.push('Events');
    if (collegeData.alumni?.length) tabs.push('Alumini');
    tabs.push('Counsellors');
    return tabs;
  }, [collegeData, coursesOffered]);

  useEffect(() => {
    if (!id) {
      setActiveTab('Info');
      return;
    }

    try {
      const stored = sessionStorage.getItem(collegeTabStorageKey);
      setActiveTab(stored && availableTabs.includes(stored) ? stored : 'Info');
    } catch {
      setActiveTab('Info');
    }
  }, [collegeTabStorageKey, id, availableTabs]);

  useEffect(() => {
    if (!id) return;

    try {
      sessionStorage.setItem(collegeTabStorageKey, activeTab);
    } catch {
      // Ignore sessionStorage failures and keep the in-memory tab state.
    }
  }, [activeTab, collegeTabStorageKey, id]);

  // Every panel is rendered into the DOM and inactive ones are hidden with CSS,
  // rather than switching on activeTab and rendering only one. Only the "Info"
  // tab was ever in the prerendered HTML, so the alumni, events, scholarships,
  // courses, exams, important dates and infrastructure this college already has
  // in the snapshot were invisible to Google — the page measured 154 unique
  // words against ~300 available, which is what "thin content" means in an
  // AdSense review. Google does index display:none tab panels.
  const renderPanel = (tab: string) => {
    if (!collegeData) return null;

    switch (tab) {
      case 'Info':
        return <InfoTab data={collegeData} />;
      case 'Courses':
        return <CoursesTab courses={coursesOffered} fallbackImage={collegeData.bannerUrl} />;
      case 'Counsellors':
        return <CounsellorsTab />;
      case 'Infrastructure':
        return (
          <InfrastructureTab
            infrastructure={collegeData.infrastructure}
            campusSize={collegeData.campusSize}
            collegeName={collegeData.collegeName}
          />
        );
      case 'Scholarships':
        return <ScholarshipsTab scholarships={collegeData.scholarships} />;
      case 'Events':
        return <EventsTab events={collegeData.events} />;
      case 'Alumini':
        return <AluminiTab alumni={collegeData.alumni} />;
      case 'Exams':
        return <ExamsTab courses={coursesOffered} fallbackImage={collegeData.bannerUrl} />;
      case 'Important Dates':
        return <ImportantDatesTab importantDates={collegeData.importantDates} />;
      default:
        return <InfoTab data={collegeData} />;
    }
  };

  if (isLoading || !isFetched) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  // Genuinely unknown college: a real page with navigation, marked noindex so
  // it never gets indexed as a soft 404.
  if (!collegeData) {
    return (
      <div className="min-h-screen bg-white px-4 py-20">
        <PageSEO
          title="College not found"
          description="This college page is no longer available on ProCounsel. Browse our verified college directory instead."
          noIndex
        />
        <div className="max-w-2xl mx-auto text-center flex flex-col gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#0E1629]">
            This college page is no longer available
          </h1>
          <p className="text-[#6B7280]">
            The college you are looking for has been removed or its address has changed. You can
            browse every verified college on ProCounsel, or talk to a counsellor about your
            admission options.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Link
              to="/pro-buddies/college-listing"
              className="rounded-xl bg-[#0E1629] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse all colleges
            </Link>
            <Link
              to="/counsellor-listing"
              className="rounded-xl border border-[#0E1629] px-5 py-2.5 text-sm font-semibold text-[#0E1629]"
            >
              Talk to a counsellor
            </Link>
            <Link
              to="/admissions/deadlines"
              className="rounded-xl border border-[#0E1629] px-5 py-2.5 text-sm font-semibold text-[#0E1629]"
            >
              Admission deadlines
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const location = [collegeData.collegesLocationCity, collegeData.collegesLocationState]
    .filter(Boolean)
    .join(', ');
  const summary = stripHtml(collegeData.collegeInfo || '').slice(0, 155);

  return (
    <div className="min-h-screen bg-[#FFFFFF] pb-20">
      <PageSEO
        title={`${collegeData.collegeName} — Admissions, Courses, Cutoffs & Reviews`}
        description={
          summary ||
          `Explore ${collegeData.collegeName}${location ? ` in ${location}` : ''}: courses, fees, admissions, cutoffs, scholarships, placements and reviews. Get expert admission counselling from ProCounsel.`
        }
        canonical={`/college-details/${id}`}
        image={collegeData.bannerUrl || undefined}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollegeOrUniversity',
          name: collegeData.collegeName,
          url: absoluteUrl(`/college-details/${id}`),
          ...(collegeData.website ? { sameAs: collegeData.website } : {}),
          ...(collegeData.logoUrl ? { logo: collegeData.logoUrl } : {}),
          ...(collegeData.establishedYear ? { foundingDate: collegeData.establishedYear } : {}),
          address: {
            '@type': 'PostalAddress',
            streetAddress: collegeData.collegeFullAddress || undefined,
            addressLocality: collegeData.collegesLocationCity || undefined,
            addressRegion: collegeData.collegesLocationState || undefined,
            postalCode: collegeData.pincode || undefined,
            addressCountry: 'IN',
          },
        }}
      />
      <div className="max-w-7xl mx-auto md:mt-14 px-4 md:px-8 md:pt-10">
        <div className="mb-6 md:mb-8">
          <h1 className="font-semibold text-[#0E1629] text-[22px] md:text-[32px] leading-[130%]">
            {collegeData.collegeName}
            {location ? ` — Admissions ${new Date().getFullYear()}` : ''}
          </h1>
          <p
            className="text-[#8C8CA1] font-medium mt-1 md:mt-2 text-[14px] md:text-[18px] leading-[135%] md:leading-[125%]"
            style={{ fontFamily: 'Montserrat' }}
          >
            {location
              ? `Courses, fees, cutoffs, scholarships and placements at ${collegeData.collegeName}, ${location}.`
              : 'Discover their expertise and find the right guidance for your future'}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 relative">
          <div className="flex-1 w-full lg:w-[70%]">
            <CollegeBannerCard
              name={collegeData.collegeName}
              location={location}
              imageUrl={collegeData.bannerUrl}
            />

            <div className="mt-6 md:mt-8">
               <CollegeTabs tabs={availableTabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <div className="mt-4 md:mt-6">
               {availableTabs.map((tab) => (
                 <div key={tab} hidden={activeTab !== tab}>
                   {renderPanel(tab)}
                 </div>
               ))}
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
