import { type FormEvent } from "react";
import toast from "react-hot-toast";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { aboutContent } from "@/components/SEO/seoContent";
export default function RevampAbout() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!name || !email) {
      toast.error("Please fill in your name and email.");
      return;
    }

    toast.success("We will contact you soon.");
    event.currentTarget.reset();
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ProCounsel",
    "url": "https://www.procounsel.co.in",
    "logo": "https://www.procounsel.co.in/favicon.png",
    "description": "ProCounsel is India's leading career counselling and college admissions platform connecting students with verified counsellors, peer mentors, and educational resources.",
    "foundingDate": "2022",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@procounsel.co.in",
      "availableLanguage": ["English", "Hindi"]
    },
    "areaServed": "IN",
    "sameAs": []
  };

  return (
    <>
      <PageSEO
        title="About ProCounsel | Career Counselling & Study Abroad Consultants in India"
        description="ProCounsel is a trusted career counselling and study abroad consultancy in India, helping students choose the right career and global education paths."
        canonical="/about"
        keywords="career guidance and counselling, best abroad education consultants in india, top study abroad consultants in india, best counselling for abroad studies in india, career counselling website, top 10 educational consultants in india, best site for career guidance"
        jsonLd={organizationSchema}
      />
      <div className="flex flex-col bg-[#C6DDF040]">
      {/* Hero Section */}
      <div 
        className="w-full h-[460px] bg-[url('/probuddiesbg.jpg')] bg-cover bg-center"
      >
        <div className="w-full h-full bg-[#0E1629]/85 flex items-center justify-center">
          
          <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-[805px] px-4">
            <h1 className="text-white font-poppins font-bold text-[60px] leading-20 text-center">
              About Us
            </h1>
            <p className="max-w-[753px] font-poppins font-medium text-[24px] leading-tight text-center text-white/70">
              Bridging the gap between ambitious students and expert education counsellors
            </p>

          </div>
        </div>
      </div>

        {/* Mission Content */}
        <section className="w-full mx-auto bg-[#C6DDF040] h-[429px] mx-auto py-10 px-[60px] flex flex-col items-center">
        <div className="w-full max-w-[1260px] flex flex-col items-center gap-8">
          <div className="self-start box-border flex items-center w-[113px] h-[29px] gap-2 bg-white border border-gray-100 rounded-[6px] px-3 py-1 shadow-sm">
            <div className="w-4 h-4 bg-[#0E1629] shrink-0" />
              <span className="font-poppins font-semibold text-[14px] leading-none tracking-[0.07em] text-[#0E1629] uppercase whitespace-nowrap">
                MISSION
              </span>
          </div>

          <div className="w-full max-w-[1200px] flex flex-col gap-6">
            <p className="font-poppins font-medium text-[24px] leading-relaxed text-center text-[#0E1629]">
              ProCounsel acts as a comprehensive bridge between students and education counsellors, 
              empowering students to make informed decisions about their academic and career journey. 
              We believe every student deserves access to expert guidance when navigating the 
              complex landscape of higher education in India.
            </p>
            <p className="font-poppins font-medium text-[24px] leading-relaxed text-center text-[#0E1629]">
              Our platform democratizes access to quality education counselling, making it easier 
              for students to connect with verified professionals who can guide them through 
              college admissions, course selections, and career planning.
            </p>
          </div>
          
        </div>
      </section>

      {/* What we do */}
      <section className="w-full mx-auto bg-[#C6DDF040] pt-10 pb-20 px-[60px] flex flex-col items-center">
        <div className="w-full max-w-[1260px] flex flex-col items-center gap-8">
          <div className="self-start box-border flex items-center w-[149px] h-[29px] gap-2 bg-white border border-gray-100 rounded-[6px] px-3 py-1 shadow-sm">
            <div className="w-4 h-4 bg-[#0E1629] shrink-0" />
              <span className="font-poppins font-semibold text-[14px] leading-none tracking-[0.07em] text-[#0E1629] uppercase whitespace-nowrap">
                What We Do
              </span>
          </div>

          <div className="flex flex-row justify-center w-full gap-10">
            
            <div className="w-[580px] h-[450px] bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <h3 className="font-poppins font-semibold text-[28px] leading-[100%] text-[#2F43F2]">
                For Students
              </h3>
              <ul className="flex flex-col gap-4 list-disc pl-5">
                {[
                  "Explore comprehensive information about colleges, courses, and exams available across India",
                  "Browse detailed counsellor profiles with experience, specializations, and availability",
                  "Book personalized appointment sessions with expert counsellors",
                  "Subscribe to counsellors for ongoing support throughout your admission process",
                  "Communicate directly with subscribed counsellors through our secure chat platform"
                ].map((item, index) => (
                  <li key={index} className="font-poppins font-medium text-[18px] leading-[150%] text-[#6B7280]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-[580px] h-[450px] bg-white rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              <h3 className="font-poppins font-semibold text-[28px] leading-[100%] text-[#2F43F2]">
                For Counsellors
              </h3>
              <ul className="flex flex-col gap-4 list-disc pl-5">
                {[
                  "Create comprehensive profiles showcasing expertise and experience",
                  "Manage availability and appointment scheduling efficiently",
                  "Connect with motivated students seeking guidance",
                  "Offer subscription-based ongoing support services",
                  "Build lasting relationships with students throughout their academic journey"
                ].map((item, index) => (
                  <li key={index} className="font-poppins font-medium text-[18px] leading-[150%] text-[#6B7280]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/**
      <section className="w-full mx-auto bg-[#C6DDF040] px-[60px] py-16">
        <div className="w-full max-w-[1260px] mx-auto flex flex-col">
          <div className="w-full flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="box-border flex items-center w-[98px] h-[29px] gap-2 bg-white border border-gray-100 rounded-[6px] px-3 py-1 shadow-sm shrink-0">
              <div className="w-4 h-4 bg-[#0E1629] shrink-0" />
                <span className="font-poppins font-semibold text-[14px] leading-none tracking-[0.07em] text-[#0E1629] uppercase whitespace-nowrap">
                TEAM
                </span>
              </div>

              <h2 className="max-w-[682px] font-poppins font-medium text-[24px] leading-[150%] text-[#0E1629]">
                Discover curated programs across mental wellness, assessments, admissions, and upskilling led by experienced professionals, built around your needs.
              </h2>
            </div>

            <div className="mt-[32px] flex flex-row gap-[24px] w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {teamMembers.map((member) => (
                <div key={member.id} className="w-[244px] h-[355px] shrink-0 border rounded-[16px] relative overflow-hidden flex flex-col items-center">
                  <img loading="lazy" decoding="async" 
                    src={member.image} 
                    alt={member.name} 
                    className="w-[220px] h-[208px] mt-[12px] rounded-[10px] object-cover bg-[#D4B38C]" 
                  />
          
                  <div className="w-full px-[12px] pt-[16px] flex flex-col gap-[4px] items-start">
                    <h3 className="w-[168px] h-[27px] font-poppins font-medium text-[18px] leading-[100%] text-[#0E1629] truncate">
                      {member.name}
                    </h3>
                    <p className="w-[84px] h-[21px] font-poppins font-normal text-[14px] leading-[100%] text-[#6B7280]">
                      {member.designation}
                    </p>
                  </div>

                  <div className="absolute bottom-0 w-[244px] h-[64px] bg-[#0E1629] rounded-b-[16px] flex flex-col justify-center px-[14px] gap-[8px]">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-[6px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        <span className="font-poppins font-normal text-[12px] leading-[100%] text-[#F5F5F5]">Call</span>
                      </div>
                      <span className="font-poppins font-normal text-[12px] leading-[100%] text-[#F5F5F5]">{member.phone}</span>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-[6px]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F5F5F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span className="font-poppins font-normal text-[12px] leading-[100%] text-[#F5F5F5]">Email</span>
                      </div>
                      <span className="font-poppins font-normal text-[12px] leading-[100%] text-[#F5F5F5]">{member.email}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-[24px] flex justify-end w-full">
              <SeeAllButton />
            </div>
          </div>
        </section>
      */}
      
      {/* Features */}
      <section className="w-full bg-[#C6DDF040] pb-20">
        <div className="w-full max-w-[1440px] mx-auto px-[60px] py-16">
          <div className="w-full max-w-[1260px] mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="box-border flex items-center w-[123px] h-[29px] gap-2 bg-white border border-gray-100 rounded-[6px] px-3 py-1 shadow-sm shrink-0">
              <div className="w-4 h-4 bg-[#0E1629] shrink-0" />
              <span className="font-poppins font-semibold text-[14px] leading-none tracking-[0.07em] text-[#0E1629] uppercase whitespace-nowrap">
                FEATURES
              </span>
            </div>

            <h2 className="max-w-[682px] font-poppins font-medium text-[24px] leading-[150%] text-[#0E1629]">
              Discover curated programs across mental wellness, assessments, admissions, and upskilling led by experienced professionals, built around your needs.
            </h2>
          </div>
        </div>

        <div className="w-full flex flex-col md:flex-row">
          
          <div className="flex-1 min-h-[380px] bg-[#C6DDF0]/25 p-10 flex flex-col justify-between">
            <img loading="lazy" decoding="async" 
              src="/feature1.svg" 
              alt="ProCoins" 
              className="w-[60px] h-[60px]" 
            />
            <div className="flex flex-col gap-3 mt-10">
              <h3 className="font-poppins font-semibold text-[28px] leading-tight text-[#0E1629]">
                ProCoins System
              </h3>
              <p className="max-w-[410px] font-poppins font-medium text-[18px] leading-[150%] text-[#6B7280]">
                Secure virtual currency (₹1 = 1 ProCoin) for seamless transactions, powered by Razorpay for safe and reliable payments.
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[380px] bg-[#FA660F]/25 p-10 flex flex-col justify-between border-x border-white/10">
            <img loading="lazy" decoding="async" 
              src="/feature2.svg" 
              alt="Secure Platform" 
              className="w-[60px] h-[60px]" 
            />
            <div className="flex flex-col gap-3 mt-10">
              <h3 className="font-poppins font-semibold text-[28px] leading-tight text-[#0E1629]">
                Secure Platform
              </h3>
              <p className="max-w-[410px] font-poppins font-medium text-[18px] leading-[150%] text-[#6B7280]">
                Your privacy and data security are our top priorities. We maintain strict confidentiality and secure communication channels.
              </p>
            </div>
          </div>
          <div className="flex-1 min-h-[380px] bg-[#2F43F2]/25 p-10 flex flex-col justify-between">
            <img loading="lazy" decoding="async" 
              src="/feature3.svg" 
              alt="Database" 
              className="w-[60px] h-[60px]" 
            />
            <div className="flex flex-col gap-3 mt-10">
              <h3 className="font-poppins font-semibold text-[28px] leading-tight text-[#0E1629]">
                Comprehensive Database
              </h3>
              <p className="max-w-[410px] font-poppins font-medium text-[18px] leading-[150%] text-[#6B7280]">
                Access detailed information about colleges, courses, exams, and admission processes across India in one centralized platform.
              </p>
            </div>
          </div>

        </div>
      </section>

      <section className="w-full mx-auto bg-[#C6DDF040] px-[60px] py-[20px] flex flex-col items-center">
        
        <div className="flex flex-col items-center gap-[20px] mb-[60px]">
          <h2 className="font-poppins font-bold text-[28px] leading-[100%] text-center text-[#0E1629]">
            Reach our <span className="text-[#FA660F]">Help Desk</span> for support
          </h2>
          <p className="w-full max-w-[652px] font-poppins font-semibold text-[16px] leading-[24px] text-center text-[#6B7280]">
            Questions? Need assistance? Our dedicated support team is here to help you every step of the way:
          </p>
        </div>

        <div className="w-full max-w-[1320px] flex flex-row gap-[40px] justify-center items-start">
          
          <div className="w-[568px] flex flex-col">
            <h3 className="font-poppins font-semibold text-[20px] leading-[100%] text-[#0E1629] mb-[24px]">
              How This Helps
            </h3>

            <div className="relative flex flex-col gap-[32px]">
              {/* Connecting Line */}
              <div className="absolute left-[22px] top-[24px] bottom-[60px] w-[4px] bg-[#6B7280] z-0"></div>

              <div className="flex flex-row items-start gap-[16px] relative z-10">
                <div className="w-[48px] h-[48px] rounded-full bg-[#0E1629] flex items-center justify-center shrink-0">
                  <span className="font-poppins font-semibold text-[16px] leading-[100%] text-white">01</span>
                </div>
                <div className="flex flex-col gap-[6px] pt-[12px]">
                  <h4 className="font-poppins font-semibold text-[16px] leading-[100%] text-[#0E1629]">
                    Get in Touch
                  </h4>
                  <p className="font-poppins font-normal text-[14px] leading-[150%] text-[#6B7280]">
                    Share your details and let us know what you need. We'll connect with you within 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-start gap-[16px] relative z-10">
                <div className="w-[48px] h-[48px] rounded-full bg-[#0E1629] flex items-center justify-center shrink-0">
                  <span className="font-poppins font-semibold text-[16px] leading-[100%] text-white">02</span>
                </div>
                <div className="flex flex-col gap-[6px] pt-[12px]">
                  <h4 className="font-poppins font-semibold text-[16px] leading-[100%] text-[#0E1629]">
                    Expert Review
                  </h4>
                  <p className="font-poppins font-normal text-[14px] leading-[150%] text-[#6B7280]">
                    Our team reviews your inquiry and provides tailored solutions for your specific needs.
                  </p>
                </div>
              </div>

              <div className="flex flex-row items-start gap-[16px] relative z-10">
                <div className="w-[48px] h-[48px] rounded-full bg-[#0E1629] flex items-center justify-center shrink-0">
                  <span className="font-poppins font-semibold text-[16px] leading-[100%] text-white">03</span>
                </div>
                <div className="flex flex-col gap-[6px] pt-[12px]">
                  <h4 className="font-poppins font-semibold text-[16px] leading-[100%] text-[#0E1629]">
                    Start Collaborating
                  </h4>
                  <p className="font-poppins font-normal text-[14px] leading-[150%] text-[#6B7280]">
                    We'll schedule a call and begin our partnership to help you achieve your goals.
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="w-[712px] min-h-[359px] bg-white rounded-[16px] py-[30px] px-[20px] flex flex-col">
            <h3 className="font-poppins font-semibold text-[20px] leading-[100%] text-[#2F43F2] mb-[24px]">
              Contact US
            </h3>

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-[20px] items-center">
              
              <div className="flex flex-col gap-[8px] w-full max-w-[673px]">
                <label className="font-poppins font-medium text-[14px] leading-[100%] text-[#0E1629]">
                  Name
                </label>
                <div className="w-full h-[56px] bg-[#F3F7F6] rounded-[12px] flex items-center px-[18px] py-[14px] gap-[12px]">
                  <img loading="lazy" decoding="async" src="/round-profile.svg" alt="Profile Icon" className="w-[20px] h-[20px]" />
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Enter Your Name"
                    className="w-full bg-transparent outline-none font-poppins font-medium text-[16px] text-[#0E1629] placeholder:text-[#6B7280]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[8px] w-full max-w-[673px]">
                <label className="font-poppins font-medium text-[14px] leading-[100%] text-[#0E1629]">
                  Email
                </label>
                <div className="w-full h-[56px] bg-[#F3F7F6] rounded-[12px] flex items-center px-[18px] py-[14px] gap-[12px]">
                  <img loading="lazy" decoding="async" src="/round-email.svg" alt="Email Icon" className="w-[20px] h-[20px]" />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Enter Your Email"
                    className="w-full bg-transparent outline-none font-poppins font-medium text-[16px] text-[#0E1629] placeholder:text-[#6B7280]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full max-w-[673px] h-[52px] mt-[8px] bg-[#2F43F2] rounded-[12px] flex cursor-pointer items-center justify-center shadow-[-8px_8px_28px_0px_rgba(0,0,0,0.06)] hover:bg-[#2536c9] transition-colors"
              >
                <span className="font-manrope font-bold text-[18px] leading-[24px] text-white">
                  Submit Now
                </span>
              </button>

            </form>
          </div>

        </div>
      </section>

      <SeoArticle {...aboutContent} />

      </div>
    </>
  );
}