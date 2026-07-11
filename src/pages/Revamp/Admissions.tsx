import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import Stories from "@/components/Revamp/probuddies/Stories";
import Faq from "@/components/Revamp/admissions/Faq";
import Blogs from "@/components/Revamp/admissions/Blogs";
import College from "@/components/Revamp/admissions/College";
import Deadlines from "@/components/Revamp/admissions/Deadlines";
import CounsellorSection from "@/components/Revamp/admissions/counsellor/CounsellorSection";
import Timeline from "@/components/Revamp/admissions/Timeline";
import RevampBannerSection from "@/components/Revamp/banners/RevampBannerSection";
import PageSEO from "@/components/SEO/PageSEO";
import SeoArticle from "@/components/SEO/SeoArticle";
import { homeContent } from "@/components/SEO/seoContent";

export default function Admissions() {
  const navigate = useNavigate();
  const location = useLocation();
  const isReactSnap = typeof navigator !== 'undefined' && navigator.userAgent === 'ReactSnap';
  const hasSeenSplash =
    isReactSnap ||
    (typeof window !== 'undefined' && window.sessionStorage.getItem('admissions-splash-seen') === 'true');

  const navigateWithTabTransition = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigate(path);
  };
  const admissionsStories = [
    {
      name: "Ashutosh",
      role: "Student",
      rating: 4,
      text: "The course planning was clear and easy to follow. Weekly targets and mock tests kept me focused and helped me prepare with confidence.",
      image: "/review1.webp",
    },
    {
      name: "Ananya",
      role: "Student",
      rating: 5,
      text: "Topic-wise lessons and regular doubt sessions made preparation smooth. The structure helped me stay disciplined and improve consistently.",
      image: "/review2.webp",
    },
    {
      name: "Shubham",
      role: "Student",
      rating: 4.5,
      text: "Math and Chemistry sessions were practical and exam-focused. Shortcuts plus regular practice improved my speed, accuracy, and confidence.",
      image: "/review3.webp",
    },
  ];

  const [splashPhase, setSplashPhase] = useState(hasSeenSplash ? 3 : 0);
  const animationPhase = 4;

  useEffect(() => {
    if (hasSeenSplash) return; // Skip animation if already seen this session or while snapping.

    const timers = [
      setTimeout(() => setSplashPhase(1), 450),
      setTimeout(() => setSplashPhase(2), 850),
      setTimeout(() => setSplashPhase(3), 1650),
      setTimeout(() => {
        sessionStorage.setItem('admissions-splash-seen', 'true');
      }, 2600),
    ];

    return () => timers.forEach(clearTimeout);
  }, [hasSeenSplash]);

  const cardAnimate = splashPhase >= 3 && animationPhase >= 4 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.98 };
  const cardTransition = { duration: 0.55, ease: "easeOut" as const };

  // SiteNavigationElement tells Google which pages should appear as sitelinks
  const siteNavigationSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ProCounsel Main Navigation",
    "description": "Explore ProCounsel's key sections for career counselling, admissions, and student guidance",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Admissions",
        "description": "College admission guidance, blogs, deadlines, and expert counsellors",
        "url": "https://www.procounsel.co.in/admissions"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Courses",
        "description": "JEE, NEET, MBA and career prep courses by verified counsellors",
        "url": "https://www.procounsel.co.in/courses"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Community",
        "description": "Student Q&A community for admissions, exams, and career guidance",
        "url": "https://www.procounsel.co.in/community"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "ProBuddies",
        "description": "Connect with college seniors for peer mentorship and campus insights",
        "url": "https://www.procounsel.co.in/pro-buddies"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "About",
        "description": "Learn about ProCounsel's mission and team",
        "url": "https://www.procounsel.co.in/about"
      }
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.procounsel.co.in/#website",
    "name": "ProCounsel",
    "url": "https://www.procounsel.co.in",
    "description": "India's leading platform for career counselling services, university admission support, study abroad consultant, and career guidance for students.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.procounsel.co.in/admissions/blogs?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ProCounsel",
    "url": "https://www.procounsel.co.in",
    "logo": "https://www.procounsel.co.in/favicon.png",
    "sameAs": [],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "url": "https://www.procounsel.co.in/contact"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does an education consultant in India do?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An education consultant in India is like your personal navigator for school and job choices, zeroing in on what you love, what you're good at, and where you wanna end up. Over at ProCounsel, we hook you up with career counselling services, solid career guidance for students, and hands-on university admission support whether you're staying in India or heading overseas."
        }
      },
      {
        "@type": "Question",
        "name": "How do career counselling services help students?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Career counselling services are a lifesaver—they help kids figure out their real strengths, what fires them up, and careers that actually match. You do some structured assessments, chat with a certified career coach, and boom: no more head-scratching, just clear steps to nail your education and career picks with total confidence."
        }
      },
      {
        "@type": "Question",
        "name": "What are the benefits of career counselling?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The benefits of career counselling? You get crystal-clear thinking, a confidence boost, and a solid plan for the long game. Lean on experienced career coaching services, and you'll dodge those career mistakes that cost you big, save tons of time and cash, plus snag personalized career guidance for students that's spot-on for your dreams."
        }
      },
      {
        "@type": "Question",
        "name": "Is career counselling worth it in India?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oh yeah, career counselling is worth it in India hands down—think cutthroat competition and a million paths to pick from. With top career coaches and dependable career counselling services in your corner, you and other pros make choices that stick and charge into your future feeling unstoppable."
        }
      },
      {
        "@type": "Question",
        "name": "What is the scope of career counselling?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The scope of career counselling is exploding everywhere in India these days. Career coaching services tackle subject selection, skill assessment, plotting higher education, smooth career transitions, and even career counselling online, so top guidance hits students no matter where they are."
        }
      },
      {
        "@type": "Question",
        "name": "How does career counselling online work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Career counselling online? It's all about jumping on virtual calls for pro advice without leaving home. ProCounsel's setup includes quick assessments, real-talk one-on-ones, and custom tips from a certified career coach—quality stuff you can grab from any corner of India."
        }
      },
      {
        "@type": "Question",
        "name": "Who should take career guidance for students?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Anyone grabbing career guidance for students will love it post-10th, after 12th, once you're done with grad school, or if you're a pro in the workforce. Feeling stuck on your next move, college plans, or skills? Dive into professional career counselling services and sort it out."
        }
      },
      {
        "@type": "Question",
        "name": "How do study abroad consultants in India support students?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Study abroad consultants in India got your back on choosing countries, scouting unis, apps, and visas. As one of the best study abroad consultants in India, ProCounsel makes the whole international education journey a breeze with full support from start to finish."
        }
      },
      {
        "@type": "Question",
        "name": "What makes ProCounsel a trusted career consultant?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "What sets ProCounsel apart as a trusted career consultant? It's our custom-fit advice, straight-up ethical counselling, and pro-level planning. Certified career coaches and battle-tested education consultants in India dish out real-world pointers, solid assessments, and total backup for your school and job decisions."
        }
      },
      {
        "@type": "Question",
        "name": "How do I choose the best career coaching services?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "To snag the best career coaching services, hunt for certified pros, open-and-honest processes, and advice tailored just for you. The top career coaches who really get student goals and what's hot in industries? They're the ones who deliver career support that actually moves the needle."
        }
      },
      {
        "@type": "Question",
        "name": "Are career coaching services useful for working professionals?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "For sure, career coaching services rock for working professionals chasing growth, a career switch, or fresh skills. Top career coaches link up your know-how with killer future gigs."
        }
      }
    ]
  };

  return (
    <>
      <PageSEO
        title="Best Career Counselling Services for Students – Unlock Your Future with Procounsel"
        description="Procounsel offers expert career counselling services in India. From university admissions support to study abroad consultant, we shape student futures with personalized coaching. Book now!"
        canonical="/"
        keywords="education consultant in india, university admission support, career counselling services, study abroad consultant india, career coaching services, career counselling online, career guidance for students, best study abroad consultants in india, best career coaching services, b tech registration, btech admission, engineering admission"
        jsonLd={[siteNavigationSchema, websiteSchema, organizationSchema, faqSchema]}
      />
    <div className="min-h-screen">
      {/* Mobile hero — fully static (NO framer-motion) so it paints instantly from
          prerendered HTML. This is the mobile LCP element, replacing the API-gated
          counsellor image, and carries the page's single <h1>. */}
      <section className="md:hidden px-5 pt-8 pb-9">
        <h1 className="text-[#0E1629] text-[32px] leading-[1.12] font-extrabold font-['Poppins']">
          Your personal{' '}
          <span
            style={{
              backgroundImage: 'linear-gradient(90deg, #FA660F, #2F43F2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Admission Expert
          </span>
        </h1>
        <p className="mt-3.5 text-[#4B5563] text-[15px] font-medium font-['Poppins'] leading-[1.55]">
          Find trusted guidance, personalised course matches, and clear admissions
          support to help you choose the right path.
        </p>
        <button
          onClick={() => navigateWithTabTransition('/counsellor-listing')}
          className="mt-5 w-full bg-[#2f43f2] active:bg-[#2437d1] text-white py-3.5 rounded-[48px] text-[15px] font-semibold font-['Poppins'] transition-colors"
        >
          Book Admission Counselling
        </button>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { n: '10,000+', l: 'Students Guided' },
            { n: '95%', l: 'Success Rate' },
            { n: '15+ Yrs', l: 'of Excellence' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="text-[#0E1629] text-[22px] font-extrabold font-['Poppins'] leading-none">
                {s.n}
              </p>
              <p className="mt-1 text-[#6B7280] text-[11px] font-medium font-['Poppins'] leading-tight">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="hidden md:flex relative w-full h-[567px] flex items-center justify-center overflow-hidden">
        {/* Splash Screen */}
        <AnimatePresence>
          {splashPhase < 3 && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 z-20 bg-white flex items-center justify-center"
            >
              {/* Both logo and text are stacked in center, then separate */}
              <div className="relative flex items-center justify-center">
                {/* Logo - starts centered, then shifts left */}
                <motion.img
                  src="/logo.svg"
                  alt="ProCounsel Logo"
                  className="w-[118px] h-[120px] relative z-10"
                  initial={{ scale: 0, opacity: 0, x: 0 }}
                  animate={
                    splashPhase === 0
                      ? { scale: 1.2, opacity: 1, x: 0 }
                      : splashPhase === 1
                        ? { scale: 0.75, opacity: 1, x: 0 }
                        : { scale: 0.75, opacity: 1, x: -175 }
                  }
                  transition={
                    splashPhase === 0
                      ? { type: "spring", stiffness: 200, damping: 20, delay: 0.2 }
                      : splashPhase === 1
                        ? { duration: 0.5, ease: "easeInOut" }
                        : { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }
                  }
                />

                {/* ProCounsel Text - hidden behind logo, then shifts right */}
                <motion.span
                  className="absolute text-[60px] font-semibold font-['Poppins'] leading-none whitespace-nowrap"
                  initial={{ opacity: 0, x: 0 }}
                  animate={
                    splashPhase >= 2
                      ? { opacity: 1, x: 80 }
                      : { opacity: 0, x: 0 }
                  }
                  transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{
                    backgroundImage: "linear-gradient(to right, #FA660F, #2F43F2)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  ProCounsel
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <div
          className="text-center xl-px-4 w-full h-[567px] bg-[#0e1629] flex items-center justify-center"
        >
          <div className="w-7xl h-full relative">
            {/* Header Text */}
            <div className="absolute left-1/2 -translate-x-1/2 top-[36px] max-w-[818px] w-full px-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={splashPhase >= 3 && animationPhase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-white text-[40px] font-extrabold font-['Poppins'] mb-4 leading-tight"
              >
                Your personal Admission Expert
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={splashPhase >= 3 && animationPhase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-[#f5f5f5] text-[16px] font-medium font-['Poppins'] max-w-[753px] mx-auto"
              >
                Find trusted guidance, personalised course matches, and clear admissions support to help you choose the right path.
              </motion.p>
            </div>

            {/* CTA Button */}
            <motion.button
              onClick={() => navigateWithTabTransition("/counsellor-listing")}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={splashPhase >= 3 && animationPhase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute z-30 left-1/2 hover:cursor-pointer -translate-x-1/2 top-[180px] bg-[#2f43f2] hover:bg-[#2437d1] transition-colors text-white px-8 py-3 rounded-[48px] text-[16px] font-medium font-['Poppins']"
            >
              Book Admission Counselling
            </motion.button>

            {/* Grid Cards */}
            <div className="absolute inset-0">
              {/* Admissions Card */}
              <motion.div
                onClick={() => navigateWithTabTransition('/admissions')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0 }}
                className="absolute left-16 top-42.75 w-53 h-53.75 bg-[#ffc8af] rounded-[28px] overflow-hidden cursor-pointer"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/admissions/admission.svg"
                  alt="Student"
                  fetchPriority="high"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(179.04deg, rgba(14, 22, 41, 0) 24.07%, rgba(14, 22, 41, 0.7) 69.84%)",
                  }}
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white w-[195px]">
                  <p className="text-[24px] font-semibold font-['Poppins'] mb-2">Admissions</p>
                  <p className="text-[14px] font-['Poppins']">
                    <span className="font-semibold">10,000+</span> Students Guided | <span className="font-semibold">95%</span> Success Rate
                  </p>
                </div>
              </motion.div>

              {/* About Us Card */}
              <motion.div
                onClick={() => navigateWithTabTransition('/revamp-about')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0.08 }}
                className="absolute left-16 top-102.5 w-53 h-35.25 bg-[#343C6A] rounded-[28px] cursor-pointer"
              >
                <div className="flex flex-col items-center justify-center h-full px-6">
                  <p className="text-[#FFFFFF] text-[24px] font-semibold font-['Poppins'] mb-2">About Us</p>
                  <p className="text-[#FFFFFF] text-[14px] font-['Poppins'] text-center">
                    <span className="font-semibold">15+ Years</span> of Excellence | Trusted by <span className="font-semibold">50,000+ Families</span>
                  </p>
                </div>
              </motion.div>

              {/* Courses Card */}
              <motion.div
                onClick={() => navigateWithTabTransition('/courses')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0.14 }}
                className="absolute left-74.5 top-66 w-53 h-71.75 rounded-[28px] overflow-hidden bg-gray-700 cursor-pointer"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/admissions/course.webp"
                  alt="Courses"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(179.04deg, rgba(14, 22, 41, 0) 24.07%, rgba(14, 22, 41, 0.7) 69.84%)",
                  }}
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white w-[195px]">
                  <p className="text-[24px] font-semibold font-['Poppins'] mb-2">Courses</p>
                  <p className="text-[14px] font-['Poppins']">
                    <span className="font-semibold">500+</span> Courses Available | <span className="font-semibold">25,000+</span> Active Learners
                  </p>
                </div>
              </motion.div>

              {/* Community Card */}
              <motion.div
                onClick={() => navigateWithTabTransition('/community')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0.22 }}
                className="absolute left-133.5 top-71.75 w-53 h-66 rounded-[28px] overflow-hidden bg-gray-700 cursor-pointer"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/admissions/community.webp"
                  alt="Community"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(179.04deg, rgba(14, 22, 41, 0) 24.07%, rgba(14, 22, 41, 0.7) 69.84%)",
                  }}
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white w-[195px]">
                  <p className="text-[24px] font-semibold font-['Poppins'] mb-2">Community</p>
                  <p className="text-[14px] font-['Poppins']">
                    <span className="font-semibold">120+</span> Members | <span className="font-semibold">20+</span> Monthly Events
                  </p>
                </div>
              </motion.div>

              {/* ProBuddies Card */}
              <motion.div
                onClick={() => navigateWithTabTransition('/pro-buddies')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0.3 }}
                className="absolute left-192.5 top-66 w-53 h-71.75 rounded-[28px] overflow-hidden bg-gray-700 cursor-pointer"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/admissions/pro.webp"
                  alt="ProBuddies"
                  className="absolute inset-0 w-full h-full object-fit"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(179.04deg, rgba(14, 22, 41, 0) 24.07%, rgba(14, 22, 41, 0.7) 69.84%)",
                  }}
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white w-[195px]">
                  <p className="text-[24px] font-semibold font-['Poppins'] mb-2">ProBuddies</p>
                  <p className="text-[14px] font-['Poppins']">
                    <span className="font-semibold">300+</span> Mentors | <span className="font-semibold">850+</span> Mentees Connected
                  </p>
                </div>
              </motion.div>

              {/* Rank Predictor Card */}
              <motion.div
                onClick={() => navigate('/mhtcet-college-predictor')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0.38 }}
                className="absolute lg:right-0 xl:right-16 top-42.75 w-53 h-53.75 bg-[#68aab8] rounded-[28px] overflow-hidden cursor-pointer"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/ranking-1.png"
                  alt="MHT-CET College Predictor"
                  className="absolute inset-0 w-full h-full object-fit"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(179.04deg, rgba(14, 22, 41, 0) 24.07%, rgba(14, 22, 41, 0.7) 69.84%)",
                  }}
                />
                <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center text-white w-[195px]">
                  <p className="text-[24px] font-semibold font-['Poppins'] mb-2">MHT-CET Predictor</p>
                  <p className="text-[14px] font-['Poppins']">
                    Estimate your MHT-CET rank and discover the colleges within your reach.
                  </p>
                </div>
              </motion.div>

              {/* Bottom Right White Card */}
              <motion.div
                onClick={() => navigate('/admissions/deadlines')}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={cardAnimate}
                transition={{ ...cardTransition, delay: 0.46 }}
                className="absolute lg:right-0 xl:right-16 top-102.5 w-53 h-35.25 rounded-[28px] overflow-hidden bg-gray-700 cursor-pointer"
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src="/admissions/deadline.svg"
                  alt="Deadlines"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(179.04deg, rgba(14, 22, 41, 0) 24.07%, rgba(14, 22, 41, 0.7) 69.84%)",
                  }}
                />

                <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
                  <p className="text-[#FFFFFF] text-[24px] font-semibold font-['Poppins'] mb-1">
                    Deadlines
                  </p>
                  <p className="text-[#FFFFFF] text-[13px] leading-[1.3] font-['Poppins'] text-center">
                    Discover their expertise and find the right guidance for your future
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      
      <CounsellorSection />
      <div className="hidden md:block">
        <Timeline />
      </div>
      <RevampBannerSection />
      <College />
      <Deadlines />
      <Stories stories={admissionsStories} />
      <Blogs />
      <SeoArticle {...homeContent} />
      <Faq />
    </div>
    </>
  );
}
