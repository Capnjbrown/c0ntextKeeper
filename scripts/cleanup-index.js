#!/usr/bin/env node

/**
 * Cleanup script for c0ntextKeeper global index
 * Removes invalid/test project entries from the global index
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONTEXTKEEPER_DIR = '.c0ntextkeeper';
const globalPath = path.join(os.homedir(), CONTEXTKEEPER_DIR);
const indexPath = path.join(globalPath, 'index.json');

// Backup current index
function backupIndex() {
  if (fs.existsSync(indexPath)) {
    const backupPath = indexPath + '.backup-' + Date.now();
    fs.copyFileSync(indexPath, backupPath);
    console.log(`✓ Backed up index to: ${backupPath}`);
    return backupPath;
  }
  return null;
}

// Check if a project path is valid (not a test project)
function isValidProject(projectInfo) {
  const { path: projectPath, name } = projectInfo;
  
  // Skip test projects
  if (projectPath.includes('/tmp/') || 
      projectPath.includes('/var/folders/') ||
      projectPath.includes('/private/tmp/') ||
      projectPath.includes('/private/var/') ||
      projectPath.includes('c0ntextkeeper-test-') ||
      name === 'my-project' || // Common test project name
      name === 'test-project' && projectPath.includes('/tmp/')) {
    return false;
  }
  
  // Check if path exists
  if (!fs.existsSync(projectPath)) {
    return false;
  }
  
  return true;
}

// Clean the index
function cleanIndex() {
  if (!fs.existsSync(indexPath)) {
    console.log('No index file found at:', indexPath);
    return;
  }
  
  // Read current index
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  const originalCount = Object.keys(index.projects || {}).length;
  
  console.log(`\nCurrent projects in index: ${originalCount}`);
  
  // Filter out invalid projects
  const validProjects = {};
  const removedProjects = [];
  
  for (const [hash, projectInfo] of Object.entries(index.projects || {})) {
    if (isValidProject(projectInfo)) {
      validProjects[hash] = projectInfo;
      console.log(`  ✓ Keeping: ${projectInfo.name} (${projectInfo.path})`);
    } else {
      removedProjects.push(projectInfo);
      console.log(`  ✗ Removing: ${projectInfo.name} (${projectInfo.path})`);
    }
  }
  
  // Update index with only valid projects
  index.projects = validProjects;
  index.lastUpdated = new Date().toISOString();
  
  // Write cleaned index
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  const newCount = Object.keys(validProjects).length;
  console.log(`\n✓ Cleanup complete!`);
  console.log(`  Removed: ${removedProjects.length} test/invalid projects`);
  console.log(`  Remaining: ${newCount} valid projects`);
}

// Main execution
function main() {
  console.log('c0ntextKeeper Index Cleanup');
  console.log('============================\n');
  
  const backupPath = backupIndex();
  cleanIndex();
  
  if (backupPath) {
    console.log(`\nTo restore the original index, run:`);
    console.log(`  cp ${backupPath} ${indexPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { cleanIndex, isValidProject };