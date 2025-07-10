// Common utility functions for domain data generation

// Common metadata fields for all domains
export const subjectIds = Array.from({ length: 10 }, (_, i) => `S-${String(i + 1).padStart(3, '0')}`);
export const visitNames = ["Screening", "Baseline", "Week 1", "Week 2", "Week 4", "Week 8", "Week 12", "End of Treatment"];

// Function to get appropriate study identifier
export function getStudyIdentifier(studyId: number): string {
  return studyId > 0 ? `PRO00${studyId}` : `STUDY-${Math.floor(Math.random() * 100) + 1}`;
}

// Domain-specific field generators accessible throughout the component
export const domainSpecificGenerators: Record<string, () => Record<string, any>> = {
  // SV - Subject Visits domain generator
  "SV": function() {
    const studyIdentifier = getStudyIdentifier(1); // Default to study 1 if no specific study provided
    const visitDate = new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000);
    const scheduledDate = new Date(visitDate.getTime() - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
    const visitNum = Math.floor(Math.random() * visitNames.length);
    const visit = visitNames[visitNum];
    const pageName = ["SCREENING", "DEMOGRAPHICS", "VITALS", "LABS", "ADVERSE EVENTS", "STUDY COMPLETION"][Math.floor(Math.random() * 6)];
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "SV",
      USUBJID: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      VISITNUM: visitNum + 1,
      VISIT: visit,
      VISITDY: (visitNum + 1) * 28, // Approximate days since first dose
      SVSTATUS: ["COMPLETED", "MISSED", "PARTIAL", "SCHEDULED", "NOT DONE"][Math.floor(Math.random() * 5)],
      SVSTDY: Math.floor(Math.random() * 365) + 1,
      SVENDTC: visitDate.toISOString().split('T')[0],
      SVSTDTC: visitDate.toISOString().split('T')[0],
      SVUPDDTC: new Date(visitDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      SVSCHDT: scheduledDate.toISOString().split('T')[0],
      SVREASND: Math.random() > 0.8 ? ["PATIENT WITHDREW", "STUDY TERMINATED", "ADVERSE EVENT", "SCHEDULING CONFLICT", "PATIENT UNAVAILABLE"][Math.floor(Math.random() * 5)] : "",
      SVACTDY: (visitNum + 1) * 28 + Math.floor(Math.random() * 7) - 3, // Actual day with some variance
      SVENDY: (visitNum + 1) * 28 + Math.floor(Math.random() * 4), // End day for multi-day visits
      SVCPEVENT: ["Y", "N"][Math.floor(Math.random() * 2)],
      SVREFID: `VISIT-${Math.floor(Math.random() * 1000) + 1}`,
      PAGENAME: pageName,
      PAGESEQ: Math.floor(Math.random() * 5) + 1,
      SVENRF: visit,
      SVDUR: Math.floor(Math.random() * 8) + 1, // Duration in hours
      SITEID: `SITE-${Math.floor(Math.random() * 10) + 1}`
    };
  },
  
  // DM - Demographics domain generator
  "DM": function() {
    const studyIdentifier = getStudyIdentifier(1);
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000);
    const endDate = Math.random() > 0.2 ? new Date(Date.now() - Math.floor(Math.random() * 100) * 24 * 60 * 60 * 1000) : null;
    const icdDate = new Date(startDate.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const isDeath = Math.random() > 0.95;
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "DM",
      USUBJID: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      SUBJID: subjectIds[Math.floor(Math.random() * subjectIds.length)].split('-')[1],
      RFSTDTC: startDate.toISOString().split('T')[0],
      RFENDTC: endDate ? endDate.toISOString().split('T')[0] : "",
      RFXSTDTC: new Date(startDate.getTime() + Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      RFXENDTC: endDate ? new Date(endDate.getTime() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      RFICDTC: icdDate.toISOString().split('T')[0],
      RFPENDTC: endDate ? endDate.toISOString().split('T')[0] : "",
      DTHDTC: isDeath ? (endDate || new Date()).toISOString().split('T')[0] : "",
      DTHFL: isDeath ? "Y" : "N",
      SITEID: `SITE-${Math.floor(Math.random() * 10) + 1}`,
      AGE: Math.floor(Math.random() * 60) + 18,
      AGEU: "YEARS",
      SEX: ["M", "F"][Math.floor(Math.random() * 2)],
      RACE: ["WHITE", "BLACK OR AFRICAN AMERICAN", "ASIAN", "NATIVE HAWAIIAN OR PACIFIC ISLANDER", "AMERICAN INDIAN OR ALASKA NATIVE", "OTHER"][Math.floor(Math.random() * 6)],
      ETHNIC: ["HISPANIC OR LATINO", "NOT HISPANIC OR LATINO", "UNKNOWN"][Math.floor(Math.random() * 3)],
      ARMCD: ["ARM1", "ARM2", "ARM3"][Math.floor(Math.random() * 3)],
      ARM: ["Treatment A", "Treatment B", "Placebo"][Math.floor(Math.random() * 3)],
      COUNTRY: ["USA", "CAN", "GBR", "FRA", "DEU"][Math.floor(Math.random() * 5)],
      BRTHDTC: new Date(Date.now() - (Math.floor(Math.random() * 40) + 25) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      DMDTC: icdDate.toISOString().split('T')[0],
      DMDY: -Math.floor(Math.random() * 10) - 1
    };
  },
  
  // AE - Adverse Events domain generator
  "AE": function() {
    const studyIdentifier = getStudyIdentifier(1);
    const aeTerms = [
      { AETERM: "HEADACHE", AEDECOD: "HEADACHE", AEBODSYS: "NERVOUS SYSTEM DISORDERS" },
      { AETERM: "NAUSEA", AEDECOD: "NAUSEA", AEBODSYS: "GASTROINTESTINAL DISORDERS" },
      { AETERM: "FATIGUE", AEDECOD: "FATIGUE", AEBODSYS: "GENERAL DISORDERS" },
      { AETERM: "DIARRHEA", AEDECOD: "DIARRHEA", AEBODSYS: "GASTROINTESTINAL DISORDERS" },
      { AETERM: "VOMITING", AEDECOD: "VOMITING", AEBODSYS: "GASTROINTESTINAL DISORDERS" }
    ];
    
    const selectedAE = aeTerms[Math.floor(Math.random() * aeTerms.length)];
    const startDate = new Date(Date.now() - Math.floor(Math.random() * 200) * 24 * 60 * 60 * 1000);
    const endDate = Math.random() > 0.3 ? new Date(startDate.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) : null;
    const severity = ["MILD", "MODERATE", "SEVERE"][Math.floor(Math.random() * 3)];
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "AE",
      USUBJID: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      AESEQ: Math.floor(Math.random() * 10) + 1,
      AESPID: `AESPID-${Math.floor(Math.random() * 100) + 1}`,
      AETERM: selectedAE.AETERM,
      AEDECOD: selectedAE.AEDECOD,
      AEBODSYS: selectedAE.AEBODSYS,
      AESEV: severity,
      AESER: ["Y", "N"][Math.floor(Math.random() * 2)],
      AESTDTC: startDate.toISOString().split('T')[0],
      AEENDTC: endDate ? endDate.toISOString().split('T')[0] : "",
      AESTDY: Math.floor(Math.random() * 100) + 1
    };
  },
  
  // LB - Laboratory Test Results domain generator
  "LB": function() {
    const studyIdentifier = getStudyIdentifier(1);
    const labTests = [
      { LBTESTCD: "HGB", LBTEST: "Hemoglobin", LBORRESU: "g/dL", LBORNRLO: 12.0, LBORNRHI: 16.0 },
      { LBTESTCD: "WBC", LBTEST: "White Blood Cells", LBORRESU: "10^9/L", LBORNRLO: 4.0, LBORNRHI: 11.0 },
      { LBTESTCD: "PLT", LBTEST: "Platelets", LBORRESU: "10^9/L", LBORNRLO: 150, LBORNRHI: 400 },
      { LBTESTCD: "GLUC", LBTEST: "Glucose", LBORRESU: "mg/dL", LBORNRLO: 70, LBORNRHI: 110 }
    ];
    
    const selectedTest = labTests[Math.floor(Math.random() * labTests.length)];
    const labDate = new Date(Date.now() - Math.floor(Math.random() * 300) * 24 * 60 * 60 * 1000);
    const visitNum = Math.floor(Math.random() * visitNames.length);
    const value = selectedTest.LBORNRLO + Math.random() * (selectedTest.LBORNRHI - selectedTest.LBORNRLO) * 1.5;
    const isAbnormal = value < selectedTest.LBORNRLO || value > selectedTest.LBORNRHI;
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "LB",
      USUBJID: subjectIds[Math.floor(Math.random() * subjectIds.length)],
      LBSEQ: Math.floor(Math.random() * 20) + 1,
      LBTESTCD: selectedTest.LBTESTCD,
      LBTEST: selectedTest.LBTEST,
      LBCAT: ["HEMATOLOGY", "CHEMISTRY", "URINALYSIS", "COAGULATION"][Math.floor(Math.random() * 4)],
      LBORRES: value.toFixed(1),
      LBORRESU: selectedTest.LBORRESU,
      LBORNRLO: selectedTest.LBORNRLO,
      LBORNRHI: selectedTest.LBORNRHI,
      LBNRIND: isAbnormal ? (value < selectedTest.LBORNRLO ? "LOW" : "HIGH") : "NORMAL",
      LBSTAT: Math.random() > 0.95 ? "NOT DONE" : "",
      LBREASND: Math.random() > 0.95 ? "SAMPLE HEMOLYZED" : "",
      LBDTC: labDate.toISOString().split('T')[0],
      LBDY: Math.floor(Math.random() * 300) + 1,
      VISITNUM: visitNum + 1,
      VISIT: visitNames[visitNum]
    };
  },
  
  // AUDIT domain for audit data
  "AUDIT": function() {
    const studyIdentifier = getStudyIdentifier(1);
    const auditActions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "VIEW"];
    const auditStatuses = ["SUCCESS", "FAILURE", "WARNING"];
    const action = auditActions[Math.floor(Math.random() * auditActions.length)];
    const auditDate = new Date(Date.now() - Math.floor(Math.random() * 100) * 24 * 60 * 60 * 1000);
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "AUDIT",
      AUDITID: `AUDIT-${Math.floor(Math.random() * 1000) + 1}`,
      AUDITUSER: `user${Math.floor(Math.random() * 20) + 1}`,
      AUDITDTC: auditDate.toISOString(),
      AUDITACTION: action,
      AUDITREC: `${["PATIENT", "FORM", "QUERY", "SUBJECT", "VISIT"][Math.floor(Math.random() * 5)]}-${Math.floor(Math.random() * 100) + 1}`,
      AUDITDESC: `${action} operation on ${["patient data", "form data", "query", "subject data", "visit data"][Math.floor(Math.random() * 5)]}`,
      AUDITSTATUS: auditStatuses[Math.floor(Math.random() * auditStatuses.length)],
      AUDITREAS: action === "UPDATE" ? `Updating ${["demographic", "lab", "adverse event", "concomitant medication", "vital sign"][Math.floor(Math.random() * 5)]} data` : "",
      AUDITIP: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      AUDITSYS: ["EDC", "IRT", "CTMS", "eTMF", "Safety DB"][Math.floor(Math.random() * 5)]
    };
  },
  
  // FORM_AUDIT domain for form versioning audit data
  "FORM_AUDIT": function() {
    const studyIdentifier = getStudyIdentifier(1);
    const versions = ["1.0", "1.1", "1.2", "2.0", "2.1"];
    const actions = ["CREATE", "UPDATE", "PUBLISH", "ARCHIVE"];
    const formTypes = ["DEMOGRAPHICS", "VITAL SIGNS", "LABORATORY", "ADVERSE EVENTS", "CONCOMITANT MEDICATIONS", "MEDICAL HISTORY"];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const formType = formTypes[Math.floor(Math.random() * formTypes.length)];
    const currentVersion = versions[Math.floor(Math.random() * versions.length)];
    const prevVersion = action !== "CREATE" ? versions[Math.floor(Math.random() * Math.max(versions.indexOf(currentVersion), 1))] : "";
    const auditDate = new Date(Date.now() - Math.floor(Math.random() * 500) * 24 * 60 * 60 * 1000);
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "FORM_AUDIT",
      FORMID: `FORM-${Math.floor(Math.random() * 100) + 1}`,
      FORMNAME: `${formType} FORM`,
      FORMTYPE: formType,
      FORMACTION: action,
      FORMUSER: `user${Math.floor(Math.random() * 20) + 1}`,
      FORMDTC: auditDate.toISOString(),
      FORMSTATUS: ["DRAFT", "IN REVIEW", "APPROVED", "PUBLISHED", "ARCHIVED"][Math.floor(Math.random() * 5)],
      FORMVERSION: currentVersion,
      FORMPREVVERSION: prevVersion,
      FORMCHANGE: action === "UPDATE" ? `Updated ${["field labels", "field validations", "form structure", "skip patterns", "edit checks"][Math.floor(Math.random() * 5)]}` : "",
      FORMREASON: action === "UPDATE" ? `Change requested by ${["Sponsor", "Data Manager", "CRA", "Site", "Regulatory"][Math.floor(Math.random() * 5)]}` : ""
    };
  },
  
  // CTMS_STUDY domain for CTMS study data
  "CTMS_STUDY": function() {
    const studyIdentifier = getStudyIdentifier(1);
    const phases = ["I", "II", "III", "IV", "I/II", "II/III"];
    const statuses = ["PLANNED", "ACTIVE", "COMPLETED", "SUSPENDED", "TERMINATED"];
    const designs = ["RANDOMIZED", "OPEN-LABEL", "DOUBLE-BLIND", "CROSSOVER", "PARALLEL"];
    
    return {
      STUDYID: studyIdentifier,
      DOMAIN: "CTMS_STUDY",
      PROTOCOL: `PROTOCOL-${Math.floor(Math.random() * 1000)}`,
      TITLE: `Study of Treatment in ${Math.random() > 0.5 ? "Diabetes" : "Hypertension"} Patients`,
      PHASE: phases[Math.floor(Math.random() * phases.length)],
      STATUS: statuses[Math.floor(Math.random() * statuses.length)],
      DESIGN: designs[Math.floor(Math.random() * designs.length)],
      SPONSORID: `SPONSOR-${Math.floor(Math.random() * 100)}`,
      SPONSORNAME: ["Pfizer", "Novartis", "Roche", "Merck", "AstraZeneca"][Math.floor(Math.random() * 5)],
      INDICATION: Math.random() > 0.5 ? "Type 2 Diabetes" : "Hypertension",
      STARTDATE: new Date(Date.now() - Math.floor(Math.random() * 1000) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ENDDATE: Math.random() > 0.3 ? new Date(Date.now() + Math.floor(Math.random() * 1000) * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : "",
      ENROLLMENT: Math.floor(Math.random() * 1000) + 100,
      ENROLLMENTGOAL: Math.floor(Math.random() * 1000) + 200
    };
  }
};

// Mock function to generate a set of domain data records
export function generateMockDomainData(domain: string, studyId: number, dataSource: string, count: number = 50): any[] {
  const mockData = [];
  const generator = domainSpecificGenerators[domain];
  
  if (generator) {
    for (let i = 0; i < count; i++) {
      mockData.push({
        id: i + 1,
        trialId: studyId,
        domain: domain,
        source: dataSource,
        recordId: `MOCK-${domain}-${i + 1}`,
        recordData: JSON.stringify(generator()),
        importedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
  
  return mockData;
}