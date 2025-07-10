// add_signal.js - A simple script to add a single signal to the database
import { storage } from './server/storage.js';

async function addSignal() {
  try {
    // Create a single signal with dates as JavaScript Date objects
    const signal = {
      detectionId: "TEST_001",
      title: "Test Signal",
      trialId: 1,
      siteId: 1,
      dataReference: "Test Data",
      observation: "Test observation",
      priority: "Medium",
      status: "initiated",
      assignedTo: "John Carter",
      detectionDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      createdBy: "System",
      notifiedPersons: ["CRA", "Data Manager"]
    };
    
    console.log("Creating signal:", signal);
    const result = await storage.createSignalDetection(signal);
    console.log("Signal created successfully:", result);
  } catch (error) {
    console.error("Error creating signal:", error);
  }
}

// Run the function
addSignal();