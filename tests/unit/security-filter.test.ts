/**
 * Tests for SecurityFilter
 */

import { SecurityFilter } from '../../src/utils/security-filter';

describe('SecurityFilter', () => {
  let filter: SecurityFilter;

  beforeEach(() => {
    filter = new SecurityFilter();
  });

  describe('filterText', () => {
    it('should redact API keys', () => {
      const text = 'My API_KEY=sk-1234567890abcdefghijklmnop';
      const filtered = filter.filterText(text);
      expect(filtered).toBe('My API_KEY=[REDACTED]');
      expect(filtered).not.toContain('sk-1234567890');
    });

    it('should redact OpenAI API keys', () => {
      const text = 'OPENAI_API_KEY="sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"';
      const filtered = filter.filterText(text);
      expect(filtered).toContain('[REDACTED]');
      expect(filtered).not.toContain('sk-proj');
    });

    it('should redact Anthropic API keys', () => {
      const text = 'export ANTHROPIC_API_KEY=sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyz1234567890';
      const filtered = filter.filterText(text);
      expect(filtered).toContain('[REDACTED]');
      expect(filtered).not.toContain('sk-ant');
    });

    it('should redact database connection strings', () => {
      const text = 'mongodb://user:password123@localhost:27017/mydb';
      const filtered = filter.filterText(text);
      expect(filtered).toContain('[REDACTED]');
      expect(filtered).not.toContain('password123');
      expect(filtered).not.toContain('user:password123');
    });

    it('should redact JWT tokens', () => {
      const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const filtered = filter.filterText(text);
      expect(filtered).toContain('[REDACTED]');
      expect(filtered).not.toContain('eyJ');
    });

    it('should partially redact email addresses', () => {
      const text = 'Contact me at john.doe@example.com';
      const filtered = filter.filterText(text);
      expect(filtered).toBe('Contact me at ***@example.com');
      expect(filtered).not.toContain('john.doe');
    });

    it('should partially redact IP addresses', () => {
      const text = 'Server IP: 192.168.1.100';
      const filtered = filter.filterText(text);
      expect(filtered).toBe('Server IP: 192.168.***.***');
    });

    it('should redact passwords', () => {
      const text = 'password: superSecret123!';
      const filtered = filter.filterText(text);
      expect(filtered).toBe('password:[REDACTED]');
      expect(filtered).not.toContain('superSecret');
    });

    it('should redact private keys', () => {
      const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA1234567890abcdef...
-----END RSA PRIVATE KEY-----`;
      const filtered = filter.filterText(privateKey);
      expect(filtered).toBe('[REDACTED]');
    });

    it('should handle multiple sensitive items', () => {
      const text = `
        API_KEY=abc123def456
        email: admin@example.com
        password: secret123
      `;
      const filtered = filter.filterText(text);
      expect(filtered).toContain('API_KEY=[REDACTED]');
      expect(filtered).toContain('***@example.com');
      expect(filtered).toContain('password:[REDACTED]');
    });

    it('should not modify text without sensitive data', () => {
      const text = 'This is a normal message about coding';
      const filtered = filter.filterText(text);
      expect(filtered).toBe(text);
    });
  });

  describe('filterObject', () => {
    it('should filter sensitive data in objects', () => {
      const obj = {
        message: 'Set API_KEY=secret123',
        config: {
          password: 'myPassword',
          host: 'localhost'
        }
      };
      
      const filtered = filter.filterObject(obj);
      expect(filtered.message).toContain('[REDACTED]');
      expect(filtered.config.password).toBe('[REDACTED]');
      expect(filtered.config.host).toBe('localhost');
    });

    it('should handle arrays in objects', () => {
      const obj = {
        logs: [
          'API_KEY=secret',
          'Normal log entry',
          'password: test123'
        ]
      };
      
      const filtered = filter.filterObject(obj);
      expect(filtered.logs[0]).toContain('[REDACTED]');
      expect(filtered.logs[1]).toBe('Normal log entry');
      expect(filtered.logs[2]).toContain('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              secret: 'API_KEY=hidden'
            }
          }
        }
      };
      
      const filtered = filter.filterObject(obj);
      expect(filtered.level1.level2.level3.secret).toContain('[REDACTED]');
    });
  });

  describe('containsSensitiveData', () => {
    it('should detect sensitive data', () => {
      expect(filter.containsSensitiveData('API_KEY=secret')).toBe(true);
      expect(filter.containsSensitiveData('email@example.com')).toBe(true);
      expect(filter.containsSensitiveData('password: test')).toBe(true);
    });

    it('should not flag normal text', () => {
      expect(filter.containsSensitiveData('This is normal text')).toBe(false);
      expect(filter.containsSensitiveData('function calculate() {}')).toBe(false);
    });
  });

  describe('custom patterns', () => {
    it('should allow adding custom patterns', () => {
      filter.addCustomPattern('custom_secret', /CUSTOM_SECRET=\w+/g);
      const text = 'CUSTOM_SECRET=myvalue';
      const filtered = filter.filterText(text);
      expect(filtered).toBe('[REDACTED]');
    });

    it('should allow removing patterns', () => {
      filter.removePattern('email');
      const text = 'admin@example.com';
      const filtered = filter.filterText(text);
      expect(filtered).toBe(text); // Email not filtered
    });
  });

  describe('statistics', () => {
    it('should track redaction count', () => {
      filter.filterText('API_KEY=secret password=test');
      const stats = filter.getStats();
      expect(stats.redactedCount).toBe(2);
    });

    it('should reset statistics', () => {
      filter.filterText('API_KEY=secret');
      filter.resetStats();
      const stats = filter.getStats();
      expect(stats.redactedCount).toBe(0);
    });
  });
});