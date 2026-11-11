import { Navigate, useParams } from "react-router-dom";
import CollegeProfile from "@/pages/mba-public/CollegeProfile";
import PercentileColleges from "@/pages/mba-public/PercentileColleges";
import { getInstitute, isPublished } from "@/lib/mbaPublic";
import { MBA_PATHS, collegePath, percentileFromSlug, percentilePath } from "@/lib/mbaRoutes.mjs";

/**
 * /mba-colleges/:slug serves two flat families: institute profiles
 * (/mba-colleges/iim-ahmedabad) and percentile bands
 * (/mba-colleges/mba-colleges-at-95-percentile). A slug that is not a
 * published page of either kind goes back to /mba-colleges rather than
 * rendering an empty template.
 */
export default function MbaCollegeSlug() {
  const { slug } = useParams<{ slug: string }>();
  const p = percentileFromSlug(slug);
  if (p !== null) {
    return isPublished(percentilePath(p)) ? <PercentileColleges p={p} /> : <Navigate to={MBA_PATHS.colleges} replace />;
  }
  const inst = getInstitute(slug);
  if (!inst || !isPublished(collegePath(inst.slug))) return <Navigate to={MBA_PATHS.colleges} replace />;
  return <CollegeProfile inst={inst} />;
}
