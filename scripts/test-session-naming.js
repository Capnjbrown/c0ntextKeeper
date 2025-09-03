#!/usr/bin/env node

/**
 * Test script for improved session naming
 */

const path = require('path');
const fs = require('fs');

// Build TypeScript files first
console.log('Building TypeScript files...');
const { execSync } = require('child_process');
try {
  execSync('npm run build', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}

// Now import the built modules
const { generateSessionName } = require('../dist/utils/session-namer.js');

// Test with the problematic archive that generated "that.json"
const problematicArchive = JSON.parse(
  fs.readFileSync('/Users/jasonbrown/.c0ntextkeeper/archive/projects/c0ntextKeeper/sessions/2025-09-02_1755_MT_that.json', 'utf8')
);

// Test with the archive that generated "then.json"
const thenArchive = JSON.parse(
  fs.readFileSync('/Users/jasonbrown/.c0ntextkeeper/archive/projects/c0ntextKeeper/sessions/2025-09-03_1538_MT_then.json', 'utf8')
);

console.log('\n=== TESTING IMPROVED SESSION NAMING ===\n');

console.log('Test 1: Archive with "that" problem');
console.log('--------------------------------------');
console.log('Original name: 2025-09-02_1755_MT_that.json');
console.log('Problems:', problematicArchive.problems.length);
console.log('Implementations:', problematicArchive.implementations.length);
if (problematicArchive.problems.length > 0) {
  console.log('First problem snippet:', problematicArchive.problems[0].question.substring(0, 100) + '...');
}

// Test new naming
const newName1 = generateSessionName(problematicArchive);
console.log('NEW GENERATED NAME:', newName1);

console.log('\nTest 2: Archive with "then" problem');
console.log('--------------------------------------');
console.log('Original name: 2025-09-03_1538_MT_then.json');
console.log('Problems:', thenArchive.problems.length);
console.log('Implementations:', thenArchive.implementations.length);
if (thenArchive.problems.length > 0) {
  console.log('First problem snippet:', thenArchive.problems[0].question.substring(0, 100) + '...');
}

// Test new naming
const newName2 = generateSessionName(thenArchive);
console.log('NEW GENERATED NAME:', newName2);

// Test with various synthetic contexts
console.log('\n=== TESTING SYNTHETIC CONTEXTS ===\n');

const testContexts = [
  {
    name: 'Bug fix context',
    context: {
      sessionId: 'test',
      projectPath: '/test',
      timestamp: new Date().toISOString(),
      extractedAt: 'test',
      problems: [{
        id: '1',
        question: 'I have an error in the authentication module that prevents users from logging in',
        timestamp: new Date().toISOString(),
        tags: ['auth', 'bug'],
        relevance: 1
      }],
      implementations: [],
      decisions: [],
      patterns: [],
      metadata: { filesModified: [], toolsUsed: [] }
    }
  },
  {
    name: 'Implementation context',
    context: {
      sessionId: 'test',
      projectPath: '/test',
      timestamp: new Date().toISOString(),
      extractedAt: 'test',
      problems: [],
      implementations: [{
        id: '1',
        tool: 'Write',
        file: 'src/hooks/precompact.ts',
        description: 'Implementing hooks for context preservation',
        timestamp: new Date().toISOString(),
        relevance: 1
      }],
      decisions: [],
      patterns: [],
      metadata: { filesModified: ['src/hooks/precompact.ts'], toolsUsed: ['Write'] }
    }
  },
  {
    name: 'Minimal context with common words',
    context: {
      sessionId: 'test',
      projectPath: '/test',
      timestamp: new Date().toISOString(),
      extractedAt: 'test',
      problems: [{
        id: '1',
        question: 'That was the issue then we had with those things there',
        timestamp: new Date().toISOString(),
        tags: [],
        relevance: 1
      }],
      implementations: [],
      decisions: [],
      patterns: [],
      metadata: { filesModified: [], toolsUsed: [] }
    }
  }
];

testContexts.forEach(({ name, context }) => {
  console.log(`\nTest: ${name}`);
  const generatedName = generateSessionName(context);
  console.log('Generated name:', generatedName);
});

console.log('\n=== TEST COMPLETE ===');