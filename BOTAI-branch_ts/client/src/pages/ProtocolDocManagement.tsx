import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Download,
  Eye,
  File,
  FileText,
  FileDigit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  FileScan,
  FileCheck,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AppLayout from "@/components/layout/AppLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Demo document types
const documentTypes = [
  "Protocol",
  "Protocol Amendment",
  "Investigator Brochure",
  "Safety Report",
  "Statistical Analysis Plan",
  "Clinical Study Report",
  "Regulatory Submission",
  "Quality Manual",
  "Standard Operating Procedure"
];

// Demo studies
const studies = [
  { id: 1, protocol: "PRO001", title: "Diabetes Type 2 Phase III Trial" },
  { id: 2, protocol: "PRO002", title: "Rheumatoid Arthritis Phase II Study" },
  { id: 3, protocol: "PRO003", title: "Advanced Breast Cancer Trial" },
  { id: 4, protocol: "PRO004", title: "Alzheimer's Disease Biomarker Study" }
];

// Demo document data
const documentData = [
  {
    id: 1,
    name: "PRO001_Protocol_v1.0.pdf",
    type: "Protocol",
    study: "PRO001",
    version: "1.0",
    status: "Approved",
    uploadDate: "2023-08-15",
    uploadedBy: "Sarah Johnson",
    size: "3.2 MB"
  },
  {
    id: 2,
    name: "PRO001_Protocol_v2.0.pdf",
    type: "Protocol",
    study: "PRO001",
    version: "2.0",
    status: "Draft",
    uploadDate: "2023-09-22",
    uploadedBy: "Thomas Lee",
    size: "3.5 MB"
  },
  {
    id: 3,
    name: "PRO001_Statistical_Analysis_Plan_v1.0.pdf",
    type: "Statistical Analysis Plan",
    study: "PRO001",
    version: "1.0",
    status: "In Review",
    uploadDate: "2023-09-12",
    uploadedBy: "Maria Rodriguez",
    size: "1.8 MB"
  },
  {
    id: 4,
    name: "PRO002_Protocol_v1.0.pdf",
    type: "Protocol",
    study: "PRO002",
    version: "1.0",
    status: "Approved",
    uploadDate: "2023-07-10",
    uploadedBy: "David Wilson",
    size: "2.9 MB"
  },
  {
    id: 5,
    name: "PRO002_Investigator_Brochure_v3.2.pdf",
    type: "Investigator Brochure",
    study: "PRO002",
    version: "3.2",
    status: "Approved",
    uploadDate: "2023-08-05",
    uploadedBy: "Jennifer Smith",
    size: "5.1 MB"
  },
  {
    id: 6,
    name: "PRO003_Protocol_v1.0.pdf",
    type: "Protocol",
    study: "PRO003",
    version: "1.0",
    status: "Approved",
    uploadDate: "2023-06-30",
    uploadedBy: "Robert Brown",
    size: "3.7 MB"
  },
  {
    id: 7,
    name: "PRO003_Protocol_Amendment_v1.1.pdf",
    type: "Protocol Amendment",
    study: "PRO003",
    version: "1.1",
    status: "In Review",
    uploadDate: "2023-09-18",
    uploadedBy: "Emma Davis",
    size: "1.2 MB"
  },
  {
    id: 8,
    name: "RBQM_SOP_Document_Management_v2.1.pdf",
    type: "Standard Operating Procedure",
    study: null,
    version: "2.1",
    status: "Approved",
    uploadDate: "2023-05-12",
    uploadedBy: "Michael Chen",
    size: "2.3 MB"
  },
  {
    id: 9,
    name: "Quality_Manual_2023_v1.0.pdf",
    type: "Quality Manual",
    study: null,
    version: "1.0",
    status: "Approved",
    uploadDate: "2023-01-15",
    uploadedBy: "John Carter",
    size: "4.6 MB"
  }
];

// Protocol section types
interface ProtocolSection {
  title: string;
  content: string;
}

// Sample protocol sections
const protocolSections = [
  { title: "Study Title", content: "" },
  { title: "Protocol ID", content: "" },
  { title: "Study Phase", content: "" },
  { title: "Background", content: "" },
  { title: "Objectives", content: "" },
  { title: "Study Design", content: "" },
  { title: "Study Population", content: "" },
  { title: "Inclusion Criteria", content: "" },
  { title: "Exclusion Criteria", content: "" },
  { title: "Treatment Plan", content: "" },
  { title: "Endpoints", content: "" },
  { title: "Statistical Considerations", content: "" },
  { title: "Safety Assessments", content: "" },
  { title: "Data Management", content: "" },
  { title: "Ethical Considerations", content: "" }
];

const ProtocolDocManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDigitizeDialog, setShowDigitizeDialog] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'complete' | 'error'>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [sections, setSections] = useState<ProtocolSection[]>(protocolSections);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("study-specific");

  // Process protocol document with OpenAI
  const digitizeProtocolMutation = useMutation({
    mutationFn: async (file: File) => {
      // In a real implementation, we would:
      // 1. Upload the file to the server
      // 2. Extract text from the document (PDF/Word)
      // 3. Process it with OpenAI
      
      // For demo purposes, we'll use a simulated document text for PRO-001
      // In a real implementation, we would extract text from the uploaded file
      
      // Simulate extracting text from file
      const readFileAsText = () => {
        return new Promise<string>((resolve) => {
          // Simulate progress
          let progress = 0;
          const updateProgress = () => {
            progress += 5;
            setProcessingProgress(progress);
            
            if (progress < 30) {
              setTimeout(updateProgress, 100);
            } else {
              // This is where we would actually read the file
              // For demo, return sample protocol text
              resolve(`
                CLINICAL PROTOCOL SUMMARY
                
                TITLE: A Phase III, Double-Blind, Randomized Study of Anti-PD-1 Monoclonal Antibody in Patients with Advanced Melanoma
                
                PROTOCOL ID: PRO-001-MEL
                
                PHASE: Phase III
                
                BACKGROUND:
                Melanoma is the most aggressive form of skin cancer. While early-stage melanoma is highly curable with surgical resection, advanced melanoma has historically had a poor prognosis with limited treatment options and low survival rates. Recent advances in immunotherapy, particularly immune checkpoint inhibitors targeting PD-1/PD-L1 pathway, have shown promising results in clinical trials.
                
                OBJECTIVES:
                Primary Objective: To evaluate the efficacy of Anti-PD-1 monoclonal antibody compared to standard chemotherapy in terms of overall survival (OS) and progression-free survival (PFS) in patients with advanced melanoma.
                
                Secondary Objectives:
                - Assess objective response rate (ORR)
                - Evaluate duration of response
                - Assess safety and tolerability
                - Evaluate quality of life measures
                
                STUDY DESIGN:
                This is a Phase III, multicenter, randomized, double-blind, controlled study comparing Anti-PD-1 monoclonal antibody to standard chemotherapy in patients with advanced melanoma who have not received prior systemic therapy. Approximately 600 patients will be randomized in a 1:1 ratio to receive either Anti-PD-1 or chemotherapy.
                
                STUDY POPULATION:
                Adult patients (≥18 years) with histologically confirmed, unresectable Stage III or Stage IV melanoma.
                
                INCLUSION CRITERIA:
                1. Histologically confirmed, unresectable Stage III or Stage IV melanoma
                2. Age ≥18 years
                3. ECOG performance status 0-1
                4. Adequate organ function
                5. Measurable disease per RECIST v1.1
                6. No prior systemic therapy for advanced melanoma
                
                EXCLUSION CRITERIA:
                1. Active autoimmune disease requiring systemic treatment
                2. Active central nervous system metastases
                3. Prior treatment with immune checkpoint inhibitors
                4. History of organ transplantation
                5. Concurrent anticancer therapy
                6. Active infection requiring systemic therapy
                
                TREATMENT PLAN:
                Patients randomized to the experimental arm will receive Anti-PD-1 10 mg/kg intravenously every 2 weeks until disease progression or unacceptable toxicity. Patients randomized to the control arm will receive standard chemotherapy according to institutional guidelines.
                
                ENDPOINTS:
                Primary Endpoints:
                - Overall Survival (OS)
                - Progression-Free Survival (PFS)
                
                Secondary Endpoints:
                - Objective Response Rate (ORR)
                - Duration of Response (DOR)
                - Safety and tolerability (adverse events graded according to CTCAE v5.0)
                - Quality of Life (measured by EORTC QLQ-C30)
                
                STATISTICAL CONSIDERATIONS:
                The study is designed to detect a hazard ratio of 0.7 for OS with 90% power and a two-sided alpha of 0.05, which corresponds to an increase in median OS from 11 months in the control arm to 15.7 months in the experimental arm. This requires approximately 600 patients (300 per arm) and 390 OS events.
                
                SAFETY ASSESSMENTS:
                Safety will be evaluated by assessment of adverse events, physical examinations, vital signs, laboratory tests, and ECGs. All adverse events will be graded according to CTCAE v5.0 and monitored from the first dose until 30 days after the last dose of study treatment.
                
                DATA MANAGEMENT:
                Data will be collected using electronic case report forms (eCRFs). Data management will be conducted according to the sponsor's standard operating procedures and GCP guidelines. A data monitoring committee (DMC) will be established to review safety data periodically.
                
                ETHICAL CONSIDERATIONS:
                The study will be conducted in accordance with the principles of the Declaration of Helsinki, GCP guidelines, and applicable regulatory requirements. All patients must provide written informed consent before any study-specific procedures are performed. The protocol and informed consent form must be approved by an institutional review board (IRB) or independent ethics committee (IEC).
              `);
            }
          };
          
          updateProgress();
        });
      };
      
      // Simulate file reading and text extraction
      const documentText = await readFileAsText();
      
      // Process with OpenAI API
      let progress = 30;
      const progressInterval = setInterval(() => {
        progress += 2;
        setProcessingProgress(Math.min(progress, 95));
        if (progress >= 95) {
          clearInterval(progressInterval);
        }
      }, 100);
      
      try {
        // For demo purposes only - in a real implementation, this would be an actual API call
        // that sends the document text to the backend for processing
        
        // Simulate API call
        console.log("Processing document:", file.name);
        
        // Instead of making a real API call, we'll simulate one for the demo
        // In a production environment, you would uncomment this code:
        /*
        const response = await apiRequest(
          'POST',
          '/api/openai/process-protocol',
          {
            documentText,
            documentName: file.name,
            documentType: 'Protocol'
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process document');
        }
        
        const data = await response.json();
        */
        
        // Simulate API response delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clearInterval(progressInterval);
        setProcessingProgress(100);
        
        // For demo, since we don't have a real file to process,
        // return sample structured sections
        return [
          { title: "Study Title", content: "A Phase III, Double-Blind, Randomized Study of Anti-PD-1 Monoclonal Antibody in Patients with Advanced Melanoma" },
          { title: "Protocol ID", content: "PRO-001-MEL" },
          { title: "Study Phase", content: "Phase III" },
          { title: "Background", content: "Melanoma is the most aggressive form of skin cancer. While early-stage melanoma is highly curable with surgical resection, advanced melanoma has historically had a poor prognosis with limited treatment options and low survival rates. Recent advances in immunotherapy, particularly immune checkpoint inhibitors targeting PD-1/PD-L1 pathway, have shown promising results in clinical trials." },
          { title: "Objectives", content: "Primary Objective: To evaluate the efficacy of Anti-PD-1 monoclonal antibody compared to standard chemotherapy in terms of overall survival (OS) and progression-free survival (PFS) in patients with advanced melanoma.\n\nSecondary Objectives:\n- Assess objective response rate (ORR)\n- Evaluate duration of response\n- Assess safety and tolerability\n- Evaluate quality of life measures" },
          { title: "Study Design", content: "This is a Phase III, multicenter, randomized, double-blind, controlled study comparing Anti-PD-1 monoclonal antibody to standard chemotherapy in patients with advanced melanoma who have not received prior systemic therapy. Approximately 600 patients will be randomized in a 1:1 ratio to receive either Anti-PD-1 or chemotherapy." },
          { title: "Study Population", content: "Adult patients (≥18 years) with histologically confirmed, unresectable Stage III or Stage IV melanoma." },
          { title: "Inclusion Criteria", content: "1. Histologically confirmed, unresectable Stage III or Stage IV melanoma\n2. Age ≥18 years\n3. ECOG performance status 0-1\n4. Adequate organ function\n5. Measurable disease per RECIST v1.1\n6. No prior systemic therapy for advanced melanoma" },
          { title: "Exclusion Criteria", content: "1. Active autoimmune disease requiring systemic treatment\n2. Active central nervous system metastases\n3. Prior treatment with immune checkpoint inhibitors\n4. History of organ transplantation\n5. Concurrent anticancer therapy\n6. Active infection requiring systemic therapy" },
          { title: "Treatment Plan", content: "Patients randomized to the experimental arm will receive Anti-PD-1 10 mg/kg intravenously every 2 weeks until disease progression or unacceptable toxicity. Patients randomized to the control arm will receive standard chemotherapy according to institutional guidelines." },
          { title: "Endpoints", content: "Primary Endpoints:\n- Overall Survival (OS)\n- Progression-Free Survival (PFS)\n\nSecondary Endpoints:\n- Objective Response Rate (ORR)\n- Duration of Response (DOR)\n- Safety and tolerability (adverse events graded according to CTCAE v5.0)\n- Quality of Life (measured by EORTC QLQ-C30)" },
          { title: "Statistical Considerations", content: "The study is designed to detect a hazard ratio of 0.7 for OS with 90% power and a two-sided alpha of 0.05, which corresponds to an increase in median OS from 11 months in the control arm to 15.7 months in the experimental arm. This requires approximately 600 patients (300 per arm) and 390 OS events." },
          { title: "Safety Assessments", content: "Safety will be evaluated by assessment of adverse events, physical examinations, vital signs, laboratory tests, and ECGs. All adverse events will be graded according to CTCAE v5.0 and monitored from the first dose until 30 days after the last dose of study treatment." },
          { title: "Data Management", content: "Data will be collected using electronic case report forms (eCRFs). Data management will be conducted according to the sponsor's standard operating procedures and GCP guidelines. A data monitoring committee (DMC) will be established to review safety data periodically." },
          { title: "Ethical Considerations", content: "The study will be conducted in accordance with the principles of the Declaration of Helsinki, GCP guidelines, and applicable regulatory requirements. All patients must provide written informed consent before any study-specific procedures are performed. The protocol and informed consent form must be approved by an institutional review board (IRB) or independent ethics committee (IEC)." }
        ];
        
        // In a real implementation, we would use the actual API response:
        // return data.extractedSections;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onMutate: () => {
      setProcessingStatus('processing');
      setProcessingProgress(0);
      toast({
        title: "Processing document",
        description: "Your document is being analyzed and digitized...",
      });
    },
    onSuccess: () => {
      setProcessingStatus('complete');
      toast({
        title: "Document digitized successfully",
        description: "The protocol has been processed and structured into sections.",
        variant: "default",
      });
    },
    onError: (error) => {
      setProcessingStatus('error');
      toast({
        title: "Digitization failed",
        description: error.message || "An error occurred while processing the document.",
        variant: "destructive",
      });
    }
  });

  // Simulation for uploading a document
  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // This would be a real API call to upload the document
      // For demo, we'll simulate the upload with a delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true, message: "Document uploaded successfully" });
        }, 1500);
      });
    },
    onSuccess: () => {
      setShowUploadDialog(false);
      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "An error occurred while uploading the document.",
        variant: "destructive",
      });
    }
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle file upload logic here
      console.log("Selected file:", file);
    }
  };

  // Handle document selection for digitization
  const handleDigitizeDocument = (doc: any) => {
    setSelectedDocument(doc);
    setShowDigitizeDialog(true);
  };

  // Start digitization process
  const startDigitization = () => {
    // Set processing state
    setProcessingStatus('processing');
    setProcessingProgress(0);
    
    // Simulate a processing delay with progress updates
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setProcessingProgress(Math.min(progress, 100));
      
      if (progress >= 100) {
        clearInterval(interval);
        setProcessingStatus('complete');
        setSections(protocolSections);
        
        toast({
          title: "Document digitized successfully",
          description: "The protocol has been processed and structured into sections.",
        });
      }
    }, 200);
    
    // Close the toast if it's open
    toast({
      title: "Processing document",
      description: selectedDocument ? 
        `Digitizing ${selectedDocument.name}...` : 
        "Converting document to structured format...",
    });
  };

  // Filter documents based on search and filters
  const filteredDocuments = documentData.filter(doc => {
    const studyFilter = !selectedStudy || doc.study === selectedStudy;
    const typeFilter = !selectedDocType || doc.type === selectedDocType;
    const tabFilter = activeTab === "study-specific" ? doc.study !== null : activeTab === "global" ? doc.study === null : true;
    const searchFilter = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.study?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    return studyFilter && typeFilter && searchFilter && tabFilter;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "In Review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Draft":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  return (
    <AppLayout 
      title="Protocol Digitization.AI"
      subtitle="Manage protocol documents, amendments, and study reference materials"
    >
      <Tabs defaultValue="study-specific" className="w-full" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="study-specific">Study-Specific Documents</TabsTrigger>
            <TabsTrigger value="global">Global Documents</TabsTrigger>
          </TabsList>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>

        <TabsContent value="study-specific" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Study Documents</CardTitle>
                  <CardDescription>
                    Protocol documents, amendments, and study-specific reference materials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search documents..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedStudy || ""} onValueChange={(value) => setSelectedStudy(value || null)}>
                    <SelectTrigger className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>{selectedStudy || "Filter by Study"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-studies">All Studies</SelectItem>
                      {studies.map(study => (
                        <SelectItem key={study.protocol} value={study.protocol}>
                          {study.protocol} - {study.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedDocType || ""} onValueChange={(value) => setSelectedDocType(value || null)}>
                    <SelectTrigger className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>{selectedDocType || "Filter by Type"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-doc-types">All Document Types</SelectItem>
                      {documentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Study</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.filter(doc => doc.study !== null).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.study}</TableCell>
                        <TableCell>{doc.version}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleDigitizeDocument(doc)}>
                                <FileDigit className="mr-2 h-4 w-4" />
                                <span>Digitize Protocol</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Update Status</DropdownMenuItem>
                              <DropdownMenuItem>Upload New Version</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="global" className="mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl">Global Documents</CardTitle>
                  <CardDescription>
                    SOPs, quality manuals, and other global reference materials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search documents..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={selectedDocType || ""} onValueChange={(value) => setSelectedDocType(value || null)}>
                    <SelectTrigger className="w-[200px]">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span>{selectedDocType || "Filter by Type"}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-doc-types">All Document Types</SelectItem>
                      {documentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.filter(doc => doc.study === null).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-primary" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.version}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{doc.uploadDate}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>View</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Update Status</DropdownMenuItem>
                              <DropdownMenuItem>Upload New Version</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to the system. Document will be scanned and processed automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="study" className="text-right">
                Study
              </Label>
              <Select>
                <SelectTrigger id="study" className="col-span-3">
                  <SelectValue placeholder="Select a study" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (Not study-specific)</SelectItem>
                  {studies.map(study => (
                    <SelectItem key={study.id} value={study.protocol || "study-" + study.id}>
                      {study.protocol} - {study.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="docType" className="text-right">
                Document Type
              </Label>
              <Select>
                <SelectTrigger id="docType" className="col-span-3">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version" className="text-right">
                Version
              </Label>
              <Input
                id="version"
                placeholder="e.g., 1.0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select>
                <SelectTrigger id="status" className="col-span-3">
                  <SelectValue placeholder="Select document status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                File
              </Label>
              <div className="col-span-3">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    <label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                      Click to upload
                    </label>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    <p className="mt-1">or drag and drop</p>
                    <p className="text-xs mt-2">PDF, DOC, DOCX, XLS, XLSX up to 10MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput?.files?.length) {
                  const formData = new FormData();
                  formData.append('file', fileInput.files[0]);
                  uploadDocumentMutation.mutate(formData);
                } else {
                  toast({
                    title: "No file selected",
                    description: "Please select a file to upload.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={uploadDocumentMutation.isPending}
            >
              {uploadDocumentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Digitize Protocol Dialog */}
      <Dialog open={showDigitizeDialog} onOpenChange={setShowDigitizeDialog}>
        <DialogContent className="sm:max-w-[750px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Digitize Protocol Document</DialogTitle>
            <DialogDescription>
              Convert protocol document to structured digital format using AI. This will extract key sections from the document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {processingStatus === 'idle' && (
              <>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Selected document:</p>
                  <div className="bg-muted p-3 rounded-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    <span className="font-medium">{selectedDocument?.name || "No document selected"}</span>
                  </div>
                </div>
                <div className="mb-4">
                  <Label htmlFor="digitize-file" className="block mb-2">
                    Or upload a new file to digitize
                  </Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <FileScan className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2 text-sm text-gray-500">
                      <label htmlFor="digitize-file-upload" className="cursor-pointer text-primary hover:underline">
                        Click to upload
                      </label>
                      <input 
                        id="digitize-file-upload" 
                        name="digitize-file-upload" 
                        type="file" 
                        className="sr-only" 
                        ref={fileInputRef}
                        accept=".pdf,.doc,.docx"
                      />
                      <p className="mt-1">or drag and drop</p>
                      <p className="text-xs mt-2">PDF, DOC, DOCX up to 25MB</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg mb-4">
                  <p><strong>How it works:</strong> Our system will use AI to scan and extract structured information from your protocol document. This includes study objectives, eligibility criteria, endpoints, and other key sections.</p>
                </div>
              </>
            )}

            {processingStatus === 'processing' && (
              <div className="py-6">
                <div className="text-center mb-6">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-medium">Processing document...</h3>
                  <p className="text-sm text-muted-foreground mt-1">This may take a few minutes depending on document size and complexity.</p>
                </div>
                <Progress value={processingProgress} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground text-right">{processingProgress}% complete</p>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="bg-muted p-3 rounded-lg">
                    <p>Extracting text</p>
                    {processingProgress > 30 && <FileCheck className="h-4 w-4 mx-auto mt-2 text-green-500" />}
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p>Identifying sections</p>
                    {processingProgress > 60 && <FileCheck className="h-4 w-4 mx-auto mt-2 text-green-500" />}
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p>Structuring content</p>
                    {processingProgress > 90 && <FileCheck className="h-4 w-4 mx-auto mt-2 text-green-500" />}
                  </div>
                </div>
              </div>
            )}

            {processingStatus === 'complete' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Extracted Protocol Sections</h3>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Processing Complete
                  </Badge>
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {sections.map((section, index) => (
                      <AccordionItem key={index} value={`section-${index}`}>
                        <AccordionTrigger className="font-medium">
                          {section.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <Textarea 
                            value={section.content} 
                            onChange={(e) => {
                              const updatedSections = [...sections];
                              updatedSections[index].content = e.target.value;
                              setSections(updatedSections);
                            }}
                            className="min-h-[120px] mt-2"
                          />
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </ScrollArea>
              </div>
            )}

            {processingStatus === 'error' && (
              <div className="text-center py-6">
                <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 p-4 rounded-lg mb-4">
                  <p className="font-medium">Error processing document</p>
                  <p className="text-sm mt-1">There was an error processing your document. Please try again or contact support if the issue persists.</p>
                </div>
                <Button variant="outline" onClick={() => setProcessingStatus('idle')}>
                  Try Again
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            {processingStatus === 'idle' && (
              <>
                <Button variant="outline" onClick={() => setShowDigitizeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={startDigitization}>
                  <FileDigit className="mr-2 h-4 w-4" /> Digitize Protocol
                </Button>
              </>
            )}
            
            {processingStatus === 'processing' && (
              <Button variant="outline" disabled>
                Processing...
              </Button>
            )}
            
            {processingStatus === 'complete' && (
              <>
                <Button variant="outline" onClick={() => setShowDigitizeDialog(false)}>
                  Close
                </Button>
                <Button>
                  Save Digitized Protocol
                </Button>
              </>
            )}
            
            {processingStatus === 'error' && (
              <Button variant="outline" onClick={() => setShowDigitizeDialog(false)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ProtocolDocManagement;