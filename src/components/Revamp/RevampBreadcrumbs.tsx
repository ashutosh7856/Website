import { useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/AuthStore';
import { absoluteUrl } from '@/lib/siteUrl.mjs';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export default function RevampBreadcrumbs() {
  const location = useLocation();
  const role = useAuthStore((state) => state.role);
  const isCourseDetailPath =
    location.pathname.includes('/courses/detail/') || location.pathname.includes('/detail/');
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;
  const activeRole = role || storedRole;
  const isRestrictedDashboardRole = activeRole === 'proBuddy' || activeRole === 'counselor';

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const path = location.pathname;
    const crumbs: BreadcrumbItem[] = [];

    // Admissions page — no breadcrumb needed (it's the home page of revamp)
    if (path === '/admissions') {
      return [];
    }

    // Dashboard pages themselves should stay clean.
    if (path === '/pro-buddies/dashboard' || path.startsWith('/pro-buddies/dashboard/')) {
      return [];
    }

    if (path === '/counsellor-dashboard' || path.startsWith('/counsellor-dashboard/')) {
      return [];
    }

    // Only non-restricted roles use Home as the breadcrumb root.
    if (!isRestrictedDashboardRole) {
      crumbs.push({ label: 'Home', path: '/admissions' });
    }

    // Revamp course listing pages
    if (path === '/courses/course-listing' || path === '/revamp-courses/course-listing') {
      crumbs.push({ label: 'Courses', path: '/courses' });
      crumbs.push({ label: 'Course Listing' });
    }
    else if (path === '/courses/test-listing' || path === '/revamp-courses/test-listing') {
      crumbs.push({ label: 'Courses', path: '/courses' });
      crumbs.push({ label: 'Test Listing' });
    }
    else if (path === '/courses/session-listing' || path === '/revamp-courses/session-listing') {
      crumbs.push({ label: 'Courses', path: '/courses' });
      crumbs.push({ label: 'Session Listing' });
    }
    // Course detail page (/courses/detail/:courseId/:role and legacy /detail/:courseId/:role)
    else if (path.includes('/courses/detail/') || path.includes('/detail/')) {
      crumbs.push({ label: 'Courses', path: '/courses' });
      crumbs.push({ label: 'Course Listing', path: '/courses/course-listing' });
      crumbs.push({ label: 'Course Details' });
    }
    // Test group detail pages (new and legacy)
    else if (
      path.includes('/courses/test-group/') ||
      path.includes('/courses/test-groups/') ||
      path.includes('/test-group/') ||
      path.includes('/test-groups/')
    ) {
      crumbs.push({ label: 'Courses', path: '/courses' });
      crumbs.push({ label: 'Tests', path: '/courses/test-listing' });
      crumbs.push({ label: 'Test Details' });
    }
    // Courses routes
    else if (path.includes('/courses') || path.includes('/revamp-courses')) {
      crumbs.push({ label: 'Courses' });
    }
    // Community routes
    else if (path.includes('/community')) {
      if (isRestrictedDashboardRole) {
        const dashboardPath = activeRole === 'counselor' ? '/counsellor-dashboard' : '/pro-buddies/dashboard';
        crumbs.push({ label: 'Dashboard', path: dashboardPath });
        crumbs.push({ label: 'Community', path: '/community' });
      } else {
        crumbs.push({ label: 'Community', path: '/community' });
      }

      if (path.includes('/community/question/')) {
        crumbs.push({ label: 'Question' });
      } else if (path.includes('/community/answer')) {
        crumbs.push({ label: 'Answer' });
      } else if (path.includes('/community/my-activity')) {
        crumbs.push({ label: 'My Activity' });
      }
    }
    else if (path === '/pro-buddies/listing') {
      crumbs.push({ label: 'ProBuddies', path: '/pro-buddies' });
      crumbs.push({ label: 'Listing' });
    }
    else if (path === '/pro-buddies/college-listing') {
      crumbs.push({ label: 'ProBuddies', path: '/pro-buddies' });
      crumbs.push({ label: 'College Listing' });
    }
    else if (path.includes('/pro-buddies/profile/')) {
      crumbs.push({ label: 'ProBuddies', path: '/pro-buddies' });
      crumbs.push({ label: 'Profile' });
    }
    // ProBuddies routes
    else if (path.includes('/pro-buddies')) {
      crumbs.push({ label: 'ProBuddies' });
    }
    // About routes
    else if (path.includes('/revamp-about')) {
      crumbs.push({ label: 'About Us' });
    }
    // Counsellor listing
    else if (path === '/counsellor-listing') {
      crumbs.push({ label: 'Counsellors' });
    }
    // Counsellor detail
    else if (path.includes('/counsellor-details/')) {
      crumbs.push({ label: 'Counsellors', path: '/counsellor-listing' });
      crumbs.push({ label: 'Counsellor Details' });
    }
    // Counsellor detail (legacy)
    else if (path.includes('/counsellor/')) {
      crumbs.push({ label: 'Counsellors', path: '/counsellor-listing' });
      crumbs.push({ label: 'Profile' });
    }
    // Exams listing
    else if (path === '/exams') {
      crumbs.push({ label: 'Exams' });
    }
    // Exam details
    else if (path.includes('/exams/')) {
      crumbs.push({ label: 'Exams', path: '/exams' });
      crumbs.push({ label: 'Details' });
    }
    // Counselor test group detail page
    else if (path.includes('/counselor/test-groups/')) {
      crumbs.push({ label: 'Tests' });
      crumbs.push({ label: 'Test Details' });
    }
    // College details
    else if (path.includes('/colleges/') || path.includes('/college-details/')) {
      // crumbs.push({ label: 'Colleges' });
      crumbs.push({ label: 'Details' });
    }
    // Other generic pages
    else if (path.includes('/about')) {
      crumbs.push({ label: 'About' });
    }
    else if (path.includes('/contact')) {
      crumbs.push({ label: 'Contact' });
    }
    else if (path.includes('/privacy-policy')) {
      crumbs.push({ label: 'Privacy Policy' });
    }
    else if (path.includes('/terms')) {
      crumbs.push({ label: 'Terms' });
    }
    else {
      // For any other unmatched page, just show Home.
      if (crumbs.length === 1 && crumbs[0].label === 'Home') {
        return [];
      }
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  if (breadcrumbs.length === 0) return null;

  if (isCourseDetailPath) {
    return (
      <div className="w-full bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-[60px] py-3">
          <Link
            to="/courses/course-listing"
            className="inline-flex md:hidden items-center gap-2 text-[#0E1629] font-semibold text-xs font-[Poppins] hover:opacity-80 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Course Detail</span>
          </Link>

          <div className="hidden md:flex items-center gap-2 text-sm font-[Poppins]">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <span key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                  )}
                  {crumb.path && !isLast ? (
                    <Link
                      to={crumb.path}
                      className="text-[#6B7280] hover:text-[#0E1629] transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`${isLast && breadcrumbs.length > 1 ? 'text-[#0E1629] font-semibold' : 'text-[#6B7280]'}`}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbSchema = breadcrumbs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.label,
      ...(crumb.path ? { "item": absoluteUrl(crumb.path) } : {}),
    })),
  } : null;

  return (
    <div className="w-full bg-white border-b border-[#E5E7EB]">
      {breadcrumbSchema && (
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        </Helmet>
      )}
      <div className="max-w-360 mx-auto px-15 py-3">
        <div className="flex items-center gap-2 text-xs md:text-sm font-[Poppins]">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;

            return (
              <span key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                )}
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="text-[#6B7280] hover:text-[#0E1629] transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={`${isLast && breadcrumbs.length > 1 ? 'text-[#0E1629] font-semibold' : 'text-[#6B7280]'}`}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
