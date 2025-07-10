import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  FileWarning, 
  RefreshCw,
  BarChart2,
  Settings,
  AlertTriangle,
  Activity,
  Download
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Type definitions
interface IntegrationLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string;
  message: string;
  details?: string;
}

interface IntegrationStatus {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'error' | 'warning' | 'offline';
  lastSync: Date;
  nextSync: Date;
  recordsProcessed: number;
  successRate: number;
  errorCount: number;
}

interface AnomalyDetection {
  id: string;
  timestamp: Date;
  source: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  autoResolved: boolean;
}

export default function IntegrationMonitorAI() {
  // State hooks
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Mock function to simulate fetching data
  const fetchData = () => {
    setIsRefreshing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Generate mock integration status data
      const mockIntegrations: IntegrationStatus[] = [
        {
          id: '1',
          name: 'Medidata Rave',
          type: 'EDC',
          status: 'active',
          lastSync: new Date(Date.now() - 3600000), // 1 hour ago
          nextSync: new Date(Date.now() + 3600000), // 1 hour from now
          recordsProcessed: 1248,
          successRate: 99.7,
          errorCount: 3
        },
        {
          id: '2',
          name: 'Labcorp',
          type: 'Lab',
          status: 'warning',
          lastSync: new Date(Date.now() - 7200000), // 2 hours ago
          nextSync: new Date(Date.now() + 1800000), // 30 minutes from now
          recordsProcessed: 562,
          successRate: 94.2,
          errorCount: 12
        },
        {
          id: '3',
          name: 'Veeva Vault CTMS',
          type: 'CTMS',
          status: 'active',
          lastSync: new Date(Date.now() - 5400000), // 1.5 hours ago
          nextSync: new Date(Date.now() + 7200000), // 2 hours from now
          recordsProcessed: 324,
          successRate: 100,
          errorCount: 0
        },
        {
          id: '4',
          name: 'Calyx',
          type: 'Imaging',
          status: 'error',
          lastSync: new Date(Date.now() - 86400000), // 24 hours ago
          nextSync: new Date(Date.now() + 1800000), // 30 minutes from now
          recordsProcessed: 0,
          successRate: 0,
          errorCount: 3
        }
      ];
      
      // Generate mock logs
      const mockLogs: IntegrationLog[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          level: 'info',
          source: 'Medidata Rave',
          message: 'Sync completed successfully',
          details: 'Processed 127 new records'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 900000), // 15 minutes ago
          level: 'warning',
          source: 'Labcorp',
          message: 'Data format mismatch detected',
          details: 'LB domain format inconsistency in 3 records'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          level: 'error',
          source: 'Calyx',
          message: 'Connection timeout',
          details: 'Failed to establish secure connection to API endpoint'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 3600000), // 1 hour ago
          level: 'success',
          source: 'Veeva Vault CTMS',
          message: 'New data imported',
          details: 'Added 42 new site records'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 7200000), // 2 hours ago
          level: 'error',
          source: 'Calyx',
          message: 'Authentication failed',
          details: 'API key expired, please renew credentials'
        }
      ];
      
      // Generate mock anomalies
      const mockAnomalies: AnomalyDetection[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
          source: 'Labcorp',
          description: 'Unusual spike in lab data volume',
          severity: 'medium',
          autoResolved: false
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 86400000), // 24 hours ago
          source: 'Medidata Rave',
          description: 'Duplicate subject records detected',
          severity: 'high',
          autoResolved: false
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 172800000), // 48 hours ago
          source: 'Veeva Vault CTMS',
          description: 'Minor data inconsistency in site information',
          severity: 'low',
          autoResolved: true
        }
      ];
      
      // Generate mock AI analysis
      const mockAiAnalysis = `### Integration Health Summary
      
**Overall System Status**: Moderate Risk (3 active issues)

**Key Findings**:
- Calyx integration has been down for over 24 hours - requires immediate attention
- Labcorp connection showing intermittent issues with data format consistency
- Medidata Rave performing well with 99.7% success rate

**Recommended Actions**:
1. Verify Calyx API credentials and renew if expired
2. Investigate Labcorp data format inconsistencies in LB domain
3. Schedule maintenance window for system-wide optimization

**Data Quality Impact Assessment**: 
The current integration issues may affect approximately 2.4% of incoming trial data. 
The priority should be restoring the Calyx connection as it impacts all imaging data processing.`;

      // Update state with mock data
      setIntegrations(mockIntegrations);
      setLogs(mockLogs);
      setAnomalies(mockAnomalies);
      setAiAnalysis(mockAiAnalysis);
      setIsRefreshing(false);
    }, 1200); // Simulate network delay
  };

  // Initial data load
  useEffect(() => {
    fetchData();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Dynamic status badge renderer
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" /> Active
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Warning
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="w-3 h-3 mr-1" /> Offline
          </Badge>
        );
    }
  };

  // Log level icon renderer
  const renderLogIcon = (level: string) => {
    switch (level) {
      case 'info':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format timestamp helper
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="w-full border-blue-100">
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <CardTitle className="flex items-center">
              Integration Monitor.AI
              <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded-full flex items-center">
                <Cpu className="h-3 w-3 mr-1" /> AI-Powered
              </span>
            </CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isRefreshing}
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>
          Real-time monitoring and intelligent analysis of data integration processes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
              <Activity className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-1.5">
              <FileWarning className="h-4 w-4" />
              <span>Logs</span>
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Anomalies</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1.5">
              <BarChart2 className="h-4 w-4" />
              <span>AI Analysis</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Integrations</p>
                      <h3 className="text-2xl font-bold">{integrations.length}</h3>
                    </div>
                    <Settings className="h-8 w-8 text-blue-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Records Processed</p>
                      <h3 className="text-2xl font-bold">
                        {integrations.reduce((sum, i) => sum + i.recordsProcessed, 0).toLocaleString()}
                      </h3>
                    </div>
                    <Activity className="h-8 w-8 text-green-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Success Rate</p>
                      <h3 className="text-2xl font-bold">
                        {(integrations.reduce((sum, i) => sum + i.successRate, 0) / 
                          (integrations.length || 1)).toFixed(1)}%
                      </h3>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active Issues</p>
                      <h3 className="text-2xl font-bold">
                        {integrations.filter(i => i.status === 'error').length +
                         integrations.filter(i => i.status === 'warning').length}
                      </h3>
                    </div>
                    <AlertCircle className="h-8 w-8 text-red-500 opacity-70" />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <h3 className="text-lg font-medium mb-2">Integration Status</h3>
            <div className="space-y-4">
              {integrations.map(integration => (
                <Card key={integration.id} className="overflow-hidden">
                  <div className={`h-1 ${
                    integration.status === 'active' ? 'bg-green-500' : 
                    integration.status === 'warning' ? 'bg-yellow-500' : 
                    integration.status === 'error' ? 'bg-red-500' : 'bg-gray-500'
                  }`} />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <h4 className="text-lg font-medium">{integration.name}</h4>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {integration.type}
                        </Badge>
                      </div>
                      {renderStatusBadge(integration.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-gray-500">Last Sync</p>
                        <p className="font-medium">{integration.lastSync.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Next Sync</p>
                        <p className="font-medium">{integration.nextSync.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Records Processed</p>
                        <p className="font-medium">{integration.recordsProcessed.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <Progress value={integration.successRate} className="h-2" />
                          <span className="font-medium">{integration.successRate}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Integration Activity Logs</h3>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-4 space-y-3">
                {logs.map(log => (
                  <Card key={log.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {renderLogIcon(log.level)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center">
                            <span className="font-medium">{log.source}</span>
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${
                                log.level === 'error' ? 'bg-red-50 text-red-700' :
                                log.level === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                                log.level === 'success' ? 'bg-green-50 text-green-700' :
                                'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {log.level}
                            </Badge>
                          </div>
                          <span className="text-gray-500 text-xs">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm">{log.message}</p>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Anomalies Tab */}
          <TabsContent value="anomalies" className="mt-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Detected Anomalies</h3>
              <Badge variant="outline" className="bg-gray-100">
                {anomalies.length} detected
              </Badge>
            </div>
            
            <div className="space-y-4">
              {anomalies.map(anomaly => (
                <Card key={anomaly.id} className="overflow-hidden">
                  <div className={`h-1 ${
                    anomaly.severity === 'high' ? 'bg-red-500' : 
                    anomaly.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center mb-1">
                          <h4 className="font-medium">{anomaly.source}</h4>
                          <Badge variant="outline" className={`ml-2 text-xs ${
                            anomaly.severity === 'high' ? 'bg-red-50 text-red-700' :
                            anomaly.severity === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {anomaly.severity} severity
                          </Badge>
                          {anomaly.autoResolved && (
                            <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700">
                              auto-resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{anomaly.description}</p>
                      </div>
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {anomaly.timestamp.toLocaleString()}
                      </span>
                    </div>
                    
                    {!anomaly.autoResolved && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="h-8">
                          Investigate
                        </Button>
                        <Button size="sm" variant="outline" className="h-8">
                          Mark as Resolved
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* AI Analysis Tab */}
          <TabsContent value="analysis" className="mt-0">
            <Card className="bg-blue-50 border-blue-200 mb-4">
              <CardContent className="p-4 flex items-start gap-3">
                <Cpu className="h-8 w-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">AI-Generated Analysis</h3>
                  <p className="text-sm text-blue-800">
                    The following analysis is generated by the Integration Monitor.AI agent based on 
                    real-time integration data, historical patterns, and detected anomalies.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                {aiAnalysis ? (
                  <div className="prose prose-blue max-w-none">
                    <div className="whitespace-pre-line">{aiAnalysis}</div>
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-40">
                    <RefreshCw className="animate-spin h-6 w-6 text-gray-400 mr-2" />
                    <span>Generating analysis...</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="mt-4 flex justify-end">
              <Button size="sm" className="text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export Analysis
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}