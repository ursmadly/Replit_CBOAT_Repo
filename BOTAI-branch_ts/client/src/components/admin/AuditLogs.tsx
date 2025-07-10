import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download,
  Calendar,
  Filter
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// Mock audit log data
const mockAuditLogs = [
  { 
    id: 1, 
    user: 'Sarah Johnson', 
    action: 'Login', 
    resource: 'System', 
    details: 'User logged in successfully',
    resourceId: null,
    timestamp: '2023-11-30 14:25:10',
    ipAddress: '192.168.1.100',
    severity: 'info'
  },
  { 
    id: 2, 
    user: 'Michael Chen', 
    action: 'Create', 
    resource: 'Patient', 
    details: 'Created new patient record',
    resourceId: 'PAT-2023-001',
    timestamp: '2023-11-30 13:15:22',
    ipAddress: '192.168.1.101',
    severity: 'info'
  },
  { 
    id: 3, 
    user: 'Emily Davis', 
    action: 'Update', 
    resource: 'Trial', 
    details: 'Updated trial protocol',
    resourceId: 'TRIAL-2023-005',
    timestamp: '2023-11-30 11:45:33',
    ipAddress: '192.168.1.102',
    severity: 'info'
  },
  { 
    id: 4, 
    user: 'Robert Wilson', 
    action: 'Delete', 
    resource: 'Document', 
    details: 'Deleted document from system',
    resourceId: 'DOC-2023-122',
    timestamp: '2023-11-30 10:30:45',
    ipAddress: '192.168.1.103',
    severity: 'warning'
  },
  { 
    id: 5, 
    user: 'Jessica Martinez', 
    action: 'Export', 
    resource: 'Report', 
    details: 'Exported trial data report',
    resourceId: 'REP-2023-010',
    timestamp: '2023-11-30 09:15:50',
    ipAddress: '192.168.1.104',
    severity: 'info'
  },
  { 
    id: 6, 
    user: 'Unknown', 
    action: 'Failed Login', 
    resource: 'System', 
    details: 'Multiple failed login attempts',
    resourceId: null,
    timestamp: '2023-11-30 08:05:15',
    ipAddress: '192.168.1.250',
    severity: 'error'
  },
  { 
    id: 7, 
    user: 'System', 
    action: 'Backup', 
    resource: 'Database', 
    details: 'Automated system backup completed',
    resourceId: 'BACKUP-2023-11-30',
    timestamp: '2023-11-30 02:00:00',
    ipAddress: 'localhost',
    severity: 'info'
  },
];

// Severity badge variants
const getSeverityBadgeVariant = (severity: string) => {
  switch (severity) {
    case 'error':
      return 'destructive';
    case 'warning':
      return 'outline';
    case 'info':
    default:
      return 'secondary';
  }
};

// Action badge variants
const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case 'Create':
      return 'default';
    case 'Update':
      return 'outline';
    case 'Delete':
      return 'destructive';
    case 'Failed Login':
      return 'destructive';
    default:
      return 'secondary';
  }
};

function AuditLogs() {
  const [logs, setLogs] = useState(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      searchTerm === '' || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAction = selectedAction === '' || selectedAction === 'all-actions' || log.action === selectedAction;
    const matchesResource = selectedResource === '' || selectedResource === 'all-resources' || log.resource === selectedResource;
    const matchesSeverity = selectedSeverity === '' || selectedSeverity === 'all-severities' || log.severity === selectedSeverity;
    
    return matchesSearch && matchesAction && matchesResource && matchesSeverity;
  });

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));
  // Get unique resources for filter
  const uniqueResources = Array.from(new Set(logs.map(log => log.resource)));
  // Get unique severities for filter
  const uniqueSeverities = Array.from(new Set(logs.map(log => log.severity)));

  // Summary metrics
  const totalLogs = logs.length;
  const errorLogs = logs.filter(log => log.severity === 'error').length;
  const warningLogs = logs.filter(log => log.severity === 'warning').length;
  const todayLogs = logs.filter(log => {
    // Simplified date check - in a real app would check today's date properly
    return log.timestamp.startsWith('2023-11-30');
  }).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLogs}</div>
            <p className="text-xs text-muted-foreground">All audit events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayLogs}</div>
            <p className="text-xs text-muted-foreground">Events in last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{errorLogs}</div>
            <p className="text-xs text-muted-foreground">Critical security events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{warningLogs}</div>
            <p className="text-xs text-muted-foreground">Events requiring attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Audit Logs</h2>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        <Tabs defaultValue="all" className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Logs</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
            <TabsTrigger value="data">Data Modifications</TabsTrigger>
            <TabsTrigger value="system">System Events</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search logs..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-actions">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedResource} onValueChange={setSelectedResource}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-resources">All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-severities">All Severities</SelectItem>
                {uniqueSeverities.map(severity => (
                  <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Resource ID</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.timestamp}</TableCell>
                    <TableCell className="font-medium">{log.user}</TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.resource}</TableCell>
                    <TableCell className="font-mono text-xs">{log.resourceId || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{log.ipAddress}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(log.severity)}>
                        {log.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No audit logs found matching your filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;