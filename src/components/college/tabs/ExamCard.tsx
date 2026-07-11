import React from 'react';

interface ExamCardProps {
  image: string;
  tag: string;
  title: string;
  onViewDetails?: () => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ image, tag, title, onViewDetails }) => {
  return (
    <div 
      className="bg-white relative shrink-0 rounded-[12px] md:rounded-[20px] shadow-[0px_0px_4px_0px_#23232340] overflow-hidden flex flex-col w-full md:w-[320px] md:h-[378px] md:block"
    >
      <div className="p-2 md:absolute md:top-[11px] md:left-2.5 md:p-0">
        <div 
          className="relative overflow-hidden bg-[#F5F5F5] w-full aspect-4/3 md:w-[300px] md:h-[269px] rounded-xl md:rounded-[10px]"
        >
          <img loading="lazy" decoding="async" src={image} alt={title} className="w-full h-full object-cover" />
          
          <div 
            className="absolute top-2 right-2 bg-[#3D3D3D] flex items-center justify-center px-2 md:px-3 h-[18px] md:h-5 rounded-[12px]"
          >
            <span 
              className="text-white font-medium text-[10px] md:text-[12px] leading-none"
              style={{ fontFamily: 'Montserrat' }}
            >
              {tag}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 px-2 pb-3 md:block md:p-0">
        <div 
          className="md:absolute md:w-full md:flex md:justify-center"
          style={{ top: '288px' }}
        >
          <h3 
            className="text-[#242645] font-medium text-center line-clamp-2 text-[13px] leading-[1.3] md:text-[20px] md:leading-[125%] md:w-[248px] md:px-4"
            style={{ fontFamily: 'Montserrat' }}
          >
            {title}
          </h3>
        </div>

        <div 
          className="md:absolute md:w-full md:flex md:justify-center"
          style={{ top: '346px' }}
        >
          <button 
            onClick={onViewDetails}
            className="text-[#718EBF] font-medium underline cursor-pointer hover:text-[#5a76a8] transition-colors text-[12px] md:text-[18px] leading-[125%]"
            style={{ fontFamily: 'Montserrat' }}
          >
            View Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamCard;