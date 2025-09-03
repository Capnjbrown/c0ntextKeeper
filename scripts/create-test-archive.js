#!/usr/bin/env node

/**
 * Script to create a real archive from our test transcript
 * 
 * Version Compatibility: v0.5.0+
 * - Expects comprehensive-test.jsonl in Claude Code format
 * - Content must use array format: [{ type: "text", text: "..." }]
 * - Extraction version 0.5.0 with enhanced relevance scoring
 * 
 * Note: This script uses the comprehensive test fixture which
 * demonstrates all extraction capabilities including problems,
 * implementations, decisions, and patterns.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Build first
console.log('Building project...');
execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

// Import the built modules
const { ContextArchiver } = require('../dist/core/archiver.js');

// Path to our comprehensive test transcript
const transcriptPath = path.join(__dirname, '../tests/fixtures/comprehensive-test.jsonl');
const projectPath = '/Users/jasonbrown/Projects/c0ntextKeeper';

console.log('\n=== CREATING REAL ARCHIVE ===\n');
console.log('Transcript:', transcriptPath);
console.log('Project:', projectPath);

async function createArchive() {
  try {
    const archiver = new ContextArchiver();
    
    // Run the archiver
    console.log('\nRunning extraction pipeline...');
    const result = await archiver.archiveFromTranscript(transcriptPath, projectPath);
    
    if (result.success) {
      console.log('\n✅ Archive created successfully!');
      console.log('Archive path:', result.archivePath);
      console.log('\nExtraction stats:');
      console.log(`  Problems: ${result.stats.problems}`);
      console.log(`  Implementations: ${result.stats.implementations}`);
      console.log(`  Decisions: ${result.stats.decisions}`);
      console.log(`  Patterns: ${result.stats.patterns}`);
      console.log(`  Relevance: ${result.stats.relevance}%`);
      
      // Read and display a summary of the archive
      const archive = JSON.parse(fs.readFileSync(result.archivePath, 'utf8'));
      
      console.log('\n=== ARCHIVE SUMMARY ===');
      console.log('Session ID:', archive.sessionId);
      console.log('Timestamp:', archive.timestamp);
      console.log('Extraction version:', archive.metadata.extractionVersion);
      console.log('Entry count:', archive.metadata.entryCount);
      console.log('Duration:', archive.metadata.duration, 'ms');
      console.log('Tools used:', archive.metadata.toolsUsed.join(', '));
      console.log('Tool counts:', JSON.stringify(archive.metadata.toolCounts));
      console.log('Files modified:', archive.metadata.filesModified.join(', '));
      
      // Show some extracted content
      if (archive.problems.length > 0) {
        console.log('\n=== PROBLEMS EXTRACTED ===');
        archive.problems.forEach((p, i) => {
          console.log(`${i + 1}. ${p.question.substring(0, 80)}...`);
          if (p.solution) {
            console.log(`   Solution: ${p.solution.approach.substring(0, 60)}...`);
          }
        });
      }
      
      if (archive.implementations.length > 0) {
        console.log('\n=== IMPLEMENTATIONS ===');
        archive.implementations.forEach((impl, i) => {
          console.log(`${i + 1}. ${impl.tool} on ${impl.file}`);
        });
      }
      
      if (archive.decisions.length > 0) {
        console.log('\n=== DECISIONS ===');
        archive.decisions.forEach((d, i) => {
          console.log(`${i + 1}. ${d.decision.substring(0, 60)}...`);
        });
      }
      
      if (archive.patterns.length > 0) {
        console.log('\n=== PATTERNS ===');
        archive.patterns.forEach((p, i) => {
          console.log(`${i + 1}. ${p.type}: ${p.value} (${p.frequency}x)`);
        });
      }
      
      return result.archivePath;
    } else {
      console.error('❌ Archive creation failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error creating archive:', error);
    return null;
  }
}

// Run the archive creation
createArchive().then(archivePath => {
  if (archivePath) {
    console.log('\n=== ARCHIVE LOCATION ===');
    console.log('Full path:', archivePath);
    console.log('\nYou can view the complete archive with:');
    console.log(`cat ${archivePath} | jq '.'`);
  }
}).catch(console.error);