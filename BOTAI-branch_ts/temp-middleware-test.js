
    // Import required modules
    import { db } from './server/db.js';
    import { analyzeDomainData } from './server/dataManagerWorkflow.js';
    
    async function testAnalysis() {
      try {
        console.log('Executing middleware simulation...');
        await analyzeDomainData(3, 'LB', 'EDC');
        console.log('Domain data analysis completed');
      } catch (error) {
        console.error('Error during analysis:', error);
      } finally {
        await db.pool.end();
      }
    }
    
    testAnalysis().catch(console.error);
    