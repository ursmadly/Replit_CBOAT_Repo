// Simple test script for creating a task that will trigger email notification
import fetch from 'node-fetch';

// API endpoint for task creation
// In Replit, we use the default endpoint available at the current host
const API_URL = '/api/tasks';

// Function to create a test task
async function createTestTask() {
  try {
    console.log('Creating test task for nivaasgd with email notification...');
    
    // Task data with domain, source and recordId for testing email notification
    const taskData = {
      title: 'Test Email Notification Task',
      description: 'This is a test task to verify email notifications are working correctly',
      status: 'Open',
      priority: 'High',
      assignee: 'nivaasgd', // Username for nivaasgd
      trialId: 1,
      domain: 'DM',
      source: 'EDC',
      recordId: 'TEST-001',
      dataContext: { 
        testType: 'email_notification', 
        additionalData: 'Testing bulk email functionality'
      }
    };
    
    // Use API token for authentication
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer cboat-api-token' // API token used in system
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      console.error(`Failed to create task: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const task = await response.json();
    console.log('Task created successfully:', task);
    console.log('A notification and email should be sent to nivaasgd.');
    
  } catch (error) {
    console.error('Error creating test task:', error);
  }
}

// Execute the function
createTestTask();