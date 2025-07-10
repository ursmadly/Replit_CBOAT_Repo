import React from "react";
import { Link } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  ChevronRight, 
  BarChart3, 
  FlaskConical, 
  FileText, 
  Bell, 
  Users, 
  Database, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlarmClock, 
  ArrowUpCircle, 
  Award, 
  ExternalLink,
  Microscope,
  FileSpreadsheet,
  MessagesSquare,
  ListChecks,
  Network,
  Flag,
  Eye,
  CircleDashed,
  AlertCircle,
  Link2,
  UserCheck
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Mock data for dashboard presentation
const studiesData = [
  { 
    id: 1, 
    name: "Diabetes Type 2 Study", 
    phase: "Phase III", 
    sites: 28, 
    subjects: 342, 
    progress: 76, 
    riskLevel: "Low", 
    description: "Investigating efficacy of GLP-1 receptor agonists in glycemic control for T2DM patients",
    primaryEndpoint: "HbA1c reduction at 26 weeks"
  },
  { 
    id: 2, 
    name: "Rheumatoid Arthritis Study", 
    phase: "Phase II", 
    sites: 15, 
    subjects: 187, 
    progress: 45, 
    riskLevel: "Medium",
    description: "Evaluation of JAK inhibitor in moderate to severe rheumatoid arthritis",
    primaryEndpoint: "ACR20 response rate at 12 weeks"
  },
  { 
    id: 3, 
    name: "Advanced Breast Cancer", 
    phase: "Phase III", 
    sites: 32, 
    subjects: 274, 
    progress: 28, 
    riskLevel: "High",
    description: "CDK4/6 inhibitor combination therapy in HR+/HER2- advanced breast cancer",
    primaryEndpoint: "Progression-free survival"
  },
  { 
    id: 4, 
    name: "Alzheimer's Disease", 
    phase: "Phase II", 
    sites: 12, 
    subjects: 156, 
    progress: 64, 
    riskLevel: "Low",
    description: "Beta-amyloid monoclonal antibody for early-stage Alzheimer's disease",
    primaryEndpoint: "Change in ADAS-Cog score at 78 weeks"
  }
];

const recentTasks = [
  { id: "T-123", title: "Review protocol deviation in Subject 1078", priority: "High", dueDate: "May 2, 2025", assignee: "J. Wilson", status: "In Progress" },
  { id: "T-124", title: "Verify vital signs data queries from Site 3", priority: "Medium", dueDate: "May 5, 2025", assignee: "M. Johnson", status: "Pending" },
  { id: "T-125", title: "Reconcile liver enzyme test discrepancies in Lab Results", priority: "High", dueDate: "May 1, 2025", assignee: "A. Martinez", status: "Overdue" },
  { id: "T-126", title: "Update risk-based monitoring plan for Boston site", priority: "Low", dueDate: "May 10, 2025", assignee: "S. Patel", status: "Completed" }
];

const recentQueries = [
  { id: "Q-101", title: "Missing vital signs data for Visit 3", site: "Boston Medical", subject: "1045", priority: "High", status: "Open" },
  { id: "Q-102", title: "Inconsistent ALT/AST values between visits", site: "NYC Research", subject: "2067", priority: "Medium", status: "In Progress" },
  { id: "Q-103", title: "Protocol deviation in medication dosing schedule", site: "Chicago Clinical", subject: "3012", priority: "Critical", status: "Escalated" },
  { id: "Q-104", title: "Adverse event follow-up documentation incomplete", site: "LA Medical Center", subject: "1098", priority: "Medium", status: "Resolved" }
];

const recentSignals = [
  { id: "SD-101", title: "Elevated liver enzymes trend across multiple subjects", type: "Safety", priority: "High", detectedDate: "Apr 28, 2025", domain: "LB" },
  { id: "SD-102", title: "Enrollment rate decline at Sites 3, 7, and 12", type: "Operational", priority: "Medium", detectedDate: "Apr 27, 2025", domain: "CTMS" },
  { id: "SD-103", title: "Missing ECG data pattern in 8% of subjects", type: "Data Quality", priority: "Medium", detectedDate: "Apr 29, 2025", domain: "ECG" },
  { id: "SD-104", title: "Protocol compliance issue with inclusion criteria", type: "Protocol", priority: "Critical", detectedDate: "Apr 30, 2025", domain: "DM" }
];

const integrations = [
  { name: "Medidata Rave EDC", status: "Connected", lastSync: "30 min ago", records: 4352, recordType: "CRF forms" },
  { name: "Veeva Vault CTMS", status: "Connected", lastSync: "1 hour ago", records: 1865, recordType: "Site activities" },
  { name: "TransPerfect TMF", status: "Connected", lastSync: "2 hours ago", records: 743, recordType: "Documents" },
  { name: "LabCorp Clinical Data", status: "Connected", lastSync: "45 min ago", records: 7891, recordType: "Lab results" },
  { name: "ICON Imaging", status: "Issue", lastSync: "Failed", records: 521, recordType: "Scans" },
  { name: "Almac IRT System", status: "Connected", lastSync: "3 hours ago", records: 958, recordType: "Drug assignments" }
];

// Clinical endpoints data
const clinicalEndpoints = [
  { name: "HbA1c Reduction", target: "≥ 1.0%", currentMean: "0.85%", status: "On Track", study: 1 },
  { name: "ACR20 Response", target: "≥ 60%", currentMean: "42%", status: "Monitoring", study: 2 },
  { name: "Progression-free Survival", target: "≥ 12 months", currentMean: "9.7 months", status: "Concern", study: 3 },
  { name: "ADAS-Cog Change", target: "≤ -3.5 points", currentMean: "-2.8 points", status: "On Track", study: 4 }
];

// Protocol deviations
const protocolDeviations = [
  { id: "PD-101", category: "Eligibility", description: "Subject enrolled outside inclusion criteria #4", site: "Boston Medical", impact: "Minor" },
  { id: "PD-102", category: "Treatment", description: "Missed dose on day 14±2", site: "NYC Research", impact: "Major" },
  { id: "PD-103", category: "Procedure", description: "Blood sample collected outside window", site: "Chicago Clinical", impact: "Minor" }
];

// Health metrics for overview cards
const healthMetrics = {
  dataQuality: 86,
  operationalMetrics: 72,
  safetyMetrics: 91,
  complianceMetrics: 83
};

// SDTM data domains with status
const dataDomains = [
  { domain: "DM", description: "Demographics", records: 959, mapped: 959, quality: 98 },
  { domain: "VS", description: "Vital Signs", records: 4782, mapped: 4782, quality: 93 },
  { domain: "LB", description: "Laboratory Tests", records: 12568, mapped: 12568, quality: 88 },
  { domain: "AE", description: "Adverse Events", records: 873, mapped: 873, quality: 95 },
  { domain: "CM", description: "Concomitant Medications", records: 1924, mapped: 1862, quality: 82 },
  { domain: "EX", description: "Exposure", records: 959, mapped: 959, quality: 97 }
];

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
            <p className="text-neutral-500 mt-1">Clinical Business Orchestration and AI Technology Platform</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Active Studies</p>
                  <h3 className="text-2xl font-bold mt-1">4</h3>
                  <div className="flex items-center mt-1 text-xs text-green-600">
                    <ArrowUpCircle className="h-3 w-3 mr-1" />
                    <span>1 new this month</span>
                  </div>
                </div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <FlaskConical className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Overall Progress</span>
                  <span className="font-medium">53%</span>
                </div>
                <Progress value={53} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Open Queries</p>
                  <h3 className="text-2xl font-bold mt-1">42</h3>
                  <div className="flex items-center mt-1 text-xs text-amber-600">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>8 requiring attention</span>
                  </div>
                </div>
                <div className="bg-indigo-100 p-2 rounded-full">
                  <MessagesSquare className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Response Rate</span>
                  <span className="font-medium">76%</span>
                </div>
                <Progress value={76} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Tasks</p>
                  <h3 className="text-2xl font-bold mt-1">27</h3>
                  <div className="flex items-center mt-1 text-xs text-red-600">
                    <AlarmClock className="h-3 w-3 mr-1" />
                    <span>5 overdue tasks</span>
                  </div>
                </div>
                <div className="bg-emerald-100 p-2 rounded-full">
                  <ListChecks className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Completion Rate</span>
                  <span className="font-medium">68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-rose-500">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-neutral-500">Signals Detected</p>
                  <h3 className="text-2xl font-bold mt-1">14</h3>
                  <div className="flex items-center mt-1 text-xs text-blue-600">
                    <Activity className="h-3 w-3 mr-1" />
                    <span>3 critical signals</span>
                  </div>
                </div>
                <div className="bg-rose-100 p-2 rounded-full">
                  <Flag className="h-5 w-5 text-rose-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span>Signal Resolution</span>
                  <span className="font-medium">62%</span>
                </div>
                <Progress value={62} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <div className="bg-blue-100 p-1.5 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Data Quality</Badge>
              </div>
              <h3 className="text-xl font-bold text-blue-700 mb-1">{healthMetrics.dataQuality}%</h3>
              <p className="text-xs text-blue-600/80">Overall data quality score</p>
              <Progress value={healthMetrics.dataQuality} className="h-1.5 mt-3 bg-blue-100" />
            </CardContent>
          </Card>
          
          <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <div className="bg-indigo-100 p-1.5 rounded-md">
                  <Activity className="h-4 w-4 text-indigo-600" />
                </div>
                <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Operational</Badge>
              </div>
              <h3 className="text-xl font-bold text-indigo-700 mb-1">{healthMetrics.operationalMetrics}%</h3>
              <p className="text-xs text-indigo-600/80">Site operational efficiency</p>
              <Progress value={healthMetrics.operationalMetrics} className="h-1.5 mt-3 bg-indigo-100" />
            </CardContent>
          </Card>
          
          <Card className="border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <div className="bg-emerald-100 p-1.5 rounded-md">
                  <Bell className="h-4 w-4 text-emerald-600" />
                </div>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Safety</Badge>
              </div>
              <h3 className="text-xl font-bold text-emerald-700 mb-1">{healthMetrics.safetyMetrics}%</h3>
              <p className="text-xs text-emerald-600/80">Protocol safety adherence</p>
              <Progress value={healthMetrics.safetyMetrics} className="h-1.5 mt-3 bg-emerald-100" />
            </CardContent>
          </Card>
          
          <Card className="border border-amber-100 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-4">
              <div className="flex justify-between mb-2">
                <div className="bg-amber-100 p-1.5 rounded-md">
                  <Award className="h-4 w-4 text-amber-600" />
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Compliance</Badge>
              </div>
              <h3 className="text-xl font-bold text-amber-700 mb-1">{healthMetrics.complianceMetrics}%</h3>
              <p className="text-xs text-amber-600/80">Regulatory compliance score</p>
              <Progress value={healthMetrics.complianceMetrics} className="h-1.5 mt-3 bg-amber-100" />
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Studies */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center">
                    <Microscope className="mr-2 h-5 w-5 text-blue-600" />
                    Clinical Studies
                  </CardTitle>
                  <Link href="/study-management">
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      View All Studies
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {studiesData.map((study) => (
                    <div 
                      key={study.id} 
                      className="p-4 rounded-lg border border-gray-100 hover:border-blue-100 bg-white hover:bg-blue-50/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-neutral-800">{study.name}</h3>
                          <p className="text-xs text-neutral-600 mt-1">{study.description}</p>
                          <div className="flex items-center text-sm text-neutral-500 mt-2">
                            <span className="mr-3">{study.phase}</span>
                            <span className="mr-3">{study.sites} sites</span>
                            <span>{study.subjects} subjects</span>
                          </div>
                        </div>
                        <Badge 
                          className={
                            study.riskLevel === "Low" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            study.riskLevel === "Medium" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                            "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {study.riskLevel} Risk
                        </Badge>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{study.progress}%</span>
                        </div>
                        <Progress 
                          value={study.progress} 
                          className={`h-2 ${
                            study.riskLevel === "Low" ? "bg-green-100" :
                            study.riskLevel === "Medium" ? "bg-amber-100" :
                            "bg-red-100"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <Button variant="outline" className="w-full">
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Create New Study
                </Button>
              </CardFooter>
            </Card>

            {/* Clinical Endpoints */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Eye className="mr-2 h-5 w-5 text-blue-600" />
                  Primary Endpoints
                </CardTitle>
                <CardDescription>
                  Current progress towards key clinical endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clinicalEndpoints.map((endpoint, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{endpoint.name}</p>
                          <p className="text-xs text-neutral-500">
                            {studiesData.find(s => s.id === endpoint.study)?.name}
                          </p>
                        </div>
                        <Badge 
                          className={
                            endpoint.status === "On Track" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                            endpoint.status === "Monitoring" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                            "bg-red-100 text-red-800 hover:bg-red-100"
                          }
                        >
                          {endpoint.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Target: {endpoint.target}</span>
                        <span>Current: {endpoint.currentMean}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tasks, Queries, Signals Tabs */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-lg">Recent Activities</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <Tabs defaultValue="tasks">
                  <TabsList className="grid grid-cols-3 mb-3">
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="queries">Queries</TabsTrigger>
                    <TabsTrigger value="signals">Signals</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="tasks" className="space-y-3">
                    {recentTasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {task.status === "Completed" ? (
                              <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                            ) : task.status === "Overdue" ? (
                              <div className="bg-red-100 p-2 rounded-full">
                                <Clock className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="bg-blue-100 p-2 rounded-full">
                                <ListChecks className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{task.id}</span>
                              <Badge 
                                className={`ml-2 text-xs ${
                                  task.priority === "High" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                  task.priority === "Medium" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                  "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                }`}
                                variant="secondary"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{task.title}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span>Due: {task.dueDate}</span>
                              <span className="mx-2">•</span>
                              <span>Assigned to: {task.assignee}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline" 
                          className={
                            task.status === "Completed" ? "border-green-200 text-green-800 bg-green-50" :
                            task.status === "Overdue" ? "border-red-200 text-red-800 bg-red-50" :
                            task.status === "In Progress" ? "border-blue-200 text-blue-800 bg-blue-50" :
                            "border-gray-200 text-gray-800 bg-gray-50"
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                    <div className="flex justify-center mt-2">
                      <Link href="/tasks">
                        <Button variant="outline" size="sm">View All Tasks</Button>
                      </Link>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="queries" className="space-y-3">
                    {recentQueries.map(query => (
                      <div key={query.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {query.status === "Resolved" ? (
                              <div className="bg-green-100 p-2 rounded-full">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              </div>
                            ) : query.status === "Escalated" ? (
                              <div className="bg-red-100 p-2 rounded-full">
                                <Bell className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="bg-indigo-100 p-2 rounded-full">
                                <MessagesSquare className="h-5 w-5 text-indigo-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{query.id}</span>
                              <Badge 
                                className={`ml-2 text-xs ${
                                  query.priority === "Critical" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                  query.priority === "High" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                  "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                }`}
                                variant="secondary"
                              >
                                {query.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{query.title}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span>Site: {query.site}</span>
                              <span className="mx-2">•</span>
                              <span>Subject: {query.subject}</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline" 
                          className={
                            query.status === "Resolved" ? "border-green-200 text-green-800 bg-green-50" :
                            query.status === "Escalated" ? "border-red-200 text-red-800 bg-red-50" :
                            query.status === "In Progress" ? "border-blue-200 text-blue-800 bg-blue-50" :
                            "border-gray-200 text-gray-800 bg-gray-50"
                          }
                        >
                          {query.status}
                        </Badge>
                      </div>
                    ))}
                    <div className="flex justify-center mt-2">
                      <Button variant="outline" size="sm">View All Queries</Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="signals" className="space-y-3">
                    {recentSignals.map(signal => (
                      <div key={signal.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {signal.type === "Safety" ? (
                              <div className="bg-red-100 p-2 rounded-full">
                                <Bell className="h-5 w-5 text-red-600" />
                              </div>
                            ) : signal.type === "Operational" ? (
                              <div className="bg-amber-100 p-2 rounded-full">
                                <Activity className="h-5 w-5 text-amber-600" />
                              </div>
                            ) : signal.type === "Data Quality" ? (
                              <div className="bg-blue-100 p-2 rounded-full">
                                <Database className="h-5 w-5 text-blue-600" />
                              </div>
                            ) : (
                              <div className="bg-purple-100 p-2 rounded-full">
                                <Flag className="h-5 w-5 text-purple-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{signal.id}</span>
                              <Badge 
                                className={`ml-2 text-xs ${
                                  signal.priority === "Critical" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                                  signal.priority === "High" ? "bg-amber-100 text-amber-800 hover:bg-amber-100" :
                                  "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                }`}
                                variant="secondary"
                              >
                                {signal.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-700">{signal.title}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span>Type: {signal.type}</span>
                              <span className="mx-2">•</span>
                              <span>Domain: {signal.domain}</span>
                              <span className="mx-2">•</span>
                              <span>Detected: {signal.detectedDate}</span>
                            </div>
                          </div>
                        </div>
                        <Link href="/signal-detection">
                          <Button size="sm" variant="ghost">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                    <div className="flex justify-center mt-2">
                      <Link href="/signal-detection">
                        <Button variant="outline" size="sm">View All Signals</Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Integrations and Widgets */}
          <div className="space-y-6">
            {/* Protocol Deviations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-blue-600" />
                  Protocol Deviations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {protocolDeviations.map((deviation, index) => (
                    <div key={index} className="flex items-center p-3 border rounded-lg hover:bg-slate-50">
                      <div className="mr-3">
                        <div className={`p-2 rounded-full ${
                          deviation.impact === "Major" ? "bg-red-100" : "bg-amber-100"
                        }`}>
                          <CircleDashed className={`h-4 w-4 ${
                            deviation.impact === "Major" ? "text-red-600" : "text-amber-600"
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{deviation.id}: {deviation.category}</p>
                          <Badge 
                            className={
                              deviation.impact === "Major" 
                                ? "bg-red-100 text-red-800 hover:bg-red-100" 
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                            }
                          >
                            {deviation.impact}
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">{deviation.description}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">Site: {deviation.site}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data Domains */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Database className="mr-2 h-5 w-5 text-blue-600" />
                  SDTM Domains
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dataDomains.map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border-b last:border-0">
                      <div>
                        <div className="flex items-center">
                          <div className="bg-blue-100 rounded p-1 mr-2">
                            <span className="text-xs font-semibold text-blue-700">{domain.domain}</span>
                          </div>
                          <span className="text-sm">{domain.description}</span>
                        </div>
                        <div className="flex mt-1 text-xs text-gray-500">
                          <span>{domain.records.toLocaleString()} records</span>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        <span className={domain.quality >= 90 ? "text-green-600" : domain.quality >= 80 ? "text-amber-600" : "text-red-600"}>
                          {domain.quality}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href="/trial-data-management">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Manage Data
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Integrations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Network className="mr-2 h-5 w-5 text-blue-600" />
                  Data Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {integrations.map((integration, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                      <div className="flex items-center">
                        <div className="mr-3">
                          <div className={`p-2 rounded-full ${
                            integration.status === "Connected" ? "bg-green-100" : "bg-red-100"
                          }`}>
                            <Link2 className={`h-4 w-4 ${
                              integration.status === "Connected" ? "text-green-600" : "text-red-600"
                            }`} />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{integration.name}</p>
                          <div className="flex items-center mt-0.5">
                            <span className={`text-xs ${
                              integration.status === "Connected" ? "text-green-600" : "text-red-600"
                            }`}>
                              {integration.status}
                            </span>
                            {integration.status === "Connected" && (
                              <>
                                <span className="mx-1.5 text-neutral-300">•</span>
                                <span className="text-xs text-neutral-500">{integration.lastSync}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-neutral-700">{integration.records.toLocaleString()}</span>
                        <p className="text-xs text-neutral-500">{integration.recordType}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-3">
                <Link href="/data-integration">
                  <Button variant="outline" className="w-full">
                    <Network className="mr-2 h-4 w-4" />
                    Manage Integrations
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Team Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">JW</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Jennifer Wilson</p>
                      <p className="text-xs text-neutral-500">Resolved 3 data queries for Laboratory data at Site 4</p>
                      <p className="text-xs text-neutral-400 mt-1">35 minutes ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-indigo-100 text-indigo-600">MP</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Michael Park</p>
                      <p className="text-xs text-neutral-500">Created a new signal detection rule for AE patterns</p>
                      <p className="text-xs text-neutral-400 mt-1">1 hour ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-amber-100 text-amber-600">SP</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Sarah Patel</p>
                      <p className="text-xs text-neutral-500">Updated risk-based monitoring plan for Boston site</p>
                      <p className="text-xs text-neutral-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-green-100 text-green-600">AM</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Alex Martinez</p>
                      <p className="text-xs text-neutral-500">Completed clinical data reconciliation for Chicago site</p>
                      <p className="text-xs text-neutral-400 mt-1">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}