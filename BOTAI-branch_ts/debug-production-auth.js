/**
 * Advanced Production Authentication Debugger
 * This will help identify the exact cause of 401 errors
 */

import fetch from 'node-fetch';
import https from 'https';

const PRODUCTION_URL = 'https://boatai-venkatabondu.replit.app';

async function debugProductionAuth() {
  console.log('Advanced Production Authentication Debugger');
  console.log('===========================================\n');
  
  // Create agent that accepts self-signed certificates for testing
  const agent = new https.Agent({
    rejectUnauthorized: false
  });
  
  console.log('Testing authentication flow on production...\n');
  
  try {
    // Step 1: Test initial connection
    console.log('1. Testing basic connectivity...');
    const healthCheck = await fetch(`${PRODUCTION_URL}/`, {
      method: 'GET',
      agent: process.env.NODE_ENV === 'production' ? agent : undefined
    });
    console.log(`   Status: ${healthCheck.status}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(healthCheck.headers), null, 2)}`);
    
    // Step 2: Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginResponse = await fetch(`${PRODUCTION_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: '12345'
      }),
      agent: process.env.NODE_ENV === 'production' ? agent : undefined
    });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    console.log(`   Login Headers: ${JSON.stringify(Object.fromEntries(loginResponse.headers), null, 2)}`);
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.json();
      console.log(`   Login Success: ${JSON.stringify(loginData, null, 2)}`);
      
      // Extract cookies from login response
      const cookies = loginResponse.headers.get('set-cookie');
      console.log(`   Set-Cookie: ${cookies}`);
      
      if (cookies) {
        // Step 3: Test authenticated endpoint with cookies
        console.log('\n3. Testing notifications endpoint with session...');
        const notificationResponse = await fetch(`${PRODUCTION_URL}/api/notifications`, {
          method: 'GET',
          headers: {
            'Cookie': cookies
          },
          agent: process.env.NODE_ENV === 'production' ? agent : undefined
        });
        
        console.log(`   Notifications Status: ${notificationResponse.status}`);
        console.log(`   Notifications Headers: ${JSON.stringify(Object.fromEntries(notificationResponse.headers), null, 2)}`);
        
        if (notificationResponse.status === 200) {
          console.log('   SUCCESS: Authentication working properly!');
        } else {
          console.log('   ISSUE: Session not persisting properly');
          const errorText = await notificationResponse.text();
          console.log(`   Error: ${errorText}`);
        }
      } else {
        console.log('   ISSUE: No cookies set in login response');
      }
    } else {
      console.log('   ISSUE: Login failed');
      const errorText = await loginResponse.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`Connection Error: ${error.message}`);
  }
  
  console.log('\n4. Environment Variable Check...');
  console.log('================================');
  console.log('Make sure these are set in production:');
  console.log('NODE_ENV=production');
  console.log('SESSION_SECRET=f80322f691865f1eac41609203631bd4ebcfc2dcb5b37d8477301e7b3b325866');
  console.log('COOKIE_DOMAIN=.replit.app');
  
  console.log('\n5. Additional Debugging Steps...');
  console.log('================================');
  console.log('If auth is still failing:');
  console.log('1. Check browser Network tab for Set-Cookie headers');
  console.log('2. Verify cookies are being sent in subsequent requests');
  console.log('3. Check server logs for session-related errors');
  console.log('4. Try clearing all browser data');
  console.log('5. Test in incognito/private browsing mode');
}

debugProductionAuth().catch(console.error);