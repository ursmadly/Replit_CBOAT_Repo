/**
 * Script to replicate agent_status and agent_workflows data for each trial
 * This will:
 * 1. Get all existing trials
 * 2. Get all existing agent_status records
 * 3. Get all existing agent_workflows records
 * 4. For each trial, create copies of all global agent records with trial-specific references
 */

const { db } = require('./server/db');
const { eq, isNull } = require('drizzle-orm');
const { agentStatus, agentWorkflows, trials } = require('./shared/schema');

async function replicateAgentDataForTrials() {
  console.log('Starting agent data replication for trials...');
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials to process`);
  
  // Get all global agent statuses (those without a trial ID)
  const globalAgentStatuses = await db.select().from(agentStatus).where(isNull(agentStatus.trialId));
  console.log(`Found ${globalAgentStatuses.length} global agent statuses to replicate`);
  
  // Get all global agent workflows (those without a trial ID)
  const globalAgentWorkflows = await db.select().from(agentWorkflows).where(isNull(agentWorkflows.trialId));
  console.log(`Found ${globalAgentWorkflows.length} global agent workflows to replicate`);
  
  // For each trial
  for (const trial of allTrials) {
    console.log(`Processing trial ID ${trial.id} (${trial.protocolId}): ${trial.title}`);
    
    // Check if trial-specific agent statuses already exist
    const existingAgentStatuses = await db.select().from(agentStatus).where(eq(agentStatus.trialId, trial.id));
    if (existingAgentStatuses.length > 0) {
      console.log(`  Trial ${trial.id} already has ${existingAgentStatuses.length} agent statuses, skipping agent status replication`);
    } else {
      // Replicate agent statuses for this trial
      for (const status of globalAgentStatuses) {
        // Create a new status record for this trial
        await db.insert(agentStatus).values({
          agentType: status.agentType,
          status: status.status,
          lastRunTime: status.lastRunTime,
          recordsProcessed: status.recordsProcessed,
          issuesFound: status.issuesFound,
          trialId: trial.id,
          protocolId: trial.protocolId,
          // Don't set id, createdAt, or updatedAt as they will be auto-generated
        });
      }
      console.log(`  Created ${globalAgentStatuses.length} agent statuses for trial ${trial.id}`);
    }
    
    // Check if trial-specific agent workflows already exist
    const existingAgentWorkflows = await db.select().from(agentWorkflows).where(eq(agentWorkflows.trialId, trial.id));
    if (existingAgentWorkflows.length > 0) {
      console.log(`  Trial ${trial.id} already has ${existingAgentWorkflows.length} agent workflows, skipping agent workflow replication`);
    } else {
      // Replicate agent workflows for this trial
      for (const workflow of globalAgentWorkflows) {
        // Create a new workflow record for this trial
        await db.insert(agentWorkflows).values({
          name: workflow.name,
          description: workflow.description,
          agentType: workflow.agentType,
          aiComponent: workflow.aiComponent,
          executionMode: workflow.executionMode,
          prerequisites: workflow.prerequisites,
          triggers: workflow.triggers,
          enabled: workflow.enabled,
          trialId: trial.id,
          protocolId: trial.protocolId,
          // Don't set id, createdAt, or updatedAt as they will be auto-generated
        });
      }
      console.log(`  Created ${globalAgentWorkflows.length} agent workflows for trial ${trial.id}`);
    }
  }
  
  console.log('Agent data replication completed successfully');
}

// Execute the function
replicateAgentDataForTrials()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during script execution:', error);
    process.exit(1);
  });