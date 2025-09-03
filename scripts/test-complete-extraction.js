#!/usr/bin/env node

/**
 * Complete test of extraction with semantic understanding
 * 
 * Version Compatibility: v0.5.0+
 * - Tests extraction with Claude Code's actual JSONL format
 * - Uses claude-actual-format.jsonl fixture file
 * - Validates semantic problem detection with 50+ indicators
 * - Tests relevance scoring improvements
 * 
 * This script was created specifically for v0.5.0 to validate
 * the enhanced problem detection and scoring algorithms.
 */

const { parseTranscriptContent } = require('../dist/utils/transcript.js');
const { ContextExtractor } = require('../dist/core/extractor.js');
const fs = require('fs');
const path = require('path');

// Test with Claude format
const claudeFormatPath = path.join(__dirname, '../tests/fixtures/claude-actual-format.jsonl');
const claudeContent = fs.readFileSync(claudeFormatPath, 'utf8');

console.log('=== COMPLETE EXTRACTION TEST ===\n');

// Parse entries
const entries = parseTranscriptContent(claudeContent);

// Test if isProblemIndicator would detect our question
const testQuestion = "How do I prepare this for public release?";
console.log(`Test question: "${testQuestion}"`);
console.log(`Contains "?": ${testQuestion.includes('?')}`);
console.log(`Contains "how do": ${testQuestion.toLowerCase().includes('how do')}`);
console.log('');

// Create a minimal test case
console.log('=== MINIMAL TEST CASE ===\n');

const minimalEntries = [
  {
    type: 'user',
    timestamp: '2025-01-01T00:00:00Z',
    sessionId: 'test',
    message: {
      role: 'user',
      content: 'How do I prepare this for public release?'
    }
  },
  {
    type: 'assistant',
    timestamp: '2025-01-01T00:00:01Z',
    sessionId: 'test',
    message: {
      role: 'assistant',
      content: 'I will help you prepare for public release.'
    }
  },
  {
    type: 'tool_use',
    timestamp: '2025-01-01T00:00:02Z',
    sessionId: 'test',
    toolUse: {
      name: 'Read',
      input: { file_path: 'README.md' }
    },
    message: {
      role: 'assistant',
      content: 'Using tool: Read'
    }
  }
];

const extractor = new ContextExtractor(0.3, 50, false); // Lower threshold, no security filter
const minimalContext = extractor.extract(minimalEntries);

console.log('Minimal test results:');
console.log(`  Problems: ${minimalContext.problems.length}`);
console.log(`  Implementations: ${minimalContext.implementations.length}`);

if (minimalContext.problems.length > 0) {
  console.log('\nFirst problem:');
  const p = minimalContext.problems[0];
  console.log(`  Question: ${p.question}`);
  console.log(`  Has solution: ${!!p.solution}`);
  if (p.solution) {
    console.log(`  Solution approach: ${p.solution.approach}`);
  }
}

console.log('\n=== FULL TEST WITH CLAUDE FORMAT ===\n');

const fullContext = extractor.extract(entries);
console.log('Full extraction results:');
console.log(`  Problems: ${fullContext.problems.length}`);
console.log(`  Implementations: ${fullContext.implementations.length}`);
console.log(`  Decisions: ${fullContext.decisions.length}`);
console.log(`  Patterns: ${fullContext.patterns.length}`);
console.log(`  Tools: ${fullContext.metadata.toolsUsed.join(', ')}`);

if (fullContext.problems.length > 0) {
  console.log('\nProblems found:');
  fullContext.problems.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.question.substring(0, 60)}...`);
  });
}

console.log('\n=== COMPLETE ===');