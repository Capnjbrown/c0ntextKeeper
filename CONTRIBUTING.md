# Contributing to c0ntextKeeper

First off, thank you for considering contributing to c0ntextKeeper! It's people like you that make c0ntextKeeper such a great tool for the Claude Code community.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please be respectful and considerate in all interactions.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and expected**
- **Include screenshots and animated GIFs if possible**
- **Include your environment details** (OS, Node version, Claude Code version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a step-by-step description of the suggested enhancement**
- **Provide specific examples to demonstrate the steps**
- **Describe the current behavior and expected behavior**
- **Explain why this enhancement would be useful**

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues perfect for beginners
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements

### Pull Requests

1. **Fork the repo** and create your branch from `develop`
2. **Write tests** for any new code
3. **Update documentation** as needed
4. **Ensure tests pass** with `npm test`
5. **Run linting** with `npm run lint`
6. **Run type checking** with `npm run typecheck`
7. **Follow commit conventions** (see below)

## Development Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/c0ntextKeeper.git
cd c0ntextKeeper

# Install dependencies
npm install

# Create a branch
git checkout -b feature/your-feature-name

# Run tests in watch mode during development
npm run test:watch

# Start the development server
npm run dev
```

## Project Structure

```
c0ntextKeeper/
├── src/
│   ├── core/           # Core business logic
│   ├── server/         # MCP server implementation
│   ├── hooks/          # Claude Code hook handlers
│   ├── storage/        # Storage implementations
│   └── utils/          # Utility functions
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── fixtures/       # Test data
└── docs/               # Documentation
```

## Testing

We use Jest for testing. Please ensure:

- **Write unit tests** for new functions/classes
- **Write integration tests** for new features
- **Maintain >80% code coverage**
- **Use descriptive test names**

Example test:
```typescript
describe('ContextExtractor', () => {
  it('should extract problems from user messages containing error indicators', () => {
    // Test implementation
  });
});
```

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

Examples:
```
feat(extractor): add support for Python code extraction
fix(storage): resolve race condition in file writes
docs(readme): add installation troubleshooting section
```

## Code Style

- **TypeScript**: Use strict mode
- **No `any` types** without justification
- **Prefer functional programming** where appropriate
- **Use descriptive variable names**
- **Add JSDoc comments** for public APIs
- **Keep functions small** (<50 lines)

## Documentation

- **Update README.md** for user-facing changes
- **Add JSDoc comments** for new functions/classes
- **Update MCP-USAGE.md** for new MCP tools
- **Include examples** in documentation

## Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by at least one maintainer
3. **Documentation review** for new features
4. **Testing verification** for bug fixes

## Community

- **Discord**: Join our [Discord server](https://discord.gg/c0ntextkeeper)
- **Discussions**: Use GitHub Discussions for questions
- **Twitter**: Follow [@c0ntextKeeper](https://twitter.com/c0ntextKeeper)

## Recognition

Contributors will be:
- Listed in our README
- Mentioned in release notes
- Given contributor badge on Discord
- Invited to monthly contributor calls

## Questions?

Feel free to:
- Open a GitHub Discussion
- Ask in our Discord
- Email maintainers@c0ntextkeeper.com

Thank you for contributing to c0ntextKeeper! 🎉