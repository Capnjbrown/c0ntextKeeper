#!/usr/bin/env node

/**
 * Script to clean up duplicate prompts folders created by the path bug
 * Moves files from subdirectories to root level with proper naming
 */

const fs = require('fs');
const path = require('path');

function cleanupPromptsFolder(archivePath) {
  const promptsPath = path.join(archivePath, 'archive', 'projects', 'c0ntextKeeper', 'prompts');

  console.log('🧹 Cleaning up prompts folder structure...');
  console.log(`📁 Path: ${promptsPath}`);

  if (!fs.existsSync(promptsPath)) {
    console.log('❌ Prompts folder not found');
    return;
  }

  // Find all subdirectories that look like dates
  const entries = fs.readdirSync(promptsPath);
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  let movedCount = 0;
  let removedCount = 0;

  for (const entry of entries) {
    const fullPath = path.join(promptsPath, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && datePattern.test(entry)) {
      console.log(`\n📂 Found date subfolder: ${entry}`);

      // Check for prompts.json inside
      const subFile = path.join(fullPath, 'prompts.json');
      if (fs.existsSync(subFile)) {
        // Target file with correct naming
        const targetFile = path.join(promptsPath, `${entry}-prompts.json`);

        if (fs.existsSync(targetFile)) {
          // Merge the files if target already exists
          console.log(`  ⚠️ Target file already exists: ${entry}-prompts.json`);
          console.log(`  📊 Merging content...`);

          const existingData = JSON.parse(fs.readFileSync(targetFile, 'utf-8'));
          const newData = JSON.parse(fs.readFileSync(subFile, 'utf-8'));

          // Merge arrays (assuming they contain prompt objects)
          const merged = Array.isArray(existingData) && Array.isArray(newData)
            ? [...existingData, ...newData]
            : existingData; // Keep existing if not both arrays

          // Remove duplicates based on timestamp
          const unique = Array.from(
            new Map(merged.map(item => [item.timestamp, item])).values()
          );

          fs.writeFileSync(targetFile, JSON.stringify(unique, null, 2));
          console.log(`  ✅ Merged ${newData.length} items (${unique.length} unique)`);

          // Remove the subdirectory file
          fs.unlinkSync(subFile);
        } else {
          // Move the file
          fs.renameSync(subFile, targetFile);
          console.log(`  ✅ Moved to: ${entry}-prompts.json`);
          movedCount++;
        }

        // Remove the empty directory
        try {
          fs.rmdirSync(fullPath);
          console.log(`  🗑️ Removed empty directory`);
          removedCount++;
        } catch (err) {
          console.log(`  ⚠️ Could not remove directory (may not be empty): ${err.message}`);
        }
      }
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Files moved: ${movedCount}`);
  console.log(`  🗑️ Directories removed: ${removedCount}`);

  // List current files
  console.log('\n📋 Current prompts files:');
  const finalEntries = fs.readdirSync(promptsPath);
  for (const entry of finalEntries) {
    const fullPath = path.join(promptsPath, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && entry.endsWith('.json')) {
      const size = (stat.size / 1024).toFixed(1);
      console.log(`  - ${entry} (${size} KB)`);
    }
  }
}

// Run the cleanup
const archivePath = process.env.HOME + '/.c0ntextkeeper';
cleanupPromptsFolder(archivePath);

console.log('\n✨ Cleanup complete!');