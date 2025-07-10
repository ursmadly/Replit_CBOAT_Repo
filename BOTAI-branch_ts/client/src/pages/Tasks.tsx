import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, useParams } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ClipboardList, 
  Plus, 
  CheckSquare, 
  MessageSquare, 
  Filter, 
  Search, 
  ArrowUpDown,
  AlertCircle,
  BarChart4,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  Users,
  RefreshCw,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceStrict } from "date-fns";
import { Task as BaseTask, TaskPriority, TaskStatus } from "@shared/schema";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { xhrRequest } from '@/lib/xhr-api-client';

// Extended Task interface with API-enhanced fields
interface Task extends BaseTask {
  studyName?: string;     // Name of the study from trial.title
  siteName?: string;      // Name of the site if available
  queryType?: string;     // Type of query that generated this task
  responses?: any[];      // Task responses/history
}

// Error Boundary Component to gracefully handle errors
class ErrorBoundary extends Component<{ children: ReactNode, fallback: ReactNode }> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
// Extended enum for more detailed status options
const ExtendedTaskStatus = {
  ...TaskStatus,
  RESPONDED: 'responded',
  UNDER_REVIEW: 'under_review',
  REOPENED: 're_opened',
  COMPLETED: 'completed'
};

// Define business roles for personas
const BusinessRoles = {
  DATA_MANAGER: 'Data Manager',
  CRA: 'CRA',
  MEDICAL_MONITOR: 'Medical Monitor',
  PRIMARY_INVESTIGATOR: 'Primary Investigator',
  CENTRAL_LAB: 'Central Lab',
  IRT: 'IRT',
  MEDICAL_IMAGING: 'Medical Imaging'
};

// Mock data for demo purposes - in a real implementation, this would come from API calls
const mockTasks = [
  {
    id: 1,
    taskId: 'TASK-DM-001',
    title: 'Review discrepant lab values',
    description: 'Patient 1045 has abnormal liver enzyme values that require immediate medical review',
    priority: TaskPriority.HIGH,
    status: ExtendedTaskStatus.UNDER_REVIEW,
    trialId: 1,
    studyName: 'PRO001 - Diabetes Type 2',
    siteId: 3,
    siteName: 'London Medical Center',
    detectionId: 'SIG-001',
    queryType: 'Data Quality',
    assignedTo: BusinessRoles.MEDICAL_MONITOR,
    assignedBy: BusinessRoles.DATA_MANAGER,
    createdBy: 'Data Manager.AI',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    responses: [
      {
        id: 1,
        comment: "I've checked the values and they seem consistent with patient's condition. Please review the previous medical history.",
        createdBy: BusinessRoles.DATA_MANAGER,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
      },
      {
        id: 2,
        comment: 'Reviewed patient history. These values are concerning and need follow-up with the site.',
        createdBy: BusinessRoles.MEDICAL_MONITOR,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
      }
    ]
  },
  {
    id: 2,
    taskId: 'TASK-CM-002',
    title: 'Missing protocol-required images',
    description: 'Week 4 MRI scans are missing for patient 2038',
    priority: TaskPriority.MEDIUM,
    status: ExtendedTaskStatus.ASSIGNED,
    trialId: 2,
    studyName: 'PRO002 - Rheumatoid Arthritis',
    siteId: 5,
    siteName: 'Chicago Research Institute',
    detectionId: 'SIG-034',
    queryType: 'Protocol Adherence',
    assignedTo: BusinessRoles.CRA,
    assignedBy: BusinessRoles.MEDICAL_IMAGING,
    createdBy: 'Central Monitor.AI',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    responses: []
  },
  {
    id: 3,
    taskId: 'TASK-DM-003',
    title: 'Reconcile discrepant adverse event dates',
    description: 'AE dates in EDC do not match dates in safety database for patient 3021',
    priority: TaskPriority.CRITICAL,
    status: ExtendedTaskStatus.RESPONDED,
    trialId: 3,
    studyName: 'PRO003 - Advanced Breast Cancer',
    siteId: 2,
    siteName: 'Mayo Clinic',
    detectionId: 'SIG-012',
    queryType: 'Data Reconciliation',
    assignedTo: BusinessRoles.DATA_MANAGER,
    assignedBy: BusinessRoles.CRA,
    createdBy: 'Data Manager.AI',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    responses: [
      {
        id: 3,
        comment: "I've checked with the site and they confirmed the correct dates. The error is in the safety database entry.",
        createdBy: BusinessRoles.CRA,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
      }
    ]
  },
  {
    id: 4,
    taskId: 'TASK-CM-004',
    title: 'Drug dispensation outside protocol window',
    description: 'Patient 4018 received medication outside the protocol-specified window',
    priority: TaskPriority.HIGH,
    status: ExtendedTaskStatus.NOT_STARTED,
    trialId: 4,
    studyName: 'PRO004 - Alzheimer\'s Disease',
    siteId: 7,
    siteName: 'Berlin Neurological Center',
    detectionId: 'SIG-056',
    queryType: 'Protocol Deviation',
    assignedTo: BusinessRoles.PRIMARY_INVESTIGATOR,
    assignedBy: BusinessRoles.IRT,
    createdBy: 'Central Monitor.AI',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 3)),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    responses: []
  },
  {
    id: 5,
    taskId: 'TASK-DM-005',
    title: 'Missing laboratory results',
    description: 'Week 12 hematology results missing for 5 patients at site 4',
    priority: TaskPriority.MEDIUM,
    status: ExtendedTaskStatus.IN_PROGRESS,
    trialId: 1,
    studyName: 'PRO001 - Diabetes Type 2',
    siteId: 4,
    siteName: 'Tokyo Medical University',
    detectionId: 'SIG-023',
    queryType: 'Data Completeness',
    assignedTo: BusinessRoles.CENTRAL_LAB,
    assignedBy: BusinessRoles.DATA_MANAGER,
    createdBy: 'Data Manager.AI',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 4)),
    responses: []
  },
  {
    id: 6,
    taskId: 'TASK-CM-006',
    title: 'Site enrollment rate below threshold',
    description: 'Site 6 enrollment rate is 65% below target for the last 3 months',
    priority: TaskPriority.HIGH,
    status: ExtendedTaskStatus.COMPLETED,
    trialId: 2,
    studyName: 'PRO002 - Rheumatoid Arthritis',
    siteId: 6,
    siteName: 'Sydney Research Hospital',
    detectionId: 'SIG-045',
    queryType: 'Enrollment Risk',
    assignedTo: BusinessRoles.CRA,
    assignedBy: BusinessRoles.MEDICAL_MONITOR,
    createdBy: 'Central Monitor.AI',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 1)), // Past due
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)),
    completedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    responses: [
      {
        id: 4,
        comment: "I've discussed this with the site. They are facing local staffing challenges but have hired 2 new CRCs starting next week.",
        createdBy: BusinessRoles.CRA,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
      },
      {
        id: 5,
        comment: "Noted. Let's monitor progress for the next 2 weeks and reassess.",
        createdBy: BusinessRoles.MEDICAL_MONITOR,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
      }
    ]
  }
];

// Component for showing priority badge with appropriate color
const PriorityBadge = ({ priority }: { priority: string }) => {
  const getColor = () => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case TaskPriority.HIGH:
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case TaskPriority.MEDIUM:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case TaskPriority.LOW:
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  return <Badge variant="outline" className={getColor()}>{priority}</Badge>;
};

// Component for showing status badge with appropriate color
const StatusBadge = ({ status }: { status: string }) => {
  const getColor = () => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
      case TaskStatus.ASSIGNED:
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case TaskStatus.IN_PROGRESS:
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case ExtendedTaskStatus.RESPONDED:
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-200";
      case ExtendedTaskStatus.UNDER_REVIEW:
        return "bg-cyan-100 text-cyan-800 hover:bg-cyan-200";
      case ExtendedTaskStatus.REOPENED:
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case ExtendedTaskStatus.COMPLETED:
      case TaskStatus.CLOSED:
        return "bg-green-100 text-green-800 hover:bg-green-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };
  
  const getDisplayText = () => {
    switch (status) {
      case TaskStatus.NOT_STARTED:
        return "Not Started";
      case TaskStatus.ASSIGNED:
        return "Assigned";
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      case TaskStatus.CLOSED:
        return "Closed";
      case ExtendedTaskStatus.RESPONDED:
        return "Responded";
      case ExtendedTaskStatus.UNDER_REVIEW:
        return "Under Review";
      case ExtendedTaskStatus.REOPENED:
        return "Reopened";
      case ExtendedTaskStatus.COMPLETED:
        return "Completed";
      default:
        return status;
    }
  };
  
  return <Badge variant="outline" className={getColor()}>{getDisplayText()}</Badge>;
};

// Component for the avatar with role-based colors
const RoleAvatar = ({ role, name }: { role: string, name?: string }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getColorForRole = () => {
    switch (role) {
      case BusinessRoles.DATA_MANAGER:
        return "bg-blue-100 text-blue-800";
      case BusinessRoles.CRA:
        return "bg-green-100 text-green-800";
      case BusinessRoles.MEDICAL_MONITOR:
        return "bg-purple-100 text-purple-800";
      case BusinessRoles.PRIMARY_INVESTIGATOR:
        return "bg-red-100 text-red-800";
      case BusinessRoles.CENTRAL_LAB:
        return "bg-yellow-100 text-yellow-800";
      case BusinessRoles.IRT:
        return "bg-orange-100 text-orange-800";
      case BusinessRoles.MEDICAL_IMAGING:
        return "bg-teal-100 text-teal-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const displayName = name || role;
  
  return (
    <Avatar className={`${getColorForRole()} h-8 w-8`}>
      <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
    </Avatar>
  );
};

// Task response component
const TaskResponse = ({ response, isLast }: { response: any, isLast: boolean }) => {
  return (
    <div className={`py-4 ${!isLast ? "border-b border-gray-200" : ""}`}>
      <div className="flex items-start">
        <RoleAvatar role={response.createdBy} />
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-gray-900">{response.createdBy}</span>
            <span className="text-sm text-gray-500">
              {format(new Date(response.createdAt), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          <p className="text-gray-700">{response.comment}</p>
        </div>
      </div>
    </div>
  );
};

// Task detail dialog component with enhanced error handling and logging
const TaskDetailDialog = ({ 
  task, 
  isOpen, 
  setIsOpen, 
  onStatusChange,
  onRespond,
  currentUserRole
}: { 
  task: any, 
  isOpen: boolean, 
  setIsOpen: (open: boolean) => void,
  onStatusChange: (taskId: number, newStatus: string) => void,
  onRespond: (taskId: number, comment: string) => void,
  currentUserRole: string
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [comment, setComment] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get user information from the auth context - added at component level
  const { user } = useAuth();
  const username = user?.username || user?.fullName || "Unknown User";
  
  // Handle dialog close - clear URL parameters
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Dialog is being closed, reset the URL to remove task ID
      console.log("[TASK DETAIL DIALOG] Dialog closing, resetting URL");
      setLocation("/tasks", { replace: true });
    }
    setIsOpen(open);
  };
  
  // Log when dialog is opened or closed
  useEffect(() => {
    console.log(`[TASK DETAIL DIALOG] Open state changed: ${isOpen}`);
    if (isOpen) {
      console.log("[TASK DETAIL DIALOG] Current task data:", task);
    }
  }, [isOpen, task]);
  
  // Early return if task is undefined
  if (!task) {
    console.error("[TASK DETAIL DIALOG] Task is undefined");
    return null;
  }
  
  // Log task details when dialog is opened
  useEffect(() => {
    if (isOpen && task) {
      console.log("[TASK DETAIL DIALOG] Dialog opened with task:", {
        id: task.id,
        taskId: task.taskId,
        status: task.status
      });
    }
  }, [isOpen, task]);
  
  // Set initial status when task changes
  useEffect(() => {
    if (task?.status) {
      console.log("[TASK DETAIL DIALOG] Setting initial task status:", task.status);
      setSelectedStatus(task.status);
    }
  }, [task]);
  
  // Handle form submission using direct XMLHttpRequest instead of fetch
  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      let shouldCloseDialog = false;
      
      // Handle status update if changed
      if (selectedStatus && selectedStatus !== task.status) {
        try {
          const updates = { 
            status: selectedStatus,
            ...(selectedStatus === ExtendedTaskStatus.COMPLETED ? { completedAt: new Date() } : {})
          };
          
          await xhrRequest({
            url: `/api/tasks/${task.id}`,
            method: 'PATCH',
            data: updates
          });
          
          console.log("Status updated successfully using XHR");
          shouldCloseDialog = true;
          
          // Manually invalidate any related queries
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          
          toast({
            title: "Success",
            description: "Task status has been updated successfully"
          });
        } catch (error) {
          console.error("XHR status update error:", error);
          toast({
            title: "Error",
            description: `Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      }
      
      // Handle comment submission
      if (comment.trim()) {
        try {
          // Use the username from the component level
          await xhrRequest({
            url: `/api/tasks/${task.id}/comments`,
            method: 'POST',
            data: {
              comment: comment.trim(),
              createdBy: username, // Use actual username from component level
              role: currentUserRole // Use role for proper attribution
            }
          });
          
          console.log("Comment added successfully using XHR");
          setComment("");
          shouldCloseDialog = true;
          
          // Manually invalidate any related queries
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          
          toast({
            title: "Success",
            description: "Your response has been added successfully"
          });
        } catch (error) {
          console.error("XHR comment add error:", error);
          toast({
            title: "Error",
            description: `Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      }
      
      // Close dialog if there were changes or if only viewing
      if (shouldCloseDialog || (!comment.trim() && selectedStatus === task.status)) {
        handleDialogClose(false);
      }
    } catch (error) {
      console.error("Error in task update:", error);
      toast({
        title: "Error",
        description: `There was a problem updating the task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create a simplified view component for the task dialog that minimizes property access
  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 p-1 rounded-md bg-blue-50">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <DialogTitle className="text-lg font-medium">
              {task?.taskId || 'Task'}: {task?.title || 'No Title'}
            </DialogTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <PriorityBadge priority={task?.priority || 'Medium'} />
            <StatusBadge status={task?.status || 'Not Started'} />
          </div>
        </DialogHeader>
        
        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Task Details</TabsTrigger>
            <TabsTrigger value="responses">Responses</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-700">{task?.description || 'No description available'}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                {/* Only show fields that we know exist */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Assigned To</h3>
                  <div className="mt-1 flex items-center">
                    <RoleAvatar role={task?.assignedTo || 'Unassigned'} />
                    <span className="ml-2 text-sm text-gray-700">{task?.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
                
                {task?.assignedBy && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Assigned By</h3>
                    <div className="mt-1 flex items-center">
                      <RoleAvatar role={task.assignedBy} />
                      <span className="ml-2 text-sm text-gray-700">{task.assignedBy}</span>
                    </div>
                  </div>
                )}
                
                {/* Safely display dates */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                  <p className="mt-1 text-sm text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-gray-400" />
                    {task?.dueDate ? 
                      format(new Date(task.dueDate), 'MMM d, yyyy') : 
                      'Not set'}
                  </p>
                </div>
                
                {task?.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <p className="mt-1 text-sm text-gray-700">
                      {format(new Date(task.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                
                {task?.detectionId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Signal Detection</h3>
                    <p className="mt-1 text-sm text-blue-600 underline cursor-pointer">
                      {task.detectionId}
                    </p>
                  </div>
                )}
                
                {(task?.studyName || task?.trialId) && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Study</h3>
                    <p className="mt-1 text-sm text-gray-700">{task.studyName || `Trial ${task.trialId}`}</p>
                  </div>
                )}
                
                {task?.siteName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Site</h3>
                    <p className="mt-1 text-sm text-gray-700">{task.siteName}</p>
                  </div>
                )}
                
                {/* Display domain, recordId, and source information */}
                {task?.domain && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Domain</h3>
                    <p className="mt-1 text-sm text-blue-600 font-medium">{task.domain}</p>
                  </div>
                )}
                
                {task?.recordId && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Record ID</h3>
                    <p className="mt-1 text-sm text-blue-600 font-medium">{task.recordId}</p>
                  </div>
                )}
                
                {task?.source && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Data Source</h3>
                    <p className="mt-1 text-sm text-gray-700">{task.source}</p>
                  </div>
                )}
                
                {/* Add data context if available */}
                {task?.dataContext && Object.keys(task?.dataContext).length > 0 && (
                  <div className="col-span-2 mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
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
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="responses" className="pt-4">
            <div className="space-y-4">
              {/* Section for existing comments */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Previous Responses</h3>
                {Array.isArray(task.comments) && task.comments.length > 0 ? (
                  <div className="space-y-3">
                    {task.comments.map((comment: any, index: number) => (
                      <div key={index} className="border rounded-md p-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-1">
                          <RoleAvatar role={comment.role || 'User'} />
                          <span className="font-medium text-sm">{comment.createdBy || 'Unknown User'}</span>
                          {comment.createdAt && (
                            <span className="text-gray-500 text-xs">
                              {format(new Date(comment.createdAt), 'MMM d, yyyy h:mm a')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{comment.comment || ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 border rounded-md">
                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p>No responses yet</p>
                  </div>
                )}
              </div>
              
              {/* Only show comment input if task is not completed or closed */}
              {task?.status !== ExtendedTaskStatus.COMPLETED && task?.status !== TaskStatus.CLOSED && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Add Response</h3>
                  <Textarea 
                    placeholder="Type your response here..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Status change dropdown - only show if task is not closed */}
          {task?.status !== TaskStatus.CLOSED && (
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-sm font-medium">Status:</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue>
                    {(() => {
                      console.log("Current selectedStatus in SelectValue:", selectedStatus);
                      // Fall back to task.status if selectedStatus is empty
                      const statusToDisplay = selectedStatus || task.status;
                      console.log("Status to display:", statusToDisplay);
                      
                      switch (statusToDisplay) {
                        case TaskStatus.NOT_STARTED:
                          return "Not Started";
                        case TaskStatus.ASSIGNED:
                          return "Assigned";
                        case TaskStatus.IN_PROGRESS:
                          return "In Progress";
                        case TaskStatus.CLOSED:
                          return "Closed";
                        case ExtendedTaskStatus.RESPONDED:
                          return "Responded";
                        case ExtendedTaskStatus.UNDER_REVIEW:
                          return "Under Review";
                        case ExtendedTaskStatus.REOPENED:
                          return "Reopened";
                        case ExtendedTaskStatus.COMPLETED:
                          return "Completed";
                        default:
                          return statusToDisplay || "Select status";
                      }
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.NOT_STARTED}>Not Started</SelectItem>
                  <SelectItem value={TaskStatus.ASSIGNED}>Assigned</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={ExtendedTaskStatus.RESPONDED}>Responded</SelectItem>
                  <SelectItem value={ExtendedTaskStatus.UNDER_REVIEW}>Under Review</SelectItem>
                  <SelectItem value={ExtendedTaskStatus.REOPENED}>Reopened</SelectItem>
                  <SelectItem value={TaskStatus.CLOSED}>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => handleDialogClose(false)}
          >
            Cancel
          </Button>
          
          <Button 
            onClick={(e) => {
              e.preventDefault(); // Prevent form submission
              e.stopPropagation(); // Stop event propagation
              console.log("Submit button clicked");
              handleSubmit();
            }}
            disabled={(activeTab === "responses" && !comment.trim() && selectedStatus === task.status) || isSubmitting}
            type="button" // Explicitly set button type
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              activeTab === "responses" && comment.trim() ? "Submit Response" : "Update Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main tasks dashboard component
export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [studyFilter, setStudyFilter] = useState("all");
  const [queryTypeFilter, setQueryTypeFilter] = useState("all");
  const [sortField, setSortField] = useState("dueDate");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Import wouter useParams to get task ID from route
  const params = useParams<{ id?: string }>();
  
  // Fetch tasks from the API
  const { data: apiTasks, isLoading: isLoadingTasks, error: tasksError } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: () => apiRequest('/api/tasks'),
  });
  
  // Use API data if available, otherwise fallback to mock data for development
  const tasks = apiTasks || mockTasks;
  
  // Log all tasks with their status for debugging
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      console.log("All tasks with status:");
      tasks.forEach(task => {
        console.log(`Task ID: ${task.taskId}, Status: ${task.status}`);
      });
    }
  }, [tasks]);
  
  // Get current user from auth context
  const { user } = useAuth();
  const currentUserRole = user?.role || BusinessRoles.DATA_MANAGER;
  const isSystemAdmin = user?.role === "System Administrator";
  const isDataManager = user?.role === "Data Manager";
  const isPrincipalInvestigator = user?.role === "Principal Investigator";
  
  // NEW VERSION: Enhanced URL parameter handling for task details
  useEffect(() => {
    // This function is dedicated to finding and opening tasks from URL parameters
    const handleTaskDetailsFromURL = () => {
      // First check for task ID in route params (/tasks/:id) from wouter
      let taskId = params.id;
      let isDirect = !!params.id; // If we have an ID in the path, treat as direct
      
      // If not in route params, check query params as fallback
      if (!taskId) {
        const searchParams = new URLSearchParams(location.split('?')[1] || '');
        taskId = searchParams.get('taskId');
        isDirect = isDirect || searchParams.get('direct') === 'notification';
      }
      
      // Get other parameters from query string
      const searchParams = new URLSearchParams(location.split('?')[1] || '');
      const forceOpen = searchParams.get('forceOpen') === 'true';
      const ts = searchParams.get('ts') || '';  // Timestamp for cache busting
      
      console.log(`[TASK DETAIL] Parameters: taskId=${taskId}, forceOpen=${forceOpen}, direct=${isDirect}, ts=${ts}`);
      console.log(`[TASK DETAIL] Route params:`, params);
      
      // If this is a direct request from a notification, add detailed logging
      if (isDirect) {
        console.log('[TASK DETAIL] IMPORTANT: Direct request from path or notification detected');
        console.log('[TASK DETAIL] Current URL:', location);
        console.log('[TASK DETAIL] Tasks loaded:', tasks.length > 0);
      }
      
      // Exit early if no taskId 
      if (!taskId) {
        console.log("[TASK DETAIL] No taskId in URL parameters");
        return;
      }
      
      // For direct requests from notifications, wait more aggressively for tasks to load
      if (isDirect && (tasks.length === 0 || isLoadingTasks)) {
        console.log("[TASK DETAIL] DIRECT REQUEST: Tasks not yet loaded, setting up retry");
        
        // For direct notification requests, set up a more frequent retry mechanism
        setTimeout(() => {
          console.log("[TASK DETAIL] DIRECT REQUEST: Retrying task search from notification...");
          if (tasks.length > 0) {
            console.log("[TASK DETAIL] DIRECT REQUEST: Tasks now loaded, retrying...");
            handleTaskDetailsFromURL();
          }
        }, 300);
        
        return;
      }
      
      // Normal case - exit if tasks aren't loaded yet
      if (tasks.length === 0 || isLoadingTasks) {
        console.log("[TASK DETAIL] Tasks not yet loaded, waiting...");
        return;
      }
      
      console.log("[TASK DETAIL] Searching for task to open from URL parameter...");
      console.log(`[TASK DETAIL] Searching for task with ID: ${taskId} among ${tasks.length} tasks`);
      
      // Log all available tasks for debugging
      console.log("[TASK DETAIL] Available tasks:", tasks.map(t => ({
        id: t.id,
        taskId: t.taskId,
        title: t.title?.substring(0, 30)
      })));
      
      // For direct notification requests, log every task with more details to help diagnose
      if (isDirect) {
        console.log('[TASK DETAIL] DIRECT REQUEST: Showing complete task list with details:');
        tasks.forEach((t, idx) => {
          console.log(`[TASK DETAIL] Task ${idx + 1}:`, {
            id: t.id,
            numericId: t.id?.toString(),
            taskId: t.taskId,
            stringTaskId: t.taskId?.toString(),
            matchesTarget: t.id?.toString() === taskId || t.taskId?.toString() === taskId,
            title: t.title?.substring(0, 30),
            status: t.status
          });
        });
      }
      
      // Find the matching task (by numeric ID or string taskId)
      let taskToOpen = tasks.find(t => {
        // IMPORTANT: From notifications, we get the numeric primary key 'id'
        // Enhanced matching criteria with additional logging for debugging
        const numericTaskId = t.id?.toString() || '';
        const stringTaskId = t.taskId?.toString() || '';
        const matchesNumericId = numericTaskId === taskId;
        const matchesStringTaskId = stringTaskId === taskId;
        
        // Log for troubleshooting specific tasks
        if (matchesNumericId || matchesStringTaskId || taskId === '529' || taskId === '530') {
          console.log(`[TASK DETAIL] Matching task: ID=${numericTaskId}, taskId=${stringTaskId}, lookingFor=${taskId}, match=${matchesNumericId || matchesStringTaskId}`);
        }
        
        return matchesNumericId || matchesStringTaskId;
      });
      
      // For direct notification requests, add extra fallback logic when task isn't found
      if (!taskToOpen && isDirect && tasks.length > 0) {
        console.warn(`[TASK DETAIL] DIRECT REQUEST: Task ${taskId} not found with exact matching. Trying fuzzy match...`);
        
        // Less strict matching - try finding task that contains this ID as part of its ID
        taskToOpen = tasks.find(t => {
          const numericId = t.id?.toString() || '';
          const stringId = t.taskId?.toString() || '';
          
          // Look for any task that might partially match this ID
          if (numericId.includes(taskId) || stringId.includes(taskId)) {
            console.log(`[TASK DETAIL] DIRECT REQUEST: Found potential fuzzy match: ${numericId}/${stringId}`);
            return true;
          }
          return false;
        });
        
        // Last resort - just take the first task if available
        if (!taskToOpen && isDirect) {
          console.warn(`[TASK DETAIL] DIRECT REQUEST: No matches found, using first available task as fallback`);
          taskToOpen = tasks[0];
        }
      }
      
      if (!taskToOpen) {
        console.error(`[TASK DETAIL] Task not found with ID: ${taskId}`);
        toast({
          title: "Task Not Found",
          description: `The requested task (ID: ${taskId}) could not be found.`,
          variant: "destructive"
        });
        return;
      }
      
      // Success - found the task
      console.log("[TASK DETAIL] FOUND TASK:", taskToOpen);
      
      // IMPORTANT: Use direct state setting approach for notification-triggered task details
      try {
        // Get additional details from the URL for more robust handling
        const isDirectFromNotification = forceOpen || location.includes('forceOpen=true');
        
        console.log(`[TASK DETAIL] Opening task directly from notification: ${isDirectFromNotification}`);
        
        // 1. Log detailed task info for debugging purposes
        console.log('[TASK DETAIL] Opening task with details:', {
          id: taskToOpen.id,
          taskId: taskToOpen.taskId,
          title: taskToOpen.title?.substring(0, 30) + '...',
          status: taskToOpen.status
        });
        
        // 2. Direct state management to set the selected task
        setSelectedTask(taskToOpen);
        
        // 3. Make sure the dialog opens with multiple fallbacks based on importance
        // First attempt - high priority immediate open
        setIsTaskDetailOpen(true);
        
        // For any notification (especially those coming from forceOpen parameter), set up extra safeguards
        // Second attempt - after a short delay for better reliability
        setTimeout(() => {
          console.log("[TASK DETAIL] Forcing dialog open - first delay (200ms)");
          setSelectedTask(taskToOpen);
          setIsTaskDetailOpen(true);
        }, 200);
        
        // Third attempt - after a medium delay
        setTimeout(() => {
          console.log("[TASK DETAIL] Forcing dialog open - second delay (500ms)");
          setSelectedTask(taskToOpen);
          setIsTaskDetailOpen(true);
        }, 500);
        
        // Final attempt - after a longer delay with extra fallback mechanism
        setTimeout(() => {
          console.log("[TASK DETAIL] Forcing dialog open - final delay (1000ms)");
          
          // Extra debugging to see component state at this point
          console.log("[TASK DETAIL] Current state:", { 
            isTaskDetailOpen, 
            hasSelectedTask: !!selectedTask,
            forceOpen: isDirectFromNotification
          });
          
          // Force open again
          setSelectedTask(taskToOpen);
          setIsTaskDetailOpen(true);
          
          // Last resort - use the click handler directly if still not open
          if (!isTaskDetailOpen) {
            console.log("[TASK DETAIL] Using click handler as fallback");
            handleTaskClick(taskToOpen);
          }
        }, 1000);
        
      } catch (error) {
        console.error("[TASK DETAIL] Error opening task details:", error);
        toast({
          title: "Error",
          description: "Failed to open task details. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    // Run the function to handle URL parameters
    handleTaskDetailsFromURL();
    
    // Set up a more aggressive polling approach for task details from URL
    // This helps when the component is already mounted but a new URL is navigated to
    const urlCheckInterval = setInterval(() => {
      // Check for taskId in route params (path parameter)
      const hasPathTaskId = !!params.id;
      
      // Check for taskId in query params as fallback
      const searchParams = new URLSearchParams(location.split('?')[1] || '');
      const hasQueryTaskId = searchParams.get('taskId') !== null;
      
      const hasAnyTaskId = hasPathTaskId || hasQueryTaskId;
      
      if (hasAnyTaskId && tasks.length > 0 && !isTaskDetailOpen) {
        console.log("[TASK DETAIL] Polling detected task ID in URL but dialog not open, retrying...");
        handleTaskDetailsFromURL();
      }
    }, 500);
    
    // Clean up interval
    return () => clearInterval(urlCheckInterval);
    
  }, [location, tasks, isLoadingTasks, isTaskDetailOpen]);
  
  // State for multi-select functionality
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [isMultiResponseOpen, setIsMultiResponseOpen] = useState(false);
  const [multiResponseComment, setMultiResponseComment] = useState("");
  
  // Extract unique values for filter dropdowns
  const studies = Array.from(new Set(tasks.map(task => 
    typeof task.studyName === 'string' ? task.studyName : `Trial ${task.trialId}`
  )));
  
  const queryTypes = Array.from(new Set(tasks.map(task => 
    typeof task.queryType === 'string' ? task.queryType : 'N/A'
  )));
  
  // Remove unused variable declaration

  // Add task comment mutation using XHR instead of fetch
  const addCommentMutation = useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: number, comment: string }) => {
      // Use XHR request instead of fetch-based apiRequest
      return xhrRequest({
        url: `/api/tasks/${taskId}/comments`,
        method: 'POST',
        data: {
          comment,
          createdBy: currentUserRole, // Use currentUserRole from context
          role: currentUserRole // Use currentUserRole for role field
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Response submitted",
        description: "Your response has been successfully added to the task.",
      });
    },
    onError: (error) => {
      console.error("Add comment error:", error);
      toast({
        title: "Error",
        description: `Failed to add comment: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update task status mutation using XHR
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: number, newStatus: string }) => {
      const updates: any = { status: newStatus };
      
      // If marked as completed, set the completedAt date
      if (newStatus === ExtendedTaskStatus.COMPLETED) {
        updates.completedAt = new Date();
      }
      
      // Use XHR request instead of fetch-based apiRequest
      return xhrRequest({
        url: `/api/tasks/${taskId}`,
        method: 'PATCH',
        data: updates
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Status updated",
        description: "Task status has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Update status error:", error);
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle task response submission - uses direct XHR call to avoid fetch issues
  const handleTaskResponse = async (taskId: number, comment: string) => {
    if (!comment.trim()) {
      return false;
    }
    
    try {
      await xhrRequest({
        url: `/api/tasks/${taskId}/comments`,
        method: 'POST',
        data: {
          comment,
          createdBy: currentUserRole, // Use currentUserRole from context 
          role: currentUserRole // Store role in role field
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Response submitted",
        description: "Your response has been successfully added to the task."
      });
      
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: `Failed to add comment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Handle task status change - uses direct XHR call to avoid fetch issues
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    
    // If marked as completed, set the completedAt date
    if (newStatus === ExtendedTaskStatus.COMPLETED) {
      updates.completedAt = new Date();
    }
    
    try {
      await xhrRequest({
        url: `/api/tasks/${taskId}`,
        method: 'PATCH',
        data: updates
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Status updated",
        description: "Task status has been successfully updated."
      });
      
      return true;
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: `Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  // Apply filters and sorting to the tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by user assignment - only System Admin, Data Manager, and Principal Investigator can see all tasks
    if (!isSystemAdmin && !isDataManager && !isPrincipalInvestigator && task.assignedTo !== currentUserRole) {
      return false;
    }
    
    // Text search filter
    const searchFields = `${task.taskId} ${task.title} ${task.description} ${task.studyName || ''}`;
    if (searchTerm && !searchFields.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Active tab filter
    if (activeTab === "myTasks" && task.assignedTo !== currentUserRole) {
      return false;
    } else if (activeTab === "created" && 
               typeof task.createdBy === 'string' && 
               !task.createdBy.includes(currentUserRole)) {
      return false;
    } else if (activeTab === "responded" && 
               (!task.responses || !task.responses?.some((r: any) => r.createdBy === currentUserRole))) {
      return false;
    }
    
    // Dropdown filters
    if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
    
    // Status filter with added logging for debugging
    if (statusFilter !== "all") {
      console.log(`Filtering task ${task.taskId} - Status filter: ${statusFilter}, Task status: ${task.status}`);
      
      // For debugging specific task IDs
      if (["TASK_8047556", "TASK_8833383", "TASK_144372"].includes(task.taskId)) {
        console.log(`TASK DEBUG - ID: ${task.taskId}, Status: "${task.status}", Type: ${typeof task.status}, Match: ${task.status === statusFilter}`);
      }
      
      // Normalize status value to lowercase for case-insensitive comparison
      const taskStatus = String(task.status).toLowerCase();
      const filterStatus = statusFilter.toLowerCase();
      
      // Special handling for not_started status to include multiple possible values
      if (filterStatus === "not_started") {
        if (taskStatus !== "not_started" && 
            taskStatus !== "created" && 
            taskStatus !== "not started" && 
            taskStatus !== "not-started") {
          return false;
        }
      } 
      // Special handling for other status values with potential variants
      else if (filterStatus === "in_progress") {
        if (taskStatus !== "in_progress" && taskStatus !== "in progress") {
          return false;
        }
      }
      else if (filterStatus === "under_review") {
        if (taskStatus !== "under_review" && taskStatus !== "under review") {
          return false;
        }
      }
      else if (filterStatus === "re_opened") {
        if (taskStatus !== "re_opened" && taskStatus !== "reopened" && taskStatus !== "re-opened") {
          return false;
        }
      }
      // Default comparison for other status values
      else if (taskStatus !== filterStatus) {
        return false;
      }
    }
    
    if (roleFilter !== "all" && task.assignedTo !== roleFilter) return false;
    if (studyFilter !== "all" && task.studyName !== studyFilter) return false;
    if (queryTypeFilter !== "all" && task.queryType !== queryTypeFilter) return false;
    
    return true;
  }).sort((a, b) => {
    // Sorting logic
    if (sortField === "dueDate") {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortField === "priority") {
      const priorityOrder = { 
        [TaskPriority.CRITICAL]: 0, 
        [TaskPriority.HIGH]: 1, 
        [TaskPriority.MEDIUM]: 2, 
        [TaskPriority.LOW]: 3 
      };
      // @ts-ignore
      const orderA = priorityOrder[a.priority] || 999;
      // @ts-ignore
      const orderB = priorityOrder[b.priority] || 999;
      return sortDirection === "asc" ? orderA - orderB : orderB - orderA;
    } else if (sortField === "createdAt") {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    
    // Default string comparison for other fields
    const valueA = (a as any)[sortField]?.toString().toLowerCase() || "";
    const valueB = (b as any)[sortField]?.toString().toLowerCase() || "";
    return sortDirection === "asc" 
      ? valueA.localeCompare(valueB) 
      : valueB.localeCompare(valueA);
  });
  
  // Handle clicking on a task row with additional error handling
  const handleTaskClick = async (task: any) => {
    try {
      console.log("Selected task ID:", task.id);
      
      // Explicitly fetch comments for this task from the API
      let comments = [];
      try {
        comments = await apiRequest(`/api/tasks/${task.id}/comments`);
        console.log("Fetched comments for task:", comments);
      } catch (commentsError) {
        console.error("Error fetching task comments:", commentsError);
        // Continue with empty comments rather than failing completely
      }
      
      // Create a simplified version of the task with only essential properties
      const simplifiedTask = {
        id: task.id,
        taskId: task.taskId || '',
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Not Started',
        assignedTo: task.assignedTo || '',
        assignedBy: task.assignedBy || '',
        dueDate: task.dueDate || null,
        createdAt: task.createdAt || null,
        trialId: task.trialId || null,
        studyName: task.studyName || null, // Include studyName field
        siteId: task.siteId || null,
        siteName: task.siteName || '',
        comments: comments,
        // Add domain data fields
        domain: task.domain || null,
        recordId: task.recordId || null,
        source: task.source || null,
        dataContext: task.dataContext || {}
      };
      
      console.log("Prepared task for dialog:", simplifiedTask);
      setSelectedTask(simplifiedTask);
      setIsTaskDetailOpen(true);
    } catch (error) {
      console.error("Error selecting task:", error);
      toast({
        title: "Error",
        description: "There was a problem displaying the task details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle sorting column click
  const handleSortClick = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Query & Task Workflow Management</h1>
            <p className="text-neutral-500 mt-1">Manage and track queries and tasks across clinical trials and stakeholders</p>
          </div>
          
          <div className="flex space-x-3">
            {/* Display the current user role */}
            <div className="flex items-center bg-primary-50 text-primary-700 px-3 py-2 rounded-md">
              <User className="mr-2 h-4 w-4" />
              <span className="text-sm font-medium">{currentUserRole}</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button 
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Query
            </Button>
          </div>
        </div>

        <div className="flex items-center mb-6">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Queries & Tasks</TabsTrigger>
                <TabsTrigger value="myTasks">Assigned to Me</TabsTrigger>
                <TabsTrigger value="created">Created by Me</TabsTrigger>
                <TabsTrigger value="responded">Responded</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        <Card>
          <CardHeader className="pb-0">
            <div className="flex flex-col lg:flex-row justify-between gap-4 pb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by ID, title, or description..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value={TaskPriority.CRITICAL}>Critical</SelectItem>
                    <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                    <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={statusFilter} 
                  onValueChange={(newValue) => {
                    console.log("Status filter changed to:", newValue);
                    setStatusFilter(newValue);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="re_opened">Reopened</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={studyFilter} onValueChange={setStudyFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Study" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Studies</SelectItem>
                    {studies.map((study) => (
                      <SelectItem key={study} value={study}>{study}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={queryTypeFilter} onValueChange={setQueryTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Query Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {queryTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={selectedTaskIds.length === filteredTasks.length && filteredTasks.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTaskIds(filteredTasks.map(task => task.id));
                          } else {
                            setSelectedTaskIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("taskId")}
                      >
                        Task ID
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("detectionId")}
                      >
                        Query ID
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("title")}
                      >
                        Title
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("priority")}
                      >
                        Priority
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("status")}
                      >
                        Status
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("createdAt")}
                      >
                        Created Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("dueDate")}
                      >
                        Due Date
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Due in</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead>Assigned by</TableHead>
                    <TableHead>Study</TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("domain")}
                      >
                        Domain
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("recordId")}
                      >
                        Record ID
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>
                      <div 
                        className="flex items-center cursor-pointer"
                        onClick={() => handleSortClick("source")}
                      >
                        Source
                        <ArrowUpDown className="ml-1 h-4 w-4" />
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center h-32">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <CheckSquare className="h-8 w-8 text-gray-300 mb-2" />
                          <p>No tasks or queries match your filters</p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSearchTerm("");
                              setPriorityFilter("all");
                              setStatusFilter("all");
                              setRoleFilter("all");
                              setStudyFilter("all");
                              setQueryTypeFilter("all");
                            }}
                            className="mt-2"
                          >
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Reset Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow 
                        key={task.id} 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleTaskClick(task)}
                      >
                        <TableCell className="w-[50px]" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedTaskIds.includes(task.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTaskIds([...selectedTaskIds, task.id]);
                              } else {
                                setSelectedTaskIds(selectedTaskIds.filter(id => id !== task.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{task.taskId}</TableCell>
                        <TableCell>
                          <button 
                            className="font-medium text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // For demo, just show the task details with focus on query
                              handleTaskClick(task);
                            }}
                          >
                            {task.detectionId || 'N/A'}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                        </TableCell>
                        <TableCell>
                          <PriorityBadge priority={task.priority} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <RoleAvatar role={task.assignedTo} />
                            <span className="ml-2 text-sm">{task.assignedTo}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.createdAt ? (
                            <div className="flex items-center">
                              <Clock className="mr-1 h-4 w-4 text-gray-500" />
                              {format(new Date(task.createdAt), 'MMM d, yyyy')}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center ${
                            task.status !== ExtendedTaskStatus.COMPLETED && 
                            task.status !== TaskStatus.CLOSED &&
                            task.dueDate && new Date(task.dueDate) < new Date() 
                              ? "text-red-600 font-medium" 
                              : ""
                          }`}>
                            <Clock className="mr-1 h-4 w-4" />
                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                          </div>
                        </TableCell>

                        <TableCell>
                          {task.status !== ExtendedTaskStatus.COMPLETED && 
                           task.status !== TaskStatus.CLOSED &&
                           task.dueDate && new Date(task.dueDate) > new Date() ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                            </Badge>
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {task.queryType === 'Data Quality' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">DataManager.AI</Badge>
                            ) : task.queryType === 'Central Monitoring' ? (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">CentralMonitor.AI</Badge>
                            ) : (
                              <Badge variant="outline">Manual</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {task.queryType === 'Data Quality' ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">DataManager.AI</Badge>
                          ) : task.queryType === 'Central Monitoring' ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">CentralMonitor.AI</Badge>
                          ) : (
                            <Badge variant="outline">{BusinessRoles.DATA_MANAGER}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100">{task.studyName}</Badge>
                        </TableCell>
                        <TableCell>
                          {task.domain ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">{task.domain}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.recordId ? (
                            <span className="font-medium text-blue-600">{task.recordId}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {task.source ? (
                            <Badge variant="outline" className="bg-gray-100">{task.source}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button size="sm" variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick(task);
                              }}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {task.status !== ExtendedTaskStatus.COMPLETED && task.status !== TaskStatus.CLOSED && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (task.assignedTo === currentUserRole) {
                                    if (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.NOT_STARTED) {
                                      handleStatusChange(task.id, TaskStatus.IN_PROGRESS);
                                    } else if (task.status === TaskStatus.IN_PROGRESS) {
                                      handleStatusChange(task.id, ExtendedTaskStatus.RESPONDED);
                                    }
                                  } else if (currentUserRole === BusinessRoles.DATA_MANAGER || 
                                           currentUserRole === BusinessRoles.MEDICAL_MONITOR) {
                                    if (task.status === ExtendedTaskStatus.RESPONDED) {
                                      handleStatusChange(task.id, ExtendedTaskStatus.COMPLETED);
                                    }
                                  }
                                }}
                              >
                                {task.assignedTo === currentUserRole ? (
                                  task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.NOT_STARTED ? (
                                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <MessageSquare className="h-4 w-4 text-green-600" />
                                  )
                                ) : (
                                  task.status === ExtendedTaskStatus.RESPONDED && 
                                  (currentUserRole === BusinessRoles.DATA_MANAGER || 
                                   currentUserRole === BusinessRoles.MEDICAL_MONITOR) ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <span className="opacity-0">•</span>
                                  )
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {selectedTaskIds.length > 0 && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setIsMultiResponseOpen(true)}
                  className="gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Add Response ({selectedTaskIds.length} selected)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <BarChart4 className="mr-2 h-5 w-5 text-blue-600" />
                Workflow Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Data Manager</span>
                  <span className="font-medium">
                    {tasks.filter(t => t.assignedTo === BusinessRoles.DATA_MANAGER).length} tasks
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full" 
                    style={{ 
                      width: `${tasks.filter(t => t.assignedTo === BusinessRoles.DATA_MANAGER).length / tasks.length * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>CRA</span>
                  <span className="font-medium">
                    {tasks.filter(t => t.assignedTo === BusinessRoles.CRA).length} tasks
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ 
                      width: `${tasks.filter(t => t.assignedTo === BusinessRoles.CRA).length / tasks.length * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Medical Monitor</span>
                  <span className="font-medium">
                    {tasks.filter(t => t.assignedTo === BusinessRoles.MEDICAL_MONITOR).length} tasks
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full" 
                    style={{ 
                      width: `${tasks.filter(t => t.assignedTo === BusinessRoles.MEDICAL_MONITOR).length / tasks.length * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Other Roles</span>
                  <span className="font-medium">
                    {tasks.filter(t => 
                      t.assignedTo !== BusinessRoles.DATA_MANAGER && 
                      t.assignedTo !== BusinessRoles.CRA && 
                      t.assignedTo !== BusinessRoles.MEDICAL_MONITOR
                    ).length} tasks
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ 
                      width: `${tasks.filter(t => 
                        t.assignedTo !== BusinessRoles.DATA_MANAGER && 
                        t.assignedTo !== BusinessRoles.CRA && 
                        t.assignedTo !== BusinessRoles.MEDICAL_MONITOR
                      ).length / tasks.length * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
                Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-md p-4 flex flex-col items-center">
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    {tasks.filter(t => t.status === ExtendedTaskStatus.RESPONDED).length}
                  </div>
                  <div className="text-sm text-gray-500">Awaiting Review</div>
                </div>
                
                <div className="border rounded-md p-4 flex flex-col items-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">
                    {tasks.filter(t => 
                      (t.status !== ExtendedTaskStatus.COMPLETED && t.status !== TaskStatus.CLOSED) &&
                      t.dueDate && new Date(t.dueDate) < new Date()
                    ).length}
                  </div>
                  <div className="text-sm text-gray-500">Overdue</div>
                </div>
                
                <div className="border rounded-md p-4 flex flex-col items-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {tasks.filter(t => t.status === TaskStatus.ASSIGNED || t.status === TaskStatus.NOT_STARTED).length}
                  </div>
                  <div className="text-sm text-gray-500">Not Started</div>
                </div>
                
                <div className="border rounded-md p-4 flex flex-col items-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {tasks.filter(t => t.status === ExtendedTaskStatus.COMPLETED || t.status === TaskStatus.CLOSED).length}
                  </div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium mb-3">Query Type Distribution</h3>
                <div className="space-y-3">
                  {queryTypes.map(type => {
                    const count = tasks.filter(t => t.queryType === type).length;
                    const percentage = (count / tasks.length) * 100;
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{type}</span>
                          <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {selectedTask && (
        <ErrorBoundary
          fallback={
            <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Error</DialogTitle>
                  <DialogDescription>
                    An error occurred while displaying task details. Please try again later.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsTaskDetailOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          }
        >
          <TaskDetailDialog 
            task={selectedTask}
            isOpen={isTaskDetailOpen}
            setIsOpen={setIsTaskDetailOpen}
            onStatusChange={handleStatusChange}
            onRespond={handleTaskResponse}
            currentUserRole={currentUserRole}
          />
        </ErrorBoundary>
      )}

      {/* Multi-task response dialog */}
      <Dialog open={isMultiResponseOpen} onOpenChange={setIsMultiResponseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Response to Multiple Tasks</DialogTitle>
            <DialogDescription>
              Add a response to {selectedTaskIds.length} selected tasks.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border p-3 rounded-md bg-gray-50">
              <div className="text-sm font-medium mb-2">Selected Tasks</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedTaskIds.map(id => {
                  const task = tasks.find(t => t.id === id);
                  return task ? (
                    <div key={id} className="flex items-center text-sm">
                      <span className="w-24 truncate">{task.taskId}</span>
                      <span className="truncate flex-1">{task.title}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Your Response</div>
              <Textarea
                placeholder="Enter your response..."
                className="w-full min-h-[100px]"
                value={multiResponseComment}
                onChange={(e) => setMultiResponseComment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMultiResponseOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Process multiple responses
                if (multiResponseComment.trim()) {
                  selectedTaskIds.forEach(id => {
                    handleTaskResponse(id, multiResponseComment);
                    
                    // For demo purposes, update the status of the tasks if they belong to current user
                    const task = tasks.find(t => t.id === id);
                    if (task && task.assignedTo === currentUserRole) {
                      if (task.status === TaskStatus.ASSIGNED || task.status === TaskStatus.NOT_STARTED) {
                        handleStatusChange(id, TaskStatus.IN_PROGRESS);
                      } else if (task.status === TaskStatus.IN_PROGRESS) {
                        handleStatusChange(id, ExtendedTaskStatus.RESPONDED);
                      }
                    }
                  });
                  
                  setMultiResponseComment("");
                  setSelectedTaskIds([]);
                  setIsMultiResponseOpen(false);
                  
                  toast({
                    title: "Bulk response submitted",
                    description: `Response added to ${selectedTaskIds.length} tasks.`,
                  });
                }
              }}
              disabled={!multiResponseComment.trim()}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}