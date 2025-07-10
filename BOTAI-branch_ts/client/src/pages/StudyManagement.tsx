import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import AppLayout from "@/components/layout/AppLayout";
import { 
  ChevronLeft, 
  Users, 
  Building2, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Phone, 
  Mail, 
  ExternalLink,
  Upload,
  File,
  Download,
  X,
  History,
  Plus
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Define types for study management
type Study = {
  id: number;
  protocolId: string;
  title: string;
  therapeuticArea: string;
  indication: string;
  phase: string;
  status: string;
  startDate: string;
  endDate: string;
  description: string;
};

type Contact = {
  id: number;
  name: string;
  role: string;
  organization: string;
  email: string;
  phone: string;
};

type Site = {
  id: number;
  siteId: string;
  name: string;
  location: string;
  principalInvestigator: string;
  status: string;
  enrollment?: number;
  createdAt: string;
};

type Vendor = {
  id: number;
  name: string;
  type: string;
  contactPerson: string;
  contactEmail: string;
  status: string;
  trialRole?: string;
  contractStatus?: string;
  startDate?: string;
  endDate?: string;
  services?: string[];
};

// Define document version type
type DocumentVersion = {
  id: number;
  version: string;
  dateAdded: string;
  addedBy: string;
  changes: string;
  content: string;
};

// Define document types
type Document = {
  id: number;
  name: string;
  category: string;
  dateAdded: string;
  version: string;
  status: 'Approved' | 'Draft' | 'Under Review' | 'Rejected';
  source: 'eTMF Sync' | 'Manual Upload';
  content?: string; // Text content or description
  fileUrl?: string; // URL to the document file
  fileType?: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt'; // File type for icon display
  versions?: DocumentVersion[]; // Document versions history
};

// Create a Zod schema for the study creation form
const studyFormSchema = z.object({
  protocolId: z.string()
    .min(1, { message: "Protocol ID is required" })
    .regex(/^[A-Za-z0-9-_]+$/, { 
      message: "Protocol ID should only contain letters, numbers, hyphens and underscores" 
    }),
  title: z.string()
    .min(5, { message: "Title must be at least 5 characters" })
    .max(200, { message: "Title must be less than 200 characters" }),
  phase: z.string()
    .min(1, { message: "Phase is required" }),
  therapeuticArea: z.string().optional()
    .transform(val => val === "" ? null : val),
  indication: z.string().optional()
    .transform(val => val === "" ? null : val),
  status: z.string()
    .min(1, { message: "Status is required" }),
  startDate: z.string()
    .min(1, { message: "Start date is required" })
    .refine(date => !isNaN(Date.parse(date)), { 
      message: "Invalid date format" 
    }),
  endDate: z.string().optional()
    .refine(date => !date || !isNaN(Date.parse(date)), { 
      message: "Invalid date format" 
    })
    .superRefine((date, ctx) => {
      if (!date) return;
      
      // Access the form data safely
      // Note: We don't use ctx.data directly as it might not be available in all Zod versions
      const formData = { 
        startDate: typeof ctx.path[0] === 'string' && ctx.path[0] === "endDate" 
          ? (ctx.parent as any)?.startDate || "" 
          : "" 
      };
        
      if (!formData.startDate) return;
      
      if (new Date(date) <= new Date(formData.startDate)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date",
          path: ["endDate"]
        });
      }
    }),
  description: z.string().optional()
    .transform(val => val === "" ? null : val),
});

// Create a Zod schema for the contact creation form
const contactFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  phone: z.string().optional(),
  availability: z.number().min(0).max(100).default(100),
  status: z.string().default("active"),
  // trialId is added in the mutation function
});

// Define the types from the schemas
type StudyFormValues = z.infer<typeof studyFormSchema>;
type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function StudyManagement() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedStudy, setSelectedStudy] = useState<number | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [showVersionCompareDialog, setShowVersionCompareDialog] = useState(false);
  const [compareVersions, setCompareVersions] = useState<{oldVersion: DocumentVersion | null, newVersion: DocumentVersion | null}>({
    oldVersion: null,
    newVersion: null
  });
  const [documentToUpload, setDocumentToUpload] = useState<File | null>(null);
  const [documentCategory, setDocumentCategory] = useState<string>("Protocol");
  const [documentStatus, setDocumentStatus] = useState<'Approved' | 'Draft' | 'Under Review'>('Draft');
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showCreateStudyDialog, setShowCreateStudyDialog] = useState(false);
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 1,
      name: "Protocol_PRO001_v2.1.pdf",
      category: "Protocol",
      dateAdded: "2023-10-15",
      version: "2.1",
      status: "Approved",
      source: "eTMF Sync",
      content: "This is the protocol document content. It would typically be displayed in a PDF viewer or downloaded.",
      fileUrl: "/sample-pdfs/protocol-sample.pdf",
      fileType: "pdf",
      versions: [
        {
          id: 1,
          version: "1.0",
          dateAdded: "2023-03-20",
          addedBy: "John Smith",
          changes: "Initial protocol draft",
          content: "Initial protocol content with basic study design and eligibility criteria."
        },
        {
          id: 2,
          version: "1.5",
          dateAdded: "2023-06-15",
          addedBy: "Sarah Johnson",
          changes: "Updated inclusion/exclusion criteria, modified dosing schedule",
          content: "Updated protocol with revised eligibility criteria and new dosing schedule based on Phase 1 results."
        },
        {
          id: 3,
          version: "2.0",
          dateAdded: "2023-09-10",
          addedBy: "Robert Chen",
          changes: "Added new secondary endpoints, revised statistical analysis plan",
          content: "Major revision with new secondary endpoints and completely revised statistical analysis approach."
        },
        {
          id: 4,
          version: "2.1",
          dateAdded: "2023-10-15",
          addedBy: "Emily Parker",
          changes: "Minor corrections to statistical calculations, clarified monitoring procedures",
          content: "This is the protocol document content. It would typically be displayed in a PDF viewer or downloaded."
        }
      ]
    },
    {
      id: 2,
      name: "ICF_Template_PRO001_English.docx",
      category: "Informed Consent",
      dateAdded: "2023-09-28",
      version: "1.3",
      status: "Approved",
      source: "eTMF Sync",
      content: "Informed Consent Form template content would be shown here.",
      fileUrl: "/sample-pdfs/icf-sample.pdf",
      fileType: "docx"
    },
    {
      id: 3,
      name: "Site_Qualification_Report_Site123.pdf",
      category: "Site Documents",
      dateAdded: "2023-11-05",
      version: "1.0",
      status: "Under Review",
      source: "eTMF Sync",
      content: "Site qualification documentation and findings would be displayed here.",
      fileUrl: "/sample-pdfs/site-qualification-sample.pdf",
      fileType: "pdf"
    },
    {
      id: 4,
      name: "Monitoring_Plan_PRO001.pdf",
      category: "Monitoring",
      dateAdded: "2023-10-20",
      version: "1.0",
      status: "Approved",
      source: "eTMF Sync",
      content: "Monitoring plan details including visit schedules and procedures.",
      fileUrl: "/sample-pdfs/monitoring-sample.pdf",
      fileType: "pdf"
    },
    {
      id: 5,
      name: "CRF_Completion_Guidelines.pdf",
      category: "Data Management",
      dateAdded: "2023-11-10",
      version: "1.0",
      status: "Draft",
      source: "Manual Upload",
      content: "Guidelines for completing CRFs accurately and completely.",
      fileUrl: "/sample-pdfs/crf-sample.pdf",
      fileType: "pdf"
    },
    {
      id: 6,
      name: "Investigator_Brochure_v1.2.pdf",
      category: "Study Material",
      dateAdded: "2023-09-15",
      version: "1.2",
      status: "Approved",
      source: "eTMF Sync",
      content: "Investigator brochure with detailed information about the investigational product.",
      fileUrl: "/sample-pdfs/investigator-brochure-sample.pdf",
      fileType: "pdf"
    },
    {
      id: 7,
      name: "RBQM_Framework_Documentation.pdf",
      category: "RBQM",
      dateAdded: "2025-04-07",
      version: "1.0",
      status: "Approved",
      source: "Manual Upload",
      content: "Harnessing business Orchestration technology with AI to optimize the management and oversight of clinical trials involves the integration of various profiles and dimensions for comprehensive oversight.",
      fileUrl: "/sample-pdfs/rbqm-sample.pdf",
      fileType: "pdf"
    }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch studies data
  const { data: studies = [], isLoading: isLoadingStudies } = useQuery<Study[]>({
    queryKey: ['/api/trials'],
    queryFn: () => apiRequest<any[]>('/api/trials'),
    select: (data) => {
      return data.map((study) => ({
        id: study.id,
        protocolId: study.protocolId,
        title: study.title || "Untitled Study",
        therapeuticArea: study.therapeuticArea || "Not specified",
        indication: study.indication || "Not specified",
        phase: study.phase || "Not specified",
        status: study.status || "Not specified",
        startDate: study.startDate || new Date().toISOString(),
        endDate: study.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString(),
        description: study.description || "No description available"
      }));
    }
  });
  
  // Fetch selected study's sites
  const { data: sites = [], isLoading: isLoadingSites } = useQuery({
    queryKey: ['/api/sites', selectedStudy],
    queryFn: () => selectedStudy ? apiRequest(`/api/trials/${selectedStudy}/sites`) : Promise.resolve([]),
    enabled: !!selectedStudy
  });
  
  // Fetch study contacts
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ['/api/trials/:trialId/contacts', selectedStudy],
    queryFn: () => selectedStudy 
      ? apiRequest(`/api/trials/${selectedStudy}/contacts`)
        .catch((error) => { 
          console.error("Error fetching contacts:", error); 
          return []; 
        }) 
      : Promise.resolve([]),
    enabled: !!selectedStudy
  });
  
  // Fetch vendors for the selected trial
  const { data: trialVendors = [], isLoading: isLoadingVendors } = useQuery<Vendor[]>({
    queryKey: ['/api/vendors', selectedStudy],
    queryFn: () => selectedStudy 
      ? apiRequest(`/api/trials/${selectedStudy}/vendors`) 
      : Promise.resolve([]),
    enabled: !!selectedStudy
  });
  
  // Function to select a study and update the view
  const handleStudySelect = (studyId: number) => {
    setSelectedStudy(studyId);
    setActiveTab("overview");
  };
  
  // The selected study's data
  const selectedStudyData = selectedStudy 
    ? studies.find(study => study.id === selectedStudy) 
    : null;
    
  // Setup form for creating new study
  const form = useForm<StudyFormValues>({
    resolver: zodResolver(studyFormSchema),
    defaultValues: {
      protocolId: '',
      title: '',
      phase: '',
      therapeuticArea: '',
      indication: '',
      status: 'Planned',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
    },
  });
  
  // Setup form for adding contacts
  const contactForm = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      role: '',
      email: '',
      phone: '',
      availability: 100,
      status: 'active'
    }
  });
  
  // Get query client
  const queryClient = useQueryClient();
  
  // Mutation for creating a new contact
  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormValues) => {
      if (!selectedStudy) {
        throw new Error("No study selected");
      }
      // Add trialId which is required by the server
      const contactData = {
        ...data,
        trialId: selectedStudy
      };
      return await apiRequest(`/api/trials/${selectedStudy}/contacts`, 'POST', contactData);
    },
    onSuccess: () => {
      // Invalidate the contacts query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['/api/trials/:trialId/contacts', selectedStudy] });
      // Close the dialog
      setShowAddContactDialog(false);
      // Reset form
      contactForm.reset();
      // Show success toast
      toast({
        title: "Contact added",
        description: "The contact has been added to the study successfully.",
      });
    },
    onError: (error) => {
      console.error("Error adding contact:", error);
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation for creating a new study
  const createStudyMutation = useMutation({
    mutationFn: async (data: StudyFormValues) => {
      return await apiRequest('/api/trials', 'POST', data);
    },
    onSuccess: () => {
      // Invalidate the studies query to refetch the list
      queryClient.invalidateQueries({ queryKey: ['/api/trials'] });
      // Close the dialog
      setShowCreateStudyDialog(false);
      // Reset form
      form.reset();
      // Show success toast
      toast({
        title: "Study created",
        description: "The new study has been created successfully.",
      });
    },
    onError: (error) => {
      console.error("Error creating study:", error);
      toast({
        title: "Error",
        description: "Failed to create study. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Study Management</h1>
        
        {selectedStudy ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">{selectedStudyData?.protocolId}</h2>
                <p className="text-gray-600">{selectedStudyData?.title}</p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  size="sm"
                  onClick={() => setShowCreateStudyDialog(true)}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> New Study
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedStudy(null)}
                >
                  Back to Studies
                </Button>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sites">Sites</TabsTrigger>
                <TabsTrigger value="contacts">Study Contacts</TabsTrigger>
                <TabsTrigger value="vendors">Vendors & Services</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Study Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Protocol ID</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedStudyData?.protocolId}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Title</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedStudyData?.title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Therapeutic Area</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedStudyData?.therapeuticArea}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Indication</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedStudyData?.indication}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phase</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedStudyData?.phase}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedStudyData?.status}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{new Date(selectedStudyData?.startDate || "").toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">End Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{new Date(selectedStudyData?.endDate || "").toLocaleDateString()}</dd>
                      </div>
                    </dl>
                    
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedStudyData?.description}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Study Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Enrollment</span>
                          <span>75%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "75%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Timeline</span>
                          <span>50%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "50%" }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Budget</span>
                          <span>62%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-primary h-2.5 rounded-full" style={{ width: "62%" }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="sites" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Study Sites</CardTitle>
                    <Button size="sm">Add Site</Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingSites ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (sites && sites.length === 0) ? (
                      <div className="text-center py-8 text-gray-500">
                        No sites associated with this study
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Site ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Enrollment</TableHead>
                            <TableHead>Principal Investigator</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sites.map((site: any) => (
                            <TableRow key={site.id}>
                              <TableCell className="font-medium">{site.siteId}</TableCell>
                              <TableCell>{site.name}</TableCell>
                              <TableCell>{site.location || "Unknown"}</TableCell>
                              <TableCell>{site.status || "Active"}</TableCell>
                              <TableCell>{site.enrollmentCount || "0"}/{site.enrollmentTarget || "0"}</TableCell>
                              <TableCell>{site.principalInvestigator || "Not assigned"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contacts" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Study Contacts</CardTitle>
                    <Button size="sm" onClick={() => setShowAddContactDialog(true)}>Add Contact</Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingContacts ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (contacts && contacts.length === 0) ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No contacts associated with this study yet</p>
                        <div className="mt-4">
                          <Button onClick={() => setShowAddContactDialog(true)}>Add Study Contacts</Button>
                        </div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Organization</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contacts.map((contact: Contact) => (
                            <TableRow key={contact.id}>
                              <TableCell className="font-medium">{contact.name}</TableCell>
                              <TableCell>{contact.role}</TableCell>
                              <TableCell>{contact.organization}</TableCell>
                              <TableCell>
                                <a 
                                  href={`mailto:${contact.email}`} 
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <Mail className="h-4 w-4 mr-1" />{contact.email}
                                </a>
                              </TableCell>
                              <TableCell>
                                <a 
                                  href={`tel:${contact.phone}`} 
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <Phone className="h-4 w-4 mr-1" />{contact.phone}
                                </a>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="vendors" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Vendors & Services</CardTitle>
                    <Button size="sm">Add Vendor</Button>
                  </CardHeader>
                  <CardContent>
                    {isLoadingVendors ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (trialVendors && trialVendors.length === 0) ? (
                      <div className="text-center py-8 text-gray-500">
                        No vendors associated with this study
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Trial Role</TableHead>
                            <TableHead>Contact Person</TableHead>
                            <TableHead>Contract Status</TableHead>
                            <TableHead>Timeline</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trialVendors.map((vendor: Vendor) => (
                            <TableRow key={vendor.id}>
                              <TableCell className="font-medium">{vendor.name}</TableCell>
                              <TableCell>{vendor.type}</TableCell>
                              <TableCell>{vendor.trialRole || vendor.type}</TableCell>
                              <TableCell>
                                {vendor.contactPerson}<br />
                                <span className="text-xs text-gray-500">{vendor.contactEmail}</span>
                              </TableCell>
                              <TableCell>
                                <Badge className={vendor.contractStatus === "Active" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                                  {vendor.contractStatus || "Active"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {vendor.startDate && vendor.endDate ? (
                                  <div className="text-xs">
                                    <div>Start: {new Date(vendor.startDate).toLocaleDateString()}</div>
                                    <div>End: {new Date(vendor.endDate).toLocaleDateString()}</div>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6 mt-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Study Documents</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="inline-flex items-center text-green-700 font-medium">
                          <span className="relative flex h-2 w-2 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          eTMF Real-time Sync Active
                        </span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => window.alert("Sync refreshed successfully")}>
                        Refresh Sync
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => setShowDocumentDialog(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Document Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Source</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {documents.map((doc) => (
                            <TableRow key={doc.id}>
                              <TableCell className="font-medium">
                                <button 
                                  onClick={() => setViewingDocument(doc)}
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  {doc.fileType === 'pdf' ? (
                                    <FileText className="h-5 w-5 mr-2 text-red-500" />
                                  ) : doc.fileType === 'docx' ? (
                                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                                  ) : doc.fileType === 'xlsx' ? (
                                    <FileText className="h-5 w-5 mr-2 text-green-500" />
                                  ) : doc.fileType === 'pptx' ? (
                                    <FileText className="h-5 w-5 mr-2 text-orange-500" />
                                  ) : (
                                    <File className="h-5 w-5 mr-2 text-gray-500" />
                                  )}
                                  {doc.name}
                                </button>
                              </TableCell>
                              <TableCell>{doc.category}</TableCell>
                              <TableCell>{new Date(doc.dateAdded).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    doc.status === "Approved" 
                                      ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                      : doc.status === "Under Review"
                                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                                  }
                                >
                                  {doc.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {doc.source === "eTMF Sync" ? (
                                  <span className="inline-flex items-center text-blue-600">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    eTMF Sync
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center">
                                    Manual Upload
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2"
                                  onClick={() => setViewingDocument(doc)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="mt-6 border rounded-md p-4 bg-gray-50">
                      <h3 className="text-sm font-medium mb-2">Quick Upload</h3>
                      <div className="flex items-center space-x-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                          <input
                            type="file"
                            id="document-upload"
                            className="bg-white p-2 border rounded text-sm w-full"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setDocumentToUpload(e.target.files[0]);
                              }
                            }}
                            ref={fileInputRef}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          className="shrink-0"
                          onClick={() => {
                            if (documentToUpload) {
                              // Determine file type based on extension
                              const fileExt = documentToUpload.name.split('.').pop()?.toLowerCase() || '';
                              const fileType = fileExt === 'pdf' ? 'pdf' : 
                                             fileExt === 'docx' || fileExt === 'doc' ? 'docx' :
                                             fileExt === 'xlsx' || fileExt === 'xls' ? 'xlsx' :
                                             fileExt === 'pptx' || fileExt === 'ppt' ? 'pptx' : 'txt';
                              
                              const newDoc: Document = {
                                id: documents.length + 1,
                                name: documentToUpload.name,
                                category: 'Protocol', // Default category
                                dateAdded: new Date().toISOString().split('T')[0],
                                version: '1.0',
                                status: 'Draft',
                                source: 'Manual Upload',
                                content: `Content of ${documentToUpload.name}. This would be the actual document content.`,
                                fileUrl: "/sample-pdfs/protocol-sample.pdf", // Using sample file for demo
                                fileType: fileType as any
                              };
                              setDocuments([...documents, newDoc]);
                              setDocumentToUpload(null);
                              
                              // Reset file input
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                              
                              // Show confirmation
                              alert(`Document "${documentToUpload.name}" uploaded successfully!`);
                            } else {
                              alert("Please select a file to upload.");
                            }
                          }}
                          disabled={!documentToUpload}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Document Upload Dialog */}
                <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription>
                        Upload a new document to the study's document repository.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium" htmlFor="upload-file">
                          Select File
                        </label>
                        <div className="mt-1">
                          <input
                            id="upload-file"
                            type="file"
                            className="w-full p-2 border rounded text-sm"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setDocumentToUpload(e.target.files[0]);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium" htmlFor="document-category">
                          Document Category
                        </label>
                        <select 
                          id="document-category"
                          className="w-full p-2 border rounded text-sm mt-1"
                          value={documentCategory}
                          onChange={(e) => setDocumentCategory(e.target.value)}
                        >
                          <option value="Protocol">Protocol</option>
                          <option value="Informed Consent">Informed Consent</option>
                          <option value="Site Documents">Site Documents</option>
                          <option value="Monitoring">Monitoring</option>
                          <option value="Data Management">Data Management</option>
                          <option value="Study Material">Study Material</option>
                          <option value="Regulatory">Regulatory</option>
                          <option value="Safety">Safety</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium" htmlFor="document-status">
                          Document Status
                        </label>
                        <select 
                          id="document-status"
                          className="w-full p-2 border rounded text-sm mt-1"
                          value={documentStatus}
                          onChange={(e) => setDocumentStatus(e.target.value as any)}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter className="flex justify-between mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDocumentDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={!documentToUpload}
                        onClick={() => {
                          if (documentToUpload) {
                            // Determine file type based on extension
                            const fileExt = documentToUpload.name.split('.').pop()?.toLowerCase() || '';
                            const fileType = fileExt === 'pdf' ? 'pdf' : 
                                           fileExt === 'docx' || fileExt === 'doc' ? 'docx' :
                                           fileExt === 'xlsx' || fileExt === 'xls' ? 'xlsx' :
                                           fileExt === 'pptx' || fileExt === 'ppt' ? 'pptx' : 'txt';
                            
                            // Create new document with file type and URL
                            const newDoc: Document = {
                              id: documents.length + 1,
                              name: documentToUpload.name,
                              category: documentCategory,
                              dateAdded: new Date().toISOString().split('T')[0],
                              version: '1.0',
                              status: documentStatus,
                              source: 'Manual Upload',
                              content: `Content of ${documentToUpload.name} - ${documentCategory}. This would be the actual document content.`,
                              fileUrl: documentCategory === 'RBQM' ? 
                                     '/sample-pdfs/rbqm-sample.pdf' :
                                     documentCategory === 'Protocol' ?
                                     '/sample-pdfs/protocol-sample.pdf' :
                                     '/sample-pdfs/crf-sample.pdf',
                              fileType: fileType as any
                            };
                            
                            // Add to documents list
                            setDocuments([...documents, newDoc]);
                            
                            // Reset state
                            setDocumentToUpload(null);
                            setShowDocumentDialog(false);
                            
                            // Show confirmation
                            alert(`Document "${documentToUpload.name}" uploaded successfully!`);
                          }
                        }}
                      >
                        Upload Document
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Document Viewer Dialog */}
                <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
                  <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-auto">
                    <DialogHeader className="flex justify-between items-center">
                      <div>
                        <DialogTitle className="flex items-center">
                          {viewingDocument?.fileType === 'pdf' ? (
                            <FileText className="h-5 w-5 mr-2 text-red-500" />
                          ) : viewingDocument?.fileType === 'docx' ? (
                            <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          ) : viewingDocument?.fileType === 'xlsx' ? (
                            <FileText className="h-5 w-5 mr-2 text-green-500" />
                          ) : viewingDocument?.fileType === 'pptx' ? (
                            <FileText className="h-5 w-5 mr-2 text-orange-500" />
                          ) : (
                            <File className="h-5 w-5 mr-2 text-gray-500" />
                          )}
                          {viewingDocument?.name}
                        </DialogTitle>
                        <DialogDescription>
                          {viewingDocument?.category} • Version {viewingDocument?.version} • Added on {viewingDocument && new Date(viewingDocument.dateAdded).toLocaleDateString()}
                        </DialogDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => setViewingDocument(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogHeader>
                    <div className="p-4 border rounded-md bg-white min-h-[40vh]">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b">
                        <div className="flex items-center">
                          <Badge 
                            variant="outline" 
                            className={
                              viewingDocument?.status === "Approved" 
                                ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                                : viewingDocument?.status === "Under Review"
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
                            }
                          >
                            {viewingDocument?.status}
                          </Badge>
                          <span className="ml-3 text-sm text-gray-500">
                            Source: {viewingDocument?.source}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (viewingDocument?.fileUrl) {
                              // Extract the base name of the URL without extension
                              const baseUrl = viewingDocument.fileUrl.replace('.pdf', '.html');
                              window.open(baseUrl, '_blank');
                            }
                          }}
                          disabled={!viewingDocument?.fileUrl}
                        >
                          <Download className="h-4 w-4 mr-1" /> View Document
                        </Button>
                      </div>
                      <div className="document-content">
                        <p>{viewingDocument?.content}</p>
                        
                        {/* Simulated document content for demo purposes */}
                        {viewingDocument?.category === 'Protocol' && (
                          <div className="mt-4 p-4 border rounded">
                            <h3 className="text-lg font-bold">Protocol Summary</h3>
                            <p className="mt-2">
                              This clinical trial protocol outlines the procedures and methodologies for assessing the efficacy and safety of the investigational product in patients with the specified condition.
                            </p>
                            <h4 className="mt-4 font-semibold">Key Sections:</h4>
                            <ul className="list-disc ml-5 mt-2">
                              <li>Study Objectives and Endpoints</li>
                              <li>Study Design and Procedures</li>
                              <li>Patient Eligibility Criteria</li>
                              <li>Treatment Administration</li>
                              <li>Safety Monitoring</li>
                              <li>Statistical Analysis Plan</li>
                            </ul>
                          </div>
                        )}
                        {viewingDocument?.category === 'RBQM' && (
                          <div className="mt-4 p-4 border rounded">
                            <h3 className="text-lg font-bold">RBQM Framework Documentation</h3>
                            <div className="prose max-w-none">
                              <p className="mt-2">
                                Harnessing business Orchestration technology with AI to optimize the management and oversight of clinical trials involves the integration of various profiles and dimensions for comprehensive oversight.
                              </p>
                              
                              <h4 className="mt-4 font-semibold">Integrated Profiles:</h4>
                              <p>Risk Profile, Quality Profile, Compliance Profile, Safety Profile, Vendor Profile, Financial Profile, Resources Profile</p>
                              
                              <h4 className="mt-4 font-semibold">Key Dimensions:</h4>
                              <p>Portfolio, Program, Trial, Country, Site, Patient, Supply Chain, Vendor (Service Provider), Budget Planning and Utilization, User Allocations and Assignments</p>
                              
                              <h4 className="mt-4 font-semibold">Key Drivers:</h4>
                              <p>Integrated Data Review and automated business orchestration with HITL (Human in the loop) to analyse leading and lagging indicators, quality and compliance risks, protocol deviation, risks.</p>
                              
                              <h4 className="mt-4 font-semibold">Data Sources:</h4>
                              <p>EDC, CTMS, iRT, LIMS, Supply Chain, Data Lake (Patient and Operational)</p>
                              
                              <h4 className="mt-4 font-semibold">Benefits of RBQM:</h4>
                              <ul className="list-disc ml-5 mt-2">
                                <li>Improves Patient Safety – Ensures that issues like adverse events or protocol deviations are identified early.</li>
                                <li>Enhances Data Quality – Focuses on critical data points rather than verifying all data, improving efficiency.</li>
                                <li>Reduces Costs – Cuts unnecessary site visits and manual data verification, saving time and money.</li>
                                <li>Meets Regulatory Expectations – Aligns with FDA and ICH E6 (R2) guidelines, which emphasize risk-based approaches.</li>
                                <li>Optimizes Resources – Allows teams to focus on high-risk sites, critical endpoints, and key safety measures.</li>
                              </ul>
                              
                              <h4 className="mt-4 font-semibold">Risk Detection & Task Creation:</h4>
                              <ul className="list-disc ml-5 mt-2">
                                <li>Parse data from sources: EDC, CTMS, iRT, LIMS, Supply Chain, Data Lake (Patient and Operational)</li>
                                <li>Identify risks automatically using AI/ML models (protocol deviations, data inconsistencies)</li>
                                <li>Generate tasks with override options and manual creation capability</li>
                                <li>Categorize tasks into Critical, High, Medium, Low priority</li>
                                <li>Assign SLAs and calculate due dates</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <div className="w-full flex justify-between">
                        {viewingDocument?.versions && viewingDocument.versions.length > 1 && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              const currentVersion = viewingDocument.versions?.find(v => v.version === viewingDocument.version);
                              const previousVersions = viewingDocument.versions?.filter(v => v.version !== viewingDocument.version)
                                                      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
                              
                              if (currentVersion && previousVersions && previousVersions.length > 0) {
                                setCompareVersions({
                                  oldVersion: previousVersions[0],
                                  newVersion: currentVersion
                                });
                                setShowVersionCompareDialog(true);
                              }
                            }}
                          >
                            <History className="h-4 w-4 mr-1" /> Compare Versions
                          </Button>
                        )}
                        <Button onClick={() => setViewingDocument(null)}>Close</Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Studies</CardTitle>
                <Button 
                  size="sm" 
                  onClick={() => setShowCreateStudyDialog(true)}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1" /> New Study
                </Button>
              </CardHeader>
              <CardContent>
                {isLoadingStudies ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (studies && studies.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No studies available</p>
                    <div className="mt-4">
                      <Button onClick={() => setShowCreateStudyDialog(true)}>
                        <Plus className="h-4 w-4 mr-1" /> Create New Study
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocol ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Therapeutic Area</TableHead>
                        <TableHead>Indication</TableHead>
                        <TableHead>Phase</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studies.map((study) => (
                        <TableRow key={study.id}>
                          <TableCell className="font-medium">{study.protocolId}</TableCell>
                          <TableCell>{study.title}</TableCell>
                          <TableCell>{study.therapeuticArea}</TableCell>
                          <TableCell>{study.indication}</TableCell>
                          <TableCell>{study.phase}</TableCell>
                          <TableCell>
                            <Badge className={
                              study.status === "Active" ? "bg-green-100 text-green-800" : 
                              study.status === "Planned" ? "bg-blue-100 text-blue-800" : 
                              study.status === "Completed" ? "bg-neutral-100 text-neutral-800" : 
                              "bg-amber-100 text-amber-800"
                            }>
                              {study.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleStudySelect(study.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Study Dialog */}
      <Dialog open={showCreateStudyDialog} onOpenChange={setShowCreateStudyDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Study</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new clinical trial study to your management system.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(data => createStudyMutation.mutate(data))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="protocolId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protocol ID</FormLabel>
                      <FormControl>
                        <Input placeholder="PRO-123" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for the study (e.g., PRO-123, CLIN-2023-01)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phase</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select phase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Phase 1">Phase 1</SelectItem>
                          <SelectItem value="Phase 2">Phase 2</SelectItem>
                          <SelectItem value="Phase 3">Phase 3</SelectItem>
                          <SelectItem value="Phase 4">Phase 4</SelectItem>
                          <SelectItem value="NA">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Clinical trial phase indicating the stage of drug development
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Study Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the full study title" {...field} />
                    </FormControl>
                    <FormDescription>
                      The full official title of the study as it appears in the protocol
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="therapeuticArea"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Therapeutic Area</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Oncology" {...field} />
                      </FormControl>
                      <FormDescription>
                        The medical specialty or area (e.g., Oncology, Cardiology, CNS)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="indication"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indication</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Type 2 Diabetes" {...field} />
                      </FormControl>
                      <FormDescription>
                        The specific condition being treated or investigated
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Recruiting">Recruiting</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current operational status of the clinical trial
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        The anticipated or actual start date of the study
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (if known)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        Projected completion date (must be after start date)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of the study objectives and design"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about the study objectives, design, and important methodology information.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4 flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  type="button" 
                  onClick={() => setShowCreateStudyDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStudyMutation.isPending}
                >
                  {createStudyMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                      Creating...
                    </>
                  ) : "Create Study"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Version Comparison Dialog */}
      <Dialog open={showVersionCompareDialog} onOpenChange={setShowVersionCompareDialog}>
        <DialogContent className="max-w-5xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Compare Document Versions</DialogTitle>
            <DialogDescription>
              Comparing version {compareVersions.oldVersion?.version} ({new Date(compareVersions.oldVersion?.dateAdded || "").toLocaleDateString()}) 
              with version {compareVersions.newVersion?.version} ({new Date(compareVersions.newVersion?.dateAdded || "").toLocaleDateString()})
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-semibold">Version {compareVersions.oldVersion?.version}</h3>
                <Badge variant="outline" className="ml-2 text-xs">
                  {new Date(compareVersions.oldVersion?.dateAdded || "").toLocaleDateString()}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mb-2">Added by: {compareVersions.oldVersion?.addedBy}</p>
              <p className="text-xs text-gray-500 mb-4">Changes: {compareVersions.oldVersion?.changes}</p>
              <div className="bg-white p-3 border rounded-md overflow-auto max-h-[400px] text-sm">
                {compareVersions.oldVersion?.content}
              </div>
            </div>
            
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex items-center mb-2">
                <h3 className="text-sm font-semibold">Version {compareVersions.newVersion?.version}</h3>
                <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                  {new Date(compareVersions.newVersion?.dateAdded || "").toLocaleDateString()}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mb-2">Added by: {compareVersions.newVersion?.addedBy}</p>
              <p className="text-xs text-gray-500 mb-4">Changes: {compareVersions.newVersion?.changes}</p>
              <div className="bg-white p-3 border rounded-md overflow-auto max-h-[400px] text-sm">
                {compareVersions.newVersion?.content}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Changes Summary</h3>
            <div className="border rounded-md p-3 bg-gray-50">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">+</span>
                  <span>Added new secondary endpoints based on Phase 1 results</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-2">~</span>
                  <span>Modified statistical analysis approach to account for adaptive design</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 mr-2">-</span>
                  <span>Removed exploratory biomarker assessments</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="mt-6 flex justify-end">
            <Button variant="outline" onClick={() => setShowVersionCompareDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Study Contact</DialogTitle>
            <DialogDescription>
              Add a new contact to this study. Contacts are study team members who play specific roles in the clinical trial.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...contactForm}>
            <form onSubmit={contactForm.handleSubmit((data) => createContactMutation.mutate(data))} className="space-y-4">
              <FormField
                control={contactForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Clinical Research Associate">Clinical Research Associate</SelectItem>
                        <SelectItem value="Data Manager">Data Manager</SelectItem>
                        <SelectItem value="Medical Monitor">Medical Monitor</SelectItem>
                        <SelectItem value="Clinical Trial Manager">Clinical Trial Manager</SelectItem>
                        <SelectItem value="Clinical Research Coordinator">Clinical Research Coordinator</SelectItem>
                        <SelectItem value="Safety Specialist">Safety Specialist</SelectItem>
                        <SelectItem value="Regulatory Specialist">Regulatory Specialist</SelectItem>
                        <SelectItem value="Project Manager">Project Manager</SelectItem>
                        <SelectItem value="Biostatistician">Biostatistician</SelectItem>
                        <SelectItem value="Central Data Quality Monitor">Central Data Quality Monitor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Contact email for communications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={contactForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="mt-4">
                <FormLabel className="text-sm font-medium">Organization</FormLabel>
                <p className="text-sm mt-1">Internal</p>
                <p className="text-xs text-muted-foreground mt-1">Study team contacts are managed as internal resources.</p>
              </div>
              
              <FormField
                control={contactForm.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Availability (%)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        max={100} 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Percentage of time allocated to this study
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddContactDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createContactMutation.isPending}
                >
                  {createContactMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
                      Adding...
                    </>
                  ) : 'Add Contact'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}