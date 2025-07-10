/**
 * Test script to check the email notification system
 * Run with: npm run tsx server/test-email.ts
 */

import { sendEmail, sendTaskNotification, TaskNotificationData } from "./emailService";

/**
 * This function tests the email service functionality
 */
async function testEmailService() {
  console.log("Testing email notification system...");
  
  // 1. Check environment variables
  console.log("Environment variables check:");
  console.log("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);
  if (process.env.SENDGRID_API_KEY) {
    console.log("SENDGRID_API_KEY prefix:", process.env.SENDGRID_API_KEY.substring(0, 5) + "...");
  }
  
  console.log("SENDGRID_AUTH_MAIL:", process.env.SENDGRID_AUTH_MAIL || "Not set");
  console.log("SENDGRID_TASK_TEMPLATE_ID exists:", !!process.env.SENDGRID_TASK_TEMPLATE_ID);
  
  // 2. Test email sending
  try {
    // Test email - this won't actually send since we use example.com address
    // which our code filters out
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Email from cBOAT Platform",
      html: "<h1>Test Email</h1><p>This is a test email to verify the notification system.</p>",
      text: "Test Email\n\nThis is a test email to verify the notification system."
    });
    
    console.log("Test email attempt result:", result);
    console.log("Note: Email was not actually sent because test@example.com is filtered.");
    
    // 3. Test task notification with domain context
    const taskData: TaskNotificationData = {
      taskId: "TEST-123",
      taskTitle: "Test Task Notification",
      description: "This is a test task created to verify email notifications work properly",
      priority: "Medium",
      dueDate: new Date().toISOString(),
      assignedRole: "Data Manager",
      trialId: "TRIAL-001",
      domain: "DM",
      recordId: "SUBJ-1001",
      source: "EDC"
    };
    
    console.log("Testing task notification with domain context...");
    const taskNotifResult = await sendTaskNotification(taskData);
    console.log("Task notification result:", taskNotifResult);
    
  } catch (error) {
    console.error("Error in test:", error);
  }
}

// Run the test
testEmailService().then(() => {
  console.log("Email test script completed");
}).catch(err => {
  console.error("Error in test script:", err);
});