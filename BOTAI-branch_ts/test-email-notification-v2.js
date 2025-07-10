/**
 * Test script to check the email notification system with our upgraded code
 */

import { sendEmail } from './server/emailService.js';

async function testEmailNotification() {
  console.log("Testing email notification system with updated code...");
  
  try {
    // Log environment variables (masking the actual key values)
    console.log("Environment variables check:");
    console.log("SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);
    if (process.env.SENDGRID_API_KEY) {
      console.log("SENDGRID_API_KEY prefix:", process.env.SENDGRID_API_KEY.substring(0, 5) + "...");
    }
    
    console.log("SENDGRID_AUTH_MAIL:", process.env.SENDGRID_AUTH_MAIL || "Not set");
    console.log("SENDGRID_TASK_TEMPLATE_ID exists:", !!process.env.SENDGRID_TASK_TEMPLATE_ID);
    
    // Try sending a direct email without using a template
    const result = await sendEmail({
      to: "test@example.com", // This won't actually send due to our filtering
      subject: "Test Email from cBOAT Platform",
      html: "<h1>Test Email</h1><p>This is a test email to verify the notification system.</p>",
      text: "Test Email\n\nThis is a test email to verify the notification system."
    });
    
    console.log("Test email attempt result:", result);
    console.log("Note: Email was not actually sent because test@example.com is filtered.");
    
  } catch (error) {
    console.error("Error in test script:", error);
  }
}

testEmailNotification();