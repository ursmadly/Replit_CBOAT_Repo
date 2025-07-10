#!/bin/bash
# Script to add signals for trials

echo "Adding signals for all studies..."

# Diabetes Trial (TRIAL_ID 1) - Additional 3 signals
curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "CON_Risk_042",
  "title": "Consent Procedure Irregularities",
  "trialId": 1,
  "siteId": 1,
  "dataReference": "Informed Consent Documentation",
  "observation": "Multiple consents showing same signature date but different witness initials",
  "priority": "High",
  "status": "initiated",
  "assignedTo": "John Carter",
  "createdBy": "Quality Monitor",
  "notifiedPersons": ["Compliance Officer", "CRA Lead"]
}'
echo "Creating signal: CON_Risk_042 - Consent Procedure Irregularities"
echo "Successfully created signal: CON_Risk_042"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "DM_Risk_089",
  "title": "Query Aging Beyond Protocol Limit",
  "trialId": 1,
  "siteId": 2,
  "dataReference": "EDC Query Report",
  "observation": "Over 30% of queries have remained open for more than 14 days at Site 145",
  "priority": "Medium",
  "status": "in_progress",
  "assignedTo": "Lisa Wong",
  "createdBy": "Data Manager",
  "notifiedPersons": ["CRA", "Site Manager"]
}'
echo "Creating signal: DM_Risk_089 - Query Aging Beyond Protocol Limit"
echo "Successfully created signal: DM_Risk_089"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "IRB_Risk_061",
  "title": "Missing IRB Renewal Documentation",
  "trialId": 1,
  "siteId": 3,
  "dataReference": "IRB Documentation",
  "observation": "Annual IRB renewal documentation not received from Eastside Research Clinic",
  "priority": "High",
  "status": "not_started",
  "assignedTo": "Mark Johnson",
  "createdBy": "Regulatory Affairs",
  "notifiedPersons": ["Site Manager", "Regulatory Lead"]
}'
echo "Creating signal: IRB_Risk_061 - Missing IRB Renewal Documentation"
echo "Successfully created signal: IRB_Risk_061"

# Rheumatoid Arthritis Trial (TRIAL_ID 2) - 10 signals

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "ST_Risk_002",
  "title": "Elevated Subject Withdrawal Rate",
  "trialId": 2,
  "siteId": 4,
  "dataReference": "Patient Withdrawal Forms",
  "observation": "Site 201 has 35% higher subject withdrawal rate than other sites",
  "priority": "Critical",
  "status": "initiated",
  "assignedTo": "Lisa Wong",
  "createdBy": "System",
  "notifiedPersons": ["Trial Manager", "Safety Monitor"]
}'
echo "Creating signal: ST_Risk_002 - Elevated Subject Withdrawal Rate"
echo "Successfully created signal: ST_Risk_002"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "SAF_Risk_112",
  "title": "Unexpected AE Clustering",
  "trialId": 2,
  "siteId": 5,
  "dataReference": "Safety Database",
  "observation": "Clustering of unexpected gastrointestinal adverse events at Atlanta Research Group",
  "priority": "Critical",
  "status": "in_progress",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "Safety Officer",
  "notifiedPersons": ["Medical Monitor", "Principal Investigator"]
}'
echo "Creating signal: SAF_Risk_112 - Unexpected AE Clustering"
echo "Successfully created signal: SAF_Risk_112"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "PD_Risk_143",
  "title": "Protocol Deviation - Medication Storage",
  "trialId": 2,
  "siteId": 4,
  "dataReference": "Monitoring Reports",
  "observation": "Temperature excursions found in medication storage logs at Northwestern Medical Partners",
  "priority": "High",
  "status": "initiated",
  "assignedTo": "John Carter",
  "createdBy": "CRA",
  "notifiedPersons": ["Site Manager", "Principal Investigator"]
}'
echo "Creating signal: PD_Risk_143 - Protocol Deviation - Medication Storage"
echo "Successfully created signal: PD_Risk_143"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "DM_Risk_203",
  "title": "EDC Source Verification Issues",
  "trialId": 2,
  "siteId": 5,
  "dataReference": "EDC System Logs",
  "observation": "Source verification issues found in >15% of entered data at Atlanta Research Group",
  "priority": "Medium",
  "status": "not_started",
  "assignedTo": "Mark Johnson",
  "createdBy": "Data Manager",
  "notifiedPersons": ["CRA", "QA Manager"]
}'
echo "Creating signal: DM_Risk_203 - EDC Source Verification Issues"
echo "Successfully created signal: DM_Risk_203"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "CON_Risk_074",
  "title": "Missing Informed Consent Elements",
  "trialId": 2,
  "siteId": 4,
  "dataReference": "ICF Audit",
  "observation": "Three ICFs missing required signature from legally authorized representative",
  "priority": "High",
  "status": "in_progress",
  "assignedTo": "Lisa Wong",
  "createdBy": "Quality Monitor",
  "notifiedPersons": ["Regulatory Affairs", "Principal Investigator"]
}'
echo "Creating signal: CON_Risk_074 - Missing Informed Consent Elements"
echo "Successfully created signal: CON_Risk_074"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "ENR_Risk_096",
  "title": "Slow Enrollment Rate",
  "trialId": 2,
  "siteId": 5,
  "dataReference": "Enrollment Tracker",
  "observation": "Site is 40% below target enrollment rate for Q2",
  "priority": "Medium",
  "status": "initiated",
  "assignedTo": "John Carter",
  "createdBy": "Project Manager",
  "notifiedPersons": ["CRA", "Site Manager"]
}'
echo "Creating signal: ENR_Risk_096 - Slow Enrollment Rate"
echo "Successfully created signal: ENR_Risk_096"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "LAB_Risk_157",
  "title": "Lab Sample Integrity Issues",
  "trialId": 2,
  "siteId": 4,
  "dataReference": "Central Lab Reports",
  "observation": "Multiple samples from Northwestern Medical Partners showing hemolysis",
  "priority": "Medium",
  "status": "not_started",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "Lab Manager",
  "notifiedPersons": ["Principal Investigator", "CRA"]
}'
echo "Creating signal: LAB_Risk_157 - Lab Sample Integrity Issues"
echo "Successfully created signal: LAB_Risk_157"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "MED_Risk_065",
  "title": "Medication Compliance Issues",
  "trialId": 2,
  "siteId": 5,
  "dataReference": "Patient Diaries",
  "observation": "Patient diaries indicate <80% compliance with medication schedule at Atlanta Research Group",
  "priority": "High",
  "status": "in_progress",
  "assignedTo": "Mark Johnson",
  "createdBy": "Clinical Monitor",
  "notifiedPersons": ["Principal Investigator", "Medical Monitor"]
}'
echo "Creating signal: MED_Risk_065 - Medication Compliance Issues"
echo "Successfully created signal: MED_Risk_065"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "MON_Risk_029",
  "title": "Monitoring Visit Delays",
  "trialId": 2,
  "siteId": 4,
  "dataReference": "Monitoring Schedule",
  "observation": "Three consecutive monitoring visits delayed by >30 days",
  "priority": "Medium",
  "status": "initiated",
  "assignedTo": "Lisa Wong",
  "createdBy": "Project Manager",
  "notifiedPersons": ["CRA Lead", "Site Manager"]
}'
echo "Creating signal: MON_Risk_029 - Monitoring Visit Delays"
echo "Successfully created signal: MON_Risk_029"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "QC_Risk_118",
  "title": "Data Quality Issues",
  "trialId": 2,
  "siteId": 5,
  "dataReference": "Data Quality Reports",
  "observation": "Data quality metrics below threshold for 2 consecutive months",
  "priority": "Medium",
  "status": "not_started",
  "assignedTo": "John Carter",
  "createdBy": "Data Manager",
  "notifiedPersons": ["QA Manager", "CRA"]
}'
echo "Creating signal: QC_Risk_118 - Data Quality Issues"
echo "Successfully created signal: QC_Risk_118"

# Breast Cancer Trial (TRIAL_ID 3) - 10 signals

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "ST_Risk_003",
  "title": "Protocol Compliance Issue",
  "trialId": 3,
  "siteId": 6,
  "dataReference": "Monitoring Reports",
  "observation": "MD Anderson Cancer Center has multiple violations of inclusion criteria",
  "priority": "Critical",
  "status": "initiated",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "System",
  "notifiedPersons": ["Medical Director", "Principal Investigator"]
}'
echo "Creating signal: ST_Risk_003 - Protocol Compliance Issue"
echo "Successfully created signal: ST_Risk_003"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "SAF_Risk_176",
  "title": "Unexpected Serious Adverse Event Pattern",
  "trialId": 3,
  "siteId": 7,
  "dataReference": "Safety Database",
  "observation": "Pattern of unexpected cardiac events at UCLA Medical Center",
  "priority": "Critical",
  "status": "in_progress",
  "assignedTo": "John Carter",
  "createdBy": "Safety Officer",
  "notifiedPersons": ["Medical Monitor", "Principal Investigator"]
}'
echo "Creating signal: SAF_Risk_176 - Unexpected Serious Adverse Event Pattern"
echo "Successfully created signal: SAF_Risk_176"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "LAB_Risk_232",
  "title": "Missing Biomarker Data",
  "trialId": 3,
  "siteId": 8,
  "dataReference": "Central Lab Reports",
  "observation": "Missing HER2 expression data for 7 patients at Memorial Sloan Kettering",
  "priority": "High",
  "status": "not_started",
  "assignedTo": "Lisa Wong",
  "createdBy": "Lab Manager",
  "notifiedPersons": ["Data Manager", "Principal Investigator"]
}'
echo "Creating signal: LAB_Risk_232 - Missing Biomarker Data"
echo "Successfully created signal: LAB_Risk_232"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "IMP_Risk_089",
  "title": "Investigational Product Storage Deviation",
  "trialId": 3,
  "siteId": 6,
  "dataReference": "IP Logs",
  "observation": "Temperature excursion in IP storage at MD Anderson Cancer Center",
  "priority": "Medium",
  "status": "initiated",
  "assignedTo": "Mark Johnson",
  "createdBy": "Clinical Supplies Manager",
  "notifiedPersons": ["Site Manager", "CRA"]
}'
echo "Creating signal: IMP_Risk_089 - Investigational Product Storage Deviation"
echo "Successfully created signal: IMP_Risk_089"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "DM_Risk_321",
  "title": "EDC Data Entry Delays",
  "trialId": 3,
  "siteId": 7,
  "dataReference": "EDC System Reports",
  "observation": "UCLA Medical Center has >15 day delay in entering critical efficacy data",
  "priority": "High",
  "status": "in_progress",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "Data Manager",
  "notifiedPersons": ["CRA", "Site Manager"]
}'
echo "Creating signal: DM_Risk_321 - EDC Data Entry Delays"
echo "Successfully created signal: DM_Risk_321"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "CON_Risk_167",
  "title": "Re-consent Process Issues",
  "trialId": 3,
  "siteId": 8,
  "dataReference": "ICF Documentation",
  "observation": "Re-consent not obtained for protocol amendment at Memorial Sloan Kettering",
  "priority": "Critical",
  "status": "initiated",
  "assignedTo": "John Carter",
  "createdBy": "Regulatory Affairs",
  "notifiedPersons": ["Principal Investigator", "IRB Liaison"]
}'
echo "Creating signal: CON_Risk_167 - Re-consent Process Issues"
echo "Successfully created signal: CON_Risk_167"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "ENR_Risk_245",
  "title": "Slow Enrollment - Diversity Criteria",
  "trialId": 3,
  "siteId": 6,
  "dataReference": "Enrollment Data",
  "observation": "Site failing to meet diversity enrollment targets by >50%",
  "priority": "Medium",
  "status": "not_started",
  "assignedTo": "Lisa Wong",
  "createdBy": "Project Manager",
  "notifiedPersons": ["Principal Investigator", "CRA"]
}'
echo "Creating signal: ENR_Risk_245 - Slow Enrollment - Diversity Criteria"
echo "Successfully created signal: ENR_Risk_245"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "MON_Risk_128",
  "title": "Source Document Discrepancies",
  "trialId": 3,
  "siteId": 7,
  "dataReference": "Monitoring Reports",
  "observation": "Source document verification found >20% discrepancies at UCLA Medical Center",
  "priority": "High",
  "status": "in_progress",
  "assignedTo": "Mark Johnson",
  "createdBy": "CRA",
  "notifiedPersons": ["Data Manager", "Site Manager"]
}'
echo "Creating signal: MON_Risk_128 - Source Document Discrepancies"
echo "Successfully created signal: MON_Risk_128"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "SAF_Risk_198",
  "title": "Delayed SAE Reporting",
  "trialId": 3,
  "siteId": 8,
  "dataReference": "Safety Reports",
  "observation": "Multiple SAEs reported outside the 24-hour reporting window at Memorial Sloan Kettering",
  "priority": "Critical",
  "status": "initiated",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "Safety Officer",
  "notifiedPersons": ["Medical Monitor", "Regulatory Affairs"]
}'
echo "Creating signal: SAF_Risk_198 - Delayed SAE Reporting"
echo "Successfully created signal: SAF_Risk_198"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "QC_Risk_276",
  "title": "Protocol Deviation Clustering",
  "trialId": 3,
  "siteId": 6,
  "dataReference": "Quality Reports",
  "observation": "Cluster of protocol deviations related to dosing schedule at MD Anderson Cancer Center",
  "priority": "High",
  "status": "not_started",
  "assignedTo": "John Carter",
  "createdBy": "Quality Manager",
  "notifiedPersons": ["Principal Investigator", "Clinical Operations"]
}'
echo "Creating signal: QC_Risk_276 - Protocol Deviation Clustering"
echo "Successfully created signal: QC_Risk_276"

# Alzheimer's Disease Trial (TRIAL_ID 4) - 10 signals

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "ST_Risk_004",
  "title": "Biomarker Collection Issues",
  "trialId": 4,
  "dataReference": "Central Lab Data",
  "observation": "Inconsistent biomarker collection technique identified across multiple sites",
  "priority": "High",
  "status": "initiated",
  "assignedTo": "Lisa Wong",
  "createdBy": "System",
  "notifiedPersons": ["Medical Monitor", "Lab Director"]
}'
echo "Creating signal: ST_Risk_004 - Biomarker Collection Issues"
echo "Successfully created signal: ST_Risk_004"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "MRI_Risk_056",
  "title": "MRI Protocol Deviations",
  "trialId": 4,
  "dataReference": "Imaging Reports",
  "observation": "Multiple sites using incorrect MRI sequences for assessment",
  "priority": "Critical",
  "status": "in_progress",
  "assignedTo": "Mark Johnson",
  "createdBy": "Imaging Manager",
  "notifiedPersons": ["Medical Director", "Site Managers"]
}'
echo "Creating signal: MRI_Risk_056 - MRI Protocol Deviations"
echo "Successfully created signal: MRI_Risk_056"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "ENR_Risk_189",
  "title": "Inclusion Criteria Adherence Issues",
  "trialId": 4,
  "dataReference": "Screening Reports",
  "observation": "25% of screened patients falling outside cognitive assessment scores range",
  "priority": "High",
  "status": "not_started",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "Clinical Operations",
  "notifiedPersons": ["Medical Monitor", "Site Coordinators"]
}'
echo "Creating signal: ENR_Risk_189 - Inclusion Criteria Adherence Issues"
echo "Successfully created signal: ENR_Risk_189"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "COG_Risk_214",
  "title": "Cognitive Assessment Variability",
  "trialId": 4,
  "dataReference": "Assessment Data",
  "observation": "High inter-rater variability in cognitive assessments across sites",
  "priority": "Medium",
  "status": "initiated",
  "assignedTo": "John Carter",
  "createdBy": "Neuropsychologist",
  "notifiedPersons": ["Medical Director", "Site Trainers"]
}'
echo "Creating signal: COG_Risk_214 - Cognitive Assessment Variability"
echo "Successfully created signal: COG_Risk_214"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "PET_Risk_073",
  "title": "PET Scan Scheduling Delays",
  "trialId": 4,
  "dataReference": "Imaging Schedule",
  "observation": "Consistent delays of >14 days in scheduling follow-up PET scans",
  "priority": "Medium",
  "status": "in_progress",
  "assignedTo": "Lisa Wong",
  "createdBy": "Imaging Coordinator",
  "notifiedPersons": ["Site Managers", "Clinical Operations"]
}'
echo "Creating signal: PET_Risk_073 - PET Scan Scheduling Delays"
echo "Successfully created signal: PET_Risk_073"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "DB_Risk_142",
  "title": "Database Lock Risk",
  "trialId": 4,
  "dataReference": "Data Management Reports",
  "observation": "Study setup phase showing >30% missing data elements in eCRF design",
  "priority": "High",
  "status": "not_started",
  "assignedTo": "Mark Johnson",
  "createdBy": "Data Manager",
  "notifiedPersons": ["Clinical Operations", "Database Administrator"]
}'
echo "Creating signal: DB_Risk_142 - Database Lock Risk"
echo "Successfully created signal: DB_Risk_142"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "SAF_Risk_225",
  "title": "Caregiver Reporting Inconsistencies",
  "trialId": 4,
  "dataReference": "Safety Reports",
  "observation": "Discrepancies between patient and caregiver adverse event reporting",
  "priority": "Medium",
  "status": "initiated",
  "assignedTo": "Maria Rodriguez",
  "createdBy": "Safety Officer",
  "notifiedPersons": ["Medical Monitor", "Site Coordinators"]
}'
echo "Creating signal: SAF_Risk_225 - Caregiver Reporting Inconsistencies"
echo "Successfully created signal: SAF_Risk_225"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "REG_Risk_098",
  "title": "Regulatory Documentation Gaps",
  "trialId": 4,
  "dataReference": "Regulatory Files",
  "observation": "Multiple sites with incomplete regulatory documentation before study start",
  "priority": "High",
  "status": "in_progress",
  "assignedTo": "John Carter",
  "createdBy": "Regulatory Affairs",
  "notifiedPersons": ["Clinical Operations", "Site Managers"]
}'
echo "Creating signal: REG_Risk_098 - Regulatory Documentation Gaps"
echo "Successfully created signal: REG_Risk_098"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "QC_Risk_183",
  "title": "Rater Certification Issues",
  "trialId": 4,
  "dataReference": "Training Records",
  "observation": "30% of cognitive assessment raters requiring recertification before study start",
  "priority": "Medium",
  "status": "not_started",
  "assignedTo": "Lisa Wong",
  "createdBy": "Quality Manager",
  "notifiedPersons": ["Training Lead", "Medical Monitor"]
}'
echo "Creating signal: QC_Risk_183 - Rater Certification Issues"
echo "Successfully created signal: QC_Risk_183"

curl -s -X POST http://localhost:5000/api/signaldetections -H "Content-Type: application/json" -d '{
  "detectionId": "OP_Risk_267",
  "title": "Operational Readiness Concerns",
  "trialId": 4,
  "dataReference": "Readiness Checklist",
  "observation": "Site readiness assessments indicate multiple high-risk areas before study initiation",
  "priority": "Critical",
  "status": "initiated",
  "assignedTo": "Mark Johnson",
  "createdBy": "Project Manager",
  "notifiedPersons": ["Clinical Operations", "Study Director"]
}'
echo "Creating signal: OP_Risk_267 - Operational Readiness Concerns"
echo "Successfully created signal: OP_Risk_267"

echo "Signal creation script completed."