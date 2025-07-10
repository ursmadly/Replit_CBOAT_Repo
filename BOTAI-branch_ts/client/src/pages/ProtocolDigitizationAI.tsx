import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
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
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import ProtocolSectionTree from "@/components/protocol/ProtocolSectionTree";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  File,
  FileText,
  FileUp,
  Upload,
  FilePlus2,
  FileCheck,
  Loader2,
  CheckCircle2,
  Brain,
  BrainCircuit,
  LucideIcon,
  FileDigit,
  Search,
  ArrowRight,
  ArrowLeft,
  TabletSmartphone,
  CheckCheck,
  Plus,
  Trash2,
  Save,
  Download,
  Info,
  Users,
  BarChart2,
  Stethoscope,
  Edit,
  ChevronLeft
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AppLayout from "@/components/layout/AppLayout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Study data types
interface StudyMetadata {
  protocolId: string;
  title: string;
  phase: string;
  indication: string;
  sponsor: string;
  status: 'draft' | 'active' | 'completed' | 'terminated';
  createdDate: string;
  lastModified: string;
}

// Protocol section interface
interface ProtocolSection {
  id: string;
  title: string;
  content: string;
  status: 'incomplete' | 'complete' | 'edited';
  expanded?: boolean;
}

// For organizing protocol sections
interface ProtocolCategory {
  title: string;
  icon: LucideIcon;
  sections: ProtocolSection[];
}

// API response section interface
interface ApiSection {
  id: string;
  title: string;
  content: string;
  status: string;
}

// Sample protocol sections by category
const protocolSectionCategories: ProtocolCategory[] = [
  {
    title: "Study Information",
    icon: FileText,
    sections: [
      { id: "title", title: "Study Title", content: "", status: "incomplete" },
      { id: "protocol-id", title: "Protocol ID", content: "", status: "incomplete" },
      { id: "phase", title: "Study Phase", content: "", status: "incomplete" },
      { id: "sponsor", title: "Sponsor", content: "", status: "incomplete" },
      { id: "investigator", title: "Principal Investigator", content: "", status: "incomplete" },
    ]
  },
  {
    title: "Background & Objectives",
    icon: Brain,
    sections: [
      { id: "background", title: "Background", content: "", status: "incomplete" },
      { id: "objectives-primary", title: "Primary Objectives", content: "", status: "incomplete" },
      { id: "objectives-secondary", title: "Secondary Objectives", content: "", status: "incomplete" },
      { id: "rationale", title: "Study Rationale", content: "", status: "incomplete" },
    ]
  },
  {
    title: "Study Design & Population",
    icon: TabletSmartphone,
    sections: [
      { id: "design", title: "Study Design", content: "", status: "incomplete" },
      { id: "population", title: "Study Population", content: "", status: "incomplete" },
      { id: "inclusion", title: "Inclusion Criteria", content: "", status: "incomplete" },
      { id: "exclusion", title: "Exclusion Criteria", content: "", status: "incomplete" },
      { id: "withdrawal", title: "Withdrawal Criteria", content: "", status: "incomplete" },
    ]
  },
  {
    title: "Treatments & Assessments",
    icon: FileCheck,
    sections: [
      { id: "treatment", title: "Treatment Plan", content: "", status: "incomplete" },
      { id: "dosage", title: "Dosage & Administration", content: "", status: "incomplete" },
      { id: "schedule", title: "Study Procedures Schedule", content: "", status: "incomplete" },
      { id: "assessments", title: "Efficacy Assessments", content: "", status: "incomplete" },
      { id: "safety", title: "Safety Assessments", content: "", status: "incomplete" },
    ]
  },
  {
    title: "Endpoints & Statistics",
    icon: BrainCircuit,
    sections: [
      { id: "endpoints-primary", title: "Primary Endpoints", content: "", status: "incomplete" },
      { id: "endpoints-secondary", title: "Secondary Endpoints", content: "", status: "incomplete" },
      { id: "statistical-methods", title: "Statistical Methods", content: "", status: "incomplete" },
      { id: "sample-size", title: "Sample Size Determination", content: "", status: "incomplete" },
      { id: "analysis", title: "Analysis Sets", content: "", status: "incomplete" },
    ]
  }
];

// Dashboard component for the Protocol Digitization.AI
const ProtocolDigitizationAI: React.FC = () => {
  const [_, navigate] = useLocation();
  const [mode, setMode] = useState<'upload' | 'processing' | 'review' | 'saved' | 'view-study'>('upload');
  const [activeTab, setActiveTab] = useState<'digitize' | 'studies'>('digitize');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [protocolCategories, setProtocolCategories] = useState<ProtocolCategory[]>(protocolSectionCategories);
  const [studyMetadata, setStudyMetadata] = useState<StudyMetadata>({
    protocolId: "",
    title: "",
    phase: "",
    indication: "",
    sponsor: "",
    status: "draft",
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString()
  });
  
  // Selected study for viewing
  const [selectedStudy, setSelectedStudy] = useState<StudyMetadata | null>(null);
  const [digitalizedStudies, setDigitalizedStudies] = useState<StudyMetadata[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Study Information");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Fetch digitalized studies
  useEffect(() => {
    // Demo studies for display only
    setDigitalizedStudies([
      {
        protocolId: "PRO-001-MEL",
        title: "A Phase III Study of Anti-PD-1 Antibody in Advanced Melanoma",
        phase: "Phase III",
        indication: "Melanoma",
        sponsor: "BioPharm Inc.",
        status: "active",
        createdDate: "2023-10-15T08:30:00Z",
        lastModified: "2023-11-02T14:45:00Z"
      },
      {
        protocolId: "PRO-002-T2D",
        title: "Efficacy and Safety of Novel GLP-1 Analog in Type 2 Diabetes",
        phase: "Phase II",
        indication: "Type 2 Diabetes",
        sponsor: "MediScience Ltd.",
        status: "active",
        createdDate: "2023-09-18T10:15:00Z",
        lastModified: "2023-10-25T09:30:00Z"
      },
      {
        protocolId: "PRO-003-RA",
        title: "Evaluation of JAK Inhibitor in Rheumatoid Arthritis",
        phase: "Phase III",
        indication: "Rheumatoid Arthritis",
        sponsor: "Pharma Research Corp.",
        status: "draft",
        createdDate: "2023-11-05T11:20:00Z",
        lastModified: "2023-11-05T11:20:00Z"
      }
    ]);
  }, []);
  
  // Filter studies based on search term
  const filteredStudies = digitalizedStudies.filter(study => 
    study.protocolId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.indication.toLowerCase().includes(searchTerm.toLowerCase()) ||
    study.sponsor.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Protocol digitization process using AI
  const digitizeProtocolMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Processing file:", file.name);
      
      // Set initial progress
      let progress = 0;
      
      // Update progress every 200ms to simulate processing stages (for UI feedback only)
      const progressInterval = setInterval(() => {
        progress += Math.random() * 3 + 1;
        setProcessingProgress(Math.min(Math.round(progress), 95));
      }, 200);
      
      try {
        // Create FormData for file upload with explicit filename
        const formData = new FormData();
        formData.append('protocolFile', file, file.name);
        
        console.log(`Uploading file: ${file.name} (${file.size} bytes)`);
        
        // Send to our API endpoint
        const response = await fetch('/api/openai/process-protocol', {
          method: 'POST',
          body: formData,
          credentials: 'include', // include cookies for authentication
        });
        
        // Check if the request was successful
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to process protocol document');
        }
        
        // Parse the response
        const data = await response.json();
        console.log('Received data from API:', data);
        
        // Complete the progress indicator
        clearInterval(progressInterval);
        setProcessingProgress(100);
        
        // Wait to show complete progress
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if data has the expected structure
        if (!data.sections || !Array.isArray(data.sections)) {
          console.error('Invalid data structure received from API. Missing sections array:', data);
          throw new Error('Invalid data structure received from API');
        }
        
        console.log('Processing sections:', data.sections);
        
        // Map the API response to our expected format
        const mappedSections = data.sections.map((section: ApiSection) => {
          console.log('Processing section:', section);
          return {
            id: section.id,
            title: section.title,
            content: section.content,
            status: section.status as 'complete' | 'incomplete' | 'edited'
          };
        });
        
        // Return both metadata and extracted sections
        return {
          metadata: {
            ...data.metadata,
            status: data.metadata.status as StudyMetadata['status']
          },
          sections: mappedSections
        };
      } catch (error) {
        console.error('Error processing protocol:', error);
        
        // Stop the progress animation
        clearInterval(progressInterval);
        
        // Re-throw the error to be handled by the mutation
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update study metadata
      setStudyMetadata(data.metadata);
      console.log('Setting extracted sections:', data.sections);
      
      // Create a new protocol structure based directly on the extracted sections
      // Group them into logical categories
      const studyInfoSections = ['background', 'study-rationale', 'study-design'];
      const eligibilitySections = ['inclusion-criteria', 'exclusion-criteria', 'study-population'];
      const endpointSections = ['primary-endpoints', 'secondary-endpoints', 'statistical-considerations'];
      const treatmentSections = ['treatment-plan', 'safety-assessment'];
      const otherSections: string[] = []; // For any sections that don't fit the above categories
      
      // Classify each extracted section into the appropriate category
      data.sections.forEach((section: ApiSection) => {
        if (!section.id) {
          console.warn('Section missing ID:', section);
          return;
        }
        
        if (!section.content) {
          console.warn('Section missing content:', section.id);
          section.content = '';
        }
        
        if (!studyInfoSections.includes(section.id) && 
            !eligibilitySections.includes(section.id) && 
            !endpointSections.includes(section.id) &&
            !treatmentSections.includes(section.id)) {
          otherSections.push(section.id);
        }
      });
      
      // Build new categories with sections
      const newCategories: ProtocolCategory[] = [
        {
          title: 'Study Information',
          icon: Info,
          sections: data.sections
            .filter((s: ApiSection) => studyInfoSections.includes(s.id))
            .map((s: ApiSection) => ({
              id: s.id,
              title: s.title || s.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              content: s.content,
              status: s.status as 'incomplete' | 'complete' | 'edited',
              expanded: true
            }))
        },
        {
          title: 'Eligibility Criteria',
          icon: Users,
          sections: data.sections
            .filter((s: ApiSection) => eligibilitySections.includes(s.id))
            .map((s: ApiSection) => ({
              id: s.id,
              title: s.title || s.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              content: s.content,
              status: s.status as 'incomplete' | 'complete' | 'edited',
              expanded: true
            }))
        },
        {
          title: 'Endpoints & Analysis',
          icon: BarChart2,
          sections: data.sections
            .filter((s: ApiSection) => endpointSections.includes(s.id))
            .map((s: ApiSection) => ({
              id: s.id,
              title: s.title || s.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              content: s.content,
              status: s.status as 'incomplete' | 'complete' | 'edited',
              expanded: true
            }))
        },
        {
          title: 'Treatment & Safety',
          icon: Stethoscope,
          sections: data.sections
            .filter((s: ApiSection) => treatmentSections.includes(s.id))
            .map((s: ApiSection) => ({
              id: s.id,
              title: s.title || s.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              content: s.content,
              status: s.status as 'incomplete' | 'complete' | 'edited',
              expanded: true
            }))
        },
        {
          title: 'Other Information',
          icon: FileText,
          sections: data.sections
            .filter((s: ApiSection) => otherSections.includes(s.id as string))
            .map((s: ApiSection) => ({
              id: s.id,
              title: s.title || s.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
              content: s.content,
              status: s.status as 'incomplete' | 'complete' | 'edited',
              expanded: true
            }))
        }
      ];
      
      // Filter out empty categories
      const filteredCategories = newCategories.filter(category => category.sections.length > 0);
      console.log('Created new categories:', filteredCategories);
      
      setProtocolCategories(filteredCategories);
      // Move to review mode
      setMode('review');
      
      toast({
        title: "Protocol successfully digitized!",
        description: "AI has extracted structured content from your document.",
      });
    },
    onError: (error) => {
      console.error("Error digitizing protocol:", error);
      toast({
        title: "Error digitizing protocol",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      // Reset to upload mode
      setMode('upload');
    }
  });
  
  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      toast({
        title: "File selected",
        description: `${files[0].name} is ready for digitization.`,
      });
    }
  };
  
  // Start digitization process
  const startDigitization = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a protocol document to digitize.",
        variant: "destructive"
      });
      return;
    }
    
    // Update UI state
    setMode('processing');
    setProcessingProgress(0);
    
    // Start the digitization process
    digitizeProtocolMutation.mutate(selectedFile);
  };
  
  // Save the study after review
  const saveStudy = () => {
    // In a real implementation, this would save to the database
    
    // For demo, just add to the list of digitalized studies
    const newStudyList = [...digitalizedStudies];
    // Check if the study already exists
    const existingIndex = newStudyList.findIndex(s => s.protocolId === studyMetadata.protocolId);
    
    if (existingIndex >= 0) {
      // Update existing study
      newStudyList[existingIndex] = { 
        ...studyMetadata,
        lastModified: new Date().toISOString()
      };
    } else {
      // Add new study
      newStudyList.push({
        ...studyMetadata,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      });
    }
    
    setDigitalizedStudies(newStudyList);
    setMode('saved');
    
    toast({
      title: "Study saved successfully!",
      description: `Protocol ${studyMetadata.protocolId} has been saved to the system.`,
    });
  };
  
  // Update a section's content
  const updateSectionContent = (categoryIndex: number, sectionIndex: number, newContent: string) => {
    const updatedCategories = [...protocolCategories];
    updatedCategories[categoryIndex].sections[sectionIndex].content = newContent;
    updatedCategories[categoryIndex].sections[sectionIndex].status = 'edited';
    setProtocolCategories(updatedCategories);
  };
  
  // Reset to initial upload state
  const resetToUpload = () => {
    setMode('upload');
    setSelectedFile(null);
    setProcessingProgress(0);
    setProtocolCategories(protocolSectionCategories);
    setStudyMetadata({
      protocolId: "",
      title: "",
      phase: "",
      indication: "",
      sponsor: "",
      status: "draft",
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    });
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Add a new custom section
  const addCustomSection = (categoryIndex: number) => {
    const newSectionTitle = prompt("Enter section title");
    if (!newSectionTitle) return;
    
    const updatedCategories = [...protocolCategories];
    const newSection: ProtocolSection = {
      id: `custom-${Date.now()}`,
      title: newSectionTitle,
      content: "",
      status: "incomplete"
    };
    
    updatedCategories[categoryIndex].sections.push(newSection);
    setProtocolCategories(updatedCategories);
  };
  
  // Delete a section
  const deleteSection = (categoryIndex: number, sectionIndex: number) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
      const updatedCategories = [...protocolCategories];
      updatedCategories[categoryIndex].sections.splice(sectionIndex, 1);
      setProtocolCategories(updatedCategories);
    }
  };
  
  // Handle opening a study
  const openStudy = (study: StudyMetadata) => {
    setSelectedStudy(study);
    setStudyMetadata(study);
    setMode('view-study');
    setActiveTab('digitize'); // Switch to digitize tab to show the study
  };
  
  // Return to studies list
  const backToStudies = () => {
    setSelectedStudy(null);
    setMode('upload');
    setActiveTab('studies');
  };
  
  // Generate page content based on current mode
  const renderContent = () => {
    // If a study is selected for viewing, show it regardless of the active tab
    if (mode === 'view-study' && selectedStudy) {
      return renderViewStudyMode();
    }
    
    switch (activeTab) {
      case 'digitize':
        return renderDigitizeTab();
      case 'studies':
        return renderStudiesTab();
      default:
        return renderDigitizeTab();
    }
  };
  
  // Digitize tab content
  const renderDigitizeTab = () => {
    switch (mode) {
      case 'upload':
        return (
          <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-950 rounded-lg py-12 px-6 max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <BrainCircuit className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Protocol Digitization Agent</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Upload a clinical protocol document (PDF or Word) and our AI will convert it into a structured digital format.
              </p>
            </div>
            
            <div className="w-full max-w-md mb-8">
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="mx-auto h-12 w-12 text-primary mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Drop your protocol document here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supports PDF, DOC, DOCX formats
                </p>
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileChange}
                />
              </div>
              
              {selectedFile && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button 
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            
            <Button 
              className="w-full max-w-md" 
              onClick={startDigitization}
              disabled={!selectedFile}
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              Digitize Protocol
            </Button>
            
            <div className="w-full max-w-md mt-8 space-y-3">
              <Alert>
                <FileCheck className="h-4 w-4" />
                <AlertTitle>Intelligent Document Processing</AlertTitle>
                <AlertDescription>
                  Our AI will extract key sections like objectives, inclusion/exclusion criteria, endpoints, and more.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <TabletSmartphone className="h-4 w-4" />
                <AlertTitle>Create Digital Study Components</AlertTitle>
                <AlertDescription>
                  Automatically generate structured, editable components from your document that will help organize your study.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="bg-white dark:bg-gray-950 rounded-lg py-12 px-6 max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-900" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Processing Your Protocol</h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                Our AI is analyzing your document and extracting structured content
              </p>
              
              <div className="w-full max-w-md mx-auto mb-2">
                <Progress value={processingProgress} className="h-2" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {processingProgress}% complete
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className={`rounded-lg p-4 border ${processingProgress >= 30 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Document Analysis</h3>
                  {processingProgress >= 30 && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Extracting text and document structure</p>
              </div>
              
              <div className={`rounded-lg p-4 border ${processingProgress >= 60 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Protocol Parsing</h3>
                  {processingProgress >= 60 && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Identifying protocol sections and hierarchies</p>
              </div>
              
              <div className={`rounded-lg p-4 border ${processingProgress >= 90 ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Content Extraction</h3>
                  {processingProgress >= 90 && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Extracting and structuring protocol content</p>
              </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              <p>Processing time depends on document length and complexity. This might take a few minutes.</p>
            </div>
          </div>
        );
        
      case 'review':
        return (
          <div className="bg-white dark:bg-gray-950 rounded-lg p-6">
            <div className="mb-6 border-b pb-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{studyMetadata.title || "New Protocol"}</h2>
                  <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium mr-2">Protocol ID:</span>
                    <span>{studyMetadata.protocolId}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium mr-2">Phase:</span>
                    <span>{studyMetadata.phase}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium mr-2">Indication:</span>
                    <span>{studyMetadata.indication}</span>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                  {studyMetadata.status === 'draft' ? 'Draft' : studyMetadata.status}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Sponsor:</span> {studyMetadata.sponsor}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetToUpload}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Different Document
                  </Button>
                  <Button size="sm" onClick={saveStudy}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Study
                  </Button>
                </div>
              </div>
            </div>
            
            <Alert className="mb-6">
              <CheckCheck className="h-4 w-4" />
              <AlertTitle>Protocol Successfully Digitized</AlertTitle>
              <AlertDescription>
                The AI has extracted structured content from your document. You can review and edit each section before saving.
              </AlertDescription>
            </Alert>
            
            <ProtocolSectionTree
              categories={protocolCategories}
              onSectionUpdate={updateSectionContent}
              onAddSection={addCustomSection}
              onDeleteSection={deleteSection}
              saveEnabled={true}
              onSave={saveStudy}
            />
          </div>
        );
        
      case 'saved':
        return (
          <div className="bg-white dark:bg-gray-950 rounded-lg py-12 px-6 max-w-3xl mx-auto text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Protocol Successfully Saved!</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
              Your protocol document has been digitized and saved to the system.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-md mx-auto mb-8">
              <div className="text-left mb-4">
                <h3 className="text-lg font-semibold">{studyMetadata.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Protocol ID: {studyMetadata.protocolId}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Phase</p>
                  <p>{studyMetadata.phase}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Indication</p>
                  <p>{studyMetadata.indication}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Sponsor</p>
                  <p>{studyMetadata.sponsor}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium">Status</p>
                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    {studyMetadata.status === 'draft' ? 'Draft' : studyMetadata.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={resetToUpload}>
                <Upload className="mr-2 h-4 w-4" />
                Digitize Another Protocol
              </Button>
              <Button onClick={() => setActiveTab('studies')}>
                <ArrowRight className="mr-2 h-4 w-4" />
                View All Studies
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };
  
  // View Study mode
  const renderViewStudyMode = () => {
    if (!selectedStudy) return null;
    
    return (
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6">
        <div className="mb-6 border-b pb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">{studyMetadata.title}</h2>
              <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium mr-2">Protocol ID:</span>
                <span>{studyMetadata.protocolId}</span>
                <span className="mx-2">•</span>
                <span className="font-medium mr-2">Phase:</span>
                <span>{studyMetadata.phase}</span>
                <span className="mx-2">•</span>
                <span className="font-medium mr-2">Indication:</span>
                <span>{studyMetadata.indication}</span>
              </div>
            </div>
            <Badge 
              className={
                studyMetadata.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                studyMetadata.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                studyMetadata.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }
            >
              {studyMetadata.status.charAt(0).toUpperCase() + studyMetadata.status.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Sponsor:</span> {studyMetadata.sponsor}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={backToStudies}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Studies
              </Button>
              <Button size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Protocol
              </Button>
            </div>
          </div>
        </div>
        
        <ProtocolSectionTree
          categories={protocolCategories.length > 0 ? protocolCategories : [
            {
              title: 'Study Information',
              icon: Info,
              sections: [
                {
                  id: 'placeholder-info',
                  title: 'Study Information',
                  content: 'This protocol was imported from an existing study. Select "Edit Protocol" to add detailed section content.',
                  status: 'incomplete'
                }
              ]
            }
          ]}
          onSectionUpdate={updateSectionContent}
          onAddSection={addCustomSection}
          onDeleteSection={deleteSection}
          saveEnabled={false}
        />
      </div>
    );
  };
  
  // Studies tab content
  const renderStudiesTab = () => {
    return (
      <div className="bg-white dark:bg-gray-950 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Digitalized Protocols</h2>
          <Button onClick={() => {
            resetToUpload();
            setActiveTab('digitize');
          }}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Digitize New Protocol
          </Button>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search protocols by ID, title, indication..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {filteredStudies.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No Protocols Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? "No protocols match your search criteria. Try a different search term." 
                : "You haven't digitized any protocols yet. Click 'Digitize New Protocol' to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudies.map((study) => (
              <Card 
                key={study.protocolId} 
                className="hover:border-primary cursor-pointer transition-all"
                onClick={() => {
                  setSelectedStudy(study);
                  setStudyMetadata(study);
                  setMode('view-study');
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge
                      className={
                        study.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        study.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                        study.status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }
                    >
                      {study.status.charAt(0).toUpperCase() + study.status.slice(1)}
                    </Badge>
                    <FileDigit className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg mt-2">{study.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Protocol ID:</span>
                      <span className="font-medium">{study.protocolId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phase:</span>
                      <span>{study.phase}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Indication:</span>
                      <span>{study.indication}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Sponsor:</span>
                      <span>{study.sponsor}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between text-xs text-gray-500 border-t">
                  <span>Created: {new Date(study.createdDate).toLocaleDateString()}</span>
                  <span>Modified: {new Date(study.lastModified).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <AppLayout
      title="Protofast.AI"
      subtitle="AI-powered agent for converting protocol documents into structured digital components"
    >
      {/* Back to AI Agents Hub button */}
      <div className="mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate("/ai-agents")} 
          className="flex items-center gap-1 text-pink-600 hover:text-pink-700 border-pink-200 hover:bg-pink-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to AI Agents Hub
        </Button>
      </div>
      
      <Tabs defaultValue="digitize" className="w-full" onValueChange={(value) => setActiveTab(value as 'digitize' | 'studies')}>
        <div className="flex items-center mb-6">
          <TabsList className="mr-6">
            <TabsTrigger value="digitize" className="px-6">
              <BrainCircuit className="mr-2 h-4 w-4" />
              Digitize Protocol
            </TabsTrigger>
            <TabsTrigger value="studies" className="px-6">
              <FileText className="mr-2 h-4 w-4" />
              Digitalized Studies
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="digitize" className="mt-0">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="studies" className="mt-0">
          {renderContent()}
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ProtocolDigitizationAI;