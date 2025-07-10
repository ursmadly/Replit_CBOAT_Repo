import { db } from "./db";
import { 
  notifications, 
  InsertNotification, 
  Notification, 
  users, 
  tasks, 
  trials,
  notificationSettings,
  notificationReadStatus,
  InsertNotificationSetting,
  NotificationSetting,
  InsertNotificationReadStatus,
  NotificationReadStatus
} from "@shared/schema";
import { and, eq, inArray, isNull, or, sql, count, gt, lt, gte, lte, ne, between } from "drizzle-orm";
import { sendTaskNotification, sendSignalNotification, TaskNotificationData, SignalNotificationData } from "./emailService";

/**
 * Create a new notification in the database
 * @param notification The notification data to insert
 * @returns The created notification
 */
export async function createNotification(notification: InsertNotification): Promise<Notification | null> {
  console.log(`Processing notification: ${JSON.stringify(notification, null, 2)}`);
  try {
    // If userId is specified, check user preferences before creating notification
    if (notification.userId) {
      const shouldSend = await shouldSendSystemNotification(
        notification.userId, 
        notification.priority || 'medium'
      );
      
      if (!shouldSend) {
        console.log(`Skipping notification for user ${notification.userId} based on notification preferences`);
        return null;
      }
    }
    
    // Create the notification if preferences allow
    const [result] = await db.insert(notifications).values(notification).returning();
    console.log(`Successfully created notification with ID: ${result.id}`);
    return result;
  } catch (error) {
    console.error(`Error creating notification: ${error}`);
    throw error;
  }
}

/**
 * Create notifications for a task
 * This will create notifications for all users with the matching roles and study access
 * @param taskId ID of the task
 * @returns Array of created notifications
 */
export async function createTaskNotifications(taskId: number): Promise<Notification[]> {
  console.log(`Creating notifications for task ${taskId}`);
  try {
    // 1. Get the task details with additional domain fields
    const [task] = await db
      .select({
        id: tasks.id,
        taskId: tasks.taskId,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        assignedTo: tasks.assignedTo,
        trialId: tasks.trialId,
        dueDate: tasks.dueDate,
        // Include additional fields for domain data context
        domain: tasks.domain,
        recordId: tasks.recordId,
        source: tasks.source,
        dataContext: tasks.dataContext,
      })
      .from(tasks)
      .where(eq(tasks.id, taskId));

    if (!task) {
      console.error(`Cannot create notifications: Task with ID ${taskId} not found`);
      return [];
    }
    
    console.log(`Found task: ${JSON.stringify(task, null, 2)}`);
    console.log(`Task assignedTo: ${task.assignedTo}`);

    // 2. Get the trial details (for title/name)
    const [trial] = await db
      .select({
        id: trials.id,
        protocolId: trials.protocolId,
        title: trials.title,
      })
      .from(trials)
      .where(eq(trials.id, task.trialId));

    // 3. Find all users who should receive this notification
    // If task has assignedTo, find all users with that role and study access
    let targetUsers: { id: number; email: string; role: string; fullName: string }[] = [];
    
    // Default to Data Manager role if not specified
    const targetRole = task.assignedTo || "Data Manager";
    
    console.log(`Searching for users with role '${targetRole}' for trial ${trial?.protocolId}`);
    targetUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(
        and(
          eq(users.role, targetRole),
          or(
            sql`${users.studyAccess}::text[] @> ARRAY[${trial?.protocolId || ''}]::text[]`,
            isNull(users.studyAccess),
            sql`${users.studyAccess}::text[] @> ARRAY['All Studies']::text[]`
          )
        )
      );
      
    console.log(`Found ${targetUsers.length} users with role '${targetRole}'`);
    if (targetUsers.length === 0) {
      console.log(`No users found with role '${targetRole}', trying a more general search without study access check`);
      
      targetUsers = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          fullName: users.fullName,
        })
        .from(users)
        .where(eq(users.role, targetRole));
        
      console.log(`Found ${targetUsers.length} users with role '${targetRole}' (without study access check)`);
    }

    // If no users with that role, notify system admins
    if (targetUsers.length === 0) {
      targetUsers = await db
        .select({
          id: users.id,
          email: users.email,
          role: users.role,
          fullName: users.fullName,
        })
        .from(users)
        .where(eq(users.role, "System Administrator"));
    }
    
    // 3a. Find all Principal Investigators who should also receive this notification
    // regardless of the assigned role
    const principalInvestigators = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: users.fullName,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "Principal Investigator"),
          or(
            sql`${users.studyAccess}::text[] @> ARRAY[${trial?.protocolId || ''}]::text[]`,
            isNull(users.studyAccess),
            sql`${users.studyAccess}::text[] @> ARRAY['All Studies']::text[]`
          )
        )
      );
    
    console.log(`Found ${principalInvestigators.length} Principal Investigators for notification`);
    
    // 3b. Find all Admin users who should also receive this notification
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
    
    console.log(`Found ${adminUsers.length} Admin users for notification`);
    
    // Add Principal Investigators to target users if they're not already included
    principalInvestigators.forEach(pi => {
      if (!targetUsers.some(user => user.id === pi.id)) {
        targetUsers.push(pi);
      }
    });
    
    // Add Admin users to target users if they're not already included
    adminUsers.forEach(admin => {
      if (!targetUsers.some(user => user.id === admin.id)) {
        targetUsers.push(admin);
        console.log(`Adding Admin user ${admin.fullName} to notification recipients`);
      }
    });

    // 4. Create notifications for each user, respecting notification preferences
    const createdNotifications: Notification[] = [];
    const promises = targetUsers.map(async (user) => {
      // Check notification preferences for this user
      const shouldSend = await shouldSendSystemNotification(user.id, task.priority);
      
      if (!shouldSend) {
        console.log(`Skipping notification for user ${user.id} (${user.role}) based on notification preferences`);
        return;
      }
      
      const notification: InsertNotification = {
        userId: user.id,
        title: `${task.taskId || `TASK_${task.id}`}: ${task.title}`,
        description: task.description,
        type: "task",
        priority: task.priority.toLowerCase(),
        trialId: task.trialId,
        source: "Task Management",
        relatedEntityType: "task",
        relatedEntityId: task.id,
        actionRequired: true,
        // IMPORTANT: Use the URL format that properly uses wouter's route parameters
        // This matches the route path "/tasks/:id" in App.tsx
        actionUrl: `/tasks/${task.id}`,
        // Include System Administrator and Principal Investigator in targetRoles for all notifications
        targetRoles: [user.role, "System Administrator", "Principal Investigator"],
        targetUsers: [user.id],
      };

      const created = await createNotification(notification);
      // Only add to the array if the notification was actually created
      if (created) {
        createdNotifications.push(created);
        console.log(`Created notification for user ${user.id} (${user.role}) for task: ${task.title}`);
      }
    });

    await Promise.all(promises);

    // 5. Also send email notifications if available
    if (trial && task.dueDate) {
      const taskNotificationData: TaskNotificationData = {
        taskId: task.taskId || task.id.toString(),
        taskTitle: task.title,
        dueDate: new Date(task.dueDate).toISOString(),
        priority: task.priority,
        assignedRole: targetRole,
        description: task.description,
        trialId: trial.protocolId || task.trialId.toString(),
        // Include the domain, recordId, and source fields if they exist
        domain: task.domain || undefined,
        recordId: task.recordId || undefined,
        source: task.source || undefined,
        dataContext: task.dataContext || undefined
      };

      // Don't wait for email to be sent
      sendTaskNotification(taskNotificationData).catch(err => {
        console.error("Failed to send task email notification:", err);
      });
    }

    return createdNotifications;
  } catch (error) {
    console.error("Error creating task notifications:", error);
    return [];
  }
}

/**
 * Get notifications for a specific user
 * @param userId The user ID to get notifications for
 * @param options Query options (limit, offset, includeRead)
 * @returns Array of notifications
 */
export async function getUserNotifications(
  userId: number,
  options: {
    limit?: number;
    offset?: number;
    includeRead?: boolean;
    types?: string[];
  } = {}
): Promise<Notification[]> {
  try {
    // Always include read notifications, but still respect other parameters
    const { limit = 50, offset = 0, types } = options;
    // The includeRead parameter is now ignored - we always include read notifications
    
    // Get user role first to use in the query
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!userRecord) {
      console.error(`User with ID ${userId} not found`);
      return [];
    }

    console.log(`Getting notifications for user ${userId} with role ${userRecord.role}`);
    
    // Add additional conditions based on filters
    const typesCondition = types && types.length > 0 ? inArray(notifications.type, types) : undefined;
    
    // 1. Get user-specific notifications directly - include ALL notifications
    const userNotificationsQuery = db
      .select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        ...(typesCondition ? [typesCondition] : [])
      ));
    
    // 2. Get role-based notifications - include ALL notifications
    // First query for exact role match
    const roleNotificationsQuery = db
      .select()
      .from(notifications)
      .where(and(
        isNull(notifications.userId),
        // For System Administrator and Principal Investigator, show ALL role-based notifications
        or(
          userRecord.role === 'System Administrator' ? sql`true` : sql`false`,
          userRecord.role === 'Principal Investigator' ? sql`true` : sql`false`,
          userRecord.role === 'Admin' ? sql`true` : sql`false`,
          // Regular SQL array contains operator for role array
          sql`${notifications.targetRoles}::text[] @> ARRAY[${userRecord.role}]::text[]`,
          // Special handling for Lab Data Manager role to ensure compatibility across different array formats
          userRecord.role === 'Lab Data Manager' ? eq(sql`${notifications.targetRoles}`, sql`'{"Lab Data Manager"}'`) : sql`false`,
          // Extra handling for JSON array string format - check for string containment
          sql`${notifications.targetRoles}::text LIKE ${'%' + userRecord.role + '%'}`
        ),
        ...(typesCondition ? [typesCondition] : [])
      ));
    
    // Execute both queries
    const [userNotifications, allRoleNotifications] = await Promise.all([
      userNotificationsQuery.orderBy(notifications.createdAt),
      roleNotificationsQuery.orderBy(notifications.createdAt)
    ]);
    
    // 3. Get the read status records for this user to mark notifications as read in the UI
    const readStatusRecords = await db
      .select({ notificationId: notificationReadStatus.notificationId })
      .from(notificationReadStatus)
      .where(eq(notificationReadStatus.userId, userId));
    
    const readNotificationIds = readStatusRecords.map(record => record.notificationId);
    
    // Mark role-based notifications as read in the returned data if they have read status
    const roleNotifications = allRoleNotifications.map(notification => {
      // If this notification ID is in the read status table, mark it as read for this user
      if (readNotificationIds.includes(notification.id)) {
        console.log(`Notification ${notification.id} is already marked as read for user ${userId}`);
        return { ...notification, read: true };
      }
      console.log(`Notification ${notification.id} is NOT marked as read for user ${userId}`);
      return notification;
    });
    
    // Log read notification IDs for debugging
    console.log(`Read notification IDs for user ${userId}: ${JSON.stringify(readNotificationIds)}`);
    
    console.log(`Found ${userNotifications.length} user-specific notifications and ${roleNotifications.length} role notifications for role ${userRecord.role}`);
    
    // Track unique IDs to avoid duplicates (could happen if a notification has userId and also targets a role)
    const uniqueNotifications = new Map();
    
    // Add user-specific notifications first (higher priority)
    userNotifications.forEach(notification => {
      uniqueNotifications.set(notification.id, notification);
    });
    
    // Then add role-based notifications if not already added
    roleNotifications.forEach(notification => {
      if (!uniqueNotifications.has(notification.id)) {
        uniqueNotifications.set(notification.id, notification);
      }
    });
    
    // Convert to array, sort, and apply limit/offset
    const combinedNotifications = Array.from(uniqueNotifications.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);
    
    console.log(`After deduplication: returning ${combinedNotifications.length} notifications`);
    
    return combinedNotifications;
  } catch (error) {
    console.error("Error getting user notifications:", error);
    return [];
  }
}

/**
 * Count unread notifications for a user
 * @param userId The user ID to count notifications for
 * @returns Count of unread notifications
 */
export async function countUnreadNotifications(userId: number): Promise<number> {
  try {
    // Get user role first to use in the query
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!userRecord) {
      console.error(`User with ID ${userId} not found`);
      return 0;
    }

    // 1. Count user-specific unread notifications
    const [userNotificationCount] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId), 
        eq(notifications.read, false)
      ));
    
    // 2. Get all role-based notifications for this user's role
    const allRoleNotifications = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(
        isNull(notifications.userId),
        or(
          // For System Administrator, Principal Investigator and Admin, show ALL notifications
          userRecord.role === 'System Administrator' ? sql`true` : sql`false`, 
          userRecord.role === 'Principal Investigator' ? sql`true` : sql`false`,
          userRecord.role === 'Admin' ? sql`true` : sql`false`,
          // Regular SQL array contains operator
          sql`${notifications.targetRoles}::text[] @> ARRAY[${userRecord.role}]::text[]`,
          // Special handling for Lab Data Manager role specifically
          userRecord.role === 'Lab Data Manager' ? sql`${notifications.targetRoles}::text LIKE '%Lab Data Manager%'` : sql`false`,
          // Check using string comparison for json arrays
          sql`${notifications.targetRoles}::text LIKE ${'%' + userRecord.role + '%'}`
        )
      ));
    
    // 3. Get all notification IDs that this user has marked as read from the read_status table
    const userReadStatusRecords = await db
      .select({ notificationId: notificationReadStatus.notificationId })
      .from(notificationReadStatus)
      .where(eq(notificationReadStatus.userId, userId));
    
    const readNotificationIds = userReadStatusRecords.map(record => record.notificationId);
    
    // 4. Filter the role-based notifications to only include those not marked as read
    const unreadRoleNotifications = allRoleNotifications.filter(
      notification => !readNotificationIds.includes(notification.id)
    );
    
    // 5. Get the unique notification IDs
    const uniqueNotificationIds = new Set<number>();
    
    // Add user-specific notification IDs
    if (userNotificationCount.count) {
      // We need to get the actual user notification IDs
      const userNotifications = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId), 
          eq(notifications.read, false)
        ));
      
      userNotifications.forEach(n => uniqueNotificationIds.add(n.id));
    }
    
    // Add role-based notification IDs if not already added
    unreadRoleNotifications.forEach(n => uniqueNotificationIds.add(n.id));
    
    // Get the count of unique notification IDs
    const totalCount = uniqueNotificationIds.size;
    
    console.log(`Found ${userNotificationCount.count} user-specific unread notifications and ${unreadRoleNotifications.length} unread role notifications for user ${userId} with role ${userRecord.role}`);
    console.log(`After deduplication, there are ${totalCount} unique unread notifications`);
    
    return totalCount;
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    return 0;
  }
}

/**
 * Mark notifications as read
 * @param notificationIds Array of notification IDs to mark as read
 * @param userId User ID (for security validation)
 * @returns Number of notifications updated
 */
export async function markNotificationsAsRead(
  notificationIds: number[],
  userId: number
): Promise<number> {
  try {
    console.log(`Marking notifications as read - IDs: ${JSON.stringify(notificationIds)}, userID: ${userId}`);
    
    const now = new Date();
    
    // Get user role to handle role-based notifications
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!userRecord) {
      console.error(`User with ID ${userId} not found when marking notifications as read`);
      return 0;
    }
    
    console.log(`User role: ${userRecord.role}`);
    
    // For user-specific notifications, mark them as read directly in the notifications table
    const userResult = await db
      .update(notifications)
      .set({ read: true, readAt: now })
      .where(
        and(
          inArray(notifications.id, notificationIds),
          eq(notifications.userId, userId)
        )
      );
    
    console.log(`Updated user-specific notifications`);
    
    // For role-based notifications (userId is null), we create read status records in the read_status table
    // First, get all matching role-based notifications
    // Modified query to get ANY notification that matches the ID, regardless of role
    const roleBasedNotifications = await db
      .select()
      .from(notifications)
      .where(
        and(
          inArray(notifications.id, notificationIds),
          isNull(notifications.userId)
        )
      );
    
    console.log(`Found ${roleBasedNotifications.length} role-based notifications to mark as read: ${JSON.stringify(roleBasedNotifications.map(n => n.id))}`);
    
    // We don't need to check for general notifications separately - we're just getting ALL role-based notifications
    // that match the IDs, regardless of role targeting
    
    // Use all role-based notifications
    const allRoleNotifications = roleBasedNotifications;
    
    if (allRoleNotifications.length > 0) {
      console.log(`Processing ${allRoleNotifications.length} role-based notifications to mark as read`);
      
      // Create read status records for each role-based notification
      for (const notification of allRoleNotifications) {
        try {
          // Check if a read status record already exists
          const existingReadStatus = await db
            .select()
            .from(notificationReadStatus)
            .where(
              and(
                eq(notificationReadStatus.notificationId, notification.id),
                eq(notificationReadStatus.userId, userId)
              )
            );
          
          // Skip if already marked as read by this user
          if (existingReadStatus.length > 0) {
            console.log(`Notification ${notification.id} already marked as read by user ${userId}`);
            continue;
          }
          
          // Create a new read status record
          const result = await db.insert(notificationReadStatus).values({
            notificationId: notification.id,
            userId: userId
          }).returning();
          
          console.log(`Created read status record for notification ${notification.id} by user ${userId}: ${JSON.stringify(result)}`);
        } catch (insertError) {
          console.error(`Error creating read status for notification ${notification.id}:`, insertError);
        }
      }
    }
    
    console.log(`Marked ${notificationIds.length} notifications as read for user ${userId}`);
    return notificationIds.length;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return 0;
  }
}

/**
 * Mark all notifications as read for a user
 * @param userId User ID
 * @returns Number of notifications updated
 */
export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  try {
    // Get user role first to use in the query
    const [userRecord] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    if (!userRecord) {
      console.error(`User with ID ${userId} not found`);
      return 0;
    }

    const now = new Date();
    
    // For user-specific notifications, mark them as read directly
    const userResult = await db
      .update(notifications)
      .set({ read: true, readAt: now })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    
    // For role-based notifications, we can't update the original records because they need to
    // remain unread for other users with the same role.
    // Get role-based notifications that match this user's role
    const roleNotifications = await db
      .select()
      .from(notifications)
      .where(and(
        isNull(notifications.userId),
        or(
          // For System Administrator, Principal Investigator and Admin, show ALL role-based notifications
          userRecord.role === 'System Administrator' ? sql`true` : sql`false`,
          userRecord.role === 'Principal Investigator' ? sql`true` : sql`false`,
          userRecord.role === 'Admin' ? sql`true` : sql`false`,
          // Regular SQL array contains operator
          sql`${notifications.targetRoles}::text[] @> ARRAY[${userRecord.role}]::text[]`,
          // Special handling for Lab Data Manager role
          userRecord.role === 'Lab Data Manager' ? sql`${notifications.targetRoles}::text LIKE '%Lab Data Manager%'` : sql`false`,
          // Check string form
          sql`${notifications.targetRoles}::text LIKE ${'%' + userRecord.role + '%'}`
        ),
        eq(notifications.read, false)
      ));
    
    console.log(`Found ${roleNotifications.length} role-based notifications for role ${userRecord.role}`);
    
    // Add read status records for all role-based notifications
    if (roleNotifications.length > 0) {
      for (const notification of roleNotifications) {
        try {
          // Check if read status already exists
          const existingReadStatus = await db
            .select()
            .from(notificationReadStatus)
            .where(
              and(
                eq(notificationReadStatus.notificationId, notification.id),
                eq(notificationReadStatus.userId, userId)
              )
            );
          
          if (existingReadStatus.length === 0) {
            // Create a new read status record
            await db.insert(notificationReadStatus).values({
              notificationId: notification.id,
              userId: userId
            });
          }
        } catch (insertError) {
          console.error(`Error creating read status for notification ${notification.id}:`, insertError);
        }
      }
    }
    
    // Calculate the actual total of notifications that were marked as read
    const uniqueNotificationIds = new Set<number>();
    
    // Count user-specific notifications marked as read
    if (userResult.rowCount) {
      const userNotifications = await db
        .select({ id: notifications.id })
        .from(notifications)
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.read, true),
          sql`${notifications.readAt} IS NOT NULL`
        ));
      
      userNotifications.forEach(n => uniqueNotificationIds.add(n.id));
    }
    
    // Add role-based notifications that were marked as read
    for (const notification of roleNotifications) {
      // Only add if we successfully created a read status for it
      const readStatus = await db
        .select()
        .from(notificationReadStatus)
        .where(and(
          eq(notificationReadStatus.notificationId, notification.id),
          eq(notificationReadStatus.userId, userId)
        ));
      
      if (readStatus.length > 0) {
        uniqueNotificationIds.add(notification.id);
      }
    }
    
    console.log(`Marked total of ${uniqueNotificationIds.size} unique notifications as read`);
    return uniqueNotificationIds.size;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return 0;
  }
}

/**
 * Delete a notification
 * @param notificationId ID of the notification to delete
 * @param userId User ID (for security validation)
 * @returns Boolean indicating success
 */
export async function deleteNotification(
  notificationId: number,
  userId: number
): Promise<boolean> {
  try {
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    
    return true;
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

/**
 * Get notifications for users by their roles and study access
 * This is useful for finding relevant users to notify about events
 * @param roles Array of roles to match
 * @param trialId Optional trial ID to match with user study access
 * @returns Array of user IDs
 */
export async function getUsersForNotification(
  roles: string[],
  trialId?: number
): Promise<number[]> {
  try {
    // Basic query for role matching
    let query = db.select({ id: users.id }).from(users).where(inArray(users.role, roles));
    
    // If we need to filter by trial access, build a new query
    if (trialId) {
      // Get all users with matching roles who either:
      // 1. Have the trial in their studyAccess array
      // 2. Have null studyAccess (meaning they have access to all studies)
      const [trial] = await db
        .select({ protocolId: trials.protocolId })
        .from(trials)
        .where(eq(trials.id, trialId));

      if (trial) {
        query = db.select({ id: users.id }).from(users).where(
          and(
            inArray(users.role, roles),
            or(
              sql`${users.studyAccess} @> ARRAY[${trial.protocolId}]`,
              isNull(users.studyAccess),
              sql`${users.studyAccess} @> ARRAY['All Studies']`
            )
          )
        );
      } else {
        // Fallback to checking by numeric ID if protocol ID is not found
        query = db.select({ id: users.id }).from(users).where(
          and(
            inArray(users.role, roles),
            or(
              sql`${users.studyAccess} @> ARRAY[${trialId.toString()}]`,
              isNull(users.studyAccess),
              sql`${users.studyAccess} @> ARRAY['All Studies']`
            )
          )
        );
      }
    }
    
    // Execute the query
    const results = await query;
    const userIds = results.map(user => user.id);
    
    // Add all Principal Investigators with access to this trial
    if (trialId) {
      // Get the trial protocol ID
      const [trial] = await db
        .select({ protocolId: trials.protocolId })
        .from(trials)
        .where(eq(trials.id, trialId));
        
      if (trial) {
        // Find all Principal Investigators who have access to this trial
        const principalInvestigators = await db
          .select({ id: users.id })
          .from(users)
          .where(
            and(
              eq(users.role, "Principal Investigator"),
              or(
                sql`${users.studyAccess} @> ARRAY[${trial.protocolId}]`,
                isNull(users.studyAccess),
                sql`${users.studyAccess} @> ARRAY['All Studies']`
              )
            )
          );
          
        // Add Principal Investigators to the list if not already included
        principalInvestigators.forEach(pi => {
          if (!userIds.includes(pi.id)) {
            userIds.push(pi.id);
          }
        });
        
        console.log(`Found ${principalInvestigators.length} Principal Investigators for notification`);
      }
    } else {
      // If no trial specified, include all Principal Investigators
      const principalInvestigators = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "Principal Investigator"));
        
      // Add Principal Investigators to the list if not already included
      principalInvestigators.forEach(pi => {
        if (!userIds.includes(pi.id)) {
          userIds.push(pi.id);
        }
      });
      
      console.log(`Found ${principalInvestigators.length} Principal Investigators for all notifications`);
    }
    
    return userIds;
  } catch (error) {
    console.error("Error getting users for notification:", error);
    return [];
  }
}

/**
 * Get notification settings for a specific user
 * @param userId User ID to get settings for
 * @returns Notification settings or null if not found
 */
export async function getUserNotificationSettings(userId: number): Promise<NotificationSetting | null> {
  try {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    
    return settings || null;
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return null;
  }
}

/**
 * Check if a system notification should be sent to a user based on their preferences
 * @param userId User ID to check preferences for
 * @param priority Priority of the notification (to check against criticalOnly setting)
 * @returns Boolean indicating whether to send the system notification
 */
export async function shouldSendSystemNotification(
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
    
    // Check if push notifications are enabled (these are our in-system notifications)
    if (!settings.pushNotifications) {
      console.log(`Push notifications disabled for user ${userId}`);
      return false;
    }
    
    // If criticalOnly is enabled, only send for critical/high priority notifications
    if (settings.criticalOnly) {
      const isPriorityHigh = 
        priority.toLowerCase() === 'critical' || 
        priority.toLowerCase() === 'high';
      
      if (!isPriorityHigh) {
        console.log(`Skipping non-critical system notification for user ${userId} (criticalOnly is enabled)`);
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
 * Create notification settings for a user
 * @param settings Notification settings to create
 * @returns Created notification settings
 */
export async function createNotificationSettings(settings: InsertNotificationSetting): Promise<NotificationSetting> {
  try {
    const [result] = await db
      .insert(notificationSettings)
      .values(settings)
      .returning();
    
    return result;
  } catch (error) {
    console.error("Error creating notification settings:", error);
    throw error;
  }
}

/**
 * Update notification settings for a user
 * @param userId User ID to update settings for
 * @param settings Settings to update
 * @returns Updated notification settings
 */
export async function updateNotificationSettings(userId: number, settings: Partial<NotificationSetting>): Promise<NotificationSetting | null> {
  try {
    // First check if settings exist
    const existingSettings = await getUserNotificationSettings(userId);
    
    if (!existingSettings) {
      // Create new settings if they don't exist
      return await createNotificationSettings({
        userId,
        emailNotifications: settings.emailNotifications ?? true,
        pushNotifications: settings.pushNotifications ?? true,
        criticalOnly: settings.criticalOnly ?? false
      });
    }
    
    // Update existing settings
    const [updatedSettings] = await db
      .update(notificationSettings)
      .set({
        ...settings,
        updatedAt: new Date()
      })
      .where(eq(notificationSettings.userId, userId))
      .returning();
    
    return updatedSettings;
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return null;
  }
}