import React from 'react';
import { Badge } from '@/common/ui/badge-component';

interface MarketCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  isIncrease?: boolean;
  label?: string;
}

export const MarketCard: React.FC<MarketCardProps> = ({ 
  title, 
  value, 
  change, 
  isIncrease, 
  label 
}) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-subtle-sm transition-all hover:shadow-subtle-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          {label && <Badge variant="outline">{label}</Badge>}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">{value}</span>
          {change && (
            <span className={`text-xs font-medium ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
              {isIncrease ? '↑' : '↓'} {change}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
