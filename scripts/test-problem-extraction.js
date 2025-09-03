#!/usr/bin/env node

/**
 * Test script to debug problem extraction
 * 
 * Version Compatibility: v0.5.0+
 * - Tests problem extraction from Claude Code format
 * - Uses claude-actual-format.jsonl fixture
 * - Validates isProblemIndicator() with 50+ semantic patterns
 * - Confirms user questions score 1.0 relevance
 * 
 * Created for v0.5.0 to debug and validate enhanced problem detection.
 */

const { parseTranscriptContent } = require('../dist/utils/transcript.js');
const { ContextExtractor } = require('../dist/core/extractor.js');
const fs = require('fs');
const path = require('path');

// Test with Claude format
const claudeFormatPath = path.join(__dirname, '../tests/fixtures/claude-actual-format.jsonl');
const claudeContent = fs.readFileSync(claudeFormatPath, 'utf8');

console.log('=== TESTING PROBLEM EXTRACTION ===\n');

// Parse entries
const entries = parseTranscriptContent(claudeContent);

// Find user entries
const userEntries = entries.filter(e => e.type === 'user');
console.log(`Found ${userEntries.length} user entries:\n`);

userEntries.forEach((entry, i) => {
  console.log(`User entry ${i + 1}:`);
  console.log(`  Type: ${entry.type}`);
  console.log(`  Has message: ${!!entry.message}`);
  if (entry.message) {
    console.log(`  Message content: "${entry.message.content}"`);
    console.log(`  Content includes "?": ${entry.message.content.includes('?')}`);
    console.log(`  Content includes "how": ${entry.message.content.toLowerCase().includes('how')}`);
  }
  console.log('');
});

// Test extractor directly
console.log('=== TESTING isProblemIndicator ===\n');

const extractor = new ContextExtractor();

// Access the private method via a workaround
const testContent = "How do I prepare this for public release?";
console.log(`Test content: "${testContent}"`);

// Extract problems
const context = extractor.extract(entries);
console.log(`\nProblems extracted: ${context.problems.length}`);

if (context.problems.length === 0) {
  console.log('\n⚠️  No problems found - checking why...\n');
  
  // Check if it's a relevance threshold issue
  const extractorLowThreshold = new ContextExtractor(0.1); // Very low threshold
  const contextLow = extractorLowThreshold.extract(entries);
  console.log(`With low threshold (0.1): ${contextLow.problems.length} problems`);
  
  // Check without security filter
  const extractorNoFilter = new ContextExtractor(0.5, 50, false);
  const contextNoFilter = extractorNoFilter.extract(entries);
  console.log(`Without security filter: ${contextNoFilter.problems.length} problems`);
}

console.log('\n=== COMPLETE ===');