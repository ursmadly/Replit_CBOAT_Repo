/**
 * Notification Fix Utility
 * This script directly fixes notification issues by checking for tasks without notifications
 * and creating notifications for them.
 */
import { db } from './db';
import { Pool } from '@neondatabase/serverless';
import { notifications, tasks } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Initialize a separate pool for direct SQL queries
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Specifically fix notifications for EDC Data Manager tasks
 * This is the original fix function expected by the routes.ts implementation
 */
export async function fixEdcDataManagerNotifications(): Promise<number> {
  console.log("Running fix for EDC Data Manager notifications");
  return await fixRoleNotifications('EDC Data Manager');
}

/**
 * Fix notifications for a specific role using direct SQL
 */
export async function fixRoleNotifications(role: string): Promise<number> {
  console.log(`Starting direct notification fix for role: ${role}`);
  
  try {
    // Find all tasks for the role
    const tasksResult = await pool.query(`
      SELECT * FROM tasks 
      WHERE assigned_to = $1
    `, [role]);
    
    console.log(`Found ${tasksResult.rows.length} tasks assigned to ${role}`);
    
    if (tasksResult.rows.length === 0) {
      console.log(`No tasks found for role: ${role}`);
      return 0;
    }
    
    // Find existing notifications for these tasks
    const taskIds = tasksResult.rows.map(t => t.id);
    const notificationsResult = await pool.query(`
      SELECT * FROM notifications 
      WHERE related_entity_type = 'task' 
      AND related_entity_id = ANY($1::int[])
    `, [taskIds]);
    
    console.log(`Found ${notificationsResult.rows.length} existing notifications for these tasks`);
    
    // Find tasks without notifications
    const notifiedTaskIds = notificationsResult.rows.map(n => n.related_entity_id);
    const tasksWithoutNotifications = tasksResult.rows.filter(t => !notifiedTaskIds.includes(t.id));
    
    console.log(`Found ${tasksWithoutNotifications.length} tasks without notifications`);
    
    if (tasksWithoutNotifications.length === 0) {
      console.log(`All tasks already have notifications`);
      return 0;
    }
    
    // Find users with the role
    const usersResult = await pool.query(`
      SELECT id, username, role FROM users 
      WHERE role = $1
    `, [role]);
    
    if (usersResult.rows.length === 0) {
      console.log(`No users found with role: ${role}`);
      return 0;
    }
    
    console.log(`Found ${usersResult.rows.length} users with role ${role}`);
    
    let createdCount = 0;
    
    // Create notifications for each task without notifications
    for (const task of tasksWithoutNotifications) {
      for (const user of usersResult.rows) {
        try {
          // Create notification
          const notificationData = {
            user_id: user.id,
            title: `Task Assignment: ${task.title}`,
            description: `${task.description} ${task.domain ? `\n\nDomain: ${task.domain}` : ''} ${task.record_id ? `\nRecord ID: ${task.record_id}` : ''} ${task.source ? `\nSource: ${task.source}` : ''}`,
            type: 'task',
            priority: task.priority.toLowerCase(),
            trial_id: task.trial_id,
            source: 'Task Management',
            related_entity_type: 'task',
            related_entity_id: task.id,
            action_required: true,
            action_url: `/tasks/details/${task.id}`,
            target_roles: [role],
            target_users: [user.id],
            read: false,
            created_at: new Date()
          };
          
          // Insert notification using direct SQL
          const result = await pool.query(`
            INSERT INTO notifications (
              user_id, title, description, type, priority, 
              trial_id, source, related_entity_type, related_entity_id, 
              action_required, action_url, target_roles, target_users, 
              read, created_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
            ) RETURNING id
          `, [
            notificationData.user_id,
            notificationData.title,
            notificationData.description,
            notificationData.type,
            notificationData.priority,
            notificationData.trial_id,
            notificationData.source,
            notificationData.related_entity_type,
            notificationData.related_entity_id,
            notificationData.action_required,
            notificationData.action_url,
            notificationData.target_roles,
            notificationData.target_users,
            notificationData.read,
            notificationData.created_at
          ]);
          
          console.log(`Created notification ${result.rows[0].id} for task ${task.id} and user ${user.id} (${user.username})`);
          createdCount++;
        } catch (error) {
          console.error(`Error creating notification for task ${task.id} and user ${user.id}:`, error);
        }
      }
    }
    
    console.log(`Created ${createdCount} notifications for ${tasksWithoutNotifications.length} tasks`);
    return createdCount;
  } catch (error) {
    console.error('Error fixing notifications:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

/**
 * Find all tasks assigned to a specific role that don't have notifications
 * and create notifications for them (using Drizzle ORM)
 */
export async function fixNotificationsForTasks(role: string = 'EDC Data Manager'): Promise<number> {
  console.log(`Starting ORM notification fix for role: ${role}`);
  return await fixRoleNotifications(role);
}

/**
 * Fix all notifications in the system
 */
export async function fixAllNotifications(): Promise<{ [role: string]: number }> {
  const roles = ['EDC Data Manager', 'Clinical Research Associate', 'Data Manager', 'Clinical Trial Manager'];
  const results: { [role: string]: number } = {};
  
  for (const role of roles) {
    results[role] = await fixRoleNotifications(role);
  }
  
  return results;
}