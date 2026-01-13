import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ReactNode } from 'react';

export interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const ScrollReveal = ({
  children,
  delay = 0,
  duration = 0.6,
  direction = 'up',
  distance = 50,
  className = '',
  threshold = 0.1,
  triggerOnce = true,
}: ScrollRevealProps) => {
  const [ref, inView] = useInView({
    threshold,
    triggerOnce,
  });

  const getInitialPosition = () => {
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance };
      case 'down':
        return { opacity: 0, y: -distance };
      case 'left':
        return { opacity: 0, x: distance };
      case 'right':
        return { opacity: 0, x: -distance };
      case 'none':
        return { opacity: 0 };
      default:
        return { opacity: 0, y: distance };
    }
  };

  const getFinalPosition = () => {
    switch (direction) {
      case 'up':
      case 'down':
        return { opacity: 1, y: 0 };
      case 'left':
      case 'right':
        return { opacity: 1, x: 0 };
      case 'none':
        return { opacity: 1 };
      default:
        return { opacity: 1, y: 0 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialPosition()}
      animate={inView ? getFinalPosition() : getInitialPosition()}
      transition={{ duration, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
