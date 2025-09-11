#!/usr/bin/env node
/**
 * Comprehensive test for extractor.ts semantic patterns
 * Tests all 50+ patterns for problem detection, solution extraction, and more
 */

const { ContextExtractor } = require('../dist/core/extractor');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test categories with sample entries
const testCategories = {
  problemPatterns: {
    name: 'Problem Detection Patterns',
    tests: [
      // Error-related patterns
      { content: "I'm getting an error when running the tests", expected: true, category: 'error' },
      { content: "The application keeps crashing on startup", expected: true, category: 'crash' },
      { content: "Something is broken in the authentication flow", expected: true, category: 'broken' },
      { content: "Getting undefined is not a function", expected: true, category: 'undefined' },
      { content: "CORS issue when calling the API", expected: true, category: 'cors' },
      
      // Debugging patterns
      { content: "Can you help debug this function?", expected: true, category: 'debug' },
      { content: "The feature is not working as expected", expected: true, category: 'not working' },
      { content: "This doesn't work on production", expected: true, category: "doesn't work" },
      
      // Question patterns
      { content: "How do I implement authentication?", expected: true, category: 'how do' },
      { content: "What is the best way to structure this?", expected: true, category: 'what is' },
      { content: "Where should I put the configuration?", expected: true, category: 'where should' },
      { content: "Why is this returning null?", expected: true, category: 'why' },
      { content: "When should I use async/await?", expected: true, category: 'when should' },
      
      // Development task patterns
      { content: "I need to implement a new feature", expected: true, category: 'implement' },
      { content: "Create a REST API endpoint", expected: true, category: 'create' },
      { content: "Let's refactor this code", expected: true, category: 'refactor' },
      { content: "We need to optimize performance", expected: true, category: 'optimize' },
      { content: "Migrate the database schema", expected: true, category: 'migrate' },
      
      // Architecture patterns
      { content: "What's the best design pattern for this?", expected: true, category: 'design pattern' },
      { content: "How should we architect the system?", expected: true, category: 'architect' },
      { content: "Recommend a good project structure", expected: true, category: 'structure' },
      
      // Testing & deployment
      { content: "Write unit tests for this module", expected: true, category: 'test' },
      { content: "Deploy to production environment", expected: true, category: 'deploy' },
      { content: "Setup CI/CD pipeline", expected: true, category: 'ci/cd' },
      
      // Documentation & understanding
      { content: "Can you explain how this works?", expected: true, category: 'explain' },
      { content: "I'm confused about the logic here", expected: true, category: 'confused' },
      { content: "Document the API endpoints", expected: true, category: 'document' },
      
      // Security & performance
      { content: "Is this secure?", expected: true, category: 'secure' },
      { content: "Found a vulnerability in the code", expected: true, category: 'vulnerability' },
      { content: "The app is running slow", expected: true, category: 'slow' },
      { content: "Possible memory leak detected", expected: true, category: 'memory leak' },
      
      // Non-problems (should return false)
      { content: "The code looks good", expected: false, category: 'non-problem' },
      { content: "Everything is working fine", expected: false, category: 'non-problem' },
      { content: "Great job on the implementation", expected: false, category: 'non-problem' }
    ]
  },
  
  solutionPatterns: {
    name: 'Solution Detection Patterns',
    tests: [
      { content: "Here's how to fix it: add error handling", expected: true },
      { content: "The solution is to use async/await", expected: true },
      { content: "To fix this, update the dependency", expected: true },
      { content: "This works by using a callback", expected: true },
      { content: "I've resolved the issue", expected: true },
      { content: "Problem solved with this approach", expected: true },
      { content: "Let me implement that for you", expected: true },
      { content: "I'll create the necessary files", expected: true },
      { content: "```javascript\nconst solution = true;\n```", expected: true },
      { content: "Try using this configuration", expected: true },
      { content: "We should add validation here", expected: true },
      { content: "You can achieve this by...", expected: true }
    ]
  },
  
  toolPatterns: {
    name: 'Tool Usage Patterns',
    entries: [
      {
        type: 'tool_use',
        toolUse: { name: 'Write', input: { file_path: '/src/index.ts' } },
        timestamp: new Date().toISOString()
      },
      {
        type: 'tool_use',
        toolUse: { name: 'Edit', input: { file_path: '/src/app.ts' } },
        timestamp: new Date().toISOString()
      },
      {
        type: 'tool_use',
        toolUse: { name: 'Bash', input: { command: 'npm test' } },
        timestamp: new Date().toISOString()
      },
      {
        type: 'tool_use',
        toolUse: { name: 'TodoWrite', input: { todos: [] } },
        timestamp: new Date().toISOString()
      },
      {
        type: 'tool_use',
        toolUse: { name: 'mcp__filesystem__read_text_file', input: { path: '/config.json' } },
        timestamp: new Date().toISOString()
      }
    ],
    expectedTools: ['Write', 'Edit', 'Bash', 'TodoWrite', 'mcp__filesystem__read_text_file']
  }
};

// Create sample transcript for comprehensive testing
function createTestTranscript() {
  const entries = [];
  
  // Add problem-solution pairs
  entries.push({
    type: 'user',
    message: { content: "How do I implement authentication in React?" },
    timestamp: new Date().toISOString(),
    sessionId: 'test-session'
  });
  
  entries.push({
    type: 'assistant',
    message: { content: "I'll help you implement authentication in React. Here's how to do it:" },
    timestamp: new Date().toISOString()
  });
  
  entries.push({
    type: 'tool_use',
    toolUse: { 
      name: 'Write', 
      input: { 
        file_path: '/src/auth/AuthContext.tsx',
        content: 'const AuthContext = createContext();'
      }
    },
    timestamp: new Date().toISOString()
  });
  
  // Add decision pattern
  entries.push({
    type: 'assistant',
    message: { content: "We should use JWT tokens for authentication because they're stateless and scalable." },
    timestamp: new Date().toISOString()
  });
  
  // Add recurring pattern (multiple npm commands)
  entries.push({
    type: 'tool_use',
    toolUse: { name: 'Bash', input: { command: 'npm install jsonwebtoken' } },
    timestamp: new Date().toISOString()
  });
  
  entries.push({
    type: 'tool_use',
    toolUse: { name: 'Bash', input: { command: 'npm install bcrypt' } },
    timestamp: new Date().toISOString()
  });
  
  // Add error pattern
  entries.push({
    type: 'tool_result',
    toolResult: { error: 'Permission denied: cannot write to /etc/config' },
    timestamp: new Date().toISOString()
  });
  
  return entries;
}

// Test individual patterns
async function testPatterns() {
  const extractor = new ContextExtractor();
  let passedTests = 0;
  let failedTests = 0;
  
  console.log(`${colors.bright}${colors.cyan}Testing Context Extraction Patterns${colors.reset}\n`);
  console.log('=' .repeat(60) + '\n');
  
  // Test problem detection patterns
  console.log(`${colors.bright}${colors.blue}1. ${testCategories.problemPatterns.name}${colors.reset}`);
  console.log('-'.repeat(40));
  
  for (const test of testCategories.problemPatterns.tests) {
    const entry = {
      type: 'user',
      message: { content: test.content },
      timestamp: new Date().toISOString(),
      sessionId: 'test'
    };
    
    try {
      const result = extractor.extract([entry]);
      const detected = result.problems.length > 0;
      const passed = detected === test.expected;
      
      if (passed) {
        console.log(`${colors.green}✓${colors.reset} [${test.category}] "${test.content.substring(0, 40)}..."`);
        passedTests++;
      } else {
        console.log(`${colors.red}✗${colors.reset} [${test.category}] "${test.content.substring(0, 40)}..." (expected: ${test.expected}, got: ${detected})`);
        failedTests++;
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} [${test.category}] Error: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log();
  
  // Test solution detection patterns
  console.log(`${colors.bright}${colors.blue}2. ${testCategories.solutionPatterns.name}${colors.reset}`);
  console.log('-'.repeat(40));
  
  for (const test of testCategories.solutionPatterns.tests) {
    const entries = [
      {
        type: 'user',
        message: { content: "How do I fix this error?" },
        timestamp: new Date().toISOString(),
        sessionId: 'test'
      },
      {
        type: 'assistant',
        message: { content: test.content },
        timestamp: new Date().toISOString()
      }
    ];
    
    try {
      const result = extractor.extract(entries);
      const hasSolution = result.problems.length > 0 && result.problems[0].solution !== undefined;
      const passed = hasSolution === test.expected;
      
      if (passed) {
        console.log(`${colors.green}✓${colors.reset} "${test.content.substring(0, 50)}..."`);
        passedTests++;
      } else {
        console.log(`${colors.red}✗${colors.reset} "${test.content.substring(0, 50)}..." (expected: ${test.expected}, got: ${hasSolution})`);
        failedTests++;
      }
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset} Error: ${error.message}`);
      failedTests++;
    }
  }
  
  console.log();
  
  // Test tool extraction
  console.log(`${colors.bright}${colors.blue}3. ${testCategories.toolPatterns.name}${colors.reset}`);
  console.log('-'.repeat(40));
  
  try {
    const result = extractor.extract(testCategories.toolPatterns.entries);
    const extractedTools = result.metadata.toolsUsed;
    const allToolsFound = testCategories.toolPatterns.expectedTools.every(tool => 
      extractedTools.includes(tool)
    );
    
    if (allToolsFound) {
      console.log(`${colors.green}✓${colors.reset} All ${testCategories.toolPatterns.expectedTools.length} tools correctly extracted`);
      console.log(`  Tools: ${extractedTools.join(', ')}`);
      passedTests++;
    } else {
      console.log(`${colors.red}✗${colors.reset} Tool extraction incomplete`);
      console.log(`  Expected: ${testCategories.toolPatterns.expectedTools.join(', ')}`);
      console.log(`  Got: ${extractedTools.join(', ')}`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  
  console.log();
  
  // Test comprehensive extraction
  console.log(`${colors.bright}${colors.blue}4. Comprehensive Extraction Test${colors.reset}`);
  console.log('-'.repeat(40));
  
  const transcript = createTestTranscript();
  try {
    const result = extractor.extract(transcript);
    
    console.log('Extraction Results:');
    console.log(`  - Problems: ${result.problems.length}`);
    console.log(`  - Implementations: ${result.implementations.length}`);
    console.log(`  - Decisions: ${result.decisions.length}`);
    console.log(`  - Patterns: ${result.patterns.length}`);
    console.log(`  - Tools Used: ${result.metadata.toolsUsed.join(', ')}`);
    console.log(`  - Files Modified: ${result.metadata.filesModified.length}`);
    console.log(`  - Relevance Score: ${result.metadata.relevanceScore.toFixed(2)}`);
    
    // Validate expected results
    const checks = [
      { name: 'Problems extracted', condition: result.problems.length > 0 },
      { name: 'Implementations tracked', condition: result.implementations.length >= 3 },
      { name: 'Decision captured', condition: result.decisions.length > 0 },
      { name: 'Patterns identified', condition: result.patterns.length > 0 },
      { name: 'Tools tracked', condition: result.metadata.toolsUsed.length >= 2 },
      { name: 'Files tracked', condition: result.metadata.filesModified.length > 0 }
    ];
    
    for (const check of checks) {
      if (check.condition) {
        console.log(`  ${colors.green}✓${colors.reset} ${check.name}`);
        passedTests++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${check.name}`);
        failedTests++;
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  
  // Performance test
  console.log();
  console.log(`${colors.bright}${colors.blue}5. Performance Test${colors.reset}`);
  console.log('-'.repeat(40));
  
  // Create large transcript
  const largeTranscript = [];
  for (let i = 0; i < 1000; i++) {
    largeTranscript.push({
      type: i % 2 === 0 ? 'user' : 'assistant',
      message: { content: `Test message ${i}` },
      timestamp: new Date().toISOString(),
      sessionId: 'perf-test'
    });
  }
  
  const startTime = Date.now();
  try {
    const result = extractor.extract(largeTranscript);
    const duration = Date.now() - startTime;
    
    console.log(`Processed ${largeTranscript.length} entries in ${duration}ms`);
    console.log(`Performance: ${(largeTranscript.length / (duration / 1000)).toFixed(0)} entries/second`);
    
    if (duration < 1000) {
      console.log(`${colors.green}✓${colors.reset} Performance is excellent`);
      passedTests++;
    } else if (duration < 3000) {
      console.log(`${colors.yellow}⚠${colors.reset} Performance is acceptable`);
      passedTests++;
    } else {
      console.log(`${colors.red}✗${colors.reset} Performance needs optimization`);
      failedTests++;
    }
  } catch (error) {
    console.log(`${colors.red}✗${colors.reset} Error: ${error.message}`);
    failedTests++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Total: ${passedTests + failedTests}`);
  
  const successRate = (passedTests / (passedTests + failedTests) * 100).toFixed(1);
  if (failedTests === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All tests passed! (${successRate}%)${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Some tests failed (${successRate}% success rate)${colors.reset}`);
  }
  
  // Suggestions for improvement
  console.log(`\n${colors.cyan}${colors.bright}Optimization Suggestions:${colors.reset}`);
  console.log('1. Consider adding more domain-specific patterns for your use case');
  console.log('2. The 50+ patterns cover most scenarios, but can be extended');
  console.log('3. Performance is good for typical sessions (<1000 entries)');
  console.log('4. Consider implementing caching for pattern matching in large transcripts');
  
  return { passed: passedTests, failed: failedTests };
}

// Check if compiled
const compiledPath = path.join(__dirname, '..', 'dist', 'core', 'extractor.js');
if (!fs.existsSync(compiledPath)) {
  console.log('Building project first...');
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

// Run tests
testPatterns().catch(console.error);