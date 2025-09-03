#!/usr/bin/env node

/**
 * Debug script to analyze extraction issues
 * 
 * Version Compatibility: v0.5.0+
 * - Analyzes archives created with extraction algorithm v0.5.0
 * - Expects Claude Code JSONL format in source transcripts
 * - Validates proper content array parsing
 * 
 * Note: Update the archivePath variable to point to the archive you want to debug
 */

const fs = require('fs');
const path = require('path');

// Read the problematic archive
const archivePath = '/Users/jasonbrown/.c0ntextkeeper/archive/projects/c0ntextKeeper/sessions/2025-08-31_1421_MT_tool.json';
const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));

console.log('=== ARCHIVE ANALYSIS ===');
console.log('Session ID:', archive.sessionId);
console.log('Entry Count:', archive.metadata.entryCount);
console.log('Duration:', archive.metadata.duration);
console.log('Extraction Version:', archive.metadata.extractionVersion);
console.log('');

console.log('=== EXTRACTION RESULTS ===');
console.log('Problems found:', archive.problems.length);
console.log('Implementations found:', archive.implementations.length);
console.log('Decisions found:', archive.decisions.length);
console.log('Patterns found:', archive.patterns.length);
console.log('Tools used:', archive.metadata.toolsUsed.length);
console.log('Tool counts:', Object.keys(archive.metadata.toolCounts).length);
console.log('Files modified:', archive.metadata.filesModified.length);
console.log('');

console.log('=== PROBLEM ANALYSIS ===');
if (archive.problems.length > 0) {
  console.log('First problem:');
  const problem = archive.problems[0];
  console.log('  ID:', problem.id);
  console.log('  Timestamp:', problem.timestamp);
  console.log('  Tags:', problem.tags);
  console.log('  Relevance:', problem.relevance);
  
  // Analyze the question field
  console.log('  Question type:', typeof problem.question);
  console.log('  Question length:', problem.question.length);
  
  // Try to parse if it looks like JSON
  if (problem.question.startsWith('[{')) {
    try {
      const parsed = JSON.parse(problem.question);
      console.log('  Parsed question structure:');
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0];
        console.log('    - Type:', first.type);
        console.log('    - Has tool_use_id:', !!first.tool_use_id);
        console.log('    - Has content:', !!first.content);
        if (first.content && Array.isArray(first.content) && first.content.length > 0) {
          console.log('    - Content[0] type:', first.content[0].type);
          console.log('    - Content[0] has text:', !!first.content[0].text);
        }
      }
    } catch (e) {
      console.log('  Failed to parse as JSON:', e.message);
    }
  }
  
  if (problem.solution) {
    console.log('  Solution:');
    console.log('    Approach type:', typeof problem.solution.approach);
    console.log('    Files:', problem.solution.files);
    console.log('    Successful:', problem.solution.successful);
    
    // Check if approach is also malformed
    if (problem.solution.approach.startsWith('[{')) {
      console.log('    Approach appears to be JSON data too');
    }
  }
}

console.log('\n=== DIAGNOSIS ===');
console.log('The extraction is capturing tool_result entries as problems.');
console.log('The "question" field contains raw JSON arrays with tool results.');
console.log('This suggests the transcript parser is misidentifying entry types.');
console.log('');
console.log('Expected: User questions should be actual text questions');
console.log('Actual: Getting tool_result JSON data instead');
console.log('');
console.log('Root cause: The transcript normalizer is not correctly mapping');
console.log('the actual Claude Code JSONL format to our expected structure.');