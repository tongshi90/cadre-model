import ScrollReveal from '@/components/ui/ScrollReveal';
import { ReactNode } from 'react';
import './FeatureCard.css';

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
  onClick?: () => void;
}

const FeatureCard = ({ icon, title, description, delay = 0, onClick }: FeatureCardProps) => {
  return (
    <ScrollReveal delay={delay}>
      <div className="feature-card" onClick={onClick}>
        <div className="feature-icon">{icon}</div>
        <h3 className="feature-title">{title}</h3>
        <p className="feature-description">{description}</p>
        <div className="feature-glow"></div>
      </div>
    </ScrollReveal>
  );
};

export default FeatureCard;
