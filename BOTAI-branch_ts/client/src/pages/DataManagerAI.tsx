import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DataManagerBot } from "@/components/ai-assistants/DataManagerBot";
import { WorkflowDependencyManager } from "@/components/ai-workflow/WorkflowDependencyManager";
import { WorkflowExecutionMode, Task, TaskStatus, ExtendedTaskStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import TaskDetails from "@/components/tasks/TaskDetails";
import { 
  AlertCircle,
  AlertCircle as AlertCircleIcon, 
  Check, 
  CheckCircle2, 
  Clock,
  ClipboardList,
  Cpu, 
  Download, 
  Eye,
  EyeOff,
  FileJson, 
  FileSpreadsheet, 
  Loader2, 
  Maximize2,
  Minimize2,
  RefreshCw, 
  Server,
  ChevronLeft, 
  ChevronRight, 
  Save,
  Settings, 
  Sparkles 
} from "lucide-react";

// Interface for agent status
interface AgentStatus {
  id: number;
  agentType: string;
  status: 'active' | 'inactive' | 'paused' | 'error';
  lastRunTime: string;
  recordsProcessed: number;
  issuesFound: number;
  trialId: number | null;
  protocolId: string | null;
  details?: any; // JSON field for storing additional details like task IDs
  createdAt: string;
  updatedAt: string;
}

// Interface for data quality issues
interface DataQualityIssue {
  id: string;
  type: 'missing_data' | 'inconsistent_data' | 'out_of_range' | 'format_error' | 'duplicate' | 'specification_violation';
  issueCategory: 'DQ' | 'Reconciliation'; // To distinguish between standalone DQ and cross-data reconciliation issues
  title: string;
  description: string;
  status: 'detected' | 'reviewing' | 'resolving' | 'resolved' | 'closed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  trialId: number;
  created: Date;
  lastUpdated: Date;
  affectedRecords?: number;
  dataSources: string[];
  domain: string; // SDTM domain
  specification?: string; // Reference to specification rule
}

export default function DataManagerAI() {
  const [activeTab, setActiveTab] = useState("issues");
  const [_, navigate] = useLocation();
  const [selectedTrial, setSelectedTrial] = useState(1);
  // Settings now use tab-based approach instead of dialog
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showBackendAgents, setShowBackendAgents] = useState(true);
  const [isAgentMode, setIsAgentMode] = useState(true); // Add state for Agent/Human mode toggle
  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  // Task details dialog state
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  // Task status filter
  const [statusFilter, setStatusFilter] = useState("all");
  const [analysisResults, setAnalysisResults] = useState<{
    dqIssues: number;
    reconciliationIssues: number;
    tasks: number;
    domains: number;
    records: number;
  }>({ dqIssues: 0, reconciliationIssues: 0, tasks: 0, domains: 0, records: 0 });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch trials data from the API
  const { data: trials } = useQuery({
    queryKey: ['/api/trials'],
    queryFn: async () => {
      const response = await fetch('/api/trials');
      if (!response.ok) throw new Error('Failed to fetch trials');
      return response.json();
    }
  });
  
  // Fetch agent status data
  const { 
    data: agentStatuses, 
    isLoading: isLoadingAgentStatuses, 
    error: agentStatusError,
    refetch: refetchAgentStatuses
  } = useQuery({
    queryKey: ['/api/agent-status', { trialId: selectedTrial }],
    queryFn: async () => {
      console.log(`Fetching agent statuses for trial ID: ${selectedTrial}...`);
      try {
        // First get the trial-specific agent statuses
        const trialResponse = await fetch(`/api/agent-status/trial/${selectedTrial}`);
        console.log(`Trial-specific agent status response:`, trialResponse);
        
        if (!trialResponse.ok) {
          console.error('Failed to fetch trial-specific agent statuses, status:', trialResponse.status);
          throw new Error(`Failed to fetch trial-specific agent statuses: ${trialResponse.status}`);
        }
        
        const trialData = await trialResponse.json();
        console.log(`Trial-specific agent statuses: ${trialData.length} agents`);
        
        // Now get the global agent statuses (trialId = null)
        const globalResponse = await fetch('/api/agent-status');
        console.log('Global agent status response:', globalResponse);
        
        if (!globalResponse.ok) {
          console.error('Failed to fetch global agent statuses, status:', globalResponse.status);
          throw new Error(`Failed to fetch global agent statuses: ${globalResponse.status}`);
        }
        
        const globalData = await globalResponse.json();
        // Filter to only include null trialId agents (global)
        const globalAgents = globalData.filter((agent: AgentStatus) => agent.trialId === null);
        console.log(`Global agent statuses: ${globalAgents.length} agents`);
        
        // Combine trial-specific and global agent statuses
        const combinedAgentStatuses = [...trialData, ...globalAgents];
        console.log(`Combined agent statuses: ${combinedAgentStatuses.length} agents`);
        
        
        // Verify each agent's data structure
        combinedAgentStatuses.forEach((agent: AgentStatus, index: number) => {
          console.log(`Agent ${index}:`, agent);
          console.log(`  - agentType: ${agent.agentType} (${typeof agent.agentType})`);
          console.log(`  - status: ${agent.status} (${typeof agent.status})`);
          console.log(`  - lastRunTime: ${agent.lastRunTime} (${typeof agent.lastRunTime})`);
          console.log(`  - trialId: ${agent.trialId}`);
        });
        
        return combinedAgentStatuses as AgentStatus[];
      } catch (error) {
        console.error('Error fetching agent statuses:', error);
        throw error;
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3 // Retry failed requests up to 3 times
  });
  
  // Function to manually refresh agent statuses
  const handleRefreshAgentStatus = () => {
    refetchAgentStatuses();
    console.log("Manual refresh, current agent statuses:", agentStatuses);
    toast({
      title: "Refreshing agent statuses",
      description: "Latest agent data is being loaded...",
    });
  };
  
  // Debug hook to log agent statuses whenever they change
  useEffect(() => {
    console.log("Agent statuses updated:", agentStatuses);
    console.log("showBackendAgents value:", showBackendAgents);
  }, [agentStatuses, showBackendAgents]);
  
  // Function to refresh a single agent status
  const refreshSingleAgent = async (agentType: string) => {
    try {
      await refetchAgentStatuses();
      toast({
        title: `${agentType} refreshed`,
        description: "Latest agent status has been loaded",
      });
    } catch (error) {
      console.error(`Failed to refresh ${agentType} status:`, error);
      toast({
        title: "Refresh failed",
        description: `Could not refresh ${agentType} status`,
        variant: "destructive"
      });
    }
  };
  
  // Settings state
  const [settings, setSettings] = useState({
    monitoring: {
      activeMonitoring: true,
      scheduledMonitoring: false,
      frequency: "daily",
      priority: "medium"
    },
    compliance: {
      protocolAdherence: true,
      auditTrailMonitoring: false,
      protocolDeviationDetection: true,
      regulatoryStandardAlerts: true
    },
    reconciliation: {
      subjectMatching: true,
      demographicsMatching: true,
      advEMedicalHistoryMatching: true,
      labValueMatching: true
    },
    dataQuality: {
      missingData: true,
      outOfRange: true,
      invalidFormats: true,
      dataConsistency: true,
      crossFormValidation: true
    }
  });
  
  // Helper function to format date time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  // Helper function to calculate time ago
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    
    if (diffMin < 1) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else {
      return formatDateTime(dateString);
    }
  };
  
  // Function to handle running the data quality checks
  const handleRunAnalysis = async () => {
    setIsRunning(true);
    toast({
      title: "DQ and Reconciliation Started",
      description: "Analyzing data across all domains...",
    });
    
    try {
      // First trigger LB domain analysis
      const analyzeResponse = await fetch('/api/domain-data/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trialId: selectedTrial,
          domain: 'LB',
          source: 'Central Laboratory'
        })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Failed to trigger domain data analysis');
      }
      
      const responseData = await analyzeResponse.json();
      console.log('Domain analysis triggered:', responseData);
      
      toast({
        title: "Analysis Triggered",
        description: `Successfully triggered analysis for LB domain`,
      });
      
      // Simulate waiting for results
      setTimeout(() => {
        setIsRunning(false);
        
        // More realistic but still demonstration results
        const simulatedResults = {
          dqIssues: Math.floor(Math.random() * 5) + 2,       // 2-6 DQ issues
          reconciliationIssues: Math.floor(Math.random() * 4) + 1, // 1-4 reconciliation issues
          tasks: Math.floor(Math.random() * 6) + 3,          // 3-8 tasks
          domains: Math.floor(Math.random() * 3) + 3,        // 3-5 domains
          records: Math.floor(Math.random() * 1000) + 500,   // 500-1500 records
        };
        
        setAnalysisResults(simulatedResults);
        
        // Open the results dialog
        // Invalidate tasks queries so the Tasks page will refresh with new tasks
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        queryClient.invalidateQueries({ queryKey: ['/api/signaldetections'] });
        
        setIsResultDialogOpen(true);
      }, 2000);
    } catch (error) {
      console.error('Error triggering domain analysis:', error);
      setIsRunning(false);
      toast({
        title: "Analysis Failed",
        description: "Failed to trigger domain data analysis",
        variant: "destructive"
      });
    }
  };



  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* Banner for active monitoring */}
        <div className="bg-blue-700 p-3 mb-4 rounded-md shadow-md text-center">
          <AlertCircleIcon className="h-5 w-5 inline-block mr-2 animate-pulse text-white" />
          <span className="text-white font-bold">Active monitoring on the data from Trial Data Management</span>
        </div>
        
        {/* Super Agent Card - The Quantum Analyst */}
        <div className="agent-card data-manager-agent mb-6">
          <div className="agent-icon-wrapper">
            <div className="hexagon-frame">
              <div className="glow-effect teal-glow"></div>
              <Cpu className="agent-icon teal-icon" />
              <div className="data-particles"></div>
            </div>
          </div>
          <div className="agent-details">
            <h3 className="agent-title">
              <span className="highlight teal">The Quantum Analyst</span>
            </h3>
            <div className="agent-subtitle">Data Manager.AI</div>
            <div className="agent-status">
              <span className="status-dot active"></span>
              <span>Optimizing data quality across all domains</span>
            </div>
          </div>
        </div>
        
        {/* Top control panel with study selection and action buttons */}
        <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-100 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/ai-agents")}
                  className="flex items-center gap-1 text-pink-600 hover:text-pink-700 border-pink-200 hover:bg-pink-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back to AI Agents Hub
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-blue-800">Data Manager.AI</h1>
              <p className="text-gray-600">AI-powered data quality management and reconciliation</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select defaultValue="1" onValueChange={(value) => setSelectedTrial(parseInt(value))}>
                <SelectTrigger className="w-[240px] bg-white">
                  <SelectValue placeholder="Select Trial" />
                </SelectTrigger>
                <SelectContent>
                  {trials?.map((trial: any) => (
                    <SelectItem key={trial.id} value={String(trial.id)}>
                      {trial.protocolId} - {trial.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Human-in-Loop toggle added to main page */}
              <div className="flex items-center p-2 bg-white border border-blue-100 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Task Assignment Mode:</span>
                  <span className="text-xs font-semibold text-blue-700">{isAgentMode ? 'Agent.AI' : 'Human-in-Loop'}</span>
                </div>
                <div
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ml-3 ${
                    isAgentMode ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setIsAgentMode(!isAgentMode)}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isAgentMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
              </div>

              <Button
                onClick={handleRunAnalysis}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 text-white" />
                    Run DQ and Reconciliation
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleRefreshAgentStatus}
                className="text-xs"
                disabled={isLoadingAgentStatuses}
              >
                {isLoadingAgentStatuses ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1 h-3 w-3" /> Refresh Agents
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={() => setShowBackendAgents(!showBackendAgents)}
                className="text-xs"
              >
                {showBackendAgents ? (
                  <>
                    <EyeOff className="mr-1 h-3 w-3" /> Hide Agents
                  </>
                ) : (
                  <>
                    <Eye className="mr-1 h-3 w-3" /> Show Agents
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Alert for new AI-based banner */}
          <Alert className="mt-4 bg-blue-50 border-blue-200">
            <Cpu className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800">Intelligent monitoring active</AlertTitle>
            <AlertDescription className="text-blue-700">
              <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                <li>AI agents actively monitor data refresh events to automatically trigger quality checks</li>
                <li>Cross-data reconciliation maps subjects across EDC, Labs, and external data sources</li>
                <li>Protocol compliance verification compares data to study specifications</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
        
        {/* Settings now use tab-based approach instead of dialog */}
        
        {/* Analysis Results Dialog */}
        <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl text-blue-800">
                DQ and Reconciliation Complete
              </DialogTitle>
              <DialogDescription>
                Here's a summary of the analysis on {trials?.find((t: any) => t.id === selectedTrial)?.protocolId || `Study #${selectedTrial}`}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{analysisResults.dqIssues}</div>
                    <div className="text-sm text-gray-600">DQ Issues</div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{analysisResults.reconciliationIssues}</div>
                    <div className="text-sm text-gray-600">Reconciliation Issues</div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{analysisResults.tasks}</div>
                    <div className="text-sm text-gray-600">Tasks Created</div>
                  </div>
                </Card>
                
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-blue-700 mb-1">{analysisResults.domains}</div>
                    <div className="text-sm text-gray-600">Domains Affected</div>
                  </div>
                </Card>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">Key Findings</h4>
                <ul className="text-sm space-y-2">
                  {analysisResults.dqIssues > 0 && (
                    <li className="flex items-start">
                      <AlertCircleIcon className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{analysisResults.dqIssues} data quality {analysisResults.dqIssues === 1 ? 'issue' : 'issues'} detected in {Math.min(analysisResults.domains, 2)} domain{Math.min(analysisResults.domains, 2) !== 1 ? 's' : ''}</span>
                    </li>
                  )}
                  {analysisResults.reconciliationIssues > 0 && (
                    <li className="flex items-start">
                      <AlertCircleIcon className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>{analysisResults.reconciliationIssues} cross-source reconciliation {analysisResults.reconciliationIssues === 1 ? 'discrepancy' : 'discrepancies'} identified</span>
                    </li>
                  )}
                  {analysisResults.tasks > 0 && (
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Created {analysisResults.tasks} {analysisResults.tasks === 1 ? 'task' : 'tasks'} for data managers and site monitors</span>
                    </li>
                  )}
                  <li className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Processed {analysisResults.records.toLocaleString()} records across {analysisResults.domains} domains</span>
                  </li>
                </ul>
              </div>
              
              {analysisResults.dqIssues + analysisResults.reconciliationIssues > 3 && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                    <AlertCircleIcon className="h-4 w-4 mr-2" />
                    Action Recommended
                  </h4>
                  <p className="text-sm text-amber-700">
                    Review and address the identified issues. Several require immediate action based on their priority level.
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={() => {
                  setIsResultDialogOpen(false);
                  setActiveTab("issues");
                }}
              >
                View Issues
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full screen agent dialog */}
        <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
          <DialogContent className="max-w-6xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>AI Agent System Monitor</DialogTitle>
              <DialogDescription>Real-time view of all active AI agents processing your clinical data</DialogDescription>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto p-1">
              {/* Full agent visualization content */}
            </div>
          </DialogContent>
        </Dialog>

        {/* Display agents only when showBackendAgents is true */}
        {showBackendAgents && (
          <div className="p-5 bg-gradient-to-b from-blue-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {isLoadingAgentStatuses ? (
                <div className="col-span-5 flex justify-center py-6">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-sm text-gray-500">Loading agent data...</p>
                  </div>
                </div>
              ) : agentStatusError ? (
                <div className="col-span-5 bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                  <AlertCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h4 className="text-red-800 font-medium">Failed to load agent status data</h4>
                  <p className="text-sm text-red-600 mt-1">Please try refreshing the page</p>
                </div>
              ) : (
                <>
                  {/* Data Fetch Agent */}
                  {agentStatuses?.find(a => a.agentType === 'DataFetch') && (
                    <div className="border border-blue-100 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-40 group-hover:opacity-60 transition-opacity duration-200"></div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                          <h4 className="font-medium text-blue-800">Data Fetch Agent</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                            {agentStatuses.find(a => a.agentType === 'DataFetch')?.status || 'Active'}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSingleAgent('DataFetch');
                            }}
                            className="h-4 w-4 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                            title="Refresh this agent"
                          >
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Listening for data refresh events from all integrated sources</p>
                      
                      {/* Records in progress indicator */}
                      <div className="mb-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Records in progress:</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            {Math.floor((agentStatuses.find(a => a.agentType === 'DataFetch')?.recordsProcessed || 0) * 0.3)}
                          </Badge>
                        </div>
                        <div className="w-full bg-blue-100 h-1 mt-1 rounded-full">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '30%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          <span>{timeAgo(agentStatuses.find(a => a.agentType === 'DataFetch')?.lastRunTime || '')}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                          {agentStatuses.find(a => a.agentType === 'DataFetch')?.recordsProcessed || 0} records
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Data Quality Agent */}
                  {agentStatuses?.find(a => a.agentType === 'DataQuality') && (
                    <div className="border border-blue-100 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-40 group-hover:opacity-60 transition-opacity duration-200"></div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                          <h4 className="font-medium text-blue-800">DQ Processing</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                            {agentStatuses.find(a => a.agentType === 'DataQuality')?.status || 'Active'}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSingleAgent('DataQuality');
                            }}
                            className="h-4 w-4 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                            title="Refresh this agent"
                          >
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Running data quality checks across all SDTM domains</p>
                      
                      {/* Records in progress indicator */}
                      <div className="mb-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Records in progress:</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            {Math.floor((agentStatuses.find(a => a.agentType === 'DataQuality')?.recordsProcessed || 0) * 0.45)}
                          </Badge>
                        </div>
                        <div className="w-full bg-blue-100 h-1 mt-1 rounded-full">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '45%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          <span>{timeAgo(agentStatuses.find(a => a.agentType === 'DataQuality')?.lastRunTime || '')}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                          {agentStatuses.find(a => a.agentType === 'DataQuality')?.issuesFound || 0} issues
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Data Reconciliation Agent */}
                  {agentStatuses?.find(a => a.agentType === 'DataReconciliation') && (
                    <div className="border border-blue-100 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-40 group-hover:opacity-60 transition-opacity duration-200"></div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                          <h4 className="font-medium text-blue-800">Reconciliation</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                            {agentStatuses.find(a => a.agentType === 'DataReconciliation')?.status || 'Active'}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSingleAgent('DataReconciliation');
                            }}
                            className="h-4 w-4 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                            title="Refresh this agent"
                          >
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Cross-checking data consistency between sources</p>
                      
                      {/* Records in progress indicator */}
                      <div className="mb-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Records in progress:</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            {Math.floor((agentStatuses.find(a => a.agentType === 'DataReconciliation')?.recordsProcessed || 0) * 0.6)}
                          </Badge>
                        </div>
                        <div className="w-full bg-blue-100 h-1 mt-1 rounded-full">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          <span>{timeAgo(agentStatuses.find(a => a.agentType === 'DataReconciliation')?.lastRunTime || '')}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                          {agentStatuses.find(a => a.agentType === 'DataReconciliation')?.issuesFound || 0} issues
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Signal Detection Agent */}
                  {agentStatuses?.find(a => a.agentType === 'SignalDetection') && (
                    <div className="border border-blue-100 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-40 group-hover:opacity-60 transition-opacity duration-200"></div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                          <h4 className="font-medium text-blue-800">Protocol Check</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                            {agentStatuses.find(a => a.agentType === 'SignalDetection')?.status || 'Active'}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSingleAgent('SignalDetection');
                            }}
                            className="h-4 w-4 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                            title="Refresh this agent"
                          >
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Verifying adherence to protocol procedures</p>
                      
                      {/* Records in progress indicator */}
                      <div className="mb-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Records in progress:</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            {Math.floor((agentStatuses.find(a => a.agentType === 'SignalDetection')?.recordsProcessed || 0) * 0.25)}
                          </Badge>
                        </div>
                        <div className="w-full bg-blue-100 h-1 mt-1 rounded-full">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '25%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          <span>{timeAgo(agentStatuses.find(a => a.agentType === 'SignalDetection')?.lastRunTime || '')}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                          Trial {selectedTrial}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Task Management Agent */}
                  {agentStatuses?.find(a => a.agentType === 'TaskManager') && (
                    <div className="border border-blue-100 rounded-lg bg-white p-3 shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100 to-transparent rounded-bl-full opacity-40 group-hover:opacity-60 transition-opacity duration-200"></div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                          <h4 className="font-medium text-blue-800">Task Manager</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                            {agentStatuses.find(a => a.agentType === 'TaskManager')?.status || 'Active'}
                          </Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshSingleAgent('TaskManager');
                            }}
                            className="h-4 w-4 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                            title="Refresh this agent"
                          >
                            <RefreshCw className="h-3 w-3 text-blue-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">Creating tasks based on detected issues</p>
                      
                      {/* Records in progress indicator */}
                      <div className="mb-2 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Tasks in progress:</span>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                            {Math.floor((agentStatuses.find(a => a.agentType === 'TaskManager')?.recordsProcessed || 0) * 0.15)}
                          </Badge>
                        </div>
                        <div className="w-full bg-blue-100 h-1 mt-1 rounded-full">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '15%' }}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          <span>{timeAgo(agentStatuses.find(a => a.agentType === 'TaskManager')?.lastRunTime || '')}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full">
                          {agentStatuses.find(a => a.agentType === 'TaskManager')?.recordsProcessed || 0} tasks
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Agent Activity Log */}
            <div className="mt-4 rounded-lg bg-gradient-to-r from-gray-900 to-blue-900 p-3 text-green-400 font-mono text-xs border border-gray-700 relative shadow-inner">
              <div className="absolute top-2 right-2 flex space-x-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <h4 className="text-white mb-2 text-sm flex items-center font-semibold">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Agent Activity Log
                <span className="text-xs text-gray-400 ml-2 font-normal">Real-time processing</span>
              </h4>
              <div className="space-y-1 max-h-28 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 py-1">
                {isLoadingAgentStatuses ? (
                  <p className="text-center text-gray-400">Loading agent activity logs...</p>
                ) : agentStatusError ? (
                  <p className="text-center text-red-400">Error loading agent logs</p>
                ) : (
                  <>
                    {/* Filter agents based on trialId to only show those related to the selected trial or global agents */}
                    {/* Sort by lastRunTime (ascending) so newest logs are at the bottom */}
                    {agentStatuses
                      ?.filter(agent => {
                        // For trial-specific logs, only show those matching the current selected trial
                        if (agent.trialId !== null) {
                          return agent.trialId === selectedTrial;
                        }
                        // For global logs (trial = null), only show in the first trial view (PRO001)
                        // This prevents global logs from appearing in multiple trial views
                        return selectedTrial === 1; // Global logs are only shown in the first trial
                      })
                      .sort((a, b) => new Date(a.lastRunTime).getTime() - new Date(b.lastRunTime).getTime())
                      .map((agent, index) => {
                        // Generate log messages based on agent type and agent's trial ID
                        let message = '';
                        
                        // Get trial display text using study name, protocol ID, or trial ID (in order of preference)
                        // Indicate it's global if trialId is null
                        const trialInfo = trials?.find(t => t.id === agent.trialId);
                        const studyName = trialInfo?.title || '';
                        
                        const trialText = studyName 
                          ? studyName
                          : agent.protocolId 
                            ? `${agent.protocolId}` 
                            : agent.trialId 
                              ? `trial ${agent.trialId}` 
                              : 'all trials';
                        
                        // Include protocol ID as additional context if we're using the study name
                        const trialName = studyName && agent.protocolId ? ` (${agent.protocolId})` : '';
                        const formattedTrialText = agent.trialId ? `${trialText}${trialName}` : trialText;
                        
                        switch (agent.agentType) {
                          case 'DataQuality':
                            message = `Analyzing data for ${formattedTrialText} (${agent.recordsProcessed} records), found ${agent.issuesFound} issues`;
                            break;
                          case 'DataFetch':
                            message = `Fetched ${agent.recordsProcessed} records from integrated sources for ${formattedTrialText}`;
                            break;
                          case 'DataReconciliation':
                            message = `Cross-checking data for ${formattedTrialText}, found ${agent.issuesFound} discrepancies`;
                            break;
                          case 'SignalDetection':
                            message = `Monitoring protocol adherence for ${formattedTrialText}`;
                            break;
                          case 'TaskManager':
                            // Attempt to extract task IDs from the agent details if available
                            const taskDetails = agent.details 
                              ? JSON.stringify(agent.details).includes('taskIds') 
                                ? `(IDs: ${JSON.parse(JSON.stringify(agent.details)).taskIds || 'unknown'})`
                                : ''
                              : '';
                            message = `Created ${agent.recordsProcessed} tasks for data managers ${agent.trialId ? `in ${formattedTrialText}` : 'across all trials'} ${taskDetails}`;
                            break;
                          default:
                            message = `Processing ${agent.recordsProcessed} records for ${formattedTrialText}`;
                        }
                        
                        // Format date and time from agent's lastRunTime
                        const date = new Date(agent.lastRunTime);
                        
                        // Format date (Apr 30, 2025)
                        const month = date.toLocaleString('en-US', { month: 'short' });
                        const day = date.getDate();
                        const year = date.getFullYear();
                        const dateString = `${month} ${day}, ${year}`;
                        
                        // Format time (HH:MM:SS)
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        const seconds = date.getSeconds().toString().padStart(2, '0');
                        const timeString = `${hours}:${minutes}:${seconds}`;
                        
                        // Combined date and time
                        const dateTimeString = `${dateString} ${timeString}`;
                        
                        // Calculate opacity based on recency (newer = more opaque)
                        const now = new Date();
                        const agentDate = new Date(agent.lastRunTime);
                        const timeDiff = now.getTime() - agentDate.getTime();
                        const minutesDiff = Math.floor(timeDiff / 60000);
                        const opacity = Math.max(0.7, 1 - (minutesDiff * 0.05));
                        
                        return (
                          <p key={agent.id} className={`opacity-${Math.round(opacity * 100)}`} style={{ opacity }}>
                            [<span className="text-blue-400">{dateTimeString}</span>] <span className="text-purple-400">{agent.agentType}Agent</span>: {message}
                          </p>
                        );
                      })}
                    
                    {/* Add a few generic entries to fill out the log */}
                    <p className="opacity-75">
                      [<span className="text-blue-400">{new Date().toLocaleString('en-US', { month: 'short' })} {new Date().getDate()}, {new Date().getFullYear()} {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}:{new Date().getSeconds().toString().padStart(2, '0')}</span>] <span className="text-purple-400">AgentMonitor</span>: All agents operating within normal parameters
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Main content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-6">
            <TabsTrigger value="issues">DQ and Reconciliation</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="monitoring">Event Monitoring</TabsTrigger>
            <TabsTrigger value="progress">Domain Progress</TabsTrigger>
            <TabsTrigger value="workflow">Agent Workflow</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* DQ and Reconciliation Tab */}
          <TabsContent value="issues" className="flex-1">
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Issue Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="missing_data">Missing Data</SelectItem>
                    <SelectItem value="inconsistent_data">Inconsistent Data</SelectItem>
                    <SelectItem value="out_of_range">Out of Range</SelectItem>
                    <SelectItem value="format_error">Format Error</SelectItem>
                    <SelectItem value="duplicate">Duplicate Records</SelectItem>
                    <SelectItem value="specification_violation">Specification Violation</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="DQ">DQ</SelectItem>
                    <SelectItem value="Reconciliation">Reconciliation</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="detected">Detected</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="resolving">Resolving</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" className="flex items-center">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger className="text-blue-600 hover:underline">DQ-001</DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Issue Details: DQ-001</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Title</h4>
                                <p>Missing dates in Demographics domain</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Type</h4>
                                <Badge className="bg-blue-100 text-blue-700">Missing Data</Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Category</h4>
                                <Badge className="bg-purple-100 text-purple-700">DQ</Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Status</h4>
                                <Badge>Detected</Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Severity</h4>
                                <Badge className="bg-red-100 text-red-700">High</Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Domain</h4>
                                <Badge className="bg-gray-100 text-gray-700">DM</Badge>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Created Date</h4>
                                <p>Apr 1, 2025</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold mb-1">Affected Records</h4>
                                <p>5 records</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Description</h4>
                              <p>5 subject records in the Demographics domain are missing date of birth information which is required by SDTM specifications. This affects the calculation of study-specific parameters such as age-based dosing and eligibility criteria.</p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Data Sources</h4>
                              <div className="flex space-x-2">
                                <Badge variant="outline">EDC</Badge>
                                <Badge variant="outline">CTMS</Badge>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Reference Data</h4>
                              <div className="p-3 bg-gray-50 rounded border text-xs font-mono overflow-x-auto">
                              USUBJID, DOMAIN, RFSTDTC, BRTHDTC, AGE, SEX<br/>
                              001-001, DM, 2024-12-12, , 45, M<br/>
                              001-002, DM, 2024-12-13, , 52, F<br/>
                              001-003, DM, 2024-12-13, , 38, M<br/>
                              001-004, DM, 2024-12-14, , 41, F<br/>
                              001-005, DM, 2024-12-14, , 47, M<br/>
                              </div>
                            </div>
                            
                            <div className="border rounded-md p-4 space-y-4">
                              <h4 className="text-sm font-semibold">Discussion Thread</h4>
                              
                              <div className="space-y-4">
                                <div className="bg-blue-50 p-3 rounded-md">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-sm">Data Manager.AI</span>
                                    <span className="text-xs text-gray-500">Apr 1, 2025 10:15</span>
                                  </div>
                                  <p className="text-sm">Issue detected: Missing birthdates in Demographics domain for 5 subjects. This violates SDTM specification which requires BRTHDTC to be populated.</p>
                                </div>
                                
                                <div className="bg-indigo-50 p-3 rounded-md">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-sm">Emily Chen (Lead DM)</span>
                                    <span className="text-xs text-gray-500">Apr 1, 2025 14:20</span>
                                  </div>
                                  <p className="text-sm">I've reviewed this issue. Sarah is checking with the site to determine if this is a data entry issue or a mapping problem. We'll update once we know more.</p>
                                </div>
                                
                                <div className="bg-green-50 p-3 rounded-md">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-sm">Sarah Johnson (Data Entry)</span>
                                    <span className="text-xs text-gray-500">Apr 2, 2025 09:45</span>
                                  </div>
                                  <p className="text-sm">I contacted Site 001 and confirmed the birthdates are available in the source documentation. This appears to be a mapping issue where the EDC data isn't being properly extracted to the SDTM dataset. Working with IT to fix the mapping template.</p>
                                </div>
                                
                                <div className="bg-purple-50 p-3 rounded-md">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-sm">Dr. Michelle Lee (Medical Monitor)</span>
                                    <span className="text-xs text-gray-500">Apr 2, 2025 11:30</span>
                                  </div>
                                  <p className="text-sm">Please prioritize resolving this as the missing DOB data affects several protocol-specified analyses. The age values seem to be available, but we need the actual birth dates for accurate calculations.</p>
                                </div>
                              </div>
                              
                              <div className="pt-2 border-t mt-4">
                                <h4 className="text-sm font-semibold mb-2">Add Comment</h4>
                                <div className="space-y-3">
                                  <Textarea placeholder="Type your response here..." className="min-h-[100px]" />
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" size="sm">Cancel</Button>
                                    <Button size="sm">Add Comment</Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold mb-1">Related Tasks</h4>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  <TableRow>
                                    <TableCell>
                                      <Dialog>
                                        <DialogTrigger className="text-blue-600 hover:underline">T-001</DialogTrigger>
                                        <DialogContent className="max-w-3xl">
                                          <DialogHeader>
                                            <DialogTitle>Task Details: T-001</DialogTitle>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <h4 className="text-sm font-semibold mb-1">Title</h4>
                                                <p>Update missing DOB information in EDC</p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-semibold mb-1">Status</h4>
                                                <Badge className="bg-amber-100 text-amber-700">Responded</Badge>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-semibold mb-1">Created Date</h4>
                                                <p>Apr 1, 2025</p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-semibold mb-1">Due Date</h4>
                                                <p>Apr 8, 2025</p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-semibold mb-1">Created By</h4>
                                                <p>Data Manager.AI</p>
                                              </div>
                                              <div>
                                                <h4 className="text-sm font-semibold mb-1">Assigned To</h4>
                                                <p>Sarah Johnson (Data Entry)</p>
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <h4 className="text-sm font-semibold mb-1">Description</h4>
                                              <p>Please update the missing birth date information in the EDC system for subjects 001-001 through 001-005. This data is required for SDTM compliance and proper age-based analysis.</p>
                                            </div>
                                            
                                            <div className="border rounded-md p-4 space-y-4">
                                              <h4 className="text-sm font-semibold">Discussion Thread</h4>
                                              
                                              <div className="space-y-4">
                                                <div className="bg-blue-50 p-3 rounded-md">
                                                  <div className="flex justify-between mb-1">
                                                    <span className="font-medium text-sm">Data Manager.AI</span>
                                                    <span className="text-xs text-gray-500">Apr 1, 2025 10:20</span>
                                                  </div>
                                                  <p className="text-sm">Task created: Please update missing birth dates for the affected subjects in the EDC system.</p>
                                                </div>
                                                
                                                <div className="bg-green-50 p-3 rounded-md">
                                                  <div className="flex justify-between mb-1">
                                                    <span className="font-medium text-sm">Sarah Johnson (Data Entry)</span>
                                                    <span className="text-xs text-gray-500">Apr 2, 2025 09:55</span>
                                                  </div>
                                                  <p className="text-sm">After investigating, I found that the birth dates are correctly entered in the EDC system but not properly mapped to the SDTM dataset. The issue is with the data transformation process, not with the source data entry.</p>
                                                </div>
                                                
                                                <div className="bg-amber-50 p-3 rounded-md">
                                                  <div className="flex justify-between mb-1">
                                                    <span className="font-medium text-sm">James Wilson (IT Support)</span>
                                                    <span className="text-xs text-gray-500">Apr 3, 2025 11:15</span>
                                                  </div>
                                                  <p className="text-sm">I've identified the mapping error in the ETL process. The date format in the EDC is different from what our SDTM converter expects. I'll update the mapping template today.</p>
                                                </div>
                                                
                                                <div className="bg-green-50 p-3 rounded-md">
                                                  <div className="flex justify-between mb-1">
                                                    <span className="font-medium text-sm">Sarah Johnson (Data Entry)</span>
                                                    <span className="text-xs text-gray-500">Apr 5, 2025 14:30</span>
                                                  </div>
                                                  <p className="text-sm">The mapping issue has been fixed. I've verified that all birth dates are now appearing correctly in the SDTM dataset. Please review and confirm.</p>
                                                </div>
                                              </div>
                                              
                                              <div className="pt-2 border-t mt-4">
                                                <h4 className="text-sm font-semibold mb-2">Add Comment</h4>
                                                <div className="space-y-3">
                                                  <Textarea placeholder="Type your response here..." className="min-h-[100px]" />
                                                  <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" size="sm">Cancel</Button>
                                                    <Button size="sm">Add Comment</Button>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          <DialogFooter className="mt-4">
                                            <Select defaultValue="responded">
                                              <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="Update Status" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="created">Created</SelectItem>
                                                <SelectItem value="assigned">Assigned</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="under_review">Under Review</SelectItem>
                                                <SelectItem value="responded">Responded</SelectItem>
                                                <SelectItem value="closed">Closed</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <Button>Update Task</Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>
                                    </TableCell>
                                    <TableCell>Update missing DOB information in EDC</TableCell>
                                    <TableCell><Badge className="bg-amber-100 text-amber-700">Responded</Badge></TableCell>
                                    <TableCell>Sarah Johnson (Data Entry)</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                  </TableRow>
                                  <TableRow>
                                    <TableCell>
                                      <span className="text-blue-600 hover:underline">T-002</span>
                                    </TableCell>
                                    <TableCell>Verify DOB against source documents</TableCell>
                                    <TableCell><Badge>Created</Badge></TableCell>
                                    <TableCell>John Smith (CRA)</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                          <DialogFooter>
                            <Select defaultValue="detected">
                              <SelectTrigger className="w-[180px] mr-2">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="detected">Detected</SelectItem>
                                <SelectItem value="reviewing">Reviewing</SelectItem>
                                <SelectItem value="resolving">Resolving</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button variant="outline">Close Issue</Button>
                            <Button>Create Task</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">Missing Data</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-700">DQ</Badge>
                    </TableCell>
                    <TableCell>Missing dates in Demographics domain</TableCell>
                    <TableCell>
                      <Badge>Detected</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-200">High</Badge>
                    </TableCell>
                    <TableCell>DM</TableCell>
                    <TableCell>Apr 1, 2025</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell className="font-medium">
                      <Dialog>
                        <DialogTrigger className="text-blue-600 hover:underline">DR-001</DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Issue Details: DR-001</DialogTitle>
                          </DialogHeader>
                          {/* Dialog content similar to above */}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Inconsistent Data</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-100 text-indigo-700">Reconciliation</Badge>
                    </TableCell>
                    <TableCell>Lab results inconsistent with EDC data</TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700">Reviewing</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">Medium</Badge>
                    </TableCell>
                    <TableCell>LB, VS</TableCell>
                    <TableCell>Mar 28, 2025</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">View</Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Tasks Tab */}
          <TabsContent value="tasks" className="flex-1">
            <div className="flex justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Select 
                  value={statusFilter} 
                  onValueChange={(newValue) => {
                    console.log("Status filter changed to:", newValue);
                    // Directly use the not_started string value from constants
                    // This value needs to exactly match what's used in tasks schema
                    setStatusFilter(newValue);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
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
              </div>
              
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              {/* Task table with scrollable container */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Study</TableHead>
                      <TableHead>Related Issue</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // Use React Query to fetch tasks, filtering by trial if selected
                      const { data: tasks, isLoading, error } = useQuery({
                        queryKey: ['/api/tasks', { trialId: selectedTrial }],
                        queryFn: () => {
                          const url = selectedTrial ? 
                            `/api/tasks?trialId=${selectedTrial}` : 
                            '/api/tasks';
                          console.log(`Fetching tasks from: ${url}`);
                          return apiRequest(url);
                        },
                      });
                      
                      // Debug logs
                      console.log("Status filter in effect:", statusFilter);
                      
                      // Log task structure for the first task to understand its format
                      if (tasks && tasks.length > 0) {
                        console.log("First task structure:", JSON.stringify(tasks[0], null, 2));
                        
                        // Log all unique status values from tasks
                        const uniqueStatuses = [...new Set(tasks.map(task => task.status))];
                        console.log("All unique task status values:", uniqueStatuses);
                        
                        // Log each task's ID and status for debugging
                        tasks.forEach(task => {
                          console.log(`Task ${task.id} (${task.taskId || 'No TaskID'}): status = "${task.status}"`);
                        });
                        
                        // Specifically look for the mentioned tasks
                        const specificTasks = tasks.filter(task => 
                          task.taskId === "TASK_8047556" || 
                          task.taskId === "TASK_8833383" ||
                          task.taskId === "TASK_144372");
                          
                        if (specificTasks.length > 0) {
                          console.log("LOOKING FOR SPECIFIC TASKS:");
                          specificTasks.forEach(task => {
                            console.log(`SPECIFIC TASK - ID: ${task.id}, TaskID: ${task.taskId}, Status: "${task.status}", Status Type: ${typeof task.status}`);
                          });
                        }
                        
                        // Count tasks by status
                        const statusCounts = uniqueStatuses.reduce((acc, status) => {
                          acc[status] = tasks.filter(task => task.status === status).length;
                          return acc;
                        }, {});
                        console.log("Task counts by status:", statusCounts);
                      }
                      
                      if (isLoading) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                              <div className="mt-2">Loading tasks...</div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      if (error) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-red-500">
                              <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                              <div>Error loading tasks. Please try again.</div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      if (!tasks || tasks.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                              <ClipboardList className="h-5 w-5 mx-auto mb-2" />
                              <div>No tasks found</div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      // Filter tasks based on statusFilter if it's not "all"
                      let filteredTasks = [...tasks];
                      
                      // Specifically check for the problematic task IDs
                      console.log("PROBLEMATIC TASKS DEBUG:");
                      const problematicTaskIds = ["TASK_8047556", "TASK_8833383", "TASK_144372"];
                      tasks.forEach(task => {
                        if (problematicTaskIds.includes(task.taskId)) {
                          console.log(`Task ID: ${task.taskId}, Status: "${task.status}", Not Started Match: ${task.status === "not_started"}, Created Match: ${task.status === "created"}, Type: ${typeof task.status}`);
                        }
                      });
                      
                      if (statusFilter !== "all") {
                        console.log("Filtering tasks by status:", statusFilter);
                        
                        // Filter tasks based on status with case-insensitive handling
                        filteredTasks = filteredTasks.filter(task => {
                          // Normalize status value to lowercase for case-insensitive comparison
                          const taskStatus = String(task.status).toLowerCase();
                          const filterStatus = statusFilter.toLowerCase();
                          
                          // Special handling for not_started status to include multiple possible values
                          if (filterStatus === "not_started") {
                            return taskStatus === "not_started" || 
                                  taskStatus === "created" || 
                                  taskStatus === "not started" || 
                                  taskStatus === "not-started";
                          } 
                          // Special handling for other status values with potential variants
                          else if (filterStatus === "in_progress") {
                            return taskStatus === "in_progress" || taskStatus === "in progress";
                          }
                          else if (filterStatus === "under_review") {
                            return taskStatus === "under_review" || taskStatus === "under review";
                          }
                          else if (filterStatus === "re_opened") {
                            return taskStatus === "re_opened" || taskStatus === "reopened" || taskStatus === "re-opened";
                          }
                          // Default comparison for other status values
                          else {
                            return taskStatus === filterStatus;
                          }
                        });
                        
                        console.log("Filtered tasks count:", filteredTasks.length);
                      }
                      
                      // Sort tasks by createdAt date, newest first
                      const sortedTasks = filteredTasks.sort((a, b) => {
                        if (!a.createdAt) return 1;
                        if (!b.createdAt) return -1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      });
                      
                      // If no tasks match the filter
                      if (sortedTasks.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                              <ClipboardList className="h-5 w-5 mx-auto mb-2" />
                              <div>No tasks match the selected status filter</div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                      
                      // Show filtered and sorted tasks in the scrollable container
                      return sortedTasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">
                            <span className="text-blue-600 hover:underline">
                              {task.taskId || `T-${task.id}`}
                            </span>
                          </TableCell>
                          <TableCell>{task.title}</TableCell>
                          <TableCell>
                            {(() => {
                              // Normalize status to lowercase for comparison
                              const normalizedStatus = String(task.status).toLowerCase();
                              
                              // Debugging info for problematic tasks
                              if (["task_8047556", "task_8833383", "task_144372"].includes(normalizedStatus)) {
                                console.log(`Status rendering for task ${task.taskId}: Original status="${task.status}", Normalized="${normalizedStatus}"`);
                              }
                              
                              // Map of status values to their display components
                              if (normalizedStatus === 'not_started' || normalizedStatus === 'created' || 
                                  normalizedStatus === 'not started' || normalizedStatus === 'not-started') {
                                return <Badge>Not Started</Badge>;
                              } else if (normalizedStatus === 'assigned') {
                                return <Badge className="bg-amber-100 text-amber-700">Assigned</Badge>;
                              } else if (normalizedStatus === 'in_progress' || normalizedStatus === 'in progress') {
                                return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>;
                              } else if (normalizedStatus === 'responded') {
                                return <Badge className="bg-purple-100 text-purple-700">Responded</Badge>;
                              } else if (normalizedStatus === 'under_review' || normalizedStatus === 'under review') {
                                return <Badge className="bg-indigo-100 text-indigo-700">Under Review</Badge>;
                              } else if (normalizedStatus === 're_opened' || normalizedStatus === 'reopened' || normalizedStatus === 're-opened') {
                                return <Badge className="bg-orange-100 text-orange-700">Reopened</Badge>;
                              } else if (normalizedStatus === 'completed' || normalizedStatus === 'closed') {
                                return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
                              } else {
                                // Format string with underscores by replacing them with spaces and capitalizing
                                const formattedStatus = String(task.status)
                                  .replace(/_/g, ' ')
                                  .replace(/\b\w/g, (char: string) => char.toUpperCase());
                                return <Badge>{formattedStatus}</Badge>;
                              }
                            })()}
                          </TableCell>
                          <TableCell>{task.assignedTo}</TableCell>
                          <TableCell>
                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : 'No due date'}
                          </TableCell>
                          <TableCell>
                            {task.createdAt ? format(new Date(task.createdAt), 'MMM d, yyyy') : 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-gray-100">
                              {task.studyName || `Trial ${task.trialId}`}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {task.detectionId ? (
                              <span className="text-blue-600 hover:underline">
                                {typeof task.detectionId === 'string' 
                                  ? task.detectionId 
                                  : `DET-${task.detectionId}`}
                              </span>
                            ) : (
                              'N/A'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                // Open task details in dialog instead of redirecting
                                setSelectedTaskId(task.id);
                                setIsTaskDetailOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
              
              {/* DB Lock Compliance Section */}
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-6">DB Lock Compliance Dashboard</h2>
                <Card className="border-blue-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium text-blue-800 flex items-center">
                      <Server className="h-5 w-5 mr-2 text-blue-600" />
                      DB Lock Compliance Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-white rounded-md p-4 border border-blue-100">
                        <div className="text-sm font-medium text-gray-500 mb-1">Status</div>
                        <div className="text-lg font-bold text-blue-700">IN PROGRESS</div>
                        <div className="mt-2 text-sm text-gray-500">Est. Lock Date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-white rounded-md p-4 border border-blue-100">
                        <div className="text-sm font-medium text-gray-500 mb-1">Overall Readiness</div>
                        <div className="text-lg font-bold text-blue-700">75%</div>
                        <Progress value={75} className="h-2 mt-2" />
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-white rounded-md p-4 border border-blue-100">
                        <div className="text-sm font-medium text-gray-500 mb-1">Outstanding Issues</div>
                        <div className="text-lg font-bold text-amber-600">8</div>
                        <div className="mt-2 text-sm text-gray-500">Across 3 sites</div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-white rounded-md p-4 border border-blue-100">
                        <div className="text-sm font-medium text-gray-500 mb-1">Site Readiness</div>
                        <div className="flex items-center justify-between mt-1 text-sm">
                          <span>Complete</span>
                          <span className="font-medium">0/3</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-sm">
                          <span>Ready</span>
                          <span className="font-medium">1/3</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-sm">
                          <span>In Progress</span>
                          <span className="font-medium">2/3</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Site-Level DB Lock Compliance */}
                    <div className="mt-5 border-t border-blue-100 pt-4">
                      <h4 className="font-medium text-blue-800 mb-3">Site-Level DB Lock Compliance</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Site</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Readiness</TableHead>
                            <TableHead>Outstanding Issues</TableHead>
                            <TableHead>Last Updated</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">Boston Medical Center</TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">IN PROGRESS</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="mr-2 w-8">78%</span>
                                <Progress value={78} className="h-2 flex-1" />
                              </div>
                            </TableCell>
                            <TableCell>4</TableCell>
                            <TableCell>{new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Chicago Research Hospital</TableCell>
                            <TableCell>
                              <Badge className="bg-green-100 text-green-800">READY</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="mr-2 w-8">92%</span>
                                <Progress value={92} className="h-2 flex-1" />
                              </div>
                            </TableCell>
                            <TableCell>0</TableCell>
                            <TableCell>{new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toLocaleDateString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Denver Health Institute</TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800">IN PROGRESS</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className="mr-2 w-8">67%</span>
                                <Progress value={67} className="h-2 flex-1" />
                              </div>
                            </TableCell>
                            <TableCell>8</TableCell>
                            <TableCell>{new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Other tab contents */}
          <TabsContent value="monitoring" className="flex-1">
            <div className="p-4 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Event Monitoring</h2>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Event Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="system">System Events</SelectItem>
                      <SelectItem value="user">User Actions</SelectItem>
                      <SelectItem value="data">Data Events</SelectItem>
                      <SelectItem value="ai">AI Activities</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Export Logs
                  </Button>
                </div>
              </div>
              
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Event Logs</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Input 
                        type="date" 
                        className="h-8 w-[140px] text-xs" 
                        defaultValue="2025-04-01"
                      />
                      <span className="text-xs">to</span>
                      <Input 
                        type="date" 
                        className="h-8 w-[140px] text-xs" 
                        defaultValue="2025-04-08"
                      />
                      <Button size="sm" variant="outline" className="h-8 text-xs">Apply</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-auto max-h-[600px]">
                    <Table>
                      <TableHeader className="bg-gray-50 sticky top-0">
                        <TableRow>
                          <TableHead className="w-[180px]">Timestamp</TableHead>
                          <TableHead className="w-[120px]">Event ID</TableHead>
                          <TableHead className="w-[120px]">Event Type</TableHead>
                          <TableHead className="w-[150px]">Source</TableHead>
                          <TableHead className="w-[150px]">User</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 14:32:15</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0042</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">AI</Badge>
                          </TableCell>
                          <TableCell>Data Manager.AI</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">DQ and Reconciliation analysis completed for PRO001 - Diabetes Type 2. 42 issues identified and tasks created.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 14:30:22</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0041</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">AI</Badge>
                          </TableCell>
                          <TableCell>Data Manager.AI</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">Starting DQ and Reconciliation analysis for PRO001 - Diabetes Type 2 on datasets: DM, VS, LB, AE, CM.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 14:15:08</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0040</TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">Data</Badge>
                          </TableCell>
                          <TableCell>Integration Service</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">New data loaded for PRO001 - Diabetes Type 2: 156 new records in Laboratory (LB) domain from Labcorp.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 13:58:44</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0039</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800">User</Badge>
                          </TableCell>
                          <TableCell>Web Client</TableCell>
                          <TableCell>John Smith</TableCell>
                          <TableCell className="max-w-md truncate">Response submitted for task TSK-2504-0018: "Missing lab values for subject PRO001-023 at Visit 3".</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 13:45:19</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0038</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">AI</Badge>
                          </TableCell>
                          <TableCell>Data Manager.AI</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">Reviewing task response for TSK-2504-0015: "Inconsistent vital signs for subject PRO001-015 between visits 2 and 3".</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 13:30:02</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0037</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">System</Badge>
                          </TableCell>
                          <TableCell>Integration Service</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">Failed connection attempt to IQVIA CTMS API endpoint. Retry scheduled in 15 minutes.</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">Failed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 12:45:23</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0036</TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">AI</Badge>
                          </TableCell>
                          <TableCell>Data Manager.AI</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">Compliance check completed for PRO001 - Diabetes Type 2. Protocol adherence rate: 92%, 3 potential protocol deviations identified.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 12:30:10</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0035</TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800">Data</Badge>
                          </TableCell>
                          <TableCell>Integration Service</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">New data loaded for PRO001 - Diabetes Type 2: 78 new records in Adverse Events (AE) domain from Medidata Rave.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 11:45:36</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0034</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Task</Badge>
                          </TableCell>
                          <TableCell>Task Manager</TableCell>
                          <TableCell>System</TableCell>
                          <TableCell className="max-w-md truncate">Task TSK-2504-0022 assigned to Jane Doe for addressing data quality issue DQ-2025-0018.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-08 11:30:15</TableCell>
                          <TableCell className="font-mono text-xs">EVT-2504-0033</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800">User</Badge>
                          </TableCell>
                          <TableCell>Web Client</TableCell>
                          <TableCell>Admin</TableCell>
                          <TableCell className="max-w-md truncate">User login: Administrator accessed the Data Manager.AI module.</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Completed</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 flex items-center justify-between border-t">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button variant="outline" size="sm">
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      Showing 1-10 of 243 events
                    </div>
                    <Select defaultValue="10">
                      <SelectTrigger className="w-[80px] h-8 text-xs">
                        <SelectValue placeholder="Page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="flex-1">
            <div className="p-4 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Domain Progress</h2>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="pro001">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro001">PRO001 - Diabetes Type 2</SelectItem>
                      <SelectItem value="pro002">PRO002 - Rheumatoid Arthritis</SelectItem>
                      <SelectItem value="pro003">PRO003 - Advanced Breast Cancer</SelectItem>
                      <SelectItem value="pro004">PRO004 - Alzheimer's Disease</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Export Progress
                  </Button>
                </div>
              </div>
              
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>SDTM Domain Progress</CardTitle>
                    <Badge className="bg-blue-100 text-blue-800">Overall: 76% Complete</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Demographics (DM)</span>
                          </div>
                          <div className="text-sm">98% (152/155 subjects)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '98%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Laboratory Tests (LB)</span>
                          </div>
                          <div className="text-sm">82% (6,425/7,834 records)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Vital Signs (VS)</span>
                          </div>
                          <div className="text-sm">90% (2,788/3,100 records)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Adverse Events (AE)</span>
                          </div>
                          <div className="text-sm">68% (542/798 records)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Concomitant Medications (CM)</span>
                          </div>
                          <div className="text-sm">72% (845/1,174 records)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Exposure (EX)</span>
                          </div>
                          <div className="text-sm">65% (302/465 records)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-600 mr-2"></div>
                            <span className="text-sm font-medium">Questionnaires (QS)</span>
                          </div>
                          <div className="text-sm">58% (1,254/2,156 records)</div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '58%' }}></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-sm font-semibold mb-2">Data Collection Timeline</h4>
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Study Start: Jan 15, 2025</span>
                        <span>Current Date: Apr 8, 2025</span>
                        <span>Estimated Completion: Dec 15, 2025</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <div className="text-xs text-center mt-1 text-gray-500">
                        Study progress: 25% (3 months / 12 months)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="workflow" className="flex-1">
            <Card className="border shadow-sm">
              <CardHeader>
                <CardTitle>Agent Workflow Management</CardTitle>
                <CardDescription>
                  Configure how data management AI agents work together. Set up dependencies between agents
                  and define execution order. Available agents include: Data Fetch, Data Quality, Data Reconciliation,
                  Domain Progress, and Report Generator.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkflowDependencyManager 
                  aiComponent="DataManagerAI"
                  allowedAgentTypes={[
                    'DataFetch',
                    'DataQuality', 
                    'DataReconciliation',
                    'DomainProgress',
                    'ReportGenerator'
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="flex-1">
            <div className="p-4 space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Settings Configuration</h2>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Settings saved",
                      description: "Your data quality and reconciliation settings have been updated.",
                    })
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Data Quality Settings</h3>
                  <div className="border p-4 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="missing-data" className="font-medium">Missing Data Detection</Label>
                        <Switch id="missing-data" checked={settings.dataQuality.missingData} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, dataQuality: {...settings.dataQuality, missingData: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Detect missing required fields and incomplete data entries</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="out-of-range" className="font-medium">Out of Range Values</Label>
                        <Switch id="out-of-range" checked={settings.dataQuality.outOfRange} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, dataQuality: {...settings.dataQuality, outOfRange: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Identify values outside expected ranges (numeric, dates)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="invalid-formats" className="font-medium">Invalid Format Detection</Label>
                        <Switch id="invalid-formats" checked={settings.dataQuality.invalidFormats} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, dataQuality: {...settings.dataQuality, invalidFormats: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Check for incorrectly formatted data (dates, IDs, codes)</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="data-consistency" className="font-medium">Data Consistency</Label>
                        <Switch id="data-consistency" checked={settings.dataQuality.dataConsistency} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, dataQuality: {...settings.dataQuality, dataConsistency: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Identify logically inconsistent data within a domain</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="cross-form" className="font-medium">Cross Form Validation</Label>
                        <Switch id="cross-form" checked={settings.dataQuality.crossFormValidation} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, dataQuality: {...settings.dataQuality, crossFormValidation: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Validate data consistency across related forms</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-4">Monitoring Settings</h3>
                  <div className="border p-4 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="active-monitoring" className="font-medium">Active Monitoring</Label>
                        <Switch 
                          id="active-monitoring" 
                          checked={settings.monitoring?.activeMonitoring || false}
                          onCheckedChange={(checked) => {
                            setSettings({
                              ...settings, 
                              monitoring: {
                                ...settings.monitoring,
                                activeMonitoring: checked,
                                // If active monitoring is enabled, disable scheduled monitoring
                                scheduledMonitoring: checked ? false : settings.monitoring?.scheduledMonitoring
                              }
                            });
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">Continuously monitor data changes in real-time</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="schedule-monitoring" className="font-medium">Scheduled Monitoring</Label>
                        <Switch 
                          id="schedule-monitoring" 
                          checked={settings.monitoring?.scheduledMonitoring || false}
                          disabled={settings.monitoring?.activeMonitoring || false}
                          onCheckedChange={(checked) => {
                            setSettings({
                              ...settings, 
                              monitoring: {
                                ...settings.monitoring,
                                scheduledMonitoring: checked,
                                // If scheduled monitoring is enabled, disable active monitoring
                                activeMonitoring: checked ? false : settings.monitoring?.activeMonitoring
                              }
                            });
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500">Run checks based on configured schedule</p>
                      {settings.monitoring?.activeMonitoring && 
                        <p className="text-xs text-amber-600">Disabled while Active Monitoring is enabled</p>
                      }
                    </div>
                    
                    <div className="pt-2">
                      <Label className="font-medium mb-2 block">Monitoring Schedule</Label>
                      <Select 
                        defaultValue="daily"
                        disabled={settings.monitoring?.activeMonitoring || false}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="pt-2">
                      <Label className="font-medium mb-2 block">Monitoring Priority</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Reconciliation Settings</h3>
                  <div className="border p-4 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="subject-matching" className="font-medium">Subject Matching</Label>
                        <Switch id="subject-matching" checked={settings.reconciliation.subjectMatching} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, reconciliation: {...settings.reconciliation, subjectMatching: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Verify subject IDs match across all data sources</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="demographics-matching" className="font-medium">Demographics Matching</Label>
                        <Switch id="demographics-matching" checked={settings.reconciliation.demographicsMatching} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, reconciliation: {...settings.reconciliation, demographicsMatching: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Compare demographic information across systems</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="ae-matching" className="font-medium">AE and Medical History Matching</Label>
                        <Switch id="ae-matching" checked={settings.reconciliation.advEMedicalHistoryMatching} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, reconciliation: {...settings.reconciliation, advEMedicalHistoryMatching: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Cross-check adverse events and medical history</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="lab-matching" className="font-medium">Lab Value Matching</Label>
                        <Switch id="lab-matching" checked={settings.reconciliation.labValueMatching} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, reconciliation: {...settings.reconciliation, labValueMatching: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Compare lab values from EDC with lab data sources</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-medium mt-6 mb-4">Compliance Settings</h3>
                  <div className="border p-4 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="protocol-adherence" className="font-medium">Protocol Adherence Checking</Label>
                        <Switch id="protocol-adherence" checked={settings.compliance.protocolAdherence} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, compliance: {...settings.compliance, protocolAdherence: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Verify data complies with protocol requirements</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="audit-trail" className="font-medium">Audit Trail Monitoring</Label>
                        <Switch id="audit-trail" checked={settings.compliance.auditTrailMonitoring} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, compliance: {...settings.compliance, auditTrailMonitoring: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Track and analyze data changes in audit logs</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="protocol-deviation" className="font-medium">Protocol Deviation Detection</Label>
                        <Switch id="protocol-deviation" checked={settings.compliance.protocolDeviationDetection} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, compliance: {...settings.compliance, protocolDeviationDetection: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Identify deviations from protocol procedures</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="regulatory-alerts" className="font-medium">Regulatory Standard Alerts</Label>
                        <Switch id="regulatory-alerts" checked={settings.compliance.regulatoryStandardAlerts} 
                          onCheckedChange={(checked) => 
                            setSettings({...settings, compliance: {...settings.compliance, regulatoryStandardAlerts: checked}})
                          } 
                        />
                      </div>
                      <p className="text-sm text-gray-500">Flag potential issues against regulatory standards</p>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mt-6 mb-4">Notification Settings</h3>
                  <div className="border p-4 rounded-lg space-y-4">
                    <div className="space-y-2">
                      <Label className="font-medium">Notification Types</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="email-notifications" defaultChecked />
                          <Label htmlFor="email-notifications">Email</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="in-app-notifications" defaultChecked />
                          <Label htmlFor="in-app-notifications">In-App</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="sms-notifications" />
                          <Label htmlFor="sms-notifications">SMS</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="slack-notifications" />
                          <Label htmlFor="slack-notifications">Slack</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="font-medium">Notification Frequency</Label>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="immediate-critical" defaultChecked />
                          <Label htmlFor="immediate-critical">Immediate for Critical</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="daily-summary" defaultChecked />
                          <Label htmlFor="daily-summary">Daily Summary</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="weekly-summary" />
                          <Label htmlFor="weekly-summary">Weekly Summary</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="flex-1">
            <div className="p-4 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Study Health Dashboard</h2>
                <div className="flex items-center space-x-2">
                  <Select defaultValue="pro001">
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select Study" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pro001">PRO001 - Diabetes Type 2</SelectItem>
                      <SelectItem value="pro002">PRO002 - Rheumatoid Arthritis</SelectItem>
                      <SelectItem value="pro003">PRO003 - Advanced Breast Cancer</SelectItem>
                      <SelectItem value="pro004">PRO004 - Alzheimer's Disease</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="flex items-center">
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </Button>
                </div>
              </div>

              {/* Overall Study Health Card */}
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Overall Study Health</CardTitle>
                    <Badge className="bg-green-100 text-green-800 text-sm">85% Healthy</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="border rounded-md p-3 text-center bg-gradient-to-b from-blue-50 to-white">
                      <div className="text-xl font-bold text-blue-700">85%</div>
                      <div className="text-sm text-gray-600">Data Quality</div>
                    </div>
                    <div className="border rounded-md p-3 text-center bg-gradient-to-b from-blue-50 to-white">
                      <div className="text-xl font-bold text-blue-700">92%</div>
                      <div className="text-sm text-gray-600">Compliance</div>
                    </div>
                    <div className="border rounded-md p-3 text-center bg-gradient-to-b from-blue-50 to-white">
                      <div className="text-xl font-bold text-blue-700">78%</div>
                      <div className="text-sm text-gray-600">Protocol Adherence</div>
                    </div>
                    <div className="border rounded-md p-3 text-center bg-gradient-to-b from-blue-50 to-white">
                      <div className="text-xl font-bold text-blue-700">88%</div>
                      <div className="text-sm text-gray-600">Vendor Performance</div>
                    </div>
                    <div className="border rounded-md p-3 text-center bg-gradient-to-b from-blue-50 to-white">
                      <div className="text-xl font-bold text-blue-700">90%</div>
                      <div className="text-sm text-gray-600">DB Compliance</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Quality and Reconciliation Issues Card */}
                <Card className="shadow-md border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                    <CardTitle>DQ & Reconciliation Issues</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Issue Status Distribution</div>
                        <Badge variant="outline" className="text-xs">Updated 2 hours ago</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                              Open Issues
                            </span>
                            <span>42</span>
                          </div>
                          <Progress value={42} max={100} className="h-2" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span>
                              In Review
                            </span>
                            <span>28</span>
                          </div>
                          <Progress value={28} max={100} className="h-2 bg-gray-100" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                              In Progress
                            </span>
                            <span>15</span>
                          </div>
                          <Progress value={15} max={100} className="h-2 bg-gray-100" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                              Resolved
                            </span>
                            <span>68</span>
                          </div>
                          <Progress value={68} max={100} className="h-2 bg-gray-100" />
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm font-medium mb-3">Issue Type Breakdown</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                            <div className="text-sm flex-1">Data Quality</div>
                            <div className="text-sm font-medium">65%</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                            <div className="text-sm flex-1">Reconciliation</div>
                            <div className="text-sm font-medium">35%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm font-medium mb-2">AI Detection Metrics</div>
                        <div className="flex justify-between text-sm">
                          <span>Issues Identified by AI</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Issues Identified Manually</span>
                          <span className="font-medium">13%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Vendor Response Performance Card */}
                <Card className="shadow-md border-blue-100">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                    <CardTitle>Vendor Response Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium">Response Time by Vendor</div>
                        <Badge variant="outline" className="text-xs">Last 30 days</Badge>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">IQVIA (CRO)</span>
                            <Badge className="bg-green-100 text-green-800">On time</Badge>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-gray-500">
                            <span>Average: 1.2 days</span>
                            <span>SLA: 2 days</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Labcorp (Lab)</span>
                            <Badge className="bg-yellow-100 text-yellow-800">Slightly delayed</Badge>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: '78%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-gray-500">
                            <span>Average: 2.4 days</span>
                            <span>SLA: 2 days</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Medidata (EDC)</span>
                            <Badge className="bg-green-100 text-green-800">On time</Badge>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '95%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-gray-500">
                            <span>Average: 0.8 days</span>
                            <span>SLA: 1 day</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm">Calyx (Imaging)</span>
                            <Badge className="bg-red-100 text-red-800">Delayed</Badge>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-gray-500">
                            <span>Average: 3.6 days</span>
                            <span>SLA: 2 days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Issues Tracking and SLA Compliance */}
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle>Issues Tracking & SLA Compliance</CardTitle>
                    <Select defaultValue="all">
                      <SelectTrigger className="w-[150px] h-8 text-xs">
                        <SelectValue placeholder="Filter by Domain" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Domains</SelectItem>
                        <SelectItem value="dm">Demographics (DM)</SelectItem>
                        <SelectItem value="ae">Adverse Events (AE)</SelectItem>
                        <SelectItem value="lb">Laboratory (LB)</SelectItem>
                        <SelectItem value="vs">Vital Signs (VS)</SelectItem>
                        <SelectItem value="cm">Concomitant Meds (CM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                        <div className="text-2xl font-bold text-gray-800">153</div>
                        <div className="text-sm text-gray-600">Total Issues</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                        <div className="text-2xl font-bold text-amber-600">85</div>
                        <div className="text-sm text-gray-600">Open Issues</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                        <div className="text-2xl font-bold text-red-600">23</div>
                        <div className="text-sm text-gray-600">Overdue Issues</div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm text-center">
                        <div className="text-2xl font-bold text-green-600">68</div>
                        <div className="text-sm text-gray-600">Resolved Issues</div>
                      </div>
                    </div>
                    
                    <div className="overflow-hidden border rounded-lg shadow-sm">
                      <Table>
                        <TableHeader className="bg-gray-50">
                          <TableRow>
                            <TableHead className="w-[150px]">Issue ID</TableHead>
                            <TableHead>Data Domain</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>SLA Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium"><span className="text-blue-600 cursor-pointer hover:underline">DQ-2023-0042</span></TableCell>
                            <TableCell>LB</TableCell>
                            <TableCell>Data Quality</TableCell>
                            <TableCell><Badge className="bg-red-100 text-red-800">Critical</Badge></TableCell>
                            <TableCell><Badge className="bg-amber-100 text-amber-800">In Review</Badge></TableCell>
                            <TableCell>Apr 10, 2025</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800">On Track</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium"><span className="text-blue-600 cursor-pointer hover:underline">RC-2023-0038</span></TableCell>
                            <TableCell>VS</TableCell>
                            <TableCell>Reconciliation</TableCell>
                            <TableCell><Badge className="bg-yellow-100 text-yellow-800">High</Badge></TableCell>
                            <TableCell><Badge className="bg-blue-100 text-blue-800">In Progress</Badge></TableCell>
                            <TableCell>Apr 12, 2025</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800">On Track</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium"><span className="text-blue-600 cursor-pointer hover:underline">DQ-2023-0036</span></TableCell>
                            <TableCell>DM</TableCell>
                            <TableCell>Data Quality</TableCell>
                            <TableCell><Badge className="bg-blue-100 text-blue-800">Medium</Badge></TableCell>
                            <TableCell><Badge className="bg-red-100 text-red-800">Open</Badge></TableCell>
                            <TableCell>Apr 5, 2025</TableCell>
                            <TableCell><Badge className="bg-red-100 text-red-800">Overdue</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium"><span className="text-blue-600 cursor-pointer hover:underline">RC-2023-0032</span></TableCell>
                            <TableCell>AE</TableCell>
                            <TableCell>Reconciliation</TableCell>
                            <TableCell><Badge className="bg-red-100 text-red-800">Critical</Badge></TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800">Resolved</Badge></TableCell>
                            <TableCell>Apr 2, 2025</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800">Completed</Badge></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium"><span className="text-blue-600 cursor-pointer hover:underline">DQ-2023-0028</span></TableCell>
                            <TableCell>CM</TableCell>
                            <TableCell>Data Quality</TableCell>
                            <TableCell><Badge className="bg-gray-100 text-gray-800">Low</Badge></TableCell>
                            <TableCell><Badge className="bg-amber-100 text-amber-800">In Review</Badge></TableCell>
                            <TableCell>Apr 15, 2025</TableCell>
                            <TableCell><Badge className="bg-green-100 text-green-800">On Track</Badge></TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="flex justify-between">
                      <Button variant="outline" size="sm" className="text-xs">
                        <ChevronLeft className="mr-1 h-3 w-3" />
                        Previous
                      </Button>
                      
                      <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">1-5</span> of <span className="font-medium">153</span> issues
                      </div>
                      
                      <Button variant="outline" size="sm" className="text-xs">
                        Next
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Database Compliance Card */}
              <Card className="shadow-md border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b pb-2">
                  <CardTitle>Database Compliance</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border rounded-md p-4 bg-gradient-to-b from-blue-50 to-white">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">SDTM Compliance</div>
                          <Badge className="bg-green-100 text-green-800">92%</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>Standards Version:</span>
                            <span className="font-medium">SDTM v2.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Validation:</span>
                            <span className="font-medium">Apr 1, 2025</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-gradient-to-b from-blue-50 to-white">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Missing Data</div>
                          <Badge className="bg-yellow-100 text-yellow-800">6.5%</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 rounded-full" style={{ width: '6.5%' }}></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>Required Fields Missing:</span>
                            <span className="font-medium">42</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Expected Data Points:</span>
                            <span className="font-medium">12,568</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-gradient-to-b from-blue-50 to-white">
                        <div className="flex justify-between items-center mb-2">
                          <div className="text-sm font-medium">Data Consistency</div>
                          <Badge className="bg-green-100 text-green-800">94%</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }}></div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          <div className="flex justify-between">
                            <span>Cross-Domain Consistency:</span>
                            <span className="font-medium">97%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Internal Consistency:</span>
                            <span className="font-medium">91%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-3">Recent Data Validation Issues</div>
                      <div className="overflow-hidden border rounded-lg shadow-sm">
                        <Table>
                          <TableHeader className="bg-gray-50">
                            <TableRow>
                              <TableHead>Issue Type</TableHead>
                              <TableHead>Domain</TableHead>
                              <TableHead>Affected Records</TableHead>
                              <TableHead>Severity</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>Invalid Format</TableCell>
                              <TableCell>LB</TableCell>
                              <TableCell>18</TableCell>
                              <TableCell><Badge className="bg-yellow-100 text-yellow-800">Medium</Badge></TableCell>
                              <TableCell><Badge className="bg-blue-100 text-blue-800">In Progress</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Out of Range</TableCell>
                              <TableCell>VS</TableCell>
                              <TableCell>7</TableCell>
                              <TableCell><Badge className="bg-red-100 text-red-800">High</Badge></TableCell>
                              <TableCell><Badge className="bg-green-100 text-green-800">Resolved</Badge></TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Missing Required Variable</TableCell>
                              <TableCell>DM</TableCell>
                              <TableCell>12</TableCell>
                              <TableCell><Badge className="bg-red-100 text-red-800">Critical</Badge></TableCell>
                              <TableCell><Badge className="bg-amber-100 text-amber-800">Under Review</Badge></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Data Manager Bot */}
      <DataManagerBot 
        trialName={trials?.find((t: any) => t.id === selectedTrial)?.title}
        trialId={selectedTrial}
        isAgentMode={isAgentMode}
        setIsAgentMode={setIsAgentMode}
      />
      
      {/* Task Details Dialog */}
      <TaskDetails 
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        taskId={selectedTaskId}
      />
    </AppLayout>
  );
}