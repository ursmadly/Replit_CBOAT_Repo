import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

type SignalDetectionData = {
  id: number;
  detectionId: string;
  observation: string;
  dataReference: string;
  priority: string;
  createdAt: string;
};

const getIconByPriority = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return { icon: 'error', color: 'text-danger-500', bgColor: 'bg-danger-500 bg-opacity-10' };
    case 'High':
      return { icon: 'warning', color: 'text-warning-500', bgColor: 'bg-warning-500 bg-opacity-10' };
    case 'Medium':
      return { icon: 'info', color: 'text-primary-500', bgColor: 'bg-primary-500 bg-opacity-10' };
    default:
      return { icon: 'info_outline', color: 'text-neutral-500', bgColor: 'bg-neutral-500 bg-opacity-10' };
  }
};

const getBadgeColor = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return 'bg-danger-100 text-danger-800';
    case 'High':
      return 'bg-warning-100 text-warning-800';
    case 'Medium':
      return 'bg-primary-100 text-primary-800';
    default:
      return 'bg-neutral-100 text-neutral-800';
  }
};

export default function SignalDetections() {
  const { data: detections = [], isLoading } = useQuery({
    queryKey: ['/api/signaldetections'],
    select: (data) => {
      // Transform API data to the format we need
      return data.map((detection: any) => {
        return {
          id: detection.id,
          detectionId: detection.detectionId,
          observation: detection.observation,
          dataReference: detection.dataReference,
          priority: detection.priority,
          createdAt: new Date(detection.createdAt).toLocaleDateString()
        };
      }).slice(0, 4); // Get the 4 most recent
    }
  });

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 px-4 py-4 flex-row justify-between items-center">
        <CardTitle className="text-base font-medium text-neutral-800">Recent Signal Detections</CardTitle>
        <div className="flex space-x-2">
          <button className="p-1 rounded hover:bg-neutral-100">
            <span className="material-icons text-neutral-500">more_vert</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="material-icons animate-spin text-primary-500">refresh</span>
              <span className="ml-2">Loading signal detections...</span>
            </div>
          ) : (
            detections.map((detection: SignalDetectionData, index: number) => {
              const { icon, color, bgColor } = getIconByPriority(detection.priority);
              
              return (
                <div key={detection.id} className={cn(
                  "mb-4 pb-4",
                  index < detections.length - 1 ? "border-b border-neutral-100" : ""
                )}>
                  <div className="flex items-center">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mr-3", bgColor)}>
                      <span className={cn("material-icons", color)}>{icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{detection.observation}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{detection.dataReference}</p>
                    </div>
                    <Badge className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      getBadgeColor(detection.priority)
                    )}>
                      {detection.priority}
                    </Badge>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs text-neutral-500">
                    <span>Detection ID: {detection.detectionId}</span>
                    <span>{detection.createdAt}</span>
                  </div>
                  <div className="mt-3 flex">
                    <Button variant="secondary" size="sm" className="px-3 py-1.5 text-xs bg-neutral-100 text-neutral-700 rounded mr-2 hover:bg-neutral-200">
                      Assign Task
                    </Button>
                    <Button variant="outline" size="sm" className="px-3 py-1.5 text-xs bg-primary-50 text-primary-600 rounded hover:bg-primary-100">
                      View Details
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="link" className="text-primary-500 text-sm font-medium hover:text-primary-600">
            View All Signal Detections
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
