/**
 * Generate a secure session secret for production
 */

import crypto from 'crypto';

function generateSessionSecret() {
  console.log('Session Secret Generator');
  console.log('=======================\n');
  
  // Generate a cryptographically secure random string
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  
  console.log('Generated SESSION_SECRET:');
  console.log(sessionSecret);
  
  console.log('\nAdd this to your production environment variables:');
  console.log(`SESSION_SECRET=${sessionSecret}`);
  
  console.log('\nSecurity Notes:');
  console.log('- Keep this secret secure and private');
  console.log('- Use the same secret across all server instances');
  console.log('- Never commit this to version control');
  console.log('- Regenerating this will invalidate all existing sessions');
  
  return sessionSecret;
}

generateSessionSecret();