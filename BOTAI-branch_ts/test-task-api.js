// Simple script to test task creation through the API
import fetch from 'node-fetch';

async function testTaskCreation() {
  try {
    // Create a test task via the API
    console.log('Creating test task for email notification...');
    
    // First login to get a session
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
      credentials: 'include',
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
    }
    
    console.log('Successfully logged in as admin');
    
    // Get the cookies from the login response
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Create a task for nivaasgd (Data Manager role)
    const taskData = {
      title: 'Email Notification Test Task',
      description: 'This is a test task created to verify email notifications system',
      status: 'Open',
      priority: 'High',
      assignee: 'nivaasgd', // Username of nivaasgd
      trialId: 1,
      domain: 'DM',
      source: 'EDC',
      recordId: 'TEST001',
      dataContext: { test: 'data', reason: 'Email testing' }
    };
    
    const taskResponse = await fetch('http://localhost:3000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
      },
      body: JSON.stringify(taskData),
      credentials: 'include',
    });
    
    if (!taskResponse.ok) {
      throw new Error(`Task creation failed: ${taskResponse.status} ${taskResponse.statusText}`);
    }
    
    const task = await taskResponse.json();
    console.log('Task created successfully:', task);
    console.log('Check notifications and your email for the task notification');
    
  } catch (error) {
    console.error('Error creating test task:', error);
  }
}

testTaskCreation();