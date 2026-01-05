# CI/CD & Pull Request Guide

**Version**: 0.7.8
**Last Updated**: January 5, 2026
**Status**: Production

---

## Quick Navigation

- [Overview](#overview)
- [Pull Request Workflow](#pull-request-workflow)
- [CI Pipeline (GitHub Actions)](#ci-pipeline-github-actions)
- [Understanding Status Checks](#understanding-status-checks)
- [Dependabot & Automated Updates](#dependabot--automated-updates)
- [Branch Protection Rules](#branch-protection-rules)
- [CODEOWNERS & Review Requirements](#codeowners--review-requirements)
- [npm Publishing](#npm-publishing)
- [Troubleshooting CI Failures](#troubleshooting-ci-failures)
- [FAQ](#faq)

---

## Overview

c0ntextKeeper uses GitHub Actions for continuous integration (CI) and continuous deployment (CD). This guide explains how our CI/CD pipelines work and what contributors need to know when submitting pull requests.

### Key Components

| Component | Purpose | File |
|-----------|---------|------|
| **CI Workflow** | Tests PRs and pushes | `.github/workflows/ci.yml` |
| **Publish Workflow** | Releases to npm | `.github/workflows/publish.yml` |
| **Dependabot** | Automated dependency updates | `.github/dependabot.yml` |
| **CODEOWNERS** | Required reviewers | `.github/CODEOWNERS` |

### What Happens When You Submit a PR

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pull Request Submitted                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               GitHub Actions CI Triggered                        │
│   • Lint (ESLint)                                               │
│   • Type Check (TypeScript)                                     │
│   • Test (Node 18, 20, 22)                                      │
│   • Build verification                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   All Checks Must Pass                          │
│   ✓ lint                                                        │
│   ✓ typecheck                                                   │
│   ✓ test (18) / test (20) / test (22)                          │
│   ✓ build                                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Review Required by CODEOWNER                   │
│   @Capnjbrown must approve                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ready to Merge                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pull Request Workflow

### Step 1: Create Your Branch

Always branch from `main` or `develop` depending on the type of change:

```bash
# For features and non-urgent changes
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# For critical hotfixes only
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix
```

### Step 2: Make Your Changes

Follow our coding standards (see [CONTRIBUTING.md](../../CONTRIBUTING.md)):

```bash
# Run tests locally before committing
npm test

# Check linting
npm run lint

# Check TypeScript
npm run typecheck

# Format code
npm run format
```

### Step 3: Push and Create PR

```bash
# Push your branch
git push -u origin feature/your-feature-name
```

Then create a Pull Request on GitHub:
1. Go to https://github.com/Capnjbrown/c0ntextKeeper/pulls
2. Click "New pull request"
3. Select your branch
4. Fill out the PR template
5. Submit for review

### Step 4: Wait for CI and Review

After submitting your PR:

1. **CI Runs Automatically** - GitHub Actions will run lint, typecheck, tests, and build
2. **Status Checks Appear** - You'll see check marks (✓) or X marks (✗) for each job
3. **Review Requested** - CODEOWNERS will be automatically requested for review
4. **Address Feedback** - Fix any CI failures or review comments
5. **Merge When Ready** - Once all checks pass and approved, the PR can be merged

---

## CI Pipeline (GitHub Actions)

Our CI pipeline runs on every push to `main`/`develop` and on every pull request.

### Workflow File: `.github/workflows/ci.yml`

### Jobs Overview

| Job | What It Does | Node Versions | Time |
|-----|--------------|---------------|------|
| **lint** | Runs ESLint to check code style | 20 | ~30s |
| **typecheck** | Runs TypeScript compiler | 20 | ~45s |
| **test** | Runs Jest test suite | 18, 20, 22 | ~1-2min |
| **build** | Compiles and packs | 20 | ~30s |

### Lint Job

```yaml
lint:
  name: Lint
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run lint
```

**What it checks:**
- ESLint rules from `.eslintrc.js`
- Unused variables
- Missing imports
- Code style violations

**Fix locally:**
```bash
npm run lint          # See errors
npm run lint -- --fix # Auto-fix what's possible
```

### TypeCheck Job

```yaml
typecheck:
  name: Type Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run typecheck
```

**What it checks:**
- TypeScript compilation errors
- Type mismatches
- Missing type definitions
- Strict mode violations

**Fix locally:**
```bash
npm run typecheck     # See type errors
```

### Test Job (Matrix)

```yaml
test:
  name: Test (Node ${{ matrix.node-version }})
  runs-on: ubuntu-latest
  strategy:
    matrix:
      node-version: [18, 20, 22]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm test -- --coverage --coverageReporters=lcov
    - name: Upload coverage to Codecov
      if: matrix.node-version == 20
      uses: codecov/codecov-action@v4
```

**What it does:**
- Runs all 483 tests across Node 18, 20, and 22
- Generates code coverage report
- Uploads coverage to Codecov (Node 20 only)

**Why multiple Node versions?**
- Ensures compatibility with LTS (18), Current LTS (20), and Latest (22)
- Catches Node-version-specific bugs
- Verifies we support our documented minimum version

**Fix locally:**
```bash
npm test              # Run all tests
npm test -- --watch   # Run in watch mode
npm test -- path/to/file.test.ts  # Run specific test
```

### Build Job

```yaml
build:
  name: Build
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npm run build
    - run: npm pack --dry-run
```

**What it does:**
- Compiles TypeScript to JavaScript
- Verifies the package can be created
- Ensures no build-breaking changes

**Fix locally:**
```bash
npm run build         # Compile TypeScript
npm pack --dry-run    # Verify package contents
```

---

## Understanding Status Checks

When you view your PR on GitHub, you'll see status checks:

### Check States

| Icon | Meaning | Action |
|------|---------|--------|
| 🟡 | Pending/Running | Wait for completion |
| ✅ | Passed | No action needed |
| ❌ | Failed | Click to see logs and fix |
| ⚪ | Skipped | Conditional job didn't run |

### Reading CI Logs

1. Click on the failing check
2. Click "Details" to open GitHub Actions
3. Expand the failing step
4. Read the error message
5. Fix locally and push

### Common Status Check Scenarios

**All checks pass:**
```
✅ lint
✅ typecheck
✅ test (18)
✅ test (20)
✅ test (22)
✅ build
```
→ Ready for review!

**One job fails:**
```
✅ lint
❌ typecheck       ← Fix this
✅ test (18)
✅ test (20)
✅ test (22)
✅ build
```
→ Click on typecheck, read error, fix locally, push again.

---

## Dependabot & Automated Updates

Dependabot automatically creates PRs to keep dependencies up to date.

### Configuration: `.github/dependabot.yml`

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "America/Denver"
    labels:
      - "dependencies"
    commit-message:
      prefix: "chore(deps)"
    groups:
      dev-dependencies:
        dependency-type: "development"
        update-types:
          - "minor"
          - "patch"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    labels:
      - "github-actions"
    commit-message:
      prefix: "chore(ci)"
```

### What Dependabot Does

| Action | When | Label |
|--------|------|-------|
| npm dependency updates | Every Monday 9am MT | `dependencies` |
| GitHub Actions updates | Weekly | `github-actions` |

### Handling Dependabot PRs

1. **Wait for CI** - Dependabot PRs trigger CI automatically
2. **Review Changelog** - Click through to see what changed
3. **Check Breaking Changes** - Major version bumps need careful review
4. **Merge if Green** - If all checks pass, merge the PR

### Commit Message Format

Dependabot uses conventional commit format:
```
chore(deps): bump typescript from 5.3.3 to 5.4.2
chore(ci): bump actions/checkout from 4.1.0 to 4.2.0
```

### Dev Dependency Grouping

Minor and patch updates to dev dependencies are grouped together to reduce PR noise:
```
chore(deps): bump the dev-dependencies group with 3 updates
```

---

## Branch Protection Rules

Branch protection rules are configured in GitHub Settings (not in code). Here's what's enforced:

### `main` Branch Protection

| Rule | Setting | Purpose |
|------|---------|---------|
| **Require PR** | ✅ Enabled | No direct pushes |
| **Required approvals** | 1 | At least one review |
| **Dismiss stale approvals** | ✅ Enabled | Re-review after changes |
| **Require CODEOWNERS review** | ✅ Enabled | Owner must approve |
| **Require status checks** | ✅ Enabled | CI must pass |
| **Required checks** | lint, typecheck, test, build | All jobs must pass |
| **Require up-to-date** | ✅ Enabled | Must rebase before merge |
| **Require conversation resolution** | ✅ Enabled | Address all comments |
| **Include administrators** | ✅ Enabled | Even maintainers follow rules |

### `develop` Branch Protection

| Rule | Setting |
|------|---------|
| **Require PR** | ✅ Enabled |
| **Required approvals** | 1 |
| **Require status checks** | ✅ Enabled |
| **Include administrators** | ❌ Disabled (allows hotfixes) |

### What This Means for Contributors

1. **You cannot push directly to `main` or `develop`**
2. **All changes go through PRs**
3. **CI must pass before merge is possible**
4. **At least one maintainer must approve**
5. **You must address all review comments**

---

## CODEOWNERS & Review Requirements

The `.github/CODEOWNERS` file specifies who must review changes to different parts of the codebase.

### Current Configuration

```
# Global - all files require owner review
* @Capnjbrown

# Critical paths - require owner review
/src/ @Capnjbrown
/package.json @Capnjbrown
/.github/ @Capnjbrown
/docs/ @Capnjbrown
```

### What This Means

- **Any change** to the repository requires review from @Capnjbrown
- **Source code** (`/src/`) changes require owner review
- **Package config** (`package.json`) changes require owner review
- **CI/CD config** (`.github/`) changes require owner review
- **Documentation** (`/docs/`) changes require owner review

### How CODEOWNERS Works

1. You submit a PR
2. GitHub automatically requests review from code owners
3. Code owners receive notification
4. They review and approve (or request changes)
5. Once approved by code owner + CI passes → mergeable

---

## npm Publishing

We use **OIDC Trusted Publishing** for secure npm releases - no tokens stored in GitHub secrets.

### Workflow File: `.github/workflows/publish.yml`

### How It Works

1. **Maintainer creates a GitHub Release** (tag like `v0.7.9`)
2. **Publish workflow triggers automatically**
3. **GitHub Actions authenticates via OIDC** (no stored tokens)
4. **Package is published to npm**

### Publish Workflow

```yaml
name: Publish to npm

on:
  release:
    types: [published]

permissions:
  contents: read
  id-token: write  # Required for OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    environment: npm
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
```

### Security: OIDC Trusted Publishing

**What is OIDC Trusted Publishing?**
- npm's recommended approach (as of 2025)
- GitHub Actions gets temporary tokens directly from npm
- No long-lived `NPM_TOKEN` to leak or rotate
- Each publish uses job-specific credentials

**Benefits:**
- ✅ No secrets to manage
- ✅ Cannot be extracted or reused
- ✅ Automatic provenance generation
- ✅ Audit trail tied to specific workflow runs

### For Contributors

You don't need to worry about publishing - that's handled by maintainers when they:
1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a GitHub Release

---

## Troubleshooting CI Failures

### Lint Failures

**Error:** `ESLint: X problems (Y errors, Z warnings)`

**Fix:**
```bash
# See all issues
npm run lint

# Auto-fix what's possible
npm run lint -- --fix

# Check specific file
npx eslint src/path/to/file.ts
```

**Common issues:**
- Unused variables → Remove or prefix with `_`
- Missing imports → Add the import
- Formatting → Run `npm run format`

### TypeScript Failures

**Error:** `error TS2xxx: Type 'X' is not assignable to type 'Y'`

**Fix:**
```bash
# See all type errors
npm run typecheck

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

**Common issues:**
- Type mismatches → Fix the types or add assertions
- Missing properties → Add required fields
- Implicit any → Add explicit types

### Test Failures

**Error:** `FAIL tests/unit/some.test.ts`

**Fix:**
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit/some.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should extract"

# Run with verbose output
npm test -- --verbose
```

**Common issues:**
- Snapshot mismatch → Update with `npm test -- -u`
- Timeout → Increase timeout or optimize test
- Mock issues → Check mock setup in test file

### Build Failures

**Error:** `tsc build failed`

**Fix:**
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

**Common issues:**
- Syntax errors → Fix TypeScript issues first
- Missing dependencies → Run `npm install`
- Circular imports → Refactor to break cycles

### Node Version Issues

**Error:** Tests pass on Node 20 but fail on Node 18

**Fix:**
- Check for Node 20+ features (like `Array.at()`)
- Add polyfills if needed
- Update engines in `package.json` if intentional

---

## FAQ

### Q: Why is my PR blocked from merging?

**A:** Check these requirements:
1. All CI checks must pass (green checkmarks)
2. At least one maintainer must approve
3. All review comments must be resolved
4. Branch must be up to date with target branch

### Q: How do I update my PR branch?

**A:** Either rebase or merge:
```bash
# Option 1: Rebase (cleaner history)
git fetch origin
git rebase origin/main
git push --force-with-lease

# Option 2: Merge (preserves history)
git fetch origin
git merge origin/main
git push
```

### Q: Why does Dependabot keep updating the same package?

**A:** The package may have frequent releases. If it's causing issues:
- Check if there's a stable version to pin to
- Consider adding to Dependabot ignore list

### Q: How do I run CI locally before pushing?

**A:** Run the same commands CI runs:
```bash
npm run lint && npm run typecheck && npm run build && npm test
```

### Q: Can I skip CI checks?

**A:** No. Branch protection rules require all checks to pass. If you think a check should be skipped, open an issue to discuss.

### Q: How do I see code coverage?

**A:** Coverage is uploaded to Codecov on Node 20 runs:
1. Look for "codecov/patch" status check on your PR
2. Click through to see detailed coverage report
3. Or visit https://codecov.io/gh/Capnjbrown/c0ntextKeeper

### Q: What if CI passes but I get a review rejection?

**A:** Address the feedback:
1. Read the review comments carefully
2. Make requested changes
3. Push updates to your branch
4. Request re-review
5. Wait for approval

---

## Related Documentation

- [CONTRIBUTING.md](../../CONTRIBUTING.md) - How to contribute
- [RELEASE-GUIDE.md](./RELEASE-GUIDE.md) - Release procedures
- [project-context.md](./project-context.md) - Technical specifications

---

*This guide was created as part of Phase 6 CI/CD implementation. For questions, open a GitHub issue or discussion.*
