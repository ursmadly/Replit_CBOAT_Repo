import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Check, AlertTriangle, Info, X, Play, Pause, Database, BarChart4, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Define trial interface
interface Trial {
  id: number;
  title: string;
  protocolId: string;
}

// Define message types from server
enum MessageType {
  START_MONITORING = 'START_MONITORING',
  STOP_MONITORING = 'STOP_MONITORING',
  DATA_QUALITY_ISSUE = 'DATA_QUALITY_ISSUE',
  DATA_QUALITY_RESULT = 'DATA_QUALITY_RESULT',
  ERROR = 'ERROR',
  STATUS = 'STATUS'
}

// Define interface for WebSocket messages
interface WebSocketMessage {
  type: MessageType;
  data: any;
  timestamp: string;
}

// Data source options
const DATA_SOURCES = [
  { value: 'EDC', label: 'Electronic Data Capture (EDC)' },
  { value: 'LAB_RESULTS', label: 'Lab Results' },
  { value: 'CTMS', label: 'Clinical Trial Management System' },
  { value: 'ADVERSE_EVENTS', label: 'Adverse Events' },
  { value: 'IRT', label: 'Interactive Response Technology' },
  { value: 'eCOA', label: 'Electronic Clinical Outcome Assessment' }
];

const RealTimeDataQuality: React.FC = () => {
  // State for selected trial and data sources
  const [selectedTrial, setSelectedTrial] = useState<number | null>(null);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('issues');
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Options for data quality checks
  const [options, setOptions] = useState({
    checkConsistency: true,
    checkCompleteness: true,
    checkAccuracy: true,
    checkTimeliness: true
  });
  
  // Fetch trials
  const { 
    data: trials = [] as Trial[], 
    isLoading: isLoadingTrials 
  } = useQuery<Trial[]>({ 
    queryKey: ['/api/trials'], 
  });
  
  // Connect to WebSocket
  useEffect(() => {
    // Only establish connection once when component mounts
    if (!wsRef.current) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/data-quality`;
      
      try {
        console.log('Attempting to connect to WebSocket at:', wsUrl);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        
        ws.onopen = () => {
          console.log('WebSocket connection established successfully');
          setConnectionStatus('Connected');
          addLog('WebSocket connection established');
        };
        
        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case MessageType.DATA_QUALITY_RESULT:
                // Update issues and signals when results come in
                if (message.data.issues) {
                  setIssues(prevIssues => [...prevIssues, ...message.data.issues]);
                }
                if (message.data.signals) {
                  setSignals(prevSignals => [...prevSignals, ...message.data.signals]);
                }
                addLog(`Received ${message.data.issues?.length || 0} new data quality issues`);
                break;
                
              case MessageType.STATUS:
                // Update status information
                if (message.data.lastCheck) {
                  setLastCheck(message.data.lastCheck);
                }
                addLog(`Status update: ${message.data.message}`);
                break;
                
              case MessageType.ERROR:
                // Show error message
                toast({
                  title: 'Error',
                  description: message.data.message,
                  variant: 'destructive'
                });
                addLog(`Error: ${message.data.message}`);
                break;
                
              default:
                addLog(`Received message of type: ${message.type}`);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            addLog(`Failed to parse WebSocket message: ${error}`);
          }
        };
        
        ws.onclose = () => {
          setConnectionStatus('Disconnected');
          addLog('WebSocket connection closed');
          // If monitoring was active, update the state
          if (isMonitoring) {
            setIsMonitoring(false);
            toast({
              title: 'Connection Lost',
              description: 'The monitoring connection was closed. Please reconnect to continue monitoring.',
              variant: 'destructive'
            });
          }
          wsRef.current = null;
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error details:', error);
          addLog(`WebSocket error occurred: ${JSON.stringify(error)}`);
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to the monitoring service. Please try again or check the console for details.',
            variant: 'destructive'
          });
        };
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to the monitoring service. Please try again.',
          variant: 'destructive'
        });
      }
    }
    
    // Clean up WebSocket connection on component unmount
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // If monitoring is active, send a stop message first
        if (isMonitoring) {
          wsRef.current.send(JSON.stringify({
            type: MessageType.STOP_MONITORING,
            data: {}
          }));
        }
        
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
  
  // Add log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 100)); // Keep last 100 logs
  };
  
  // Start monitoring
  const startMonitoring = () => {
    if (!selectedTrial) {
      toast({
        title: 'Error',
        description: 'Please select a trial to monitor',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedSources.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one data source to monitor',
        variant: 'destructive'
      });
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Clear previous issues and signals
      setIssues([]);
      setSignals([]);
      
      // Send start monitoring command
      wsRef.current.send(JSON.stringify({
        type: MessageType.START_MONITORING,
        data: {
          trialId: selectedTrial,
          sources: selectedSources,
          options
        }
      }));
      
      setIsMonitoring(true);
      addLog(`Started monitoring trial ${selectedTrial} for sources: ${selectedSources.join(', ')}`);
    } else {
      toast({
        title: 'Connection Error',
        description: 'Not connected to the monitoring service. Please refresh the page and try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Stop monitoring
  const stopMonitoring = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: MessageType.STOP_MONITORING,
        data: {}
      }));
      
      setIsMonitoring(false);
      addLog('Stopped monitoring');
    }
  };
  
  // Toggle data source selection
  const toggleDataSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source)
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };
  
  // Toggle monitoring option
  const toggleOption = (option: keyof typeof options) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };
  
  // Get issue severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="destructive" className="bg-orange-500">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity || 'Unknown'}</Badge>;
    }
  };
  
  // Calculate connection indicator color
  const getConnectionIndicator = () => {
    if (connectionStatus === 'Connected') {
      return isMonitoring 
        ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Monitoring</Badge>
        : <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Connected</Badge>;
    }
    return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Disconnected</Badge>;
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Data Quality Monitor</h1>
          <p className="text-muted-foreground">
            Monitor data quality across multiple sources in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getConnectionIndicator()}
          {lastCheck && (
            <span className="text-xs text-muted-foreground">
              Last check: {new Date(lastCheck).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Monitoring Settings</CardTitle>
            <CardDescription>
              Configure which trial and data sources to monitor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="trial">Select Trial</Label>
              {isLoadingTrials ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedTrial?.toString() || ''}
                  onValueChange={(value) => setSelectedTrial(parseInt(value))}
                  disabled={isMonitoring}
                >
                  <SelectTrigger id="trial">
                    <SelectValue placeholder="Select a trial" />
                  </SelectTrigger>
                  <SelectContent>
                    {trials.map((trial) => (
                      <SelectItem key={trial.id} value={trial.id.toString()}>
                        {trial.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <Label>Data Sources</Label>
              <div className="space-y-2 border rounded-md p-3">
                {DATA_SOURCES.map(source => (
                  <div key={source.value} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`source-${source.value}`}
                      checked={selectedSources.includes(source.value)}
                      onCheckedChange={() => toggleDataSource(source.value)}
                      disabled={isMonitoring}
                    />
                    <label
                      htmlFor={`source-${source.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {source.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Data Quality Checks</Label>
              <div className="space-y-2 border rounded-md p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="check-consistency" className="text-sm">
                    Cross-Source Consistency
                  </Label>
                  <Switch
                    id="check-consistency"
                    checked={options.checkConsistency}
                    onCheckedChange={() => toggleOption('checkConsistency')}
                    disabled={isMonitoring}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="check-completeness" className="text-sm">
                    Data Completeness
                  </Label>
                  <Switch
                    id="check-completeness"
                    checked={options.checkCompleteness}
                    onCheckedChange={() => toggleOption('checkCompleteness')}
                    disabled={isMonitoring}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="check-accuracy" className="text-sm">
                    Data Accuracy
                  </Label>
                  <Switch
                    id="check-accuracy"
                    checked={options.checkAccuracy}
                    onCheckedChange={() => toggleOption('checkAccuracy')}
                    disabled={isMonitoring}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="check-timeliness" className="text-sm">
                    Data Timeliness
                  </Label>
                  <Switch
                    id="check-timeliness"
                    checked={options.checkTimeliness}
                    onCheckedChange={() => toggleOption('checkTimeliness')}
                    disabled={isMonitoring}
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            {isMonitoring ? (
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={stopMonitoring}
              >
                <Pause className="mr-2 h-4 w-4" />
                Stop Monitoring
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={startMonitoring}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Monitoring
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Results Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Monitoring Results</CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center">
                  <Database className="h-3 w-3 mr-1" />
                  {issues.length} Issues
                </Badge>
                <Badge variant="outline" className="flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {signals.length} Signals
                </Badge>
                {isMonitoring && (
                  <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center">
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="issues">Detected Issues</TabsTrigger>
                <TabsTrigger value="signals">Generated Signals</TabsTrigger>
                <TabsTrigger value="logs">Monitoring Logs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="issues" className="space-y-4">
                {issues.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 bg-muted/10 rounded-lg">
                    <Info className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No issues detected yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {isMonitoring 
                        ? "The system is actively monitoring for data quality issues. They will appear here when detected."
                        : "Start monitoring to detect data quality issues in real-time."}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {issues.map((issue, index) => (
                        <Card key={index} className="relative border-l-4" style={{
                          borderLeftColor: issue.severity === 'Critical' ? 'rgb(239, 68, 68)' : 
                                          issue.severity === 'High' ? 'rgb(249, 115, 22)' :
                                          issue.severity === 'Medium' ? 'rgb(234, 179, 8)' : 'rgb(59, 130, 246)'
                        }}>
                          <CardHeader className="py-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{issue.title}</CardTitle>
                                <CardDescription className="text-xs">
                                  Source: {issue.source} • Type: {issue.type}
                                </CardDescription>
                              </div>
                              {getSeverityBadge(issue.severity)}
                            </div>
                          </CardHeader>
                          <CardContent className="py-0">
                            <p className="text-sm">{issue.description}</p>
                          </CardContent>
                          <CardFooter className="py-3 flex justify-between">
                            <span className="text-xs text-muted-foreground">
                              Detected: {new Date().toLocaleString()}
                            </span>
                            {issue.recommendation && (
                              <div className="flex items-center">
                                <Info className="h-3 w-3 mr-1 text-blue-500" />
                                <span className="text-xs font-medium text-blue-500">
                                  {issue.recommendation}
                                </span>
                              </div>
                            )}
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="signals" className="space-y-4">
                {signals.length === 0 ? (
                  <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 bg-muted/10 rounded-lg">
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No signals generated yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Signals are created when data quality issues need action. They will be listed here and also appear in the Signal Detection page.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {signals.map((signal, index) => (
                        <Card key={index} className="relative border-l-4" style={{
                          borderLeftColor: signal.priority === 'Critical' ? 'rgb(239, 68, 68)' : 
                                          signal.priority === 'High' ? 'rgb(249, 115, 22)' :
                                          signal.priority === 'Medium' ? 'rgb(234, 179, 8)' : 'rgb(59, 130, 246)'
                        }}>
                          <CardHeader className="py-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{signal.title}</CardTitle>
                                <CardDescription className="text-xs">
                                  ID: {signal.detectionId} • Assigned: {signal.assignedTo}
                                </CardDescription>
                              </div>
                              {getSeverityBadge(signal.priority)}
                            </div>
                          </CardHeader>
                          <CardContent className="py-0">
                            <p className="text-sm">{signal.observation}</p>
                          </CardContent>
                          <CardFooter className="py-3 flex justify-between">
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(signal.dueDate).toLocaleDateString()}
                            </span>
                            <Button variant="link" size="sm" className="h-6 text-xs">
                              View in Signal Detection
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
              
              <TabsContent value="logs" className="space-y-4">
                <ScrollArea className="h-[500px] w-full border rounded-md p-4 bg-muted/5">
                  <div className="space-y-1 font-mono text-xs">
                    {logs.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No logs yet. Start monitoring to see activity logs.
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="border-b border-border/20 pb-1 last:border-0">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Help Section */}
      <div className="mt-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About Real-Time Data Quality Monitoring</AlertTitle>
          <AlertDescription>
            This feature allows you to monitor data quality across multiple sources in real-time.
            The system will detect issues such as inconsistencies between data sources, missing data,
            out-of-range values, and duplicates. When issues are detected, signals will be automatically
            generated for follow-up.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default RealTimeDataQuality;