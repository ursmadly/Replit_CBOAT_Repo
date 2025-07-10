// Script to create a test task directly via database and trigger email notification
import { db } from './server/db.js';
import { tasks, users } from './shared/schema.js';
import { sendTaskNotification } from './server/emailService.js';
import { eq } from 'drizzle-orm';

async function createDirectTestTask() {
  try {
    console.log('Creating test task for nivaasgd with email notification...');
    
    // First, find the user nivaasgd's ID and role
    const userResult = await db.query.users.findFirst({
      where: eq(users.username, 'nivaasgd'),
      columns: {
        id: true,
        role: true,
        email: true
      }
    });
    
    if (!userResult) {
      console.error('User nivaasgd not found');
      return;
    }
    
    console.log(`Found user nivaasgd with ID: ${userResult.id}, role: ${userResult.role}`);
    
    // Create a test task directly in the database
    const dataContext = { 
      testType: 'email_notification', 
      additionalData: 'Testing bulk email functionality'
    };
    
    const [insertedTask] = await db.insert(tasks).values({
      title: 'Direct Test Email Notification Task',
      description: 'This is a test task to verify email notifications using direct DB insertion',
      status: 'Open',
      priority: 'High',
      assignee: userResult.id,
      createdBy: userResult.id,
      trialId: 1,
      source: 'EDC',
      domain: 'DM',
      recordId: 'DIRECT-TEST-001',
      dataContext: dataContext,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    }).returning();
    
    console.log('Task created successfully:', insertedTask);
    
    // Now manually trigger email notification
    const success = await sendTaskNotification({
      taskId: insertedTask.id.toString(),
      taskTitle: insertedTask.title,
      dueDate: insertedTask.dueDate ? insertedTask.dueDate.toISOString() : null,
      priority: insertedTask.priority,
      assignedRole: userResult.role,
      description: insertedTask.description,
      trialId: insertedTask.trialId.toString(),
      domain: insertedTask.domain,
      recordId: insertedTask.recordId,
      source: insertedTask.source,
      dataContext: insertedTask.dataContext
    });
    
    console.log('Email notification sent:', success);
    
    if (success) {
      console.log(`Email notification should be sent to: ${userResult.email}`);
    } else {
      console.log('Failed to send email notification');
    }
    
  } catch (error) {
    console.error('Error creating test task:', error);
  }
}

// Execute the function
createDirectTestTask();