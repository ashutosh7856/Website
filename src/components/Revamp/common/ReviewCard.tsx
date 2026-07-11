import { FaStar } from "react-icons/fa";

export interface ReviewCardData {
    name?: string;
    date?: string;
    text?: string;
    rating?: number;
    image?: string;
}

const defaultReview: Required<ReviewCardData> = {
    name: "Ashutosh Kumar",
    date: "2 weeks ago",
    text: "Lorem test here for review",
    rating: 5,
    image: "/review1.jpeg",
};

export default function ReviewCard({ review }: { review?: ReviewCardData } = {}) {
    const reviewData = {
        ...defaultReview,
        ...review,
        rating: Math.min(5, Math.max(1, Number(review?.rating ?? defaultReview.rating))),
    };

    return (
        <div>
            {/* phone */}
            <div className="flex flex-col md:hidden">

            </div>


            {/* desktop */}
            <div className="min-w-[280px] md:min-w-0 md:w-full flex flex-col gap-3 p-3 md:p-4 rounded-[12px] bg-white border border-[#ededed]">
                {/* image, review and name div */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start  md:justify-between md:w-full">
                    <div className="flex items-center gap-2 md:gap-3">
                        <img loading="lazy" decoding="async" src={reviewData.image} alt={reviewData.name} className="h-9 w-9 md:h-12.5 md:w-12.5 aspect-square object-center rounded-full"/>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-(--text-main) font-medium text-sm md:text-[1rem]">{reviewData.name}</h1>
                        <p className="text-(--text-muted) font-normal text-xs md:text-sm">{reviewData.date}</p>
                        </div>
                    </div>

                    <div className="flex gap-1.5 md:gap-2">
                         {[1,2,3,4,5].map((star)=>(
                            <FaStar key={star} className="h-4.5 md:h-6 md:w-6 w-4.5" fill={star <= reviewData.rating ? "#FFC107" : "#E5E7EB"}/>
                        ))}
                    </div>
                </div>

                <p className="text-(--text-muted) font-normal text-xs md:text-sm">{reviewData.text}</p>

            </div>
        </div>
    );
}