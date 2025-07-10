/**
 * Test script to update lab records with out-of-range values
 * This is a CommonJS script for easier execution
 */

// Set up environment
require('dotenv').config();

// Import the database connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function updateLabRecords() {
  try {
    console.log('Starting lab record update test...');
    
    // Find some lab records for trial 3
    const trialId = 3;
    const domain = 'LB';
    const source = 'EDC';
    
    // Get a few records to update
    const getRecordsQuery = `
      SELECT * FROM domain_data 
      WHERE trial_id = $1 AND domain = $2 AND source = $3 
      LIMIT 5
    `;
    
    const records = await pool.query(getRecordsQuery, [trialId, domain, source]);
    
    if (records.rowCount === 0) {
      console.log('No lab records found for testing');
      return;
    }
    
    console.log(`Found ${records.rowCount} lab records for testing`);
    
    // Update each record to create out-of-range lab values
    for (let i = 0; i < records.rowCount; i++) {
      const record = records.rows[i];
      console.log(`Processing record ${i+1}: ${record.record_id}`);
      
      // Parse existing data
      let data;
      try {
        data = JSON.parse(record.record_data);
      } catch (e) {
        console.error(`Error parsing record data: ${e}`);
        continue;
      }
      
      // Update with out-of-range values
      if (data.LBTESTCD === 'BUN') {
        // Blood urea nitrogen - create very high value
        data.LBORRES = "180"; // Very high BUN value
        data.LBSTNRLO = "5";
        data.LBSTNRHI = "25";
        console.log(`Setting BUN to out-of-range value: ${data.LBORRES} (normal range: ${data.LBSTNRLO}-${data.LBSTNRHI})`);
      } else if (data.LBTESTCD === 'GLUC') {
        // Glucose - create very low value
        data.LBORRES = "30"; // Very low glucose value
        data.LBSTNRLO = "70";
        data.LBSTNRHI = "115";
        console.log(`Setting glucose to out-of-range value: ${data.LBORRES} (normal range: ${data.LBSTNRLO}-${data.LBSTNRHI})`);
      } else if (data.LBTESTCD === 'HGB') {
        // Hemoglobin - create very high value
        data.LBORRES = "22"; // Very high hemoglobin value
        data.LBSTNRLO = "12";
        data.LBSTNRHI = "16";
        console.log(`Setting hemoglobin to out-of-range value: ${data.LBORRES} (normal range: ${data.LBSTNRLO}-${data.LBSTNRHI})`);
      } else {
        // For any other test, just create an out-of-range value
        data.LBORRES = "999"; // Arbitrary high value
        data.LBSTNRLO = "0";
        data.LBSTNRHI = "100";
        console.log(`Setting ${data.LBTESTCD || 'lab value'} to out-of-range value: ${data.LBORRES} (normal range: ${data.LBSTNRLO}-${data.LBSTNRHI})`);
      }
      
      // Prepare SQL to update the record
      const updateQuery = `
        UPDATE domain_data 
        SET record_data = $1, updated_at = NOW()
        WHERE id = $2
      `;
      
      // Update the record in the database
      await pool.query(updateQuery, [JSON.stringify(data), record.id]);
      console.log(`Updated record ${record.record_id} with out-of-range values`);
    }
    
    console.log('Lab record updates completed successfully. Access the Tasks page to see if the domain data validation created tasks.');
    console.log('Note: You may need to refresh the Tasks page to see the new tasks.');
    
  } catch (error) {
    console.error('Error in updateLabRecords:', error);
  } finally {
    // Close the database connection
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the test
updateLabRecords().catch(console.error);