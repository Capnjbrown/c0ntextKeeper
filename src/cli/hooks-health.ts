#!/usr/bin/env node
/**
 * Hook Health Check Command for c0ntextKeeper
 * 
 * Checks the health and status of all hooks
 * Helps diagnose issues with hook execution
 */

import * as fs from "fs";
import * as path from "path";
import * as chalk from "chalk";
import { getStoragePath } from "../utils/path-resolver";

interface HookHealthStatus {
  name: string;
  enabled: boolean;
  lastExecuted?: string;
  lastDataCaptured?: string;
  dataCount: number;
  issues: string[];
  suggestions: string[];
}

export class HooksHealthChecker {
  private projectPath: string;
  private storagePath: string;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || process.cwd();
    this.storagePath = getStoragePath({
      projectPath: this.projectPath,
      createIfMissing: false,
    });
  }

  /**
   * Check health of all hooks
   */
  async checkHealth(): Promise<void> {
    console.log(chalk.bold("\n🏥 c0ntextKeeper Hook Health Check\n"));
    console.log(chalk.gray("─".repeat(60)));

    const hooks = [
      { name: "PreCompact", dataDir: "sessions" },
      { name: "UserPromptSubmit", dataDir: "prompts" },
      { name: "PostToolUse", dataDir: "patterns" },
      { name: "Stop", dataDir: "knowledge" },
    ];

    const healthStatuses: HookHealthStatus[] = [];

    for (const hook of hooks) {
      const status = await this.checkHookHealth(hook.name, hook.dataDir);
      healthStatuses.push(status);
      this.displayHookHealth(status);
    }

    // Overall health summary
    this.displayOverallHealth(healthStatuses);

    // Check for debug mode
    if (process.env.C0NTEXTKEEPER_DEBUG === 'true') {
      console.log(chalk.yellow("\n⚠️  Debug mode is enabled"));
      console.log(chalk.gray("   Debug logs are being written to ~/.c0ntextkeeper/debug/"));
    }
  }

  /**
   * Check health of a specific hook
   */
  private async checkHookHealth(
    hookName: string,
    dataDir: string
  ): Promise<HookHealthStatus> {
    const status: HookHealthStatus = {
      name: hookName,
      enabled: await this.isHookEnabled(hookName),
      dataCount: 0,
      issues: [],
      suggestions: [],
    };

    // Check if hook is enabled
    if (!status.enabled) {
      status.issues.push("Hook is not enabled");
      status.suggestions.push(`Enable with: c0ntextkeeper hooks enable ${hookName.toLowerCase()}`);
      return status;
    }

    // Check data directory
    const dataPath = path.join(this.storagePath, dataDir);
    if (!fs.existsSync(dataPath)) {
      status.issues.push("Data directory does not exist");
      status.suggestions.push("Hook may never have captured data");
      return status;
    }

    // Get latest data file
    const files = fs.readdirSync(dataPath)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => b.localeCompare(a)); // Sort by date (newest first)

    if (files.length === 0) {
      status.issues.push("No data files found");
      status.suggestions.push("Hook is not capturing data");
      
      // Specific suggestions per hook
      if (hookName === "PostToolUse") {
        status.suggestions.push("Ensure Claude Code is sending PostToolUse events");
        status.suggestions.push("Try using tools like Edit, Write, or Bash");
      } else if (hookName === "Stop") {
        status.suggestions.push("Ensure Claude Code is sending Stop events");
        status.suggestions.push("Try ending a conversation to trigger the hook");
      }
      
      return status;
    }

    // Check latest file
    const latestFile = files[0];
    const latestFilePath = path.join(dataPath, latestFile);
    const stats = fs.statSync(latestFilePath);
    status.lastDataCaptured = stats.mtime.toISOString();

    // Read and analyze latest data
    try {
      const data = JSON.parse(fs.readFileSync(latestFilePath, 'utf-8'));
      
      if (Array.isArray(data)) {
        status.dataCount = data.length;
        
        // Check if data is test data
        const hasTestData = data.some((item: any) => 
          item.sessionId?.includes('test') || 
          item.session_id?.includes('test') ||
          item.isTest === true
        );
        
        if (hasTestData && data.length === 1) {
          status.issues.push("Only test data found");
          status.suggestions.push("Hook is not capturing real session data");
        }
        
        // Check data recency
        const lastEntry = data[data.length - 1];
        const lastTimestamp = lastEntry?.timestamp;
        if (lastTimestamp) {
          const hoursSinceCapture = (Date.now() - new Date(lastTimestamp).getTime()) / (1000 * 60 * 60);
          if (hoursSinceCapture > 24) {
            status.issues.push(`No data captured in ${Math.floor(hoursSinceCapture / 24)} days`);
            status.suggestions.push("Check if hook is receiving events");
          }
        }
      }
    } catch (error) {
      status.issues.push("Failed to parse data file");
      status.suggestions.push("Data file may be corrupted");
    }

    // Check for debug logs if issues exist
    if (status.issues.length > 0 && process.env.C0NTEXTKEEPER_DEBUG !== 'true') {
      status.suggestions.push("Enable debug mode: export C0NTEXTKEEPER_DEBUG=true");
      status.suggestions.push("Then restart Claude Code to see detailed logs");
    }

    return status;
  }

  /**
   * Check if a hook is enabled
   */
  private async isHookEnabled(hookName: string): Promise<boolean> {
    const hooksConfigPath = path.join(
      process.env.HOME || '',
      '.claude',
      'hooks.json'
    );

    if (!fs.existsSync(hooksConfigPath)) {
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(hooksConfigPath, 'utf-8'));
      const hooks = config.hooks || [];
      
      return hooks.some((hook: any) => 
        hook.name === hookName && hook.enabled !== false
      );
    } catch {
      return false;
    }
  }

  /**
   * Display health status for a single hook
   */
  private displayHookHealth(status: HookHealthStatus): void {
    const icon = status.issues.length === 0 ? '✅' : '❌';
    const color = status.issues.length === 0 ? chalk.green : chalk.red;
    
    console.log(`\n${icon} ${chalk.bold(status.name)}`);
    
    if (status.enabled) {
      console.log(chalk.gray(`   Status: ${chalk.green('Enabled')}`));
    } else {
      console.log(chalk.gray(`   Status: ${chalk.red('Disabled')}`));
    }
    
    if (status.lastDataCaptured) {
      const date = new Date(status.lastDataCaptured);
      console.log(chalk.gray(`   Last Data: ${date.toLocaleString()}`));
      console.log(chalk.gray(`   Data Count: ${status.dataCount} entries`));
    }
    
    if (status.issues.length > 0) {
      console.log(color(`   Issues:`));
      status.issues.forEach(issue => {
        console.log(color(`     • ${issue}`));
      });
    }
    
    if (status.suggestions.length > 0) {
      console.log(chalk.yellow(`   Suggestions:`));
      status.suggestions.forEach(suggestion => {
        console.log(chalk.yellow(`     → ${suggestion}`));
      });
    }
  }

  /**
   * Display overall health summary
   */
  private displayOverallHealth(statuses: HookHealthStatus[]): void {
    console.log(chalk.gray("\n" + "─".repeat(60)));
    
    const healthyCount = statuses.filter(s => s.issues.length === 0).length;
    const totalCount = statuses.length;
    const healthPercentage = (healthyCount / totalCount) * 100;
    
    console.log(chalk.bold("\n📊 Overall Health Summary"));
    
    if (healthPercentage === 100) {
      console.log(chalk.green(`   ✅ All ${totalCount} hooks are healthy!`));
    } else if (healthPercentage >= 50) {
      console.log(chalk.yellow(`   ⚠️  ${healthyCount}/${totalCount} hooks are healthy (${healthPercentage.toFixed(0)}%)`));
    } else {
      console.log(chalk.red(`   ❌ Only ${healthyCount}/${totalCount} hooks are healthy (${healthPercentage.toFixed(0)}%)`));
    }
    
    // Common issues and solutions
    const hasDisabledHooks = statuses.some(s => !s.enabled);
    const hasNoData = statuses.some(s => s.dataCount === 0 && s.enabled);
    
    if (hasDisabledHooks || hasNoData) {
      console.log(chalk.bold("\n🔧 Quick Fixes:"));
      
      if (hasDisabledHooks) {
        console.log(chalk.cyan("   1. Enable all hooks:"));
        console.log(chalk.gray("      c0ntextkeeper hooks enable all"));
      }
      
      if (hasNoData) {
        console.log(chalk.cyan("   2. Restart Claude Code after enabling hooks"));
        console.log(chalk.cyan("   3. Enable debug mode for troubleshooting:"));
        console.log(chalk.gray("      export C0NTEXTKEEPER_DEBUG=true"));
        console.log(chalk.cyan("   4. Check debug logs:"));
        console.log(chalk.gray("      ls ~/.c0ntextkeeper/debug/"));
      }
    }
  }
}

// Export for CLI usage
export async function runHealthCheck(projectPath?: string): Promise<void> {
  const checker = new HooksHealthChecker(projectPath);
  await checker.checkHealth();
}

// Run if executed directly
if (require.main === module) {
  runHealthCheck().catch(error => {
    console.error(chalk.red("Health check failed:"), error);
    process.exit(1);
  });
}