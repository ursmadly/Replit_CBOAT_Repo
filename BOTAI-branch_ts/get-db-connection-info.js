/**
 * Script to safely extract database connection information from environment
 * Run this in your production environment to get connection details
 */

import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

function extractDatabaseInfo() {
  console.log('Database Connection Information Extractor');
  console.log('=========================================\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL environment variable not found');
    console.log('Check your deployment platform environment variables:');
    console.log('- Replit: Check Secrets tab');
    console.log('- Vercel: Check Environment Variables in project settings');
    console.log('- Heroku: Run "heroku config"');
    console.log('- Railway: Check Variables tab');
    return;
  }
  
  try {
    const url = new URL(databaseUrl);
    
    console.log('📊 Database Connection Details:');
    console.log('==============================');
    console.log(`Host: ${url.hostname}`);
    console.log(`Port: ${url.port || '5432'}`);
    console.log(`Database Name: ${url.pathname.substring(1)}`); // Remove leading slash
    console.log(`Username: ${url.username}`);
    console.log(`SSL: ${url.searchParams.get('sslmode') || 'enabled'}`);
    
    // Don't log the password for security
    console.log(`Password: ${'*'.repeat(url.password?.length || 0)}`);
    
    console.log('\n🔗 Connection String Format:');
    console.log('============================');
    console.log('postgresql://username:password@host:port/database');
    
    console.log('\n📋 For manual connection:');
    console.log('=========================');
    console.log(`psql -h ${url.hostname} -p ${url.port || '5432'} -U ${url.username} -d ${url.pathname.substring(1)}`);
    
  } catch (error) {
    console.log('❌ Error parsing DATABASE_URL:', error.message);
    console.log('DATABASE_URL format should be: postgresql://username:password@host:port/database');
  }
  
  // Additional environment info
  console.log('\n🌍 Environment Information:');
  console.log('===========================');
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`SESSION_SECRET: ${process.env.SESSION_SECRET ? 'set' : 'not set'}`);
  
  // Check other database-related variables
  const dbVars = [
    'PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'
  ];
  
  console.log('\n📍 Individual Database Variables:');
  console.log('=================================');
  dbVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      if (varName === 'PGPASSWORD') {
        console.log(`${varName}: ${'*'.repeat(value.length)}`);
      } else {
        console.log(`${varName}: ${value}`);
      }
    } else {
      console.log(`${varName}: not set`);
    }
  });
}

extractDatabaseInfo();