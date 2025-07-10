import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Send, X, Minimize, Maximize, Bot } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DataQualityIssue {
  id: string;
  type: 'missing_data' | 'inconsistent_data' | 'out_of_range' | 'format_error' | 'duplicate' | 'specification_violation';
  issueCategory: 'DQ' | 'Reconciliation';
  title: string;
  description: string;
  status: 'detected' | 'reviewing' | 'resolving' | 'resolved' | 'closed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  trialId: number;
  domain: string;
}

interface DataManagerSettings {
  monitoring: {
    activeMonitoring: boolean;
    scheduledMonitoring: boolean;
    frequency: string;
    priority: string;
  };
  compliance: {
    protocolAdherence: boolean;
    auditTrailMonitoring: boolean;
    protocolDeviationDetection: boolean;
    regulatoryStandardAlerts: boolean;
  };
  reconciliation: {
    subjectMatching: boolean;
    demographicsMatching: boolean;
    advEMedicalHistoryMatching: boolean;
    labValueMatching: boolean;
  };
  dataQuality: {
    missingData: boolean;
    outOfRange: boolean;
    invalidFormats: boolean;
    dataConsistency: boolean;
    crossFormValidation: boolean;
  };
}

interface DataManagerBotProps {
  trialName?: string;
  trialId?: number;
  isAgentMode?: boolean;
  setIsAgentMode?: (value: boolean) => void;
}

// Simulated data quality issues for demo purposes
const dqIssues: DataQualityIssue[] = [
  {
    id: "DQ-001",
    type: "missing_data",
    issueCategory: "DQ",
    title: "Missing Vital Signs",
    description: "12 subjects are missing vital signs data for Week 4 visit",
    status: "reviewing",
    severity: "high",
    trialId: 1,
    domain: "VS"
  },
  {
    id: "DQ-002",
    type: "out_of_range",
    issueCategory: "DQ",
    title: "ALT values out of range",
    description: "5 subjects have ALT values significantly above the normal range",
    status: "resolving",
    severity: "critical",
    trialId: 1,
    domain: "LB"
  },
  {
    id: "DQ-003",
    type: "inconsistent_data",
    issueCategory: "Reconciliation",
    title: "Visit dates inconsistent",
    description: "Visit dates in EDC don't match the dates in external lab data",
    status: "detected",
    severity: "medium",
    trialId: 1,
    domain: "SV"
  },
  {
    id: "DQ-004",
    type: "specification_violation",
    issueCategory: "DQ",
    title: "Protocol violation",
    description: "Subject enrolled outside inclusion criteria age range",
    status: "resolved",
    severity: "high",
    trialId: 1,
    domain: "DM"
  },
  {
    id: "DQ-005",
    type: "duplicate",
    issueCategory: "DQ",
    title: "Duplicate lab records",
    description: "Multiple lab entries found for same subject on same date",
    status: "closed",
    severity: "low",
    trialId: 1,
    domain: "LB"
  },
  {
    id: "DQ-006",
    type: "format_error",
    issueCategory: "DQ",
    title: "Invalid date format",
    description: "Dates in non-standard format detected in imported data",
    status: "detected",
    severity: "low",
    trialId: 1,
    domain: "SUPPDM"
  },
  {
    id: "DQ-007",
    type: "inconsistent_data",
    issueCategory: "Reconciliation",
    title: "MedDRA coding inconsistency",
    description: "AE terms have inconsistent coding between EDC and safety database",
    status: "reviewing",
    severity: "medium",
    trialId: 1,
    domain: "AE"
  }
];

// Trial health metrics
interface TrialHealthMetrics {
  dqScore: number; // 0-100
  reconciliationScore: number; // 0-100
  complianceScore: number; // 0-100
  dataCompleteness: number; // 0-100
  queryResolutionRate: number; // 0-100
  overallHealth: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  trendsDirection: 'improving' | 'stable' | 'declining';
  dataSources: {
    name: string;
    status: 'active' | 'pending' | 'error';
    recordCount: number;
    lastUpdate: Date;
    dqIssues: number;
  }[];
  domains: {
    name: string;
    recordCount: number;
    issueCount: number;
    completeness: number;
  }[];
}

// Define trial health for each trial
const trialHealthData: Record<number, TrialHealthMetrics> = {
  1: { // Diabetes Type 2 study
    dqScore: 87,
    reconciliationScore: 92,
    complianceScore: 95,
    dataCompleteness: 89,
    queryResolutionRate: 78,
    overallHealth: 88,
    riskLevel: 'low',
    trendsDirection: 'improving',
    dataSources: [
      { name: 'EDC', status: 'active', recordCount: 1243, lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), dqIssues: 5 },
      { name: 'CTMS', status: 'active', recordCount: 842, lastUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), dqIssues: 2 },
      { name: 'Labs', status: 'active', recordCount: 3127, lastUpdate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), dqIssues: 8 }
    ],
    domains: [
      { name: 'DM', recordCount: 156, issueCount: 2, completeness: 98 },
      { name: 'VS', recordCount: 842, issueCount: 5, completeness: 93 },
      { name: 'LB', recordCount: 3127, issueCount: 7, completeness: 91 },
      { name: 'AE', recordCount: 68, issueCount: 1, completeness: 94 }
    ]
  },
  2: { // Rheumatoid Arthritis study
    dqScore: 76,
    reconciliationScore: 82,
    complianceScore: 88,
    dataCompleteness: 79,
    queryResolutionRate: 65,
    overallHealth: 78,
    riskLevel: 'medium',
    trendsDirection: 'stable',
    dataSources: [
      { name: 'EDC', status: 'active', recordCount: 876, lastUpdate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), dqIssues: 12 },
      { name: 'CTMS', status: 'active', recordCount: 542, lastUpdate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), dqIssues: 4 },
      { name: 'Labs', status: 'active', recordCount: 1876, lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), dqIssues: 15 }
    ],
    domains: [
      { name: 'DM', recordCount: 98, issueCount: 4, completeness: 91 },
      { name: 'VS', recordCount: 542, issueCount: 8, completeness: 86 },
      { name: 'LB', recordCount: 1876, issueCount: 14, completeness: 83 },
      { name: 'AE', recordCount: 127, issueCount: 5, completeness: 88 }
    ]
  },
  3: { // Advanced Breast Cancer study
    dqScore: 65,
    reconciliationScore: 72,
    complianceScore: 81,
    dataCompleteness: 68,
    queryResolutionRate: 58,
    overallHealth: 69,
    riskLevel: 'high',
    trendsDirection: 'declining',
    dataSources: [
      { name: 'EDC', status: 'active', recordCount: 623, lastUpdate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), dqIssues: 18 },
      { name: 'CTMS', status: 'active', recordCount: 317, lastUpdate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), dqIssues: 7 },
      { name: 'Labs', status: 'error', recordCount: 1254, lastUpdate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), dqIssues: 24 }
    ],
    domains: [
      { name: 'DM', recordCount: 72, issueCount: 7, completeness: 82 },
      { name: 'VS', recordCount: 317, issueCount: 12, completeness: 76 },
      { name: 'LB', recordCount: 1254, issueCount: 21, completeness: 64 },
      { name: 'AE', recordCount: 205, issueCount: 16, completeness: 71 }
    ]
  },
  4: { // Alzheimer's Disease study
    dqScore: 81,
    reconciliationScore: 85,
    complianceScore: 92,
    dataCompleteness: 84,
    queryResolutionRate: 71,
    overallHealth: 83,
    riskLevel: 'low',
    trendsDirection: 'improving',
    dataSources: [
      { name: 'EDC', status: 'active', recordCount: 927, lastUpdate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), dqIssues: 9 },
      { name: 'CTMS', status: 'active', recordCount: 652, lastUpdate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), dqIssues: 5 },
      { name: 'Labs', status: 'active', recordCount: 2463, lastUpdate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), dqIssues: 11 }
    ],
    domains: [
      { name: 'DM', recordCount: 118, issueCount: 3, completeness: 95 },
      { name: 'VS', recordCount: 652, issueCount: 6, completeness: 89 },
      { name: 'LB', recordCount: 2463, issueCount: 9, completeness: 87 },
      { name: 'AE', recordCount: 94, issueCount: 4, completeness: 90 }
    ]
  }
};

// Current system settings
const currentSettings: DataManagerSettings = {
  monitoring: {
    activeMonitoring: true,
    scheduledMonitoring: false,
    frequency: "daily",
    priority: "medium"
  },
  compliance: {
    protocolAdherence: true,
    auditTrailMonitoring: false,
    protocolDeviationDetection: true,
    regulatoryStandardAlerts: true
  },
  reconciliation: {
    subjectMatching: true,
    demographicsMatching: true,
    advEMedicalHistoryMatching: true,
    labValueMatching: true
  },
  dataQuality: {
    missingData: true,
    outOfRange: true,
    invalidFormats: true,
    dataConsistency: true,
    crossFormValidation: true
  }
};

const formatDate = (daysAgo: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString();
};

const getOpenIssuesCount = () => {
  return dqIssues.filter(issue => issue.status !== 'closed' && issue.status !== 'resolved').length;
};

const getIssuesByDomain = () => {
  const domains: Record<string, number> = {};
  dqIssues.forEach(issue => {
    domains[issue.domain] = (domains[issue.domain] || 0) + 1;
  });
  
  let response = "Issues by domain:\n";
  Object.entries(domains).forEach(([domain, count]) => {
    response += `- ${domain}: ${count} issue${count !== 1 ? 's' : ''}\n`;
  });
  return response;
};

const getIssuesByCategory = () => {
  const dqCount = dqIssues.filter(issue => issue.issueCategory === 'DQ').length;
  const reconciliationCount = dqIssues.filter(issue => issue.issueCategory === 'Reconciliation').length;
  
  return `There are ${dqCount} data quality issues and ${reconciliationCount} reconciliation issues.`;
};

const getIssuesBySeverity = () => {
  const severityCounts: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  dqIssues.forEach(issue => {
    severityCounts[issue.severity] += 1;
  });
  
  return `Issue severity breakdown:
- Critical: ${severityCounts.critical}
- High: ${severityCounts.high}
- Medium: ${severityCounts.medium}
- Low: ${severityCounts.low}`;
};

const getEnabledChecks = () => {
  const { dataQuality, reconciliation, compliance } = currentSettings;
  
  let enabledChecks = "Currently enabled checks:\n";
  
  enabledChecks += "\nData Quality Checks:\n";
  if (dataQuality.missingData) enabledChecks += "- Missing Data Detection\n";
  if (dataQuality.outOfRange) enabledChecks += "- Out-of-Range Values\n";
  if (dataQuality.invalidFormats) enabledChecks += "- Invalid Format Detection\n";
  if (dataQuality.dataConsistency) enabledChecks += "- Data Consistency\n";
  if (dataQuality.crossFormValidation) enabledChecks += "- Cross-Form Validation\n";
  
  enabledChecks += "\nReconciliation Checks:\n";
  if (reconciliation.subjectMatching) enabledChecks += "- Subject Matching\n";
  if (reconciliation.demographicsMatching) enabledChecks += "- Demographics Matching\n";
  if (reconciliation.advEMedicalHistoryMatching) enabledChecks += "- AE vs Medical History Matching\n";
  if (reconciliation.labValueMatching) enabledChecks += "- Lab Value Matching\n";
  
  enabledChecks += "\nCompliance Checks:\n";
  if (compliance.protocolAdherence) enabledChecks += "- Protocol Adherence\n";
  if (compliance.auditTrailMonitoring) enabledChecks += "- Audit Trail Monitoring\n";
  if (compliance.protocolDeviationDetection) enabledChecks += "- Protocol Deviation Detection\n";
  if (compliance.regulatoryStandardAlerts) enabledChecks += "- Regulatory Standard Alerts\n";
  
  return enabledChecks;
};

const getMonitoringMode = () => {
  const { activeMonitoring, scheduledMonitoring, frequency } = currentSettings.monitoring;
  
  if (activeMonitoring) {
    return "Active Monitoring is currently enabled. The system is continuously monitoring data refresh events and query responses in real-time.";
  } else if (scheduledMonitoring) {
    return `Scheduled Monitoring is currently enabled with ${frequency} frequency.`;
  } else {
    return "No monitoring mode is currently active. Please enable either Active Monitoring or Scheduled Monitoring in Settings.";
  }
};

const getRecentActivity = () => {
  return `Recent activity:
- ${formatDate(0)}: Run DQ and Reconciliation (7 issues found)
- ${formatDate(2)}: Data refresh from EDC (25 records updated)
- ${formatDate(3)}: Lab data import (142 records added)
- ${formatDate(5)}: Protocol amendment processed`;
};

const getIssueDetail = (issueId: string) => {
  const issue = dqIssues.find(issue => issue.id.toLowerCase() === issueId.toLowerCase());
  
  if (!issue) {
    return `No issue found with ID ${issueId}. Please check the issue ID and try again.`;
  }
  
  return `Issue ${issue.id}: ${issue.title}
- Type: ${issue.type.replace('_', ' ')}
- Category: ${issue.issueCategory}
- Severity: ${issue.severity}
- Status: ${issue.status}
- Domain: ${issue.domain}
- Description: ${issue.description}`;
};

// Action handling functions
const performDataQualityChecks = (trialId: number) => {
  // Simulate running data quality checks
  const issuesFound = Math.floor(Math.random() * 10) + 1;
  const criticalIssues = Math.floor(Math.random() * 3);
  const highIssues = Math.floor(Math.random() * 4);
  const mediumIssues = issuesFound - criticalIssues - highIssues;
  
  return `✅ Data quality checks completed for Trial #${trialId}!\n\nFound ${issuesFound} issues:\n• ${criticalIssues} Critical\n• ${highIssues} High\n• ${mediumIssues} Medium\n\nThe issues have been added to the Issues tab and tasks have been created for the appropriate team members.`;
};

const createNewTask = (query: string, trialId: number) => {
  // Extract task title if provided
  let taskTitle = "Data quality review";
  const titleMatch = query.match(/title[:\s]+([^,\.]+)/i);
  if (titleMatch && titleMatch[1]) {
    taskTitle = titleMatch[1].trim();
  }
  
  // Extract priority if provided
  let priority = "Medium";
  if (query.includes("critical")) priority = "Critical";
  else if (query.includes("high")) priority = "High";
  else if (query.includes("low")) priority = "Low";
  
  // Generate a random task ID
  const taskId = `DQ-${Math.floor(Math.random() * 900) + 100}`;
  
  return `✅ New task created successfully!\n\nTask ID: ${taskId}\nTitle: ${taskTitle}\nPriority: ${priority}\nTrial: ${trialId}\nStatus: Open\n\nThe task has been added to the Tasks tab and assigned to the data management team.`;
};

const assignTask = (query: string, trialId: number) => {
  // Extract task ID if provided
  const taskIdMatch = query.match(/(DQ|CM|TM)-\d{3}/i);
  const taskId = taskIdMatch ? taskIdMatch[0] : `DQ-${Math.floor(Math.random() * 900) + 100}`;
  
  // Extract assignee if provided
  let assignee = "Data Manager";
  const assigneeMatch = query.match(/to[:\s]+([^,\.]+)/i);
  if (assigneeMatch && assigneeMatch[1]) {
    assignee = assigneeMatch[1].trim();
  }
  
  return `✅ Task ${taskId} has been assigned to ${assignee}.\n\nA notification has been sent to the assignee, and the task status has been updated to "Assigned" in the Tasks tab.`; 
};

// View task details
const viewTaskDetails = (taskId: string, trialId: number) => {
  return `Task Details for ${taskId}:
  
ID: ${taskId}
Trial: Trial #${trialId}
Status: In Progress
Priority: High
Assigned To: Data Manager
Due Date: ${new Date().toLocaleDateString()}
  
Description: Review data quality issues and resolve inconsistencies in the lab data domain.
  
Comments:
- [${new Date(Date.now() - 86400000).toLocaleDateString()}] Created by DataManager.AI
- [${new Date().toLocaleDateString()}] Assigned to Data Manager

Actions:
1. Type "add comment: <your comment>" to add a comment
2. Type "change status: in_progress" to update status
3. Type "assign to: <role>" to reassign the task

Would you like to perform any actions on this task?`;
};

// Get trial health summary
const getTrialHealthSummary = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No health data available for this trial.";
  }
  
  return `Trial Health Summary:
- Overall Health Score: ${trialHealth.overallHealth}/100 (${trialHealth.riskLevel} risk)
- Data Quality Score: ${trialHealth.dqScore}/100
- Reconciliation Score: ${trialHealth.reconciliationScore}/100
- Compliance Score: ${trialHealth.complianceScore}/100
- Data Completeness: ${trialHealth.dataCompleteness}%
- Query Resolution Rate: ${trialHealth.queryResolutionRate}%
- Trend: ${trialHealth.trendsDirection}

The ${trialHealth.riskLevel === 'high' ? 'most critical' : 'key'} areas to focus on are ${trialHealth.riskLevel === 'high' ? 'data completeness and query resolution' : 'maintaining compliance and data quality'}.`;
};

// Get data source health details
const getDataSourceDetails = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No data source information available for this trial.";
  }
  
  let response = "Data Source Status:\n";
  trialHealth.dataSources.forEach(source => {
    const lastUpdateDate = source.lastUpdate.toLocaleDateString();
    response += `- ${source.name}: ${source.status.toUpperCase()} | ${source.recordCount.toLocaleString()} records | Last update: ${lastUpdateDate} | ${source.dqIssues} issues\n`;
  });
  
  const totalRecords = trialHealth.dataSources.reduce((sum, source) => sum + source.recordCount, 0);
  const totalIssues = trialHealth.dataSources.reduce((sum, source) => sum + source.dqIssues, 0);
  const errorSources = trialHealth.dataSources.filter(source => source.status === 'error').length;
  
  response += `\nTotal: ${totalRecords.toLocaleString()} records across ${trialHealth.dataSources.length} sources with ${totalIssues} data quality issues.`;
  
  if (errorSources > 0) {
    response += `\n⚠️ Warning: ${errorSources} data source${errorSources > 1 ? 's' : ''} with error status requiring attention.`;
  }
  
  return response;
};

// Get domain health details
const getDomainHealthDetails = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No domain information available for this trial.";
  }
  
  let response = "Domain Health Status:\n";
  trialHealth.domains.forEach(domain => {
    response += `- ${domain.name}: ${domain.completeness}% complete | ${domain.recordCount.toLocaleString()} records | ${domain.issueCount} issues\n`;
  });
  
  // Find the domain with the most issues
  const problemDomain = [...trialHealth.domains].sort((a, b) => b.issueCount - a.issueCount)[0];
  
  // Find the domain with the lowest completeness
  const incompleteDomain = [...trialHealth.domains].sort((a, b) => a.completeness - b.completeness)[0];
  
  response += `\nRecommendations:
- Focus on the ${problemDomain.name} domain which has the highest number of issues (${problemDomain.issueCount})
- Improve data completeness in the ${incompleteDomain.name} domain (currently at ${incompleteDomain.completeness}%)`;
  
  return response;
};

// Get detailed data completeness information
const getDataCompleteness = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No completeness information available for this trial.";
  }
  
  const avgCompleteness = trialHealth.domains.reduce((sum, domain) => sum + domain.completeness, 0) / trialHealth.domains.length;
  
  let response = `Data Completeness Analysis:
- Overall completeness: ${trialHealth.dataCompleteness}%
- Average domain completeness: ${avgCompleteness.toFixed(1)}%
- Domains below 85% completeness: `;
  
  const lowCompletenessDomains = trialHealth.domains.filter(d => d.completeness < 85);
  
  if (lowCompletenessDomains.length === 0) {
    response += "None - all domains have good completeness levels";
  } else {
    response += "\n";
    lowCompletenessDomains.forEach(domain => {
      response += `  • ${domain.name}: ${domain.completeness}% complete\n`;
    });
  }
  
  return response;
};

// Get recommendations based on trial health
const getRecommendations = (trialId: number) => {
  const trialHealth = trialHealthData[trialId];
  if (!trialHealth) {
    return "No recommendations available for this trial.";
  }
  
  let recommendations = "Recommendations Based on Trial Health:\n";
  
  if (trialHealth.dqScore < 75) {
    recommendations += "- Run focused data quality checks on all domains\n";
    recommendations += "- Prioritize cleaning critical data elements in the DM and VS domains\n";
  }
  
  if (trialHealth.reconciliationScore < 80) {
    recommendations += "- Review cross-source data mapping configurations\n";
    recommendations += "- Run reconciliation between EDC and Lab data\n";
  }
  
  if (trialHealth.complianceScore < 85) {
    recommendations += "- Conduct protocol deviation review\n";
    recommendations += "- Update compliance controls based on recent regulatory changes\n";
  }
  
  if (trialHealth.queryResolutionRate < 70) {
    recommendations += "- Follow up with sites on open queries\n";
    recommendations += "- Consider query response training for underperforming sites\n";
  }
  
  if (trialHealth.dataSources.some(s => s.status === 'error')) {
    recommendations += "- Investigate and resolve data source connection errors\n";
    recommendations += "- Verify data integrity after connection is restored\n";
  }
  
  const lowCompletenessDomains = trialHealth.domains.filter(d => d.completeness < 80);
  if (lowCompletenessDomains.length > 0) {
    recommendations += `- Focus on improving completeness of ${lowCompletenessDomains.map(d => d.name).join(', ')} domains\n`;
  }
  
  if (recommendations === "Recommendations Based on Trial Health:\n") {
    recommendations += "- Continue regular monitoring and maintain current data quality processes\n";
    recommendations += "- Consider increasing frequency of automated checks for early issue detection\n";
  }
  
  return recommendations;
};

const getBotResponse = (query: string, context: { trialName?: string; trialId?: number }) => {
  // Convert query to lowercase for easier matching
  const lcQuery = query.toLowerCase();
  const trialId = context.trialId || 1; // Default to first trial if not specified
  
  // Greetings and introduction
  if (lcQuery.includes('hello') || lcQuery.includes('hi') || lcQuery.includes('hey') || lcQuery.includes('greetings')) {
    return `Hello! I'm your Data Manager AI assistant. How can I help you with data quality management${context.trialName ? ` for ${context.trialName}` : ''}?`;
  }
  
  // Handle actions
  if (lcQuery.includes('run') && (lcQuery.includes('check') || lcQuery.includes('dq'))) {
    return performDataQualityChecks(trialId);
  }
  
  if (lcQuery.includes('create') && lcQuery.includes('task')) {
    return createNewTask(lcQuery, trialId);
  }
  
  if (lcQuery.includes('assign') && lcQuery.includes('task')) {
    return assignTask(lcQuery, trialId);
  }
  
  // View task details
  const taskIdMatch = lcQuery.match(/dq-\d{3}/i);
  if (lcQuery.includes('view') && lcQuery.includes('task') && taskIdMatch) {
    return viewTaskDetails(taskIdMatch[0], trialId);
  }
  
  // Trial health summaries
  if ((lcQuery.includes('trial') || lcQuery.includes('study')) && 
      (lcQuery.includes('health') || lcQuery.includes('status') || lcQuery.includes('summary'))) {
    return getTrialHealthSummary(trialId);
  }
  
  if (lcQuery.includes('data source') || (lcQuery.includes('source') && lcQuery.includes('health'))) {
    return getDataSourceDetails(trialId);
  }
  
  if (lcQuery.includes('domain') && (lcQuery.includes('health') || lcQuery.includes('status'))) {
    return getDomainHealthDetails(trialId);
  }
  
  if (lcQuery.includes('completeness') || (lcQuery.includes('complete') && lcQuery.includes('data'))) {
    return getDataCompleteness(trialId);
  }
  
  if (lcQuery.includes('recommend') || lcQuery.includes('suggestion') || lcQuery.includes('advice')) {
    return getRecommendations(trialId);
  }
  
  // Issue information
  if (lcQuery.includes('how many') && (lcQuery.includes('dq') || lcQuery.includes('issues') || lcQuery.includes('data quality'))) {
    return getIssuesByCategory();
  }
  
  if (lcQuery.includes('issue') && (lcQuery.includes('domain') || lcQuery.includes('by domain'))) {
    return getIssuesByDomain();
  }
  
  if (lcQuery.includes('issue') && (lcQuery.includes('severity') || lcQuery.includes('critical') || lcQuery.includes('high'))) {
    return getIssuesBySeverity();
  }
  
  if (lcQuery.includes('open') && lcQuery.includes('issue')) {
    return `There are currently ${getOpenIssuesCount()} open issues that need attention.`;
  }
  
  // Settings and configuration
  if (lcQuery.includes('settings') || lcQuery.includes('configuration') || lcQuery.includes('configure') || lcQuery.includes('setup')) {
    return 'You can adjust the Data Manager settings in the Settings tab. This includes data quality checks, reconciliation rules, compliance settings, and monitoring configurations.';
  }
  
  if (lcQuery.includes('monitoring') || lcQuery.includes('active monitoring') || lcQuery.includes('schedule')) {
    return getMonitoringMode();
  }
  
  if (lcQuery.includes('checks') || lcQuery.includes('enabled') || lcQuery.includes('what checks') || lcQuery.includes('active checks')) {
    return getEnabledChecks();
  }
  
  // Type-specific information
  if (lcQuery.includes('dq') || lcQuery.includes('data quality') || lcQuery.includes('quality check') || lcQuery.includes('check')) {
    return 'Data quality checks include missing data detection, out-of-range values, invalid formats, data consistency checks, and cross-form validation. You can enable or disable these in the Settings tab.';
  }
  
  if (lcQuery.includes('reconciliation') || lcQuery.includes('cross-check') || lcQuery.includes('cross source')) {
    return 'Reconciliation ensures data consistency across different sources. We check subject matching, demographics matching, adverse events vs. medical history, and lab value matching between different data systems.';
  }
  
  if (lcQuery.includes('compliance') || lcQuery.includes('regulatory') || lcQuery.includes('protocol')) {
    return 'Compliance settings include protocol adherence checking, audit trail monitoring, protocol deviation detection, and regulatory standard alerts. These help maintain study compliance with regulatory requirements.';
  }
  
  if (lcQuery.includes('task') || lcQuery.includes('query') || (lcQuery.includes('issue') && !lcQuery.includes('dq-'))) {
    return 'When data quality or reconciliation issues are detected, the system creates tasks and assigns them to appropriate team members. You can view and manage these tasks in the Issues tab.';
  }
  
  // Check for specific issue query (e.g., "Tell me about DQ-002")
  const issueIdMatch = lcQuery.match(/dq-\d{3}/);
  if (issueIdMatch) {
    return getIssueDetail(issueIdMatch[0]);
  }
  
  // Other miscellaneous queries
  if (lcQuery.includes('reports') || lcQuery.includes('reporting') || lcQuery.includes('analytics')) {
    return 'The Reports tab provides insights on study health, including data quality metrics, reconciliation status, issue tracking, and compliance metrics. You can export these reports for further analysis.';
  }
  
  if (lcQuery.includes('logs') || lcQuery.includes('history') || lcQuery.includes('event')) {
    return 'Event logs track all monitoring activities, including when checks were run, issues detected, and actions taken. You can view these in the Logs tab.';
  }
  
  if (lcQuery.includes('agents') || lcQuery.includes('backend') || lcQuery.includes('process')) {
    return 'Backend agents are AI-powered processes that perform specific functions like data fetching, quality checking, reconciliation, and protocol compliance verification. You can view these by clicking "Show Agents".';
  }
  
  if (lcQuery.includes('edit') || lcQuery.includes('run') || lcQuery.includes('check')) {
    return 'You can run data quality and reconciliation checks by clicking the "Run DQ and Reconciliation" button at the top of the page. Results will be displayed in a summary dialog.';
  }
  
  if (lcQuery.includes('recent') || lcQuery.includes('activity') || lcQuery.includes('last run')) {
    return getRecentActivity();
  }
  
  // Default response with more suggestions
  return `I understand you're asking about "${query}". For specific data management questions, try asking about:
- Trial health summary
- Data source health status
- Domain completeness
- What are your recommendations?
- How many DQ issues are there?
- What checks are enabled?
- Show me issues by domain
- Tell me about issue DQ-001`;
};

export function DataManagerBot({ trialName, trialId, isAgentMode, setIsAgentMode }: DataManagerBotProps) {
  const [isOpen, setIsOpen] = useState(true); // Set to true to make it visible by default
  const [isMinimized, setIsMinimized] = useState(false);
  // Using isAgentMode and setIsAgentMode from props now
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your Data Manager AI assistant. How can I help you with data quality management${trialName ? ` for ${trialName}` : ''}?

You can ask me about:
• Trial health summary
• Data source health status
• Domain completeness
• What are your recommendations?
• How many DQ issues are there?
• Tell me about issue DQ-001`,
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

    // Check for task assignment or closing commands
    const lcMessage = userMessage.content.toLowerCase();
    const isTaskCommand = lcMessage.includes('task') && 
      (lcMessage.includes('assign') || lcMessage.includes('create') || lcMessage.includes('close'));
    
    // Default to agent mode if not specified
    const currentAgentMode = isAgentMode !== undefined ? isAgentMode : true;

    if (isTaskCommand && !currentAgentMode) {
      // Human-in-loop mode - don't respond automatically
      const humanModeMessage: Message = {
        role: 'assistant',
        content: 'Human-in-loop mode: This task operation requires manual review. A notification has been sent to the appropriate team member.',
        timestamp: new Date()
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, humanModeMessage]);
      }, 800);
    } else {
      // Agent mode or non-task commands
      setTimeout(() => {
        const botResponse = getBotResponse(userMessage.content, { trialName, trialId });
        
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
              <Bot className="h-6 w-6 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Chat with Data Manager AI</p>
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
          <Cpu className="h-5 w-5" />
          <span className="font-medium">Data Manager Assistant</span>
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
                  const assistantMessage = {
                    role: 'assistant' as const,
                    content: performDataQualityChecks(trialId || 1),
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                }}
              >
                Run DQ Checks
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for task creation with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please provide details for the new task:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create a form message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: createNewTask("Create task title: Data quality review priority: Medium", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                Create Task
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for task assignment with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please provide task assignment details:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create an assignment message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: assignTask("Assign task DQ-123 to Data Manager", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                Assign Task
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  // Add a form for viewing a task with a prompt
                  const formPrompt = {
                    role: 'assistant' as const,
                    content: "Please enter the Task ID you wish to view:",
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, formPrompt]);
                  
                  // Create a view message
                  setTimeout(() => {
                    const assistantMessage = {
                      role: 'assistant' as const,
                      content: viewTaskDetails("DQ-123", trialId || 1),
                      timestamp: new Date()
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                  }, 1000);
                }}
              >
                View Task
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-xs py-1 h-7"
                onClick={() => {
                  const assistantMessage = {
                    role: 'assistant' as const,
                    content: getTrialHealthSummary(trialId || 1),
                    timestamp: new Date()
                  };
                  setMessages(prev => [...prev, assistantMessage]);
                }}
              >
                Trial Health
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
                        <Cpu className="h-4 w-4" />
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
              {/* Task Assignment Toggle */}
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium">Task Assignment Mode:</span>
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
                  placeholder="Ask about DQ checks, settings, monitoring..."
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