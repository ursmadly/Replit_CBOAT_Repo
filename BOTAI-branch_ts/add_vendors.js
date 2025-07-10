// Script to add additional vendors to the system
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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

async function addVendors() {
  console.log('Adding vendors...');
  let addedCount = 0;
  
  // First check existing vendors
  try {
    const response = await fetch('http://localhost:5000/api/vendors');
    const existingVendors = await response.json();
    console.log(`Current vendors: ${existingVendors.length}`);
    
    const existingNames = existingVendors.map(v => v.name);
    
    // Add each vendor that doesn't already exist
    for (const vendor of vendors) {
      if (!existingNames.includes(vendor.name)) {
        try {
          const res = await fetch('http://localhost:5000/api/vendors', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(vendor)
          });
          
          if (res.ok) {
            const newVendor = await res.json();
            console.log(`Added vendor: ${newVendor.name}, ID: ${newVendor.id}, Type: ${newVendor.type}`);
            addedCount++;
          } else {
            console.error(`Failed to add vendor ${vendor.name}: ${res.statusText}`);
          }
        } catch (error) {
          console.error(`Error adding vendor ${vendor.name}:`, error);
        }
      } else {
        console.log(`Vendor ${vendor.name} already exists, skipping.`);
      }
    }
    
    console.log(`Added ${addedCount} new vendors.`);
    
    // Verify the total count after adding
    const finalResponse = await fetch('http://localhost:5000/api/vendors');
    const finalVendors = await finalResponse.json();
    console.log(`Final vendor count: ${finalVendors.length}`);
    console.log('Vendors by type:');
    
    // Group vendors by type
    const typeGroups = {};
    for (const vendor of finalVendors) {
      if (!typeGroups[vendor.type]) {
        typeGroups[vendor.type] = [];
      }
      typeGroups[vendor.type].push(vendor.name);
    }
    
    // Print vendors by type
    for (const type in typeGroups) {
      console.log(`${type}: ${typeGroups[type].length} vendors`);
      console.log(`  ${typeGroups[type].join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error fetching existing vendors:', error);
  }
}

// Run the function
addVendors().catch(console.error);