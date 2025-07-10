/**
 * Test script to update a lab record with out-of-range values
 * This will trigger the domain validation workflow
 */

import { db } from './server/db.js';
import { analyzeDomainData } from './server/dataManagerWorkflow.js';

async function updateLabRecord() {
  try {
    console.log('Starting lab record update test...');
    
    // Find an existing lab record
    const trialId = 3; // Using trial 3 for testing
    const domain = 'LB';
    const source = 'EDC';
    
    // Get the first record from the domain_data table for this trial, domain, and source
    const records = await db.query(`
      SELECT * FROM domain_data 
      WHERE trial_id = $1 AND domain = $2 AND source = $3 
      LIMIT 5
    `, [trialId, domain, source]);
    
    if (records.rowCount === 0) {
      console.error('No lab records found for testing');
      return;
    }
    
    console.log(`Found ${records.rowCount} lab records for testing`);
    
    // Update all test records with out-of-range values to ensure task creation
    for (let i = 0; i < records.rowCount; i++) {
      const record = records.rows[i];
      console.log(`Processing record ${i+1}: ${record.record_id}`);
      
      // Parse the existing data
      let data;
      try {
        data = JSON.parse(record.record_data);
      } catch (e) {
        console.error(`Error parsing record data: ${e}`);
        continue;
      }
      
      // Modify the record data to create out-of-range values
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
      
      // Update the record in the database
      const updatedData = JSON.stringify(data);
      await db.query(`
        UPDATE domain_data 
        SET record_data = $1, updated_at = NOW()
        WHERE id = $2
      `, [updatedData, record.id]);
      
      console.log(`Updated record ${record.record_id} with out-of-range values`);
    }
    
    // Trigger domain data analysis to create tasks
    console.log('Triggering domain data analysis...');
    await analyzeDomainData(trialId, domain, source);
    
    console.log('Lab record update test completed successfully');
  } catch (error) {
    console.error('Error in updateLabRecord:', error);
  } finally {
    // Close the database connection
    await db.pool.end();
  }
}

// Run the test
updateLabRecord().catch(console.error);