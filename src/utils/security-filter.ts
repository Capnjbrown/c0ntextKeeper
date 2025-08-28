/**
 * Security Filter
 * Detects and redacts sensitive information from context
 */

export class SecurityFilter {
  private patterns: Map<string, RegExp>;
  private redactedCount: number = 0;

  constructor() {
    this.patterns = new Map([
      // API Keys and Tokens
      ['api_key', /\b(api[_-]?key|apikey|api_secret)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi],
      ['bearer_token', /\b(bearer|authorization)\s*[:=]\s*['"]?(Bearer\s+)?([a-zA-Z0-9_\-\.]{20,})['"]?/gi],
      ['aws_key', /\b(aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?([A-Z0-9]{16,})['"]?/gi],
      ['github_token', /\b(github[_-]?token|gh[_-]?token|GITHUB_TOKEN)\s*[:=]\s*['"]?(ghp_[a-zA-Z0-9]{36,}|gho_[a-zA-Z0-9]{36,})['"]?/gi],
      ['openai_key', /\b(openai[_-]?api[_-]?key|OPENAI_API_KEY)\s*[:=]\s*['"]?(sk-[a-zA-Z0-9]{48,})['"]?/gi],
      ['anthropic_key', /\b(anthropic[_-]?api[_-]?key|ANTHROPIC_API_KEY)\s*[:=]\s*['"]?(sk-ant-[a-zA-Z0-9]{50,})['"]?/gi],
      
      // Database Credentials
      ['db_connection', /\b(mongodb|postgresql|postgres|mysql|redis):\/\/[^:]+:[^@]+@[^\s]+/gi],
      ['connection_string', /\b(Server|Data Source|User ID|Password|Initial Catalog)=[^;]+;/gi],
      
      // Private Keys
      ['private_key', /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----[\s\S]+?-----END\s+(RSA\s+)?PRIVATE KEY-----/gi],
      ['ssh_key', /ssh-(rsa|ed25519|ecdsa)\s+[A-Za-z0-9+/]+=*/gi],
      
      // Passwords
      ['password', /\b(password|passwd|pwd)\s*[:=]\s*['"]?([^\s'"]{4,})['"]?/gi],
      ['secret', /\b(secret|client_secret)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{16,})['"]?/gi],
      
      // Personal Information (PII)
      ['email', /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g],
      ['phone', /\b(\+?1?\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g],
      ['ssn', /\b\d{3}-\d{2}-\d{4}\b/g],
      ['credit_card', /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g],
      ['ip_address', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
      
      // JWT Tokens
      ['jwt', /\beyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g],
      
      // Environment Variables with Secrets
      ['env_secret', /\b(export\s+)?[A-Z_]{2,}_KEY\s*=\s*['"]?[^\s'"]+['"]?/gi],
    ]);
  }

  /**
   * Filter sensitive information from text
   */
  filterText(text: string): string {
    let filtered = text;
    
    for (const [name, pattern] of this.patterns) {
      const matches = filtered.match(pattern);
      if (matches) {
        this.redactedCount += matches.length;
        
        // Special handling for different types
        if (name === 'email') {
          // Keep domain for debugging but redact local part
          filtered = filtered.replace(pattern, (match) => {
            const [, domain] = match.split('@');
            return `***@${domain}`;
          });
        } else if (name === 'ip_address') {
          // Keep first two octets for debugging
          filtered = filtered.replace(pattern, (match) => {
            const parts = match.split('.');
            return `${parts[0]}.${parts[1]}.***.***`;
          });
        } else {
          // Generic redaction
          filtered = filtered.replace(pattern, (match) => {
            // Preserve the key/label part but redact the value
            const separatorMatch = match.match(/[:=]/);
            if (separatorMatch) {
              const [before] = match.split(separatorMatch[0]);
              return `${before}${separatorMatch[0]}[REDACTED]`;
            }
            return '[REDACTED]';
          });
        }
      }
    }
    
    return filtered;
  }

  /**
   * Filter sensitive information from an object
   */
  filterObject<T extends Record<string, any>>(obj: T): T {
    const filtered = { ...obj };
    
    for (const key in filtered) {
      if (typeof filtered[key] === 'string') {
        filtered[key] = this.filterText(filtered[key]) as any;
      } else if (typeof filtered[key] === 'object' && filtered[key] !== null) {
        if (Array.isArray(filtered[key])) {
          filtered[key] = filtered[key].map((item: any) => 
            typeof item === 'string' ? this.filterText(item) : 
            typeof item === 'object' ? this.filterObject(item) : item
          ) as any;
        } else {
          filtered[key] = this.filterObject(filtered[key]) as any;
        }
      }
    }
    
    return filtered;
  }

  /**
   * Check if text contains sensitive information
   */
  containsSensitiveData(text: string): boolean {
    for (const [, pattern] of this.patterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get statistics about filtered content
   */
  getStats() {
    return {
      patternsCount: this.patterns.size,
      redactedCount: this.redactedCount,
      patterns: Array.from(this.patterns.keys())
    };
  }

  /**
   * Add custom pattern for filtering
   */
  addCustomPattern(name: string, pattern: RegExp) {
    this.patterns.set(name, pattern);
  }

  /**
   * Remove a pattern from filtering
   */
  removePattern(name: string) {
    this.patterns.delete(name);
  }

  /**
   * Reset redaction counter
   */
  resetStats() {
    this.redactedCount = 0;
  }
}