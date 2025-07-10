// Simple test script to create a task via the API and trigger email notification
import fetch from 'node-fetch';

async function createTestTask() {
  try {
    console.log('Creating test task with email notification...');
    
    // Task data with domain, source and recordId fields
    const taskData = {
      title: 'Email Notification Test Task',
      description: 'This is a test task to verify the enhanced email notification system',
      status: 'Open',
      priority: 'High',
      assignee: 'nivaasgd', // This is the username, API will handle the lookup
      trialId: 1,
      domain: 'DM',
      source: 'EDC',
      recordId: 'TEST-001',
      dataContext: {
        test: true,
        message: 'Testing enhanced email notification system with bulk capabilities',
        createdAt: new Date().toISOString()
      }
    };
    
    // Create the task using the API on localhost
    const response = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-api-key'
      },
      body: JSON.stringify(taskData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create task: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const task = await response.json();
    console.log('Task created successfully:', task);
    console.log('A notification email should be sent to nivaasgd based on role assignment.');
    
  } catch (error) {
    console.error('Error creating test task:', error);
  }
}

createTestTask();