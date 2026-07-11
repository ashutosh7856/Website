import { MdOutlineFileDownload } from "react-icons/md";

const AppInstallCard = () => {
  return (
    <section className="bg-[#ECEBF5]  relative overflow-hidden">
      <div className="container max-w-7xl mx-auto flex flex-col md:flex-row items-center px-2 py-4">
        <div className="md:w-1/2 flex flex-col items-center text-center -mt-2">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#FA660F] leading-tight">
            Get Expert Guidance Instantly!
          </h1>
          <p className="mt-4 text-lg justify-center text-[#13097D]">
            Unlock your potential and find the perfect career path with our trusted mentors.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center md:justify-start">
            <a href="https://play.google.com/store/apps/details?id=com.catalystai.ProCounsel"
              target="_blank"
              rel="noopener noreferrer"
             className="flex items-center justify-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <img loading="lazy" decoding="async" src="/playstore.png" alt="Google Play" className="h-6"/>
              <div className="text-left text-[#13097D]">
                <p className="text-xs">Get it on</p>
                <p className="text-md font-semibold">Google Play</p>
              </div>
              <MdOutlineFileDownload className="h-5 w-5 text-[#13097D] ml-2"/>
            </a>
            <a
            href="https://apps.apple.com/in/app/procounsel/id6752525886"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-5 py-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg">
              <img loading="lazy" decoding="async" src="/appstore.png" alt="App Store" className="h-6" />
              <div className="text-left text-[#13097D]">
                <p className="text-xs">Get it on</p>
                <p className="text-md font-semibold">App Store</p>
              </div>
              <MdOutlineFileDownload className="h-5 w-5 text-[#13097D] ml-2"/>
            </a>
          </div>


        </div>
        <div className=" hidden md:w-1/2 mt-10 md:mt-0 lg:flex justify-center md:-mb-44">
           <img loading="lazy" decoding="async" src="/phoneImage.png" alt="App on phone screen" className="w-auto max-w-xs md:max-w-sm lg:max-w-md"/>
        </div>

      </div>
    </section>
  );
};

export default AppInstallCard;