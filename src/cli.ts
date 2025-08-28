#!/usr/bin/env node

/**
 * c0ntextKeeper CLI
 * Command-line interface for managing context preservation
 */

import { Command } from 'commander';
import { ContextArchiver } from './core/archiver.js';
import { ContextRetriever } from './core/retriever.js';
import { PatternAnalyzer } from './core/patterns.js';
import { FileStore } from './storage/file-store.js';
import { Logger } from './utils/logger.js';
import { execSync } from 'child_process';
import path from 'path';

const logger = new Logger('CLI', undefined, false);
const program = new Command();

program
  .name('c0ntextkeeper')
  .description('Intelligent context preservation for Claude Code')
  .version('0.1.0');

// Setup command
program
  .command('setup')
  .description('Configure c0ntextKeeper hooks for Claude Code')
  .action(async () => {
    try {
      const setupScript = path.join(__dirname, '..', 'scripts', 'setup-hooks.js');
      execSync(`node ${setupScript}`, { stdio: 'inherit' });
    } catch (error) {
      logger.error('Setup failed:', error);
      process.exit(1);
    }
  });

// Archive command
program
  .command('archive <transcript>')
  .description('Manually archive a transcript file')
  .action(async (transcriptPath: string) => {
    try {
      logger.info(`Archiving transcript: ${transcriptPath}`);
      
      const archiver = new ContextArchiver();
      const result = await archiver.archiveFromTranscript(transcriptPath);
      
      if (result.success) {
        console.log('✅ Context archived successfully!');
        console.log(`📁 Location: ${result.archivePath}`);
        console.log('\n📊 Statistics:');
        console.log(`  Problems: ${result.stats?.problems || 0}`);
        console.log(`  Implementations: ${result.stats?.implementations || 0}`);
        console.log(`  Decisions: ${result.stats?.decisions || 0}`);
        console.log(`  Patterns: ${result.stats?.patterns || 0}`);
        console.log(`  Relevance: ${((result.stats?.relevanceScore || 0) * 100).toFixed(0)}%`);
      } else {
        console.error('❌ Archive failed:', result.error);
        process.exit(1);
      }
    } catch (error) {
      logger.error('Archive error:', error);
      process.exit(1);
    }
  });

// Search command
program
  .command('search <query>')
  .description('Search archived contexts')
  .option('-l, --limit <number>', 'Maximum results', '10')
  .option('-p, --project <path>', 'Filter by project path')
  .action(async (query: string, options: any) => {
    try {
      const retriever = new ContextRetriever();
      const results = await retriever.searchArchive({
        query,
        limit: parseInt(options.limit),
        projectPath: options.project
      });

      if (results.length === 0) {
        console.log('No results found.');
        return;
      }

      console.log(`Found ${results.length} results:\n`);
      
      results.forEach((result, index) => {
        console.log(`Result ${index + 1}:`);
        console.log(`  Session: ${result.context.sessionId}`);
        console.log(`  Project: ${result.context.projectPath}`);
        console.log(`  Date: ${result.context.timestamp}`);
        console.log(`  Relevance: ${(result.relevance * 100).toFixed(0)}%`);
        
        if (result.matches.length > 0) {
          console.log('  Matches:');
          result.matches.slice(0, 3).forEach(match => {
            console.log(`    - ${match.field}: ${match.snippet}`);
          });
        }
        console.log();
      });
    } catch (error) {
      logger.error('Search error:', error);
      process.exit(1);
    }
  });

// Patterns command
program
  .command('patterns')
  .description('Analyze recurring patterns')
  .option('-t, --type <type>', 'Pattern type (code/command/architecture/all)', 'all')
  .option('-m, --min <number>', 'Minimum frequency', '2')
  .action(async (options: any) => {
    try {
      const analyzer = new PatternAnalyzer();
      const patterns = await analyzer.getPatterns({
        type: options.type,
        minFrequency: parseInt(options.min)
      });

      if (patterns.length === 0) {
        console.log('No patterns found.');
        return;
      }

      console.log(`Found ${patterns.length} patterns:\n`);
      
      patterns.forEach((pattern, index) => {
        console.log(`Pattern ${index + 1}: ${pattern.type}`);
        console.log(`  Frequency: ${pattern.frequency}`);
        console.log(`  Value: ${pattern.value}`);
        console.log(`  First seen: ${pattern.firstSeen}`);
        console.log(`  Last seen: ${pattern.lastSeen}`);
        console.log();
      });
    } catch (error) {
      logger.error('Pattern analysis error:', error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show storage statistics')
  .action(async () => {
    try {
      const storage = new FileStore();
      const stats = await storage.getStats();

      console.log('📊 c0ntextKeeper Statistics\n');
      console.log(`Total Projects: ${stats.totalProjects}`);
      console.log(`Total Sessions: ${stats.totalSessions}`);
      console.log(`Storage Size: ${stats.totalSize} MB`);
      
      if (stats.oldestSession) {
        console.log(`Oldest Session: ${stats.oldestSession}`);
      }
      if (stats.newestSession) {
        console.log(`Newest Session: ${stats.newestSession}`);
      }
    } catch (error) {
      logger.error('Stats error:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate that archival is working')
  .action(async () => {
    try {
      const archiver = new ContextArchiver();
      const valid = await archiver.validate();

      if (valid) {
        console.log('✅ Validation successful! c0ntextKeeper is working correctly.');
      } else {
        console.log('❌ Validation failed. Check logs for details.');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Validation error:', error);
      process.exit(1);
    }
  });

// Server command (for testing)
program
  .command('server')
  .description('Start the MCP server (usually started by Claude Code)')
  .action(async () => {
    try {
      console.log('Starting c0ntextKeeper MCP server...');
      const serverPath = path.join(__dirname, 'server', 'index.js');
      await import(serverPath);
    } catch (error) {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}