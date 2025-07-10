/**
 * Debug script for domain data workflow
 * This script tests the entire workflow by:
 * 1. Creating a domain record with known issues
 * 2. Manually calling the middleware that should create tasks and notifications
 * 3. Verifying if tasks and notifications are created
 */
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Simulate a request object for the middleware
class MockRequest {
  constructor(method, path, body) {
    this.method = method;
    this.originalUrl = path;
    this.body = body;
    this.path = path;
  }
}

// Simulate a response object for the middleware
class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.body = null;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.body = data;
    return this;
  }
}

async function debugWorkflow() {
  try {
    console.log('Starting domain data workflow debug...');
    
    // Import the middleware function directly
    const { trackDomainDataChanges } = require('./server/dataManagerWorkflow');
    
    // 1. Get a random trial ID from the database for testing
    const trialResult = await pool.query('SELECT id FROM trials LIMIT 1');
    if (!trialResult.rows.length) {
      console.error('No trials found in the database');
      return;
    }
    const trialId = trialResult.rows[0].id;
    console.log(`Using trial ID: ${trialId}`);
    
    // 2. Create unique record IDs for this test
    const timestamp = Date.now();
    const lbRecordId = `LB-${trialId}-${timestamp}`;
    const dmRecordId = `DM-${trialId}-${timestamp}`;
    const aeRecordId = `AE-${trialId}-${timestamp}`;
    const vsRecordId = `VS-${trialId}-${timestamp}`;
    const svRecordId = `SV-${trialId}-${timestamp}`;
    
    // Test with multiple domain types
    const testCases = [
      // LB domain test - Missing test name
      {
        domain: 'LB',
        recordId: lbRecordId,
        data: {
          USUBJID: '1001',
          // Missing LBTEST intentionally
          LBORRES: '16.5',
          LBSTNRLO: '13.0',
          LBSTNRHI: '17.0'
        }
      },
      // DM domain test - Invalid sex value
      {
        domain: 'DM',
        recordId: dmRecordId,
        data: {
          USUBJID: '1001',
          SEX: 'X', // Invalid value
          AGE: 45
        }
      },
      // AE domain test - Missing severity
      {
        domain: 'AE',
        recordId: aeRecordId,
        data: {
          USUBJID: '1001',
          AETERM: 'Headache',
          // Missing AESEV intentionally
          AESTDTC: '2023-01-15'
        }
      },
      // VS domain test - Out of range value
      {
        domain: 'VS',
        recordId: vsRecordId,
        data: {
          USUBJID: '1001',
          VSTEST: 'SYSBP',
          VSORRES: '300', // Out of range
          VSSTRESU: 'mmHg'
        }
      },
      // SV domain test - Date issue
      {
        domain: 'SV',
        recordId: svRecordId,
        data: {
          USUBJID: '1001',
          VISIT: 'WEEK 1',
          SVSTDTC: '2023-02-30' // Invalid date
        }
      }
    ];
    
    console.log(`Testing ${testCases.length} domain records...`);
    
    for (const testCase of testCases) {
      console.log(`\n--- Testing ${testCase.domain} domain (${testCase.recordId}) ---`);
      
      // Insert the record
      const insertQuery = `
        INSERT INTO domain_data (
          trial_id, domain, source, record_id, record_data, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, NOW(), NOW()
        ) RETURNING id
      `;
      
      const insertResult = await pool.query(
        insertQuery,
        [trialId, testCase.domain, 'EDC', testCase.recordId, JSON.stringify(testCase.data)]
      );
      
      if (!insertResult.rows.length) {
        console.error(`Failed to insert test record for ${testCase.domain}`);
        continue;
      }
      
      const recordDbId = insertResult.rows[0].id;
      console.log(`Record created in database with ID: ${recordDbId}`);
      
      // Create a mock request that would trigger the middleware
      const mockReq = new MockRequest(
        'POST',
        '/api/domain-data',
        {
          trialId,
          domain: testCase.domain,
          source: 'EDC',
          records: [{
            recordId: testCase.recordId,
            recordData: JSON.stringify(testCase.data)
          }]
        }
      );
      
      const mockRes = new MockResponse();
      
      // We need a next function for the middleware
      const mockNext = () => {
        console.log(`Middleware 'next' function called for ${testCase.domain}`);
        
        // Simulate response being sent
        mockRes.json({ success: true, message: 'Record processed' });
      };
      
      // Call the middleware directly
      console.log(`Calling middleware for ${testCase.domain} domain...`);
      await trackDomainDataChanges(mockReq, mockRes, mockNext);
      
      // Wait for async processing
      console.log('Waiting for workflow to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if a task was created
      const taskQuery = `
        SELECT id, title, description, status FROM tasks 
        WHERE description LIKE $1 
        ORDER BY created_at DESC LIMIT 1
      `;
      const taskResult = await pool.query(taskQuery, [`%${testCase.recordId}%`]);
      
      if (taskResult.rows.length) {
        console.log(`✅ Task created for ${testCase.domain} domain:`);
        console.log(JSON.stringify(taskResult.rows[0], null, 2));
        
        // Check for notifications
        const taskId = taskResult.rows[0].id;
        const notificationQuery = `
          SELECT id, title, description FROM notifications 
          WHERE related_entity_type = 'task' AND related_entity_id = $1
          ORDER BY created_at DESC LIMIT 1
        `;
        const notificationResult = await pool.query(notificationQuery, [taskId]);
        
        if (notificationResult.rows.length) {
          console.log(`✅ Notification created for ${testCase.domain} task:`);
          console.log(JSON.stringify(notificationResult.rows[0], null, 2));
        } else {
          console.log(`❌ No notification found for ${testCase.domain} task`);
        }
      } else {
        console.log(`❌ No task was created for ${testCase.domain} domain`);
        
        // Check activity logs
        const logQuery = `
          SELECT * FROM activity_logs 
          WHERE description LIKE $1 
          ORDER BY created_at DESC LIMIT 3
        `;
        const logResult = await pool.query(logQuery, [`%${testCase.recordId}%`]);
        
        if (logResult.rows.length) {
          console.log(`Found ${logResult.rows.length} activity logs for this record:`);
          logResult.rows.forEach(log => {
            console.log(`${log.created_at}: ${log.description}`);
          });
        } else {
          console.log('No activity logs found for this record');
        }
      }
    }
    
    console.log('\nDebug completed. Summary:');
    
    // Final check for all domains
    const finalQuery = `
      SELECT domain, COUNT(*) as count FROM tasks 
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      GROUP BY domain
    `;
    const finalResult = await pool.query(finalQuery);
    
    if (finalResult.rows.length) {
      console.log('Tasks created by domain in the last 10 minutes:');
      finalResult.rows.forEach(row => {
        console.log(`${row.domain}: ${row.count} tasks`);
      });
    } else {
      console.log('No tasks created in the last 10 minutes');
    }
    
  } catch (error) {
    console.error('Error during debug process:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the debug process
debugWorkflow().catch(console.error);