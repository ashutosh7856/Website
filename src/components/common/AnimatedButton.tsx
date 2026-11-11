import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { buttonHoverScale, buttonTapScale, buttonTransition } from './motionPresets';
import type { ReactNode } from 'react';

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  children: ReactNode;
}

export default function AnimatedButton({ children, className, ...props }: AnimatedButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: buttonHoverScale }}
      whileTap={{ scale: buttonTapScale }}
      transition={buttonTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}
