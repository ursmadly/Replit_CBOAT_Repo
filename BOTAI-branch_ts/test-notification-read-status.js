/**
 * Script to create test notifications to verify notification read status
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTestNotifications() {
  try {
    // 1. Get user info - we'll create notifications for the first admin and data manager we find
    const usersQuery = `
      SELECT id, username, role FROM users 
      WHERE role IN ('System Administrator', 'Data Manager', 'EDC Data Manager') 
      LIMIT 3;
    `;
    
    const usersResult = await pool.query(usersQuery);
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('No suitable users found to create test notifications');
      process.exit(0);
    }
    
    // 2. Create one user-specific notification for each user
    for (let user of users) {
      const userNotification = {
        userId: user.id,
        title: `Test User Notification for ${user.username}`,
        description: `This is a test user-specific notification for ${user.username} role: ${user.role}`,
        type: 'system',
        priority: 'medium',
        read: false,
        createdAt: new Date()
      };
      
      await pool.query(`
        INSERT INTO notifications
        (user_id, title, description, type, priority, read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        userNotification.userId, 
        userNotification.title,
        userNotification.description,
        userNotification.type,
        userNotification.priority,
        userNotification.read,
        userNotification.createdAt
      ]);
      
      console.log(`Created user-specific notification for ${user.username} (${user.role})`);
    }
    
    // 3. Create role-based notification for each role
    const roles = ['System Administrator', 'Data Manager', 'EDC Data Manager', 'Medical Monitor'];
    
    for (let role of roles) {
      const roleNotification = {
        userId: null, // Role-based notifications have null userId
        title: `Test Role Notification for ${role}`,
        description: `This is a test role-based notification for all users with ${role} role`,
        type: 'system',
        priority: 'medium',
        targetRoles: [role], // Array containing role
        read: false,
        createdAt: new Date()
      };
      
      await pool.query(`
        INSERT INTO notifications
        (user_id, title, description, type, priority, target_roles, read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        roleNotification.userId, 
        roleNotification.title,
        roleNotification.description,
        roleNotification.type,
        roleNotification.priority,
        roleNotification.targetRoles,
        roleNotification.read,
        roleNotification.createdAt
      ]);
      
      console.log(`Created role-based notification for ${role}`);
    }
    
    console.log('Test notifications created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test notifications:', error);
    process.exit(1);
  }
}

createTestNotifications();