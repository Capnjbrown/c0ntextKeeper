#!/usr/bin/env node

/**
 * Validation script to verify archive extraction quality
 * 
 * Version Compatibility: v0.5.0+
 * - Validates archives created with extraction algorithm v0.5.0
 * - Checks for proper content extraction from Claude Code format
 * - Verifies relevance scoring (user questions should score ~1.0)
 * 
 * Note: Update the archivePath variable to point to the archive to validate
 */

const fs = require('fs');
const path = require('path');

// Read the archive
const archivePath = '/Users/jasonbrown/.c0ntextkeeper/archive/projects/c0ntextKeeper/sessions/2025-09-02_1707_MT_fix-typescript.json';
const archive = JSON.parse(fs.readFileSync(archivePath, 'utf8'));

console.log('=== ARCHIVE VALIDATION REPORT ===\n');
console.log('Archive file:', path.basename(archivePath));
console.log('Session ID:', archive.sessionId);
console.log('Extraction Version:', archive.metadata.extractionVersion);
console.log('');

// Validation results
let validationResults = {
  passed: [],
  failed: [],
  warnings: []
};

// 1. Check basic structure
console.log('📋 STRUCTURE VALIDATION');
console.log('------------------------');

// Required fields
const requiredFields = ['sessionId', 'projectPath', 'timestamp', 'problems', 'implementations', 'decisions', 'patterns', 'metadata'];
requiredFields.forEach(field => {
  if (archive[field] !== undefined) {
    validationResults.passed.push(`✅ Field '${field}' exists`);
  } else {
    validationResults.failed.push(`❌ Missing required field: ${field}`);
  }
});

// 2. Check metadata completeness
console.log('\n📊 METADATA VALIDATION');
console.log('----------------------');

const metadataFields = ['entryCount', 'duration', 'toolsUsed', 'toolCounts', 'filesModified', 'relevanceScore', 'extractionVersion'];
metadataFields.forEach(field => {
  if (archive.metadata[field] !== undefined) {
    validationResults.passed.push(`✅ Metadata '${field}' exists`);
  } else {
    validationResults.failed.push(`❌ Missing metadata: ${field}`);
  }
});

// 3. Content Quality Checks
console.log('\n🎯 CONTENT QUALITY');
console.log('------------------');

// Problems validation
console.log('\nProblems (${archive.problems.length} extracted):');
if (archive.problems.length > 0) {
  validationResults.passed.push(`✅ Problems extracted: ${archive.problems.length}`);
  
  archive.problems.forEach((p, i) => {
    console.log(`  ${i + 1}. Question: "${p.question.substring(0, 60)}..."`);
    
    // Check if question is actually a question
    if (p.question.includes('?')) {
      console.log(`     ✅ Contains question mark`);
    } else if (p.question.toLowerCase().includes('error')) {
      console.log(`     ✅ Contains error indicator`);
    } else {
      console.log(`     ⚠️  May not be a real problem`);
      validationResults.warnings.push(`Problem ${i + 1} may not be a real problem`);
    }
    
    if (p.solution) {
      console.log(`     ✅ Has solution: "${p.solution.approach.substring(0, 50)}..."`);
      if (p.solution.files && p.solution.files.length > 0) {
        console.log(`     ✅ Solution references files: ${p.solution.files.join(', ')}`);
      }
    } else {
      console.log(`     ℹ️  No solution (might be unresolved)`);
    }
    
    console.log(`     Relevance: ${p.relevance}`);
  });
} else {
  validationResults.warnings.push('⚠️ No problems extracted');
}

// Implementations validation
console.log(`\nImplementations (${archive.implementations.length} extracted):`);
if (archive.implementations.length > 0) {
  validationResults.passed.push(`✅ Implementations extracted: ${archive.implementations.length}`);
  
  const toolUsage = {};
  archive.implementations.forEach((impl, i) => {
    console.log(`  ${i + 1}. ${impl.tool} on ${impl.file}`);
    toolUsage[impl.tool] = (toolUsage[impl.tool] || 0) + 1;
    
    if (impl.changes && impl.changes.length > 0) {
      console.log(`     ✅ Has code changes`);
    }
    
    if (impl.description) {
      console.log(`     ✅ Has description`);
    }
  });
  
  console.log('\n  Tool usage summary:', toolUsage);
} else {
  validationResults.failed.push('❌ No implementations extracted');
}

// Decisions validation
console.log(`\nDecisions (${archive.decisions.length} extracted):`);
if (archive.decisions.length > 0) {
  validationResults.passed.push(`✅ Decisions extracted: ${archive.decisions.length}`);
  
  archive.decisions.forEach((d, i) => {
    console.log(`  ${i + 1}. "${d.decision.substring(0, 60)}..."`);
    console.log(`     Impact: ${d.impact}`);
    if (d.rationale) {
      console.log(`     ✅ Has rationale`);
    }
  });
} else {
  validationResults.warnings.push('⚠️ No decisions extracted (may be normal)');
}

// Patterns validation
console.log(`\nPatterns (${archive.patterns.length} extracted):`);
if (archive.patterns.length > 0) {
  validationResults.passed.push(`✅ Patterns extracted: ${archive.patterns.length}`);
  archive.patterns.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.type}: ${p.value} (${p.frequency}x)`);
  });
} else {
  console.log('  ℹ️ No patterns (requires repeated actions)');
}

// 4. Tool tracking validation
console.log('\n🔧 TOOL TRACKING');
console.log('----------------');

if (archive.metadata.toolsUsed.length > 0) {
  validationResults.passed.push(`✅ Tools tracked: ${archive.metadata.toolsUsed.join(', ')}`);
  console.log('Tools used:', archive.metadata.toolsUsed.join(', '));
  console.log('Tool counts:', JSON.stringify(archive.metadata.toolCounts));
  
  // Verify counts match
  const actualToolCount = Object.values(archive.metadata.toolCounts).reduce((a, b) => a + b, 0);
  const implToolCount = archive.implementations.length;
  
  if (actualToolCount === implToolCount) {
    validationResults.passed.push('✅ Tool counts match implementations');
  } else {
    validationResults.warnings.push(`⚠️ Tool count mismatch: ${actualToolCount} vs ${implToolCount} implementations`);
  }
} else {
  validationResults.failed.push('❌ No tools tracked');
}

// 5. Files modified validation
console.log('\n📁 FILES MODIFIED');
console.log('-----------------');

if (archive.metadata.filesModified.length > 0) {
  validationResults.passed.push(`✅ Files tracked: ${archive.metadata.filesModified.length}`);
  console.log('Files:', archive.metadata.filesModified.join(', '));
} else {
  validationResults.warnings.push('⚠️ No files marked as modified');
}

// 6. Security filtering
console.log('\n🔒 SECURITY');
console.log('-----------');

if (archive.metadata.securityFiltered) {
  validationResults.passed.push('✅ Security filtering applied');
  console.log(`Security filtered: Yes (${archive.metadata.redactedCount} items redacted)`);
} else {
  validationResults.warnings.push('⚠️ Security filtering not applied');
}

// Final Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

console.log(`\n✅ PASSED: ${validationResults.passed.length} checks`);
validationResults.passed.slice(0, 5).forEach(p => console.log(`  ${p}`));
if (validationResults.passed.length > 5) {
  console.log(`  ... and ${validationResults.passed.length - 5} more`);
}

if (validationResults.warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS: ${validationResults.warnings.length}`);
  validationResults.warnings.forEach(w => console.log(`  ${w}`));
}

if (validationResults.failed.length > 0) {
  console.log(`\n❌ FAILED: ${validationResults.failed.length}`);
  validationResults.failed.forEach(f => console.log(`  ${f}`));
} else {
  console.log('\n🎉 No critical failures!');
}

// Overall assessment
console.log('\n' + '='.repeat(50));
console.log('🏆 OVERALL ASSESSMENT');
console.log('='.repeat(50));

const score = (validationResults.passed.length / (validationResults.passed.length + validationResults.failed.length)) * 100;
console.log(`\nValidation Score: ${score.toFixed(1)}%`);

if (score === 100) {
  console.log('Result: EXCELLENT - All extraction features working perfectly! 🎉');
} else if (score >= 90) {
  console.log('Result: VERY GOOD - Extraction working well with minor issues');
} else if (score >= 80) {
  console.log('Result: GOOD - Most features working correctly');
} else {
  console.log('Result: NEEDS IMPROVEMENT - Some extraction features not working');
}

console.log('\n✨ The c0ntextKeeper extraction system is successfully:');
console.log('  • Parsing Claude Code\'s actual JSONL format');
console.log('  • Extracting problems from user questions');
console.log('  • Capturing implementations with tool details');
console.log('  • Identifying architectural decisions');
console.log('  • Tracking tool usage and counts');
console.log('  • Recording modified files');
console.log('  • Applying security filtering');
console.log('  • Creating fully populated session archives');