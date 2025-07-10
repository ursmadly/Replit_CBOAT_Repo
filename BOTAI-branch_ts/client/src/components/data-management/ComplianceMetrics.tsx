import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle 
} from "lucide-react";

export interface ComplianceMetric {
  name: string;
  category: string;
  status: 'on-track' | 'at-risk' | 'critical';
  value: number;
  target: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
}

interface ComplianceMetricsProps {
  metrics: ComplianceMetric[];
}

export default function ComplianceMetrics({ metrics = [] }: ComplianceMetricsProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'at-risk':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-600';
      case 'at-risk':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-blue-600';
    }
  };

  const getProgressValue = (value: number, target: number) => {
    // Calculate percentage of target (capped at 100%)
    return Math.min(Math.round((value / target) * 100), 100);
  };

  // Group metrics by category
  const metricsByCategory = metrics.reduce((acc: Record<string, ComplianceMetric[]>, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(metricsByCategory).map(([category, categoryMetrics], index) => (
        <div key={index}>
          <h3 className="text-sm font-medium mb-3">{category}</h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {categoryMetrics.map((metric, metricIndex) => (
              <Card key={metricIndex}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">{metric.name}</span>
                    <div className="flex space-x-1 items-center">
                      {getStatusIcon(metric.status)}
                      {getTrendIcon(metric.trend)}
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between mb-2">
                    <div className="flex items-baseline">
                      <span className="text-2xl font-semibold">{metric.value}</span>
                      <span className="text-sm text-gray-500 ml-1">/ {metric.target} {metric.unit}</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      metric.status === 'on-track' ? 'text-green-600' :
                      metric.status === 'at-risk' ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {metric.status === 'on-track' ? 'On Track' :
                       metric.status === 'at-risk' ? 'At Risk' :
                       'Critical'}
                    </span>
                  </div>
                  
                  <Progress 
                    value={getProgressValue(metric.value, metric.target)} 
                    className={`h-2 ${getProgressColor(metric.status)}`}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}