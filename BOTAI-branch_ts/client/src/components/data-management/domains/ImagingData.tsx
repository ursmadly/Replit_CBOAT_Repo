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
  Image,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
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

interface ImagingDataProps {
  studyId: number;
  vendor: string;
}

interface ImagingModality {
  id: string;
  name: string;
  description: string;
  images: number;
  pending: number;
  qcFailed: number;
}

interface ImagingStudy {
  id: string;
  subjectId: string;
  visitName: string;
  visitDate: string;
  modality: string;
  body: string;
  status: "completed" | "pending" | "qc-failed" | "transferred";
  qcStatus: "passed" | "failed" | "pending";
  reviewer: string;
  additionalInfo?: string;
}

function generateImagingStudies(count: number = 10): ImagingStudy[] {
  const subjectIds = Array.from({ length: 10 }, (_, i) => `S-${String(i + 1).padStart(3, '0')}`);
  const visitNames = ["Screening", "Baseline", "Week 4", "Week 12", "End of Treatment"];
  const modalities = ["MRI", "CT", "X-Ray", "Ultrasound", "PET"];
  const bodyParts = ["Brain", "Chest", "Abdomen", "Pelvis", "Spine", "Knee", "Heart"];
  const reviewers = ["Dr. Smith", "Dr. Johnson", "Dr. Williams", "Dr. Brown", "Dr. Davis"];
  const statuses: ("completed" | "pending" | "qc-failed" | "transferred")[] = ["completed", "pending", "qc-failed", "transferred"];
  const qcStatuses: ("passed" | "failed" | "pending")[] = ["passed", "failed", "pending"];
  
  return Array.from({ length: count }, (_, i) => {
    const subjectId = subjectIds[Math.floor(Math.random() * subjectIds.length)];
    const visitName = visitNames[Math.floor(Math.random() * visitNames.length)];
    const modality = modalities[Math.floor(Math.random() * modalities.length)];
    const body = bodyParts[Math.floor(Math.random() * bodyParts.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    // Make QC status more likely to be passed
    let qcStatus: "passed" | "failed" | "pending";
    if (status === "completed") {
      qcStatus = Math.random() > 0.2 ? "passed" : "failed";
    } else if (status === "pending") {
      qcStatus = "pending";
    } else {
      qcStatus = qcStatuses[Math.floor(Math.random() * qcStatuses.length)];
    }
    
    return {
      id: `IMG-${i + 1}`,
      subjectId,
      visitName,
      visitDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      modality,
      body,
      status,
      qcStatus,
      reviewer: reviewers[Math.floor(Math.random() * reviewers.length)],
      additionalInfo: Math.random() > 0.7 ? "Additional notes about the imaging study" : undefined
    };
  });
}

export function ImagingData({ studyId, vendor }: ImagingDataProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("studies");
  
  // Generate mock data
  const imagingStudies = generateImagingStudies(15);
  
  // Define imaging modalities
  const imagingModalities: ImagingModality[] = [
    {
      id: "mri",
      name: "MRI",
      description: "Magnetic Resonance Imaging",
      images: imagingStudies.filter(s => s.modality === "MRI").length,
      pending: imagingStudies.filter(s => s.modality === "MRI" && s.status === "pending").length,
      qcFailed: imagingStudies.filter(s => s.modality === "MRI" && s.qcStatus === "failed").length
    },
    {
      id: "ct",
      name: "CT",
      description: "Computed Tomography",
      images: imagingStudies.filter(s => s.modality === "CT").length,
      pending: imagingStudies.filter(s => s.modality === "CT" && s.status === "pending").length,
      qcFailed: imagingStudies.filter(s => s.modality === "CT" && s.qcStatus === "failed").length
    },
    {
      id: "xray",
      name: "X-Ray",
      description: "Radiography",
      images: imagingStudies.filter(s => s.modality === "X-Ray").length,
      pending: imagingStudies.filter(s => s.modality === "X-Ray" && s.status === "pending").length,
      qcFailed: imagingStudies.filter(s => s.modality === "X-Ray" && s.qcStatus === "failed").length
    },
    {
      id: "ultrasound",
      name: "Ultrasound",
      description: "Sonography",
      images: imagingStudies.filter(s => s.modality === "Ultrasound").length,
      pending: imagingStudies.filter(s => s.modality === "Ultrasound" && s.status === "pending").length,
      qcFailed: imagingStudies.filter(s => s.modality === "Ultrasound" && s.qcStatus === "failed").length
    },
    {
      id: "pet",
      name: "PET",
      description: "Positron Emission Tomography",
      images: imagingStudies.filter(s => s.modality === "PET").length,
      pending: imagingStudies.filter(s => s.modality === "PET" && s.status === "pending").length,
      qcFailed: imagingStudies.filter(s => s.modality === "PET" && s.qcStatus === "failed").length
    }
  ];
  
  // Filter studies based on search query and status filter
  const filteredStudies = imagingStudies.filter(study => {
    // Check if any field contains the search query
    const matchesSearch = 
      study.subjectId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.visitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.modality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if status matches the filter
    const matchesStatus = 
      statusFilter === "all" || 
      study.status === statusFilter || 
      (statusFilter === "qc-issues" && study.qcStatus === "failed");
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate statistics
  const stats = {
    total: imagingStudies.length,
    completed: imagingStudies.filter(s => s.status === "completed").length,
    pending: imagingStudies.filter(s => s.status === "pending").length,
    qcFailed: imagingStudies.filter(s => s.qcStatus === "failed").length,
    transfered: imagingStudies.filter(s => s.status === "transferred").length
  };
  
  // Function to render status badge
  const renderStatusBadge = (status: "completed" | "pending" | "qc-failed" | "transferred") => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            <span>Completed</span>
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case "qc-failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            <span>QC Failed</span>
          </Badge>
        );
      case "transferred":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Transferred</span>
          </Badge>
        );
      default:
        return null;
    }
  };
  
  // Function to render QC status
  const renderQCStatus = (status: "passed" | "failed" | "pending") => {
    switch (status) {
      case "passed":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Passed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200">
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Pending
          </Badge>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Imaging Data Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Card className="p-3 flex flex-col items-center justify-center">
          <span className="text-sm text-muted-foreground">Total Studies</span>
          <span className="text-2xl font-semibold">{stats.total}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-green-50">
          <span className="text-sm text-green-700">Completed</span>
          <span className="text-2xl font-semibold text-green-700">{stats.completed}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-amber-50">
          <span className="text-sm text-amber-700">Pending</span>
          <span className="text-2xl font-semibold text-amber-700">{stats.pending}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-red-50">
          <span className="text-sm text-red-700">QC Failed</span>
          <span className="text-2xl font-semibold text-red-700">{stats.qcFailed}</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center bg-blue-50">
          <span className="text-sm text-blue-700">Transferred</span>
          <span className="text-2xl font-semibold text-blue-700">{stats.transfered}</span>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="studies">Imaging Studies</TabsTrigger>
          <TabsTrigger value="modalities">Modalities</TabsTrigger>
          <TabsTrigger value="qc">QC Metrics</TabsTrigger>
        </TabsList>
        
        {/* Imaging Studies Tab */}
        <TabsContent value="studies" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Input
                placeholder="Search studies..."
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
                  <SelectItem value="all">All Studies</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="qc-failed">QC Failed</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="qc-issues">QC Issues</SelectItem>
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
                Imaging studies for Study {studyId > 0 ? studyId : "All"} {vendor ? `- ${vendor}` : ""}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Study ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Visit</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Body Part</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>QC Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudies.length > 0 ? (
                  filteredStudies.map((study) => (
                    <TableRow key={study.id}>
                      <TableCell className="font-medium">{study.id}</TableCell>
                      <TableCell>{study.subjectId}</TableCell>
                      <TableCell>{study.visitName}</TableCell>
                      <TableCell>{study.modality}</TableCell>
                      <TableCell>{study.body}</TableCell>
                      <TableCell>{renderStatusBadge(study.status)}</TableCell>
                      <TableCell>{renderQCStatus(study.qcStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      No imaging studies found matching your criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        {/* Modalities Tab */}
        <TabsContent value="modalities">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imagingModalities.map((modality) => (
              <Card key={modality.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-blue-500" />
                    {modality.name}
                  </CardTitle>
                  <CardDescription>{modality.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Total Studies</span>
                        <span className="font-medium">{modality.images}</span>
                      </div>
                      <Progress value={modality.images > 0 ? 100 : 0} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Pending</span>
                        <span className="text-amber-600 font-medium">{modality.pending}</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div 
                          className="h-full bg-amber-500 transition-all"
                          style={{ 
                            width: `${modality.images > 0 ? (modality.pending / modality.images * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>QC Failed</span>
                        <span className="text-red-600 font-medium">{modality.qcFailed}</span>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div 
                          className="h-full bg-red-500 transition-all"
                          style={{ 
                            width: `${modality.images > 0 ? (modality.qcFailed / modality.images * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View {modality.name} Studies
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* QC Metrics Tab */}
        <TabsContent value="qc">
          <Card>
            <CardHeader>
              <CardTitle>Quality Control Metrics</CardTitle>
              <CardDescription>
                Performance metrics for imaging quality control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold">
                        {Math.round((stats.completed - stats.qcFailed) / stats.completed * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">QC Pass Rate</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold">
                        {stats.qcFailed}
                      </div>
                      <div className="text-sm text-muted-foreground">Failed QC Studies</div>
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex flex-col items-center">
                      <div className="text-2xl font-bold">
                        {stats.pending}
                      </div>
                      <div className="text-sm text-muted-foreground">Pending QC Review</div>
                    </div>
                  </Card>
                </div>
                
                <div className="flex flex-col items-center justify-center h-60 border rounded-md bg-gray-50">
                  <BarChart className="h-8 w-8 text-blue-500 mb-2" />
                  <p className="text-sm text-center max-w-md text-muted-foreground">
                    QC metrics visualization would appear here, showing trends in imaging quality,
                    common failure reasons, and reviewer performance statistics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}