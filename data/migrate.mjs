#!/usr/bin/env node
/**
 * Database Migration Runner
 * 
 * Runs all migration files in the migrations directory
 * Usage: node migrate.mjs [up|down]
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function runMigrations(direction = 'up') {
  console.log(`\n🚀 Running migrations (${direction})...\n`);
  console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`Environment: ${process.env.ENVIRONMENT || 'development'}\n`);

  try {
    // Read all migration files
    const files = await readdir(MIGRATIONS_DIR);
    const migrationFiles = files
      .filter(file => file.endsWith('.mjs'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('⚠ No migration files found');
      return;
    }

    console.log(`Found ${migrationFiles.length} migration(s):\n`);

    let successCount = 0;
    let errorCount = 0;

    // Run each migration
    for (const file of migrationFiles) {
      const migrationPath = join(MIGRATIONS_DIR, file);
      console.log(`📄 Running migration: ${file}`);
      
      try {
        const migration = await import(migrationPath);
        
        if (typeof migration[direction] !== 'function') {
          console.log(`⚠ Migration ${file} does not have ${direction}() function, skipping`);
          continue;
        }

        await migration[direction]();
        console.log(`✓ Completed: ${file}\n`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed: ${file}`);
        console.error(`  Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log(`✓ Migration Summary:`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total: ${migrationFiles.length}`);
    console.log('═══════════════════════════════════════════\n');

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Migration runner failed:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const direction = process.argv[2] || 'up';

if (!['up', 'down'].includes(direction)) {
  console.error('Invalid direction. Use: node migrate.mjs [up|down]');
  process.exit(1);
}

runMigrations(direction);

