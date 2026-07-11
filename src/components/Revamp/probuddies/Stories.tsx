import { useState, useEffect, useRef } from "react";
import StoriesCard, { type StoryItem } from "./StoriesCard";

const defaultStories: StoryItem[] = [
    {
        name: "Leo",
        role: "Lead Designer",
        rating: 5,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
        image: "/1st.png",
    },
    {
        name: "Leo",
        role: "Lead Designer",
        rating: 5,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
        image: "/2nd.png",
    },
    {
        name: "Leo",
        role: "Lead Designer",
        rating: 5,
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cursus nibh mauris, nec turpis orci lectus maecenas. Suspendisse sed magna eget nibh in turpis. Consequat duis diam lacus arcu.",
        image: "/1st.png",
    },
];

export default function Stories({ stories }: { stories?: StoryItem[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [_activeIndex, setActiveIndex] = useState(0);
    const displayedStories = (stories && stories.length >= 3 ? stories.slice(0, 3) : defaultStories);

    useEffect(() => {
        const interval = setInterval(() => {
            if (window.innerWidth < 768 && scrollRef.current) {
                setActiveIndex((prev) => {
                    const nextIndex = (prev + 1) % displayedStories.length;
                    const cardWidth = 290 + 16;
                    scrollRef.current?.scrollTo({
                        left: nextIndex * cardWidth,
                        behavior: 'smooth'
                    });
                    return nextIndex;
                });
            }
        }, 4500);
        return () => clearInterval(interval);
    }, [displayedStories.length]);

    return (
        <div className="w-full py-6 md:py-10 pb-6 md:pb-[95px]">
            <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col items-start md:items-center gap-6 md:gap-8 overflow-hidden">

            <div className="md:hidden flex items-center justify-start gap-[8px] bg-white px-[12px] py-[4px] rounded-[4px] w-fit shrink-0">
                <div className="w-[16px] h-[16px] min-w-[16px] min-h-[16px] bg-[#0E1629] shrink-0" />
                <p className="font-[Poppins] font-semibold text-[12px] text-[#0E1629] uppercase tracking-[0.07em] leading-none whitespace-nowrap">
                    SUCCESS STORIES
                </p>
            </div>

            {/* Desktop Heading (Original) */}
            <h2 className="hidden md:block text-(--text-main) font-bold text-2xl">
                Success Stories
            </h2>

            <div
                ref={scrollRef}
                className="flex gap-4 md:gap-6 items-start md:items-end justify-start w-full overflow-x-auto snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-4 md:pb-0"
            >
                {displayedStories.map((story, index) => (
                    <div key={`${story.name}-${index}`} className={`snap-center shrink-0 ${index === displayedStories.length - 1 ? "pr-4" : ""}`}>
                        <StoriesCard active={index === 1} story={story} />
                    </div>
                ))}
            </div>

            </div>
        </div>
    );
}