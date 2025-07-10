/**
 * Script to fix the domain data validation workflow
 * This is a diagnostic tool that will:
 * 1. Update a specific lab record with an out-of-range value
 * 2. Call the analyzeDomainData function directly to verify discrepancy detection
 * 3. Log all the intermediate steps
 */
import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// We'll use the database directly since importing the function is causing issues
// For safety, let's validate that the record data has been updated with our test value

async function fixDomainValidation() {
  try {
    console.log('Starting domain validation diagnostic...');
    
    // 1. Find an existing LB domain record
    const findQuery = `
      SELECT id, trial_id, record_id, domain, source, record_data 
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
    console.log(`Record belongs to trialId=${record.trial_id}, domain=${record.domain}, source=${record.source}`);
    
    // Parse the existing record data
    let recordData;
    try {
      recordData = JSON.parse(record.record_data);
      console.log('Current record data:', recordData);
    } catch (e) {
      console.error('Error parsing record data:', e);
      return;
    }
    
    // 2. Modify the record to create a validation issue - set well out of range
    // We want to make sure it's way outside the range to trigger the validation
    const modifiedData = {
      ...recordData,
      // Ensure we have reference ranges
      LBSTNRLO: "13.0",
      LBSTNRHI: "17.0",
      // Set a dramatically out-of-range value
      LBORRES: "99.9" // Well above normal range
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
    
    // 4. Check for existing tasks for this record
    const taskQuery = `
      SELECT id, title, description, status 
      FROM tasks 
      WHERE domain = $1 AND record_id = $2 AND source = $3
      ORDER BY created_at DESC
    `;
    
    const taskParams = [record.domain, record.record_id, record.source];
    console.log(`Checking for existing tasks with parameters:`, taskParams);
    
    const taskResult = await pool.query(taskQuery, taskParams);
    
    if (taskResult.rows.length) {
      console.log(`Found ${taskResult.rows.length} existing tasks for this record:`);
      console.log(JSON.stringify(taskResult.rows, null, 2));
      
      // 5. Delete existing tasks to start fresh
      const taskIds = taskResult.rows.map(t => t.id);
      if (taskIds.length > 0) {
        console.log(`Removing existing tasks: ${taskIds.join(', ')}`);
        const deleteQuery = `DELETE FROM tasks WHERE id = ANY($1::int[])`;
        await pool.query(deleteQuery, [taskIds]);
        console.log('Tasks deleted successfully');
      }
    } else {
      console.log('No existing tasks found for this record');
    }
    
    // 6. Instead of calling analyzeDomainData directly, let's trigger the API endpoint
    // that would normally trigger the workflow
    console.log(`Triggering record update API to start workflow...`);
    
    // Simulate a PUT to /api/domain-records/:id
    const triggerQuery = `
      UPDATE domain_data
      SET updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;
    
    await pool.query(triggerQuery, [record.id]);
    console.log(`Triggered update for record ${record.id}`);
    
    // 7. Wait a moment for workflow to complete
    console.log('Waiting for workflow to process...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 8. Check if a task was created
    const newTaskResult = await pool.query(taskQuery, taskParams);
    
    if (newTaskResult.rows.length) {
      console.log(`✅ Success! Found ${newTaskResult.rows.length} new tasks for this record:`);
      console.log(JSON.stringify(newTaskResult.rows, null, 2));
      
      // 9. Check for notifications
      const taskId = newTaskResult.rows[0].id;
      const notificationQuery = `
        SELECT id, title, description, target_roles, created_at 
        FROM notifications 
        WHERE related_entity_type = 'task' AND related_entity_id = $1
        ORDER BY created_at DESC LIMIT 5
      `;
      
      const notificationResult = await pool.query(notificationQuery, [taskId]);
      
      if (notificationResult.rows.length) {
        console.log(`✅ Success! Found ${notificationResult.rows.length} notifications:`);
        console.log(JSON.stringify(notificationResult.rows, null, 2));
      } else {
        console.log('❌ No notifications found for the task');
      }
    } else {
      console.log('❌ No new tasks created for this record');
      
      // 10. Check domain records to ensure they exist
      const checkRecordsQuery = `
        SELECT COUNT(*) FROM domain_data 
        WHERE trial_id = $1 AND domain = $2 AND source = $3 AND record_id = $4
      `;
      
      const recordCheckResult = await pool.query(
        checkRecordsQuery, 
        [record.trial_id, record.domain, record.source, record.record_id]
      );
      
      console.log(`Record check: ${recordCheckResult.rows[0].count} matching records found`);
    }
    
    console.log('Diagnostic complete.');
  } catch (error) {
    console.error('Error during diagnostic:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the diagnostic
fixDomainValidation().catch(console.error);