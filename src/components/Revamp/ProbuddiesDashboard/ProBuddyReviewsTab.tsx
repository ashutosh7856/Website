import React from 'react';

type ReviewItem = {
  id: string;
  name: string;
  time: string;
  rating: number;
  avatar: string;
  text: string;
};

type Props = {
  aggregateRating: number;
  aggregateCount: number;
  reviews: ReviewItem[];
};

const FilledStar = () => (
  <svg width="24" height="24" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 0L12.2451 6.90983H19.5106L13.6327 11.1803L15.8779 18.0902L10 13.8197L4.12215 18.0902L6.36729 11.1803L0.489435 6.90983H7.75486L10 0Z" fill="#FFC107"/>
  </svg>
);

const OutlinedStar = () => (
  <svg width="24" height="24" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2.11283L11.6661 7.24147L11.8385 7.77189H12.3961H17.7885L13.4259 10.9419L12.9748 11.2696L13.1471 11.8001L14.8132 16.9287L10.4506 13.7587L10 13.431L9.54942 13.7587L5.18683 16.9287L6.85293 11.8001L7.02525 11.2696L6.57413 10.9419L2.21148 7.77189H7.60389H8.16147L8.33385 7.24147L10 2.11283ZM10 0L7.75486 6.90983H0.489435L6.36729 11.1803L4.12215 18.0902L10 13.8197L15.8779 18.0902L13.6327 11.1803L19.5106 6.90983H12.2451L10 0Z" fill="#FFC107"/>
  </svg>
);

const ratingProgressData = [
  { stars: 5, percentage: 65, color: '#0CA525' },
  { stars: 4, percentage: 38, color: '#1EB68B' },
  { stars: 3, percentage: 28, color: '#6FC3A4' },
  { stars: 2, percentage: 38, color: '#FCB302' },
  { stars: 1, percentage: 15, color: '#F16565' },
];

const ProBuddyReviewsTab: React.FC<Props> = ({ aggregateRating, aggregateCount, reviews }) => {
  const ratingLabel = aggregateRating > 0 ? aggregateRating.toFixed(1) : 'NA';
  const countLabel = aggregateCount > 0 ? `( ${aggregateCount} )` : '( NA )';

  return (
    <div className="w-full sm:w-[880px] h-auto sm:h-[499px] p-3 sm:p-3 flex flex-col font-poppins relative">
      <h2 className="text-[15px] sm:text-[16px] font-medium text-[#0E1629] leading-none ml-0 sm:ml-[12px] mt-0 sm:mt-[12px] mb-4 sm:mb-[24px]">
        Reviews
      </h2>

      <div className="flex flex-col xl:flex-row w-full h-full gap-4 xl:gap-0">

        <div className="w-full xl:w-[320px] h-auto xl:h-[391px] ml-0 xl:ml-[12px] flex flex-col items-center pt-0 xl:pt-[10px]">

          <div className="flex flex-col items-center justify-center w-full xl:w-[168px] ml-0 xl:ml-[36px] mb-4 xl:mb-[24px]">
            <span className="text-[38px] sm:text-[60px] font-semibold text-[#0E1629] leading-none mb-3 xl:mb-[24px]">
              {ratingLabel}
            </span>

            <div className="flex flex-col gap-1 items-center w-full">
              <div className="flex gap-1.5 flex-wrap justify-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>{aggregateRating > 0 && i < Math.round(aggregateRating) ? <FilledStar /> : <OutlinedStar />}</div>
                ))}
              </div>
              <span className="text-[14px] sm:text-[16px] font-medium text-[#0E1629] mt-1">
                {countLabel}
              </span>
            </div>
          </div>

          <div className="w-full xl:w-[320px] h-auto xl:h-[213px] ml-0 xl:ml-[36px] mt-3 xl:mt-[12px] flex flex-col gap-2.5">
            {ratingProgressData.map((data) => (

              <div key={data.stars} className="w-full min-h-[30px] flex items-center gap-2 sm:gap-[24px]">

                <span className="w-3 h-[33px] flex items-center justify-center text-[16px] sm:text-[22px] font-medium text-[#0E1629] leading-none">
                  {data.stars}
                </span>

                <div className="flex items-center justify-center">
                  <FilledStar />
                </div>

                <div className="flex-1 sm:w-[239px] h-2.5 bg-[#E9E9E9] rounded-[12px] relative overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-[12px]"
                    style={{
                      width: `${data.percentage}%`,
                      backgroundColor: data.color
                    }}
                  />
                </div>

              </div>
            ))}
          </div>

        </div>

        <div className="hidden xl:block w-px h-[475px] bg-[#E9E9E9] -mt-[36px] ml-[42px]"></div>

        <div className="flex-1 h-auto xl:h-[482px] ml-0 xl:ml-[24px] mt-4 xl:-mt-[36px] flex flex-col gap-4 overflow-y-auto pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div
                key={review.id}
                className="w-full min-h-[150px] shrink-0 rounded-[12px] border border-[#EBEBEB] p-3 flex flex-col"
              >

                <div className="flex flex-col sm:flex-row sm:justify-between items-start w-full h-auto gap-3 sm:gap-[12px]">

                  <div className="flex gap-2 sm:gap-[12px] min-w-0 w-full sm:w-auto">
                    <img loading="lazy" decoding="async"
                      src={review.avatar || '/counselor.png'}
                      alt={review.name}
                      className="w-12.5 h-12.5 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0 relative h-[48px]">
                      <span className="absolute top-px left-0 text-[13px] sm:text-[16px] font-medium text-[#0E1629] leading-[150%] lowercase whitespace-nowrap truncate w-full">
                        {review.name || 'NA'}
                      </span>
                      <span className="absolute top-7 left-0 text-[11px] sm:text-[14px] font-normal text-[#6B7280] leading-[150%] lowercase whitespace-nowrap truncate w-full">
                        {review.time || 'NA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5 flex-shrink-0 self-start sm:self-auto">
                    {[...Array(5)].map((_, i) => (
                      <div key={i}>
                        {i < review.rating ? <FilledStar /> : <OutlinedStar />}
                      </div>
                    ))}
                  </div>

                </div>

                <p className="w-full min-h-[63px] text-[12px] sm:text-[14px] font-normal text-[#6B7280] leading-[150%] lowercase mt-3 break-words">
                  {review.text || 'NA'}
                </p>

              </div>
            ))
          ) : (
            <div className="w-full min-h-[150px] shrink-0 rounded-[12px] border border-[#EBEBEB] p-3 flex items-center justify-center text-[14px] text-[#6B7280]">
              NA
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProBuddyReviewsTab;
