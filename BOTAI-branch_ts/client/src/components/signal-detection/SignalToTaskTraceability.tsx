import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SignalToTaskTraceabilityProps {
  signalId?: number;
  expandedSignals?: string[];
  onToggleExpand?: (signalId: string) => void;
  selectedTrial?: number; // Added to filter signals by trial ID
}

type Signal = {
  id: number;
  detectionId: string;
  trialId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  detectionDate: string;
  createdAt: string;
  createdBy: string;
};

type Task = {
  id: number;
  taskId: string;
  detectionId: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedTo: string;
  trialId: number;
};

type Trial = {
  id: number;
  protocolId: string;
  title: string;
  indication: string;
};

export default function SignalToTaskTraceability({
  signalId,
  expandedSignals = [],
  onToggleExpand,
  selectedTrial = 0
}: SignalToTaskTraceabilityProps) {
  const [, setLocation] = useLocation();
  
  // Fetch all signals
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['/api/signaldetections'],
    queryFn: () => apiRequest('/api/signaldetections'),
    refetchOnWindowFocus: true
  });
  
  // Fetch all tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: () => apiRequest('/api/tasks')
  });
  
  // Get all trials data to display study information
  const { data: trials = [] } = useQuery({
    queryKey: ['/api/trials'],
    queryFn: () => apiRequest('/api/trials')
  });
  
  // Effect to refresh data when trial selection changes
  useEffect(() => {
    // No need to refresh if we're looking at a specific signal
    if (!signalId) {
      queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
    }
  }, [selectedTrial, signalId]);

  // Filter signals based on selected trial (if specified)
  const filteredSignals = signals.filter(signal => {
    // If viewing a specific signal, ignore the filter
    if (signalId) return true;
    // If selectedTrial is 0 (All Trials), show all signals
    if (selectedTrial === 0) return true;
    // Otherwise, filter by the selected trial
    return signal.trialId === selectedTrial;
  });
  
  // Map each signal to its corresponding tasks
  const signalTaskMap = new Map<number, Task[]>();
  
  if (allTasks.length > 0 && filteredSignals.length > 0) {
    filteredSignals.forEach(signal => {
      // Look for tasks with a detectionId field matching the signal's id
      const linkedTasks = allTasks.filter(task => task.detectionId === signal.id);
      signalTaskMap.set(signal.id, linkedTasks);
    });
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'initiated':
      case 'open':
        return "bg-blue-100 text-blue-800";
      case 'in_progress':
        return "bg-purple-100 text-purple-800";
      case 'resolved':
        return "bg-green-100 text-green-800";
      case 'closed':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Helper function to get trial name from trial ID
  const getTrialName = (trialId: number) => {
    const trial = trials.find((t: Trial) => t.id === trialId);
    return trial ? trial.protocolId : 'Unknown Study';
  };

  // Function to handle navigation to signal details with proper path and data refreshing
  const handleViewSignalDetails = (signalId: number) => {
    // Make sure to invalidate the signal details query to ensure fresh data when viewing
    queryClient.invalidateQueries({ queryKey: [`/api/signaldetections/${signalId}`] });
    setLocation(`/signaldetection/details/${signalId}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Signal to Task Traceability Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <h3 className="font-medium text-lg">No Signals Found</h3>
              <p className="text-gray-500 mt-1">
                {selectedTrial > 0 
                  ? "No signals exist for the selected study." 
                  : "No signals have been detected yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead className="w-5 px-2"></TableHead>
                    <TableHead className="font-semibold">Detection ID</TableHead>
                    <TableHead className="font-semibold">Study</TableHead>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSignals.map((signal) => [
                    /* Signal row */
                    <TableRow 
                      key={`signal-${signal.id}`}
                      className="border-b hover:bg-gray-50 cursor-pointer" 
                      onClick={() => onToggleExpand && onToggleExpand(signal.detectionId)}
                    >
                      <TableCell className="py-3">
                        {onToggleExpand && (
                          expandedSignals.includes(signal.detectionId) ? (
                            <ChevronDown className="h-5 w-5 text-blue-600" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-blue-600" />
                          )
                        )}
                      </TableCell>
                      <TableCell className="py-3 font-medium">
                        <span
                          className="text-blue-800 hover:text-blue-600 hover:underline font-semibold cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSignalDetails(signal.id);
                          }}
                        >
                          {signal.detectionId}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {getTrialName(signal.trialId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="font-medium">{signal.title}</p>
                          <p className="text-sm text-gray-500 truncate max-w-md">{signal.description}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        {formatDate(signal.detectionDate)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge className={cn(getStatusColor(signal.status))}>
                          {formatStatus(signal.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSignalDetails(signal.id);
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>,
                    
                    /* Expand to show linked tasks if expanded */
                    expandedSignals.includes(signal.detectionId) && (
                      signalTaskMap.get(signal.id)?.length ? (
                        // Display linked tasks
                        signalTaskMap.get(signal.id)?.map(task => (
                          <TableRow key={`task-${task.id}`} className="bg-gray-50">
                            <TableCell className="pl-10 py-2">
                              {/* Indentation for task row */}
                            </TableCell>
                            <TableCell className="py-2">
                              <span
                                className="text-blue-800 hover:text-blue-600 hover:underline font-medium cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setLocation(`/tasks?id=${task.id}`);
                                }}
                              >
                                {task.taskId}
                              </span>
                            </TableCell>
                            <TableCell className="py-2">
                              {/* Empty cell to align with the study column */}
                            </TableCell>
                            <TableCell className="py-2">
                              <p className="text-sm">{task.title}</p>
                            </TableCell>
                            <TableCell className="py-2 text-sm">
                              {formatDate(task.dueDate)}
                            </TableCell>
                            <TableCell className="py-2">
                              <Badge className={cn("text-xs", getStatusColor(task.status))}>
                                {formatStatus(task.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLocation(`/tasks?id=${task.id}`)}
                              >
                                View Task
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        // No tasks message
                        <TableRow key={`no-tasks-${signal.id}`} className="bg-gray-50">
                          <TableCell colSpan={7} className="text-center py-4">
                            <p className="text-gray-500 text-sm mb-2">No tasks are linked to this signal</p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setLocation(`/tasks/new?signalId=${signal.id}`)}
                            >
                              Create Task
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    )
                  ]).flat().filter(Boolean)}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}