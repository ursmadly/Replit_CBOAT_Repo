import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FaUserGear } from "react-icons/fa6";
import { format } from "date-fns";
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRightCircle, 
  RefreshCw, 
  CalendarIcon, 
  Eye, 
  FileSpreadsheet, 
  MoreHorizontal, 
  MessageSquare, 
  User 
} from "lucide-react";
import { AnalysisResults } from './DMAssistant';
import { dmBotService } from '@/services/dmBotService';
import { cn } from '@/lib/utils';

interface ConversationalDMAssistantProps {
  studyId: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  activeTab?: string;
  onActiveTabChange?: (tab: string) => void;
  onAnalysisComplete?: (results: AnalysisResults) => void;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface QueryItem {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dataSources: string[];
  status: 'new' | 'assigned' | 'in-review' | 'resolved';
  studyId: number;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  contact?: string;
  referenceData?: string;
  overdueStatus?: 'on-time' | 'due-soon' | 'overdue';
}

// Analysis steps
const ANALYSIS_STEPS = [
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

// Frequencies for scheduling
const SCHEDULE_FREQUENCIES = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'twice-weekly', label: 'Twice Weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' }
];

// Clinical trial data domains with descriptions
const DATA_DOMAINS = [
  { 
    id: 'dm', 
    name: 'Demographics (DM)', 
    description: 'Contains subject demographics like age, gender, race, and enrollment details',
    key_variables: ['USUBJID', 'AGE', 'SEX', 'RACE', 'ETHNIC', 'COUNTRY']
  },
  { 
    id: 'sv', 
    name: 'Subject Visits (SV)', 
    description: 'Tracks subject visit information, including planned and actual dates, and visit status', 
    key_variables: ['USUBJID', 'VISITNUM', 'VISIT', 'SVSTDTC', 'SVENDTC', 'SVSTATUS']
  },
  { 
    id: 'ae', 
    name: 'Adverse Events (AE)', 
    description: 'Records safety events, severity, relationship to treatment, and outcomes',
    key_variables: ['USUBJID', 'AETERM', 'AESTDTC', 'AEENDTC', 'AESEV', 'AESER', 'AEREL']
  },
  { 
    id: 'cm', 
    name: 'Concomitant Medications (CM)', 
    description: 'Tracks medications taken during the trial, including dose, frequency, and indication',
    key_variables: ['USUBJID', 'CMTRT', 'CMSTDTC', 'CMENDTC', 'CMDOSE', 'CMROUTE']
  },
  { 
    id: 'lb', 
    name: 'Laboratory Results (LB)', 
    description: 'Contains lab test results, reference ranges, and flags for abnormal values',
    key_variables: ['USUBJID', 'LBTEST', 'LBORRES', 'LBDTC', 'LBSTNRLO', 'LBSTNRHI', 'LBNRIND']
  },
  { 
    id: 'vs', 
    name: 'Vital Signs (VS)', 
    description: 'Records vital measurements such as blood pressure, temperature, heart rate',
    key_variables: ['USUBJID', 'VSTESTCD', 'VSORRES', 'VSORRESU', 'VSDTC']
  },
  { 
    id: 'ex', 
    name: 'Exposure (EX)', 
    description: 'Tracks study drug administration details including dose, route, and schedule',
    key_variables: ['USUBJID', 'EXTRT', 'EXSTDTC', 'EXENDTC', 'EXDOSE', 'EXDOSU']
  },
  { 
    id: 'ds', 
    name: 'Disposition (DS)', 
    description: 'Records subject disposition events like randomization or study completion',
    key_variables: ['USUBJID', 'DSDECOD', 'DSSTDTC', 'DSREASON']
  }
];

// EDC and Clinical database systems
const DATA_SOURCES = [
  { id: 'edc', name: 'EDC', full_name: 'Electronic Data Capture', examples: ['Medidata Rave', 'Oracle InForm'] },
  { id: 'ctms', name: 'CTMS', full_name: 'Clinical Trial Management System', examples: ['Veeva Vault', 'Medidata CTMS'] },
  { id: 'lab', name: 'Lab', full_name: 'Central Laboratory Data', examples: ['Covance', 'LabCorp', 'Quest'] },
  { id: 'imaging', name: 'Imaging', full_name: 'Imaging Data', examples: ['PAREXEL', 'BioClinica'] },
  { id: 'irt', name: 'IRT', full_name: 'Interactive Response Technology', examples: ['Endpoint', 'Cenduit'] }
];

// Common data quality issues
const DATA_QUALITY_ISSUES = [
  { type: 'missing', description: 'Required data is missing' },
  { type: 'inconsistency', description: 'Same data has different values across sources' },
  { type: 'out_of_range', description: 'Values are outside expected ranges' },
  { type: 'logical', description: 'Logical inconsistencies like start date after end date' },
  { type: 'standard', description: 'Data not adhering to SDTM standards' },
  { type: 'duplicate', description: 'Duplicate records or entries' }
];

// Predefined responses for quick access
const QUICK_RESPONSES = [
  { id: '1', text: 'Run a data quality check for this study' },
  { id: '2', text: 'Explain the Demographics (DM) domain' },
  { id: '3', text: 'Check for inconsistencies between EDC and Lab data' },
  { id: '4', text: 'Show me the key variables in Subject Visits (SV)' },
  { id: '5', text: 'What data sources are available in Trial Data Management?' },
  { id: '6', text: 'Schedule weekly data quality checks' },
  { id: '7', text: 'Identify duplicate records by USUBJID' }
];

export const ConversationalDMAssistant: React.FC<ConversationalDMAssistantProps> = ({ 
  studyId, 
  open,
  onOpenChange,
  activeTab: externalActiveTab,
  onActiveTabChange,
  onAnalysisComplete 
}) => {
  // Dialog state
  const [localDialogOpen, setLocalDialogOpen] = useState(false);
  
  // Use external control if provided
  const dialogOpen = open !== undefined ? open : localDialogOpen;
  const setDialogOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setLocalDialogOpen(value);
    }
  };
  
  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  
  // Conversation state
  const [conversation, setConversation] = useState<ConversationMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your Data Management AI Assistant. I can help you with data quality checks, query management, and study creation. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [internalActiveTab, setInternalActiveTab] = useState('chat');
  
  // Use external tab control if provided
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = (tab: string) => {
    if (onActiveTabChange) {
      onActiveTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [queryViewMode, setQueryViewMode] = useState<'all' | 'open' | 'overdue'>('all');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(undefined);
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [isSchedulePopoverOpen, setIsSchedulePopoverOpen] = useState(false);
  
  // Query data
  const [queries, setQueries] = useState<QueryItem[]>([]);

  // Scroll to bottom of conversation when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  // Get queries for the study
  useEffect(() => {
    if (studyId) {
      const activeQueries = dmBotService.getActiveQueries(studyId);
      setQueries(activeQueries);
    }
  }, [studyId]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (userInput.trim()) {
      // Add user message to conversation
      const newUserMessage: ConversationMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userInput,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, newUserMessage]);
      
      // Clear input
      setUserInput('');
      
      // Process the message
      processUserMessage(userInput);
    }
  };

  // Process user message and generate response
  const processUserMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Handle data quality check
    if (lowerMessage.includes('quality check') || lowerMessage.includes('run analysis') || 
        lowerMessage.includes('check data') || lowerMessage.includes('analyze data')) {
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ll run a data quality check for this study right away. This may take a few moments.',
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
      
      // Start analysis
      setTimeout(() => {
        startAnalysis();
      }, 1000);
    } 
    // Handle creating a new study
    else if (lowerMessage.includes('create') && lowerMessage.includes('study')) {
      const study = dmBotService.getStudy(studyId);
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I can help you create a new study. Please provide the following information:\n- Protocol ID\n- Study Title\n- Phase\n- Indication\n- Start Date\n\nFor reference, the current study (${study?.protocolId}) has the following details:\n- Title: ${study?.title}\n- Phase: ${study?.phase}\n- Indication: ${study?.indication}\n- Start Date: ${study?.startDate}`,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
    }
    // Handle viewing queries
    else if (lowerMessage.includes('show') && (lowerMessage.includes('queries') || lowerMessage.includes('issues'))) {
      let queryType = 'all';
      
      if (lowerMessage.includes('open')) {
        queryType = 'open';
        setQueryViewMode('open');
      } else if (lowerMessage.includes('overdue')) {
        queryType = 'overdue';
        setQueryViewMode('overdue');
      } else {
        setQueryViewMode('all');
      }
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'm showing ${queryType} queries in the Queries tab. You can view details and reference data for each query there.`,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
      setActiveTab('queries');
    }
    // Handle scheduling checks
    else if (lowerMessage.includes('schedule')) {
      let frequency = 'weekly';
      
      if (lowerMessage.includes('daily')) {
        frequency = 'daily';
      } else if (lowerMessage.includes('bi-weekly') || lowerMessage.includes('biweekly')) {
        frequency = 'biweekly';
      } else if (lowerMessage.includes('monthly')) {
        frequency = 'monthly';
      }
      
      setScheduleFrequency(frequency);
      setScheduleDate(new Date());
      setIsSchedulePopoverOpen(true);
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I've prepared a ${frequency} schedule for data quality checks. Please confirm the start date and frequency in the Schedule panel.`,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
      setActiveTab('schedule');
    }
    // Handle specific study information request
    else if (lowerMessage.includes('tell me about the study') || 
             lowerMessage.includes('study information') || 
             lowerMessage.includes('study details')) {
      
      const study = dmBotService.getStudy(studyId);
      
      if (study) {
        let responseContent = `**Study ${study.protocolId}: ${study.title}**\n\n`;
        responseContent += `**Phase:** ${study.phase}\n`;
        responseContent += `**Status:** ${study.status}\n`;
        responseContent += `**Indication:** ${study.indication}\n`;
        responseContent += `**Start Date:** ${study.startDate}\n`;
        
        if (study.endDate) {
          responseContent += `**End Date:** ${study.endDate}\n`;
        }
        
        if (study.enrolledPatients) {
          responseContent += `**Enrolled Patients:** ${study.enrolledPatients}\n`;
        }
        
        if (study.sites) {
          responseContent += `**Sites:** ${study.sites}\n`;
        }
        
        if (study.countries && study.countries.length > 0) {
          responseContent += `**Countries:** ${study.countries.join(', ')}\n`;
        }
        
        if (study.sponsor) {
          responseContent += `**Sponsor:** ${study.sponsor}\n`;
        }
        
        if (study.primaryObjective) {
          responseContent += `\n**Primary Objective:**\n${study.primaryObjective}\n`;
        }
        
        if (study.secondaryObjectives && study.secondaryObjectives.length > 0) {
          responseContent += `\n**Secondary Objectives:**\n${study.secondaryObjectives.map(o => `- ${o}`).join('\n')}\n`;
        }
        
        // Add data source information
        if (study.dataSources && study.dataSources.length > 0) {
          responseContent += `\n**Data Sources:** ${study.dataSources.join(', ')}\n`;
        }
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
    }
    // Handle requests to find duplicate records
    else if (lowerMessage.includes('duplicate') || 
             (lowerMessage.includes('find') && lowerMessage.includes('duplicate')) || 
             (lowerMessage.includes('identify') && lowerMessage.includes('duplicate'))) {
      let domain: string | undefined;
      
      // Check if a specific domain is mentioned
      DATA_DOMAINS.forEach(d => {
        if (lowerMessage.includes(d.id.toLowerCase()) || 
            lowerMessage.toLowerCase().includes(d.name.toLowerCase())) {
          domain = d.id;
        }
      });
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ll check for duplicate records in the database. Processing...',
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
      
      // Find duplicate records
      setTimeout(() => {
        const duplicateResults = dmBotService.findDuplicateRecords(studyId, domain);
        
        if (duplicateResults.totalDuplicates === 0) {
          const noDuplicatesResponse: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: domain 
              ? `No duplicate records found in the ${domain} domain.` 
              : 'Great news! No duplicate records found across any domains.',
            timestamp: new Date()
          };
          
          setConversation(prevConversation => [...prevConversation, noDuplicatesResponse]);
        } else {
          // Format the results
          let responseContent = `**Duplicate Records Found**\n\n`;
          responseContent += `Total duplicate groups: ${duplicateResults.totalDuplicates}\n`;
          responseContent += `Affected subjects: ${duplicateResults.affectedSubjects.length}\n\n`;
          
          // Display detailed information about the duplicates
          duplicateResults.duplicates.forEach((dup, index) => {
            responseContent += `**Duplicate ${index + 1}:**\n`;
            responseContent += `- Subject ID: ${dup.usubjid}\n`;
            responseContent += `- Domain: ${dup.domain}\n`;
            responseContent += `- Number of records: ${dup.count}\n`;
            responseContent += `- Record IDs: ${dup.recordIds.join(', ')}\n`;
            
            // If differences exist between the duplicates, highlight them
            if (dup.differences && Object.keys(dup.differences).length > 0) {
              responseContent += `- **Key differences found:**\n`;
              
              Object.entries(dup.differences).forEach(([field, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                  responseContent += `  • ${field}: ${values.join(' vs. ')}\n`;
                }
              });
            } else {
              responseContent += `- Exact duplicates (all fields identical)\n`;
            }
            
            // If there are variable details in the records, show common fields
            if (dup.records && dup.records.length > 0) {
              const record = dup.records[0];
              const variables = Object.keys(record)
                .filter(key => key !== 'domain' && key !== 'usubjid' && 
                       (!dup.differences || !dup.differences[key]))
                .slice(0, 5); // Show only first 5 variables to avoid clutter
              
              if (variables.length > 0) {
                responseContent += `- Common fields: ${variables.join(', ')}\n`;
              }
            }
            
            responseContent += '\n';
          });
          
          const duplicatesResponse: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          };
          
          setConversation(prevConversation => [...prevConversation, duplicatesResponse]);
        }
      }, 1500);
    }
    // Handle questions about checking for null values
    else if (lowerMessage.includes('null') || 
             lowerMessage.includes('missing') || 
             lowerMessage.includes('empty') || 
             (lowerMessage.includes('find') && lowerMessage.includes('missing'))) {
      
      // Determine if user is asking about a specific domain
      let domain: string | undefined = undefined;
      
      // Check for domain mentions in the message
      DATA_DOMAINS.forEach(d => {
        if (lowerMessage.includes(d.id) || lowerMessage.toLowerCase().includes(d.name.toLowerCase())) {
          domain = d.id.toUpperCase();
        }
      });
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I\'ll check for null values or missing data. Processing...',
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
      
      // Find null values
      setTimeout(() => {
        const nullResults = dmBotService.findNullValues(studyId, domain);
        
        if (nullResults.totalNulls === 0) {
          const noNullsResponse: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: domain 
              ? `Great news! No null values found in the ${domain} domain.` 
              : 'No null values found across any domains.',
            timestamp: new Date()
          };
          
          setConversation(prevConversation => [...prevConversation, noNullsResponse]);
        } else {
          // Format the results
          let responseContent = `**Null Values Found**\n\n`;
          responseContent += `Total fields with null values: ${nullResults.totalNulls}\n\n`;
          
          // Group by domain
          const nullsByDomain: Record<string, any[]> = {};
          nullResults.nulls.forEach(nullField => {
            if (!nullsByDomain[nullField.domain]) {
              nullsByDomain[nullField.domain] = [];
            }
            nullsByDomain[nullField.domain].push(nullField);
          });
          
          // Display details organized by domain
          Object.entries(nullsByDomain).forEach(([domain, nullFields]) => {
            responseContent += `**${domain} Domain:**\n`;
            
            nullFields.forEach(nullField => {
              responseContent += `- Field: ${nullField.field}\n`;
              responseContent += `  • Missing in ${nullField.count} records\n`;
              responseContent += `  • Affected subjects: ${nullField.affectedSubjects.slice(0, 3).join(', ')}${
                nullField.affectedSubjects.length > 3 ? ` and ${nullField.affectedSubjects.length - 3} more...` : ''
              }\n`;
            });
            
            responseContent += '\n';
          });
          
          responseContent += `These null values could impact data quality and analysis results. Consider reviewing the affected records and determining if data collection or entry corrections are needed.`;
          
          const nullsResponse: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: responseContent,
            timestamp: new Date()
          };
          
          setConversation(prevConversation => [...prevConversation, nullsResponse]);
        }
      }, 1500);
    }
    // Handle questions about available data domains in the study
    else if (lowerMessage.includes('what domains') || 
            lowerMessage.includes('available domains') || 
            lowerMessage.includes('what data do you have')) {
      
      const availableDomains = dmBotService.getStudyDataDomains(studyId);
      
      if (availableDomains.length > 0) {
        const domainInfos = availableDomains.map(domain => {
          const domainInfo = DATA_DOMAINS.find(d => d.id === domain.toLowerCase());
          if (domainInfo) {
            return `- **${domainInfo.name}**: ${domainInfo.description}`;
          }
          return `- **${domain}**`;
        });
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `For this study, I have access to the following SDTM data domains:\n\n${domainInfos.join('\n\n')}\n\nI can provide details about any specific domain, or retrieve specific patient or visit data for you.`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
    }
    // Handle patient specific data requests
    else if ((lowerMessage.includes('patient') || lowerMessage.includes('subject')) && 
             (lowerMessage.includes('data') || lowerMessage.includes('information'))) {
      
      // Try to extract a patient ID from the message
      const patientMatch = message.match(/(?:patient|subject)[^\d]*(100-\d{3}|10\d{4})/i);
      const patientId = patientMatch ? patientMatch[1] : '100-001'; // default if none specified
      
      const patientData = dmBotService.getPatientData(patientId);
      
      if (patientData.length > 0) {
        // Group by domain for a coherent response
        const domainGroups = new Map<string, any[]>();
        
        patientData.forEach(data => {
          const domain = data.dataPoints.domain || 'Unknown';
          if (!domainGroups.has(domain)) {
            domainGroups.set(domain, []);
          }
          domainGroups.get(domain)!.push(data);
        });
        
        let responseContent = `**Patient ${patientId} Data Summary**\n\n`;
        
        // Add demographic information first if available
        if (domainGroups.has('DM')) {
          const dmData = domainGroups.get('DM')![0];
          responseContent += `**Demographics:**\n`;
          responseContent += `- Age: ${dmData.dataPoints.age}\n`;
          responseContent += `- Sex: ${dmData.dataPoints.sex}\n`;
          responseContent += `- Race: ${dmData.dataPoints.race}\n`;
          responseContent += `- Country: ${dmData.dataPoints.country}\n`;
          responseContent += `- Arm: ${dmData.dataPoints.armcd}\n\n`;
        }
        
        // Add visit information
        if (domainGroups.has('SV')) {
          const svData = domainGroups.get('SV')!;
          responseContent += `**Visits (${svData.length}):**\n`;
          responseContent += svData.map(sv => 
            `- ${sv.dataPoints.visit}: ${sv.dataPoints.svstdtc} (${sv.dataPoints.svstatus})`
          ).join('\n');
          responseContent += '\n\n';
        }
        
        // Add adverse event information
        if (domainGroups.has('AE')) {
          const aeData = domainGroups.get('AE')!;
          responseContent += `**Adverse Events (${aeData.length}):**\n`;
          responseContent += aeData.map(ae => 
            `- ${ae.dataPoints.aeterm} (${ae.dataPoints.aesev}): Started ${ae.dataPoints.aestdtc}, Relationship: ${ae.dataPoints.aerel}`
          ).join('\n');
          responseContent += '\n\n';
        }
        
        // Add a note about other available data
        const otherDomains = Array.from(domainGroups.keys())
          .filter(d => !['DM', 'SV', 'AE'].includes(d));
        
        if (otherDomains.length > 0) {
          responseContent += `**Other Available Data:** ${otherDomains.join(', ')}\n\n`;
          responseContent += `I can provide more detailed information about any specific domain for this patient. Just ask!`;
        }
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      } else {
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I don't have data for patient ${patientId}. The available patient IDs include: 100-001, 100-002, 100-003, 100-004, and 100-005.`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
    }
    // Handle visit-specific data requests
    else if (lowerMessage.includes('visit') && 
             (lowerMessage.includes('data') || lowerMessage.includes('information'))) {
      
      // Try to extract a visit ID from the message
      const visitMatch = message.match(/(?:visit|v)[^\d]*(\d+|v\d+)/i);
      let visitId = visitMatch ? visitMatch[1] : 'V1'; // default if none specified
      
      // Standardize the visit ID format
      if (!visitId.startsWith('V')) {
        visitId = 'V' + visitId;
      }
      
      const visitData = dmBotService.getVisitData(visitId);
      
      if (visitData.length > 0) {
        // Group by patient and domain for a coherent response
        const patientGroups = new Map<string, Map<string, any[]>>();
        
        visitData.forEach(data => {
          const patientId = data.patientId;
          const domain = data.dataPoints.domain || 'Unknown';
          
          if (!patientGroups.has(patientId)) {
            patientGroups.set(patientId, new Map<string, any[]>());
          }
          
          const domainGroups = patientGroups.get(patientId)!;
          if (!domainGroups.has(domain)) {
            domainGroups.set(domain, []);
          }
          
          domainGroups.get(domain)!.push(data);
        });
        
        let responseContent = `**${visitId} Data Summary**\n\n`;
        responseContent += `Data available for ${patientGroups.size} patients at ${visitId}.\n\n`;
        
        // Get a sample patient to show detailed data
        const samplePatientId = Array.from(patientGroups.keys())[0];
        const samplePatientDomains = patientGroups.get(samplePatientId)!;
        
        responseContent += `**Example data for patient ${samplePatientId}:**\n\n`;
        
        // Add visit information if available
        if (samplePatientDomains.has('SV')) {
          const svData = samplePatientDomains.get('SV')![0];
          responseContent += `**Visit Details:**\n`;
          responseContent += `- Date: ${svData.dataPoints.svstdtc}\n`;
          responseContent += `- Status: ${svData.dataPoints.svstatus}\n`;
          if (svData.dataPoints.svreasnd) {
            responseContent += `- Reason if missed: ${svData.dataPoints.svreasnd}\n`;
          }
          responseContent += '\n';
        }
        
        // Add vital signs if available
        if (samplePatientDomains.has('VS')) {
          const vsData = samplePatientDomains.get('VS')!;
          responseContent += `**Vital Signs:**\n`;
          vsData.forEach(vs => {
            responseContent += `- ${vs.dataPoints.vstest}: ${vs.dataPoints.vsorres} ${vs.dataPoints.vsorresu}\n`;
          });
          responseContent += '\n';
        }
        
        // Add lab results if available
        if (samplePatientDomains.has('LB')) {
          const lbData = samplePatientDomains.get('LB')!;
          responseContent += `**Lab Results:**\n`;
          lbData.forEach(lb => {
            const abnormalFlag = lb.dataPoints.lbnrind !== 'NORMAL' ? ` (${lb.dataPoints.lbnrind})` : '';
            responseContent += `- ${lb.dataPoints.lbtest}: ${lb.dataPoints.lborres} ${lb.dataPoints.lborresu}${abnormalFlag}\n`;
          });
          responseContent += '\n';
        }
        
        // Add exposure information if available
        if (samplePatientDomains.has('EX')) {
          const exData = samplePatientDomains.get('EX')![0];
          responseContent += `**Study Drug:**\n`;
          responseContent += `- Treatment: ${exData.dataPoints.extrt}\n`;
          responseContent += `- Dose: ${exData.dataPoints.exdose} ${exData.dataPoints.exdosu}\n`;
          responseContent += `- Route: ${exData.dataPoints.exroute}\n`;
          responseContent += `- Frequency: ${exData.dataPoints.exdosfrq}\n`;
          responseContent += '\n';
        }
        
        // Add a note about other available domains
        const allDomains = new Set<string>();
        patientGroups.forEach(domainGroups => {
          domainGroups.forEach((_, domain) => {
            allDomains.add(domain);
          });
        });
        
        responseContent += `**Available domains at ${visitId}:** ${Array.from(allDomains).join(', ')}\n\n`;
        responseContent += `I can provide more specific information about a particular patient or domain at this visit. Just ask!`;
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      } else {
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I don't have data for ${visitId}. The available visit IDs include: V1, V2, V3, V4, and V5.`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
    }
    // Handle questions about data domains
    else if (
      lowerMessage.includes('explain') || 
      lowerMessage.includes('what is') || 
      lowerMessage.includes('tell me about')
    ) {
      // Check if message contains any domain identifiers
      const domainKeyword = DATA_DOMAINS.find(domain => 
        lowerMessage.includes(domain.id) || 
        lowerMessage.toLowerCase().includes(domain.name.toLowerCase())
      );
      
      if (domainKeyword) {
        const domain = domainKeyword;
        const variablesFormatted = domain.key_variables.join(', ');
        
        // Try to get actual domain data count
        const domainData = dmBotService.getDomainData(studyId, domain.id.toUpperCase());
        const dataCountInfo = domainData.length > 0 ? 
          `\n\nI have ${domainData.length} records for this domain in the current study.` : '';
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**${domain.name}**\n\n${domain.description}\n\nKey variables: ${variablesFormatted}${dataCountInfo}\n\nThis domain is part of the SDTM standard used in clinical trials. Would you like to see a sample of the actual data?`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
      
      // Check for data sources
      const sourceKeyword = DATA_SOURCES.find(source => 
        lowerMessage.includes(source.id) || 
        lowerMessage.toLowerCase().includes(source.name.toLowerCase()) ||
        lowerMessage.toLowerCase().includes(source.full_name.toLowerCase())
      );
      
      if (sourceKeyword) {
        const source = sourceKeyword;
        const examplesFormatted = source.examples.join(', ');
        
        // Get study information for context
        const study = dmBotService.getStudy(studyId);
        const studyDataSources = study?.dataSources || [];
        const sourceAvailability = studyDataSources.includes(source.name) ?
          `This data source is available for the current study (${study?.protocolId}).` :
          `This data source is not currently configured for the study (${study?.protocolId}).`;
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**${source.name} (${source.full_name})**\n\nThis is a data source commonly used in clinical trials. Examples include: ${examplesFormatted}.\n\n${sourceAvailability}\n\nI can check for data consistency between different sources and generate reports of any discrepancies found.`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
      
      // General data domain question
      if (lowerMessage.includes('domain') || lowerMessage.includes('sdtm') || lowerMessage.includes('data type')) {
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Clinical trial data is organized into standardized domains following the SDTM (Study Data Tabulation Model) standard. These include:\n\n${DATA_DOMAINS.map(d => `- **${d.name}**: ${d.description}`).join('\n\n')}\n\nWhich domain would you like to learn more about?`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
      
      // General data sources question
      if (lowerMessage.includes('source') || lowerMessage.includes('system') || lowerMessage.includes('database')) {
        // Get study info to customize response
        const study = dmBotService.getStudy(studyId);
        const studyDataSources = study?.dataSources || [];
        
        const sourceInfo = DATA_SOURCES.map(s => {
          const isAvailable = studyDataSources.includes(s.name);
          const availabilityBadge = isAvailable ? "✓ " : "";
          return `- ${availabilityBadge}**${s.name} (${s.full_name})**: Examples include ${s.examples.join(', ')}`;
        }).join('\n\n');
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `In Trial Data Management, data comes from multiple sources:\n\n${sourceInfo}\n\n${studyDataSources.length > 0 ? `The current study (${study?.protocolId}) uses: ${studyDataSources.join(', ')}.` : ""}\n\nThese systems contain raw data that needs to be harmonized and checked for quality and consistency.`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
    }
    // Handle requests for key variables
    else if (lowerMessage.includes('key variable') || lowerMessage.includes('variable') || lowerMessage.includes('field')) {
      // Check for specific domain
      const domainKeyword = DATA_DOMAINS.find(domain => 
        lowerMessage.includes(domain.id) || 
        lowerMessage.toLowerCase().includes(domain.name.toLowerCase())
      );
      
      if (domainKeyword) {
        const domain = domainKeyword;
        
        // Try to get a sample data record to illustrate with real values
        const domainData = dmBotService.getDomainData(studyId, domain.id.toUpperCase());
        let exampleInfo = '';
        
        if (domainData.length > 0) {
          const sampleRecord = domainData[0];
          exampleInfo = '\n\n**Example from study data:**\n';
          
          domain.key_variables.forEach(variable => {
            const lowerVar = variable.toLowerCase();
            // Find the actual variable in the data (case insensitive)
            const actualVar = Object.keys(sampleRecord.dataPoints)
              .find(key => key.toLowerCase() === lowerVar);
            
            if (actualVar && sampleRecord.dataPoints[actualVar] !== undefined) {
              exampleInfo += `- **${variable}**: ${sampleRecord.dataPoints[actualVar]}\n`;
            }
          });
        }
        
        const botResponse: ConversationMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**Key Variables in ${domain.name}**\n\n${domain.key_variables.map(v => `- **${v}**`).join('\n')}\n\nThese variables uniquely identify records and store the primary data in this domain.${exampleInfo}`,
          timestamp: new Date()
        };
        
        setConversation(prevConversation => [...prevConversation, botResponse]);
        return;
      }
      
      // General variables question
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `In clinical trial datasets, each domain has specific key variables. For example:\n\n- In Demographics (DM): USUBJID, AGE, SEX, RACE, ETHNIC\n- In Adverse Events (AE): USUBJID, AETERM, AESEV, AEREL\n- In Lab Results (LB): USUBJID, LBTEST, LBORRES, LBDTC\n\nWhich domain's variables are you interested in?`,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
    }
    // Handle requests for data quality issues
    else if (
      lowerMessage.includes('quality issue') || 
      lowerMessage.includes('data issue') || 
      lowerMessage.includes('problem') || 
      lowerMessage.includes('inconsistenc')
    ) {
      const study = dmBotService.getStudy(studyId);
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Common data quality issues in ${study?.protocolId || "clinical trials"} include:\n\n${DATA_QUALITY_ISSUES.map(i => `- **${i.type.replace('_', ' ').charAt(0).toUpperCase() + i.type.replace('_', ' ').slice(1)}**: ${i.description}`).join('\n')}\n\nI can run a data quality check to identify these issues in your study data. Would you like me to do that?`,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
    }
    // Handle inconsistency detection
    else if (
      (lowerMessage.includes('compare') || lowerMessage.includes('check')) &&
      (lowerMessage.includes('between') || lowerMessage.includes('across'))
    ) {
      let sources: string[] = [];
      
      DATA_SOURCES.forEach(source => {
        if (lowerMessage.includes(source.id.toLowerCase()) || 
            lowerMessage.includes(source.name.toLowerCase())) {
          sources.push(source.name);
        }
      });
      
      if (sources.length < 2) {
        sources = ['EDC', 'Lab']; // Default if not enough sources specified
      }
      
      // Check if these sources actually have data in the study
      const study = dmBotService.getStudy(studyId);
      const availableSources = study?.dataSources || [];
      const sourcesAvailable = sources.every(source => availableSources.includes(source));
      
      let responseContent = '';
      if (sourcesAvailable) {
        responseContent = `I'll run a comparison between ${sources.join(' and ')} data to identify any inconsistencies. This involves checking for:\n\n- Mismatched demographic information\n- Inconsistent dates\n- Different lab results across sources\n- Missing data in one source but present in another\n\nI'll start the analysis now. This may take a few moments.`;
      } else {
        const missingSource = sources.find(source => !availableSources.includes(source));
        responseContent = `I'd like to compare ${sources.join(' and ')} data, but ${missingSource} data is not available for this study. The available sources are: ${availableSources.join(', ')}. Would you like me to compare different sources instead?`;
      }
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
      
      // Only start analysis if sources are available
      if (sourcesAvailable) {
        setTimeout(() => {
          startAnalysis();
        }, 1000);
      }
    }
    // Default response for other messages
    else {
      const study = dmBotService.getStudy(studyId);
      
      const botResponse: ConversationMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I'm your Data Management AI Assistant for study ${study?.protocolId || "unknown"}. I can help with:\n\n- Explaining clinical trial data domains (DM, SV, AE, LB, VS, CM, EX)\n- Running data quality checks across all data sources\n- Finding inconsistencies between different data sources\n- Providing specific information about patients, visits, or study details\n- Scheduling regular data quality checks\n\nWhat would you like to know about the trial data?`,
        timestamp: new Date()
      };
      
      setConversation(prevConversation => [...prevConversation, botResponse]);
    }
  };
  
  // Quick response handler
  const handleQuickResponse = (response: string) => {
    setUserInput(response);
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Start data analysis process
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setCurrentStep(0);
    setProgress(0);
    setAnalysisResults(null);
    setActiveTab('analysis');

    // Simulate analysis with steps
    const totalSteps = ANALYSIS_STEPS.length;
    let stepCounter = 0;

    const interval = setInterval(async () => {
      if (stepCounter < totalSteps) {
        setCurrentStep(stepCounter);
        setProgress(Math.round(((stepCounter + 1) / totalSteps) * 100));
        stepCounter++;
      } else {
        clearInterval(interval);
        try {
          // Get real results from the service
          const results = await dmBotService.analyzeData(studyId);
          
          // Add schedule information if available
          const resultsWithSchedule = {
            ...results,
            // Include schedule information if we have it
            scheduleUpdated: false, // Not updating schedule here, just preserving existing data
            // Make sure topIssues exists (required by AnalysisResults interface)
            topIssues: results.topIssues || []
          };
          
          setAnalysisResults(resultsWithSchedule);
          
          // Update queries after analysis
          const activeQueries = dmBotService.getActiveQueries(studyId);
          setQueries(activeQueries);
          
          // Notify parent component
          if (onAnalysisComplete) {
            onAnalysisComplete(resultsWithSchedule);
          }
          
          // Add completion message to conversation
          const botResponse: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Analysis complete! I found ${results.totalIssues} issues and generated ${results.queriesGenerated} queries. View the full results in the Analysis tab or switch to the Queries tab to see the detailed queries.`,
            timestamp: new Date()
          };
          
          setConversation(prevConversation => [...prevConversation, botResponse]);
          setIsAnalyzing(false);
        } catch (error) {
          console.error('Error analyzing data:', error);
          setIsAnalyzing(false);
          
          // Add error message to conversation
          const botResponse: ConversationMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'I encountered an error while analyzing the data. Please try again or contact support if the issue persists.',
            timestamp: new Date()
          };
          
          setConversation(prevConversation => [...prevConversation, botResponse]);
        }
      }
    }, 800);
  };

  // Handle dialog open/close
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setIsAnalyzing(false);
      setCurrentStep(0);
      setProgress(0);
    }
  };

  // Format dates for display
  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMM dd, yyyy');
  };

  // Get color for severity badge
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get color for status badge
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'in-review': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get color for overdue status
  const getOverdueStatusColor = (status: string | undefined) => {
    if (!status) return '';
    
    switch (status) {
      case 'on-time': return 'text-green-600';
      case 'due-soon': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
      default: return '';
    }
  };

  // Filter queries based on view mode
  const filteredQueries = queries.filter(query => {
    if (queryViewMode === 'open') {
      return query.status !== 'resolved';
    } else if (queryViewMode === 'overdue') {
      return query.overdueStatus === 'overdue';
    }
    return true;
  });

  // Handle scheduling data checks
  const handleSchedule = () => {
    if (!scheduleDate) return;
    
    const frequency = scheduleFrequency;
    const startDate = scheduleDate;
    
    // Close popover
    setIsSchedulePopoverOpen(false);
    
    // Add confirmation message to conversation
    const botResponse: ConversationMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `Scheduled ${frequency} data quality checks starting from ${format(startDate, 'MMMM dd, yyyy')}. Notifications will be sent before each check.`,
      timestamp: new Date()
    };
    
    setConversation(prevConversation => [...prevConversation, botResponse]);
    setActiveTab('chat');
    
    // Notify parent component of schedule update
    if (onAnalysisComplete) {
      const scheduleResults: AnalysisResults = {
        totalIssues: analysisResults?.totalIssues || 0,
        queriesGenerated: analysisResults?.queriesGenerated || 0,
        dataSources: analysisResults?.dataSources || [],
        metrics: analysisResults?.metrics || {
          dataQualityScore: 0,
          consistencyScore: 0,
          completenessScore: 0,
          queryResponseRate: 0
        },
        scheduleUpdated: true,
        scheduleFrequency: frequency,
        nextRunDate: startDate,
        checkTypes: ['Data Consistency', 'Completeness'],
        topIssues: analysisResults?.topIssues || [
          {
            id: 'auto-1',
            description: 'Scheduled checks will identify new issues when run',
            severity: 'medium',
            dataSources: ['EDC', 'Labs'],
            status: 'new'
          }
        ]
      };
      
      onAnalysisComplete(scheduleResults);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 transition-all shadow-sm"
          onClick={() => handleOpenChange(true)}
        >
          <FaUserGear className="mr-2 h-5 w-5 text-blue-600" />
          <span className="font-medium">DM.AI</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
          <DialogTitle className="flex items-center">
            <FaUserGear className="mr-2 h-6 w-6 text-blue-600" />
            <span>DM.AI Assistant</span>
          </DialogTitle>
          <DialogDescription>
            AI assistant for clinical trial data management
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b px-6 flex-shrink-0">
            <TabsList className="h-10">
              <TabsTrigger value="chat" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                Analysis
              </TabsTrigger>
              <TabsTrigger value="queries" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Queries
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col p-0 m-0 data-[state=active]:flex">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversation.map((message) => (
                  <div key={message.id} className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[80%] rounded-lg p-3 shadow-sm",
                      message.role === 'user' 
                        ? "bg-blue-600 text-white ml-auto" 
                        : "bg-gray-100 border border-gray-200 text-gray-800"
                    )}>
                      <div className="flex items-center mb-1">
                        {message.role === 'assistant' ? (
                          <div className="bg-blue-100 rounded-full p-1 mr-2">
                            <FaUserGear className="h-3 w-3 text-blue-600" />
                          </div>
                        ) : (
                          <div className="bg-white/20 rounded-full p-1 mr-2">
                            <User className="h-3 w-3" />
                          </div>
                        )}
                        <span className={cn(
                          "text-xs",
                          message.role === 'user' ? "text-blue-100" : "text-blue-600"
                        )}>
                          {message.role === 'assistant' ? 'DM.AI' : 'You'}
                        </span>
                      </div>
                      <div className="whitespace-pre-line prose prose-sm max-w-none">
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t flex-shrink-0">
              <div className="mb-2 flex flex-wrap gap-2">
                {QUICK_RESPONSES.map((response) => (
                  <Button 
                    key={response.id} 
                    variant="outline" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => handleQuickResponse(response.text)}
                  >
                    {response.text}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Analysis Tab */}
          <TabsContent value="analysis" className="flex-1 overflow-hidden data-[state=active]:flex flex-col">
            {isAnalyzing ? (
              <div className="space-y-6 p-6 flex-1 overflow-auto">
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
                      {ANALYSIS_STEPS.map((step, index) => (
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
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
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
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Data Quality Metrics</CardTitle>
                      <CardDescription>Key performance indicators</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Data Quality Score</span>
                            <span className="text-sm font-bold">{analysisResults.metrics.dataQualityScore}%</span>
                          </div>
                          <Progress value={analysisResults.metrics.dataQualityScore} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Consistency Score</span>
                            <span className="text-sm font-bold">{analysisResults.metrics.consistencyScore}%</span>
                          </div>
                          <Progress value={analysisResults.metrics.consistencyScore} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Completeness Score</span>
                            <span className="text-sm font-bold">{analysisResults.metrics.completenessScore}%</span>
                          </div>
                          <Progress value={analysisResults.metrics.completenessScore} className="h-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Query Response Rate</span>
                            <span className="text-sm font-bold">{analysisResults.metrics.queryResponseRate}%</span>
                          </div>
                          <Progress value={analysisResults.metrics.queryResponseRate} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="flex justify-between">
                    <Button 
                      onClick={() => setActiveTab('queries')}
                      className="mr-2"
                    >
                      View Generated Queries
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => startAnalysis()}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Analysis
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium">No Analysis Data</h3>
                  <p className="text-muted-foreground max-w-md text-sm">
                    Run a data quality check to analyze this study's data
                  </p>
                  <Button onClick={() => startAnalysis()}>
                    Run Quality Check
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Queries Tab */}
          <TabsContent value="queries" className="flex-1 overflow-hidden data-[state=active]:flex flex-col">
            <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
              <div className="flex items-center">
                <Select value={queryViewMode} onValueChange={(value: 'all' | 'open' | 'overdue') => setQueryViewMode(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="View Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Queries</SelectItem>
                    <SelectItem value="open">Open Queries</SelectItem>
                    <SelectItem value="overdue">Overdue Queries</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-4 text-sm text-muted-foreground">
                  {filteredQueries.length} {filteredQueries.length === 1 ? 'query' : 'queries'} found
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => startAnalysis()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueries.length > 0 ? (
                    filteredQueries.map((query) => (
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
                        <TableCell>{query.assignedTo || 'Unassigned'}</TableCell>
                        <TableCell>
                          <span className={getOverdueStatusColor(query.overdueStatus)}>
                            {formatDate(query.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Reference Data</span>
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                            <AlertCircle className="h-6 w-6 text-blue-600" />
                          </div>
                          <span className="text-muted-foreground">No queries found</span>
                          <Button size="sm" onClick={() => startAnalysis()}>
                            Run Quality Check
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule" className="flex-1 overflow-hidden data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
                    Schedule Data Quality Checks
                  </CardTitle>
                  <CardDescription>Set up automatic quality checks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Start Date</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input 
                          type="date" 
                          className="pl-10 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          onChange={(e) => setScheduleDate(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency</label>
                      <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Check Types</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="check-consistency" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="check-consistency" className="text-sm">Data Consistency</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="check-completeness" className="rounded border-gray-300" defaultChecked />
                        <label htmlFor="check-completeness" className="text-sm">Completeness</label>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setActiveTab('chat')}>Cancel</Button>
                  <Button onClick={handleSchedule} disabled={!scheduleDate}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Schedule Checks
                  </Button>
                </CardFooter>
              </Card>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};