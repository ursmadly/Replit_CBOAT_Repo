import { execSync } from 'child_process';

// Using psql command with the DATABASE_URL environment variable
try {
  console.log('Creating notifications table...');
  
  // SQL command to create the notifications table
  const createTableSql = `
  CREATE TABLE IF NOT EXISTS "notifications" (
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
  `;
  
  // Execute SQL command using psql
  execSync(`echo "${createTableSql}" | psql $DATABASE_URL`, { stdio: 'inherit' });
  
  console.log('Notifications table created successfully!');
} catch (error) {
  console.error('Error creating notifications table:', error);
}