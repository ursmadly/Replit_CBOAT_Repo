import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { generateTaskCompletionData } from "@/lib/utils";

type TaskCompletionChartProps = {
  trialId: number;
  timeRange: number;
};

export default function TaskCompletionChart({ trialId, timeRange }: TaskCompletionChartProps) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // In a real application, this would be coming from an API call
    // For now, we'll use our utility function to generate demo data
    setData(generateTaskCompletionData(timeRange));
  }, [trialId, timeRange]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Task Completion Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p>Loading task completion data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
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
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="created" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                name="Tasks Created"
              />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="2"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                name="Tasks Completed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}