#!/usr/bin/env node

/**
 * Migration script to fix "unknown" sessionIds in archived contexts
 * Scans all archived JSON files and generates proper sessionIds from content hash
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Archive base path
const ARCHIVE_BASE = path.join(
  process.env.HOME,
  '.c0ntextkeeper',
  'archive',
  'projects'
);

let fixedCount = 0;
let scannedCount = 0;
let errorCount = 0;
const changeLog = [];

/**
 * Generate a deterministic session ID from content
 */
function generateSessionId(context) {
  const timestamp = context.timestamp || new Date().toISOString();
  const content = JSON.stringify(context);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  
  // Format: session-YYYYMMDD-HASH8
  const date = timestamp.split('T')[0].replace(/-/g, '');
  const shortHash = hash.substring(0, 8);
  
  return `session-${date}-${shortHash}`;
}

/**
 * Process a single JSON file
 */
function processFile(filePath) {
  try {
    scannedCount++;
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf-8');
    const context = JSON.parse(content);
    
    // Check if sessionId is "unknown"
    if (context.sessionId === 'unknown') {
      const oldId = context.sessionId;
      const newId = generateSessionId(context);
      
      // Update the sessionId
      context.sessionId = newId;
      
      // Write back to file
      fs.writeFileSync(filePath, JSON.stringify(context, null, 2), 'utf-8');
      
      fixedCount++;
      changeLog.push({
        file: filePath,
        oldId: oldId,
        newId: newId,
        timestamp: context.timestamp
      });
      
      console.log(`✅ Fixed: ${path.basename(filePath)} -> ${newId}`);
    }
  } catch (error) {
    errorCount++;
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively scan directory for JSON files
 */
function scanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // Skip test directories to avoid processing test data
      if (entry.name !== 'test') {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      // Skip index files and READMEs
      if (!entry.name.includes('index.json') && !entry.name.includes('README')) {
        processFile(fullPath);
      }
    }
  }
}

/**
 * Main migration function
 */
function migrate() {
  console.log('🔧 c0ntextKeeper Session ID Migration Script');
  console.log('============================================');
  console.log(`📁 Scanning archive at: ${ARCHIVE_BASE}\n`);
  
  if (!fs.existsSync(ARCHIVE_BASE)) {
    console.error('❌ Archive directory not found. Please run c0ntextkeeper init first.');
    process.exit(1);
  }
  
  // Start scanning
  const startTime = Date.now();
  scanDirectory(ARCHIVE_BASE);
  const duration = Date.now() - startTime;
  
  // Print summary
  console.log('\n📊 Migration Summary');
  console.log('====================');
  console.log(`📂 Files scanned: ${scannedCount}`);
  console.log(`✅ Files fixed: ${fixedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
  
  // Save change log
  if (changeLog.length > 0) {
    const logPath = path.join(
      ARCHIVE_BASE,
      '..',
      `migration-log-${Date.now()}.json`
    );
    
    fs.writeFileSync(logPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        scanned: scannedCount,
        fixed: fixedCount,
        errors: errorCount,
        duration: duration
      },
      changes: changeLog
    }, null, 2), 'utf-8');
    
    console.log(`\n📝 Change log saved to: ${logPath}`);
  }
  
  if (fixedCount === 0) {
    console.log('\n✨ No files needed fixing. All session IDs are valid!');
  } else {
    console.log(`\n✨ Successfully fixed ${fixedCount} session ID${fixedCount > 1 ? 's' : ''}!`);
  }
}

// Run migration if executed directly
if (require.main === module) {
  migrate();
} else {
  module.exports = { generateSessionId, migrate };
}