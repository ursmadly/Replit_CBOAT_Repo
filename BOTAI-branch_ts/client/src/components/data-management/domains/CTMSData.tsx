import { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertCircle,
  Building2,
  Filter,
  FileText,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Trash2,
  Clipboard,
  BarChart
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

interface CTMSDataProps {
  studyId: number;
  vendor: string;
}

interface SiteData {
  id: string;
  name: string;
  status: "active" | "inactive" | "pending" | "suspended";
  investigators: string[];
  subjectCount: number;
  targetEnrollment: number;
  activationDate: string;
  country: string;
  city: string;
  performance: number;
}

interface VisitData {
  id: string;
  subjectId: string;
  visitName: string;
  scheduledDate: string;
  status: "completed" | "scheduled" | "missed" | "rescheduled";
  comments?: string;
}

interface EnrollmentData {
  weeks: string[];
  actual: number[];
  planned: number[];
}

interface DeviationData {
  id: string;
  site: string;
  category: string;
  description: string;
  reportDate: string;
  status: "pending" | "resolved" | "under-review";
  severity: "minor" | "major" | "critical";
}

// Generate mock data for the CTMS components
function generateSiteData(count: number = 8): SiteData[] {
  const countries = ["United States", "Canada", "United Kingdom", "Germany", "France", "Australia", "Japan", "Brazil"];
  const cities = {
    "United States": ["Boston", "New York", "San Francisco", "Chicago", "Los Angeles"],
    "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary"],
    "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
    "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt"],
    "France": ["Paris", "Lyon", "Marseille", "Bordeaux"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth"],
    "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama"],
    "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"]
  };
  const siteStatuses: ("active" | "inactive" | "pending" | "suspended")[] = ["active", "inactive", "pending", "suspended"];
  const investigators = [
    "Dr. Smith", "Dr. Johnson", "Dr. Williams", "Dr. Brown", "Dr. Jones", 
    "Dr. Garcia", "Dr. Miller", "Dr. Davis", "Dr. Rodriguez", "Dr. Martinez"
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const id = `SIT-${String(i + 1).padStart(3, '0')}`;
    const country = countries[Math.floor(Math.random() * countries.length)];
    const citiesInCountry = cities[country as keyof typeof cities];
    const city = citiesInCountry[Math.floor(Math.random() * citiesInCountry.length)];
    const status = Math.random() < 0.7 ? "active" : siteStatuses[Math.floor(Math.random() * siteStatuses.length)];
    const targetEnrollment = Math.floor(Math.random() * 30) + 10;
    const subjectCount = status === "active" ? Math.floor(Math.random() * targetEnrollment) : 0;
    const performance = Math.floor(Math.random() * 100);
    
    // Generate 1-3 investigators for the site
    const siteInvestigators = [];
    const investigatorCount = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < investigatorCount; j++) {
      siteInvestigators.push(investigators[Math.floor(Math.random() * investigators.length)]);
    }
    
    return {
      id,
      name: `${city} Medical Center`,
      status,
      investigators: siteInvestigators,
      subjectCount,
      targetEnrollment,
      activationDate: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      country,
      city,
      performance
    };
  });
}

function generateVisitData(count: number = 20): VisitData[] {
  const subjectIds = Array.from({ length: 10 }, (_, i) => `S-${String(i + 1).padStart(3, '0')}`);
  const visitNames = ["Screening", "Baseline", "Week 1", "Week 2", "Week 4", "Week 8", "Week 12", "End of Treatment"];
  const visitStatuses: ("completed" | "scheduled" | "missed" | "rescheduled")[] = ["completed", "scheduled", "missed", "rescheduled"];
  
  return Array.from({ length: count }, (_, i) => {
    const subjectId = subjectIds[Math.floor(Math.random() * subjectIds.length)];
    const visitName = visitNames[Math.floor(Math.random() * visitNames.length)];
    const status = visitStatuses[Math.floor(Math.random() * visitStatuses.length)];
    
    return {
      id: `VIS-${i + 1}`,
      subjectId,
      visitName,
      scheduledDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status,
      comments: status === "missed" || status === "rescheduled" ? "Patient unavailable due to illness" : undefined
    };
  });
}

function generateEnrollmentData(): EnrollmentData {
  // Generate enrollment data for the past 12 weeks
  const weeks: string[] = [];
  const actual: number[] = [];
  const planned: number[] = [];
  let totalActual = 0;
  let totalPlanned = 0;
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setDate(date.getDate() - ((11 - i) * 7));
    weeks.push(`Week ${i + 1}`);
    
    // Generate planned enrollment - increases over time
    const plannedForWeek = Math.floor(Math.random() * 3) + 1;
    totalPlanned += plannedForWeek;
    planned.push(totalPlanned);
    
    // Generate actual enrollment - starts below plan but catches up
    const actualForWeek = i < 6 
      ? Math.max(0, Math.floor(plannedForWeek * (0.5 + (i * 0.1))))
      : Math.floor(plannedForWeek * (1 + (Math.random() * 0.3)));
    totalActual += actualForWeek;
    actual.push(totalActual);
  }
  
  return { weeks, actual, planned };
}

function generateDeviationData(count: number = 10): DeviationData[] {
  const sites = generateSiteData(8);
  const categories = [
    "Protocol Deviation", 
    "Informed Consent", 
    "Eligibility Criteria", 
    "Adverse Event Reporting", 
    "Study Procedures",
    "Medication Compliance",
    "Visit Schedule",
    "Data Collection"
  ];
  const descriptions = [
    "Visit conducted outside of protocol window",
    "Incomplete documentation of informed consent process",
    "Subject enrolled despite not meeting inclusion criteria",
    "Delayed reporting of serious adverse event",
    "Required study procedure not performed",
    "Incorrect dosage administered",
    "Subject missed scheduled visit",
    "Source data not properly documented"
  ];
  const statuses: ("pending" | "resolved" | "under-review")[] = ["pending", "resolved", "under-review"];
  const severities: ("minor" | "major" | "critical")[] = ["minor", "major", "critical"];
  
  return Array.from({ length: count }, (_, i) => {
    const categoryIndex = Math.floor(Math.random() * categories.length);
    const site = sites[Math.floor(Math.random() * sites.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let severity: "minor" | "major" | "critical";
    // Weight the severity based on category
    if (["Adverse Event Reporting", "Eligibility Criteria"].includes(categories[categoryIndex])) {
      severity = Math.random() < 0.7 ? "major" : "critical";
    } else if (["Protocol Deviation", "Informed Consent"].includes(categories[categoryIndex])) {
      severity = Math.random() < 0.5 ? "major" : "minor";
    } else {
      severity = Math.random() < 0.7 ? "minor" : "major";
    }
    
    return {
      id: `DEV-${i + 1}`,
      site: site.name,
      category: categories[categoryIndex],
      description: descriptions[categoryIndex],
      reportDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status,
      severity
    };
  });
}

export function CTMSData({ studyId, vendor }: CTMSDataProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("sites");
  
  // Generate mock data
  const sites = generateSiteData();
  const visits = generateVisitData();
  const enrollmentData = generateEnrollmentData();
  const deviations = generateDeviationData();
  
  // Filter sites based on search query and status filter
  const filteredSites = sites.filter(site => {
    // Check if any field contains the search query
    const matchesSearch = 
      site.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if status matches the filter
    const matchesStatus = 
      statusFilter === "all" || site.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Filter visits based on search query and status filter
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.subjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.visitName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || visit.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Filter deviations based on search query and status filter
  const filteredDeviations = deviations.filter(deviation => {
    const matchesSearch = 
      deviation.site.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviation.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deviation.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || deviation.status === statusFilter || 
      (statusFilter === "critical" && deviation.severity === "critical");
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate site statistics
  const siteStats = {
    total: sites.length,
    active: sites.filter(s => s.status === "active").length,
    pending: sites.filter(s => s.status === "pending").length,
    inactive: sites.filter(s => s.status === "inactive").length,
    suspended: sites.filter(s => s.status === "suspended").length
  };
  
  // Calculate visit statistics
  const visitStats = {
    total: visits.length,
    completed: visits.filter(v => v.status === "completed").length,
    scheduled: visits.filter(v => v.status === "scheduled").length,
    missed: visits.filter(v => v.status === "missed").length,
    rescheduled: visits.filter(v => v.status === "rescheduled").length
  };
  
  // Calculate deviation statistics
  const deviationStats = {
    total: deviations.length,
    minor: deviations.filter(d => d.severity === "minor").length,
    major: deviations.filter(d => d.severity === "major").length,
    critical: deviations.filter(d => d.severity === "critical").length,
    pending: deviations.filter(d => d.status === "pending").length,
    resolved: deviations.filter(d => d.status === "resolved").length
  };
  
  // Function to render site status badge
  const renderSiteStatusBadge = (status: "active" | "inactive" | "pending" | "suspended") => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Active</span>
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Inactive</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case "suspended":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Suspended</span>
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Function to render visit status badge
  const renderVisitStatusBadge = (status: "completed" | "scheduled" | "missed" | "rescheduled") => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Scheduled</span>
          </Badge>
        );
      case "missed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>Missed</span>
          </Badge>
        );
      case "rescheduled":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Rescheduled</span>
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Function to render deviation severity badge
  const renderDeviationSeverityBadge = (severity: "minor" | "major" | "critical") => {
    switch (severity) {
      case "minor":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Minor
          </Badge>
        );
      case "major":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Major
          </Badge>
        );
      case "critical":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
            Critical
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Function to render deviation status badge
  const renderDeviationStatusBadge = (status: "pending" | "resolved" | "under-review") => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Pending
          </Badge>
        );
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">
            Resolved
          </Badge>
        );
      case "under-review":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Under Review
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="visits">Subject Visits</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="deviations">Protocol Deviations</TabsTrigger>
        </TabsList>
        
        {/* Sites Tab */}
        <TabsContent value="sites" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card className="p-3 flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground">Total Sites</span>
              <span className="text-2xl font-semibold">{siteStats.total}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-green-50">
              <span className="text-sm text-green-700">Active</span>
              <span className="text-2xl font-semibold text-green-700">{siteStats.active}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-amber-50">
              <span className="text-sm text-amber-700">Pending</span>
              <span className="text-2xl font-semibold text-amber-700">{siteStats.pending}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-gray-50">
              <span className="text-sm text-gray-700">Inactive</span>
              <span className="text-2xl font-semibold text-gray-700">{siteStats.inactive}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-red-50">
              <span className="text-sm text-red-700">Suspended</span>
              <span className="text-2xl font-semibold text-red-700">{siteStats.suspended}</span>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search sites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                Sites for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Site ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Investigators</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSites.length > 0 ? (
                  filteredSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.id}</TableCell>
                      <TableCell>{site.name}</TableCell>
                      <TableCell>{`${site.city}, ${site.country}`}</TableCell>
                      <TableCell>{renderSiteStatusBadge(site.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {site.investigators.map((investigator, idx) => (
                            <span key={idx} className="text-sm">{investigator}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{site.subjectCount}</span>
                          <span className="text-muted-foreground">/ {site.targetEnrollment}</span>
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(site.subjectCount / site.targetEnrollment * 100)}%)
                          </span>
                        </div>
                        <Progress
                          value={(site.subjectCount / site.targetEnrollment) * 100}
                          className="h-2 mt-1"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            site.performance >= 80 ? "text-green-600" :
                            site.performance >= 60 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {site.performance}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No sites found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Card className="p-3 flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground">Total Visits</span>
              <span className="text-2xl font-semibold">{visitStats.total}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-green-50">
              <span className="text-sm text-green-700">Completed</span>
              <span className="text-2xl font-semibold text-green-700">{visitStats.completed}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-blue-50">
              <span className="text-sm text-blue-700">Scheduled</span>
              <span className="text-2xl font-semibold text-blue-700">{visitStats.scheduled}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-red-50">
              <span className="text-sm text-red-700">Missed</span>
              <span className="text-2xl font-semibold text-red-700">{visitStats.missed}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-amber-50">
              <span className="text-sm text-amber-700">Rescheduled</span>
              <span className="text-2xl font-semibold text-amber-700">{visitStats.rescheduled}</span>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search visits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Visits</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                Subject visits for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit ID</TableHead>
                  <TableHead>Subject ID</TableHead>
                  <TableHead>Visit Name</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Comments</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.length > 0 ? (
                  filteredVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-medium">{visit.id}</TableCell>
                      <TableCell>{visit.subjectId}</TableCell>
                      <TableCell>{visit.visitName}</TableCell>
                      <TableCell>{visit.scheduledDate}</TableCell>
                      <TableCell>{renderVisitStatusBadge(visit.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {visit.comments || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No visits found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Enrollment Tab */}
        <TabsContent value="enrollment">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Progress</CardTitle>
                <CardDescription>
                  Subject enrollment tracking for the study
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-60 border rounded-md bg-gray-50">
                  <BarChart className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-sm text-center max-w-md text-muted-foreground">
                    Enrollment chart visualization would appear here, showing actual vs planned enrollment
                    over time, with projection lines and site-specific breakdowns.
                  </p>
                </div>
                
                <div className="mt-4 rounded-md border">
                  <Table>
                    <TableCaption>Enrollment Data - Planned vs. Actual</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time Period</TableHead>
                        <TableHead className="text-right">Planned</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                        <TableHead className="text-right">% of Target</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrollmentData.weeks.map((week, i) => (
                        <TableRow key={week}>
                          <TableCell className="font-medium">{week}</TableCell>
                          <TableCell className="text-right">{enrollmentData.planned[i]}</TableCell>
                          <TableCell className="text-right">{enrollmentData.actual[i]}</TableCell>
                          <TableCell className="text-right">
                            <span className={
                              enrollmentData.actual[i] >= enrollmentData.planned[i]
                                ? "text-green-600"
                                : "text-red-600"
                            }>
                              {enrollmentData.actual[i] - enrollmentData.planned[i]}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {Math.round((enrollmentData.actual[i] / enrollmentData.planned[enrollmentData.planned.length - 1]) * 100)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Protocol Deviations Tab */}
        <TabsContent value="deviations" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <Card className="p-3 flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-semibold">{deviationStats.total}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-blue-50">
              <span className="text-sm text-blue-700">Minor</span>
              <span className="text-2xl font-semibold text-blue-700">{deviationStats.minor}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-amber-50">
              <span className="text-sm text-amber-700">Major</span>
              <span className="text-2xl font-semibold text-amber-700">{deviationStats.major}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-red-50">
              <span className="text-sm text-red-700">Critical</span>
              <span className="text-2xl font-semibold text-red-700">{deviationStats.critical}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-amber-50">
              <span className="text-sm text-amber-700">Pending</span>
              <span className="text-2xl font-semibold text-amber-700">{deviationStats.pending}</span>
            </Card>
            <Card className="p-3 flex flex-col items-center justify-center bg-green-50">
              <span className="text-sm text-green-700">Resolved</span>
              <span className="text-2xl font-semibold text-green-700">{deviationStats.resolved}</span>
            </Card>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search deviations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <span className="absolute left-2.5 top-2.5 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </span>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deviations</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon">
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableCaption>
                Protocol deviations for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Report Date</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeviations.length > 0 ? (
                  filteredDeviations.map((deviation) => (
                    <TableRow key={deviation.id}>
                      <TableCell className="font-medium">{deviation.id}</TableCell>
                      <TableCell>{deviation.site}</TableCell>
                      <TableCell>{deviation.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{deviation.description}</TableCell>
                      <TableCell>{deviation.reportDate}</TableCell>
                      <TableCell>{renderDeviationSeverityBadge(deviation.severity)}</TableCell>
                      <TableCell>{renderDeviationStatusBadge(deviation.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No deviations found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}