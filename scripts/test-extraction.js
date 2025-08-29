#!/usr/bin/env node

const { ContextArchiver } = require('../dist/core/archiver.js');
const fs = require('fs');
const path = require('path');

// Create a test transcript with various content types
const testTranscript = [
  {
    type: 'user',
    timestamp: new Date().toISOString(),
    cwd: '/Users/jasonbrown/Projects/c0ntextKeeper',
    message: {
      role: 'user',
      // Test non-string content (array)
      content: ['Can you help me fix the extraction?', 'It returns 0 items.']
    }
  },
  {
    type: 'assistant',
    timestamp: new Date().toISOString(),
    message: {
      role: 'assistant',
      content: "I'll help you fix the extraction issue. Let me analyze the problem."
    }
  },
  {
    type: 'tool_use',
    timestamp: new Date().toISOString(),
    toolUse: {
      name: 'Read',
      input: { file_path: 'src/core/extractor.ts' }
    },
    cwd: '/Users/jasonbrown/Projects/c0ntextKeeper'
  },
  {
    type: 'tool_result',
    timestamp: new Date().toISOString(),
    toolResult: {
      output: 'File contents here...'
    }
  },
  {
    type: 'assistant',
    timestamp: new Date().toISOString(),
    message: {
      role: 'assistant',
      // Test object content
      content: { text: 'The issue is with type checking. Let me fix it.' }
    }
  },
  {
    type: 'tool_use',
    timestamp: new Date().toISOString(),
    toolUse: {
      name: 'Edit',
      input: {
        file_path: 'src/core/scorer.ts',
        old_string: 'content.toLowerCase()',
        new_string: 'typeof content === "string" ? content.toLowerCase() : ""'
      }
    }
  },
  {
    type: 'user',
    timestamp: new Date().toISOString(),
    message: {
      role: 'user',
      content: 'Great! Does this handle all edge cases?'
    }
  },
  {
    type: 'assistant',
    timestamp: new Date().toISOString(),
    message: {
      role: 'assistant',
      content: 'Yes, this handles all edge cases including arrays and objects. The solution is complete.'
    }
  }
];

async function testExtraction() {
  console.log('Testing c0ntextKeeper extraction with various content types...\n');
  
  // Write test transcript
  const testFile = '/tmp/test-extraction-transcript.jsonl';
  const stream = fs.createWriteStream(testFile);
  
  for (const entry of testTranscript) {
    stream.write(JSON.stringify(entry) + '\n');
  }
  stream.end();
  
  // Wait for file to be written
  await new Promise(resolve => stream.on('finish', resolve));
  
  console.log(`Created test transcript: ${testFile}`);
  console.log(`Entries: ${testTranscript.length}`);
  console.log('Content types tested: string, array, object\n');
  
  // Test extraction
  const archiver = new ContextArchiver();
  console.log('Running extraction...\n');
  
  try {
    const result = await archiver.archiveFromTranscript(testFile);
    
    if (result.success) {
      console.log('✅ Extraction successful!');
      console.log(`Archive created: ${result.archivePath}`);
      console.log('\nExtraction statistics:');
      console.log(`- Problems: ${result.stats.problems}`);
      console.log(`- Implementations: ${result.stats.implementations}`);
      console.log(`- Decisions: ${result.stats.decisions}`);
      console.log(`- Patterns: ${result.stats.patterns}`);
      console.log(`- Relevance Score: ${result.stats.relevanceScore}`);
      
      // Read and display archive content
      if (result.archivePath && fs.existsSync(result.archivePath)) {
        const archive = JSON.parse(fs.readFileSync(result.archivePath, 'utf-8'));
        
        console.log('\n📋 Archive Details:');
        if (archive.problems.length > 0) {
          console.log('\nProblems found:');
          archive.problems.forEach(p => {
            console.log(`  - ${p.question.slice(0, 80)}...`);
          });
        }
        
        if (archive.implementations.length > 0) {
          console.log('\nImplementations found:');
          archive.implementations.forEach(i => {
            console.log(`  - ${i.tool} on ${i.file}`);
          });
        }
        
        if (archive.decisions.length > 0) {
          console.log('\nDecisions found:');
          archive.decisions.forEach(d => {
            console.log(`  - ${d.decision.slice(0, 80)}...`);
          });
        }
      }
    } else {
      console.log('❌ Extraction failed:', result.error);
    }
  } catch (error) {
    console.error('Error during extraction:', error);
  }
  
  // Clean up
  fs.unlinkSync(testFile);
  console.log('\n✨ Test complete!');
}

// Run the test
testExtraction().catch(console.error);