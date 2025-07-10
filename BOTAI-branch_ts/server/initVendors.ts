import { storage } from './storage';
import { InsertVendor, ProfileType } from '@shared/schema';

/**
 * Initialize additional vendors for the system
 * Adds at least 10 vendors with different types and contact information
 */
export async function initAdditionalVendors() {
  console.log('Initializing additional vendor profiles...');
  
  const vendorData: InsertVendor[] = [
    {
      name: "Parexel",
      type: "CRO",
      contactPerson: "David Miller",
      contactEmail: "david.miller@parexel.com",
      status: "active"
    },
    {
      name: "Covance",
      type: "CRO",
      contactPerson: "Jennifer Adams",
      contactEmail: "jennifer.adams@covance.com",
      status: "active"
    },
    {
      name: "LabCorp",
      type: "Lab",
      contactPerson: "Thomas Wilson",
      contactEmail: "thomas.wilson@labcorp.com",
      status: "active"
    },
    {
      name: "Syneos Health",
      type: "CRO",
      contactPerson: "Laura Martinez",
      contactEmail: "laura.martinez@syneoshealth.com",
      status: "active"
    },
    {
      name: "Bioclinica",
      type: "Imaging",
      contactPerson: "Kevin Zhang",
      contactEmail: "kevin.zhang@bioclinica.com",
      status: "active"
    },
    {
      name: "ERT",
      type: "eCOA",
      contactPerson: "Amanda Johnson",
      contactEmail: "amanda.johnson@ert.com",
      status: "active"
    },
    {
      name: "Oracle Health Sciences",
      type: "EDC",
      contactPerson: "Richard Brown",
      contactEmail: "richard.brown@oracle.com",
      status: "active"
    },
    {
      name: "Veeva Systems",
      type: "CTMS",
      contactPerson: "Melissa Taylor",
      contactEmail: "melissa.taylor@veeva.com",
      status: "active"
    },
    {
      name: "Signant Health",
      type: "eCOA",
      contactPerson: "Christopher Lee",
      contactEmail: "christopher.lee@signanthealth.com",
      status: "active"
    },
    {
      name: "WCG",
      type: "IRB",
      contactPerson: "Patricia Garcia",
      contactEmail: "patricia.garcia@wcgclinical.com",
      status: "active"
    },
    {
      name: "Dotmatics",
      type: "Data Management",
      contactPerson: "Daniel Cooper",
      contactEmail: "daniel.cooper@dotmatics.com",
      status: "active"
    },
    {
      name: "CMIC",
      type: "CRO",
      contactPerson: "Takashi Yamamoto",
      contactEmail: "takashi.yamamoto@cmic.com",
      status: "active"
    },
    {
      name: "Premier Research",
      type: "CRO",
      contactPerson: "Elizabeth Smith",
      contactEmail: "elizabeth.smith@premier-research.com",
      status: "active"
    },
    {
      name: "Pharmaceutical Product Development (PPD)",
      type: "CRO",
      contactPerson: "Jonathan Park",
      contactEmail: "jonathan.park@ppd.com",
      status: "active"
    },
    {
      name: "Chiltern",
      type: "CRO",
      contactPerson: "Sophia Chen",
      contactEmail: "sophia.chen@chiltern.com",
      status: "active"
    }
  ];

  // Create each vendor and a corresponding vendor profile
  for (const vendorInfo of vendorData) {
    try {
      const vendor = await storage.createVendor(vendorInfo);
      console.log(`Created vendor: ${vendor.name}, ID: ${vendor.id}, Type: ${vendor.type}`);
      
      // Create a vendor profile with performance metrics
      await storage.createRiskProfile({
        entityType: "vendor",
        entityId: vendor.id,
        profileType: ProfileType.VENDOR,
        title: `${vendor.name} Performance Profile`,
        riskScore: Math.floor(Math.random() * 50) + 30, // Random score between 30-80
        assessmentDate: new Date(),
        metrics: {
          serviceQuality: Math.floor(Math.random() * 40) + 50,      // 50-90
          deliveryTimeliness: Math.floor(Math.random() * 40) + 50,  // 50-90
          communication: Math.floor(Math.random() * 40) + 50,       // 50-90
          issueResolution: Math.floor(Math.random() * 40) + 50,     // 50-90
          contractCompliance: Math.floor(Math.random() * 40) + 50   // 50-90
        },
        recommendations: [
          `Review ${vendor.type} performance metrics quarterly`,
          `Schedule performance review meeting with ${vendor.name}`,
          `Update vendor management plan for ${vendor.name}`,
          `Consider contractual adjustments based on performance`
        ]
      });
      console.log(`Created profile for vendor: ${vendor.name}`);
    } catch (error) {
      console.error(`Error creating vendor ${vendorInfo.name}:`, error);
    }
  }

  console.log('Additional vendor profiles initialization complete');
}