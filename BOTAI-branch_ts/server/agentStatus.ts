import { Request, Response } from "express";
import { db } from "./db";
import { 
  agentStatus, 
  insertAgentStatusSchema, 
  AgentStatus, 
  InsertAgentStatus 
} from "@shared/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Get all agent statuses
 * @param req Request
 * @param res Response
 */
export async function getAgentStatuses(req: Request, res: Response) {
  console.log("getAgentStatuses API called");
  try {
    const statuses = await db.select().from(agentStatus);
    console.log("Retrieved agent statuses:", statuses);
    res.json(statuses);
  } catch (error) {
    console.error("Error retrieving agent statuses:", error);
    res.status(500).json({ error: "Failed to retrieve agent statuses" });
  }
}

/**
 * Get agent statuses for a specific trial
 * @param req Request with trialId
 * @param res Response
 */
export async function getAgentStatusesByTrial(req: Request, res: Response) {
  try {
    const { trialId } = req.params;
    
    if (!trialId) {
      return res.status(400).json({ error: "Trial ID is required" });
    }
    
    const statuses = await db.select().from(agentStatus)
      .where(eq(agentStatus.trialId, parseInt(trialId)))
      .orderBy(agentStatus.agentType);
    
    res.json(statuses);
  } catch (error) {
    console.error("Error retrieving agent statuses for trial:", error);
    res.status(500).json({ error: "Failed to retrieve agent statuses" });
  }
}

/**
 * Get agent status by type
 * @param req Request with agentType
 * @param res Response
 */
export async function getAgentStatusByType(req: Request, res: Response) {
  try {
    const { agentType, trialId } = req.params;
    
    if (!agentType) {
      return res.status(400).json({ error: "Agent type is required" });
    }
    
    let query;
    if (trialId) {
      query = and(
        eq(agentStatus.agentType, agentType),
        eq(agentStatus.trialId, parseInt(trialId))
      );
    } else {
      query = and(
        eq(agentStatus.agentType, agentType),
        isNull(agentStatus.trialId)
      );
    }
    
    const [status] = await db.select().from(agentStatus).where(query);
    
    if (!status) {
      return res.status(404).json({ error: "Agent status not found" });
    }
    
    res.json(status);
  } catch (error) {
    console.error("Error retrieving agent status by type:", error);
    res.status(500).json({ error: "Failed to retrieve agent status" });
  }
}

/**
 * Create a new agent status or update an existing one
 * @param req Request with agent status data
 * @param res Response
 */
export async function updateAgentStatus(req: Request, res: Response) {
  try {
    const payload = req.body;
    
    try {
      insertAgentStatusSchema.parse(payload);
    } catch (validationError) {
      return res.status(400).json({ error: "Invalid agent status data", details: validationError });
    }
    
    const { agentType, trialId } = payload;
    
    // Check if the agent status already exists
    let query;
    if (trialId) {
      query = and(
        eq(agentStatus.agentType, agentType),
        eq(agentStatus.trialId, trialId)
      );
    } else {
      query = and(
        eq(agentStatus.agentType, agentType),
        isNull(agentStatus.trialId)
      );
    }
    
    const [existingStatus] = await db.select().from(agentStatus).where(query);
    
    if (existingStatus) {
      // Update existing agent status
      const [updated] = await db.update(agentStatus)
        .set({
          ...payload,
          updatedAt: new Date()
        })
        .where(query)
        .returning();
      
      return res.json(updated);
    } else {
      // Create new agent status
      const [created] = await db.insert(agentStatus)
        .values({
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return res.status(201).json(created);
    }
  } catch (error) {
    console.error("Error updating agent status:", error);
    res.status(500).json({ error: "Failed to update agent status" });
  }
}

/**
 * Initialize agent status data for all agent types
 */
export async function initializeAgentStatuses() {
  try {
    console.log("Initializing agent statuses...");
    
    // Check if agent statuses already exist
    const existingStatuses = await db.select().from(agentStatus);
    
    if (existingStatuses.length > 0) {
      console.log(`${existingStatuses.length} agent statuses already exist, skipping initialization`);
      return;
    }
    
    // Initial seed data for agent statuses
    const initialStatuses: InsertAgentStatus[] = [
      {
        agentType: 'DataFetch',
        status: "active",
        lastRunTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        recordsProcessed: 25,
        issuesFound: 0,
        trialId: null,
      },
      {
        agentType: 'DataQuality',
        status: "active",
        lastRunTime: new Date(Date.now() - 3 * 60 * 1000), // 3 minutes ago
        recordsProcessed: 50,
        issuesFound: 3,
        trialId: null,
      },
      {
        agentType: 'DataReconciliation',
        status: "active",
        lastRunTime: new Date(Date.now() - 1 * 60 * 1000), // 1 minute ago
        recordsProcessed: 40,
        issuesFound: 2,
        trialId: null,
      },
      {
        agentType: 'SignalDetection',
        status: "active",
        lastRunTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        recordsProcessed: 65,
        issuesFound: 0,
        trialId: null,
      },
      {
        agentType: 'TaskManager',
        status: "active",
        lastRunTime: new Date(Date.now() - 4 * 60 * 1000), // 4 minutes ago
        recordsProcessed: 5,
        issuesFound: 0,
        trialId: null,
      },
    ];
    
    // Insert initial agent statuses
    await db.insert(agentStatus).values(initialStatuses);
    
    console.log(`Created ${initialStatuses.length} agent statuses`);
  } catch (error) {
    console.error("Error initializing agent statuses:", error);
    throw error;
  }
}

/**
 * Update agent run information on data processing
 * @param agentType Type of agent
 * @param recordsProcessed Number of records processed
 * @param issuesFound Number of issues found
 * @param trialId Optional trial ID
 */
export async function updateAgentRunInfo(
  agentType: string,
  recordsProcessed: number,
  issuesFound: number,
  trialId?: number,
  details?: any
) {
  try {
    let query;
    if (trialId) {
      query = and(
        eq(agentStatus.agentType, agentType),
        eq(agentStatus.trialId, trialId)
      );
    } else {
      query = and(
        eq(agentStatus.agentType, agentType),
        isNull(agentStatus.trialId)
      );
    }
    
    const [existingStatus] = await db.select().from(agentStatus).where(query);
    
    if (existingStatus) {
      // Update existing agent status
      await db.update(agentStatus)
        .set({
          lastRunTime: new Date(),
          recordsProcessed,
          issuesFound,
          updatedAt: new Date(),
          ...(details ? { details } : {})
        })
        .where(query);
    } else {
      // Create new agent status
      await db.insert(agentStatus)
        .values({
          agentType,
          status: "active",
          lastRunTime: new Date(),
          recordsProcessed,
          issuesFound,
          trialId: trialId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...(details ? { details } : {})
        });
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating agent run info for ${agentType}:`, error);
    return false;
  }
}