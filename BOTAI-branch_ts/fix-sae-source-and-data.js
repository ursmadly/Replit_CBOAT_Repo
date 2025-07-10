/**
 * Fix SAE data to use EDC source (not EDC Safety) and create serious adverse events
 * Similar to AE records but with more serious incidents
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { domainData, domainSources, trials } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';
import ws from "ws";

neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema: { domainData, domainSources, trials } });

function getStudyIdentifier(trialId) {
  const studyMap = {
    1: "PRO001",
    2: "PRO002", 
    3: "PRO003"
  };
  return studyMap[trialId] || `PRO${String(trialId).padStart(3, '0')}`;
}

async function fixSAEData() {
  console.log('Fixing SAE data source and creating serious adverse events...');
  console.log('================================================================\n');
  
  try {
    const allTrials = await db.select().from(trials);
    console.log(`Found ${allTrials.length} trials to process\n`);
    
    for (const trial of allTrials) {
      console.log(`Processing trial ${trial.id}...`);
      
      // 1. Delete existing SAE data with wrong source
      console.log('  - Deleting existing SAE data with wrong source...');
      await db.delete(domainData)
        .where(and(
          eq(domainData.trialId, trial.id),
          eq(domainData.domain, "SAE")
        ));
      
      // 2. Delete existing SAE sources
      await db.delete(domainSources)
        .where(and(
          eq(domainSources.trialId, trial.id),
          eq(domainSources.domain, "SAE")
        ));
      
      // 3. Create SAE source with EDC source to match frontend expectation
      console.log('  - Creating SAE source with EDC...');
      await db.insert(domainSources).values({
        trialId: trial.id,
        domain: "SAE",
        source: "EDC",
        description: "Serious adverse events from EDC system",
        sourceType: "EDC",
        system: "EDC",
        integrationMethod: "Manual",
        format: "SDTM",
        frequency: "Real-time",
        contact: "Safety Manager"
      });
      
      // 4. Create SAE data similar to AE but with serious incidents
      console.log('  - Creating SAE data with serious adverse events...');
      const saeRecords = [];
      
      // Serious adverse event terms (more serious than regular AE)
      const seriousTerms = [
        "MYOCARDIAL INFARCTION",
        "STROKE",
        "HOSPITALIZATION",
        "LIFE-THREATENING HYPOTENSION", 
        "PULMONARY EMBOLISM",
        "SEVERE ALLERGIC REACTION",
        "CARDIAC ARREST",
        "RESPIRATORY FAILURE",
        "ACUTE RENAL FAILURE",
        "SEIZURE",
        "GASTROINTESTINAL BLEEDING",
        "PNEUMONIA REQUIRING HOSPITALIZATION"
      ];
      
      const seriousDecoded = [
        "Myocardial infarction",
        "Cerebrovascular accident", 
        "Hospitalization",
        "Life-threatening hypotension",
        "Pulmonary embolism",
        "Anaphylaxis",
        "Cardiac arrest",
        "Respiratory failure",
        "Acute kidney injury",
        "Grand mal seizure",
        "Upper gastrointestinal hemorrhage",
        "Hospital-acquired pneumonia"
      ];
      
      const bodySystems = [
        "CARDIAC DISORDERS",
        "NERVOUS SYSTEM DISORDERS",
        "VASCULAR DISORDERS",
        "RESPIRATORY, THORACIC AND MEDIASTINAL DISORDERS",
        "IMMUNE SYSTEM DISORDERS",
        "RENAL AND URINARY DISORDERS",
        "GASTROINTESTINAL DISORDERS",
        "INFECTIONS AND INFESTATIONS"
      ];
      
      for (let i = 0; i < 10; i++) {
        const termIndex = Math.floor(Math.random() * seriousTerms.length);
        const saeRecord = {
          STUDYID: getStudyIdentifier(trial.id),
          DOMAIN: "SAE",
          USUBJID: `S-${trial.id}-${String(i + 1).padStart(3, '0')}`,
          SAESEQ: 1,
          SAESPID: `SAE-${String(i + 1).padStart(3, '0')}`,
          SAETERM: seriousTerms[termIndex],
          SAEDECOD: seriousDecoded[termIndex],
          SAEBODSYS: bodySystems[Math.floor(Math.random() * bodySystems.length)],
          SAESEV: ["MODERATE", "SEVERE"][Math.floor(Math.random() * 2)], // Only moderate/severe for SAE
          SAESER: "Y", // Always serious
          SAEREL: ["NOT RELATED", "POSSIBLY RELATED", "PROBABLY RELATED", "RELATED"][Math.floor(Math.random() * 4)],
          SAEACN: ["DRUG WITHDRAWN", "DOSE REDUCED", "DOSE NOT CHANGED", "NOT APPLICABLE"][Math.floor(Math.random() * 4)],
          SAEOUT: ["RECOVERED/RESOLVED", "RECOVERING/RESOLVING", "NOT RECOVERED/NOT RESOLVED", "FATAL"][Math.floor(Math.random() * 4)],
          SAESTDTC: new Date(2024, 0, 1 + Math.floor(Math.random() * 120)).toISOString().split('T')[0],
          SAEENDTC: Math.random() > 0.4 ? new Date(2024, 0, 10 + Math.floor(Math.random() * 120)).toISOString().split('T')[0] : "",
          SAESTDY: Math.floor(Math.random() * 120) + 1,
          SAEENDY: Math.random() > 0.4 ? Math.floor(Math.random() * 120) + 10 : null,
          SAECONTRT: Math.random() > 0.6 ? "Y" : "N",
          SAETOXGR: Math.random() > 0.5 ? "3" : "4" // Grade 3 or 4 for serious events
        };
        
        saeRecords.push({
          trialId: trial.id,
          domain: "SAE",
          source: "EDC",
          recordId: `SAE-${trial.id}-${i + 1}`,
          recordData: JSON.stringify(saeRecord),
          importedAt: new Date()
        });
      }
      
      await db.insert(domainData).values(saeRecords);
      console.log(`  ✓ Created ${saeRecords.length} serious adverse event records`);
      console.log(`  ✓ Trial ${trial.id} completed\n`);
    }
    
    console.log('SAE data fix completed successfully!');
    console.log('✓ SAE domain now uses correct source "EDC" (matching frontend expectation)');
    console.log('✓ SAE data contains serious adverse events (10 records per trial)');
    console.log('✓ SAE records include serious incidents like MI, stroke, hospitalization, etc.');
    
  } catch (error) {
    console.error('Error fixing SAE data:', error);
    throw error;
  }
}

// Run the fix
fixSAEData().then(() => {
  console.log('\nSAE fix complete');
  process.exit(0);
}).catch(error => {
  console.error('Failed to fix SAE data:', error);
  process.exit(1);
});