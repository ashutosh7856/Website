import MobileCourseBottomNav from "@/components/Revamp/courses/MobileCourseBottomNav";
import PageSEO from "@/components/SEO/PageSEO";

export default function SessionListing() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      <PageSEO title="Live Sessions — Book Counselling Sessions | ProCounsel" description="Book live one-on-one counselling and mentorship sessions with verified experts on ProCounsel." canonical="/courses/session-listing" />
      <div className="px-5 pt-8 md:px-12">
        <h1 className="text-2xl font-semibold text-[#0E1629]">Session Listing</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Placeholder page. You can add the sessions content here.
        </p>
      </div>

      <MobileCourseBottomNav />
    </div>
  );
}
