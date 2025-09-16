#!/usr/bin/env node

/**
 * Archive Validation Script
 * Validates the c0ntextKeeper archive structure and reports issues
 */

const fs = require('fs');
const path = require('path');

class ArchiveValidator {
  constructor(archivePath) {
    this.archivePath = archivePath;
    this.issues = [];
    this.stats = {
      projects: 0,
      sessions: 0,
      prompts: 0,
      patterns: 0,
      knowledge: 0,
      errors: 0,
      totalSize: 0
    };
  }

  validate() {
    console.log('🔍 c0ntextKeeper Archive Validation');
    console.log('━'.repeat(50));
    console.log(`📁 Archive Path: ${this.archivePath}\n`);

    if (!fs.existsSync(this.archivePath)) {
      console.log('❌ Archive path does not exist');
      return false;
    }

    // Check main structure
    this.checkMainStructure();

    // Validate projects
    const projectsPath = path.join(this.archivePath, 'archive', 'projects');
    if (fs.existsSync(projectsPath)) {
      this.validateProjects(projectsPath);
    }

    // Report findings
    this.reportFindings();
    return this.issues.length === 0;
  }

  checkMainStructure() {
    const expectedDirs = ['archive'];
    const optionalDirs = ['logs', 'errors', 'solutions'];

    console.log('📋 Main Structure Check:');
    for (const dir of expectedDirs) {
      const dirPath = path.join(this.archivePath, dir);
      if (fs.existsSync(dirPath)) {
        console.log(`  ✅ ${dir}/`);
      } else {
        console.log(`  ❌ ${dir}/ (missing)`);
        this.issues.push(`Missing required directory: ${dir}`);
      }
    }

    for (const dir of optionalDirs) {
      const dirPath = path.join(this.archivePath, dir);
      if (fs.existsSync(dirPath)) {
        console.log(`  ✅ ${dir}/ (optional)`);
      }
    }
    console.log();
  }

  validateProjects(projectsPath) {
    const projects = fs.readdirSync(projectsPath);
    this.stats.projects = projects.length;

    console.log(`📦 Projects (${projects.length}):`);
    for (const project of projects) {
      if (project.startsWith('.')) continue;

      const projectPath = path.join(projectsPath, project);
      const stat = fs.statSync(projectPath);

      if (stat.isDirectory()) {
        console.log(`\n  📁 ${project}/`);
        this.validateProjectStructure(projectPath, project);
      }
    }
  }

  validateProjectStructure(projectPath, projectName) {
    const expectedDirs = ['sessions', 'prompts', 'patterns', 'knowledge'];
    const issues = [];

    for (const dir of expectedDirs) {
      const dirPath = path.join(projectPath, dir);
      if (fs.existsSync(dirPath)) {
        const files = this.validateHookDirectory(dirPath, dir);
        console.log(`    ✅ ${dir}/ (${files.length} files)`);

        // Update stats
        this.stats[dir] += files.length;

        // Check for issues
        const dirIssues = this.checkDirectoryIssues(dirPath, dir, files);
        if (dirIssues.length > 0) {
          issues.push(...dirIssues);
        }
      } else {
        console.log(`    ⚠️ ${dir}/ (missing)`);
      }
    }

    if (issues.length > 0) {
      console.log(`    ⚠️ Issues found:`);
      for (const issue of issues) {
        console.log(`      - ${issue}`);
        this.issues.push(`${projectName}: ${issue}`);
      }
    }
  }

  validateHookDirectory(dirPath, hookType) {
    const files = fs.readdirSync(dirPath);
    const validFiles = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && file.endsWith('.json')) {
        validFiles.push(file);
        this.stats.totalSize += stat.size;
      }
    }

    return validFiles;
  }

  checkDirectoryIssues(dirPath, hookType, files) {
    const issues = [];
    const datePattern = /^\d{4}-\d{2}-\d{2}-/;

    // Check for subdirectories (shouldn't exist after fix)
    const entries = fs.readdirSync(dirPath);
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        issues.push(`Unexpected subdirectory: ${hookType}/${entry}`);
      }
    }

    // Check naming conventions
    for (const file of files) {
      if (hookType !== 'sessions' && !datePattern.test(file)) {
        issues.push(`Invalid naming convention: ${hookType}/${file} (should start with YYYY-MM-DD-)`);
      }
    }

    // Check for old/stale files (optional warning)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.mtime < thirtyDaysAgo) {
        // Just a warning, not an issue
        console.log(`      📅 Old file (>30 days): ${file}`);
      }
    }

    // Check for duplicate patterns
    if (hookType === 'prompts' || hookType === 'patterns' || hookType === 'knowledge') {
      const dateFiles = {};
      for (const file of files) {
        const match = file.match(/^(\d{4}-\d{2}-\d{2})-/);
        if (match) {
          const date = match[1];
          if (!dateFiles[date]) {
            dateFiles[date] = [];
          }
          dateFiles[date].push(file);
        }
      }

      // Check for multiple files per date (shouldn't happen)
      for (const [date, dateFileList] of Object.entries(dateFiles)) {
        if (dateFileList.length > 1) {
          issues.push(`Multiple ${hookType} files for ${date}: ${dateFileList.join(', ')}`);
        }
      }
    }

    return issues;
  }

  reportFindings() {
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Validation Summary\n');

    // Stats
    console.log('📈 Archive Statistics:');
    console.log(`  • Projects: ${this.stats.projects}`);
    console.log(`  • Sessions: ${this.stats.sessions}`);
    console.log(`  • Prompts files: ${this.stats.prompts}`);
    console.log(`  • Patterns files: ${this.stats.patterns}`);
    console.log(`  • Knowledge files: ${this.stats.knowledge}`);
    console.log(`  • Total Size: ${(this.stats.totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Hook activity check
    console.log('\n📅 Hook Activity:');
    this.checkHookActivity();

    // Issues
    console.log(`\n${this.issues.length === 0 ? '✅' : '❌'} Issues Found: ${this.issues.length}`);
    if (this.issues.length > 0) {
      console.log('\n⚠️ Issues to Address:');
      for (const issue of this.issues) {
        console.log(`  • ${issue}`);
      }
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    const recommendations = this.getRecommendations();
    for (const rec of recommendations) {
      console.log(`  • ${rec}`);
    }
  }

  checkHookActivity() {
    const projectsPath = path.join(this.archivePath, 'archive', 'projects', 'c0ntextKeeper');
    if (!fs.existsSync(projectsPath)) return;

    const hooks = ['sessions', 'prompts', 'patterns', 'knowledge'];
    const today = new Date().toISOString().split('T')[0];

    for (const hook of hooks) {
      const hookPath = path.join(projectsPath, hook);
      if (!fs.existsSync(hookPath)) {
        console.log(`  ❌ ${hook}: Directory missing`);
        continue;
      }

      const files = fs.readdirSync(hookPath);
      let latestDate = null;
      let latestMtime = null;

      for (const file of files) {
        const filePath = path.join(hookPath, file);
        const stat = fs.statSync(filePath);

        if (!latestMtime || stat.mtime > latestMtime) {
          latestMtime = stat.mtime;
          const match = file.match(/(\d{4}-\d{2}-\d{2})/);
          latestDate = match ? match[1] : 'unknown';
        }
      }

      const daysSince = latestMtime ?
        Math.floor((new Date() - latestMtime) / (1000 * 60 * 60 * 24)) : null;

      if (latestDate === today) {
        console.log(`  ✅ ${hook}: Active today`);
      } else if (daysSince !== null && daysSince <= 1) {
        console.log(`  ✅ ${hook}: Active yesterday`);
      } else if (daysSince !== null) {
        console.log(`  ⚠️ ${hook}: Last updated ${daysSince} days ago (${latestDate})`);
      } else {
        console.log(`  ❌ ${hook}: No files found`);
      }
    }
  }

  getRecommendations() {
    const recs = [];

    // Check patterns/knowledge activity
    const patternsPath = path.join(this.archivePath, 'archive', 'projects', 'c0ntextKeeper', 'patterns');
    const knowledgePath = path.join(this.archivePath, 'archive', 'projects', 'c0ntextKeeper', 'knowledge');

    if (fs.existsSync(patternsPath)) {
      const files = fs.readdirSync(patternsPath);
      const latest = files.sort().pop();
      if (latest) {
        const date = latest.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
        const daysSince = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
        if (daysSince > 2) {
          recs.push('PostToolUse hook may need attention - no patterns captured recently');
        }
      }
    }

    if (fs.existsSync(knowledgePath)) {
      const files = fs.readdirSync(knowledgePath);
      const latest = files.sort().pop();
      if (latest) {
        const date = latest.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
        const daysSince = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
        if (daysSince > 2) {
          recs.push('Stop hook may need attention - no Q&A captured recently');
        }
      }
    }

    if (this.stats.totalSize > 100 * 1024 * 1024) {
      recs.push(`Consider archiving old data - total size is ${(this.stats.totalSize / 1024 / 1024).toFixed(0)} MB`);
    }

    if (this.issues.length === 0) {
      recs.push('Archive structure is healthy - no action needed');
    } else {
      recs.push('Run cleanup scripts to fix identified issues');
    }

    return recs;
  }
}

// Run validation
const archivePath = path.join(process.env.HOME, '.c0ntextkeeper');
const validator = new ArchiveValidator(archivePath);
const isValid = validator.validate();

console.log('\n' + '═'.repeat(50));
if (isValid) {
  console.log('✅ Archive validation PASSED');
} else {
  console.log('❌ Archive validation FAILED - issues need attention');
  process.exit(1);
}