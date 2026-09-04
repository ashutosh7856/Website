import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import PageLoader from "@/components/ui/PageLoader";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import RoleBasedRoute from "@/components/auth/RoleBasedRoute";
import { Toaster } from 'react-hot-toast';
import RevampLayout from '@/layouts/RevampLayout';
const NotFound = lazy(() => import("@/pages/NotFound"));
const ContactPage = lazy(() => import("@/pages/Contact"));
const PrivacyPolicyPage = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsPage = lazy(() => import("@/pages/Terms"));
const SitemapPage = lazy(() => import("@/pages/Sitemap"));
const CancellationRefundPage = lazy(() => import("@/pages/CancellationRefund"));
const ShippingExchangePage = lazy(() => import("@/pages/ShippingExchange"));
const AddCollegePage = lazy(() => import("@/pages/AddCollege"));
const ExternalPrivacyPage = lazy(() => import("@/pages/external/Privacy"));
const ExternalTermsPage = lazy(() => import("@/pages/external/Terms"));

const SubscriptionPage = lazy(() =>
    import("@/pages/SubscriptionPage").then((module) => ({ default: module.SubscriptionPage }))
);
const RechargeWallet = lazy(() => import('@/pages/RechargeWallet'));
const CounselorDashboard = lazy(() => import('@/pages/CounselorDashboard'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const AnswerPage = lazy(() => import('@/pages/AnswerPage'));
const QuestionDetailPage = lazy(() => import('@/pages/QuestionDetailPage'));
const CoursePage = lazy(() => import('@/pages/CoursePage'));
const MyActivityPage = lazy(() => import('@/pages/MyActivityPage'));
const LandingPage = lazy(() => import('@/pages/AdityaLandingPage'));
const PromoPage = lazy(() => import('@/pages/PromoPage'));
const TestSeriesPromo = lazy(() => import('@/pages/TestSeriesPromo'));
const ClientProfilePage = lazy(() => import('@/pages/ClientProfilePage'));

const CreateTest = lazy(() =>
    import('@/pages/test/counsellor/CreateTest').then((module) => ({ default: module.CreateTest }))
);
const AddQuestion = lazy(() =>
    import('@/pages/test/counsellor/AddQuestion').then((module) => ({ default: module.AddQuestion }))
);
const TestInfo = lazy(() =>
    import('@/pages/test/user/TestInfo').then((module) => ({ default: module.TestInfo }))
);
const TakeTest = lazy(() =>
    import('@/pages/test/user/TakeTest').then((module) => ({ default: module.TakeTest }))
);
const TestResult = lazy(() =>
    import('@/pages/test/user/TestResult').then((module) => ({ default: module.TestResult }))
);
const TestAnalysisPage = lazy(() =>
    import('@/pages/test/user/TestAnalysisPage').then((module) => ({ default: module.TestAnalysisPage }))
);
const CreateEditTestGroup = lazy(() =>
    import('@/pages/test/counsellor/CreateEditTestGroup').then((module) => ({ default: module.CreateEditTestGroup }))
);
const TestGroupDetails = lazy(() =>
    import('@/pages/test/counsellor/TestGroupDetails').then((module) => ({ default: module.TestGroupDetails }))
);

const CollegeDetailsPageNew = lazy(() => import('@/pages/CollegeDetailsPage'));
const TestGroupCardDetails = lazy(() => import('@/components/Revamp/courses/TestGroupDetails'));
const RevampAbout = lazy(() => import('@/components/Revamp/about/RevampAbout'));
import Admissions from '@/pages/Revamp/Admissions';
const ProBuddies = lazy(() => import('@/pages/Revamp/ProBuddies'));
const Courses = lazy(() => import('@/pages/Revamp/Courses'));
const BlogsPage = lazy(() => import('@/pages/Revamp/BlogsPage'));
const BlogDetailPage = lazy(() => import('@/pages/Revamp/BlogDetailPage'));
const BlogAuthorsPage = lazy(() => import('@/pages/Revamp/BlogAuthorsPage'));
const BlogAuthorProfilePage = lazy(() => import('@/pages/Revamp/BlogAuthorProfilePage'));
const CounsellorsPage = lazy(() => import('@/pages/Revamp/CounsellorsPage'));
const UserProfile = lazy(() => import('@/pages/Revamp/UserProfile'));
const CourseListing = lazy(() => import('@/pages/Revamp/CourseListing'));
const TestListing = lazy(() => import('@/pages/Revamp/TestListing'));
const SessionListing = lazy(() => import('@/pages/Revamp/SessionListing'));
const ProBuddyListing = lazy(() => import('@/pages/Revamp/ProBuddyListing'));
const ProBuddyProfilePage = lazy(() => import('@/pages/Revamp/ProBuddyProfilePage'));
const CollegeListing = lazy(() => import('@/pages/Revamp/CollegeListing'));
const CollegesPage = lazy(() => import('@/pages/Revamp/CollegesPage'));
const SchoolStudentLayout = lazy(() => import('@/layouts/SchoolStudentLayout'));
const SchoolStudentDashboard = lazy(() => import('@/pages/SchoolStudentDashboard'));
const SchoolProBuddies = lazy(() => import('@/pages/school/SchoolProBuddies'));
const SchoolGames = lazy(() => import('@/pages/school/SchoolGames'));
const SchoolLeaderboard = lazy(() => import('@/pages/school/SchoolLeaderboard'));
const SchoolProfile = lazy(() => import('@/pages/school/SchoolProfile'));
const SchoolPlay = lazy(() => import('@/pages/school/SchoolPlay'));
const SchoolProBuddyProfile = lazy(() => import('@/pages/school/SchoolProBuddyProfile'));
const ProBuddiesRegistration = lazy(() => import('@/pages/Revamp/ProBuddiesRegistration'));
const ProBuddiesDashboard = lazy(() => import('@/pages/Revamp/ProBuddiesDashboard'));
const DeadlinesPage = lazy(() => import('@/pages/Revamp/DeadlinesPage'));
const DeadlineDetailPage = lazy(() => import('@/pages/Revamp/DeadlineDetailPage'));


const RevampCounselorDetailsPage = lazy(() => import('@/pages/Revamp/RevampCounselorDetailsPage'));
const MettleRoute = lazy(() => import('@/pages/MettleRoute'));
const StudentDashboardPage = lazy(() => import('@/pages/StudentDashboardPage'));
const LiveSessionsPage = lazy(() => import('@/pages/LiveSessionsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const JEERankPredictorPage = lazy(() => import('@/pages/JEERankPredictor'));
const JEECollegePredictorPage = lazy(() => import('@/pages/JEECollegePredictor'));
const MHTCETCollegePredictorPage = lazy(() => import('@/pages/MHTCETCollegePredictor'));
// The NEET predictors are served on their existing (ranking) paths by the v2
// pages built on the new API — the primary URLs keep their SEO equity while
// visitors immediately get the upgraded experience.
const NEETRankPredictorPage = lazy(() => import('@/pages/neet/NEETRankPredictorV2'));
const NEETPredictorPage = lazy(() => import('@/pages/neet/NEETPredictor'));
const NEETCutoffAnalyzerPage = lazy(() => import('@/pages/neet/NEETCutoffAnalyzer'));
// NEET directory pages (state-wise counselling authorities + MBBS college list)
const NEETStateCounsellingPage = lazy(() => import('@/pages/neet/NEETStateCounselling'));
const NEETMedicalCollegesPage = lazy(() => import('@/pages/neet/NEETMedicalColleges'));
const PredictorsHubPage = lazy(() => import('@/pages/PredictorsHub'));
const OptionFormFillingPage = lazy(() => import('@/pages/OptionFormFilling'));
const CounsellingHubPage = lazy(() => import('@/pages/counselling/CounsellingHub'));
const CounsellingCityPage = lazy(() => import('@/pages/counselling/CounsellingCityPage'));
const CounsellingCategoryPage = lazy(() => import('@/pages/counselling/CounsellingCategoryPage'));
// Slugs only — importing them from the page-data modules dragged 166 KB of
// category and exam copy into the eager entry chunk. See lib/counsellingSlugs.
import { COUNSELLING_CATEGORY_SLUGS, COUNSELLING_EXAM_SLUGS } from '@/lib/counsellingSlugs';

export default function AppRoutes() {
    return (
        <>
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        padding: '12px 16px',
                        borderRadius: '8px',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Standalone pages (no layout) */}
                    <Route path="/privacy1" element={<ExternalPrivacyPage />} />
                    <Route path="/term1" element={<ExternalTermsPage />} />
                    <Route path="/mettle" element={<MettleRoute />} />
                    <Route path='/take-test/:testId' element={<TakeTest />} />
                    <Route path='/t/analysis/:testId/:attemptId' element={<TestAnalysisPage />} />

                    {/* School students (the fifth role) get their own shell, not the
                        site layout with things hidden: no site header, no footer, no
                        chatbot. Deliberately OUTSIDE the RevampLayout subtree — the
                        two are separate apps that happen to share a bundle. */}
                    <Route path="/school-student" element={<SchoolStudentLayout />}>
                        <Route index element={<Navigate to="/school-student/dashboard" replace />} />
                        <Route path="dashboard" element={<SchoolStudentDashboard />} />
                        <Route path="probuddies" element={<SchoolProBuddies />} />
                        {/* Read-only: public endpoints, no booking or calling. */}
                        <Route path="probuddies/:proBuddyId" element={<SchoolProBuddyProfile />} />
                        <Route path="games" element={<SchoolGames />} />
                        <Route path="leaderboard" element={<SchoolLeaderboard />} />
                        <Route path="profile" element={<SchoolProfile />} />
                        {/* Today's game only — a daily game whose future days
                            are reachable is not a daily game. */}
                        <Route path="play" element={<SchoolPlay />} />
                        <Route path="play/:date" element={<SchoolPlay />} />
                        {/* Anything not built yet returns to the dashboard rather
                            than falling through to the site's 404 shell. */}
                        <Route path="*" element={<Navigate to="/school-student/dashboard" replace />} />
                    </Route>

                    {/* All pages under RevampLayout */}
                    <Route element={<RevampLayout />}>
                        {/* Core Revamp Pages */}
                        <Route path="/" element={<Admissions />} />
                        <Route path='/admissions' element={<Admissions />} />
                        <Route path='/admissions/blogs' element={<BlogsPage />} />
                        <Route path='/admissions/blogs/:id' element={<BlogDetailPage />} />
                        <Route path='/admissions/blogs/slug/:slug' element={<BlogDetailPage />} />
                        <Route path='/admissions/blog-authors' element={<BlogAuthorsPage />} />
                        <Route path='/admissions/blog-authors/:authorId' element={<BlogAuthorProfilePage />} />
                        <Route path='/courses' element={<Courses />} />
                        <Route path='/courses/course-listing' element={<CourseListing />} />
                        <Route path='/courses/test-listing' element={<TestListing />} />
                        <Route path='/courses/session-listing' element={<SessionListing />} />
                        <Route path='/revamp-courses' element={<Courses />} />
                        <Route path='/revamp-courses/course-listing' element={<CourseListing />} />
                        <Route path='/revamp-courses/test-listing' element={<TestListing />} />
                        <Route path='/revamp-courses/session-listing' element={<SessionListing />} />
                        <Route path='/revamp-about' element={<Navigate to="/about" replace />} />

                        <Route path='/counsellor-listing' element={<CounsellorsPage />} />
                        <Route path='/counsellor-listing-cards' element={<CounsellorsPage />} />
                        <Route path="/counsellor-details/:id" element={<RevampCounselorDetailsPage />} />
                        <Route path="/counsellor/:id" element={<RevampCounselorDetailsPage />} />


                        <Route path='/admissions/deadlines' element={<DeadlinesPage />} />
                        <Route path='/admissions/deadlines/:id' element={<DeadlineDetailPage />} />

                        {/* probuddies pages  */}
                        <Route path='/pro-buddies/register' element={<ProBuddiesRegistration />} />
                        <Route path='/pro-buddies' element={<ProBuddies/>} />
                        <Route path='/pro-buddies/listing' element={<ProBuddyListing />} />
                        <Route path='/pro-buddies/college-listing' element={<CollegeListing />} />
                        <Route path='/pro-buddies/dashboard' element={<ProBuddiesDashboard />} />
                        <Route path="/pro-buddies/profile/:id" element={<ProBuddyProfilePage />} />


                        {/* Community */}
                        <Route path="/community" element={<CommunityPage />} />
                        <Route path="/community/question/:questionId" element={<QuestionDetailPage />} />
                        <Route path="/community/answer" element={<AnswerPage />} />
                        <Route path="/community/my-activity" element={<MyActivityPage />} />


                        {/* Courses & Colleges */}
                        {/* Public college directory. This is the crawl path to every
                            /college-details/:id — the home page only links the first four. */}
                        <Route path="/colleges" element={<CollegesPage />} />
                        <Route path="/college-details/:id" element={<CollegeDetailsPageNew />} />
                        <Route path='/courses/detail/:courseId/:role' element={<CoursePage />} />
                        <Route path='/detail/:courseId/:role' element={<CoursePage />} />
                        <Route path='/jee-rank-predictor' element={<JEERankPredictorPage />} />
                        <Route path='/jee-college-predictor' element={<JEECollegePredictorPage />} />
                        <Route path='/mhtcet-college-predictor' element={<MHTCETCollegePredictorPage />} />
                        <Route path='/neet-rank-predictor' element={<NEETRankPredictorPage />} />
                        {/* Rebuilt on the v1 counselling API. Same URL as before:
                            it is indexed and linked, so the page changed, not the path. */}
                        <Route path='/neet-college-predictor' element={<NEETPredictorPage />} />
                        {/* Round-wise cutoff analyzer (separate, permanent) */}
                        <Route path='/neet-cutoffs' element={<NEETCutoffAnalyzerPage />} />
                        {/* NEET directory: state-wise counselling authorities + MBBS college list */}
                        <Route path='/neet-counselling' element={<NEETStateCounsellingPage />} />
                        <Route path='/mbbs-colleges' element={<NEETMedicalCollegesPage />} />
                        {/* Legacy preview paths → redirect to the primary ranking URLs */}
                        <Route path='/neet/rank-predictor' element={<Navigate to="/neet-rank-predictor" replace />} />
                        <Route path='/neet/college-predictor' element={<Navigate to="/neet-college-predictor" replace />} />
                        <Route path='/predictors' element={<PredictorsHubPage />} />

                        {/* Paid service: MHT-CET CAP round option form filling */}
                        <Route path='/mhtcet-option-form-filling' element={<OptionFormFillingPage />} />

                        {/* Programmatic city counselling landing pages (SEO) */}
                        <Route path='/counselling' element={<CounsellingHubPage />} />
                        <Route path='/counselling/:city' element={<CounsellingCityPage />} />

                        {/* Category counselling landing pages (SEO commercial intent).
                            Registered one route per known slug rather than a catch-all
                            `/:category`, so unknown top-level paths still 404. */}
                        {COUNSELLING_CATEGORY_SLUGS.map((slug) => (
                          <Route
                            key={slug}
                            path={`/${slug}`}
                            element={<CounsellingCategoryPage slug={slug} />}
                          />
                        ))}

                        {/* Exam counselling landing pages — the later-stage
                            intent ("I have a rank, what now") that sits under
                            the category pages. Same component, same contract. */}
                        {COUNSELLING_EXAM_SLUGS.map((slug) => (
                          <Route
                            key={slug}
                            path={`/${slug}`}
                            element={<CounsellingCategoryPage slug={slug} />}
                          />
                        ))}


                        {/* Info / Static Pages */}
                        <Route path="/about" element={<RevampAbout />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/cancellation-refund" element={<CancellationRefundPage />} />
                        <Route path="/shipping-exchange" element={<ShippingExchangePage />} />
                        <Route path="/sitemap" element={<SitemapPage />} />
                        <Route path="/add-college" element={<AddCollegePage />} />

                        {/* Landing / Promo */}
                        <Route path='/gurucool' element={<LandingPage />} />
                        <Route path='/promo' element={<PromoPage />} />
                        <Route path='/testSeries/pcsat' element={<TestSeriesPromo />} />

                        {/* Subscription / Notifications */}
                        <Route path='/subscribe' element={<SubscriptionPage />} />
                        <Route path="/notifications" element={<NotificationsPage />} />

                        {/* Counselor Dashboard */}
                        <Route path='/counsellor-dashboard' element={<CounselorDashboard />} />
                        <Route path='/counselor-dashboard/client-profile' element={<ClientProfilePage />} />

                        {/* Test Routes */}
                        <Route element={<RoleBasedRoute allowedRoles={['counselor']} />}>
                          <Route path='/create-test' element={<CreateTest />} />
                          <Route path='/add-question/:testId' element={<AddQuestion />} />
                          <Route path='/counselor/test-groups/create' element={<CreateEditTestGroup />} />
                          <Route path='/counselor/test-groups/edit/:testGroupId' element={<CreateEditTestGroup />} />
                          <Route path='/counselor/test-groups/:testGroupId' element={<TestGroupDetails />} />
                          <Route path='/counselor/test-groups/:testGroupId/create-test' element={<CreateTest />} />
                        </Route>

                        {/* User Test Routes */}
                        <Route path='/test-info/:testId' element={<TestInfo />} />
                        <Route path='/test-result/:testId' element={<TestResult />} />
                        <Route path='/t/result/:testId' element={<TestResult />} />
                        <Route path='/courses/test-group/:testGroupId' element={<TestGroupCardDetails />} />
                        <Route path='/courses/test-groups/:testGroupId' element={<TestGroupCardDetails />} />
                        <Route path='/test-group/:testGroupId' element={<TestGroupCardDetails />} />
                        <Route path='/test-groups/:testGroupId' element={<TestGroupCardDetails />} />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route path='/dashboard-student' element={<StudentDashboardPage />} />
                            <Route path='/profile' element={<UserProfile/>}/>
                            <Route path='/live-sessions' element={<LiveSessionsPage />} />
                            <Route path='/wallet' element={<RechargeWallet />} />
                        </Route>

                        {/* 404 Page */}
                        <Route path='*' element={<NotFound />} />
                    </Route>
                </Routes>
            </Suspense>
        </>
    );
}
