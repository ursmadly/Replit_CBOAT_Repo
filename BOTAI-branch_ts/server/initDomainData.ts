import { db } from "./db";
import { domainData, domainSources, trials, InsertDomainData, InsertDomainSource } from "@shared/schema";
import { domainSpecificGenerators, getStudyIdentifier, subjectIds } from "../client/src/components/data-management/domains/DomainDataUtils";
import { eq, and, sql } from "drizzle-orm";

/**
 * Initialize DM (Demographics) domain data
 */
export async function initDMData() {
  console.log("Initializing DM data...");
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing DM data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "DM"),
        eq(domainSources.source, "EDC")
      ));
    
    if (existingSource.length > 0) {
      console.log(`Source information for trial ${trial.id}, domain DM, source EDC already exists`);
    } else {
      // Create source
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "DM",
        source: "EDC",
        description: "Patient demographics data from EDC system",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Daily",
        contact: "Data Management"
      };
      
      await db.insert(domainSources).values(sourceInfo);
      console.log(`Created source for trial ${trial.id}, domain DM, source EDC`);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "DM"),
        eq(domainData.source, "EDC")
      ));
    
    if (existingData.length > 0) {
      console.log(`DM data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    // Generate and insert data
    const recordCount = 25; // Number of records to generate
    
    // Use domain-specific generator for DM domain
    const generator = domainSpecificGenerators["DM"];
    if (!generator) {
      console.error(`No generator found for domain DM`);
      continue;
    }
    
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      // Generate a domain-specific record with appropriate study ID
      const record = generator();
      record.STUDYID = getStudyIdentifier(trial.id);
      record.USUBJID = `S-${trial.id}-${String(i + 1).padStart(3, '0')}`;
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "DM",
        source: "EDC",
        recordId: `DM-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(record),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    // Insert in batches to avoid potential issues with too many parameters
    const batchSize = 50;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      await db.insert(domainData).values(batch);
    }
    
    // Update record count in domain_sources
    // Since our schema doesn't include recordCount, we need to do a count query
    const countResult = await db.select({ count: sql`count(*)` })
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "DM"),
        eq(domainData.source, "EDC")
      ));
    
    console.log(`Added DM records for trial ${trial.id}. Count: ${countResult[0]?.count || 0}`);
  }
  
  console.log("DM data initialization complete");
}

/**
 * Initialize LB (Lab) domain data
 */
export async function initLBData() {
  console.log("Initializing LB data...");
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing LB data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "LB"),
        eq(domainSources.source, "Central Laboratory")
      ));
    
    if (existingSource.length > 0) {
      console.log(`Source information for trial ${trial.id}, domain LB, source Central Laboratory already exists`);
    } else {
      // Create source
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "LB",
        source: "Central Laboratory",
        description: "Laboratory test results from central lab",
        sourceType: "Lab",
        system: "Lab System",
        integrationMethod: "API",
        format: "SDTM",
        frequency: "Daily",
        contact: "Central Laboratory"
      };
      
      await db.insert(domainSources).values(sourceInfo);
      console.log(`Created source for trial ${trial.id}, domain LB, source Central Laboratory`);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "LB"),
        eq(domainData.source, "Central Laboratory")
      ));
    
    if (existingData.length > 0) {
      console.log(`LB data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    // Generate and insert data
    const recordCount = 100; // More lab records than patient records
    
    // Use domain-specific generator for LB domain
    const generator = domainSpecificGenerators["LB"];
    if (!generator) {
      console.error(`No generator found for domain LB`);
      continue;
    }
    
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      // Generate a domain-specific record with appropriate study ID
      const record = generator();
      record.STUDYID = getStudyIdentifier(trial.id);
      record.USUBJID = `S-${trial.id}-${String(Math.floor(i/4) + 1).padStart(3, '0')}`;
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "LB",
        source: "Central Laboratory",
        recordId: `LB-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(record),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    // Insert in batches to avoid potential issues with too many parameters
    const batchSize = 50;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      await db.insert(domainData).values(batch);
    }
    
    // Count the inserted records
    const countResult = await db.select({ count: sql`count(*)` })
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "LB"),
        eq(domainData.source, "Central Laboratory")
      ));
    
    console.log(`Added LB records for trial ${trial.id}. Count: ${countResult[0]?.count || 0}`);
  }
  
  console.log("LB data initialization complete");
}

/**
 * Initialize SV (Subject Visit) domain data
 */
export async function initSVData() {
  console.log("Initializing SV data...");
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing SV data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "SV"),
        eq(domainSources.source, "EDC")
      ));
    
    if (existingSource.length > 0) {
      console.log(`Source information for trial ${trial.id}, domain SV, source EDC already exists`);
    } else {
      // Create source
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "SV",
        source: "EDC",
        description: "Subject visit data from EDC system",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Daily",
        contact: "Clinical Operations"
      };
      
      await db.insert(domainSources).values(sourceInfo);
      console.log(`Created source for trial ${trial.id}, domain SV, source EDC`);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "SV"),
        eq(domainData.source, "EDC")
      ));
    
    if (existingData.length > 0) {
      console.log(`SV data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    // Generate and insert data
    const recordCount = 75; // Multiple visits per patient
    
    // Use domain-specific generator for SV domain
    const generator = domainSpecificGenerators["SV"];
    if (!generator) {
      console.error(`No generator found for domain SV`);
      continue;
    }
    
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      // Generate a domain-specific record with appropriate study ID
      const record = generator();
      record.STUDYID = getStudyIdentifier(trial.id);
      record.USUBJID = `S-${trial.id}-${String(Math.floor(i/3) + 1).padStart(3, '0')}`;
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "SV",
        source: "EDC",
        recordId: `SV-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(record),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    // Insert in batches to avoid potential issues with too many parameters
    const batchSize = 50;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      await db.insert(domainData).values(batch);
    }
    
    // Count the inserted records
    const countResult = await db.select({ count: sql`count(*)` })
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "SV"),
        eq(domainData.source, "EDC")
      ));
    
    console.log(`Added SV records for trial ${trial.id}. Count: ${countResult[0]?.count || 0}`);
  }
  
  console.log("SV data initialization complete");
}

/**
 * Initialize TU (Tumor) domain data for imaging
 */
export async function initTUData() {
  console.log("Initializing TU (Imaging) data...");
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing TU data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "TU"),
        eq(domainSources.source, "Imaging RECIST")
      ));
    
    if (existingSource.length > 0) {
      console.log(`Source information for trial ${trial.id}, domain TU, source Imaging RECIST already exists`);
    } else {
      // Create source
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "TU",
        source: "Imaging RECIST",
        description: "Tumor assessment data from imaging system",
        sourceType: "Imaging",
        system: "Imaging System",
        integrationMethod: "API",
        format: "SDTM",
        frequency: "Weekly",
        contact: "Imaging Core Lab"
      };
      
      await db.insert(domainSources).values(sourceInfo);
      console.log(`Created source for trial ${trial.id}, domain TU, source Imaging RECIST`);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "TU"),
        eq(domainData.source, "Imaging RECIST")
      ));
    
    if (existingData.length > 0) {
      console.log(`TU data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    // Generate and insert data - since we don't have a TU generator yet, we'll create custom data
    const recordCount = 40; // Fewer tumor assessments than lab tests typically
    
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    // Generate specimen-specific tumor records
    const tumorTypes = ["Target Lesion", "Non-Target Lesion", "New Lesion"];
    const tumorLocations = ["Lung", "Liver", "Lymph Node", "Brain", "Bone", "Kidney", "Adrenal"];
    const assessmentMethods = ["CT", "MRI", "X-Ray", "PET", "Physical Exam"];
    const tumorSites = ["Primary", "Metastatic"];
    
    for (let i = 0; i < recordCount; i++) {
      const patientNum = Math.floor(i/2) + 1; // Each patient has multiple tumor records
      const visitNum = Math.floor(Math.random() * 5) + 1;
      const assessmentDate = new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000);
      const tumorType = tumorTypes[Math.floor(Math.random() * tumorTypes.length)];
      const location = tumorLocations[Math.floor(Math.random() * tumorLocations.length)];
      const method = assessmentMethods[Math.floor(Math.random() * assessmentMethods.length)];
      const diameter = Math.floor(Math.random() * 50) + 5; // 5-55mm
      
      const tuRecord = {
        STUDYID: getStudyIdentifier(trial.id),
        DOMAIN: "TU",
        USUBJID: `S-${trial.id}-${String(patientNum).padStart(3, '0')}`,
        TUSEQ: i + 1,
        TUGRPID: `TU${String(patientNum).padStart(3, '0')}-${i + 1}`,
        TUREFID: `${Math.floor(Math.random() * 1000) + 1000}`,
        TULNKID: `VISIT-${visitNum}`,
        TUTESTCD: "TUMIDENT",
        TUTEST: "Tumor Identification",
        TUORRES: `${location} ${tumorType}`,
        TUSTRESC: `${location} ${tumorType}`,
        TUNAM: `${location} ${tumorType} ${i + 1}`,
        TULOC: location,
        TUMETHOD: method,
        TUCAT: tumorType,
        TUDIAMETER: diameter,
        TUDIAMUNIT: "mm",
        TUDTC: assessmentDate.toISOString().split('T')[0],
        TUDDY: Math.floor(Math.random() * 200) + 1,
        VISITNUM: visitNum,
        VISIT: `Visit ${visitNum}`,
        TUSITE: tumorSites[Math.floor(Math.random() * tumorSites.length)],
        TUEVAL: ["Investigator", "Independent Review", "Sponsor"][Math.floor(Math.random() * 3)],
        TUACPTFL: ["Y", "N"][Math.floor(Math.random() * 2)]
      };
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "TU",
        source: "Imaging RECIST",
        recordId: `TU-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(tuRecord),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    // Insert in batches to avoid potential issues with too many parameters
    const batchSize = 50;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      await db.insert(domainData).values(batch);
    }
    
    // Count the inserted records
    const countResult = await db.select({ count: sql`count(*)` })
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "TU"),
        eq(domainData.source, "Imaging RECIST")
      ));
    
    console.log(`Added TU records for trial ${trial.id}. Count: ${countResult[0]?.count || 0}`);
  }
  
  console.log("TU data initialization complete");
}

/**
 * Initialize CTMS Study domain data 
 */
export async function initCTMSStudyData() {
  console.log("Initializing CTMS_STUDY data...");
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing CTMS_STUDY data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "CTMS_STUDY"),
        eq(domainSources.source, "CTMS Study")
      ));
    
    if (existingSource.length > 0) {
      console.log(`Source information for trial ${trial.id}, domain CTMS_STUDY, source CTMS Study already exists`);
    } else {
      // Create source
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "CTMS_STUDY",
        source: "CTMS Study",
        description: "Clinical trial management system study data",
        sourceType: "CTMS",
        system: "CTMS",
        integrationMethod: "API",
        format: "Custom",
        frequency: "Daily",
        contact: "Clinical Operations"
      };
      
      await db.insert(domainSources).values(sourceInfo);
      console.log(`Created source for trial ${trial.id}, domain CTMS_STUDY, source CTMS Study`);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "CTMS_STUDY"),
        eq(domainData.source, "CTMS Study")
      ));
    
    if (existingData.length > 0) {
      console.log(`CTMS_STUDY data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    // Use the CTMS_STUDY generator if available
    const generator = domainSpecificGenerators["CTMS_STUDY"];
    if (!generator) {
      console.error(`No generator found for domain CTMS_STUDY`);
      continue;
    }
    
    // Generate CTMS study record - usually one per trial
    const ctmsStudyRecord = generator();
    ctmsStudyRecord.STUDYID = getStudyIdentifier(trial.id);
    
    // Add more trial-specific info
    if (trial.id === 1) {
      ctmsStudyRecord.TITLE = "Diabetes Type 2 Long Term Outcomes Study";
      ctmsStudyRecord.PHASE = "III";
      ctmsStudyRecord.INDICATION = "Type 2 Diabetes";
    } else if (trial.id === 2) {
      ctmsStudyRecord.TITLE = "Hypertension Combination Therapy Study";
      ctmsStudyRecord.PHASE = "II";
      ctmsStudyRecord.INDICATION = "Hypertension";
    } else if (trial.id === 3) {
      ctmsStudyRecord.TITLE = "Oncology Biomarker Trial";
      ctmsStudyRecord.PHASE = "I/II";
      ctmsStudyRecord.INDICATION = "Solid Tumors";
    }
    
    const importDate = new Date();
    const domainDataRecord: InsertDomainData = {
      trialId: trial.id,
      domain: "CTMS_STUDY",
      source: "CTMS Study",
      recordId: `CTMS-STUDY-${trial.id}`,
      recordData: JSON.stringify(ctmsStudyRecord),
      importedAt: importDate
    };
    
    await db.insert(domainData).values(domainDataRecord);
    
    console.log(`Added CTMS_STUDY record for trial ${trial.id}`);
  }
  
  console.log("CTMS_STUDY data initialization complete");
}

/**
 * Initialize AE (Adverse Events) domain data
 */
export async function initAEData() {
  console.log("Initializing AE data...");
  
  // Get all trials
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing AE data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "AE"),
        eq(domainSources.source, "EDC Safety")
      ));
    
    if (existingSource.length > 0) {
      console.log(`Source information for trial ${trial.id}, domain AE, source EDC Safety already exists`);
    } else {
      // Create source
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "AE",
        source: "EDC Safety",
        description: "Adverse events from EDC safety module",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Daily",
        contact: "Safety"
      };
      
      await db.insert(domainSources).values(sourceInfo);
      console.log(`Created source for trial ${trial.id}, domain AE, source EDC Safety`);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "AE"),
        eq(domainData.source, "EDC Safety")
      ));
    
    if (existingData.length > 0) {
      console.log(`AE data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    // Generate and insert data
    const recordCount = 60; // Multiple AEs per trial
    
    // Use domain-specific generator for AE domain
    const generator = domainSpecificGenerators["AE"];
    if (!generator) {
      console.error(`No generator found for domain AE`);
      continue;
    }
    
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      // Generate a domain-specific record with appropriate study ID
      const record = generator();
      record.STUDYID = getStudyIdentifier(trial.id);
      record.USUBJID = `S-${trial.id}-${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`;
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "AE",
        source: "EDC Safety",
        recordId: `AE-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(record),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    // Insert in batches to avoid potential issues with too many parameters
    const batchSize = 50;
    for (let i = 0; i < recordsToInsert.length; i += batchSize) {
      const batch = recordsToInsert.slice(i, i + batchSize);
      await db.insert(domainData).values(batch);
    }
    
    // Count the inserted records
    const countResult = await db.select({ count: sql`count(*)` })
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "AE"),
        eq(domainData.source, "EDC Safety")
      ));
    
    console.log(`Added AE records for trial ${trial.id}. Count: ${countResult[0]?.count || 0}`);
  }
  
  console.log("AE data initialization complete");
}

/**
 * Initialize all domain data
 */
// Initialize EDC Lab Data
export async function initEDCLabData() {
  console.log("Initializing EDC Lab data...");
  try {
    const trialsList = await db.select().from(trials);
    console.log(`Found ${trialsList.length} trials, initializing EDC Lab data for each`);
    
    for (const trial of trialsList) {
      // Set up source information for Lab data
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "LB",
        source: "EDC",
        sourceType: "EDC",
        system: "Electronic Data Capture",
        integrationMethod: "API",
        format: "JSON",
        description: "Electronic Data Capture Lab Data"
      };
      
      // Check if source already exists
      const existingSources = await db
        .select()
        .from(domainSources)
        .where(and(
          eq(domainSources.trialId, trial.id),
          eq(domainSources.domain, "LB"),
          eq(domainSources.source, "EDC")
        ));
      
      if (existingSources.length === 0) {
        await db.insert(domainSources).values(sourceInfo);
        console.log(`Created source for trial ${trial.id}, domain LB, source EDC`);
      } else {
        console.log(`Source information for trial ${trial.id}, domain LB, source EDC already exists`);
      }
      
      // Check if data already exists
      const existingData = await db
        .select({ count: sql<number>`count(*)` })
        .from(domainData)
        .where(and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "LB"),
          eq(domainData.source, "EDC")
        ));
      
      console.log(`Checking for existing EDC Lab data for trial ${trial.id}: ${existingData[0].count} records found`);
      if (Number(existingData[0].count) === 0) {
        const records = generateLabData(trial.id, 50);
        for (const record of records) {
          const domainDataRecord: InsertDomainData = {
            trialId: trial.id,
            domain: "LB",
            source: "EDC",
            recordId: record.recordId,
            recordData: JSON.stringify(record.data),
            importedAt: new Date()
          };
          await db.insert(domainData).values(domainDataRecord);
        }
        console.log(`Created ${records.length} EDC Lab records for trial ${trial.id}`);
      } else {
        console.log(`EDC Lab data for trial ${trial.id} already exists (${existingData[0].count} records), skipping`);
      }
    }
    console.log("EDC Lab data initialization complete");
  } catch (error) {
    console.error("Error initializing EDC Lab data:", error);
  }
}

// Initialize EDC Vital Signs Data
export async function initVSData() {
  console.log("Initializing VS data...");
  try {
    const trialsList = await db.select().from(trials);
    console.log(`Found ${trialsList.length} trials, initializing VS data for each`);
    
    for (const trial of trialsList) {
      // Set up source information for Vital Signs data
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "VS",
        source: "EDC",
        sourceType: "EDC",
        system: "Electronic Data Capture",
        integrationMethod: "API",
        format: "JSON",
        description: "Vital Signs Data"
      };
      
      // Check if source already exists
      const existingSources = await db
        .select()
        .from(domainSources)
        .where(and(
          eq(domainSources.trialId, trial.id),
          eq(domainSources.domain, "VS"),
          eq(domainSources.source, "EDC")
        ));
      
      if (existingSources.length === 0) {
        await db.insert(domainSources).values(sourceInfo);
        console.log(`Created source for trial ${trial.id}, domain VS, source EDC`);
      } else {
        console.log(`Source information for trial ${trial.id}, domain VS, source EDC already exists`);
      }
      
      // Check if data already exists
      const existingData = await db
        .select({ count: sql<number>`count(*)` })
        .from(domainData)
        .where(and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "VS"),
          eq(domainData.source, "EDC")
        ));
      
      console.log(`Checking for existing VS data for trial ${trial.id}: ${existingData[0].count} records found`);
      if (Number(existingData[0].count) === 0) {
        const records = generateVitalSignsData(trial.id, 40);
        for (const record of records) {
          const domainDataRecord: InsertDomainData = {
            trialId: trial.id,
            domain: "VS",
            source: "EDC",
            recordId: record.recordId,
            recordData: JSON.stringify(record.data),
            importedAt: new Date()
          };
          await db.insert(domainData).values(domainDataRecord);
        }
        console.log(`Created ${records.length} VS records for trial ${trial.id}`);
      } else {
        console.log(`VS data for trial ${trial.id} already exists (${existingData[0].count} records), skipping`);
      }
    }
    console.log("VS data initialization complete");
  } catch (error) {
    console.error("Error initializing VS data:", error);
  }
}

// Initialize EDC Concomitant Medications Data
export async function initCMData() {
  console.log("Initializing CM data...");
  try {
    const trialsList = await db.select().from(trials);
    console.log(`Found ${trialsList.length} trials, initializing CM data for each`);
    
    for (const trial of trialsList) {
      // Set up source information for CM data
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "CM",
        source: "EDC",
        sourceType: "EDC",
        system: "Electronic Data Capture",
        integrationMethod: "API",
        format: "JSON",
        description: "Concomitant Medications Data"
      };
      
      // Check if source already exists
      const existingSources = await db
        .select()
        .from(domainSources)
        .where(and(
          eq(domainSources.trialId, trial.id),
          eq(domainSources.domain, "CM"),
          eq(domainSources.source, "EDC")
        ));
      
      if (existingSources.length === 0) {
        await db.insert(domainSources).values(sourceInfo);
        console.log(`Created source for trial ${trial.id}, domain CM, source EDC`);
      } else {
        console.log(`Source information for trial ${trial.id}, domain CM, source EDC already exists`);
      }
      
      // Check if data already exists
      const existingData = await db
        .select({ count: sql<number>`count(*)` })
        .from(domainData)
        .where(and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "CM"),
          eq(domainData.source, "EDC")
        ));
      
      console.log(`Checking for existing CM data for trial ${trial.id}: ${existingData[0].count} records found`);
      if (Number(existingData[0].count) === 0) {
        const records = generateConMedData(trial.id, 30);
        for (const record of records) {
          const domainDataRecord: InsertDomainData = {
            trialId: trial.id,
            domain: "CM",
            source: "EDC",
            recordId: record.recordId,
            recordData: JSON.stringify(record.data),
            importedAt: new Date()
          };
          await db.insert(domainData).values(domainDataRecord);
        }
        console.log(`Created ${records.length} CM records for trial ${trial.id}`);
      } else {
        console.log(`CM data for trial ${trial.id} already exists (${existingData[0].count} records), skipping`);
      }
    }
    console.log("CM data initialization complete");
  } catch (error) {
    console.error("Error initializing CM data:", error);
  }
}

// Initialize EDC Exposure Data
export async function initEXData() {
  console.log("Initializing EX data...");
  try {
    const trialsList = await db.select().from(trials);
    console.log(`Found ${trialsList.length} trials, initializing EX data for each`);
    
    for (const trial of trialsList) {
      // Set up source information for Exposure data
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "EX",
        source: "EDC",
        sourceType: "EDC",
        system: "Electronic Data Capture",
        integrationMethod: "API",
        format: "JSON",
        description: "Exposure Data"
      };
      
      // Check if source already exists
      const existingSources = await db
        .select()
        .from(domainSources)
        .where(and(
          eq(domainSources.trialId, trial.id),
          eq(domainSources.domain, "EX"),
          eq(domainSources.source, "EDC")
        ));
      
      if (existingSources.length === 0) {
        await db.insert(domainSources).values(sourceInfo);
        console.log(`Created source for trial ${trial.id}, domain EX, source EDC`);
      } else {
        console.log(`Source information for trial ${trial.id}, domain EX, source EDC already exists`);
      }
      
      // Check if data already exists
      const existingData = await db
        .select({ count: sql<number>`count(*)` })
        .from(domainData)
        .where(and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "EX"),
          eq(domainData.source, "EDC")
        ));
      
      console.log(`Checking for existing EX data for trial ${trial.id}: ${existingData[0].count} records found`);
      if (Number(existingData[0].count) === 0) {
        const records = generateExposureData(trial.id, 35);
        for (const record of records) {
          const domainDataRecord: InsertDomainData = {
            trialId: trial.id,
            domain: "EX",
            source: "EDC",
            recordId: record.recordId,
            recordData: JSON.stringify(record.data),
            importedAt: new Date()
          };
          await db.insert(domainData).values(domainDataRecord);
        }
        console.log(`Created ${records.length} EX records for trial ${trial.id}`);
      } else {
        console.log(`EX data for trial ${trial.id} already exists (${existingData[0].count} records), skipping`);
      }
    }
    console.log("EX data initialization complete");
  } catch (error) {
    console.error("Error initializing EX data:", error);
  }
}

// Generate Vital Signs data
function generateVitalSignsData(trialId: number, count: number) {
  const records = [];
  const visitDays = [1, 15, 29, 43, 57, 71, 85, 99];
  const visitNames = ['Day 1', 'Day 15', 'Day 29', 'Day 43', 'Day 57', 'Day 71', 'Day 85', 'Day 99'];
  
  // Get subjects from DM domain
  for (let i = 1; i <= Math.min(15, count); i++) {
    const subjectId = `S-${trialId}-${i.toString().padStart(3, '0')}`;
    
    // Generate multiple measurements per subject
    for (let visitIdx = 0; visitIdx < Math.min(8, visitDays.length); visitIdx++) {
      // Vital types: BP, HR, TEMP, RESP, WEIGHT, HEIGHT
      const vitalTypes = [
        { code: 'SYSBP', name: 'Systolic Blood Pressure', unit: 'mmHg', min: 100, max: 160 },
        { code: 'DIABP', name: 'Diastolic Blood Pressure', unit: 'mmHg', min: 60, max: 100 },
        { code: 'HR', name: 'Heart Rate', unit: 'beats/min', min: 50, max: 100 },
        { code: 'TEMP', name: 'Temperature', unit: 'C', min: 36, max: 38 },
        { code: 'RESP', name: 'Respiratory Rate', unit: 'breaths/min', min: 12, max: 20 },
        { code: 'WEIGHT', name: 'Weight', unit: 'kg', min: 50, max: 100 },
      ];
      
      vitalTypes.forEach((vital, vitalIdx) => {
        const seqNum = visitIdx * vitalTypes.length + vitalIdx + 1;
        const value = (Math.random() * (vital.max - vital.min) + vital.min).toFixed(1);
        
        records.push({
          recordId: `VS-${trialId}-${i}-${seqNum}`,
          data: {
            STUDYID: `PRO00${trialId}`,
            DOMAIN: 'VS',
            USUBJID: subjectId,
            VSSEQ: seqNum,
            VSTESTCD: vital.code,
            VSTEST: vital.name,
            VSORRES: value,
            VSORRESU: vital.unit,
            VSSTAT: '',
            VSREASND: '',
            VISITNUM: visitIdx + 1,
            VISIT: visitNames[visitIdx],
            VSDTC: new Date(2024, 0, 1 + visitDays[visitIdx]).toISOString().split('T')[0],
            VSDY: visitDays[visitIdx]
          }
        });
      });
    }
  }
  
  return records;
}

// Generate Concomitant Medications data
function generateConMedData(trialId: number, count: number) {
  const records = [];
  const drugs = [
    'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Lisinopril', 'Metformin', 
    'Atorvastatin', 'Levothyroxine', 'Amlodipine', 'Metoprolol', 'Albuterol'
  ];
  const routes = ['ORAL', 'INTRAVENOUS', 'TOPICAL', 'SUBCUTANEOUS', 'INTRAMUSCULAR'];
  const frequencies = ['QD', 'BID', 'TID', 'QID', 'PRN', 'Q4H', 'Q8H', 'QW', 'BIW'];
  const doses = ['10mg', '25mg', '50mg', '100mg', '200mg', '500mg', '1g', '5mL', '10mL'];
  
  let recordCount = 0;
  
  // Get subjects from DM domain
  for (let i = 1; i <= Math.min(10, count); i++) {
    const subjectId = `S-${trialId}-${i.toString().padStart(3, '0')}`;
    
    // Generate 1-5 medications per subject
    const medCount = Math.floor(Math.random() * 5) + 1;
    
    for (let j = 1; j <= medCount && recordCount < count; j++) {
      const drugIndex = Math.floor(Math.random() * drugs.length);
      const routeIndex = Math.floor(Math.random() * routes.length);
      const frequencyIndex = Math.floor(Math.random() * frequencies.length);
      const doseIndex = Math.floor(Math.random() * doses.length);
      
      const startDate = new Date(2024, 0, Math.floor(Math.random() * 30) + 1);
      const endDate = Math.random() > 0.3 ? new Date(startDate.getTime() + (Math.random() * 60 * 24 * 60 * 60 * 1000)) : undefined;
      
      records.push({
        recordId: `CM-${trialId}-${i}-${j}`,
        data: {
          STUDYID: `PRO00${trialId}`,
          DOMAIN: 'CM',
          USUBJID: subjectId,
          CMSEQ: j,
          CMTRT: drugs[drugIndex],
          CMCAT: 'CONCOMITANT MEDICATION',
          CMDOSE: doses[doseIndex],
          CMDOSU: doses[doseIndex].replace(/[0-9.]/g, ''),
          CMDOSFRQ: frequencies[frequencyIndex],
          CMROUTE: routes[routeIndex],
          CMSTDTC: startDate.toISOString().split('T')[0],
          CMENDTC: endDate ? endDate.toISOString().split('T')[0] : '',
          CMINDC: ['Headache', 'Pain', 'Inflammation', 'Hypertension', 'Diabetes'][Math.floor(Math.random() * 5)],
          CMSTAT: Math.random() > 0.9 ? 'NOT DONE' : 'COMPLETED'
        }
      });
      
      recordCount++;
    }
  }
  
  return records;
}

// Generate Exposure data
function generateExposureData(trialId: number, count: number) {
  const records = [];
  const dose = [80, 120, 160, 200];
  const doseUnits = ['mg', 'mg/kg', 'mg/m2'];
  const formulations = ['TABLET', 'CAPSULE', 'SOLUTION', 'INJECTION'];
  const routes = ['ORAL', 'INTRAVENOUS', 'SUBCUTANEOUS'];
  const frequencies = ['QD', 'BID', 'TID', 'QOD', 'QW'];
  
  let recordCount = 0;
  
  // Get subjects from DM domain
  for (let i = 1; i <= Math.min(15, count); i++) {
    const subjectId = `S-${trialId}-${i.toString().padStart(3, '0')}`;
    
    // Generate 1-3 exposure records per subject
    const expCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 1; j <= expCount && recordCount < count; j++) {
      const doseAmount = dose[Math.floor(Math.random() * dose.length)];
      const doseUnit = doseUnits[Math.floor(Math.random() * doseUnits.length)];
      const formulation = formulations[Math.floor(Math.random() * formulations.length)];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
      
      const startDate = new Date(2024, 0, Math.floor(Math.random() * 30) + 1);
      const endDate = new Date(startDate.getTime() + (Math.random() * 90 * 24 * 60 * 60 * 1000));
      
      records.push({
        recordId: `EX-${trialId}-${i}-${j}`,
        data: {
          STUDYID: `PRO00${trialId}`,
          DOMAIN: 'EX',
          USUBJID: subjectId,
          EXSEQ: j,
          EXTRT: `Study Drug ${String.fromCharCode(64 + j)}`,
          EXCAT: 'STUDY TREATMENT',
          EXDOSE: doseAmount,
          EXDOSU: doseUnit,
          EXDOSFRM: formulation,
          EXDOSFRQ: frequency,
          EXROUTE: route,
          EXSTDTC: startDate.toISOString().split('T')[0],
          EXENDTC: endDate.toISOString().split('T')[0],
          EXSTDY: 1,
          EXENDY: Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)),
          VISITNUM: 1,
          VISIT: 'Baseline',
          EXTPT: 'BEFORE BREAKFAST'
        }
      });
      
      recordCount++;
    }
  }
  
  return records;
}

// Helper function to generate lab data specifically for EDC source
function generateLabData(trialId: number, count: number) {
  const labTests = [
    { name: 'Hemoglobin', code: 'HGB', unit: 'g/dL', low: 12, high: 16 },
    { name: 'Hematocrit', code: 'HCT', unit: '%', low: 36, high: 48 },
    { name: 'White Blood Cell Count', code: 'WBC', unit: '10^9/L', low: 4, high: 11 },
    { name: 'Platelet Count', code: 'PLT', unit: '10^9/L', low: 150, high: 400 },
    { name: 'Glucose', code: 'GLUC', unit: 'mg/dL', low: 70, high: 110 },
    { name: 'Creatinine', code: 'CREAT', unit: 'mg/dL', low: 0.6, high: 1.3 },
    { name: 'Alanine Aminotransferase', code: 'ALT', unit: 'U/L', low: 7, high: 56 },
    { name: 'Aspartate Aminotransferase', code: 'AST', unit: 'U/L', low: 10, high: 40 },
    { name: 'Total Bilirubin', code: 'BILI', unit: 'mg/dL', low: 0.1, high: 1.2 },
    { name: 'Blood Urea Nitrogen', code: 'BUN', unit: 'mg/dL', low: 7, high: 20 }
  ];
  
  const records = [];
  const visitDays = [1, 15, 29, 43, 57, 71, 85];
  const visitNames = ['Day 1', 'Day 15', 'Day 29', 'Day 43', 'Day 57', 'Day 71', 'Day 85'];
  
  let recordCounter = 0;
  
  // For each subject (up to 10 or however many we need to get to count)
  for (let subjectIdx = 1; subjectIdx <= 10 && recordCounter < count; subjectIdx++) {
    const subjectId = `S-${trialId}-${String(subjectIdx).padStart(3, '0')}`;
    
    // For each visit
    for (let visitIdx = 0; visitIdx < visitDays.length && recordCounter < count; visitIdx++) {
      // For each lab test
      for (let testIdx = 0; testIdx < labTests.length && recordCounter < count; testIdx++) {
        const test = labTests[testIdx];
        const seqNum = visitIdx * labTests.length + testIdx + 1;
        
        // Generate a value that's usually in range, but sometimes out of range
        let value;
        const rand = Math.random();
        if (rand < 0.1) {
          // Below lower limit
          value = (test.low - Math.random() * (test.low * 0.3)).toFixed(1);
        } else if (rand > 0.9) {
          // Above upper limit
          value = (test.high + Math.random() * (test.high * 0.3)).toFixed(1);
        } else {
          // Within normal range
          value = (test.low + Math.random() * (test.high - test.low)).toFixed(1);
        }
        
        let flagValue = '';
        if (parseFloat(value) < test.low) {
          flagValue = 'L';
        } else if (parseFloat(value) > test.high) {
          flagValue = 'H';
        }
        
        records.push({
          recordId: `LB-EDC-${trialId}-${subjectIdx}-${seqNum}`,
          data: {
            STUDYID: `PRO00${trialId}`,
            DOMAIN: 'LB',
            USUBJID: subjectId,
            LBSEQ: seqNum,
            LBTESTCD: test.code,
            LBTEST: test.name,
            LBCAT: 'HEMATOLOGY', // Or CHEMISTRY based on test
            LBORRES: value,
            LBORRESU: test.unit,
            LBORNRLO: test.low.toString(),
            LBORNRHI: test.high.toString(),
            LBNRIND: flagValue,
            LBSTAT: '',
            LBREASND: '',
            LBDTC: new Date(2024, 0, 1 + visitDays[visitIdx]).toISOString().split('T')[0],
            LBDY: visitDays[visitIdx],
            VISITNUM: visitIdx + 1,
            VISIT: visitNames[visitIdx]
          }
        });
        
        recordCounter++;
      }
    }
  }
  
  return records;
}

/**
 * Initialize DS (Disposition) domain data
 */
export async function initDSData() {
  console.log("Initializing DS data...");
  
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing DS data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "DS"),
        eq(domainSources.source, "EDC")
      ));
    
    if (existingSource.length === 0) {
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "DS",
        source: "EDC",
        description: "Subject disposition events and status",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Daily",
        contact: "Data Management"
      };
      await db.insert(domainSources).values(sourceInfo);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "DS"),
        eq(domainData.source, "EDC")
      ));
    
    if (existingData.length > 0) {
      console.log(`DS data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    const recordCount = 15;
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      const dsRecord = {
        STUDYID: getStudyIdentifier(trial.id),
        DOMAIN: "DS",
        USUBJID: `S-${trial.id}-${String(i + 1).padStart(3, '0')}`,
        DSSEQ: 1,
        DSTERM: ["COMPLETED", "WITHDREW CONSENT", "LOST TO FOLLOW-UP", "ADVERSE EVENT", "COMPLETED"][Math.floor(Math.random() * 5)],
        DSDECOD: ["COMPLETED", "WITHDREW CONSENT", "LOST TO FOLLOW-UP", "ADVERSE EVENT", "COMPLETED"][Math.floor(Math.random() * 5)],
        DSCAT: "DISPOSITION EVENT",
        DSSTDTC: new Date(2024, 0, 30 + Math.floor(Math.random() * 90)).toISOString().split('T')[0],
        DSDY: 30 + Math.floor(Math.random() * 90)
      };
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "DS",
        source: "EDC",
        recordId: `DS-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(dsRecord),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    await db.insert(domainData).values(recordsToInsert);
  }
  
  console.log("DS data initialization complete");
}

/**
 * Initialize MH (Medical History) domain data
 */
export async function initMHData() {
  console.log("Initializing MH data...");
  
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing MH data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "MH"),
        eq(domainSources.source, "EDC")
      ));
    
    if (existingSource.length === 0) {
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "MH",
        source: "EDC",
        description: "Medical history and significant medical events",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Daily",
        contact: "Data Management"
      };
      await db.insert(domainSources).values(sourceInfo);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "MH"),
        eq(domainData.source, "EDC")
      ));
    
    if (existingData.length > 0) {
      console.log(`MH data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    const recordCount = 20;
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      const mhRecord = {
        STUDYID: getStudyIdentifier(trial.id),
        DOMAIN: "MH",
        USUBJID: `S-${trial.id}-${String(i + 1).padStart(3, '0')}`,
        MHSEQ: 1,
        MHTERM: ["HYPERTENSION", "DIABETES MELLITUS", "HYPERLIPIDEMIA", "ASTHMA", "DEPRESSION"][Math.floor(Math.random() * 5)],
        MHDECOD: ["HYPERTENSION", "DIABETES MELLITUS", "HYPERLIPIDEMIA", "ASTHMA", "DEPRESSION"][Math.floor(Math.random() * 5)],
        MHCAT: "MEDICAL HISTORY",
        MHSTDTC: new Date(2020, 0, 1 + Math.floor(Math.random() * 1095)).toISOString().split('T')[0],
        MHENRF: Math.random() > 0.7 ? "ONGOING" : "RESOLVED"
      };
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "MH",
        source: "EDC",
        recordId: `MH-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(mhRecord),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    await db.insert(domainData).values(recordsToInsert);
  }
  
  console.log("MH data initialization complete");
}

/**
 * Initialize IE (Inclusion/Exclusion) domain data
 */
export async function initIEData() {
  console.log("Initializing IE data...");
  
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing IE data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "IE"),
        eq(domainSources.source, "EDC")
      ));
    
    if (existingSource.length === 0) {
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "IE",
        source: "EDC",
        description: "Inclusion and exclusion criteria evaluations",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Daily",
        contact: "Data Management"
      };
      await db.insert(domainSources).values(sourceInfo);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "IE"),
        eq(domainData.source, "EDC")
      ));
    
    if (existingData.length > 0) {
      console.log(`IE data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    const recordCount = 30;
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      const ieRecord = {
        STUDYID: getStudyIdentifier(trial.id),
        DOMAIN: "IE",
        USUBJID: `S-${trial.id}-${String(i + 1).padStart(3, '0')}`,
        IESEQ: 1,
        IETEST: "INCLUSION/EXCLUSION CRITERIA",
        IETESTCD: "IEYN",
        IECAT: "SCREENING",
        IEORRES: "Y",
        IESTRESC: "Y",
        IEDTC: new Date(2023, 11, 1 + Math.floor(Math.random() * 30)).toISOString().split('T')[0]
      };
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "IE",
        source: "EDC",
        recordId: `IE-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(ieRecord),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    await db.insert(domainData).values(recordsToInsert);
  }
  
  console.log("IE data initialization complete");
}

/**
 * Initialize SAE (Serious Adverse Events) domain data
 */
export async function initSAEData() {
  console.log("Initializing SAE data...");
  
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing SAE data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "SAE"),
        eq(domainSources.source, "EDC Safety")
      ));
    
    if (existingSource.length === 0) {
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "SAE",
        source: "EDC Safety",
        description: "Serious adverse events requiring expedited reporting",
        sourceType: "EDC",
        system: "EDC Safety Module",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Real-time",
        contact: "Safety Manager"
      };
      await db.insert(domainSources).values(sourceInfo);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "SAE"),
        eq(domainData.source, "EDC Safety")
      ));
    
    if (existingData.length > 0) {
      console.log(`SAE data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    const recordCount = 8; // SAEs are less frequent
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      const saeRecord = {
        STUDYID: getStudyIdentifier(trial.id),
        DOMAIN: "SAE",
        USUBJID: `S-${trial.id}-${String(i + 1).padStart(3, '0')}`,
        SAESEQ: 1,
        SAETERM: ["MYOCARDIAL INFARCTION", "STROKE", "HOSPITALIZATION", "DEATH", "LIFE THREATENING EVENT"][Math.floor(Math.random() * 5)],
        SAEDECOD: ["MYOCARDIAL INFARCTION", "STROKE", "HOSPITALIZATION", "DEATH", "LIFE THREATENING EVENT"][Math.floor(Math.random() * 5)],
        SAECAT: "SERIOUS ADVERSE EVENT",
        SAESEV: ["MILD", "MODERATE", "SEVERE"][Math.floor(Math.random() * 3)],
        SAESER: "Y",
        SAEREL: ["RELATED", "NOT RELATED", "POSSIBLY RELATED"][Math.floor(Math.random() * 3)],
        SAESTDTC: new Date(2024, 0, 1 + Math.floor(Math.random() * 120)).toISOString().split('T')[0],
        SAEENDTC: Math.random() > 0.3 ? new Date(2024, 0, 10 + Math.floor(Math.random() * 120)).toISOString().split('T')[0] : "",
        SAEOUT: ["RECOVERED/RESOLVED", "ONGOING", "FATAL", "RECOVERED WITH SEQUELAE"][Math.floor(Math.random() * 4)]
      };
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "SAE",
        source: "EDC Safety",
        recordId: `SAE-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(saeRecord),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    await db.insert(domainData).values(recordsToInsert);
  }
  
  console.log("SAE data initialization complete");
}

/**
 * Initialize PD (Protocol Deviation) domain data
 */
export async function initPDData() {
  console.log("Initializing PD (Protocol Deviation) data...");
  
  const allTrials = await db.select().from(trials);
  console.log(`Found ${allTrials.length} trials, initializing PD data for each`);
  
  for (const trial of allTrials) {
    // Check if source exists
    const existingSource = await db.select()
      .from(domainSources)
      .where(and(
        eq(domainSources.trialId, trial.id),
        eq(domainSources.domain, "PD"),
        eq(domainSources.source, "EDC")
      ));
    
    if (existingSource.length === 0) {
      const sourceInfo: InsertDomainSource = {
        trialId: trial.id,
        domain: "PD",
        source: "EDC",
        description: "Protocol deviations and violations",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Real-time",
        contact: "Clinical Monitor"
      };
      await db.insert(domainSources).values(sourceInfo);
    }
    
    // Check for existing data
    const existingData = await db.select()
      .from(domainData)
      .where(and(
        eq(domainData.trialId, trial.id),
        eq(domainData.domain, "PD"),
        eq(domainData.source, "EDC")
      ));
    
    if (existingData.length > 0) {
      console.log(`PD data for trial ${trial.id} already exists (${existingData.length} records), skipping`);
      continue;
    }
    
    const recordCount = 12; // Protocol deviations should be less frequent
    const importDate = new Date();
    const recordsToInsert: InsertDomainData[] = [];
    
    for (let i = 0; i < recordCount; i++) {
      const pdRecord = {
        STUDYID: getStudyIdentifier(trial.id),
        DOMAIN: "PD",
        USUBJID: `S-${trial.id}-${String(i + 1).padStart(3, '0')}`,
        PDSEQ: 1,
        PDCAT: "PROTOCOL DEVIATION",
        PDTERM: ["VISIT WINDOW DEVIATION", "DOSING ERROR", "ELIGIBILITY DEVIATION", "PROCEDURE VIOLATION", "CONSENT ISSUE"][Math.floor(Math.random() * 5)],
        PDDECOD: ["VISIT WINDOW DEVIATION", "DOSING ERROR", "ELIGIBILITY DEVIATION", "PROCEDURE VIOLATION", "CONSENT ISSUE"][Math.floor(Math.random() * 5)],
        PDSEV: ["MINOR", "MAJOR", "CRITICAL"][Math.floor(Math.random() * 3)],
        PDSTAT: "REPORTED",
        PDSTDTC: new Date(2024, 0, 1 + Math.floor(Math.random() * 120)).toISOString().split('T')[0],
        PDENDTC: Math.random() > 0.4 ? new Date(2024, 0, 5 + Math.floor(Math.random() * 120)).toISOString().split('T')[0] : "",
        PDSTDY: Math.floor(Math.random() * 120) + 1,
        PDENDY: Math.random() > 0.4 ? Math.floor(Math.random() * 120) + 5 : null,
        PDRESP: ["Y", "N"][Math.floor(Math.random() * 2)],
        PDREASN: "Protocol requirement not met"
      };
      
      const domainDataRecord: InsertDomainData = {
        trialId: trial.id,
        domain: "PD",
        source: "EDC",
        recordId: `PD-${trial.id}-${i + 1}`,
        recordData: JSON.stringify(pdRecord),
        importedAt: importDate
      };
      
      recordsToInsert.push(domainDataRecord);
    }
    
    await db.insert(domainData).values(recordsToInsert);
  }
  
  console.log("PD (Protocol Deviation) data initialization complete");
}

export async function initAllDomainData() {
  try {
    // Initialize domain data in parallel for faster loading
    await Promise.all([
      initDMData(),
      initLBData(),
      initSVData(),
      initTUData(),
      initCTMSStudyData(),
      initAEData(),
      initEDCLabData(),
      initVSData(),
      initCMData(),
      initEXData(),
      // Add missing SDTM domains
      initDSData(),
      initMHData(),
      initIEData(),
      initSAEData(),
      initPDData()
    ]);
    console.log("All domain data initialization complete");
  } catch (error) {
    console.error("Error initializing domain data:", error);
  }
}