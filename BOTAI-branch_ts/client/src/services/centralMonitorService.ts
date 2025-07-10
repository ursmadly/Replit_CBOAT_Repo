/**
 * Central Monitor.AI Service
 * 
 * This service handles the AI-powered monitoring functionality for clinical trial data.
 * It identifies protocol deviations, site issues, lab data issues, and safety queries,
 * then creates tasks and assigns them to the appropriate study contacts.
 */

// Types for Central Monitor.AI
export interface QueryItem {
  id: string;
  type: 'protocol_deviation' | 'site_issue' | 'lab_issue' | 'safety';
  title: string;
  description: string;
  status: 'created' | 'assigned' | 'in_progress' | 'under_review' | 'closed';
  severity: 'critical' | 'high' | 'medium' | 'low';
  trialId: number;
  created: Date;
  lastUpdated: Date;
  createdBy: 'Central Monitor.AI';
  affectedSubjects?: string[];
  dataSources: string[];
  relatedData?: any; // Additional reference data about the issue
}

export interface TaskItem {
  id: string;
  queryId: string;
  title: string;
  description: string;
  status: 'created' | 'assigned' | 'in_progress' | 'under_review' | 'closed';
  priority: 'high' | 'medium' | 'low';
  assignedTo: string;
  assignedRole: string;
  created: Date;
  dueDate: Date;
  parentTaskId?: string; // For tree structure
  notes?: string[];
}

export interface NotificationItem {
  id: string;
  taskId?: string;
  queryId?: string;
  title: string;
  message: string;
  type: 'email' | 'in_app';
  recipient: string;
  recipientRole: string;
  sent: boolean;
  sentDate?: Date;
  read: boolean;
  readDate?: Date;
}

export interface AnalysisResult {
  newIssuesDetected: number;
  newTasksCreated: number;
  issuesClosed: number;
  tasksClosed: number;
  detectedIssues: QueryItem[];
  createdTasks: TaskItem[];
  notifications: NotificationItem[];
}

// Mock data and functions to simulate AI analysis
class CentralMonitorService {
  private mockProtocolDeviations: QueryItem[] = [
    {
      id: 'PD-001',
      type: 'protocol_deviation',
      title: 'Missing lab tests at Visit 2',
      description: 'Several subjects are missing CBC lab tests at Visit 2 which is required by protocol',
      status: 'created',
      severity: 'high',
      trialId: 1,
      created: new Date('2023-11-01'),
      lastUpdated: new Date('2023-11-01'),
      createdBy: 'Central Monitor.AI',
      affectedSubjects: ['100-001', '100-003', '100-007'],
      dataSources: ['EDC', 'Lab']
    },
    {
      id: 'PD-002',
      type: 'protocol_deviation',
      title: 'Visit window violation',
      description: 'Subject 100-004 Visit 3 occurred outside the protocol-defined window (±3 days)',
      status: 'assigned',
      severity: 'medium',
      trialId: 1,
      created: new Date('2023-10-15'),
      lastUpdated: new Date('2023-10-16'),
      createdBy: 'Central Monitor.AI',
      affectedSubjects: ['100-004'],
      dataSources: ['EDC', 'CTMS']
    }
  ];

  private mockSiteIssues: QueryItem[] = [
    {
      id: 'SI-001',
      type: 'site_issue',
      title: 'Site 103 data entry delays',
      description: 'Site 103 has consistent delays in data entry exceeding 5 days for all subjects',
      status: 'assigned',
      severity: 'medium',
      trialId: 1,
      created: new Date('2023-10-25'),
      lastUpdated: new Date('2023-10-26'),
      createdBy: 'Central Monitor.AI',
      dataSources: ['CTMS', 'EDC']
    },
    {
      id: 'SI-002',
      type: 'site_issue',
      title: 'High screen failure rate at Site 102',
      description: 'Site 102 has a screen failure rate of 45%, well above the study average of 22%',
      status: 'in_progress',
      severity: 'high',
      trialId: 1,
      created: new Date('2023-10-12'),
      lastUpdated: new Date('2023-10-22'),
      createdBy: 'Central Monitor.AI',
      dataSources: ['CTMS']
    }
  ];

  private mockLabIssues: QueryItem[] = [
    {
      id: 'LI-001',
      type: 'lab_issue',
      title: 'Inconsistent lab normal ranges',
      description: 'Inconsistent normal ranges observed for WBC across multiple sites',
      status: 'in_progress',
      severity: 'medium',
      trialId: 1,
      created: new Date('2023-10-20'),
      lastUpdated: new Date('2023-10-28'),
      createdBy: 'Central Monitor.AI',
      dataSources: ['Lab']
    }
  ];

  private mockSafetyIssues: QueryItem[] = [
    {
      id: 'SQ-001',
      type: 'safety',
      title: 'Potential unreported SAE',
      description: 'Subject 100-002 has hospital visit record but no corresponding SAE report',
      status: 'under_review',
      severity: 'critical',
      trialId: 1,
      created: new Date('2023-10-15'),
      lastUpdated: new Date('2023-10-29'),
      createdBy: 'Central Monitor.AI',
      affectedSubjects: ['100-002'],
      dataSources: ['EDC', 'Safety']
    }
  ];

  private mockTasks: TaskItem[] = [
    {
      id: 'T-001',
      queryId: 'PD-001',
      title: 'Verify missing CBC tests with site',
      description: 'Contact site coordinator to verify status of missing CBC tests for Visit 2',
      status: 'created',
      priority: 'high',
      assignedTo: 'John Smith',
      assignedRole: 'CRA',
      created: new Date('2023-11-01'),
      dueDate: new Date('2023-11-05')
    },
    {
      id: 'T-002',
      queryId: 'PD-001',
      title: 'Document protocol deviations',
      description: 'Document confirmed missing CBC tests as protocol deviations in EDC',
      status: 'created',
      priority: 'medium',
      assignedTo: 'John Smith',
      assignedRole: 'CRA',
      created: new Date('2023-11-01'),
      dueDate: new Date('2023-11-07'),
      parentTaskId: 'T-001'
    },
    {
      id: 'T-003',
      queryId: 'SI-001',
      title: 'Contact Site 103 about data entry delays',
      description: 'Schedule call with site director to discuss data entry timeline issues',
      status: 'assigned',
      priority: 'medium',
      assignedTo: 'Sarah Johnson',
      assignedRole: 'CRA',
      created: new Date('2023-10-26'),
      dueDate: new Date('2023-10-30')
    },
    {
      id: 'T-004',
      queryId: 'LI-001',
      title: 'Review lab normal ranges documentation',
      description: 'Audit lab manuals and documentation for all sites to identify inconsistencies',
      status: 'in_progress',
      priority: 'medium',
      assignedTo: 'Michael Chen',
      assignedRole: 'Lab Coordinator',
      created: new Date('2023-10-21'),
      dueDate: new Date('2023-10-28')
    },
    {
      id: 'T-005',
      queryId: 'SQ-001',
      title: 'Contact PI regarding potential SAE',
      description: 'Urgent: Contact Principal Investigator about potential unreported SAE for subject 100-002',
      status: 'under_review',
      priority: 'high',
      assignedTo: 'Dr. Emily Carter',
      assignedRole: 'Medical Monitor',
      created: new Date('2023-10-16'),
      dueDate: new Date('2023-10-18')
    }
  ];

  // Get all queries
  public getQueries(trialId: number): QueryItem[] {
    const allQueries = [
      ...this.mockProtocolDeviations,
      ...this.mockSiteIssues,
      ...this.mockLabIssues,
      ...this.mockSafetyIssues
    ];
    
    return trialId === 0 ? allQueries : allQueries.filter(q => q.trialId === trialId);
  }

  // Get tasks for a specific query
  public getTasksForQuery(queryId: string): TaskItem[] {
    return this.mockTasks.filter(task => task.queryId === queryId);
  }

  // Get all tasks
  public getAllTasks(): TaskItem[] {
    return this.mockTasks;
  }

  // Create a new task for a query
  public createTaskForQuery(
    queryId: string, 
    title: string, 
    description: string, 
    priority: 'high' | 'medium' | 'low',
    assignedTo: string,
    assignedRole: string,
    parentTaskId?: string
  ): TaskItem {
    const taskId = `T-${Math.floor(100 + Math.random() * 900)}`;
    const newTask: TaskItem = {
      id: taskId,
      queryId,
      title,
      description,
      status: 'created',
      priority,
      assignedTo,
      assignedRole,
      created: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      parentTaskId
    };
    
    this.mockTasks.push(newTask);
    return newTask;
  }

  // Update task status
  public updateTaskStatus(taskId: string, status: 'created' | 'assigned' | 'in_progress' | 'under_review' | 'closed'): TaskItem | null {
    const taskIndex = this.mockTasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return null;
    
    this.mockTasks[taskIndex].status = status;
    return this.mockTasks[taskIndex];
  }

  // Update query status
  public updateQueryStatus(queryId: string, status: 'created' | 'assigned' | 'in_progress' | 'under_review' | 'closed'): QueryItem | null {
    // Find which array contains the query
    let query: QueryItem | undefined;
    let queryArray: QueryItem[] = [];
    
    if (query = this.mockProtocolDeviations.find(q => q.id === queryId)) {
      queryArray = this.mockProtocolDeviations;
    } else if (query = this.mockSiteIssues.find(q => q.id === queryId)) {
      queryArray = this.mockSiteIssues;
    } else if (query = this.mockLabIssues.find(q => q.id === queryId)) {
      queryArray = this.mockLabIssues;
    } else if (query = this.mockSafetyIssues.find(q => q.id === queryId)) {
      queryArray = this.mockSafetyIssues;
    }
    
    if (!query) return null;
    
    const queryIndex = queryArray.findIndex(q => q.id === queryId);
    queryArray[queryIndex].status = status;
    queryArray[queryIndex].lastUpdated = new Date();
    
    return queryArray[queryIndex];
  }

  // Analyze Trial Data to find new issues 
  public async analyzeTrialData(trialId: number): Promise<AnalysisResult> {
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate a random new issue
    const issueTypes: ('protocol_deviation' | 'site_issue' | 'lab_issue' | 'safety')[] = [
      'protocol_deviation', 'site_issue', 'lab_issue', 'safety'
    ];
    const issueType = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    const severity: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];
    const issueSeverity = severity[Math.floor(Math.random() * severity.length)];
    
    let newIssue: QueryItem;
    let issuePrefix = '';
    
    switch (issueType) {
      case 'protocol_deviation':
        issuePrefix = 'PD';
        newIssue = {
          id: `${issuePrefix}-${Math.floor(100 + Math.random() * 900)}`,
          type: issueType,
          title: 'Inconsistent dosing at Visit 3',
          description: 'Multiple subjects received incorrect medication dosing at Visit 3 based on weight calculation',
          status: 'created',
          severity: issueSeverity,
          trialId,
          created: new Date(),
          lastUpdated: new Date(),
          createdBy: 'Central Monitor.AI',
          affectedSubjects: ['100-004', '100-006'],
          dataSources: ['EDC', 'Drug Supply']
        };
        this.mockProtocolDeviations.push(newIssue);
        break;
        
      case 'site_issue':
        issuePrefix = 'SI';
        newIssue = {
          id: `${issuePrefix}-${Math.floor(100 + Math.random() * 900)}`,
          type: issueType,
          title: 'Enrollment slowdown at Site 105',
          description: 'Site 105 has not enrolled any new patients in the last 30 days',
          status: 'created',
          severity: issueSeverity,
          trialId,
          created: new Date(),
          lastUpdated: new Date(),
          createdBy: 'Central Monitor.AI',
          dataSources: ['CTMS']
        };
        this.mockSiteIssues.push(newIssue);
        break;
        
      case 'lab_issue':
        issuePrefix = 'LI';
        newIssue = {
          id: `${issuePrefix}-${Math.floor(100 + Math.random() * 900)}`,
          type: issueType,
          title: 'Missing lab samples for Visit 4',
          description: 'Three subjects have missing biomarker samples for Visit 4',
          status: 'created',
          severity: issueSeverity,
          trialId,
          created: new Date(),
          lastUpdated: new Date(),
          createdBy: 'Central Monitor.AI',
          affectedSubjects: ['100-002', '100-007', '100-009'],
          dataSources: ['Lab', 'EDC']
        };
        this.mockLabIssues.push(newIssue);
        break;
        
      case 'safety':
        issuePrefix = 'SQ';
        newIssue = {
          id: `${issuePrefix}-${Math.floor(100 + Math.random() * 900)}`,
          type: issueType,
          title: 'Elevated liver enzymes trend',
          description: 'Multiple subjects showing upward trend in liver enzymes that may need evaluation',
          status: 'created',
          severity: issueSeverity,
          trialId,
          created: new Date(),
          lastUpdated: new Date(),
          createdBy: 'Central Monitor.AI',
          affectedSubjects: ['100-003', '100-008', '100-012'],
          dataSources: ['Lab', 'Safety']
        };
        this.mockSafetyIssues.push(newIssue);
        break;
    }
    
    // Create a task for the new issue
    const roleMap = {
      'protocol_deviation': 'CRA',
      'site_issue': 'CRA',
      'lab_issue': 'Lab Coordinator',
      'safety': 'Medical Monitor'
    };
    
    const assigneeMap = {
      'CRA': 'John Smith',
      'Lab Coordinator': 'Michael Chen',
      'Medical Monitor': 'Dr. Emily Carter'
    };
    
    const assignedRole = roleMap[issueType] as keyof typeof assigneeMap;
    const assignedTo = assigneeMap[assignedRole];
    
    const newTask = this.createTaskForQuery(
      newIssue.id,
      `Investigate ${newIssue.title.toLowerCase()}`,
      `Review data and verify ${newIssue.description.toLowerCase()}`,
      newIssue.severity === 'critical' || newIssue.severity === 'high' ? 'high' : 'medium',
      assignedTo,
      assignedRole
    );
    
    // Create a notification
    const notification: NotificationItem = {
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      taskId: newTask.id,
      queryId: newIssue.id,
      title: `New ${issueType.replace('_', ' ')} detected`,
      message: `Central Monitor.AI has detected a new ${issueSeverity} priority issue: ${newIssue.title}. A task has been assigned to you.`,
      type: 'in_app',
      recipient: assignedTo,
      recipientRole: assignedRole,
      sent: true,
      sentDate: new Date(),
      read: false
    };
    
    // In a real implementation, this would call an API to send email notifications
    
    return {
      newIssuesDetected: 1,
      newTasksCreated: 1,
      issuesClosed: 0,
      tasksClosed: 0,
      detectedIssues: [newIssue],
      createdTasks: [newTask],
      notifications: [notification]
    };
  }

  // Check for resolved issues and close them
  public async checkForResolvedIssues(trialId: number, autoCloseEnabled: boolean): Promise<AnalysisResult> {
    if (!autoCloseEnabled) {
      return {
        newIssuesDetected: 0,
        newTasksCreated: 0,
        issuesClosed: 0,
        tasksClosed: 0,
        detectedIssues: [],
        createdTasks: [],
        notifications: []
      };
    }
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, this would check actual data for resolution
    // For demo purposes, randomly select an issue to close
    const allQueries = this.getQueries(trialId);
    const openQueries = allQueries.filter(q => q.status !== 'closed');
    
    if (openQueries.length === 0) {
      return {
        newIssuesDetected: 0,
        newTasksCreated: 0,
        issuesClosed: 0,
        tasksClosed: 0,
        detectedIssues: [],
        createdTasks: [],
        notifications: []
      };
    }
    
    // Randomly select a query to close
    const queryToClose = openQueries[Math.floor(Math.random() * openQueries.length)];
    this.updateQueryStatus(queryToClose.id, 'closed');
    
    // Close associated tasks
    const tasksForQuery = this.getTasksForQuery(queryToClose.id);
    const tasksClosed = tasksForQuery.length;
    
    tasksForQuery.forEach(task => {
      this.updateTaskStatus(task.id, 'closed');
    });
    
    // Create notifications
    const notifications: NotificationItem[] = tasksForQuery.map(task => ({
      id: `N-${Math.floor(100 + Math.random() * 900)}`,
      taskId: task.id,
      queryId: queryToClose.id,
      title: `Issue automatically closed`,
      message: `Central Monitor.AI has automatically closed issue ${queryToClose.id}: ${queryToClose.title} as it appears to be resolved.`,
      type: 'in_app',
      recipient: task.assignedTo,
      recipientRole: task.assignedRole,
      sent: true,
      sentDate: new Date(),
      read: false
    }));
    
    return {
      newIssuesDetected: 0,
      newTasksCreated: 0,
      issuesClosed: 1,
      tasksClosed,
      detectedIssues: [],
      createdTasks: [],
      notifications
    };
  }
}

export const centralMonitorService = new CentralMonitorService();