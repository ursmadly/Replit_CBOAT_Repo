/**
 * Test script to directly create a notification for task 520
 */
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure neon
const neonConfig = require('@neondatabase/serverless');
neonConfig.neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testDirectNotification() {
  try {
    // Create a notification directly for the existing task
    const notification = {
      user_id: 18, // The EDC Data Manager user
      title: "New Task: Fix DM invalid value",
      description: "Invalid sex value: MA - Test direct notification",
      type: "task",
      priority: "medium", 
      trial_id: 1,
      source: "Task Management",
      related_entity_type: "task",
      related_entity_id: 520, // The existing task ID
      action_required: true,
      action_url: `/tasks/details/520`,
      target_roles: ["EDC Data Manager"],
      target_users: [18],
      read: false,
      created_at: new Date()
    };
    
    console.log("Creating test notification:", notification);
    
    // Direct SQL insertion to avoid schema issues
    const result = await pool.query(
      `INSERT INTO notifications 
      (user_id, title, description, type, priority, trial_id, source, related_entity_type, related_entity_id, 
       action_required, action_url, target_roles, target_users, read, created_at) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
      RETURNING id`,
      [
        notification.user_id, 
        notification.title,
        notification.description, 
        notification.type, 
        notification.priority,
        notification.trial_id, 
        notification.source, 
        notification.related_entity_type,
        notification.related_entity_id, 
        notification.action_required, 
        notification.action_url,
        notification.target_roles, 
        notification.target_users, 
        notification.read,
        notification.created_at
      ]
    );
    
    console.log("Created notification with ID:", result.rows[0].id);
    
    return result.rows[0];
  } catch (error) {
    console.error("Error creating test notification:", error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the test function
testDirectNotification()
  .then(result => {
    console.log("Test completed successfully:", result);
    process.exit(0);
  })
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });