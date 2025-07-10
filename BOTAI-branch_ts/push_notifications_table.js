import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function pushNotificationsTable() {
  try {
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Check if table exists
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'notifications'
        );
      `);
      
      const tableExists = checkResult.rows[0].exists;
      
      if (!tableExists) {
        console.log('Creating notifications table...');
        
        // Create notifications table
        await client.query(`
          CREATE TABLE "notifications" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER REFERENCES "users"("id"),
            "title" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "priority" TEXT NOT NULL,
            "trial_id" INTEGER REFERENCES "trials"("id"),
            "source" TEXT,
            "related_entity_type" TEXT,
            "related_entity_id" INTEGER,
            "read" BOOLEAN NOT NULL DEFAULT false,
            "action_required" BOOLEAN NOT NULL DEFAULT false,
            "action_url" TEXT,
            "target_roles" TEXT[],
            "target_users" INTEGER[],
            "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
            "read_at" TIMESTAMP
          );
        `);
        
        console.log('Notifications table created successfully');
      } else {
        console.log('Notifications table already exists');
      }
      
      // Commit transaction
      await client.query('COMMIT');
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error creating notifications table:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
pushNotificationsTable();