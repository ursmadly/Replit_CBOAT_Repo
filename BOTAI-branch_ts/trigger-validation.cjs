/**
 * Script to manually trigger domain data validation after a record update
 */

// Load the environment variables
require('dotenv').config();

async function triggerValidation() {
  try {
    console.log('Manually triggering domain data validation...');
    
    // Import the analyzeDomainData function from dataManagerWorkflow
    // We need to use dynamic import for ESM modules in a CommonJS script
    const { createRequire } = require('module');
    const require = createRequire(import.meta.url);
    
    // Define the parameters for validation
    const TRIAL_ID = 3;
    const DOMAIN = 'LB';
    const SOURCE = 'EDC';
    const RECORD_ID = 'LB-EDC-3-1-1'; // The record we just updated
    
    // Convert to TypeScript/ESM temporarily for importing the module
    const { spawn } = require('child_process');
    
    // Create a temporary script to run the validation
    const tempScript = `
    import { analyzeDomainData } from './server/dataManagerWorkflow.js';
    
    async function run() {
      try {
        console.log('Triggering domain validation for record ${RECORD_ID}...');
        await analyzeDomainData(${TRIAL_ID}, '${DOMAIN}', '${SOURCE}', ['${RECORD_ID}']);
        console.log('Domain validation completed');
      } catch (error) {
        console.error('Error in validation:', error);
      }
    }
    
    run();
    `;
    
    // Write the temporary script to a file
    const fs = require('fs');
    fs.writeFileSync('temp-trigger.js', tempScript);
    
    // Run the script with tsx
    console.log('Executing validation script...');
    const child = spawn('npx', ['tsx', 'temp-trigger.js']);
    
    child.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    child.on('close', (code) => {
      console.log(`Validation script exited with code ${code}`);
      // Clean up the temporary script
      fs.unlinkSync('temp-trigger.js');
    });
    
    console.log('Check the Tasks page in the application to see if a new task was created');
  } catch (error) {
    console.error('Error triggering validation:', error);
  }
}

// Run the function
triggerValidation();