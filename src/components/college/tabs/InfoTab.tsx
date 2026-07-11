import { useState } from 'react';
import { Globe, Phone, Mail, MapPin, X } from 'lucide-react';
import type { CollegeDetails } from '@/types';

interface InfoTabProps {
  data: CollegeDetails;
}

const InfoTab = ({ data }: InfoTabProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const formatApprovals = (approvals: string[] | string) => {
    if (Array.isArray(approvals)) {
      return approvals.join(" & ") + " Approved";
    }
    return approvals || "Approved";
  };

  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(data.collegeFullAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <>
    <div className="flex flex-col gap-4 md:gap-6 w-full">
      
      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] p-4 md:p-6">
        <h3 className="text-[#343C6A] font-semibold text-[18px] md:text-[20px] leading-[125%]" style={{ fontFamily: 'Poppins' }}>
          About
        </h3>
        <div className="mt-3 md:mt-4 relative">
          <div 
            className={`text-[#718EBF] font-medium text-[14px] md:text-[16px] leading-[150%] transition-all duration-300 ${!isExpanded ? 'line-clamp-3' : ''}`}
            style={{ fontFamily: 'Poppins' }}
            dangerouslySetInnerHTML={{ __html: data.collegeInfo }}
          />
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#343C6A] font-semibold text-[14px] md:text-[16px] underline mt-1 cursor-pointer hover:text-[#242645]"
            style={{ fontFamily: 'Poppins' }}
          >
            {isExpanded ? 'View less' : 'View more'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] py-4 md:py-6 px-3 md:px-4">
        <div className="flex justify-between items-start px-1 md:px-8">
          
          <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
            <div className="h-[35px] md:h-[50px] flex items-center justify-center">
              <img loading="lazy" decoding="async" src="/nirf.png" alt="NIRF" className="h-full object-contain" />
            </div>
            <span className="text-[#232323] font-medium text-[10px] md:text-[16px] text-center leading-tight" style={{ fontFamily: 'Poppins' }}>
              {data.nirfOverallRank || "NIRF Ranking"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
             <div className="h-[35px] md:h-[50px] flex items-center justify-center">
              <img loading="lazy" decoding="async" src="/naac.webp" alt="NAAC" className="h-full object-contain" />
            </div>
            <span className="text-[#232323] font-medium text-[10px] md:text-[16px] text-center leading-tight" style={{ fontFamily: 'Poppins' }}>
              NAAC {data.naacGrade || "Accredited"}
            </span>
          </div>

          <div className="flex flex-col items-center gap-2 md:gap-3 w-1/3">
             <div className="h-[35px] md:h-[50px] flex items-center justify-center">
              <img loading="lazy" decoding="async" src="/aicte.webp" alt="AICTE" className="h-full object-contain" />
            </div>
            <span className="text-[#232323] font-medium text-[10px] md:text-[16px] text-center leading-tight" style={{ fontFamily: 'Poppins' }}>
              {formatApprovals(data.approvals)}
            </span>
          </div>

        </div>
      </div>

      {data.importantDates && data.importantDates.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-[#343C6A] font-semibold text-[18px] md:text-[20px] leading-[125%]" style={{ fontFamily: 'Poppins' }}>
              Important Dates
            </h3>
          </div>

          <div className="flex flex-col gap-6">
            {data.importantDates.map((group, index) => (
              <div key={group.importantDateId || index} className="flex flex-col gap-3">
                <h4 className="text-[#242645] font-semibold text-[14px] md:text-[16px]" style={{ fontFamily: 'Poppins' }}>
                  {group.event}
                </h4>
                
                <div className="overflow-hidden rounded-lg border border-[#EFEFEF]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F5F7FA]">
                        <th className="py-3 px-4 text-[#718EBF] font-medium text-[12px] md:text-[14px] w-1/3" style={{ fontFamily: 'Poppins' }}>
                          Date
                        </th>
                        <th className="py-3 px-4 text-[#718EBF] font-medium text-[12px] md:text-[14px]" style={{ fontFamily: 'Poppins' }}>
                          Event / Stage
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.details.map((detail, idx) => (
                        <tr key={detail.detailId || idx} className="border-t border-[#EFEFEF] hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 text-[#242645] font-medium text-[12px] md:text-[14px]" style={{ fontFamily: 'Poppins' }}>
                            {detail.date}
                          </td>
                          <td className="py-3 px-4 text-[#242645] font-normal text-[12px] md:text-[14px]" style={{ fontFamily: 'Poppins' }}>
                            {detail.stage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] p-4 md:p-6">
        <div className="flex justify-between items-center mb-2 md:mb-3">
           <h3 className="text-[#343C6A] font-semibold text-[18px] md:text-[20px] leading-[125%]" style={{ fontFamily: 'Poppins' }}>
            Address
           </h3>
           <button 
             onClick={() => setIsMapOpen(true)}
             className="text-[#FA660F] text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer"
             style={{ fontFamily: 'Poppins' }}
           >
             <MapPin size={14} /> View Map
           </button>
        </div>
        <p 
          className="text-[#718EBF] font-medium text-[14px] md:text-[16px] leading-[125%] mt-2 md:mt-3 cursor-pointer hover:text-[#13097D] transition-colors"
          style={{ fontFamily: 'Poppins' }}
          onClick={() => setIsMapOpen(true)}
          title="Click to view map"
        >
          {data.collegeFullAddress}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] p-4 md:p-6">
        <h3 className="text-[#343C6A] font-semibold text-[18px] md:text-[20px] leading-[125%] mb-4 md:mb-6" style={{ fontFamily: 'Poppins' }}>
          Contact
        </h3>
        
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-[26px] h-[26px] md:w-[30px] md:h-[30px] rounded-full bg-[#13097D1A] flex items-center justify-center shrink-0">
              <Globe className="text-[#13097D] w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#9D9FA1] font-medium text-[12px] md:text-[14px] leading-none mb-1" style={{ fontFamily: 'Poppins' }}>
                Website
              </span>
              <a href={data.website} target="_blank" rel="noreferrer" className="text-[#2F3032] font-medium text-[14px] md:text-[16px] leading-none hover:text-[#13097D] hover:underline" style={{ fontFamily: 'Poppins' }}>
                {data.website}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-[26px] h-[26px] md:w-[30px] md:h-[30px] rounded-full bg-[#13097D1A] flex items-center justify-center shrink-0">
              <Phone className="text-[#13097D] w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#9D9FA1] font-medium text-[12px] md:text-[14px] leading-none mb-1" style={{ fontFamily: 'Poppins' }}>
                Call
              </span>
              <span className="text-[#2F3032] font-medium text-[14px] md:text-[16px] leading-none" style={{ fontFamily: 'Poppins' }}>
                {data.contactPhone}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-[26px] h-[26px] md:w-[30px] md:h-[30px] rounded-full bg-[#13097D1A] flex items-center justify-center shrink-0">
              <Mail className="text-[#13097D] w-3.5 h-3.5 md:w-4 md:h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#9D9FA1] font-medium text-[12px] md:text-[14px] leading-none mb-1" style={{ fontFamily: 'Poppins' }}>
                Email
              </span>
              <a href={`mailto:${data.contactEmail}`} className="text-[#2F3032] font-medium text-[14px] md:text-[16px] leading-none hover:text-[#13097D] hover:underline" style={{ fontFamily: 'Poppins' }}>
                {data.contactEmail}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    {isMapOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsMapOpen(false)}>
        <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center p-4 border-b border-[#EFEFEF]">
            <div>
              <h3 className="text-[#343C6A] font-semibold text-lg font-['Poppins']">College Location</h3>
              <p className="text-[#8C8CA1] text-xs font-['Poppins']">{data.collegeFullAddress}</p>
            </div>
            <button 
              onClick={() => setIsMapOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="text-[#343C6A]" size={24} />
            </button>
          </div>
          <div className="flex-1 w-full bg-gray-50">
             <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={mapUrl}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default InfoTab;