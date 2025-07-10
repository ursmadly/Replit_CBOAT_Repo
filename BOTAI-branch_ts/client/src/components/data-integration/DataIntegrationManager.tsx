import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, ServerCog, History, Sliders, Mail, AlertTriangle, 
  PlayCircle, PauseCircle, RefreshCw, FileText, MoreHorizontal,
  CheckCircle, Database, Activity, FileSpreadsheet, Brain, Bot, 
  Stethoscope, Calendar, Download, Settings, Cable, Workflow, Key,
  Map, LineChart, GitCompare, ArrowUpDown, CircleAlert, Computer,
  Shield, BarChart, Landmark, FileJson, CloudUpload, Hammer, Code,
  TestTube, Trash2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

// Import additional components
import DataMappingEditor from "./DataMappingEditor";
// Updated imports with newer versions that don't require domain property
import CredentialsManager from "./CredentialsManager";
import IntegrationTester from "./IntegrationTester";

// Type definitions
interface IntegrationSource {
  id: number;
  name: string;
  type: "API" | "SFTP" | "S3";
  vendor: string;
  frequency: string;
  lastSync: string;
  status: "active" | "inactive" | "error" | "configuring";
  errorMessage?: string;
  recordCount?: number;
  successRate?: number;
}

interface Vendor {
  id?: number;
  name: string;
  type: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  integration: string;
  operation: "load" | "sync" | "error" | "config";
  status: "success" | "warning" | "error" | "info";
  message: string;
  details?: string;
  recordsProcessed?: number; 
  previousRecordsCount?: number;
  recordsDifference?: number;
  duration?: number; // in seconds
}

interface DataIntegrationManagerProps {
  studyId?: number;
}

export default function DataIntegrationManager({ studyId }: DataIntegrationManagerProps) {
  const [activeTab, setActiveTab] = useState("sources");
  const [showAddIntegrationDialog, setShowAddIntegrationDialog] = useState(false);
  const [integrationSources, setIntegrationSources] = useState<IntegrationSource[]>([
    {
      id: 1,
      name: "EDC Data Feed",
      type: "API",
      vendor: "Medidata Rave",
      frequency: "Daily at 2:00 AM",
      lastSync: "2023-04-04 02:00:15",
      status: "active",
      recordCount: 3450,
      successRate: 99.8
    },
    {
      id: 2,
      name: "Central Lab Results",
      type: "SFTP",
      vendor: "Labcorp",
      frequency: "Every 12 hours",
      lastSync: "2023-04-04 14:00:03",
      status: "active",
      recordCount: 1275,
      successRate: 100
    },
    {
      id: 3,
      name: "Imaging Data",
      type: "S3",
      vendor: "Calyx",
      frequency: "Weekly on Monday",
      lastSync: "2023-04-01 08:30:22",
      status: "inactive",
      recordCount: 580,
      successRate: 95.2
    },
    {
      id: 4,
      name: "ECG Data",
      type: "API",
      vendor: "AliveCor",
      frequency: "Daily at 4:00 AM",
      lastSync: "2023-04-04 04:12:55",
      status: "active",
      recordCount: 1032,
      successRate: 98.7
    },
    {
      id: 5,
      name: "CTMS Data",
      type: "API",
      vendor: "Veeva Vault CTMS",
      frequency: "Daily at 6:00 AM",
      lastSync: "2023-04-04 06:00:05",
      status: "error",
      errorMessage: "API authentication failed. Check credentials.",
      recordCount: 745,
      successRate: 85.3
    },
    {
      id: 6,
      name: "eCOA Data",
      type: "API",
      vendor: "ClinicalInk",
      frequency: "Every 6 hours",
      lastSync: "2023-04-04 18:00:22",
      status: "configuring",
      recordCount: 0,
      successRate: 0
    }
  ]);
  
  // Form state for the new integration dialog
  const [newIntegration, setNewIntegration] = useState({
    name: "",
    type: "API",
    vendor: "",
    frequency: "daily"
  });
  
  // For the Monitor.AI tab
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoFix, setAutoFix] = useState(true);
  
  // For Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  
  // States for advanced integration features
  const [selectedSource, setSelectedSource] = useState<IntegrationSource | null>(null);
  const [showDataMapping, setShowDataMapping] = useState(false);
  const [showCredentialsManager, setShowCredentialsManager] = useState(false);
  const [showIntegrationTester, setShowIntegrationTester] = useState(false);
  const { toast } = useToast();
  
  // Fetch vendors for the selected study
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/trials", studyId, "vendors"],
    queryFn: async () => {
      if (!studyId) return [];
      const res = await fetch(`/api/trials/${studyId}/vendors`);
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
    enabled: !!studyId,
  });
  
  // Sample log entries
  const logEntries: LogEntry[] = [
    {
      id: 1,
      timestamp: "2025-04-07 15:32:45",
      integration: "EDC Data Feed",
      operation: "load",
      status: "success",
      message: "Successfully loaded 156 records",
      details: "Loaded DM, VS, AE domains. 156 new records processed.",
      recordsProcessed: 3450,
      previousRecordsCount: 3294,
      recordsDifference: 156,
      duration: 78
    },
    {
      id: 2,
      timestamp: "2025-04-07 14:05:12",
      integration: "Central Lab Results",
      operation: "sync",
      status: "success",
      message: "Synchronized 37 lab results",
      details: "Synchronized 37 records from LB domain. All data valid.",
      recordsProcessed: 1275,
      previousRecordsCount: 1238,
      recordsDifference: 37,
      duration: 45
    },
    {
      id: 3,
      timestamp: "2025-04-07 12:30:01",
      integration: "CTMS Data",
      operation: "error",
      status: "error",
      message: "API authentication failed",
      details: "Failed to authenticate with CTMS API. Error: Invalid credentials provided.",
      duration: 12
    },
    {
      id: 4,
      timestamp: "2025-04-07 10:15:22",
      integration: "Imaging Data",
      operation: "config",
      status: "info",
      message: "Configuration updated",
      details: "Integration frequency changed from 'Weekly' to 'Every 3 days'.",
      duration: 3
    },
    {
      id: 5,
      timestamp: "2025-04-07 09:45:18",
      integration: "Central Lab Results",
      operation: "load",
      status: "warning",
      message: "Data loaded with warnings",
      details: "Some lab values outside of normal ranges, flagged for review.",
      recordsProcessed: 1238,
      previousRecordsCount: 1187,
      recordsDifference: 51,
      duration: 62
    },
    {
      id: 6,
      timestamp: "2025-04-07 08:30:55",
      integration: "ECG Data",
      operation: "load",
      status: "success",
      message: "Successfully loaded 42 ECG records",
      details: "All 42 ECG records processed and mapped correctly.",
      recordsProcessed: 1032,
      previousRecordsCount: 990,
      recordsDifference: 42,
      duration: 28
    },
    {
      id: 7,
      timestamp: "2025-04-07 07:15:33",
      integration: "eCOA Data",
      operation: "config",
      status: "info",
      message: "New integration configured",
      details: "eCOA data integration with ClinicalInk has been set up and scheduled.",
      duration: 5
    }
  ];
  
  // Process for manually loading data
  const handleManualLoad = (sourceId: number) => {
    setIntegrationSources(sources => 
      sources.map(source => 
        source.id === sourceId 
          ? {...source, lastSync: new Date().toISOString().replace('T', ' ').substring(0, 19)} 
          : source
      )
    );
  };
  
  // Toggle integration status
  const toggleIntegrationStatus = (sourceId: number) => {
    setIntegrationSources(sources => 
      sources.map(source => 
        source.id === sourceId 
          ? {...source, status: source.status === "active" ? "inactive" : "active"} 
          : source
      )
    );
  };
  
  // Handle adding new integration
  const handleAddIntegration = () => {
    const newId = Math.max(...integrationSources.map(s => s.id)) + 1;
    const currentTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    const frequencyMap: Record<string, string> = {
      'hourly': 'Every hour',
      'daily': 'Daily at 2:00 AM',
      'weekly': 'Weekly on Monday',
      'custom': 'Custom schedule'
    };
    
    const newSource: IntegrationSource = {
      id: newId,
      name: newIntegration.name,
      type: newIntegration.type as "API" | "SFTP" | "S3",
      vendor: newIntegration.vendor,
      frequency: frequencyMap[newIntegration.frequency] || 'Daily at 2:00 AM',
      lastSync: currentTime,
      status: "configuring",
      recordCount: 0,
      successRate: 0
    };
    
    setIntegrationSources([...integrationSources, newSource]);
    setShowAddIntegrationDialog(false);
    
    // Reset form
    setNewIntegration({
      name: "",
      type: "API",
      vendor: "",
      frequency: "daily"
    });
    
    // Simulate the source going active after "configuration"
    setTimeout(() => {
      setIntegrationSources(sources => 
        sources.map(source => 
          source.id === newId 
            ? {...source, status: "active"} 
            : source
        )
      );
    }, 3000);
  };
  
  // Render functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      case "inactive":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inactive</Badge>;
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case "configuring":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Configuring...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case "load":
        return <Badge className="bg-blue-100 text-blue-800">Data Load</Badge>;
      case "sync":
        return <Badge className="bg-green-100 text-green-800">Sync</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case "config":
        return <Badge className="bg-purple-100 text-purple-800">Config</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Data Source Manager</CardTitle>
              <CardDescription>
                Configure and manage data integrations from external sources
              </CardDescription>
            </div>
          </div>
          <Dialog open={showAddIntegrationDialog} onOpenChange={setShowAddIntegrationDialog}>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                <span>Add Integration</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Add New Data Integration</DialogTitle>
                <DialogDescription>
                  Connect to external data sources to import clinical trial data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Integration Name
                  </Label>
                  <Input
                    id="name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration({...newIntegration, name: e.target.value})}
                    className="col-span-3"
                    placeholder="e.g., Primary EDC Data Feed"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Integration Type
                  </Label>
                  <Select 
                    value={newIntegration.type} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, type: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select integration type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="SFTP">SFTP</SelectItem>
                      <SelectItem value="S3">S3 Bucket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="vendor" className="text-right">
                    Vendor
                  </Label>
                  <Select 
                    value={newIntegration.vendor} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, vendor: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...vendors.map(v => v.name), "Medidata Rave", "IQVIA", "Veeva", "Labcorp", "Quest Diagnostics", "Calyx", "AliveCor", "ClinicalInk"].map(name => 
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {/* Data Domains section removed */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="frequency" className="text-right">
                    Update Frequency
                  </Label>
                  <Select 
                    value={newIntegration.frequency} 
                    onValueChange={(value) => setNewIntegration({...newIntegration, frequency: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every hour</SelectItem>
                      <SelectItem value="daily">Daily at 2:00 AM</SelectItem>
                      <SelectItem value="weekly">Weekly on Monday</SelectItem>
                      <SelectItem value="custom">Custom schedule</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-span-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="launch-now" />
                      <Label htmlFor="launch-now">Launch integration immediately after setup</Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddIntegrationDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={handleAddIntegration} disabled={!newIntegration.name || !newIntegration.vendor}>
                  Add Integration
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6 w-full max-w-lg mx-auto">
            <TabsTrigger value="sources" className="flex items-center gap-1">
              <ServerCog className="h-4 w-4" />
              <span>Integration Sources</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span>Integration Logs</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center gap-1">
              <Sliders className="h-4 w-4" />
              <span>Monitor.AI</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sources" className="mt-0">
            {/* Integration Sources Tab */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                {integrationSources.some(source => source.status === "error") && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      One or more integrations have errors. Please check the integration details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="SFTP">SFTP</SelectItem>
                      <SelectItem value="S3">S3</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
              </div>
              
              <Table>
                <TableHeader className="bg-blue-50">
                  <TableRow>
                    <TableHead className="font-semibold text-blue-900">Name</TableHead>
                    <TableHead className="font-semibold text-blue-900">Vendor</TableHead>
                    <TableHead className="font-semibold text-blue-900">Type</TableHead>
                    <TableHead className="font-semibold text-blue-900">Frequency</TableHead>
                    <TableHead className="font-semibold text-blue-900">Last Sync</TableHead>
                    <TableHead className="font-semibold text-blue-900">Status</TableHead>
                    <TableHead className="text-right font-semibold text-blue-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrationSources.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No integration sources configured yet. Click "Add Integration" to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    integrationSources.map((source) => (
                      <TableRow key={source.id} className="hover:bg-blue-50/50 transition-colors">
                        <TableCell className="font-medium text-blue-800">{source.name}</TableCell>
                        <TableCell className="font-medium">{source.vendor}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            source.type === "API" ? "bg-purple-50 text-purple-700 border-purple-200" : 
                            source.type === "SFTP" ? "bg-amber-50 text-amber-700 border-amber-200" : 
                            "bg-green-50 text-green-700 border-green-200"
                          }>
                            {source.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{source.frequency}</TableCell>
                        <TableCell className="font-mono text-xs">{source.lastSync}</TableCell>
                        <TableCell>
                          {getStatusBadge(source.status)}
                          {source.errorMessage && (
                            <p className="text-xs text-red-600 mt-1">{source.errorMessage}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleManualLoad(source.id)}
                              title="Start manual data load"
                              disabled={source.status === "configuring"}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => toggleIntegrationStatus(source.id)}
                              title={source.status === "active" ? "Pause integration" : "Activate integration"}
                              disabled={source.status === "configuring" || source.status === "error"}
                            >
                              {source.status === "active" ? (
                                <PauseCircle className="h-4 w-4" />
                              ) : (
                                <PlayCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSource(source);
                                  toast({
                                    title: "Integration Details",
                                    description: `Details for ${source.name} - Connected to ${source.vendor} via ${source.type}. Last synced at ${source.lastSync}.`,
                                    duration: 5000,
                                  });
                                }}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  <span>View Integration Details</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSource(source);
                                  setShowCredentialsManager(true);
                                }}>
                                  <Key className="mr-2 h-4 w-4" />
                                  <span>Manage Credentials</span>
                                </DropdownMenuItem>
                                {/* Data Mapping option removed */}
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSource(source);
                                  setShowIntegrationTester(true);
                                }}>
                                  <TestTube className="mr-2 h-4 w-4" />
                                  <span>Test Integration</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSource(source);
                                  toast({
                                    title: "Edit Configuration",
                                    description: `Configuration editor for ${source.name} will be implemented soon.`,
                                    duration: 3000,
                                  });
                                }}>
                                  <ServerCog className="mr-2 h-4 w-4" />
                                  <span>Edit Configuration</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setSelectedSource(source);
                                  toast({
                                    title: "Edit Schedule",
                                    description: `Schedule editor for ${source.name} will open shortly.`,
                                    duration: 3000,
                                  });
                                }}>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  <span>Edit Schedule</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => {
                                    const confirmDelete = window.confirm(`Are you sure you want to delete the integration "${source.name}"?`);
                                    if (confirmDelete) {
                                      setIntegrationSources(prevSources => 
                                        prevSources.filter(s => s.id !== source.id)
                                      );
                                      toast({
                                        title: "Integration Deleted",
                                        description: `${source.name} has been removed from your integrations.`,
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  <span>Delete Integration</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="logs" className="mt-0">
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                  <Input placeholder="Search logs..." className="w-60" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[170px]">
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {integrationSources.map(source => (
                        <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Logs
                </Button>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-blue-50">
                    <TableRow>
                      <TableHead className="font-semibold text-blue-900 w-[160px]">Date & Time</TableHead>
                      <TableHead className="font-semibold text-blue-900">Integration Source</TableHead>
                      <TableHead className="font-semibold text-blue-900">Operation</TableHead>
                      <TableHead className="font-semibold text-blue-900 text-right">Records Processed</TableHead>
                      <TableHead className="font-semibold text-blue-900 text-right">Records Difference</TableHead>
                      <TableHead className="font-semibold text-blue-900 text-right">Duration</TableHead>
                      <TableHead className="font-semibold text-blue-900">Status</TableHead>
                      <TableHead className="font-semibold text-blue-900 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logEntries.map((log) => (
                      <TableRow 
                        key={log.id} 
                        className={`${
                          log.status === "error" ? "bg-red-50/60" : 
                          log.status === "warning" ? "bg-amber-50/60" : 
                          "hover:bg-blue-50/40"
                        } transition-colors`}
                      >
                        <TableCell className="font-mono text-xs">
                          {log.timestamp}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.integration}
                        </TableCell>
                        <TableCell>
                          {getOperationBadge(log.operation)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {log.recordsProcessed !== undefined ? log.recordsProcessed.toLocaleString() : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-mono ${log.recordsDifference && log.recordsDifference > 0 ? 'text-green-600 font-semibold' : ''}`}>
                          {log.recordsDifference !== undefined ? (
                            <span>
                              {log.recordsDifference > 0 ? '+' : ''}{log.recordsDifference.toLocaleString()}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {log.duration !== undefined ? `${log.duration}s` : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(log.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2 text-xs"
                              onClick={() => {
                                toast({
                                  title: "Log Details",
                                  description: (
                                    <div className="mt-2 space-y-2">
                                      <div><strong>Integration:</strong> {log.integration}</div>
                                      <div><strong>Operation:</strong> {log.operation}</div>
                                      <div><strong>Status:</strong> {log.status}</div>
                                      <div><strong>Message:</strong> {log.message}</div>
                                      {log.details && (
                                        <div><strong>Details:</strong> {log.details}</div>
                                      )}
                                    </div>
                                  ),
                                  duration: 5000,
                                });
                              }}
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Detailed log entry view */}
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Log Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p className="font-medium text-gray-700">Selected Log Message:</p>
                    <p className="text-gray-600">{logEntries[0].message}</p>
                    
                    <div className="pt-2">
                      <p className="font-medium text-gray-700">Details:</p>
                      <p className="text-gray-600">{logEntries[0].details}</p>
                    </div>
                    
                    <div className="pt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-gray-700">Previous Records Count:</p>
                        <p className="text-gray-600 font-mono">{logEntries[0].previousRecordsCount?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Current Records Count:</p>
                        <p className="text-gray-600 font-mono">{logEntries[0].recordsProcessed?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="monitor" className="mt-0">
            {/* Monitor.AI Tab */}
            <div className="space-y-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-700 flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    All Integrations Operational
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-700">
                    Monitor.AI is actively scanning integrations and no issues have been detected.
                  </p>
                  <div className="mt-2 text-sm text-green-600">
                    Last checked: {new Date().toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Brain className="h-5 w-5 text-purple-600 mr-2" />
                      AI Monitoring Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Self-Healing Capability</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow Monitor.AI to automatically fix common integration issues
                          </p>
                        </div>
                        <Switch checked={autoFix} onCheckedChange={setAutoFix} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Real-time Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Send immediate alerts when critical issues are detected
                            </p>
                          </div>
                          <Switch defaultChecked={true} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Monitoring Frequency</Label>
                        <Select defaultValue="15">
                          <SelectTrigger>
                            <SelectValue placeholder="Select monitoring frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">Every 5 minutes</SelectItem>
                            <SelectItem value="15">Every 15 minutes</SelectItem>
                            <SelectItem value="30">Every 30 minutes</SelectItem>
                            <SelectItem value="60">Every hour</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>AI Assistant</CardTitle>
                    <CardDescription>
                      Ask questions about your integrations and troubleshooting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg p-4 bg-muted/50 mb-4">
                      <div className="flex">
                        <Bot className="h-5 w-5 mr-2 text-purple-600 mt-0.5" />
                        <div>
                          <div className="font-medium">Monitor.AI</div>
                          <p className="text-sm">
                            I can help you troubleshoot integration issues or answer questions about
                            your data connections. What would you like to know?
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Textarea placeholder="Ask about your integrations..." className="min-h-[100px]" />
                    
                    <div className="flex justify-end mt-4">
                      <Button>
                        Send Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Integration Health Summary</CardTitle>
                  <CardDescription>
                    AI-powered monitoring status for all your integrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Total Integrations</div>
                      <div className="text-3xl font-bold">{integrationSources.length}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Actively Monitored</div>
                      <div className="text-3xl font-bold">{integrationSources.length} <span className="text-sm text-muted-foreground">/ {integrationSources.length}</span></div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Issues Detected (30 days)</div>
                      <div className="text-3xl font-bold">3</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Issues Auto-Fixed</div>
                      <div className="text-3xl font-bold">2 <span className="text-sm text-muted-foreground">/ 3</span></div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Monitoring Status by Integration</h4>
                    <div className="space-y-3">
                      {integrationSources.map(source => (
                        <div key={source.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            {source.type === "API" ? (
                              <Database className="h-4 w-4 mr-2 text-blue-500" />
                            ) : source.type === "SFTP" ? (
                              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <Activity className="h-4 w-4 mr-2 text-purple-500" />
                            )}
                            <span>{source.name}</span>
                          </div>
                          {getStatusBadge(source.status)}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 px-6 pb-6">
                    <Button variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Run Manual Health Check
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-0">
            {/* Notification Settings Tab */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="mr-2 h-5 w-5" />
                    Notification Channels
                  </CardTitle>
                  <CardDescription>
                    Configure how you want to receive integration notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="email-notifications" className="text-base">Email Notifications</Label>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  
                  {emailNotifications && (
                    <div className="pl-7 pt-2">
                      <Label htmlFor="email-recipients" className="text-sm mb-2 block">
                        Notification Recipients
                      </Label>
                      <Input
                        id="email-recipients"
                        placeholder="Enter email addresses (comma-separated)"
                        defaultValue="admin@example.com"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate multiple email addresses with commas
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="h-5 w-5 text-muted-foreground" />
                      <Label htmlFor="in-app-notifications" className="text-base">In-App Notifications</Label>
                    </div>
                    <Switch
                      id="in-app-notifications"
                      checked={inAppNotifications}
                      onCheckedChange={setInAppNotifications}
                    />
                  </div>
                
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline">Reset to Defaults</Button>
                    <Button>Save Settings</Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Event-Specific Settings</CardTitle>
                  <CardDescription>
                    Customize notifications for specific integration events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: "load_complete", name: "Data Load Complete" },
                      { id: "load_error", name: "Data Load Error" },
                      { id: "validation_error", name: "Data Validation Error" },
                      { id: "ai_detection", name: "AI-Detected Issue" },
                      { id: "auto_fix", name: "Auto-Fix Applied" },
                    ].map((event) => (
                      <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="font-medium">{event.name}</div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Checkbox 
                              id={`${event.id}-email`} 
                              defaultChecked={true}
                              disabled={!emailNotifications}
                            />
                            <Label 
                              htmlFor={`${event.id}-email`} 
                              className={`text-xs ${!emailNotifications ? 'text-muted-foreground' : ''}`}
                            >
                              Email
                            </Label>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Checkbox 
                              id={`${event.id}-inapp`} 
                              defaultChecked={true}
                              disabled={!inAppNotifications}
                            />
                            <Label 
                              htmlFor={`${event.id}-inapp`} 
                              className={`text-xs ${!inAppNotifications ? 'text-muted-foreground' : ''}`}
                            >
                              In-App
                            </Label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <Button>
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {/* Advanced Integration Features */}
      {selectedSource && showDataMapping && (
        <Dialog open={showDataMapping} onOpenChange={setShowDataMapping}>
          <DialogContent className="max-w-screen-xl" onInteractOutside={(e) => e.preventDefault()}>
            <DataMappingEditor 
              integrationSource={selectedSource} 
              onClose={() => setShowDataMapping(false)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedSource && showCredentialsManager && (
        <Dialog open={showCredentialsManager} onOpenChange={setShowCredentialsManager}>
          <DialogContent className="max-w-screen-lg" onInteractOutside={(e) => e.preventDefault()}>
            <CredentialsManager 
              integrationId={selectedSource.id} 
              integrationType={selectedSource.type}
              onClose={() => setShowCredentialsManager(false)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedSource && showIntegrationTester && (
        <Dialog open={showIntegrationTester} onOpenChange={setShowIntegrationTester}>
          <DialogContent className="max-w-screen-xl" onInteractOutside={(e) => e.preventDefault()}>
            <IntegrationTester 
              integrationSource={selectedSource} 
              onClose={() => setShowIntegrationTester(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}