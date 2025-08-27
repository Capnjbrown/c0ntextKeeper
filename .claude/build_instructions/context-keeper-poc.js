#!/usr/bin/env node

/**
 * Claude Code Context Keeper - Proof of Concept
 * 
 * This script demonstrates automatic context extraction during preCompact
 * Place this in ~/.claude/hooks/context-keeper-poc.js
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

// Configuration
const ARCHIVE_BASE = path.join(process.env.HOME, '.claude', 'context-archive');
const MAX_CONTEXT_ITEMS = 50; // Maximum items to extract per session
const RELEVANCE_THRESHOLD = 0.5; // Minimum relevance score to archive

/**
 * Parse JSONL transcript file line by line
 */
async function parseTranscript(transcriptPath) {
  const fileStream = await fs.open(transcriptPath, 'r');
  const rl = readline.createInterface({
    input: fileStream.createReadStream(),
    crlfDelay: Infinity
  });

  const entries = [];
  for await (const line of rl) {
    if (line.trim()) {
      try {
        entries.push(JSON.parse(line));
      } catch (e) {
        console.error('Failed to parse line:', e.message);
      }
    }
  }
  
  await fileStream.close();
  return entries;
}

/**
 * Calculate relevance score for a transcript entry
 */
function calculateRelevance(entry) {
  let score = 0;
  
  // High-value indicators
  if (entry.type === 'tool_use') {
    const toolName = entry.toolUse?.name || '';
    if (['Write', 'Edit', 'MultiEdit'].includes(toolName)) score += 0.8;
    if (['Read', 'View'].includes(toolName)) score += 0.3;
    if (toolName === 'Bash') score += 0.5;
  }
  
  if (entry.type === 'user' && entry.message?.content) {
    const content = entry.message.content.toLowerCase();
    // Problem-solving indicators
    if (content.includes('error') || content.includes('fix')) score += 0.6;
    if (content.includes('implement') || content.includes('create')) score += 0.5;
    if (content.includes('why') || content.includes('how')) score += 0.4;
    // Architecture decisions
    if (content.includes('should we') || content.includes('better to')) score += 0.7;
    if (content.includes('decision') || content.includes('approach')) score += 0.6;
  }
  
  if (entry.type === 'assistant' && entry.message?.content) {
    const content = entry.message.content;
    // Code blocks are valuable
    if (content.includes('```')) score += 0.5;
    // Explanations are valuable
    if (content.includes('because') || content.includes('reason')) score += 0.3;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Extract context from transcript entries
 */
function extractContext(entries) {
  const context = {
    timestamp: new Date().toISOString(),
    sessionId: entries[0]?.sessionId || 'unknown',
    projectPath: entries[0]?.cwd || 'unknown',
    extractedAt: 'preCompact',
    patterns: [],
    decisions: [],
    problems: [],
    implementations: []
  };
  
  let currentProblem = null;
  let currentImplementation = null;
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const relevance = calculateRelevance(entry);
    
    if (relevance < RELEVANCE_THRESHOLD) continue;
    
    // Extract user problems/questions
    if (entry.type === 'user' && entry.message?.content) {
      const content = entry.message.content;
      if (content.toLowerCase().includes('error') || 
          content.toLowerCase().includes('issue') ||
          content.toLowerCase().includes('problem')) {
        currentProblem = {
          question: content.slice(0, 500),
          timestamp: entry.timestamp,
          solution: null
        };
      }
    }
    
    // Extract code implementations
    if (entry.type === 'tool_use' && ['Write', 'Edit', 'MultiEdit'].includes(entry.toolUse?.name)) {
      const implementation = {
        tool: entry.toolUse.name,
        file: entry.toolUse.input?.file_path || entry.toolUse.input?.path,
        timestamp: entry.timestamp,
        description: null
      };
      
      // Look for assistant explanation before this tool use
      if (i > 0 && entries[i-1].type === 'assistant') {
        const explanation = entries[i-1].message?.content || '';
        implementation.description = explanation.slice(0, 200);
      }
      
      context.implementations.push(implementation);
      currentImplementation = implementation;
    }
    
    // Link solutions to problems
    if (currentProblem && currentImplementation) {
      currentProblem.solution = {
        files: [currentImplementation.file],
        approach: currentImplementation.description
      };
      context.problems.push(currentProblem);
      currentProblem = null;
      currentImplementation = null;
    }
    
    // Extract architectural decisions
    if (entry.type === 'assistant' && entry.message?.content) {
      const content = entry.message.content;
      const decisionPhrases = [
        /we should (\w+)/gi,
        /better to (\w+)/gi,
        /i recommend (\w+)/gi,
        /the approach is to (\w+)/gi
      ];
      
      for (const phrase of decisionPhrases) {
        const matches = content.matchAll(phrase);
        for (const match of matches) {
          context.decisions.push({
            decision: match[0],
            context: content.slice(Math.max(0, match.index - 50), match.index + 150),
            timestamp: entry.timestamp
          });
        }
      }
    }
    
    // Extract patterns (repeated operations)
    if (entry.type === 'tool_use' && entry.toolUse?.name === 'Bash') {
      const command = entry.toolUse.input?.command;
      if (command && !command.includes('ls') && !command.includes('pwd')) {
        context.patterns.push({
          type: 'command',
          value: command,
          timestamp: entry.timestamp
        });
      }
    }
  }
  
  // Limit extracted items
  context.problems = context.problems.slice(-MAX_CONTEXT_ITEMS);
  context.implementations = context.implementations.slice(-MAX_CONTEXT_ITEMS);
  context.decisions = context.decisions.slice(-MAX_CONTEXT_ITEMS);
  context.patterns = context.patterns.slice(-MAX_CONTEXT_ITEMS);
  
  return context;
}

/**
 * Archive extracted context
 */
async function archiveContext(context) {
  // Create project-specific directory
  const projectHash = crypto.createHash('md5')
    .update(context.projectPath)
    .digest('hex').slice(0, 8);
  
  const projectDir = path.join(ARCHIVE_BASE, projectHash);
  const sessionsDir = path.join(projectDir, 'sessions');
  
  // Ensure directories exist
  await fs.mkdir(sessionsDir, { recursive: true });
  
  // Save session context
  const sessionFile = path.join(sessionsDir, 
    `${new Date().toISOString().split('T')[0]}-${context.sessionId}.json`);
  
  await fs.writeFile(sessionFile, JSON.stringify(context, null, 2));
  
  // Update project index
  const indexFile = path.join(projectDir, 'index.json');
  let index = { 
    projectPath: context.projectPath, 
    sessions: [],
    totalProblems: 0,
    totalImplementations: 0,
    lastUpdated: new Date().toISOString()
  };
  
  try {
    const existing = await fs.readFile(indexFile, 'utf-8');
    index = JSON.parse(existing);
  } catch (e) {
    // Index doesn't exist yet
  }
  
  // Add session to index
  index.sessions.push({
    sessionId: context.sessionId,
    timestamp: context.timestamp,
    file: path.basename(sessionFile),
    stats: {
      problems: context.problems.length,
      implementations: context.implementations.length,
      decisions: context.decisions.length,
      patterns: context.patterns.length
    }
  });
  
  // Update totals
  index.totalProblems += context.problems.length;
  index.totalImplementations += context.implementations.length;
  index.lastUpdated = new Date().toISOString();
  
  // Keep only last 100 sessions in index
  if (index.sessions.length > 100) {
    index.sessions = index.sessions.slice(-100);
  }
  
  await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
  
  return { projectDir, sessionFile };
}

/**
 * Main execution
 */
async function main() {
  try {
    // Parse hook input from stdin
    const input = await new Promise((resolve) => {
      let data = '';
      process.stdin.on('data', chunk => data += chunk);
      process.stdin.on('end', () => resolve(data));
    });
    
    const hookData = JSON.parse(input);
    
    if (hookData.hook_event_name !== 'PreCompact') {
      console.log(JSON.stringify({ 
        status: 'skipped', 
        reason: 'Not a PreCompact event' 
      }));
      return;
    }
    
    // Extract transcript path
    const transcriptPath = hookData.transcript_path;
    if (!transcriptPath) {
      throw new Error('No transcript path provided');
    }
    
    // Parse and extract context
    console.error(`[Context Keeper] Processing transcript: ${transcriptPath}`);
    const entries = await parseTranscript(transcriptPath);
    console.error(`[Context Keeper] Parsed ${entries.length} entries`);
    
    const context = extractContext(entries);
    console.error(`[Context Keeper] Extracted context:
      - ${context.problems.length} problems
      - ${context.implementations.length} implementations  
      - ${context.decisions.length} decisions
      - ${context.patterns.length} patterns`);
    
    // Archive the context
    const { projectDir, sessionFile } = await archiveContext(context);
    console.error(`[Context Keeper] Archived to: ${sessionFile}`);
    
    // Return success with a message for Claude
    console.log(JSON.stringify({
      status: 'success',
      message: `✓ Context archived: ${context.problems.length} problems, ${context.implementations.length} implementations saved`,
      archiveLocation: projectDir
    }));
    
  } catch (error) {
    console.error('[Context Keeper] Error:', error.message);
    console.log(JSON.stringify({
      status: 'error',
      message: error.message
    }));
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}