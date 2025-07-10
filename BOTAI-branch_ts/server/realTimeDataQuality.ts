import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import { 
  AgentType, 
  TaskPriority, 
  DataSourceType, 
  DetectionType, 
  SignalDetection,
  TaskStatus
} from '@shared/schema';
import { analyzeWithGrok } from './grok';
import { analyzeTrialData } from './openai';
import { 
  sendTaskNotification, 
  TaskNotificationData 
} from './emailService';

// Connection types
enum MessageType {
  START_MONITORING = 'START_MONITORING',
  STOP_MONITORING = 'STOP_MONITORING',
  DATA_QUALITY_ISSUE = 'DATA_QUALITY_ISSUE',
  DATA_QUALITY_RESULT = 'DATA_QUALITY_RESULT',
  ERROR = 'ERROR',
  STATUS = 'STATUS'
}

interface WebSocketMessage {
  type: MessageType;
  data: any;
}

interface MonitoringClient {
  ws: WebSocket;
  trialId: number;
  sources: string[];
  options: {
    checkConsistency: boolean;
    checkCompleteness: boolean;
    checkAccuracy: boolean;
    checkTimeliness: boolean;
  };
  activeMonitoring: boolean;
  interval?: NodeJS.Timeout;
}

// Active clients map
const activeClients = new Map<WebSocket, MonitoringClient>();

// Function to create a JSON message
function createMessage(type: MessageType, data: any): string {
  return JSON.stringify({
    type,
    data,
    timestamp: new Date().toISOString()
  });
}

// Get sample data for a trial - in production this would query real data sources
async function getSampleData(trialId: number, source: string) {
  // This is a simplified version - in real implementation, 
  // this would connect to actual data sources
  
  // Mock data for different sources
  const mockData: Record<string, any[]> = {
    [DataSourceType.EDC]: [
      { subjectId: 'S-001', visitDate: '2025-03-15', dataPoint: 'weight', value: 72.5, unit: 'kg' },
      { subjectId: 'S-002', visitDate: '2025-03-16', dataPoint: 'weight', value: 68.2, unit: 'kg' },
      { subjectId: 'S-003', visitDate: '2025-03-17', dataPoint: 'weight', value: null, unit: 'kg' }, // Missing data
    ],
    [DataSourceType.LAB_RESULTS]: [
      { subjectId: 'S-001', testDate: '2025-03-15', test: 'ALT', value: 35, unit: 'U/L', referenceRange: '7-55' },
      { subjectId: 'S-002', testDate: '2025-03-16', test: 'ALT', value: 145, unit: 'U/L', referenceRange: '7-55' }, // Out of range
      { subjectId: 'S-003', testDate: '2025-03-16', test: 'ALT', value: 32, unit: 'U/L', referenceRange: '7-55' },
    ],
    [DataSourceType.CTMS]: [
      { siteId: 1, subjectId: 'S-001', visitDate: '2025-03-14', status: 'Completed' }, // Date inconsistency with EDC
      { siteId: 1, subjectId: 'S-002', visitDate: '2025-03-16', status: 'Completed' },
      { siteId: 2, subjectId: 'S-003', visitDate: '2025-03-17', status: 'Scheduled' }, // Status inconsistency
    ],
    [DataSourceType.ADVERSE_EVENTS]: [
      { subjectId: 'S-001', reportDate: '2025-03-16', event: 'Headache', severity: 'Mild', related: 'Possibly' },
      { subjectId: 'S-002', reportDate: '2025-03-17', event: 'Nausea', severity: 'Moderate', related: 'Probably' },
      { subjectId: 'S-002', reportDate: '2025-03-17', event: 'Nausea', severity: 'Moderate', related: 'Probably' }, // Duplicate entry
    ]
  };
  
  return mockData[source] || [];
}

// Function to generate a task ID
function generateTaskId(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `DQ_TASK_${timestamp}`;
}

// Function to determine who to assign the task based on issue severity and data source
function determineTaskAssignee(severity: string, source: string): string {
  if (severity === 'Critical' || severity === 'High') {
    switch (source) {
      case DataSourceType.LAB_RESULTS:
        return 'Data Quality Manager';
      case DataSourceType.EDC:
        return 'Clinical Data Manager';
      case DataSourceType.ADVERSE_EVENTS:
        return 'Safety Specialist';
      case DataSourceType.CTMS:
        return 'Clinical Trial Manager';
      default:
        return 'Clinical Data Manager';
    }
  }
  return 'Data Management Team';
}

// Process data quality in real-time
async function processDataQuality(client: MonitoringClient): Promise<any> {
  try {
    const { trialId, sources, options } = client;
    
    // Get trial information
    const trial = await storage.getTrial(trialId);
    if (!trial) {
      throw new Error(`Trial with ID ${trialId} not found`);
    }
    
    // Collect data from the specified sources
    const allData: Record<string, any[]> = {};
    for (const source of sources) {
      allData[source] = await getSampleData(trialId, source);
    }
    
    // Perform data quality checks
    const issues: any[] = [];
    
    // 1. Check for consistency across sources (if enabled)
    if (options.checkConsistency && sources.length >= 2) {
      const consistencyIssues = checkDataConsistency(allData, sources);
      issues.push(...consistencyIssues);
    }
    
    // 2. Check for completeness within each source (if enabled)
    if (options.checkCompleteness) {
      for (const source of sources) {
        const completenessIssues = checkDataCompleteness(allData[source], source);
        issues.push(...completenessIssues);
      }
    }
    
    // 3. Check for data accuracy (if enabled)
    if (options.checkAccuracy) {
      for (const source of sources) {
        const accuracyIssues = checkDataAccuracy(allData[source], source);
        issues.push(...accuracyIssues);
      }
    }
    
    // 4. Check for timeliness (if enabled)
    if (options.checkTimeliness) {
      for (const source of sources) {
        const timelinessIssues = checkDataTimeliness(allData[source], source);
        issues.push(...timelinessIssues);
      }
    }
    
    // If there are issues, create signals for each and tasks for high severity issues
    if (issues.length > 0) {
      const signals: SignalDetection[] = [];
      const tasks: any[] = [];
      
      for (const issue of issues) {
        // Create signal detection for the issue
        const detectionId = `DQ_${Date.now().toString().substr(-6)}`;
        const signalData = {
          trialId,
          detectionId,
          title: issue.title,
          dataReference: issue.source,
          observation: issue.description,
          priority: issue.severity as typeof TaskPriority[keyof typeof TaskPriority],
          status: 'detected',
          detectionType: DetectionType.AUTOMATED,
          assignedTo: 'Data Manager',
          detectionDate: new Date(),
          dueDate: calculateDueDate(issue.severity),
          recommendation: issue.recommendation || 'Review and investigate the data quality issue'
        };
        
        try {
          const signal = await storage.createSignalDetection(signalData);
          signals.push(signal);
          
          // Create task for high severity issues (Critical and High)
          if (issue.severity === 'Critical' || issue.severity === 'High') {
            const assignee = determineTaskAssignee(issue.severity, issue.source);
            const taskId = generateTaskId();
            const dueDate = calculateDueDate(issue.severity);
            
            const taskData = {
              taskId,
              trialId,
              title: `Resolve ${issue.title}`,
              description: `${issue.description}\n\nRecommendation: ${issue.recommendation}`,
              status: 'not_started', // Use string literal instead of enum
              priority: issue.severity as typeof TaskPriority[keyof typeof TaskPriority],
              assignedTo: assignee,
              dueDate: dueDate.toISOString(),
              sourceId: signal.id.toString(),
              sourceType: 'signal_detection',
              createdBy: 'Data Quality Agent'
            };
            
            const task = await storage.createTask(taskData);
            tasks.push(task);
            
            // Send task notification to the assignee
            try {
              const notificationData: TaskNotificationData = {
                taskId: task.taskId || '',
                taskTitle: task.title,
                dueDate: typeof task.dueDate === 'string' ? task.dueDate : new Date().toISOString(),
                priority: task.priority,
                assignedRole: task.assignedTo || 'Data Quality Manager',
                description: task.description,
                trialId: trial.protocolId
              };
              
              await sendTaskNotification(notificationData);
              console.log(`Task notification sent to ${task.assignedTo} for task ${task.taskId}`);
            } catch (notificationError) {
              console.error('Error sending task notification:', notificationError);
            }
          }
        } catch (error) {
          console.error('Error creating signal or task:', error);
        }
      }
      
      // Return the issues, created signals, and tasks
      return {
        issues,
        signals,
        tasks
      };
    }
    
    return { issues: [], signals: [], tasks: [] };
  } catch (error) {
    console.error('Error in processing data quality:', error);
    throw error;
  }
}

// Calculate due date based on priority
function calculateDueDate(priority: string): Date {
  const date = new Date();
  
  switch (priority) {
    case 'Critical':
      date.setHours(date.getHours() + 24); // 1 day
      break;
    case 'High':
      date.setDate(date.getDate() + 3); // 3 days
      break;
    case 'Medium':
      date.setDate(date.getDate() + 7); // 7 days
      break;
    case 'Low':
      date.setDate(date.getDate() + 14); // 14 days
      break;
  }
  
  return date;
}

// Check for data consistency across sources
function checkDataConsistency(data: Record<string, any[]>, sources: string[]): any[] {
  const issues: any[] = [];
  
  // Compare EDC and CTMS dates if both sources are selected
  if (sources.includes(DataSourceType.EDC) && sources.includes(DataSourceType.CTMS)) {
    const edcData = data[DataSourceType.EDC];
    const ctmsData = data[DataSourceType.CTMS];
    
    // Check for date inconsistencies
    for (const edcRecord of edcData) {
      const matchingCtmsRecord = ctmsData.find(c => c.subjectId === edcRecord.subjectId);
      
      if (matchingCtmsRecord && edcRecord.visitDate !== matchingCtmsRecord.visitDate) {
        issues.push({
          type: 'inconsistent_data',
          title: 'Visit date inconsistency',
          description: `Visit date in EDC (${edcRecord.visitDate}) does not match CTMS (${matchingCtmsRecord.visitDate}) for subject ${edcRecord.subjectId}`,
          source: 'EDC/CTMS',
          severity: 'Medium',
          recommendation: 'Review both data sources and reconcile the discrepancy'
        });
      }
    }
  }
  
  // Add more consistency checks based on other source combinations
  
  return issues;
}

// Check for data completeness within a source
function checkDataCompleteness(sourceData: any[], source: string): any[] {
  const issues: any[] = [];
  
  if (source === DataSourceType.EDC) {
    // Check for null or undefined values
    const missingDataPoints = sourceData.filter(record => record.value === null || record.value === undefined);
    
    if (missingDataPoints.length > 0) {
      issues.push({
        type: 'missing_data',
        title: 'Missing data in EDC',
        description: `${missingDataPoints.length} records have missing values in the EDC system`,
        source: 'EDC',
        severity: 'High',
        recommendation: 'Review subjects with missing data and ensure values are collected'
      });
    }
  }
  
  // Add similar checks for other data sources
  
  return issues;
}

// Check for data accuracy
function checkDataAccuracy(sourceData: any[], source: string): any[] {
  const issues: any[] = [];
  
  if (source === DataSourceType.LAB_RESULTS) {
    // Check for out-of-range values
    const outOfRangeValues = sourceData.filter(record => {
      if (record.referenceRange) {
        const [min, max] = record.referenceRange.split('-').map(Number);
        return record.value < min || record.value > max;
      }
      return false;
    });
    
    if (outOfRangeValues.length > 0) {
      issues.push({
        type: 'out_of_range',
        title: 'Lab values out of range',
        description: `${outOfRangeValues.length} lab values are outside the normal reference range`,
        source: 'Lab Results',
        severity: 'Critical',
        recommendation: 'Review out-of-range lab values and consider clinical significance'
      });
    }
  }
  
  // Add similar checks for other data sources
  
  return issues;
}

// Check for data timeliness (e.g., delayed entries)
function checkDataTimeliness(sourceData: any[], source: string): any[] {
  const issues: any[] = [];
  
  if (source === DataSourceType.ADVERSE_EVENTS) {
    // Check for duplicate entries
    const recordCounts = new Map<string, number>();
    
    sourceData.forEach(record => {
      const key = `${record.subjectId}-${record.event}-${record.reportDate}`;
      recordCounts.set(key, (recordCounts.get(key) || 0) + 1);
    });
    
    const duplicates = Array.from(recordCounts.entries())
      .filter(([_key, count]) => count > 1)
      .map(([key]) => key);
    
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate',
        title: 'Duplicate adverse event records',
        description: `${duplicates.length} duplicate adverse event records found`,
        source: 'Adverse Events',
        severity: 'Medium',
        recommendation: 'Review and deduplicate adverse event records'
      });
    }
  }
  
  return issues;
}

// Initialize WebSocket server for real-time data quality processing
export function initializeRealTimeDataQuality(server: Server): WebSocketServer {
  console.log('Initializing WebSocket server for real-time data quality on path: /ws/data-quality');
  const wss = new WebSocketServer({ server, path: '/ws/data-quality' });
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New client connected to real-time data quality WebSocket');
    
    // Setup ping interval to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);
    
    // Initialize client with default settings
    activeClients.set(ws, {
      ws,
      trialId: -1, // Invalid until set by client
      sources: [],
      options: {
        checkConsistency: true,
        checkCompleteness: true,
        checkAccuracy: true,
        checkTimeliness: true
      },
      activeMonitoring: false
    });
    
    // Send welcome message
    ws.send(createMessage(MessageType.STATUS, {
      message: 'Connected to real-time data quality monitoring service',
      status: 'connected'
    }));
    
    // Handle messages from client
    ws.on('message', async (messageData: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(messageData);
        const client = activeClients.get(ws);
        
        if (!client) {
          ws.send(createMessage(MessageType.ERROR, {
            message: 'Client not registered properly, please reconnect'
          }));
          return;
        }
        
        switch (message.type) {
          case MessageType.START_MONITORING:
            // Validate required data
            if (!message.data.trialId || !message.data.sources || message.data.sources.length < 1) {
              ws.send(createMessage(MessageType.ERROR, {
                message: 'Missing required data: trialId and sources are required'
              }));
              return;
            }
            
            // Update client settings
            client.trialId = message.data.trialId;
            client.sources = message.data.sources;
            
            if (message.data.options) {
              client.options = {
                ...client.options,
                ...message.data.options
              };
            }
            
            // Stop existing monitoring if any
            if (client.interval) {
              clearInterval(client.interval);
            }
            
            // Start real-time monitoring
            client.activeMonitoring = true;
            
            // Run an immediate check
            try {
              const initialResults = await processDataQuality(client);
              ws.send(createMessage(MessageType.DATA_QUALITY_RESULT, initialResults));
              
              // Log task creation info if any tasks were created
              if (initialResults.tasks && initialResults.tasks.length > 0) {
                console.log(`Created ${initialResults.tasks.length} tasks for high severity data quality issues`);
                
                // Send additional notification about tasks
                ws.send(createMessage(MessageType.STATUS, {
                  message: `Created ${initialResults.tasks.length} tasks for high severity issues. These tasks have been assigned to the appropriate team members.`,
                  taskCount: initialResults.tasks.length
                }));
              }
            } catch (error) {
              console.error('Error in initial data quality check:', error);
              ws.send(createMessage(MessageType.ERROR, {
                message: 'Error in initial data quality check',
                error: error instanceof Error ? error.message : String(error)
              }));
            }
            
            // Start interval for continuous monitoring (every 60 seconds)
            client.interval = setInterval(async () => {
              if (client.activeMonitoring && ws.readyState === WebSocket.OPEN) {
                try {
                  const results = await processDataQuality(client);
                  
                  if (results.issues.length > 0) {
                    ws.send(createMessage(MessageType.DATA_QUALITY_RESULT, results));
                    
                    // If high severity tasks were created, log and notify
                    if (results.tasks && results.tasks.length > 0) {
                      console.log(`Created ${results.tasks.length} tasks for high severity data quality issues`);
                      
                      // Send additional notification about tasks
                      ws.send(createMessage(MessageType.STATUS, {
                        message: `Created ${results.tasks.length} tasks for high severity issues. These tasks have been assigned to the appropriate team members.`,
                        taskCount: results.tasks.length
                      }));
                    }
                  } else {
                    ws.send(createMessage(MessageType.STATUS, {
                      message: 'Monitoring active, no new issues detected',
                      lastCheck: new Date().toISOString()
                    }));
                  }
                } catch (error) {
                  console.error('Error in scheduled data quality check:', error);
                  ws.send(createMessage(MessageType.ERROR, {
                    message: 'Error in scheduled data quality check',
                    error: error instanceof Error ? error.message : String(error)
                  }));
                }
              }
            }, 60000); // Check every 60 seconds
            
            ws.send(createMessage(MessageType.STATUS, {
              message: 'Real-time monitoring started',
              settings: {
                trialId: client.trialId,
                sources: client.sources,
                options: client.options
              }
            }));
            break;
            
          case MessageType.STOP_MONITORING:
            // Stop monitoring
            client.activeMonitoring = false;
            
            if (client.interval) {
              clearInterval(client.interval);
              client.interval = undefined;
            }
            
            ws.send(createMessage(MessageType.STATUS, {
              message: 'Real-time monitoring stopped'
            }));
            break;
            
          default:
            ws.send(createMessage(MessageType.ERROR, {
              message: `Unknown message type: ${message.type}`
            }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(createMessage(MessageType.ERROR, {
          message: 'Error processing message',
          error: error instanceof Error ? error.message : String(error)
        }));
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from data quality WebSocket');
      
      const client = activeClients.get(ws);
      if (client && client.interval) {
        clearInterval(client.interval);
      }
      
      activeClients.delete(ws);
      clearInterval(pingInterval);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      
      const client = activeClients.get(ws);
      if (client && client.interval) {
        clearInterval(client.interval);
      }
      
      activeClients.delete(ws);
      clearInterval(pingInterval);
    });
  });
  
  return wss;
}

// Export message types for client use
export { MessageType };