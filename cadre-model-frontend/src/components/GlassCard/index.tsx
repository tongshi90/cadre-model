import React from 'react';
import './GlassCard.css';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  gradient?: boolean;
  animate?: boolean;
  delay?: number;
  onClick?: () => void;
}

/**
 * 玻璃态卡片组件
 * 提供一致的玻璃态效果和动画
 */
const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hover = false,
  glow = false,
  gradient = false,
  animate = false,
  delay = 0,
  onClick,
}) => {
  const classes = [
    'glass-card',
    hover && 'glass-card-hover',
    glow && 'glass-card-glow',
    gradient && 'glass-card-gradient',
    animate && 'animate-fadeInUp',
    delay > 0 && `animation-delay-${delay}`,
    onClick && 'glass-card-clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const inlineStyle: React.CSSProperties = delay > 0 ? { animationDelay: `${delay}ms` } : {};

  return (
    <div className={classes} style={inlineStyle} onClick={onClick}>
      {children}
    </div>
  );
};

export default GlassCard;
