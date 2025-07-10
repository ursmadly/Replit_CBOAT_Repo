/**
 * Direct call to domain validation that bypasses normal workflows
 * This test directly invokes database operations to update records
 * and should consistently create tasks.
 */

// Set up PostgreSQL connection
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function directValidationTest() {
  try {
    console.log('Starting direct validation test...');
    
    // 1. Define test parameters
    const trialId = 3;
    const domain = 'LB';
    const source = 'EDC';
    
    // 2. Get trial information
    const trialResult = await pool.query('SELECT * FROM trials WHERE id = $1', [trialId]);
    if (trialResult.rows.length === 0) {
      console.error(`Trial ID ${trialId} not found`);
      return;
    }
    const trial = trialResult.rows[0];
    console.log(`Using trial: ${trial.protocol_id} - ${trial.title}`);
    
    // 3. Set up lab records with out-of-range values
    console.log('Setting up lab records with out-of-range values...');
    
    // Find a lab record
    const recordResult = await pool.query(`
      SELECT * FROM domain_data 
      WHERE trial_id = $1 AND domain = $2 AND source = $3 
      LIMIT 5
    `, [trialId, domain, source]);
    
    if (recordResult.rows.length === 0) {
      console.error('No lab records found');
      return;
    }
    
    // Update each record with extreme values
    for (const record of recordResult.rows) {
      console.log(`Processing record ID: ${record.id}, Record ID: ${record.record_id}`);
      
      try {
        // Parse the data
        const data = JSON.parse(record.record_data);
        
        // Set extreme values
        data.LBORRES = "999";  // Very high value
        data.LBSTNRLO = "0";   // Lower normal range
        data.LBSTNRHI = "100"; // Upper normal range
        
        console.log(`Setting ${data.LBTEST || 'lab test'} value to ${data.LBORRES} (range: ${data.LBSTNRLO}-${data.LBSTNRHI})`);
        
        // Update the record
        await pool.query(`
          UPDATE domain_data 
          SET record_data = $1, updated_at = NOW() 
          WHERE id = $2
        `, [JSON.stringify(data), record.id]);
        
        console.log(`Updated record ${record.record_id}`);
      } catch (e) {
        console.error(`Error updating record ${record.id}: ${e}`);
      }
    }
    
    // 4. Now directly create a discrepancy and task
    console.log('\nDirectly creating discrepancy and task...');
    
    // Get the first record information to use
    const targetRecord = recordResult.rows[0];
    const recordData = JSON.parse(targetRecord.record_data);
    
    // Create a direct database call to insert a task
    const taskId = `TASK_${Date.now().toString().substring(6)}`;
    const detectionId = `DQ_${Date.now().toString().substring(7)}`;
    
    // First create a signal detection
    const signalResult = await pool.query(`
      INSERT INTO signal_detections (
        detection_id, trial_id, title, signal_type, detection_type,
        data_reference, observation, priority, status, assigned_to,
        detection_date, due_date, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING id
    `, [
      detectionId,
      trialId,
      `${domain} out_of_range`,
      'SITE_RISK',
      'RULE_BASED',
      `${domain}/${source}/${targetRecord.record_id}`,
      `Lab value ${recordData.LBORRES} is outside normal range (${recordData.LBSTNRLO}-${recordData.LBSTNRHI})`,
      'Critical',
      'initiated',
      'Data Manager',
      new Date(),
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
      'Direct Test',
      new Date()
    ]);
    
    const signalId = signalResult.rows[0].id;
    console.log(`Created signal detection ID: ${signalId}`);
    
    // Then create a task
    const taskResult = await pool.query(`
      INSERT INTO tasks (
        task_id, title, description, priority, status, trial_id,
        detection_id, assigned_to, due_date, created_by, created_at,
        domain, record_id, source, 
        data_context
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      ) RETURNING id
    `, [
      taskId,
      `Fix ${domain} out_of_range`,
      `Lab value ${recordData.LBORRES} is outside normal range (${recordData.LBSTNRLO}-${recordData.LBSTNRHI})\n\nRecommended Action: Review out-of-range lab value and verify clinical significance\n\nThis task was manually created by the direct test.`,
      'Critical',
      'Not Started',
      trialId,
      signalId,
      'Data Manager',
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Due tomorrow
      'Direct Test',
      new Date(),
      domain,
      targetRecord.record_id,
      source,
      JSON.stringify({
        detectionType: 'Data Quality Check',
        recommendedAction: 'Review out-of-range lab value and verify clinical significance',
        severity: 'Critical',
        discrepancyType: 'out_of_range'
      })
    ]);
    
    const taskDbId = taskResult.rows[0].id;
    console.log(`Created task ID: ${taskDbId}`);
    
    // 5. Create a notification for the task
    const notification = await pool.query(`
      INSERT INTO notifications (
        type, title, description, target_roles, read, action_required, created_at, 
        related_entity_id, trial_id, related_entity_type, priority
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING id
    `, [
      'task',
      `New Task: Fix ${domain} out_of_range`,
      `A new task has been assigned to Data Manager role: Lab value ${recordData.LBORRES} is outside normal range`,
      ['Data Manager'],
      false,
      true,
      new Date(),
      taskDbId,
      trialId,
      'task',
      'Critical'
    ]);
    
    console.log(`Created notification ID: ${notification.rows[0].id}`);
    
    // Create notification for Principal Investigator
    const piNotification = await pool.query(`
      INSERT INTO notifications (
        type, title, description, target_roles, read, action_required, created_at, 
        related_entity_id, trial_id, related_entity_type, priority
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING id
    `, [
      'task',
      `New Task: Fix ${domain} out_of_range`,
      `A new task has been assigned to Data Manager role: Lab value ${recordData.LBORRES} is outside normal range`,
      ['Principal Investigator'],
      false,
      true,
      new Date(),
      taskDbId,
      trialId,
      'task',
      'Critical'
    ]);
    
    console.log(`Created PI notification ID: ${piNotification.rows[0].id}`);
    
    console.log('\nDirect validation test completed successfully!');
    console.log('Please check the Tasks page to see the new task that was created directly.');
    console.log('If this task appears but automated tasks do not, there may be an issue with the middleware/notification flow.');
    
  } catch (error) {
    console.error('Error in directValidationTest:', error);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the test
directValidationTest().catch(console.error);