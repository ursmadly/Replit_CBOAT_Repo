import { storage } from './storage';
import { EntityType, ProfileType, Resource } from '@shared/schema';

/**
 * Initialize the database with sample profiles for demo purposes
 */
export async function initRiskProfiles() {
  console.log('Initializing sample risk profiles...');
  
  // Risk profiles
  await storage.createRiskProfile({
    title: 'Clinical Trial Safety Risk Profile',
    profileType: ProfileType.RISK,
    entityType: EntityType.TRIAL,
    entityId: 1,
    riskScore: 78,
    assessmentDate: new Date(),
    recommendations: [
      'Increase monitoring frequency',
      'Conduct safety review meeting with sites',
      'Update risk mitigation plan'
    ],
    metrics: {
      severityScore: 4,
      likelihoodScore: 3,
      detectionDifficulty: 3,
      dimensions: ['Safety', 'Protocol Compliance', 'Adverse Events']
    }
  });
  
  await storage.createRiskProfile({
    title: 'Site Enrollment Risk',
    profileType: ProfileType.RISK,
    entityType: EntityType.SITE,
    entityId: 2,
    riskScore: 85,
    assessmentDate: new Date(),
    recommendations: [
      'Conduct enrollment strategy meeting',
      'Increase site support',
      'Review inclusion/exclusion criteria'
    ],
    metrics: {
      severityScore: 4,
      likelihoodScore: 4,
      detectionDifficulty: 2,
      dimensions: ['Enrollment', 'Retention', 'Site Performance']
    }
  });
  
  // Quality profiles
  await storage.createRiskProfile({
    title: 'Protocol Compliance Quality Assessment',
    profileType: ProfileType.QUALITY,
    entityType: EntityType.TRIAL,
    entityId: 1,
    riskScore: 64,
    assessmentDate: new Date(),
    recommendations: [
      'Conduct refresher training for sites',
      'Implement quality control checks',
      'Improve documentation process'
    ],
    metrics: {
      severityScore: 3,
      likelihoodScore: 3,
      detectionDifficulty: 2,
      dimensions: ['Protocol Adherence', 'Documentation Quality', 'Query Resolution']
    }
  });
  
  await storage.createRiskProfile({
    title: 'Data Quality Profile',
    profileType: ProfileType.QUALITY,
    entityType: EntityType.TRIAL,
    entityId: 2,
    riskScore: 52,
    assessmentDate: new Date(),
    recommendations: [
      'Improve data validation process',
      'Conduct data quality review',
      'Update data management plan'
    ],
    metrics: {
      severityScore: 3,
      likelihoodScore: 2,
      detectionDifficulty: 3,
      dimensions: ['Data Accuracy', 'Completeness', 'Consistency']
    }
  });
  
  // Compliance profiles
  await storage.createRiskProfile({
    title: 'Regulatory Compliance Assessment',
    profileType: ProfileType.COMPLIANCE,
    entityType: EntityType.TRIAL,
    entityId: 1,
    riskScore: 45,
    assessmentDate: new Date(),
    recommendations: [
      'Review regulatory documentation',
      'Update compliance tracking system',
      'Schedule regulatory inspection readiness audit'
    ],
    metrics: {
      severityScore: 2,
      likelihoodScore: 2,
      detectionDifficulty: 4,
      dimensions: ['Regulatory Submissions', 'Ethics Compliance', 'Protocol Amendments']
    }
  });
  
  // Safety profiles
  await storage.createRiskProfile({
    title: 'Patient Safety Profile',
    profileType: ProfileType.SAFETY,
    entityType: EntityType.TRIAL,
    entityId: 1,
    riskScore: 72,
    assessmentDate: new Date(),
    recommendations: [
      'Increase safety monitoring',
      'Review all adverse events trends',
      'Conduct safety committee meeting'
    ],
    metrics: {
      severityScore: 4,
      likelihoodScore: 3,
      detectionDifficulty: 2,
      dimensions: ['Adverse Events', 'SAE Reporting', 'Drug Safety']
    }
  });
  
  // Vendor profiles
  await storage.createRiskProfile({
    title: 'CRO Performance Profile',
    profileType: ProfileType.VENDOR,
    entityType: EntityType.VENDOR,
    entityId: 1,
    riskScore: 38,
    assessmentDate: new Date(),
    recommendations: [
      'Review vendor KPIs',
      'Schedule performance review meeting',
      'Update vendor management plan'
    ],
    metrics: {
      severityScore: 2,
      likelihoodScore: 2,
      detectionDifficulty: 3,
      dimensions: ['Quality of Deliverables', 'Timeline Adherence', 'Communication']
    }
  });
  
  // Financial profiles
  await storage.createRiskProfile({
    title: 'Budget Risk Assessment',
    profileType: ProfileType.FINANCIAL,
    entityType: EntityType.TRIAL,
    entityId: 1,
    riskScore: 68,
    assessmentDate: new Date(),
    recommendations: [
      'Review budget allocation',
      'Optimize resource distribution',
      'Implement cost controls'
    ],
    metrics: {
      severityScore: 3,
      likelihoodScore: 3,
      detectionDifficulty: 3,
      dimensions: ['Budget Variance', 'Cost Forecasting', 'Resource Allocation']
    }
  });
  
  // Resource profiles
  await storage.createRiskProfile({
    title: 'CRA Performance Profile',
    profileType: ProfileType.RESOURCE,
    entityType: EntityType.RESOURCE,
    entityId: 1,
    riskScore: 32,
    assessmentDate: new Date(),
    recommendations: [
      'Provide additional training',
      'Implement performance improvement plan',
      'Schedule coaching sessions'
    ],
    metrics: {
      severityScore: 2,
      likelihoodScore: 2,
      detectionDifficulty: 2,
      dimensions: ['Site Visit Quality', 'Query Management', 'Protocol Knowledge']
    }
  });
  
  await storage.createRiskProfile({
    title: 'Medical Monitor Workload Profile',
    profileType: ProfileType.RESOURCE,
    entityType: EntityType.RESOURCE,
    entityId: 2,
    riskScore: 57,
    assessmentDate: new Date(),
    recommendations: [
      'Review workload distribution',
      'Provide additional support',
      'Optimize query workflow'
    ],
    metrics: {
      severityScore: 3,
      likelihoodScore: 3,
      detectionDifficulty: 2,
      dimensions: ['Response Time', 'Query Resolution', 'Safety Assessment']
    }
  });
  
  console.log('Sample risk profiles initialized successfully.');
}

/**
 * Create resource profiles for all personnel
 */
export async function initResourceProfiles() {
  console.log('Creating resource profiles for all personnel...');
  
  try {
    // Get all resources
    const resources = await storage.getAllResources();
    
    console.log(`Found ${resources.length} resources to create profiles for`);
    
    // For each resource, create a profile
    for (const resource of resources) {
      console.log(`Creating profile for ${resource.name}, ID: ${resource.id}, Role: ${resource.role}`);
      
      // Build profile data based on role
      let metrics: Record<string, number> = {};
      let recommendations: string[] = [];
      let riskScore = 0;
      
      switch(resource.role) {
        case 'CRA':
          metrics = {
            expertise: 80,
            performance: 75,
            responseTime: 85,
            workloadCapacity: 65,
            processAdherence: 78,
            trainingCompletion: 100
          };
          recommendations = [
            "Provide additional site visit training",
            "Schedule regular check-ins with study manager",
            "Improve documentation quality",
            "Focus on timely query resolution"
          ];
          riskScore = 35;
          break;
          
        case 'Data Manager':
          metrics = {
            expertise: 92,
            performance: 90,
            responseTime: 95,
            workloadCapacity: 80,
            processAdherence: 90,
            trainingCompletion: 100
          };
          recommendations = [
            "Excellent data management performance",
            "Consider for promotion to lead data manager",
            "Share best practices with other data managers"
          ];
          riskScore = 25;
          break;
          
        case 'Medical Monitor':
          metrics = {
            expertise: 95,
            performance: 85,
            responseTime: 75,
            workloadCapacity: 90,
            processAdherence: 88,
            trainingCompletion: 100
          };
          recommendations = [
            "Consider workload adjustment",
            "Implement faster query response process",
            "Excellent medical expertise"
          ];
          riskScore = 30;
          break;
          
        case 'Central Data Quality Monitor':
          metrics = {
            expertise: 88,
            performance: 92,
            responseTime: 80,
            workloadCapacity: 75,
            processAdherence: 95,
            trainingCompletion: 100
          };
          recommendations = [
            "Advanced quality monitoring training",
            "Develop additional data quality metrics",
            "Share risk detection methodology"
          ];
          riskScore = 20;
          break;
          
        default:
          metrics = {
            expertise: 80,
            performance: 80,
            responseTime: 80,
            workloadCapacity: 80,
            processAdherence: 80,
            trainingCompletion: 90
          };
          recommendations = [
            "Standard performance review recommended",
            "Schedule regular training updates"
          ];
          riskScore = 35;
      }
      
      // Use direct storage method to create the profile
      try {
        await storage.createRiskProfile({
          entityType: 'resource',
          entityId: resource.id,
          profileType: ProfileType.RESOURCE,
          title: `${resource.name} ${resource.role} Performance Profile`,
          riskScore,
          metrics,
          recommendations,
          assessmentDate: new Date()
        });
        console.log(`Created profile for ${resource.name}`);
      } catch (error) {
        console.error(`Error creating profile for ${resource.name}:`, error);
      }
    }
    
    console.log('Resource profiles creation complete');
  } catch (error) {
    console.error('Error creating resource profiles:', error);
  }
}