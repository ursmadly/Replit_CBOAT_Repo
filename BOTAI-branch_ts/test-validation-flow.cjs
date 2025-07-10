/**
 * Direct Test of Domain Data Validation Workflow
 * This script bypasses the API and calls the validation process directly
 */

// Import PostgreSQL driver
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function testValidationWorkflow() {
  try {
    console.log('Starting direct validation workflow test...');
    
    // First, update a lab record with out-of-range values
    const trialId = 3;
    const domain = 'LB';
    const source = 'EDC';
    
    // Get a specific lab record (select BUN if possible)
    const records = await pool.query(`
      SELECT * FROM domain_data 
      WHERE trial_id = $1 AND domain = $2 AND source = $3 
      LIMIT 1
    `, [trialId, domain, source]);
    
    if (records.rowCount === 0) {
      console.error('No lab records found for testing');
      return;
    }
    
    const record = records.rows[0];
    console.log(`Testing with record: ${record.record_id}`);
    
    // Parse existing data 
    let data;
    try {
      data = JSON.parse(record.record_data);
    } catch (e) {
      console.error(`Error parsing record data: ${e}`);
      return;
    }
    
    // Update with clearly out-of-range value
    data.LBORRES = "999";
    data.LBSTNRLO = "0";
    data.LBSTNRHI = "100";
    console.log(`Setting lab value to out-of-range value: ${data.LBORRES} (normal range: ${data.LBSTNRLO}-${data.LBSTNRHI})`);
    
    // Update the record
    await pool.query(`
      UPDATE domain_data 
      SET record_data = $1, updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(data), record.id]);
    
    console.log(`Updated record ${record.record_id} with out-of-range values`);
    
    // Now directly call the analyzeDomainData function - use child_process to run it separately
    // since we can't easily import it into a CJS file
    const { exec } = require('child_process');
    
    console.log('Triggering domain data analysis through middleware...');
    
    // Create a middleware simulation script
    const scriptContent = `
    // Import required modules
    import { db } from './server/db.js';
    import { analyzeDomainData } from './server/dataManagerWorkflow.js';
    
    async function testAnalysis() {
      try {
        console.log('Executing middleware simulation...');
        await analyzeDomainData(${trialId}, '${domain}', '${source}');
        console.log('Domain data analysis completed');
      } catch (error) {
        console.error('Error during analysis:', error);
      } finally {
        await db.pool.end();
      }
    }
    
    testAnalysis().catch(console.error);
    `;
    
    // Write this to a temporary file
    const fs = require('fs');
    fs.writeFileSync('temp-middleware-test.js', scriptContent);
    
    // Execute it with Node
    exec('node temp-middleware-test.js', (error, stdout, stderr) => {
      console.log('---- Middleware Execution Output ----');
      if (error) {
        console.error(`Execution error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Execution stderr: ${stderr}`);
      }
      console.log(stdout);
      console.log('-------------------------------------');
      console.log('Validation workflow test completed.');
      console.log('Please check the Tasks page to see if new tasks were created.');
      
      // Clean up temp file
      fs.unlinkSync('temp-middleware-test.js');
    });
    
  } catch (error) {
    console.error('Error in testValidationWorkflow:', error);
  }
}

// Run the test
testValidationWorkflow().catch(console.error);