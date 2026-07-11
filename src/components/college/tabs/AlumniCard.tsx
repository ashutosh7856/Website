import React from 'react';
import { Briefcase } from 'lucide-react';

interface AlumniCardProps {
  name: string;
  batch: string;
  position: string;
  imageUrl: string;
}

const AlumniCard: React.FC<AlumniCardProps> = ({ name, batch, position, imageUrl }) => {
  return (
    <div 
      className="bg-white relative shrink-0 rounded-[12px] md:rounded-[20px] shadow-[0px_0px_4px_0px_#23232340] overflow-hidden flex flex-col w-full md:w-[320px] md:h-[366px] md:block"
    >
      <div className="p-2 md:absolute md:top-2.5 md:left-2.5 md:p-0">
        <div 
          className="relative overflow-hidden bg-[#F5F5F7] w-full aspect-square md:w-[300px] md:h-[248px] rounded-xl md:rounded-[10px]"
        >
          <img loading="lazy" decoding="async" 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400`;
            }}
          />
        </div>
      </div>

      <div className="flex flex-col px-2 pb-3 md:block md:p-0">
        <div 
          className="md:absolute md:left-2.5"
          style={{ top: '266px' }}
        >
          <h3 
            className="text-[#242645] font-semibold truncate text-[14px] leading-tight mt-1 md:mt-0 md:text-[20px] md:leading-[125%] md:max-w-[300px]"
            style={{ fontFamily: 'Poppins' }}
          >
            {name}
          </h3>
        </div>

        <div 
          className="md:absolute md:left-2.5"
          style={{ top: '295px' }}
        >
          <p 
            className="text-[#8C8CA1] font-medium text-[10px] md:text-[18px] md:leading-[125%]"
            style={{ fontFamily: 'Poppins' }}
          >
            {batch}
          </p>
        </div>

        <div 
          className="hidden md:block md:absolute md:left-2.5 border-t border-[#F5F5F5]"
          style={{ top: '328px', width: '262px', height: '0px' }}
        />

        <div 
          className="flex items-center gap-1.5 mt-1.5 md:absolute md:left-2.5 md:mt-0 md:gap-2"
          style={{ top: '338px' }}
        >
          <Briefcase 
            className="text-[#718EBF] w-3 h-3 md:w-5 md:h-5"
            strokeWidth={1.5}
          />
          <span 
            className="text-[#696969] font-normal truncate text-[10px] md:text-[16px] md:leading-[125%] max-w-full md:max-w-[270px]"
            style={{ fontFamily: 'Poppins' }}
          >
            {position}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlumniCard;