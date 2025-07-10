import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FaUserGear } from "react-icons/fa6";
import { Loader2, AlertCircle, CheckCircle2, ArrowRightCircle, RefreshCw } from "lucide-react";

interface DMAssistantProps {
  studyId: number;
  onAnalysisComplete?: (results: AnalysisResults) => void;
}

export interface AnalysisResults {
  totalIssues: number;
  queriesGenerated: number;
  dataSources: {
    name: string;
    issueCount: number;
    status: 'clean' | 'warning' | 'critical';
  }[];
  metrics: {
    dataQualityScore: number;
    consistencyScore: number;
    completenessScore: number;
    queryResponseRate: number;
  };
  // Schedule-related properties
  scheduleUpdated?: boolean;
  scheduleFrequency?: string;
  nextRunDate?: Date;
  checkTypes?: string[];
  topIssues: {
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    dataSources: string[];
    status: 'new' | 'assigned' | 'in-review' | 'resolved';
  }[];
}

const MOCK_ANALYSIS_STEPS = [
  "Connecting to data sources...",
  "Loading EDC data...",
  "Loading Lab data...",
  "Loading CTMS data...",
  "Analyzing data integrity...",
  "Cross-checking data consistency...",
  "Identifying data discrepancies...",
  "Evaluating missing data patterns...",
  "Generating queries...",
  "Prioritizing findings...",
  "Preparing recommendations...",
  "Finalizing analysis report..."
];

export const DMAssistant: React.FC<DMAssistantProps> = ({ studyId, onAnalysisComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const startAnalysis = () => {
    setIsAnalyzing(true);
    setCurrentStep(0);
    setProgress(0);
    setAnalysisResults(null);

    // Simulate analysis with steps
    const totalSteps = MOCK_ANALYSIS_STEPS.length;
    let stepCounter = 0;

    const interval = setInterval(() => {
      if (stepCounter < totalSteps) {
        setCurrentStep(stepCounter);
        setProgress(Math.round(((stepCounter + 1) / totalSteps) * 100));
        stepCounter++;
      } else {
        clearInterval(interval);
        const results = generateMockResults();
        setAnalysisResults(results);
        setIsAnalyzing(false);
        
        // Notify parent component
        if (onAnalysisComplete) {
          onAnalysisComplete(results);
        }
      }
    }, 800);
  };

  const generateMockResults = (): AnalysisResults => {
    return {
      totalIssues: 18,
      queriesGenerated: 12,
      dataSources: [
        { name: 'EDC', issueCount: 7, status: 'warning' },
        { name: 'Lab', issueCount: 5, status: 'warning' },
        { name: 'CTMS', issueCount: 3, status: 'clean' },
        { name: 'Imaging', issueCount: 3, status: 'clean' },
      ],
      metrics: {
        dataQualityScore: 84,
        consistencyScore: 76,
        completenessScore: 91,
        queryResponseRate: 68,
      },
      topIssues: [
        {
          id: `DM-Q${studyId}-001`,
          description: 'Inconsistent patient demographics between EDC and Lab data',
          severity: 'high',
          dataSources: ['EDC', 'Lab'],
          status: 'new'
        },
        {
          id: `DM-Q${studyId}-002`,
          description: 'Missing laboratory results for visit 3 across multiple patients',
          severity: 'medium',
          dataSources: ['Lab'],
          status: 'new'
        },
        {
          id: `DM-Q${studyId}-003`,
          description: 'Date inconsistencies between CTMS visit dates and EDC data entry',
          severity: 'medium',
          dataSources: ['EDC', 'CTMS'],
          status: 'new'
        },
        {
          id: `DM-Q${studyId}-004`,
          description: 'Multiple protocol deviations not documented in EDC',
          severity: 'high',
          dataSources: ['EDC', 'CTMS'],
          status: 'new'
        },
        {
          id: `DM-Q${studyId}-005`,
          description: 'Adverse event dates conflict with study medication dosing',
          severity: 'critical',
          dataSources: ['EDC'],
          status: 'new'
        }
      ]
    };
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setIsAnalyzing(false);
      setCurrentStep(0);
      setProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-gradient-to-r from-violet-50 to-indigo-100 text-blue-700 hover:from-violet-100 hover:to-indigo-200 border-indigo-200 transition-all duration-300 shadow-sm"
          onClick={() => setIsOpen(true)}
        >
          <FaUserGear className="mr-2 h-5 w-5 text-violet-600" />
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text font-medium">DM.AI</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FaUserGear className="mr-2 h-6 w-6 text-violet-600" />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-transparent bg-clip-text">
              DM.AI Data Management Assistant
            </span>
          </DialogTitle>
          <DialogDescription>
            AI-powered data analysis for clinical trial data management.
            Identifies issues, generates queries, and provides recommendations.
          </DialogDescription>
        </DialogHeader>
        
        {isAnalyzing ? (
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Analyzing data</h4>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="space-y-2">
                <h4 className="text-sm font-medium mb-2">Analysis Progress:</h4>
                <ScrollArea className="h-[220px]">
                  {MOCK_ANALYSIS_STEPS.map((step, index) => (
                    <div key={index} className="flex items-center py-1">
                      {index < currentStep ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      ) : index === currentStep ? (
                        <Loader2 className="mr-2 h-4 w-4 text-blue-500 animate-spin" />
                      ) : (
                        <div className="mr-2 h-4 w-4" />
                      )}
                      <span className={`text-sm ${index < currentStep ? 'text-muted-foreground' : index === currentStep ? 'font-medium' : 'text-muted-foreground/50'}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </div>
        ) : analysisResults ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="issues">Issues & Queries</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="flex-1">
              <TabsContent value="overview" className="mt-0 h-full space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Issues Found</CardTitle>
                      <CardDescription>Total data inconsistencies and issues</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analysisResults.totalIssues}</div>
                      <p className="text-sm text-muted-foreground">Across {analysisResults.dataSources.length} data sources</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Queries Generated</CardTitle>
                      <CardDescription>Auto-generated data clarification queries</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{analysisResults.queriesGenerated}</div>
                      <p className="text-sm text-muted-foreground">Ready to be reviewed and sent</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader className="pb-2">
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
              </TabsContent>
              
              <TabsContent value="issues" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Issues & Generated Queries</CardTitle>
                    <CardDescription>Prioritized by severity and impact</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResults.topIssues.map((issue, index) => (
                        <div key={index} className="border rounded-md p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{issue.id}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                              </Badge>
                              <Badge className={getStatusColor(issue.status)}>
                                {issue.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </Badge>
                            </div>
                          </div>
                          <p>{issue.description}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>Data Sources:</span>
                            {issue.dataSources.map((source, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button size="sm" variant="outline">
                              <ArrowRightCircle className="mr-1 h-4 w-4" /> 
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="metrics" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Data Quality Score</CardTitle>
                      <CardDescription>Overall data quality assessment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                          {analysisResults.metrics.dataQualityScore}%
                        </span>
                      </div>
                      <Progress value={analysisResults.metrics.dataQualityScore} className="h-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Consistency Score</CardTitle>
                      <CardDescription>Cross-source data consistency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-transparent bg-clip-text">
                          {analysisResults.metrics.consistencyScore}%
                        </span>
                      </div>
                      <Progress value={analysisResults.metrics.consistencyScore} className="h-2" />
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Completeness Score</CardTitle>
                      <CardDescription>Data completeness assessment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 text-transparent bg-clip-text">
                          {analysisResults.metrics.completenessScore}%
                        </span>
                      </div>
                      <Progress value={analysisResults.metrics.completenessScore} className="h-2" />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Query Response Rate</CardTitle>
                      <CardDescription>Historical query resolution rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-2">
                        <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 text-transparent bg-clip-text">
                          {analysisResults.metrics.queryResponseRate}%
                        </span>
                      </div>
                      <Progress value={analysisResults.metrics.queryResponseRate} className="h-2" />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="recommendations" className="mt-0 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Data Management Recommendations</CardTitle>
                    <CardDescription>AI-generated suggestions to improve data quality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded-md p-4 bg-blue-50">
                        <h3 className="font-medium mb-1 text-blue-800">Priority Actions</h3>
                        <ul className="space-y-2 ml-6 list-disc text-sm">
                          <li>Review and address the 5 critical data inconsistencies between EDC and Lab data</li>
                          <li>Investigate missing laboratory results for visit 3 across multiple patients</li>
                          <li>Verify and correct adverse event dates that conflict with medication dosing</li>
                          <li>Document protocol deviations found in CTMS within the EDC system</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-amber-50">
                        <h3 className="font-medium mb-1 text-amber-800">Process Improvements</h3>
                        <ul className="space-y-2 ml-6 list-disc text-sm">
                          <li>Establish a regular data reconciliation process between EDC and Lab data</li>
                          <li>Implement automated checks for date inconsistencies between systems</li>
                          <li>Create an SOP for timely protocol deviation documentation</li>
                          <li>Set up daily data quality checks for critical endpoints</li>
                        </ul>
                      </div>
                      
                      <div className="border rounded-md p-4 bg-green-50">
                        <h3 className="font-medium mb-1 text-green-800">Training Recommendations</h3>
                        <ul className="space-y-2 ml-6 list-disc text-sm">
                          <li>Conduct refresher training for site coordinators on proper AE documentation</li>
                          <li>Train CRAs on data reconciliation procedures between systems</li>
                          <li>Review data entry guidelines with all site personnel</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-4">
            <div className="rounded-full bg-primary/10 p-6">
              <FaUserGear className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Ready to analyze your data</h3>
              <p className="text-muted-foreground max-w-md">
                DM.AI will analyze data across all sources, identify inconsistencies, 
                generate queries, and provide recommendations for improving data quality.
              </p>
            </div>
          </div>
        )}
        
        <DialogFooter>
          {analysisResults ? (
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={() => setAnalysisResults(null)}>
                <RefreshCw className="mr-2 h-4 w-4" />
                New Analysis
              </Button>
              <Button type="button" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          ) : (
            <Button 
              type="button" 
              onClick={startAnalysis} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAnalyzing ? "Analyzing..." : "Start Analysis"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};