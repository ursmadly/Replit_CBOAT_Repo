import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  avatar: text("avatar"),
  studyAccess: text("study_access").array(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Clinical Trials
export const trials = pgTable("trials", {
  id: serial("id").primaryKey(),
  protocolId: text("protocol_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  phase: text("phase").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  therapeuticArea: text("therapeutic_area"),
  indication: text("indication"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTrialSchema = createInsertSchema(trials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Sites
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  siteId: text("site_id").notNull().unique(),
  trialId: integer("trial_id").notNull().references(() => trials.id),
  name: text("name").notNull(),
  location: text("location"),
  principalInvestigator: text("principal_investigator"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSiteSchema = createInsertSchema(sites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Patients
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  status: text("status").notNull().default("enrolled"),
  enrollmentDate: timestamp("enrollment_date").notNull(),
  screeningFailure: boolean("screening_failure").default(false),
  screeningFailureReason: text("screening_failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Risk Profiles
export const riskProfiles = pgTable("risk_profiles", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // trial, site, patient, vendor
  entityId: integer("entity_id").notNull(),
  profileType: text("profile_type").notNull(), // Risk, Quality, Compliance, Safety, Vendor, Financial, Resource
  title: text("title").notNull().default("Risk Assessment"),
  riskScore: integer("risk_score").notNull(),
  metrics: jsonb("metrics").notNull(),
  recommendations: jsonb("recommendations").array(),
  assessmentDate: timestamp("assessment_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRiskProfileSchema = createInsertSchema(riskProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Signal Detections
export const signalDetections = pgTable("signal_detections", {
  id: serial("id").primaryKey(),
  detectionId: text("detection_id").notNull().unique(),
  title: text("title").notNull().default("Signal Detection"),
  signalType: text("signal_type").notNull().default("Site Risk"), // Site Risk, Safety Risk, PD Risk, LAB Testing Risk, Enrollment Risk, AE Risk
  detectionType: text("detection_type").notNull().default("Manual"), // Automated, Rule-based, Manual
  trialId: integer("trial_id").notNull().references(() => trials.id),
  siteId: integer("site_id").references(() => sites.id),
  dataReference: text("data_reference"),
  observation: text("observation").notNull(),
  priority: text("priority").notNull(), // Critical, High, Medium, Low
  status: text("status").notNull().default("initiated"),
  assignedTo: text("assigned_to"),
  detectionDate: timestamp("detection_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull().default("System"),
  notifiedPersons: text("notified_persons").array(),
});

export const insertSignalDetectionSchema = createInsertSchema(signalDetections).omit({
  id: true,
  createdAt: true,
});

// Task responses/comments
export const taskComments = pgTable("task_comments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  comment: text("comment").notNull(),
  createdBy: text("created_by").notNull(),
  role: text("role"), // Added role field for user role (CRA, Medical Monitor, PI)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  attachments: text("attachments").array(),
});

export const insertTaskCommentSchema = createInsertSchema(taskComments)
  .omit({
    id: true,
    createdAt: true,
  });

// Tasks
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(), // Critical, High, Medium, Low
  status: text("status").notNull().default("not_started"), // not_started, assigned, in_progress, closed
  trialId: integer("trial_id").notNull().references(() => trials.id),
  siteId: integer("site_id").references(() => sites.id),
  detectionId: integer("detection_id").references(() => signalDetections.id),
  assignedTo: text("assigned_to"),
  createdBy: text("created_by").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  lastCommentAt: timestamp("last_comment_at"),
  lastCommentBy: text("last_comment_by"),
  // Additional fields for data context
  domain: text("domain"), // DM, AE, VS, LB, etc.
  recordId: text("record_id"), // Unique identifier for the data record
  source: text("source"), // EDC, CTMS, etc.
  dataContext: jsonb("data_context"), // Additional structured data for context
});

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    completedAt: true,
    lastCommentAt: true,
    lastCommentBy: true,
  })
  .extend({
    taskId: z.string().optional(),
    dueDate: z.string().or(z.date()).optional(),
    completedAt: z.string().or(z.date()).optional(),
    // Make the new data context fields optional
    domain: z.string().optional(),
    recordId: z.string().optional(),
    source: z.string().optional(),
    dataContext: z.record(z.any()).optional()
  });

// Risk Thresholds
export const riskThresholds = pgTable("risk_thresholds", {
  id: serial("id").primaryKey(),
  trialId: integer("trial_id").notNull().references(() => trials.id),
  metricName: varchar("metric_name", { length: 100 }).notNull(),
  description: text("description"),
  lowThreshold: integer("low_threshold").notNull(),
  mediumThreshold: integer("medium_threshold").notNull(),
  highThreshold: integer("high_threshold").notNull(),
  criticalThreshold: integer("critical_threshold").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRiskThresholdSchema = createInsertSchema(riskThresholds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Vendors
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // CRO, Lab, Imaging, IRT, etc.
  contactPerson: text("contact_person").notNull(),
  contactEmail: text("contact_email").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Resources (Personnel)
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(), // CRA, DM, Medical Monitor, etc.
  email: text("email").notNull(),
  phone: text("phone"),
  trialId: integer("trial_id").notNull().references(() => trials.id),
  availability: integer("availability").notNull().default(100), // Percentage of availability
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export Types
export type Trial = typeof trials.$inferSelect;
export type InsertTrial = z.infer<typeof insertTrialSchema>;

export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type RiskProfile = typeof riskProfiles.$inferSelect;
export type InsertRiskProfile = z.infer<typeof insertRiskProfileSchema>;

export type SignalDetection = typeof signalDetections.$inferSelect;
export type InsertSignalDetection = z.infer<typeof insertSignalDetectionSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type RiskThreshold = typeof riskThresholds.$inferSelect;
export type InsertRiskThreshold = z.infer<typeof insertRiskThresholdSchema>;

// Agent types for workflow definitions
export enum AgentType {
  DATA_FETCH = 'DataFetch',
  DATA_QUALITY = 'DataQuality',
  DATA_RECONCILIATION = 'DataReconciliation',
  SIGNAL_DETECTION = 'SignalDetection',
  TASK_MANAGER = 'TaskManager',
  QUERY_MANAGER = 'QueryManager',
  REPORT_GENERATOR = 'ReportGenerator',
  EVENT_MONITOR = 'EventMonitor',
  DOMAIN_PROGRESS = 'DomainProgress',
  SITE_MONITOR = 'SiteMonitor'
}

// Workflow execution modes
export enum WorkflowExecutionMode {
  SEQUENTIAL = 'Sequential',
  INDEPENDENT = 'Independent',
  CONDITIONAL = 'Conditional'
}

// Agent Workflows
export const agentWorkflows = pgTable("agent_workflows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  agentType: text("agent_type").notNull(),
  aiComponent: text("ai_component").notNull(), // 'DataManagerAI' or 'CentralMonitorAI'
  executionMode: text("execution_mode").notNull().default(WorkflowExecutionMode.SEQUENTIAL),
  prerequisites: jsonb("prerequisites").$type<{ agentTypes: string[] }>(), // Agent types that must run before this one
  triggers: jsonb("triggers").$type<{ events: string[] }>(), // Events that trigger this agent
  trialId: integer("trial_id").references(() => trials.id), // Optional, can be null for global workflows
  protocolId: text("protocol_id").references(() => trials.protocolId), // Added reference to protocol ID
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAgentWorkflowSchema = createInsertSchema(agentWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AgentWorkflow = typeof agentWorkflows.$inferSelect;
export type InsertAgentWorkflow = z.infer<typeof insertAgentWorkflowSchema>;

// Priority and Status Enums
export const TaskPriority = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
} as const;

export const TaskStatus = {
  NOT_STARTED: 'not_started',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed'
} as const;

export const ExtendedTaskStatus = {
  ...TaskStatus,
  RESPONDED: 'responded',
  REOPENED: 're_opened',
  UNDER_REVIEW: 'under_review',
  COMPLETED: 'completed'
} as const;

export const ProfileType = {
  RISK: 'Risk',
  QUALITY: 'Quality',
  COMPLIANCE: 'Compliance',
  SAFETY: 'Safety',
  VENDOR: 'Vendor',
  FINANCIAL: 'Financial',
  RESOURCE: 'Resource'
} as const;

export const EntityType = {
  TRIAL: 'trial',
  SITE: 'site',
  PATIENT: 'patient',
  VENDOR: 'vendor',
  RESOURCE: 'resource'
} as const;

export const SignalType = {
  SITE_RISK: 'Site Risk',
  SAFETY_RISK: 'Safety Risk',
  PD_RISK: 'PD Risk',
  LAB_RISK: 'LAB Testing Risk',
  ENROLLMENT_RISK: 'Enrollment Risk',
  AE_RISK: 'AE Risk'
} as const;

export const DetectionType = {
  AUTOMATED: 'Automated',
  RULE_BASED: 'Rule-based',
  MANUAL: 'Manual'
} as const;

export const DataSourceType = {
  EDC: 'EDC',
  CTMS: 'CTMS',
  IRT: 'IRT',
  LIMS: 'LIMS',
  SUPPLY_CHAIN: 'Supply Chain',
  DATA_LAKE: 'Data Lake',
  SCREEN_FAILURE: 'Screen Failure',
  LAB_RESULTS: 'Lab Results',
  ADVERSE_EVENTS: 'Adverse Events',
  PROTOCOL_DEVIATIONS: 'Protocol Deviations',
  ENROLLMENT: 'Enrollment',
  DATA_QUALITY: 'Data Quality',
  EXTERNAL_LAB: 'External Lab',
  FINANCIAL: 'Financial',
  SAFETY_DB: 'Safety Database',
  DATA_MANAGEMENT: 'Data Management'
} as const;

// Domain Data Tables
export const domainData = pgTable("domain_data", {
  id: serial("id").primaryKey(),
  trialId: integer("trial_id").notNull().references(() => trials.id),
  domain: text("domain").notNull(), // DM, AE, VS, LB, etc.
  source: text("source").notNull(), // EDC, CTMS, IRT, etc.
  recordId: text("record_id").notNull(), // Unique identifier for each record
  recordData: text("record_data").notNull(), // JSON string of the data
  importedAt: timestamp("imported_at").notNull().defaultNow(), // When this record was imported
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDomainDataSchema = createInsertSchema(domainData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Domain Source Connections
export const domainSources = pgTable("domain_sources", {
  id: serial("id").primaryKey(),
  trialId: integer("trial_id").notNull().references(() => trials.id),
  domain: text("domain").notNull(),
  source: text("source").notNull(), // Unique source identifier within a domain
  sourceType: text("source_type").notNull(), // EDC, CTMS, etc.
  system: text("system").notNull(), // System name (e.g., Medidata Rave)
  integrationMethod: text("integration_method").notNull(), // API, SFTP, manual, etc.
  format: text("format").notNull(), // JSON, CSV, XML, etc.
  description: text("description"), // Optional description
  mappingDetails: text("mapping_details"), // Optional mapping information
  frequency: text("frequency"), // How often data is refreshed
  contact: text("contact"), // Contact person for this data source
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDomainSourceSchema = createInsertSchema(domainSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export Domain Types
export type DomainData = typeof domainData.$inferSelect;
export type InsertDomainData = z.infer<typeof insertDomainDataSchema>;

export type DomainSource = typeof domainSources.$inferSelect;
export type InsertDomainSource = z.infer<typeof insertDomainSourceSchema>;

// Protocol Digitization Tables
export const protocolDocuments = pgTable("protocol_documents", {
  id: serial("id").primaryKey(),
  protocolId: text("protocol_id").notNull().unique(),
  title: text("title").notNull(),
  phase: text("phase").notNull(),
  indication: text("indication").notNull(),
  sponsor: text("sponsor").notNull(),
  status: text("status").notNull().default("draft"), // draft, active, completed, terminated
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(), // pdf, doc, docx
  processingStatus: text("processing_status").notNull().default("completed"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const protocolSections = pgTable("protocol_sections", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull().references(() => protocolDocuments.id),
  sectionId: text("section_id").notNull(), // e.g., background, inclusion-criteria, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("complete"), // incomplete, complete, edited
  category: text("category").notNull(), // Study Information, Eligibility Criteria, etc.
  displayOrder: integer("display_order").notNull(),
  expanded: boolean("expanded").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastEditedBy: text("last_edited_by"),
});

export const insertProtocolDocumentSchema = createInsertSchema(protocolDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertProtocolSectionSchema = createInsertSchema(protocolSections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ProtocolDocument = typeof protocolDocuments.$inferSelect;
export type InsertProtocolDocument = z.infer<typeof insertProtocolDocumentSchema>;

export type ProtocolSection = typeof protocolSections.$inferSelect;
export type InsertProtocolSection = z.infer<typeof insertProtocolSectionSchema>;

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // signal, task, system, protocol, data, monitoring, query, safety
  priority: text("priority").notNull(), // critical, high, medium, low, info
  trialId: integer("trial_id").references(() => trials.id),
  source: text("source"), // Source of the notification (e.g., "Signal Detection AI", "Data Integration Engine")
  relatedEntityType: text("related_entity_type"), // "task", "signal", "protocol", etc.
  relatedEntityId: integer("related_entity_id"), // ID of the related entity (e.g., task ID, signal ID)
  read: boolean("read").notNull().default(false),
  actionRequired: boolean("action_required").notNull().default(false),
  actionUrl: text("action_url"), // URL to navigate to when clicking the notification
  targetRoles: text("target_roles").array(), // Roles that should receive this notification 
  targetUsers: integer("target_users").array(), // Specific user IDs to receive this notification
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readAt: timestamp("read_at"),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Notification Settings
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  pushNotifications: boolean("push_notifications").notNull().default(true),
  criticalOnly: boolean("critical_only").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notificationReadStatus = pgTable("notification_read_status", {
  id: serial("id").primaryKey(),
  notificationId: integer("notification_id").notNull().references(() => notifications.id),
  userId: integer("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationReadStatusSchema = createInsertSchema(notificationReadStatus).omit({
  id: true,
  readAt: true,
  createdAt: true,
});

export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingsSchema>;

export type NotificationReadStatus = typeof notificationReadStatus.$inferSelect;
export type InsertNotificationReadStatus = z.infer<typeof insertNotificationReadStatusSchema>;

// Agent Status
export const agentStatus = pgTable("agent_status", {
  id: serial("id").primaryKey(),
  agentType: text("agent_type").notNull(),  // Matches AgentType enum
  status: text("status").notNull().default("active"), // active, inactive, error
  lastRunTime: timestamp("last_run_time").notNull().defaultNow(),
  recordsProcessed: integer("records_processed").notNull().default(0),
  issuesFound: integer("issues_found").notNull().default(0),
  trialId: integer("trial_id").references(() => trials.id), // Optional, can be null for global agents
  protocolId: text("protocol_id").references(() => trials.protocolId), // Added reference to protocol ID
  details: jsonb("details"), // Additional details like task IDs
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAgentStatusSchema = createInsertSchema(agentStatus).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AgentStatus = typeof agentStatus.$inferSelect;
export type InsertAgentStatus = z.infer<typeof insertAgentStatusSchema>;

// Activity Logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  activityType: text("activity_type").notNull(),
  description: text("description").notNull(),
  performedBy: text("performed_by").notNull(),
  trialId: integer("trial_id").references(() => trials.id),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
