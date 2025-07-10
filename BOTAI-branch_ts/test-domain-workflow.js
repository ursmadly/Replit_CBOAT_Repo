/**
 * Test script to create a domain record with issues that should trigger the data quality workflow
 * This script will:
 * 1. Create a new lab record with issues
 * 2. Check if tasks/notifications are created
 * 3. Update the record to fix issues
 * 4. Check if the task is updated accordingly
 */
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDomainWorkflow() {
  try {
    console.log('Starting domain data workflow test...');
    
    // 1. Get a random trial ID from the database for testing
    const trialResult = await pool.query('SELECT id FROM trials LIMIT 1');
    if (!trialResult.rows.length) {
      console.error('No trials found in the database');
      return;
    }
    const trialId = trialResult.rows[0].id;
    console.log(`Using trial ID: ${trialId}`);
    
    // 2. Create a unique record ID for this test to avoid conflicts
    const timestamp = Date.now();
    const recordId = `LB-${trialId}-${timestamp}`;
    
    // 3. Create a new record with issues (missing required field LBTEST)
    console.log(`Creating new lab record with ID: ${recordId}`);
    const recordData = {
      USUBJID: '1001',
      // Missing LBTEST intentionally to trigger validation issue
      LBORRES: '16.5',
      LBSTNRLO: '13.0',
      LBSTNRHI: '17.0'
    };
    
    // Insert the record into domain_data table
    const insertQuery = `
      INSERT INTO domain_data (
        trial_id, domain, source, record_id, record_data, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), NOW()
      ) RETURNING id
    `;
    
    const insertResult = await pool.query(
      insertQuery,
      [trialId, 'LB', 'EDC', recordId, JSON.stringify(recordData)]
    );
    
    if (!insertResult.rows.length) {
      console.error('Failed to insert test record');
      return;
    }
    
    const recordDbId = insertResult.rows[0].id;
    console.log(`Record created in database with ID: ${recordDbId}`);
    
    // 4. Wait for the workflow to process the new record
    console.log('Waiting for workflow to process the record...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Check if a task was created for this record
    const taskQuery = `
      SELECT id, title, description, status FROM tasks 
      WHERE description LIKE $1 
      ORDER BY created_at DESC LIMIT 1
    `;
    const taskResult = await pool.query(taskQuery, [`%${recordId}%`]);
    
    if (taskResult.rows.length) {
      console.log('Task was created successfully:');
      console.log(JSON.stringify(taskResult.rows[0], null, 2));
      
      const taskId = taskResult.rows[0].id;
      
      // 6. Check for notifications related to this task
      const notificationQuery = `
        SELECT id, title, description, target_roles, is_read 
        FROM notifications 
        WHERE related_entity_type = 'task' AND related_entity_id = $1
        ORDER BY created_at DESC
      `;
      const notificationResult = await pool.query(notificationQuery, [taskId]);
      
      if (notificationResult.rows.length) {
        console.log(`Found ${notificationResult.rows.length} notifications for this task:`);
        console.log(JSON.stringify(notificationResult.rows, null, 2));
      } else {
        console.log('No notifications found for this task.');
      }
      
      // 7. Now update the record to fix the issue
      console.log('Updating record to fix the validation issue...');
      const updatedRecordData = {
        USUBJID: '1001',
        LBTEST: 'Hemoglobin', // Adding the missing field
        LBORRES: '16.5',
        LBSTNRLO: '13.0',
        LBSTNRHI: '17.0'
      };
      
      const updateQuery = `
        UPDATE domain_data 
        SET record_data = $1, updated_at = NOW() 
        WHERE id = $2
      `;
      
      await pool.query(updateQuery, [JSON.stringify(updatedRecordData), recordDbId]);
      console.log('Record updated successfully');
      
      // 8. Wait for the workflow to process the update
      console.log('Waiting for workflow to process the update...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 9. Check if the task status was updated
      const updatedTaskQuery = `
        SELECT id, title, description, status FROM tasks 
        WHERE id = $1
      `;
      const updatedTaskResult = await pool.query(updatedTaskQuery, [taskId]);
      
      if (updatedTaskResult.rows.length) {
        console.log('Task status after update:');
        console.log(JSON.stringify(updatedTaskResult.rows[0], null, 2));
      } else {
        console.log('Could not find task after update');
      }
    } else {
      console.log('No task was created for this record. Checking for related issues in logs...');
      
      // Check database triggers to see if middleware was called
      const triggerQuery = `
        SELECT * FROM activity_logs 
        WHERE description LIKE $1 
        ORDER BY created_at DESC LIMIT 5
      `;
      const triggerResult = await pool.query(triggerQuery, [`%${recordId}%`]);
      
      if (triggerResult.rows.length) {
        console.log('Found activity logs for this record:');
        triggerResult.rows.forEach(log => {
          console.log(`${log.created_at}: ${log.description}`);
        });
      } else {
        console.log('No activity logs found for this record.');
      }
    }
    
    console.log('Test completed.');
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the test
testDomainWorkflow().catch(console.error);