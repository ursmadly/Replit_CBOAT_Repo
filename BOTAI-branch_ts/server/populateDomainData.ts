import { db } from "./db";
import { domainData, domainSources, trials, InsertDomainData, InsertDomainSource } from "@shared/schema";
import { domainSpecificGenerators, getStudyIdentifier } from "../client/src/components/data-management/domains/DomainDataUtils";
import { eq, and, sql } from "drizzle-orm";

/**
 * Initialize domain data for all domains and trials
 */
async function initializeDomainData() {
  try {
    // Get all trials
    const allTrials = await db.select().from(trials);
    console.log(`Found ${allTrials.length} trials`);
    
    // Initialize data for each trial and domain
    for (const trial of allTrials) {
      await initializeTrialDomainData(trial.id, 'DM', 'EDC', 25);
      await initializeTrialDomainData(trial.id, 'LB', 'Central Laboratory', 100);
      await initializeTrialDomainData(trial.id, 'SV', 'EDC', 75);
      await initializeTrialDomainData(trial.id, 'TU', 'Imaging RECIST', 40);
      await initializeTrialDomainData(trial.id, 'AE', 'EDC Safety', 60);
      await initializeCTMSStudyData(trial.id);
    }
    
    console.log("Domain data initialization complete");
  } catch (error) {
    console.error("Error initializing domain data:", error);
  }
}

/**
 * Initialize domain data for a specific trial and domain
 */
async function initializeTrialDomainData(trialId: number, domain: string, source: string, recordCount: number) {
  console.log(`Initializing ${domain} data for trial ${trialId} from source ${source}...`);
  
  // Check if source exists
  const existingSource = await db.select()
    .from(domainSources)
    .where(and(
      eq(domainSources.trialId, trialId),
      eq(domainSources.domain, domain),
      eq(domainSources.source, source)
    ));
  
  if (existingSource.length === 0) {
    // Create source info based on domain type
    const sourceInfo: InsertDomainSource = createSourceInfo(trialId, domain, source);
    await db.insert(domainSources).values(sourceInfo);
    console.log(`Created source for trial ${trialId}, domain ${domain}, source ${source}`);
  } else {
    console.log(`Source information for trial ${trialId}, domain ${domain}, source ${source} already exists`);
  }
  
  // Check for existing data
  const existingData = await db.select()
    .from(domainData)
    .where(and(
      eq(domainData.trialId, trialId),
      eq(domainData.domain, domain),
      eq(domainData.source, source)
    ));
  
  if (existingData.length > 0) {
    console.log(`${domain} data for trial ${trialId} already exists (${existingData.length} records), skipping`);
    return;
  }
  
  // Use domain-specific generator
  const generator = domainSpecificGenerators[domain];
  if (!generator) {
    console.error(`No generator found for domain ${domain}`);
    return;
  }
  
  // Generate records
  const importDate = new Date();
  const recordsToInsert: InsertDomainData[] = [];
  
  for (let i = 0; i < recordCount; i++) {
    const record = generator();
    record.STUDYID = getStudyIdentifier(trialId);
    
    // Assign subject IDs differently based on domain to create realistic distribution
    if (domain === 'DM') {
      // One record per subject
      record.USUBJID = `S-${trialId}-${String(i + 1).padStart(3, '0')}`;
    } else if (domain === 'LB') {
      // Multiple lab tests per subject
      record.USUBJID = `S-${trialId}-${String(Math.floor(i/4) + 1).padStart(3, '0')}`;
    } else if (domain === 'SV') {
      // Multiple visits per subject
      record.USUBJID = `S-${trialId}-${String(Math.floor(i/3) + 1).padStart(3, '0')}`;
    } else if (domain === 'TU') {
      // Multiple tumor assessments per subject
      record.USUBJID = `S-${trialId}-${String(Math.floor(i/2) + 1).padStart(3, '0')}`;
    } else if (domain === 'AE') {
      // Random distribution of AEs across subjects
      record.USUBJID = `S-${trialId}-${String(Math.floor(Math.random() * 25) + 1).padStart(3, '0')}`;
    }
    
    const domainDataRecord: InsertDomainData = {
      trialId: trialId,
      domain: domain,
      source: source,
      recordId: `${domain}-${trialId}-${i + 1}`,
      recordData: JSON.stringify(record),
      importedAt: importDate
    };
    
    recordsToInsert.push(domainDataRecord);
  }
  
  // Insert in batches
  const batchSize = 50;
  for (let i = 0; i < recordsToInsert.length; i += batchSize) {
    const batch = recordsToInsert.slice(i, i + batchSize);
    await db.insert(domainData).values(batch);
  }
  
  console.log(`Added ${recordCount} ${domain} records for trial ${trialId}`);
}

/**
 * Initialize CTMS study data for a specific trial
 */
async function initializeCTMSStudyData(trialId: number) {
  const domain = 'CTMS_STUDY';
  const source = 'CTMS Study';
  
  console.log(`Initializing ${domain} data for trial ${trialId}...`);
  
  // Check if source exists
  const existingSource = await db.select()
    .from(domainSources)
    .where(and(
      eq(domainSources.trialId, trialId),
      eq(domainSources.domain, domain),
      eq(domainSources.source, source)
    ));
  
  if (existingSource.length === 0) {
    // Create source info
    const sourceInfo: InsertDomainSource = {
      trialId: trialId,
      domain: domain,
      source: source,
      description: "Clinical trial management system study data",
      sourceType: "CTMS",
      system: "CTMS",
      integrationMethod: "API",
      format: "Custom",
      frequency: "Daily",
      contact: "Clinical Operations"
    };
    
    await db.insert(domainSources).values(sourceInfo);
    console.log(`Created source for trial ${trialId}, domain ${domain}, source ${source}`);
  } else {
    console.log(`Source information for trial ${trialId}, domain ${domain}, source ${source} already exists`);
  }
  
  // Check for existing data
  const existingData = await db.select()
    .from(domainData)
    .where(and(
      eq(domainData.trialId, trialId),
      eq(domainData.domain, domain),
      eq(domainData.source, source)
    ));
  
  if (existingData.length > 0) {
    console.log(`${domain} data for trial ${trialId} already exists (${existingData.length} records), skipping`);
    return;
  }
  
  // Use the CTMS_STUDY generator
  const generator = domainSpecificGenerators[domain];
  if (!generator) {
    console.error(`No generator found for domain ${domain}`);
    return;
  }
  
  // Generate CTMS study record - one per trial
  const ctmsStudyRecord = generator();
  ctmsStudyRecord.STUDYID = getStudyIdentifier(trialId);
  
  // Add trial-specific info
  if (trialId === 1) {
    ctmsStudyRecord.TITLE = "Diabetes Type 2 Long Term Outcomes Study";
    ctmsStudyRecord.PHASE = "III";
    ctmsStudyRecord.INDICATION = "Type 2 Diabetes";
  } else if (trialId === 2) {
    ctmsStudyRecord.TITLE = "Hypertension Combination Therapy Study";
    ctmsStudyRecord.PHASE = "II";
    ctmsStudyRecord.INDICATION = "Hypertension";
  } else if (trialId === 3) {
    ctmsStudyRecord.TITLE = "Oncology Biomarker Trial";
    ctmsStudyRecord.PHASE = "I/II";
    ctmsStudyRecord.INDICATION = "Solid Tumors";
  }
  
  const importDate = new Date();
  const domainDataRecord: InsertDomainData = {
    trialId: trialId,
    domain: domain,
    source: source,
    recordId: `${domain}-${trialId}`,
    recordData: JSON.stringify(ctmsStudyRecord),
    importedAt: importDate
  };
  
  await db.insert(domainData).values(domainDataRecord);
  console.log(`Added ${domain} record for trial ${trialId}`);
}

/**
 * Create source info based on domain type
 */
function createSourceInfo(trialId: number, domain: string, source: string): InsertDomainSource {
  let sourceInfo: InsertDomainSource = {
    trialId: trialId,
    domain: domain,
    source: source,
    description: "",
    sourceType: "",
    system: "",
    integrationMethod: "",
    format: "",
    frequency: "",
    contact: ""
  };
  
  // Set domain-specific source info
  switch (domain) {
    case "DM":
      sourceInfo.description = "Patient demographics data from EDC system";
      sourceInfo.sourceType = "EDC";
      sourceInfo.system = "EDC";
      sourceInfo.integrationMethod = "Manual";
      sourceInfo.format = "SDTM";
      sourceInfo.frequency = "Daily";
      sourceInfo.contact = "Data Management";
      break;
      
    case "LB":
      sourceInfo.description = "Laboratory test results from central lab";
      sourceInfo.sourceType = "Lab";
      sourceInfo.system = "Lab System";
      sourceInfo.integrationMethod = "API";
      sourceInfo.format = "SDTM";
      sourceInfo.frequency = "Daily";
      sourceInfo.contact = "Central Laboratory";
      break;
      
    case "SV":
      sourceInfo.description = "Subject visit data from EDC system";
      sourceInfo.sourceType = "EDC";
      sourceInfo.system = "EDC";
      sourceInfo.integrationMethod = "Manual";
      sourceInfo.format = "SDTM";
      sourceInfo.frequency = "Daily";
      sourceInfo.contact = "Clinical Operations";
      break;
      
    case "TU":
      sourceInfo.description = "Tumor assessment data from imaging system";
      sourceInfo.sourceType = "Imaging";
      sourceInfo.system = "Imaging System";
      sourceInfo.integrationMethod = "API";
      sourceInfo.format = "SDTM";
      sourceInfo.frequency = "Weekly";
      sourceInfo.contact = "Imaging Core Lab";
      break;
      
    case "AE":
      sourceInfo.description = "Adverse events from EDC safety module";
      sourceInfo.sourceType = "EDC";
      sourceInfo.system = "EDC";
      sourceInfo.integrationMethod = "Manual";
      sourceInfo.format = "SDTM";
      sourceInfo.frequency = "Daily";
      sourceInfo.contact = "Safety";
      break;
      
    default:
      sourceInfo.description = `${domain} data from ${source}`;
      sourceInfo.sourceType = source;
      sourceInfo.system = source;
      sourceInfo.integrationMethod = "Manual";
      sourceInfo.format = "SDTM";
      sourceInfo.frequency = "Daily";
      sourceInfo.contact = "Data Management";
  }
  
  return sourceInfo;
}

// Run the initialization
initializeDomainData().then(() => {
  console.log("Domain data population script complete");
  process.exit(0);
}).catch(error => {
  console.error("Error running domain data population script:", error);
  process.exit(1);
});