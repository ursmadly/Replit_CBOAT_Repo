import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Send, X, Minimize, Maximize, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CentralMonitorQuery {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'responded' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  trialId: number;
  siteName: string;
  siteId: number;
  domain: string;
  assignee: string;
  created: Date;
  responses: QueryResponse[];
}

interface QueryResponse {
  id: string;
  queryId: string;
  responder: string;
  role: string;
  content: string;
  status: string;
  createdAt: Date;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'under_review' | 'responded' | 'closed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  trialId: number;
  siteId: number;
  siteName: string;
  assignee: string;
  created: Date;
  dueDate: Date;
  comments: TaskComment[];
}

interface TaskComment {
  id: string;
  taskId: string;
  commenter: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface MonitorSettings {
  monitoring: {
    activeMonitoring: boolean;
    scheduledMonitoring: boolean;
    frequency: string;
    priority: string;
  };
  alerts: {
    emailAlerts: boolean;
    systemAlerts: boolean;
    smsAlerts: boolean;
    escalation: boolean;
  };
  triggers: {
    dataRefresh: boolean;
    queryResponses: boolean;
    thresholdViolations: boolean;
    siteActions: boolean;
  };
}

interface TrialHealthMetrics {
  overallHealth: number; // 0-100
  riskScore: number; // 0-100
  subjectCompliance: number; // 0-100
  dataQuality: number; // 0-100
  protocolDeviations: number;
  saeReporting: number; // 0-100
  queryResponseRate: number; // 0-100
  avgQueryResponseTime: number; // days
  riskLevel: 'low' | 'medium' | 'high';
  trendsDirection: 'improving' | 'stable' | 'declining';
  dbLockCompliance: {
    status: 'not_started' | 'in_progress' | 'ready' | 'completed';
    readiness: number; // 0-100
    outstandingIssues: number;
    estimatedLockDate: Date;
    dataEntryComplete: number; // percentage
    queryResolution: number; // percentage
    medicalReview: number; // percentage
    sdvComplete: number; // percentage
    readyForExport: boolean;
  };
  sites: {
    siteId: number;
    siteName: string;
    status: 'active' | 'pending' | 'suspended' | 'closed';
    subjectCount: number;
    performanceScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high';
    openQueries: number;
    openTasks: number;
    lastMonitored: Date;
    dbLockStatus: 'pending' | 'in_progress' | 'ready' | 'complete';
    outstandingLockIssues: number;
  }[];
}

interface CentralMonitorBotProps {
  trialName?: string;
  trialId?: number;
  siteName?: string;
  siteId?: number;
  isAgentMode?: boolean;
  setIsAgentMode?: (value: boolean) => void;
}

// Sample queries for demonstration
const queries: CentralMonitorQuery[] = [
  {
    id: "Q-001",
    title: "Missing Primary Endpoint Data",
    description: "Subject 1002-004 is missing week 12 primary endpoint measurement",
    status: "open",
    priority: "high",
    trialId: 1,
    siteName: "Memorial Research Hospital",
    siteId: 1002,
    domain: "EFFICACY",
    assignee: "Dr. Martinez",
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    responses: []
  },
  {
    id: "Q-002",
    title: "Protocol Deviation - Inclusion Criteria",
    description: "Subject 1005-007 was enrolled despite not meeting inclusion criterion #3 (HbA1c > 7.5%)",
    status: "in_progress",
    priority: "critical",
    trialId: 1,
    siteName: "City Medical Center",
    siteId: 1005,
    domain: "SAFETY",
    assignee: "Dr. Johnson",
    created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    responses: [
      {
        id: "R-001",
        queryId: "Q-002",
        responder: "Dr. Johnson",
        role: "Principal Investigator",
        content: "Subject's last HbA1c was 7.3%, which was mistakenly recorded. We are reviewing our screening procedures.",
        status: "under_review",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ]
  },
  {
    id: "Q-003",
    title: "Adverse Event Reporting Delay",
    description: "SAE for Subject 1003-011 was reported 5 days after occurrence, exceeding the 24-hour reporting requirement",
    status: "closed",
    priority: "high",
    trialId: 1,
    siteName: "University Research Center",
    siteId: 1003,
    domain: "SAFETY",
    assignee: "Dr. Thompson",
    created: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    responses: [
      {
        id: "R-002",
        queryId: "Q-003",
        responder: "Dr. Thompson",
        role: "Sub-Investigator",
        content: "The delay occurred due to a miscommunication between weekend staff. We have updated our SOPs and held retraining for all site staff.",
        status: "accepted",
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
      },
      {
        id: "R-003",
        queryId: "Q-003",
        responder: "Sarah Wilson",
        role: "Central Monitor",
        content: "Response accepted. Please provide documentation of the retraining by next week.",
        status: "closed",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      }
    ]
  },
  {
    id: "Q-004",
    title: "Lab Sample Storage Deviation",
    description: "Temperature logs indicate freezer storing PK samples was out of range for 3 hours",
    status: "responded",
    priority: "medium",
    trialId: 1,
    siteName: "Community Clinical Research",
    siteId: 1008,
    domain: "LAB",
    assignee: "Dr. Patel",
    created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    responses: [
      {
        id: "R-004",
        queryId: "Q-004",
        responder: "Dr. Patel",
        role: "Site Coordinator",
        content: "Power outage caused the temperature deviation. Backup generator was activated but had a 3-hour delay. Samples were moved to backup freezer once issue was identified. Vendor has confirmed samples are still viable.",
        status: "pending_review",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ]
  }
];

// Sample tasks for demonstration
const tasks: Task[] = [
  {
    id: "T-001",
    title: "Site Retraining on AE Reporting",
    description: "Conduct retraining session for site staff on adverse event reporting timelines",
    status: "in_progress",
    priority: "high",
    trialId: 1,
    siteId: 1003,
    siteName: "University Research Center",
    assignee: "Dr. Thompson",
    created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
    comments: [
      {
        id: "C-001",
        taskId: "T-001",
        commenter: "Sarah Wilson",
        role: "Central Monitor",
        content: "Please provide agenda and attendee list after the training.",
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      },
      {
        id: "C-002",
        taskId: "T-001",
        commenter: "Dr. Thompson",
        role: "Sub-Investigator",
        content: "Training scheduled for tomorrow. Will provide documentation after completion.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ]
  },
  {
    id: "T-002",
    title: "Data Correction for Subject 1002-004",
    description: "Enter missing primary endpoint data for week 12 visit",
    status: "pending",
    priority: "high",
    trialId: 1,
    siteId: 1002,
    siteName: "Memorial Research Hospital",
    assignee: "Dr. Martinez",
    created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Due in 4 days
    comments: []
  },
  {
    id: "T-003",
    title: "Protocol Deviation Documentation",
    description: "Complete protocol deviation form for Subject 1005-007 inclusion criteria violation",
    status: "assigned",
    priority: "high",
    trialId: 1,
    siteId: 1005,
    siteName: "City Medical Center",
    assignee: "Dr. Johnson",
    created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Due in 1 day
    comments: [
      {
        id: "C-003",
        taskId: "T-003",
        commenter: "Michael Chen",
        role: "Study Manager",
        content: "This is a critical issue. Please prioritize completing this form by EOD tomorrow.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      }
    ]
  },
  {
    id: "T-004",
    title: "Follow-up on PK Sample Viability",
    description: "Obtain written confirmation from central lab on viability of PK samples after temperature excursion",
    status: "closed",
    priority: "medium",
    trialId: 1,
    siteId: 1008,
    siteName: "Community Clinical Research",
    assignee: "Dr. Patel",
    created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Due 1 day ago
    comments: [
      {
        id: "C-004",
        taskId: "T-004",
        commenter: "Dr. Patel",
        role: "Site Coordinator",
        content: "Lab confirmation attached to EDC. All samples confirmed viable with no impact on analysis.",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        id: "C-005",
        taskId: "T-004",
        commenter: "Emily Rodriguez",
        role: "Central Monitor",
        content: "Documentation reviewed and accepted. Task can be closed.",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ]
  }
];

// Define trial health for each trial
const trialHealthData: Record<number, TrialHealthMetrics> = {
  1: { // Diabetes Type 2 study
    overallHealth: 82,
    riskScore: 24,
    subjectCompliance: 91,
    dataQuality: 87,
    protocolDeviations: 3,
    saeReporting: 96,
    queryResponseRate: 78,
    avgQueryResponseTime: 2.3,
    riskLevel: 'low',
    trendsDirection: 'improving',
    dbLockCompliance: {
      status: 'in_progress',
      readiness: 76,
      outstandingIssues: 12,
      estimatedLockDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      dataEntryComplete: 92,
      queryResolution: 83,
      medicalReview: 78,
      sdvComplete: 68,
      readyForExport: false
    },
    sites: [
      { 
        siteId: 1002, 
        siteName: "Memorial Research Hospital", 
        status: 'active', 
        subjectCount: 32, 
        performanceScore: 88, 
        riskLevel: 'low',
        openQueries: 1,
        openTasks: 1,
        lastMonitored: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'in_progress',
        outstandingLockIssues: 3
      },
      { 
        siteId: 1003, 
        siteName: "University Research Center", 
        status: 'active', 
        subjectCount: 28, 
        performanceScore: 92, 
        riskLevel: 'low',
        openQueries: 0,
        openTasks: 1,
        lastMonitored: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'ready',
        outstandingLockIssues: 2
      },
      { 
        siteId: 1005, 
        siteName: "City Medical Center", 
        status: 'active', 
        subjectCount: 15, 
        performanceScore: 76, 
        riskLevel: 'medium',
        openQueries: 1,
        openTasks: 1,
        lastMonitored: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'pending',
        outstandingLockIssues: 6
      },
      { 
        siteId: 1008, 
        siteName: "Community Clinical Research", 
        status: 'active', 
        subjectCount: 24, 
        performanceScore: 84, 
        riskLevel: 'low',
        openQueries: 1,
        openTasks: 0,
        lastMonitored: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'complete',
        outstandingLockIssues: 0
      }
    ]
  },
  2: { // Rheumatoid Arthritis study
    overallHealth: 74,
    riskScore: 38,
    subjectCompliance: 83,
    dataQuality: 79,
    protocolDeviations: 8,
    saeReporting: 91,
    queryResponseRate: 65,
    avgQueryResponseTime: 4.5,
    riskLevel: 'medium',
    trendsDirection: 'stable',
    dbLockCompliance: {
      status: 'ready',
      readiness: 85,
      outstandingIssues: 6,
      estimatedLockDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      dataEntryComplete: 95,
      queryResolution: 88,
      medicalReview: 82,
      sdvComplete: 78,
      readyForExport: false
    },
    sites: [
      { 
        siteId: 2001, 
        siteName: "Arthritis Research Institute", 
        status: 'active', 
        subjectCount: 18, 
        performanceScore: 81, 
        riskLevel: 'low',
        openQueries: 3,
        openTasks: 2,
        lastMonitored: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'in_progress',
        outstandingLockIssues: 4
      },
      { 
        siteId: 2002, 
        siteName: "Rheumatology Specialist Center", 
        status: 'active', 
        subjectCount: 21, 
        performanceScore: 68, 
        riskLevel: 'medium',
        openQueries: 7,
        openTasks: 4,
        lastMonitored: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'pending',
        outstandingLockIssues: 8
      },
      { 
        siteId: 2003, 
        siteName: "Joint & Bone Research", 
        status: 'active', 
        subjectCount: 12, 
        performanceScore: 74, 
        riskLevel: 'medium',
        openQueries: 5,
        openTasks: 3,
        lastMonitored: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'in_progress',
        outstandingLockIssues: 5
      }
    ]
  },
  3: { // Advanced Breast Cancer study
    overallHealth: 63,
    riskScore: 58,
    subjectCompliance: 72,
    dataQuality: 68,
    protocolDeviations: 12,
    saeReporting: 82,
    queryResponseRate: 54,
    avgQueryResponseTime: 6.2,
    riskLevel: 'high',
    trendsDirection: 'declining',
    dbLockCompliance: {
      status: 'not_started',
      readiness: 35,
      outstandingIssues: 28,
      estimatedLockDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      dataEntryComplete: 65,
      queryResolution: 45,
      medicalReview: 30,
      sdvComplete: 25,
      readyForExport: false
    },
    sites: [
      { 
        siteId: 3001, 
        siteName: "Oncology Research Partners", 
        status: 'active', 
        subjectCount: 14, 
        performanceScore: 62, 
        riskLevel: 'high',
        openQueries: 9,
        openTasks: 6,
        lastMonitored: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'pending',
        outstandingLockIssues: 12
      },
      { 
        siteId: 3002, 
        siteName: "Cancer Treatment Alliance", 
        status: 'suspended', 
        subjectCount: 8, 
        performanceScore: 51, 
        riskLevel: 'high',
        openQueries: 12,
        openTasks: 8,
        lastMonitored: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'pending',
        outstandingLockIssues: 15
      },
      { 
        siteId: 3003, 
        siteName: "Metropolitan Cancer Center", 
        status: 'active', 
        subjectCount: 16, 
        performanceScore: 71, 
        riskLevel: 'medium',
        openQueries: 6,
        openTasks: 4,
        lastMonitored: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'in_progress',
        outstandingLockIssues: 7
      }
    ]
  },
  4: { // Alzheimer's Disease study
    overallHealth: 78,
    riskScore: 31,
    subjectCompliance: 85,
    dataQuality: 81,
    protocolDeviations: 5,
    saeReporting: 93,
    queryResponseRate: 72,
    avgQueryResponseTime: 3.1,
    riskLevel: 'medium',
    trendsDirection: 'improving',
    dbLockCompliance: {
      status: 'in_progress',
      readiness: 65,
      outstandingIssues: 15,
      estimatedLockDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      dataEntryComplete: 80,
      queryResolution: 75,
      medicalReview: 60,
      sdvComplete: 55,
      readyForExport: false
    },
    sites: [
      { 
        siteId: 4001, 
        siteName: "Neurology Research Institute", 
        status: 'active', 
        subjectCount: 22, 
        performanceScore: 83, 
        riskLevel: 'low',
        openQueries: 4,
        openTasks: 2,
        lastMonitored: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'ready',
        outstandingLockIssues: 2
      },
      { 
        siteId: 4002, 
        siteName: "Memory and Cognitive Health Center", 
        status: 'active', 
        subjectCount: 18, 
        performanceScore: 79, 
        riskLevel: 'medium',
        openQueries: 5,
        openTasks: 3,
        lastMonitored: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'in_progress',
        outstandingLockIssues: 5
      },
      { 
        siteId: 4003, 
        siteName: "Senior Care Research", 
        status: 'active', 
        subjectCount: 24, 
        performanceScore: 77, 
        riskLevel: 'medium',
        openQueries: 6,
        openTasks: 4,
        lastMonitored: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        dbLockStatus: 'pending',
        outstandingLockIssues: 8
      }
    ]
  }
};

// Current system settings
const currentSettings: MonitorSettings = {
  monitoring: {
    activeMonitoring: true,
    scheduledMonitoring: false,
    frequency: "weekly",
    priority: "medium"
  },
  alerts: {
    emailAlerts: true,
    systemAlerts: true,
    smsAlerts: false,
    escalation: true
  },
  triggers: {
    dataRefresh: true,
    queryResponses: true,
    thresholdViolations: true,
    siteActions: false
  }
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString();
};

const formatRelativeDate = (date: Date) => {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
};

const getOpenQueriesCount = () => {
  return queries.filter(query => query.status !== 'closed').length;
};

const getPendingTasksCount = () => {
  return tasks.filter(task => task.status !== 'closed').length;
};

const getOverdueTasksCount = () => {
  const now = new Date();
  return tasks.filter(task => 
    task.status !== 'closed' && 
    task.dueDate < now
  ).length;
};

const getQueryDetails = (queryId: string) => {
  const query = queries.find(q => q.id.toLowerCase() === queryId.toLowerCase());
  
  if (!query) {
    return `No query found with ID ${queryId}. Please check the query ID and try again.`;
  }
  
  let response = `Query ${query.id}: ${query.title}
- Site: ${query.siteName} (${query.siteId})
- Priority: ${query.priority}
- Status: ${query.status}
- Domain: ${query.domain}
- Assignee: ${query.assignee}
- Created: ${formatDate(query.created)}
- Description: ${query.description}`;

  if (query.responses.length > 0) {
    response += "\n\nResponses:";
    query.responses.forEach(resp => {
      response += `\n- ${formatDate(resp.createdAt)} | ${resp.responder} (${resp.role}): "${resp.content}"`;
    });
  } else {
    response += "\n\nNo responses yet.";
  }

  return response;
};

const getTaskDetails = (taskId: string) => {
  const task = tasks.find(t => t.id.toLowerCase() === taskId.toLowerCase());
  
  if (!task) {
    return `No task found with ID ${taskId}. Please check the task ID and try again.`;
  }
  
  let response = `Task ${task.id}: ${task.title}
- Site: ${task.siteName} (${task.siteId})
- Priority: ${task.priority}
- Status: ${task.status}
- Assignee: ${task.assignee}
- Created: ${formatDate(task.created)}
- Due: ${formatDate(task.dueDate)}${task.dueDate < new Date() ? ' (OVERDUE)' : ''}
- Description: ${task.description}`;

  if (task.comments.length > 0) {
    response += "\n\nComments:";
    task.comments.forEach(comment => {
      response += `\n- ${formatDate(comment.createdAt)} | ${comment.commenter} (${comment.role}): "${comment.content}"`;
    });
  } else {
    response += "\n\nNo comments yet.";
  }

  return response;
};

const getQueriesBySite = (siteId?: number) => {
  if (siteId) {
    const siteQueries = queries.filter(q => q.siteId === siteId);
    const siteName = siteQueries.length > 0 ? siteQueries[0].siteName : `Site ${siteId}`;
    
    if (siteQueries.length === 0) {
      return `No queries found for site ${siteId}.`;
    }
    
    let response = `Queries for ${siteName} (Site ${siteId}):\n`;
    siteQueries.forEach(query => {
      response += `- ${query.id}: ${query.title} | ${query.priority} priority | ${query.status}\n`;
    });
    return response;
  } else {
    // Group queries by site
    const siteQueryMap: Record<string, CentralMonitorQuery[]> = {};
    queries.forEach(query => {
      if (!siteQueryMap[query.siteId]) {
        siteQueryMap[query.siteId] = [];
      }
      siteQueryMap[query.siteId].push(query);
    });
    
    let response = "Queries by site:\n";
    Object.entries(siteQueryMap).forEach(([siteId, siteQueries]) => {
      const siteName = siteQueries[0].siteName;
      response += `\n${siteName} (Site ${siteId}): ${siteQueries.length} queries\n`;
      siteQueries.forEach(query => {
        response += `  - ${query.id}: ${query.title} | ${query.status}\n`;
      });
    });
    return response;
  }
};

const getTasksBySite = (siteId?: number) => {
  if (siteId) {
    const siteTasks = tasks.filter(t => t.siteId === siteId);
    const siteName = siteTasks.length > 0 ? siteTasks[0].siteName : `Site ${siteId}`;
    
    if (siteTasks.length === 0) {
      return `No tasks found for site ${siteId}.`;
    }
    
    let response = `Tasks for ${siteName} (Site ${siteId}):\n`;
    siteTasks.forEach(task => {
      response += `- ${task.id}: ${task.title} | ${task.priority} priority | ${task.status}\n`;
    });
    return response;
  } else {
    // Group tasks by site
    const siteTaskMap: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (!siteTaskMap[task.siteId]) {
        siteTaskMap[task.siteId] = [];
      }
      siteTaskMap[task.siteId].push(task);
    });
    
    let response = "Tasks by site:\n";
    Object.entries(siteTaskMap).forEach(([siteId, siteTasks]) => {
      const siteName = siteTasks[0].siteName;
      response += `\n${siteName} (Site ${siteId}): ${siteTasks.length} tasks\n`;
      siteTasks.forEach(task => {
        response += `  - ${task.id}: ${task.title} | ${task.status}\n`;
      });
    });
    return response;
  }
};

const getMonitoringMode = () => {
  const { activeMonitoring, scheduledMonitoring, frequency } = currentSettings.monitoring;
  
  if (activeMonitoring) {
    return "Active Monitoring is currently enabled. The system is continuously monitoring site activities, query responses, and data submissions in real-time.";
  } else if (scheduledMonitoring) {
    return `Scheduled Monitoring is currently enabled with ${frequency} frequency.`;
  } else {
    return "No monitoring mode is currently active. Please enable either Active Monitoring or Scheduled Monitoring in Settings.";
  }
};

const getAlertSettings = () => {
  const { emailAlerts, systemAlerts, smsAlerts, escalation } = currentSettings.alerts;
  
  let response = "Current alert settings:\n";
  if (emailAlerts) response += "- Email alerts: Enabled\n";
  else response += "- Email alerts: Disabled\n";
  
  if (systemAlerts) response += "- System alerts: Enabled\n";
  else response += "- System alerts: Disabled\n";
  
  if (smsAlerts) response += "- SMS alerts: Enabled\n";
  else response += "- SMS alerts: Disabled\n";
  
  if (escalation) response += "- Alert escalation: Enabled";
  else response += "- Alert escalation: Disabled";
  
  return response;
};

const getTriggerSettings = () => {
  const { dataRefresh, queryResponses, thresholdViolations, siteActions } = currentSettings.triggers;
  
  let response = "Current trigger settings:\n";
  if (dataRefresh) response += "- Data refresh events: Enabled\n";
  else response += "- Data refresh events: Disabled\n";
  
  if (queryResponses) response += "- Query response events: Enabled\n";
  else response += "- Query response events: Disabled\n";
  
  if (thresholdViolations) response += "- Threshold violations: Enabled\n";
  else response += "- Threshold violations: Disabled\n";
  
  if (siteActions) response += "- Site actions: Enabled";
  else response += "- Site actions: Disabled";
  
  return response;
};

const getRecentActivity = () => {
  // Combine recent events from queries and tasks, sort by date
  const events: {type: string, entity: string, action: string, date: Date}[] = [
    ...queries.flatMap(q => [
      { type: 'Query', entity: q.id, action: 'created', date: q.created },
      ...q.responses.map(r => ({ type: 'Response', entity: q.id, action: `responded by ${r.responder}`, date: r.createdAt }))
    ]),
    ...tasks.flatMap(t => [
      { type: 'Task', entity: t.id, action: 'created', date: t.created },
      ...t.comments.map(c => ({ type: 'Comment', entity: t.id, action: `comment by ${c.commenter}`, date: c.createdAt }))
    ])
  ];
  
  // Sort by date, newest first
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Take only the 5 most recent events
  const recentEvents = events.slice(0, 5);
  
  let response = "Recent activity:\n";
  recentEvents.forEach(event => {
    response += `- ${formatRelativeDate(event.date)}: ${event.type} ${event.entity} ${event.action}\n`;
  });
  
  return response;
};

// Trial health summary
const getTrialHealthSummary = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No health data available for this trial.";
  }
  
  return `Trial Health Summary:
- Overall Health Score: ${trialHealth.overallHealth}/100 (${trialHealth.riskLevel} risk)
- Risk Score: ${trialHealth.riskScore}/100
- Subject Compliance: ${trialHealth.subjectCompliance}%
- Data Quality: ${trialHealth.dataQuality}%
- Protocol Deviations: ${trialHealth.protocolDeviations}
- SAE Reporting: ${trialHealth.saeReporting}%
- Query Response Rate: ${trialHealth.queryResponseRate}%
- Avg. Query Response Time: ${trialHealth.avgQueryResponseTime} days
- Trend: ${trialHealth.trendsDirection}

The trial has ${trialHealth.sites.length} active sites with a total of ${trialHealth.sites.reduce((sum, site) => sum + site.subjectCount, 0)} subjects.
${trialHealth.riskLevel === 'high' ? 'This trial requires immediate attention.' : trialHealth.riskLevel === 'medium' ? 'This trial needs closer monitoring.' : 'This trial is performing well with low risk.'} `;
};

// DB Lock compliance report
const getDBLockComplianceReport = (trialId: number, siteId?: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No DB Lock compliance data available for this trial.";
  }
  
  if (!trialHealth.dbLockCompliance) {
    return "DB Lock compliance tracking is not active for this trial.";
  }
  
  const dbLock = trialHealth.dbLockCompliance;
  
  if (siteId) {
    // Get specific site details
    const site = trialHealth.sites.find(s => s.siteId === siteId);
    if (!site) {
      return `No data available for site ${siteId}.`;
    }
    
    if (!site.dbLockStatus) {
      return `DB Lock status not available for site ${siteId}.`;
    }
    
    return `DB Lock Status - ${site.siteName} (ID: ${site.siteId}):
- Current Status: ${site.dbLockStatus.toUpperCase()}
- Outstanding Issues: ${site.outstandingLockIssues || 0}
- Last Updated: ${formatDate(site.lastMonitored)}

${site.dbLockStatus === 'complete' ? 'This site has completed DB Lock requirements.' : 
  site.dbLockStatus === 'ready' ? 'This site is ready for DB Lock review.' : 
  site.dbLockStatus === 'in_progress' ? 'This site is actively working on DB Lock requirements.' : 
  'This site has not started DB Lock preparations.'}`;
  } else {
    // Overall trial DB Lock status
    let response = `DB Lock Compliance Summary for Trial:
- Status: ${dbLock.status.toUpperCase()}
- Overall Readiness: ${dbLock.readiness}%
- Outstanding Issues: ${dbLock.outstandingIssues}
- Estimated Lock Date: ${formatDate(dbLock.estimatedLockDate)}

Progress Breakdown:
- Data Entry Complete: ${dbLock.dataEntryComplete}%
- Query Resolution: ${dbLock.queryResolution}%
- Medical Review: ${dbLock.medicalReview}%
- SDV Complete: ${dbLock.sdvComplete}%
- Ready for Export: ${dbLock.readyForExport ? 'Yes' : 'No'}

Site Breakdown:`;

    // Sort sites by DB Lock status (pending first)
    const sortedSites = [...trialHealth.sites].filter(s => s.dbLockStatus).sort((a, b) => {
      const statusOrder = { pending: 0, in_progress: 1, ready: 2, complete: 3 };
      return statusOrder[a.dbLockStatus] - statusOrder[b.dbLockStatus];
    });
    
    sortedSites.forEach(site => {
      response += `\n- ${site.siteName}: ${site.dbLockStatus.toUpperCase()} (${site.outstandingLockIssues} issues)`;
    });
    
    return response;
  }
};

// Site performance summary
const getSitePerformanceSummary = (trialId: number, siteId?: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No health data available for this trial.";
  }
  
  if (siteId) {
    // Get specific site details
    const site = trialHealth.sites.find(s => s.siteId === siteId);
    if (!site) {
      return `No data available for site ${siteId}.`;
    }
    
    const lastMonitoredDate = formatDate(site.lastMonitored);
    
    return `Site Performance - ${site.siteName} (ID: ${site.siteId}):
- Status: ${site.status.toUpperCase()}
- Performance Score: ${site.performanceScore}/100
- Risk Level: ${site.riskLevel.toUpperCase()}
- Subject Count: ${site.subjectCount}
- Open Queries: ${site.openQueries}
- Open Tasks: ${site.openTasks}
- Last Monitored: ${lastMonitoredDate}

${site.riskLevel === 'high' ? 'This site requires immediate attention and intervention.' : site.riskLevel === 'medium' ? 'This site needs closer monitoring and follow-up actions.' : 'This site is performing well with good compliance.'} `;
  } else {
    // Summarize all sites
    let response = "Site Performance Summary:\n";
    
    // Sort sites by risk level (high first)
    const sortedSites = [...trialHealth.sites].sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
    
    sortedSites.forEach(site => {
      response += `- ${site.siteName} (ID: ${site.siteId}): ${site.performanceScore}/100 | ${site.riskLevel.toUpperCase()} risk | ${site.subjectCount} subjects | ${site.openQueries + site.openTasks} open issues\n`;
    });
    
    // Add risk breakdown
    const highRiskCount = sortedSites.filter(s => s.riskLevel === 'high').length;
    const mediumRiskCount = sortedSites.filter(s => s.riskLevel === 'medium').length;
    
    response += `\nRisk Breakdown: ${highRiskCount} high risk, ${mediumRiskCount} medium risk, ${sortedSites.length - highRiskCount - mediumRiskCount} low risk sites.`;
    
    return response;
  }
};

// Get study compliance details
const getComplianceDetails = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No compliance data available for this trial.";
  }
  
  let response = `Compliance Metrics for ${trialId === 1 ? 'Diabetes Type 2' : trialId === 2 ? 'Rheumatoid Arthritis' : trialId === 3 ? 'Advanced Breast Cancer' : 'Alzheimer\'s Disease'} Study:
- Overall Compliance: ${trialHealth.subjectCompliance}%
- Protocol Deviations: ${trialHealth.protocolDeviations}
- SAE Reporting Compliance: ${trialHealth.saeReporting}%
- Query Response Rate: ${trialHealth.queryResponseRate}%
- Data Quality Score: ${trialHealth.dataQuality}%
`;

  // Add recommendations based on compliance metrics
  response += "\nRecommendations:\n";
  
  if (trialHealth.protocolDeviations > 10) {
    response += "- Conduct protocol retraining at all sites to reduce protocol deviations\n";
  }
  
  if (trialHealth.saeReporting < 90) {
    response += "- Implement SAE reporting reminder system\n";
  }
  
  if (trialHealth.queryResponseRate < 70) {
    response += "- Follow up with sites on outstanding queries\n";
  }
  
  if (trialHealth.dataQuality < 80) {
    response += "- Schedule data quality review meeting with DM team\n";
  }
  
  return response;
};

// Get monitoring recommendations
const getMonitoringRecommendations = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No data available to make recommendations.";
  }
  
  let recommendations = "Monitoring Recommendations:\n";
  
  // Add general recommendations based on trial risk
  if (trialHealth.riskLevel === 'high') {
    recommendations += "- Increase monitoring frequency to weekly\n";
    recommendations += "- Schedule urgent review meeting with study team\n";
    recommendations += "- Initiate quality improvement plan\n";
  } else if (trialHealth.riskLevel === 'medium') {
    recommendations += "- Maintain bi-weekly monitoring schedule\n";
    recommendations += "- Focus on addressing protocol deviations\n";
  } else {
    recommendations += "- Continue monthly monitoring routine\n";
    recommendations += "- Maintain current oversight activities\n";
  }
  
  // Site-specific recommendations
  const highRiskSites = trialHealth.sites.filter(s => s.riskLevel === 'high');
  if (highRiskSites.length > 0) {
    recommendations += "\nHigh-Risk Sites that need immediate attention:\n";
    highRiskSites.forEach(site => {
      recommendations += `- ${site.siteName}: Schedule on-site visit, review ${site.openQueries} open queries and ${site.openTasks} outstanding tasks\n`;
    });
  }
  
  // Query management recommendations
  if (trialHealth.avgQueryResponseTime > 5) {
    recommendations += "\nQuery Management:\n";
    recommendations += "- Implement query escalation process for responses taking > 5 days\n";
    recommendations += "- Conduct query management training with sites\n";
  }
  
  return recommendations;
};

// Action handling functions
const createNewQuery = (queryText: string, trialId: number, siteId?: number) => {
  // Extract query title if provided
  let queryTitle = "Data verification request";
  const titleMatch = queryText.match(/title[:\s]+([^,\.]+)/i);
  if (titleMatch && titleMatch[1]) {
    queryTitle = titleMatch[1].trim();
  }
  
  // Extract priority if provided
  let priority = "Medium";
  if (queryText.includes("critical")) priority = "Critical";
  else if (queryText.includes("high")) priority = "High";
  else if (queryText.includes("low")) priority = "Low";
  
  // Extract domain if provided
  let domain = "General";
  if (queryText.includes("demographics")) domain = "Demographics";
  else if (queryText.includes("adverse") || queryText.includes("ae")) domain = "Adverse Events";
  else if (queryText.includes("lab") || queryText.includes("laboratory")) domain = "Laboratory";
  else if (queryText.includes("concomitant") || queryText.includes("medication")) domain = "Concomitant Medications";
  
  // Generate a random query ID
  const queryId = `Q-${Math.floor(Math.random() * 900) + 100}`;
  
  return `✅ New query created successfully!\n\nQuery ID: ${queryId}\nTitle: ${queryTitle}\nPriority: ${priority}\nTrial: ${trialId}\nSite: ${siteId || 'All Sites'}\nDomain: ${domain}\nStatus: Open\n\nThe query has been sent to the site for resolution.`;
};

const assignQuery = (queryText: string, trialId: number) => {
  // Extract query ID if provided
  const queryIdMatch = queryText.match(/Q-\d{3}/i);
  const queryId = queryIdMatch ? queryIdMatch[0] : `Q-${Math.floor(Math.random() * 900) + 100}`;
  
  // Extract assignee if provided
  let assignee = "Site Monitor";
  const assigneeMatch = queryText.match(/to[:\s]+([^,\.]+)/i);
  if (assigneeMatch && assigneeMatch[1]) {
    assignee = assigneeMatch[1].trim();
  }
  
  return `✅ Query ${queryId} has been assigned to ${assignee}.\n\nA notification has been sent to the assignee, and the query status has been updated to "Assigned" in the Queries tab.`;
};

const sendNotification = (queryText: string, trialId: number) => {
  // Extract recipient if provided
  let recipient = "Site Staff";
  const recipientMatch = queryText.match(/to[:\s]+([^,\.]+)/i);
  if (recipientMatch && recipientMatch[1]) {
    recipient = recipientMatch[1].trim();
  }
  
  // Extract message if provided
  let message = "Please review and respond to the pending queries";
  const messageMatch = queryText.match(/message[:\s]+([^,\.]+)/i);
  if (messageMatch && messageMatch[1]) {
    message = messageMatch[1].trim();
  }
  
  return `✅ Notification sent successfully to ${recipient}:\n\n"${message}"\n\nThe notification has been logged and a follow-up reminder will be sent if no response is received within 48 hours.`;
};

const createSignal = (queryText: string, trialId: number) => {
  // Extract signal type if provided
  let signalType = "Data Quality";
  if (queryText.includes("safety")) signalType = "Safety";
  else if (queryText.includes("operational")) signalType = "Operational";
  else if (queryText.includes("protocol")) signalType = "Protocol Deviation";
  
  // Extract signal title if provided
  let signalTitle = `${signalType} Signal`;
  const titleMatch = queryText.match(/title[:\s]+([^,\.]+)/i);
  if (titleMatch && titleMatch[1]) {
    signalTitle = titleMatch[1].trim();
  }
  
  // Extract priority if provided
  let priority = "Medium";
  if (queryText.includes("critical")) priority = "Critical";
  else if (queryText.includes("high")) priority = "High";
  else if (queryText.includes("low")) priority = "Low";
  
  // Generate a random signal ID
  const detectionId = `SD-${Math.floor(Math.random() * 900) + 100}`;
  
  return `✅ New signal detected and recorded!\n\nSignal ID: ${detectionId}\nTitle: ${signalTitle}\nType: ${signalType}\nPriority: ${priority}\nTrial: ${trialId}\nStatus: New\n\nThe signal has been added to the Signal Detection tab. Tasks will be automatically created for follow-up actions.`;
};

// View signal details function
const viewSignalDetails = (signalId: string, trialId: number): string => {
  return `Signal Details for ${signalId}:
  
ID: ${signalId}
Trial: Trial #${trialId}
Status: Open
Priority: High
Detection Date: ${new Date().toLocaleDateString()}
Due Date: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
  
Observation: Protocol deviation detected in dosing schedule for Subject 1023. Subject received medication outside the protocol-specified window.
  
Signal Type: Protocol Deviation
Detection Method: Central Monitoring
Data Reference: Subject 1023, Visit 4
  
Recommendations:
- Review medication administration logs for all subjects at Site 3
- Update site training materials for dosing schedules
- Create query for site staff regarding compliance with protocol timing

Actions:
1. Type "create task: <task description>" to create a task from this signal
2. Type "notify: <role>" to notify specific team members
3. Type "change status: under_review" to update signal status

Would you like to perform any actions related to this signal?`;
};

// View query details function
const viewQueryDetails = (queryId: string, trialId: number): string => {
  return `Query Details for ${queryId}:
  
ID: ${queryId}
Trial: Trial #${trialId}
Status: Open
Priority: Medium
Creation Date: ${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
Due Date: ${new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()}
  
Query Description: Please verify demographics data for Subject 1045. Date of birth appears inconsistent with screening criteria.
  
Assigned To: Site Monitor
Created By: CentralMonitor.AI
Site: London Medical Center (Site 3)
  
Comments:
- [${new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}] Query created by CentralMonitor.AI
- [${new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}] Assigned to Site Monitor

Actions:
1. Type "add comment: <your comment>" to add a comment
2. Type "change status: in_progress" to update status
3. Type "assign to: <role>" to reassign the query

Would you like to perform any actions on this query?`;
};

const getBotResponse = (query: string, context: { trialName?: string; trialId?: number; siteName?: string; siteId?: number }) => {
  // Convert query to lowercase for easier matching
  const lcQuery = query.toLowerCase();
  const trialId = context.trialId || 1; // Default to first trial if not specified
  
  // Greetings
  if (lcQuery.includes('hello') || lcQuery.includes('hi') || lcQuery.includes('hey') || lcQuery.includes('greetings')) {
    return `Hello! I'm your Central Monitor AI assistant. How can I help you with central monitoring activities${context.trialName ? ` for ${context.trialName}` : ''}${context.siteName ? ` at ${context.siteName}` : ''}?`;
  }
  
  // Action handling
  if (lcQuery.includes('create') && lcQuery.includes('query')) {
    return createNewQuery(lcQuery, trialId, context.siteId);
  }
  
  if (lcQuery.includes('assign') && lcQuery.includes('query')) {
    return assignQuery(lcQuery, trialId);
  }
  
  if (lcQuery.includes('send') && lcQuery.includes('notification')) {
    return sendNotification(lcQuery, trialId);
  }
  
  if (lcQuery.includes('signal') && (lcQuery.includes('create') || lcQuery.includes('detect'))) {
    return createSignal(lcQuery, trialId);
  }
  
  // Trial health summaries
  if ((lcQuery.includes('trial') || lcQuery.includes('study')) && 
      (lcQuery.includes('health') || lcQuery.includes('status') || lcQuery.includes('summary'))) {
    return getTrialHealthSummary(trialId);
  }
  
  if (lcQuery.includes('site') && 
      (lcQuery.includes('performance') || lcQuery.includes('health') || lcQuery.includes('status') || lcQuery.includes('summary'))) {
    const siteIdMatch = lcQuery.match(/site (\d+)/);
    if (siteIdMatch) {
      return getSitePerformanceSummary(trialId, parseInt(siteIdMatch[1]));
    } else if (context.siteId) {
      return getSitePerformanceSummary(trialId, context.siteId);
    } else {
      return getSitePerformanceSummary(trialId);
    }
  }
  
  // DB Lock compliance
  if (lcQuery.includes('db lock') || lcQuery.includes('dblock') || lcQuery.includes('lock status')) {
    const siteIdMatch = lcQuery.match(/site (\d+)/);
    if (siteIdMatch) {
      return getDBLockComplianceReport(trialId, parseInt(siteIdMatch[1]));
    } else if (context.siteId) {
      return getDBLockComplianceReport(trialId, context.siteId);
    } else {
      return getDBLockComplianceReport(trialId);
    }
  }

  if (lcQuery.includes('compliance') || lcQuery.includes('protocol') || lcQuery.includes('adherence')) {
    return getComplianceDetails(trialId);
  }
  
  if (lcQuery.includes('recommend') || lcQuery.includes('suggestion') || lcQuery.includes('advice')) {
    return getMonitoringRecommendations(trialId);
  }
  
  // Query status and counts
  if ((lcQuery.includes('how many') || lcQuery.includes('count')) && lcQuery.includes('quer')) {
    return `There are currently ${getOpenQueriesCount()} open queries that need attention.`;
  }
  
  // Task status and counts
  if ((lcQuery.includes('how many') || lcQuery.includes('count')) && lcQuery.includes('task')) {
    if (lcQuery.includes('overdue')) {
      return `There are ${getOverdueTasksCount()} overdue tasks that require immediate attention.`;
    } else {
      return `There are ${getPendingTasksCount()} pending tasks that need to be completed.`;
    }
  }
  
  // Query details by ID
  const queryIdMatch = lcQuery.match(/q-\d{3}/);
  if (queryIdMatch) {
    return getQueryDetails(queryIdMatch[0]);
  }
  
  // Task details by ID
  const taskIdMatch = lcQuery.match(/t-\d{3}/);
  if (taskIdMatch) {
    return getTaskDetails(taskIdMatch[0]);
  }
  
  // Queries by site
  if (lcQuery.includes('quer') && (lcQuery.includes('site') || lcQuery.includes('center') || lcQuery.includes('hospital'))) {
    // Check if a specific site ID is mentioned
    const siteIdMatch = lcQuery.match(/site (\d+)/);
    if (siteIdMatch) {
      return getQueriesBySite(parseInt(siteIdMatch[1]));
    } else if (context.siteId) {
      return getQueriesBySite(context.siteId);
    } else {
      return getQueriesBySite();
    }
  }
  
  // Tasks by site
  if (lcQuery.includes('task') && (lcQuery.includes('site') || lcQuery.includes('center') || lcQuery.includes('hospital'))) {
    // Check if a specific site ID is mentioned
    const siteIdMatch = lcQuery.match(/site (\d+)/);
    if (siteIdMatch) {
      return getTasksBySite(parseInt(siteIdMatch[1]));
    } else if (context.siteId) {
      return getTasksBySite(context.siteId);
    } else {
      return getTasksBySite();
    }
  }
  
  // Settings-related queries
  if (lcQuery.includes('settings') || lcQuery.includes('configuration') || lcQuery.includes('configure') || lcQuery.includes('setup')) {
    return 'Central Monitor.AI settings include monitoring mode, alert configurations, and event triggers. You can adjust these in the Settings tab.';
  }
  
  // Monitoring mode
  if (lcQuery.includes('monitoring') || lcQuery.includes('active monitoring') || lcQuery.includes('schedule')) {
    return getMonitoringMode();
  }
  
  // Alert settings
  if (lcQuery.includes('alert') || lcQuery.includes('notification') || lcQuery.includes('email') || lcQuery.includes('sms')) {
    return getAlertSettings();
  }
  
  // Trigger settings
  if (lcQuery.includes('trigger') || lcQuery.includes('event') || lcQuery.includes('action')) {
    return getTriggerSettings();
  }
  
  // Recent activity
  if (lcQuery.includes('recent') || lcQuery.includes('activity') || lcQuery.includes('last') || lcQuery.includes('latest')) {
    return getRecentActivity();
  }
  
  // Create query
  if ((lcQuery.includes('create') || lcQuery.includes('new') || lcQuery.includes('add')) && lcQuery.includes('query')) {
    return "To create a new query, go to the Queries tab and click the 'Create Query' button. Fill in the details including site, subject, priority, and description, then assign it to the appropriate person.";
  }
  
  // Create task
  if ((lcQuery.includes('create') || lcQuery.includes('new') || lcQuery.includes('add')) && lcQuery.includes('task')) {
    return "To create a new task, go to the Tasks tab and click the 'Create Task' button. Define the task details, priority, due date, and assign it to a team member.";
  }
  
  // Dashboard 
  if (lcQuery.includes('dashboard') || lcQuery.includes('overview') || lcQuery.includes('summary')) {
    const trialHealth = trialHealthData[trialId];
    return `Dashboard Summary for ${context.trialName || 'Current Trial'}:
- Health Score: ${trialHealth ? trialHealth.overallHealth : 'N/A'}/100 (${trialHealth ? trialHealth.riskLevel.toUpperCase() : 'N/A'} risk)
- Open Queries: ${getOpenQueriesCount()}
- Pending Tasks: ${getPendingTasksCount()}
- Overdue Tasks: ${getOverdueTasksCount()}
- Monitoring Mode: ${currentSettings.monitoring.activeMonitoring ? 'Active' : 'Scheduled'}
- Risk Trend: ${trialHealth ? trialHealth.trendsDirection : 'N/A'}
- Recent Activity: ${queries.filter(q => q.responses.length > 0).length} query responses in the last 7 days`;
  }
  
  // Default response if no keywords match
  return `I understand you're asking about "${query}". For specific central monitoring questions, try asking about:
- Trial health summary
- Site performance overview
- Compliance metrics
- What are your recommendations?
- How many open queries are there?
- Tell me about query Q-001
- What monitoring mode is active?
- Show recent activity`;
};

export function CentralMonitorBot({ 
  trialName, 
  trialId, 
  siteName, 
  siteId, 
  isAgentMode, 
  setIsAgentMode 
}: CentralMonitorBotProps) {
  const [isOpen, setIsOpen] = useState(true); // Set to true to make it visible by default
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your Central Monitor AI assistant. How can I help you with central monitoring activities${trialName ? ` for ${trialName}` : ''}${siteName ? ` at ${siteName}` : ''}?

You can ask me about:
• Trial health summary
• Site performance overview
• Compliance metrics
• What are your recommendations?
• How many open queries are there?
• Tell me about query Q-001`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Check for task/query commands
    const lcMessage = userMessage.content.toLowerCase();
    const isTaskOrQueryCommand = (lcMessage.includes('task') || lcMessage.includes('query')) && 
      (lcMessage.includes('assign') || lcMessage.includes('create') || lcMessage.includes('close'));

    // Default to agent mode if not specified
    const currentAgentMode = isAgentMode !== undefined ? isAgentMode : true;

    if (isTaskOrQueryCommand && !currentAgentMode) {
      // Human-in-loop mode for task & query management
      const humanModeMessage: Message = {
        role: 'assistant',
        content: 'Human-in-loop mode: This query/task operation requires manual review. A notification has been sent to the appropriate team member for action.',
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, humanModeMessage]);
      }, 800);
    } else {
      // Agent mode or non-task/query commands
      setTimeout(() => {
        const botResponse = getBotResponse(userMessage.content, { trialName, trialId, siteName, siteId });
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: botResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
      }, 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg fixed bottom-6 right-6 flex items-center justify-center" 
              onClick={() => setIsOpen(true)}
            >
              <Eye className="h-6 w-6 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Chat with Central Monitor AI</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 shadow-lg transition-all duration-200 bg-white",
      isMinimized ? "w-72 h-14" : "w-80 md:w-96 h-[450px]"
    )}>
      <div className="bg-blue-600 text-white p-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span className="font-medium">Central Monitor Assistant</span>
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMinimize} 
            className="h-7 w-7 text-white hover:bg-blue-700"
          >
            {isMinimized ? <Maximize className="h-4 w-4" /> : <Minimize className="h-4 w-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)} 
            className="h-7 w-7 text-white hover:bg-blue-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          <CardContent className="p-0 flex flex-col h-[calc(450px-56px)]">
            {/* Action Buttons */}
            <div className="p-2 bg-gray-50 border-b flex flex-wrap gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for query creation with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please provide details for the new query:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create a form message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: createNewQuery("Create query title: Demographics verification priority: Medium", trialId || 1, siteId),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                Create Query
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for query assignment with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please provide query assignment details:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create an assignment message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: assignQuery("Assign query Q-101 to Site Monitor", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                Assign Query
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for viewing a query with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please enter the Query ID you wish to view:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create a view message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: viewQueryDetails("Q-101", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                View Query
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for notification with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please provide notification details:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Send a notification
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: sendNotification("Send notification to Site Staff message: Please respond to pending queries", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                Send Notification
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for signal creation with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please provide signal detection details:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create a signal
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: createSignal("Create signal title: Protocol deviation in dosing priority: High", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                Detect Signal
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for viewing a signal with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please enter the Signal ID you wish to view:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create a view signal message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: viewSignalDetails("SIG-101", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                View Signal
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-start gap-2.5",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        <Eye className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={cn(
                      "max-w-[75%] rounded-lg p-3",
                      message.role === 'user' 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-800"
                    )}
                  >
                    <p className="text-sm whitespace-pre-line">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t space-y-2">
              {/* Task/Query Assignment Toggle */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Query/Task Assignment Mode:</span>
                  <span className="text-xs">{isAgentMode !== undefined ? (isAgentMode ? 'Agent.AI' : 'Human-in-Loop') : 'Agent.AI'}</span>
                </div>
                <div
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                    isAgentMode !== undefined ? (isAgentMode ? 'bg-blue-600' : 'bg-gray-300') : 'bg-blue-600'
                  }`}
                  onClick={() => {
                    if (setIsAgentMode) {
                      setIsAgentMode(!(isAgentMode !== undefined ? isAgentMode : true));
                    }
                  }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      isAgentMode !== undefined ? (isAgentMode ? 'translate-x-5' : 'translate-x-1') : 'translate-x-5'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about queries, tasks, monitoring..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={inputValue.trim() === ''}
                  size="icon"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      )}
    </Card>
  );
}