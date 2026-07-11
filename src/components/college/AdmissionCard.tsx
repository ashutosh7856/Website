const AdmissionCard = () => {
  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#EFEFEF] shadow-[0_-4px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 flex items-center justify-between gap-3">
         <div className="flex flex-col">
            <h3 className="text-[#343C6A] font-semibold text-[16px] leading-tight font-['Poppins']">
              Admissions Open
            </h3>
            <span className="text-[#8C8CA1] text-[12px] font-medium font-['Poppins']">
              Session 2026-27
            </span>
         </div>
         <button className="bg-[#13097D] text-white rounded-lg px-6 py-2.5 font-medium font-['Poppins'] text-[14px] hover:bg-[#0f0763] transition-colors shadow-md whitespace-nowrap">
            Apply Now
         </button>
      </div>

      <div className="hidden md:flex bg-white rounded-2xl border border-[#EFEFEF] shadow-[0px_0px_4px_0px_#23232326] p-5 flex-col gap-4 top-24">
        
        <div className="w-full h-[220px] rounded-xl overflow-hidden relative">
           <img loading="lazy" decoding="async" 
             src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=2940&auto=format&fit=crop" 
             alt="Admission Open" 
             className="w-full h-full object-cover"
           />
           <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-60"></div>
           
           <div className="absolute top-3 right-3">
              <span className="bg-[#FA660F] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider font-['Poppins']">
                New Batch
              </span>
           </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 
            className="text-[#343C6A] font-semibold"
            style={{ fontFamily: 'Poppins', fontSize: '20px', lineHeight: '125%' }}
          >
            Admissions Open
          </h3>
          <p 
            className="text-[#8C8CA1] font-medium"
            style={{ fontFamily: 'Poppins', fontSize: '14px', lineHeight: '125%' }}
          >
            Applications for the academic year 2026-27 are now being accepted. Secure your spot today.
          </p>
        </div>

        <button 

        disabled
          className="w-full bg-[#13097D] text-white disabled:cursor-not-allowed rounded-xl cursor-pointer flex items-center justify-center hover:bg-[#0f0763] transition-colors py-3 mt-1 shadow-lg shadow-indigo-100"
        >
          <span 
            className="font-medium"
            style={{ fontFamily: 'Poppins', fontSize: '16px', lineHeight: '100%' }}
          >
            Apply for Admission
          </span>
        </button>

        <div className="flex flex-col gap-3 mt-1 pt-4 border-t border-[#EFEFEF]">
          <div className="flex justify-between items-center">
              <span className="text-[#718EBF] text-sm font-medium" style={{ fontFamily: 'Poppins' }}>Application Fee</span>
              <span className="text-[#343C6A] text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>₹ 1,500</span>
          </div>
          <div className="flex justify-between items-center">
              <span className="text-[#718EBF] text-sm font-medium" style={{ fontFamily: 'Poppins' }}>Deadline</span>
              <span className="text-[#343C6A] text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>30th Apr, 2026</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdmissionCard;