// Direct profile creation script that bypasses API validation
import { storage } from './storage.js';

async function createResourceProfilesDirectly() {
  try {
    // Get all resources
    const resources = await storage.getAllResources();
    
    console.log(`Found ${resources.length} resources to create profiles for`);
    
    // For each resource, create a profile
    for (const resource of resources) {
      console.log(`Creating profile for ${resource.name}, ID: ${resource.id}, Role: ${resource.role}`);
      
      // Build profile data based on role
      let metrics = {};
      let recommendations = [];
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
      
      // Create the profile directly with storage interface
      const profileData = {
        entityType: 'resource',
        entityId: resource.id,
        profileType: 'Resource',
        title: `${resource.name} ${resource.role} Performance Profile`,
        riskScore,
        metrics,
        recommendations,
        assessmentDate: new Date()
      };
      
      try {
        // Use the storage interface directly
        const profile = await storage.createRiskProfile(profileData);
        console.log(`Created profile ID: ${profile.id} for ${resource.name}`);
      } catch (error) {
        console.error(`Error creating profile for ${resource.name}:`, error);
      }
    }
    
    console.log('Resource profiles creation complete');
  } catch (error) {
    console.error('Error creating resource profiles:', error);
  }
}

createResourceProfilesDirectly();