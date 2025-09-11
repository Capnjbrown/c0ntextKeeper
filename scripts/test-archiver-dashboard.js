#!/usr/bin/env node
/**
 * Test script for archiver.ts analytics dashboard generation
 * Verifies README generation, project index, and analytics calculations
 */

const { ContextArchiver } = require('../dist/core/archiver');
const { FileStore } = require('../dist/storage/file-store');
const { ContextExtractor } = require('../dist/core/extractor');
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

// Create test context with known values
function createTestContext(sessionNum = 1) {
  const timestamp = new Date(Date.now() - (sessionNum - 1) * 3600000).toISOString(); // 1 hour apart
  
  return {
    sessionId: `test-session-${sessionNum}`,
    projectPath: '/Users/test/project/test-app',
    timestamp: timestamp,
    extractedAt: 'test',
    problems: [
      {
        id: `prob-${sessionNum}-1`,
        question: `How do I implement feature ${sessionNum}?`,
        solution: {
          approach: `Here's the solution for feature ${sessionNum}`,
          files: [`/src/feature${sessionNum}.ts`],
          successful: true
        },
        timestamp: timestamp,
        relevance: 0.9 - (sessionNum * 0.1)
      },
      {
        id: `prob-${sessionNum}-2`,
        question: `Why is component ${sessionNum} not rendering?`,
        timestamp: timestamp,
        relevance: 0.8 - (sessionNum * 0.1)
      }
    ],
    implementations: [
      {
        id: `impl-${sessionNum}-1`,
        tool: 'Write',
        file: `/src/component${sessionNum}.tsx`,
        description: `Created component ${sessionNum}`,
        timestamp: timestamp,
        relevance: 0.85
      },
      {
        id: `impl-${sessionNum}-2`,
        tool: 'Edit',
        file: `/src/app.tsx`,
        description: `Updated app to include component ${sessionNum}`,
        timestamp: timestamp,
        relevance: 0.75
      }
    ],
    decisions: [
      {
        id: `dec-${sessionNum}`,
        decision: `We should use pattern ${sessionNum} for this feature`,
        context: 'After considering alternatives',
        rationale: 'Better performance and maintainability',
        timestamp: timestamp,
        impact: sessionNum === 1 ? 'high' : 'medium',
        tags: ['architecture', 'performance']
      }
    ],
    patterns: sessionNum === 1 ? [
      {
        id: 'pattern-1',
        type: 'code',
        value: 'React.useState',
        frequency: 5,
        firstSeen: timestamp,
        lastSeen: timestamp,
        examples: ['const [state, setState] = useState()']
      }
    ] : [],
    metadata: {
      entryCount: 100 + sessionNum * 10,
      duration: 1800000 + sessionNum * 60000, // 30+ minutes
      toolsUsed: ['Write', 'Edit', 'Bash', 'Read'],
      toolCounts: {
        'Write': 5 + sessionNum,
        'Edit': 3 + sessionNum,
        'Bash': 2 + sessionNum,
        'Read': 10 + sessionNum
      },
      filesModified: [
        `/src/component${sessionNum}.tsx`,
        `/src/app.tsx`,
        `/src/feature${sessionNum}.ts`
      ],
      relevanceScore: 0.7 + (sessionNum * 0.05),
      extractionVersion: '0.7.0',
      isTest: false // Use production mode to test analytics
    }
  };
}

// Test analytics calculations
async function testAnalyticsCalculations() {
  console.log(`${colors.bright}${colors.cyan}Testing Analytics Calculations${colors.reset}\n`);
  console.log('=' .repeat(60) + '\n');
  
  // Create test storage in temp directory
  const tempDir = path.join(os.tmpdir(), 'c0ntextkeeper-test-' + Date.now());
  const storage = new FileStore({ 
    basePath: tempDir,
    global: false 
  });
  
  const archiver = new ContextArchiver(storage);
  
  let passedTests = 0;
  let failedTests = 0;
  
  try {
    // Test 1: Single session archival
    console.log(`${colors.bright}${colors.blue}1. Single Session Archival${colors.reset}`);
    console.log('-'.repeat(40));
    
    const context1 = createTestContext(1);
    const archivePath1 = await archiver.archive(context1);
    
    if (archivePath1 && await fs.access(archivePath1).then(() => true).catch(() => false)) {
      console.log(`${colors.green}✓${colors.reset} Session archived successfully`);
      console.log(`  Path: ${archivePath1}`);
      passedTests++;
    } else {
      console.log(`${colors.red}✗${colors.reset} Failed to archive session`);
      failedTests++;
    }
    
    // Test 2: Project index creation
    console.log(`\n${colors.bright}${colors.blue}2. Project Index Generation${colors.reset}`);
    console.log('-'.repeat(40));
    
    const projectDir = path.join(tempDir, 'projects', 'test-app');
    const indexPath = path.join(projectDir, 'index.json');
    
    if (await fs.access(indexPath).then(() => true).catch(() => false)) {
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      
      console.log('Index Statistics:');
      console.log(`  Total Problems: ${index.totalProblems}`);
      console.log(`  Total Implementations: ${index.totalImplementations}`);
      console.log(`  Total Decisions: ${index.totalDecisions}`);
      console.log(`  Total Patterns: ${index.totalPatterns}`);
      
      const checks = [
        { name: 'Problems count', expected: 2, actual: index.totalProblems },
        { name: 'Implementations count', expected: 2, actual: index.totalImplementations },
        { name: 'Decisions count', expected: 1, actual: index.totalDecisions },
        { name: 'Patterns count', expected: 1, actual: index.totalPatterns },
        { name: 'Session recorded', expected: 1, actual: index.sessions.length }
      ];
      
      for (const check of checks) {
        if (check.expected === check.actual) {
          console.log(`  ${colors.green}✓${colors.reset} ${check.name}: ${check.actual}`);
          passedTests++;
        } else {
          console.log(`  ${colors.red}✗${colors.reset} ${check.name}: expected ${check.expected}, got ${check.actual}`);
          failedTests++;
        }
      }
    } else {
      console.log(`${colors.red}✗${colors.reset} Project index not created`);
      failedTests++;
    }
    
    // Test 3: README dashboard generation
    console.log(`\n${colors.bright}${colors.blue}3. README Dashboard Generation${colors.reset}`);
    console.log('-'.repeat(40));
    
    const readmePath = path.join(projectDir, 'README.md');
    
    if (await fs.access(readmePath).then(() => true).catch(() => false)) {
      const readmeContent = await fs.readFile(readmePath, 'utf-8');
      
      const expectedSections = [
        { name: 'Project title', pattern: /# test-app - Context Archive/ },
        { name: 'Analytics section', pattern: /## 📊 Project Analytics/ },
        { name: 'Total Sessions', pattern: /\*\*Total Sessions\*\*:/ },
        { name: 'Tool Usage', pattern: /### Tool Usage/ },
        { name: 'Quality Metrics', pattern: /### Quality Metrics/ },
        { name: 'Recent Sessions', pattern: /## 📝 Recent Sessions/ },
        { name: 'Usage instructions', pattern: /## 🚀 How to Use This Archive/ },
        { name: 'Storage structure', pattern: /## 📁 Storage Structure/ }
      ];
      
      console.log('README Content Validation:');
      for (const section of expectedSections) {
        if (section.pattern.test(readmeContent)) {
          console.log(`  ${colors.green}✓${colors.reset} ${section.name} present`);
          passedTests++;
        } else {
          console.log(`  ${colors.red}✗${colors.reset} ${section.name} missing`);
          failedTests++;
        }
      }
      
      // Check for specific metrics in README
      if (readmeContent.includes('Problems Solved: 2')) {
        console.log(`  ${colors.green}✓${colors.reset} Correct problem count in README`);
        passedTests++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Incorrect problem count in README`);
        failedTests++;
      }
    } else {
      console.log(`${colors.red}✗${colors.reset} README.md not created`);
      failedTests++;
    }
    
    // Test 4: Multiple session aggregation
    console.log(`\n${colors.bright}${colors.blue}4. Multiple Session Aggregation${colors.reset}`);
    console.log('-'.repeat(40));
    
    // Archive 2 more sessions
    const context2 = createTestContext(2);
    const context3 = createTestContext(3);
    
    await archiver.archive(context2);
    await archiver.archive(context3);
    
    // Read updated index
    const updatedIndexContent = await fs.readFile(indexPath, 'utf-8');
    const updatedIndex = JSON.parse(updatedIndexContent);
    
    console.log('Aggregated Statistics:');
    console.log(`  Sessions: ${updatedIndex.sessions.length}`);
    console.log(`  Total Problems: ${updatedIndex.totalProblems}`);
    console.log(`  Total Implementations: ${updatedIndex.totalImplementations}`);
    console.log(`  Average Relevance: ${updatedIndex.averageRelevanceScore?.toFixed(2) || 'N/A'}`);
    
    // Check tool usage aggregation
    if (updatedIndex.totalToolUsage) {
      console.log(`  Total Tool Usage:`);
      for (const [tool, count] of Object.entries(updatedIndex.totalToolUsage)) {
        console.log(`    - ${tool}: ${count}x`);
      }
      
      if (updatedIndex.mostUsedTools && updatedIndex.mostUsedTools.length > 0) {
        console.log(`  ${colors.green}✓${colors.reset} Most used tools tracked: ${updatedIndex.mostUsedTools.join(', ')}`);
        passedTests++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} Most used tools not tracked`);
        failedTests++;
      }
    }
    
    // Verify aggregation accuracy
    const expectedTotals = {
      problems: 6, // 2 per session × 3 sessions
      implementations: 6, // 2 per session × 3 sessions
      decisions: 3, // 1 per session × 3 sessions
      patterns: 1 // Only first session has patterns
    };
    
    const aggregationChecks = [
      { name: 'Total problems', expected: expectedTotals.problems, actual: updatedIndex.totalProblems },
      { name: 'Total implementations', expected: expectedTotals.implementations, actual: updatedIndex.totalImplementations },
      { name: 'Total decisions', expected: expectedTotals.decisions, actual: updatedIndex.totalDecisions },
      { name: 'Session count', expected: 3, actual: updatedIndex.sessions.length }
    ];
    
    for (const check of aggregationChecks) {
      if (check.expected === check.actual) {
        console.log(`  ${colors.green}✓${colors.reset} ${check.name}: ${check.actual}`);
        passedTests++;
      } else {
        console.log(`  ${colors.red}✗${colors.reset} ${check.name}: expected ${check.expected}, got ${check.actual}`);
        failedTests++;
      }
    }
    
    // Test 5: Storage statistics
    console.log(`\n${colors.bright}${colors.blue}5. Storage Statistics${colors.reset}`);
    console.log('-'.repeat(40));
    
    const stats = await storage.getStats();
    
    console.log('Storage Stats:');
    console.log(`  Total Projects: ${stats.totalProjects}`);
    console.log(`  Total Sessions: ${stats.totalSessions}`);
    console.log(`  Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
    
    if (stats.totalProjects === 1 && stats.totalSessions === 3) {
      console.log(`  ${colors.green}✓${colors.reset} Correct storage statistics`);
      passedTests++;
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Incorrect storage statistics`);
      failedTests++;
    }
    
    // Test 6: Performance with large dataset
    console.log(`\n${colors.bright}${colors.blue}6. Performance Test${colors.reset}`);
    console.log('-'.repeat(40));
    
    const startTime = Date.now();
    const contexts = [];
    
    // Create 10 sessions
    for (let i = 4; i <= 13; i++) {
      contexts.push(createTestContext(i));
    }
    
    // Archive all sessions
    for (const ctx of contexts) {
      await archiver.archive(ctx);
    }
    
    const duration = Date.now() - startTime;
    const sessionsPerSecond = (10 / (duration / 1000)).toFixed(1);
    
    console.log(`Archived 10 sessions in ${duration}ms`);
    console.log(`Performance: ${sessionsPerSecond} sessions/second`);
    
    if (duration < 5000) {
      console.log(`  ${colors.green}✓${colors.reset} Good performance`);
      passedTests++;
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Performance could be improved`);
    }
    
    // Cleanup test directory
    await fs.rm(tempDir, { recursive: true, force: true });
    
  } catch (error) {
    console.error(`${colors.red}Error during testing:${colors.reset}`, error);
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
  
  // Optimization suggestions
  console.log(`\n${colors.cyan}${colors.bright}Optimization Suggestions:${colors.reset}`);
  console.log('1. Consider caching project index in memory during batch operations');
  console.log('2. The README generation could be optimized with templates');
  console.log('3. Tool usage statistics are comprehensive and well-structured');
  console.log('4. Consider adding trend analysis (improving/declining relevance over time)');
  console.log('5. Add visualization data for potential web dashboard integration');
}

// Check if compiled
const compiledPath = path.join(__dirname, '..', 'dist', 'core', 'archiver.js');
if (!require('fs').existsSync(compiledPath)) {
  console.log('Building project first...');
  const { execSync } = require('child_process');
  execSync('npm run build', { stdio: 'inherit' });
}

// Run tests
testAnalyticsCalculations().catch(console.error);