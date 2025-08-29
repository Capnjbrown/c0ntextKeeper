#!/usr/bin/env node

/**
 * Test script for c0ntextKeeper MCP server
 * Tests all three MCP tools: fetch_context, search_archive, get_patterns
 */

const { spawn } = require('child_process');
const path = require('path');

const serverPath = path.join(__dirname, '..', 'dist', 'server', 'index.js');

// Test cases for each tool
const testCases = [
  {
    name: 'List Tools',
    request: {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    }
  },
  {
    name: 'Fetch Context',
    request: {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'fetch_context',
        arguments: {
          query: 'test query',
          limit: 5,
          scope: 'project'
        }
      },
      id: 2
    }
  },
  {
    name: 'Search Archive',
    request: {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'search_archive',
        arguments: {
          query: 'authentication'
        }
      },
      id: 3
    }
  },
  {
    name: 'Get Patterns',
    request: {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'get_patterns',
        arguments: {
          type: 'all',
          limit: 10
        }
      },
      id: 4
    }
  }
];

async function testMCPServer() {
  console.log('🧪 Testing c0ntextKeeper MCP Server...\n');
  console.log(`Server path: ${serverPath}\n`);

  for (const testCase of testCases) {
    console.log(`📍 Testing: ${testCase.name}`);
    console.log(`Request: ${JSON.stringify(testCase.request, null, 2)}`);
    
    const server = spawn('node', [serverPath]);
    
    let response = '';
    
    server.stdout.on('data', (data) => {
      response += data.toString();
    });
    
    server.stderr.on('data', (data) => {
      const message = data.toString();
      if (!message.includes('started successfully')) {
        console.error(`  ❌ Error: ${message}`);
      }
    });
    
    // Send test request
    server.stdin.write(JSON.stringify(testCase.request) + '\n');
    
    // Wait for response
    await new Promise((resolve) => {
      setTimeout(() => {
        server.kill();
        resolve();
      }, 1000);
    });
    
    if (response) {
      try {
        const lines = response.split('\n').filter(line => line.trim());
        const jsonLine = lines.find(line => line.startsWith('{'));
        if (jsonLine) {
          const parsed = JSON.parse(jsonLine);
          console.log(`  ✅ Response received: ${parsed.result ? 'Success' : 'Response'}`);
          if (parsed.result && parsed.result.tools) {
            console.log(`  📦 Tools available: ${parsed.result.tools.map(t => t.name).join(', ')}`);
          }
        } else {
          console.log(`  ⚠️  No JSON response found`);
        }
      } catch (e) {
        console.log(`  ⚠️  Could not parse response: ${e.message}`);
      }
    } else {
      console.log(`  ⚠️  No response received`);
    }
    
    console.log('');
  }
  
  console.log('✅ MCP Server test complete!\n');
  console.log('Next steps:');
  console.log('1. Restart Claude Code');
  console.log('2. Run /mcp to see c0ntextkeeper in the list');
  console.log('3. Test with: "Use fetch_context to find previous work"');
}

// Run tests
testMCPServer().catch(console.error);