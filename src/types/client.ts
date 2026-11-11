export interface ApiClient {
  userId: string;
  firstName: string;
  lastName: string;
  course: string;
  userInterestedStateOfCounsellors: string[];
  photoSmall: string | null;
  plan: string;
  manualSubscriptionRequestId?: string;
}
export interface ApiPendingRequest {
  manualSubscriptionRequestId: string;
  userId: string;
  userFullName: string;
  userSmallPhotoUrl: string | null;
  userInterestedCourse: string;
  counsellorId: string;
  plan: string;
  amount: number;
  status: string;
  createdAt: {
    seconds: number;
    nanos: number;
  };
  subscriptionType: string;
}

export interface Client {
  id: string;
  name: string;
  imageUrl: string;
  course: string;
  plan?: string;
  amount?: number;
  createdAt?: Date;
  interestedStates?: string[];
  manualSubscriptionRequestId?: string;
}

export interface ClientUserDetail {
  userName: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  walletAmount: number;
  role: string;
  photo: string;
  photoSmall: string;
  userInterestedStateOfCounsellors: string[];
  interestedCourse: string;
  languagesKnow: string[];
  fcmToken: string;
  voipToken: string;
  platform: string;
  verifiedEmail: boolean;
  referralCode: string;
  transactions: unknown[];
  offlineTransactions: unknown[];
  activityLog: unknown[];
  subscribedCounsellors: Array<{
    id: string;
    userId: string;
    counsellorId: string;
    plan: string;
    initialPlan: string;
    presentPlan: string;
    subscriptionMode: string;
    createdTimestamp: {
      seconds: number;
      nanos: number;
    };
    updateddTimestamp: unknown;
    upgraded: boolean;
  }>;
  userReviewIds: string[];
  chatIdsCreatedForUser: unknown[];
  appointmentIds: string[];
  favouriteCounsellorIds: string[];
  clientNotes?: Array<{
    noteId: string;
    counsellorId: string;
    userId: string;
    noteText: string;
    timestamp: number;
  }>;
}