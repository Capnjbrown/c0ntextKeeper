# Branch Strategy for c0ntextKeeper

## Main Branches

### `main`
- **Purpose**: Production-ready code
- **Protected**: Yes
- **Deploy**: Automatically to npm on merge
- **Direct commits**: Not allowed

### `develop`
- **Purpose**: Integration branch for next release
- **Protected**: Yes
- **Merges into**: `main` via release PR
- **Direct commits**: Not allowed

## Supporting Branches

### Feature Branches (`feature/*`)
- **Naming**: `feature/description-of-feature`
- **Created from**: `develop`
- **Merges into**: `develop`
- **Example**: `feature/add-vector-search`

### Bugfix Branches (`bugfix/*`)
- **Naming**: `bugfix/description-of-fix`
- **Created from**: `develop`
- **Merges into**: `develop`
- **Example**: `bugfix/fix-timeout-error`

### Hotfix Branches (`hotfix/*`)
- **Naming**: `hotfix/critical-issue`
- **Created from**: `main`
- **Merges into**: `main` AND `develop`
- **Example**: `hotfix/security-patch`

### Release Branches (`release/*`)
- **Naming**: `release/v1.0.0`
- **Created from**: `develop`
- **Merges into**: `main` AND back to `develop`
- **Purpose**: Prepare for production release

## Workflow

1. Create feature branch from `develop`
2. Work on feature
3. Create PR to `develop`
4. Code review and CI checks
5. Merge to `develop`
6. When ready for release, create `release/vX.Y.Z` from `develop`
7. Final testing and fixes on release branch
8. Merge to `main` (triggers npm publish)
9. Tag the release
10. Merge back to `develop`

## Branch Protection Rules (GitHub Settings)

### For `main`:
- Require pull request reviews (1 minimum)
- Dismiss stale pull request approvals
- Require status checks (CI must pass)
- Require branches to be up to date
- Include administrators
- Restrict who can push

### For `develop`:
- Require pull request reviews (1 minimum)
- Require status checks (CI must pass)
- Allow force pushes (for admins only)

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes (backwards compatible)