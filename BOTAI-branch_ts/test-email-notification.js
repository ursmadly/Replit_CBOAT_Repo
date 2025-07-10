// Script to create a test task with email notification
import { Pool } from 'pg';
import { createNotification } from './server/notificationService.js';
import { sendTaskNotification } from './server/emailService.js';

async function createTestTask() {
  try {
    console.log('Creating test task for email notification...');
    
    // Connect to database
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // First, find the user nivaasgd's ID
    const userResult = await pool.query(`
      SELECT id, role FROM users WHERE username = 'nivaasgd'
    `);
    
    if (userResult.rows.length === 0) {
      console.error('User nivaasgd not found');
      return;
    }
    
    const userId = userResult.rows[0].id;
    const userRole = userResult.rows[0].role;
    
    console.log(`Found user nivaasgd with ID: ${userId}, role: ${userRole}`);
    
    // Create a test task
    const taskResult = await pool.query(`
      INSERT INTO tasks (
        title, description, status, priority, assignee, created_by, 
        trial_id, source, domain, record_id, data_context, due_date
      ) VALUES (
        'Test Email Notification Task', 
        'This is a test task created to verify email notifications', 
        'Open', 
        'High', 
        $1, 
        $2,
        1,
        'EDC',
        'DM',
        '001',
        '{"test": "data"}',
        NOW() + INTERVAL '2 days'
      ) RETURNING *
    `, [userId, userId]);
    
    const task = taskResult.rows[0];
    console.log('Task created:', task);
    
    // Create system notification
    const notification = await createNotification({
      userId: userId,
      title: `New Task: ${task.title}`,
      description: task.description,
      type: 'Task',
      priority: task.priority,
      trialId: task.trial_id,
      source: task.source,
      entityId: task.id.toString(),
      entityType: 'task',
      read: false,
      action: '/tasks/' + task.id,
      targetRoles: [userRole],
      targetUsers: [userId]
    });
    
    console.log('System notification created:', notification);
    
    // Send email notification
    const success = await sendTaskNotification({
      taskId: task.id.toString(),
      taskTitle: task.title,
      dueDate: task.due_date ? task.due_date.toISOString() : null,
      priority: task.priority,
      assignedRole: userRole,
      description: task.description,
      trialId: task.trial_id.toString(),
      domain: task.domain,
      recordId: task.record_id,
      source: task.source,
      dataContext: task.data_context
    });
    
    console.log('Email notification sent:', success);
    
    console.log('Test complete!');
    
    // Close the connection
    await pool.end();
    
  } catch (error) {
    console.error('Error creating test task:', error);
  }
}

createTestTask();

// Add export for ES modules
export default createTestTask;