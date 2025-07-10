/**
 * Simple test script that updates an existing domain record to trigger the workflow
 * This script:
 * 1. Finds an existing LB domain record
 * 2. Updates it with problematic data to trigger validation
 * 3. Checks for task creation
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testDomainUpdate() {
  try {
    console.log('Starting domain record update test...');
    
    // 1. Find an existing LB domain record
    const findQuery = `
      SELECT id, trial_id, record_id, record_data 
      FROM domain_data 
      WHERE domain = 'LB' 
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    const findResult = await pool.query(findQuery);
    
    if (!findResult.rows.length) {
      console.error('No LB domain records found to test with');
      return;
    }
    
    const record = findResult.rows[0];
    console.log(`Found LB record: ID=${record.id}, RecordID=${record.record_id}`);
    
    // Parse the existing record data
    let recordData;
    try {
      recordData = JSON.parse(record.record_data);
      console.log('Current record data:', recordData);
    } catch (e) {
      console.error('Error parsing record data:', e);
      return;
    }
    
    // 2. Modify the record to create a validation issue
    // For LB domain, we'll set an out-of-range value
    const modifiedData = {
      ...recordData,
      // Ensure we have reference ranges
      LBSTNRLO: "13.0",
      LBSTNRHI: "17.0",
      // Set an out-of-range value
      LBORRES: "25.5" // Well above normal range
    };
    
    console.log('Modified record data:', modifiedData);
    
    // 3. Update the record
    const updateQuery = `
      UPDATE domain_data 
      SET record_data = $1, updated_at = NOW() 
      WHERE id = $2
      RETURNING id
    `;
    
    console.log(`Updating record ${record.id}...`);
    const updateResult = await pool.query(
      updateQuery,
      [JSON.stringify(modifiedData), record.id]
    );
    
    if (!updateResult.rows.length) {
      console.error('Failed to update record');
      return;
    }
    
    console.log('Record updated successfully');
    
    // 4. Wait for the workflow to process
    console.log('Waiting for workflow to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Check if a task was created
    const taskQuery = `
      SELECT id, title, description, status, created_at 
      FROM tasks 
      WHERE description LIKE $1 AND created_at > NOW() - INTERVAL '1 minute'
      ORDER BY created_at DESC
    `;
    
    const taskResult = await pool.query(taskQuery, [`%${record.record_id}%`]);
    
    if (taskResult.rows.length) {
      console.log(`Found ${taskResult.rows.length} tasks for this record:`);
      console.log(JSON.stringify(taskResult.rows, null, 2));
      
      // 6. Check for notifications
      const taskId = taskResult.rows[0].id;
      const notificationQuery = `
        SELECT id, title, description, created_at 
        FROM notifications 
        WHERE related_entity_id = $1 AND created_at > NOW() - INTERVAL '1 minute'
        ORDER BY created_at DESC
      `;
      
      const notificationResult = await pool.query(notificationQuery, [taskId]);
      
      if (notificationResult.rows.length) {
        console.log(`Found ${notificationResult.rows.length} notifications:`);
        console.log(JSON.stringify(notificationResult.rows, null, 2));
      } else {
        console.log('No recent notifications found for this task');
      }
    } else {
      console.log('No recent tasks found for this record');
      
      // 7. Check for any tasks related to this record (regardless of time)
      const allTasksQuery = `
        SELECT id, title, description, status, created_at 
        FROM tasks 
        WHERE description LIKE $1
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      const allTasksResult = await pool.query(allTasksQuery, [`%${record.record_id}%`]);
      
      if (allTasksResult.rows.length) {
        console.log(`Found ${allTasksResult.rows.length} older tasks for this record:`);
        console.log(JSON.stringify(allTasksResult.rows, null, 2));
      } else {
        console.log('No tasks found for this record at all');
      }
      
      // 8. Check for activity logs
      const logQuery = `
        SELECT id, action, description, created_at 
        FROM activity_logs 
        WHERE (description LIKE $1 OR description LIKE $2) AND created_at > NOW() - INTERVAL '1 minute'
        ORDER BY created_at DESC
      `;
      
      const logResult = await pool.query(logQuery, [`%${record.record_id}%`, '%domain data%']);
      
      if (logResult.rows.length) {
        console.log(`Found ${logResult.rows.length} activity logs:`);
        console.log(JSON.stringify(logResult.rows, null, 2));
      } else {
        console.log('No recent activity logs found for this record');
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
testDomainUpdate().catch(console.error);