import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserCheck, 
  BarChart4, 
  FileSpreadsheet,
  RefreshCw,
  Search,
  ArrowUpDown,
  History,
  Database,
  Grid3x3,
  Mail,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CalendarCheck
} from "lucide-react";
import { dmBotService } from "@/services/dmBotService";
import { AnalysisResults } from "@/components/ai-assistants/DMAssistant";
import { QueryWorkflowHistoryModal } from "./QueryWorkflowHistoryModal";
import { QueryReferenceDataModal } from "./QueryReferenceDataModal";

interface DMComplianceDashboardProps {
  studyId: number;
  analysisResults: AnalysisResults | null;
  onRefreshRequest: () => void;
}

export const DMComplianceDashboard: React.FC<DMComplianceDashboardProps> = ({ 
  studyId, 
  analysisResults,
  onRefreshRequest
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [queriesTab, setQueriesTab] = useState('active');
  const [queryViewMode, setQueryViewMode] = useState<'table' | 'grid'>('table');
  const [allQueries, setAllQueries] = useState<any[]>([]);
  const [activeQueries, setActiveQueries] = useState<any[]>([]);
  const [resolvedQueries, setResolvedQueries] = useState<any[]>([]);
  const [sortField, setSortField] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isReferenceDataModalOpen, setIsReferenceDataModalOpen] = useState(false);
  const [referenceData, setReferenceData] = useState<any>(null);

  useEffect(() => {
    // Load queries from service
    if (studyId > 0) {
      const active = dmBotService.getActiveQueries(studyId);
      const resolved = dmBotService.getResolvedQueries(studyId);
      setActiveQueries(active);
      setResolvedQueries(resolved);
      setAllQueries([...active, ...resolved]);
    }
  }, [studyId, analysisResults]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortQueries = (queries: any[]) => {
    return [...queries].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (sortField === 'severity') {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        comparison = severityOrder[a.severity] - severityOrder[b.severity];
      } else if (sortField === 'status') {
        const statusOrder = { new: 0, assigned: 1, 'in-review': 2, resolved: 3 };
        comparison = statusOrder[a.status] - statusOrder[b.status];
      } else if (sortField === 'dueDate') {
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortField === 'dataSources') {
        comparison = a.dataSources.join(',').localeCompare(b.dataSources.join(','));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'in-review': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate the due date color based on how close it is to due date
  const getDueDateColor = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600';
    if (diffDays < 2) return 'text-orange-600';
    if (diffDays < 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const handleStatusChange = (queryId: string, newStatus: 'new' | 'assigned' | 'in-review' | 'resolved') => {
    const updatedQuery = dmBotService.updateQueryStatus(queryId, newStatus, 'Data Manager');
    if (updatedQuery) {
      // Refresh the query lists
      const active = dmBotService.getActiveQueries(studyId);
      const resolved = dmBotService.getResolvedQueries(studyId);
      setActiveQueries(active);
      setResolvedQueries(resolved);
      setAllQueries([...active, ...resolved]);
    }
  };
  
  const openWorkflowHistory = (query: any) => {
    setSelectedQuery(query);
    const steps = dmBotService.getQueryWorkflowSteps(query.id);
    setWorkflowSteps(steps);
    setIsWorkflowModalOpen(true);
  };
  
  const openReferenceData = (query: any) => {
    setSelectedQuery(query);
    const refData = dmBotService.getReferenceDataForQuery(query.id);
    setReferenceData(refData);
    setIsReferenceDataModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {analysisResults ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">DM Compliance Dashboard</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefreshRequest}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="queries">Query Management</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Open Queries</CardTitle>
                    <CardDescription>Requires action</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{activeQueries.length}</div>
                    <p className="text-sm text-muted-foreground">
                      {activeQueries.filter(q => q.status === 'new').length} new, 
                      {' '}{activeQueries.filter(q => q.status === 'assigned').length} assigned, 
                      {' '}{activeQueries.filter(q => q.status === 'in-review').length} in review
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Data Quality Score</CardTitle>
                    <CardDescription>Based on last analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold">
                        {analysisResults.metrics.dataQualityScore}%
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        from {activeQueries.length + resolvedQueries.length} checks
                      </div>
                    </div>
                    <Progress 
                      value={analysisResults.metrics.dataQualityScore} 
                      className="h-2 mt-2" 
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Cross-Source Consistency</CardTitle>
                    <CardDescription>Data agreement across sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-bold">
                        {analysisResults.metrics.consistencyScore}%
                      </div>
                      <div className="text-sm text-muted-foreground mb-1">
                        across {analysisResults.dataSources.length} sources
                      </div>
                    </div>
                    <Progress 
                      value={analysisResults.metrics.consistencyScore} 
                      className="h-2 mt-2" 
                    />
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Source Status</CardTitle>
                    <CardDescription>Analysis by data source</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResults.dataSources.map((source, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {source.issueCount} {source.issueCount === 1 ? 'issue' : 'issues'} detected
                            </div>
                          </div>
                          <Badge
                            className={
                              source.status === 'clean' ? 'bg-green-100 text-green-800' :
                              source.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {source.status === 'clean' ? 'Clean' :
                             source.status === 'warning' ? 'Issues Found' :
                             'Critical Issues'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <CardDescription>Latest system activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-blue-100 p-2">
                          <Bell className="h-4 w-4 text-blue-700" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">New queries generated</p>
                          <p className="text-sm text-muted-foreground">
                            DM.AI generated {analysisResults.queriesGenerated} new queries
                          </p>
                          <p className="text-xs text-muted-foreground">Just now</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-green-100 p-2">
                          <CheckCircle2 className="h-4 w-4 text-green-700" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Data analysis completed</p>
                          <p className="text-sm text-muted-foreground">
                            Analysis of {analysisResults.dataSources.length} data sources completed
                          </p>
                          <p className="text-xs text-muted-foreground">5 mins ago</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-yellow-100 p-2">
                          <AlertCircle className="h-4 w-4 text-yellow-700" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Data inconsistency detected</p>
                          <p className="text-sm text-muted-foreground">
                            {analysisResults.totalIssues} issues found requiring review
                          </p>
                          <p className="text-xs text-muted-foreground">10 mins ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="queries" className="space-y-6 mt-6">
              <div className="flex items-center justify-between">
                <Tabs value={queriesTab} onValueChange={setQueriesTab} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="active" className="relative">
                      Active Queries
                      {activeQueries.length > 0 && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800">{activeQueries.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="resolved">
                      Resolved
                      {resolvedQueries.length > 0 && (
                        <Badge className="ml-2 bg-green-100 text-green-800">{resolvedQueries.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      Query Grid
                      {allQueries.length > 0 && (
                        <Badge className="ml-2 bg-purple-100 text-purple-800">{allQueries.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="flex items-center gap-2">
                  <div className="flex h-9 items-center border rounded-md overflow-hidden">
                    <Button 
                      size="sm" 
                      variant={queryViewMode === 'table' ? 'default' : 'ghost'} 
                      className="rounded-none h-full px-3"
                      onClick={() => setQueryViewMode('table')}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant={queryViewMode === 'grid' ? 'default' : 'ghost'} 
                      className="rounded-none h-full px-3"
                      onClick={() => setQueryViewMode('grid')}
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
              
              <TabsContent value="active" className="mt-0">
                {activeQueries.length > 0 ? (
                  queryViewMode === 'table' ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[120px] cursor-pointer" onClick={() => handleSort('id')}>
                              <div className="flex items-center gap-1">
                                Query ID
                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('severity')}>
                              <div className="flex items-center gap-1">
                                Severity
                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                              <div className="flex items-center gap-1">
                                Status
                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('dataSources')}>
                              <div className="flex items-center gap-1">
                                Data Sources
                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('dueDate')}>
                              <div className="flex items-center gap-1">
                                Due Date
                                <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TableHead>
                            <TableHead>Assigned To</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortQueries(activeQueries).map((query) => (
                            <TableRow key={query.id}>
                              <TableCell className="font-medium">{query.id}</TableCell>
                              <TableCell>{query.description}</TableCell>
                              <TableCell>
                                <Badge className={getSeverityColor(query.severity)}>
                                  {query.severity.charAt(0).toUpperCase() + query.severity.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(query.status)}>
                                  {query.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {query.dataSources.map((source: string, i: number) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {query.dueDate && (
                                  <div className={getDueDateColor(new Date(query.dueDate))}>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>
                                        {new Date(query.dueDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {query.contact ? (
                                  <div className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3 text-green-600" />
                                    <span>{query.contact}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Not assigned</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {query.status === 'new' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleStatusChange(query.id, 'assigned')}
                                    >
                                      Assign
                                    </Button>
                                  )}
                                  {query.status === 'assigned' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleStatusChange(query.id, 'in-review')}
                                    >
                                      Review
                                    </Button>
                                  )}
                                  {query.status === 'in-review' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="bg-green-50 text-green-700 hover:bg-green-100"
                                      onClick={() => handleStatusChange(query.id, 'resolved')}
                                    >
                                      Resolve
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-1"
                                    onClick={() => openWorkflowHistory(query)}
                                    title="View workflow history"
                                  >
                                    <History className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-1"
                                    onClick={() => openReferenceData(query)}
                                    title="View reference data"
                                  >
                                    <Database className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortQueries(activeQueries).map((query) => (
                        <Card key={query.id} className="overflow-hidden">
                          <div className={`h-2 w-full ${getSeverityColor(query.severity)}`}></div>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base flex items-center gap-2">
                                {query.id}
                                <Badge className={getStatusColor(query.status)}>
                                  {query.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Badge>
                              </CardTitle>
                              {query.dueDate && (
                                <div className={`text-sm ${getDueDateColor(new Date(query.dueDate))}`}>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {new Date(query.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <CardDescription className="line-clamp-2">
                              {query.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 pb-2">
                            <div>
                              <div className="text-sm font-medium mb-1">Data References</div>
                              <div className="flex flex-wrap gap-1">
                                {query.dataSources.map((source: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Assigned To</div>
                              {query.contact ? (
                                <div className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3 text-green-600" />
                                  <span>{query.contact}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">Not assigned</span>
                              )}
                            </div>
                            {query.lastNotified && (
                              <div>
                                <div className="text-sm font-medium mb-1">Notification</div>
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-blue-600" />
                                  <span className="text-muted-foreground">
                                    Sent on {new Date(query.lastNotified).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-8"
                                onClick={() => openWorkflowHistory(query)}
                                title="View workflow history"
                              >
                                <History className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-8"
                                onClick={() => openReferenceData(query)}
                                title="View reference data"
                              >
                                <Database className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                            <div>
                              {query.status === 'new' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleStatusChange(query.id, 'assigned')}
                                >
                                  Assign
                                </Button>
                              )}
                              {query.status === 'assigned' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleStatusChange(query.id, 'in-review')}
                                >
                                  Review
                                </Button>
                              )}
                              {query.status === 'in-review' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="bg-green-50 text-green-700 hover:bg-green-100"
                                  onClick={() => handleStatusChange(query.id, 'resolved')}
                                >
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No active queries</AlertTitle>
                    <AlertDescription>
                      There are no active queries at this time. Run a data analysis to identify potential data issues.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="mt-0">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSortField('severity')}
                      className={sortField === 'severity' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      By Severity
                      {sortField === 'severity' && (
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSortField('status')}
                      className={sortField === 'status' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    >
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      By Status
                      {sortField === 'status' && (
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSortField('dueDate')}
                      className={sortField === 'dueDate' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      By Due Date
                      {sortField === 'dueDate' && (
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {allQueries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortQueries(allQueries).map((query) => (
                      <Card key={query.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: 
                        query.severity === 'critical' ? '#FEE2E2' : 
                        query.severity === 'high' ? '#FFEDD5' : 
                        query.severity === 'medium' ? '#FEF3C7' : 
                        '#DBEAFE' 
                      }}>
                        <CardHeader className="pb-2 pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-base flex items-center">
                                <span className="font-medium text-blue-700">{query.id}</span>
                                <Badge className={`ml-2 ${getStatusColor(query.status)}`}>
                                  {query.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </Badge>
                              </CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {query.description}
                              </CardDescription>
                            </div>
                            <Badge className={`${getSeverityColor(query.severity)} self-start`}>
                              {query.severity.charAt(0).toUpperCase() + query.severity.slice(1)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-1">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-1">
                              {query.dataSources.map((source: string, i: number) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Due Date</p>
                                {query.dueDate ? (
                                  <div className={`flex items-center gap-1 ${getDueDateColor(new Date(query.dueDate))}`}>
                                    <Clock className="h-3 w-3" />
                                    <span className="text-sm">
                                      {new Date(query.dueDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not set</span>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Assigned To</p>
                                {query.contact ? (
                                  <div className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3 text-green-600" />
                                    <span className="text-sm">{query.contact}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">Not assigned</span>
                                )}
                              </div>
                            </div>
                            
                            {query.emailsSent && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-blue-600" />
                                <span className="text-xs text-muted-foreground">
                                  {query.emailsSent} notification{query.emailsSent !== 1 ? 's' : ''} sent
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <div className="px-6 py-3 border-t mt-2 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 h-8"
                              onClick={() => openWorkflowHistory(query)}
                              title="View workflow history"
                            >
                              <History className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 h-8"
                              onClick={() => openReferenceData(query)}
                              title="View reference data"
                            >
                              <Database className="h-4 w-4 text-blue-600" />
                            </Button>
                          </div>
                          
                          {query.status !== 'resolved' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">
                                  <span>Update</span>
                                  <ChevronDown className="h-4 w-4 ml-1" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {query.status === 'new' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(query.id, 'assigned')}>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Assign Query
                                  </DropdownMenuItem>
                                )}
                                {query.status === 'assigned' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(query.id, 'in-review')}>
                                    <ClipboardCheck className="h-4 w-4 mr-2" />
                                    Mark In Review
                                  </DropdownMenuItem>
                                )}
                                {query.status === 'in-review' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(query.id, 'resolved')}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Resolve Query
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border rounded-lg bg-gray-50">
                    <div className="flex justify-center">
                      <ClipboardList className="h-12 w-12 text-gray-400 mb-2" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">No Queries Found</h3>
                    <p className="text-muted-foreground mb-4">
                      No queries are currently available for this study.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="resolved" className="mt-0">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSortField('severity')}
                      className={sortField === 'severity' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      By Severity
                      {sortField === 'severity' && (
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSortField('updatedAt')}
                      className={sortField === 'updatedAt' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    >
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      By Resolution Date
                      {sortField === 'updatedAt' && (
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSortField('contact')}
                      className={sortField === 'contact' ? 'border-blue-500 bg-blue-50 text-blue-700' : ''}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      By Resolver
                      {sortField === 'contact' && (
                        <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {resolvedQueries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sortQueries(resolvedQueries).map((query) => (
                        <Card key={query.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: '#ECFDF5' }}>
                          <CardHeader className="pb-2 pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base flex items-center">
                                  <span className="font-medium text-blue-700">{query.id}</span>
                                  <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                                    Resolved
                                  </Badge>
                                </CardTitle>
                                <CardDescription className="line-clamp-2 mt-1">
                                  {query.description}
                                </CardDescription>
                              </div>
                              <Badge className={`${getSeverityColor(query.severity)} self-start opacity-70`}>
                                {query.severity.charAt(0).toUpperCase() + query.severity.slice(1)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-1">
                            <div className="space-y-3">
                              <div className="flex flex-wrap gap-1">
                                {query.dataSources.map((source: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {source}
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Resolved Date</p>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <CalendarCheck className="h-3 w-3 text-green-600" />
                                    <span className="text-sm">
                                      {query.updatedAt ? new Date(query.updatedAt).toLocaleDateString() : 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Resolved By</p>
                                  {query.contact ? (
                                    <div className="flex items-center gap-1">
                                      <UserCheck className="h-3 w-3 text-green-600" />
                                      <span className="text-sm">{query.contact}</span>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Unknown</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                          <div className="px-6 py-3 border-t mt-2 bg-gray-50 flex items-center justify-end">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-8"
                                onClick={() => openWorkflowHistory(query)}
                                title="View workflow history"
                              >
                                <History className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-8"
                                onClick={() => openReferenceData(query)}
                                title="View reference data"
                              >
                                <Database className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No resolved queries</AlertTitle>
                    <AlertDescription>
                      There are no resolved queries at this time.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-6 mt-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Quality Metrics</CardTitle>
                    <CardDescription>Key quality indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Data Quality Score</div>
                        <div className="font-medium">{analysisResults.metrics.dataQualityScore}%</div>
                      </div>
                      <Progress value={analysisResults.metrics.dataQualityScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Consistency Score</div>
                        <div className="font-medium">{analysisResults.metrics.consistencyScore}%</div>
                      </div>
                      <Progress value={analysisResults.metrics.consistencyScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Completeness Score</div>
                        <div className="font-medium">{analysisResults.metrics.completenessScore}%</div>
                      </div>
                      <Progress value={analysisResults.metrics.completenessScore} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Query Response Rate</div>
                        <div className="font-medium">{analysisResults.metrics.queryResponseRate}%</div>
                      </div>
                      <Progress value={analysisResults.metrics.queryResponseRate} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Data Source Compliance</CardTitle>
                    <CardDescription>Compliance by data source</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {analysisResults.dataSources.map((source, index) => {
                        // Calculate a score based on issues
                        const totalPossibleIssues = 20; // Just an example max value
                        const score = Math.max(0, Math.min(100, 100 - (source.issueCount / totalPossibleIssues * 100)));
                        
                        return (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">{source.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {source.issueCount} {source.issueCount === 1 ? 'issue' : 'issues'}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Progress value={score} className={`h-2 ${
                                source.status === 'clean' ? 'bg-green-600' :
                                source.status === 'warning' ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <div>0</div>
                                <div>Compliance Score: {Math.round(score)}%</div>
                                <div>100</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Data Comparison</CardTitle>
                  <CardDescription>Changes since last analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Source</TableHead>
                        <TableHead>Total Fields</TableHead>
                        <TableHead>Inconsistent Fields</TableHead>
                        <TableHead>Missing Fields</TableHead>
                        <TableHead>Changed Since Last Check</TableHead>
                        <TableHead>Last Checked</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dmBotService.getDataComparison(studyId).map((comparison, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{comparison.source}</TableCell>
                          <TableCell>{comparison.totalFields}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={comparison.inconsistentFields > 10 ? 'text-red-600' : 'text-muted-foreground'}>
                                {comparison.inconsistentFields}
                              </span>
                              {comparison.inconsistentFields > 10 && (
                                <AlertCircle className="ml-1 h-3 w-3 text-red-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className={comparison.missingFields > 5 ? 'text-orange-600' : 'text-muted-foreground'}>
                                {comparison.missingFields}
                              </span>
                              {comparison.missingFields > 5 && (
                                <AlertCircle className="ml-1 h-3 w-3 text-orange-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span>{comparison.changedSinceLastCheck}</span>
                              {comparison.changedSinceLastCheck > 30 && (
                                <AlertCircle className="ml-1 h-3 w-3 text-blue-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {comparison.lastChecked.toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Notifications</CardTitle>
                  <CardDescription>Query notifications sent to team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Sent At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dmBotService.getNotificationsForRecipient('').map((notification, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{notification.subject}</TableCell>
                          <TableCell>{notification.recipientId}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                notification.status === 'read' ? 'bg-green-100 text-green-800' :
                                notification.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {notification.sentAt.toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="mb-4">
            <BarChart4 className="mx-auto h-12 w-12 text-muted-foreground/80" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Data Analysis Results Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Use the DM.AI assistant to analyze your clinical trial data and view comprehensive 
            compliance metrics, queries, and recommendations.
          </p>
          <Button onClick={onRefreshRequest}>
            Run Data Analysis
          </Button>
        </div>
      )}
      
      {/* Workflow History Modal */}
      <QueryWorkflowHistoryModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        query={selectedQuery}
        workflowSteps={workflowSteps}
      />

      {/* Reference Data Modal */}
      <QueryReferenceDataModal
        isOpen={isReferenceDataModalOpen}
        onClose={() => setIsReferenceDataModalOpen(false)}
        query={selectedQuery}
        referenceData={referenceData}
      />
    </div>
  );
};