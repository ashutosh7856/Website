export type UserType = "user" | "visitor" | "counselor";
export type Source = "web" | "mobile";

export interface SessionData {
  sessionId: string;
  userId: string;
  userType: UserType;
  source: Source;
  token?: string;
}

const SESSION_STORAGE_KEY = "chatbot_session_id";
const VISITOR_ID_KEY = "chatbot_visitor_id";


const generateVisitorId = (): string => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const generateSessionId = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};



const getOrCreateVisitorId = (): string => {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  } catch (error) {
    console.error("Failed to access localStorage for visitor ID:", error);
    return generateVisitorId();
  }
};


const detectSource = (): Source => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "web";
  }

  const userAgent = navigator.userAgent || navigator.vendor || ((window as Window & { opera?: string }).opera as string);

  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );

  return isMobile ? "mobile" : "web";
};


export const getCurrentSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.error("Failed to access sessionStorage:", error);
    return generateSessionId();
  }
};


export const createNewSession = (): string => {
  const newSessionId = generateSessionId();
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
  } catch (error) {
    console.error("Failed to save new session ID:", error);
  }
  return newSessionId;
};


export const clearSession = (): void => {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear session:", error);
  }
};


export const getSessionData = (
  authenticatedUserId?: string | null,
  userRole?: string | null,
  token?: string | null
): SessionData => {
  const sessionId = getCurrentSessionId();
  const source = detectSource();

  let userId: string;
  let userType: UserType;

  if (authenticatedUserId) {
    userId = authenticatedUserId;

    if (userRole === "counselor") {
      userType = "counselor";
    } else {
      userType = "user";
    }
  } else {
    userId = getOrCreateVisitorId();
    userType = "visitor";
  }

  return {
    sessionId,
    userId,
    userType,
    source,
    ...(token ? { token } : {}),
  };
};
