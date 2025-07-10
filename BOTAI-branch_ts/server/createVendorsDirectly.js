// Script to add vendors directly to the database 
// This bypasses the API and adds them directly to storage

const { storage } = require('./storage');

async function createVendorsDirectly() {
  console.log('Adding vendors directly to storage...');
  
  // List of vendors to add
  const vendors = [
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
      name: "PRA Health Sciences",
      type: "CRO",
      contactPerson: "Jonathan Park",
      contactEmail: "jonathan.park@prahs.com",
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

  try {
    // Get existing vendors to check for duplicates
    const existingVendors = await storage.getAllVendors();
    console.log(`Current vendors: ${existingVendors.length}`);
    
    const existingNames = existingVendors.map(v => v.name);
    let addedCount = 0;
    
    // Add each vendor that doesn't already exist
    for (const vendor of vendors) {
      if (!existingNames.includes(vendor.name)) {
        try {
          const newVendor = await storage.createVendor(vendor);
          console.log(`Added vendor: ${newVendor.name}, ID: ${newVendor.id}, Type: ${newVendor.type}`);
          addedCount++;
          
          // Create a vendor profile with metrics for each new vendor
          await storage.createRiskProfile({
            entityType: "vendor",
            entityId: newVendor.id,
            profileType: "Vendor",
            title: `${newVendor.name} Performance Profile`,
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
              `Review ${newVendor.type} performance metrics quarterly`,
              `Schedule performance review meeting with ${newVendor.name}`,
              `Update vendor management plan for ${newVendor.name}`,
              `Consider contractual adjustments based on performance`
            ]
          });
          console.log(`Created profile for vendor: ${newVendor.name}`);
        } catch (error) {
          console.error(`Error creating vendor ${vendor.name}:`, error);
        }
      } else {
        console.log(`Vendor ${vendor.name} already exists, skipping.`);
      }
    }
    
    console.log(`Added ${addedCount} new vendors directly to storage.`);
    
    // Verify the final count and display vendors by type
    const finalVendors = await storage.getAllVendors();
    console.log(`Final vendor count: ${finalVendors.length}`);
    
    // Group vendors by type
    const typeGroups = {};
    for (const vendor of finalVendors) {
      if (!typeGroups[vendor.type]) {
        typeGroups[vendor.type] = [];
      }
      typeGroups[vendor.type].push(vendor.name);
    }
    
    // Print vendors by type
    console.log('Vendors by type:');
    for (const type in typeGroups) {
      console.log(`${type}: ${typeGroups[type].length} vendors`);
      console.log(`  ${typeGroups[type].join(', ')}`);
    }
    
    return { success: true, added: addedCount, total: finalVendors.length };
  } catch (error) {
    console.error('Error adding vendors directly:', error);
    return { success: false, error: error.message };
  }
}

// Execute if run directly from command line
if (require.main === module) {
  createVendorsDirectly().then(result => {
    console.log('Vendor creation completed:', result);
    process.exit(0);
  }).catch(error => {
    console.error('Error in vendor creation script:', error);
    process.exit(1);
  });
}

module.exports = { createVendorsDirectly };