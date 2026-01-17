import React from 'react';
import { Badge } from '@/common/ui/badge-component';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

interface MarketCardProps {
  title: string;
  value: string | number;
  change?: string | number;
  isIncrease?: boolean;
  label?: string;
  source?: string;
  sourceLink?: string;
  chartData?: { value: number; date?: string }[];
  showXAxis?: boolean;
}

export const MarketCard: React.FC<MarketCardProps> = ({ 
  title, 
  value, 
  change, 
  isIncrease, 
  label,
  source,
  sourceLink,
  chartData,
  showXAxis = false
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

      <div className={`mt-4 ${showXAxis ? 'h-[100px]' : 'h-[60px]'} w-full`}>
        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={showXAxis ? { bottom: 20, left: 5, right: 5 } : {}}>
              <YAxis domain={['auto', 'auto']} hide />
              {showXAxis && (
                <XAxis 
                  dataKey="date" 
                  hide={false} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                  }}
                  interval="preserveStartEnd"
                  minTickGap={20}
                />
              )}
              <Tooltip 
                contentStyle={{ fontSize: '10px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                formatter={(val: number) => [val, title]}
              />
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
