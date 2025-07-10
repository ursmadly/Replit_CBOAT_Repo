import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@radix-ui/react-progress";
import { Badge } from "@/components/ui/badge";
import { 
  PlayCircle, FileText, CheckCircle, XCircle, RefreshCw, 
  ArrowRight, FileCode, Server, Database, Clock, Calendar, CircleAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IntegrationTesterProps {
  integrationSource: {
    id: number;
    name: string;
    type: string;
    vendor: string;
  };
  onClose: () => void;
}

export default function IntegrationTester({ integrationSource, onClose }: IntegrationTesterProps) {
  const [activeTab, setActiveTab] = useState("test-execution");
  const [testRunning, setTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testCompleted, setTestCompleted] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const { toast } = useToast();
  
  // Test configuration
  const [testConfig, setTestConfig] = useState({
    testType: "connection",
    dateRange: "last_7_days",
    customStartDate: "",
    customEndDate: "",
    recordLimit: "100",
    skipValidation: false,
    executeTransform: true,
    logLevel: "info"
  });
  
  // Test results
  const [testResults, setTestResults] = useState<{
    status: string;
    message: string;
    startTime: string;
    endTime: string;
    duration: string;
    recordsFetched: number;
    recordsProcessed: number;
    warnings: number;
    errors: number;
    logs: Array<{timestamp: string; level: string; message: string}>;
  }>({
    status: "",
    message: "",
    startTime: "",
    endTime: "",
    duration: "",
    recordsFetched: 0,
    recordsProcessed: 0,
    warnings: 0,
    errors: 0,
    logs: []
  });
  
  // Sample validation errors
  const validationErrors = [
    {
      record: 1,
      field: "USUBJID",
      value: "001-002",
      rule: "uniqueness",
      message: "Subject ID must be unique across the study"
    },
    {
      record: 3,
      field: "VISITDT",
      value: "2023-13-45",
      rule: "date-format",
      message: "Invalid date format. Expected YYYY-MM-DD."
    },
    {
      record: 8,
      field: "SEX",
      value: "unknown",
      rule: "controlled-terminology",
      message: "Value must be one of: M, F, U"
    }
  ];
  
  // Sample test data
  const testData = [
    { USUBJID: "001-001", SITEID: "001", VISITDT: "2023-01-15", SEX: "M", RACE: "WHITE", WEIGHT: "75.5 kg", HEIGHT: "182 cm" },
    { USUBJID: "001-002", SITEID: "001", VISITDT: "2023-01-16", SEX: "F", RACE: "BLACK", WEIGHT: "65.2 kg", HEIGHT: "165 cm" },
    { USUBJID: "001-003", SITEID: "001", VISITDT: "2023-01-18", SEX: "F", RACE: "ASIAN", WEIGHT: "58.7 kg", HEIGHT: "158 cm" },
  ];
  
  // Simulate running a test
  const runTest = () => {
    setTestRunning(true);
    setTestProgress(0);
    setTestCompleted(false);
    setTestSuccess(false);
    
    const startTime = new Date();
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setTestProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          const endTime = new Date();
          const duration = (endTime.getTime() - startTime.getTime()) / 1000;
          
          setTestCompleted(true);
          setTestRunning(false);
          
          // Randomly determine success or failure for demo purposes
          const success = Math.random() > 0.3;
          setTestSuccess(success);
          
          // Set test results
          setTestResults({
            status: success ? "success" : "failed",
            message: success 
              ? "Integration test completed successfully" 
              : "Integration test failed. See logs for details.",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration: `${duration.toFixed(2)}s`,
            recordsFetched: success ? 28 : 12,
            recordsProcessed: success ? 28 : 8,
            warnings: success ? 2 : 4,
            errors: success ? 0 : 3,
            logs: generateTestLogs(success)
          });
          
          // Show toast notification
          toast({
            title: success ? "Test Completed Successfully" : "Test Failed",
            description: success 
              ? "Integration test has completed with no critical errors" 
              : "Integration test failed with errors. Please review the logs.",
            variant: success ? "default" : "destructive",
          });
        }
        return newProgress;
      });
    }, 500);
  };
  
  // Generate sample test logs
  const generateTestLogs = (success: boolean) => {
    const baseTime = new Date();
    const logs = [
      { 
        timestamp: new Date(baseTime.getTime() - 5000).toISOString(), 
        level: "info", 
        message: "Starting integration test for " + integrationSource.name 
      },
      { 
        timestamp: new Date(baseTime.getTime() - 4500).toISOString(), 
        level: "info", 
        message: "Establishing connection to " + integrationSource.vendor 
      },
      { 
        timestamp: new Date(baseTime.getTime() - 4000).toISOString(), 
        level: "info", 
        message: "Connection established successfully" 
      },
      { 
        timestamp: new Date(baseTime.getTime() - 3500).toISOString(), 
        level: "info", 
        message: "Authentication completed" 
      },
      { 
        timestamp: new Date(baseTime.getTime() - 3000).toISOString(), 
        level: "info", 
        message: "Starting data fetch" 
      },
    ];
    
    if (success) {
      logs.push(
        { 
          timestamp: new Date(baseTime.getTime() - 2500).toISOString(), 
          level: "info", 
          message: "Fetched 28 records from source" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 2000).toISOString(), 
          level: "info", 
          message: "Starting data transformation" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 1500).toISOString(), 
          level: "warning", 
          message: "Minor data format inconsistency in 2 records" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 1000).toISOString(), 
          level: "info", 
          message: "Data transformation completed" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 500).toISOString(), 
          level: "info", 
          message: "Test completed successfully" 
        }
      );
    } else {
      logs.push(
        { 
          timestamp: new Date(baseTime.getTime() - 2500).toISOString(), 
          level: "warning", 
          message: "Partial data retrieved (12 records)" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 2000).toISOString(), 
          level: "error", 
          message: "Connection timeout after retrieving partial data" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 1500).toISOString(), 
          level: "info", 
          message: "Attempting to process retrieved data" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 1000).toISOString(), 
          level: "error", 
          message: "Failed to process 4 records due to invalid format" 
        },
        { 
          timestamp: new Date(baseTime.getTime() - 500).toISOString(), 
          level: "error", 
          message: "Test failed with errors" 
        }
      );
    }
    
    return logs;
  };
  
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "error":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case "warning":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case "info":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Integration Tester</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <span>{integrationSource.name}</span>
              <Badge>{integrationSource.type}</Badge>
              <span className="text-muted-foreground">Vendor: {integrationSource.vendor}</span>
            </CardDescription>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="test-execution" className="flex items-center gap-1">
              <PlayCircle className="h-4 w-4" />
              <span>Test Execution</span>
            </TabsTrigger>
            <TabsTrigger value="data-preview" className="flex items-center gap-1">
              <Database className="h-4 w-4" />
              <span>Data Preview</span>
            </TabsTrigger>
            <TabsTrigger value="validation" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>Validation Results</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span>Logs</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="test-execution">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Test Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="test-type" className="text-right">
                        Test Type
                      </Label>
                      <Select
                        value={testConfig.testType}
                        onValueChange={(value) => setTestConfig({...testConfig, testType: value})}
                      >
                        <SelectTrigger id="test-type" className="col-span-3">
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="connection">Connection Test</SelectItem>
                          <SelectItem value="data_fetch">Data Fetch Test</SelectItem>
                          <SelectItem value="full_process">Full Process Test</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="date-range" className="text-right">
                        Date Range
                      </Label>
                      <Select
                        value={testConfig.dateRange}
                        onValueChange={(value) => setTestConfig({...testConfig, dateRange: value})}
                      >
                        <SelectTrigger id="date-range" className="col-span-3">
                          <SelectValue placeholder="Select date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                          <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                          <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {testConfig.dateRange === "custom" && (
                      <>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="custom-start-date" className="text-right">
                            Start Date
                          </Label>
                          <Input
                            id="custom-start-date"
                            type="date"
                            value={testConfig.customStartDate}
                            onChange={(e) => setTestConfig({...testConfig, customStartDate: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="custom-end-date" className="text-right">
                            End Date
                          </Label>
                          <Input
                            id="custom-end-date"
                            type="date"
                            value={testConfig.customEndDate}
                            onChange={(e) => setTestConfig({...testConfig, customEndDate: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="record-limit" className="text-right">
                        Record Limit
                      </Label>
                      <Select
                        value={testConfig.recordLimit}
                        onValueChange={(value) => setTestConfig({...testConfig, recordLimit: value})}
                      >
                        <SelectTrigger id="record-limit" className="col-span-3">
                          <SelectValue placeholder="Select record limit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 Records</SelectItem>
                          <SelectItem value="100">100 Records</SelectItem>
                          <SelectItem value="1000">1,000 Records</SelectItem>
                          <SelectItem value="all">All Records</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="log-level" className="text-right">
                        Log Level
                      </Label>
                      <Select
                        value={testConfig.logLevel}
                        onValueChange={(value) => setTestConfig({...testConfig, logLevel: value})}
                      >
                        <SelectTrigger id="log-level" className="col-span-3">
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debug">Debug</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Test Execution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testRunning && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Test in progress...</span>
                          <span>{testProgress}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${testProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {testCompleted && (
                      <Alert variant={testSuccess ? "default" : "destructive"} className="mb-4">
                        <div className="flex items-center gap-2">
                          {testSuccess ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <AlertTitle>
                            {testSuccess ? "Test Passed" : "Test Failed"}
                          </AlertTitle>
                        </div>
                        <AlertDescription>
                          {testResults.message}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {testCompleted && (
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Start Time</div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>{new Date(testResults.startTime).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">End Time</div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>{new Date(testResults.endTime).toLocaleTimeString()}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Duration</div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>{testResults.duration}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Records</div>
                            <div className="flex items-center">
                              <Database className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>{testResults.recordsProcessed} / {testResults.recordsFetched}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center border-t pt-4">
                          <div className="flex space-x-4">
                            <div className="flex items-center">
                              <CircleAlert className="h-4 w-4 mr-1 text-amber-500" />
                              <span className="text-sm">{testResults.warnings} Warnings</span>
                            </div>
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 mr-1 text-red-500" />
                              <span className="text-sm">{testResults.errors} Errors</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-4 pt-4 border-t">
                      <Button 
                        onClick={runTest} 
                        disabled={testRunning}
                        className="gap-1"
                      >
                        {testRunning ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                        {testRunning ? "Running..." : "Run Test"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="data-preview">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Data Sample Preview</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {testData.length > 0 && Object.keys(testData[0]).map((field) => (
                        <TableHead key={field}>{field}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" disabled={!testCompleted}>
                  Download Full Data Sample
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="validation">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Validation Results</h3>
              {validationErrors.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Record #</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Rule</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validationErrors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.record}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell>{error.value}</TableCell>
                          <TableCell>{error.rule}</TableCell>
                          <TableCell className="text-red-600">{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    No validation errors found in the test data.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={!testCompleted}>
                  Export Validation Report
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="logs">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Test Execution Logs</h3>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filter logs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Errors Only</SelectItem>
                    <SelectItem value="warning">Warnings & Up</SelectItem>
                    <SelectItem value="info">Info & Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testResults.logs.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          {getLogLevelBadge(log.level)}
                        </TableCell>
                        <TableCell>{log.message}</TableCell>
                      </TableRow>
                    ))}
                    {testResults.logs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          No logs available. Run a test to see execution logs.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={!testCompleted}>
                  Download Logs
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}