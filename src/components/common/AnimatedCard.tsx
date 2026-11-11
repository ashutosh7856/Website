import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { cardHoverY, cardTransition } from './motionPresets';
import type { ReactNode } from 'react';

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode;
}

export default function AnimatedCard({ children, className, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{ y: cardHoverY }}
      transition={cardTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
