import { motion } from 'framer-motion';
import { ReactNode, useRef, useEffect, useState } from 'react';
import './Hero.css';

export interface HeroProps {
  title: string;
  titleHighlight?: string;
  description?: string;
  badge?: {
    icon: ReactNode;
    text: string;
  };
  actions?: Array<{
    primary?: boolean;
    children: ReactNode;
    onClick?: () => void;
    href?: string;
  }>;
  background?: 'gradient' | 'orbs' | 'mesh';
}

const Hero = ({ title, titleHighlight, description, badge, actions, background = 'orbs' }: HeroProps) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const renderBackground = () => {
    switch (background) {
      case 'orbs':
        return (
          <>
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
            <div
              className="mouse-glow"
              style={{
                left: mousePosition.x,
                top: mousePosition.y,
              }}
            ></div>
          </>
        );
      case 'gradient':
        return <div className="hero-gradient"></div>;
      case 'mesh':
        return <div className="hero-mesh"></div>;
      default:
        return null;
    }
  };

  return (
    <section className="hero-section" ref={heroRef}>
      <div className="hero-background">{renderBackground()}</div>

      <motion.div
        className="hero-content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        {badge && (
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            {badge.icon}
            <span>{badge.text}</span>
          </motion.div>
        )}

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {title}
          {titleHighlight && <span className="gradient-text">{titleHighlight}</span>}
        </motion.h1>

        {description && (
          <motion.p
            className="hero-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}

        {actions && actions.length > 0 && (
          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={index}
                className={`btn-${action.primary ? 'primary' : 'secondary'}`}
                onClick={action.onClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.children}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
};

export default Hero;
