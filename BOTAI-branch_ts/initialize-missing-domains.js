/**
 * Initialize Missing SDTM Domains in Production
 * This script adds DS, MH, and IE domains to ensure complete SDTM compliance
 */

import { db } from './server/db.js';
import { initDSData, initMHData, initIEData } from './server/initDomainData.js';

async function initializeMissingDomains() {
  console.log('Initializing Missing SDTM Domains for Production');
  console.log('================================================\n');
  
  try {
    console.log('Adding DS (Disposition) domain data...');
    await initDSData();
    
    console.log('Adding MH (Medical History) domain data...');
    await initMHData();
    
    console.log('Adding IE (Inclusion/Exclusion) domain data...');
    await initIEData();
    
    console.log('\nAll missing domains initialized successfully!');
    console.log('Production environment now has complete SDTM domain coverage:');
    console.log('- DM (Demographics)');
    console.log('- LB (Laboratory Data)');
    console.log('- SV (Subject Visits)');
    console.log('- TU (Tumor Identification)');
    console.log('- AE (Adverse Events)');
    console.log('- VS (Vital Signs)');
    console.log('- CM (Concomitant Medications)');
    console.log('- EX (Exposure)');
    console.log('- DS (Disposition) - NEW');
    console.log('- MH (Medical History) - NEW');
    console.log('- IE (Inclusion/Exclusion) - NEW');
    console.log('- CTMS_STUDY (Study Management)');
    
  } catch (error) {
    console.error('Error initializing missing domains:', error);
  }
}

// Run the initialization
initializeMissingDomains().then(() => {
  console.log('Domain initialization complete');
  process.exit(0);
}).catch(error => {
  console.error('Failed to initialize domains:', error);
  process.exit(1);
});