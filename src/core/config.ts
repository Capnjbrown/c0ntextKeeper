/**
 * Configuration Management for c0ntextKeeper
 *
 * Manages hook settings and user preferences
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface HookSettings {
  enabled: boolean;
  matcher?: string;
  captureOn?: string[];
  minLength?: number;
  excludePatterns?: string[];
  captureErrors?: boolean;
}

export interface C0ntextKeeperConfig {
  hooks: {
    preCompact: HookSettings;
    userPromptSubmit: HookSettings;
    postToolUse: HookSettings;
    stop: HookSettings;
    sessionStart?: HookSettings;
    sessionEnd?: HookSettings;
  };
  storage: {
    basePath?: string;
    retentionDays?: number;
    maxSizeMB?: number;
    compressionEnabled?: boolean;
  };
  extraction: {
    relevanceThreshold?: number;
    maxContextItems?: number;
    enablePatternRecognition?: boolean;
    contentLimits?: {
      question?: number;
      solution?: number;
      implementation?: number;
      decision?: number;
    };
  };
  security: {
    filterSensitiveData?: boolean;
    customPatterns?: string[];
  };
}

const DEFAULT_CONFIG: C0ntextKeeperConfig = {
  hooks: {
    preCompact: {
      enabled: true,
      captureOn: ["manual", "auto"],
    },
    userPromptSubmit: {
      enabled: false,
      minLength: 10,
      excludePatterns: [],
    },
    postToolUse: {
      enabled: false,
      matcher: "Write|Edit|MultiEdit",
      captureErrors: true,
    },
    stop: {
      enabled: false,
      minLength: 50,
    },
  },
  storage: {
    retentionDays: 90,
    maxSizeMB: 100,
    compressionEnabled: false,
  },
  extraction: {
    relevanceThreshold: 0.5,
    maxContextItems: 50,
    enablePatternRecognition: true,
    contentLimits: {
      question: 2000,
      solution: 2000,
      implementation: 1000,
      decision: 500,
    },
  },
  security: {
    filterSensitiveData: true,
    customPatterns: [],
  },
};

export class ConfigManager {
  private configPath: string;
  private config: C0ntextKeeperConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), ".c0ntextkeeper", "config.json");
    this.config = this.loadConfig();
  }

  /**
   * Load configuration from disk or use defaults
   */
  private loadConfig(): C0ntextKeeperConfig {
    if (fs.existsSync(this.configPath)) {
      try {
        const content = fs.readFileSync(this.configPath, "utf-8");
        const userConfig = JSON.parse(content);
        // Merge with defaults to ensure all fields exist
        return this.mergeConfigs(DEFAULT_CONFIG, userConfig);
      } catch (error) {
        console.error("Error loading config, using defaults:", error);
        return DEFAULT_CONFIG;
      }
    }

    // Create default config file
    this.saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  /**
   * Save configuration to disk
   */
  private saveConfig(config: C0ntextKeeperConfig): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Deep merge two config objects
   */
  private mergeConfigs(
    defaults: C0ntextKeeperConfig,
    user: Partial<C0ntextKeeperConfig>,
  ): C0ntextKeeperConfig {
    const merged = JSON.parse(JSON.stringify(defaults));

    // Merge hooks
    if (user.hooks) {
      Object.keys(user.hooks).forEach((hook) => {
        if ((user.hooks as any)[hook]) {
          (merged.hooks as any)[hook] = {
            ...(merged.hooks as any)[hook],
            ...(user.hooks as any)[hook],
          };
        }
      });
    }

    // Merge other sections
    ["storage", "extraction", "security"].forEach((section) => {
      if ((user as any)[section]) {
        (merged as any)[section] = {
          ...(merged as any)[section],
          ...(user as any)[section],
        };
      }
    });

    return merged;
  }

  /**
   * Get the current configuration
   */
  getConfig(): C0ntextKeeperConfig {
    return this.config;
  }

  /**
   * Get settings for a specific hook
   */
  getHookSettings(hookName: string): HookSettings | undefined {
    const hookKey = this.normalizeHookName(hookName);
    return (this.config.hooks as any)[hookKey];
  }

  /**
   * Update hook settings
   */
  updateHookSettings(hookName: string, settings: Partial<HookSettings>): void {
    const hookKey = this.normalizeHookName(hookName);
    (this.config.hooks as any)[hookKey] = {
      ...(this.config.hooks as any)[hookKey],
      ...settings,
    };
    this.saveConfig(this.config);
  }

  /**
   * Check if a hook is enabled
   */
  isHookEnabled(hookName: string): boolean {
    const settings = this.getHookSettings(hookName);
    return settings?.enabled || false;
  }

  /**
   * Enable or disable a hook
   */
  setHookEnabled(hookName: string, enabled: boolean): void {
    this.updateHookSettings(hookName, { enabled });
  }

  /**
   * Get storage settings
   */
  getStorageSettings() {
    return this.config.storage;
  }

  /**
   * Update storage settings
   */
  updateStorageSettings(settings: Partial<typeof this.config.storage>): void {
    this.config.storage = {
      ...this.config.storage,
      ...settings,
    };
    this.saveConfig(this.config);
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = DEFAULT_CONFIG;
    this.saveConfig(this.config);
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Normalize hook names to camelCase
   */
  private normalizeHookName(name: string): string {
    const mapping: { [key: string]: string } = {
      PreCompact: "preCompact",
      precompact: "preCompact",
      UserPromptSubmit: "userPromptSubmit",
      userprompt: "userPromptSubmit",
      PostToolUse: "postToolUse",
      posttool: "postToolUse",
      Stop: "stop",
      stop: "stop",
      SessionStart: "sessionStart",
      SessionEnd: "sessionEnd",
    };

    return mapping[name] || name;
  }
}

// Export singleton instance
export const configManager = new ConfigManager();
