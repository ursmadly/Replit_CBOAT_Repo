import { AnalysisResults } from "@/components/ai-assistants/DMAssistant";
import { ConversationMessage } from "@/components/ai-assistants/ConversationalDMAssistant";
import { addDays } from "date-fns";

interface Query {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  dataSources: string[];
  status: 'new' | 'assigned' | 'in-review' | 'resolved';
  studyId: number;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  contact?: string;
  lastNotified?: Date;
  notificationStatus?: 'pending' | 'sent' | 'read';
  referenceData?: string;
  overdueStatus?: 'on-time' | 'due-soon' | 'overdue';
  // Workflow tracking
  workflowStatus?: 'pending' | 'in-progress' | 'completed';
  lastWorkflowUpdate?: Date;
  workflowSteps?: QueryWorkflowStep[];
  resolutionMethod?: 'manual' | 'auto-corrected' | 'not-applicable';
  resolutionNotes?: string;
}

interface DataSourceMetrics {
  source: string;
  totalRecords: number;
  issueCount: number;
  queryCount: number;
  completeness: number;
  consistency: number;
  accuracyScore: number;
}

interface DataComparisonResult {
  source: string;
  totalFields: number;
  inconsistentFields: number;
  missingFields: number;
  changedSinceLastCheck: number;
  lastChecked: Date;
}

interface NotificationRecipient {
  name: string;
  email: string;
  role: string;
}

interface EmailNotification {
  recipientId: string;
  queryId: string;
  subject: string;
  body: string;
  sentAt: Date;
  status: 'pending' | 'sent' | 'read';
}

interface Schedule {
  studyId: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  notifyRecipients: string[];
}

interface QueryWorkflowStep {
  id: string;
  queryId: string;
  action: 'created' | 'assigned' | 'reviewed' | 'resolved' | 'auto-detected' | 'auto-corrected' | 'notified';
  timestamp: Date;
  user?: string;
  notes?: string;
  dataChange?: {
    before: any;
    after: any;
  };
}

interface Study {
  id: number;
  protocolId: string;
  title: string;
  phase: string;
  status: string;
  indication?: string;
  startDate: string;
  endDate?: string;
  enrolledPatients?: number;
  sites?: number;
  countries?: string[];
  sponsor?: string;
  primaryObjective?: string;
  secondaryObjectives?: string[];
  inclusionCriteria?: string[];
  exclusionCriteria?: string[];
  dataCollectionSystem?: string;
  statisticalPlan?: string;
  randomizationMethod?: string;
  dataSources?: string[];
  primaryEndpoint?: string;
  secondaryEndpoints?: string[];
}

interface ReferenceData {
  id: string;
  queryId: string;
  dataSource: string;
  recordId: string;
  patientId: string;
  visitId?: string;
  dataPoints: Record<string, any>;
  createdAt: Date;
}

class DMBotService {
  private activeQueries: Map<string, Query>;
  private resolvedQueries: Map<string, Query>;
  private metricsHistory: Map<number, { 
    date: Date, 
    metrics: { [key: string]: number } 
  }[]>;
  private emailNotifications: EmailNotification[];
  private recipientDirectory: Map<string, NotificationRecipient>;
  private lastAnalysisResults: Map<number, AnalysisResults>;
  private dataComparisons: Map<number, DataComparisonResult[]>;
  private queryIdCounter: Map<number, number>;
  private conversations: Map<number, ConversationMessage[]>;
  private schedules: Map<number, Schedule>;
  private referenceData: Map<string, ReferenceData>;
  private studies: Map<number, Study>;
  private queryWorkflowSteps: Map<string, QueryWorkflowStep[]>;

  constructor() {
    this.activeQueries = new Map();
    this.resolvedQueries = new Map();
    this.metricsHistory = new Map();
    this.emailNotifications = [];
    this.recipientDirectory = new Map();
    this.lastAnalysisResults = new Map();
    this.dataComparisons = new Map();
    this.queryIdCounter = new Map();
    this.conversations = new Map();
    this.schedules = new Map();
    this.referenceData = new Map();
    this.studies = new Map();
    this.queryWorkflowSteps = new Map();
    
    this.initializeRecipients();
    this.initializeStudies();
    this.initializeReferenceData();
    this.addExplicitNullRecords();
  }
  
  // Initialize with sample studies
  private initializeStudies(): void {
    const sampleStudies: Study[] = [
      {
        id: 1,
        protocolId: 'PRO001',
        title: 'Diabetes Type 2 Treatment Efficacy Study',
        phase: 'Phase 3',
        status: 'Active',
        indication: 'Type 2 Diabetes Mellitus',
        startDate: '2023-01-15',
        endDate: '2025-01-15',
        enrolledPatients: 120,
        sites: 24,
        countries: ['United States', 'Canada', 'Germany', 'United Kingdom', 'France'],
        sponsor: 'PharmaCo Therapeutics',
        primaryObjective: 'Evaluate the efficacy of study drug XYZ-123 in reducing HbA1c levels in patients with Type 2 Diabetes',
        secondaryObjectives: [
          'Assess safety and tolerability of XYZ-123',
          'Evaluate effects on fasting plasma glucose',
          'Measure impact on body weight',
          'Evaluate patient-reported outcomes'
        ],
        inclusionCriteria: [
          'Adult patients aged 18-75',
          'Diagnosed with Type 2 Diabetes for at least 6 months',
          'HbA1c levels between 7.0% and 10.0%',
          'BMI between 25 and 40 kg/m²'
        ],
        exclusionCriteria: [
          'History of Type 1 Diabetes',
          'Recent cardiovascular event within 6 months',
          'Severe renal impairment',
          'Current use of insulin therapy'
        ],
        dataCollectionSystem: 'Medidata Rave',
        statisticalPlan: 'Mixed-effects model for repeated measures (MMRM)',
        randomizationMethod: 'Stratified block randomization',
        dataSources: ['EDC', 'Lab', 'CTMS', 'Imaging', 'ePRO'],
        primaryEndpoint: 'Change in HbA1c from baseline to week 26',
        secondaryEndpoints: [
          'Percentage of patients achieving HbA1c <7.0%',
          'Change in fasting plasma glucose',
          'Change in body weight',
          'Incidence of adverse events'
        ]
      },
      {
        id: 2,
        protocolId: 'PRO002',
        title: 'Cardiovascular Outcomes Trial',
        phase: 'Phase 4',
        status: 'Active',
        indication: 'Hypertension',
        startDate: '2022-09-10',
        endDate: '2025-09-10',
        enrolledPatients: 245,
        sites: 36,
        countries: ['United States', 'Canada', 'Brazil', 'France', 'Germany', 'Italy', 'Japan'],
        sponsor: 'CardioHealth Pharma',
        primaryObjective: 'Evaluate the long-term cardiovascular outcomes of treatment with ABC-456 in patients with hypertension',
        secondaryObjectives: [
          'Assess effect on blood pressure control',
          'Evaluate renal function over time',
          'Measure incidence of hospitalization for heart failure',
          'Assess all-cause mortality'
        ],
        inclusionCriteria: [
          'Adults aged 40-85 with hypertension',
          'History of cardiovascular disease or high risk factors',
          'Systolic blood pressure ≥140 mmHg or diastolic blood pressure ≥90 mmHg'
        ],
        dataCollectionSystem: 'Oracle InForm',
        dataSources: ['EDC', 'Lab', 'CTMS', 'ECG', 'Claims Data'],
        primaryEndpoint: 'Time to first occurrence of major adverse cardiovascular event (MACE)'
      },
      {
        id: 3,
        protocolId: 'PRO003',
        title: 'Immunotherapy for Advanced Melanoma',
        phase: 'Phase 2',
        status: 'Active',
        indication: 'Metastatic Melanoma',
        startDate: '2023-03-21',
        enrolledPatients: 85,
        sites: 18,
        countries: ['United States', 'Australia', 'United Kingdom', 'Germany'],
        sponsor: 'OncoBiotech',
        primaryObjective: 'Assess the efficacy of immunotherapy agent IMM-789 in patients with advanced melanoma',
        secondaryObjectives: [
          'Evaluate progression-free survival',
          'Assess overall survival',
          'Measure tumor response rate',
          'Evaluate safety and tolerability'
        ],
        dataCollectionSystem: 'Veeva Vault EDC',
        dataSources: ['EDC', 'Lab', 'CTMS', 'Imaging', 'Biomarker Data'],
        primaryEndpoint: 'Objective response rate as assessed by RECIST v1.1'
      }
    ];
    
    sampleStudies.forEach(study => {
      this.studies.set(study.id, study);
    });
  }
  
  // Initialize with sample reference data for queries
  private initializeReferenceData(): void {
    const patientIds = ['100-001', '100-002', '100-003', '100-004', '100-005'];
    const visitIds = ['V1', 'V2', 'V3', 'V4', 'V5'];
    const study = this.studies.get(1);
    
    // Create domain-specific data samples for reference
    this.initializeDomainData('DM', patientIds, study); // Demographics
    this.initializeDomainData('SV', patientIds, study); // Subject Visits
    this.initializeDomainData('LB', patientIds, study); // Lab Results
    this.initializeDomainData('AE', patientIds, study); // Adverse Events
    this.initializeDomainData('CM', patientIds, study); // Concomitant Medications
    this.initializeDomainData('VS', patientIds, study); // Vital Signs
    this.initializeDomainData('EX', patientIds, study); // Exposure (Study Drug)
    
    // Add explicit duplicate records for testing the duplicate detection functionality
    setTimeout(() => this.addExplicitDuplicateRecords(), 500); // Adding a small delay to ensure base records exist first
  }
  
  // Add explicit duplicate records to test the duplicate detection feature
  private addExplicitDuplicateRecords(): void {
    // Duplicate demographic record for patient 100-001
    const dmDuplicate1: ReferenceData = {
      id: 'DUP-DM-001',
      queryId: '',
      dataSource: 'EDC',
      recordId: 'DM-100-001-DUP',
      patientId: '100-001',
      dataPoints: {
        domain: 'DM',
        usubjid: '100-001',
        sex: 'M',
        age: 42,
        race: 'WHITE',
        ethnic: 'NOT HISPANIC OR LATINO',
        country: 'United States',
        dmdtc: '2023-01-15',
        armcd: 'TRT',
        actarmcd: 'TRT',
        siteid: 'SITE101'
      },
      createdAt: new Date()
    };
    this.referenceData.set(dmDuplicate1.id, dmDuplicate1);
    
    // Duplicate lab records for patient 100-002
    const lbDuplicate1: ReferenceData = {
      id: 'DUP-LB-001',
      queryId: '',
      dataSource: 'Lab',
      recordId: 'LB-100-002-V1-HGB-DUP1',
      patientId: '100-002',
      visitId: 'V1',
      dataPoints: {
        domain: 'LB',
        usubjid: '100-002',
        lbtest: 'Hemoglobin',
        lbtestcd: 'HGB',
        lbdtc: '2023-02-15',
        visit: 'VISIT 1',
        visitnum: 1,
        lborres: '14.50',
        lborresu: 'g/dL',
        lbstnrlo: 12,
        lbstnrhi: 16,
        lbnrind: 'NORMAL'
      },
      createdAt: new Date()
    };
    this.referenceData.set(lbDuplicate1.id, lbDuplicate1);
    
    const lbDuplicate2: ReferenceData = {
      id: 'DUP-LB-002',
      queryId: '',
      dataSource: 'Lab',
      recordId: 'LB-100-002-V1-HGB-DUP2',
      patientId: '100-002',
      visitId: 'V1',
      dataPoints: {
        domain: 'LB',
        usubjid: '100-002',
        lbtest: 'Hemoglobin',
        lbtestcd: 'HGB',
        lbdtc: '2023-02-15',
        visit: 'VISIT 1',
        visitnum: 1,
        lborres: '14.20',
        lborresu: 'g/dL',
        lbstnrlo: 12,
        lbstnrhi: 16,
        lbnrind: 'NORMAL'
      },
      createdAt: new Date()
    };
    this.referenceData.set(lbDuplicate2.id, lbDuplicate2);
    
    // Duplicate adverse event records for patient 100-003
    const aeDuplicate1: ReferenceData = {
      id: 'DUP-AE-001',
      queryId: '',
      dataSource: 'EDC',
      recordId: 'AE-100-003-DUP1',
      patientId: '100-003',
      dataPoints: {
        domain: 'AE',
        usubjid: '100-003',
        aeterm: 'Headache',
        aestdtc: '2023-03-15',
        aeendtc: '2023-03-18',
        aesev: 'MILD',
        aeser: 'N',
        aerel: 'POSSIBLE'
      },
      createdAt: new Date()
    };
    this.referenceData.set(aeDuplicate1.id, aeDuplicate1);
    
    const aeDuplicate2: ReferenceData = {
      id: 'DUP-AE-002',
      queryId: '',
      dataSource: 'EDC',
      recordId: 'AE-100-003-DUP2',
      patientId: '100-003',
      dataPoints: {
        domain: 'AE',
        usubjid: '100-003',
        aeterm: 'Headache',
        aestdtc: '2023-03-15',
        aeendtc: '2023-03-17',
        aesev: 'MILD',
        aeser: 'N',
        aerel: 'POSSIBLE'
      },
      createdAt: new Date()
    };
    this.referenceData.set(aeDuplicate2.id, aeDuplicate2);
  }

  
  // Create domain-specific sample data
  private initializeDomainData(domain: string, patientIds: string[], study: Study | undefined): void {
    // Generate multiple records for each domain to represent a small dataset
    patientIds.forEach((patientId, index) => {
      const baseRefId = `REF-${domain}-${patientId}-${Date.now()}`;
      
      // Add some null values for testing (only for specific patients)
      const shouldHaveNulls = index === 0; // First patient will have some nulls for testing
      
      // Create domain-specific data structures
      switch(domain) {
        case 'DM': // Demographics
          const dmRefId = `${baseRefId}-DM`;
          const dmData: ReferenceData = {
            id: dmRefId,
            queryId: '',
            dataSource: 'EDC',
            recordId: `DM-${patientId}`,
            patientId: patientId,
            dataPoints: {
              domain: 'DM',
              usubjid: patientId,
              sex: Math.random() > 0.5 ? 'M' : 'F',
              age: 35 + Math.floor(Math.random() * 40),
              race: ['WHITE', 'BLACK OR AFRICAN AMERICAN', 'ASIAN', 'AMERICAN INDIAN OR ALASKA NATIVE'][Math.floor(Math.random() * 4)],
              ethnic: ['HISPANIC OR LATINO', 'NOT HISPANIC OR LATINO'][Math.floor(Math.random() * 2)],
              country: study?.countries ? study.countries[Math.floor(Math.random() * study.countries.length)] : 'United States',
              dmdtc: new Date(2023, 0, 1 + Math.floor(Math.random() * 60)).toISOString().split('T')[0],
              armcd: ['TRT', 'PBO'][Math.floor(Math.random() * 2)],
              actarmcd: ['TRT', 'PBO'][Math.floor(Math.random() * 2)],
              siteid: `SITE${100 + Math.floor(Math.random() * 20)}`
            },
            createdAt: new Date()
          };
          this.referenceData.set(dmRefId, dmData);
          break;
          
        case 'SV': // Subject Visits
          // Create multiple visit records for each patient
          for (let i = 1; i <= 5; i++) {
            const visitDate = new Date(2023, 0, 15 + (i * 30) + Math.floor(Math.random() * 5));
            const svRefId = `${baseRefId}-SV-V${i}`;
            const svData: ReferenceData = {
              id: svRefId,
              queryId: '',
              dataSource: 'EDC',
              recordId: `SV-${patientId}-V${i}`,
              patientId: patientId,
              visitId: `V${i}`,
              dataPoints: {
                domain: 'SV',
                usubjid: patientId,
                visitnum: i,
                visit: `VISIT ${i}`,
                svstdtc: visitDate.toISOString().split('T')[0],
                svendtc: new Date(visitDate.getTime() + (3600000 * 2)).toISOString().split('T')[0],
                svstatus: Math.random() > 0.1 ? 'COMPLETED' : 'MISSED',
                svreasnd: Math.random() > 0.9 ? 'PATIENT ILLNESS' : ''
              },
              createdAt: new Date()
            };
            this.referenceData.set(svRefId, svData);
          }
          break;
          
        case 'LB': // Lab Results
          // Create lab results for multiple visits
          for (let i = 1; i <= 4; i++) {
            const visitDate = new Date(2023, 0, 15 + (i * 30) + Math.floor(Math.random() * 5));
            const visitId = `V${i}`;
            
            // Create multiple lab tests per visit
            const labTests = [
              { testcd: 'HGB', test: 'Hemoglobin', result: 13 + Math.random() * 2, unit: 'g/dL', low: 12, high: 16 },
              { testcd: 'WBC', test: 'White Blood Cell Count', result: 4 + Math.random() * 6, unit: 'x10^9/L', low: 4, high: 11 },
              { testcd: 'PLT', test: 'Platelet Count', result: 150 + Math.random() * 200, unit: 'x10^9/L', low: 150, high: 400 },
              { testcd: 'CREAT', test: 'Creatinine', result: 0.6 + Math.random() * 0.6, unit: 'mg/dL', low: 0.6, high: 1.2 }
            ];
            
            labTests.forEach(test => {
              const lbRefId = `${baseRefId}-LB-${visitId}-${test.testcd}`;
              const abnormal = test.result < test.low || test.result > test.high;
              
              const lbData: ReferenceData = {
                id: lbRefId,
                queryId: '',
                dataSource: 'Lab',
                recordId: `LB-${patientId}-${visitId}-${test.testcd}`,
                patientId: patientId,
                visitId: visitId,
                dataPoints: {
                  domain: 'LB',
                  usubjid: patientId,
                  lbtest: test.test,
                  lbtestcd: test.testcd,
                  lbdtc: visitDate.toISOString().split('T')[0],
                  visit: `VISIT ${i}`,
                  visitnum: i,
                  lborres: test.result.toFixed(2),
                  lborresu: test.unit,
                  lbstnrlo: test.low,
                  lbstnrhi: test.high,
                  lbnrind: abnormal ? (test.result < test.low ? 'LOW' : 'HIGH') : 'NORMAL'
                },
                createdAt: new Date()
              };
              this.referenceData.set(lbRefId, lbData);
            });
          }
          break;
          
        case 'AE': // Adverse Events
          // Create random adverse events for some patients
          if (Math.random() > 0.3) { // 70% chance of having an AE
            const startDate = new Date(2023, 0, 20 + Math.floor(Math.random() * 60));
            const endDate = Math.random() > 0.2 ? 
                            new Date(startDate.getTime() + (86400000 * (3 + Math.floor(Math.random() * 10)))) : 
                            null;
            
            const aeRefId = `${baseRefId}-AE`;
            const aeData: ReferenceData = {
              id: aeRefId,
              queryId: '',
              dataSource: 'EDC',
              recordId: `AE-${patientId}`,
              patientId: patientId,
              dataPoints: {
                domain: 'AE',
                usubjid: patientId,
                aeterm: ['HEADACHE', 'NAUSEA', 'FATIGUE', 'DIZZINESS', 'UPPER RESPIRATORY INFECTION'][Math.floor(Math.random() * 5)],
                aestdtc: startDate.toISOString().split('T')[0],
                aeendtc: endDate ? endDate.toISOString().split('T')[0] : '',
                aesev: ['MILD', 'MODERATE', 'SEVERE'][Math.floor(Math.random() * 3)],
                aeser: Math.random() > 0.9 ? 'Y' : 'N',
                aerel: ['RELATED', 'NOT RELATED', 'POSSIBLY RELATED'][Math.floor(Math.random() * 3)],
                aeout: endDate ? 'RECOVERED/RESOLVED' : 'ONGOING'
              },
              createdAt: new Date()
            };
            this.referenceData.set(aeRefId, aeData);
          }
          break;
          
        case 'CM': // Concomitant Medications
          // Create concomitant medications for some patients
          if (Math.random() > 0.4) { // 60% chance of having conmeds
            const startDate = new Date(2023, 0, 5 + Math.floor(Math.random() * 30));
            const endDate = Math.random() > 0.5 ? 
                            new Date(startDate.getTime() + (86400000 * (10 + Math.floor(Math.random() * 20)))) : 
                            null;
            
            const cmRefId = `${baseRefId}-CM`;
            const cmData: ReferenceData = {
              id: cmRefId,
              queryId: '',
              dataSource: 'EDC',
              recordId: `CM-${patientId}`,
              patientId: patientId,
              dataPoints: {
                domain: 'CM',
                usubjid: patientId,
                cmtrt: ['ACETAMINOPHEN', 'IBUPROFEN', 'LORATADINE', 'LISINOPRIL', 'METFORMIN'][Math.floor(Math.random() * 5)],
                cmstdtc: startDate.toISOString().split('T')[0],
                cmendtc: endDate ? endDate.toISOString().split('T')[0] : '',
                cmdose: [500, 200, 10, 20, 1000][Math.floor(Math.random() * 5)],
                cmdosu: ['mg', 'mg', 'mg', 'mg', 'mg'][Math.floor(Math.random() * 5)],
                cmroute: ['ORAL', 'ORAL', 'ORAL', 'ORAL', 'ORAL'][Math.floor(Math.random() * 5)],
                cmind: ['HEADACHE', 'PAIN', 'ALLERGIES', 'HYPERTENSION', 'DIABETES'][Math.floor(Math.random() * 5)]
              },
              createdAt: new Date()
            };
            this.referenceData.set(cmRefId, cmData);
          }
          break;
          
        case 'VS': // Vital Signs
          // Create vital signs for each visit
          for (let i = 1; i <= 4; i++) {
            const visitDate = new Date(2023, 0, 15 + (i * 30) + Math.floor(Math.random() * 5));
            const visitId = `V${i}`;
            
            // Create common vital signs
            const vitalSigns = [
              { testcd: 'SYSBP', test: 'Systolic Blood Pressure', result: 110 + Math.floor(Math.random() * 30), unit: 'mmHg' },
              { testcd: 'DIABP', test: 'Diastolic Blood Pressure', result: 70 + Math.floor(Math.random() * 20), unit: 'mmHg' },
              { testcd: 'PULSE', test: 'Pulse Rate', result: 60 + Math.floor(Math.random() * 30), unit: 'beats/min' },
              { testcd: 'TEMP', test: 'Temperature', result: 36.5 + Math.random(), unit: 'C' },
              { testcd: 'WEIGHT', test: 'Weight', result: 65 + Math.floor(Math.random() * 30), unit: 'kg' },
              { testcd: 'HEIGHT', test: 'Height', result: 160 + Math.floor(Math.random() * 30), unit: 'cm' }
            ];
            
            vitalSigns.forEach(vs => {
              const vsRefId = `${baseRefId}-VS-${visitId}-${vs.testcd}`;
              
              const vsData: ReferenceData = {
                id: vsRefId,
                queryId: '',
                dataSource: 'EDC',
                recordId: `VS-${patientId}-${visitId}-${vs.testcd}`,
                patientId: patientId,
                visitId: visitId,
                dataPoints: {
                  domain: 'VS',
                  usubjid: patientId,
                  vstest: vs.test,
                  vstestcd: vs.testcd,
                  vsdtc: visitDate.toISOString().split('T')[0],
                  visit: `VISIT ${i}`,
                  visitnum: i,
                  vsorres: vs.result.toString(),
                  vsorresu: vs.unit,
                  vsstat: Math.random() > 0.95 ? 'NOT DONE' : ''
                },
                createdAt: new Date()
              };
              this.referenceData.set(vsRefId, vsData);
            });
          }
          break;
          
        case 'EX': // Exposure (Study Drug)
          // Create exposure records for each visit
          for (let i = 1; i <= 4; i++) {
            // Skip some doses randomly to simulate missed doses
            if (Math.random() > 0.1) { // 90% chance of receiving the dose
              const visitDate = new Date(2023, 0, 15 + (i * 30) + Math.floor(Math.random() * 5));
              const visitId = `V${i}`;
              const exRefId = `${baseRefId}-EX-${visitId}`;
              
              const exData: ReferenceData = {
                id: exRefId,
                queryId: '',
                dataSource: 'EDC',
                recordId: `EX-${patientId}-${visitId}`,
                patientId: patientId,
                visitId: visitId,
                dataPoints: {
                  domain: 'EX',
                  usubjid: patientId,
                  extrt: study?.indication?.includes('Diabetes') ? 'XYZ-123' : 
                          study?.indication?.includes('Hypertension') ? 'ABC-456' : 'IMM-789',
                  exstdtc: visitDate.toISOString().split('T')[0],
                  exendtc: visitDate.toISOString().split('T')[0], // Same day for single dose
                  exdose: study?.indication?.includes('Diabetes') ? 100 : 
                           study?.indication?.includes('Hypertension') ? 25 : 200,
                  exdosu: 'mg',
                  exroute: 'ORAL',
                  visit: `VISIT ${i}`,
                  visitnum: i,
                  exdosfrq: 'QD', // Once daily
                  extpt: 'STUDY DRUG'
                },
                createdAt: new Date()
              };
              this.referenceData.set(exRefId, exData);
            }
          }
          break;
      }
    });
  }

  private initializeRecipients(): void {
    // Initialize with some sample recipients
    const recipients: NotificationRecipient[] = [
      { name: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: 'Data Manager' },
      { name: 'Michael Chen', email: 'michael.chen@example.com', role: 'CRA' },
      { name: 'James Wilson', email: 'james.wilson@example.com', role: 'Clinical Manager' },
      { name: 'Emily Rodriguez', email: 'emily.rodriguez@example.com', role: 'Clinical Programmer' },
      { name: 'Raj Patel', email: 'raj.patel@example.com', role: 'Biostatistician' },
    ];

    recipients.forEach(recipient => {
      this.recipientDirectory.set(recipient.email, recipient);
    });
  }
  
  // Add explicit records with null values for testing
  private addExplicitNullRecords(): void {
    // Create a record with several null fields for testing missing value detection
    const lbNullRecord: ReferenceData = {
      id: 'NULL-LB-001',
      queryId: '',
      dataSource: 'Lab',
      recordId: 'LB-100-005-V2-WBC-NULL',
      patientId: '100-005',
      visitId: 'V2',
      dataPoints: {
        domain: 'LB',
        usubjid: '100-005',
        lbtest: 'White Blood Cell Count',
        lbtestcd: 'WBC',
        lbdtc: '2023-03-15',
        visit: 'VISIT 2',
        visitnum: 2,
        lborres: '', // Empty value
        lborresu: null, // Null value
        lbstnrlo: null, // Null value
        lbstnrhi: null, // Null value
        lbnrind: '' // Empty value
      },
      createdAt: new Date()
    };
    this.referenceData.set(lbNullRecord.id, lbNullRecord);
    
    // Create an adverse event with missing end date (common in real data)
    const aeNullRecord: ReferenceData = {
      id: 'NULL-AE-001',
      queryId: '',
      dataSource: 'EDC',
      recordId: 'AE-100-004-NULL',
      patientId: '100-004',
      dataPoints: {
        domain: 'AE',
        usubjid: '100-004',
        aeterm: 'Headache',
        aestdtc: '2023-04-10',
        aeendtc: '', // Missing end date (ongoing event)
        aesev: 'MODERATE',
        aeser: 'N',
        aerel: null, // Missing relationship assessment
        aeout: '' // Missing outcome
      },
      createdAt: new Date()
    };
    this.referenceData.set(aeNullRecord.id, aeNullRecord);
  }

  // Generate unique query IDs for a study
  private generateQueryId(studyId: number): string {
    if (!this.queryIdCounter.has(studyId)) {
      this.queryIdCounter.set(studyId, 0);
    }

    const counter = this.queryIdCounter.get(studyId)! + 1;
    this.queryIdCounter.set(studyId, counter);
    
    return `DM-Q${studyId}-${counter.toString().padStart(3, '0')}`;
  }

  // Perform data analysis across sources
  public async analyzeData(studyId: number): Promise<AnalysisResults> {
    // In a real implementation, this would call the backend API
    // For now, we'll implement a sophisticated analysis based on study data
    
    // Get study information
    const study = this.studies.get(studyId);
    if (!study) {
      throw new Error(`Study with ID ${studyId} not found`);
    }
    
    // Calculate base metrics based on study characteristics
    let baseQualityScore = 80;
    let baseConsistencyScore = 75;
    let baseCompletenessScore = 85;
    let baseQueryResponseRate = 70;
    
    // Phase 3 studies are more complex and typically have more data quality issues
    if (study.phase === 'Phase 3') {
      baseQualityScore -= 5;
      baseConsistencyScore -= 3;
    }
    
    // More countries and sites increase complexity and data quality challenges
    if (study.countries && study.countries.length > 3) {
      baseQualityScore -= study.countries.length - 3;
      baseConsistencyScore -= Math.floor((study.countries.length - 3) / 2);
    }
    
    if (study.sites && study.sites > 20) {
      baseQualityScore -= Math.floor((study.sites - 20) / 10);
      baseConsistencyScore -= Math.floor((study.sites - 20) / 15);
    }
    
    // Perform detailed data source analysis
    const dataSourceAnalysis = this.analyzeStudyDataSources(study);
    
    // Calculate total issues across all data sources
    const totalIssues = dataSourceAnalysis.reduce((sum, source) => sum + source.issueCount, 0);
    
    // For realistic estimates, not all issues generate queries
    const queriesGenerated = Math.floor(totalIssues * 0.7);
    
    // Calculate final metrics with some variation for realism
    const dataQualityScore = Math.max(55, Math.min(98, baseQualityScore + (Math.random() * 6 - 3)));
    const consistencyScore = Math.max(55, Math.min(98, baseConsistencyScore + (Math.random() * 6 - 3)));
    const completenessScore = Math.max(60, Math.min(98, baseCompletenessScore + (Math.random() * 6 - 3)));
    const queryResponseRate = Math.max(50, Math.min(95, baseQueryResponseRate + (Math.random() * 8 - 4)));
    
    // Generate specific issues based on the study characteristics
    const topIssues = this.generateDataQualityIssues(study, Math.min(5, totalIssues));
    
    const results: AnalysisResults = {
      totalIssues,
      queriesGenerated,
      dataSources: dataSourceAnalysis,
      metrics: {
        dataQualityScore: Math.round(dataQualityScore),
        consistencyScore: Math.round(consistencyScore),
        completenessScore: Math.round(completenessScore),
        queryResponseRate: Math.round(queryResponseRate),
      },
      topIssues
    };

    // Store the analysis results
    this.lastAnalysisResults.set(studyId, results);

    // Generate queries from the issues found
    this.createQueriesFromIssues(studyId, results.topIssues);

    // Record metrics history
    if (!this.metricsHistory.has(studyId)) {
      this.metricsHistory.set(studyId, []);
    }
    
    this.metricsHistory.get(studyId)!.push({
      date: new Date(),
      metrics: {
        dataQualityScore,
        consistencyScore,
        completenessScore,
        queryResponseRate,
        totalIssues: results.totalIssues,
        queriesGenerated: results.queriesGenerated
      }
    });

    // Generate data comparisons
    this.generateDataComparison(studyId);

    return results;
  }

  // Analyze data sources for a study with detailed knowledge of Study Management and Data Management
  private analyzeStudyDataSources(study: Study): {name: string; issueCount: number; status: 'clean' | 'warning' | 'critical'}[] {
    const dataSources = ['EDC', 'Lab', 'CTMS', 'eCOA', 'IxRS', 'Imaging', 'eTMF'];
    const dataSourceAnalysis: {name: string; issueCount: number; status: 'clean' | 'warning' | 'critical'}[] = [];
    
    for (const source of dataSources) {
      let issueCount = 0;
      let status: 'clean' | 'warning' | 'critical' = 'clean';
      
      // Deep analysis based on in-depth knowledge of each data source
      switch (source) {
        case 'EDC':
          // EDC issues include missing data, inconsistent dates, protocol deviations, form discrepancies
          // More complex studies (Phase 3) typically have more EDC issues
          issueCount = study.phase === 'Phase 3' ? 4 + Math.floor(Math.random() * 5) : 2 + Math.floor(Math.random() * 3);
          
          // More sites typically correlate with more data entry issues
          if (study.sites && study.sites > 20) {
            issueCount += Math.floor(study.sites / 20);
          }
          
          // Diabetes studies often have complex lab data requirements that affect EDC quality
          if (study.indication && study.indication.includes('Diabetes')) {
            issueCount += 1;
          }
          break;
          
        case 'Lab':
          // Lab issues include missing results, inconsistent units, out-of-range values not flagged
          // More patients typically correlate with more lab issues
          issueCount = 2 + Math.floor(Math.random() * 3);
          
          if (study.enrolledPatients && study.enrolledPatients > 100) {
            issueCount += Math.floor(study.enrolledPatients / 100);
          }
          
          // Studies with specific indications have more complex lab requirements
          if (study.indication && 
             (study.indication.includes('Diabetes') || study.indication.includes('Oncology'))) {
            issueCount += 2;
          }
          break;
          
        case 'CTMS':
          // CTMS issues include site activation delays, monitoring visit scheduling, enrollment tracking
          // More countries increase complexity in CTMS
          issueCount = 1 + Math.floor(Math.random() * 2);
          
          if (study.countries && study.countries.length > 3) {
            issueCount += Math.floor(study.countries.length / 3);
          }
          break;
          
        case 'eCOA':
          // eCOA issues include patient compliance, missing assessments, device issues
          issueCount = 1 + Math.floor(Math.random() * 3);
          
          // Studies with high enrollment may have more eCOA compliance issues
          if (study.enrolledPatients && study.enrolledPatients > 50) {
            issueCount += Math.floor(study.enrolledPatients / 50);
          }
          break;
          
        case 'IxRS':
          // IxRS issues focus on randomization and drug supply
          issueCount = Math.floor(Math.random() * 2);
          
          // Randomized studies have more complex IxRS requirements
          if (study.phase === 'Phase 2' || study.phase === 'Phase 3') {
            issueCount += 1;
          }
          break;
          
        case 'Imaging':
          // Imaging issues include missing scans, quality issues, inconsistent readings
          issueCount = Math.floor(Math.random() * 2);
          
          // Oncology studies have more complex imaging requirements
          if (study.indication && 
             (study.indication.includes('Oncology') || study.indication.includes('Cancer'))) {
            issueCount += 2;
          }
          break;
          
        case 'eTMF':
          // eTMF issues focus on document completeness and compliance
          issueCount = Math.floor(Math.random() * 2);
          
          // Global studies have more complex regulatory document requirements
          if (study.countries && study.countries.length > 3) {
            issueCount += Math.floor(study.countries.length / 3);
          }
          break;
      }
      
      // Determine the status based on issue count
      if (issueCount > 4) {
        status = 'critical';
      } else if (issueCount > 0) {
        status = 'warning';
      }
      
      dataSourceAnalysis.push({
        name: source,
        issueCount,
        status
      });
    }
    
    return dataSourceAnalysis;
  }
  
  // Generate realistic clinical trial data quality issues based on study characteristics
  private generateDataQualityIssues(study: Study, count: number): Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    dataSources: string[];
    status: 'new' | 'assigned' | 'in-review' | 'resolved';
  }> {
    // Define specialized domain-specific issue templates
    const issueTemplates = [
      // Cross-source reconciliation issues (high priority in clinical data management)
      {
        domain: 'cross-source',
        issues: [
          {
            description: 'Lab visit date in central lab database does not match visit date in EDC',
            severity: 'medium' as const,
            dataSources: ['EDC', 'Lab']
          },
          {
            description: 'Subject visit dates in CTMS do not match EDC dates for multiple patients',
            severity: 'medium' as const,
            dataSources: ['EDC', 'CTMS']
          },
          {
            description: 'Drug accountability in IxRS does not reconcile with medication administration records in EDC',
            severity: 'high' as const,
            dataSources: ['EDC', 'IxRS']
          },
          {
            description: 'Protocol deviation reported in CTMS not documented in EDC',
            severity: 'high' as const,
            dataSources: ['EDC', 'CTMS']
          },
          {
            description: 'Patient reported outcome scores in eCOA inconsistent with clinician assessment in EDC',
            severity: 'medium' as const,
            dataSources: ['EDC', 'eCOA']
          }
        ]
      },
      
      // Demographic domain issues (DM domain)
      {
        domain: 'DM',
        issues: [
          {
            description: 'Inconsistent demographic information between EDC and central lab records',
            severity: 'medium',
            dataSources: ['EDC', 'Lab']
          },
          {
            description: 'Missing date of birth information in demographic domain for multiple subjects',
            severity: 'medium',
            dataSources: ['EDC']
          },
          {
            description: 'Gender coding inconsistencies across multiple patients in demographic records',
            severity: 'low',
            dataSources: ['EDC']
          }
        ]
      },
      
      // Adverse Event domain issues (AE domain)
      {
        domain: 'AE',
        issues: [
          {
            description: 'Adverse event dates occur before study medication administration',
            severity: 'high',
            dataSources: ['EDC']
          },
          {
            description: 'Missing AE causality assessment for serious adverse events',
            severity: 'critical',
            dataSources: ['EDC']
          },
          {
            description: 'Inconsistent AE coding between verbatim and coded terms',
            severity: 'medium',
            dataSources: ['EDC']
          }
        ]
      },
      
      // Lab domain issues (LB domain)
      {
        domain: 'LB',
        issues: [
          {
            description: 'Multiple out-of-range lab values with no clinical explanation provided',
            severity: 'high',
            dataSources: ['EDC', 'Lab']
          },
          {
            description: 'Missing laboratory results for multiple patients at critical timepoints',
            severity: 'high',
            dataSources: ['Lab']
          },
          {
            description: 'Inconsistent lab normal ranges used across study sites',
            severity: 'medium',
            dataSources: ['Lab']
          }
        ]
      },
      
      // Concomitant Medication domain issues (CM domain)
      {
        domain: 'CM',
        issues: [
          {
            description: 'Incomplete concomitant medication information (missing end dates)',
            severity: 'medium',
            dataSources: ['EDC']
          },
          {
            description: 'Prohibited medications recorded without appropriate protocol deviation',
            severity: 'high',
            dataSources: ['EDC']
          }
        ]
      },
      
      // Visit/Subject Visits domain issues (SV domain)
      {
        domain: 'SV',
        issues: [
          {
            description: 'Missing study visit data for multiple patients at visit 3',
            severity: 'high',
            dataSources: ['EDC']
          },
          {
            description: 'Visit dates outside of protocol-specified windows without explanation',
            severity: 'medium',
            dataSources: ['EDC', 'CTMS']
          }
        ]
      },
      
      // Vital Signs domain issues (VS domain)
      {
        domain: 'VS',
        issues: [
          {
            description: 'Clinically significant vital sign changes with no documented follow-up',
            severity: 'high',
            dataSources: ['EDC']
          },
          {
            description: 'Inconsistent units of measurement for vital signs across sites',
            severity: 'medium',
            dataSources: ['EDC']
          }
        ]
      },
      
      // Drug Exposure domain issues (EX domain)
      {
        domain: 'EX',
        issues: [
          {
            description: 'Dose modifications not properly documented in exposure records',
            severity: 'high',
            dataSources: ['EDC']
          },
          {
            description: 'Inconsistent dosing information between exposure and accountability logs',
            severity: 'medium',
            dataSources: ['EDC', 'IxRS']
          }
        ]
      },
      
      // Document/eTMF issues
      {
        domain: 'eTMF',
        issues: [
          {
            description: 'Missing essential regulatory documents for recently activated sites',
            severity: 'high',
            dataSources: ['eTMF']
          },
          {
            description: 'Expired ethics committee approvals without documented renewals',
            severity: 'critical',
            dataSources: ['eTMF', 'CTMS']
          }
        ]
      }
    ];
    
    // Customize issues based on study characteristics
    const studyRelevantIssues: Array<{
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      dataSources: string[];
    }> = [];
    
    // Add domain-specific and cross-source reconciliation issues
    issueTemplates.forEach(template => {
      // For diabetes studies, prioritize lab data issues
      if (study.indication && study.indication.includes('Diabetes') && template.domain === 'LB') {
        template.issues.forEach(issue => studyRelevantIssues.push({
          ...issue,
          severity: issue.severity === 'medium' ? 'high' : issue.severity
        }));
      } 
      // For oncology studies, prioritize imaging and AE issues
      else if (study.indication && 
              (study.indication.includes('Oncology') || study.indication.includes('Cancer')) && 
              (template.domain === 'AE' || template.domain === 'Imaging')) {
        template.issues.forEach(issue => studyRelevantIssues.push({
          ...issue,
          severity: issue.severity === 'medium' ? 'high' : issue.severity
        }));
      }
      // Always include cross-source reconciliation issues as they're critical for data quality
      else if (template.domain === 'cross-source') {
        template.issues.forEach(issue => studyRelevantIssues.push(issue));
      }
      // Include other domain issues with normal priority
      else {
        template.issues.forEach(issue => studyRelevantIssues.push(issue));
      }
    });
    
    // Shuffle and select the requested number of issues
    const shuffled = [...studyRelevantIssues].sort(() => 0.5 - Math.random());
    const selectedIssues = shuffled.slice(0, Math.min(count, shuffled.length));
    
    // Format the final issues with IDs
    return selectedIssues.map(issue => ({
      id: `DQ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: issue.description,
      severity: issue.severity,
      dataSources: issue.dataSources,
      status: 'new'
    }));
  }
  
  // Generate random issues for a study (original method, kept for backward compatibility)
  private generateIssuesForStudy(studyId: number, count: number): any[] {
    const issueTypes = [
      'Inconsistent patient demographics between EDC and Lab data',
      'Missing laboratory results for visit 3 across multiple patients',
      'Date inconsistencies between CTMS visit dates and EDC data entry',
      'Multiple protocol deviations not documented in EDC',
      'Adverse event dates conflict with study medication dosing',
      'Incomplete concomitant medication records',
      'Missing vital signs measurements for visit 2',
      'Inconsistent medical history between screening and baseline',
      'Data entry errors in patient eligibility criteria',
      'Multiple out-of-range lab values without explanations',
      'Visit date discrepancies between EDC and CTMS',
      'Missing signatures on electronic CRFs',
      'Inconsistent dosing information across multiple forms',
      'Unresolved queries past due date',
      'Protocol violation not properly documented'
    ];

    const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
    const dataSources = ['EDC', 'Lab', 'CTMS', 'Imaging'];
    
    const issues = [];
    for (let i = 0; i < count; i++) {
      const issueIndex = Math.floor(Math.random() * issueTypes.length);
      
      // Randomly select 1-2 data sources
      const sourceCount = 1 + Math.floor(Math.random() * 2);
      const selectedSources: string[] = [];
      while (selectedSources.length < sourceCount) {
        const source = dataSources[Math.floor(Math.random() * dataSources.length)];
        if (!selectedSources.includes(source)) {
          selectedSources.push(source);
        }
      }

      issues.push({
        id: this.generateQueryId(studyId),
        description: issueTypes[issueIndex],
        severity: severities[Math.floor(Math.random() * severities.length)],
        dataSources: selectedSources,
        status: 'new'
      });
    }

    return issues;
  }

  // Create queries from issues found during analysis
  private createQueriesFromIssues(studyId: number, issues: any[]): void {
    const now = new Date();
    
    issues.forEach(issue => {
      const query: Query = {
        ...issue,
        studyId,
        createdAt: now,
        updatedAt: now,
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };
      
      this.activeQueries.set(query.id, query);
      
      // Generate notifications for each query
      this.generateNotification(query);
    });
  }

  // Generate a notification for a query
  private generateNotification(query: Query): void {
    // Find an appropriate recipient based on data source
    const recipients = Array.from(this.recipientDirectory.values());
    const dataManagerRecipients = recipients.filter(r => r.role === 'Data Manager');
    const craRecipients = recipients.filter(r => r.role === 'CRA');
    
    let recipient;
    if (query.dataSources.includes('EDC') || query.dataSources.includes('Lab')) {
      recipient = dataManagerRecipients[Math.floor(Math.random() * dataManagerRecipients.length)];
    } else {
      recipient = craRecipients[Math.floor(Math.random() * craRecipients.length)];
    }

    if (!recipient) {
      recipient = recipients[Math.floor(Math.random() * recipients.length)];
    }

    const severityText = query.severity.charAt(0).toUpperCase() + query.severity.slice(1);
    const notification: EmailNotification = {
      recipientId: recipient.email,
      queryId: query.id,
      subject: `[${query.id}] ${severityText} Priority: ${query.description}`,
      body: `
Dear ${recipient.name},

A new data query has been generated that requires your attention:

Query ID: ${query.id}
Priority: ${severityText}
Description: ${query.description}
Data Sources: ${query.dataSources.join(', ')}
Due Date: ${query.dueDate?.toLocaleDateString()}

Please review this query and take appropriate action. You can access the complete details in the DM Compliance page of the Clinical Business Orchestration and AI Technology (cBOAT) platform.

Thank you,
DM.AI Assistant
      `.trim(),
      sentAt: new Date(),
      status: 'pending'
    };

    this.emailNotifications.push(notification);
    
    // Assign the query to the recipient
    const updatedQuery = this.activeQueries.get(query.id);
    if (updatedQuery) {
      updatedQuery.assignedTo = recipient.email;
      updatedQuery.contact = recipient.name;
      updatedQuery.lastNotified = new Date();
      updatedQuery.notificationStatus = 'sent';
      this.activeQueries.set(query.id, updatedQuery);
    }
  }

  // Generate a data comparison report
  private generateDataComparison(studyId: number): void {
    const dataSources = ['EDC', 'Lab', 'CTMS', 'Imaging'];
    const comparisons: DataComparisonResult[] = [];

    dataSources.forEach(source => {
      comparisons.push({
        source,
        totalFields: 500 + Math.floor(Math.random() * 1000),
        inconsistentFields: 5 + Math.floor(Math.random() * 20),
        missingFields: 2 + Math.floor(Math.random() * 10),
        changedSinceLastCheck: 10 + Math.floor(Math.random() * 50),
        lastChecked: new Date()
      });
    });

    this.dataComparisons.set(studyId, comparisons);
  }

  // Get the current active queries for a study
  public getActiveQueries(studyId: number): Query[] {
    return Array.from(this.activeQueries.values())
      .filter(query => query.studyId === studyId);
  }

  // Get the resolved queries for a study
  public getResolvedQueries(studyId: number): Query[] {
    return Array.from(this.resolvedQueries.values())
      .filter(query => query.studyId === studyId);
  }

  // Update a query's status
  public updateQueryStatus(queryId: string, status: 'new' | 'assigned' | 'in-review' | 'resolved', user: string = 'Data Manager'): Query | null {
    if (this.activeQueries.has(queryId)) {
      const query = this.activeQueries.get(queryId)!;
      const previousStatus = query.status;
      query.status = status;
      query.updatedAt = new Date();
      
      // Add workflow step
      this.addWorkflowStep(queryId, {
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        queryId: queryId,
        action: status === 'assigned' ? 'assigned' : 
                status === 'in-review' ? 'reviewed' : 
                status === 'resolved' ? 'resolved' : 'created',
        timestamp: new Date(),
        user: user,
        notes: `Status changed from ${previousStatus} to ${status}`
      });
      
      if (status === 'resolved') {
        query.workflowStatus = 'completed';
        query.lastWorkflowUpdate = new Date();
        query.resolutionMethod = 'manual';
        this.resolvedQueries.set(queryId, query);
        this.activeQueries.delete(queryId);
      } else {
        query.workflowStatus = 'in-progress';
        query.lastWorkflowUpdate = new Date();
        this.activeQueries.set(queryId, query);
      }
      
      return query;
    }
    
    return null;
  }
  
  // Add a workflow step to a query
  private addWorkflowStep(queryId: string, step: QueryWorkflowStep): void {
    if (!this.queryWorkflowSteps.has(queryId)) {
      this.queryWorkflowSteps.set(queryId, []);
    }
    this.queryWorkflowSteps.get(queryId)!.push(step);
  }
  
  // Get workflow steps for a query
  public getQueryWorkflowSteps(queryId: string): QueryWorkflowStep[] {
    return this.queryWorkflowSteps.get(queryId) || [];
  }
  
  // Auto-detect and resolve issues when data is corrected
  public checkForCorrectedData(studyId: number): Query[] {
    const activeQueries = this.getActiveQueries(studyId);
    const resolvedQueries: Query[] = [];
    
    activeQueries.forEach(query => {
      // Check if data has been corrected for each query
      const isCorrected = this.isDataCorrected(query);
      if (isCorrected) {
        // Auto-resolve the query
        query.status = 'resolved';
        query.updatedAt = new Date();
        query.workflowStatus = 'completed';
        query.lastWorkflowUpdate = new Date();
        query.resolutionMethod = 'auto-corrected';
        
        // Add workflow step
        this.addWorkflowStep(query.id, {
          id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          queryId: query.id,
          action: 'auto-corrected',
          timestamp: new Date(),
          user: 'DM.AI',
          notes: 'Issue automatically resolved due to data correction'
        });
        
        // Move to resolved queries
        this.resolvedQueries.set(query.id, query);
        this.activeQueries.delete(query.id);
        
        resolvedQueries.push(query);
      }
    });
    
    return resolvedQueries;
  }
  
  // Check if data for a query has been corrected
  private isDataCorrected(query: Query): boolean {
    // This would implement the logic to check if the data issue has been fixed
    // For now, we'll use a simplified approach for demonstration
    
    // Get reference data for this query if available
    if (query.referenceData) {
      const refData = this.referenceData.get(query.referenceData);
      if (refData) {
        // For missing data issues
        if (query.description.includes('missing') && refData.dataPoints) {
          return true; // If data now exists, consider it resolved
        }
        
        // For inconsistent data issues
        if (query.description.includes('inconsistent')) {
          // We would normally check against expected values or compare across sources
          return Math.random() > 0.7; // Simulate finding corrections ~30% of the time
        }
        
        // For out-of-range lab values
        if (query.description.includes('out-of-range') && refData.dataPoints.domain === 'LB') {
          const lbData = refData.dataPoints;
          const value = parseFloat(lbData.lborres);
          const low = lbData.lbstnrlo;
          const high = lbData.lbstnrhi;
          
          return value >= low && value <= high; // Check if now within range
        }
      }
    }
    
    // For demo purposes, randomly resolve some issues to simulate detection
    return Math.random() > 0.85; // ~15% chance of auto-resolution for testing
  }

  // Get notifications for a recipient
  public getNotificationsForRecipient(email: string): EmailNotification[] {
    return this.emailNotifications.filter(notification => notification.recipientId === email);
  }

  // Get the latest metrics for a study
  public getLatestMetrics(studyId: number): { [key: string]: number } | null {
    if (this.metricsHistory.has(studyId) && this.metricsHistory.get(studyId)!.length > 0) {
      const history = this.metricsHistory.get(studyId)!;
      return history[history.length - 1].metrics;
    }
    
    return null;
  }

  // Get metrics history for a study
  public getMetricsHistory(studyId: number): { date: Date, metrics: { [key: string]: number } }[] {
    return this.metricsHistory.get(studyId) || [];
  }

  // Get data comparison results for a study
  public getDataComparison(studyId: number): DataComparisonResult[] {
    return this.dataComparisons.get(studyId) || [];
  }

  // Get the last analysis results for a study
  public getLastAnalysisResults(studyId: number): AnalysisResults | null {
    return this.lastAnalysisResults.get(studyId) || null;
  }
  
  // Create or update a study
  public createOrUpdateStudy(study: Study): Study {
    this.studies.set(study.id, study);
    return study;
  }
  
  // Get a study by ID
  public getStudy(studyId: number): Study | undefined {
    return this.studies.get(studyId);
  }
  
  // Get all studies
  public getAllStudies(): Study[] {
    return Array.from(this.studies.values());
  }
  
  // Get conversation history for a study
  public getConversation(studyId: number): ConversationMessage[] {
    if (!this.conversations.has(studyId)) {
      const study = this.getStudy(studyId);
      
      this.conversations.set(studyId, [
        {
          id: '1',
          role: 'assistant',
          content: `Hello! I'm your Data Management AI Assistant for study ${study?.protocolId || 'unknown'}. I have access to all trial data domains (DM, SV, AE, LB, VS, CM, EX) and can help with data quality checks, query management, and cross-source data analysis. How can I assist you today?`,
          timestamp: new Date()
        }
      ]);
    }
    return this.conversations.get(studyId) || [];
  }
  
  // Get all available data domains for a study
  public getStudyDataDomains(studyId: number): string[] {
    // Get all reference data for this study
    const allReferenceData = Array.from(this.referenceData.values());
    
    // Extract unique domains
    const domains = new Set<string>();
    allReferenceData.forEach(data => {
      if (data.dataPoints && data.dataPoints.domain) {
        domains.add(data.dataPoints.domain);
      }
    });
    
    return Array.from(domains);
  }
  
  // Get domain-specific data for a particular study
  public getDomainData(studyId: number, domain: string): ReferenceData[] {
    const allReferenceData = Array.from(this.referenceData.values());
    
    return allReferenceData.filter(data => 
      data.dataPoints && 
      data.dataPoints.domain === domain
    );
  }
  
  // Get data for a specific patient across domains
  public getPatientData(patientId: string): ReferenceData[] {
    const allReferenceData = Array.from(this.referenceData.values());
    
    return allReferenceData.filter(data => 
      data.patientId === patientId
    );
  }
  
  // Find duplicate records by USUBJID in a specific domain or across domains
  // Analyze data for duplicate records, null values, and other data issues
  public findDuplicateRecords(studyId: number, domain?: string): { 
    duplicates: Array<{
      usubjid: string;
      count: number;
      domain: string;
      records: any[];
      recordIds: string[];
      differences?: Record<string, any>;
    }>;
    totalDuplicates: number;
    affectedSubjects: string[];
  } {
    const allReferenceData = Array.from(this.referenceData.values());
    
    // Filter data by domain if specified
    let dataToCheck = allReferenceData;
    if (domain) {
      dataToCheck = allReferenceData.filter(data => 
        data.dataPoints && 
        data.dataPoints.domain === domain
      );
    }
    
    // Group data by USUBJID and domain
    const recordsByUsubjidAndDomain: Record<string, Record<string, any[]>> = {};
    const recordIdsByUsubjidAndDomain: Record<string, Record<string, string[]>> = {};
    
    dataToCheck.forEach(data => {
      if (!data.dataPoints || !data.dataPoints.usubjid) return;
      
      const usubjid = data.dataPoints.usubjid;
      const dataDomain = data.dataPoints.domain || 'unknown';
      
      if (!recordsByUsubjidAndDomain[usubjid]) {
        recordsByUsubjidAndDomain[usubjid] = {};
        recordIdsByUsubjidAndDomain[usubjid] = {};
      }
      
      if (!recordsByUsubjidAndDomain[usubjid][dataDomain]) {
        recordsByUsubjidAndDomain[usubjid][dataDomain] = [];
        recordIdsByUsubjidAndDomain[usubjid][dataDomain] = [];
      }
      
      recordsByUsubjidAndDomain[usubjid][dataDomain].push(data.dataPoints);
      recordIdsByUsubjidAndDomain[usubjid][dataDomain].push(data.recordId);
    });
    
    // Find duplicates (subjects with more than one record in a domain)
    const duplicates: Array<{
      usubjid: string; 
      domain: string; 
      count: number; 
      records: any[];
      recordIds: string[];
      differences?: Record<string, any>;
    }> = [];
    
    const affectedSubjects = new Set<string>();
    
    Object.entries(recordsByUsubjidAndDomain).forEach(([usubjid, domainRecords]) => {
      Object.entries(domainRecords).forEach(([domain, records]) => {
        if (records.length > 1) {
          // Find differences between duplicate records
          const differences: Record<string, any> = {};
          
          if (records.length > 1) {
            // Compare first record against all others to find differences
            const firstRecord = records[0];
            
            // Get all keys from all records
            const allKeys = new Set<string>();
            records.forEach(record => {
              Object.keys(record).forEach(key => allKeys.add(key));
            });
            
            // Find differences for each key
            Array.from(allKeys).forEach(key => {
              const values = new Set<any>();
              records.forEach(record => {
                if (record[key] !== undefined) {
                  values.add(JSON.stringify(record[key]));
                }
              });
              
              // If more than one distinct value, record the difference
              if (values.size > 1) {
                differences[key] = Array.from(values).map(v => JSON.parse(v));
              }
            });
          }
          
          duplicates.push({
            usubjid,
            domain,
            count: records.length,
            records,
            recordIds: recordIdsByUsubjidAndDomain[usubjid][domain],
            differences: Object.keys(differences).length > 0 ? differences : undefined
          });
          
          affectedSubjects.add(usubjid);
        }
      });
    });
    
    return {
      duplicates,
      totalDuplicates: duplicates.length,
      affectedSubjects: Array.from(affectedSubjects)
    };
  }
  
  // Find null or missing values in the data
  public findNullValues(studyId: number, domain?: string): {
    nulls: Array<{
      domain: string;
      field: string;
      count: number;
      affectedSubjects: string[];
    }>;
    totalNulls: number;
  } {
    const allReferenceData = Array.from(this.referenceData.values());
    
    // Filter data by domain if specified
    let dataToCheck = allReferenceData;
    if (domain) {
      dataToCheck = allReferenceData.filter(data => 
        data.dataPoints && 
        data.dataPoints.domain === domain
      );
    }
    
    // Track null values by domain and field
    const nullsByDomainAndField: Record<string, Record<string, Set<string>>> = {};
    
    // Check each record for null fields
    dataToCheck.forEach(data => {
      if (!data.dataPoints || !data.dataPoints.domain) return;
      
      const dataDomain = data.dataPoints.domain;
      const usubjid = data.dataPoints.usubjid;
      
      if (!nullsByDomainAndField[dataDomain]) {
        nullsByDomainAndField[dataDomain] = {};
      }
      
      // Check each field in the record
      Object.entries(data.dataPoints).forEach(([field, value]) => {
        if (value === null || value === undefined || value === '') {
          if (!nullsByDomainAndField[dataDomain][field]) {
            nullsByDomainAndField[dataDomain][field] = new Set<string>();
          }
          
          if (usubjid) {
            nullsByDomainAndField[dataDomain][field].add(usubjid);
          }
        }
      });
    });
    
    // Format the results
    const nulls = Object.entries(nullsByDomainAndField).flatMap(([domain, fieldNulls]) => 
      Object.entries(fieldNulls).map(([field, subjects]) => ({
        domain,
        field,
        count: subjects.size,
        affectedSubjects: Array.from(subjects)
      }))
    );
    
    return {
      nulls,
      totalNulls: nulls.length
    };
  }
  
  // Get data for a specific visit across domains and patients
  public getVisitData(visitId: string): ReferenceData[] {
    const allReferenceData = Array.from(this.referenceData.values());
    
    return allReferenceData.filter(data => 
      data.visitId === visitId
    );
  }
  
  // Check for inconsistencies between two data sources
  public checkDataConsistency(source1: string, source2: string): { 
    inconsistencies: any[], 
    affectedPatients: string[] 
  } {
    const source1Data = Array.from(this.referenceData.values())
      .filter(data => data.dataSource === source1);
    
    const source2Data = Array.from(this.referenceData.values())
      .filter(data => data.dataSource === source2);
    
    // For demonstration, return some simulated inconsistencies
    const inconsistencies = [];
    const affectedPatients = new Set<string>();
    
    // Simulate finding demographic inconsistencies
    if (source1 === 'EDC' && source2 === 'Lab') {
      inconsistencies.push({
        type: 'demographic',
        description: 'Gender inconsistency between EDC and Lab data',
        details: 'Patient 100-002 is recorded as Female in EDC but Male in Lab database',
        severity: 'high'
      });
      affectedPatients.add('100-002');
      
      inconsistencies.push({
        type: 'date',
        description: 'Visit date discrepancy between EDC and Lab data',
        details: 'Visit V2 for patient 100-003 is recorded as 2023-02-18 in EDC but 2023-02-20 in Lab database',
        severity: 'medium'
      });
      affectedPatients.add('100-003');
    }
    
    // Add other domain-specific inconsistencies
    if (source1 === 'EDC' && source2 === 'CTMS') {
      inconsistencies.push({
        type: 'enrollment',
        description: 'Enrollment date inconsistency',
        details: 'Patient 100-001 has different enrollment dates in EDC and CTMS',
        severity: 'medium'
      });
      affectedPatients.add('100-001');
    }
    
    return {
      inconsistencies,
      affectedPatients: Array.from(affectedPatients)
    };
  }
  
  // Get reference data for a specific query
  public getQueryReferenceData(queryId: string): ReferenceData | undefined {
    // Find the query first
    const query = this.activeQueries.get(queryId) || this.resolvedQueries.get(queryId);
    
    if (!query) return undefined;
    
    // Find reference data linked to this query
    const linkedRefData = Array.from(this.referenceData.values())
      .find(data => data.queryId === queryId);
    
    if (linkedRefData) return linkedRefData;
    
    // If no directly linked reference data, try to find a relevant one
    // This is a simplified simulation - in a real implementation, we would look for 
    // reference data that matches the issue described in the query
    
    // Just get some reference data for the first data source mentioned in the query
    if (query.dataSources && query.dataSources.length > 0) {
      const relevantData = Array.from(this.referenceData.values())
        .find(data => data.dataSource === query.dataSources[0]);
      
      if (relevantData) return relevantData;
    }
    
    return undefined;
  }
  
  // Add a message to the conversation
  public addConversationMessage(studyId: number, message: ConversationMessage): ConversationMessage[] {
    if (!this.conversations.has(studyId)) {
      this.conversations.set(studyId, []);
    }
    
    const conversation = this.conversations.get(studyId)!;
    conversation.push(message);
    this.conversations.set(studyId, conversation);
    
    return conversation;
  }
  
  // Create or update an analysis schedule
  public createOrUpdateSchedule(schedule: Schedule): Schedule {
    this.schedules.set(schedule.studyId, schedule);
    
    // Calculate next run date based on frequency
    if (schedule.enabled && schedule.startDate) {
      const startDate = new Date(schedule.startDate);
      let nextRun: Date;
      
      switch (schedule.frequency) {
        case 'daily':
          nextRun = addDays(startDate, 1);
          break;
        case 'weekly':
          nextRun = addDays(startDate, 7);
          break;
        case 'biweekly':
          nextRun = addDays(startDate, 14);
          break;
        case 'monthly':
          // Add approximately a month (30 days)
          nextRun = addDays(startDate, 30);
          break;
        default:
          nextRun = addDays(startDate, 7); // Default to weekly
      }
      
      schedule.nextRun = nextRun;
    }
    
    return schedule;
  }
  
  // Get a schedule for a study
  public getSchedule(studyId: number): Schedule | undefined {
    return this.schedules.get(studyId);
  }
  
  // Get all schedules
  public getAllSchedules(): Schedule[] {
    return Array.from(this.schedules.values());
  }
  
  // Create a reference data entry for a query
  public createReferenceData(queryId: string, dataSource: string, patientId: string): ReferenceData {
    const refId = 'REF-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Mock data points based on data source
    let dataPoints: Record<string, any> = {};
    
    if (dataSource === 'EDC') {
      dataPoints = {
        dob: '1975-06-15',
        gender: 'Female',
        race: 'Caucasian',
        visitDate: '2023-09-15',
        weight: '68.5 kg',
        height: '165 cm',
        bodyMassIndex: '25.1 kg/m2',
        bloodPressure: '125/82 mmHg',
        heartRate: '72 bpm',
        temperature: '36.7 °C'
      };
    } else if (dataSource === 'Lab') {
      dataPoints = {
        collectionDate: '2023-09-14',
        receivedDate: '2023-09-15',
        laboratoryId: 'LAB123',
        tests: [
          { name: 'Hemoglobin', value: '13.5', unit: 'g/dL', referenceRange: '12.0-16.0', flag: 'Normal' },
          { name: 'Leukocytes', value: '6.2', unit: 'x10^9/L', referenceRange: '4.0-11.0', flag: 'Normal' },
          { name: 'Platelets', value: '230', unit: 'x10^9/L', referenceRange: '150-400', flag: 'Normal' },
          { name: 'Creatinine', value: '1.4', unit: 'mg/dL', referenceRange: '0.6-1.2', flag: 'High' },
          { name: 'ALT', value: '45', unit: 'U/L', referenceRange: '7-40', flag: 'High' }
        ]
      };
    } else if (dataSource === 'CTMS') {
      dataPoints = {
        visitId: 'V3',
        scheduledDate: '2023-09-15',
        actualDate: '2023-09-17',
        status: 'Completed',
        deviations: [
          { category: 'Visit Window', description: 'Visit occurred 2 days after window', issueDate: '2023-09-17' }
        ],
        payments: [
          { type: 'Patient Travel', amount: 50.00, status: 'Pending' },
          { type: 'Visit Fee', amount: 200.00, status: 'Approved' }
        ]
      };
    } else {
      dataPoints = {
        studyDate: '2023-09-15',
        modality: 'MRI',
        bodyPart: 'Brain',
        findings: 'No significant abnormalities detected.',
        conclusion: 'Normal brain MRI.'
      };
    }
    
    const refData: ReferenceData = {
      id: refId,
      queryId,
      dataSource,
      recordId: 'REC-' + Math.floor(Math.random() * 10000),
      patientId,
      visitId: 'V' + (Math.floor(Math.random() * 5) + 1),
      dataPoints,
      createdAt: new Date()
    };
    
    this.referenceData.set(refId, refData);
    
    // Also link this reference data to the query
    const query = this.activeQueries.get(queryId);
    if (query) {
      query.referenceData = refId;
      this.activeQueries.set(queryId, query);
    }
    
    return refData;
  }
  
  // Get reference data for a query
  public getReferenceDataForQuery(queryId: string): ReferenceData | undefined {
    const query = this.activeQueries.get(queryId);
    if (query && query.referenceData) {
      return this.referenceData.get(query.referenceData);
    }
    
    // If not found, create a reference data entry
    if (query) {
      const dataSource = query.dataSources[0] || 'EDC';
      const patientId = '100-' + Math.floor(Math.random() * 100).toString().padStart(3, '0');
      return this.createReferenceData(queryId, dataSource, patientId);
    }
    
    return undefined;
  }
  
  // Update the queries with overdue status based on due date
  public updateQueryOverdueStatuses(): void {
    const today = new Date();
    
    // Loop through all active queries and update their overdue status
    Array.from(this.activeQueries.values()).forEach(query => {
      if (query.dueDate) {
        const daysUntilDue = Math.floor((query.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          query.overdueStatus = 'overdue';
        } else if (daysUntilDue <= 2) {
          query.overdueStatus = 'due-soon';
        } else {
          query.overdueStatus = 'on-time';
        }
        
        this.activeQueries.set(query.id, query);
      }
    });
  }
}

// Export a singleton instance
export const dmBotService = new DMBotService();