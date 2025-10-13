#!/usr/bin/env node
/**
 * Database Seed Runner
 * 
 * Runs all seed files in the seeds directory
 * Usage: node seed.mjs
 */

import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SEEDS_DIR = join(__dirname, 'seeds');

async function runSeeds() {
  console.log('\n🌱 Running seeds...\n');
  console.log(`AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`Environment: ${process.env.ENVIRONMENT || 'development'}\n`);

  try {
    // Read all seed files
    const files = await readdir(SEEDS_DIR);
    const seedFiles = files
      .filter(file => file.endsWith('.mjs'))
      .sort();

    if (seedFiles.length === 0) {
      console.log('⚠ No seed files found');
      return;
    }

    console.log(`Found ${seedFiles.length} seed(s):\n`);

    let successCount = 0;
    let errorCount = 0;

    // Run each seed
    for (const file of seedFiles) {
      const seedPath = join(SEEDS_DIR, file);
      console.log(`📄 Running seed: ${file}`);
      
      try {
        const seedModule = await import(seedPath);
        
        if (typeof seedModule.seed !== 'function') {
          console.log(`⚠ Seed ${file} does not have seed() function, skipping`);
          continue;
        }

        await seedModule.seed();
        console.log(`✓ Completed: ${file}\n`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed: ${file}`);
        console.error(`  Error: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('═══════════════════════════════════════════');
    console.log(`✓ Seed Summary:`);
    console.log(`  Success: ${successCount}`);
    console.log(`  Errors: ${errorCount}`);
    console.log(`  Total: ${seedFiles.length}`);
    console.log('═══════════════════════════════════════════\n');

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Seed runner failed:', error);
    process.exit(1);
  }
}

runSeeds();

