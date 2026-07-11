import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/AuthStore';
import ProBuddySidebar from '@/components/Revamp/ProbuddiesDashboard/ProBuddySidebar';
import ProBuddyMainContent from '@/components/Revamp/ProbuddiesDashboard/ProBuddyMainContent';
import { useQuery } from '@tanstack/react-query';
import { probuddiesApi } from '@/api/pro-buddies';

type AnyRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ProBuddiesDashboard: React.FC = () => {
  const { role, isAuthenticated, loading } = useAuthStore();
  const navigate = useNavigate();
  const proBuddyId = typeof window !== 'undefined' ? localStorage.getItem('phone') || '' : '';

  const profileQuery = useQuery({
    queryKey: ['probuddy-dashboard-profile', proBuddyId],
    queryFn: () => probuddiesApi.profileForProBuddy(proBuddyId),
    enabled: !loading && isAuthenticated && role === 'proBuddy' && Boolean(proBuddyId),
  });

  const profileData = React.useMemo(() => {
    const payload = profileQuery.data;
    if (isRecord(payload) && isRecord(payload.data)) return payload.data;
    if (isRecord(payload) && 'data' in payload) return null;
    if (isRecord(payload)) return payload;
    return null;
  }, [profileQuery.data]);

  const isVerified = profileData?.verified === true;

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== "proBuddy")) {
      navigate("/");
    }
  }, [loading, isAuthenticated, role, navigate]);

  if (loading || (!isAuthenticated && role !== "proBuddy") || profileQuery.isLoading) {
    return <div className="min-h-screen bg-[#C6DDF040]" />;
  }

  if (!isVerified) {
    return (
      <div className="bg-[#C6DDF040] min-h-screen flex flex-col items-center justify-start pt-10 pb-10 px-8 text-center gap-6 font-poppins">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-2xl w-full flex flex-col items-center border border-gray-100">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-[#0E1629]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#0E1629] mb-4">Application Under Review</h1>
          <p className="text-[#6B7280] text-lg mb-8 leading-relaxed">
            Your Pro Buddy application has been received and is currently under review by our team. Please check back later or wait for our verification confirmation.
          </p>
          <div className="bg-[#C6DDF040] rounded-xl p-5 w-full border border-[#0E1629]/10">
            <p className="text-sm text-[#0E1629] font-medium font-montserrat flex items-center justify-center gap-2">
              <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              If your status doesn't change after approval, try logging out and logging back in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#C6DDF040] min-h-screen pb-12 font-poppins relative">

      <div
        className="w-full h-[160px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/imageClient.webp')" }}
      />

      <div className="max-w-7xl mx-auto relative px-4 sm:px-6 lg:px-10 xl:px-12">

        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:gap-[24px] -mt-20 sm:-mt-24 xl:-mt-[120px]">

          <div className="shrink-0">
            <ProBuddySidebar />
          </div>

          <div className="shrink-0">
            <ProBuddyMainContent />
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProBuddiesDashboard;
