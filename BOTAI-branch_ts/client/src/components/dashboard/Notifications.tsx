import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// Mock notification data - in real application this would come from an API
const notifications = [
  {
    id: 1,
    title: "Protocol deviation detected",
    description: "Site ID 123 has reported 3 new protocol deviations in the past 24 hours.",
    timestamp: "2 hours ago",
    type: "alert",
    read: false
  },
  {
    id: 2,
    title: "New safety signal identified",
    description: "AI has identified a potential safety signal in adverse event reporting.",
    timestamp: "5 hours ago",
    type: "warning",
    read: false
  },
  {
    id: 3,
    title: "Task completion overdue",
    description: "3 high priority tasks are overdue for completion.",
    timestamp: "Yesterday",
    type: "alert",
    read: true
  },
  {
    id: 4,
    title: "Enrollment milestone reached",
    description: "Study has reached 75% of target enrollment.",
    timestamp: "2 days ago",
    type: "info",
    read: true
  },
  {
    id: 5,
    title: "Data quality threshold exceeded",
    description: "Site ID 456 has exceeded query rate threshold.",
    timestamp: "3 days ago",
    type: "warning",
    read: true
  }
];

export default function Notifications() {
  // Function to get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-danger-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-primary-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      default:
        return <Bell className="h-5 w-5 text-neutral-500" />;
    }
  };

  // Function to get badge color based on notification type
  const getNotificationBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" | null | undefined => {
    switch (type) {
      case 'alert':
        return "destructive";
      case 'warning':
        return "outline"; // Using outline since warning is not available
      case 'info':
        return "secondary";
      case 'success':
        return "default"; // Using default since success is not available
      default:
        return "outline";
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-neutral-500" />
            <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {notifications.filter(n => !n.read).length} New
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="text-primary-500">
            Mark all as read
          </Button>
        </div>
        <CardDescription>
          Recent system alerts and notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        <div className="space-y-1">
          {notifications.map((notification, index) => (
            <div key={notification.id}>
              <div className={`flex items-start p-3 rounded-md ${!notification.read ? 'bg-neutral-100' : ''}`}>
                <div className="flex-shrink-0 mr-3 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className={`text-sm font-medium ${!notification.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                      {notification.title}
                    </p>
                    <Badge variant={getNotificationBadgeVariant(notification.type)} className="ml-2">
                      {notification.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600 mt-1">
                    {notification.description}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-neutral-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {notification.timestamp}
                  </div>
                </div>
              </div>
              {index < notifications.length - 1 && (
                <Separator className="my-1" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}