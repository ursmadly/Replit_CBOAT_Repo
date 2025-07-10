import React, { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Bell, Check, Settings, AlertTriangle, Info, ChevronRight, 
  CalendarClock, FileText, Users, Database, AlertCircle, MessageSquare, 
  User, Filter, ArrowDown, ArrowUp, Beaker, Activity, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Define API notification type based on actual database schema
interface ApiNotification {
  id: number;
  userId: number;
  title: string;
  description: string; // This is what we use for UI description
  type: 'signal' | 'task' | 'system' | 'protocol' | 'query' | 'data' | 'monitoring' | 'safety';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  trialId?: number;
  source?: string;
  relatedEntityType?: string; // "task", "signal", etc.
  relatedEntityId?: number; // ID of the related entity
  read: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  targetRoles?: string[];
  targetUsers?: number[];
  createdAt: string;
  readAt?: string;
}

// Define UI notification type
interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'signal' | 'task' | 'system' | 'protocol' | 'query' | 'data' | 'monitoring' | 'safety';
  priority: 'critical' | 'high' | 'medium' | 'low' | 'info';
  study?: string;
  source?: string;
  read: boolean;
  link?: string;
  actionRequired?: boolean;
}

// Convert API notification to UI notification
function mapApiToUiNotification(apiNotification: ApiNotification): Notification {
  // Use the database schema fields directly
  return {
    id: apiNotification.id.toString(),
    title: apiNotification.title,
    description: apiNotification.description,
    timestamp: apiNotification.createdAt,
    type: apiNotification.type,
    priority: apiNotification.priority,
    // For study, try to get it from the trial
    study: apiNotification.trialId ? `PRO00${apiNotification.trialId}` : undefined,
    source: apiNotification.source,
    read: apiNotification.read,
    link: apiNotification.actionUrl,
    actionRequired: apiNotification.actionRequired || apiNotification.type === 'task' || apiNotification.priority === 'critical'
  };
}

// Define notification settings type
interface NotificationSettings {
  id: number;
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  criticalOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Using imported queryClient instead of local instance to ensure consistency
  const [_, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  // Query for notification settings
  const {
    data: notificationSettings,
    isLoading: isLoadingSettings,
    error: settingsError,
    refetch: refetchSettings
  } = useQuery<NotificationSettings>({
    queryKey: ['/api/notification-settings'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/notification-settings', 'GET');
      } catch (error) {
        console.error("Failed to fetch notification settings:", error);
        throw error;
      }
    },
    enabled: !!user,
  });
  
  // Mutation to update notification settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<NotificationSettings>) => {
      try {
        return await apiRequest('/api/notification-settings', 'PATCH', settings);
      } catch (error) {
        console.error("Failed to update notification settings:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update notification settings",
        variant: "destructive"
      });
      console.error("Error updating notification settings:", error);
    }
  });
  
  // Handle toggle changes for notification settings
  const handleSettingChange = (setting: keyof Pick<NotificationSettings, 'emailNotifications' | 'pushNotifications' | 'criticalOnly'>) => {
    if (!notificationSettings) return;
    
    const newSettings = {
      [setting]: !notificationSettings[setting]
    };
    
    updateSettingsMutation.mutate(newSettings);
  };
  
  // Query for retrieving notifications
  const {
    data: apiNotifications = [],
    isLoading,
    isError,
    error
  } = useQuery<ApiNotification[]>({
    queryKey: ['/api/notifications'],
    queryFn: async () => {
      console.log("Fetching notifications for user:", user?.id);
      try {
        // Always include read notifications (setting includeRead=true)
        // This ensures all notifications are displayed in the UI
        const notifications = await apiRequest('/api/notifications?includeRead=true', 'GET') as ApiNotification[];
        console.log("Fetched notifications:", notifications.length);
        return notifications;
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
    // Only run this query when the user is authenticated
    enabled: !!user,
    // Include parameters for filtering and pagination if needed
    refetchInterval: 30000, // Refetch every 30 seconds to keep notifications current
  });
  
  // Query for notification count (for unread badge)
  const { data: notificationCountData } = useQuery<{ count: number }>({
    queryKey: ['/api/notifications/count'],
    queryFn: async () => {
      try {
        // Important: First parameter is the URL, second is the HTTP method
        return await apiRequest('/api/notifications/count', 'GET');
      } catch (error) {
        console.error("Failed to fetch notification count:", error);
        return { count: 0 };
      }
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
  
  // Convert API notifications to UI format
  const notifications: Notification[] = apiNotifications.map(mapApiToUiNotification);
  
  // Mutation to mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        console.log(`Marking notification as read - ID: ${id}`);
        // First parameter is the URL, second is the HTTP method, third is the data
        const response = await apiRequest('/api/notifications/mark-read', 'POST', {
          ids: [id]
        });
        console.log(`Mark as read response:`, response);
        return response;
      } catch (error) {
        console.error("Error in markAsReadMutation:", error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log(`Successfully marked notification ${variables} as read`);
      // Invalidate notifications queries to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
      console.error("Error marking notification as read:", error);
    }
  });
  
  // Mutation to mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
        // First parameter is the URL, second is the HTTP method, third is the data
        const response = await apiRequest('/api/notifications/mark-all-read', 'POST', {});
        return response;
      } catch (error) {
        console.error("Error in markAllAsReadMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
      // Invalidate notifications queries to refetch the updated data
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
      console.error("Error marking all notifications as read:", error);
    }
  });
  
  // Function to mark a notification as read
  const markAsRead = (id: string) => {
    console.log(`Calling markAsRead for notification ID ${id}`);
    // Convert the ID to a number before sending it to the API
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      console.error(`Invalid notification ID: ${id}`);
      return;
    }
    console.log(`Converting notification ID ${id} to numeric ID ${numericId} before marking as read`);
    markAsReadMutation.mutate(numericId);
  };
  
  // Function to mark all notifications as read
  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  // Filter notifications based on active tab, search query, and user's role
  const filteredNotifications = notifications.filter(notification => {
    // First, filter based on user's role
    // System Administrators, Data Managers, and Lab Data Managers can see all notifications
    // Other roles only see notifications that are relevant to their role
    if (!(user?.role === "System Administrator" || user?.role === "Data Manager" || user?.role === "Lab Data Manager" || user?.role === "Principal Investigator")) {
      // For this simplified example, we'll show only notifications relevant to the user's role
      
      // Medical Monitors should only see safety, signal, monitoring notifications and critical notifications
      if (user?.role === "Medical Monitor") {
        if (!["safety", "signal", "monitoring"].includes(notification.type) && notification.priority !== "critical") {
          return false;
        }
      } 
      
      // Filter based on access to studies if available
      if (notification.study && user?.studyAccess) {
        // If user doesn't have "All Studies" access, check if they have access to this specific study
        if (!user.studyAccess.includes("All Studies") && !user.studyAccess.includes(notification.study)) {
          return false;
        }
      }
    }
    
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         notification.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (notification.study && notification.study.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (notification.source && notification.source.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    // We keep track of the timestamp for sorting
    const timestamp = new Date(notification.timestamp);
    
    switch (activeTab) {
      case "all":
        return true;
      case "unread":
        // Only show unread notifications in the unread tab
        return !notification.read;
      case "actionRequired":
        return notification.actionRequired;
      case "signal":
      case "safety":
      case "protocol":
      case "task":
      case "data":
      case "monitoring":
      case "query":
        return notification.type === activeTab;
      default:
        return true;
    }
  });

  // Sort notifications
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signal':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'task':
        return <CalendarClock className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <Settings className="h-5 w-5 text-gray-500" />;
      case 'protocol':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'query':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'data':
        return <Database className="h-5 w-5 text-green-500" />;
      case 'monitoring':
        return <Activity className="h-5 w-5 text-cyan-500" />;
      case 'safety':
        return <Beaker className="h-5 w-5 text-pink-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge className="bg-red-500 hover:bg-red-600">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 hover:bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-500 hover:bg-green-600">Low</Badge>;
      case 'info':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Info</Badge>;
      default:
        return null;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy, h:mm a');
    }
  };

  // Calculate unread count from filtered notifications
  // This ensures we only show badge counts for notifications the user can actually see
  const visibleNotifications = notifications.filter(notification => {
    // First, filter based on user's role
    if (!(user?.role === "System Administrator" || user?.role === "Data Manager" || user?.role === "Lab Data Manager" || user?.role === "Principal Investigator")) {
      // For Medical Monitors
      if (user?.role === "Medical Monitor") {
        if (!["safety", "signal", "monitoring"].includes(notification.type) && notification.priority !== "critical") {
          return false;
        }
      }
      
      // Filter based on access to studies if available
      if (notification.study && user?.studyAccess) {
        if (!user.studyAccess.includes("All Studies") && !user.studyAccess.includes(notification.study)) {
          return false;
        }
      }
    }
    return true;
  });
  
  // Calculate unread count including recently read notifications (within last 24 hours)
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const unreadCount = visibleNotifications.filter(n => {
    if (!n.read) return true; // Always include unread notifications
    
    // For read notifications, include only those from the last 24 hours
    const timestamp = new Date(n.timestamp);
    return timestamp >= yesterday;
  }).length;
  const actionRequiredCount = visibleNotifications.filter(n => n.actionRequired).length;
  
  // Enhanced function to handle notification click and redirect
  const handleNotificationClick = (notification: Notification, apiNotification: ApiNotification) => {
    // NOTE: We DON'T mark as read here anymore - it will be done in the task-specific code path
    // to ensure correct ordering. This ensures we don't have a race condition.
    
    // If we have a task-related notification, handle it specially
    if (apiNotification.relatedEntityType === 'task' && apiNotification.relatedEntityId) {
      console.log(`[NOTIFICATION] Opening task: ${apiNotification.relatedEntityId}`);
      
      // Get the numeric task ID
      const taskId = parseInt(apiNotification.relatedEntityId.toString());
      
      // Generate timestamp for cache busting - ensures fresh data on each click
      const timestamp = new Date().getTime();
      
      // CRITICAL FIX: Mark the notification as read FIRST, before anything else happens
      // This is the key to ensuring proper comment loading
      if (!notification.read) {
        console.log(`[NOTIFICATION_FIXED_ORDER] Step 1: Marking notification ID ${notification.id} as read FIRST`);
        
        // Mark as read immediately using the raw API call - CRITICAL for proper ordering
        // We don't use the markAsRead function (which would use the mutation) because we need
        // to guarantee the ordering and completion of this call before proceeding
        const doMarkAsRead = async () => {
          try {
            // Direct API call
            await apiRequest('/api/notifications/mark-read', 'POST', { 
              ids: [notification.id]
            });
            console.log(`[NOTIFICATION_FIXED_ORDER] Successfully marked notification ${notification.id} as read BEFORE anything else`);
            
            // AFTER mark-read is complete, now we can do prefetching and routing
            console.log(`[NOTIFICATION_FIXED_ORDER] Step 2: Now doing prefetching AFTER mark-read is complete`);
            
            // 1. Prefetch the basic task data
            queryClient.prefetchQuery({
              queryKey: ['/api/tasks', taskId],
              queryFn: () => apiRequest(`/api/tasks/${taskId}`, 'GET'),
            });
            
            // 2. Prefetch comments with notification flag AFTER the mark-read has completed
            console.log(`[NOTIFICATION_FIXED_ORDER] Step 3: Prefetching comments for task ${taskId} AFTER mark-read`);
            queryClient.prefetchQuery({
              queryKey: ['/api/tasks', taskId, 'comments'],
              queryFn: () => apiRequest(`/api/tasks/${taskId}/comments?from=notification&preload=true&t=${timestamp}`, 'GET'),
              staleTime: 0
            });
            
            // 3. Now it's safe to navigate to the task
            console.log(`[NOTIFICATION_FIXED_ORDER] Step 4: NOW navigating to task ${taskId} after mark-read and prefetching`);
            
            // Pass notificationMarkedRead=true to indicate we've already done this step
            const taskUrl = `/tasks/${taskId}?forceOpen=true&from=notification&ts=${timestamp}&notificationMarkedRead=true`;
            setLocation(taskUrl);
            
            // Invalidate the notification queries to reflect new read status
            queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
            
          } catch (error) {
            console.error(`[NOTIFICATION_FIXED_ORDER] Error marking notification as read:`, error);
            
            // Even on error, we should still navigate to ensure the user isn't blocked
            const taskUrl = `/tasks/${taskId}?forceOpen=true&from=notification&ts=${timestamp}`;
            setLocation(taskUrl);
          }
        };
        
        // Execute mark-read immediately
        doMarkAsRead();
      } else {
        // Notification was already read, we can proceed with normal navigation
        console.log(`[NOTIFICATION_FIXED_ORDER] Notification ${notification.id} already read, proceeding with navigation`);
        const taskUrl = `/tasks/${taskId}?forceOpen=true&from=notification&ts=${timestamp}&notificationMarkedRead=true`;
        setLocation(taskUrl);
      }
      
      return;
    } 
    
    // Other notification type handlers
    // For all other notification types, we need to mark as read FIRST, then navigate
    
    // Common function to handle mark-read and then navigation for simple routes
    const markReadThenNavigate = async (route: string) => {
      if (!notification.read) {
        try {
          console.log(`[NOTIFICATION_FIXED_ORDER] First marking notification ${notification.id} as read...`);
          await apiRequest('/api/notifications/mark-read', 'POST', { ids: [notification.id] });
          
          // After successful mark read, then navigate
          console.log(`[NOTIFICATION_FIXED_ORDER] Successfully marked read, now navigating to ${route}`);
          setLocation(route);
          
          // Update notification lists
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
        } catch (error) {
          console.error(`[NOTIFICATION_FIXED_ORDER] Error marking read:`, error);
          
          // Still navigate even on error
          console.log(`[NOTIFICATION_FIXED_ORDER] Navigating to ${route} despite mark-read error`);
          setLocation(route);
        }
      } else {
        // Already read, just navigate
        console.log(`[NOTIFICATION_FIXED_ORDER] Notification already read, navigating to ${route}`);
        setLocation(route);
      }
    };
    
    switch (notification.type) {
      case 'task':
        markReadThenNavigate('/tasks');
        break;
        
      case 'signal':
        if (apiNotification.relatedEntityType === 'signal' && apiNotification.relatedEntityId) {
          markReadThenNavigate(`/signal-detections/${apiNotification.relatedEntityId}`);
        } else {
          markReadThenNavigate('/signal-detections');
        }
        break;
        
      case 'protocol':
        markReadThenNavigate('/protocol-doc-management');
        break;
        
      case 'data':
        markReadThenNavigate('/trial-data-management');
        break;
        
      case 'monitoring':
        markReadThenNavigate('/central-monitor-ai');
        break;
        
      case 'safety':
        markReadThenNavigate('/signal-detections');
        break;
        
      default:
        // Check if we have any URL to navigate to
        let targetUrl = '/';
        
        if (notification.link) {
          console.log(`[NOTIFICATION_FIXED_ORDER] Using custom link: ${notification.link}`);
          targetUrl = notification.link;
        } else if (apiNotification.actionUrl) {
          console.log(`[NOTIFICATION_FIXED_ORDER] Using action URL: ${apiNotification.actionUrl}`);
          targetUrl = apiNotification.actionUrl;
        } else {
          console.log(`[NOTIFICATION_FIXED_ORDER] No specific destination, using default route`);
        }
        
        markReadThenNavigate(targetUrl);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Notifications</h1>
            <p className="text-neutral-500 mt-1">View and manage system notifications and alerts</p>
            {user && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs font-normal">
                  {user.role === "System Administrator" || user.role === "Data Manager" || user.role === "Lab Data Manager" || user.role === "Principal Investigator"
                    ? `Viewing all notifications (${user.role})` 
                    : `Viewing filtered notifications (${user.role})`}
                </Badge>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Mark All as Read
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Bell className="mr-2 h-4 w-4" />
              {showSettings ? "Hide Settings" : "Notification Settings"}
            </Button>
          </div>
        </div>

        {/* Notification Settings Card */}
        {showSettings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="mr-2 h-5 w-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : settingsError ? (
                <div className="text-red-500 py-2">
                  Error loading notification settings. Please try again.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.emailNotifications || false}
                      onCheckedChange={() => handleSettingChange('emailNotifications')}
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive in-app notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.pushNotifications || false}
                      onCheckedChange={() => handleSettingChange('pushNotifications')}
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Critical Only</h4>
                      <p className="text-sm text-muted-foreground">
                        Only receive critical priority notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings?.criticalOnly || false}
                      onCheckedChange={() => handleSettingChange('criticalOnly')}
                      disabled={updateSettingsMutation.isPending}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-blue-600" />
                  Notification Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button 
                          className={`text-sm flex items-center ${activeTab === 'all' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                          onClick={() => setActiveTab('all')}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          All Notifications
                        </button>
                      </div>
                      <Badge>{visibleNotifications.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button 
                          className={`text-sm flex items-center ${activeTab === 'unread' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                          onClick={() => setActiveTab('unread')}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Unread & Recent
                        </button>
                      </div>
                      {unreadCount > 0 && <Badge className="bg-blue-500">{unreadCount}</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button 
                          className={`text-sm flex items-center ${activeTab === 'actionRequired' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                          onClick={() => setActiveTab('actionRequired')}
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Action Required
                        </button>
                      </div>
                      {actionRequiredCount > 0 && <Badge className="bg-red-500">{actionRequiredCount}</Badge>}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium mb-3">By Category</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'signal' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('signal')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                        Signals
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'task' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('task')}
                      >
                        <CalendarClock className="h-4 w-4 mr-2 text-blue-500" />
                        Tasks
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'query' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('query')}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 text-orange-500" />
                        Queries
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'data' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('data')}
                      >
                        <Database className="h-4 w-4 mr-2 text-green-500" />
                        Data
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'protocol' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('protocol')}
                      >
                        <FileText className="h-4 w-4 mr-2 text-purple-500" />
                        Protocol
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'monitoring' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('monitoring')}
                      >
                        <Activity className="h-4 w-4 mr-2 text-cyan-500" />
                        Monitoring
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'safety' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('safety')}
                      >
                        <Beaker className="h-4 w-4 mr-2 text-pink-500" />
                        Safety
                      </button>
                    </div>
                    <div className="flex items-center">
                      <button 
                        className={`text-sm flex items-center ${activeTab === 'system' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                        onClick={() => setActiveTab('system')}
                      >
                        <Settings className="h-4 w-4 mr-2 text-gray-500" />
                        System
                      </button>
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Bell className="mr-2 h-5 w-5 text-blue-600" />
                    {activeTab === 'all' ? 'All Notifications' : 
                     activeTab === 'unread' ? 'Unread & Recent Notifications' : 
                     activeTab === 'actionRequired' ? 'Action Required' :
                     `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Notifications`}
                    {sortedNotifications.length > 0 && <span className="ml-2 text-sm text-gray-500">({sortedNotifications.length})</span>}
                  </CardTitle>

                  <div className="flex items-center space-x-2">
                    <div className="relative w-64">
                      <Input
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pr-8"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                      title={sortOrder === "desc" ? "Newest first" : "Oldest first"}
                    >
                      {sortOrder === "desc" ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                        <DropdownMenuItem>Critical Only</DropdownMenuItem>
                        <DropdownMenuItem>High & Critical</DropdownMenuItem>
                        <DropdownMenuItem>Medium & Above</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Filter by Study</DropdownMenuLabel>
                        <DropdownMenuItem>ABC-123</DropdownMenuItem>
                        <DropdownMenuItem>XYZ-789</DropdownMenuItem>
                        <DropdownMenuItem>DEF-456</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 px-2">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Loading notifications...</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Please wait while we retrieve your notifications.
                    </p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading notifications</h3>
                    <p className="text-sm text-red-500 max-w-md mx-auto">
                      {error instanceof Error ? error.message : 'An unknown error occurred. Please try again later.'}
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
                        queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] });
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : sortedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No notifications found</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      {searchQuery ? 
                        "No notifications match your search criteria. Try a different search term or filter." : 
                        "There are no notifications in this category."}
                    </p>
                  </div>
                ) : (
                  <div>
                    {sortedNotifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`flex p-4 border-b last:border-b-0 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-100 cursor-pointer`}
                        onClick={() => {
                          // Find the corresponding API notification
                          const apiNotification = apiNotifications.find(n => n.id.toString() === notification.id);
                          if (apiNotification) {
                            handleNotificationClick(notification, apiNotification);
                          }
                        }}
                      >
                        <div className="flex-shrink-0 mr-4 mt-1">
                          {getNotificationIcon(notification.type)}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full absolute ml-4 -mt-1"></div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className={`text-sm font-medium ${notification.read ? 'text-gray-700' : 'text-blue-800'}`}>
                                {notification.title}
                              </h3>
                              {getPriorityBadge(notification.priority)}
                              {notification.actionRequired && (
                                <Badge variant="outline" className="border-red-500 text-red-500">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>
                            {notification.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            {notification.study && (
                              <span className="mr-3">
                                <span className="font-medium">Study:</span> {notification.study}
                              </span>
                            )}
                            {notification.source && (
                              <span>
                                <span className="font-medium">Source:</span> {notification.source}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-4 self-center flex flex-col gap-2">
                          {!notification.read && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 rounded-full p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              disabled={markAsReadMutation.isPending && markAsReadMutation.variables === parseInt(notification.id)}
                            >
                              {markAsReadMutation.isPending && markAsReadMutation.variables === parseInt(notification.id) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}