import { ReactNode } from 'react';
import './CardGrid.css';

export interface CardGridProps {
  children: ReactNode;
  minCardWidth?: number;
  gap?: number;
  className?: string;
}

const CardGrid = ({ children, minCardWidth = 300, gap = 24, className = '' }: CardGridProps) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${minCardWidth}px, 1fr))`,
    gap: `${gap}px`,
  };

  return (
    <div className={`card-grid ${className}`} style={gridStyle}>
      {children}
    </div>
  );
};

export default CardGrid;
