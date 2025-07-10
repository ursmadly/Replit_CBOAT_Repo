// add_signals.js - Script to add signals to the database
import { storage } from './server/storage.js';

// Helper function to generate random date between min and max days ago
function randomDate(minDaysAgo, maxDaysAgo) {
  const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

// Helper function to calculate due date based on detection date and priority
function calculateDueDate(detectionDate, priority) {
  const dueDateMap = {
    'Critical': 3, // 3 days for Critical
    'High': 7,     // 7 days for High
    'Medium': 14,  // 14 days for Medium
    'Low': 30      // 30 days for Low
  };
  
  const dueDate = new Date(detectionDate);
  dueDate.setDate(dueDate.getDate() + (dueDateMap[priority] || 30));
  return dueDate;
}

// Main function to create a batch of signals
async function createSignals() {
  console.log('Starting to create signals for each study...');
  
  // Array to hold all signal creation promises
  const signalPromises = [];
  
  // DIABETES TRIAL (TRIAL ID 1) - Additional signals (3 more to make 10 total)
  const diabetesSignals = [
    {
      detectionId: "CON_Risk_042",
      title: "Consent Procedure Irregularities",
      trialId: 1,
      siteId: 1,
      dataReference: "Informed Consent Documentation",
      observation: "Multiple consents showing same signature date but different witness initials",
      priority: "High",
      status: "initiated",
      assignedTo: "John Carter",
      createdBy: "Quality Monitor",
      notifiedPersons: ["Compliance Officer", "CRA Lead"]
    },
    {
      detectionId: "DM_Risk_089",
      title: "Query Aging Beyond Protocol Limit",
      trialId: 1,
      siteId: 2,
      dataReference: "EDC Query Report",
      observation: "Over 30% of queries have remained open for more than 14 days at Site 145",
      priority: "Medium",
      status: "in_progress",
      assignedTo: "Lisa Wong",
      createdBy: "Data Manager",
      notifiedPersons: ["CRA", "Site Manager"]
    },
    {
      detectionId: "IRB_Risk_061",
      title: "Missing IRB Renewal Documentation",
      trialId: 1,
      siteId: 3,
      dataReference: "IRB Documentation",
      observation: "Annual IRB renewal documentation not received from Eastside Research Clinic",
      priority: "High",
      status: "not_started",
      assignedTo: "Mark Johnson",
      createdBy: "Regulatory Affairs",
      notifiedPersons: ["Site Manager", "Regulatory Lead"]
    }
  ];
  
  // RHEUMATOID ARTHRITIS TRIAL (TRIAL ID 2) - 10 signals
  const raTrialSignals = [
    {
      detectionId: "ST_Risk_002",
      title: "Elevated Subject Withdrawal Rate",
      trialId: 2,
      siteId: 4,
      dataReference: "Patient Withdrawal Forms",
      observation: "Site 201 has 35% higher subject withdrawal rate than other sites",
      priority: "Critical",
      status: "initiated",
      assignedTo: "Lisa Wong",
      createdBy: "System",
      notifiedPersons: ["Trial Manager", "Safety Monitor"]
    },
    {
      detectionId: "SAF_Risk_112",
      title: "Unexpected AE Clustering",
      trialId: 2,
      siteId: 5,
      dataReference: "Safety Database",
      observation: "Clustering of unexpected gastrointestinal adverse events at Atlanta Research Group",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "Maria Rodriguez",
      createdBy: "Safety Officer",
      notifiedPersons: ["Medical Monitor", "Principal Investigator"]
    },
    {
      detectionId: "PD_Risk_143",
      title: "Protocol Deviation - Medication Storage",
      trialId: 2,
      siteId: 4,
      dataReference: "Monitoring Reports",
      observation: "Temperature excursions found in medication storage logs at Northwestern Medical Partners",
      priority: "High",
      status: "initiated",
      assignedTo: "John Carter",
      createdBy: "CRA",
      notifiedPersons: ["Site Manager", "Principal Investigator"]
    },
    {
      detectionId: "DM_Risk_203",
      title: "EDC Source Verification Issues",
      trialId: 2,
      siteId: 5,
      dataReference: "EDC System Logs",
      observation: "Source verification issues found in >15% of entered data at Atlanta Research Group",
      priority: "Medium",
      status: "not_started",
      assignedTo: "Mark Johnson",
      createdBy: "Data Manager",
      notifiedPersons: ["CRA", "QA Manager"]
    },
    {
      detectionId: "CON_Risk_074",
      title: "Missing Informed Consent Elements",
      trialId: 2,
      siteId: 4,
      dataReference: "ICF Audit",
      observation: "Three ICFs missing required signature from legally authorized representative",
      priority: "High",
      status: "in_progress",
      assignedTo: "Lisa Wong",
      createdBy: "Quality Monitor",
      notifiedPersons: ["Regulatory Affairs", "Principal Investigator"]
    },
    {
      detectionId: "ENR_Risk_096",
      title: "Slow Enrollment Rate",
      trialId: 2,
      siteId: 5,
      dataReference: "Enrollment Tracker",
      observation: "Site is 40% below target enrollment rate for Q2",
      priority: "Medium",
      status: "initiated",
      assignedTo: "John Carter",
      createdBy: "Project Manager",
      notifiedPersons: ["CRA", "Site Manager"]
    },
    {
      detectionId: "LAB_Risk_157",
      title: "Lab Sample Integrity Issues",
      trialId: 2,
      siteId: 4,
      dataReference: "Central Lab Reports",
      observation: "Multiple samples from Northwestern Medical Partners showing hemolysis",
      priority: "Medium",
      status: "not_started",
      assignedTo: "Maria Rodriguez",
      createdBy: "Lab Manager",
      notifiedPersons: ["Principal Investigator", "CRA"]
    },
    {
      detectionId: "MED_Risk_065",
      title: "Medication Compliance Issues",
      trialId: 2,
      siteId: 5,
      dataReference: "Patient Diaries",
      observation: "Patient diaries indicate <80% compliance with medication schedule at Atlanta Research Group",
      priority: "High",
      status: "in_progress",
      assignedTo: "Mark Johnson",
      createdBy: "Clinical Monitor",
      notifiedPersons: ["Principal Investigator", "Medical Monitor"]
    },
    {
      detectionId: "MON_Risk_029",
      title: "Monitoring Visit Delays",
      trialId: 2,
      siteId: 4,
      dataReference: "Monitoring Schedule",
      observation: "Three consecutive monitoring visits delayed by >30 days",
      priority: "Medium",
      status: "initiated",
      assignedTo: "Lisa Wong",
      createdBy: "Project Manager",
      notifiedPersons: ["CRA Lead", "Site Manager"]
    },
    {
      detectionId: "QC_Risk_118",
      title: "Data Quality Issues",
      trialId: 2,
      siteId: 5,
      dataReference: "Data Quality Reports",
      observation: "Data quality metrics below threshold for 2 consecutive months",
      priority: "Medium",
      status: "not_started",
      assignedTo: "John Carter",
      createdBy: "Data Manager",
      notifiedPersons: ["QA Manager", "CRA"]
    }
  ];
  
  // BREAST CANCER TRIAL (TRIAL ID 3) - 10 signals
  const cancerTrialSignals = [
    {
      detectionId: "ST_Risk_003",
      title: "Protocol Compliance Issue",
      trialId: 3,
      siteId: 6,
      dataReference: "Monitoring Reports",
      observation: "MD Anderson Cancer Center has multiple violations of inclusion criteria",
      priority: "Critical",
      status: "initiated",
      assignedTo: "Maria Rodriguez",
      createdBy: "System",
      notifiedPersons: ["Medical Director", "Principal Investigator"]
    },
    {
      detectionId: "SAF_Risk_176",
      title: "Unexpected Serious Adverse Event Pattern",
      trialId: 3,
      siteId: 7,
      dataReference: "Safety Database",
      observation: "Pattern of unexpected cardiac events at UCLA Medical Center",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "John Carter",
      createdBy: "Safety Officer",
      notifiedPersons: ["Medical Monitor", "Principal Investigator"]
    },
    {
      detectionId: "LAB_Risk_232",
      title: "Missing Biomarker Data",
      trialId: 3,
      siteId: 8,
      dataReference: "Central Lab Reports",
      observation: "Missing HER2 expression data for 7 patients at Memorial Sloan Kettering",
      priority: "High",
      status: "not_started",
      assignedTo: "Lisa Wong",
      createdBy: "Lab Manager",
      notifiedPersons: ["Data Manager", "Principal Investigator"]
    },
    {
      detectionId: "IMP_Risk_089",
      title: "Investigational Product Storage Deviation",
      trialId: 3,
      siteId: 6,
      dataReference: "IP Logs",
      observation: "Temperature excursion in IP storage at MD Anderson Cancer Center",
      priority: "Medium",
      status: "initiated",
      assignedTo: "Mark Johnson",
      createdBy: "Clinical Supplies Manager",
      notifiedPersons: ["Site Manager", "CRA"]
    },
    {
      detectionId: "DM_Risk_321",
      title: "EDC Data Entry Delays",
      trialId: 3,
      siteId: 7,
      dataReference: "EDC System Reports",
      observation: "UCLA Medical Center has >15 day delay in entering critical efficacy data",
      priority: "High",
      status: "in_progress",
      assignedTo: "Maria Rodriguez",
      createdBy: "Data Manager",
      notifiedPersons: ["CRA", "Site Manager"]
    },
    {
      detectionId: "CON_Risk_167",
      title: "Re-consent Process Issues",
      trialId: 3,
      siteId: 8,
      dataReference: "ICF Documentation",
      observation: "Re-consent not obtained for protocol amendment at Memorial Sloan Kettering",
      priority: "Critical",
      status: "initiated",
      assignedTo: "John Carter",
      createdBy: "Regulatory Affairs",
      notifiedPersons: ["Principal Investigator", "IRB Liaison"]
    },
    {
      detectionId: "ENR_Risk_245",
      title: "Slow Enrollment - Diversity Criteria",
      trialId: 3,
      siteId: 6,
      dataReference: "Enrollment Data",
      observation: "Site failing to meet diversity enrollment targets by >50%",
      priority: "Medium",
      status: "not_started",
      assignedTo: "Lisa Wong",
      createdBy: "Project Manager",
      notifiedPersons: ["Principal Investigator", "CRA"]
    },
    {
      detectionId: "MON_Risk_128",
      title: "Source Document Discrepancies",
      trialId: 3,
      siteId: 7,
      dataReference: "Monitoring Reports",
      observation: "Source document verification found >20% discrepancies at UCLA Medical Center",
      priority: "High",
      status: "in_progress",
      assignedTo: "Mark Johnson",
      createdBy: "CRA",
      notifiedPersons: ["Data Manager", "Site Manager"]
    },
    {
      detectionId: "SAF_Risk_198",
      title: "Delayed SAE Reporting",
      trialId: 3,
      siteId: 8,
      dataReference: "Safety Reports",
      observation: "Multiple SAEs reported outside the 24-hour reporting window at Memorial Sloan Kettering",
      priority: "Critical",
      status: "initiated",
      assignedTo: "Maria Rodriguez",
      createdBy: "Safety Officer",
      notifiedPersons: ["Medical Monitor", "Regulatory Affairs"]
    },
    {
      detectionId: "QC_Risk_276",
      title: "Protocol Deviation Clustering",
      trialId: 3,
      siteId: 6,
      dataReference: "Quality Reports",
      observation: "Cluster of protocol deviations related to dosing schedule at MD Anderson Cancer Center",
      priority: "High",
      status: "not_started",
      assignedTo: "John Carter",
      createdBy: "Quality Manager",
      notifiedPersons: ["Principal Investigator", "Clinical Operations"]
    }
  ];
  
  // ALZHEIMER'S DISEASE TRIAL (TRIAL ID 4) - 10 signals
  const alzheimerTrialSignals = [
    {
      detectionId: "ST_Risk_004",
      title: "Biomarker Collection Issues",
      trialId: 4,
      siteId: null,
      dataReference: "Central Lab Data",
      observation: "Inconsistent biomarker collection technique identified across multiple sites",
      priority: "High",
      status: "initiated",
      assignedTo: "Lisa Wong",
      createdBy: "System",
      notifiedPersons: ["Medical Monitor", "Lab Director"]
    },
    {
      detectionId: "MRI_Risk_056",
      title: "MRI Protocol Deviations",
      trialId: 4,
      siteId: null,
      dataReference: "Imaging Reports",
      observation: "Multiple sites using incorrect MRI sequences for assessment",
      priority: "Critical",
      status: "in_progress",
      assignedTo: "Mark Johnson",
      createdBy: "Imaging Manager",
      notifiedPersons: ["Medical Director", "Site Managers"]
    },
    {
      detectionId: "ENR_Risk_189",
      title: "Inclusion Criteria Adherence Issues",
      trialId: 4,
      siteId: null,
      dataReference: "Screening Reports",
      observation: "25% of screened patients falling outside cognitive assessment scores range",
      priority: "High",
      status: "not_started",
      assignedTo: "Maria Rodriguez",
      createdBy: "Clinical Operations",
      notifiedPersons: ["Medical Monitor", "Site Coordinators"]
    },
    {
      detectionId: "COG_Risk_214",
      title: "Cognitive Assessment Variability",
      trialId: 4,
      siteId: null,
      dataReference: "Assessment Data",
      observation: "High inter-rater variability in cognitive assessments across sites",
      priority: "Medium",
      status: "initiated",
      assignedTo: "John Carter",
      createdBy: "Neuropsychologist",
      notifiedPersons: ["Medical Director", "Site Trainers"]
    },
    {
      detectionId: "PET_Risk_073",
      title: "PET Scan Scheduling Delays",
      trialId: 4,
      siteId: null,
      dataReference: "Imaging Schedule",
      observation: "Consistent delays of >14 days in scheduling follow-up PET scans",
      priority: "Medium",
      status: "in_progress",
      assignedTo: "Lisa Wong",
      createdBy: "Imaging Coordinator",
      notifiedPersons: ["Site Managers", "Clinical Operations"]
    },
    {
      detectionId: "DB_Risk_142",
      title: "Database Lock Risk",
      trialId: 4,
      siteId: null,
      dataReference: "Data Management Reports",
      observation: "Study setup phase showing >30% missing data elements in eCRF design",
      priority: "High",
      status: "not_started",
      assignedTo: "Mark Johnson",
      createdBy: "Data Manager",
      notifiedPersons: ["Clinical Operations", "Database Administrator"]
    },
    {
      detectionId: "SAF_Risk_225",
      title: "Caregiver Reporting Inconsistencies",
      trialId: 4,
      siteId: null,
      dataReference: "Safety Reports",
      observation: "Discrepancies between patient and caregiver adverse event reporting",
      priority: "Medium",
      status: "initiated",
      assignedTo: "Maria Rodriguez",
      createdBy: "Safety Officer",
      notifiedPersons: ["Medical Monitor", "Site Coordinators"]
    },
    {
      detectionId: "REG_Risk_098",
      title: "Regulatory Documentation Gaps",
      trialId: 4,
      siteId: null,
      dataReference: "Regulatory Files",
      observation: "Multiple sites with incomplete regulatory documentation before study start",
      priority: "High",
      status: "in_progress",
      assignedTo: "John Carter",
      createdBy: "Regulatory Affairs",
      notifiedPersons: ["Clinical Operations", "Site Managers"]
    },
    {
      detectionId: "QC_Risk_183",
      title: "Rater Certification Issues",
      trialId: 4,
      siteId: null,
      dataReference: "Training Records",
      observation: "30% of cognitive assessment raters requiring recertification before study start",
      priority: "Medium",
      status: "not_started",
      assignedTo: "Lisa Wong",
      createdBy: "Quality Manager",
      notifiedPersons: ["Training Lead", "Medical Monitor"]
    },
    {
      detectionId: "OP_Risk_267",
      title: "Operational Readiness Concerns",
      trialId: 4,
      siteId: null,
      dataReference: "Readiness Checklist",
      observation: "Site readiness assessments indicate multiple high-risk areas before study initiation",
      priority: "Critical",
      status: "initiated",
      assignedTo: "Mark Johnson",
      createdBy: "Project Manager",
      notifiedPersons: ["Clinical Operations", "Study Director"]
    }
  ];
  
  // Combine all signals
  const allSignals = [
    ...diabetesSignals,
    ...raTrialSignals,
    ...cancerTrialSignals,
    ...alzheimerTrialSignals
  ];
  
  // Process each signal and add detection and due dates
  for (const signal of allSignals) {
    // Generate a random detection date from 1-90 days ago
    const detectionDate = randomDate(1, 90);
    signal.detectionDate = detectionDate;
    
    // Calculate due date based on priority
    signal.dueDate = calculateDueDate(detectionDate, signal.priority);
    
    // Create the signal in the storage
    try {
      console.log(`Creating signal: ${signal.detectionId} - ${signal.title}`);
      const created = await storage.createSignalDetection(signal);
      console.log(`Successfully created signal: ${signal.detectionId} (ID: ${created.id})`);
      signalPromises.push(created);
    } catch (error) {
      console.error(`Failed to create signal ${signal.detectionId}:`, error);
    }
  }
  
  // Wait for all promises to resolve
  await Promise.all(signalPromises);
  console.log('All signals created successfully!');
}

// Run the script
createSignals()
  .then(() => console.log('Script completed.'))
  .catch(err => console.error('Script failed:', err));