import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronUp, Loader2, Star, Users } from 'lucide-react';
import {
  getAllTestGroups,
  getAllTestGroupsForGuest,
  getAllTestGroupsOfCounsellorForUser,
} from '@/api/testGroup';
import { useAuthStore } from '@/store/AuthStore';

const PAGE_SIZE = 4;

type CounselorTestsCardProps = {
  counsellorId: string;
  userRole?: 'user' | 'student' | 'counselor' | 'proBuddy';
};

type DisplayTestGroup = {
  id: string;
  name: string;
  image: string;
  price: string;
  rating: string;
  totalTests: number;
  totalStudents: number;
};

function normalizeTestGroups(response: any, counsellorId: string): DisplayTestGroup[] {
  const rawList = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.testGroups)
        ? response.testGroups
        : [];

  const filtered = rawList.filter((item: any) => {
    const tg = item?.testGroup ?? item;
    const ownerId = tg?.counsellorId ?? tg?.counselorId ?? item?.counsellorId ?? item?.counselorId;
    return !ownerId || ownerId === counsellorId;
  });

  return filtered.map((item: any, index: number) => {
    const tg = item?.testGroup ?? item;
    const priceType = String(tg?.priceType ?? item?.priceType ?? '').toUpperCase();
    const price = Number(tg?.price ?? item?.price ?? 0);
    const numericRating = Number(tg?.rating ?? item?.rating ?? 0);

    return {
      id: String(tg?.testGroupId ?? item?.testGroupId ?? `test-group-${index}`),
      name: String(tg?.testGroupName ?? item?.testGroupName ?? 'Test Group'),
      image: String(
        tg?.bannerImagUrl ??
          tg?.bannerImageUrl ??
          item?.bannerImagUrl ??
          item?.bannerImageUrl ??
          '/course/2.webp'
      ),
      price: priceType === 'FREE' ? 'Free' : `${price.toLocaleString('en-IN')}`,
      rating: Number.isFinite(numericRating) ? numericRating.toFixed(2) : '0.00',
      totalTests: Number(tg?.attachedTestIds?.length ?? item?.attachedTests?.length ?? item?.totalTests ?? 0),
      totalStudents: Number(tg?.soldCount ?? item?.soldCount ?? 0),
    };
  });
}

export default function RevampCounselorTestsCard({ counsellorId, userRole = 'user' }: CounselorTestsCardProps) {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const isCounselor = userRole === 'counselor';
  const isUserOrStudent = userRole === 'user' || userRole === 'student';

  const { data, isLoading, error } = useQuery({
    queryKey: ['counsellorTestGroups', counsellorId, userId, userRole],
    queryFn: async () => {
      if (isCounselor) {
        return getAllTestGroups(counsellorId);
      }
      if (isUserOrStudent && userId) {
        return getAllTestGroupsOfCounsellorForUser(userId, counsellorId);
      }
      return getAllTestGroupsForGuest();
    },
    enabled: !!counsellorId,
  });

  const testGroups = normalizeTestGroups(data, counsellorId);
  const displayedTestGroups = testGroups.slice(0, visibleCount);
  const hasMore = visibleCount < testGroups.length;
  const isExpanded = visibleCount > PAGE_SIZE;

  if (isLoading) {
    return (
      <div className="w-full max-w-145 bg-white rounded-2xl border border-[#EFEFEF] p-8 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F43F2]" />
      </div>
    );
  }

  if (error || !testGroups.length) {
    return null;
  }

  return (
    <div className="w-full max-w-145 bg-white rounded-2xl border border-[#EFEFEF] p-2.5 font-poppins shadow-sm">
      <div className="flex items-center px-1">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#0E1629] leading-none">Tests</h2>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {displayedTestGroups.map((group) => (
          <div
            key={group.id}
            onClick={() => navigate(`/courses/test-group/${group.id}`)}
            className="w-full min-h-38 sm:h-40 bg-[#F5F5F5] rounded-xl p-2.5 flex gap-2.5 sm:gap-3 cursor-pointer hover:bg-gray-200 transition-colors"
          >
            <img loading="lazy" decoding="async"
              src={group.image}
              alt={group.name}
              className="w-24 h-24 sm:w-36 sm:h-35 rounded-lg object-cover shrink-0"
            />

            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-[15px] sm:text-[18px] font-medium text-[#343C6A] leading-[120%] line-clamp-2 wrap-break-word">
                  {group.name}
                </h3>

                <div className="flex gap-1.5 sm:gap-2 mt-2 flex-wrap">
                  <span className="bg-[#E1EDFA] text-[#226CBD] flex items-center gap-1 px-1.5 py-1 rounded-lg">
                    <Users className="w-3 h-3" />
                    <span className="text-[10px] font-medium leading-none mt-px">
                      {group.totalStudents}+ Students
                    </span>
                  </span>

                  <span className="bg-[#FDEFE2] text-[#EF7F21] flex items-center gap-1 px-1.5 py-1 rounded-lg">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-[10px] font-medium leading-none mt-px">{group.rating}</span>
                  </span>

                  <span className="bg-[#EEF2FF] text-[#3730A3] flex items-center gap-1 px-1.5 py-1 rounded-lg">
                    <span className="text-[10px] font-medium leading-none mt-px">{group.totalTests} Tests</span>
                  </span>
                </div>
              </div>

              <div className="mt-auto flex items-center gap-1.5 sm:gap-2 pb-0.5">
                <img loading="lazy" decoding="async" src="/coin.svg" alt="Procoins" className="w-6 h-6" />
                <div className="flex items-center gap-1">
                  <span className="text-[14px] sm:text-[15px] font-medium text-[#0E1629] leading-none">{group.price}</span>
                  <span className="text-[14px] sm:text-[15px] font-medium text-[#6B7280] leading-none">
                    {group.price === 'Free' ? '' : 'Procoins'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* See more / See less */}
      {(hasMore || isExpanded) && (
        <div className="flex justify-center mt-3">
          {hasMore ? (
            <button
              onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
              className="flex items-center gap-0.5 text-[12px] sm:text-[14px] font-semibold text-[#3D3D3D] leading-none cursor-pointer hover:text-[#2F43F2] transition-colors"
            >
              See more <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setVisibleCount(PAGE_SIZE)}
              className="flex items-center gap-0.5 text-[12px] sm:text-[14px] font-semibold text-[#3D3D3D] leading-none cursor-pointer hover:text-[#2F43F2] transition-colors"
            >
              See less <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}