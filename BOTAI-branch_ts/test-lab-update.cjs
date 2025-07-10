/**
 * Test script to update a single lab record with an out-of-range value
 * This will trigger the domain data validation workflow
 */

const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');

// Initialize the database connection
const { neonConfig } = require('@neondatabase/serverless');
neonConfig.webSocketConstructor = ws;

// Update a specific record in trial 3 with an abnormal lab value
async function updateLabRecord() {
  try {
    console.log('Connecting to database...');
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Record details to update
    const TRIAL_ID = 3;
    const DOMAIN = 'LB';
    const SOURCE = 'EDC';
    
    // Find a lab record to update
    console.log('Finding a lab record to update...');
    const result = await pool.query(`
      SELECT * FROM domain_data
      WHERE trial_id = $1 AND domain = $2 AND source = $3
      LIMIT 1
    `, [TRIAL_ID, DOMAIN, SOURCE]);
    
    if (result.rows.length === 0) {
      console.error('No lab records found to update');
      return;
    }
    
    const record = result.rows[0];
    console.log(`Found record ID ${record.record_id}`);
    
    // Parse the existing data
    const existingData = JSON.parse(record.record_data);
    
    // Update with an out-of-range value
    const updatedData = {
      ...existingData,
      LBTEST: 'Blood Urea Nitrogen',
      LBTESTCD: 'BUN',
      LBORRES: '120',  // Abnormal value (normal range is usually 7-20)
      LBSTNRLO: '7',   // Lower limit
      LBSTNRHI: '20',  // Upper limit
    };
    
    console.log(`Updating record with out-of-range BUN value of 120 (normal: 7-20)`);
    
    // Update the record in the database
    const updateResult = await pool.query(`
      UPDATE domain_data
      SET record_data = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, record_id
    `, [JSON.stringify(updatedData), record.id]);
    
    if (updateResult.rows.length > 0) {
      console.log(`Successfully updated record ID ${updateResult.rows[0].record_id}`);
      console.log('This should trigger the domain data validation workflow');
      console.log('Check the Tasks page in the application to see if a new task was created');
    } else {
      console.error('Failed to update record');
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error updating lab record:', error);
  }
}

// Run the test
updateLabRecord();