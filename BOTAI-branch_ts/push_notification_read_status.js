/**
 * Script to create the notification_read_status table in the database
 */
import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createNotificationReadStatusTable() {
  try {
    // Check if the table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notification_read_status'
      );
    `;
    
    const tableExistsResult = await pool.query(checkTableQuery);
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (tableExists) {
      console.log('notification_read_status table already exists, skipping creation');
      process.exit(0);
    }
    
    // Create the table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notification_read_status (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_user_notification UNIQUE (notification_id, user_id)
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('notification_read_status table created successfully');
    
    // Create indexes to speed up lookups
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_notification_read_status_user_id ON notification_read_status(user_id);
      CREATE INDEX IF NOT EXISTS idx_notification_read_status_notification_id ON notification_read_status(notification_id);
    `;
    
    await pool.query(createIndexQuery);
    console.log('Indexes created for notification_read_status table');

    process.exit(0);
  } catch (error) {
    console.error('Error creating notification_read_status table:', error);
    process.exit(1);
  }
}

createNotificationReadStatusTable();