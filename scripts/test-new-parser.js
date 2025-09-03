#!/usr/bin/env node

/**
 * Test script to verify the new parser handles Claude Code format correctly
 * 
 * Version Compatibility: v0.5.0+
 * - Tests the enhanced JSONL parser with content array support
 * - Uses claude-actual-format.jsonl fixture
 * - Validates extraction of embedded tool_use and tool_result
 * - Confirms proper content normalization from arrays to strings
 * 
 * Created for v0.5.0 to validate parser improvements.
 */

const path = require('path');

// Build the TypeScript files first
console.log('Building TypeScript files...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Now import the built modules
const { parseTranscriptContent } = require('../dist/utils/transcript.js');
const { ContextExtractor } = require('../dist/core/extractor.js');
const fs = require('fs');

// Test with the new Claude format
const claudeFormatPath = path.join(__dirname, '../tests/fixtures/claude-actual-format.jsonl');
const claudeContent = fs.readFileSync(claudeFormatPath, 'utf8');

console.log('\n=== TESTING NEW PARSER WITH CLAUDE FORMAT ===\n');

// Parse the transcript
const entries = parseTranscriptContent(claudeContent);
console.log(`Parsed ${entries.length} entries\n`);

// Analyze each entry
entries.forEach((entry, i) => {
  console.log(`Entry ${i + 1}:`);
  console.log(`  Type: ${entry.type}`);
  console.log(`  Timestamp: ${entry.timestamp}`);
  
  if (entry.message) {
    console.log(`  Message role: ${entry.message.role}`);
    console.log(`  Message content: ${entry.message.content.substring(0, 100)}...`);
  }
  
  if (entry.toolUse) {
    console.log(`  Tool use: ${entry.toolUse.name}`);
    console.log(`  Tool input:`, JSON.stringify(entry.toolUse.input).substring(0, 100));
  }
  
  if (entry.toolResult) {
    console.log(`  Tool result output: ${entry.toolResult.output?.substring(0, 100)}...`);
    console.log(`  Tool result error:`, entry.toolResult.error);
  }
  
  console.log('');
});

// Now test extraction
console.log('=== TESTING EXTRACTION ===\n');

const extractor = new ContextExtractor();
const context = extractor.extract(entries, '/Users/jasonbrown/Projects/c0ntextKeeper');

console.log('Extraction Results:');
console.log(`  Problems: ${context.problems.length}`);
console.log(`  Implementations: ${context.implementations.length}`);
console.log(`  Decisions: ${context.decisions.length}`);
console.log(`  Patterns: ${context.patterns.length}`);
console.log(`  Tools used: ${context.metadata.toolsUsed}`);
console.log(`  Tool counts:`, context.metadata.toolCounts);
console.log(`  Files modified: ${context.metadata.filesModified}`);
console.log('');

// Check if problems are now correct
if (context.problems.length > 0) {
  console.log('First problem:');
  const problem = context.problems[0];
  console.log(`  Question: ${problem.question}`);
  console.log(`  Tags: ${problem.tags}`);
  if (problem.solution) {
    console.log(`  Solution approach: ${problem.solution.approach.substring(0, 100)}...`);
  }
}

// Check implementations
if (context.implementations.length > 0) {
  console.log('\nImplementations found:');
  context.implementations.forEach(impl => {
    console.log(`  - ${impl.tool} on ${impl.file}`);
  });
} else {
  console.log('\n⚠️  No implementations found - this might still be an issue');
}

// Check tool tracking
if (Object.keys(context.metadata.toolCounts).length > 0) {
  console.log('\n✅ Tool tracking is working!');
} else {
  console.log('\n❌ Tool tracking is still broken');
}

console.log('\n=== TEST COMPLETE ===');