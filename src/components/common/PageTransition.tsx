import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import {
  backdropTransition,
  backdropVariants,
  modalTransition,
  modalVariants,
  pageTransition,
  pageTransitionVariants,
  tabTransition,
  tabTransitionVariants,
} from './motionPresets';

interface PageTransitionProps {
  children: ReactNode;
  transitionKey: string;
  direction?: number;
}

// Re-exported so existing `@/components/common/PageTransition` imports keep working.
// eslint-disable-next-line react-refresh/only-export-components -- plain constants, no component state to preserve
export { pageTransitionVariants, pageTransition, tabTransitionVariants, tabTransition, modalVariants, modalTransition, backdropVariants, backdropTransition, buttonHoverScale, buttonTapScale, buttonTransition, cardHoverY, cardTransition } from './motionPresets';

// Helper components for common patterns
export function TabTransition({ children, transitionKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={tabTransitionVariants}
        transition={tabTransition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function Modal({ 
  children, 
  isOpen, 
  onClose 
}: { 
  children: ReactNode; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={backdropTransition}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={modalTransition}
          >
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function PageTransition({ children, transitionKey, direction }: PageTransitionProps) {
  const directionalVariants = {
    initial: (dir: number) => ({
      opacity: 1,
      x: dir === 0 ? 0 : dir > 0 ? 84 : -84,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: number) => ({
      opacity: 1,
      x: dir === 0 ? 0 : dir > 0 ? -84 : 84,
    }),
  };

  const directionalTransition = {
    type: "tween" as const,
    duration: 0.42,
    ease: [0.22, 0.61, 0.36, 1] as const,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        initial="initial"
        animate="animate"
        exit="exit"
        custom={direction}
        variants={direction === undefined ? pageTransitionVariants : directionalVariants}
        transition={direction === undefined ? pageTransition : directionalTransition}
        style={{ willChange: "transform", transform: "translateZ(0)" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
