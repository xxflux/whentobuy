import React from 'react';
import { Badge } from '@/common/ui/badge-component';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface MarketCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  isIncrease?: boolean;
  label?: string;
  source?: string;
  sourceLink?: string;
  chartData?: { value: number }[];
}

export const MarketCard: React.FC<MarketCardProps> = ({ 
  title, 
  value, 
  change, 
  isIncrease, 
  label,
  source,
  sourceLink,
  chartData
}) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-subtle-sm transition-all hover:shadow-subtle-md relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-muted-foreground">{title}</h3>
          {label && <Badge variant="outline" className="text-xs">{label}</Badge>}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">{value}</span>
          {change && (
            <span className={`text-sm font-medium ${isIncrease ? 'text-green-500' : 'text-red-500'}`}>
              {isIncrease ? '↑' : '↓'} {change}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 h-[60px] w-full">
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <YAxis domain={['auto', 'auto']} hide />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={isIncrease ? "#22c55e" : "#ef4444"} 
                strokeWidth={2} 
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex items-center justify-center border-t border-dashed border-muted/20">
            <span className="text-[10px] text-muted-foreground italic tracking-tight">Gathering history...</span>
          </div>
        )}
      </div>

      {source && (
        <div className="mt-auto pt-2 flex items-center gap-1 border-t border-muted/30">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Source:</span>
          {sourceLink ? (
            <a 
              href={sourceLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-muted-foreground/80 hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
            >
              {source}
            </a>
          ) : (
            <span className="text-xs text-muted-foreground/80">{source}</span>
          )}
        </div>
      )}
    </div>
  );
};
