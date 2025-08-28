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
      // Use the new install-hook.js script instead of setup-hooks.js
      const installScript = path.join(__dirname, '..', 'scripts', 'install-hook.js');
      if (!require('fs').existsSync(installScript)) {
        // Fall back to old script if new one doesn't exist
        const setupScript = path.join(__dirname, '..', 'scripts', 'setup-hooks.js');
        execSync(`node ${setupScript}`, { stdio: 'inherit' });
      } else {
        execSync(`node ${installScript}`, { stdio: 'inherit' });
      }
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

// Hooks command group
const hooks = program
  .command('hooks')
  .description('Manage Claude Code hooks');

// List hooks
hooks
  .command('list')
  .description('List all available hooks and their status')
  .action(async () => {
    try {
      const HooksManager = (await import('./cli/hooks-manager.js')).HooksManager;
      const manager = new HooksManager();
      await manager.listHooks();
    } catch (error) {
      logger.error('List hooks error:', error);
      process.exit(1);
    }
  });

// Enable hook
hooks
  .command('enable <hook>')
  .description('Enable a specific hook')
  .action(async (hookName: string) => {
    try {
      const HooksManager = (await import('./cli/hooks-manager.js')).HooksManager;
      const manager = new HooksManager();
      await manager.enableHook(hookName);
    } catch (error) {
      logger.error('Enable hook error:', error);
      process.exit(1);
    }
  });

// Disable hook
hooks
  .command('disable <hook>')
  .description('Disable a specific hook')
  .action(async (hookName: string) => {
    try {
      const HooksManager = (await import('./cli/hooks-manager.js')).HooksManager;
      const manager = new HooksManager();
      await manager.disableHook(hookName);
    } catch (error) {
      logger.error('Disable hook error:', error);
      process.exit(1);
    }
  });

// Configure hook
hooks
  .command('config <hook>')
  .description('Configure a hook')
  .option('-m, --matcher <pattern>', 'Set matcher pattern')
  .action(async (hookName: string, options: any) => {
    try {
      const HooksManager = (await import('./cli/hooks-manager.js')).HooksManager;
      const manager = new HooksManager();
      await manager.configureHook(hookName, options.matcher);
    } catch (error) {
      logger.error('Configure hook error:', error);
      process.exit(1);
    }
  });

// Test hook
hooks
  .command('test <hook>')
  .description('Test a specific hook')
  .action(async (hookName: string) => {
    try {
      const HooksManager = (await import('./cli/hooks-manager.js')).HooksManager;
      const manager = new HooksManager();
      await manager.testHook(hookName);
    } catch (error) {
      logger.error('Test hook error:', error);
      process.exit(1);
    }
  });

// Hook stats
hooks
  .command('stats')
  .description('Show hook statistics')
  .action(async () => {
    try {
      const HooksManager = (await import('./cli/hooks-manager.js')).HooksManager;
      const manager = new HooksManager();
      await manager.showStats();
    } catch (error) {
      logger.error('Hook stats error:', error);
      process.exit(1);
    }
  });

// Status command - Show automation status
program
  .command('status')
  .description('Show c0ntextKeeper automation status')
  .action(async () => {
    try {
      console.log('\n🤖 c0ntextKeeper Automation Status\n');
      console.log('═'.repeat(60));
      
      // Check PreCompact hook
      const fs = require('fs');
      const os = require('os');
      const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      
      console.log('📌 PreCompact Hook (Primary):');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const hasHook = settings.hooks?.PreCompact;
        if (hasHook) {
          console.log('  ✅ ENABLED - Fully Automatic!');
          console.log('  🔄 Triggers on:');
          console.log('     • Manual /compact command');
          console.log('     • Automatic compaction by Claude Code');
          console.log('  📦 Archives saved to: ~/.c0ntextkeeper/archive/');
        } else {
          console.log('  ❌ Not enabled - run "c0ntextkeeper setup"');
        }
      }
      
      console.log('\n🎯 How It Works:');
      console.log('  1. Claude Code monitors context size automatically');
      console.log('  2. When context gets large, it auto-compacts');
      console.log('  3. PreCompact hook fires automatically');
      console.log('  4. c0ntextKeeper archives everything');
      console.log('  5. You never lose context!');
      
      console.log('\n📊 Additional Hooks (Optional):');
      const hooks = ['UserPromptSubmit', 'PostToolUse', 'Stop'];
      for (const hook of hooks) {
        const settings = fs.existsSync(settingsPath) ? 
          JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) : {};
        const enabled = settings.hooks?.[hook];
        const status = enabled ? '✅ Enabled' : '⭕ Disabled';
        console.log(`  ${status} ${hook}`);
      }
      
      console.log('\n💡 Tips:');
      console.log('  • PreCompact works automatically - no action needed!');
      console.log('  • Enable other hooks for more granular capture');
      console.log('  • Use "c0ntextkeeper hooks list" to manage hooks');
      
      console.log('\n═'.repeat(60));
      
    } catch (error) {
      logger.error('Status error:', error);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate c0ntextKeeper installation and hook configuration')
  .action(async () => {
    try {
      console.log('🔍 Validating c0ntextKeeper installation...\n');
      const fs = require('fs');
      const os = require('os');
      let valid = true;
      
      // Check hook configuration in settings.json
      const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        const hasHook = settings.hooks?.PreCompact?.some((config: any) => 
          config.hooks?.some((h: any) => h.command?.includes('c0ntextkeeper') || h.command?.includes('precompact'))
        );
        if (hasHook) {
          console.log('✅ Hook configured in settings.json');
        } else {
          console.log('❌ Hook not found in settings.json');
          valid = false;
        }
      } else {
        console.log('⚠️  Settings.json not found');
        valid = false;
      }
      
      // Check hook script exists
      const hookScript = path.join(__dirname, 'hooks', 'precompact.js');
      if (fs.existsSync(hookScript)) {
        console.log('✅ Hook script exists');
      } else {
        console.log('❌ Hook script not found (run "npm run build")');
        valid = false;
      }
      
      // Check archive directory
      const archiveDir = path.join(os.homedir(), '.c0ntextkeeper', 'archive');
      if (fs.existsSync(archiveDir)) {
        console.log('✅ Archive directory exists');
        
        // Count archived sessions
        const storage = new FileStore();
        const stats = await storage.getStats();
        if (stats.totalSessions > 0) {
          console.log(`✅ Found ${stats.totalSessions} archived sessions`);
        }
      } else {
        console.log('⚠️  Archive directory will be created on first use');
      }
      
      // Test archiver functionality
      const archiver = new ContextArchiver();
      const archiverValid = await archiver.validate();
      if (archiverValid) {
        console.log('✅ Archiver functionality validated');
      } else {
        console.log('❌ Archiver validation failed');
        valid = false;
      }
      
      if (valid) {
        console.log('\n✅ Installation valid! c0ntextKeeper is ready to use.');
        console.log('\nNext steps:');
        console.log('1. Open any project in Claude Code');
        console.log('2. Run /compact to trigger context preservation');
        console.log('3. Check archives at: ~/.c0ntextkeeper/archive/');
      } else {
        console.log('\n❌ Installation incomplete. Run "c0ntextkeeper setup" to fix.');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Validation error:', error);
      process.exit(1);
    }
  });

// Test-hook command
program
  .command('test-hook')
  .description('Test the PreCompact hook with sample data')
  .action(async () => {
    try {
      console.log('🧪 Testing PreCompact hook...');
      const testScript = path.join(__dirname, '..', 'scripts', 'test-hook.js');
      if (require('fs').existsSync(testScript)) {
        execSync(`node ${testScript}`, { stdio: 'inherit' });
      } else {
        console.error('Test script not found. Please ensure the project is properly installed.');
        process.exit(1);
      }
    } catch (error) {
      logger.error('Test failed:', error);
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