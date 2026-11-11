// Shared framer-motion variants/transitions. Kept out of PageTransition.tsx so
// that file only exports components (React Fast Refresh).

// Page/Route transitions - Fast and subtle
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

export const pageTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

// Tab/Content switch animations - Very fast cross-fade
export const tabTransitionVariants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -4,
  },
};

export const tabTransition = {
  duration: 0.15,
  ease: "easeOut" as const,
};

// Modal animations - Scale + fade
export const modalVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
  },
};

export const modalTransition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

// Backdrop fade
export const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const backdropTransition = {
  duration: 0.15,
};

// Micro-interactions - Button hover/tap
export const buttonHoverScale = 1.03;
export const buttonTapScale = 0.97;
export const buttonTransition = { duration: 0.08 };

// Card hover
export const cardHoverY = -4;
export const cardTransition = { duration: 0.12 };
