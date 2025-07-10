/**
 * Production Notification System Diagnostic Tool
 * Run this script in your production environment to identify notification issues
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function runProductionDiagnostic() {
  console.log('🔍 Starting Production Notification System Diagnostic...\n');
  
  // 1. Environment Variables Check
  console.log('📋 ENVIRONMENT VARIABLES CHECK:');
  console.log('================================');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'NODE_ENV'
  ];
  
  const optionalEnvVars = [
    'SENDGRID_API_KEY',
    'SENDGRID_AUTH_MAIL',
    'SENDGRID_TASK_TEMPLATE_ID'
  ];
  
  let envIssues = [];
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: SET`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      envIssues.push(varName);
    }
  });
  
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`ℹ️  ${varName}: SET`);
    } else {
      console.log(`⚠️  ${varName}: NOT SET (optional)`);
    }
  });
  
  console.log(`\nNode Environment: ${process.env.NODE_ENV || 'NOT SET'}`);
  
  if (envIssues.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${envIssues.join(', ')}`);
    return;
  }
  
  // 2. Database Connection Test
  console.log('\n🔌 DATABASE CONNECTION TEST:');
  console.log('============================');
  
  let pool;
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`✅ Database query test successful: ${result.rows[0].current_time}`);
    
    client.release();
  } catch (error) {
    console.log(`❌ Database connection failed: ${error.message}`);
    return;
  }
  
  // 3. Database Schema Check
  console.log('\n📊 DATABASE SCHEMA CHECK:');
  console.log('=========================');
  
  const requiredTables = [
    'users',
    'trials',
    'tasks',
    'notifications',
    'notification_settings',
    'notification_read_status'
  ];
  
  try {
    const client = await pool.connect();
    
    for (const tableName of requiredTables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      if (result.rows[0].exists) {
        console.log(`✅ Table '${tableName}' exists`);
        
        // Get row count for key tables
        if (['users', 'notifications', 'tasks'].includes(tableName)) {
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`   📊 Contains ${countResult.rows[0].count} records`);
        }
      } else {
        console.log(`❌ Table '${tableName}' missing`);
      }
    }
    
    client.release();
  } catch (error) {
    console.log(`❌ Schema check failed: ${error.message}`);
  }
  
  // 4. Session Store Check
  console.log('\n🔐 SESSION STORE CHECK:');
  console.log('======================');
  
  try {
    const client = await pool.connect();
    
    // Check if session table exists
    const sessionTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'session'
      );
    `);
    
    if (sessionTableCheck.rows[0].exists) {
      console.log('✅ Session table exists');
      
      const sessionCount = await client.query('SELECT COUNT(*) as count FROM session');
      console.log(`   📊 Active sessions: ${sessionCount.rows[0].count}`);
    } else {
      console.log('❌ Session table missing - this will cause authentication issues');
    }
    
    client.release();
  } catch (error) {
    console.log(`❌ Session store check failed: ${error.message}`);
  }
  
  // 5. Notification System Functional Test
  console.log('\n🔔 NOTIFICATION SYSTEM FUNCTIONAL TEST:');
  console.log('======================================');
  
  try {
    const client = await pool.connect();
    
    // Test notification creation
    const testNotification = {
      title: 'Production Diagnostic Test',
      description: 'This is a test notification created by the diagnostic tool',
      type: 'system',
      priority: 'low',
      created_at: new Date()
    };
    
    const insertResult = await client.query(`
      INSERT INTO notifications (title, description, type, priority, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      testNotification.title,
      testNotification.description,
      testNotification.type,
      testNotification.priority,
      testNotification.created_at
    ]);
    
    const testNotificationId = insertResult.rows[0].id;
    console.log(`✅ Test notification created with ID: ${testNotificationId}`);
    
    // Test notification retrieval
    const selectResult = await client.query('SELECT * FROM notifications WHERE id = $1', [testNotificationId]);
    if (selectResult.rows.length > 0) {
      console.log('✅ Test notification retrieved successfully');
    } else {
      console.log('❌ Failed to retrieve test notification');
    }
    
    // Clean up test notification
    await client.query('DELETE FROM notifications WHERE id = $1', [testNotificationId]);
    console.log('✅ Test notification cleaned up');
    
    client.release();
  } catch (error) {
    console.log(`❌ Notification functional test failed: ${error.message}`);
  }
  
  // 6. User Authentication Test
  console.log('\n👤 USER AUTHENTICATION TEST:');
  console.log('============================');
  
  try {
    const client = await pool.connect();
    
    // Check if there are active users
    const userResult = await client.query(`
      SELECT COUNT(*) as total_users,
             COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
      FROM users
    `);
    
    const { total_users, active_users } = userResult.rows[0];
    console.log(`📊 Total users: ${total_users}`);
    console.log(`📊 Active users: ${active_users}`);
    
    if (active_users > 0) {
      console.log('✅ Active users found - authentication should work');
    } else {
      console.log('❌ No active users found - this will prevent login');
    }
    
    client.release();
  } catch (error) {
    console.log(`❌ User authentication test failed: ${error.message}`);
  }
  
  // 7. API Endpoint Accessibility Test
  console.log('\n🌐 API ENDPOINT TEST:');
  console.log('====================');
  
  console.log('ℹ️  To test API endpoints, ensure your server is running and try:');
  console.log('   GET /api/notifications (requires authentication)');
  console.log('   GET /api/notifications/count (requires authentication)');
  console.log('   POST /api/notifications/mark-read (requires authentication)');
  
  // 8. Summary and Recommendations
  console.log('\n📋 DIAGNOSTIC SUMMARY:');
  console.log('======================');
  
  if (envIssues.length === 0) {
    console.log('✅ Environment variables properly configured');
  } else {
    console.log('❌ Environment variable issues detected');
  }
  
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('=======================');
  console.log('1. Ensure all required environment variables are set in production');
  console.log('2. Verify database tables exist and contain data');
  console.log('3. Check that session store is working properly');
  console.log('4. Test authentication flow with actual user accounts');
  console.log('5. Monitor server logs for specific error messages');
  
  if (pool) {
    await pool.end();
  }
  
  console.log('\n✅ Diagnostic complete!');
}

// Run the diagnostic
runProductionDiagnostic().catch(console.error);