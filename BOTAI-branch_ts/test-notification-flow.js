/**
 * Test script to validate the notification flow by creating a domain record with issues
 * This will trigger the data quality checks and create a task with domain context
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

// Create a record for LB domain with data quality issues
// This will trigger validation in validateLabData function in the dataManagerWorkflow
async function createProblemLabRecord() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool });
    
    const trialId = 1; // Use trial 1 for testing
    const domain = "LB";
    const source = "EDC";
    
    // This is a record with multiple data quality issues:
    // 1. Out of range lab value (LBORRES outside LBSTNRLO-LBSTNRHI)
    // 2. Missing required fields (missing LBSPEC)
    const problemRecord = {
      trialId,
      domain,
      source,
      recordId: `TEST_RECORD_${Date.now()}`,
      parsedData: JSON.stringify({
        LBTEST: "Hemoglobin",
        LBORRES: "20.5",        // Abnormally high - should trigger "out_of_range" 
        LBORRESU: "g/dL",
        LBSTNRLO: "11.0",
        LBSTNRHI: "16.0",
        // Missing LBSPEC - should trigger missing field
        LBDTC: new Date().toISOString().split('T')[0]
      })
    };
    
    console.log("Creating problem lab record for trial:", trialId);
    
    // Insert problem record into domain data table
    const result = await db.execute(`
      INSERT INTO domain_data (trial_id, domain, source, record_id, parsed_data) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      problemRecord.trialId,
      problemRecord.domain,
      problemRecord.source,
      problemRecord.recordId,
      problemRecord.parsedData
    ]);
    
    console.log("Created record with ID:", result[0].id);
    console.log("Record details:", problemRecord);
    
    // We don't need to call analyzeDomainData manually
    // It should be triggered automatically by the middleware in domainDataManager.ts
    // But we can force it to make sure it runs
    
    console.log("Testing complete - check tasks and notifications");
    
  } catch (error) {
    console.error("Error creating test data:", error);
  }
}

createProblemLabRecord();