#!/usr/bin/env node

/**
 * Database Migration Runner
 * Executes SQL migrations using PostgreSQL client
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function runMigration() {
  console.log('=========================================');
  console.log('  TaskBridge Database Migration');
  console.log('=========================================\n');

  // Extract project ref from SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL;
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Error: Could not extract project ref from SUPABASE_URL');
    process.exit(1);
  }

  console.log(`✓ Project: ${projectRef}\n`);

  // Migration file path
  const migrationFile = process.argv[2] || '20251101000000_add_app_testing_domain.sql';
  const migrationPath = path.join(__dirname, migrationFile);

  if (!fs.existsSync(migrationPath)) {
    console.error(`❌ Error: Migration file '${migrationFile}' not found`);
    process.exit(1);
  }

  console.log(`Running migration: ${migrationFile}\n`);

  // Read SQL file
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Create PostgreSQL client with direct connection
  const client = new Client({
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_SERVICE_KEY,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Connect to database
    console.log('Connecting to database...');
    await client.connect();
    console.log('✓ Connected\n');

    // Execute migration
    console.log('Executing migration...');
    await client.query(sql);
    console.log('✓ Migration completed successfully\n');

    console.log('=========================================');
    console.log('  Migration completed!');
    console.log('=========================================\n');

    console.log('Next steps:');
    console.log('1. Verify changes in Supabase Dashboard');
    console.log('2. Update backend API to use new fields');
    console.log('3. Update frontend forms for app_testing domain\n');

  } catch (error) {
    console.error('\n=========================================');
    console.error('  Migration failed!');
    console.error('=========================================\n');
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
