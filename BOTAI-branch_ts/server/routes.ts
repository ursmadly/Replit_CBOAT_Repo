import type { Express, Request as ExpressRequest, Response } from "express";
import type { Session } from "express-session";

// Extend the Request interface to include session
interface Request extends ExpressRequest {
  session: Session & {
    user?: {
      id: number;
      username: string;
      role: string;
      email?: string;
      studyAccess?: string[];
    };
  };
}
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { ZodError } from "zod";
import { 
  insertTaskSchema,
  insertSignalDetectionSchema,
  insertRiskThresholdSchema,
  insertVendorSchema,
  insertResourceSchema,
  insertTaskCommentSchema,
  insertRiskProfileSchema,
  insertTrialSchema,
  insertAgentWorkflowSchema,
  insertUserSchema,
  TaskStatus,
  ExtendedTaskStatus
} from "@shared/schema";
import { 
  getAgentStatuses, 
  getAgentStatusesByTrial, 
  getAgentStatusByType, 
  updateAgentStatus, 
  initializeAgentStatuses 
} from './agentStatus';
import { vectorDb, type VectorDocument } from "./vectorDb";
import { rag, type RAGQueryOptions } from "./rag";
import { importTrialDataToRAG } from "./trialDataImport";
import { 
  sendTaskNotification, 
  sendSignalNotification,
  sendGeneralNotification,
  TaskNotificationData,
  SignalNotificationData
} from "./emailService";
import * as notificationService from "./notificationService";
import { insertNotificationSchema } from "@shared/schema";
// Real-Time Data Quality feature removed per user request
import { isAuthenticated, isAdmin, isAdminOrPI } from "./auth";
import { 
  storeDomainData, 
  storeDomainSource, 
  getDomainData, 
  getDomainSources, 
  getTrialDomains, 
  getDomainRecords,
  getTrialDomainSources,
  addDomainRecord,
  updateDomainRecord,
  deleteDomainRecord,
  getDomainRecordById
} from "./domainDataManager";
import { trackDomainDataChanges, analyzeDomainData } from "./dataManagerWorkflow";
import { processProtocolDocument } from "./openai-protocol-extractor";
import { db } from "./db";
import { and, eq } from "drizzle-orm";
import { domainData } from "@shared/schema";
import { 
  getAllProtocolDocuments, 
  getProtocolDocumentById, 
  getProtocolDocumentByProtocolId,
  createProtocolDocument, 
  updateProtocolDocument, 
  deleteProtocolDocument,
  getProtocolSections,
  createProtocolSection,
  createProtocolSections,
  updateProtocolSection,
  deleteProtocolSection,
  getProtocolSectionsByCategory 
} from './protocolRoutes';

// Helper function to format ZodError
function formatZodError(error: ZodError) {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
}

// Helper function to calculate due date based on priority
function calculateDueDate(priority: string): Date {
  const now = new Date();
  const daysToAdd = priority === 'Critical' ? 3 : 
                    priority === 'High' ? 5 : 
                    priority === 'Medium' ? 7 : 10;
  
  now.setDate(now.getDate() + daysToAdd);
  return now;
}

// Helper function to generate task ID
function generateTaskId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}_${timestamp}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server for the Express app and WebSockets
  const httpServer = createServer(app);
  
  // Real-time data quality monitoring removed per user request
  
  // Initialize resource profiles if they don't exist
  try {
    const { initResourceProfiles } = await import('./initResourceProfiles');
    await initResourceProfiles();
    console.log('Resource profiles initialized successfully');
  } catch (error) {
    console.error('Error initializing resource profiles:', error);
  }
  
  // Initialize EDC Audit data if it doesn't exist
  try {
    const { initEDCAuditData, initFormAuditData } = await import('./initAuditData');
    await initEDCAuditData();
    await initFormAuditData();
    console.log('EDC Audit data initialized successfully');
  } catch (error) {
    console.error('Error initializing EDC Audit data:', error);
  }
  
  // Initialize agent statuses if they don't exist
  try {
    await initializeAgentStatuses();
    console.log('Agent statuses initialized successfully');
  } catch (error) {
    console.error('Error initializing agent statuses:', error);
  }
  
  // put application routes here
  // prefix all routes with /api

  // User management routes
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', error: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to create user', error });
    }
  });
  
  // Trial routes
  app.get('/api/trials', async (_req: Request, res: Response) => {
    try {
      const trials = await storage.getAllTrials();
      res.json(trials);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch trials', error });
    }
  });

  app.post('/api/trials', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTrialSchema.parse(req.body);
      const trial = await storage.createTrial(validatedData);
      res.status(201).json(trial);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid trial data', error: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to create trial', error });
    }
  });
  
  app.get('/api/trials/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const trial = await storage.getTrial(id);
      
      if (!trial) {
        return res.status(404).json({ message: 'Trial not found' });
      }
      
      res.json(trial);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch trial', error });
    }
  });
  
  // Site routes
  app.get('/api/sites', async (_req: Request, res: Response) => {
    try {
      const sites = await storage.getAllSites();
      res.json(sites);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sites', error });
    }
  });
  
  app.get('/api/trials/:trialId/sites', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      const sites = await storage.getSitesByTrialId(trialId);
      res.json(sites);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sites for trial', error });
    }
  });
  
  app.get('/api/sites/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const site = await storage.getSite(id);
      
      if (!site) {
        return res.status(404).json({ message: 'Site not found' });
      }
      
      res.json(site);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch site', error });
    }
  });
  
  app.post('/api/sites', async (req: Request, res: Response) => {
    try {
      const siteData = req.body;
      console.log('Creating site with data:', siteData);
      const site = await storage.createSite(siteData);
      console.log('Created site:', site);
      res.status(201).json(site);
    } catch (error) {
      console.error('Error creating site:', error);
      res.status(500).json({ message: 'Failed to create site', error });
    }
  });

  // Contact routes (study team contacts)
  app.get('/api/trials/:trialId/contacts', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      // Use the resources as contacts since they represent the study team
      const resources = await storage.getResourcesByTrialId(trialId);
      
      // Map resources to the contact format expected by the client
      const contacts = resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        role: resource.role,
        organization: "Internal",
        email: resource.email,
        phone: resource.phone || "N/A"
      }));
      
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch contacts for trial', error });
    }
  });
  
  // Create a new contact (implemented as a resource)
  app.post('/api/trials/:trialId/contacts', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      
      // Validate contact data using resource schema
      const parsedData = insertResourceSchema.parse({
        ...req.body,
        trialId
      });
      
      // Create the resource
      const resource = await storage.createResource(parsedData);
      
      // Return the contact representation
      const contact = {
        id: resource.id,
        name: resource.name,
        role: resource.role,
        organization: "Internal",
        email: resource.email,
        phone: resource.phone || "N/A"
      };
      
      res.status(201).json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      if (error instanceof ZodError) {
        res.status(400).json({ message: 'Invalid contact data', errors: formatZodError(error) });
      } else {
        res.status(500).json({ message: 'Failed to create contact', error });
      }
    }
  });
  
  // Profile Management routes
  app.get('/api/riskprofiles/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
      const { entityType, entityId } = req.params;
      const profiles = await storage.getRiskProfilesByEntityType(entityType, parseInt(entityId));
      res.json(profiles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch risk profiles', error });
    }
  });

  // Get a specific profile by ID
  app.get('/api/riskprofiles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getRiskProfile(id);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch profile', error });
    }
  });

  // Create a new profile
  app.post('/api/riskprofiles', async (req: Request, res: Response) => {
    try {
      // Validate the incoming data
      const parseResult = insertRiskProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid profile data', errors: formatZodError(parseResult.error) });
      }
      
      const profile = await storage.createRiskProfile(parseResult.data);
      res.status(201).json(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(500).json({ message: 'Failed to create profile', error });
    }
  });

  // Update a profile
  app.patch('/api/riskprofiles/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const profile = await storage.getRiskProfile(id);
      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      const updatedProfile = await storage.updateRiskProfile(id, req.body);
      res.json(updatedProfile);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update profile', error });
    }
  });

  // Get all profiles by type
  app.get('/api/riskprofiles/type/:profileType', async (req: Request, res: Response) => {
    try {
      const { profileType } = req.params;
      console.log(`API received request for profile type: ${profileType}`);
      
      // Get all profiles from storage
      const allProfiles = Array.from((await storage.getAllRiskProfiles()) || []);
      
      // Case-insensitive filtering
      const filteredProfiles = allProfiles.filter(profile => 
        profile.profileType.toLowerCase() === profileType.toLowerCase()
      );
      
      console.log(`Found ${filteredProfiles.length} profiles of type ${profileType}`);
      return res.json(filteredProfiles);
    } catch (error) {
      console.error('Error fetching profiles by type:', error);
      res.status(500).json({ message: 'Failed to fetch profiles by type', error });
    }
  });
  
  // Signal Detection routes
  app.get('/api/signaldetections', async (_req: Request, res: Response) => {
    try {
      const detections = await storage.getAllSignalDetections();
      res.json(detections);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch signal detections', error });
    }
  });
  
  app.get('/api/trials/:trialId/signaldetections', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      const detections = await storage.getSignalDetectionsByTrialId(trialId);
      res.json(detections);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch signal detections for trial', error });
    }
  });
  
  app.get('/api/signaldetections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detection = await storage.getSignalDetection(id);
      
      if (!detection) {
        return res.status(404).json({ message: 'Signal detection not found' });
      }
      
      res.json(detection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch signal detection', error });
    }
  });
  
  app.post('/api/signaldetections', async (req: Request, res: Response) => {
    try {
      // Pre-process the request body to handle the date fields
      const requestData = { ...req.body };
      
      // Convert date strings to Date objects
      if (requestData.detectionDate && typeof requestData.detectionDate === 'string') {
        requestData.detectionDate = new Date(requestData.detectionDate);
      }
      
      if (requestData.dueDate && typeof requestData.dueDate === 'string') {
        requestData.dueDate = new Date(requestData.dueDate);
      }
      
      // Now validate the processed data
      const validatedData = insertSignalDetectionSchema.parse(requestData);
      
      // Calculate due date if not provided
      if (!validatedData.dueDate) {
        validatedData.dueDate = calculateDueDate(validatedData.priority);
      }
      
      // Generate detection ID if not provided
      if (!validatedData.detectionId) {
        const prefix = validatedData.priority === 'Critical' ? 'CRIT' : 
                      validatedData.priority === 'High' ? 'HIGH' : 
                      validatedData.priority === 'Medium' ? 'MED' : 'LOW';
        validatedData.detectionId = generateTaskId(prefix);
      }
      
      // Generate title based on observation if not provided
      if (!validatedData.title) {
        // Create a title based on the observation or data reference
        const observation = validatedData.observation || '';
        // Get the first 50 characters of the observation or use the default title
        validatedData.title = observation.length > 50 
          ? `${observation.substring(0, 50)}...` 
          : observation || `Signal Detection ${validatedData.detectionId}`;
      }
      
      // Set detection date to now if not provided
      if (!validatedData.detectionDate) {
        validatedData.detectionDate = new Date();
      }
      
      // Set a default signal type if not provided
      if (!validatedData.signalType) {
        // Determine signal type based on detection ID
        if (validatedData.detectionId?.startsWith('ST_Risk')) {
          validatedData.signalType = 'Site Risk';
        } else if (validatedData.detectionId?.startsWith('SF_Risk')) {
          validatedData.signalType = 'Safety Risk';
        } else if (validatedData.detectionId?.startsWith('PD_Risk')) {
          validatedData.signalType = 'PD Risk';
        } else if (validatedData.detectionId?.startsWith('LAB_Risk')) {
          validatedData.signalType = 'LAB Testing Risk';
        } else if (validatedData.detectionId?.startsWith('ENR_Risk')) {
          validatedData.signalType = 'Enrollment Risk';
        } else if (validatedData.detectionId?.startsWith('AE_Risk')) {
          validatedData.signalType = 'AE Risk';
        } else {
          validatedData.signalType = 'Site Risk'; // Default fallback
        }
      }
      
      const detection = await storage.createSignalDetection(validatedData);
      
      // Send email notification for new signal detection
      try {
        // Get trial information to include in the notification
        const trial = await storage.getTrial(validatedData.trialId);
        const trialId = trial ? trial.protocolId || `Trial ${validatedData.trialId}` : `Trial ${validatedData.trialId}`;
        
        // Prepare signal notification data
        const signalData: SignalNotificationData = {
          signalId: detection.id.toString(),
          title: detection.title,
          detectionDate: detection.detectionDate.toISOString(),
          priority: detection.priority,
          assignedTo: detection.assignedTo || 'Safety Specialist',
          description: detection.observation || 'New signal detected in clinical trial data',
          trialId: trialId,
          source: detection.dataReference || 'All Sources'
        };
        
        // Send notification asynchronously (don't await)
        sendSignalNotification(signalData).then(success => {
          if (success) {
            console.log(`Notification sent for signal detection ${detection.id}`);
          } else {
            console.warn(`Failed to send notification for signal detection ${detection.id}`);
          }
        }).catch(error => {
          console.error('Error sending signal notification:', error);
        });
      } catch (notificationError) {
        // Log the error but don't fail the request
        console.error('Error preparing signal notification:', notificationError);
      }
      
      res.status(201).json(detection);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Invalid signal detection data', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Failed to create signal detection', error });
    }
  });
  
  app.patch('/api/signaldetections/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const detection = await storage.getSignalDetection(id);
      
      if (!detection) {
        return res.status(404).json({ message: 'Signal detection not found' });
      }
      
      const updatedDetection = await storage.updateSignalDetection(id, req.body);
      res.json(updatedDetection);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update signal detection', error });
    }
  });
  
  // Task routes
  app.get('/api/tasks', async (req: Request, res: Response) => {
    try {
      const assignedTo = req.query.assignedTo as string;
      const status = req.query.status as string;
      const trialId = req.query.trialId ? parseInt(req.query.trialId as string) : null;
      
      console.log(`[API] Getting tasks with filters: assignedTo=${assignedTo}, status=${status}, trialId=${trialId}`);
      
      // Get all tasks
      let tasks = await storage.getAllTasks();
      
      // Apply filters
      if (assignedTo) {
        tasks = tasks.filter(task => task.assignedTo === assignedTo);
      }
      
      if (trialId) {
        console.log(`[API] Filtering tasks by trialId: ${trialId}`);
        tasks = tasks.filter(task => task.trialId === trialId);
      }
      
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
      
      // Fetch all trials to get study names
      const allTrials = await storage.getAllTrials();
      const trialsMap = new Map(allTrials.map(trial => [trial.id, trial]));
      
      // Enhance tasks with study names
      const tasksWithStudyNames = tasks.map(task => {
        const trial = trialsMap.get(task.trialId);
        return {
          ...task,
          studyName: trial ? trial.title : `Trial ${task.trialId}`
        };
      });
      
      res.json(tasksWithStudyNames);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks', error });
    }
  });
  
  app.get('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Get trial information to add study name
      const trial = await storage.getTrial(task.trialId);
      
      // Return task with study name
      res.json({
        ...task,
        studyName: trial ? trial.title : `Trial ${task.trialId}`
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch task', error });
    }
  });
  
  app.get('/api/trials/:trialId/tasks', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      const tasks = await storage.getTasksByTrialId(trialId);

      // Get trial information
      const trial = await storage.getTrial(trialId);
      
      // Add study name to each task
      const tasksWithStudyNames = tasks.map(task => ({
        ...task,
        studyName: trial ? trial.title : `Trial ${trialId}`
      }));
      
      res.json(tasksWithStudyNames);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch tasks for trial', error });
    }
  });
  
  app.post('/api/tasks', async (req: Request, res: Response) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      
      // Generate task ID if not provided
      if (!validatedData.taskId) {
        const prefix = validatedData.priority === 'Critical' ? 'CRIT' : 
                      validatedData.priority === 'High' ? 'HIGH' : 
                      validatedData.priority === 'Medium' ? 'MED' : 'LOW';
        validatedData.taskId = generateTaskId(prefix);
      }
      
      // Handle due date
      if (!validatedData.dueDate) {
        // Calculate due date based on priority if not provided
        validatedData.dueDate = calculateDueDate(validatedData.priority);
      } else if (typeof validatedData.dueDate === 'string') {
        // Convert string date to Date object 
        validatedData.dueDate = new Date(validatedData.dueDate);
      }
      
      const task = await storage.createTask(validatedData);
      
      // Send email notification for the new task
      try {
        // Get trial information for the notification
        const trial = await storage.getTrial(validatedData.trialId);
        const trialId = trial ? trial.protocolId || `Trial ${validatedData.trialId}` : `Trial ${validatedData.trialId}`;
        
        // Prepare task notification data
        const taskData: TaskNotificationData = {
          taskId: task.id.toString(),
          taskTitle: task.title,
          dueDate: (task.dueDate || new Date()).toISOString(),
          priority: task.priority,
          assignedRole: task.assignedTo || 'Clinical Operations Manager',
          description: task.description,
          trialId: trialId
        };
        
        // Create database notifications for relevant users
        try {
          // Create notifications in the database
          const notifications = await notificationService.createTaskNotifications(task.id);
          console.log(`Created ${notifications.length} notification(s) for task ${task.id}`);
        } catch (dbNotifError) {
          console.error('Error creating database notifications:', dbNotifError);
        }
        
        // Send email notification asynchronously (don't await)
        sendTaskNotification(taskData).then(success => {
          if (success) {
            console.log(`Email notification sent for task ${task.id}`);
          } else {
            console.warn(`Failed to send email notification for task ${task.id}`);
          }
        }).catch(error => {
          console.error('Error sending task email notification:', error);
        });
      } catch (notificationError) {
        // Log the error but don't fail the request
        console.error('Error preparing task notification:', notificationError);
      }
      
      // Get trial information to add study name to response
      const trial = await storage.getTrial(task.trialId);
      
      // Return task with study name
      res.status(201).json({
        ...task,
        studyName: trial ? trial.title : `Trial ${task.trialId}`
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Invalid task data', 
          errors: formatZodError(error) 
        });
      }
      console.error('Task creation error:', error);
      res.status(500).json({ message: 'Failed to create task', error });
    }
  });
  
  app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTask(id);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const updateData = { ...req.body };
      
      // Convert string date to Date object if present
      if (updateData.dueDate && typeof updateData.dueDate === 'string') {
        updateData.dueDate = new Date(updateData.dueDate);
      }
      
      // Check if task is being marked as "Responded"
      if (updateData.status === ExtendedTaskStatus.RESPONDED) {
        console.log(`===== TASK RESPONDED FLOW ===== Task ${id} is being marked as Responded, triggering Data Manager.AI workflow`);
        
        // First update the task status
        console.log(`===== TASK RESPONDED FLOW ===== Updating task ${id} status to RESPONDED in database`);
        const updatedTask = await storage.updateTask(id, updateData);
        console.log(`===== TASK RESPONDED FLOW ===== Task ${id} status updated successfully`);
        
        if (!updatedTask) {
          return res.status(404).json({ message: 'Task not found after update' });
        }
        
        // Then trigger the DM.AI workflow to check if issues are fixed
        // This will run asynchronously to avoid blocking the response
        try {
          console.log(`===== TASK RESPONDED FLOW ===== Importing handleTaskResponded function`);
          const { handleTaskResponded } = await import('./dataManagerWorkflow');
          console.log(`===== TASK RESPONDED FLOW ===== handleTaskResponded function imported successfully`);
          
          handleTaskResponded(id)
            .then(result => {
              console.log(`===== TASK RESPONDED FLOW ===== DM.AI workflow for task ${id} completed with result: ${result}`);
            })
            .catch(err => {
              console.error(`===== TASK RESPONDED FLOW ===== Error in DM.AI workflow for task ${id}:`, err);
            });
            
          console.log(`===== TASK RESPONDED FLOW ===== handleTaskResponded function called for task ${id}`);
        } catch (importError) {
          console.error(`===== TASK RESPONDED FLOW ===== Error importing or calling handleTaskResponded: ${importError}`);
        }
        
        console.log(`===== TASK RESPONDED FLOW ===== Returning response for task ${id}`);
        // Get trial info to include study name
        const trial = await storage.getTrial(updatedTask.trialId);
        return res.json({
          ...updatedTask,
          studyName: trial ? trial.title : `Trial ${updatedTask.trialId}`
        });
      }
      
      // For other status changes, just update the task normally
      const updatedTask = await storage.updateTask(id, updateData);
      
      if (!updatedTask) {
        return res.status(404).json({ message: 'Task not found after update' });
      }
      
      // Get trial info to include study name
      const trial = await storage.getTrial(updatedTask.trialId);
      res.json({
        ...updatedTask,
        studyName: trial ? trial.title : `Trial ${updatedTask.trialId}`
      });
    } catch (error) {
      console.error('Task update error:', error);
      res.status(500).json({ message: 'Failed to update task', error });
    }
  });
  
  // Generate notifications for a specific task
  app.post('/api/tasks/:id/notifications', async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }
      
      // Get the task
      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Create notifications for the task
      const notifications = await notificationService.createTaskNotifications(taskId);
      
      res.json({ 
        message: `Created ${notifications.length} notification(s) for task ${taskId}`,
        count: notifications.length
      });
    } catch (error) {
      console.error('Error creating task notifications:', error);
      res.status(500).json({ 
        error: 'Failed to create task notifications',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Task Comment routes
  app.get('/api/tasks/:taskId/comments', async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const fromNotification = req.query.from === 'notification' || req.query.forceOpen === 'true';
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // If request is coming from a notification click, add extra logging and aggressive handling
      if (fromNotification) {
        console.log(`[COMMENTS API] Comment request from notification for task ${taskId}, timestamp: ${req.query.t || 'none'}`);
        
        // For notification-originated requests, use multi-attempt direct query approach
        try {
          // Attempt 1: Initial direct query - bypassing any caching layers
          const comments1 = await storage.getTaskComments(taskId, true);
          console.log(`[COMMENTS API] First direct query fetched ${comments1.length} comments`);
          
          // If we got comments, return them immediately
          if (comments1.length > 0) {
            return res.json(comments1);
          }
          
          // Short delay for DB consistency
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Attempt 2: Try again with priority flag
          const comments2 = await storage.getTaskComments(taskId, true);
          console.log(`[COMMENTS API] Second direct query fetched ${comments2.length} comments`);
          
          // If we have comments now, return them
          if (comments2.length > 0) {
            return res.json(comments2);
          }
          
          // Additional 100ms delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Attempt 3: Final attempt with priority flag
          const comments3 = await storage.getTaskComments(taskId, true);
          console.log(`[COMMENTS API] Final attempt fetched ${comments3.length} comments`);
          
          // Return whatever we have now, even if empty
          return res.json(comments3);
        } catch (innerError) {
          console.error(`[COMMENTS API] Error in notification-based comment retrieval: ${innerError}`);
          // Fall through to standard retrieval as a last resort
        }
      }
      
      // Standard comment retrieval
      const comments = await storage.getTaskComments(taskId);
      res.json(comments);
    } catch (error) {
      console.error(`[COMMENTS API] Error fetching comments for task ${req.params.taskId}:`, error);
      res.status(500).json({ message: 'Failed to fetch task comments', error: String(error) });
    }
  });
  
  app.post('/api/tasks/:taskId/comments', async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      const validatedData = insertTaskCommentSchema.parse({
        ...req.body,
        taskId: taskId
      });
      
      const comment = await storage.createTaskComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: 'Invalid comment data', error: formatZodError(error) });
      }
      res.status(500).json({ message: 'Failed to create task comment', error });
    }
  });
  
  app.delete('/api/tasks/comments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTaskComment(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Comment not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete comment', error });
    }
  });
  
  // Risk Threshold routes
  app.get('/api/trials/:trialId/thresholds', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      const thresholds = await storage.getRiskThresholdsByTrialId(trialId);
      res.json(thresholds);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch risk thresholds', error });
    }
  });
  
  app.post('/api/thresholds', async (req: Request, res: Response) => {
    try {
      const validatedData = insertRiskThresholdSchema.parse(req.body);
      const threshold = await storage.createRiskThreshold(validatedData);
      res.status(201).json(threshold);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Invalid risk threshold data', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Failed to create risk threshold', error });
    }
  });
  
  app.patch('/api/thresholds/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // First check if the threshold exists
      const thresholds = await storage.getRiskThresholdsByTrialId(id);
      if (!thresholds || thresholds.length === 0) {
        return res.status(404).json({ message: 'Risk threshold not found' });
      }
      
      const updatedThreshold = await storage.updateRiskThreshold(id, req.body);
      res.json(updatedThreshold);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update risk threshold', error });
    }
  });
  
  // Advanced AI-based detection for clinical trial risk signals
  app.post('/api/ai/detectsignals', async (req: Request, res: Response) => {
    try {
      // Check if OpenAI is available and prefer it
      if (process.env.OPENAI_API_KEY) {
        // Use OpenAI module directly
        const { analyzeTrialData } = await import('./openai');
        
        // Call the OpenAI analysis function
        return await analyzeTrialData(req, res);
      } else {
        // Fall back to the rule-based detection in the AI module
        const { detectSignals } = await import('./ai');
        
        // Pass the request to the dedicated signal detection handler
        return detectSignals(req, res);
      }
    } catch (error) {
      console.error('Error processing signal detection request:', error);
      return res.status(500).json({ 
        error: 'Error processing detection request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Data Management Agent for reviewing consistency across data sources
  app.post('/api/ai/reviewdata', async (req: Request, res: Response) => {
    try {
      // Check if OpenAI is available and prefer it
      if (process.env.OPENAI_API_KEY) {
        // Use OpenAI module directly
        const { analyzeDataConsistency } = await import('./openai');
        
        // Call the OpenAI analysis function
        return await analyzeDataConsistency(req, res);
      } else {
        // Fall back to the rule-based detection in the AI module
        const { reviewDataAcrossSources } = await import('./ai');
        
        // Pass the request to the dedicated data review handler
        return reviewDataAcrossSources(req, res);
      }
    } catch (error) {
      console.error('Error processing data review request:', error);
      return res.status(500).json({ 
        error: 'Error processing data review request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Data sources endpoint
  app.get('/api/data-sources', async (req: Request, res: Response) => {
    try {
      const trialId = req.query.trialId ? parseInt(req.query.trialId as string) : undefined;
      
      // Mock data sources with varying values based on trial ID
      const multiplier = trialId === 2 ? 0.7 : trialId === 3 ? 1.3 : 1.0;
      
      const sources = [
        {
          id: 1,
          name: "Medidata Rave EDC",
          type: "EDC",
          queriesTotal: Math.round(245 * multiplier),
          queriesOpen: Math.round(87 * multiplier),
          queriesOverdue: Math.round(12 * multiplier),
          lastSync: new Date(Date.now() - 30 * 60000).toISOString(), // 30 min ago
          status: 'connected'
        },
        {
          id: 2,
          name: "Labcorp LIMS",
          type: "LAB",
          queriesTotal: Math.round(118 * multiplier),
          queriesOpen: Math.round(42 * multiplier),
          queriesOverdue: Math.round(5 * multiplier),
          lastSync: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
          status: 'connected'
        },
        {
          id: 3,
          name: "Calyx Imaging",
          type: "IMAGING",
          queriesTotal: Math.round(67 * multiplier),
          queriesOpen: Math.round(23 * multiplier),
          queriesOverdue: Math.round(4 * multiplier),
          lastSync: new Date(Date.now() - 24 * 60 * 60000).toISOString(), // 1 day ago
          status: trialId === 3 ? 'error' : 'connected'
        },
        {
          id: 4,
          name: "Cenduit IRT",
          type: "IRT",
          queriesTotal: Math.round(85 * multiplier),
          queriesOpen: Math.round(31 * multiplier),
          queriesOverdue: Math.round(8 * multiplier),
          lastSync: new Date(Date.now() - 45 * 60000).toISOString(), // 45 min ago
          status: 'connected'
        },
        {
          id: 5,
          name: "Veeva Vault CTMS",
          type: "CTMS",
          queriesTotal: Math.round(56 * multiplier),
          queriesOpen: Math.round(12 * multiplier),
          queriesOverdue: Math.round(1 * multiplier),
          lastSync: new Date(Date.now() - 180 * 60000).toISOString(), // 3 hours ago
          status: trialId === 2 ? 'disconnected' : 'connected'
        },
        {
          id: 6,
          name: "Medidata Patient Cloud eCOA",
          type: "eCOA",
          queriesTotal: Math.round(132 * multiplier),
          queriesOpen: Math.round(54 * multiplier),
          queriesOverdue: Math.round(7 * multiplier),
          lastSync: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
          status: 'connected'
        }
      ];
      
      return res.json(sources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      return res.status(500).json({ 
        error: 'Error fetching data sources',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Data queries endpoint
  app.get('/api/data-queries', async (req: Request, res: Response) => {
    try {
      const trialId = req.query.trialId ? parseInt(req.query.trialId as string) : undefined;
      const status = req.query.status as string | undefined;
      
      // Base queries that apply to all trials
      const baseQueries = [
        {
          id: "EDC-Q1023",
          source: "Medidata Rave EDC",
          sourceType: "EDC",
          subject: "S-001-1234",
          site: "Site 123",
          queryText: "Missing value for vital signs at Visit 3",
          status: 'open',
          priority: 'high',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60000).toISOString(),
          assignedTo: "John Smith",
          form: "Vital Signs",
          visit: "Visit 3"
        },
        {
          id: "LAB-Q452",
          source: "Labcorp LIMS",
          sourceType: "LAB",
          subject: "S-001-2345",
          site: "Site 123",
          queryText: "Lab sample hemolyzed - requires recollection",
          status: 'open',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60000).toISOString(),
          assignedTo: "Mary Johnson",
          visit: "Visit 2"
        }
      ];
      
      // Trial-specific queries
      let trialQueries: any[] = [];
      
      if (!trialId || trialId === 1) {
        trialQueries = [
          {
            id: "IMG-Q278",
            source: "Calyx Imaging",
            sourceType: "IMAGING",
            subject: "S-002-3456",
            site: "Site 456",
            queryText: "Image quality insufficient for evaluation",
            status: 'answered',
            priority: 'medium',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Robert Chen",
            visit: "Visit 4"
          },
          {
            id: "IRT-Q189",
            source: "Cenduit IRT",
            sourceType: "IRT",
            subject: "S-003-4567",
            site: "Site 789",
            queryText: "Medication dispensing discrepancy",
            status: 'overdue',
            priority: 'critical',
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Sarah Williams",
            visit: "Visit 2"
          },
          {
            id: "CTMS-Q067",
            source: "Veeva Vault CTMS",
            sourceType: "CTMS",
            subject: "S-001-5678",
            site: "Site 123",
            queryText: "Visit date discrepancy between CTMS and EDC",
            status: 'closed',
            priority: 'medium',
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() - 8 * 24 * 60 * 60000).toISOString(),
            assignedTo: "David Thompson",
            visit: "Visit 1"
          },
          {
            id: "eCOA-Q324",
            source: "Medidata Patient Cloud eCOA",
            sourceType: "eCOA",
            subject: "S-002-6789",
            site: "Site 456",
            queryText: "Patient diary entries missing for 3 consecutive days",
            status: 'open',
            priority: 'high',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Lisa Anderson",
            visit: "N/A"
          }
        ];
      } else if (trialId === 2) {
        trialQueries = [
          {
            id: "EDC-Q2054",
            source: "Medidata Rave EDC",
            sourceType: "EDC",
            subject: "S-002-2276",
            site: "Site 235",
            queryText: "Oncology staging information incomplete",
            status: 'overdue',
            priority: 'critical',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
            assignedTo: "James Wilson",
            form: "Disease Assessment",
            visit: "Baseline"
          },
          {
            id: "LAB-Q673",
            source: "Labcorp LIMS",
            sourceType: "LAB",
            subject: "S-002-3392",
            site: "Site 235",
            queryText: "Missing hematology results from screening visit",
            status: 'answered',
            priority: 'high',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Emma Rodriguez",
            visit: "Screening"
          }
        ];
      } else if (trialId === 3) {
        trialQueries = [
          {
            id: "ECG-Q117",
            source: "Calyx Cardiac",
            sourceType: "ECG",
            subject: "S-003-4582",
            site: "Site 346",
            queryText: "ECG reading shows prolonged QT interval requiring follow-up",
            status: 'open',
            priority: 'critical',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() + 1 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Michael Zhang",
            visit: "Week 4"
          },
          {
            id: "ECG-Q129",
            source: "Calyx Cardiac",
            sourceType: "ECG",
            subject: "S-003-4596",
            site: "Site 346",
            queryText: "Missing triplicate ECG at 2-hour post-dose timepoint",
            status: 'open',
            priority: 'high',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Michael Zhang",
            visit: "Week 8"
          },
          {
            id: "CTMS-Q108",
            source: "Veeva Vault CTMS",
            sourceType: "CTMS",
            subject: "S-003-4612",
            site: "Site 412",
            queryText: "Visit window violation - patient seen 4 days outside protocol window",
            status: 'answered',
            priority: 'medium',
            createdAt: new Date(Date.now() - 6 * 24 * 60 * 60000).toISOString(),
            dueDate: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(),
            assignedTo: "Sophia Patel",
            visit: "Week 12"
          }
        ];
      }
      
      // Combine base queries with trial-specific queries
      let queries = [...baseQueries];
      
      // Only add trial-specific queries if not filtering by trial 
      // or if filtering by the specific trial they belong to
      if (!trialId || trialId === 1 || trialId === 2 || trialId === 3) {
        queries = [...queries, ...trialQueries];
      }
      
      // Filter queries based on status if specified
      if (status && status !== "all") {
        queries = queries.filter(q => q.status === status);
      }
      
      return res.json(queries);
    } catch (error) {
      console.error('Error fetching data queries:', error);
      return res.status(500).json({ 
        error: 'Error fetching data queries',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Vendor routes
  app.get('/api/vendors', async (_req: Request, res: Response) => {
    try {
      const vendors = await storage.getAllVendors();
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendors', error });
    }
  });

  app.get('/api/vendors/type/:type', async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      const vendors = await storage.getVendorsByType(type);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendors by type', error });
    }
  });

  app.get('/api/vendors/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      res.json(vendor);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendor', error });
    }
  });
  
  // Trial-specific vendors endpoint (mock for now, would need a real relationship in the database)
  app.get('/api/trials/:trialId/vendors', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      // In a real implementation, we would fetch vendors specifically associated with this trial
      // For now, return all vendors as a demonstration
      const vendors = await storage.getAllVendors();
      
      // Add custom fields for trial-specific information
      const trialVendors = vendors.map(vendor => ({
        ...vendor,
        trialRole: vendor.type, // Would be specific to this trial in a real implementation
        contractStatus: "Active", // Would be specific to this trial-vendor relationship
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
        endDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000).toISOString(), // 275 days in future
        services: [vendor.type] // Services provided specifically for this trial
      }));
      
      res.json(trialVendors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendors for trial', error });
    }
  });

  app.post('/api/vendors', async (req: Request, res: Response) => {
    try {
      const validatedData = insertVendorSchema.parse(req.body);
      const vendor = await storage.createVendor(validatedData);
      res.status(201).json(vendor);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Invalid vendor data', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Failed to create vendor', error });
    }
  });

  app.patch('/api/vendors/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vendor = await storage.getVendor(id);
      
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      const updatedVendor = await storage.updateVendor(id, req.body);
      res.json(updatedVendor);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update vendor', error });
    }
  });

  // Resource routes
  app.get('/api/resources', async (_req: Request, res: Response) => {
    try {
      const resources = await storage.getAllResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resources', error });
    }
  });

  app.get('/api/trials/:trialId/resources', async (req: Request, res: Response) => {
    try {
      const trialId = parseInt(req.params.trialId);
      const resources = await storage.getResourcesByTrialId(trialId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resources for trial', error });
    }
  });

  app.get('/api/resources/role/:role', async (req: Request, res: Response) => {
    try {
      const role = req.params.role;
      const resources = await storage.getResourcesByRole(role);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resources by role', error });
    }
  });

  app.get('/api/resources/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getResource(id);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      res.json(resource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch resource', error });
    }
  });

  app.post('/api/resources', async (req: Request, res: Response) => {
    try {
      const validatedData = insertResourceSchema.parse(req.body);
      const resource = await storage.createResource(validatedData);
      res.status(201).json(resource);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: 'Invalid resource data', 
          errors: formatZodError(error) 
        });
      }
      res.status(500).json({ message: 'Failed to create resource', error });
    }
  });

  app.patch('/api/resources/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const resource = await storage.getResource(id);
      
      if (!resource) {
        return res.status(404).json({ message: 'Resource not found' });
      }
      
      const updatedResource = await storage.updateResource(id, req.body);
      res.json(updatedResource);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update resource', error });
    }
  });

  // OpenAI integration routes
  app.post('/api/openai/analyze', async (req: Request, res: Response) => {
    try {
      // Import the analyzeTrialData function from the openai module
      const { analyzeTrialData } = await import('./openai');
      return await analyzeTrialData(req, res);
    } catch (error) {
      console.error("Error analyzing trial data with OpenAI:", error);
      return res.status(500).json({ 
        error: 'Failed to analyze trial data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/openai/consistency', async (req: Request, res: Response) => {
    try {
      // Import the analyzeDataConsistency function from the openai module
      const { analyzeDataConsistency } = await import('./openai');
      return await analyzeDataConsistency(req, res);
    } catch (error) {
      console.error("Error analyzing data consistency with OpenAI:", error);
      return res.status(500).json({ 
        error: 'Failed to analyze data consistency',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  app.post('/api/openai/chat', async (req: Request, res: Response) => {
    try {
      // Import the aiChatAssistant function from the openai module
      const { aiChatAssistant } = await import('./openai');
      return await aiChatAssistant(req, res);
    } catch (error) {
      console.error("Error with AI chat assistant:", error);
      return res.status(500).json({ 
        error: 'Failed to process your question',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Process protocol documents with OpenAI
  app.post('/api/openai/process-protocol', async (req: Request, res: Response) => {
    try {
      // Import the processProtocolDocument function from the protocol extractor module
      const { processProtocolDocument } = await import('./openai-protocol-extractor');
      return await processProtocolDocument(req, res);
    } catch (error) {
      console.error("Error processing protocol document:", error);
      return res.status(500).json({ 
        error: 'Failed to process protocol document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Vector Database Routes
  // List all collections
  app.get('/api/vector/collections', async (_req: Request, res: Response) => {
    try {
      const collections = vectorDb.listCollections();
      res.json({ collections });
    } catch (error) {
      console.error('Error listing vector collections:', error);
      res.status(500).json({ 
        error: 'Failed to list vector collections',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create a new collection
  app.post('/api/vector/collections', async (req: Request, res: Response) => {
    try {
      console.log('Create collection request received:', req.body);
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        console.log('Invalid collection name:', req.body);
        return res.status(400).json({ error: 'Collection name is required' });
      }
      
      vectorDb.createCollection(name);
      console.log('Collection created successfully:', name);
      res.status(201).json({ message: `Collection '${name}' created successfully` });
    } catch (error) {
      console.error('Error creating vector collection:', error);
      res.status(500).json({ 
        error: 'Failed to create vector collection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete a collection
  app.delete('/api/vector/collections/:name', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const success = vectorDb.deleteCollection(name);
      
      if (!success) {
        return res.status(404).json({ error: `Collection '${name}' not found` });
      }
      
      res.status(200).json({ message: `Collection '${name}' deleted successfully` });
    } catch (error) {
      console.error('Error deleting vector collection:', error);
      res.status(500).json({ 
        error: 'Failed to delete vector collection',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Count documents in a collection
  app.get('/api/vector/collections/:name/count', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const count = await vectorDb.count(name);
      res.json({ count });
    } catch (error) {
      console.error('Error counting vector documents:', error);
      res.status(500).json({ 
        error: 'Failed to count vector documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add documents to a collection
  app.post('/api/vector/collections/:name/documents', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { documents } = req.body;
      
      if (!Array.isArray(documents)) {
        return res.status(400).json({ error: 'Documents must be an array' });
      }
      
      const ids = await vectorDb.upsert(name, documents);
      res.status(201).json({ ids });
    } catch (error) {
      console.error('Error adding vector documents:', error);
      res.status(500).json({ 
        error: 'Failed to add vector documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Search documents in a collection
  app.post('/api/vector/collections/:name/search', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { query, topK, filter } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }
      
      const results = await vectorDb.query(name, query, { topK, filter });
      res.json({ results });
    } catch (error) {
      console.error('Error searching vector documents:', error);
      res.status(500).json({ 
        error: 'Failed to search vector documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get a specific document by ID
  app.get('/api/vector/documents/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const document = await vectorDb.get(id);
      
      if (!document) {
        return res.status(404).json({ error: `Document with ID '${id}' not found` });
      }
      
      res.json(document);
    } catch (error) {
      console.error('Error fetching vector document:', error);
      res.status(500).json({ 
        error: 'Failed to fetch vector document',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete documents from a collection
  app.delete('/api/vector/collections/:name/documents', async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const { ids } = req.body;
      
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'IDs must be an array' });
      }
      
      const deletedIds = await vectorDb.delete(name, ids);
      res.json({ deletedIds });
    } catch (error) {
      console.error('Error deleting vector documents:', error);
      res.status(500).json({ 
        error: 'Failed to delete vector documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // RAG API Endpoints

  // RAG Query endpoint - Process a query using RAG methodology
  app.post('/api/rag/query', async (req: Request, res: Response) => {
    try {
      const options: RAGQueryOptions = req.body;
      
      // Validate required fields
      if (!options.collectionName || !options.query) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Both collectionName and query are required' 
        });
      }
      
      const result = await rag.query(options);
      res.json(result);
    } catch (error) {
      console.error('Error processing RAG query:', error);
      res.status(500).json({ 
        error: 'Failed to process RAG query',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Ingest documents into the RAG system
  app.post('/api/rag/ingest', async (req: Request, res: Response) => {
    try {
      const { collectionName, documents } = req.body;
      
      if (!collectionName || !Array.isArray(documents)) {
        return res.status(400).json({ 
          error: 'Invalid request',
          message: 'collectionName and documents array are required' 
        });
      }
      
      const ids = await rag.ingestDocuments(collectionName, documents);
      res.json({ success: true, ingested: ids.length, ids });
    } catch (error) {
      console.error('Error ingesting documents:', error);
      res.status(500).json({ 
        error: 'Failed to ingest documents',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Import trial data into the RAG system
  app.post('/api/rag/import-trial-data', async (req: Request, res: Response) => {
    try {
      const { studyIds } = req.body;
      
      // Convert studyIds to numbers if they're not already
      const numericStudyIds = Array.isArray(studyIds) 
        ? studyIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id)
        : undefined;  // Use default if not provided
      
      const result = await importTrialDataToRAG(numericStudyIds);
      res.json(result);
    } catch (error) {
      console.error('Error importing trial data:', error);
      res.status(500).json({ 
        error: 'Failed to import trial data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get available RAG collections
  app.get('/api/rag/collections', (_req: Request, res: Response) => {
    try {
      const collections = rag.listCollections();
      res.json({ collections });
    } catch (error) {
      console.error('Error listing RAG collections:', error);
      res.status(500).json({ 
        error: 'Failed to list RAG collections',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Agent Workflow Management API endpoints
  
  // Get all agent workflows
  app.get('/api/agent-workflows', async (req: Request, res: Response) => {
    try {
      const aiComponent = req.query.aiComponent as string;
      console.log(`GET /api/agent-workflows called with aiComponent=${aiComponent || 'none'}`);
      const workflows = await storage.getAgentWorkflows(aiComponent);
      console.log(`Retrieved ${workflows.length} workflows:`, JSON.stringify(workflows));
      res.json(workflows);
    } catch (error) {
      console.error('Error getting agent workflows:', error);
      res.status(500).json({
        error: 'Failed to get agent workflows',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get a specific agent workflow
  app.get('/api/agent-workflows/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const workflow = await storage.getAgentWorkflow(id);
      
      if (!workflow) {
        return res.status(404).json({ error: 'Agent workflow not found' });
      }
      
      res.json(workflow);
    } catch (error) {
      console.error('Error getting agent workflow:', error);
      res.status(500).json({
        error: 'Failed to get agent workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Create a new agent workflow
  app.post('/api/agent-workflows', async (req: Request, res: Response) => {
    try {
      console.log('Creating agent workflow, received data:', JSON.stringify(req.body));
      const workflow = insertAgentWorkflowSchema.parse(req.body);
      console.log('Parsed workflow data:', JSON.stringify(workflow));
      
      // Check the agentWorkflows map size before creating new workflow
      const beforeCount = (await storage.getAgentWorkflows()).length;
      console.log(`Number of workflows before creation: ${beforeCount}`);
      
      const result = await storage.createAgentWorkflow(workflow);
      console.log('Created workflow successfully:', JSON.stringify(result));
      
      // Check the agentWorkflows map size after creating the workflow
      const afterCount = (await storage.getAgentWorkflows()).length;
      console.log(`Number of workflows after creation: ${afterCount}`);
      
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('Zod validation error:', error.errors);
        return res.status(400).json({ 
          error: 'Invalid agent workflow data', 
          details: formatZodError(error) 
        });
      }
      
      console.error('Error creating agent workflow:', error);
      res.status(500).json({
        error: 'Failed to create agent workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Update an agent workflow
  app.patch('/api/agent-workflows/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const result = await storage.updateAgentWorkflow(id, updates);
      
      if (!result) {
        return res.status(404).json({ error: 'Agent workflow not found' });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error updating agent workflow:', error);
      res.status(500).json({
        error: 'Failed to update agent workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Delete an agent workflow
  app.delete('/api/agent-workflows/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteAgentWorkflow(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Agent workflow not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting agent workflow:', error);
      res.status(500).json({
        error: 'Failed to delete agent workflow',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Initialize agent status data if needed
  try {
    await initializeAgentStatuses();
    console.log('Agent statuses initialized successfully');
  } catch (error) {
    console.error('Error initializing agent statuses:', error);
  }
  
  // Agent Status API routes
  app.get('/api/agent-status', getAgentStatuses);
  app.get('/api/agent-status/trial/:trialId', getAgentStatusesByTrial);
  app.get('/api/agent-status/:agentType', getAgentStatusByType);
  app.get('/api/agent-status/:agentType/trial/:trialId', getAgentStatusByType);
  app.post('/api/agent-status', updateAgentStatus);
  
  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const userId = req.session.user.id;
      const { 
        limit = '50', 
        offset = '0', 
        includeRead = 'false',
        types
      } = req.query;
      
      // Parse query parameters
      const options = {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
        includeRead: includeRead === 'true',
        types: types ? (Array.isArray(types) ? types as string[] : [types as string]) : undefined
      };
      
      const notifications = await notificationService.getUserNotifications(userId, options);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications', error });
    }
  });
  
  app.get('/api/notifications/count', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const userId = req.session.user.id;
      const count = await notificationService.countUnreadNotifications(userId);
      res.json({ count });
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      res.status(500).json({ message: 'Failed to count notifications', error });
    }
  });
  
  app.post('/api/notifications', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      // Validate notification data
      const validatedData = insertNotificationSchema.parse({
        ...req.body,
        userId: req.session.user.id
      });
      
      const notification = await notificationService.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid notification data', 
          errors: formatZodError(error) 
        });
      }
      
      res.status(500).json({ message: 'Failed to create notification', error });
    }
  });
  
  app.post('/api/notifications/mark-read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const { ids } = req.body;
      console.log(`Received mark-read request for IDs: ${JSON.stringify(ids)} from user ${req.session.user.id}`);
      
      if (!Array.isArray(ids)) {
        console.log(`Invalid notification IDs format: ${typeof ids}`);
        return res.status(400).json({ message: 'Invalid notification IDs' });
      }
      
      const count = await notificationService.markNotificationsAsRead(ids, req.session.user.id);
      console.log(`Successfully marked ${count} notifications as read for user ${req.session.user.id}`);
      res.json({ count });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark notifications as read', error });
    }
  });
  
  app.post('/api/notifications/mark-all-read', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const count = await notificationService.markAllNotificationsAsRead(req.session.user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read', error });
    }
  });
  
  app.delete('/api/notifications/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
      }
      
      const success = await notificationService.deleteNotification(id, req.session.user.id);
      
      if (!success) {
        return res.status(404).json({ message: 'Notification not found or already deleted' });
      }
      
      res.status(200).json({ message: 'Notification deleted successfully' });
    }
    catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification', error });
    }
  });
  
  // Domain data routes
  
  // Manual trigger for domain data validation - useful for debugging and maintenance
  app.post('/api/domain-data/validate', async (req: Request, res: Response) => {
    try {
      const { trialId, domain, source, recordId } = req.body;
      
      if (!trialId || !domain || !source) {
        return res.status(400).json({ message: 'Missing required parameters: trialId, domain, and source are required' });
      }
      
      console.log(`[API] Manually triggering domain data validation for trial=${trialId}, domain=${domain}, source=${source}, record=${recordId || 'all'}`);
      
      // If a specific record ID is provided, only validate that record
      const recordIds = recordId ? [recordId] : undefined;
      
      // Call analyzeDomainData directly - this is the same function used by the middleware
      await analyzeDomainData(parseInt(trialId), domain, source, recordIds);
      
      return res.status(200).json({
        message: 'Domain data validation triggered successfully',
        details: {
          trialId,
          domain,
          source,
          recordId: recordId || 'all records'
        }
      });
    } catch (error) {
      console.error('[API] Error triggering domain data validation:', error);
      return res.status(500).json({ message: 'Failed to trigger domain data validation', error });
    }
  });
  
  // Domain data CRUD routes
  app.post('/api/domain-data', trackDomainDataChanges, storeDomainData);
  app.post('/api/domain-source', storeDomainSource);
  app.get('/api/domain-data', getDomainRecords);
  app.get('/api/domain-sources/:trialId/:domain', getDomainSources);
  app.get('/api/trial-domains/:trialId', getTrialDomains);
  app.get('/api/trial-domain-sources/:trialId/:domain', getTrialDomainSources);
  
  // New CRUD operations for individual domain records with data change tracking
  // Add the trackDomainDataChanges middleware to track changes and trigger workflows
  app.post('/api/domain-records', trackDomainDataChanges, addDomainRecord);
  app.get('/api/domain-records/:id', getDomainRecordById);
  app.put('/api/domain-records/:id', trackDomainDataChanges, updateDomainRecord);
  app.delete('/api/domain-records/:id', deleteDomainRecord);
  
  // Protocol Digitization.AI endpoint for processing protocol documents
  app.post('/api/protocols/process-document', isAuthenticated, processProtocolDocument);
  
  // DataManager.AI workflow endpoint to manually trigger domain data analysis
  app.post('/api/domain-data/analyze', async (req: Request, res: Response) => {
    try {
      const { trialId, domain, source } = req.body;
      
      if (!trialId || !domain || !source) {
        return res.status(400).json({ message: 'Missing required parameters: trialId, domain, source' });
      }
      
      console.log(`Manually triggering analysis for trial ${trialId}, domain ${domain}, source ${source}`);
      
      // Import the analyzeDomainData function to avoid circular dependencies
      const { analyzeDomainData } = await import('./dataManagerWorkflow');
      
      // Call the analysis function
      await analyzeDomainData(Number(trialId), domain, source);
      
      return res.status(200).json({ message: `Analysis triggered for ${domain}/${source} in trial ${trialId}` });
    } catch (error) {
      console.error('Error triggering domain data analysis:', error);
      return res.status(500).json({ message: 'Error triggering analysis', error });
    }
  });

  // Protocol Digitization API routes
  app.get('/api/protocols', isAuthenticated, getAllProtocolDocuments);
  app.get('/api/protocols/:id', isAuthenticated, getProtocolDocumentById);
  app.get('/api/protocols/byProtocolId/:protocolId', isAuthenticated, getProtocolDocumentByProtocolId);
  app.post('/api/protocols', isAuthenticated, createProtocolDocument);
  app.patch('/api/protocols/:id', isAuthenticated, updateProtocolDocument);
  app.delete('/api/protocols/:id', isAuthenticated, deleteProtocolDocument);
  
  // Protocol Section routes
  app.get('/api/protocols/:documentId/sections', isAuthenticated, getProtocolSections);
  app.post('/api/protocols/:documentId/sections', isAuthenticated, createProtocolSections);
  app.post('/api/protocols/sections', isAuthenticated, createProtocolSection);
  app.patch('/api/protocols/sections/:id', isAuthenticated, updateProtocolSection);
  app.delete('/api/protocols/sections/:id', isAuthenticated, deleteProtocolSection);
  app.get('/api/protocols/:documentId/sections/category/:category', isAuthenticated, getProtocolSectionsByCategory);

  // Notification Settings routes
  app.get('/api/notification-settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const userId = req.session.user.id;
      const settings = await notificationService.getUserNotificationSettings(userId);
      
      if (!settings) {
        // Create default settings if they don't exist
        const defaultSettings = {
          userId,
          emailNotifications: true,
          pushNotifications: true,
          criticalOnly: false
        };
        
        const createdSettings = await notificationService.createNotificationSettings(defaultSettings);
        return res.json(createdSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error getting notification settings:', error);
      res.status(500).json({ message: 'Failed to get notification settings', error });
    }
  });
  
  app.patch('/api/notification-settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user?.id) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      
      const userId = req.session.user.id;
      const updatedSettings = await notificationService.updateNotificationSettings(userId, req.body);
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ message: 'Failed to update notification settings', error });
    }
  });

  // API route to fix EDC Data Manager notifications
  app.get('/api/fix-notifications', async (_req: Request, res: Response) => {
    try {
      const { fixEdcDataManagerNotifications } = await import('./fix-notifications');
      await fixEdcDataManagerNotifications();
      res.json({ 
        success: true, 
        message: 'EDC Data Manager notifications updated' 
      });
    } catch (error) {
      console.error('Error fixing notifications:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to fix notifications', 
        error: (error as Error).message 
      });
    }
  });

  // Debugging endpoint for testing task creation with trial 3
  app.get('/api/debug/create-test-task', async (_req: Request, res: Response) => {
    try {
      console.log("[API] Debug endpoint called to create a test task for trial 3");
      
      // Hardcode values for testing
      const trialId = 3;
      const domain = "LB";
      const source = "EDC";
      
      // Get the trial information
      const trial = await storage.getTrial(trialId);
      if (!trial) {
        return res.status(404).json({ message: 'Trial not found' });
      }
      
      // Create a test discrepancy
      const testDiscrepancy = {
        recordId: `TEST_${Date.now()}`,
        type: 'test_discrepancy',
        description: 'This is a test discrepancy created through the debug endpoint',
        severity: 'Medium',
        recommendedAction: 'This is a test task. Please review and mark as completed.'
      };
      
      // Import directly to avoid circular dependency issues
      const { createDiscrepancySignalAndTask } = await import('./dataManagerWorkflow');
      const { updateAgentRunInfo } = await import('./agentStatus');
      
      // Create a signal and task for this discrepancy
      await createDiscrepancySignalAndTask(testDiscrepancy, trial, domain, source);
      
      // Update agent statuses
      await updateAgentRunInfo('DataQuality', 1, 1, trialId);
      await updateAgentRunInfo('TaskManager', 1, 0, trialId);
      
      return res.status(200).json({
        message: 'Test task created successfully',
        details: {
          trialId,
          domain,
          source,
          discrepancy: testDiscrepancy
        }
      });
    } catch (error) {
      console.error('[API] Error creating test task:', error);
      return res.status(500).json({ message: 'Failed to create test task', error });
    }
  });

  return httpServer;
}
