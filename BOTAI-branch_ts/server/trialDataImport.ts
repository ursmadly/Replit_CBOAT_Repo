/**
 * Trial Data Import Utility
 * Imports clinical trial data from the existing mock data store into the vector database
 * for use with the RAG system.
 */

import { vectorDb, VectorDocument } from './vectorDb';
import { rag } from './rag';

// Define the domains to import
const DOMAINS = [
  { id: "DM", name: "Demographics", description: "Subject demographics and baseline characteristics" },
  { id: "SV", name: "Subject Visits", description: "Subject visit and scheduling information" },
  { id: "DS", name: "Disposition", description: "Subject disposition events and status" },
  { id: "AE", name: "Adverse Events", description: "Adverse events reported during the study" },
  { id: "SAE", name: "Serious Adverse Events", description: "Serious adverse events reported during the study" },
  { id: "MH", name: "Medical History", description: "Medical history of the subject" },
  { id: "CM", name: "Concomitant Medications", description: "Concomitant medications taken during the study" },
  { id: "PD", name: "Pharmacodynamics", description: "Pharmacodynamic measurements" },
  { id: "VS", name: "Vital Signs", description: "Vital signs measurements" },
  { id: "LB", name: "Laboratory Tests", description: "Laboratory test results" },
  { id: "EX", name: "Exposure", description: "Study drug exposure information" },
];

// Data sources available in the system
const DATA_SOURCES = ["EDC", "Central Laboratory", "Imaging RECIST", "Tumor Response", "CTMS", "EDC Audit Trail"];

// Mock data generators for different domains
const generateDomainData = (studyId: number, domain: string, dataSource: string, count: number = 10) => {
  const data = [];
  
  // Generic function to create a random date within the last year
  const randomDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 365));
    return date.toISOString().split('T')[0];
  };
  
  // Generate different data structures based on domain
  for (let i = 1; i <= count; i++) {
    const subjectId = `SUB-${studyId}-${String(i).padStart(3, '0')}`;
    
    let record: Record<string, any> = {
      domain,
      dataSource,
      studyId,
      subjectId,
      recordDate: randomDate(),
    };
    
    // Add domain-specific fields
    switch (domain) {
      case 'DM':
        record = {
          ...record,
          age: Math.floor(Math.random() * 50) + 18,
          gender: Math.random() > 0.5 ? 'Male' : 'Female',
          race: ['White', 'Black', 'Asian', 'Other'][Math.floor(Math.random() * 4)],
          ethnicity: ['Hispanic', 'Non-Hispanic'][Math.floor(Math.random() * 2)],
          hasComorbidities: Math.random() > 0.7,
        };
        break;
        
      case 'AE':
      case 'SAE':
        record = {
          ...record,
          aeterm: ['Headache', 'Nausea', 'Dizziness', 'Fatigue', 'Rash', 'Vomiting'][Math.floor(Math.random() * 6)],
          aestartdate: randomDate(),
          aeenddate: Math.random() > 0.3 ? randomDate() : '',
          aeseverity: ['Mild', 'Moderate', 'Severe'][Math.floor(Math.random() * 3)],
          aerelation: ['Not Related', 'Possibly Related', 'Related'][Math.floor(Math.random() * 3)],
          aeoutcome: ['Recovered', 'Recovering', 'Not Recovered', 'Fatal', 'Unknown'][Math.floor(Math.random() * 5)],
          aeseriousness: domain === 'SAE' ? true : Math.random() > 0.8,
        };
        break;
        
      case 'LB':
        const testTypes = ['Hemoglobin', 'Glucose', 'Platelets', 'ALT', 'AST', 'Creatinine'];
        const testType = testTypes[Math.floor(Math.random() * testTypes.length)];
        const value = (Math.random() * 100).toFixed(1);
        const units = {
          'Hemoglobin': 'g/dL',
          'Glucose': 'mg/dL',
          'Platelets': '10^9/L',
          'ALT': 'U/L',
          'AST': 'U/L',
          'Creatinine': 'mg/dL'
        }[testType];
        
        record = {
          ...record,
          lbtest: testType,
          lbresult: value,
          lbunit: units,
          lbnormal: Math.random() > 0.2, // 80% normal results
          lbcollecteddate: randomDate(),
        };
        break;
        
      case 'VS':
        const vitalTypes = ['Blood Pressure', 'Heart Rate', 'Temperature', 'Respiratory Rate', 'Weight'];
        const vitalType = vitalTypes[Math.floor(Math.random() * vitalTypes.length)];
        
        let vitalValue, vitalUnit;
        switch (vitalType) {
          case 'Blood Pressure':
            vitalValue = `${110 + Math.floor(Math.random() * 40)}/${70 + Math.floor(Math.random() * 20)}`;
            vitalUnit = 'mmHg';
            break;
          case 'Heart Rate':
            vitalValue = (60 + Math.floor(Math.random() * 40)).toString();
            vitalUnit = 'bpm';
            break;
          case 'Temperature':
            vitalValue = (36 + Math.random() * 2).toFixed(1);
            vitalUnit = '°C';
            break;
          case 'Respiratory Rate':
            vitalValue = (12 + Math.floor(Math.random() * 8)).toString();
            vitalUnit = 'breaths/min';
            break;
          case 'Weight':
            vitalValue = (50 + Math.random() * 50).toFixed(1);
            vitalUnit = 'kg';
            break;
        }
        
        record = {
          ...record,
          vstest: vitalType,
          vsresult: vitalValue,
          vsunit: vitalUnit,
          vsdtc: randomDate(),
        };
        break;
        
      // Add more domain-specific cases as needed
      default:
        // Generic domain fields for other domains
        record = {
          ...record,
          value: `Sample ${domain} value ${i}`,
          comment: Math.random() > 0.7 ? `Comment for ${domain} record ${i}` : '',
        };
    }
    
    data.push(record);
  }
  
  return data;
};

// Function to create vector documents from domain data
const createVectorDocuments = (
  studyId: number, 
  domain: string, 
  dataSource: string, 
  records: any[]
): VectorDocument[] => {
  return records.map((record, index) => {
    // Convert record to a formatted string representation
    const contentParts = Object.entries(record).map(([key, value]) => {
      return `${key}: ${value}`;
    });
    
    const content = contentParts.join('\n');
    
    return {
      id: `${dataSource.toLowerCase().replace(/\s+/g, '-')}_${domain}_${studyId}_${index}`,
      content,
      metadata: {
        studyId,
        domain,
        dataSource,
        subjectId: record.subjectId,
        recordType: record.domain,
      }
    };
  });
};

// Main function to import trial data into RAG
export const importTrialDataToRAG = async (studyIds: number[] = [1, 2]) => {
  try {
    // Create a collection for trial data if it doesn't exist
    const collectionName = "clinical-trial-data";
    const collections = await vectorDb.listCollections();
    
    if (!collections.includes(collectionName)) {
      await vectorDb.createCollection(collectionName);
      console.log(`Created collection: ${collectionName}`);
    }
    
    let importedCount = 0;
    
    // Import data for each study and domain
    for (const studyId of studyIds) {
      for (const domain of DOMAINS) {
        // Generate and import EDC data
        const edcData = generateDomainData(studyId, domain.id, "EDC");
        const edcDocuments = createVectorDocuments(studyId, domain.id, "EDC", edcData);
        
        // Use the RAG ingest function to add documents
        await rag.ingestDocuments(collectionName, edcDocuments);
        
        importedCount += edcDocuments.length;
        
        // For Lab domain, also add lab data
        if (domain.id === 'LB') {
          const labData = generateDomainData(studyId, domain.id, "Central Laboratory", 15);
          const labDocuments = createVectorDocuments(studyId, domain.id, "Central Laboratory", labData);
          
          await rag.ingestDocuments(collectionName, labDocuments);
          
          importedCount += labDocuments.length;
        }
        
        // For AE domain, also add serious adverse events
        if (domain.id === 'AE') {
          const saeData = generateDomainData(studyId, 'SAE', "EDC", 5);
          const saeDocuments = createVectorDocuments(studyId, 'SAE', "EDC", saeData);
          
          await rag.ingestDocuments(collectionName, saeDocuments);
          
          importedCount += saeDocuments.length;
        }
      }
      
      // Add trial summary data
      const trialNames = {
        1: "Diabetes Type 2 Long-term Outcomes",
        2: "Advanced Breast Cancer Treatment"
      };
      
      const trialSummary = {
        studyId,
        domain: "SUMMARY",
        dataSource: "CTMS",
        protocolId: `PRO00${studyId}`,
        title: trialNames[studyId as keyof typeof trialNames] || `Study ${studyId}`,
        phase: studyId === 1 ? "Phase 3" : "Phase 2",
        status: "Active",
        indication: studyId === 1 ? "Type 2 Diabetes" : "Metastatic Breast Cancer",
        startDate: "2023-01-15",
        estimatedEndDate: "2025-06-30",
        enrollmentTarget: studyId === 1 ? 300 : 150,
        currentEnrollment: studyId === 1 ? 245 : 87,
        description: studyId === 1 
          ? "A randomized, double-blind, placebo-controlled study evaluating long-term glycemic control and cardiovascular outcomes in patients with Type 2 Diabetes." 
          : "A randomized, open-label study evaluating the efficacy and safety of a novel therapy in patients with locally advanced or metastatic breast cancer who have progressed after prior treatment."
      };
      
      await rag.ingestDocuments(collectionName, [{
          id: `study-summary-${studyId}`,
          content: Object.entries(trialSummary).map(([key, value]) => `${key}: ${value}`).join('\n'),
          metadata: {
            studyId,
            domain: "SUMMARY",
            dataSource: "CTMS",
            recordType: "StudySummary"
          }
        }]);
      
      importedCount++;
    }
    
    console.log(`Successfully imported ${importedCount} trial data records to RAG system`);
    return { 
      success: true, 
      documentsAdded: importedCount,
      studiesProcessed: studyIds.length,
      collectionName: "clinical-trial-data" 
    };
    
  } catch (error) {
    console.error("Error importing trial data to RAG:", error);
    return { success: false, error: String(error) };
  }
};