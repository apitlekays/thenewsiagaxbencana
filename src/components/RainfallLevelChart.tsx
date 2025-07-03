import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts';

interface RainfallLevelChartProps {
  values: { dt: string; clean: string | number }[];
  thresholds: {
    light: number;
    moderate: number;
    heavy: number;
    veryheavy: number;
  };
}

export default function RainfallLevelChart({ values, thresholds }: RainfallLevelChartProps) {
  // Prepare data for chart - filter out invalid values and limit to last 48 hours
  const data = values
    .filter(v => v.clean !== '-9999' && parseFloat(v.clean as string) >= 0)
    .slice(-96)
    .map(v => ({
      dt: v.dt.slice(0, 16),
      clean: parseFloat(v.clean as string),
    }));

  // Calculate chart domain
  const minValue = Math.min(...data.map(d => d.clean), thresholds.light * 0.8);
  const maxValue = Math.max(...data.map(d => d.clean), thresholds.veryheavy * 1.2);

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
            formatter={(value: number) => [`${value.toFixed(2)}mm`, 'Rainfall']}
            labelFormatter={(label) => `Time: ${label}`}
          />
          {/* Threshold lines */}
          <ReferenceLine 
            y={thresholds.light} 
            label={{ value: "Light", position: 'insideRight', fill: '#39FF14' }} 
            stroke="#39FF14" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          <ReferenceLine 
            y={thresholds.moderate} 
            label={{ value: "Moderate", position: 'insideRight', fill: '#FFD600' }} 
            stroke="#FFD600" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          <ReferenceLine 
            y={thresholds.heavy} 
            label={{ value: "Heavy", position: 'insideRight', fill: '#FF9100' }} 
            stroke="#FF9100" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          <ReferenceLine 
            y={thresholds.veryheavy} 
            label={{ value: "Very Heavy", position: 'insideRight', fill: '#FF1744' }} 
            stroke="#FF1744" 
            strokeDasharray="3 3" 
            strokeWidth={2}
          />
          {/* Rainfall line */}
          <Line 
            type="monotone" 
            dataKey="clean" 
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