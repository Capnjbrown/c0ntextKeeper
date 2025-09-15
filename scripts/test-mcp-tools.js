#!/usr/bin/env node

/**
 * Test MCP Tools
 * Tests all three MCP tools to ensure they work correctly
 */

const { ContextRetriever } = require('../dist/core/retriever.js');
const { PatternAnalyzer } = require('../dist/core/patterns.js');

async function testMCPTools() {
  console.log('🧪 Testing c0ntextKeeper MCP Tools with Natural Language\n');

  const retriever = new ContextRetriever();
  const analyzer = new PatternAnalyzer();

  // Test 1: fetch_context with natural language queries
  console.log('1️⃣ Testing fetch_context with various queries...');

  // Helper function to truncate text
  function truncateText(text, maxLength = 100) {
    if (!text) return 'No content';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  }
  
  // Helper function to format sessionId
  function formatSessionId(sessionId) {
    if (!sessionId || sessionId === 'unknown') {
      return '❌ UNKNOWN';
    }
    if (sessionId.length > 20) {
      return sessionId.substring(0, 16) + '...';
    }
    return sessionId;
  }

  const testQueries = [
    {
      query: 'fetch context to what we have been working on lately',
      description: 'Natural language - recent work'
    },
    {
      query: 'MCP tools fixes patterns retriever scorer',
      description: 'Technical terms'
    },
    {
      query: 'recent work solutions implementations fixes improvements',
      description: 'Multiple keywords'
    },
    {
      query: '',
      description: 'Recent contexts (empty query)'
    }
  ];

  for (const test of testQueries) {
    console.log(`\n   📝 Test: ${test.description}`);
    console.log(`   Query: "${test.query || '[Empty - Get Recent]'}"`);

    try {
      const contexts = await retriever.fetchRelevantContext({
        query: test.query,
        limit: 3,
        scope: 'project',
        minRelevance: 0.3
      });

      if (contexts.length > 0) {
        console.log(`   ✅ Found ${contexts.length} contexts\n`);
        
        contexts.forEach((ctx, idx) => {
          const relevance = ctx.metadata?.relevanceScore || 0;
          const sessionId = formatSessionId(ctx.sessionId);
          const projectName = ctx.projectPath ? ctx.projectPath.split('/').pop() : 'unknown';
          
          console.log(`   📌 Result ${idx + 1}:`);
          console.log(`      📊 Relevance: ${(relevance * 100).toFixed(0)}%`);
          console.log(`      🆔 Session: ${sessionId}`);
          console.log(`      📁 Project: ${projectName}`);
          console.log(`      📅 Date: ${new Date(ctx.timestamp).toLocaleDateString()}`);
          
          // Show first problem if available
          if (ctx.problems && ctx.problems.length > 0) {
            const firstProblem = ctx.problems[0];
            console.log(`      🎯 Problem: ${truncateText(firstProblem.question, 150)}`);
            
            if (firstProblem.solution) {
              console.log(`      ✅ Solution: ${truncateText(firstProblem.solution.approach, 150)}`);
            }
          } else if (ctx.implementations && ctx.implementations.length > 0) {
            // Show implementation if no problems
            const firstImpl = ctx.implementations[0];
            console.log(`      🛠️ Implementation: ${firstImpl.tool} on ${firstImpl.file}`);
            if (firstImpl.description) {
              console.log(`         ${truncateText(firstImpl.description, 100)}`);
            }
          } else if (ctx.decisions && ctx.decisions.length > 0) {
            // Show decision if no problems or implementations
            const firstDecision = ctx.decisions[0];
            console.log(`      💡 Decision: ${truncateText(firstDecision.decision, 150)}`);
          }
          
          console.log(''); // Empty line between results
        });
      } else {
        console.log('   ⚠️ No contexts found');
        console.log('   💡 Try: c0ntextkeeper status to check if archives exist');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  // Test 2: search_archive
  console.log('\n2️⃣ Testing search_archive...');
  try {
    const results = await retriever.searchArchive({
      query: 'implementation',
      limit: 10,
      sortBy: 'relevance'
    });

    if (results.length > 0) {
      console.log(`   ✅ Found ${results.length} search results`);
    } else {
      console.log('   ⚠️ No search results found');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: get_patterns
  console.log('\n3️⃣ Testing get_patterns...');
  try {
    const patterns = await analyzer.getPatterns({
      type: 'all',
      minFrequency: 1,
      limit: 10
    });

    if (patterns.length > 0) {
      console.log(`   ✅ Found ${patterns.length} patterns`);
      patterns.slice(0, 3).forEach(p => {
        console.log(`   📊 ${p.type}: ${p.value} (${p.frequency}x)`);
      });
    } else {
      console.log('   ⚠️ No patterns found');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n✨ MCP Tools testing complete!');
}

// Run the tests
testMCPTools().catch(console.error);
