/**
 * Add missing CTMS domain data for all sub-tabs
 * Creates data for CTMS_SITE, CTMS_COUNTRY, CTMS_CONTACT, CTMS_PAYMENT, CTMS_DEVIATION
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

async function addCTMSDomains() {
  console.log('Adding CTMS domain data for all sub-tabs...');
  console.log('=============================================\n');
  
  try {
    const allTrials = await db.select().from(trials);
    console.log(`Found ${allTrials.length} trials to process\n`);
    
    for (const trial of allTrials) {
      console.log(`Processing trial ${trial.id}...`);
      
      // 1. CTMS_SITE domain
      console.log('  - Creating CTMS_SITE data...');
      await createCTMSSiteSource(trial.id);
      await createCTMSSiteData(trial.id);
      
      // 2. CTMS_COUNTRY domain
      console.log('  - Creating CTMS_COUNTRY data...');
      await createCTMSCountrySource(trial.id);
      await createCTMSCountryData(trial.id);
      
      // 3. CTMS_CONTACT domain
      console.log('  - Creating CTMS_CONTACT data...');
      await createCTMSContactSource(trial.id);
      await createCTMSContactData(trial.id);
      
      // 4. CTMS_PAYMENT domain
      console.log('  - Creating CTMS_PAYMENT data...');
      await createCTMSPaymentSource(trial.id);
      await createCTMSPaymentData(trial.id);
      
      // 5. CTMS_DEVIATION domain
      console.log('  - Creating CTMS_DEVIATION data...');
      await createCTMSDeviationSource(trial.id);
      await createCTMSDeviationData(trial.id);
      
      console.log(`  ✓ Trial ${trial.id} completed\n`);
    }
    
    console.log('All CTMS domains created successfully!');
    console.log('✓ CTMS_SITE - Site information and enrollment data');
    console.log('✓ CTMS_COUNTRY - Country-specific regulatory information');
    console.log('✓ CTMS_CONTACT - Site contacts and personnel');
    console.log('✓ CTMS_PAYMENT - Payment schedules and milestones');
    console.log('✓ CTMS_DEVIATION - Protocol deviations and issues');
    
  } catch (error) {
    console.error('Error creating CTMS domains:', error);
    throw error;
  }
}

// CTMS_SITE functions
async function createCTMSSiteSource(trialId) {
  await db.insert(domainSources).values({
    trialId: trialId,
    domain: "CTMS_SITE",
    source: "CTMS Sites",
    description: "Clinical trial site information and enrollment data",
    sourceType: "CTMS",
    system: "CTMS",
    integrationMethod: "API",
    format: "Standard",
    frequency: "Daily",
    contact: "Site Management"
  });
}

async function createCTMSSiteData(trialId) {
  const sites = [
    { id: "001", name: "Boston Medical Center", country: "USA", city: "Boston", state: "MA" },
    { id: "002", name: "Mayo Clinic", country: "USA", city: "Rochester", state: "MN" },
    { id: "003", name: "Johns Hopkins Hospital", country: "USA", city: "Baltimore", state: "MD" },
    { id: "004", name: "Toronto General Hospital", country: "Canada", city: "Toronto", state: "ON" },
    { id: "005", name: "University of London", country: "UK", city: "London", state: "England" }
  ];
  
  const siteRecords = [];
  
  for (let i = 0; i < sites.length; i++) {
    const site = sites[i];
    const siteRecord = {
      STUDYID: getStudyIdentifier(trialId),
      DOMAIN: "CTMS_SITE",
      SITEID: site.id,
      SITENAME: site.name,
      SITECOUNTRY: site.country,
      SITECITY: site.city,
      SITESTATE: site.state,
      SITESTATUS: ["ACTIVE", "INITIATED", "SCREENING"][Math.floor(Math.random() * 3)],
      SITEACTIVATION: new Date(2023, 10, 1 + i * 7).toISOString().split('T')[0],
      ENROLLMENT: Math.floor(Math.random() * 15) + 5,
      ENROLLMENTGOAL: Math.floor(Math.random() * 10) + 20,
      PINAME: ["Dr. Sarah Johnson", "Dr. Michael Chen", "Dr. Emily Rodriguez", "Dr. David Kim", "Dr. Lisa Wang"][i],
      PIEMAIL: [`pi${i + 1}@${site.name.toLowerCase().replace(/\s+/g, '')}.com`],
      CRCNAME: [`CRC ${i + 1}`, `Coordinator ${i + 1}`][Math.floor(Math.random() * 2)],
      LASTVISIT: new Date(2024, 0, 1 + Math.floor(Math.random() * 120)).toISOString().split('T')[0]
    };
    
    siteRecords.push({
      trialId: trialId,
      domain: "CTMS_SITE",
      source: "CTMS Sites",
      recordId: `SITE-${trialId}-${site.id}`,
      recordData: JSON.stringify(siteRecord),
      importedAt: new Date()
    });
  }
  
  await db.insert(domainData).values(siteRecords);
}

// CTMS_COUNTRY functions
async function createCTMSCountrySource(trialId) {
  await db.insert(domainSources).values({
    trialId: trialId,
    domain: "CTMS_COUNTRY",
    source: "CTMS Countries",
    description: "Country-specific regulatory and operational information",
    sourceType: "CTMS",
    system: "CTMS",
    integrationMethod: "API",
    format: "Standard",
    frequency: "Weekly",
    contact: "Regulatory Affairs"
  });
}

async function createCTMSCountryData(trialId) {
  const countries = [
    { code: "USA", name: "United States", regulatory: "FDA", status: "APPROVED" },
    { code: "CAN", name: "Canada", regulatory: "Health Canada", status: "APPROVED" },
    { code: "GBR", name: "United Kingdom", regulatory: "MHRA", status: "APPROVED" },
    { code: "DEU", name: "Germany", regulatory: "BfArM", status: "PENDING" },
    { code: "JPN", name: "Japan", regulatory: "PMDA", status: "SUBMITTED" }
  ];
  
  const countryRecords = [];
  
  for (let i = 0; i < countries.length; i++) {
    const country = countries[i];
    const countryRecord = {
      STUDYID: getStudyIdentifier(trialId),
      DOMAIN: "CTMS_COUNTRY",
      COUNTRYCODE: country.code,
      COUNTRYNAME: country.name,
      REGAUTHORITY: country.regulatory,
      REGSTATUS: country.status,
      APPROVALDATE: country.status === "APPROVED" ? new Date(2023, 8, 1 + i * 10).toISOString().split('T')[0] : "",
      SUBMISSIONDATE: new Date(2023, 6, 1 + i * 7).toISOString().split('T')[0],
      ETHICSAPPROVAL: ["APPROVED", "PENDING"][Math.floor(Math.random() * 2)],
      SITESACTIVE: Math.floor(Math.random() * 3) + 1,
      ENROLLMENTCAP: Math.floor(Math.random() * 50) + 50,
      LOCALREQUIREMENTS: "Country-specific regulatory requirements documented"
    };
    
    countryRecords.push({
      trialId: trialId,
      domain: "CTMS_COUNTRY",
      source: "CTMS Countries",
      recordId: `COUNTRY-${trialId}-${country.code}`,
      recordData: JSON.stringify(countryRecord),
      importedAt: new Date()
    });
  }
  
  await db.insert(domainData).values(countryRecords);
}

// CTMS_CONTACT functions
async function createCTMSContactSource(trialId) {
  await db.insert(domainSources).values({
    trialId: trialId,
    domain: "CTMS_CONTACT",
    source: "CTMS Contacts",
    description: "Site personnel and contact information",
    sourceType: "CTMS",
    system: "CTMS",
    integrationMethod: "API",
    format: "Standard",
    frequency: "Daily",
    contact: "Site Management"
  });
}

async function createCTMSContactData(trialId) {
  const contacts = [
    { role: "Principal Investigator", site: "001" },
    { role: "Clinical Research Coordinator", site: "001" },
    { role: "Site Manager", site: "002" },
    { role: "Principal Investigator", site: "002" },
    { role: "Clinical Research Coordinator", site: "003" },
    { role: "Data Manager", site: "003" },
    { role: "Principal Investigator", site: "004" },
    { role: "Clinical Research Coordinator", site: "005" }
  ];
  
  const contactRecords = [];
  
  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    const contactRecord = {
      STUDYID: getStudyIdentifier(trialId),
      DOMAIN: "CTMS_CONTACT",
      CONTACTID: `CONT-${String(i + 1).padStart(3, '0')}`,
      SITEID: contact.site,
      CONTACTROLE: contact.role,
      FIRSTNAME: ["Sarah", "Michael", "Emily", "David", "Lisa", "John", "Anna", "Robert"][i],
      LASTNAME: ["Johnson", "Chen", "Rodriguez", "Kim", "Wang", "Smith", "Davis", "Brown"][i],
      EMAIL: `contact${i + 1}@site${contact.site}.com`,
      PHONE: `+1-555-${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      STATUS: ["ACTIVE", "INACTIVE"][Math.floor(Math.random() * 2)],
      STARTDATE: new Date(2023, 9, 1 + i * 5).toISOString().split('T')[0],
      DEPARTMENT: ["Clinical Research", "Data Management", "Regulatory", "Administration"][Math.floor(Math.random() * 4)]
    };
    
    contactRecords.push({
      trialId: trialId,
      domain: "CTMS_CONTACT",
      source: "CTMS Contacts",
      recordId: `CONTACT-${trialId}-${i + 1}`,
      recordData: JSON.stringify(contactRecord),
      importedAt: new Date()
    });
  }
  
  await db.insert(domainData).values(contactRecords);
}

// CTMS_PAYMENT functions
async function createCTMSPaymentSource(trialId) {
  await db.insert(domainSources).values({
    trialId: trialId,
    domain: "CTMS_PAYMENT",
    source: "CTMS Payments",
    description: "Payment schedules and milestone tracking",
    sourceType: "CTMS",
    system: "CTMS",
    integrationMethod: "API",
    format: "Standard",
    frequency: "Monthly",
    contact: "Financial Operations"
  });
}

async function createCTMSPaymentData(trialId) {
  const paymentTypes = [
    "Site Initiation Payment", "Per Patient Payment", "Milestone Payment", 
    "Retention Payment", "Close-out Payment", "Administrative Fee"
  ];
  
  const paymentRecords = [];
  
  for (let i = 0; i < 12; i++) {
    const paymentRecord = {
      STUDYID: getStudyIdentifier(trialId),
      DOMAIN: "CTMS_PAYMENT",
      PAYMENTID: `PAY-${String(i + 1).padStart(3, '0')}`,
      SITEID: String(Math.floor(i / 2) + 1).padStart(3, '0'),
      PAYMENTTYPE: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
      AMOUNT: (Math.floor(Math.random() * 50000) + 5000).toFixed(2),
      CURRENCY: "USD",
      STATUS: ["PENDING", "APPROVED", "PAID", "OVERDUE"][Math.floor(Math.random() * 4)],
      DUEDATE: new Date(2024, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      PAIDDATE: Math.random() > 0.5 ? new Date(2024, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0] : "",
      MILESTONE: `Milestone ${Math.floor(Math.random() * 5) + 1}`,
      INVOICENUMBER: `INV-${trialId}-${String(i + 1).padStart(4, '0')}`,
      DESCRIPTION: "Payment for clinical trial services and patient enrollment"
    };
    
    paymentRecords.push({
      trialId: trialId,
      domain: "CTMS_PAYMENT",
      source: "CTMS Payments",
      recordId: `PAYMENT-${trialId}-${i + 1}`,
      recordData: JSON.stringify(paymentRecord),
      importedAt: new Date()
    });
  }
  
  await db.insert(domainData).values(paymentRecords);
}

// CTMS_DEVIATION functions
async function createCTMSDeviationSource(trialId) {
  await db.insert(domainSources).values({
    trialId: trialId,
    domain: "CTMS_DEVIATION",
    source: "CTMS Deviations",
    description: "Protocol deviations and corrective actions",
    sourceType: "CTMS",
    system: "CTMS",
    integrationMethod: "API",
    format: "Standard",
    frequency: "Real-time",
    contact: "Quality Assurance"
  });
}

async function createCTMSDeviationData(trialId) {
  const deviationTypes = [
    "Eligibility Criteria Deviation", "Visit Window Deviation", "Dosing Error",
    "Procedure Violation", "Consent Issue", "Documentation Error"
  ];
  
  const deviationRecords = [];
  
  for (let i = 0; i < 8; i++) {
    const deviationRecord = {
      STUDYID: getStudyIdentifier(trialId),
      DOMAIN: "CTMS_DEVIATION",
      DEVIATIONID: `DEV-${String(i + 1).padStart(3, '0')}`,
      SITEID: String(Math.floor(i / 2) + 1).padStart(3, '0'),
      USUBJID: `S-${trialId}-${String(i + 1).padStart(3, '0')}`,
      DEVIATIONTYPE: deviationTypes[Math.floor(Math.random() * deviationTypes.length)],
      SEVERITY: ["MINOR", "MAJOR", "CRITICAL"][Math.floor(Math.random() * 3)],
      STATUS: ["OPEN", "RESOLVED", "PENDING REVIEW"][Math.floor(Math.random() * 3)],
      REPORTDATE: new Date(2024, 0, 1 + Math.floor(Math.random() * 120)).toISOString().split('T')[0],
      RESOLUTIONDATE: Math.random() > 0.4 ? new Date(2024, 0, 10 + Math.floor(Math.random() * 120)).toISOString().split('T')[0] : "",
      DESCRIPTION: "Protocol deviation requiring documentation and corrective action",
      CORRECTIVEACTION: "Implemented additional training and monitoring procedures",
      REPORTEDBY: `Investigator Site ${String(Math.floor(i / 2) + 1).padStart(3, '0')}`,
      ROOTCAUSE: ["Training Gap", "System Error", "Communication Issue", "Procedure Unclear"][Math.floor(Math.random() * 4)]
    };
    
    deviationRecords.push({
      trialId: trialId,
      domain: "CTMS_DEVIATION",
      source: "CTMS Deviations",
      recordId: `DEVIATION-${trialId}-${i + 1}`,
      recordData: JSON.stringify(deviationRecord),
      importedAt: new Date()
    });
  }
  
  await db.insert(domainData).values(deviationRecords);
}

// Run the creation
addCTMSDomains().then(() => {
  console.log('\nCTMS domains creation complete');
  process.exit(0);
}).catch(error => {
  console.error('Failed to create CTMS domains:', error);
  process.exit(1);
});