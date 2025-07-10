/**
 * Test script to verify the domain data validation workflow
 * This script:
 * 1. Creates a new lab record with out-of-range values
 * 2. Manually triggers analyzeDomainData to validate and create tasks/notifications
 * 3. Logs all steps for debugging
 */

// Use CommonJS require for compatibility
const { db } = require('./server/db');
const { domainData, tasks, notifications } = require('./shared/schema');
const { analyzeDomainData } = require('./server/dataManagerWorkflow');
const { eq, and } = require('drizzle-orm');

const TRIAL_ID = 3;  // Use trial 3 for testing
const DOMAIN = 'LB'; // Lab domain
const SOURCE = 'EDC'; // EDC source
const SUBJECT_ID = 'SUBJ-301';

async function testValidationWorkflow() {
  try {
    console.log('Starting domain validation workflow test...');
    
    // Generate a unique record ID
    const recordId = `LB-TEST-${Date.now()}`;
    
    // Create lab test data with an out-of-range value
    const labData = {
      USUBJID: SUBJECT_ID,
      LBTEST: 'Blood Urea Nitrogen',
      LBTESTCD: 'BUN',
      LBORRES: '120',  // Abnormally high BUN value
      LBORRESU: 'mg/dL',
      LBSTNRLO: '7',   // Normal range lower limit
      LBSTNRHI: '20',  // Normal range upper limit
      VISITNUM: '1',
      VISIT: 'Screening Visit',
      LBDTC: new Date().toISOString().split('T')[0], // Today's date
    };
    
    console.log(`Creating test lab record with ID ${recordId} and BUN value of 120 mg/dL (normal range: 7-20)`);
    
    // Insert the record into the database
    const [createdRecord] = await db
      .insert(domainData)
      .values({
        trialId: TRIAL_ID,
        domain: DOMAIN,
        recordId: recordId,
        source: SOURCE,
        recordData: JSON.stringify(labData),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log(`Successfully created record with ID: ${createdRecord.id}`);
    
    // Wait a moment for database to complete the transaction
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Directly call the analyzeDomainData function to process this record
    console.log(`Calling analyzeDomainData to validate record ${recordId}...`);
    await analyzeDomainData(TRIAL_ID, DOMAIN, SOURCE, [recordId]);
    
    console.log('Validation complete. Checking for created tasks...');
    
    // Wait a moment for task creation to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Query for tasks related to this record
    const tasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.domain, DOMAIN),
        eq(tasks.recordId, recordId)
      )
    });
    
    if (tasks.length > 0) {
      console.log(`Success! ${tasks.length} tasks were created for the out-of-range BUN value:`);
      tasks.forEach(task => {
        console.log(`- Task ID: ${task.id}, Title: ${task.title}, Priority: ${task.priority}`);
        console.log(`  Assigned to: ${task.assignedTo}, Due: ${task.dueDate}`);
      });
    } else {
      console.log('No tasks were created. Check the dataManagerWorkflow.ts logs for errors.');
    }
    
    // Let's also check for created notifications
    const notifications = await db.query.notifications.findMany({
      where: eq(notifications.relatedEntityType, 'task'),
      orderBy: [notifications.id, 'desc'],
      limit: 10
    });
    
    if (notifications.length > 0) {
      console.log(`Recent notifications (showing latest 10):`);
      notifications.forEach(notification => {
        console.log(`- Notification ID: ${notification.id}, Title: ${notification.title}`);
        console.log(`  User ID: ${notification.userId}, Created: ${notification.createdAt}`);
      });
    } else {
      console.log('No recent notifications found.');
    }
    
    console.log('Test completed successfully.');
  } catch (error) {
    console.error('Error in test workflow:', error);
  }
}

// Run the test
testValidationWorkflow();