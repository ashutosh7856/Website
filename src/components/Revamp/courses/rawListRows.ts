// Loose shapes for the test-group / course list responses. These endpoints
// return untyped JSON whose fields differ between endpoints (and the
// build-time snapshots), so every field is optional and typed only as far as
// the normalizers in this folder read it.

type Loose = string | number | boolean | null | undefined;

export interface RawAttachedTest {
  id?: Loose;
  testSeriesId?: Loose;
  testName?: Loose;
  name?: Loose;
  durationInMinutes?: Loose;
  totalQuestions?: Loose;
  listOfSection?: Array<{ totalQuestionsAdded?: Loose }>;
}

export interface RawTestGroupRow {
  testGroup?: RawTestGroupRow;
  id?: Loose;
  testGroupId?: Loose;
  testGroupName?: Loose;
  name?: Loose;
  testGroupDescription?: Loose;
  description?: Loose;
  subject?: Loose;
  bannerImagUrl?: Loose;
  bannerImageUrl?: Loose;
  rating?: Loose;
  ratingCount?: Loose;
  price?: Loose;
  priceType?: Loose;
  soldCount?: Loose;
  totalTests?: Loose;
  testSeriesCount?: Loose;
  attachedTests?: RawAttachedTest[];
  attachedTestIds?: unknown[];
  reviews?: unknown[];
  bought?: Loose;
  brought?: Loose;
  purchasedByMe?: Loose;
  isPurchased?: Loose;
  isTrending?: Loose;
  counsellorId?: Loose;
  counselorId?: Loose;
}

export interface RawCourseRow {
  courseId?: Loose;
  courseName?: Loose;
  courseThumbnailUrl?: Loose;
  counsellorName?: Loose;
  counselorName?: Loose;
  category?: Loose;
  rating?: Loose;
  coursePrice?: Loose;
  coursePriceAfterDiscount?: Loose;
  courseTimeHours?: Loose;
  courseTimeMinutes?: Loose;
  soldCount?: Loose;
  purchasedByMe?: Loose;
  isTrending?: Loose;
}

/** A list response: either a bare array or wrapped in `data` / `testGroups`. */
export type RawListResponse<T> = T[] | { data?: T[]; testGroups?: T[] } | null | undefined;
