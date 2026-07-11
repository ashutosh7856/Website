import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { buttonHoverScale, buttonTapScale, buttonTransition } from "@/components/common/PageTransition";
import { useAuthStore } from "@/store/AuthStore";
import { useSearchStore } from "@/store/SearchStore";
import { SearchResults } from "@/components/layout/SearchResults";
import toast from "react-hot-toast";

const tabs = [
    { id: 1, name: 'Admission', iconPath: '/Admissions.webp', path: '/admissions' },
    { id: 2, name: 'Courses', iconPath: '/Courses.svg', path: '/courses' },
    { id: 3, name: 'Community', iconPath: '/Community.webp', path: '/community' },
    { id: 4, name: 'ProBuddies', iconPath: '/ProBuddy.webp', path: '/pro-buddies' },
    //{ id: 5, name: 'About us', iconPath: '/Admissions.webp', path: '/revamp-about' }
];

export default function RevampHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toggleLogin, isAuthenticated, logout, role, user } = useAuthStore();
    const isProBuddy = role === 'proBuddy';
    const isCounselor = role === 'counselor';
    const isRestrictedRole = isProBuddy || isCounselor;
    const visibleTabs = useMemo(() => {
        if (isCounselor) {
            return [
                { id: 5, name: 'Dashboard', iconPath: '/ProBuddy.webp', path: '/counsellor-dashboard' },
                { id: 3, name: 'Community', iconPath: '/Community.webp', path: '/community' },
            ];
        }

        if (isProBuddy) {
            return [
                { id: 4, name: 'Dashboard', iconPath: '/ProBuddy.webp', path: '/pro-buddies/dashboard' },
                { id: 3, name: 'Community', iconPath: '/Community.webp', path: '/community' },
            ];
        }

        return tabs;
    }, [isCounselor, isProBuddy]);
    const [activeTab, setActiveTab] = useState(1);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const desktopSearchRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLDivElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
    const { query, setQuery, performSearch, clearResults, setSearchOpen } = useSearchStore();

    const preloadRoute = (path: string) => {
        if (path === '/courses') {
            void import('@/pages/Revamp/Courses');
            return;
        }

        if (path === '/community') {
            void import('@/pages/CommunityPage');
            return;
        }

        if (path === '/pro-buddies') {
            void import('@/pages/Revamp/ProBuddies');
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            visibleTabs.forEach((tab) => preloadRoute(tab.path));
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [visibleTabs]);

    useEffect(() => {
        const currentTab = visibleTabs.find(tab => {
            if (tab.path === "/admissions") {
                return location.pathname === "/" || location.pathname === tab.path;
            }

            return location.pathname === tab.path || location.pathname.startsWith(`${tab.path}/`);
        });

        if (currentTab) {
            setActiveTab(currentTab.id);
        }
    }, [location.pathname, visibleTabs]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 40) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        handleResize();
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("resize", handleResize);
        
        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    // Close dropdown on route change
    useEffect(() => {
        setIsDropdownOpen(false);
        setIsDesktopSearchOpen(false);
        setIsMobileSearchOpen(false);
        setSearchOpen(false);
        clearResults();
    }, [location.pathname, clearResults, setSearchOpen]);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (query.trim()) {
                performSearch(query);
            } else {
                clearResults();
            }
        }, 350);

        return () => clearTimeout(handler);
    }, [query, performSearch, clearResults]);

    useEffect(() => {
        const handleOutsideSearchClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                desktopSearchRef.current &&
                !desktopSearchRef.current.contains(target) &&
                mobileSearchRef.current &&
                !mobileSearchRef.current.contains(target)
            ) {
                setIsDesktopSearchOpen(false);
                setIsMobileSearchOpen(false);
                setSearchOpen(false);
            }
        };

        if (isDesktopSearchOpen || isMobileSearchOpen) {
            document.addEventListener("mousedown", handleOutsideSearchClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideSearchClick);
        };
    }, [isDesktopSearchOpen, isMobileSearchOpen, setSearchOpen]);

    const handleDesktopSearchFocus = () => {
        setIsDesktopSearchOpen(true);
        setIsMobileSearchOpen(false);
        setSearchOpen(true);
    };

    const handleMobileSearchFocus = () => {
        setIsDesktopSearchOpen(false);
        setIsMobileSearchOpen(true);
        setSearchOpen(true);
    };

    const handleSearchResultClick = () => {
        setIsDesktopSearchOpen(false);
        setIsMobileSearchOpen(false);
        setSearchOpen(false);
    };

    const showGlobalSearch = !isProBuddy && !isCounselor;

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate("/admissions");
        toast.success("Logged out successfully!", { duration: 3000 });
    };

    const handleProfileNavigation = () => {
        if (role === "counselor") {
            navigate("/counsellor-dashboard");
        } else if (role === "proBuddy") {
            navigate("/pro-buddies/dashboard");
        } else {
            if (isMobile) {
                navigate("/dashboard-student");
            } else {
                navigate("/profile");
            }
        }
        setIsDropdownOpen(false);
    };

    // Update dropdown position when opened
    useEffect(() => {
        if (isDropdownOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
    }, [isDropdownOpen]);

    const mobileTabsClassName = isRestrictedRole
        ? "flex w-full justify-center items-center gap-6"
        : "flex w-full justify-between items-center";

    const mobileHeaderHeight = isRestrictedRole ? 52 : 98;
    const mobileScrolledHeaderHeight = isRestrictedRole ? 32 : 56;
    const desktopHeaderHeight = isRestrictedRole ? 96 : 184;
    const desktopScrolledHeaderHeight = isRestrictedRole ? 56 : 100;
    const desktopTopRowHeight = isRestrictedRole ? 32 : 60;
    const desktopTopRowMargin = isRestrictedRole
        ? (isScrolled ? "2px" : "4px")
        : (isScrolled ? "20px" : "24px");
    const showMobileUtilityRow = showGlobalSearch || !isRestrictedRole;

    return (
        <>
            {/* Invisible placeholder matching the un-scrolled header height to prevent page layout shift jitter */}
            <div 
                className="w-full hidden md:block" 
                style={{ height: desktopHeaderHeight }}
            />
            <div 
                className="w-full md:hidden" 
                style={{ height: mobileHeaderHeight }}
            />
            
            <motion.header 
                initial={false}
                animate={{ 
                    height: isMobile 
                        ? (isScrolled ? mobileScrolledHeaderHeight : mobileHeaderHeight) 
                        : (isScrolled ? desktopScrolledHeaderHeight : desktopHeaderHeight) 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed top-0 left-0 right-0 z-50 bg-[#C6DDF0]/40 flex flex-col items-center border-b border-gray-100 backdrop-blur-md"
                style={{ overflow: "visible" }}
            >
            {isAuthenticated && isRestrictedRole && (
                <button
                    onClick={handleLogout}
                    className={`absolute right-3 md:right-6 z-20 rounded-full border border-[#EE1C1F]/15 bg-white/80 px-3 py-1 font-poppins font-medium text-[#EE1C1F] shadow-sm backdrop-blur-sm cursor-pointer ${
                        isMobile ? "top-2 text-[11px]" : "top-5 text-[12px]"
                    }`}
                >
                    Logout
                </button>
            )}
            

            <motion.div 
                initial={false}
                animate={{ marginTop: desktopTopRowMargin }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden md:flex relative w-full px-[60px] justify-between items-center z-10"
                style={{ height: desktopTopRowHeight }}
            >
                <div 
                    className="flex items-center gap-2 cursor-pointer w-[170px] h-[43px]" 
                    onClick={() => navigate('/admissions')}
                >
                    <img src="/logo.svg" alt="procounsel_logo" className="h-[43px] w-[43px] object-contain" />
                    <span className="text-[#232323] font-semibold text-[1.25rem]">ProCounsel</span>
                </div>

                <AnimatePresence>
                    {!isScrolled && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 h-full"
                        >
                            {visibleTabs.map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        navigate(tab.path);
                                    }}
                                    onMouseEnter={() => preloadRoute(tab.path)}
                                    onFocus={() => preloadRoute(tab.path)}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={buttonTransition}
                                    className={`flex flex-row items-center justify-center gap-1 h-full py-1 cursor-pointer transition-all ${
                                        activeTab === tab.id ? 'border-b border-[#000000]' : 'border-b border-transparent'
                                    }`}
                                >
                                    {tab.iconPath && (
                                        <img
                                            src={tab.iconPath}
                                            alt={tab.name}
                                            className="w-9 h-9 object-contain"
                                        />
                                    )}
                                    <span className="font-poppins font-medium text-[15px] text-[#232323]">
                                        {tab.name}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Desktop: Auth-aware right section */}
                {isAuthenticated && !isRestrictedRole ? (
                    <div className="relative" ref={dropdownRef}>
                        <motion.button
                            ref={buttonRef}
                            whileHover={{ scale: buttonHoverScale }}
                            whileTap={{ scale: buttonTapScale }}
                            transition={buttonTransition}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-[34px] h-[34px] bg-[#2F43F2] border border-[#2F43F2] rounded-[8px] flex items-center justify-center cursor-pointer"
                        >
                            {/* User SVG icon */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </motion.button>

                        {!isMobile && isDropdownOpen && createPortal(
                            <div
                                ref={dropdownRef}
                                className="fixed w-52 bg-white rounded-[12px] py-2 border border-gray-100 z-[9999]"
                                style={{
                                    top: dropdownPos.top,
                                    right: dropdownPos.right,
                                    boxShadow: '0px 4px 16px 0px rgba(19, 9, 125, 0.12), 0px 0px 4px 0px rgba(19, 9, 125, 0.08)',
                                }}
                            >
                                {/* User info */}
                                {user && (
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="font-poppins font-semibold text-[14px] text-[#232323] truncate">
                                            {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleProfileNavigation}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M9 22V12H15V22" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Profile
                                </button>

                                <button
                                    onClick={() => { navigate("/notifications"); setIsDropdownOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Notifications
                                </button>

                                <>
                                    <button
                                        onClick={() => { navigate("/live-sessions"); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="2" y="3" width="20" height="14" rx="2" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M10 9L14 11.5L10 14V9Z" fill="#232323"/>
                                            <path d="M8 21H16" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 17V21" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Live Sessions
                                    </button>

                                    <button
                                        onClick={() => { navigate(isMobile ? "/dashboard-student?activeTab=My Courses" : "/profile?activeTab=My Courses"); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        My Courses
                                    </button>
                                </>

                                <div className="border-t border-gray-100 mt-1 pt-1">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#EE1C1F] hover:bg-red-50 cursor-pointer transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#EE1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M16 17L21 12L16 7" stroke="#EE1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M21 12H9" stroke="#EE1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                ) : isAuthenticated ? (
                    <div className="w-[34px] h-[34px]" />
                ) : (
                    <motion.button
                        whileHover={{ scale: buttonHoverScale }}
                        whileTap={{ scale: buttonTapScale }}
                        transition={buttonTransition}
                        onClick={() => toggleLogin()}
                        className="w-[123px] h-[34px] bg-[#2F43F2] border border-[#2F43F2] rounded-[8px] flex items-center justify-center gap-[10px] px-[16px] py-[8px] cursor-pointer"
                    >
                        <span className="font-poppins font-medium text-[12px] leading-[100%] text-white text-nowrap">
                            Login / Sign Up
                        </span>
                    </motion.button>
                )}
            </motion.div>

            {showGlobalSearch && (
            <motion.div 
                initial={false}
                animate={{ 
                    top: isScrolled ? 24 : 108,
                    left: "50%",
                    x: "-50%" 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hidden md:flex absolute w-[456px] h-[52px] bg-[#FFFFFF] rounded-[12px] items-center pl-[12px] pr-[12px] shadow-sm border border-gray-50 z-20"
                ref={desktopSearchRef}
            >
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={handleDesktopSearchFocus}
                    placeholder="Search courses, tests, and counsellors" 
                    className="w-full h-full bg-transparent outline-none font-poppins font-medium text-[16px] leading-[100%] text-[#232323] placeholder:text-[#6B7280]"
                />
                <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#6B7280] flex-shrink-0 ml-2"
                >
                    <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>

                {isDesktopSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                        <SearchResults onResultClick={handleSearchResultClick} />
                    </div>
                )}
            </motion.div>
            )}


            
            <div className="flex md:hidden w-full flex-col px-[12px] pt-[8px]">
                
                <AnimatePresence>
                    {!isScrolled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -10, marginBottom: 0 }}
                            animate={{ opacity: 1, height: '22px', y: 0, marginBottom: '12px' }}
                            exit={{ opacity: 0, height: 0, y: -10, marginBottom: 0 }}
                            transition={{ duration: 0.2 }}
                            className={mobileTabsClassName}
                        >
                            {visibleTabs.map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        navigate(tab.path);
                                    }}
                                    onMouseEnter={() => preloadRoute(tab.path)}
                                    onFocus={() => preloadRoute(tab.path)}
                                    whileHover={{ y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={buttonTransition}
                                    className={`flex flex-row items-center justify-center gap-[2px] h-[22px] pb-[2px] cursor-pointer transition-all ${
                                        activeTab === tab.id ? 'border-b-[1.5px] border-[#000000]' : 'border-b-[1.5px] border-transparent'
                                    }`}
                                >
                                    {tab.iconPath && (
                                        <img
                                            src={tab.iconPath}
                                            alt={tab.name}
                                            className="w-[16px] h-[16px] object-contain shrink-0"
                                        />
                                    )}
                                    <span className="font-poppins font-medium text-[11px] sm:text-[12px] leading-[100%] text-[#232323] whitespace-nowrap">
                                        {tab.name}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {showMobileUtilityRow && (
                <div className="flex w-full items-center gap-3">
                    {showGlobalSearch && (
                    <div className="flex-1 relative" ref={mobileSearchRef}>
                        <div className="h-[40px] bg-[#FFFFFF] rounded-[12px] border border-gray-50 flex items-center px-[12px] shadow-sm">
                            <img 
                                src="/logo.svg" 
                                alt="procounsel_logo" 
                                className="w-[12.5px] h-[15px] object-contain mr-[8px] shrink-0" 
                            />

                            <input 
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={handleMobileSearchFocus}
                                placeholder="Search courses, tests, counsellors"
                                className="w-full h-full bg-transparent outline-none font-poppins font-medium text-[12px] leading-[100%] text-[#232323] placeholder:text-[#232323]"
                            />
                            <svg 
                                width="20" 
                                height="20" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                                className="text-[#6B7280] flex-shrink-0 ml-2"
                            >
                                <path d="M21 21L15.0001 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>

                        {isMobileSearchOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                                <SearchResults onResultClick={handleSearchResultClick} />
                            </div>
                        )}
                    </div>
                    )}

                    {/* Mobile: Auth-aware right section */}
                    {isAuthenticated && !isRestrictedRole ? (
                        <div className="relative shrink-0">
                            <motion.button
                                ref={isMobile ? buttonRef : undefined}
                                whileHover={{ scale: buttonHoverScale }}
                                whileTap={{ scale: buttonTapScale }}
                                transition={buttonTransition}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="h-[30px] w-[30px] bg-[#2F43F2] border border-[#2F43F2] rounded-[8px] flex items-center justify-center cursor-pointer"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </motion.button>

                            {isMobile && isDropdownOpen && createPortal(
                                <div
                                    ref={dropdownRef}
                                    className="fixed w-52 bg-white rounded-[12px] py-2 border border-gray-100 z-[9999]"
                                    style={{
                                        top: dropdownPos.top,
                                        right: 12,
                                        boxShadow: '0px 4px 16px 0px rgba(19, 9, 125, 0.12), 0px 0px 4px 0px rgba(19, 9, 125, 0.08)',
                                    }}
                                >
                                    {user && (
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="font-poppins font-semibold text-[14px] text-[#232323] truncate">
                                                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleProfileNavigation}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M9 22V12H15V22" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Profile
                                    </button>

                                    <button
                                        onClick={() => { navigate("/notifications"); setIsDropdownOpen(false); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        Notifications
                                    </button>

                                    <>
                                        <button
                                            onClick={() => { navigate("/live-sessions"); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="2" y="3" width="20" height="14" rx="2" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M10 9L14 11.5L10 14V9Z" fill="#232323"/>
                                                <path d="M8 21H16" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 17V21" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Live Sessions
                                        </button>

                                        <button
                                            onClick={() => { navigate(isMobile ? "/dashboard-student?activeTab=My Courses" : "/profile?activeTab=My Courses"); setIsDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#232323] hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M4 19.5C4 18.837 4.26339 18.2011 4.73223 17.7322C5.20107 17.2634 5.83696 17 6.5 17H20" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M6.5 2H20V22H6.5C5.83696 22 5.20107 21.7366 4.73223 21.2678C4.26339 20.7989 4 20.163 4 19.5V4.5C4 3.83696 4.26339 3.20107 4.73223 2.73223C5.20107 2.26339 5.83696 2 6.5 2Z" stroke="#232323" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            My Courses
                                        </button>
                                    </>

                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-poppins text-[#EE1C1F] hover:bg-red-50 cursor-pointer transition-colors"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="#EE1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M16 17L21 12L16 7" stroke="#EE1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M21 12H9" stroke="#EE1C1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            Logout
                                        </button>
                                    </div>
                                </div>,
                                document.body
                            )}
                        </div>
                    ) : isAuthenticated ? null : (
                        <motion.button
                            whileHover={{ scale: buttonHoverScale }}
                            whileTap={{ scale: buttonTapScale }}
                            transition={buttonTransition}
                            onClick={() => toggleLogin()}
                            className="h-[30px] bg-[#2F43F2] border border-[#2F43F2] rounded-[8px] flex items-center justify-center px-[16px] cursor-pointer shrink-0"
                        >
                            <span className="font-poppins font-medium text-[12px] leading-[100%] text-white text-nowrap">
                                Login / Sign Up
                            </span>
                        </motion.button>
                    )}
                </div>
                )}

            </div>

        </motion.header>
        </>
    );
}
