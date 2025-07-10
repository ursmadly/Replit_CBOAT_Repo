/**
 * Script to create the notification_settings table
 */
import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function createNotificationSettingsTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database');

    // Check if the table already exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'notification_settings'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('notification_settings table already exists');
    } else {
      // Create the notification_settings table
      const createTableResult = await client.query(`
        CREATE TABLE notification_settings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
          email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
          push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
          critical_only BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);
      console.log('notification_settings table created successfully');
    }

    // Create initial notification settings for existing users
    const users = await client.query('SELECT id FROM users');
    
    for (const user of users.rows) {
      // Check if settings already exist for this user
      const settingsCheck = await client.query(
        'SELECT EXISTS (SELECT 1 FROM notification_settings WHERE user_id = $1)',
        [user.id]
      );
      
      if (!settingsCheck.rows[0].exists) {
        await client.query(`
          INSERT INTO notification_settings
          (user_id, email_notifications, push_notifications, critical_only)
          VALUES ($1, TRUE, TRUE, FALSE)
        `, [user.id]);
        console.log(`Created notification settings for user ID: ${user.id}`);
      }
    }

    console.log('Notification settings initialization complete');
  } catch (error) {
    console.error('Error creating notification_settings table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

createNotificationSettingsTable().catch(console.error);