# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.5.x   | :white_check_mark: |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :warning: Limited  |
| < 0.3   | :x:                |

## Reporting a Vulnerability

We take the security of c0ntextKeeper seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them through GitHub's private vulnerability reporting feature or via email (Note: security@c0ntextkeeper.com is a placeholder - please update with your actual security contact).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English.

## Policy

We follow the principle of Coordinated Vulnerability Disclosure.

## Security Measures

c0ntextKeeper implements several security measures:

### Data Protection
- Automatic filtering of sensitive data (API keys, passwords, PII)
- Secure storage of archived contexts
- No external data transmission without explicit user consent

### Code Security
- TypeScript strict mode enabled
- Regular dependency updates
- Automated security scanning via GitHub Actions
- Code review requirements for all changes

### Authentication & Access
- Local-only operation by default
- File system permissions respected
- No remote access without explicit configuration

## Known Security Considerations

### Local File Access
c0ntextKeeper operates on local files and respects system permissions. Ensure proper file system permissions are set for sensitive directories.

### Hook Scripts
When using custom hooks, ensure they come from trusted sources as they execute with the same permissions as Claude Code.

### Archive Storage
Archives are stored locally in `~/.c0ntextkeeper/archive/`. Ensure this directory has appropriate permissions if it contains sensitive project information.

## Security Updates

Security updates will be released as patch versions and announced through:
- GitHub Releases
- npm package updates
- Security advisories on GitHub

## Contact

For security concerns, use GitHub's private vulnerability reporting feature.
(Note: security@c0ntextkeeper.com is a placeholder email)

Thank you for helping keep c0ntextKeeper and its users safe!