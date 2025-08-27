#!/usr/bin/env node

/**
 * PreCompact Hook Handler
 * Captures context before Claude Code compaction
 */

import { HookInput, HookOutput } from '../core/types.js';
import { ContextArchiver } from '../core/archiver.js';
import { Logger } from '../utils/logger.js';

/**
 * Main hook handler
 */
async function handlePreCompact(): Promise<void> {
  const logger = new Logger('PreCompactHook');
  
  try {
    // Parse hook input from stdin
    const input = await readStdin();
    const hookData = JSON.parse(input) as HookInput;

    logger.info(`Received hook event: ${hookData.hook_event_name}`);

    // Validate hook event
    if (hookData.hook_event_name !== 'PreCompact') {
      const output: HookOutput = {
        status: 'skipped',
        message: `Skipped: Not a PreCompact event (got ${hookData.hook_event_name})`
      };
      console.log(JSON.stringify(output));
      return;
    }

    // Check for transcript path
    if (!hookData.transcript_path) {
      const output: HookOutput = {
        status: 'error',
        message: 'No transcript path provided in hook data'
      };
      console.log(JSON.stringify(output));
      return;
    }

    logger.info(`Processing transcript: ${hookData.transcript_path}`);

    // Archive the context
    const archiver = new ContextArchiver();
    const result = await archiver.archiveFromTranscript(hookData.transcript_path);

    if (result.success) {
      logger.info(`Context archived successfully to: ${result.archivePath}`);
      
      const output: HookOutput = {
        status: 'success',
        message: `✓ Context preserved: ${result.stats?.problems || 0} problems, ${result.stats?.implementations || 0} implementations, ${result.stats?.decisions || 0} decisions`,
        archiveLocation: result.archivePath,
        stats: result.stats
      };
      
      console.log(JSON.stringify(output));
    } else {
      logger.error(`Failed to archive context: ${result.error}`);
      
      const output: HookOutput = {
        status: 'error',
        message: `Failed to archive context: ${result.error}`
      };
      
      console.log(JSON.stringify(output));
    }
  } catch (error) {
    logger.error('Hook handler error:', error);
    
    const output: HookOutput = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    console.log(JSON.stringify(output));
    process.exit(1);
  }
}

/**
 * Read input from stdin
 */
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
  });
}

// Execute if run directly
if (require.main === module) {
  handlePreCompact().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { handlePreCompact };