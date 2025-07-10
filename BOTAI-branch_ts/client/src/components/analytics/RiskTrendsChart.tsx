import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

type RiskTrendsChartProps = {
  trialId: number;
  timeRange: number;
};

// Helper function to generate risk trend data
function generateRiskTrendData(timeRange: number) {
  const result = [];
  const today = new Date();
  
  for (let i = timeRange; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const dayOfWeek = date.getDay();
    // Weekend factor to simulate different patterns on weekends
    const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1;
    
    // Generate values with some randomness but with overall trend pattern
    result.push({
      date: date.toISOString().split('T')[0],
      patientSafety: Math.max(1, Math.min(10, 4 + Math.sin(i/5) * 3 * weekendFactor + Math.random() * 1)),
      dataQuality: Math.max(1, Math.min(10, 7 - Math.cos(i/7) * 2 * weekendFactor + Math.random() * 1)),
      protocolDeviation: Math.max(1, Math.min(10, 5 + Math.sin(i/3) * 2 * weekendFactor + Math.random() * 1)),
    });
  }
  
  return result;
}

export default function RiskTrendsChart({ trialId, timeRange }: RiskTrendsChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // In a real application, this would be coming from an API call
    // For now, we'll generate mock data
    setData(generateRiskTrendData(timeRange));
  }, [trialId, timeRange]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Score Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p>Loading risk trend data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Score Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="patientSafety" 
                stroke="#ff6b6b" 
                strokeWidth={2}
                name="Patient Safety" 
              />
              <Line 
                type="monotone" 
                dataKey="dataQuality" 
                stroke="#339af0" 
                strokeWidth={2}
                name="Data Quality" 
              />
              <Line 
                type="monotone" 
                dataKey="protocolDeviation" 
                stroke="#ffa94d" 
                strokeWidth={2}
                name="Protocol Deviation" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}