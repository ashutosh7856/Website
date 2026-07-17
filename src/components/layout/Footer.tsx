import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/AuthStore";
import toast from "react-hot-toast";
import {
  locationIcon,
  phoneIcon,
  emailIcon,
  linkedinIcon,
  facebookIcon,
  instagramIcon,
  twitterIcon,
} from "@/assets/icons";

export default function Footer() {
  const { toggleCounselorSignup, role, user, isAuthenticated, toggleLogin, isCounselorSignupOpen } = useAuthStore();
  const navigate = useNavigate();

  const handleBecomeProBuddy = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please log in as a student to register as a Pro Buddy.");
      toggleLogin(() => navigate("/pro-buddies/register"));
      return;
    }

    if (role === "counselor") {
      toast.error("Please use a student account to register as a Pro Buddy.");
      return;
    } else {
      navigate("/pro-buddies/register");
    }
  };

  const handleBecomeCounselor = () => {
    if (role === "counselor" && user?.verified) {
      toast.error("You are already registered as a counsellor!");
      return;
    }
    const hasSubmitted =
      localStorage.getItem("hasSubmittedCounselorApp") === "true";
    if (hasSubmitted) {
      toast.error("Your application is already under review.");
      return;
    }
    console.log('reached to popup open ')
    toggleCounselorSignup();
    console.log(isCounselorSignupOpen)
  };
  const isPromoPage = location.pathname === "/promo";
  if (isPromoPage) {
    return null;
  }

  return (
    <footer className="bg-[#0E1629] text-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 md:px-16 lg:px-[125px] py-6 sm:py-10">
        <div className="grid grid-cols-1 gap-8 sm:gap-10 md:gap-[50px] md:grid-cols-12">
          <div className="md:col-span-4 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-3">
              <img loading="lazy" decoding="async"
                src="/logo.webp"
                alt="Logo"
                className="h-8 sm:h-10 lg:h-12 object-contain rounded-md shrink-0"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-xl sm:text-2xl font-bold text-white">
                  ProCounsel
                </span>
                <span className="text-xs text-gray-300">By CatalystAI</span>
              </div>
            </div>

            <p className="text-sm sm:text-md leading-tight text-white max-w-full sm:max-w-[338px]">
              Discover the best colleges and courses in India. Your gateway to
              quality education and bright career prospects.
            </p>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start gap-3">
                <img loading="lazy" decoding="async"
                  src={locationIcon}
                  alt="Location"
                  className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 mt-0.5"
                />
                <p className="font-montserrat font-normal text-sm sm:text-base leading-tight text-white max-w-full sm:max-w-[280px]">
                  The Address Commercia, Office No. 427, Near Hinjewadi Bridge,
                  Wakad-411057
                </p>
              </div>
              <div className="flex items-center gap-3">
                <img loading="lazy" decoding="async"
                  src={phoneIcon}
                  alt="Phone"
                  className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                />
                <p className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  7004789484, 9470988669
                </p>
              </div>
              <div className="flex items-center gap-3">
                <img loading="lazy" decoding="async"
                  src={emailIcon}
                  alt="Email"
                  className="h-5 w-5 sm:h-6 sm:w-6 shrink-0"
                />
                <a
                  href="mailto:support@procounsel.co.in"
                  className="font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:underline break-all sm:break-normal"
                >
                  support@procounsel.co.in
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="md:min-h-[270px] flex flex-col">
              <h4 className="mb-4 sm:mb-6 font-montserrat font-medium text-lg sm:text-xl leading-none text-white">
                Useful Links
              </h4>
              <ul className="space-y-3 sm:space-y-6 flex-1">
                {/* <li>
                  <a href="/colleges" className="block font-montserrat font-normal text-sm sm:text-base leading-none text-[#180033] hover:text-[#FA660F] transition-colors">Colleges</a>
                </li> */}
                {/* <li>
                  <a href="/courses" className="block font-montserrat font-normal text-sm sm:text-base leading-none text-[#180033] hover:text-[#FA660F] transition-colors">Courses</a>
                </li> */}
                {/* <li>
                  <a
                    href="/exams"
                    className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                  >
                    Exams
                  </a>
                </li> */}
                {role !== "counselor" && role !== "proBuddy" && (
                  <li>
                    <a
                      href="/counsellor-listing"
                      className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                    >
                      Counsellors
                    </a>
                  </li>
                )}
                <li>
                  <Link
                    to="/about"
                    className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                  >
                    Contact
                  </Link>
                </li>
                {/* <li>
                  <a href="/counsellor-dashboard" className="block font-montserrat font-normal text-sm sm:text-base leading-none text-[#180033] hover:text-[#FA660F] transition-colors">Add College</a>
                </li> */}
                {/* Registration buttons — only for non-authenticated users or students */}
                {(role !== "counselor" && role !== "proBuddy") && (
                  <>
                    <li>
                      <button
                        onClick={handleBecomeCounselor}
                        className="block cursor-pointer font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors text-left w-full"
                      >
                        Register as Counsellor
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleBecomeProBuddy}
                        className="block cursor-pointer font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors text-left w-full"
                      >
                        Register as ProBuddy
                      </button>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="md:min-h-[270px] flex flex-col">
              <h4 className="mb-4 sm:mb-6 font-montserrat font-medium text-lg sm:text-xl leading-none text-white">
                Popular Categories
              </h4>
              <ul className="space-y-3 sm:space-y-6 flex-1">
                <li className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  Engineering
                </li>
                <li className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  Medical
                </li>
                <li className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  Management
                </li>
                <li className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  Design
                </li>
                <li className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  Science
                </li>
                <li className="font-montserrat font-normal text-sm sm:text-base leading-none text-white">
                  Arts
                </li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="md:w-[198px] md:min-h-[270px] flex flex-col">
              <h4 className="mb-4 sm:mb-6 font-montserrat font-medium text-lg sm:text-xl leading-none text-white">
                Follow Us on
              </h4>
              <ul className="space-y-3 sm:space-y-6 flex-1">
                <li className="flex items-center gap-3">
                  <img loading="lazy" decoding="async"
                    src={linkedinIcon}
                    alt="LinkedIn"
                    className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href="https://www.linkedin.com/company/procounsel-by-catalystai/posts/?feedView=all"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="LinkedIn"
                      className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                    >
                      LinkedIn
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <img loading="lazy" decoding="async"
                    src={facebookIcon}
                    alt="Facebook"
                    className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href="https://www.facebook.com/share/17GiZ34K46/"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                      className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                    >
                      Facebook
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <img loading="lazy" decoding="async"
                    src={instagramIcon}
                    alt="Instagram"
                    className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href="https://www.instagram.com/procounsel.co.in?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                      className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                    >
                      Instagram
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <img loading="lazy" decoding="async"
                    src={twitterIcon}
                    alt="Twitter"
                    className="h-6 w-6 sm:h-7 sm:w-7 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href="https://x.com/procounsel2025"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Twitter"
                      className="block font-montserrat font-normal text-sm sm:text-base leading-none text-white hover:text-[#FA660F] transition-colors"
                    >
                      Twitter
                    </a>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 sm:mt-6 border-t border-[#6C696933] pt-4 sm:pt-6 flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <p className="font-montserrat font-medium text-xs sm:text-sm leading-none text-white">
              © 2026 CATALYSTAI TECHNOLOGY PRIVATE LIMITED. All rights reserved.
            </p>
            <p className="font-montserrat font-normal text-xs leading-none text-white">
              ProCounsel™ is a trademark of CATALYSTAI TECHNOLOGY PRIVATE
              LIMITED.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-4 md:mt-0">
            <Link
              className="font-montserrat font-medium text-xs sm:text-sm leading-none text-white hover:text-[#FA660F] transition-colors"
              to="/privacy-policy"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link
              className="font-montserrat font-medium text-xs sm:text-sm leading-none text-white hover:text-[#FA660F] transition-colors"
              to="/terms"
            >
              Terms of Service
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link
              className="font-montserrat font-medium text-xs sm:text-sm leading-none text-white hover:text-[#FA660F] transition-colors"
              to="/cancellation-refund"
            >
              Cancellation & Refund
            </Link>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <Link
              className="font-montserrat font-medium text-xs sm:text-sm leading-none text-white hover:text-[#FA660F] transition-colors"
              to="/shipping-exchange"
            >
              Shipping & Exchange
            </Link>
            {/* <span className="text-slate-300 hidden sm:inline">|</span>
            <Link className="font-montserrat font-medium text-xs sm:text-sm leading-none text-[#180033] hover:text-[#FA660F] transition-colors" to="/sitemap">Sitemap</Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
