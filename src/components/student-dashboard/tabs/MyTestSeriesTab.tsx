import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUserBoughtTestGroups, getUserBookmarkedTestGroups } from '@/api/testGroup';
import { useAuthStore } from '@/store/AuthStore';
import { useNavigate } from 'react-router-dom';
import { Loader2, BookOpen, Star, Users, ArrowRight } from 'lucide-react';
import type { TestGroup } from '@/types/testGroup';

type SubTab = 'Purchased' | 'Saved';

export default function MyTestSeriesTab() {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('Purchased');
    const { userId } = useAuthStore();
    const navigate = useNavigate();

    const { data: purchasedData, isLoading: loadingPurchased, error: errorPurchased } = useQuery({
        queryKey: ['boughtTestGroups', userId],
        queryFn: async () => {
            if (!userId) return { data: [] };
            return getUserBoughtTestGroups(userId);
        },
        enabled: !!userId && activeSubTab === 'Purchased',
    });

    const { data: bookmarkedData, isLoading: loadingBookmarked, error: errorBookmarked } = useQuery({
        queryKey: ['bookmarkedTestGroups', userId],
        queryFn: async () => {
            if (!userId) return { data: [] };
            return getUserBookmarkedTestGroups(userId);
        },
        enabled: !!userId && activeSubTab === 'Saved',
    });

    const TABS: SubTab[] = ['Purchased', 'Saved'];

    const currentData = activeSubTab === 'Purchased' ? purchasedData : bookmarkedData;
    const isLoading = activeSubTab === 'Purchased' ? loadingPurchased : loadingBookmarked;
    const error = activeSubTab === 'Purchased' ? errorPurchased : errorBookmarked;

    const testGroups: TestGroup[] = currentData?.data || [];

    return (
        <div className="md:bg-white md:py-5 md:px-4 md:rounded-2xl md:border md:border-[#EFEFEF]">
            {/* Sub Tabs */}
            <div className="bg-white p-2 rounded-xl border border-[#EFEFEF] md:bg-transparent md:p-0 md:border-none md:mb-5">
                <div className="flex items-center gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveSubTab(tab)}
                            className={`flex-1 md:flex-none px-6 cursor-pointer py-2 text-xs md:text-sm font-medium rounded-full transition-all duration-200 ${activeSubTab === tab
                                ? 'bg-[#E8E7F2] text-[#13097D]'
                                : 'bg-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#13097D]" />
                </div>
            ) : error ? (
                <div className="text-center py-16 bg-red-50 rounded-xl mt-4">
                    <p className="text-red-500 font-medium mb-1">Failed to load test series</p>
                    <p className="text-gray-500 text-sm">{(error as Error).message}</p>
                </div>
            ) : testGroups.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl mt-4 border border-dashed border-gray-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-4 shadow-sm">
                        <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        No {activeSubTab.toLowerCase()} test series
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        {activeSubTab === 'Purchased'
                            ? 'Browse and enroll in test series to start practicing!'
                            : 'Bookmark test series to access them quickly later.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
                    {testGroups.map(group => (
                        <div
                            key={group.testGroupId}
                            className='bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col'
                            onClick={() => navigate(`/courses/test-group/${group.testGroupId}`, { state: { fromDashboard: true, activeTab: 'Test Series' } })}
                        >
                            {/* Image Banner */}
                            <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-indigo-50">
                                {group.bannerImagUrl ? (
                                    <img loading="lazy" decoding="async"
                                        src={group.bannerImagUrl}
                                        alt={group.testGroupName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <BookOpen className="w-10 h-10 text-indigo-200" />
                                    </div>
                                )}
                                {/* Overlay Badge */}
                                <div className="absolute top-2 right-2">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md ${activeSubTab === 'Purchased'
                                        ? 'bg-green-500/90 text-white'
                                        : 'bg-white/90 text-gray-700 shadow-sm'
                                        }`}>
                                        {activeSubTab === 'Purchased' ? 'Purchased' : group.priceType === 'FREE' ? 'Free' : 'Paid'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
                                    {group.testGroupName}
                                </h3>

                                {/* Stats Row */}
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 mt-auto">
                                    <div className="flex items-center gap-1">
                                        <BookOpen size={12} />
                                        <span>{group.attachedTestIds?.length || 0} Tests</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users size={12} />
                                        <span>{group.soldCount || 0}</span>
                                    </div>
                                </div>

                                {/* Footer Action */}
                                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span className="text-xs font-semibold text-gray-700">{group.rating?.toFixed(1) || "New"}</span>
                                    </div>

                                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                                        View Details <ArrowRight size={12} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
