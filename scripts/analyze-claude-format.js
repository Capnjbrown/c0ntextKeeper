#!/usr/bin/env node

/**
 * Script to analyze the actual Claude Code JSONL format
 * by reverse-engineering from the archived data
 * 
 * Version Compatibility: v0.5.0+
 * - Analyzes archives to understand Claude Code's format
 * - Helps debug why content wasn't being extracted properly
 * - Shows how content is structured as arrays not strings
 * 
 * This script was instrumental in discovering the content array
 * format issue that was fixed in v0.5.0.
 */

const fs = require('fs');

// Read the problematic archive
const archivePath = '/Users/jasonbrown/.c0ntextkeeper/archive/projects/c0ntextKeeper/sessions/2025-08-31_1421_MT_tool.json';
const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));

console.log('=== ANALYZING CLAUDE CODE JSONL FORMAT ===\n');

// Analyze all problems to understand the pattern
const entryTypes = new Map();
const contentStructures = [];

for (const problem of archive.problems) {
  // The "question" field contains what was actually in the transcript
  const rawContent = problem.question;
  
  // Try to understand the structure
  if (rawContent.startsWith('[{')) {
    try {
      // Truncate and add closing if needed
      let jsonStr = rawContent;
      if (!jsonStr.endsWith(']')) {
        // Find last complete object
        const lastBrace = jsonStr.lastIndexOf('}');
        if (lastBrace > 0) {
          jsonStr = jsonStr.substring(0, lastBrace + 1) + ']';
        }
      }
      
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const entry = parsed[0];
        
        // Collect unique structures
        const structure = {
          hasType: !!entry.type,
          type: entry.type,
          hasToolUseId: !!entry.tool_use_id,
          hasContent: !!entry.content,
          contentIsArray: Array.isArray(entry.content),
          contentLength: entry.content?.length,
          firstContentType: entry.content?.[0]?.type,
          keys: Object.keys(entry).sort()
        };
        
        const key = JSON.stringify(structure.keys);
        if (!entryTypes.has(key)) {
          entryTypes.set(key, structure);
          contentStructures.push(structure);
        }
      }
    } catch (e) {
      // Ignore parse errors for truncated content
    }
  }
}

console.log('Found', contentStructures.length, 'unique entry structures:\n');

for (const struct of contentStructures) {
  console.log('Structure:', struct.keys.join(', '));
  console.log('  Type:', struct.type);
  console.log('  Has tool_use_id:', struct.hasToolUseId);
  console.log('  Content is array:', struct.contentIsArray);
  if (struct.contentIsArray) {
    console.log('  First content type:', struct.firstContentType);
  }
  console.log('');
}

console.log('=== HYPOTHESIS ===');
console.log('Based on the data, Claude Code appears to use a format where:');
console.log('1. Messages can contain arrays of mixed content');
console.log('2. Tool results have type:"tool_result" with tool_use_id');
console.log('3. Content is often an array with objects containing type:"text"');
console.log('4. The actual user/assistant messages might be embedded in content arrays');
console.log('');
console.log('This is DIFFERENT from our expected format where:');
console.log('- type field directly indicates "user", "assistant", "tool_use"');
console.log('- message.content is a simple string');
console.log('- toolUse and toolResult are separate entry types');
console.log('');

// Now check the solutions to see if they have similar issues
console.log('=== SOLUTION ANALYSIS ===');
let solutionIssues = 0;
for (const problem of archive.problems) {
  if (problem.solution && problem.solution.approach.startsWith('[{')) {
    solutionIssues++;
  }
}
console.log(`${solutionIssues} out of ${archive.problems.filter(p => p.solution).length} solutions also have JSON data as approach text`);
console.log('');

console.log('=== RECOMMENDED FIX ===');
console.log('1. The normalizeEntry function needs to handle embedded arrays');
console.log('2. When type is "tool_result", extract actual content from nested structure');
console.log('3. Look for tool_use patterns in the content array');
console.log('4. Extract text from content[].text fields for actual messages');
console.log('5. Build proper toolUse and toolResult objects from the nested data');