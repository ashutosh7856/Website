import { useColleges } from '@/hooks/useColleges';

function CollegeItem({ name, courses, city, logoUrl }: { name: string; courses: number; city: string; logoUrl: string }) {
    return (
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 bg-[#F5F5F5] p-3 border border-[#EFEFEF] rounded-xl">
            <div className="relative shrink-0">
                <img loading="lazy" decoding="async" src={logoUrl} alt={name} className="w-34 h-30 object-cover rounded-xl" />
                <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">UG</span>
            </div>
            <div className="flex flex-col text-left justify-center">
                <h4 className="font-semibold text-[#343C6A] leading-tight mb-1">{name}</h4>
                <p  className="text-sm text-[#718EBF] mt-1 underline mb-1">{courses} Courses</p>
                <p className="text-sm text-[#232323] mb-1">{city}</p>
            </div>
        </div>
    );
}

export function FeaturedCollegesCard() {
    const { colleges, loading, error } = useColleges(2);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-[#343C6A]">Featured Colleges</h3>
            <div className="mt-4 space-y-4">
                {loading && <p className="text-center text-gray-500">Loading colleges...</p>}
                {error && <p className="text-center text-red-500">Could not load colleges.</p>}
                {colleges?.map(college => (
                    <CollegeItem 
                        key={college.id}
                        name={college.name}
                        courses={college.coursesOffered.length}
                        city={college.city}
                        logoUrl={college.logoUrl || 'https://via.placeholder.com/150'}
                    />
                ))}
            </div>
        </div>
    );
}