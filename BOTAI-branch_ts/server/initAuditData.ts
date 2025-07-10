import { db } from "./db";
import { domainData, domainSources, InsertDomainData, InsertDomainSource } from "@shared/schema";
import { eq, and } from "drizzle-orm";

/**
 * Initialize EDC Audit data in the database
 * This function creates sample audit data for each trial and stores it in the domainData table
 */
export async function initEDCAuditData() {
  try {
    console.log("Initializing EDC Audit data...");
    
    // Get all trials from the database
    const trials = await db.query.trials.findMany();
    
    if (!trials || trials.length === 0) {
      console.log("No trials found, skipping EDC Audit data initialization");
      return;
    }
    
    console.log(`Found ${trials.length} trials, initializing EDC Audit data for each`);
    
    // Create EDC source information for each trial if it doesn't exist
    for (const trial of trials) {
      // Check if the source information already exists
      const existingSourceInfo = await db.select()
        .from(domainSources)
        .where(
          and(
            eq(domainSources.trialId, trial.id),
            eq(domainSources.domain, "AUDIT"),
            eq(domainSources.source, "EDC Audit Trail")
          )
        );
      
      // If the source information doesn't exist, create it
      if (existingSourceInfo.length === 0) {
        const sourceInfo: InsertDomainSource = {
          trialId: trial.id,
          domain: "AUDIT",
          source: "EDC Audit Trail",
          sourceType: "EDC",
          system: trial.id === 1 ? "Medidata Rave" : 
                  trial.id === 2 ? "IQVIA Rave" : 
                  trial.id === 3 ? "Oracle InForm" : 
                  "EDC System",
          integrationMethod: "API",
          format: "JSON",
          description: "EDC system audit trail data including user actions, data changes, and system events",
          mappingDetails: "Maps to standard AUDIT domain with custom fields for EDC-specific attributes",
          frequency: "Daily",
          contact: "Data Management Team"
        };
        
        await db.insert(domainSources).values(sourceInfo);
        console.log(`Created source information for trial ${trial.id}, domain AUDIT, source EDC Audit Trail`);
      } else {
        console.log(`Source information for trial ${trial.id}, domain AUDIT, source EDC Audit Trail already exists`);
      }
      
      // Check if audit data already exists for this trial
      const existingData = await db.query.domainData.findMany({
        where: and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "AUDIT"),
          eq(domainData.source, "EDC Audit Trail")
        )
      });
      
      // If data already exists, skip this trial
      if (existingData.length > 0) {
        console.log(`Audit data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
        continue;
      }
      
      // Generate audit data for this trial
      const auditRecords = generateAuditData(trial.id, 50); // Generate 50 audit records
      
      // Insert all records
      for (let i = 0; i < auditRecords.length; i++) {
        const record = auditRecords[i];
        
        const domainDataRecord: InsertDomainData = {
          trialId: trial.id,
          domain: "AUDIT",
          source: "EDC Audit Trail",
          recordId: `AUDIT-${trial.id}-${i + 1}`,
          recordData: JSON.stringify(record),
          importedAt: new Date()
        };
        
        await db.insert(domainData).values(domainDataRecord);
      }
      
      console.log(`Created ${auditRecords.length} audit records for trial ${trial.id}`);
    }
    
    console.log("EDC Audit data initialization complete");
  } catch (error) {
    console.error("Error initializing EDC Audit data:", error);
    throw error;
  }
}

/**
 * Generate sample EDC audit data
 * @param trialId Trial ID
 * @param count Number of records to generate
 * @returns Array of audit records
 */
function generateAuditData(trialId: number, count: number) {
  const records = [];
  const auditActions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "VIEW"];
  const auditStatuses = ["SUCCESS", "FAILURE", "WARNING"];
  const studyIdentifier = `PRO00${trialId}`;
  
  // Generate a set of dates spanning the last 3 months
  const now = new Date();
  const dates = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000);
    dates.push(date);
  }
  
  // Sort dates in ascending order (oldest first)
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  // Generate audit records using the sorted dates
  for (let i = 0; i < count; i++) {
    const action = auditActions[Math.floor(Math.random() * auditActions.length)];
    const auditDate = dates[i];
    
    records.push({
      STUDYID: studyIdentifier,
      DOMAIN: "AUDIT",
      AUDITID: `AUDIT-${trialId}-${i + 1}`,
      AUDITUSER: ["John Doe", "Jane Smith", "Robert Johnson", "Sarah Williams", "Michael Brown"][Math.floor(Math.random() * 5)],
      AUDITDTC: auditDate.toISOString(),
      AUDITACTION: action,
      AUDITREC: `${["PATIENT", "FORM", "QUERY", "SUBJECT", "VISIT"][Math.floor(Math.random() * 5)]}-${Math.floor(Math.random() * 100) + 1}`,
      AUDITDESC: `${action} operation on ${["patient data", "form data", "query", "subject data", "visit data"][Math.floor(Math.random() * 5)]}`,
      AUDITSTATUS: auditStatuses[Math.floor(Math.random() * auditStatuses.length)],
      AUDITREAS: action === "UPDATE" ? `Updating ${["demographic", "lab", "adverse event", "concomitant medication", "vital sign"][Math.floor(Math.random() * 5)]} data` : "",
      AUDITIP: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      AUDITSYS: ["EDC", "IRT", "CTMS", "eTMF", "Safety DB"][Math.floor(Math.random() * 5)]
    });
  }
  
  return records;
}

/**
 * Initialize Form Audit data in the database
 * This function creates sample form audit data for each trial and stores it in the domainData table
 */
export async function initFormAuditData() {
  try {
    console.log("Initializing Form Audit data...");
    
    // Get all trials from the database
    const trials = await db.query.trials.findMany();
    
    if (!trials || trials.length === 0) {
      console.log("No trials found, skipping Form Audit data initialization");
      return;
    }
    
    console.log(`Found ${trials.length} trials, initializing Form Audit data for each`);
    
    // Create source information for each trial if it doesn't exist
    for (const trial of trials) {
      // Check if the source information already exists
      const existingSourceInfo = await db.select()
        .from(domainSources)
        .where(
          and(
            eq(domainSources.trialId, trial.id),
            eq(domainSources.domain, "FORM_AUDIT"),
            eq(domainSources.source, "EDC Form Audit Trail")
          )
        );
      
      // If the source information doesn't exist, create it
      if (existingSourceInfo.length === 0) {
        const sourceInfo: InsertDomainSource = {
          trialId: trial.id,
          domain: "FORM_AUDIT",
          source: "EDC Form Audit Trail",
          sourceType: "EDC",
          system: trial.id === 1 ? "Medidata Rave" : 
                  trial.id === 2 ? "IQVIA Rave" : 
                  trial.id === 3 ? "Oracle InForm" : 
                  "EDC System",
          integrationMethod: "API",
          format: "JSON",
          description: "EDC form versioning and audit data including form changes, publications, and design updates",
          mappingDetails: "Maps to custom FORM_AUDIT domain with fields for tracking form versioning",
          frequency: "Weekly",
          contact: "Form Design Team"
        };
        
        await db.insert(domainSources).values(sourceInfo);
        console.log(`Created source information for trial ${trial.id}, domain FORM_AUDIT, source EDC Form Audit Trail`);
      } else {
        console.log(`Source information for trial ${trial.id}, domain FORM_AUDIT, source EDC Form Audit Trail already exists`);
      }
      
      // Check if form audit data already exists for this trial
      const existingData = await db.query.domainData.findMany({
        where: and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "FORM_AUDIT"),
          eq(domainData.source, "EDC Form Audit Trail")
        )
      });
      
      // If data already exists, skip this trial
      if (existingData.length > 0) {
        console.log(`Form Audit data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
        continue;
      }
      
      // Generate form audit data for this trial
      const formAuditRecords = generateFormAuditData(trial.id, 20); // Generate 20 form audit records
      
      // Insert all records
      for (let i = 0; i < formAuditRecords.length; i++) {
        const record = formAuditRecords[i];
        
        const domainDataRecord: InsertDomainData = {
          trialId: trial.id,
          domain: "FORM_AUDIT",
          source: "EDC Form Audit Trail",
          recordId: `FORM-AUDIT-${trial.id}-${i + 1}`,
          recordData: JSON.stringify(record),
          importedAt: new Date()
        };
        
        await db.insert(domainData).values(domainDataRecord);
      }
      
      console.log(`Created ${formAuditRecords.length} form audit records for trial ${trial.id}`);
    }
    
    console.log("Form Audit data initialization complete");
  } catch (error) {
    console.error("Error initializing Form Audit data:", error);
    throw error;
  }
}

/**
 * Generate sample form audit data
 * @param trialId Trial ID
 * @param count Number of records to generate
 * @returns Array of form audit records
 */
function generateFormAuditData(trialId: number, count: number) {
  const records = [];
  const versions = ["1.0", "1.1", "1.2", "2.0", "2.1"];
  const actions = ["CREATE", "UPDATE", "PUBLISH", "ARCHIVE"];
  const formNames = ["Demographics", "Adverse Events", "Concomitant Medications", "Vital Signs", "Laboratory Tests", "Medical History", "Physical Examination"];
  const studyIdentifier = `PRO00${trialId}`;
  
  // Generate a set of dates spanning the last 6 months
  const now = new Date();
  const dates = [];
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getTime() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
    dates.push(date);
  }
  
  // Sort dates in ascending order (oldest first)
  dates.sort((a, b) => a.getTime() - b.getTime());
  
  // Generate form audit records using the sorted dates
  for (let i = 0; i < count; i++) {
    const formName = formNames[Math.floor(Math.random() * formNames.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const version = versions[Math.floor(Math.random() * versions.length)];
    const auditDate = dates[i];
    
    records.push({
      STUDYID: studyIdentifier,
      DOMAIN: "FORM_AUDIT",
      FORMID: `FORM-${trialId}-${i + 1}`,
      FORMNAME: formName,
      FORMVER: version,
      FORMACT: action,
      FORMUSER: ["John Doe", "Jane Smith", "Robert Johnson", "Sarah Williams", "Michael Brown"][Math.floor(Math.random() * 5)],
      FORMROLE: ["Data Manager", "Study Designer", "System Administrator", "CRA", "Clinical Lead"][Math.floor(Math.random() * 5)],
      FORMDTC: auditDate.toISOString(),
      FORMSITE: action === "UPDATE" ? `SITE-${Math.floor(Math.random() * 10) + 1}` : "ALL",
      FORMCHG: action === "UPDATE" ? `Modified ${["field logic", "field labels", "field options", "validation rules", "skip logic"][Math.floor(Math.random() * 5)]}` : "",
      FORMFIELDS: Math.floor(Math.random() * 100) + 10,
      FORMPAGES: Math.floor(Math.random() * 5) + 1
    });
  }
  
  return records;
}