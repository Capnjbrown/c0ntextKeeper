# GitHub Repository Settings for c0ntextKeeper

This document outlines the recommended GitHub repository settings for c0ntextKeeper when making it public.

## 1. General Settings

Navigate to Settings → General

### Basic Information
- **Repository name**: `c0ntextKeeper`
- **Description**: `🧠 Intelligent context preservation for Claude Code - Never lose valuable work again!`
- **Website**: `https://c0ntextkeeper.com` (if available)
- **Topics**: Add the following topics:
  - `mcp`
  - `claude-code`
  - `context-management`
  - `ai-development`
  - `developer-tools`
  - `typescript`
  - `nodejs`
  - `automation`

### Features
- ✅ **Issues** - Enable for bug reports and feature requests
- ✅ **Projects** - Enable for project management
- ✅ **Preserve this repository** - Consider enabling
- ❌ **Wiki** - Disable (use docs/ folder instead)
- ✅ **Discussions** - Enable for community Q&A
- ✅ **Sponsorships** - Enable if you want to accept sponsorships

### Pull Requests
- ✅ Allow merge commits
- ✅ Allow squash merging (preferred)
- ✅ Allow rebase merging
- ✅ Automatically delete head branches

### Archives
- ✅ Include Git LFS objects in archives

## 2. Branch Protection Rules

Navigate to Settings → Branches

### Protection for `main` branch:
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from CODEOWNERS
  - ✅ Require approval of the most recent reviewable push
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - Required status checks:
    - `test (18.x)`
    - `test (20.x)`
    - `test (22.x)`
- ✅ Require conversation resolution before merging
- ✅ Require signed commits (optional but recommended)
- ✅ Include administrators
- ✅ Restrict who can push to matching branches
  - Add yourself as allowed pusher

### Protection for `develop` branch:
- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
- ✅ Require status checks to pass before merging
  - Same as main branch
- ❌ Do not include administrators (allows hotfixes)

## 3. Security & Analysis

Navigate to Settings → Security & analysis

### Security
- ✅ **Private vulnerability reporting** - Enable
- ✅ **Dependency graph** - Enable
- ✅ **Dependabot alerts** - Enable
- ✅ **Dependabot security updates** - Enable
- ✅ **Code scanning** - Set up with CodeQL

### Dependabot version updates
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

## 4. Webhooks & Integrations

### Recommended Integrations:
- **Codecov** - For code coverage reports
- **npm** - For package publishing
- **Discord/Slack** - For community notifications

## 5. Pages (Optional)

Navigate to Settings → Pages

If you want to host documentation:
- **Source**: Deploy from a branch
- **Branch**: `gh-pages` or `main`
- **Folder**: `/docs`
- **Custom domain**: `docs.c0ntextkeeper.com` (if available)

## 6. Secrets and Variables

Navigate to Settings → Secrets and variables → Actions

### Required Secrets:
- `NPM_TOKEN` - For automated npm publishing
- `CODECOV_TOKEN` - For coverage reports

### Optional Secrets:
- `DISCORD_WEBHOOK` - For release notifications
- `TWITTER_API_KEY` - For release announcements

## 7. Actions

Navigate to Settings → Actions → General

### Actions permissions:
- ✅ Allow all actions and reusable workflows

### Workflow permissions:
- ✅ Read and write permissions
- ✅ Allow GitHub Actions to create and approve pull requests

## 8. Moderation

Navigate to Settings → Moderation

### Code review limits:
- Limit to users who are prior contributors
- Limit to users who have previously committed to main

### Interaction limits:
- No limits initially (monitor and adjust if needed)

## 9. Releases

### Release Strategy:
1. Use semantic versioning (vX.Y.Z)
2. Create releases from main branch only
3. Include:
   - Comprehensive release notes
   - Binary attachments if applicable
   - Link to npm package
   - Migration guide for breaking changes

## 10. Community Standards

Ensure all community files are present:
- ✅ README.md
- ✅ LICENSE
- ✅ CODE_OF_CONDUCT.md
- ✅ CONTRIBUTING.md
- ✅ SECURITY.md
- ✅ Issue templates
- ✅ Pull request template

## Quick Setup Commands

After making the repository public, run these commands:

```bash
# Add topics
gh repo edit --add-topic mcp,claude-code,context-management,ai-development

# Enable features
gh repo edit --enable-issues --enable-projects --enable-discussions

# Create initial labels
gh label create "good first issue" --color 7057ff --description "Good for newcomers"
gh label create "help wanted" --color 008672 --description "Extra attention is needed"
```

## Monitoring

After going public, monitor:
- Issue response time
- Pull request review time
- Community engagement
- Security alerts
- Download statistics

## Notes

- Review settings quarterly
- Adjust branch protection as team grows
- Consider adding CODEOWNERS file
- Set up issue/PR templates for consistency
- Enable GitHub Sponsors if accepting donations

---

**Remember**: You can always start with more restrictive settings and relax them as needed. It's easier to open up than to restrict later.