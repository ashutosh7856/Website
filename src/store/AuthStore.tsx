import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { checkUrl, sendOtp, verifyOtp as apiVerifyOtp } from "@/api/auth";
import type { SchoolStudentSignupPayload, SchoolStudentSignupResponse } from "@/api/auth";
import { getUserProfile } from "@/api/user";
import { getCounselorProfileById } from "@/api/counselor-Dashboard";
import type { User } from "@/types/user";
import type { CounselorProfileData } from "@/types/counselorProfile";
import type { Transaction as UserTransaction } from "@/types/user";
import { setToken, clearToken, cacheTokenInMemory, getToken } from '@/lib/tokenManager';
import { captureLeadFromUser, captureSchoolStudentLead } from "@/api/leads";

const mapCounselorToUser = (counselorData: CounselorProfileData): User => {
  return {
    userName: counselorData.userName,
    firstName: counselorData.firstName,
    lastName: counselorData.lastName,
    phoneNumber: counselorData.phoneNumber,
    email: counselorData.email,
    role: counselorData.role.trim().toLowerCase(),
    verified: counselorData.verified,
    photo: counselorData.photoUrl,
    photoSmall: counselorData.photoUrlSmall,
    languagesKnow: counselorData.languagesKnow,
    walletAmount: counselorData.walletAmount || 0,
    transactions: [] as UserTransaction[],
    offlineTransactions: [],
    activityLog: counselorData.activityLog || [],
    userInterestedStateOfCounsellors: null,
    interestedCourse: null,
  };
};

/**
 * The backend spells the fifth role "schoolStudent". Compare case-insensitively
 * and trimmed — the OTP response and the signup response are produced by
 * different services and one of them has historically padded role strings.
 */
export const isSchoolStudentRole = (role: unknown): boolean =>
  typeof role === "string" && role.trim().toLowerCase() === "schoolstudent";

/**
 * MBA students are ordinary `users` docs (interestedCourse "mba") that the Java
 * login labels "mbaStudent". Same tolerance as above: trimmed, any case.
 */
export const isMbaStudentRole = (role: unknown): boolean =>
  typeof role === "string" && role.trim().toLowerCase() === "mbastudent";

export type SchoolStudentProfile = {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  school: string;
  className: string;
};

/**
 * School students live in their own Firestore collection, so /api/user/:id does
 * NOT serve them — there is no profile endpoint for this role yet. The shape the
 * app renders is therefore built from what signup told us (persisted), exactly
 * like the proBuddy placeholder below it.
 */
const mapSchoolStudentToUser = (profile: SchoolStudentProfile | null, phone: string): User =>
  ({
    userName: phone,
    firstName: profile?.firstName ?? "School",
    lastName: profile?.lastName ?? "Student",
    phoneNumber: phone,
    email: "",
    role: "schoolStudent",
    verified: false,
    walletAmount: 0,
    transactions: [],
    offlineTransactions: [],
    activityLog: [],
    userInterestedStateOfCounsellors: null,
    interestedCourse: null,
  } as unknown as User);

type AuthState = {
  user: User | null;
  userId: string | null;
  role: "student" | "counselor" | "user" | "proBuddy" | "schoolStudent" | "mbaStudent" | null;
  isAuthenticated: boolean;
  isLoginToggle: boolean;
  userExist: boolean;
  isCounselorSignupOpen: boolean;
  isCounselorSignupFormOpen: boolean;
  loading: boolean;
  needsOnboarding: boolean;
  skipOnboardingForPromo: boolean;
  needsProfileCompletion: boolean;
  isProfileCompletionOpen: boolean;
  returnToPath: string | null;
  isCounselorSignupFlow: boolean;
  tempJwt: string | null;
  tempPhone: string | null;
  schoolStudent: SchoolStudentProfile | null;
  completeSchoolStudentSignup: (
    profile: SchoolStudentSignupPayload,
    response: SchoolStudentSignupResponse
  ) => void;
  toggleLogin: (onSuccess?: () => void) => void;
  closeCounsellorSignup: () => void;
  toggleCounselorSignup: () => void;
  openCounselorSignupForm: () => void;
  closeCounselorSignupForm: () => void;
  toggleProfileCompletion: () => void;
  setIsProfileCompletionOpen: (value: boolean) => void;
  setUser: (user: User | null) => void;
  setIsCounselorSignupFlow: (value: boolean) => void;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  refreshUser: (force?: boolean) => Promise<User | null>;
  onLoginSuccess: (() => void) | null;
  logout: () => void;
  pendingAction?: (() => void) | null;
  setPendingAction: (fn: (() => void) | null) => void;
  bookingTriggered: boolean;
  setBookingTriggered: (value: boolean) => void;
  setReturnToPath: (path: string | null) => void;
  setNeedsOnboarding: (value: boolean) => void;
  setSkipOnboardingForPromo: (value: boolean) => void;
  setNeedsProfileCompletion: (value: boolean) => void;
  checkProfileCompletion: () => boolean;
  clearOnLoginSuccess: () => void;
  setTempJwt: (jwt: string | null, phone: string | null) => void;
  completeOnboarding: () => void;
  cancelOnboarding: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      userId: null,
      role: null,
      isAuthenticated: false,
      isLoginToggle: false,
      userExist: false,
      isCounselorSignupOpen: false,
      isCounselorSignupFormOpen: false,
      loading: true,
      onLoginSuccess: null,
      pendingAction: null,
      needsOnboarding: false,
      skipOnboardingForPromo: false,
      needsProfileCompletion: false,
      isProfileCompletionOpen: false,
      returnToPath: null,
      isCounselorSignupFlow: false,
      tempJwt: null,
      tempPhone: null,
      schoolStudent: null,
      setPendingAction: (fn) => set({ pendingAction: fn }),
      bookingTriggered: false,
      setBookingTriggered: (value) => set({ bookingTriggered: value }),
      setReturnToPath: (path) => set({ returnToPath: path }),
      setNeedsOnboarding: (value) => set({ needsOnboarding: value }),
      setSkipOnboardingForPromo: (value) =>
        set({ skipOnboardingForPromo: value }),
      setNeedsProfileCompletion: (value) =>
        set({ needsProfileCompletion: value }),
      setIsCounselorSignupFlow: (value) =>
        set({ isCounselorSignupFlow: value }),
      setTempJwt: (jwt, phone) => {
        if (jwt) cacheTokenInMemory(jwt);
        set({ tempJwt: jwt, tempPhone: phone });
      },

      completeOnboarding: () => {
        const { tempJwt, tempPhone } = get();
        if (tempJwt && tempPhone) {
          setToken(tempJwt, tempPhone);
          set({ tempJwt: null, tempPhone: null, needsOnboarding: false });
        }
      },

      /**
       * Finishes the school-student signup started from the onboarding card.
       *
       * The phone is already OTP-verified at this point, so the JWT goes
       * straight to localStorage (no tempJwt limbo — there is no second step
       * left to complete), and the profile is persisted because no backend
       * endpoint can hand it back to us on the next page load.
       */
      completeSchoolStudentSignup: (profile, response) => {
        const phone = response.userId?.trim() || profile.phoneNumber;
        const stored: SchoolStudentProfile = {
          phoneNumber: phone,
          firstName: profile.firstName,
          lastName: profile.lastName,
          school: profile.school,
          className: profile.className,
        };

        if (response.jwtToken) setToken(response.jwtToken, phone);
        try {
          localStorage.setItem("role", "schoolStudent");
        } catch {
          // localStorage may be unavailable (private mode); store state still holds the role.
        }

        set({
          schoolStudent: stored,
          user: mapSchoolStudentToUser(stored, phone),
          userId: phone,
          role: "schoolStudent",
          isAuthenticated: true,
          loading: false,
          tempJwt: null,
          tempPhone: null,
          userExist: false,
          needsOnboarding: false,
          needsProfileCompletion: false,
          isProfileCompletionOpen: false,
          isLoginToggle: false,
        });

        const { onLoginSuccess } = get();
        if (onLoginSuccess) {
          onLoginSuccess();
          set({ onLoginSuccess: null });
        }
      },

      cancelOnboarding: () => {
        set({
          tempJwt: null,
          tempPhone: null,
          needsOnboarding: false,
          isAuthenticated: false,
          userId: null,
          user: null,
          role: null,
        });
      },

      checkProfileCompletion: () => {
        const state = get();
        if (!state.user) return true;
        return !!(state.user.firstName && state.user.email);
      },

      clearOnLoginSuccess: () => set({ onLoginSuccess: null }),

      toggleLogin: (onSuccess?: () => void) =>
        set((state) => ({
          isLoginToggle: !state.isLoginToggle,
          onLoginSuccess: !state.isLoginToggle ? onSuccess || null : null,
        })),

      toggleCounselorSignup: () =>
        set((state) => {
          if (state.role === "counselor") return state;
          if (!state.isAuthenticated) return { isLoginToggle: true };
          return { isCounselorSignupOpen: true };
        }),

      closeCounsellorSignup: () =>
        set({
          isCounselorSignupOpen: false,
          isCounselorSignupFormOpen: false,
        }),

      openCounselorSignupForm: () =>
        set({
          isCounselorSignupOpen: false,
          isCounselorSignupFormOpen: true,
        }),

      closeCounselorSignupForm: () => set({ isCounselorSignupFormOpen: false }),

      toggleProfileCompletion: () =>
        set((state) => ({
          isProfileCompletionOpen: !state.isProfileCompletionOpen,
        })),

      setIsProfileCompletionOpen: (value) =>
        set({ isProfileCompletionOpen: value }),

      setUser: (user) =>
        set({
          user,
          userId: user ? user.userName ?? null : null,
          role: user
            ? isMbaStudentRole(user.role)
              ? "mbaStudent"
              : (user.role.toLowerCase() as AuthState["role"])
            : null,
          isCounselorSignupOpen:
            user?.role?.toLowerCase() === "counselor"
              ? false
              : get().isCounselorSignupOpen,

          isCounselorSignupFormOpen:
            user?.role?.toLowerCase() === "counselor"
              ? false
              : get().isCounselorSignupFormOpen,
        }),

      refreshUser: async (force = false) => {
        const state = get();

        if (state.loading && !force) {
          return state.user;
        }

        set({ loading: true });

        const uid =
          state.userId ??
          state.tempPhone ??
          (typeof window !== "undefined"
            ? localStorage.getItem("phone")
            : null);
        const token =
          state.tempJwt ??
          getToken();
        const role =
          state.role ??
          (typeof window !== "undefined" ? localStorage.getItem("role") : null);

        if (!uid || !token) {
          set({ loading: false });
          return null;
        }

        if (!force && state.user) {
          set({ loading: false });
          return state.user;
        }

        try {
          if (role === "schoolStudent") {
            // No /api/user/:id for this role — rebuild from what signup persisted.
            const mapped = mapSchoolStudentToUser(state.schoolStudent, uid);
            set({ user: mapped, role: "schoolStudent" });
            return mapped;
          }

          if (role === "proBuddy") {
            const mapped = {
              userName: uid,
              firstName: "Pro",
              lastName: "Buddy",
              phoneNumber: uid,
              email: "",
              role: "proBuddy",
              verified: false,
            } as unknown as User;
            set({ user: mapped, role: "proBuddy" });
            return mapped;
          }

          if (role === "counselor") {
            const counselorData = await getCounselorProfileById(uid, token);
            if (counselorData) {
              const mapped = mapCounselorToUser(counselorData);
              set({ user: mapped, role: "counselor" });
              return mapped;
            }
            throw new Error("Counselor profile not found");
          }

          if (isMbaStudentRole(role)) {
            // A normal user underneath — same profile endpoint — but the role
            // comes from the login, not from the users doc.
            const user = await getUserProfile(uid, token);
            user.role = "mbaStudent";
            set({ user, role: "mbaStudent" });
            return user;
          }

          const user = await getUserProfile(uid, token);
          user.role = user.role.toLowerCase();
          set({ user, role: user.role as AuthState["role"] });
          return user;
        } catch {
          get().logout();
          return null;
        } finally {
          set({ loading: false });
        }
      },

      sendOtp: async (phone: string) => {
        await sendOtp(phone);
      },

      verifyOtp: async (phone: string, otp: string) => {
        set({ loading: true });

        const data = await apiVerifyOtp(phone, otp);

        // Fifth role. Checked FIRST because the fallback below reads "not a
        // user" as "counsellor" — a school student would otherwise be sent to
        // the counsellor profile fetch and end up mislabelled.
        if (isSchoolStudentRole(data?.role)) {
          if (data?.jwtToken) setToken(data.jwtToken, phone);
          try {
            localStorage.setItem("role", "schoolStudent");
          } catch {
            // localStorage may be unavailable; store state still holds the role.
          }

          // Keep the persisted details only if this is the same student coming
          // back — a different phone on this device must not inherit them.
          const persisted = get().schoolStudent;
          const profile =
            persisted && persisted.phoneNumber === phone ? persisted : null;

          set({
            schoolStudent: profile,
            user: mapSchoolStudentToUser(profile, phone),
            userId: phone,
            role: "schoolStudent",
            isAuthenticated: true,
            loading: false,
            userExist: false,
            needsOnboarding: false,
            needsProfileCompletion: false,
            isProfileCompletionOpen: false,
            isCounselorSignupFlow: false,
            tempJwt: null,
            tempPhone: null,
            isLoginToggle: false,
          });

          // This role returns before the capture at the foot of verifyOtp, so
          // it files its own lead. Deduped per phone, so a student who signed up
          // on this device (where the school and class were already sent) does
          // not overwrite that richer lead with this thinner one.
          captureSchoolStudentLead({
            phoneNumber: phone,
            firstName: profile?.firstName,
            lastName: profile?.lastName,
            school: profile?.school,
            className: profile?.className,
          });

          const { onLoginSuccess, pendingAction, setBookingTriggered } = get();
          if (onLoginSuccess) {
            onLoginSuccess();
            set({ onLoginSuccess: null });
          }
          if (pendingAction) {
            setTimeout(() => {
              setBookingTriggered(true);
              set({ pendingAction: null });
            }, 400);
          }
          return;
        }

        const isUser = data?.isUser === true || data?.isUser === "true";
        // MBA students are users (they have a /api/user/:id profile) whose login
        // carries role "mbaStudent". They keep that role instead of collapsing
        // into "student"/"user", so RevampLayout can hand them their own shell.
        const isMba = isMbaStudentRole(data?.role);
        const role = data?.role === "proBuddy"
          ? "proBuddy"
          : isMba
            ? "mbaStudent"
            : (isUser ? "student" : "counselor");

        set({ userId: phone, isAuthenticated: true, role });
        localStorage.setItem("role", role);

        // Check if user needs onboarding first
        let needsOnboarding = false;
        
        // ✅ Check skipOnboardingForPromo FIRST - before any onboarding logic
        const skipPromo = get().skipOnboardingForPromo;
        if (skipPromo) {
          console.log("🚀 PromoPage: Skipping ALL onboarding and profile completion - going straight to payment");
          // Force onboarding AND profile completion off for promo page users
          set({ 
            userExist: false, 
            needsOnboarding: false,
            needsProfileCompletion: false,  // ✅ Skip profile completion too
            isProfileCompletionOpen: false,
            skipOnboardingForPromo: false  // Reset the flag
          });
          needsOnboarding = false;
        } else if (isMba) {
          // Already onboarded by definition (their users doc says "mba"); the
          // MBA app runs its own onboarding against /mba/me/profile. Skipping
          // the site onboarding also keeps the JWT out of tempJwt limbo — the
          // site OnboardingCard never renders for this role.
          set({ userExist: false, needsOnboarding: false });
          needsOnboarding = false;
        } else {
          // Normal onboarding check for non-promo users
          try {
            const isProfileIncomplete = await checkUrl(
              phone,
              data?.jwt ?? data?.jwtToken
            );
            console.log(
              "🔍 isUserDetailsNull API response:",
              isProfileIncomplete
            );
            const { isCounselorSignupFlow } = get();
            if (isCounselorSignupFlow) {
              console.log(
                "User is in counselor signup flow, skipping onboarding"
              );
              set({ userExist: false, needsOnboarding: false });
              needsOnboarding = false;
            } else if (isProfileIncomplete === true) {
              console.log(
                "Setting needsOnboarding to TRUE - keeping JWT in memory"
              );
              set({ userExist: true, needsOnboarding: true });
              needsOnboarding = true;
            } else {
              console.log("Setting needsOnboarding to FALSE");
              set({ userExist: false, needsOnboarding: false });
              needsOnboarding = false;
            }
          } catch (err) {
            console.error("checkUrl failed:", err);
            set({ userExist: false, needsOnboarding: false });
            needsOnboarding = false;
          }
        }

        // For new users (needs onboarding), store JWT in memory only
        // For existing users, store in localStorage
        try {
          if (needsOnboarding) {
            // Store in memory for new users — deliberately NOT localStorage
            // until onboarding completes. It must still go through
            // cacheTokenInMemory (as setTempJwt does), or getToken() returns
            // null and every authenticated call a new user makes before
            // finishing onboarding — wallet, profile, payments — is refused.
            console.log("📝 Storing JWT in memory for new user");
            if (data?.jwtToken) cacheTokenInMemory(data.jwtToken);
            set({ tempJwt: data?.jwtToken, tempPhone: phone });
          } else {
            // Store in localStorage for existing users
            console.log("📝 Storing JWT in localStorage for existing user");
            if (data?.jwtToken) {
              setToken(data.jwtToken, phone);
            }
          }
        } catch (err) {
          console.error("Failed to save JWT/phone:", err);
        }

        try {
          if (role === "proBuddy") {
             const mapped = {
                userName: phone,
                firstName: "Pro",
                lastName: "Buddy",
                phoneNumber: phone,
                email: "",
                role: "proBuddy",
                verified: false,
             } as unknown as User;

             set({
               user: mapped,
               role: "proBuddy",
               isAuthenticated: true,
               loading: false,
               needsProfileCompletion: false,
             });

             const { onLoginSuccess } = get();
             if (onLoginSuccess) {
               onLoginSuccess();
               set({ onLoginSuccess: null });
             }
             set({ isCounselorSignupFlow: false });

             if (data?.jwtToken) {
               setToken(data.jwtToken, phone);
             }
          } else if (!isUser && !isMba) {
            const counselorData = await getCounselorProfileById(
              phone,
              data.jwtToken
            );

            if (counselorData) {
              const mapped = mapCounselorToUser(counselorData);
              set({
                user: mapped,
                role: "counselor",
                isAuthenticated: true,
                loading: false,
                needsProfileCompletion: false,
              });

              const { onLoginSuccess } = get();
              if (onLoginSuccess) {
                onLoginSuccess();
                set({ onLoginSuccess: null });
              }

              set({ isCounselorSignupFlow: false });
            }
          } else {
            const user = await getUserProfile(phone, data.jwtToken);

            if (user) {
              user.role = isMba ? "mbaStudent" : user.role.toLowerCase();

              const { needsOnboarding: userNeedsOnboarding } = get();

              // Only check profile completion for existing users (not in onboarding)
              // New users will complete profile during onboarding
              // ✅ Skip profile completion check if this was triggered from promo page
              const needsCompletion =
                userNeedsOnboarding && (!user.firstName || !user.email) && !skipPromo;
              console.log(
                "🔍 Profile check - firstName:",
                user.firstName,
                "email:",
                user.email,
                "needsOnboarding:",
                userNeedsOnboarding,
                "skipPromo:",
                skipPromo,
                "needsCompletion:",
                needsCompletion
              );

              set({
                user,
                role: user.role as AuthState["role"],
                isAuthenticated: true,
                loading: false,
                needsProfileCompletion: needsCompletion,
              });


              // Only execute onLoginSuccess if user doesn't need onboarding
              // If they need onboarding, the callback will be executed after onboarding completes
              const { onLoginSuccess, needsOnboarding } = get();
              if (onLoginSuccess && !needsOnboarding && !needsCompletion) {
                onLoginSuccess();
                set({ onLoginSuccess: null });
              }
              set({ isCounselorSignupFlow: false });
            }
          }
        } catch (err) {
          console.error("Failed during verifyOtp data fetch:", err);
        }

        // Capture lead immediately on login for students — fire-and-forget,
        // deduped per phone, runs even if the profile fetch above failed so we
        // always get at least phone + tracked source.
        if (isUser || isMba) {
          captureLeadFromUser(get().user, phone);
        }

        const { pendingAction } = get();
        const { setBookingTriggered } = get();

        if (pendingAction) {
          setTimeout(() => {
            setBookingTriggered(true);
            set({ pendingAction: null });
          }, 400);
        }

        set({ isLoginToggle: false, loading: false });
      },

      logout: () => {
        clearToken();
        set({
          user: null,
          userId: null,
          isAuthenticated: false,
          isLoginToggle: false,
          userExist: false,
          role: null,
          onLoginSuccess: null,
          loading: false,
          needsOnboarding: false,
          needsProfileCompletion: false,
          isProfileCompletionOpen: false,
          returnToPath: null,
          pendingAction: null,
          isCounselorSignupFlow: false,
          tempJwt: null,
          tempPhone: null,
          schoolStudent: null,
        });
      },
    }),
    {
      name: "user",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) =>
            [
              "user",
              "userId",
              "role",
              "isAuthenticated",
              "userExist",
              "needsOnboarding",
              "needsProfileCompletion",
              "schoolStudent",
            ].includes(key)
          )
        ),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state) {
          setTimeout(() => {
            state.loading = false;
          }, 100);
        }
      },
    }
  )
);
