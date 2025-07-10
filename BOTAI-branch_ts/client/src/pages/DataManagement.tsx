import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ClipboardCheck, Download, BarChart3 } from "lucide-react";
import { FaUserGear, FaUserDoctor } from "react-icons/fa6";

// Import components and services
import { AnalysisResults } from "@/components/ai-assistants/DMAssistant";
import { ConversationalDMAssistant } from "@/components/ai-assistants/ConversationalDMAssistant";
import { DMComplianceDashboard } from "@/components/data-management/DMComplianceDashboard";
import { dmBotService } from "@/services/dmBotService";
import RAGManager from "@/components/data-management/RAGManager";

export default function DataManagement() {
  const [selectedStudy, setSelectedStudy] = useState<number>(1);
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/data-management/:studyId");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  
  // Define types for trials
  interface Trial {
    id: number;
    protocolId: string;
    title: string;
    phase: string;
    status: string;
    indication?: string;
    startDate: string;
    endDate?: string;
    enrolledPatients?: number;
  }
  
  // Get all trials
  const { data: trials = [], isLoading: isLoadingTrials } = useQuery<Trial[]>({
    queryKey: ["/api/trials"],
  });

  useEffect(() => {
    if (params?.studyId) {
      setSelectedStudy(parseInt(params.studyId));
    } else if (trials && trials.length > 0 && !selectedStudy) {
      setSelectedStudy(trials[0].id);
      
      // Check if there are any cached analysis results
      const cachedResults = dmBotService.getLastAnalysisResults(trials[0].id);
      if (cachedResults) {
        setAnalysisResults(cachedResults);
      }
    }
  }, [params, trials, selectedStudy]);

  const handleStudyChange = (value: string) => {
    const studyId = parseInt(value);
    setSelectedStudy(studyId);
    setLocation(`/data-management/${studyId}`);
    
    // Check if there are any cached analysis results for this study
    const cachedResults = dmBotService.getLastAnalysisResults(studyId);
    if (cachedResults) {
      setAnalysisResults(cachedResults);
    } else {
      setAnalysisResults(null);
    }
  };

  const handleAnalysisComplete = (results: AnalysisResults) => {
    setAnalysisResults(results);
  };

  const handleRefreshData = async () => {
    // This would normally call the backend API, but we're using our service here
    try {
      // First check for any data corrections that can auto-resolve queries
      const resolvedQueries = dmBotService.checkForCorrectedData(selectedStudy);
      
      // Then run the full data analysis
      const results = await dmBotService.analyzeData(selectedStudy);
      setAnalysisResults(results);
      
      // If any queries were automatically resolved, show a notification
      if (resolvedQueries.length > 0) {
        // In a real implementation, this would show a toast notification
        console.log(`${resolvedQueries.length} queries were automatically resolved due to data corrections.`);
      }
    } catch (error) {
      console.error('Error analyzing data:', error);
    }
  };

  // Get the current study
  const currentStudy = trials?.find((trial) => trial.id === selectedStudy);

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Data Management</h1>
            <p className="text-muted-foreground mt-1">Monitor data management compliance and query resolution</p>
          </div>
          
          <div className="flex items-center gap-4">
            {isLoadingTrials ? (
              <div className="w-[180px] h-10 bg-muted rounded-md animate-pulse" />
            ) : (
              <Select
                value={selectedStudy.toString()}
                onValueChange={handleStudyChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Study" />
                </SelectTrigger>
                <SelectContent>
                  {trials?.map((trial) => (
                    <SelectItem key={trial.id} value={trial.id.toString()}>
                      {trial.protocolId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <ConversationalDMAssistant 
                studyId={selectedStudy} 
                onAnalysisComplete={handleAnalysisComplete}
              />
            </div>
          </div>
        </div>

        {currentStudy && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>{currentStudy.title}</CardTitle>
              <CardDescription>
                Protocol: {currentStudy.protocolId} | Phase: {currentStudy.phase} | 
                Status: <span className="font-medium">{currentStudy.status}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Indication</h4>
                  <p>{currentStudy.indication || "Not specified"}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                  <p>{new Date(currentStudy.startDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">End Date</h4>
                  <p>{currentStudy.endDate ? new Date(currentStudy.endDate).toLocaleDateString() : "Ongoing"}</p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Enrolled Patients</h4>
                  <p>{currentStudy.enrolledPatients || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="compliance" className="mb-6">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="compliance">Compliance Dashboard</TabsTrigger>
            <TabsTrigger value="rag">Semantic Knowledge Base</TabsTrigger>
          </TabsList>
          
          <TabsContent value="compliance" className="mt-0">
            <DMComplianceDashboard 
              studyId={selectedStudy}
              analysisResults={analysisResults}
              onRefreshRequest={handleRefreshData}
            />
          </TabsContent>
          
          <TabsContent value="rag" className="mt-0">
            <RAGManager />
          </TabsContent>
        </Tabs>
        
        {/* Documentation section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">DM.AI Capabilities</CardTitle>
            <CardDescription>
              Overview of the Data Management AI Assistant capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2">
                    <ClipboardCheck className="h-5 w-5 text-blue-700" />
                  </div>
                  <h3 className="font-medium">Automated Query Generation</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Identifies issues across data sources and generates structured queries with standardized 
                  naming conventions, statuses, and transitions.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-purple-100 p-2">
                    <FaUserGear className="h-5 w-5 text-purple-700" />
                  </div>
                  <h3 className="font-medium">Data Source Comparison</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compares data across sources on each refresh, identifying deltas and generating detailed
                  reports highlighting inconsistencies and changes.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2">
                    <FaUserDoctor className="h-5 w-5 text-green-700" />
                  </div>
                  <h3 className="font-medium">Notification Management</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sends in-app and email notifications to relevant team members with appropriate
                  context and tracking query status transitions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}