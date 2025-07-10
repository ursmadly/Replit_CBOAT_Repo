import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, AlertCircle, Clock, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SignalDetails() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTrialId, setSelectedTrialId] = useState<number>(1);
  
  // Extract signal ID from URL
  const signalId = location.includes('/signaldetection/details/') 
    ? parseInt(location.split('/signaldetection/details/')[1], 10) 
    : null;
  
  // Handle navigation back to signal detection page
  const navigateBackToSignals = () => {
    // First invalidate the signal detections query to ensure fresh data on return
    queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
    // Then navigate back to the signal detection page with the correct path
    setLocation('/signal-detection');
  };
  
  // Check if we have a valid signal ID
  if (!signalId) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={navigateBackToSignals}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Signals
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold">Signal Not Found</h2>
              <p className="text-gray-500 mt-2">The requested signal could not be found.</p>
              <Button 
                className="mt-6" 
                onClick={navigateBackToSignals}
              >
                Return to Signal Detection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get trial data for the trial selector
  const { data: trials = [] } = useQuery({
    queryKey: ['/api/trials'],
    queryFn: () => apiRequest('/api/trials')
  });
  
  // Get signal details
  const { 
    data: signal, 
    isLoading: isLoadingSignal, 
    error: signalError 
  } = useQuery({
    queryKey: [`/api/signaldetections/${signalId}`],
    queryFn: () => apiRequest(`/api/signaldetections/${signalId}`)
  });
  
  // Get related tasks
  const { 
    data: tasks = [], 
    isLoading: isLoadingTasks 
  } = useQuery({
    queryKey: [`/api/trials/${selectedTrialId}/tasks`],
    queryFn: () => apiRequest(`/api/trials/${selectedTrialId}/tasks`),
    enabled: !!selectedTrialId,
  });

  // Filter tasks related to this signal
  const relatedTasks = tasks.filter((task: any) => 
    task.detectionId === signal?.id || 
    task.description?.includes(signal?.detectionId)
  );
  
  // Function to handle changing the trial
  const handleTrialChange = (trialId: string) => {
    setSelectedTrialId(parseInt(trialId, 10));
  };
  
  // Get priority badge color
  const getPriorityBadge = (priority: string) => {
    const priorityClass = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    
    const priorityKey = priority.toLowerCase() as keyof typeof priorityClass;
    const className = priorityClass[priorityKey] || "bg-gray-100 text-gray-800";
    
    return <Badge className={className}>{priority}</Badge>;
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    const statusClass = {
      open: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
      initiated: "bg-blue-100 text-blue-800"
    };
    
    const formattedStatus = status.toLowerCase().replace(/\s+/g, "_");
    const statusKey = formattedStatus as keyof typeof statusClass;
    const className = statusClass[statusKey] || "bg-gray-100 text-gray-800";
    
    return <Badge className={className}>{status}</Badge>;
  };
  
  // Set the selected trial ID once the signal data is loaded
  useEffect(() => {
    if (signal?.trialId) {
      setSelectedTrialId(signal.trialId);
    }
  }, [signal]);
  
  if (isLoadingSignal) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (signalError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={navigateBackToSignals}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Signals
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold">Error Loading Signal</h2>
              <p className="text-gray-500 mt-2">There was an error loading the signal details.</p>
              <Button 
                className="mt-6" 
                onClick={navigateBackToSignals}
              >
                Return to Signal Detection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={navigateBackToSignals}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Signals
          </Button>
          
          <div className="font-semibold text-lg">{signal.title}</div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select 
            value={selectedTrialId.toString()} 
            onValueChange={handleTrialChange}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a trial" />
            </SelectTrigger>
            <SelectContent>
              {trials.map((trial: any) => (
                <SelectItem key={trial.id} value={trial.id.toString()}>
                  {trial.protocolId} - {trial.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setLocation(`/studymanagement/${selectedTrialId}`)}
          >
            Go to Study
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Signal Details</span>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(signal.status)}
                  {getPriorityBadge(signal.priority)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs text-gray-500">Detection ID</Label>
                  <div className="font-medium">{signal.detectionId}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Detection Date</Label>
                  <div className="font-medium">
                    {new Date(signal.detectionDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Signal Type</Label>
                  <div className="font-medium">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {signal.signalType || "Site Risk"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Detection Type</Label>
                  <div className="font-medium">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {signal.detectionType || "Manual"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Created By</Label>
                  <div className="font-medium">{signal.createdBy}</div>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Data Reference</Label>
                  <div className="font-medium">{signal.dataReference || "N/A"}</div>
                </div>
              </div>
              
              <div className="mt-6">
                <Label className="text-xs text-gray-500 mb-2 block">Observation</Label>
                <div className="border rounded-md p-3 bg-gray-50">
                  {signal.observation}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Associated Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : relatedTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p>No tasks have been created for this signal yet.</p>
                  <Button 
                    className="mt-4" 
                    size="sm"
                    onClick={() => setLocation(`/tasks/new?signalId=${signalId}`)}
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Create Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {relatedTasks.map((task: any) => (
                    <div 
                      key={task.id} 
                      className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setLocation(`/tasks/details/${task.id}`)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                        <div className="flex items-center mb-2 sm:mb-0">
                          <span className="font-medium mr-2">{task.taskId}</span>
                          {getPriorityBadge(task.priority)}
                        </div>
                        <div>{getStatusBadge(task.status)}</div>
                      </div>
                      <div className="font-medium mb-1">{task.title}</div>
                      <div className="text-sm text-gray-600 truncate">{task.description}</div>
                      <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}</span>
                        </div>
                        <div>
                          Assigned to: {task.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setLocation(`/tasks/new?signalId=${signalId}`)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Task
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    // Copy to clipboard
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Link Copied",
                      description: "Signal details link copied to clipboard"
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  Copy Link
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Signal Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex flex-col items-center mr-4">
                    <div className="rounded-full w-9 h-9 bg-blue-100 flex items-center justify-center">
                      <span className="material-icons text-blue-800 text-sm">add_alert</span>
                    </div>
                    <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Signal Created</div>
                    <div className="text-xs text-gray-500">
                      {new Date(signal.createdAt).toLocaleString()}
                    </div>
                    <div className="text-sm mt-1">
                      Created by {signal.createdBy}
                    </div>
                  </div>
                </div>
                
                {signal.status !== 'initiated' && (
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full w-9 h-9 bg-purple-100 flex items-center justify-center">
                        <span className="material-icons text-purple-800 text-sm">assignment</span>
                      </div>
                      <div className="h-full w-0.5 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Status Updated</div>
                      <div className="text-xs text-gray-500">
                        {new Date(signal.updatedAt).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">
                        Status changed to {signal.status}
                      </div>
                    </div>
                  </div>
                )}
                
                {relatedTasks.length > 0 && (
                  <div className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="rounded-full w-9 h-9 bg-green-100 flex items-center justify-center">
                        <span className="material-icons text-green-800 text-sm">task_alt</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Tasks Created</div>
                      <div className="text-xs text-gray-500">
                        {new Date(relatedTasks[0].createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">
                        {relatedTasks.length} tasks created
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}