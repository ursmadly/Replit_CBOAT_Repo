import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { TaskComments } from './TaskComments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface Task {
  id: number;
  taskId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  trialId: number;
  studyName?: string;
  siteId?: number;
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  lastCommentAt?: Date;
  lastCommentBy?: string;
  // Additional fields for data context
  domain?: string;
  recordId?: string;
  source?: string;
  dataContext?: Record<string, any>; // For storing additional structured data
}

interface Trial {
  id: number;
  title: string;
  protocolId: string;
}

interface Site {
  id: number;
  name: string;
  siteId: string;
}

interface TaskDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: number | null;
}

export default function TaskDetails({ open, onOpenChange, taskId }: TaskDetailsProps) {
  // Get URL parameters to check if task was opened from notification
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams('');
  const fromNotification = urlParams.get('from') === 'notification' || urlParams.get('forceOpen') === 'true';
  
  // Set default tab - use comments tab when coming from notification
  const [activeTab, setActiveTab] = useState(fromNotification ? "comments" : "details");
  
  // Use key to force full re-mount of comments component when reopening via notification
  const [commentsKey, setCommentsKey] = useState(`comments-${taskId}-${Date.now()}`);
  
  // Reset comments key when task changes or when reopening
  useEffect(() => {
    if (open && taskId) {
      setCommentsKey(`comments-${taskId}-${Date.now()}`);
    }
  }, [taskId, open]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // We need sequential loading when loading from notifications
  // Step 1: Mark notification as read (always happens first)
  const markReadMutation = useMutation({
    mutationFn: async () => {
      if (!taskId || !fromNotification) return null;
      console.log(`[TASK DETAILS] Marking notification for task ${taskId} as read (STEP 1)`);
      try {
        const result = await apiRequest('/api/notifications/mark-read', 'POST', { 
          ids: [parseInt(taskId.toString())]
        });
        console.log(`[TASK DETAILS] Successfully marked notification for task ${taskId} as read`);
        return result;
      } catch (error) {
        console.error(`[TASK DETAILS] Error marking notification as read:`, error);
        return null;
      }
    }
  });

  // On mount, mark as read if from notification
  useEffect(() => {
    if (open && taskId && fromNotification) {
      console.log(`[TASK DETAILS] Initial load from notification - Starting sequential loading`);
      markReadMutation.mutate();
    }
  }, [taskId, open, fromNotification]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Step 2: Load the task data after notification is marked as read
  const { data: task, isLoading, isError } = useQuery<Task>({
    queryKey: ['/api/tasks', taskId],
    queryFn: async () => {
      console.log(`[TASK DETAILS] Loading task ${taskId} (STEP 2)`);
      
      // If this was from a notification, make sure mark-read was completed first
      if (fromNotification && !markReadMutation.isSuccess) {
        console.log(`[TASK DETAILS] Waiting for mark-read to complete before loading task`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay to ensure sequence
      }
      
      const taskData = await apiRequest<Task>(`/api/tasks/${taskId}`);
      return taskData;
    },
    enabled: !!taskId && open && (!fromNotification || markReadMutation.isSuccess || markReadMutation.isError),
    retry: 2,
  });

  const { data: trial } = useQuery<Trial>({
    queryKey: ['/api/trials', task?.trialId],
    queryFn: () => apiRequest<Trial>(`/api/trials/${task?.trialId}`),
    enabled: !!task?.trialId && open,
  });

  const { data: site } = useQuery<Site>({
    queryKey: ['/api/sites', task?.siteId],
    queryFn: () => apiRequest<Site>(`/api/sites/${task?.siteId}`),
    enabled: !!task?.siteId && open,
  });

  const updateTaskMutation = useMutation({
    mutationFn: (updateData: Partial<Task>) =>
      apiRequest(`/api/tasks/${taskId}`, 'PATCH', updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', taskId] });
      toast({
        title: 'Task updated',
        description: 'The task has been updated successfully',
      });
    },
    onError: (error) => {
      console.error('Failed to update task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleStatusChange = (newStatus: string) => {
    updateTaskMutation.mutate({ status: newStatus });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-500 hover:bg-red-600';
      case 'High':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'Medium':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
      case 'created':
        return <Badge>Created</Badge>;
      case 'assigned':
        return <Badge className="bg-amber-100 text-amber-700">Assigned</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
      case 'responded':
        return <Badge className="bg-purple-100 text-purple-700">Responded</Badge>;
      case 'under_review':
        return <Badge className="bg-indigo-100 text-indigo-700">Under Review</Badge>;
      case 're_opened':
        return <Badge className="bg-orange-100 text-orange-700">Reopened</Badge>;
      case 'completed':
      case 'closed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      default:
        // Format string with underscores by replacing them with spaces and capitalizing
        const formattedStatus = status
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char: string) => char.toUpperCase());
        return <Badge>{formattedStatus}</Badge>;
    }
  };

  if (isLoading || !task) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center h-40">
            <div className="text-center">Loading task details...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentUser = {
    fullName: "Dr. Sarah Johnson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${getPriorityColor(task.priority)} text-white`}>
                {task.priority}
              </Badge>
              <Badge variant="outline">{task.taskId}</Badge>
            </div>
            {getStatusBadge(task.status)}
          </div>
          <DialogTitle className="text-lg font-medium text-neutral-900 mt-2">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Task Details</TabsTrigger>
            <TabsTrigger value="comments">Comments {task.lastCommentAt && '(New)'}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm">{task.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                  <p className="mt-1 text-sm">{task.assignedTo || 'Unassigned'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                  <p className="mt-1 text-sm">{task.createdBy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className="mt-1 text-sm">
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created</h3>
                  <p className="mt-1 text-sm">{format(new Date(task.createdAt), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Study</h3>
                  <p className="mt-1 text-sm">
                    {task.studyName || (trial ? `${trial.protocolId} - ${trial.title}` : `Trial ID: ${task.trialId}`)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Site</h3>
                  <p className="mt-1 text-sm">
                    {site 
                      ? `${site.siteId} - ${site.name}` 
                      : (task.siteId ? `Site ID: ${task.siteId}` : 'Multiple Sites')}
                  </p>
                </div>
                
                {/* Data context information */}
                {task.domain && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Domain</h3>
                    <p className="mt-1 text-sm font-medium text-blue-600">{task.domain}</p>
                  </div>
                )}
                {task.recordId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Record ID</h3>
                    <p className="mt-1 text-sm font-medium text-blue-600">{task.recordId}</p>
                  </div>
                )}
                {task.source && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data Source</h3>
                    <p className="mt-1 text-sm">{task.source}</p>
                  </div>
                )}
                
                {task.completedAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                    <p className="mt-1 text-sm">
                      {format(new Date(task.completedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Render data context if available */}
              {task.dataContext && Object.keys(task.dataContext).length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Data Context</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(task.dataContext).map(([key, value]) => (
                      <div key={key}>
                        <h4 className="text-xs font-medium text-gray-500">{key}</h4>
                        <p className="text-sm truncate">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <Separator />
              
              {/* Status update dropdown */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Update Status</h3>
                <div className="mt-2">
                  <Select
                    disabled={updateTaskMutation.isPending}
                    value={task.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue>
                        {(() => {
                          switch (task.status) {
                            case 'not_started':
                            case 'created':
                              return 'Created';
                            case 'assigned':
                              return 'Assigned';
                            case 'in_progress':
                              return 'In Progress';
                            case 'responded':
                              return 'Responded';
                            case 'under_review':
                              return 'Under Review';
                            case 're_opened':
                              return 'Reopened';
                            case 'completed':
                            case 'closed':
                              return 'Completed';
                            default:
                              return task.status
                                .replace(/_/g, ' ')
                                .replace(/\b\w/g, (char: string) => char.toUpperCase());
                          }
                        })()}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Created</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="re_opened">Reopened</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  {updateTaskMutation.isPending && (
                    <div className="mt-2 text-xs text-blue-600">
                      Updating status...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* We no longer need a hidden preloader as TaskComments handles its own data loading */}
          
          <TabsContent value="comments">
            {/* Pass uniqueRequestId to prevent duplicate fetch conflicts */}
            <TaskComments 
              taskId={task.id} 
              currentUser={currentUser} 
              fromNotification={fromNotification}
              key={commentsKey} // Use dynamic key to force re-mount when reopening
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}