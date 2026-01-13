import ScrollReveal from '@/components/ui/ScrollReveal';
import { ReactNode } from 'react';
import './StatCard.css';

export interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color?: string;
  delay?: number;
  prefix?: string;
  suffix?: string;
}

const StatCard = ({ icon, label, value, color = '#d4af37', delay = 0, prefix = '', suffix = '' }: StatCardProps) => {
  return (
    <ScrollReveal delay={delay}>
      <div className="stat-card" style={{ borderColor: color }}>
        <div className="stat-icon" style={{ color, background: `${color}15` }}>
          {icon}
        </div>
        <div className="stat-content">
          <div className="stat-value" style={{ color }}>
            {prefix}
            {value.toLocaleString()}
            {suffix}
          </div>
          <div className="stat-label">{label}</div>
        </div>
        <div className="stat-glow" style={{ background: color }}></div>
      </div>
    </ScrollReveal>
  );
};

export default StatCard;
