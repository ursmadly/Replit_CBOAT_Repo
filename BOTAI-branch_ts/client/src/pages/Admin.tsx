import React, { useState } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, Users, Settings, FileText, UserPlus, Lock, Eye, 
  EyeOff, Edit, Trash2, Search, AlertTriangle, CheckCircle, 
  Database, Activity, ChevronDown, UserCog, KeyRound, BarChart, 
  GanttChart, ListFilter, UploadCloud, Download, Mail, Bell,
  Network, GitBranch
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

// Define types for roles and permissions
interface SystemRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  users: number;
  isDefault: boolean;
  createdAt: string;
  updatedBy: string;
}

interface Permission {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'locked';
  lastLogin: string;
  createdAt: string;
  studyAccess: string[];
}

interface MenuOption {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  visible: boolean;
  roles: string[];
  order: number;
}

export default function Admin() {
  const { toast } = useToast();
  
  // Tabs state
  const [activeTab, setActiveTab] = useState("users");
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Password change functionality
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Error", 
        description: "New password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: passwordForm.username,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        });
        setShowPasswordDialog(false);
        setPasswordForm({
          username: "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to change password",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  // Export Technical Details functionality
  const exportTechnicalDetails = async (format: 'pdf' | 'ppt') => {
    try {
      const filename = `clinical-agents-technical-docs-${new Date().toISOString().split('T')[0]}`;
      
      // Function to capture the entire Technical Details tab content as an image
      const captureTechnicalDetailsTab = async (tabName: string): Promise<string | null> => {
        console.log(`Capturing Technical Details tab: ${tabName}`);
        
        // First, ensure we're in the Technical Details section
        const technicalDetailsTab = document.querySelector('button[data-value="technical-details"]') as HTMLElement;
        if (technicalDetailsTab && !technicalDetailsTab.getAttribute('data-state')?.includes('active')) {
          technicalDetailsTab.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Find the specific tab button by text content
        const allButtons = document.querySelectorAll('button');
        let targetTab = null;
        
        for (const button of allButtons) {
          const buttonText = button.textContent?.toLowerCase().trim();
          if (buttonText === tabName.toLowerCase() || 
              buttonText === tabName.replace('-', ' ').toLowerCase() ||
              (tabName === 'architecture' && buttonText?.includes('architecture')) ||
              (tabName === 'data-model' && buttonText?.includes('data model')) ||
              (tabName === 'application-flow' && buttonText?.includes('application flow'))) {
            targetTab = button as HTMLElement;
            break;
          }
        }
        
        if (targetTab) {
          console.log(`Found and clicking ${tabName} tab`);
          targetTab.click();
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for content to render
        }
        
        // Find the tab content panel that's currently active
        const contentSelectors = [
          '[data-state="active"][role="tabpanel"]',
          '[data-state="active"]',
          '.tab-content',
          '[role="tabpanel"]:not([hidden])'
        ];
        
        let contentElement = null;
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector) as HTMLElement;
          if (element && element.offsetWidth > 200 && element.offsetHeight > 200) {
            contentElement = element;
            console.log(`Found content element: ${element.offsetWidth}x${element.offsetHeight}`);
            break;
          }
        }
        
        if (!contentElement) {
          console.warn(`No content element found for ${tabName}`);
          return null;
        }
        
        try {
          // Capture the entire tab content
          const canvas = await html2canvas(contentElement, {
            backgroundColor: '#ffffff',
            scale: 1.2,
            useCORS: true,
            allowTaint: true,
            foreignObjectRendering: true,
            logging: false,
            width: contentElement.offsetWidth,
            height: contentElement.offsetHeight,
            removeContainer: false
          });
          
          const dataUrl = canvas.toDataURL('image/png', 0.95);
          console.log(`Successfully captured ${tabName} content`);
          return dataUrl;
        } catch (error) {
          console.error(`Failed to capture ${tabName} content:`, error);
          return null;
        }
      };
      
      // Add debugging and capture all three diagrams
      console.log('Starting diagram capture process...');
      
      // Show user a progress indicator
      const progressDiv = document.createElement('div');
      progressDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid #3B82F6; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
      progressDiv.innerHTML = '<div style="text-align: center;"><div style="font-weight: bold; margin-bottom: 10px;">Capturing Diagrams...</div><div id="progress-text">Preparing capture...</div></div>';
      document.body.appendChild(progressDiv);
      
      const updateProgress = (text: string) => {
        const progressText = document.getElementById('progress-text');
        if (progressText) progressText.textContent = text;
      };
      
      updateProgress('Capturing Architecture tab...');
      const architectureDiagram = await captureTechnicalDetailsTab('architecture');
      
      updateProgress('Capturing Data Model tab...');
      const dataModelDiagram = await captureTechnicalDetailsTab('data-model');
      
      updateProgress('Capturing Application Flow tab...');
      const applicationFlowDiagram = await captureTechnicalDetailsTab('application-flow');
      
      // Remove progress indicator
      document.body.removeChild(progressDiv);
      
      console.log('Diagram capture results:', {
        architecture: architectureDiagram ? 'captured' : 'failed',
        dataModel: dataModelDiagram ? 'captured' : 'failed',
        applicationFlow: applicationFlowDiagram ? 'captured' : 'failed'
      });
      
      if (format === 'pdf') {
        // Create PDF document
        const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
        
        // Title page
        pdf.setFontSize(28);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Clinical Agents', 148, 50, { align: 'center' });
        
        pdf.setFontSize(20);
        pdf.setTextColor(75, 85, 99);
        pdf.text('Technical Documentation', 148, 70, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setTextColor(107, 114, 128);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 148, 90, { align: 'center' });
        pdf.text('Version 1.0', 148, 105, { align: 'center' });
        
        // System Architecture page
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);
        pdf.text('System Architecture', 20, 20);
        
        if (architectureDiagram) {
          // Add the captured architecture diagram
          pdf.addImage(architectureDiagram, 'PNG', 20, 30, 250, 150);
        } else {
          // Fallback text if diagram capture fails
          pdf.setFontSize(12);
          pdf.setTextColor(220, 38, 38);
          pdf.text('Architecture diagram could not be captured. Please view the diagram in the application.', 20, 40);
        }
        
        // Data Model page
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);
        pdf.text('SDTM Data Model', 20, 20);
        
        if (dataModelDiagram) {
          // Add the captured data model diagram
          pdf.addImage(dataModelDiagram, 'PNG', 20, 30, 250, 150);
        } else {
          // Fallback text if diagram capture fails
          pdf.setFontSize(12);
          pdf.setTextColor(220, 38, 38);
          pdf.text('Data Model diagram could not be captured. Please view the diagram in the application.', 20, 40);
        }
        
        // Application Flow page
        pdf.addPage();
        pdf.setFontSize(20);
        pdf.setTextColor(31, 41, 55);
        pdf.text('Application Workflow', 20, 20);
        
        if (applicationFlowDiagram) {
          // Add the captured application flow diagram
          pdf.addImage(applicationFlowDiagram, 'PNG', 20, 30, 250, 150);
        } else {
          // Fallback text if diagram capture fails
          pdf.setFontSize(12);
          pdf.setTextColor(220, 38, 38);
          pdf.text('Application Flow diagram could not be captured. Please view the diagram in the application.', 20, 40);
        }
        
        // Save PDF
        pdf.save(`${filename}.pdf`);
        
      } else if (format === 'ppt') {
        // Create PowerPoint presentation
        const pptx = new PptxGenJS();
        
        // Set presentation properties
        pptx.author = 'Clinical Agents Platform';
        pptx.company = 'Clinical Research Organization';
        pptx.title = 'Clinical Agents Technical Documentation';
        
        // Slide 1: Title
        const slide1 = pptx.addSlide();
        slide1.addText('Clinical Agents', {
          x: 1, y: 2, w: 8, h: 1.5,
          fontSize: 48, fontFace: 'Arial', color: '1F2937', bold: true, align: 'center'
        });
        slide1.addText('Technical Documentation', {
          x: 1, y: 3.5, w: 8, h: 1,
          fontSize: 32, fontFace: 'Arial', color: '4B5563', align: 'center'
        });
        slide1.addText(`Generated: ${new Date().toLocaleDateString()}`, {
          x: 1, y: 5.5, w: 8, h: 0.5,
          fontSize: 16, fontFace: 'Arial', color: '6B7280', align: 'center'
        });
        
        // Slide 2: Platform Overview
        const slide2 = pptx.addSlide();
        slide2.addText('Platform Overview', {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 32, fontFace: 'Arial', color: '1F2937', bold: true
        });
        slide2.addText([
          { text: 'AI-Powered Clinical Trial Management', options: { fontSize: 24, bold: true, color: '3B82F6' } },
          { text: '\n\n• Intelligent risk monitoring and signal detection', options: { fontSize: 18, bullet: true } },
          { text: '• SDTM-compliant data management', options: { fontSize: 18, bullet: true } },
          { text: '• Real-time workflow automation', options: { fontSize: 18, bullet: true } },
          { text: '• Role-based access control', options: { fontSize: 18, bullet: true } },
          { text: '• Multi-source data integration', options: { fontSize: 18, bullet: true } },
          { text: '• Regulatory compliance tracking', options: { fontSize: 18, bullet: true } }
        ], { x: 0.5, y: 1.5, w: 9, h: 5 });
        
        // Slide 3: System Architecture
        const slide3 = pptx.addSlide();
        slide3.addText('System Architecture', {
          x: 0.5, y: 0.5, w: 9, h: 0.8,
          fontSize: 32, fontFace: 'Arial', color: '1F2937', bold: true
        });
        if (architectureDiagram) {
          slide3.addImage({
            data: architectureDiagram,
            x: 1, y: 1.2, w: 8, h: 5
          });
        } else {
          slide3.addText('Architecture diagram could not be captured.\nPlease view the diagram in the application.', {
            x: 1, y: 3, w: 8, h: 2,
            fontSize: 18, fontFace: 'Arial', color: 'DC2626', align: 'center'
          });
        }
        
        // Slide 4: Data Model with diagram
        const slide4 = pptx.addSlide();
        slide4.addText('SDTM Data Model', {
          x: 0.5, y: 0.3, w: 9, h: 0.8,
          fontSize: 32, fontFace: 'Arial', color: '1F2937', bold: true
        });
        
        if (dataModelDiagram) {
          slide4.addImage({
            data: dataModelDiagram,
            x: 1, y: 1.2, w: 8, h: 5
          });
        } else {
          slide4.addText('Data Model diagram could not be captured.\nPlease view the diagram in the application.', {
            x: 1, y: 3, w: 8, h: 2,
            fontSize: 18, fontFace: 'Arial', color: 'DC2626', align: 'center'
          });
        }
        
        // Slide 5: Application Flow with diagram
        const slide5 = pptx.addSlide();
        slide5.addText('Application Workflow', {
          x: 0.5, y: 0.3, w: 9, h: 0.8,
          fontSize: 32, fontFace: 'Arial', color: '1F2937', bold: true
        });
        
        if (applicationFlowDiagram) {
          slide5.addImage({
            data: applicationFlowDiagram,
            x: 1, y: 1.2, w: 8, h: 5
          });
        } else {
          slide5.addText('Application Flow diagram could not be captured.\nPlease view the diagram in the application.', {
            x: 1, y: 3, w: 8, h: 2,
            fontSize: 18, fontFace: 'Arial', color: 'DC2626', align: 'center'
          });
        }
        
        // Save PowerPoint using write method
        const pptxData = await pptx.write({ outputType: 'blob' });
        if (pptxData instanceof Blob) {
          const url = URL.createObjectURL(pptxData);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.pptx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      
    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Export failed: ${errorMessage}. Please try again.`);
    }
  };

  // Sample data - roles
  const [roles, setRoles] = useState<SystemRole[]>([
    {
      id: "role-1",
      name: "System Administrator",
      description: "Full access to all system functions and settings",
      permissions: [],
      users: 3,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-2",
      name: "Clinical Operations Manager",
      description: "Manage clinical operations, studies, and monitoring activities",
      permissions: [],
      users: 8,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-3",
      name: "Data Manager",
      description: "Manage clinical data, queries, and data cleaning",
      permissions: [],
      users: 12,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-4",
      name: "Clinical Research Associate",
      description: "Monitor sites, review data, and manage site-related activities",
      permissions: [],
      users: 25,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-5",
      name: "Medical Monitor",
      description: "Review medical data, safety assessments, and provide medical expertise",
      permissions: [],
      users: 7,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-6",
      name: "Biostatistician",
      description: "Analyze trial data and generate statistical reports",
      permissions: [],
      users: 5,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-7",
      name: "Safety Specialist",
      description: "Monitor and assess safety signals and adverse events",
      permissions: [],
      users: 6,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-8",
      name: "Regulatory Affairs",
      description: "Manage regulatory documents and compliance",
      permissions: [],
      users: 4,
      isDefault: false,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    },
    {
      id: "role-9",
      name: "Read-Only User",
      description: "View-only access to system data",
      permissions: [],
      users: 15,
      isDefault: true,
      createdAt: "2025-01-15T10:30:00Z",
      updatedBy: "John Doe"
    }
  ]);

  // Sample data - permissions by category
  const permissionCategories: PermissionCategory[] = [
    {
      name: "Studies",
      permissions: [
        { id: "perm-1", name: "Create Study", category: "Studies", description: "Create new clinical trial studies" },
        { id: "perm-2", name: "Edit Study", category: "Studies", description: "Edit existing study information" },
        { id: "perm-3", name: "Delete Study", category: "Studies", description: "Delete studies from the system" },
        { id: "perm-4", name: "View Study", category: "Studies", description: "View study details" }
      ]
    },
    {
      name: "Users",
      permissions: [
        { id: "perm-5", name: "Create User", category: "Users", description: "Create new user accounts" },
        { id: "perm-6", name: "Edit User", category: "Users", description: "Edit user account information" },
        { id: "perm-7", name: "Delete User", category: "Users", description: "Delete user accounts" },
        { id: "perm-8", name: "View Users", category: "Users", description: "View user account details" }
      ]
    },
    {
      name: "Data Management",
      permissions: [
        { id: "perm-9", name: "Import Data", category: "Data Management", description: "Import data into the system" },
        { id: "perm-10", name: "Export Data", category: "Data Management", description: "Export data from the system" },
        { id: "perm-11", name: "Edit Data", category: "Data Management", description: "Edit clinical data" },
        { id: "perm-12", name: "View Data", category: "Data Management", description: "View clinical data" }
      ]
    },
    {
      name: "Signal Detection",
      permissions: [
        { id: "perm-13", name: "Run Signal Detection", category: "Signal Detection", description: "Execute signal detection algorithms" },
        { id: "perm-14", name: "Edit Signals", category: "Signal Detection", description: "Edit detected signals" },
        { id: "perm-15", name: "Review Signals", category: "Signal Detection", description: "Review and approve/reject signals" },
        { id: "perm-16", name: "View Signals", category: "Signal Detection", description: "View detected signals" }
      ]
    },
    {
      name: "Tasks",
      permissions: [
        { id: "perm-17", name: "Create Tasks", category: "Tasks", description: "Create new tasks" },
        { id: "perm-18", name: "Assign Tasks", category: "Tasks", description: "Assign tasks to users" },
        { id: "perm-19", name: "Complete Tasks", category: "Tasks", description: "Mark tasks as complete" },
        { id: "perm-20", name: "View Tasks", category: "Tasks", description: "View task details" }
      ]
    },
    {
      name: "System",
      permissions: [
        { id: "perm-21", name: "Configure System", category: "System", description: "Configure system settings" },
        { id: "perm-22", name: "Manage Integrations", category: "System", description: "Manage third-party integrations" },
        { id: "perm-23", name: "View Audit Logs", category: "System", description: "View system audit logs" },
        { id: "perm-24", name: "Backup/Restore", category: "System", description: "Perform system backups and restores" }
      ]
    }
  ];

  // Sample data - users
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      username: "nivaasgd",
      fullName: "Nivaas Damotharan",
      email: "nivaasg@hexaware.com",
      role: "Medical Monitor",
      status: "active",
      lastLogin: "2025-04-22T10:30:00Z",
      createdAt: "2025-04-22T10:00:00Z",
      studyAccess: ["ABC-123", "XYZ-789"]
    },
    {
      id: 2,
      username: "madhu",
      fullName: "Madhu",
      email: "orugantir@hexaware.com",
      role: "System Administrator",
      status: "active",
      lastLogin: "2025-04-22T10:00:00Z",
      createdAt: "2025-04-22T09:00:00Z",
      studyAccess: ["All Studies"]
    },
    {
      id: 3,
      username: "johndoe",
      fullName: "John Doe",
      email: "john.doe@example.com",
      role: "System Administrator",
      status: "active",
      lastLogin: "2025-04-08T09:30:00Z",
      createdAt: "2024-12-15T10:30:00Z",
      studyAccess: ["All Studies"]
    },
    {
      id: 4,
      username: "janedoe",
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      role: "Clinical Operations Manager",
      status: "active",
      lastLogin: "2025-04-07T14:45:00Z",
      createdAt: "2024-12-15T10:35:00Z",
      studyAccess: ["ABC-123", "XYZ-789", "DEF-456"]
    },
    {
      id: 5,
      username: "mikesmith",
      fullName: "Mike Smith",
      email: "mike.smith@example.com",
      role: "Data Manager",
      status: "active",
      lastLogin: "2025-04-08T08:15:00Z",
      createdAt: "2024-12-15T11:00:00Z",
      studyAccess: ["ABC-123", "XYZ-789"]
    },
    {
      id: 6,
      username: "sarahjones",
      fullName: "Sarah Jones",
      email: "sarah.jones@example.com",
      role: "Clinical Research Associate",
      status: "active",
      lastLogin: "2025-04-07T16:20:00Z",
      createdAt: "2024-12-16T09:15:00Z",
      studyAccess: ["ABC-123"]
    },
    {
      id: 7,
      username: "robertchen",
      fullName: "Robert Chen",
      email: "robert.chen@example.com",
      role: "Medical Monitor",
      status: "active",
      lastLogin: "2025-04-06T11:10:00Z",
      createdAt: "2024-12-16T09:30:00Z",
      studyAccess: ["ABC-123", "DEF-456"]
    },
    {
      id: 8,
      username: "emilyparker",
      fullName: "Emily Parker",
      email: "emily.parker@example.com",
      role: "Biostatistician",
      status: "inactive",
      lastLogin: "2025-03-15T10:45:00Z",
      createdAt: "2024-12-16T10:00:00Z",
      studyAccess: ["XYZ-789"]
    },
    {
      id: 9,
      username: "davidwilson",
      fullName: "David Wilson",
      email: "david.wilson@example.com",
      role: "Safety Specialist",
      status: "active",
      lastLogin: "2025-04-08T07:30:00Z",
      createdAt: "2024-12-17T14:20:00Z",
      studyAccess: ["ABC-123", "XYZ-789", "DEF-456"]
    },
    {
      id: 10,
      username: "jenniferlee",
      fullName: "Jennifer Lee",
      email: "jennifer.lee@example.com",
      role: "Regulatory Affairs",
      status: "locked",
      lastLogin: "2025-03-01T09:00:00Z",
      createdAt: "2024-12-17T14:45:00Z",
      studyAccess: ["ABC-123"]
    },
    {
      id: 11,
      username: "michaeljohnson",
      fullName: "Michael Johnson",
      email: "michael.johnson@example.com",
      role: "Read-Only User",
      status: "active",
      lastLogin: "2025-04-07T15:30:00Z",
      createdAt: "2024-12-18T11:15:00Z",
      studyAccess: ["XYZ-789"]
    }
  ]);

  // Sample data - menu options
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([
    { 
      id: "menu-1", 
      name: "Dashboard", 
      path: "/", 
      icon: <BarChart className="h-4 w-4" />, 
      visible: true, 
      roles: ["All Roles"],
      order: 1
    },
    { 
      id: "menu-2", 
      name: "Protocol Document Management", 
      path: "/protocol-doc-management", 
      icon: <FileText className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Clinical Operations Manager", "Data Manager", "Medical Monitor", "Regulatory Affairs"],
      order: 2
    },
    { 
      id: "menu-3", 
      name: "Study Management", 
      path: "/study-management", 
      icon: <GanttChart className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Clinical Operations Manager", "Data Manager", "Medical Monitor", "Regulatory Affairs"],
      order: 3
    },
    { 
      id: "menu-4", 
      name: "Data Integration", 
      path: "/data-integration", 
      icon: <Database className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Data Manager", "Biostatistician"],
      order: 4
    },
    { 
      id: "menu-5", 
      name: "Trial Data Management", 
      path: "/trial-data-management", 
      icon: <Database className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Data Manager", "Clinical Research Associate", "Biostatistician"],
      order: 5
    },
    { 
      id: "menu-6", 
      name: "Data Management", 
      path: "/data-management", 
      icon: <ListFilter className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Data Manager", "Biostatistician"],
      order: 6
    },
    { 
      id: "menu-7", 
      name: "Signal Detection", 
      path: "/signal-detection", 
      icon: <AlertTriangle className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Clinical Operations Manager", "Data Manager", "Medical Monitor", "Safety Specialist"],
      order: 7
    },
    { 
      id: "menu-8", 
      name: "Tasks", 
      path: "/tasks", 
      icon: <CheckCircle className="h-4 w-4" />, 
      visible: true, 
      roles: ["All Roles"],
      order: 8
    },
    { 
      id: "menu-9", 
      name: "Risk Profiles", 
      path: "/risk-profiles", 
      icon: <Activity className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Clinical Operations Manager", "Data Manager", "Medical Monitor"],
      order: 9
    },
    { 
      id: "menu-10", 
      name: "Analytics", 
      path: "/analytics", 
      icon: <BarChart className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator", "Clinical Operations Manager", "Data Manager", "Biostatistician"],
      order: 10
    },
    { 
      id: "menu-11", 
      name: "Notifications", 
      path: "/notifications", 
      icon: <Bell className="h-4 w-4" />, 
      visible: true, 
      roles: ["All Roles"],
      order: 11
    },
    { 
      id: "menu-11", 
      name: "Admin", 
      path: "/admin", 
      icon: <Settings className="h-4 w-4" />, 
      visible: true, 
      roles: ["System Administrator"],
      order: 11
    }
  ]);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    return (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter roles based on search query
  const filteredRoles = roles.filter(role => {
    if (!searchQuery) return true;
    return (
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter menu options based on search query
  const filteredMenuOptions = menuOptions.filter(option => {
    if (!searchQuery) return true;
    return (
      option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.roles.some(role => role.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Toggle menu option visibility
  const toggleMenuVisibility = (id: string) => {
    setMenuOptions(prev => 
      prev.map(option => 
        option.id === id ? { ...option, visible: !option.visible } : option
      )
    );
  };

  // Get status badge for user
  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500 hover:bg-gray-600">Inactive</Badge>;
      case 'locked':
        return <Badge className="bg-red-500 hover:bg-red-600">Locked</Badge>;
      default:
        return null;
    }
  };

  // Handle creating a new user
  const handleCreateUser = () => {
    toast({
      title: "User created",
      description: "The new user has been created successfully",
    });
    setShowUserDialog(false);
  };

  // Handle creating a new role
  const handleCreateRole = () => {
    toast({
      title: "Role created",
      description: "The new role has been created successfully",
    });
    setShowRoleDialog(false);
  };

  // Handle saving menu settings
  const handleSaveMenuSettings = () => {
    toast({
      title: "Menu settings saved",
      description: "The menu settings have been updated successfully",
    });
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-800">Administration</h1>
            <p className="text-neutral-500 mt-1">Manage system settings, user accounts, and security policies</p>
          </div>
          
          <div className="flex space-x-3">
            <div className="relative w-64">
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowUserDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPasswordDialog(true)}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </Button>
            <Button 
              size="sm"
            >
              <Settings className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full md:w-[750px]">
            <TabsTrigger value="users" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center">
              <Lock className="mr-2 h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
            <TabsTrigger value="menu" className="flex items-center">
              <GanttChart className="mr-2 h-4 w-4" />
              Menu Configuration
            </TabsTrigger>
            <TabsTrigger value="technical" className="flex items-center">
              <Network className="mr-2 h-4 w-4" />
              Technical Details
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Create, edit, and manage user accounts and study access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Study Access</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{getUserStatusBadge(user.status)}</TableCell>
                        <TableCell>{new Date(user.lastLogin).toLocaleString()}</TableCell>
                        <TableCell>
                          {user.studyAccess.length > 0 ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  {user.studyAccess[0]}
                                  {user.studyAccess.length > 1 && ` +${user.studyAccess.length - 1}`}
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {user.studyAccess.map(study => (
                                  <DropdownMenuItem key={study}>{study}</DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            "No access"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <KeyRound className="mr-2 h-4 w-4" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem>
                                  <Lock className="mr-2 h-4 w-4" />
                                  Deactivate Account
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate Account
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Import
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Roles & Permissions Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <Lock className="mr-2 h-5 w-5 text-blue-600" />
                      Roles & Permissions
                    </CardTitle>
                    <CardDescription>
                      Manage user roles and associated permissions
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowRoleDialog(true)}>
                    <UserCog className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Default</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>{role.users}</TableCell>
                        <TableCell>{role.isDefault ? <CheckCircle className="h-4 w-4 text-green-500" /> : ''}</TableCell>
                        <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{role.updatedBy}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => setShowPermissionDialog(true)}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Menu Configuration Tab */}
          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <GanttChart className="mr-2 h-5 w-5 text-blue-600" />
                      Menu Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure menu options and visibility by role
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={handleSaveMenuSettings}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Settings
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Menu Item</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Visible</TableHead>
                      <TableHead>Access Roles</TableHead>
                      <TableHead>Display Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMenuOptions.map(option => (
                      <TableRow key={option.id}>
                        <TableCell className="font-medium flex items-center">
                          {option.icon}
                          <span className="ml-2">{option.name}</span>
                        </TableCell>
                        <TableCell>{option.path}</TableCell>
                        <TableCell>
                          <Switch 
                            checked={option.visible} 
                            onCheckedChange={() => toggleMenuVisibility(option.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {option.roles[0] === "All Roles" ? "All Roles" : `${option.roles.length} Roles`}
                                <ChevronDown className="ml-1 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                              {option.roles[0] === "All Roles" ? (
                                <DropdownMenuItem>All Roles</DropdownMenuItem>
                              ) : (
                                option.roles.map(role => (
                                  <DropdownMenuItem key={role}>{role}</DropdownMenuItem>
                                ))
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell>{option.order}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <div className="text-sm text-gray-500">
                  Changes to menu configuration will take effect after saving and refreshing the application.
                </div>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Technical Details Tab */}
          <TabsContent value="technical" className="space-y-6">
            <div className="mb-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Details</h2>
                  <p className="text-gray-600">
                    Comprehensive technical documentation including system architecture and data models
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => exportTechnicalDetails('pdf')}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button 
                    onClick={() => exportTechnicalDetails('ppt')}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4" />
                    Download PPT
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="architecture" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="architecture" className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Architecture Diagram
                </TabsTrigger>
                <TabsTrigger value="datamodel" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Model Diagram
                </TabsTrigger>
                <TabsTrigger value="appflow" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  Application Flow
                </TabsTrigger>
              </TabsList>

              <TabsContent value="architecture" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Network className="h-5 w-5" />
                      System Architecture Overview
                    </CardTitle>
                    <CardDescription>
                      Clinical Agents - AI-Powered Clinical Trial Management Platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-8 overflow-x-auto border shadow-lg">
                      <svg viewBox="0 0 1400 900" className="w-full h-auto max-w-none" style={{ minWidth: "1400px" }}>
                        <defs>
                          {/* Light blue gradient variations for modern look */}
                          <linearGradient id="primaryBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#3b82f6"}} />
                            <stop offset="100%" style={{stopColor:"#1e40af"}} />
                          </linearGradient>
                          <linearGradient id="lightBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#60a5fa"}} />
                            <stop offset="100%" style={{stopColor:"#3b82f6"}} />
                          </linearGradient>
                          <linearGradient id="skyBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#0ea5e9"}} />
                            <stop offset="100%" style={{stopColor:"#0284c7"}} />
                          </linearGradient>
                          <linearGradient id="blueGray" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#475569"}} />
                            <stop offset="100%" style={{stopColor:"#334155"}} />
                          </linearGradient>
                          <linearGradient id="cyanBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#06b6d4"}} />
                            <stop offset="100%" style={{stopColor:"#0891b2"}} />
                          </linearGradient>
                          
                          {/* Arrow markers */}
                          <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="strokeWidth">
                            <path d="M2,2 L2,10 L8,6 z" fill="#1f2937" />
                          </marker>
                          
                          {/* Shadow filter */}
                          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.2"/>
                          </filter>
                        </defs>
                        
                        {/* Background */}
                        <rect width="1400" height="900" fill="url(#gradient)" />
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:"#f8fafc"}} />
                          <stop offset="100%" style={{stopColor:"#e2e8f0"}} />
                        </linearGradient>
                        
                        {/* Title with platform logo */}
                        <g>
                          <rect x="650" y="15" width="50" height="40" fill="url(#primaryBlue)" rx="8" filter="url(#shadow)" />
                          <text x="675" y="32" textAnchor="middle" className="text-xs font-bold fill-white">CA</text>
                          <text x="675" y="42" textAnchor="middle" className="text-xs fill-blue-100">AI</text>
                          <text x="720" y="42" className="text-2xl font-bold fill-gray-800">Clinical Agents - Platform Architecture</text>
                        </g>
                        
                        {/* Frontend Layer */}
                        <g>
                          <rect x="50" y="80" width="1300" height="140" fill="url(#primaryBlue)" rx="12" opacity="0.1" filter="url(#shadow)" />
                          <circle cx="80" cy="105" r="12" fill="url(#primaryBlue)" />
                          <text x="75" y="112" textAnchor="middle" className="text-sm font-bold fill-white">⚛️</text>
                          <text x="105" y="112" className="text-lg font-bold fill-blue-800">Frontend Layer</text>
                          
                          {/* Clinical Dashboard */}
                          <g transform="translate(80, 130)">
                            <rect width="220" height="70" fill="url(#primaryBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">📈</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Clinical Dashboard</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Trial Overview, KPIs</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Domain Data Monitoring</text>
                          </g>
                          
                          {/* Signal Detection UI */}
                          <g transform="translate(320, 130)">
                            <rect width="220" height="70" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🚨</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Signal Detection UI</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Risk Visualization</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Real-time Alerts</text>
                          </g>
                          
                          {/* RBAC Interface */}
                          <g transform="translate(560, 130)">
                            <rect width="220" height="70" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🔐</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">RBAC Interface</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">PI, DM, CRA, Sponsor</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Trial-level Access</text>
                          </g>
                          
                          {/* Data Quality Views */}
                          <g transform="translate(800, 130)">
                            <rect width="220" height="70" fill="url(#primaryBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">✅</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Data Quality Views</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Inconsistency Reports</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Validation Status</text>
                          </g>
                          
                          {/* Task Management */}
                          <g transform="translate(1040, 130)">
                            <rect width="200" height="70" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">📋</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Task Management</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Assignment & Tracking</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Status Updates</text>
                          </g>
                        </g>
                        
                        {/* API Gateway Layer */}
                        <g>
                          <rect x="50" y="250" width="1300" height="120" fill="url(#lightBlue)" rx="12" opacity="0.1" filter="url(#shadow)" />
                          <circle cx="80" cy="275" r="12" fill="url(#lightBlue)" />
                          <text x="75" y="282" textAnchor="middle" className="text-sm font-bold fill-white">🌐</text>
                          <text x="105" y="282" className="text-lg font-bold fill-blue-800">API Gateway & Backend Services</text>
                          
                          {/* Domain Data API */}
                          <g transform="translate(80, 300)">
                            <rect width="200" height="60" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🗂️</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Domain Data API</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">SDTM Endpoints</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Data Validation</text>
                          </g>
                          
                          {/* Agent Status API */}
                          <g transform="translate(300, 300)">
                            <rect width="200" height="60" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🤖</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Agent Status API</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Workflow Monitoring</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Agent Coordination</text>
                          </g>
                          
                          {/* Authentication API */}
                          <g transform="translate(520, 300)">
                            <rect width="200" height="60" fill="url(#cyanBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🔑</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Auth API</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Session Management</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Role-based Access</text>
                          </g>
                          
                          {/* Task API */}
                          <g transform="translate(740, 300)">
                            <rect width="200" height="60" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">📋</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Task API</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Assignment Logic</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Status Updates</text>
                          </g>
                          
                          {/* Notification API */}
                          <g transform="translate(960, 300)">
                            <rect width="200" height="60" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🔔</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Notification API</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Email & Real-time</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Alert Management</text>
                          </g>
                        </g>
                        
                        {/* AI/ML Layer */}
                        <g>
                          <rect x="50" y="400" width="1300" height="140" fill="url(#skyBlue)" rx="12" opacity="0.1" filter="url(#shadow)" />
                          <circle cx="80" cy="425" r="12" fill="url(#skyBlue)" />
                          <text x="75" y="432" textAnchor="middle" className="text-sm font-bold fill-white">🤖</text>
                          <text x="105" y="432" className="text-lg font-bold fill-blue-800">AI/ML Processing Layer</text>
                          
                          {/* Clinical Signal Detection */}
                          <g transform="translate(80, 450)">
                            <rect width="220" height="70" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🚨</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Signal Detection</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">AE Clustering</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Lab Trend Analysis</text>
                          </g>
                          
                          {/* Data Quality Engine */}
                          <g transform="translate(320, 450)">
                            <rect width="220" height="70" fill="url(#cyanBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">✅</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Data Quality Engine</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Cross-source Validation</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Inconsistency Detection</text>
                          </g>
                          
                          {/* AI Agent Workflows */}
                          <g transform="translate(560, 450)">
                            <rect width="220" height="70" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🔄</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Agent Workflows</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Autonomous Monitoring</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Scheduled Processing</text>
                          </g>
                          
                          {/* OpenAI Integration */}
                          <g transform="translate(800, 450)">
                            <rect width="220" height="70" fill="url(#primaryBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🧠</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">OpenAI GPT-4o</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Natural Language Processing</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Clinical Analysis</text>
                          </g>
                          
                          {/* Risk Assessment */}
                          <g transform="translate(1040, 450)">
                            <rect width="200" height="70" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">⚠️</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Risk Assessment</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Priority Scoring</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Alert Generation</text>
                          </g>
                        </g>
                        
                        {/* Data Layer */}
                        <g>
                          <rect x="50" y="570" width="1300" height="140" fill="url(#cyanBlue)" rx="12" opacity="0.1" filter="url(#shadow)" />
                          <circle cx="80" cy="595" r="12" fill="url(#cyanBlue)" />
                          <text x="75" y="602" textAnchor="middle" className="text-sm font-bold fill-white">💾</text>
                          <text x="105" y="602" className="text-lg font-bold fill-blue-800">Data Management Layer</text>
                          
                          {/* PostgreSQL */}
                          <g transform="translate(80, 620)">
                            <rect width="220" height="70" fill="url(#cyanBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🐘</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">PostgreSQL</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Primary Database</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">ACID Compliance</text>
                          </g>
                          
                          {/* SDTM */}
                          <g transform="translate(320, 620)">
                            <rect width="220" height="70" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">📋</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">SDTM Domains</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Clinical Standards</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">15+ Domains</text>
                          </g>
                          
                          {/* CTMS */}
                          <g transform="translate(560, 620)">
                            <rect width="220" height="70" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">🏢</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">CTMS Integration</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Trial Management</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Site Coordination</text>
                          </g>
                          
                          {/* Validation */}
                          <g transform="translate(800, 620)">
                            <rect width="220" height="70" fill="url(#primaryBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">✅</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Data Validation</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Quality Assurance</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Integrity Checks</text>
                          </g>
                          
                          {/* Audit */}
                          <g transform="translate(1040, 620)">
                            <rect width="200" height="70" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="25" cy="25" r="15" fill="rgba(255,255,255,0.3)" />
                            <text x="18" y="32" className="text-lg font-bold fill-white">📝</text>
                            <text x="50" y="30" className="text-sm font-bold fill-white">Audit Trail</text>
                            <text x="50" y="45" className="text-xs fill-blue-100">Compliance</text>
                            <text x="50" y="58" className="text-xs fill-blue-100">Change Tracking</text>
                          </g>
                        </g>
                        
                        {/* External Integrations */}
                        <g>
                          <rect x="50" y="740" width="1300" height="120" fill="url(#blueGray)" rx="12" opacity="0.1" filter="url(#shadow)" />
                          <circle cx="80" cy="765" r="12" fill="url(#blueGray)" />
                          <text x="75" y="772" textAnchor="middle" className="text-sm font-bold fill-white">🔗</text>
                          <text x="105" y="772" className="text-lg font-bold fill-blue-800">External Integrations</text>
                          
                          {/* EDC */}
                          <g transform="translate(80, 790)">
                            <rect width="200" height="60" fill="url(#blueGray)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">📊</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">EDC Systems</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Data Capture</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">CRF Management</text>
                          </g>
                          
                          {/* Labs */}
                          <g transform="translate(300, 790)">
                            <rect width="200" height="60" fill="url(#skyBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🧪</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Lab Systems</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Central Labs</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Local Labs</text>
                          </g>
                          
                          {/* Imaging */}
                          <g transform="translate(520, 790)">
                            <rect width="200" height="60" fill="url(#cyanBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🖼️</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Imaging</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">RECIST</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Tumor Data</text>
                          </g>
                          
                          {/* Regulatory */}
                          <g transform="translate(740, 790)">
                            <rect width="200" height="60" fill="url(#lightBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">⚖️</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Regulatory</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Safety</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Reporting</text>
                          </g>
                          
                          {/* Email */}
                          <g transform="translate(960, 790)">
                            <rect width="200" height="60" fill="url(#primaryBlue)" rx="8" filter="url(#shadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">📧</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Email Services</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Notifications</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Alerts</text>
                          </g>
                        </g>
                        
                        {/* Improved connectors with curves and icons */}
                        <g stroke="#1f2937" strokeWidth="3" fill="none" opacity="0.8">
                          {/* Frontend to Backend */}
                          <path d="M 700 220 Q 700 235 700 250" markerEnd="url(#arrow)" />
                          <circle cx="700" cy="235" r="4" fill="#10b981" />
                          
                          {/* Backend to AI */}
                          <path d="M 700 370 Q 700 385 700 400" markerEnd="url(#arrow)" />
                          <circle cx="700" cy="385" r="4" fill="#8b5cf6" />
                          
                          {/* AI to Data */}
                          <path d="M 700 540 Q 700 555 700 570" markerEnd="url(#arrow)" />
                          <circle cx="700" cy="555" r="4" fill="#f59e0b" />
                          
                          {/* Data to External */}
                          <path d="M 700 710 Q 700 725 700 740" markerEnd="url(#arrow)" />
                          <circle cx="700" cy="725" r="4" fill="#ef4444" />
                          
                          {/* Bidirectional flows */}
                          <path d="M 500 320 Q 480 305 460 290 Q 440 275 420 260" markerEnd="url(#arrow)" stroke="#10b981" strokeWidth="2" opacity="0.6" />
                          <path d="M 900 320 Q 920 305 940 290 Q 960 275 980 260" markerEnd="url(#arrow)" stroke="#10b981" strokeWidth="2" opacity="0.6" />
                        </g>
                      </svg>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="font-medium">Frontend Layer</span>
                        </div>
                        <p className="text-sm text-gray-600">React.js with TypeScript, real-time dashboards, responsive design</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-600 rounded"></div>
                          <span className="font-medium">Backend Services</span>
                        </div>
                        <p className="text-sm text-gray-600">Express.js API, WebSocket, session management, file processing</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-purple-600 rounded"></div>
                          <span className="font-medium">AI/ML Processing</span>
                        </div>
                        <p className="text-sm text-gray-600">OpenAI integration, vector database, AI agents, rule engine</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 bg-amber-600 rounded"></div>
                          <span className="font-medium">Data Management</span>
                        </div>
                        <p className="text-sm text-gray-600">PostgreSQL, SDTM domains, CTMS, validation, audit trails</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="datamodel" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Data Model Architecture
                    </CardTitle>
                    <CardDescription>
                      Complete database schema and relationships for Clinical Agents platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-gray-50 rounded-lg p-8 overflow-x-auto">
                      <div className="text-center text-lg font-semibold mb-4">
                        Clinical Agents - Database Schema Overview
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <h3 className="font-semibold text-blue-800">Core Entities</h3>
                          <div className="space-y-2 text-sm">
                            <div className="p-3 bg-blue-50 rounded border">
                              <div className="font-medium">users</div>
                              <div className="text-xs text-gray-600">Authentication, roles, permissions</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded border">
                              <div className="font-medium">trials</div>
                              <div className="text-xs text-gray-600">Clinical trial metadata</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded border">
                              <div className="font-medium">trial_users</div>
                              <div className="text-xs text-gray-600">Role-based access control</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-green-800">Domain Data</h3>
                          <div className="space-y-2 text-sm">
                            <div className="p-3 bg-green-50 rounded border">
                              <div className="font-medium">domain_sources</div>
                              <div className="text-xs text-gray-600">EDC, Lab, Imaging systems</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded border">
                              <div className="font-medium">domain_data</div>
                              <div className="text-xs text-gray-600">SDTM standardized domains</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded border">
                              <div className="font-medium">data_inconsistencies</div>
                              <div className="text-xs text-gray-600">Data quality checks</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-purple-800">AI Processing</h3>
                          <div className="space-y-2 text-sm">
                            <div className="p-3 bg-purple-50 rounded border">
                              <div className="font-medium">agent_status</div>
                              <div className="text-xs text-gray-600">Autonomous monitoring</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded border">
                              <div className="font-medium">signal_detection</div>
                              <div className="text-xs text-gray-600">Risk detection algorithms</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded border">
                              <div className="font-medium">openai_queries</div>
                              <div className="text-xs text-gray-600">LLM query tracking</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-amber-800">Task Management</h3>
                          <div className="space-y-2 text-sm">
                            <div className="p-3 bg-amber-50 rounded border">
                              <div className="font-medium">tasks</div>
                              <div className="text-xs text-gray-600">Assignment workflows</div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded border">
                              <div className="font-medium">notifications</div>
                              <div className="text-xs text-gray-600">Real-time alerts</div>
                            </div>
                            <div className="p-3 bg-amber-50 rounded border">
                              <div className="font-medium">notification_read_status</div>
                              <div className="text-xs text-gray-600">Read status tracking</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-red-800">Security & Audit</h3>
                          <div className="space-y-2 text-sm">
                            <div className="p-3 bg-red-50 rounded border">
                              <div className="font-medium">audit_logs</div>
                              <div className="text-xs text-gray-600">Complete change tracking</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded border">
                              <div className="font-medium">user_sessions</div>
                              <div className="text-xs text-gray-600">Secure authentication</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded border">
                              <div className="font-medium">api_keys</div>
                              <div className="text-xs text-gray-600">Programmatic access</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="font-semibold text-gray-800">SDTM Domains</h3>
                          <div className="space-y-2 text-sm">
                            <div className="p-3 bg-gray-50 rounded border">
                              <div className="font-medium">DM, AE, LB, VS</div>
                              <div className="text-xs text-gray-600">Demographics, Adverse Events, Lab, Vitals</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                              <div className="font-medium">CM, EX, SV, TU</div>
                              <div className="text-xs text-gray-600">Medications, Exposure, Visits, Tumors</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded border">
                              <div className="font-medium">SAE, PD, DS, MH, IE</div>
                              <div className="text-xs text-gray-600">Serious AE, Deviations, Disposition, History</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            Key Relationships
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">1:N</Badge>
                            <span>Trial → Domain Data</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">M:N</Badge>
                            <span>Users ↔ Trials</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">1:N</Badge>
                            <span>Signal → Tasks</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">1:N</Badge>
                            <span>User → Notifications</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Data Sources</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>• <strong>EDC:</strong> Clinical data capture</div>
                          <div>• <strong>Central Lab:</strong> Laboratory results</div>
                          <div>• <strong>Local Lab:</strong> Site-specific tests</div>
                          <div>• <strong>Imaging:</strong> RECIST tumor data</div>
                          <div>• <strong>CTMS:</strong> Trial management</div>
                          <div>• <strong>Safety:</strong> Adverse events</div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Data Flow</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div>1. Data ingestion from external sources</div>
                          <div>2. Validation and quality checks</div>
                          <div>3. AI processing and signal detection</div>
                          <div>4. Task creation and assignment</div>
                          <div>5. Notification delivery</div>
                          <div>6. Audit trail recording</div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="appflow" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="h-5 w-5" />
                      Application Flow Diagram
                    </CardTitle>
                    <CardDescription>
                      Comprehensive workflow showing how all Clinical Agents features connect and interact
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-8 overflow-x-auto border shadow-lg">
                      <svg viewBox="0 0 1600 1200" className="w-full h-auto max-w-none" style={{ minWidth: "1600px" }}>
                        <defs>
                          {/* Blue gradient variations for consistent theme */}
                          <linearGradient id="flowPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#3b82f6"}} />
                            <stop offset="100%" style={{stopColor:"#1e40af"}} />
                          </linearGradient>
                          <linearGradient id="flowLight" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#60a5fa"}} />
                            <stop offset="100%" style={{stopColor:"#3b82f6"}} />
                          </linearGradient>
                          <linearGradient id="flowSky" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#0ea5e9"}} />
                            <stop offset="100%" style={{stopColor:"#0284c7"}} />
                          </linearGradient>
                          <linearGradient id="flowCyan" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#06b6d4"}} />
                            <stop offset="100%" style={{stopColor:"#0891b2"}} />
                          </linearGradient>
                          <linearGradient id="flowTeal" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{stopColor:"#14b8a6"}} />
                            <stop offset="100%" style={{stopColor:"#0f766e"}} />
                          </linearGradient>
                          
                          {/* Arrow markers */}
                          <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                              refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="#1e40af" />
                            </marker>
                          </defs>
                          
                          {/* Shadow filter */}
                          <filter id="flowShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.1"/>
                          </filter>
                        </defs>
                        
                        {/* Title */}
                        <text x="800" y="30" textAnchor="middle" className="text-2xl font-bold fill-blue-900">
                          Clinical Agents - Complete Application Flow
                        </text>
                        
                        {/* User Authentication & Entry Point */}
                        <g>
                          <rect x="50" y="60" width="200" height="80" fill="url(#flowPrimary)" rx="12" filter="url(#flowShadow)" />
                          <circle cx="100" cy="85" r="15" fill="rgba(255,255,255,0.3)" />
                          <text x="90" y="93" className="text-lg font-bold fill-white">👤</text>
                          <text x="150" y="90" textAnchor="middle" className="text-sm font-bold fill-white">User Login</text>
                          <text x="150" y="105" textAnchor="middle" className="text-xs fill-blue-100">Authentication</text>
                          <text x="150" y="118" textAnchor="middle" className="text-xs fill-blue-100">Role Assignment</text>
                        </g>
                        
                        {/* Dashboard Overlay - Positioned as Application-wide Component */}
                        <g>
                          <rect x="580" y="60" width="440" height="80" fill="url(#flowLight)" rx="12" filter="url(#flowShadow)" opacity="0.9" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
                          <circle cx="630" cy="85" r="15" fill="rgba(255,255,255,0.3)" />
                          <text x="620" y="93" className="text-lg font-bold fill-white">📊</text>
                          <text x="800" y="85" textAnchor="middle" className="text-lg font-bold fill-white">Dashboard Overlay</text>
                          <text x="800" y="105" textAnchor="middle" className="text-xs fill-blue-100">Application-wide KPI Monitoring</text>
                          <text x="800" y="118" textAnchor="middle" className="text-xs fill-blue-100">Real-time Trial Status & Alerts</text>
                        </g>
                        
                        {/* Study Management Layer */}
                        <g>
                          <rect x="150" y="180" width="1300" height="100" fill="url(#flowPrimary)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="170" y="205" className="text-lg font-bold fill-blue-800">Study Management & Configuration</text>
                          
                          {/* Trial Setup */}
                          <g transform="translate(200, 220)">
                            <rect width="180" height="50" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🎯 Trial Setup</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Protocol Configuration</text>
                          </g>
                          
                          {/* Site Management */}
                          <g transform="translate(400, 220)">
                            <rect width="180" height="50" fill="url(#flowLight)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🏥 Site Management</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Site Activation & Monitoring</text>
                          </g>
                          
                          {/* Subject Management */}
                          <g transform="translate(600, 220)">
                            <rect width="180" height="50" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">👥 Subject Management</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Enrollment & Tracking</text>
                          </g>
                          
                          {/* Visit Scheduling */}
                          <g transform="translate(800, 220)">
                            <rect width="180" height="50" fill="url(#flowCyan)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">📅 Visit Scheduling</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Timeline Management</text>
                          </g>
                          
                          {/* Regulatory Compliance */}
                          <g transform="translate(1000, 220)">
                            <rect width="180" height="50" fill="url(#flowTeal)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">⚖️ Regulatory</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Compliance Monitoring</text>
                          </g>
                          
                          {/* Study Milestones */}
                          <g transform="translate(1200, 220)">
                            <rect width="180" height="50" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🎖️ Milestones</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Progress Tracking</text>
                          </g>
                        </g>
                        
                        {/* Data Integration Layer */}
                        <g>
                          <rect x="100" y="320" width="1400" height="100" fill="url(#flowSky)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="120" y="345" className="text-lg font-bold fill-blue-800">Data Integration & Sources</text>
                          
                          {/* EDC Data */}
                          <g transform="translate(150, 360)">
                            <rect width="160" height="50" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">📋 EDC Systems</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Clinical Data Capture</text>
                          </g>
                          
                          {/* Lab Data */}
                          <g transform="translate(330, 360)">
                            <rect width="160" height="50" fill="url(#flowCyan)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🧪 Lab Systems</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Central & Local Labs</text>
                          </g>
                          
                          {/* Imaging */}
                          <g transform="translate(510, 360)">
                            <rect width="160" height="50" fill="url(#flowTeal)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🖼️ Imaging</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">RECIST Tumor Data</text>
                          </g>
                          
                          {/* CTMS */}
                          <g transform="translate(690, 360)">
                            <rect width="160" height="50" fill="url(#flowLight)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🏢 CTMS</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Trial Management</text>
                          </g>
                          
                          {/* Safety Reporting */}
                          <g transform="translate(870, 360)">
                            <rect width="160" height="50" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">⚠️ Safety</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Adverse Events</text>
                          </g>
                          
                          {/* External APIs */}
                          <g transform="translate(1050, 360)">
                            <rect width="160" height="50" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🔗 External APIs</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Third-party Systems</text>
                          </g>
                          
                          {/* Manual Upload */}
                          <g transform="translate(1230, 360)">
                            <rect width="160" height="50" fill="url(#flowCyan)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">📤 Manual Upload</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">File Import</text>
                          </g>
                        </g>
                        
                        {/* Data Processing & Validation */}
                        <g>
                          <rect x="200" y="460" width="1200" height="80" fill="url(#flowCyan)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="220" y="485" className="text-lg font-bold fill-blue-800">Data Processing & Validation</text>
                          
                          {/* SDTM Standardization */}
                          <g transform="translate(250, 495)">
                            <rect width="180" height="35" fill="url(#flowCyan)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="23" textAnchor="middle" className="text-sm font-bold fill-white">SDTM Standardization</text>
                          </g>
                          
                          {/* Data Quality Checks */}
                          <g transform="translate(450, 495)">
                            <rect width="180" height="35" fill="url(#flowTeal)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="23" textAnchor="middle" className="text-sm font-bold fill-white">Quality Validation</text>
                          </g>
                          
                          {/* Cross-source Analysis */}
                          <g transform="translate(650, 495)">
                            <rect width="180" height="35" fill="url(#flowLight)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="23" textAnchor="middle" className="text-sm font-bold fill-white">Cross-source Analysis</text>
                          </g>
                          
                          {/* Consistency Checks */}
                          <g transform="translate(850, 495)">
                            <rect width="180" height="35" fill="url(#flowPrimary)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="23" textAnchor="middle" className="text-sm font-bold fill-white">Consistency Checks</text>
                          </g>
                          
                          {/* Data Storage */}
                          <g transform="translate(1050, 495)">
                            <rect width="180" height="35" fill="url(#flowSky)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="23" textAnchor="middle" className="text-sm font-bold fill-white">PostgreSQL Storage</text>
                          </g>
                        </g>
                        
                        {/* AI Processing Engine */}
                        <g>
                          <rect x="100" y="580" width="1400" height="120" fill="url(#flowTeal)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="120" y="605" className="text-lg font-bold fill-blue-800">AI Processing & Analysis Engine</text>
                          
                          {/* Signal Detection */}
                          <g transform="translate(150, 620)">
                            <rect width="200" height="70" fill="url(#flowTeal)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="20" y="32" className="text-sm font-bold fill-white">🚨</text>
                            <text x="45" y="28" className="text-sm font-bold fill-white">Signal Detection</text>
                            <text x="45" y="42" className="text-xs fill-blue-100">AE Pattern Analysis</text>
                            <text x="45" y="55" className="text-xs fill-blue-100">Lab Trend Detection</text>
                          </g>
                          
                          {/* OpenAI Integration */}
                          <g transform="translate(370, 620)">
                            <rect width="200" height="70" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="20" y="32" className="text-sm font-bold fill-white">🧠</text>
                            <text x="45" y="28" className="text-sm font-bold fill-white">OpenAI GPT-4o</text>
                            <text x="45" y="42" className="text-xs fill-blue-100">Natural Language Processing</text>
                            <text x="45" y="55" className="text-xs fill-blue-100">Clinical Analysis</text>
                          </g>
                          
                          {/* Risk Assessment */}
                          <g transform="translate(590, 620)">
                            <rect width="200" height="70" fill="url(#flowLight)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="20" y="32" className="text-sm font-bold fill-white">⚖️</text>
                            <text x="45" y="28" className="text-sm font-bold fill-white">Risk Assessment</text>
                            <text x="45" y="42" className="text-xs fill-blue-100">Priority Scoring</text>
                            <text x="45" y="55" className="text-xs fill-blue-100">Impact Analysis</text>
                          </g>
                          
                          {/* Agent Workflows */}
                          <g transform="translate(810, 620)">
                            <rect width="200" height="70" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="20" y="32" className="text-sm font-bold fill-white">🤖</text>
                            <text x="45" y="28" className="text-sm font-bold fill-white">AI Agent Workflows</text>
                            <text x="45" y="42" className="text-xs fill-blue-100">Autonomous Monitoring</text>
                            <text x="45" y="55" className="text-xs fill-blue-100">Scheduled Processing</text>
                          </g>
                          
                          {/* Data Quality Engine */}
                          <g transform="translate(1030, 620)">
                            <rect width="200" height="70" fill="url(#flowCyan)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="20" y="32" className="text-sm font-bold fill-white">✅</text>
                            <text x="45" y="28" className="text-sm font-bold fill-white">Data Quality Engine</text>
                            <text x="45" y="42" className="text-xs fill-blue-100">Anomaly Detection</text>
                            <text x="45" y="55" className="text-xs fill-blue-100">Validation Rules</text>
                          </g>
                          
                          {/* Clinical Decision Support */}
                          <g transform="translate(1250, 620)">
                            <rect width="200" height="70" fill="url(#flowTeal)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="20" y="32" className="text-sm font-bold fill-white">🎯</text>
                            <text x="45" y="28" className="text-sm font-bold fill-white">Decision Support</text>
                            <text x="45" y="42" className="text-xs fill-blue-100">Recommendations</text>
                            <text x="45" y="55" className="text-xs fill-blue-100">Action Guidance</text>
                          </g>
                        </g>
                        
                        {/* Task & Workflow Management */}
                        <g>
                          <rect x="200" y="740" width="1200" height="100" fill="url(#flowPrimary)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="220" y="765" className="text-lg font-bold fill-blue-800">Task & Workflow Management</text>
                          
                          {/* Task Creation */}
                          <g transform="translate(250, 780)">
                            <rect width="160" height="50" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">📋 Task Creation</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Automated Assignment</text>
                          </g>
                          
                          {/* Priority Management */}
                          <g transform="translate(430, 780)">
                            <rect width="160" height="50" fill="url(#flowLight)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🔥 Priority Management</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Risk-based Scoring</text>
                          </g>
                          
                          {/* User Assignment */}
                          <g transform="translate(610, 780)">
                            <rect width="160" height="50" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">👥 User Assignment</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Role-based Routing</text>
                          </g>
                          
                          {/* Status Tracking */}
                          <g transform="translate(790, 780)">
                            <rect width="160" height="50" fill="url(#flowCyan)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">📈 Status Tracking</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Progress Monitoring</text>
                          </g>
                          
                          {/* Escalation Rules */}
                          <g transform="translate(970, 780)">
                            <rect width="160" height="50" fill="url(#flowTeal)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">⚡ Escalation</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Time-based Rules</text>
                          </g>
                          
                          {/* Workflow Automation */}
                          <g transform="translate(1150, 780)">
                            <rect width="160" height="50" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <text x="15" y="20" className="text-sm font-bold fill-white">🔄 Automation</text>
                            <text x="15" y="35" className="text-xs fill-blue-100">Process Flows</text>
                          </g>
                        </g>
                        
                        {/* Notification & Communication */}
                        <g>
                          <rect x="100" y="880" width="1400" height="80" fill="url(#flowLight)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="120" y="905" className="text-lg font-bold fill-blue-800">Notification & Communication Layer</text>
                          
                          {/* Real-time Notifications */}
                          <g transform="translate(150, 925)">
                            <rect width="180" height="25" fill="url(#flowLight)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="18" textAnchor="middle" className="text-sm font-bold fill-white">🔔 Real-time Alerts</text>
                          </g>
                          
                          {/* Email Notifications */}
                          <g transform="translate(350, 925)">
                            <rect width="180" height="25" fill="url(#flowSky)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="18" textAnchor="middle" className="text-sm font-bold fill-white">📧 Email Notifications</text>
                          </g>
                          
                          {/* Mobile Push */}
                          <g transform="translate(550, 925)">
                            <rect width="180" height="25" fill="url(#flowCyan)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="18" textAnchor="middle" className="text-sm font-bold fill-white">📱 Mobile Push</text>
                          </g>
                          
                          {/* Dashboard Updates */}
                          <g transform="translate(750, 925)">
                            <rect width="180" height="25" fill="url(#flowTeal)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="18" textAnchor="middle" className="text-sm font-bold fill-white">📊 Dashboard Updates</text>
                          </g>
                          
                          {/* Report Generation */}
                          <g transform="translate(950, 925)">
                            <rect width="180" height="25" fill="url(#flowPrimary)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="18" textAnchor="middle" className="text-sm font-bold fill-white">📄 Reports</text>
                          </g>
                          
                          {/* Audit Logging */}
                          <g transform="translate(1150, 925)">
                            <rect width="180" height="25" fill="url(#flowLight)" rx="6" filter="url(#flowShadow)" />
                            <text x="90" y="18" textAnchor="middle" className="text-sm font-bold fill-white">📝 Audit Logging</text>
                          </g>
                        </g>
                        
                        {/* User Interface Layer */}
                        <g>
                          <rect x="200" y="1000" width="1200" height="120" fill="url(#flowSky)" rx="12" opacity="0.1" filter="url(#flowShadow)" />
                          <text x="220" y="1025" className="text-lg font-bold fill-blue-800">User Interface & Experience Layer</text>
                          
                          {/* Clinical Dashboard */}
                          <g transform="translate(250, 1040)">
                            <rect width="160" height="70" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">📊</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Dashboard</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">KPI Overview</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Trial Status</text>
                          </g>
                          
                          {/* Signal Detection UI */}
                          <g transform="translate(430, 1040)">
                            <rect width="160" height="70" fill="url(#flowCyan)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🚨</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Signal Detection</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Risk Analysis</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Pattern View</text>
                          </g>
                          
                          {/* Task Management */}
                          <g transform="translate(610, 1040)">
                            <rect width="160" height="70" fill="url(#flowTeal)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">📋</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Task Manager</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Assignment</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Tracking</text>
                          </g>
                          
                          {/* Data Quality Views */}
                          <g transform="translate(790, 1040)">
                            <rect width="160" height="70" fill="url(#flowPrimary)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">✅</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Data Quality</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Validation</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Reports</text>
                          </g>
                          
                          {/* RBAC Interface */}
                          <g transform="translate(970, 1040)">
                            <rect width="160" height="70" fill="url(#flowLight)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">🔐</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Access Control</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">User Roles</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">Permissions</text>
                          </g>
                          
                          {/* Admin Interface */}
                          <g transform="translate(1150, 1040)">
                            <rect width="160" height="70" fill="url(#flowSky)" rx="8" filter="url(#flowShadow)" />
                            <circle cx="20" cy="20" r="12" fill="rgba(255,255,255,0.3)" />
                            <text x="15" y="27" className="text-sm font-bold fill-white">⚙️</text>
                            <text x="40" y="25" className="text-sm font-bold fill-white">Admin Panel</text>
                            <text x="40" y="40" className="text-xs fill-blue-100">Configuration</text>
                            <text x="40" y="52" className="text-xs fill-blue-100">System Control</text>
                          </g>
                        </g>
                        
                        {/* Flow Connections */}
                        <g stroke="#1e40af" strokeWidth="3" fill="none" opacity="0.7" markerEnd="url(#arrowhead)">
                          {/* Login to Dashboard Overlay */}
                          <path d="M 250 100 Q 400 100 580 100" />
                          
                          {/* Dashboard to Study Management */}
                          <path d="M 800 140 Q 800 160 800 180" stroke="#3b82f6" strokeDasharray="3,3" opacity="0.4" />
                          
                          {/* Study Management to Data Integration */}
                          <path d="M 290 270 Q 290 290 230 320" />
                          <path d="M 490 270 Q 490 290 410 320" />
                          <path d="M 690 270 Q 690 290 590 320" />
                          <path d="M 890 270 Q 890 290 770 320" />
                          <path d="M 1090 270 Q 1090 290 950 320" />
                          <path d="M 1290 270 Q 1290 290 1130 320" />
                          
                          {/* Data Integration to Data Processing */}
                          <path d="M 230 420 Q 230 440 340 460" />
                          <path d="M 410 420 Q 410 440 540 460" />
                          <path d="M 590 420 Q 590 440 740 460" />
                          <path d="M 770 420 Q 770 440 940 460" />
                          <path d="M 950 420 Q 950 440 1140 460" />
                          
                          {/* Data Processing to AI Engine */}
                          <path d="M 340 540 Q 340 560 250 580" />
                          <path d="M 540 540 Q 540 560 470 580" />
                          <path d="M 740 540 Q 740 560 690 580" />
                          <path d="M 940 540 Q 940 560 910 580" />
                          <path d="M 1140 540 Q 1140 560 1130 580" />
                          
                          {/* AI Engine to Task Management */}
                          <path d="M 250 700 Q 250 720 330 740" />
                          <path d="M 470 700 Q 470 720 510 740" />
                          <path d="M 690 700 Q 690 720 690 740" />
                          <path d="M 910 700 Q 910 720 870 740" />
                          <path d="M 1130 700 Q 1130 720 1050 740" />
                          
                          {/* Task Management to Notifications */}
                          <path d="M 330 840 Q 330 860 240 880" />
                          <path d="M 510 840 Q 510 860 440 880" />
                          <path d="M 690 840 Q 690 860 640 880" />
                          <path d="M 870 840 Q 870 860 840 880" />
                          <path d="M 1050 840 Q 1050 860 1040 880" />
                          
                          {/* Notifications to UI */}
                          <path d="M 240 960 Q 240 980 330 1000" />
                          <path d="M 440 960 Q 440 980 510 1000" />
                          <path d="M 640 960 Q 640 980 690 1000" />
                          <path d="M 840 960 Q 840 980 870 1000" />
                          <path d="M 1040 960 Q 1040 980 1050 1000" />
                          
                          {/* Dashboard Overlay connecting to all layers */}
                          <path d="M 800 280 Q 800 300 800 320" stroke="#3b82f6" strokeDasharray="3,3" opacity="0.4" />
                          <path d="M 800 420 Q 800 460 800 580" stroke="#3b82f6" strokeDasharray="3,3" opacity="0.4" />
                          <path d="M 800 700 Q 800 740 800 880" stroke="#3b82f6" strokeDasharray="3,3" opacity="0.4" />
                          <path d="M 800 960 Q 800 980 800 1000" stroke="#3b82f6" strokeDasharray="3,3" opacity="0.4" />
                        </g>
                        
                        {/* Process Flow Legend */}
                        <g transform="translate(50, 1160)">
                          <rect width="1500" height="140" fill="url(#flowPrimary)" rx="8" opacity="0.05" stroke="#3b82f6" strokeWidth="1" />
                          <text x="20" y="25" className="text-lg font-bold fill-blue-800">Clinical Agents - Complete Application Flow Process</text>
                          
                          <text x="20" y="50" className="text-sm font-medium fill-blue-700">1. User Authentication & Role-based Access</text>
                          <text x="20" y="65" className="text-sm font-medium fill-blue-700">2. Data Ingestion from Clinical Sources</text>
                          <text x="20" y="80" className="text-sm font-medium fill-blue-700">3. Study Management & Configuration</text>
                          <text x="20" y="95" className="text-sm font-medium fill-blue-700">4. SDTM Standardization & Quality Validation</text>
                          <text x="20" y="110" className="text-sm font-medium fill-blue-700">5. AI-Powered Signal Detection & Analysis</text>
                          <text x="20" y="125" className="text-sm font-medium fill-blue-700">6. Automated Task Creation & Assignment</text>
                          
                          <text x="400" y="50" className="text-sm font-medium fill-blue-700">7. Multi-channel Notification Delivery</text>
                          <text x="400" y="65" className="text-sm font-medium fill-blue-700">8. User Interface & Experience Layer</text>
                          <text x="400" y="80" className="text-sm font-medium fill-blue-700">9. Dashboard Overlay (Application-wide)</text>
                          <text x="400" y="95" className="text-sm font-medium fill-blue-700">10. Continuous Monitoring & Audit Trail</text>
                          <text x="400" y="110" className="text-sm font-medium fill-blue-700">11. Regulatory Compliance & Reporting</text>
                          <text x="400" y="125" className="text-sm font-medium fill-blue-700">12. Real-time Status Updates</text>
                          
                          <text x="800" y="50" className="text-sm font-medium fill-blue-700">Study Management Features:</text>
                          <text x="800" y="65" className="text-sm fill-blue-600">• Trial setup and protocol configuration</text>
                          <text x="800" y="80" className="text-sm fill-blue-600">• Site activation and monitoring</text>
                          <text x="800" y="95" className="text-sm fill-blue-600">• Subject enrollment and tracking</text>
                          <text x="800" y="110" className="text-sm fill-blue-600">• Visit scheduling and milestone tracking</text>
                          <text x="800" y="125" className="text-sm fill-blue-600">• Regulatory compliance monitoring</text>
                          
                          <text x="1200" y="50" className="text-sm font-medium fill-blue-700">Dashboard Overlay:</text>
                          <text x="1200" y="65" className="text-sm fill-blue-600">• Application-wide KPI monitoring</text>
                          <text x="1200" y="80" className="text-sm fill-blue-600">• Real-time trial status updates</text>
                          <text x="1200" y="95" className="text-sm fill-blue-600">• Cross-functional data visibility</text>
                          <text x="1200" y="110" className="text-sm fill-blue-600">• Integrated alert system</text>
                          <text x="1200" y="125" className="text-sm fill-blue-600">• Contextual workflow guidance</text>
                        </g>
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="mr-2 h-5 w-5 text-blue-600" />
                      Audit Logs
                    </CardTitle>
                    <CardDescription>
                      View system audit logs and user activity
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative w-64">
                      <Input
                        placeholder="Search audit logs..."
                        className="pl-8"
                      />
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Logs
                    </Button>
                    <Button
                      size="sm"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="w-1/3">
                    <Card>
                      <CardHeader className="py-4">
                        <CardTitle className="text-sm">Filter By</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs mb-1 block">Event Type</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="All Event Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Event Types</SelectItem>
                                <SelectItem value="user">User Account</SelectItem>
                                <SelectItem value="data">Data Modification</SelectItem>
                                <SelectItem value="system">System Configuration</SelectItem>
                                <SelectItem value="security">Security</SelectItem>
                                <SelectItem value="study">Study Operations</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs mb-1 block">User</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="All Users" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users.map(user => (
                                  <SelectItem key={user.id} value={user.username}>{user.fullName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs mb-1 block">Date Range</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] text-gray-500">From</Label>
                                <Input type="date" className="text-xs" />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-500">To</Label>
                                <Input type="date" className="text-xs" />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs mb-1 block">Severity</Label>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox id="severity-info" defaultChecked />
                                <label htmlFor="severity-info" className="text-xs">Information</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="severity-warning" defaultChecked />
                                <label htmlFor="severity-warning" className="text-xs">Warning</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="severity-error" defaultChecked />
                                <label htmlFor="severity-error" className="text-xs">Error</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox id="severity-critical" defaultChecked />
                                <label htmlFor="severity-critical" className="text-xs">Critical</label>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full">Apply Filters</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="w-2/3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Event Type</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 06:22:15</TableCell>
                          <TableCell className="text-xs">John Doe</TableCell>
                          <TableCell className="text-xs">User</TableCell>
                          <TableCell className="text-xs">User account created: sarahjohnson</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 06:20:33</TableCell>
                          <TableCell className="text-xs">Jane Doe</TableCell>
                          <TableCell className="text-xs">Study</TableCell>
                          <TableCell className="text-xs">Study created: ABC-123 (Diabetes Type 2 Phase 3)</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 06:15:42</TableCell>
                          <TableCell className="text-xs">System</TableCell>
                          <TableCell className="text-xs">Security</TableCell>
                          <TableCell className="text-xs">Failed login attempt: user 'robertchen' (3rd attempt)</TableCell>
                          <TableCell><Badge className="bg-yellow-500 text-black">Warning</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 06:10:18</TableCell>
                          <TableCell className="text-xs">Mike Smith</TableCell>
                          <TableCell className="text-xs">Data</TableCell>
                          <TableCell className="text-xs">Data import completed: EDC data for study XYZ-789 (254 records)</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 06:05:22</TableCell>
                          <TableCell className="text-xs">John Doe</TableCell>
                          <TableCell className="text-xs">System</TableCell>
                          <TableCell className="text-xs">Role permissions modified: Data Manager</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 06:00:15</TableCell>
                          <TableCell className="text-xs">System</TableCell>
                          <TableCell className="text-xs">Security</TableCell>
                          <TableCell className="text-xs">Account locked: user 'jenniferlee' (5 failed login attempts)</TableCell>
                          <TableCell><Badge className="bg-red-500">Error</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 05:55:30</TableCell>
                          <TableCell className="text-xs">David Wilson</TableCell>
                          <TableCell className="text-xs">Study</TableCell>
                          <TableCell className="text-xs">Signal detection executed: study ABC-123</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 05:50:12</TableCell>
                          <TableCell className="text-xs">Robert Chen</TableCell>
                          <TableCell className="text-xs">Data</TableCell>
                          <TableCell className="text-xs">Subject data modified: Subject 1001-004 in study DEF-456</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 05:45:55</TableCell>
                          <TableCell className="text-xs">Sarah Jones</TableCell>
                          <TableCell className="text-xs">Study</TableCell>
                          <TableCell className="text-xs">Site activated: Site 1234 in study ABC-123</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-xs">2025-04-09 05:40:27</TableCell>
                          <TableCell className="text-xs">System</TableCell>
                          <TableCell className="text-xs">System</TableCell>
                          <TableCell className="text-xs">Backup completed: daily system backup</TableCell>
                          <TableCell><Badge className="bg-blue-500">Info</Badge></TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-muted-foreground">
                        Showing 10 of 1,354 log entries
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">Previous</Button>
                        <Button variant="outline" size="sm">Next</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Dialog>
              <DialogTrigger asChild>
                <span id="auditLogDetailTrigger" className="hidden"></span>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Audit Log Details</DialogTitle>
                  <DialogDescription>
                    Detailed information about the selected audit log entry
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">Timestamp:</div>
                    <div className="col-span-3 text-sm">2025-04-09 06:00:15</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">User:</div>
                    <div className="col-span-3 text-sm">System</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">Event Type:</div>
                    <div className="col-span-3 text-sm">Security</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">Description:</div>
                    <div className="col-span-3 text-sm">Account locked: user 'jenniferlee' (5 failed login attempts)</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">Severity:</div>
                    <div className="col-span-3 text-sm"><Badge className="bg-red-500">Error</Badge></div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">IP Address:</div>
                    <div className="col-span-3 text-sm">192.168.1.105</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1 text-sm font-medium">Browser/Device:</div>
                    <div className="col-span-3 text-sm">Chrome 125.0.0 / Windows 11</div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Additional Information</h4>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
{`{
  "event_id": "sec-1234567890",
  "attempt_times": [
    "2025-04-09T05:30:22Z",
    "2025-04-09T05:35:48Z",
    "2025-04-09T05:42:15Z",
    "2025-04-09T05:51:33Z",
    "2025-04-09T06:00:15Z"
  ],
  "account_status": "locked",
  "lock_duration": "30min",
  "auto_unlock_at": "2025-04-09T06:30:15Z",
  "notification_sent": true,
  "notified_admins": ["johndoe@example.com"]
}`}
                    </pre>
                  </div>
                </div>
                <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => document.getElementById('auditLogDetailTrigger')?.click()}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* Create User Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user account and set permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Username
                </Label>
                <Input id="username" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Full Name
                </Label>
                <Input id="fullName" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input id="email" type="email" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>System Roles</SelectLabel>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studyAccess" className="text-right">
                  Study Access
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select study access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Access Level</SelectLabel>
                      <SelectItem value="all">All Studies</SelectItem>
                      <SelectItem value="limited">Selected Studies</SelectItem>
                      <SelectItem value="none">No Access</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Options
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sendEmail" />
                    <label
                      htmlFor="sendEmail"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send welcome email
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="requirePassChange" defaultChecked />
                    <label
                      htmlFor="requirePassChange"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Require password change
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Role Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a new role and assign permissions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roleName" className="text-right">
                  Role Name
                </Label>
                <Input id="roleName" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roleDescription" className="text-right">
                  Description
                </Label>
                <Input id="roleDescription" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Permissions
                </Label>
                <div className="col-span-3 space-y-4">
                  {permissionCategories.map(category => (
                    <div key={category.name} className="space-y-2">
                      <h4 className="font-medium text-sm">{category.name}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {category.permissions.map(permission => (
                          <div key={permission.id} className="flex items-start space-x-2">
                            <Checkbox id={permission.id} />
                            <div>
                              <label
                                htmlFor={permission.id}
                                className="text-sm font-medium leading-none"
                              >
                                {permission.name}
                              </label>
                              <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                  Options
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="defaultRole" />
                    <label
                      htmlFor="defaultRole"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Set as default role for new users
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateRole}>Create Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Permissions Dialog */}
        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role Permissions</DialogTitle>
              <DialogDescription>
                Manage permissions for selected role
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-medium">Clinical Operations Manager</h3>
                  <p className="text-sm text-gray-500">Manage clinical operations, studies, and monitoring activities</p>
                </div>
                <Badge>8 Users</Badge>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-6">
                {permissionCategories.map(category => (
                  <div key={category.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{category.name}</h4>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <CheckCircle className="mr-2 h-3 w-3" />
                          Select All
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-3 w-3" />
                          View Only
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {category.permissions.map(permission => (
                        <div key={permission.id} className="flex items-start space-x-2 border rounded-md p-2">
                          <Checkbox id={`edit-${permission.id}`} />
                          <div>
                            <label
                              htmlFor={`edit-${permission.id}`}
                              className="text-sm font-medium leading-none"
                            >
                              {permission.name}
                            </label>
                            <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-2" />
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                toast({
                  title: "Permissions updated",
                  description: "Role permissions have been updated successfully",
                });
                setShowPermissionDialog(false);
              }}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Password Change Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Change User Password
              </DialogTitle>
              <DialogDescription>
                Change password for any user account. This action requires admin privileges.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="changeUsername" className="text-right">
                  Username
                </Label>
                <Input 
                  id="changeUsername" 
                  className="col-span-3"
                  value={passwordForm.username}
                  onChange={(e) => setPasswordForm({...passwordForm, username: e.target.value})}
                  placeholder="Enter username"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentPassword" className="text-right">
                  Current Password
                </Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  className="col-span-3"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newPassword" className="text-right">
                  New Password
                </Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  className="col-span-3"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  placeholder="Enter new password (min 8 chars)"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirmPassword" className="text-right">
                  Confirm Password
                </Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  className="col-span-3"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Password Security Requirements:</p>
                    <ul className="mt-1 text-xs space-y-1">
                      <li>• Minimum 8 characters long</li>
                      <li>• Password will be securely hashed</li>
                      <li>• User will need to login with new password</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={!passwordForm.username || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}