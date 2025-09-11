#!/usr/bin/env node
/**
 * End-to-End Integration Test for c0ntextKeeper
 * Tests the complete workflow from transcript parsing to context retrieval
 */

const { ContextExtractor } = require('../dist/core/extractor');
const { RelevanceScorer } = require('../dist/core/scorer');
const { ContextArchiver } = require('../dist/core/archiver');
const { ContextRetriever } = require('../dist/core/retriever');
const { PatternAnalyzer } = require('../dist/core/patterns');
const { ContextLoader } = require('../dist/core/context-loader');
const { FileStore } = require('../dist/storage/file-store');
const { TranscriptReader } = require('../dist/utils/transcript');
const fsSync = require('fs');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const readline = require('readline');

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

// Create a simulated JSONL transcript
function createSimulatedTranscript() {
  const entries = [];
  const sessionId = 'e2e-test-session-' + Date.now();
  
  // User asks about implementing authentication
  entries.push({
    type: 'user',
    message: {
      content: 'How do I implement JWT authentication in my Express API? I need refresh tokens too.'
    },
    timestamp: new Date().toISOString()
  });
  
  // Assistant responds with solution
  entries.push({
    type: 'assistant',
    message: {
      content: 'I\'ll help you implement JWT authentication with refresh tokens. Let me create the necessary files.'
    },
    timestamp: new Date().toISOString()
  });
  
  // Tool use - Write auth service
  entries.push({
    type: 'tool_use',
    tool: 'Write',
    input: {
      file_path: '/src/services/auth.ts',
      content: 'import jwt from \'jsonwebtoken\';\n\nexport class AuthService {\n  generateTokens(userId: string) {\n    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: \'15m\' });\n    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_SECRET, { expiresIn: \'7d\' });\n    return { accessToken, refreshToken };\n  }\n}'
    },
    timestamp: new Date().toISOString()
  });
  
  // Tool result
  entries.push({
    type: 'tool_result',
    tool: 'Write',
    result: {
      success: true,
      message: 'File written successfully'
    },
    timestamp: new Date().toISOString()
  });
  
  // User asks about database optimization
  entries.push({
    type: 'user',
    message: {
      content: 'My PostgreSQL queries are slow. How can I optimize them?'
    },
    timestamp: new Date().toISOString()
  });
  
  // Assistant provides optimization advice
  entries.push({
    type: 'assistant',
    message: {
      content: 'Let me analyze your queries and suggest optimizations. First, let\'s add proper indexes.'
    },
    timestamp: new Date().toISOString()
  });
  
  // Tool use - Run database command
  entries.push({
    type: 'tool_use',
    tool: 'Bash',
    input: {
      command: 'psql -c "CREATE INDEX idx_users_email ON users(email);"'
    },
    timestamp: new Date().toISOString()
  });
  
  // Tool result
  entries.push({
    type: 'tool_result',
    tool: 'Bash',
    result: {
      exit_code: 0,
      output: 'CREATE INDEX'
    },
    timestamp: new Date().toISOString()
  });
  
  // User reports a bug
  entries.push({
    type: 'user',
    message: {
      content: 'The React component is not re-rendering when state changes. What could be wrong?'
    },
    timestamp: new Date().toISOString()
  });
  
  // Assistant diagnoses and fixes
  entries.push({
    type: 'assistant',
    message: {
      content: 'This is likely due to mutating state directly. Let me fix the component to use immutable updates.'
    },
    timestamp: new Date().toISOString()
  });
  
  // Tool use - Edit component
  entries.push({
    type: 'tool_use',
    tool: 'Edit',
    input: {
      file_path: '/src/components/UserList.tsx',
      old_string: 'users.push(newUser)',
      new_string: 'setUsers([...users, newUser])'
    },
    timestamp: new Date().toISOString()
  });
  
  // Tool result
  entries.push({
    type: 'tool_result',
    tool: 'Edit',
    result: {
      success: true,
      message: 'File edited successfully'
    },
    timestamp: new Date().toISOString()
  });
  
  // Add decision point
  entries.push({
    type: 'assistant',
    message: {
      content: 'After considering the options, I recommend using React Query for server state management instead of Redux for API data. This will simplify the codebase and improve caching.'
    },
    timestamp: new Date().toISOString()
  });
  
  // Pattern recognition - multiple similar operations
  for (let i = 0; i < 3; i++) {
    entries.push({
      type: 'tool_use',
      tool: 'Bash',
      input: {
        command: `npm test -- component${i}.test.ts`
      },
      timestamp: new Date().toISOString()
    });
    
    entries.push({
      type: 'tool_result',
      tool: 'Bash',
      result: {
        exit_code: 0,
        output: 'Tests passed'
      },
      timestamp: new Date().toISOString()
    });
  }
  
  return { sessionId, entries };
}

// Test 1: Transcript Processing Pipeline
async function testTranscriptProcessing(tempDir) {
  console.log(`\n${colors.bright}${colors.blue}1. Testing Transcript Processing Pipeline${colors.reset}`);
  console.log('-'.repeat(40));
  
  const { sessionId, entries } = createSimulatedTranscript();
  const transcriptPath = path.join(tempDir, 'test-transcript.jsonl');
  
  // Write transcript to file
  const transcriptContent = entries.map(e => JSON.stringify(e)).join('\n');
  await fs.writeFile(transcriptPath, transcriptContent);
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test extraction
    const extractor = new ContextExtractor();
    const reader = new TranscriptReader(transcriptPath);
    const context = await extractor.extract(reader);
    
    if (context.problems.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Problem extraction: Found ${context.problems.length} problems`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Problem extraction: No problems found`);
      failed++;
    }
    
    if (context.implementations.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Implementation extraction: Found ${context.implementations.length} implementations`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Implementation extraction: No implementations found`);
      failed++;
    }
    
    if (context.decisions.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Decision extraction: Found ${context.decisions.length} decisions`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Decision extraction: No decisions found`);
      failed++;
    }
    
    // Test scoring
    const scorer = new RelevanceScorer();
    const score = scorer.scoreContext(context);
    
    if (score > 0.5) {
      console.log(`  ${colors.green}✓${colors.reset} Relevance scoring: Score ${score.toFixed(2)} (high relevance)`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Relevance scoring: Score ${score.toFixed(2)} (low relevance)`);
      failed++;
    }
    
    // Test archiving
    const storage = new FileStore({ basePath: tempDir, global: false });
    const archiver = new ContextArchiver(storage);
    await archiver.archive(context);
    
    const projectName = path.basename(context.projectPath);
    const archivePath = path.join(tempDir, 'projects', projectName);
    
    if (fsSync.existsSync(archivePath)) {
      console.log(`  ${colors.green}✓${colors.reset} Context archiving: Successfully archived`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Context archiving: Archive not created`);
      failed++;
    }
    
    return { passed, failed, context, sessionId };
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Pipeline error: ${error.message}`);
    return { passed, failed: failed + 1 };
  }
}

// Test 2: Pattern Recognition
async function testPatternRecognition(tempDir, contexts) {
  console.log(`\n${colors.bright}${colors.blue}2. Testing Pattern Recognition${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  
  try {
    const storage = new FileStore({ basePath: tempDir, global: false });
    const analyzer = new PatternAnalyzer(storage);
    
    // Get patterns
    const patterns = await analyzer.getPatterns();
    
    if (patterns.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Pattern detection: Found ${patterns.length} patterns`);
      
      // Check for specific patterns
      const npmTestPattern = patterns.find(p => p.value.includes('npm test'));
      if (npmTestPattern) {
        console.log(`  ${colors.green}✓${colors.reset} Command pattern: Found repeated 'npm test' (frequency: ${npmTestPattern.frequency})`);
        passed++;
      } else {
        failed++;
      }
      
      const toolPatterns = patterns.filter(p => p.type === 'code');
      if (toolPatterns.length > 0) {
        console.log(`  ${colors.green}✓${colors.reset} Code patterns: Found ${toolPatterns.length} code patterns`);
        passed++;
      } else {
        failed++;
      }
      
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Pattern detection: No patterns found`);
      failed++;
    }
    
    // Test pattern aggregation
    const aggregated = await analyzer.aggregatePatterns(patterns);
    if (aggregated && aggregated.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Pattern aggregation: Successfully aggregated patterns`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Pattern aggregation: Failed to aggregate`);
      failed++;
    }
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Pattern error: ${error.message}`);
    failed++;
  }
  
  return { passed, failed };
}

// Test 3: Context Retrieval
async function testContextRetrieval(tempDir, sessionId) {
  console.log(`\n${colors.bright}${colors.blue}3. Testing Context Retrieval${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  
  try {
    const storage = new FileStore({ basePath: tempDir, global: false });
    const retriever = new ContextRetriever(storage);
    
    // Test search by query
    const authResults = await retriever.searchArchive({
      query: 'JWT authentication',
      limit: 10
    });
    
    if (authResults.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Query search: Found ${authResults.length} results for 'JWT authentication'`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Query search: No results for 'JWT authentication'`);
      failed++;
    }
    
    // Test fetch relevant context
    const relevantContexts = await retriever.fetchRelevantContext({
      query: 'database optimization',
      limit: 5,
      minRelevance: 0.3
    });
    
    if (relevantContexts.length > 0) {
      console.log(`  ${colors.green}✓${colors.reset} Relevant context: Found ${relevantContexts.length} relevant contexts`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Relevant context: No relevant contexts found`);
      failed++;
    }
    
    // Test get by session ID
    const sessionContext = await retriever.getBySessionId(sessionId);
    if (sessionContext) {
      console.log(`  ${colors.green}✓${colors.reset} Session retrieval: Successfully retrieved by session ID`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Session retrieval: Failed to retrieve by session ID`);
      failed++;
    }
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Retrieval error: ${error.message}`);
    failed++;
  }
  
  return { passed, failed };
}

// Test 4: Analytics Dashboard
async function testAnalyticsDashboard(tempDir) {
  console.log(`\n${colors.bright}${colors.blue}4. Testing Analytics Dashboard${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  
  try {
    const projectPath = process.cwd();
    const projectName = path.basename(projectPath);
    const indexPath = path.join(tempDir, 'projects', projectName, 'index.json');
    const readmePath = path.join(tempDir, 'projects', projectName, 'README.md');
    
    // Check if index exists
    if (fsSync.existsSync(indexPath)) {
      const indexContent = JSON.parse(await fs.readFile(indexPath, 'utf-8'));
      
      if (indexContent.totalSessions > 0) {
        console.log(`  ${colors.green}✓${colors.reset} Project index: ${indexContent.totalSessions} sessions tracked`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Project index: No sessions in index`);
        failed++;
      }
      
      if (indexContent.statistics) {
        console.log(`  ${colors.green}✓${colors.reset} Statistics: Generated analytics data`);
        console.log(`    - Total problems: ${indexContent.statistics.totalProblems}`);
        console.log(`    - Total patterns: ${indexContent.statistics.totalPatterns}`);
        console.log(`    - Tool usage: ${Object.keys(indexContent.statistics.toolUsage || {}).length} tools`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Statistics: No analytics data`);
        failed++;
      }
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Project index: Not created`);
      failed += 2;
    }
    
    // Check if README exists
    if (fsSync.existsSync(readmePath)) {
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      
      if (readmeContent.includes('Analytics Dashboard')) {
        console.log(`  ${colors.green}✓${colors.reset} README dashboard: Created successfully`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} README dashboard: Missing content`);
        failed++;
      }
    } else {
      console.log(`  ${colors.red}✗${colors.reset} README dashboard: Not created`);
      failed++;
    }
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Analytics error: ${error.message}`);
    failed++;
  }
  
  return { passed, failed };
}

// Test 5: Auto-load Integration
async function testAutoLoadIntegration(tempDir) {
  console.log(`\n${colors.bright}${colors.blue}5. Testing Auto-load Integration${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Note: ContextLoader uses its own storage, so we can't control it directly
    const loader = new ContextLoader();
    
    // Test loading context
    const loadedContext = await loader.getAutoLoadContext();
    
    if (loadedContext.content) {
      console.log(`  ${colors.green}✓${colors.reset} Context loading: Loaded ${loadedContext.sizeKB.toFixed(2)}KB`);
      console.log(`    Strategy: ${loadedContext.strategy}`);
      console.log(`    Items: ${loadedContext.itemCount}`);
      passed++;
      
      // Check content structure
      if (loadedContext.content.includes('Project Context:')) {
        console.log(`  ${colors.green}✓${colors.reset} Content structure: Valid format`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Content structure: Invalid format`);
        failed++;
      }
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Context loading: No content loaded`);
      failed += 2;
    }
    
    // Test preview
    const preview = await loader.previewAutoLoad();
    if (preview && preview.includes('AUTO-LOAD CONTEXT PREVIEW')) {
      console.log(`  ${colors.green}✓${colors.reset} Preview generation: Successfully generated`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Preview generation: Failed`);
      failed++;
    }
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Auto-load error: ${error.message}`);
    failed++;
  }
  
  return { passed, failed };
}

// Test 6: Performance Benchmarks
async function testPerformanceBenchmarks(tempDir) {
  console.log(`\n${colors.bright}${colors.blue}6. Testing Performance Benchmarks${colors.reset}`);
  console.log('-'.repeat(40));
  
  let passed = 0;
  let failed = 0;
  const benchmarks = {};
  
  try {
    const storage = new FileStore({ basePath: tempDir, global: false });
    
    // Benchmark extraction
    const { sessionId, entries } = createSimulatedTranscript();
    const transcriptPath = path.join(tempDir, 'perf-transcript.jsonl');
    const transcriptContent = entries.map(e => JSON.stringify(e)).join('\n');
    await fs.writeFile(transcriptPath, transcriptContent);
    
    const extractor = new ContextExtractor();
    const reader = new TranscriptReader(transcriptPath);
    
    let start = Date.now();
    const context = await extractor.extract(reader);
    benchmarks.extraction = Date.now() - start;
    
    // Benchmark scoring
    const scorer = new RelevanceScorer();
    start = Date.now();
    for (let i = 0; i < 100; i++) {
      scorer.scoreContext(context);
    }
    benchmarks.scoring = (Date.now() - start) / 100;
    
    // Benchmark archiving
    const archiver = new ContextArchiver(storage);
    start = Date.now();
    await archiver.archive(context);
    benchmarks.archiving = Date.now() - start;
    
    // Benchmark retrieval
    const retriever = new ContextRetriever(storage);
    start = Date.now();
    await retriever.searchArchive({ query: 'test', limit: 10 });
    benchmarks.search = Date.now() - start;
    
    // Benchmark pattern analysis
    const analyzer = new PatternAnalyzer(storage);
    start = Date.now();
    await analyzer.getPatterns();
    benchmarks.patterns = Date.now() - start;
    
    // Print benchmarks
    console.log(`  Extraction: ${benchmarks.extraction}ms`);
    console.log(`  Scoring: ${benchmarks.scoring.toFixed(2)}ms per context`);
    console.log(`  Archiving: ${benchmarks.archiving}ms`);
    console.log(`  Search: ${benchmarks.search}ms`);
    console.log(`  Pattern Analysis: ${benchmarks.patterns}ms`);
    
    // Check performance thresholds
    if (benchmarks.extraction < 100) {
      console.log(`  ${colors.green}✓${colors.reset} Extraction performance: Excellent (<100ms)`);
      passed++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Extraction performance: Needs optimization (${benchmarks.extraction}ms)`);
    }
    
    if (benchmarks.scoring < 5) {
      console.log(`  ${colors.green}✓${colors.reset} Scoring performance: Excellent (<5ms)`);
      passed++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Scoring performance: Needs optimization (${benchmarks.scoring.toFixed(2)}ms)`);
    }
    
    if (benchmarks.search < 50) {
      console.log(`  ${colors.green}✓${colors.reset} Search performance: Excellent (<50ms)`);
      passed++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Search performance: Needs optimization (${benchmarks.search}ms)`);
    }
    
  } catch (error) {
    console.log(`  ${colors.red}✗${colors.reset} Benchmark error: ${error.message}`);
    failed++;
  }
  
  return { passed, failed, benchmarks };
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}c0ntextKeeper End-to-End Integration Test${colors.reset}\n`);
  console.log('='.repeat(60));
  
  // Create temp directory for test data
  const tempDir = path.join(os.tmpdir(), 'c0ntextkeeper-e2e-test-' + Date.now());
  await fs.mkdir(tempDir, { recursive: true });
  
  let totalPassed = 0;
  let totalFailed = 0;
  let allBenchmarks = {};
  
  try {
    // Run tests in sequence
    let results;
    let context, sessionId;
    
    // Test 1: Transcript Processing
    results = await testTranscriptProcessing(tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    if (results.context) {
      context = results.context;
      sessionId = results.sessionId;
    }
    
    // Test 2: Pattern Recognition
    results = await testPatternRecognition(tempDir, context ? [context] : []);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    // Test 3: Context Retrieval
    if (sessionId) {
      results = await testContextRetrieval(tempDir, sessionId);
      totalPassed += results.passed;
      totalFailed += results.failed;
    }
    
    // Test 4: Analytics Dashboard
    results = await testAnalyticsDashboard(tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    // Test 5: Auto-load Integration
    results = await testAutoLoadIntegration(tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    
    // Test 6: Performance Benchmarks
    results = await testPerformanceBenchmarks(tempDir);
    totalPassed += results.passed;
    totalFailed += results.failed;
    if (results.benchmarks) {
      allBenchmarks = results.benchmarks;
    }
    
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
  console.log(`${colors.bright}Integration Test Summary${colors.reset}`);
  console.log(`${colors.green}Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${totalFailed}${colors.reset}`);
  console.log(`Total: ${totalPassed + totalFailed}`);
  
  const successRate = ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1);
  
  if (totalFailed === 0) {
    console.log(`\n${colors.green}${colors.bright}✅ All integration tests passed! (${successRate}% success rate)${colors.reset}`);
  } else if (successRate >= 80) {
    console.log(`\n${colors.green}${colors.bright}✅ Integration tests mostly passed (${successRate}% success rate)${colors.reset}`);
  } else if (successRate >= 60) {
    console.log(`\n${colors.yellow}${colors.bright}⚠️  Some integration tests failed (${successRate}% success rate)${colors.reset}`);
  } else {
    console.log(`\n${colors.red}${colors.bright}❌ Many integration tests failed (${successRate}% success rate)${colors.reset}`);
  }
  
  // Performance summary
  if (Object.keys(allBenchmarks).length > 0) {
    console.log(`\n${colors.cyan}${colors.bright}Performance Summary:${colors.reset}`);
    console.log(`  Extraction: ${allBenchmarks.extraction}ms`);
    console.log(`  Scoring: ${allBenchmarks.scoring?.toFixed(2)}ms`);
    console.log(`  Archiving: ${allBenchmarks.archiving}ms`);
    console.log(`  Search: ${allBenchmarks.search}ms`);
    console.log(`  Patterns: ${allBenchmarks.patterns}ms`);
    
    const totalTime = Object.values(allBenchmarks).reduce((a, b) => a + (b || 0), 0);
    console.log(`  Total: ${totalTime.toFixed(1)}ms`);
  }
  
  // Recommendations
  console.log(`\n${colors.cyan}${colors.bright}Production Readiness Assessment:${colors.reset}`);
  if (successRate >= 90) {
    console.log('✅ System is production ready');
    console.log('✅ All core features functional');
    console.log('✅ Performance within acceptable limits');
  } else if (successRate >= 70) {
    console.log('⚠️  System is mostly ready but needs refinement');
    console.log('   - Fix failing tests before release');
    console.log('   - Review error handling');
  } else {
    console.log('❌ System needs more work before release');
    console.log('   - Critical features not working');
    console.log('   - Investigate and fix core issues');
  }
}

// Run tests
runAllTests().catch(console.error);