#!/usr/bin/env node

/**
 * PreCompact Hook Handler
 * Captures context before Claude Code compaction
 * 
 * Security: This hook validates all inputs and uses absolute paths
 * to prevent path traversal attacks.
 */

import { HookInput, HookOutput } from '../core/types.js';
import { ContextArchiver } from '../core/archiver.js';
import { Logger } from '../utils/logger.js';
import * as path from 'path';
import * as fs from 'fs';

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

    // Validate hook event (handle both 'PreCompact' and 'preCompact' for compatibility)
    if (hookData.hook_event_name !== 'PreCompact' && hookData.hook_event_name !== 'preCompact') {
      const output: HookOutput = {
        status: 'skipped',
        message: `Skipped: Not a PreCompact event (got ${hookData.hook_event_name})`
      };
      console.log(JSON.stringify(output));
      return;
    }

    // Log trigger type (manual vs auto)
    const trigger = hookData.trigger || 'unknown';
    logger.info(`Compaction trigger: ${trigger}`);
    
    // Log custom instructions if present (manual compaction)
    if (hookData.custom_instructions) {
      logger.info(`Custom instructions: ${hookData.custom_instructions}`);
    }

    // Check for transcript path
    if (!hookData.transcript_path) {
      const output: HookOutput = {
        status: 'error',
        message: 'No transcript path provided in hook data'
      };
      console.log(JSON.stringify(output));
      // Exit with code 2 to block compaction
      process.exit(2);
    }

    // Validate transcript path (security check)
    const transcriptPath = path.resolve(hookData.transcript_path);
    if (!fs.existsSync(transcriptPath)) {
      const output: HookOutput = {
        status: 'error',
        message: `Transcript file not found: ${transcriptPath}`
      };
      console.log(JSON.stringify(output));
      process.exit(2);
    }

    logger.info(`Processing transcript: ${transcriptPath}`);
    logger.info(`Session ID: ${hookData.session_id || 'unknown'}`);

    // Archive the context
    const archiver = new ContextArchiver();
    const result = await archiver.archiveFromTranscript(transcriptPath);
    
    // Store trigger type in metadata
    if (result.success && result.archivePath) {
      try {
        const archiveData = JSON.parse(fs.readFileSync(result.archivePath, 'utf-8'));
        archiveData.metadata = archiveData.metadata || {};
        archiveData.metadata.trigger = trigger;
        archiveData.metadata.sessionId = hookData.session_id;
        if (hookData.custom_instructions) {
          archiveData.metadata.customInstructions = hookData.custom_instructions;
        }
        fs.writeFileSync(result.archivePath, JSON.stringify(archiveData, null, 2));
      } catch (metaError) {
        logger.warn('Could not update archive metadata:', metaError);
      }
    }

    if (result.success) {
      logger.info(`Context archived successfully to: ${result.archivePath}`);
      
      const output: HookOutput = {
        status: 'success',
        message: `✓ Context preserved (${trigger}): ${result.stats?.problems || 0} problems, ${result.stats?.implementations || 0} implementations, ${result.stats?.decisions || 0} decisions`,
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
    // Exit with non-blocking error code
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