'use client';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';

interface WaterLevelChartProps {
  values: { dt: string; clean1: string }[];
  thresholds: {
    normal: number;
    alert: number;
    warning: number;
    danger: number;
  };
}

export default function WaterLevelChart({ values, thresholds }: WaterLevelChartProps) {
  // Prepare data for chart - filter out invalid values and limit to last 48 hours
  const data = values
    .filter(v => v.clean1 !== '-9999' && parseFloat(v.clean1) > 0)
    .slice(-96) // Last 96 data points (48 hours at 30-min intervals)
    .map(v => ({
      dt: v.dt.slice(0, 16), // e.g. "24/06/2025 00:15"
      clean1: parseFloat(v.clean1),
    }));

  // Calculate chart domain
  const minValue = Math.min(...data.map(d => d.clean1), thresholds.normal * 0.8);
  const maxValue = Math.max(...data.map(d => d.clean1), thresholds.danger * 1.2);

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="dt" 
            tick={{ fontSize: 10, fill: '#aaa' }} 
            minTickGap={20}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[minValue, maxValue]} 
            tick={{ fontSize: 12, fill: '#aaa' }}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip
            contentStyle={{ 
              background: '#222', 
              border: '1px solid #444', 
              borderRadius: '8px',
              color: '#fff' 
            }}
            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
            formatter={(value: number) => [`${value.toFixed(2)}m`, 'Water Level']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {/* Threshold lines */}
          <ReferenceLine 
            y={thresholds.normal} 
            label={{ value: "Normal", position: 'insideRight', fill: '#39FF14' }} 
            stroke="#39FF14" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          <ReferenceLine 
            y={thresholds.alert} 
            label={{ value: "Alert", position: 'insideRight', fill: '#FFD600' }} 
            stroke="#FFD600" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          <ReferenceLine 
            y={thresholds.warning} 
            label={{ value: "Warning", position: 'insideRight', fill: '#FF9100' }} 
            stroke="#FF9100" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          <ReferenceLine 
            y={thresholds.danger} 
            label={{ value: "Danger", position: 'insideRight', fill: '#FF1744' }} 
            stroke="#FF1744" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          {/* Water level line */}
          <Line 
            type="monotone" 
            dataKey="clean1" 
            stroke="#4FC3F7" 
            strokeWidth={3} 
            dot={{ fill: '#4FC3F7', strokeWidth: 0.5, r: 1 }}
            activeDot={{ r: 5, stroke: '#4FC3F7', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 