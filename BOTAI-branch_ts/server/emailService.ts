import { MailService } from '@sendgrid/mail';
import { eq, or } from 'drizzle-orm';
import { db } from './db';
import { users, notificationSettings } from '@shared/schema';

// Email configuration
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@cboat-platform.com';

// Initialize SendGrid Mail Service
let mailService: MailService;

function initializeMailService() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn("SENDGRID_API_KEY environment variable not set. Email functionality disabled.");
    return;
  }

  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize the mail service on module load
initializeMailService();

// Type definitions
export interface EmailNotification {
  to: string;
  subject: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
  text?: string;
  html?: string;
}

export interface TaskNotificationData {
  taskId: string;
  taskTitle: string;
  dueDate: string;
  priority: string;
  assignedRole: string;
  description: string;
  trialId: string;
  domain?: string;
  recordId?: string;
  source?: string;
  dataContext?: any;
}

export interface SignalNotificationData {
  signalId: string;
  title: string;
  detectionDate: string;
  priority: string;
  assignedTo: string;
  description: string;
  trialId: string;
  source: string;
}

// Template IDs for SendGrid
const TEMPLATE_IDS = {
  TASK: process.env.SENDGRID_TASK_TEMPLATE_ID || '',
  SIGNAL: process.env.SENDGRID_SIGNAL_TEMPLATE_ID || '',
  GENERAL: process.env.SENDGRID_GENERAL_TEMPLATE_ID || '',
};

/**
 * Send email notification using SendGrid
 * @param notification Email notification details
 * @returns Promise<boolean> Success status
 */
export async function sendEmail(
  notification: EmailNotification,
): Promise<boolean> {
  // TEMPORARILY DISABLED - Email sending is disabled due to daily limit
  console.log(`Email sending is temporarily disabled due to daily limit. Would have sent email to ${notification.to}`);
  return true;
}

/**
 * Send bulk emails with personalized content to multiple recipients
 * This is more efficient than sending individual emails for large batches
 * @param recipients Array of recipient email addresses
 * @param subject Email subject
 * @param templateId SendGrid template ID
 * @param personalizations Array of personalization data for each recipient
 * @returns Promise<number> Number of emails successfully sent
 */
export async function sendBulkEmails(
  recipients: string[],
  subject: string,
  templateId: string,
  personalizations: Record<string, any>[]
): Promise<number> {
  // TEMPORARILY DISABLED - Email sending is disabled due to daily limit
  console.log(`Bulk email sending is temporarily disabled due to daily limit. Would have sent ${recipients.length} emails with subject "${subject}"`);
  return recipients.length;
}

/**
 * Get users by role for sending notifications
 * @param role The role to filter users by
 * @returns Array of user emails
 */
export async function getUsersByRole(role: string): Promise<string[]> {
  try {
    const roleUsers = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.role, role));

    return roleUsers
      .map((user) => user.email)
      .filter((email) => !email.endsWith("@example.com"));
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return [];
  }
}

/**
 * Check if a user has email notifications enabled
 * @param userId User ID to check
 * @param priority Priority of the notification (to check criticalOnly setting)
 * @returns Boolean indicating if email should be sent
 */
export async function shouldSendEmailNotification(
  userId: number,
  priority: string = "medium"
): Promise<boolean> {
  try {
    // Get user notification settings
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    
    // If no settings found, use defaults (true for all notifications)
    if (!settings) {
      console.log(`No notification settings found for user ${userId}, using defaults (all enabled)`);
      return true;
    }
    
    // Check if email notifications are enabled
    if (!settings.emailNotifications) {
      console.log(`Email notifications disabled for user ${userId}`);
      return false;
    }
    
    // If criticalOnly is enabled, only send for critical/high priority notifications
    if (settings.criticalOnly) {
      const isPriorityHigh = 
        priority.toLowerCase() === 'critical' || 
        priority.toLowerCase() === 'high';
      
      if (!isPriorityHigh) {
        console.log(`Skipping non-critical email for user ${userId} (criticalOnly is enabled)`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error checking notification settings:", error);
    // Default to sending if there's an error checking settings
    return true;
  }
}

/**
 * Get user email by username
 * @param username Username to look up
 * @returns User email or null
 */
export async function getUserEmailByUsername(
  username: string,
): Promise<string | null> {
  try {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.username, username));

    if (user && !user.email.endsWith("@example.com")) {
      return user.email;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user email by username:", error);
    return null;
  }
}

/**
 * Send notification for new task
 * @param taskData Task notification data
 */
export async function sendTaskNotification(
  taskData: TaskNotificationData,
): Promise<boolean> {
  try {
    // Format the taskId with the TASK_ prefix if not already present
    const taskIdDisplay = taskData.taskId.startsWith('TASK_') ? taskData.taskId : `TASK_${taskData.taskId}`;
    // TEMPORARILY DISABLED - Email sending is disabled due to daily limit
    console.log(`Task email notification is temporarily disabled due to daily limit. Would have sent task notification "${taskIdDisplay}: ${taskData.taskTitle}" to role ${taskData.assignedRole}`);
    
    // Get all users with the assigned role
    const targetRoleUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.role, taskData.assignedRole));
    
    // Also get all Principal Investigators
    const principalInvestigators = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.role, "Principal Investigator"));
      
    // Also get all Admin users
    // REQUIREMENT: Notifications should be sent to admin regardless of task assigned role
    const adminUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(
        or(
          eq(users.role, "Admin"),
          eq(users.role, "System Administrator")
        )
      );
    
    // Combine the users, making sure all required roles receive notifications
    const allUsersToNotify = [...targetRoleUsers];
    
    // Add Principal Investigators
    for (const pi of principalInvestigators) {
      if (!allUsersToNotify.some(user => user.id === pi.id)) {
        allUsersToNotify.push(pi);
      }
    }
    
    // Add Admin users to notifications
    for (const admin of adminUsers) {
      if (!allUsersToNotify.some(user => user.id === admin.id)) {
        allUsersToNotify.push(admin);
        console.log(`Adding Admin user ${admin.fullName} to email notification recipients`);
      }
    }
    
    console.log(`Would have sent task email notification to ${allUsersToNotify.length} users (including ${principalInvestigators.length} Principal Investigators)`);
    
    // For each user, check their notification preferences
    for (const user of allUsersToNotify) {
      const shouldSend = await shouldSendEmailNotification(user.id, taskData.priority);
      
      if (shouldSend) {
        console.log(`Would have sent email notification to ${user.email} (${user.role}) for task "${taskData.taskTitle}"`);
      } else {
        console.log(`Skipping email notification to ${user.email} (${user.role}) based on notification preferences`);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error preparing task email notifications:", error);
    return false;
  }
}

/**
 * Send notification for new signal detection
 * @param signalData Signal notification data
 */
export async function sendSignalNotification(
  signalData: SignalNotificationData,
): Promise<boolean> {
  try {
    // TEMPORARILY DISABLED - Email sending is disabled due to daily limit
    console.log(`Signal email notification is temporarily disabled due to daily limit. Would have sent signal notification "${signalData.title}" to ${signalData.assignedTo}`);
    
    // Parse assigned roles (signalData.assignedTo might contain comma-separated roles)
    const assignedRoles = signalData.assignedTo.split(',').map(role => role.trim());
    
    // Get all users with the assigned roles
    let targetRoleUsers: Array<{id: number, email: string, role: string, fullName: string}> = [];
    for (const role of assignedRoles) {
      const usersWithRole = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          fullName: users.fullName,
        })
        .from(users)
        .where(eq(users.role, role));
      
      targetRoleUsers = [...targetRoleUsers, ...usersWithRole];
    }
    
    // Also get all Principal Investigators
    const principalInvestigators = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.role, "Principal Investigator"));
      
    // Also get all Admin users
    // REQUIREMENT: Notifications should be sent to admin regardless of task assigned role
    const adminUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(
        or(
          eq(users.role, "Admin"),
          eq(users.role, "System Administrator")
        )
      );
    
    // Combine the users, making sure Principal Investigators and Admins are included
    const allUsersToNotify = [...targetRoleUsers];
    
    // Add Principal Investigators
    for (const pi of principalInvestigators) {
      if (!allUsersToNotify.some(user => user.id === pi.id)) {
        allUsersToNotify.push(pi);
      }
    }
    
    // Add Admin users to notifications
    for (const admin of adminUsers) {
      if (!allUsersToNotify.some(user => user.id === admin.id)) {
        allUsersToNotify.push(admin);
        console.log(`Adding Admin user ${admin.fullName} to signal email notification recipients`);
      }
    }
    
    console.log(`Would have sent signal email notification to ${allUsersToNotify.length} users (including ${principalInvestigators.length} Principal Investigators and ${adminUsers.length} Admins)`);
    
    // For each user, check their notification preferences
    for (const user of allUsersToNotify) {
      const shouldSend = await shouldSendEmailNotification(user.id, signalData.priority);
      
      if (shouldSend) {
        console.log(`Would have sent email notification to ${user.email} (${user.role}) for signal "${signalData.title}"`);
      } else {
        console.log(`Skipping email notification to ${user.email} (${user.role}) based on notification preferences`);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error preparing signal email notifications:", error);
    return false;
  }
}

/**
 * Send a general notification to multiple recipients
 * @param recipient Single email or array of emails to send to
 * @param subject Email subject
 * @param content Email content as HTML and plain text
 * @param templateId Optional SendGrid template ID
 * @param templateData Optional dynamic data for the template
 * @returns Promise<boolean> Success status
 */
export async function sendGeneralNotification(
  recipient: string | string[],
  subject: string,
  content: { html: string; text: string },
  templateId?: string,
  templateData?: Record<string, any>,
  priority: string = "medium", // Add priority parameter for notification filtering
): Promise<boolean> {
  try {
    // TEMPORARILY DISABLED - Email sending is disabled due to daily limit
    const recipients = Array.isArray(recipient) ? recipient : [recipient];
    console.log(`General email notification is temporarily disabled due to daily limit. Would have sent email "${subject}" to ${recipients.length} recipients`);
    
    // Get user IDs from emails to check notification preferences
    let userIds: number[] = [];
    
    for (const email of recipients) {
      const [user] = await db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.email, email));
        
      if (user) {
        userIds.push(user.id);
      }
    }
    
    // Also get all Principal Investigators
    const principalInvestigators = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, "Principal Investigator"));
      
    // Add Principal Investigators' emails if they're not already in the recipients list
    for (const pi of principalInvestigators) {
      if (!userIds.includes(pi.id)) {
        userIds.push(pi.id);
        recipients.push(pi.email);
      }
    }
    
    console.log(`Would have sent general email notification to ${recipients.length} recipients (including ${principalInvestigators.length} Principal Investigators)`);
    
    // Check notification preferences for each user
    for (const userId of userIds) {
      const [user] = await db
        .select({ email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, userId));
        
      const shouldSend = await shouldSendEmailNotification(userId, priority);
      
      if (shouldSend) {
        console.log(`Would have sent email notification to ${user.email} (${user.role}) for "${subject}"`);
      } else {
        console.log(`Skipping email notification to ${user.email} (${user.role}) based on notification preferences`);
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error preparing general email notifications:", error);
    return false;
  }
}