import { Request, Response } from "express";
import { db } from "./db";
import { domainData, domainSources, InsertDomainData, InsertDomainSource } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Store domain data in the database
 * @param req Request with domain data to store
 * @param res Response
 */
export async function storeDomainData(req: Request, res: Response) {
  try {
    const { trialId, domain, source, records } = req.body;

    if (!trialId || !domain || !source || !records || !Array.isArray(records)) {
      return res.status(400).json({ 
        error: "Missing required fields or invalid data format",
        required: ["trialId", "domain", "source", "records (array)"],
        received: { 
          trialId, domain, source, 
          records: records ? (Array.isArray(records) ? `Array(${records.length})` : typeof records) : null 
        }
      });
    }

    // Delete existing records for this combination if they exist
    await db.delete(domainData)
      .where(
        and(
          eq(domainData.trialId, trialId),
          eq(domainData.domain, domain),
          eq(domainData.source, source)
        )
      );
    
    // Insert each record with its own ID
    const insertPromises = records.map(async (record, index) => {
      const recordId = `${domain}-${source}-${index + 1}`;
      const insertData: InsertDomainData = {
        trialId,
        domain,
        source,
        recordId,
        recordData: typeof record === 'string' ? record : JSON.stringify(record),
        importedAt: new Date()
      };
      
      return db.insert(domainData).values(insertData).returning();
    });
    
    const results = await Promise.all(insertPromises);
    
    res.status(200).json({
      success: true,
      message: "Domain data stored",
      recordCount: results.length,
      data: results.map(r => r[0])
    });
  } catch (error) {
    console.error("Error storing domain data:", error);
    res.status(500).json({ 
      error: "Failed to store domain data",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Store domain source information in the database
 * @param req Request with domain source information
 * @param res Response
 */
export async function storeDomainSource(req: Request, res: Response) {
  try {
    const { trialId, domain, source, sourceType, system, integrationMethod, format } = req.body;

    if (!trialId || !domain || !source || !sourceType || !system || !integrationMethod || !format) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["trialId", "domain", "source", "sourceType", "system", "integrationMethod", "format"],
        received: { trialId, domain, source, sourceType, system, integrationMethod, format }
      });
    }

    // Create insert data
    const insertSource: InsertDomainSource = {
      trialId,
      domain,
      source,
      sourceType,
      system,
      integrationMethod,
      format
    };

    // Check if this source already exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(
        and(
          eq(domainSources.trialId, trialId),
          eq(domainSources.domain, domain),
          eq(domainSources.system, system)
        )
      );

    let result;
    
    if (existingSource.length > 0) {
      // Update existing source
      result = await db.update(domainSources)
        .set({
          sourceType,
          integrationMethod,
          format,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(domainSources.trialId, trialId),
            eq(domainSources.domain, domain),
            eq(domainSources.system, system)
          )
        )
        .returning();
    } else {
      // Insert new source
      result = await db.insert(domainSources)
        .values(insertSource)
        .returning();
    }

    res.status(200).json({
      success: true,
      message: existingSource.length > 0 ? "Domain source updated" : "Domain source stored",
      data: result[0]
    });
  } catch (error) {
    console.error("Error storing domain source:", error);
    res.status(500).json({ 
      error: "Failed to store domain source information",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get domain data from the database
 * @param req Request with trialId, domain, and source
 * @param res Response
 */
export async function getDomainData(req: Request, res: Response) {
  try {
    // Check if we're using query parameters or path parameters
    const trialId = req.params.trialId || req.query.trialId;
    const domain = req.params.domain || req.query.domain;
    const source = req.params.source || req.query.source;

    if (!trialId || !domain || !source) {
      return res.status(400).json({ 
        error: "Missing required parameters",
        required: ["trialId", "domain", "source"],
        received: { trialId, domain, source }
      });
    }

    const result = await db.select()
      .from(domainData)
      .where(
        and(
          eq(domainData.trialId, parseInt(trialId.toString())),
          eq(domainData.domain, domain.toString()),
          eq(domainData.source, source.toString())
        )
      );

    if (result.length === 0) {
      return res.status(404).json({ 
        error: "Domain data not found",
        trialId,
        domain,
        source
      });
    }

    // Parse record data from each record
    const parsedRecords = result.map(record => {
      try {
        return {
          ...record,
          parsedData: JSON.parse(record.recordData)
        };
      } catch (e) {
        console.error(`Error parsing record data for record ${record.id}:`, e);
        return record;
      }
    });

    res.status(200).json({
      domain,
      source,
      trialId: parseInt(trialId.toString()),
      importDate: result[0].importedAt,
      records: parsedRecords,
      recordCount: result.length
    });
  } catch (error) {
    console.error("Error retrieving domain data:", error);
    res.status(500).json({ 
      error: "Failed to retrieve domain data",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get sources for a domain from the database
 * @param req Request with trialId and domain
 * @param res Response
 */
export async function getDomainSources(req: Request, res: Response) {
  try {
    const { trialId, domain } = req.params;

    if (!trialId || !domain) {
      return res.status(400).json({ 
        error: "Missing required parameters" 
      });
    }

    const result = await db.select()
      .from(domainSources)
      .where(
        and(
          eq(domainSources.trialId, parseInt(trialId)),
          eq(domainSources.domain, domain)
        )
      );

    res.status(200).json({
      domain,
      trialId: parseInt(trialId),
      sources: result.map(s => ({
        sourceType: s.sourceType,
        system: s.system,
        integrationMethod: s.integrationMethod,
        format: s.format
      }))
    });
  } catch (error) {
    console.error("Error retrieving domain sources:", error);
    res.status(500).json({ 
      error: "Failed to retrieve domain source information",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get all available domains for a trial
 * @param req Request with trialId
 * @param res Response
 */
export async function getTrialDomains(req: Request, res: Response) {
  try {
    const { trialId } = req.params;

    if (!trialId) {
      return res.status(400).json({ 
        error: "Missing required parameters" 
      });
    }

    // Get unique domains from domain data
    const result = await db.select({
      domain: domainData.domain
    })
    .from(domainData)
    .where(eq(domainData.trialId, parseInt(trialId)));

    // Get unique domains
    const domains = [...new Set(result.map(r => r.domain))];

    res.status(200).json({
      trialId: parseInt(trialId),
      domains
    });
  } catch (error) {
    console.error("Error retrieving trial domains:", error);
    res.status(500).json({ 
      error: "Failed to retrieve trial domains",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get domain data records from the database for the RawDataBrowser
 * @param req Request with trialId, domain, and source in query parameters
 * @param res Response with array of records
 */
export async function getDomainRecords(req: Request, res: Response) {
  try {
    const trialId = req.query.trialId;
    const domain = req.query.domain;
    const source = req.query.source;

    console.log("getDomainRecords API call:", { trialId, domain, source });

    if (!trialId || !domain || !source) {
      return res.status(400).json({ 
        error: "Missing required parameters",
        required: ["trialId", "domain", "source"],
        received: { trialId, domain, source }
      });
    }

    // Find records in the domainData table
    const records = await db.query.domainData.findMany({
      where: and(
        eq(domainData.trialId, parseInt(trialId.toString())),
        eq(domainData.domain, domain.toString()),
        eq(domainData.source, source.toString())
      )
    });

    console.log(`Found ${records.length} records for trial ${trialId}, domain ${domain}, source ${source}`);

    if (records.length === 0) {
      return res.status(404).json({ 
        error: "No domain records found",
        trialId,
        domain,
        source
      });
    }

    // Parse the first record to verify JSON structure
    try {
      if (records[0].recordData) {
        const parsed = JSON.parse(records[0].recordData);
        console.log("Sample record structure:", Object.keys(parsed));
      }
    } catch (e) {
      console.warn("Could not parse record data:", e);
    }

    res.status(200).json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error("Error retrieving domain records:", error);
    res.status(500).json({ 
      error: "Failed to retrieve domain records",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get all sources for a trial domain
 * @param req Request with trialId and domain
 * @param res Response
 */
export async function getTrialDomainSources(req: Request, res: Response) {
  try {
    const { trialId, domain } = req.params;

    if (!trialId || !domain) {
      return res.status(400).json({ 
        error: "Missing required parameters" 
      });
    }

    // Get unique sources for the domain
    const result = await db.select({
      source: domainData.source
    })
    .from(domainData)
    .where(
      and(
        eq(domainData.trialId, parseInt(trialId)),
        eq(domainData.domain, domain)
      )
    );

    // Get unique sources
    const sources = [...new Set(result.map(r => r.source))];

    res.status(200).json({
      trialId: parseInt(trialId),
      domain,
      sources
    });
  } catch (error) {
    console.error("Error retrieving domain sources:", error);
    res.status(500).json({ 
      error: "Failed to retrieve domain sources",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Add a single domain data record
 * @param req Request with record data
 * @param res Response with created record
 */
export async function addDomainRecord(req: Request, res: Response) {
  try {
    const { trialId, domain, source, recordData, recordId: providedRecordId } = req.body;

    if (!trialId || !domain || !source || !recordData) {
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["trialId", "domain", "source", "recordData"],
        received: { trialId, domain, source, recordData: recordData ? "present" : null }
      });
    }

    // Use the provided recordId if available, otherwise generate one
    let recordId;
    if (providedRecordId) {
      console.log(`Using provided recordId: ${providedRecordId}`);
      recordId = providedRecordId;
    } else {
      // Generate a unique record ID
      const count = await db.select({ count: sql`count(*)` })
        .from(domainData)
        .where(and(
          eq(domainData.trialId, trialId),
          eq(domainData.domain, domain),
          eq(domainData.source, source)
        ));
      
      const nextNumber = Number(count[0]?.count || 0) + 1;
      recordId = `${domain}-${trialId}-${nextNumber}`;
      console.log(`Generated recordId: ${recordId}`);
    }

    // Create and insert the new record
    const insertData: InsertDomainData = {
      trialId,
      domain,
      source,
      recordId,
      recordData: typeof recordData === 'string' ? recordData : JSON.stringify(recordData),
      importedAt: new Date()
    };

    const result = await db.insert(domainData)
      .values(insertData)
      .returning();

    res.status(201).json({
      success: true,
      message: "Domain record created",
      data: result[0]
    });
  } catch (error) {
    console.error("Error adding domain record:", error);
    res.status(500).json({ 
      error: "Failed to add domain record",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Update a domain data record by ID
 * @param req Request with record data and ID
 * @param res Response with updated record
 */
export async function updateDomainRecord(req: Request, res: Response) {
  console.log(`[HANDLER] updateDomainRecord called for record ID: ${req.params.id}`);
  console.log(`[HANDLER] Request body: ${JSON.stringify(req.body, null, 2)}`);

  try {
    const { id } = req.params;
    const { recordData } = req.body;

    if (!id || !recordData) {
      console.log(`[HANDLER] Missing required fields: id=${id}, recordData=${recordData ? "present" : "null"}`);
      return res.status(400).json({ 
        error: "Missing required fields",
        required: ["id", "recordData"],
        received: { id, recordData: recordData ? "present" : null }
      });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(domainData)
      .where(eq(domainData.id, parseInt(id)));

    if (existingRecord.length === 0) {
      return res.status(404).json({
        error: "Record not found",
        id
      });
    }

    // Update the record
    const updatedData = {
      recordData: typeof recordData === 'string' ? recordData : JSON.stringify(recordData),
      updatedAt: new Date()
    };

    const result = await db.update(domainData)
      .set(updatedData)
      .where(eq(domainData.id, parseInt(id)))
      .returning();

    console.log(`[HANDLER] Record updated successfully: ${id}`);
    console.log(`[HANDLER] Updated record data: ${JSON.stringify(result[0], null, 2)}`);
    
    res.status(200).json({
      success: true,
      message: "Domain record updated",
      data: result[0]
    });
  } catch (error) {
    console.error("Error updating domain record:", error);
    res.status(500).json({ 
      error: "Failed to update domain record",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Delete a domain data record by ID
 * @param req Request with record ID
 * @param res Response with deletion confirmation
 */
export async function deleteDomainRecord(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        error: "Missing required parameter",
        required: ["id"],
        received: { id }
      });
    }

    // Check if record exists
    const existingRecord = await db.select()
      .from(domainData)
      .where(eq(domainData.id, parseInt(id)));

    if (existingRecord.length === 0) {
      return res.status(404).json({
        error: "Record not found",
        id
      });
    }

    // Delete the record
    await db.delete(domainData)
      .where(eq(domainData.id, parseInt(id)));

    res.status(200).json({
      success: true,
      message: "Domain record deleted",
      id: parseInt(id)
    });
  } catch (error) {
    console.error("Error deleting domain record:", error);
    res.status(500).json({ 
      error: "Failed to delete domain record",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Get a single domain data record by ID
 * @param req Request with record ID
 * @param res Response with record data
 */
export async function getDomainRecordById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        error: "Missing required parameter",
        required: ["id"],
        received: { id }
      });
    }

    // Fetch the record
    const record = await db.select()
      .from(domainData)
      .where(eq(domainData.id, parseInt(id)));

    if (record.length === 0) {
      return res.status(404).json({
        error: "Record not found",
        id
      });
    }

    // Parse the record data if it's a JSON string
    try {
      if (record[0].recordData) {
        const parsedData = JSON.parse(record[0].recordData);
        res.status(200).json({
          success: true,
          data: {
            ...record[0],
            parsedData
          }
        });
      } else {
        res.status(200).json({
          success: true,
          data: record[0]
        });
      }
    } catch (e) {
      console.warn(`Could not parse record data for record ${id}:`, e);
      res.status(200).json({
        success: true,
        data: record[0],
        warning: "Could not parse record data as JSON"
      });
    }
  } catch (error) {
    console.error("Error retrieving domain record:", error);
    res.status(500).json({ 
      error: "Failed to retrieve domain record",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}