#!/usr/bin/env node
/**
 * Comprehensive test for c0ntextKeeper MCP tools
 * Tests fetch_context, search_archive, and get_patterns
 */

const { ContextRetriever } = require('../dist/core/retriever');
const { PatternAnalyzer } = require('../dist/core/patterns');
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
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Create test contexts with known data
function createTestContexts() {
  const contexts = [];
  
  // Context 1: Authentication implementation
  contexts.push({
    sessionId: 'session-auth-001',
    projectPath: '/test/project',
    timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-1',
        question: 'How do I implement JWT authentication in Node.js?',
        solution: {
          approach: 'Use jsonwebtoken library with Express middleware',
          files: ['/src/auth/jwt.ts'],
          successful: true
        },
        timestamp: new Date().toISOString(),
        relevance: 0.95,
        tags: ['authentication', 'jwt', 'security']
      }
    ],
    implementations: [
      {
        id: 'impl-1',
        tool: 'Write',
        file: '/src/auth/jwt.ts',
        description: 'Created JWT middleware for Express',
        timestamp: new Date().toISOString(),
        relevance: 0.9
      }
    ],
    decisions: [
      {
        id: 'dec-1',
        decision: 'Use JWT for stateless authentication',
        context: 'Scalability requirements',
        rationale: 'Better for distributed systems',
        timestamp: new Date().toISOString(),
        impact: 'high',
        tags: ['architecture', 'security']
      }
    ],
    patterns: [
      {
        id: 'pat-1',
        type: 'code',
        value: 'JWT verification pattern',
        frequency: 3,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        examples: ['jwt.verify(token, secret)']
      }
    ],
    metadata: {
      entryCount: 150,
      duration: 3600000,
      toolsUsed: ['Write', 'Edit', 'Bash'],
      toolCounts: { Write: 5, Edit: 3, Bash: 2 },
      filesModified: ['/src/auth/jwt.ts', '/src/app.ts'],
      relevanceScore: 0.85,
      extractionVersion: '0.7.0'
    }
  });
  
  // Context 2: Database optimization
  contexts.push({
    sessionId: 'session-db-002',
    projectPath: '/test/project',
    timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-2',
        question: 'How to optimize PostgreSQL queries for better performance?',
        solution: {
          approach: 'Add indexes and use query optimization techniques',
          files: ['/src/db/queries.sql'],
          successful: true
        },
        timestamp: new Date().toISOString(),
        relevance: 0.9,
        tags: ['database', 'postgresql', 'performance']
      }
    ],
    implementations: [
      {
        id: 'impl-2',
        tool: 'Write',
        file: '/src/db/indexes.sql',
        description: 'Added composite indexes for common queries',
        timestamp: new Date().toISOString(),
        relevance: 0.85
      }
    ],
    decisions: [],
    patterns: [
      {
        id: 'pat-2',
        type: 'command',
        value: 'CREATE INDEX pattern',
        frequency: 5,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        examples: ['CREATE INDEX idx_name ON table(column)']
      }
    ],
    metadata: {
      entryCount: 200,
      duration: 4800000,
      toolsUsed: ['Write', 'Bash', 'Read'],
      toolCounts: { Write: 8, Bash: 5, Read: 10 },
      filesModified: ['/src/db/queries.sql', '/src/db/indexes.sql'],
      relevanceScore: 0.8,
      extractionVersion: '0.7.0'
    }
  });
  
  // Context 3: React component development
  contexts.push({
    sessionId: 'session-react-003',
    projectPath: '/test/project',
    timestamp: new Date().toISOString(), // Today
    extractedAt: 'test',
    problems: [
      {
        id: 'prob-3',
        question: 'How to create a reusable modal component in React?',
        solution: {
          approach: 'Use React Portal with custom hook',
          files: ['/src/components/Modal.tsx'],
          successful: true
        },
        timestamp: new Date().toISOString(),
        relevance: 0.88,
        tags: ['react', 'component', 'ui']
      }
    ],
    implementations: [
      {
        id: 'impl-3',
        tool: 'Write',
        file: '/src/components/Modal.tsx',
        description: 'Created reusable Modal component with Portal',
        timestamp: new Date().toISOString(),
        relevance: 0.87
      },
      {
        id: 'impl-4',
        tool: 'Write',
        file: '/src/hooks/useModal.ts',
        description: 'Created custom hook for modal state management',
        timestamp: new Date().toISOString(),
        relevance: 0.85
      }
    ],
    decisions: [
      {
        id: 'dec-2',
        decision: 'Use React Portal for modal rendering',
        context: 'z-index issues with nested components',
        rationale: 'Renders outside DOM hierarchy',
        timestamp: new Date().toISOString(),
        impact: 'medium',
        tags: ['react', 'ui']
      }
    ],
    patterns: [
      {
        id: 'pat-3',
        type: 'code',
        value: 'React hooks pattern',
        frequency: 8,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        examples: ['useState', 'useEffect', 'useCallback']
      }
    ],
    metadata: {
      entryCount: 175,
      duration: 2700000,
      toolsUsed: ['Write', 'Edit', 'TodoWrite'],
      toolCounts: { Write: 6, Edit: 4, TodoWrite: 2 },
      filesModified: ['/src/components/Modal.tsx', '/src/hooks/useModal.ts'],
      relevanceScore: 0.82,
      extractionVersion: '0.7.0'
    }
  });
  
  return contexts;
}

// Test fetch_context tool
async function testFetchContext(retriever) {
  console.log(`${colors.bright}${colors.blue}1. Testing fetch_context Tool${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'Query-based search',
      input: { query: 'authentication', limit: 5, scope: 'project' },
      expectedMin: 1
    },
    {
      name: 'Recent contexts',
      input: { limit: 3, scope: 'project' },
      expectedMin: 3
    },
    {
      name: 'High relevance filter',
      input: { minRelevance: 0.85, limit: 10, scope: 'project' },
      expectedMin: 1
    },
    {
      name: 'Session scope',
      input: { query: 'React', scope: 'session', limit: 5 },
      expectedMin: 0
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const results = await retriever.fetchRelevantContext(test.input);
      
      if (Array.isArray(results) && results.length >= test.expectedMin) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}: Found ${results.length} contexts`);
        
        // Verify result structure
        if (results.length > 0) {
          const first = results[0];
          if (first.sessionId && first.relevance !== undefined) {
            console.log(`    - First result: Session ${first.sessionId}, Relevance: ${first.relevance.toFixed(2)}`);
          }
        }
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}: Expected at least ${test.expectedMin}, got ${results.length}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test search_archive tool
async function testSearchArchive(retriever) {
  console.log(`\n${colors.bright}${colors.blue}2. Testing search_archive Tool${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'Text search',
      input: { query: 'JWT', limit: 10 },
      expectedMin: 1
    },
    {
      name: 'File pattern filter',
      input: { query: 'component', filePattern: '*.tsx', limit: 10 },
      expectedMin: 1
    },
    {
      name: 'Sort by relevance',
      input: { query: 'database', sortBy: 'relevance', limit: 5 },
      expectedMin: 1
    },
    {
      name: 'Sort by date',
      input: { query: 'React', sortBy: 'date', limit: 5 },
      expectedMin: 1
    },
    {
      name: 'No results query',
      input: { query: 'nonexistentterm12345', limit: 10 },
      expectedMin: 0
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const results = await retriever.searchArchive(test.input);
      
      if (Array.isArray(results) && results.length >= test.expectedMin) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}: Found ${results.length} results`);
        
        // Verify sorting for sort tests
        if (test.input.sortBy === 'date' && results.length > 1) {
          const sorted = results.every((r, i) => 
            i === 0 || new Date(r.context.timestamp) <= new Date(results[i-1].context.timestamp)
          );
          if (sorted) {
            console.log(`    - Results properly sorted by ${test.input.sortBy}`);
          }
        }
        passed++;
      } else if (test.expectedMin === 0 && results.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}: Correctly returned no results`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}: Expected at least ${test.expectedMin}, got ${results.length}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ${colors.red}✗${colors.reset} ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  return { passed, failed };
}

// Test get_patterns tool
async function testGetPatterns(analyzer) {
  console.log(`\n${colors.bright}${colors.blue}3. Testing get_patterns Tool${colors.reset}`);
  console.log('-'.repeat(40));
  
  const tests = [
    {
      name: 'All patterns',
      input: { type: 'all', minFrequency: 1, limit: 10 },
      expectedMin: 3
    },
    {
      name: 'Code patterns only',
      input: { type: 'code', minFrequency: 1, limit: 5 },
      expectedMin: 2
    },
    {
      name: 'Command patterns',
      input: { type: 'command', minFrequency: 1, limit: 5 },
      expectedMin: 1
    },
    {
      name: 'High frequency filter',
      input: { type: 'all', minFrequency: 5, limit: 10 },
      expectedMin: 2
    },
    {
      name: 'Architecture patterns',
      input: { type: 'architecture', minFrequency: 1, limit: 5 },
      expectedMin: 0
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const patterns = await analyzer.getPatterns(test.input);
      
      if (Array.isArray(patterns) && patterns.length >= test.expectedMin) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}: Found ${patterns.length} patterns`);
        
        // Verify pattern structure
        if (patterns.length > 0) {
          const first = patterns[0];
          if (first.type && first.frequency && first.value) {
            console.log(`    - First pattern: ${first.type}, Frequency: ${first.frequency}`);
          }
        }
        passed++;
      } else if (test.expectedMin === 0 && patterns.length === 0) {
        console.log(`  ${colors.green}✓${colors.reset} ${test.name}: Correctly returned no patterns`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${test.name}: Expected at least ${test.expectedMin}, got ${patterns.length}`);
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
async function testEdgeCases(retriever, analyzer) {
  console.log(`\n${colors.bright}${colors.blue}4. Testing Edge Cases${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Empty archive
  console.log('  Testing empty archive handling...');
  const emptyRetriever = new ContextRetriever();
  try {
    const results = await emptyRetriever.fetchRelevantContext({ query: 'test', limit: 5 });
    if (Array.isArray(results)) {
      console.log(`    ${colors.green}✓${colors.reset} Handled empty archive gracefully`);
      passed++;
    }
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} Failed on empty archive: ${error.message}`);
    failed++;
  }
  
  // Test 2: Invalid parameters
  console.log('  Testing invalid parameter handling...');
  try {
    await retriever.fetchRelevantContext({ limit: -1 }); // Invalid limit
    console.log(`    ${colors.red}✗${colors.reset} Should have rejected invalid limit`);
    failed++;
  } catch (error) {
    console.log(`    ${colors.green}✓${colors.reset} Correctly rejected invalid parameters`);
    passed++;
  }
  
  // Test 3: Very large limit
  console.log('  Testing large limit handling...');
  try {
    const results = await retriever.fetchRelevantContext({ limit: 1000 });
    if (Array.isArray(results) && results.length <= 100) {
      console.log(`    ${colors.green}✓${colors.reset} Properly capped at maximum limit`);
      passed++;
    } else {
      console.log(`    ${colors.red}✗${colors.reset} Did not cap at maximum limit`);
      failed++;
    }
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} Error with large limit: ${error.message}`);
    failed++;
  }
  
  // Test 4: Special characters in query
  console.log('  Testing special characters in search...');
  try {
    const results = await retriever.searchArchive({ query: 'React & Node.js | TypeScript', limit: 5 });
    console.log(`    ${colors.green}✓${colors.reset} Handled special characters in query`);
    passed++;
  } catch (error) {
    console.log(`    ${colors.red}✗${colors.reset} Failed with special characters: ${error.message}`);
    failed++;
  }
  
  return { passed, failed };
}

// Test performance
async function testPerformance(retriever, contexts) {
  console.log(`\n${colors.bright}${colors.blue}5. Testing Performance${colors.reset}`);
  console.log('-'.repeat(40));
  
  // Test search performance
  const searchStart = Date.now();
  await retriever.searchArchive({ query: 'test', limit: 50 });
  const searchDuration = Date.now() - searchStart;
  
  console.log(`  Search operation: ${searchDuration}ms`);
  
  // Test fetch performance
  const fetchStart = Date.now();
  await retriever.fetchRelevantContext({ limit: 50 });
  const fetchDuration = Date.now() - fetchStart;
  
  console.log(`  Fetch operation: ${fetchDuration}ms`);
  
  // Test pattern analysis performance
  const analyzer = new PatternAnalyzer();
  const patternStart = Date.now();
  await analyzer.getPatterns({ type: 'all', limit: 50 });
  const patternDuration = Date.now() - patternStart;
  
  console.log(`  Pattern analysis: ${patternDuration}ms`);
  
  const totalDuration = searchDuration + fetchDuration + patternDuration;
  const avgDuration = totalDuration / 3;
  
  if (avgDuration < 100) {
    console.log(`  ${colors.green}✓${colors.reset} Excellent performance (avg ${avgDuration.toFixed(0)}ms)`);
    return { passed: 1, failed: 0 };
  } else if (avgDuration < 500) {
    console.log(`  ${colors.yellow}⚠${colors.reset} Acceptable performance (avg ${avgDuration.toFixed(0)}ms)`);
    return { passed: 1, failed: 0 };
  } else {
    console.log(`  ${colors.red}✗${colors.reset} Performance needs optimization (avg ${avgDuration.toFixed(0)}ms)`);
    return { passed: 0, failed: 1 };
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}Testing c0ntextKeeper MCP Tools${colors.reset}\n`);
  console.log('=' .repeat(60) + '\n');
  
  // Create temp directory for test data
  const tempDir = path.join(os.tmpdir(), 'c0ntextkeeper-mcp-test-' + Date.now());
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
      // Store in the proper sessions directory structure for fetch_context to find
      const projectName = path.basename(context.projectPath);
      const sessionsDir = path.join(tempDir, 'projects', projectName, 'sessions');
      
      // Create sessions directory if it doesn't exist
      if (!fsSync.existsSync(sessionsDir)) {
        fsSync.mkdirSync(sessionsDir, { recursive: true });
      }
      
      // Generate filename with timestamp
      const timestamp = new Date(context.timestamp).toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .substring(0, 19);
      const filename = `${timestamp}_test-session.json`;
      const filepath = path.join(sessionsDir, filename);
      
      // Write the context file
      fsSync.writeFileSync(filepath, JSON.stringify(context, null, 2));
      
      // Also archive normally for patterns
      await archiver.archive(context);
    }
    console.log(`  Archived ${testContexts.length} test contexts\n`);
    
    // Initialize tools
    const retriever = new ContextRetriever(storage);
    const analyzer = new PatternAnalyzer(storage);
    
    // Run tests
    const fetchResults = await testFetchContext(retriever);
    totalPassed += fetchResults.passed;
    totalFailed += fetchResults.failed;
    
    const searchResults = await testSearchArchive(retriever);
    totalPassed += searchResults.passed;
    totalFailed += searchResults.failed;
    
    const patternResults = await testGetPatterns(analyzer);
    totalPassed += patternResults.passed;
    totalFailed += patternResults.failed;
    
    const edgeResults = await testEdgeCases(retriever, analyzer);
    totalPassed += edgeResults.passed;
    totalFailed += edgeResults.failed;
    
    const perfResults = await testPerformance(retriever, testContexts);
    totalPassed += perfResults.passed;
    totalFailed += perfResults.failed;
    
    // Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error(`${colors.red}Test error:${colors.reset}`, error);
    totalFailed++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}Test Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`Total: ${totalPassed + totalFailed}`);
  
  const successRate = (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1);
  if (totalFailed === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All MCP tools working correctly! (${successRate}%)${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Some tests failed (${successRate}% success rate)${colors.reset}`);
  }
  
  // Optimization recommendations
  console.log(`\n${colors.cyan}${colors.bright}Optimization Recommendations:${colors.reset}`);
  console.log('1. Consider implementing result caching for frequent queries');
  console.log('2. Add fuzzy matching for better search results');
  console.log('3. Implement pagination for large result sets');
  console.log('4. Consider adding relevance boosting for recent contexts');
  console.log('5. Add query syntax support (AND, OR, NOT operators)');
}

// Check if compiled
const compiledPath = path.join(__dirname, '..', 'dist', 'core', 'retriever.js');
if (!require('fs').existsSync(compiledPath)) {
  console.log('Building project first...');
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

// Run tests
runAllTests().catch(console.error);