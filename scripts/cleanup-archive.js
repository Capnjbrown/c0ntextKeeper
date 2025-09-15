#!/usr/bin/env node

/**
 * Archive Cleanup Script
 * Cleans up the c0ntextKeeper archive structure
 * - Removes corrupted backup files
 * - Removes .DS_Store files
 * - Consolidates date folders with their JSON files
 * - Removes empty directories
 */

const fs = require('fs').promises;
const path = require('path');

const ARCHIVE_PATH = path.join(process.env.HOME, '.c0ntextkeeper', 'archive');
const DRY_RUN = process.argv.includes('--dry-run');

async function cleanupArchive() {
  console.log(`🧹 c0ntextKeeper Archive Cleanup`);
  console.log(`📁 Archive path: ${ARCHIVE_PATH}`);
  console.log(`🔍 Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will make changes)'}\n`);

  let stats = {
    backupFiles: 0,
    dsStoreFiles: 0,
    consolidatedFiles: 0,
    emptyDirs: 0,
    errors: []
  };

  try {
    // 1. Remove backup files
    console.log('1️⃣ Removing corrupted backup files (.bak)...');
    await removeBackupFiles(ARCHIVE_PATH, stats);

    // 2. Remove .DS_Store files
    console.log('2️⃣ Removing .DS_Store files...');
    await removeDSStore(ARCHIVE_PATH, stats);

    // 3. Consolidate date folders
    console.log('3️⃣ Consolidating date folders...');
    await consolidateDateFolders(ARCHIVE_PATH, stats);

    // 4. Remove empty directories
    console.log('4️⃣ Removing empty directories...');
    await removeEmptyDirs(ARCHIVE_PATH, stats);

    // Report results
    console.log('\n📊 Cleanup Summary:');
    console.log(`   ✅ Backup files removed: ${stats.backupFiles}`);
    console.log(`   ✅ .DS_Store files removed: ${stats.dsStoreFiles}`);
    console.log(`   ✅ Files consolidated: ${stats.consolidatedFiles}`);
    console.log(`   ✅ Empty directories removed: ${stats.emptyDirs}`);

    if (stats.errors.length > 0) {
      console.log(`\n⚠️ Errors encountered:`);
      stats.errors.forEach(err => console.log(`   - ${err}`));
    }

    if (DRY_RUN) {
      console.log('\n📌 This was a DRY RUN. No changes were made.');
      console.log('   Run without --dry-run to apply changes.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

async function removeBackupFiles(dir, stats) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await removeBackupFiles(fullPath, stats);
    } else if (entry.name.endsWith('.bak')) {
      console.log(`   🗑️ Removing: ${fullPath}`);
      stats.backupFiles++;
      if (!DRY_RUN) {
        try {
          await fs.unlink(fullPath);
        } catch (err) {
          stats.errors.push(`Failed to remove ${fullPath}: ${err.message}`);
        }
      }
    }
  }
}

async function removeDSStore(dir, stats) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await removeDSStore(fullPath, stats);
    } else if (entry.name === '.DS_Store') {
      console.log(`   🗑️ Removing: ${fullPath}`);
      stats.dsStoreFiles++;
      if (!DRY_RUN) {
        try {
          await fs.unlink(fullPath);
        } catch (err) {
          stats.errors.push(`Failed to remove ${fullPath}: ${err.message}`);
        }
      }
    }
  }
}

async function consolidateDateFolders(dir, stats) {
  const projectsDir = path.join(dir, 'projects');
  if (!await fileExists(projectsDir)) return;

  const projects = await fs.readdir(projectsDir, { withFileTypes: true });

  for (const project of projects) {
    if (!project.isDirectory()) continue;

    const projectPath = path.join(projectsDir, project.name);

    // Check each data type folder
    for (const dataType of ['patterns', 'prompts', 'knowledge']) {
      const dataPath = path.join(projectPath, dataType);
      if (!await fileExists(dataPath)) continue;

      const entries = await fs.readdir(dataPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name)) {
          // This is a date folder
          const dateFolderPath = path.join(dataPath, entry.name);
          const dateFiles = await fs.readdir(dateFolderPath);

          for (const file of dateFiles) {
            if (file.endsWith('.json') && !file.includes('corrupted')) {
              // Move JSON file up one level with date prefix
              const sourcePath = path.join(dateFolderPath, file);
              const destName = file.includes(entry.name) ? file : `${entry.name}-${file}`;
              const destPath = path.join(dataPath, destName);

              console.log(`   📦 Consolidating: ${sourcePath} → ${destPath}`);
              stats.consolidatedFiles++;

              if (!DRY_RUN) {
                try {
                  await fs.rename(sourcePath, destPath);
                } catch (err) {
                  stats.errors.push(`Failed to move ${sourcePath}: ${err.message}`);
                }
              }
            }
          }
        }
      }
    }
  }
}

async function removeEmptyDirs(dir, stats) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      await removeEmptyDirs(fullPath, stats);

      // Check if directory is now empty
      const contents = await fs.readdir(fullPath);
      if (contents.length === 0) {
        console.log(`   📁 Removing empty: ${fullPath}`);
        stats.emptyDirs++;
        if (!DRY_RUN) {
          try {
            await fs.rmdir(fullPath);
          } catch (err) {
            stats.errors.push(`Failed to remove empty dir ${fullPath}: ${err.message}`);
          }
        }
      }
    }
  }
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Run the cleanup
cleanupArchive().catch(console.error);