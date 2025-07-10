import { 
  users, type User, type InsertUser,
  trials, type Trial, type InsertTrial,
  sites, type Site, type InsertSite,
  patients, type Patient, type InsertPatient,
  vendors, type Vendor, type InsertVendor,
  resources, type Resource, type InsertResource,
  signalDetections, type SignalDetection, type InsertSignalDetection,
  tasks, type Task, type InsertTask,
  riskProfiles, type RiskProfile, type InsertRiskProfile,
  riskThresholds, type RiskThreshold, type InsertRiskThreshold,
  taskComments, type TaskComment, type InsertTaskComment,
  agentWorkflows, type AgentWorkflow, type InsertAgentWorkflow,
  domainSources, type DomainSource,
  domainData, type DomainData,
  notifications, type Notification, type InsertNotification,
  activityLogs, type ActivityLog, type InsertActivityLog,
  TaskStatus, ExtendedTaskStatus, TaskPriority, EntityType, ProfileType, AgentType, WorkflowExecutionMode
} from "@shared/schema";
import { db } from "./db";
import { and, eq, gt, gte, like, lt, lte, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserEmailByUsername(username: string): Promise<string | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trials
  getAllTrials(): Promise<Trial[]>;
  getTrial(id: number): Promise<Trial | undefined>;
  getTrialByProtocolId(protocolId: string): Promise<Trial | undefined>;
  createTrial(trial: InsertTrial): Promise<Trial>;
  
  // Sites
  getAllSites(): Promise<Site[]>;
  getSitesByTrialId(trialId: number): Promise<Site[]>;
  getSite(id: number): Promise<Site | undefined>;
  getSiteBySiteId(siteId: string): Promise<Site | undefined>;
  createSite(site: InsertSite): Promise<Site>;
  
  // Patients
  getPatientsBySiteId(siteId: number): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  
  // Vendors
  getAllVendors(): Promise<Vendor[]>;
  getVendorsByType(type: string): Promise<Vendor[]>;
  getVendor(id: number): Promise<Vendor | undefined>;
  getVendorByName(name: string): Promise<Vendor | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, vendor: Partial<Vendor>): Promise<Vendor | undefined>;
  
  // Resources/Personnel
  getAllResources(): Promise<Resource[]>;
  getResourcesByTrialId(trialId: number): Promise<Resource[]>;
  getResourcesByRole(role: string): Promise<Resource[]>;
  getResource(id: number): Promise<Resource | undefined>;
  createResource(resource: InsertResource): Promise<Resource>;
  updateResource(id: number, resource: Partial<Resource>): Promise<Resource | undefined>;
  
  // Signal Detections
  getAllSignalDetections(): Promise<SignalDetection[]>;
  getSignalDetectionsByTrialId(trialId: number): Promise<SignalDetection[]>;
  getSignalDetection(id: number): Promise<SignalDetection | undefined>;
  getSignalDetectionByDetectionId(detectionId: string): Promise<SignalDetection | undefined>;
  createSignalDetection(detection: InsertSignalDetection): Promise<SignalDetection>;
  updateSignalDetection(id: number, detection: Partial<SignalDetection>): Promise<SignalDetection | undefined>;
  
  // Tasks
  getAllTasks(): Promise<Task[]>;
  getTasksByTrialId(trialId: number): Promise<Task[]>;
  getTasksBySiteId(siteId: number): Promise<Task[]>;
  getTasksByAssignee(assignedTo: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTaskByTaskId(taskId: string): Promise<Task | undefined>;
  getTasksByReference(trialId: number, domain: string, source: string, recordId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  
  // Task Comments
  getTaskComments(taskId: number, priorityFetch?: boolean): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  deleteTaskComment(id: number): Promise<boolean>;
  
  // Risk Profiles
  getRiskProfilesByEntityType(entityType: string, entityId: number): Promise<RiskProfile[]>;
  getRiskProfile(id: number): Promise<RiskProfile | undefined>;
  getRiskProfilesByType(profileType: string): Promise<RiskProfile[]>; 
  getAllRiskProfiles(): Promise<RiskProfile[]>;
  createRiskProfile(profile: InsertRiskProfile): Promise<RiskProfile>;
  updateRiskProfile(id: number, profile: Partial<RiskProfile>): Promise<RiskProfile | undefined>;
  
  // Risk Thresholds
  getRiskThresholdsByTrialId(trialId: number): Promise<RiskThreshold[]>;
  createRiskThreshold(threshold: InsertRiskThreshold): Promise<RiskThreshold>;
  updateRiskThreshold(id: number, threshold: Partial<RiskThreshold>): Promise<RiskThreshold | undefined>;
  
  // Agent Workflows
  getAgentWorkflows(aiComponent?: string): Promise<AgentWorkflow[]>;
  getAgentWorkflow(id: number): Promise<AgentWorkflow | undefined>;
  createAgentWorkflow(workflow: InsertAgentWorkflow): Promise<AgentWorkflow>;
  updateAgentWorkflow(id: number, updates: Partial<InsertAgentWorkflow>): Promise<AgentWorkflow | undefined>;
  deleteAgentWorkflow(id: number): Promise<boolean>;
  
  // Domain Data
  getDomainSourcesByTrialId(trialId: number): Promise<DomainSource[]>;
  
  // Notifications
  createNotification(notification: InsertNotification): Promise<any>;
  
  // Activity Logs
  createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trials: Map<number, Trial>;
  private sites: Map<number, Site>;
  private patients: Map<number, Patient>;
  private vendors: Map<number, Vendor>;
  private resources: Map<number, Resource>;
  private signalDetections: Map<number, SignalDetection>;
  private tasks: Map<number, Task>;
  private taskComments: Map<number, TaskComment>;
  private riskProfiles: Map<number, RiskProfile>;
  private riskThresholds: Map<number, RiskThreshold>;
  private agentWorkflows: Map<number, AgentWorkflow>;
  private domainSources: Map<number, DomainSource>;
  
  private currentUserId: number;
  private currentTrialId: number;
  private currentSiteId: number;
  private currentPatientId: number;
  private currentVendorId: number;
  private currentResourceId: number;
  private currentSignalDetectionId: number;
  private currentTaskId: number;
  private currentTaskCommentId: number;
  private currentRiskProfileId: number;
  private currentRiskThresholdId: number;
  
  // Vendor Management
  async getAllVendors(): Promise<Vendor[]> {
    return Array.from(this.vendors.values());
  }

  async getVendorsByType(type: string): Promise<Vendor[]> {
    return Array.from(this.vendors.values()).filter(
      (vendor) => vendor.type === type,
    );
  }

  async getVendor(id: number): Promise<Vendor | undefined> {
    return this.vendors.get(id);
  }

  async getVendorByName(name: string): Promise<Vendor | undefined> {
    return Array.from(this.vendors.values()).find(
      (vendor) => vendor.name === name,
    );
  }

  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const id = this.currentVendorId++;
    const now = new Date();
    const vendor: Vendor = {
      ...insertVendor,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.vendors.set(id, vendor);
    return vendor;
  }

  async updateVendor(id: number, updateData: Partial<Vendor>): Promise<Vendor | undefined> {
    const vendor = this.vendors.get(id);
    if (!vendor) return undefined;
    
    const now = new Date();
    const updatedVendor = { 
      ...vendor, 
      ...updateData,
      updatedAt: now
    };
    this.vendors.set(id, updatedVendor);
    return updatedVendor;
  }

  // Resource Management
  async getAllResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async getResourcesByTrialId(trialId: number): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.trialId === trialId,
    );
  }

  async getResourcesByRole(role: string): Promise<Resource[]> {
    return Array.from(this.resources.values()).filter(
      (resource) => resource.role === role,
    );
  }

  async getResource(id: number): Promise<Resource | undefined> {
    return this.resources.get(id);
  }

  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.currentResourceId++;
    const now = new Date();
    const resource: Resource = {
      ...insertResource,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.resources.set(id, resource);
    return resource;
  }

  async updateResource(id: number, updateData: Partial<Resource>): Promise<Resource | undefined> {
    const resource = this.resources.get(id);
    if (!resource) return undefined;
    
    const now = new Date();
    const updatedResource = { 
      ...resource, 
      ...updateData,
      updatedAt: now
    };
    this.resources.set(id, updatedResource);
    return updatedResource;
  }
  
  // Domain Data
  async getDomainSourcesByTrialId(trialId: number): Promise<DomainSource[]> {
    return Array.from(this.domainSources.values()).filter(
      (source) => source.trialId === trialId
    );
  }

  constructor() {
    console.log("Initializing MemStorage data structures");
    this.users = new Map();
    this.trials = new Map();
    this.sites = new Map();
    this.patients = new Map();
    this.vendors = new Map();
    this.resources = new Map();
    this.signalDetections = new Map();
    this.tasks = new Map();
    this.taskComments = new Map();
    this.riskProfiles = new Map();
    this.riskThresholds = new Map();
    this.agentWorkflows = new Map();
    this.domainSources = new Map();
    
    this.currentUserId = 1;
    this.currentTrialId = 1;
    this.currentSiteId = 1;
    this.currentPatientId = 1;
    this.currentVendorId = 1;
    this.currentResourceId = 1;
    this.currentSignalDetectionId = 1;
    this.currentTaskId = 1;
    this.currentTaskCommentId = 1;
    this.currentRiskProfileId = 1;
    this.currentRiskThresholdId = 1;
    this.currentAgentWorkflowId = 1; // Ensure this is initialized
    
    // Initialize with demo data
    this.initializeDemoData().catch(err => {
      console.error("Failed to initialize demo data:", err);
    });
  }

  private async initializeDemoData() {
    // Create demo users
    await this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Dr. Sarah Johnson",
      email: "sarah.johnson@example.com",
      role: "study_manager",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });
    
    // Create Madhu as a system administrator
    await this.createUser({
      username: "madhu",
      password: "secure_password",
      fullName: "Madhu",
      email: "orugantir@hexaware.com",
      role: "admin"
    });
    
    // Create demo trials
    const trial1 = await this.createTrial({
      protocolId: "PRO001",
      title: "Diabetes Type 2 Phase III Trial",
      description: "A phase III study to evaluate the efficacy and safety of new diabetes treatment",
      phase: "III",
      status: "active",
      startDate: new Date("2023-01-01"),
      endDate: new Date("2024-12-31"),
      therapeuticArea: "Endocrinology",
      indication: "Type 2 Diabetes Mellitus"
    });
    
    const trial2 = await this.createTrial({
      protocolId: "PRO002",
      title: "Rheumatoid Arthritis Phase II Study",
      description: "A phase II study evaluating a novel biologic therapy for moderate to severe rheumatoid arthritis",
      phase: "II",
      status: "active",
      startDate: new Date("2023-03-15"),
      endDate: new Date("2025-06-30"),
      therapeuticArea: "Immunology",
      indication: "Rheumatoid Arthritis"
    });
    
    const trial3 = await this.createTrial({
      protocolId: "PRO003",
      title: "Advanced Breast Cancer Trial",
      description: "A pivotal study investigating a targeted therapy for HER2+ metastatic breast cancer",
      phase: "III",
      status: "active",
      startDate: new Date("2023-05-01"),
      endDate: new Date("2026-01-31"),
      therapeuticArea: "Oncology",
      indication: "HER2+ Breast Cancer"
    });
    
    const trial4 = await this.createTrial({
      protocolId: "PRO004",
      title: "Alzheimer's Disease Biomarker Study",
      description: "A longitudinal study to identify novel biomarkers for early detection of Alzheimer's disease",
      phase: "II",
      status: "setup",
      startDate: new Date("2023-07-20"),
      endDate: new Date("2026-07-19"),
      therapeuticArea: "Neurology",
      indication: "Alzheimer's Disease"
    });
    
    // Create demo sites for trial 1
    const site1 = await this.createSite({
      siteId: "Site 123",
      trialId: trial1.id,
      name: "Central Medical Center",
      location: "New York, NY",
      principalInvestigator: "Dr. V. Becker",
      status: "active"
    });
    
    const site2 = await this.createSite({
      siteId: "Site 145",
      trialId: trial1.id,
      name: "Western Health Institute",
      location: "San Francisco, CA",
      principalInvestigator: "Dr. A. Smith",
      status: "active"
    });
    
    const site3 = await this.createSite({
      siteId: "Site 178",
      trialId: trial1.id,
      name: "Eastside Research Clinic",
      location: "Boston, MA",
      principalInvestigator: "Dr. J. Wong",
      status: "active"
    });
    
    // Create demo sites for trial 2
    const site4 = await this.createSite({
      siteId: "Site 201",
      trialId: trial2.id,
      name: "Northwestern Medical Partners",
      location: "Chicago, IL",
      principalInvestigator: "Dr. L. Martinez",
      status: "active"
    });
    
    const site5 = await this.createSite({
      siteId: "Site 212",
      trialId: trial2.id,
      name: "Atlanta Research Group",
      location: "Atlanta, GA",
      principalInvestigator: "Dr. P. Jones",
      status: "active"
    });
    
    // Create demo sites for trial 3
    const site6 = await this.createSite({
      siteId: "Site 305",
      trialId: trial3.id,
      name: "MD Anderson Cancer Center",
      location: "Houston, TX",
      principalInvestigator: "Dr. S. Lee",
      status: "active"
    });
    
    const site7 = await this.createSite({
      siteId: "Site 317",
      trialId: trial3.id,
      name: "UCLA Medical Center",
      location: "Los Angeles, CA",
      principalInvestigator: "Dr. M. Chen",
      status: "active"
    });
    
    const site8 = await this.createSite({
      siteId: "Site 324",
      trialId: trial3.id,
      name: "Memorial Sloan Kettering",
      location: "New York, NY",
      principalInvestigator: "Dr. R. Gupta",
      status: "active"
    });
    
    // Create demo sites for trial 4
    const site9 = await this.createSite({
      siteId: "Site 401",
      trialId: trial4.id,
      name: "Johns Hopkins Neurology",
      location: "Baltimore, MD",
      principalInvestigator: "Dr. K. Anderson",
      status: "active"
    });
    
    const site10 = await this.createSite({
      siteId: "Site 415",
      trialId: trial4.id,
      name: "Mayo Clinic Alzheimer's Center",
      location: "Rochester, MN",
      principalInvestigator: "Dr. T. Roberts",
      status: "active"
    });
    
    // Create demo signal detections
    const detection1 = await this.createSignalDetection({
      detectionId: "ST_Risk_001",
      title: "Screen Failure Pattern Anomaly",
      trialId: trial1.id,
      siteId: site1.id,
      dataReference: "Screen failure report",
      observation: "Site has same screen failure for 20 patients",
      priority: "Critical",
      status: "initiated",
      assignedTo: "John Carter",
      detectionDate: new Date("2023-03-10"),
      dueDate: new Date("2023-03-15"),
      createdBy: "System",
      notifiedPersons: ["Trial Manager", "Safety Monitor"]
    });
    
    const detection2 = await this.createSignalDetection({
      detectionId: "PD_Risk_087",
      title: "Protocol Deviation - Visit Timing",
      trialId: trial1.id,
      siteId: site3.id,
      dataReference: "Visit data",
      observation: "Site 178 conducting afternoon tests instead of morning",
      priority: "High",
      status: "in_progress",
      assignedTo: "Lisa Wong",
      detectionDate: new Date("2023-03-12"),
      dueDate: new Date("2023-03-18"),
      createdBy: "System",
      notifiedPersons: ["CRA", "Protocol Manager"]
    });
    
    const detection3 = await this.createSignalDetection({
      detectionId: "SAF_Risk_045",
      title: "Elevated Readings After Dose V1",
      trialId: trial1.id,
      dataReference: "Safety data",
      observation: "Elevated readings in 60% of patients after dose V1",
      priority: "High",
      status: "in_progress",
      assignedTo: "Maria Rodriguez",
      detectionDate: new Date("2023-03-14"),
      dueDate: new Date("2023-03-20"),
      createdBy: "System",
      notifiedPersons: ["Safety Officer", "Medical Monitor"]
    });
    
    const detection4 = await this.createSignalDetection({
      detectionId: "LAB_Risk_132",
      title: "Missing Lab Work for Visit 3",
      trialId: trial1.id,
      siteId: site2.id,
      dataReference: "Lab data",
      observation: "8 patients with incomplete lab work for Visit 3",
      priority: "Medium",
      status: "not_started",
      assignedTo: "Mark Johnson",
      detectionDate: new Date("2023-03-16"),
      dueDate: new Date("2023-03-22"),
      createdBy: "System",
      notifiedPersons: ["Lab Manager", "CRA"]
    });
    
    // Create demo tasks
    await this.createTask({
      taskId: "TSK_DIAB2_001",
      title: "Investigate anomalous screen failure pattern",
      description: "Investigate anomalous screen failure pattern at Site 123 - 20 patients with identical reasons",
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.IN_PROGRESS,
      trialId: trial1.id,
      siteId: site1.id,
      detectionId: detection1.id,
      assignedTo: "John Carter",
      createdBy: "System",
      dueDate: new Date("2023-03-15")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_002",
      title: "Address protocol deviation - Patient visit timing",
      description: "Address protocol deviation - Patient visit timing at Site 178",
      priority: TaskPriority.HIGH,
      status: TaskStatus.ASSIGNED,
      trialId: trial1.id,
      siteId: site3.id,
      detectionId: detection2.id,
      assignedTo: "Lisa Wong",
      createdBy: "System",
      dueDate: new Date("2023-03-18")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_003",
      title: "Investigate post-dose blood sugar elevation",
      description: "Investigate post-dose blood sugar elevation - Multiple sites",
      priority: TaskPriority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      trialId: trial1.id,
      assignedTo: "Maria Rodriguez",
      createdBy: "System",
      dueDate: new Date("2023-03-20")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_004",
      title: "Follow up on missing lab results",
      description: "Follow up on missing lab results for Visit 3 patients at Site 145",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.NOT_STARTED,
      trialId: trial1.id,
      siteId: site2.id,
      detectionId: detection4.id,
      assignedTo: "Mark Johnson",
      createdBy: "System",
      dueDate: new Date("2023-03-22")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_005",
      title: "Review data inconsistency in patient diary entries",
      description: "Review data inconsistency in patient diary entries for Site 123",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.NOT_STARTED,
      trialId: trial1.id,
      siteId: site1.id,
      createdBy: "System",
      dueDate: new Date("2023-03-25")
    });
    
    // Create additional signal detections for enhanced traceability
    const detection5 = await this.createSignalDetection({
      detectionId: "ENR_Risk_233",
      title: "Enrollment Target Shortfall",
      trialId: trial1.id,
      siteId: site1.id,
      dataReference: "Enrollment Data",
      observation: "Enrollment rate is 45% below target for Q1",
      priority: "High",
      status: "initiated",
      assignedTo: "John Carter",
      detectionDate: new Date("2023-03-25"),
      dueDate: new Date("2023-04-05"),
      createdBy: "AI Analysis",
      notifiedPersons: ["Study Manager", "Enrollment Coordinator"]
    });
    
    const detection6 = await this.createSignalDetection({
      detectionId: "AE_Risk_156",
      title: "AE Clustering Pattern",
      trialId: trial1.id,
      siteId: site2.id,
      dataReference: "Adverse Event Reports",
      observation: "Cluster of similar non-serious AEs reported at single site within 48 hours",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "Maria Rodriguez",
      detectionDate: new Date("2023-03-22"),
      dueDate: new Date("2023-03-28"),
      createdBy: "Safety Monitor",
      notifiedPersons: ["Medical Director", "Safety Officer"]
    });
    
    const detection7 = await this.createSignalDetection({
      detectionId: "DQ_Risk_298",
      title: "Data Correction Pattern Anomaly",
      trialId: trial1.id,
      siteId: site3.id,
      dataReference: "eCRF Data",
      observation: "Unusual pattern of data corrections after monitoring visits",
      priority: "Medium",
      status: "initiated",
      assignedTo: "Lisa Wong",
      detectionDate: new Date("2023-03-30"),
      dueDate: new Date("2023-04-10"),
      createdBy: "Data Manager",
      notifiedPersons: ["CRA Lead", "Quality Manager"]
    });
    
    // Create additional tasks linked to these signal detections
    await this.createTask({
      taskId: "TSK_DIAB2_006",
      title: "Assess site enrollment barriers",
      description: "Conduct site interview to identify specific enrollment challenges",
      priority: TaskPriority.HIGH,
      status: TaskStatus.NOT_STARTED,
      trialId: trial1.id,
      siteId: site1.id,
      detectionId: detection5.id,
      assignedTo: "John Carter",
      createdBy: "System",
      dueDate: new Date("2023-04-02")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_007",
      title: "Develop site-specific enrollment improvement plan",
      description: "Create action plan to address enrollment barriers identified in assessment",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.NOT_STARTED,
      trialId: trial1.id,
      siteId: site1.id,
      detectionId: detection5.id,
      assignedTo: "Sarah Miller",
      createdBy: "System",
      dueDate: new Date("2023-04-08")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_008",
      title: "Conduct urgent safety assessment",
      description: "Evaluate cluster of similar AEs to determine pattern and significance",
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.IN_PROGRESS,
      trialId: trial1.id,
      siteId: site2.id,
      detectionId: detection6.id,
      assignedTo: "Maria Rodriguez",
      createdBy: "Safety Officer",
      dueDate: new Date("2023-03-26")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_009",
      title: "Prepare safety memo for investigators",
      description: "Draft communication regarding AE cluster for distribution to investigators",
      priority: TaskPriority.HIGH,
      status: TaskStatus.NOT_STARTED,
      trialId: trial1.id,
      detectionId: detection6.id,
      assignedTo: "Dr. Thomas Lee",
      createdBy: "Medical Director",
      dueDate: new Date("2023-03-29")
    });
    
    await this.createTask({
      taskId: "TSK_DIAB2_010",
      title: "Audit data correction patterns",
      description: "Analyze timing and nature of data corrections to identify potential issues",
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.NOT_STARTED,
      trialId: trial1.id,
      siteId: site3.id,
      detectionId: detection7.id,
      assignedTo: "Lisa Wong",
      createdBy: "Data Manager",
      dueDate: new Date("2023-04-05")
    });
    
    // Create signal detections for Trial 2 (Rheumatoid Arthritis)
    await this.createSignalDetection({
      detectionId: "RA_Risk_045",
      title: "Joint Pain Score Inconsistency",
      trialId: trial2.id,
      siteId: site4.id,
      dataReference: "PRO Assessment Data",
      observation: "Inconsistent reporting of joint pain scores compared to physician evaluations",
      priority: "High",
      status: "in_progress",
      assignedTo: "Sarah Chen",
      detectionDate: new Date("2023-04-05"),
      dueDate: new Date("2023-04-12"),
      createdBy: "System",
      notifiedPersons: ["Clinical Assessor", "Medical Director"]
    });
    
    await this.createSignalDetection({
      detectionId: "RA_ENR_118",
      title: "Delayed Randomization Process",
      trialId: trial2.id,
      siteId: site5.id,
      dataReference: "Enrollment System",
      observation: "Average 3-day delay between screening and randomization",
      priority: "Medium",
      status: "initiated",
      assignedTo: "Robert Kim",
      detectionDate: new Date("2023-04-12"),
      dueDate: new Date("2023-04-20"),
      createdBy: "Site Manager",
      notifiedPersons: ["Enrollment Coordinator", "Site Manager"]
    });
    
    await this.createSignalDetection({
      detectionId: "RA_LAB_224",
      title: "Abnormal Liver Enzyme Trends",
      trialId: trial2.id,
      dataReference: "Laboratory Data",
      observation: "Trending increase in liver enzymes across multiple patients after Week 8",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "Maria Rodriguez",
      detectionDate: new Date("2023-04-18"),
      dueDate: new Date("2023-04-24"),
      createdBy: "Safety Monitor",
      notifiedPersons: ["Safety Officer", "Medical Monitor", "Lead Investigator"]
    });
    
    await this.createSignalDetection({
      detectionId: "RA_PD_159",
      title: "Medication Storage Temperature Deviation",
      trialId: trial2.id,
      siteId: site6.id,
      dataReference: "Pharmacy Logs",
      observation: "Temperature excursion in drug storage refrigerator for 6 hours",
      priority: "High",
      status: "initiated",
      assignedTo: "James Wilson",
      detectionDate: new Date("2023-04-24"),
      dueDate: new Date("2023-04-30"),
      createdBy: "Site Monitor",
      notifiedPersons: ["Pharmacy Manager", "QA Manager"]
    });
    
    // Create signal detections for Trial 3 (Breast Cancer)
    await this.createSignalDetection({
      detectionId: "BC_SAE_078",
      title: "Increased Cardiac Events",
      trialId: trial3.id,
      dataReference: "Safety Database",
      observation: "Higher than expected rate of Grade 2+ cardiac events in treatment arm",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "David Park",
      detectionDate: new Date("2023-05-10"),
      dueDate: new Date("2023-05-15"),
      createdBy: "AI Analysis",
      notifiedPersons: ["DSMB", "Medical Director", "Safety Officer"]
    });
    
    await this.createSignalDetection({
      detectionId: "BC_IMG_133",
      title: "Missing Tumor Assessment Scans",
      trialId: trial3.id,
      siteId: site7.id,
      dataReference: "Imaging Data",
      observation: "Week 12 tumor assessment scans missing for multiple patients",
      priority: "High",
      status: "initiated",
      assignedTo: "Jennifer Taylor",
      detectionDate: new Date("2023-05-18"),
      dueDate: new Date("2023-05-25"),
      createdBy: "Data Manager",
      notifiedPersons: ["Imaging Core Lab", "Site Coordinator"]
    });
    
    await this.createSignalDetection({
      detectionId: "BC_DQ_201",
      title: "Significant Data Query Backlog",
      trialId: trial3.id,
      siteId: site8.id,
      dataReference: "EDC System",
      observation: "Site has >100 open queries with average age of 45 days",
      priority: "Medium",
      status: "initiated",
      assignedTo: "Lisa Wong",
      detectionDate: new Date("2023-05-24"),
      dueDate: new Date("2023-06-02"),
      createdBy: "System",
      notifiedPersons: ["Data Manager", "CRA"]
    });
    
    await this.createSignalDetection({
      detectionId: "BC_ENR_265",
      title: "Decreasing Screening Success Rate",
      trialId: trial3.id,
      dataReference: "Screening Data",
      observation: "Screening success rate dropped from 60% to 30% in last month",
      priority: "High",
      status: "not_started",
      assignedTo: "John Carter",
      detectionDate: new Date("2023-06-01"),
      dueDate: new Date("2023-06-08"),
      createdBy: "Enrollment Manager",
      notifiedPersons: ["Study Manager", "Site Coordinators"]
    });
    
    // Create signal detections for Trial 4 (Alzheimer's)
    await this.createSignalDetection({
      detectionId: "ALZ_DQ_112",
      title: "Cognitive Assessment Admin Issues",
      trialId: trial4.id,
      siteId: site9.id,
      dataReference: "Cognitive Assessment Data",
      observation: "Inconsistent administration procedures for cognitive assessments",
      priority: "High",
      status: "initiated",
      assignedTo: "Michelle Lee",
      detectionDate: new Date("2023-07-25"),
      dueDate: new Date("2023-08-01"),
      createdBy: "Central Rater",
      notifiedPersons: ["Neuropsychological Assessment Lead", "Site Director"]
    });
    
    await this.createSignalDetection({
      detectionId: "ALZ_IMG_095",
      title: "CSF Biomarker Collection Deviation",
      trialId: trial4.id,
      siteId: site10.id,
      dataReference: "Laboratory Logs",
      observation: "CSF samples processed outside protocol-specified timeframe",
      priority: "Medium",
      status: "not_started",
      assignedTo: "James Wilson",
      detectionDate: new Date("2023-08-02"),
      dueDate: new Date("2023-08-10"),
      createdBy: "Lab Manager",
      notifiedPersons: ["Central Lab", "Site Investigator"]
    });
    
    await this.createSignalDetection({
      detectionId: "ALZ_AE_078",
      title: "Increased Falls in Elderly Patients",
      trialId: trial4.id,
      dataReference: "Adverse Event Reports",
      observation: "Higher than expected fall incidents in treatment group",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "Maria Rodriguez",
      detectionDate: new Date("2023-08-08"),
      dueDate: new Date("2023-08-14"),
      createdBy: "Safety Monitor",
      notifiedPersons: ["Medical Director", "DSMB", "Protocol Lead"]
    });
    
    // Create risk profiles
    await this.createRiskProfile({
      entityType: "site",
      entityId: site1.id,
      profileType: "Risk",
      riskScore: 85,
      metrics: {
        patientRisk: 80,
        protocolDeviation: 90,
        dataQuality: 70,
        adverseEvents: 50,
        compliance: 60,
        enrollmentRisk: 95
      },
      recommendations: [
        "Enrollment is at risk because timely enrollment didn't happen for study 123",
        "Investigate high screen failure rate with similar reasons",
        "Schedule CRA visit to review protocol compliance"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "site",
      entityId: site2.id,
      profileType: "Risk",
      riskScore: 20,
      metrics: {
        patientRisk: 20,
        protocolDeviation: 30,
        dataQuality: 50,
        adverseEvents: 20,
        compliance: 10,
        enrollmentRisk: 25
      },
      recommendations: [
        "Site is performing well, maintain regular monitoring schedule",
        "Consider using this site as a model for other sites"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "site",
      entityId: site3.id,
      profileType: "Risk",
      riskScore: 60,
      metrics: {
        patientRisk: 50,
        protocolDeviation: 60,
        dataQuality: 70,
        adverseEvents: 40,
        compliance: 50,
        enrollmentRisk: 55
      },
      recommendations: [
        "Schedule additional protocol training for site staff",
        "Increase monitoring frequency to ensure compliance"
      ]
    });
    
    // Add Quality profiles for sites
    await this.createRiskProfile({
      entityType: "site",
      entityId: site1.id,
      profileType: "Quality",
      riskScore: 75,
      metrics: {
        dataCompleteness: 65,
        queryRate: 80,
        sdvErrors: 70,
        documentationQuality: 60,
        dataEntryTimeliness: 85
      },
      recommendations: [
        "Implement additional data entry training for site staff",
        "Consider more frequent SDV to address error rate"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "site",
      entityId: site2.id,
      profileType: "Quality",
      riskScore: 30,
      metrics: {
        dataCompleteness: 80,
        queryRate: 25,
        sdvErrors: 15,
        documentationQuality: 85,
        dataEntryTimeliness: 70
      },
      recommendations: [
        "Maintain current quality control procedures",
        "Consider using site documentation practices as a model for other sites"
      ]
    });
    
    // Add Compliance profiles for sites
    await this.createRiskProfile({
      entityType: "site",
      entityId: site1.id,
      profileType: "Compliance",
      riskScore: 65,
      metrics: {
        protocolAdherence: 60,
        icfCompliance: 70,
        regulatorySubmissions: 80,
        trainingCompliance: 50,
        procedureCompliance: 70
      },
      recommendations: [
        "Schedule refresher protocol training session",
        "Implement additional oversight for ICF processes"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "site",
      entityId: site2.id,
      profileType: "Compliance",
      riskScore: 25,
      metrics: {
        protocolAdherence: 90,
        icfCompliance: 95,
        regulatorySubmissions: 80,
        trainingCompliance: 85,
        procedureCompliance: 90
      },
      recommendations: [
        "Maintain current compliance monitoring procedures",
        "Consider using site compliance practices as a model for other sites"
      ]
    });
    
    // Add Safety profiles for sites
    await this.createRiskProfile({
      entityType: "site",
      entityId: site1.id,
      profileType: "Safety",
      riskScore: 70,
      metrics: {
        aeReportingTimeliness: 60,
        saeFrequency: 80,
        safetySignalDetection: 75,
        protocolSafetyViolations: 65,
        safetyMonitoringAdherence: 70
      },
      recommendations: [
        "Review AE reporting procedures with site staff",
        "Implement additional safety monitoring oversight"
      ]
    });
    
    // Add Safety profile for site 2
    await this.createRiskProfile({
      entityType: "site",
      entityId: site2.id,
      profileType: "Safety",
      riskScore: 35,
      metrics: {
        aeReportingTimeliness: 30,
        saeFrequency: 20,
        safetySignalDetection: 40,
        protocolSafetyViolations: 15,
        safetyMonitoringAdherence: 45
      },
      recommendations: [
        "Continue standard safety monitoring procedures",
        "Maintain current AE reporting workflow"
      ]
    });
    
    // Add Financial profiles for sites
    await this.createRiskProfile({
      entityType: "site",
      entityId: site1.id,
      profileType: "Financial",
      riskScore: 65,
      metrics: {
        budgetVariance: 70,
        invoiceAccuracy: 55,
        paymentTimeliness: 60,
        costProjections: 75,
        budgetUtilization: 70
      },
      recommendations: [
        "Review site payment schedule",
        "Implement additional financial tracking for high-cost procedures"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "site",
      entityId: site2.id,
      profileType: "Financial",
      riskScore: 30,
      metrics: {
        budgetVariance: 25,
        invoiceAccuracy: 35,
        paymentTimeliness: 20,
        costProjections: 40,
        budgetUtilization: 35
      },
      recommendations: [
        "Maintain current financial tracking procedures",
        "Continue standard payment processing"
      ]
    });
    
    // Add Resource profiles for sites
    await this.createRiskProfile({
      entityType: "site",
      entityId: site1.id,
      profileType: "Resource",
      riskScore: 55,
      metrics: {
        staffAllocation: 60,
        resourceUtilization: 50,
        skillAvailability: 65,
        workloadDistribution: 45,
        capacityPlanning: 55
      },
      recommendations: [
        "Review staff workload distribution",
        "Consider additional staff training for complex procedures"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "site",
      entityId: site2.id,
      profileType: "Resource",
      riskScore: 25,
      metrics: {
        staffAllocation: 20,
        resourceUtilization: 30,
        skillAvailability: 25,
        workloadDistribution: 15,
        capacityPlanning: 30
      },
      recommendations: [
        "Maintain current resource allocation",
        "Continue standard staff management procedures"
      ]
    });
    
    // Create vendors
    const iqviaVendor = await this.createVendor({
      name: "IQVIA",
      type: "CRO",
      contactPerson: "Jane Smith",
      contactEmail: "jane.smith@iqvia.com",
      status: "active"
    });

    const iconVendor = await this.createVendor({
      name: "ICON",
      type: "CRO",
      contactPerson: "Michael Johnson",
      contactEmail: "michael.johnson@iconplc.com",
      status: "active"
    });

    const ppdVendor = await this.createVendor({
      name: "PPD",
      type: "Lab",
      contactPerson: "Sarah Williams",
      contactEmail: "sarah.williams@ppd.com",
      status: "active"
    });

    const perceptiveVendor = await this.createVendor({
      name: "Perceptive",
      type: "Imaging",
      contactPerson: "Robert Davis",
      contactEmail: "robert.davis@perceptive.com",
      status: "active"
    });

    const medidata = await this.createVendor({
      name: "Medidata",
      type: "IRT",
      contactPerson: "Emily Chen",
      contactEmail: "emily.chen@medidata.com",
      status: "active"
    });

    // Add Vendor profiles
    await this.createRiskProfile({
      entityType: "vendor",
      entityId: iqviaVendor.id,
      profileType: "Vendor",
      riskScore: 45,
      metrics: {
        serviceQuality: 60,
        deliveryTimeliness: 40,
        communication: 50,
        issueResolution: 30,
        contractCompliance: 65
      },
      recommendations: [
        "Schedule vendor performance review meeting",
        "Implement more frequent checkpoints for deliverable status"
      ]
    });

    await this.createRiskProfile({
      entityType: "vendor",
      entityId: iconVendor.id,
      profileType: "Vendor",
      riskScore: 35,
      metrics: {
        serviceQuality: 70,
        deliveryTimeliness: 65,
        communication: 40,
        issueResolution: 55,
        contractCompliance: 75
      },
      recommendations: [
        "Improve communication channels",
        "Review current issue resolution processes"
      ]
    });

    await this.createRiskProfile({
      entityType: "vendor",
      entityId: ppdVendor.id,
      profileType: "Vendor",
      riskScore: 25,
      metrics: {
        serviceQuality: 80,
        deliveryTimeliness: 75,
        communication: 70,
        issueResolution: 75,
        contractCompliance: 85
      },
      recommendations: [
        "Maintain current performance monitoring",
        "Consider for additional projects based on strong performance"
      ]
    });

    await this.createRiskProfile({
      entityType: "vendor",
      entityId: perceptiveVendor.id,
      profileType: "Vendor",
      riskScore: 55,
      metrics: {
        serviceQuality: 45,
        deliveryTimeliness: 30,
        communication: 40,
        issueResolution: 35,
        contractCompliance: 50
      },
      recommendations: [
        "Conduct urgent review of deliverable timelines",
        "Implement remediation plan for service quality improvements",
        "Schedule weekly status meetings to track progress"
      ]
    });

    await this.createRiskProfile({
      entityType: "vendor",
      entityId: medidata.id,
      profileType: "Vendor",
      riskScore: 40,
      metrics: {
        serviceQuality: 65,
        deliveryTimeliness: 60,
        communication: 55,
        issueResolution: 45,
        contractCompliance: 70
      },
      recommendations: [
        "Review issue resolution procedures",
        "Maintain current oversight levels"
      ]
    });
    
    // Add trial level profiles
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Risk",
      riskScore: 55,
      metrics: {
        patientRisk: 40,
        protocolDeviation: 65,
        dataQuality: 60,
        adverseEvents: 50,
        compliance: 45,
        enrollmentRisk: 70
      },
      recommendations: [
        "Enrollment is at risk because timely enrollment didn't happen for study 123",
        "Review protocol deviations across all sites to identify common issues",
        "Implement additional training for all sites on protocol adherence"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Quality",
      riskScore: 50,
      metrics: {
        dataCompleteness: 65,
        queryRate: 45,
        sdvErrors: 50,
        documentationQuality: 55,
        dataEntryTimeliness: 60
      },
      recommendations: [
        "Schedule data quality workshop for all site staff",
        "Implement additional quality control measures for critical data points"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Compliance",
      riskScore: 45,
      metrics: {
        protocolAdherence: 60,
        icfCompliance: 70,
        regulatorySubmissions: 40,
        trainingCompliance: 50,
        procedureCompliance: 55
      },
      recommendations: [
        "Review and update regulatory submission procedures",
        "Implement additional training for site staff on protocol requirements"
      ]
    });
    
    // Add Safety profile for trial
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Safety",
      riskScore: 60,
      metrics: {
        aeReportingTimeliness: 55,
        saeFrequency: 65,
        safetySignalDetection: 60,
        protocolSafetyViolations: 55,
        safetyMonitoringAdherence: 65
      },
      recommendations: [
        "Review safety monitoring procedures across all sites",
        "Implement centralized safety signal detection algorithm",
        "Schedule safety review committee meeting"
      ]
    });
    
    // Add Vendor profile for trial
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Vendor",
      riskScore: 40,
      metrics: {
        serviceQuality: 45,
        deliveryTimeliness: 35,
        communication: 40,
        issueResolution: 35,
        contractCompliance: 50
      },
      recommendations: [
        "Schedule quarterly vendor performance reviews",
        "Implement stricter deliverable tracking process",
        "Improve communication channels with key vendors"
      ]
    });
    
    // Add Financial profile for trial
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Financial",
      riskScore: 30,
      metrics: {
        budgetVariance: 25,
        invoiceAccuracy: 35,
        paymentTimeliness: 20,
        costProjections: 40,
        budgetUtilization: 35
      },
      recommendations: [
        "Continue monthly budget review meetings",
        "Maintain current financial tracking procedures",
        "Review vendor payment process for potential improvements"
      ]
    });
    
    // Add Resource profile for trial
    await this.createRiskProfile({
      entityType: "trial",
      entityId: trial1.id,
      profileType: "Resource",
      riskScore: 50,
      metrics: {
        staffAllocation: 55,
        resourceUtilization: 45,
        skillAvailability: 60,
        workloadDistribution: 50,
        capacityPlanning: 40
      },
      recommendations: [
        "Review CRA workload distribution across sites",
        "Implement resource forecasting for critical study phases",
        "Consider additional resources for data management"
      ]
    });
    
    // Create resources/personnel
    const john = await this.createResource({
      name: "John Smith",
      role: "CRA",
      trialId: trial1.id,
      email: "john.smith@example.com",
      phone: "+1-555-123-4567",
      status: "active"
    });

    const emily = await this.createResource({
      name: "Emily Chen",
      role: "Data Manager",
      trialId: trial1.id,
      email: "emily.chen@example.com",
      phone: "+1-555-234-5678",
      status: "active"
    });

    const michael = await this.createResource({
      name: "Dr. Michael Taylor",
      role: "Medical Monitor",
      trialId: trial1.id,
      email: "michael.taylor@example.com",
      phone: "+1-555-345-6789",
      status: "active"
    });

    const sarah = await this.createResource({
      name: "Sarah Johnson",
      role: "Central Data Quality Monitor",
      trialId: trial1.id,
      email: "sarah.johnson@example.com",
      phone: "+1-555-456-7890",
      status: "active"
    });
    
    const david = await this.createResource({
      name: "David Roberts",
      role: "Clinical Research Coordinator",
      trialId: trial1.id,
      email: "david.roberts@example.com",
      phone: "+1-555-567-8901",
      status: "active"
    });
    
    const jessica = await this.createResource({
      name: "Jessica Wong",
      role: "Clinical Trial Manager",
      trialId: trial1.id,
      email: "jessica.wong@example.com",
      phone: "+1-555-678-9012",
      status: "active"
    });
    
    const robert = await this.createResource({
      name: "Robert Patel",
      role: "Regulatory Specialist",
      trialId: trial1.id,
      email: "robert.patel@example.com",
      phone: "+1-555-789-0123",
      status: "active"
    });
    
    const maria = await this.createResource({
      name: "Maria Rodriguez",
      role: "Safety Specialist",
      trialId: trial1.id,
      email: "maria.rodriguez@example.com",
      phone: "+1-555-890-1234",
      status: "active"
    });
    
    const james = await this.createResource({
      name: "James Thompson",
      role: "Clinical Research Associate",
      trialId: trial1.id,
      email: "james.thompson@example.com",
      phone: "+1-555-901-2345",
      status: "active"
    });
    
    const linda = await this.createResource({
      name: "Linda Kim",
      role: "Project Manager",
      trialId: trial1.id,
      email: "linda.kim@example.com",
      phone: "+1-555-012-3456",
      status: "active"
    });
    
    // Create Resource Profiles - low scores are good (fewer issues)
    await this.createRiskProfile({
      entityType: "resource",
      entityId: emily.id,
      profileType: "Resource",
      riskScore: 15,
      metrics: {
        issueCount: 10,
        performanceQuality: 95,
        responseTimeliness: 90,
        documentationAccuracy: 95,
        protocolCompliance: 90,
        taskCompletionRate: 98
      },
      recommendations: [
        "Maintain current performance metrics",
        "Consider for mentoring role to other data managers",
        "Document best practices for team knowledge sharing"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: john.id,
      profileType: "Resource",
      riskScore: 65,
      metrics: {
        issueCount: 75,
        performanceQuality: 40,
        responseTimeliness: 50,
        documentationAccuracy: 45,
        protocolCompliance: 60,
        taskCompletionRate: 55
      },
      recommendations: [
        "Schedule remedial training on documentation procedures",
        "Implement weekly check-ins with supervisor",
        "Review site monitoring schedule and adjust workload if needed",
        "Provide additional training on protocol requirements"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: michael.id,
      profileType: "Resource",
      riskScore: 25,
      metrics: {
        issueCount: 20,
        performanceQuality: 85,
        responseTimeliness: 75,
        documentationAccuracy: 90,
        protocolCompliance: 85,
        taskCompletionRate: 80
      },
      recommendations: [
        "Review response time metrics for potential improvement",
        "Maintain current quality standards",
        "Consider additional training for specialized therapeutic areas"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: sarah.id,
      profileType: "Resource",
      riskScore: 35,
      metrics: {
        issueCount: 35,
        performanceQuality: 80,
        responseTimeliness: 65,
        documentationAccuracy: 75,
        protocolCompliance: 70,
        taskCompletionRate: 75
      },
      recommendations: [
        "Improve timeliness of quality monitoring reports",
        "Schedule refresher training on data quality procedures",
        "Maintain current documentation standards"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: david.id,
      profileType: "Resource",
      riskScore: 45,
      metrics: {
        issueCount: 50,
        performanceQuality: 65,
        responseTimeliness: 55,
        documentationAccuracy: 60,
        protocolCompliance: 70,
        taskCompletionRate: 65
      },
      recommendations: [
        "Implement structured documentation review process",
        "Provide additional training on response procedures",
        "Schedule regular check-ins with study coordinator"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: jessica.id,
      profileType: "Resource",
      riskScore: 20,
      metrics: {
        issueCount: 15,
        performanceQuality: 90,
        responseTimeliness: 85,
        documentationAccuracy: 85,
        protocolCompliance: 90,
        taskCompletionRate: 85
      },
      recommendations: [
        "Maintain current performance standards",
        "Document management processes for cross-team knowledge sharing",
        "Consider for leadership role in future trials"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: robert.id,
      profileType: "Resource",
      riskScore: 30,
      metrics: {
        issueCount: 25,
        performanceQuality: 80,
        responseTimeliness: 75,
        documentationAccuracy: 85,
        protocolCompliance: 85,
        taskCompletionRate: 75
      },
      recommendations: [
        "Review task completion processes for potential optimization",
        "Maintain high compliance standards",
        "Schedule regular updates on regulatory requirements"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: maria.id,
      profileType: "Resource",
      riskScore: 80,
      metrics: {
        issueCount: 85,
        performanceQuality: 30,
        responseTimeliness: 25,
        documentationAccuracy: 35,
        protocolCompliance: 40,
        taskCompletionRate: 30
      },
      recommendations: [
        "Conduct urgent performance review meeting",
        "Implement structured improvement plan with weekly monitoring",
        "Provide immediate remedial training on safety protocols",
        "Consider reassignment of critical safety tasks until performance improves",
        "Schedule daily check-ins with safety supervisor"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: james.id,
      profileType: "Resource",
      riskScore: 55,
      metrics: {
        issueCount: 60,
        performanceQuality: 50,
        responseTimeliness: 40,
        documentationAccuracy: 55,
        protocolCompliance: 60,
        taskCompletionRate: 65
      },
      recommendations: [
        "Review site monitoring procedures and documentation",
        "Implement structured communication protocols",
        "Provide additional training on response prioritization",
        "Schedule bi-weekly performance reviews"
      ]
    });
    
    await this.createRiskProfile({
      entityType: "resource",
      entityId: linda.id,
      profileType: "Resource",
      riskScore: 40,
      metrics: {
        issueCount: 45,
        performanceQuality: 70,
        responseTimeliness: 60,
        documentationAccuracy: 65,
        protocolCompliance: 75,
        taskCompletionRate: 70
      },
      recommendations: [
        "Improve response time tracking and management",
        "Maintain current project management standards",
        "Consider additional training on documentation systems",
        "Review workload distribution for optimization"
      ]
    });
    
    // Create risk thresholds
    await this.createRiskThreshold({
      trialId: trial1.id,
      metricName: "Adverse Events",
      description: "Percentage of patients reporting adverse events after first dose",
      lowThreshold: 5,
      mediumThreshold: 10,
      highThreshold: 20,
      criticalThreshold: 30,
      enabled: true
    });
    
    await this.createRiskThreshold({
      trialId: trial1.id,
      metricName: "Protocol Deviation",
      description: "Number of protocol deviations per site per month",
      lowThreshold: 2,
      mediumThreshold: 5,
      highThreshold: 10,
      criticalThreshold: 15,
      enabled: true
    });
    
    // Create additional tasks with various statuses
    const task1 = await this.createTask({
      taskId: "SITE_INS_001",
      title: "Schedule site inspection for facility evaluation",
      description: "Conduct a comprehensive facility evaluation at Site 145 due to recent enrollment issues",
      priority: "High",
      status: "assigned",
      trialId: trial1.id,
      siteId: site2.id,
      assignedTo: "Emily Chen",
      createdBy: "Maria Rodriguez",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    const task2 = await this.createTask({
      taskId: "DATA_QC_023",
      title: "Resolve discrepancies in patient data entries",
      description: "Address data inconsistencies found in 15 patient records at Site 123",
      priority: "Medium",
      status: "in_progress",
      trialId: trial1.id,
      siteId: site1.id,
      assignedTo: "John Carter",
      createdBy: "Lisa Wong",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    });
    
    const task3 = await this.createTask({
      taskId: "TRAIN_REQ_045",
      title: "Coordinate training session for new site staff",
      description: "Organize protocol training for newly hired staff at Sites 123 and 178",
      priority: "Low",
      status: "not_started",
      trialId: trial1.id,
      siteId: null,
      assignedTo: "Lisa Wong",
      createdBy: "Emily Chen",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
    });
    
    const task4 = await this.createTask({
      taskId: "AUDIT_PREP_089",
      title: "Prepare documentation for upcoming regulatory audit",
      description: "Compile all necessary documentation for the FDA audit scheduled next month",
      priority: "Critical",
      status: "in_progress",
      trialId: trial1.id,
      siteId: null,
      assignedTo: "Mark Johnson",
      createdBy: "Maria Rodriguez",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days from now
    });
    
    const task5 = await this.createTask({
      taskId: "CLOSE_SITE_017",
      title: "Process site closure documentation",
      description: "Complete all necessary documentation for the closure of Site 145",
      priority: "Medium",
      status: "closed",
      trialId: trial1.id,
      siteId: site2.id,
      assignedTo: "John Carter",
      createdBy: "System",
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    
    // Add task comments
    const comment1 = await this.createTaskComment({
      taskId: task1.id,
      comment: "I've contacted the site coordinator to schedule the inspection for next Tuesday.",
      createdBy: "Emily Chen",
      role: "CRA",
      attachments: []
    });
    
    const comment2 = await this.createTaskComment({
      taskId: task2.id,
      comment: "Initial review complete. Found inconsistencies in visit dates and vital signs measurements.",
      createdBy: "John Carter",
      role: "Data Manager",
      attachments: ["data_review_summary.pdf"]
    });
    
    const comment3 = await this.createTaskComment({
      taskId: task2.id,
      comment: "Please provide a detailed report of all affected patient records.",
      createdBy: "Lisa Wong",
      role: "Medical Monitor",
      attachments: []
    });
    
    const comment4 = await this.createTaskComment({
      taskId: task2.id,
      comment: "Report attached. 15 patients affected, primarily in visit 3 and 4 data.",
      createdBy: "John Carter",
      role: "Data Manager",
      attachments: ["patient_data_issues.xlsx"]
    });
    
    const comment5 = await this.createTaskComment({
      taskId: task4.id,
      comment: "Started gathering essential documentation. Will need input from the regulatory team.",
      createdBy: "Mark Johnson",
      role: "CRA",
      attachments: []
    });
    
    const comment6 = await this.createTaskComment({
      taskId: task4.id,
      comment: "I've shared the audit checklist with the team. Please focus on sections 3-5 first.",
      createdBy: "Maria Rodriguez",
      role: "Quality Assurance",
      attachments: ["audit_checklist_v2.docx"]
    });
    
    const comment7 = await this.createTaskComment({
      taskId: task5.id,
      comment: "All closure documentation has been processed and filed. Site 145 is officially closed.",
      createdBy: "John Carter",
      role: "Site Manager",
      attachments: ["site_closure_confirmation.pdf"]
    });
    
    // Update tasks with last comment information
    await this.updateTask(task1.id, {
      lastCommentAt: comment1.createdAt,
      lastCommentBy: comment1.createdBy
    });
    
    await this.updateTask(task2.id, {
      lastCommentAt: comment4.createdAt,
      lastCommentBy: comment4.createdBy
    });
    
    await this.updateTask(task4.id, {
      lastCommentAt: comment6.createdAt,
      lastCommentBy: comment6.createdBy
    });
    
    await this.updateTask(task5.id, {
      lastCommentAt: comment7.createdAt,
      lastCommentBy: comment7.createdBy
    });
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserEmailByUsername(username: string): Promise<string | undefined> {
    const user = await this.getUserByUsername(username);
    return user?.email;
  }
  
  async createNotification(notification: InsertNotification): Promise<any> {
    console.log("Creating notification in MemStorage:", notification);
    // In a real implementation, this would store the notification
    return notification;
  }
  
  async createActivityLog(activityLog: InsertActivityLog): Promise<ActivityLog> {
    console.log("Creating activity log in MemStorage:", activityLog);
    // In a real implementation, this would store the activity log
    const id = 1;
    const now = new Date();
    const log: ActivityLog = {
      ...activityLog,
      id,
      createdAt: now,
      updatedAt: now
    };
    return log;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Trial Management
  async getAllTrials(): Promise<Trial[]> {
    return Array.from(this.trials.values());
  }
  
  async getTrial(id: number): Promise<Trial | undefined> {
    return this.trials.get(id);
  }
  
  async getTrialByProtocolId(protocolId: string): Promise<Trial | undefined> {
    return Array.from(this.trials.values()).find(
      (trial) => trial.protocolId === protocolId,
    );
  }
  
  async createTrial(insertTrial: InsertTrial): Promise<Trial> {
    const id = this.currentTrialId++;
    const now = new Date();
    const trial: Trial = { 
      ...insertTrial, 
      id,
      createdAt: now,
      updatedAt: now 
    };
    this.trials.set(id, trial);
    return trial;
  }
  
  // Site Management
  async getAllSites(): Promise<Site[]> {
    return Array.from(this.sites.values());
  }
  
  async getSitesByTrialId(trialId: number): Promise<Site[]> {
    return Array.from(this.sites.values()).filter(
      (site) => site.trialId === trialId,
    );
  }
  
  async getSite(id: number): Promise<Site | undefined> {
    return this.sites.get(id);
  }
  
  async getSiteBySiteId(siteId: string): Promise<Site | undefined> {
    return Array.from(this.sites.values()).find(
      (site) => site.siteId === siteId,
    );
  }
  
  async createSite(insertSite: InsertSite): Promise<Site> {
    const id = this.currentSiteId++;
    const now = new Date();
    const site: Site = {
      ...insertSite,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.sites.set(id, site);
    return site;
  }
  
  // Patient Management
  async getPatientsBySiteId(siteId: number): Promise<Patient[]> {
    return Array.from(this.patients.values()).filter(
      (patient) => patient.siteId === siteId,
    );
  }
  
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const id = this.currentPatientId++;
    const now = new Date();
    const patient: Patient = {
      ...insertPatient,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.patients.set(id, patient);
    return patient;
  }
  
  // Signal Detection Management
  async getAllSignalDetections(): Promise<SignalDetection[]> {
    return Array.from(this.signalDetections.values());
  }
  
  async getSignalDetectionsByTrialId(trialId: number): Promise<SignalDetection[]> {
    return Array.from(this.signalDetections.values()).filter(
      (detection) => detection.trialId === trialId,
    );
  }
  
  async getSignalDetection(id: number): Promise<SignalDetection | undefined> {
    return this.signalDetections.get(id);
  }
  
  async getSignalDetectionByDetectionId(detectionId: string): Promise<SignalDetection | undefined> {
    return Array.from(this.signalDetections.values()).find(
      (detection) => detection.detectionId === detectionId,
    );
  }
  
  async createSignalDetection(insertDetection: InsertSignalDetection): Promise<SignalDetection> {
    const id = this.currentSignalDetectionId++;
    const now = new Date();
    
    // Generate title based on detection ID if not provided
    const title = insertDetection.title || 
      `Signal Detection ${insertDetection.detectionId}`;
    
    // Use provided detection date or now
    const detectionDate = insertDetection.detectionDate || now;
    
    const detection: SignalDetection = {
      ...insertDetection,
      id,
      title,
      detectionDate,
      createdAt: now
    };
    this.signalDetections.set(id, detection);
    return detection;
  }
  
  async updateSignalDetection(id: number, updateData: Partial<SignalDetection>): Promise<SignalDetection | undefined> {
    const detection = this.signalDetections.get(id);
    if (!detection) return undefined;
    
    const updatedDetection = { ...detection, ...updateData };
    this.signalDetections.set(id, updatedDetection);
    return updatedDetection;
  }
  
  // Task Management
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }
  
  async getTasksByTrialId(trialId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.trialId === trialId,
    );
  }
  
  async getTasksBySiteId(siteId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.siteId === siteId,
    );
  }
  
  async getTasksByAssignee(assignedTo: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.assignedTo === assignedTo,
    );
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTaskByTaskId(taskId: string): Promise<Task | undefined> {
    return Array.from(this.tasks.values()).find(
      (task) => task.taskId === taskId,
    );
  }
  
  async getTasksByReference(trialId: number, domain: string, source: string, recordId: string): Promise<Task[]> {
    // Find tasks that reference the specific domain record in their description or dataReference
    const dataReference = `${domain}/${source}/${recordId}`;
    
    return Array.from(this.tasks.values()).filter(
      (task) => {
        // Check if task is for the correct trial
        if (task.trialId !== trialId) {
          return false;
        }
        
        // Check if it has the data reference in description or dataReference field
        const hasReferenceInDescription = task.description && 
          task.description.includes(dataReference);
          
        // Check if there's a signal detection with this reference
        const hasDetection = task.detectionId ? this.signalDetections.has(task.detectionId) : false;
        
        let hasReferenceInDetection = false;
        if (hasDetection && task.detectionId) {
          const detection = this.signalDetections.get(task.detectionId);
          hasReferenceInDetection = detection?.dataReference === dataReference;
        }
        
        // Return tasks that reference this data in any way and are not closed
        return (hasReferenceInDescription || hasReferenceInDetection) && 
               task.status !== TaskStatus.CLOSED;
      }
    );
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: now,
      updatedAt: now,
      completedAt: insertTask.completedAt ? new Date(insertTask.completedAt) : null
    };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, updateData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const now = new Date();
    const updatedTask = { 
      ...task, 
      ...updateData,
      updatedAt: now,
      // Set completedAt if status is changed to completed
      completedAt: updateData.status === 'completed' ? now : task.completedAt
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  // Task Comments Implementation
  async getTaskComments(taskId: number, priorityFetch?: boolean): Promise<TaskComment[]> {
    // Log for debugging purposes when fetching from notification
    if (priorityFetch) {
      console.log(`[MEMSTORAGE] Priority fetching comments for task ${taskId}`);
    }
    
    return Array.from(this.taskComments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const id = this.currentTaskCommentId++;
    const now = new Date();
    
    const comment: TaskComment = {
      ...insertComment,
      id,
      createdAt: now
    };
    
    this.taskComments.set(id, comment);
    
    // Update the last comment information in the task
    const task = this.tasks.get(insertComment.taskId);
    if (task) {
      this.tasks.set(task.id, {
        ...task,
        lastCommentAt: now,
        lastCommentBy: insertComment.createdBy,
        updatedAt: now
      });
    }
    
    return comment;
  }

  async deleteTaskComment(id: number): Promise<boolean> {
    const comment = this.taskComments.get(id);
    if (!comment) return false;
    
    this.taskComments.delete(id);
    return true;
  }
  
  // Risk Profile Management
  async getRiskProfilesByEntityType(entityType: string, entityId: number): Promise<RiskProfile[]> {
    return Array.from(this.riskProfiles.values()).filter(
      (profile) => profile.entityType === entityType && profile.entityId === entityId,
    );
  }
  
  async getRiskProfile(id: number): Promise<RiskProfile | undefined> {
    return this.riskProfiles.get(id);
  }
  
  async getAllRiskProfiles(): Promise<RiskProfile[]> {
    return Array.from(this.riskProfiles.values());
  }
  
  async getRiskProfilesByType(profileType: string): Promise<RiskProfile[]> {
    console.log(`Fetching profiles of type: ${profileType}`);
    console.log(`Total profiles in memory: ${this.riskProfiles.size}`);
    
    // Log all unique profileType values for debugging
    const uniqueTypes = new Set<string>();
    const allProfiles = Array.from(this.riskProfiles.values());
    
    for (const profile of allProfiles) {
      uniqueTypes.add(profile.profileType);
      console.log(`Profile ${profile.id}: type=${profile.profileType}, entityType=${profile.entityType}, entityId=${profile.entityId}`);
    }
    console.log(`Unique profile types in database: ${Array.from(uniqueTypes)}`);
    
    // Case-insensitive search for profiles
    const profiles = allProfiles.filter(profile => {
      const match = profile.profileType.toLowerCase() === profileType.toLowerCase();
      if (match) {
        console.log(`Match found: ${profile.id} - ${profile.profileType}`);
      }
      return match;
    });
    
    console.log(`Found ${profiles.length} profiles of type ${profileType}`);
    return profiles;
  }
  
  async createRiskProfile(insertProfile: InsertRiskProfile): Promise<RiskProfile> {
    const id = this.currentRiskProfileId++;
    const now = new Date();
    
    // Generate title based on profile type if not provided
    let title = insertProfile.title;
    
    if (!title) {
      // Try to get a more meaningful title by looking up the entity name
      try {
        if (insertProfile.entityType === 'vendor') {
          const vendor = await this.getVendor(insertProfile.entityId);
          if (vendor) {
            title = `${vendor.name} ${insertProfile.profileType} Assessment`;
          }
        } else if (insertProfile.entityType === 'trial') {
          const trial = await this.getTrial(insertProfile.entityId);
          if (trial) {
            title = `${trial.protocolId} ${insertProfile.profileType} Assessment`;
          }
        } else if (insertProfile.entityType === 'site') {
          const site = await this.getSite(insertProfile.entityId);
          if (site) {
            title = `${site.name} ${insertProfile.profileType} Assessment`;
          }
        } else if (insertProfile.entityType === 'resource') {
          const resource = await this.getResource(insertProfile.entityId);
          if (resource) {
            title = `${resource.name} ${insertProfile.profileType} Assessment`;
          }
        }
      } catch (err) {
        console.error(`Error generating profile title: ${err}`);
      }
      
      // If we still don't have a title after trying to get entity name, use the generic format
      if (!title) {
        title = `${insertProfile.profileType} Assessment for ${insertProfile.entityType} ${insertProfile.entityId}`;
      }
    }
    
    // Use provided assessment date or now
    const assessmentDate = insertProfile.assessmentDate || now;
    
    const profile: RiskProfile = {
      ...insertProfile,
      id,
      title,
      assessmentDate,
      createdAt: now,
      updatedAt: now,
      // Ensure recommendations is always an array (null is acceptable per schema)
      recommendations: insertProfile.recommendations || null
    };
    this.riskProfiles.set(id, profile);
    return profile;
  }
  
  async updateRiskProfile(id: number, updateData: Partial<RiskProfile>): Promise<RiskProfile | undefined> {
    const profile = this.riskProfiles.get(id);
    if (!profile) return undefined;
    
    const now = new Date();
    const updatedProfile = { 
      ...profile, 
      ...updateData,
      updatedAt: now
    };
    this.riskProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  // Risk Threshold Management
  async getRiskThresholdsByTrialId(trialId: number): Promise<RiskThreshold[]> {
    return Array.from(this.riskThresholds.values()).filter(
      (threshold) => threshold.trialId === trialId,
    );
  }
  
  async createRiskThreshold(insertThreshold: InsertRiskThreshold): Promise<RiskThreshold> {
    const id = this.currentRiskThresholdId++;
    const now = new Date();
    const threshold: RiskThreshold = {
      ...insertThreshold,
      id,
      createdAt: now,
      updatedAt: now,
      // Ensure required fields are set with defaults if not provided
      description: insertThreshold.description || null,
      enabled: insertThreshold.enabled ?? true
    };
    this.riskThresholds.set(id, threshold);
    return threshold;
  }
  
  async updateRiskThreshold(id: number, updateData: Partial<RiskThreshold>): Promise<RiskThreshold | undefined> {
    const threshold = this.riskThresholds.get(id);
    if (!threshold) return undefined;
    
    const now = new Date();
    const updatedThreshold = { 
      ...threshold, 
      ...updateData,
      updatedAt: now
    };
    this.riskThresholds.set(id, updatedThreshold);
    return updatedThreshold;
  }
  
  // Agent Workflow Management
  private currentAgentWorkflowId: number = 1;
  
  async getAgentWorkflows(aiComponent?: string): Promise<AgentWorkflow[]> {
    const workflows = Array.from(this.agentWorkflows.values());
    if (aiComponent) {
      return workflows.filter(workflow => workflow.aiComponent === aiComponent);
    }
    return workflows;
  }
  
  async getAgentWorkflow(id: number): Promise<AgentWorkflow | undefined> {
    return this.agentWorkflows.get(id);
  }
  
  async createAgentWorkflow(workflow: InsertAgentWorkflow): Promise<AgentWorkflow> {
    const id = this.currentAgentWorkflowId++;
    const now = new Date();
    
    console.log(`Creating workflow: ${workflow.name}, type: ${workflow.agentType}, component: ${workflow.aiComponent}`);
    
    // Process prerequisites to ensure it's a proper string array
    let prerequisites = null;
    if (workflow.prerequisites) {
      const agentTypes = Array.isArray(workflow.prerequisites.agentTypes)
        ? workflow.prerequisites.agentTypes.map(type => String(type))
        : [];
      prerequisites = { agentTypes };
    }
    
    // Process triggers to ensure it's a proper string array
    let triggers = null;
    if (workflow.triggers) {
      const events = Array.isArray(workflow.triggers.events)
        ? workflow.triggers.events.map(event => String(event))
        : [];
      triggers = { events };
    } else {
      triggers = { events: [] };
    }
    
    // Create the workflow with all required fields
    const newWorkflow: AgentWorkflow = {
      id,
      name: workflow.name,
      description: workflow.description || null,
      agentType: workflow.agentType,
      aiComponent: workflow.aiComponent,
      executionMode: workflow.executionMode || WorkflowExecutionMode.SEQUENTIAL,
      prerequisites: prerequisites,
      triggers: triggers,
      enabled: workflow.enabled !== undefined ? workflow.enabled : true,
      createdAt: now,
      updatedAt: now
    };
    
    console.log(`Workflow created with ID: ${id}, prerequisites:`, prerequisites);
    
    this.agentWorkflows.set(id, newWorkflow);
    return newWorkflow;
  }
  
  async updateAgentWorkflow(id: number, updates: Partial<InsertAgentWorkflow>): Promise<AgentWorkflow | undefined> {
    const workflow = this.agentWorkflows.get(id);
    if (!workflow) return undefined;
    
    const now = new Date();
    console.log(`Updating workflow ID ${id}: ${workflow.name}`);
    
    // Process prerequisites to ensure it's a proper string array
    let prerequisites = workflow.prerequisites;
    if (updates.prerequisites !== undefined) {
      if (updates.prerequisites === null) {
        prerequisites = null;
      } else {
        const agentTypes = Array.isArray(updates.prerequisites.agentTypes)
          ? updates.prerequisites.agentTypes.map(type => String(type))
          : [];
        prerequisites = { agentTypes };
      }
    }
    
    // Process triggers to ensure it's a proper string array
    let triggers = workflow.triggers;
    if (updates.triggers !== undefined) {
      if (updates.triggers === null) {
        triggers = { events: [] };
      } else {
        const events = Array.isArray(updates.triggers.events)
          ? updates.triggers.events.map(event => String(event))
          : [];
        triggers = { events };
      }
    }
    
    // Create a clean updated workflow object with all required fields
    const updatedWorkflow: AgentWorkflow = {
      ...workflow,
      name: updates.name !== undefined ? updates.name : workflow.name,
      description: updates.description !== undefined ? updates.description : workflow.description,
      agentType: updates.agentType || workflow.agentType,
      aiComponent: updates.aiComponent || workflow.aiComponent,
      executionMode: updates.executionMode || workflow.executionMode,
      prerequisites: prerequisites,
      triggers: triggers,
      enabled: updates.enabled !== undefined ? updates.enabled : workflow.enabled,
      updatedAt: now
    };
    
    console.log(`Workflow ${id} updated, prerequisites:`, prerequisites);
    
    this.agentWorkflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }
  
  async deleteAgentWorkflow(id: number): Promise<boolean> {
    return this.agentWorkflows.delete(id);
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  // Domain Data
  async getDomainSourcesByTrialId(trialId: number): Promise<DomainSource[]> {
    return await db.select().from(domainSources).where(eq(domainSources.trialId, trialId));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserEmailByUsername(username: string): Promise<string | undefined> {
    const [user] = await db.select({email: users.email}).from(users).where(eq(users.username, username));
    return user?.email;
  }
  
  async createNotification(notification: InsertNotification): Promise<any> {
    console.log(`DatabaseStorage.createNotification called with: ${JSON.stringify(notification, null, 2)}`);
    try {
      // Ensure targetRoles is an array
      if (notification.targetRoles && !Array.isArray(notification.targetRoles)) {
        notification.targetRoles = [notification.targetRoles];
      }
      
      // Ensure targetUsers is an array
      if (notification.targetUsers && !Array.isArray(notification.targetUsers)) {
        notification.targetUsers = [notification.targetUsers];
      }
      
      const [result] = await db.insert(notifications).values(notification).returning();
      console.log(`Successfully created notification with ID: ${result.id}`);
      return result;
    } catch (error) {
      console.error(`Error in DatabaseStorage.createNotification: ${error}`);
      console.error("Error creating notification:", error);
      return null;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  // Trials
  async getAllTrials(): Promise<Trial[]> {
    return db.select().from(trials);
  }
  
  async getTrial(id: number): Promise<Trial | undefined> {
    const [trial] = await db.select().from(trials).where(eq(trials.id, id));
    return trial;
  }
  
  async getTrialByProtocolId(protocolId: string): Promise<Trial | undefined> {
    const [trial] = await db.select().from(trials).where(eq(trials.protocolId, protocolId));
    return trial;
  }
  
  async createTrial(insertTrial: InsertTrial): Promise<Trial> {
    const [trial] = await db.insert(trials).values(insertTrial).returning();
    return trial;
  }
  
  // Sites
  async getAllSites(): Promise<Site[]> {
    return db.select().from(sites);
  }
  
  async getSitesByTrialId(trialId: number): Promise<Site[]> {
    return db.select().from(sites).where(eq(sites.trialId, trialId));
  }
  
  async getSite(id: number): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site;
  }
  
  async getSiteBySiteId(siteId: string): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.siteId, siteId));
    return site;
  }
  
  async createSite(insertSite: InsertSite): Promise<Site> {
    const [site] = await db.insert(sites).values(insertSite).returning();
    return site;
  }
  
  // Patients
  async getPatientsBySiteId(siteId: number): Promise<Patient[]> {
    return db.select().from(patients).where(eq(patients.siteId, siteId));
  }
  
  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db.insert(patients).values(insertPatient).returning();
    return patient;
  }
  
  // Vendors
  async getAllVendors(): Promise<Vendor[]> {
    return db.select().from(vendors);
  }
  
  async getVendorsByType(type: string): Promise<Vendor[]> {
    return db.select().from(vendors).where(eq(vendors.type, type));
  }
  
  async getVendor(id: number): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    return vendor;
  }
  
  async getVendorByName(name: string): Promise<Vendor | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.name, name));
    return vendor;
  }
  
  async createVendor(insertVendor: InsertVendor): Promise<Vendor> {
    const [vendor] = await db.insert(vendors).values(insertVendor).returning();
    return vendor;
  }
  
  async updateVendor(id: number, updateData: Partial<Vendor>): Promise<Vendor | undefined> {
    const [vendor] = await db
      .update(vendors)
      .set({...updateData, updatedAt: new Date()})
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }
  
  // Resources
  async getAllResources(): Promise<Resource[]> {
    return db.select().from(resources);
  }
  
  async getResourcesByTrialId(trialId: number): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.trialId, trialId));
  }
  
  async getResourcesByRole(role: string): Promise<Resource[]> {
    return db.select().from(resources).where(eq(resources.role, role));
  }
  
  async getResource(id: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.id, id));
    return resource;
  }
  
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const [resource] = await db.insert(resources).values(insertResource).returning();
    return resource;
  }
  
  async updateResource(id: number, updateData: Partial<Resource>): Promise<Resource | undefined> {
    const [resource] = await db
      .update(resources)
      .set({...updateData, updatedAt: new Date()})
      .where(eq(resources.id, id))
      .returning();
    return resource;
  }
  
  // Signal Detections
  async getAllSignalDetections(): Promise<SignalDetection[]> {
    return db.select().from(signalDetections);
  }
  
  async getSignalDetectionsByTrialId(trialId: number): Promise<SignalDetection[]> {
    return db.select().from(signalDetections).where(eq(signalDetections.trialId, trialId));
  }
  
  async getSignalDetection(id: number): Promise<SignalDetection | undefined> {
    const [detection] = await db.select().from(signalDetections).where(eq(signalDetections.id, id));
    return detection;
  }
  
  async getSignalDetectionByDetectionId(detectionId: string): Promise<SignalDetection | undefined> {
    const [detection] = await db.select().from(signalDetections).where(eq(signalDetections.detectionId, detectionId));
    return detection;
  }
  
  async createSignalDetection(insertDetection: InsertSignalDetection): Promise<SignalDetection> {
    const [detection] = await db.insert(signalDetections).values(insertDetection).returning();
    return detection;
  }
  
  async updateSignalDetection(id: number, updateData: Partial<SignalDetection>): Promise<SignalDetection | undefined> {
    const [detection] = await db
      .update(signalDetections)
      .set({...updateData, updatedAt: new Date()})
      .where(eq(signalDetections.id, id))
      .returning();
    return detection;
  }
  
  // Tasks
  async getAllTasks(): Promise<Task[]> {
    return db.select().from(tasks);
  }
  
  async getTasksByTrialId(trialId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.trialId, trialId));
  }
  
  async getTasksBySiteId(siteId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.siteId, siteId));
  }
  
  async getTasksByAssignee(assignedTo: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.assignedTo, assignedTo));
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  
  async getTaskByTaskId(taskId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.taskId, taskId));
    return task;
  }
  
  async getTasksByReference(trialId: number, domain: string, source: string, recordId: string): Promise<Task[]> {
    // Find tasks that reference this record in their description
    const referenceString = `${domain}-${source}-${recordId}`;
    const searchPattern = `%${referenceString}%`;
    
    return db.select().from(tasks)
      .where(and(
        eq(tasks.trialId, trialId),
        like(tasks.description, searchPattern),
        sql`${tasks.status} != 'closed'`
      ));
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    // Use a unique taskId if one wasn't provided
    if (!insertTask.taskId) {
      // Generate a unique task ID based on current timestamp
      const timestamp = new Date().getTime();
      insertTask.taskId = `TASK-${timestamp}`;
    }
    
    // Ensure status values are consistent and follow the lowercase with underscore format
    // Handle case sensitivity and format inconsistencies in task status
    if (insertTask.status) {
      const statusStr = String(insertTask.status);
      
      // Transform from enum constants to appropriate string values
      if (statusStr === TaskStatus.NOT_STARTED) {
        insertTask.status = 'not_started';
      } else if (statusStr === TaskStatus.IN_PROGRESS) {
        insertTask.status = 'in_progress';
      } else if (statusStr === TaskStatus.ASSIGNED) {
        insertTask.status = 'assigned';
      } else if (statusStr === TaskStatus.CLOSED) {
        insertTask.status = 'closed';
      } else if (statusStr === ExtendedTaskStatus.RESPONDED) {
        insertTask.status = 'responded';
      } else if (statusStr === ExtendedTaskStatus.UNDER_REVIEW) {
        insertTask.status = 'under_review';
      } else if (statusStr === ExtendedTaskStatus.REOPENED) {
        insertTask.status = 're_opened';
      } else if (statusStr === ExtendedTaskStatus.COMPLETED) {
        insertTask.status = 'completed';
      } else {
        // For any other format, normalize to lowercase with underscores
        const normalizedStatus = statusStr
          .toLowerCase()
          .replace(/\s+/g, '_')  // replace spaces with underscores
          .replace(/-/g, '_');   // replace hyphens with underscores
        
        insertTask.status = normalizedStatus;
      }
    }
    
    console.log("Creating task with normalized status:", insertTask.status);
    const [task] = await db.insert(tasks).values(insertTask).returning();
    console.log("Created task in database:", task);
    return task;
  }
  
  async updateTask(id: number, updateData: Partial<Task>): Promise<Task | undefined> {
    const updates = {...updateData, updatedAt: new Date()};
    
    // Ensure status values are consistent and follow the lowercase with underscore format
    if (updates.status) {
      const statusStr = String(updates.status);
      
      // Transform from enum constants to appropriate string values
      if (statusStr === TaskStatus.NOT_STARTED) {
        updates.status = 'not_started';
      } else if (statusStr === TaskStatus.IN_PROGRESS) {
        updates.status = 'in_progress';
      } else if (statusStr === TaskStatus.ASSIGNED) {
        updates.status = 'assigned';
      } else if (statusStr === TaskStatus.CLOSED) {
        updates.status = 'closed';
      } else if (statusStr === ExtendedTaskStatus.RESPONDED) {
        updates.status = 'responded';
      } else if (statusStr === ExtendedTaskStatus.UNDER_REVIEW) {
        updates.status = 'under_review';
      } else if (statusStr === ExtendedTaskStatus.REOPENED) {
        updates.status = 're_opened';
      } else if (statusStr === ExtendedTaskStatus.COMPLETED) {
        updates.status = 'completed';
      } else {
        // For any other format, normalize to lowercase with underscores
        const normalizedStatus = statusStr
          .toLowerCase()
          .replace(/\s+/g, '_')  // replace spaces with underscores
          .replace(/-/g, '_');   // replace hyphens with underscores
        
        updates.status = normalizedStatus;
      }
    }
    
    // Set completedAt if status is changed to completed or closed
    if (updates.status === 'completed' || updates.status === 'closed') {
      updates.completedAt = new Date();
    }
    
    console.log(`Updating task ${id} with normalized status: ${updates.status}`);
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
      
    return task;
  }
  
  // Task Comments
  async getTaskComments(taskId: number, priorityFetch?: boolean): Promise<TaskComment[]> {
    // If this is a priority fetch from a notification, add additional logging and handling
    if (priorityFetch) {
      console.log(`[DBSTORAGE] Priority fetching comments for task ${taskId}`);
      
      try {
        // Use a direct SQL query for priority fetches to bypass any potential caching
        const result = await db.select()
          .from(taskComments)
          .where(eq(taskComments.taskId, taskId))
          .orderBy(taskComments.createdAt);
        
        console.log(`[DBSTORAGE] Priority fetch successful, retrieved ${result.length} comments`);
        return result;
      } catch (error) {
        console.error(`[DBSTORAGE] Error in priority fetch: ${error}`);
        // Fall through to standard retrieval method
      }
    }
    
    // Standard retrieval method
    return db.select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(taskComments.createdAt);
  }
  
  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db.insert(taskComments).values(insertComment).returning();
    
    // Update the task's lastCommentAt and lastCommentBy fields
    await db.update(tasks)
      .set({ 
        lastCommentAt: new Date(), 
        lastCommentBy: insertComment.createdBy 
      })
      .where(eq(tasks.id, insertComment.taskId));
      
    return comment;
  }
  
  async deleteTaskComment(id: number): Promise<boolean> {
    const result = await db.delete(taskComments).where(eq(taskComments.id, id)).returning();
    return result.length > 0;
  }
  
  // Risk Profiles
  async getRiskProfilesByEntityType(entityType: string, entityId: number): Promise<RiskProfile[]> {
    return db.select()
      .from(riskProfiles)
      .where(and(
        eq(riskProfiles.entityType, entityType),
        eq(riskProfiles.entityId, entityId)
      ));
  }
  
  async getRiskProfile(id: number): Promise<RiskProfile | undefined> {
    const [profile] = await db.select().from(riskProfiles).where(eq(riskProfiles.id, id));
    return profile;
  }
  
  async getRiskProfilesByType(profileType: string): Promise<RiskProfile[]> {
    return db.select().from(riskProfiles).where(eq(riskProfiles.profileType, profileType));
  }
  
  async getAllRiskProfiles(): Promise<RiskProfile[]> {
    return db.select().from(riskProfiles);
  }
  
  async createRiskProfile(insertProfile: InsertRiskProfile): Promise<RiskProfile> {
    const [profile] = await db.insert(riskProfiles).values(insertProfile).returning();
    return profile;
  }
  
  async updateRiskProfile(id: number, updateData: Partial<RiskProfile>): Promise<RiskProfile | undefined> {
    const [profile] = await db
      .update(riskProfiles)
      .set({...updateData, updatedAt: new Date()})
      .where(eq(riskProfiles.id, id))
      .returning();
    return profile;
  }
  
  // Risk Thresholds
  async getRiskThresholdsByTrialId(trialId: number): Promise<RiskThreshold[]> {
    return db.select().from(riskThresholds).where(eq(riskThresholds.trialId, trialId));
  }
  
  async createRiskThreshold(insertThreshold: InsertRiskThreshold): Promise<RiskThreshold> {
    const [threshold] = await db.insert(riskThresholds).values(insertThreshold).returning();
    return threshold;
  }
  
  async updateRiskThreshold(id: number, updateData: Partial<RiskThreshold>): Promise<RiskThreshold | undefined> {
    const [threshold] = await db
      .update(riskThresholds)
      .set({...updateData, updatedAt: new Date()})
      .where(eq(riskThresholds.id, id))
      .returning();
    return threshold;
  }
  
  // Agent Workflows
  async getAgentWorkflows(aiComponent?: string): Promise<AgentWorkflow[]> {
    if (aiComponent) {
      return db.select().from(agentWorkflows).where(eq(agentWorkflows.aiComponent, aiComponent));
    }
    return db.select().from(agentWorkflows);
  }
  
  async getAgentWorkflow(id: number): Promise<AgentWorkflow | undefined> {
    const [workflow] = await db.select().from(agentWorkflows).where(eq(agentWorkflows.id, id));
    return workflow;
  }
  
  async createAgentWorkflow(insertWorkflow: InsertAgentWorkflow): Promise<AgentWorkflow> {
    const [workflow] = await db.insert(agentWorkflows).values(insertWorkflow).returning();
    return workflow;
  }
  
  async updateAgentWorkflow(id: number, updateData: Partial<InsertAgentWorkflow>): Promise<AgentWorkflow | undefined> {
    const [workflow] = await db
      .update(agentWorkflows)
      .set({...updateData, updatedAt: new Date()})
      .where(eq(agentWorkflows.id, id))
      .returning();
    return workflow;
  }
  
  async deleteAgentWorkflow(id: number): Promise<boolean> {
    const result = await db.delete(agentWorkflows).where(eq(agentWorkflows.id, id)).returning();
    return result.length > 0;
  }
  
  // Activity Logs
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [activityLog] = await db
      .insert(activityLogs)
      .values(log)
      .returning();
    return activityLog;
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
