export interface TestGroup {
  testGroupId: string;
  testGroupName: string;
  testGroupDescription: string;
  attachedTestIds: string[];
  createdAt: {
    seconds: number;
    nanos: number;
  };
  updatedAt: {
    seconds: number;
    nanos: number;
  };
  deletedAt: null | {
    seconds: number;
    nanos: number;
  };
  deleted: boolean;
  bannerImagUrl: string | null;
  testType: string;
  courseIdAttached: string | null;
  priceType: string;
  price: number;
  soldCount: number;
  rating: number | null;
  ratingCount: number | null;
  reviewIds: string[] | null;
  enrolledUserIdsWithTimestamp: Array<{
    userId: string;
    enrolledAt: {
      seconds: number;
      nanos: number;
    };
  }> | null;
  associatedCouponCodes: string[] | null;
  published: boolean;
}

export interface TestSeries {
  testSeriesId: string;
  counsellorId: string;
  testName: string;
  testDescription: string;
  bannerImagUrl: string | null;
  stream: string;
  testType: string;
  courseIdAttached: string | null;
  listOfSection: Array<{
    sectionName: string;
    totalQuestionsSupposedToBeAdded: number;
    totalQuestionsAdded: number;
    sectionDurationInMinutes: number;
    pointsForCorrectAnswer: number | null;
    negativeMarks: number | null;
    questions: unknown[];
  }>;
  priceType: string;
  price: number;
  durationInMinutes: number;
  pointsForCorrectAnswer: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  testInstructuctions: string;
  createdAt: {
    seconds: number;
    nanos: number;
  };
  updatedAt: {
    seconds: number;
    nanos: number;
  };
  deletedAt: null | {
    seconds: number;
    nanos: number;
  };
  deleted: boolean;
  published: boolean;
  testGroupId: string;
  sectionSwitchingAllowed: boolean;
}

export interface Review {
  reviewId: string;
  testGroupId: string;
  userId: string;
  rating: number;
  reviewText: string;
  createdAt: {
    seconds: number;
    nanos: number;
  };
  updatedAt: {
    seconds: number;
    nanos: number;
  };
  deletedAt: null | {
    seconds: number;
    nanos: number;
  };
  deleted: boolean;
  flagged: boolean;
}

export interface TestGroupDetails {
  testGroup: TestGroup;
  attachedTests: TestSeries[];
  reviews: Review[];
}
