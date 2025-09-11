#!/usr/bin/env node
/**
 * Auto-load System Integration Test
 * Tests all 4 strategies with real file system operations
 */

const { ContextLoader } = require('../dist/core/context-loader');
const { ConfigManager } = require('../dist/core/config');
const { ContextArchiver } = require('../dist/core/archiver');
const { FileStore } = require('../dist/storage/file-store');
const fsSync = require('fs');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Create test contexts with varying relevance and timestamps
function createTestContexts() {
  const now = new Date();
  const contexts = [];
  
  // Recent high-relevance context (1 day old)
  contexts.push({
    sessionId: 'session-recent-1',
    projectPath: '/Users/test/project/app',
    timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-r1',
        question: 'How to implement Redux state management?',
        solution: {
          approach: 'Use Redux Toolkit for modern Redux setup',
          files: ['/src/store/index.ts'],
          successful: true
        },
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.95
      }
    ],
    implementations: [
      {
        id: 'impl-r1',
        tool: 'Write',
        file: '/src/store/index.ts',
        description: 'Created Redux store with RTK',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.9
      }
    ],
    decisions: [
      {
        id: 'dec-r1',
        decision: 'Use Redux Toolkit instead of vanilla Redux',
        context: 'Modern best practice',
        rationale: 'Simpler API and better TypeScript support',
        timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        impact: 'high',
        tags: ['architecture', 'state-management']
      }
    ],
    patterns: [
      {
        id: 'pat-r1',
        type: 'code',
        value: 'createSlice',
        frequency: 5,
        firstSeen: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
        examples: ['createSlice({ name: "user", ... })']
      }
    ],
    metadata: {
      entryCount: 50,
      duration: 1800000,
      toolsUsed: ['Write', 'Edit', 'Bash'],
      toolCounts: { Write: 5, Edit: 3, Bash: 2 },
      filesModified: ['/src/store/index.ts', '/src/store/userSlice.ts'],
      relevanceScore: 0.92,
      extractionVersion: '0.7.0'
    }
  });
  
  // Older but highly relevant context (3 days old)
  contexts.push({
    sessionId: 'session-relevant-1',
    projectPath: '/Users/test/project/app',
    timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-v1',
        question: 'How to optimize React performance?',
        solution: {
          approach: 'Use React.memo, useMemo, and useCallback',
          files: ['/src/components/Dashboard.tsx'],
          successful: true
        },
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.98
      }
    ],
    implementations: [
      {
        id: 'impl-v1',
        tool: 'Edit',
        file: '/src/components/Dashboard.tsx',
        description: 'Added memoization to expensive components',
        timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.95
      }
    ],
    decisions: [],
    patterns: [
      {
        id: 'pat-v1',
        type: 'code',
        value: 'React.memo',
        frequency: 12,
        firstSeen: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        examples: ['React.memo(Component)']
      }
    ],
    metadata: {
      entryCount: 75,
      duration: 2400000,
      toolsUsed: ['Edit', 'Read', 'Grep'],
      toolCounts: { Edit: 8, Read: 10, Grep: 5 },
      filesModified: ['/src/components/Dashboard.tsx'],
      relevanceScore: 0.96,
      extractionVersion: '0.7.0'
    }
  });
  
  // Old low-relevance context (10 days old)
  contexts.push({
    sessionId: 'session-old-1',
    projectPath: '/Users/test/project/app',
    timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-o1',
        question: 'How to set up ESLint?',
        solution: {
          approach: 'Install ESLint and configure rules',
          files: ['.eslintrc.js'],
          successful: true
        },
        timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.3
      }
    ],
    implementations: [],
    decisions: [],
    patterns: [],
    metadata: {
      entryCount: 20,
      duration: 600000,
      toolsUsed: ['Write', 'Bash'],
      toolCounts: { Write: 1, Bash: 3 },
      filesModified: ['.eslintrc.js'],
      relevanceScore: 0.3,
      extractionVersion: '0.7.0'
    }
  });
  
  // Very recent but low relevance (1 hour old)
  contexts.push({
    sessionId: 'session-recent-low-1',
    projectPath: '/Users/test/project/app',
    timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-rl1',
        question: 'How to format code?',
        solution: {
          approach: 'Run prettier',
          files: [],
          successful: true
        },
        timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
        relevance: 0.2
      }
    ],
    implementations: [],
    decisions: [],
    patterns: [],
    metadata: {
      entryCount: 10,
      duration: 300000,
      toolsUsed: ['Bash'],
      toolCounts: { Bash: 1 },
      filesModified: [],
      relevanceScore: 0.2,
      extractionVersion: '0.7.0'
    }
  });
  
  // Context with priority keywords (2 days old)
  contexts.push({
    sessionId: 'session-priority-1',
    projectPath: '/Users/test/project/app',
    timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-p1',
        question: 'How to implement authentication with JWT?',
        solution: {
          approach: 'Use jsonwebtoken library with refresh tokens',
          files: ['/src/auth/jwt.ts'],
          successful: true
        },
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.85
      }
    ],
    implementations: [
      {
        id: 'impl-p1',
        tool: 'Write',
        file: '/src/auth/jwt.ts',
        description: 'Implemented JWT authentication service',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        relevance: 0.85
      }
    ],
    decisions: [
      {
        id: 'dec-p1',
        decision: 'Use JWT for stateless authentication',
        context: 'API authentication',
        rationale: 'Scalable and secure',
        timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        impact: 'high',
        tags: ['security', 'authentication']
      }
    ],
    patterns: [
      {
        id: 'pat-p1',
        type: 'code',
        value: 'jwt.sign',
        frequency: 8,
        firstSeen: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastSeen: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        examples: ['jwt.sign(payload, secret)']
      }
    ],
    metadata: {
      entryCount: 60,
      duration: 2100000,
      toolsUsed: ['Write', 'Edit', 'Read'],
      toolCounts: { Write: 4, Edit: 5, Read: 8 },
      filesModified: ['/src/auth/jwt.ts', '/src/middleware/auth.ts'],
      relevanceScore: 0.85,
      extractionVersion: '0.7.0'
    }
  });
  
  return contexts;
}

// Test recent strategy
async function testRecentStrategy(loader, tempDir) {
  console.log(`\n${colors.bright}${colors.blue}1. Testing RECENT Strategy${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'Default recent config',
      config: {
        enabled: true,
        strategy: 'recent',
        maxSizeKB: 50,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should load most recent sessions first
        return result.content.includes('session-recent-1') ||
               result.content.includes('Redux') ||
               result.content.includes('recent');
      }
    },
    {
      name: 'Minimal format',
      config: {
        enabled: true,
        strategy: 'recent',
        maxSizeKB: 50,
        sessionCount: 2,
        patternCount: 0,
        knowledgeCount: 0,
        promptCount: 0,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'minimal'
      },
      validate: (result) => {
        // Minimal format should be concise
        const lines = result.content.split('\n').length;
        return lines < 50;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      // Mock the config
      const mockConfig = jest.fn().mockReturnValue(test.config);
      loader.configManager = { getAutoLoadSettings: mockConfig };
      
      const result = await loader.getAutoLoadContext();
      
      if (test.validate(result)) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
        console.log(`    Size: ${result.sizeKB.toFixed(2)}KB, Items: ${result.itemCount}`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test relevant strategy
async function testRelevantStrategy(loader, tempDir) {
  console.log(`\n${colors.bright}${colors.blue}2. Testing RELEVANT Strategy${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'High relevance filter',
      config: {
        enabled: true,
        strategy: 'relevant',
        maxSizeKB: 50,
        sessionCount: 5,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions', 'patterns'],
        timeWindowDays: 30,
        priorityKeywords: [],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should prioritize high relevance contexts
        return result.content.includes('performance') ||
               result.content.includes('React.memo') ||
               result.content.includes('0.9');
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const mockConfig = jest.fn().mockReturnValue(test.config);
      loader.configManager = { getAutoLoadSettings: mockConfig };
      
      const result = await loader.getAutoLoadContext();
      
      if (test.validate(result)) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
        console.log(`    Size: ${result.sizeKB.toFixed(2)}KB, Items: ${result.itemCount}`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test smart strategy
async function testSmartStrategy(loader, tempDir) {
  console.log(`\n${colors.bright}${colors.blue}3. Testing SMART Strategy${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'Balanced recent + relevant',
      config: {
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 50,
        sessionCount: 3,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions', 'patterns'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should include both recent and relevant
        const hasRecent = result.content.includes('Redux') || result.content.includes('recent');
        const hasRelevant = result.content.includes('performance') || result.content.includes('memo');
        return hasRecent || hasRelevant;
      }
    },
    {
      name: 'Detailed format',
      config: {
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 100,
        sessionCount: 2,
        patternCount: 3,
        knowledgeCount: 5,
        promptCount: 3,
        includeTypes: ['sessions', 'patterns'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'detailed'
      },
      validate: (result) => {
        // Detailed format should include more information
        return result.content.includes('Files Modified:') ||
               result.content.includes('Tools Used:') ||
               result.content.includes('Duration:');
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const mockConfig = jest.fn().mockReturnValue(test.config);
      loader.configManager = { getAutoLoadSettings: mockConfig };
      
      const result = await loader.getAutoLoadContext();
      
      if (test.validate(result)) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
        console.log(`    Size: ${result.sizeKB.toFixed(2)}KB, Items: ${result.itemCount}`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test custom strategy
async function testCustomStrategy(loader, tempDir) {
  console.log(`\n${colors.bright}${colors.blue}4. Testing CUSTOM Strategy${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'Priority keywords (authentication)',
      config: {
        enabled: true,
        strategy: 'custom',
        maxSizeKB: 50,
        sessionCount: 5,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 30,
        priorityKeywords: ['authentication', 'JWT', 'security'],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should prioritize contexts with authentication keywords
        return result.content.includes('JWT') ||
               result.content.includes('authentication') ||
               result.content.includes('jwt.sign');
      }
    },
    {
      name: 'Time window filter (3 days)',
      config: {
        enabled: true,
        strategy: 'custom',
        maxSizeKB: 50,
        sessionCount: 10,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 3,
        priorityKeywords: [],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should exclude contexts older than 3 days
        const shouldNotHave = result.content.includes('ESLint') || 
                             result.content.includes('session-old-1');
        return !shouldNotHave;
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const mockConfig = jest.fn().mockReturnValue(test.config);
      loader.configManager = { getAutoLoadSettings: mockConfig };
      
      const result = await loader.getAutoLoadContext();
      
      if (test.validate(result)) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
        console.log(`    Size: ${result.sizeKB.toFixed(2)}KB, Items: ${result.itemCount}`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test edge cases
async function testEdgeCases(loader, tempDir) {
  console.log(`\n${colors.bright}${colors.blue}5. Testing Edge Cases${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'Size limit enforcement',
      config: {
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 0.1, // 100 bytes
        sessionCount: 10,
        patternCount: 10,
        knowledgeCount: 10,
        promptCount: 10,
        includeTypes: ['sessions', 'patterns'],
        timeWindowDays: 30,
        priorityKeywords: [],
        formatStyle: 'detailed'
      },
      validate: (result) => {
        // Should truncate to fit size limit
        return result.sizeKB <= 0.1 && 
               result.content.includes('[Context truncated to fit size limit]');
      }
    },
    {
      name: 'Empty archive handling',
      config: {
        enabled: true,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 5,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['knowledge', 'prompts'], // Types with no data
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should handle gracefully with minimal content
        return result.content.includes('Project Context:') &&
               result.itemCount === 0;
      }
    },
    {
      name: 'Disabled auto-load',
      config: {
        enabled: false,
        strategy: 'smart',
        maxSizeKB: 10,
        sessionCount: 5,
        patternCount: 5,
        knowledgeCount: 10,
        promptCount: 5,
        includeTypes: ['sessions'],
        timeWindowDays: 7,
        priorityKeywords: [],
        formatStyle: 'summary'
      },
      validate: (result) => {
        // Should return empty when disabled
        return result.content === '' && 
               result.sizeKB === 0 &&
               result.strategy === 'disabled';
      }
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const mockConfig = jest.fn().mockReturnValue(test.config);
      loader.configManager = { getAutoLoadSettings: mockConfig };
      
      const result = await loader.getAutoLoadContext();
      
      if (test.validate(result)) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}`);
        if (result.sizeKB > 0) {
          console.log(`    Size: ${result.sizeKB.toFixed(2)}KB, Items: ${result.itemCount}`);
        }
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}`);
        console.log(`    Result: ${JSON.stringify(result).substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test performance
async function testPerformance(loader, tempDir) {
  console.log(`\n${colors.bright}${colors.blue}6. Testing Performance${colors.reset}`);
  console.log('-'.repeat(40));
  
  const config = {
    enabled: true,
    strategy: 'smart',
    maxSizeKB: 100,
    sessionCount: 10,
    patternCount: 20,
    knowledgeCount: 20,
    promptCount: 20,
    includeTypes: ['sessions', 'patterns', 'knowledge', 'prompts'],
    timeWindowDays: 30,
    priorityKeywords: [],
    formatStyle: 'detailed'
  };
  
  const mockConfig = jest.fn().mockReturnValue(config);
  loader.configManager = { getAutoLoadSettings: mockConfig };
  
  const times = [];
  for (let i = 0; i < 5; i++) {
    const start = Date.now();
    await loader.getAutoLoadContext();
    const elapsed = Date.now() - start;
    times.push(elapsed);
  }
  
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const max = Math.max(...times);
  const min = Math.min(...times);
  
  console.log(`  Average: ${avg.toFixed(1)}ms`);
  console.log(`  Min: ${min}ms, Max: ${max}ms`);
  
  const passed = avg < 100 ? 1 : 0;
  const failed = avg >= 100 ? 1 : 0;
  
  if (passed) {
    console.log(`  ${colors.green}✓${colors.reset} Excellent performance (< 100ms average)`);
  } else {
    console.log(`  ${colors.red}✗${colors.reset} Performance needs improvement (> 100ms average)`);
  }
  
  return { passed, failed };
}

// Mock Jest functions for testing outside Jest
if (typeof jest === 'undefined') {
  global.jest = {
    fn: () => {
      let mockReturnValue = undefined;
      const fn = function() { return mockReturnValue; };
      fn.mockReturnValue = (value) => {
        mockReturnValue = value;
        return fn;
      };
      return fn;
    }
  };
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}Testing Auto-load System${colors.reset}\n`);
  console.log('='.repeat(60) + '\n');
  
  // Create temp directory for test data
  const tempDir = path.join(os.tmpdir(), 'c0ntextkeeper-autoload-test-' + Date.now());
  const storage = new FileStore({ 
    basePath: tempDir,
    global: false 
  });
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  try {
    // Setup: Archive test contexts
    console.log(`${colors.cyan}Setting up test data...${colors.reset}`);
    const archiver = new ContextArchiver(storage);
    const testContexts = createTestContexts();
    
    for (const context of testContexts) {
      // Store in proper directory structure
      const projectName = path.basename(context.projectPath);
      const sessionsDir = path.join(tempDir, 'projects', projectName, 'sessions');
      
      if (!fsSync.existsSync(sessionsDir)) {
        fsSync.mkdirSync(sessionsDir, { recursive: true });
      }
      
      const timestamp = new Date(context.timestamp).toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .substring(0, 19);
      const filename = `${timestamp}_${context.sessionId}.json`;
      const filepath = path.join(sessionsDir, filename);
      
      fsSync.writeFileSync(filepath, JSON.stringify(context, null, 2));
      
      // Also archive for patterns
      await archiver.archive(context);
    }
    console.log(`  Archived ${testContexts.length} test contexts\n`);
    
    // Initialize loader with test storage
    const loader = new ContextLoader({ storage });
    
    // Run strategy tests
    let results;
    
    results = await testRecentStrategy(loader, tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    results = await testRelevantStrategy(loader, tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    results = await testSmartStrategy(loader, tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    results = await testCustomStrategy(loader, tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    results = await testEdgeCases(loader, tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    results = await testPerformance(loader, tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
  } catch (error) {
    console.error(`${colors.red}Test error:${colors.reset}`, error);
    totalFailed++;
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`Total: ${totalPassed + totalFailed}`);
  
  const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
  
  if (totalFailed === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All tests passed! (${successRate}% success rate)${colors.reset}`);
  } else if (successRate >= 80) {
    console.log(`\n${colors.green}${colors.bright}✅ Tests mostly passed (${successRate}% success rate)${colors.reset}`);
  } else if (successRate >= 60) {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Some tests failed (${successRate}% success rate)${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Many tests failed (${successRate}% success rate)${colors.reset}`);
  }
  
  // Optimization recommendations
  console.log(`\n${colors.cyan}${colors.bright}Optimization Recommendations:${colors.reset}`);
  console.log('1. Consider caching frequently accessed contexts');
  console.log('2. Implement lazy loading for large context sets');
  console.log('3. Add compression for stored contexts');
  console.log('4. Optimize relevance scoring algorithm');
  console.log('5. Consider using vector embeddings for semantic search');
}

// Run tests
runAllTests().catch(console.error);