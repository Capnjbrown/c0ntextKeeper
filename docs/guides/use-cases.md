# Real-World Use Cases

> **Practical examples showing how c0ntextKeeper improves your workflow**

---

## Overview

c0ntextKeeper helps developers by:
- **Preserving Knowledge** - Never lose valuable context between sessions
- **Finding Solutions** - Quickly locate past fixes and implementations
- **Building Continuity** - Claude remembers your project across sessions
- **Accelerating Development** - Avoid solving the same problems twice

---

## Use Case 1: Daily Development Workflow

### Scenario
You're a developer working on a web application. You use Claude Code daily for various tasks, and you want Claude to remember your project context across sessions.

### Setup
```bash
# One-time installation
npm install -g c0ntextkeeper
c0ntextkeeper setup
```

### Workflow

**Monday Morning** (Session 1):
```
You: "Add JWT authentication to our Express API"
Claude: [Implements authentication, creates middleware]
You: /compact  # c0ntextKeeper automatically captures this work
```

**Monday Afternoon** (Session 2):
```
[Session starts - auto-loads context from morning]
Claude: "I see we implemented JWT authentication this morning..."
You: "Now add refresh token rotation"
Claude: [Builds on morning's work, references existing code]
```

**Tuesday** (Session 3):
```
[Session starts - auto-loads recent work]
You: "The authentication isn't working in production"
Claude: [Uses fetch_context to review Monday's implementation]
Claude: "Looking at our auth implementation from yesterday..."
[Finds and fixes issue based on documented architecture]
```

### Benefits
- ✅ **Session Continuity**: Claude knows your project history
- ✅ **Faster Onboarding**: New sessions start with context
- ✅ **Consistent Decisions**: Builds on past architectural choices

---

## Use Case 2: Bug Investigation

### Scenario
Your application crashes with an error you've seen before, but can't remember how you fixed it.

### Problem
```
Error: Connection pool exhausted
  at DatabasePool.acquire (pool.ts:45)
```

### Investigation

**Step 1**: Search for past occurrences
```bash
c0ntextkeeper search "connection pool exhausted"
```

**Result**:
```
📄 Session: 2025-01-15-14-30-45
   Problem: Database connection pool exhaustion under load
   Solution: Implemented connection timeout and increased pool size
   Files: src/db/pool.ts, src/config/database.ts
   Relevance: 0.94
```

**Step 2**: In Claude Code
```
You: "We had this connection pool error before. What did we do?"
[Claude uses fetch_context with query="connection pool error fix"]
Claude: "Yes, on January 15th we encountered this. We fixed it by:
  1. Adding connection timeout (30s)
  2. Increasing pool size from 10 to 20
  3. Implementing connection retry logic

Let me check if these settings are applied in the current code..."
```

**Step 3**: Quick Fix
```
Claude: [Reviews current pool.ts]
Claude: "The timeout is set to 10s instead of 30s. Let me update it..."
[Applies fix based on past solution]
```

### Benefits
- ✅ **Instant Recall**: Find solutions in seconds
- ✅ **Avoid Repetition**: Don't solve the same problem twice
- ✅ **Context-Aware**: Claude applies past learnings

---

## Use Case 3: Onboarding New Team Members

### Scenario
A new developer joins your team. They need to understand the project architecture, past decisions, and coding patterns.

### Traditional Approach
- Read outdated documentation
- Ask senior developers repeatedly
- Trial and error learning
- Takes 1-2 weeks to be productive

### c0ntextKeeper Approach

**Step 1**: Generate Project Overview
```bash
c0ntextkeeper stats
```

**Output**:
```
📊 Project: enterprise-api
   Sessions: 156
   Total Context: 2,847 entries
   Time Range: 2024-10-01 to 2025-01-20

   🔥 Top Topics:
      1. authentication (89 mentions)
      2. database (67 mentions)
      3. testing (54 mentions)

   🛠️  Most Used Tools:
      1. Write (234 times)
      2. Edit (189 times)
      3. Bash (156 times)
```

**Step 2**: Understand Architectural Decisions
```
New Dev (in Claude Code): "What architecture decisions were made for this API?"
[Claude uses fetch_context with query="architecture decisions"]

Claude: "Here are the key architectural decisions:

1. **Authentication**: JWT with refresh tokens
   - Reasoning: Better security with token rotation
   - Implemented: 2024-11-15
   - Files: src/middleware/auth.ts

2. **Database**: PostgreSQL with TypeORM
   - Reasoning: Better type safety, migration support
   - Implemented: 2024-10-20
   - Files: src/db/connection.ts

3. **API Structure**: REST with versioning
   - Reasoning: Client compatibility, gradual rollout
   - Implemented: 2024-10-15
   - Files: src/routes/v1/, src/routes/v2/
```

**Step 3**: Learn Common Patterns
```bash
c0ntextkeeper patterns
```

**Output**:
```
🔄 Top Command Patterns:
   1. npm test && npm run lint (47 times)
   2. npm run typecheck (38 times)
   3. docker-compose up -d (23 times)

📝 Top Code Patterns:
   1. Add error handling with try-catch (23 times)
   2. Validate request with Zod schema (19 times)
   3. Add TypeScript types to function params (34 times)
```

### Benefits
- ✅ **Faster Onboarding**: 3-4 days instead of 1-2 weeks
- ✅ **Self-Service Learning**: Answer own questions via search
- ✅ **Consistent Patterns**: Learn team's coding style
- ✅ **Historical Context**: Understand why decisions were made

---

## Use Case 4: Feature Implementation

### Scenario
You need to implement a new payment gateway integration. Your team integrated Stripe 6 months ago.

### Approach

**Step 1**: Research Past Integration
```
You: "We integrated Stripe before. How did we structure the payment service?"
[Claude uses search_archive with query="stripe payment integration"]

Claude: "Here's how we structured the Stripe integration:

Session: 2024-07-12
Files Created:
  - src/services/payment/stripe-service.ts
  - src/services/payment/payment-interface.ts
  - src/models/payment-transaction.ts

Architecture Pattern:
  1. Created PaymentInterface (abstraction)
  2. Implemented StripePaymentService
  3. Used factory pattern for instantiation
  4. Stored transactions in payment_transactions table

This allows us to easily add new payment providers..."
```

**Step 2**: Apply Same Pattern
```
You: "Use the same pattern to integrate PayPal"
Claude: [Reads archived implementation]
Claude: "I'll follow the same pattern:
  1. Create PayPalPaymentService implementing PaymentInterface
  2. Add to payment factory
  3. Reuse existing transaction model

This ensures consistency with our Stripe integration..."
```

**Step 3**: Leverage Past Lessons
```
[Claude references archived decisions]
Claude: "Based on our Stripe integration, I'll also:
  - Add webhook handling for async events
  - Implement idempotency keys to prevent duplicate charges
  - Use the same error handling structure
  - Add similar test coverage

These were key learnings from the Stripe integration."
```

### Benefits
- ✅ **Consistent Architecture**: Same patterns across features
- ✅ **Faster Implementation**: Reuse proven approaches
- ✅ **Avoid Past Mistakes**: Learn from previous integrations
- ✅ **Better Quality**: Apply past testing strategies

---

## Use Case 5: Code Review & Documentation

### Scenario
You need to review a pull request or generate documentation for recent work.

### Code Review

**Traditional Approach**:
```
Reviewer: "Why did you implement it this way?"
Developer: "Uh... I think it was because of X, maybe Y?"
[Context lost, rationale unclear]
```

**With c0ntextKeeper**:
```bash
# Search for implementation context
c0ntextkeeper search "user profile caching" --sort date
```

**Result**:
```
📄 Session: 2025-01-18-10-30-00

Problem: User profile API slow (2-3s response time)

Discussion:
  - Considered Redis caching vs in-memory
  - Decided on Redis for multi-instance support
  - Set TTL to 5 minutes based on profile update frequency

Implementation:
  - Added Redis client in src/cache/redis.ts
  - Implemented cache-aside pattern
  - Added cache invalidation on profile updates

Performance Impact:
  - Response time: 2-3s → 50-100ms (95% improvement)
```

**In Pull Request**:
```markdown
## Context
This PR implements Redis caching for user profiles to address slow
API response times (see session 2025-01-18).

## Approach
We chose Redis over in-memory caching to support horizontal scaling
(discussed in architecture meeting, see archived session).

## Performance
Benchmarked at 95% improvement (2-3s → 50-100ms)

## Related Archives
- c0ntextkeeper search "user profile caching"
- Session: 2025-01-18-10-30-00
```

### Benefits
- ✅ **Clear Rationale**: Documented decision-making
- ✅ **Better Reviews**: Reviewers understand context
- ✅ **Knowledge Sharing**: Team learns from decisions
- ✅ **Audit Trail**: Track architectural evolution

---

## Use Case 6: Debugging Recurring Issues

### Scenario
Your application has a memory leak that appears intermittently. You've debugged it before but can't remember the exact cause.

### Investigation

**Step 1**: Search Past Debugging Sessions
```bash
c0ntextkeeper search "memory leak" --sort date
```

**Result**:
```
📄 Session: 2024-12-10-16-45-00
   Problem: Memory usage increasing over time
   Root Cause: Event listeners not being cleaned up
   Solution: Added cleanup in component unmount
   Files: src/components/Dashboard.tsx

📄 Session: 2024-11-22-14-20-00
   Problem: Memory leak in background polling
   Root Cause: setInterval not cleared
   Solution: Implemented cleanup in useEffect
   Files: src/hooks/usePolling.ts
```

**Step 2**: Pattern Recognition
```bash
c0ntextkeeper patterns --type code
```

**Output**:
```
🔍 Recurring Issue: Memory Leaks
   Frequency: 3 occurrences
   Common Causes:
     1. Event listeners not cleaned up (2x)
     2. Timers (setInterval/setTimeout) not cleared (2x)
     3. Subscriptions not unsubscribed (1x)

   Standard Solution:
     - Always return cleanup function from useEffect
     - Use AbortController for fetch requests
     - Clear timers in component unmount
```

**Step 3**: Apply Pattern
```
You: "Memory is growing again. Check for same issues."
[Claude uses get_patterns to find cleanup patterns]

Claude: "Based on our history with memory leaks, I'll check:
  1. Event listeners in new components
  2. Uncleaned timers
  3. Missing AbortController usage

Scanning recent components... Found it!
src/components/RealTimeChart.tsx has a setInterval without cleanup.
Let me fix it using our standard pattern..."
```

### Benefits
- ✅ **Faster Debugging**: Recall past root causes
- ✅ **Pattern Recognition**: Identify recurring issues
- ✅ **Preventive**: Apply lessons to new code
- ✅ **Team Learning**: Share debugging insights

---

## Use Case 7: Cross-Project Learning

### Scenario
You maintain multiple projects and want to reuse solutions across them.

### Setup
```bash
# Enable global search scope
# (c0ntextKeeper already supports this)
```

### Usage

**Project A**: E-commerce site (implemented rate limiting)
```
Session: 2024-11-05
Implementation: Redis-based rate limiting with sliding window
Files: src/middleware/rate-limit.ts
```

**Project B**: API service (needs rate limiting)
```
You: "How did I implement rate limiting in other projects?"
[Claude searches with scope="global"]

Claude: "In your e-commerce project (Project A), you implemented
rate limiting using Redis with a sliding window algorithm.

Key aspects:
  1. Used ioredis for Redis client
  2. Sliding window (more accurate than fixed window)
  3. Configurable per-endpoint limits
  4. Graceful degradation if Redis unavailable

Would you like me to implement the same approach here?"
```

### Benefits
- ✅ **Reuse Solutions**: Don't reinvent the wheel
- ✅ **Consistent Patterns**: Same approaches across projects
- ✅ **Faster Development**: Copy proven implementations
- ✅ **Quality**: Use battle-tested code

---

## Use Case 8: API Integration Documentation

### Scenario
You integrated with a third-party API months ago. Now a teammate asks how it works.

### Query
```
Teammate (in Claude Code): "How do we handle pagination with the Shopify API?"

[Claude uses fetch_context with query="Shopify API pagination"]

Claude: "Based on our Shopify integration from October 2024:

We use cursor-based pagination (not page numbers):
  1. Initial request returns 'pageInfo' with cursors
  2. Use 'after' cursor for next page
  3. Use 'before' cursor for previous page
  4. Check 'hasNextPage' to determine if more results exist

Implementation: src/services/shopify/api-client.ts

Example code from our integration:
```typescript
async function fetchProducts(cursor?: string) {
  const response = await shopify.product.list({
    limit: 50,
    page_info: cursor
  });

  return {
    products: response.products,
    nextCursor: response.pageInfo.after,
    hasMore: response.pageInfo.hasNextPage
  };
}
```

We also implemented retry logic with exponential backoff
for rate limit handling (429 errors)."
```

### Benefits
- ✅ **Living Documentation**: Always up-to-date
- ✅ **Code Examples**: Real implementation details
- ✅ **Team Knowledge**: Share integration expertise
- ✅ **Quick Answers**: No need to dig through code

---

## Use Case 9: Performance Optimization

### Scenario
Your app is slow. You want to see what optimizations worked in the past.

### Investigation

**Step 1**: Search Past Optimizations
```bash
c0ntextkeeper search "performance optimization" --limit 20
```

**Results**:
```
📄 Session: 2024-12-01
   Optimization: Database query optimization
   Before: 2.5s avg query time
   After: 150ms avg query time
   Approach: Added indexes, used JOIN instead of multiple queries
   Impact: 94% improvement

📄 Session: 2024-11-15
   Optimization: React component memoization
   Before: 500ms render time
   After: 50ms render time
   Approach: useMemo for expensive calculations, React.memo for components
   Impact: 90% improvement

📄 Session: 2024-10-20
   Optimization: Image optimization
   Before: 5MB total page size
   After: 800KB total page size
   Approach: WebP format, lazy loading, responsive images
   Impact: 84% reduction
```

**Step 2**: Identify Patterns
```bash
c0ntextkeeper patterns --type code --min-frequency 3
```

**Output**:
```
🚀 Common Optimization Patterns:
   1. Database: Add indexes (6 times, avg 85% improvement)
   2. Frontend: Memoization (4 times, avg 70% improvement)
   3. Images: WebP + lazy loading (3 times, avg 80% reduction)
   4. API: Response caching (5 times, avg 92% improvement)
```

**Step 3**: Apply Best Practices
```
You: "The product listing page is slow. What optimizations should I try?"
[Claude uses get_patterns to find performance patterns]

Claude: "Based on our optimization history, I recommend:

1. **Database Level** (historically 85% improvement):
   - Add index on products.category_id
   - Add index on products.created_at
   - Use JOIN instead of multiple queries

2. **Frontend Level** (historically 70% improvement):
   - Memoize product filtering logic
   - Use React.memo for ProductCard component
   - Virtualize long lists (react-window)

3. **Asset Level** (historically 80% reduction):
   - Convert images to WebP
   - Implement lazy loading
   - Add responsive image srcset

Let's start with database indexes (biggest impact in past)..."
```

### Benefits
- ✅ **Data-Driven**: Know what works based on history
- ✅ **Prioritization**: Start with high-impact changes
- ✅ **Avoid Guesswork**: Use proven approaches
- ✅ **Measure Progress**: Compare to past improvements

---

## Use Case 10: Testing Strategy

### Scenario
You're adding tests to a new feature and want to follow your team's testing patterns.

### Approach

**Step 1**: Review Past Testing Patterns
```bash
c0ntextkeeper patterns --type code
```

**Output**:
```
🧪 Testing Patterns (23 occurrences):
   1. Unit tests with Jest + TypeScript
   2. Integration tests with supertest for API
   3. E2E tests with Playwright for UI
   4. Mock external services with jest.mock()
   5. Use test fixtures in tests/fixtures/
   6. Aim for 80%+ coverage
```

**Step 2**: Find Similar Feature Tests
```
You: "We have tests for user authentication. Show me the pattern."
[Claude uses search_archive with query="authentication tests"]

Claude: "Here's our authentication testing approach:

Test Structure (from Session 2024-11-20):
```
tests/
  ├── unit/
  │   ├── auth.service.test.ts      # Business logic
  │   └── auth.middleware.test.ts   # Middleware
  ├── integration/
  │   └── auth.routes.test.ts       # API endpoints
  └── fixtures/
      └── users.ts                  # Test data
```

Testing Pattern:
  1. Unit tests: Test service methods in isolation
  2. Integration tests: Test API endpoints with real DB
  3. Mock external calls (email service, etc.)
  4. Use beforeEach for clean test state
  5. Test both success and error cases

Coverage achieved: 94%
```

**Step 3**: Apply Pattern to New Feature
```
You: "Add tests for payment processing using the same pattern"
Claude: [Applies archived testing structure]

Claude: "I'll follow our established pattern:

1. Unit tests: tests/unit/payment.service.test.ts
   - Test charge() method
   - Test refund() method
   - Mock Stripe SDK

2. Integration tests: tests/integration/payment.routes.test.ts
   - Test POST /api/payments endpoint
   - Test webhook handling
   - Use test Stripe account

3. Fixtures: tests/fixtures/payments.ts
   - Sample payment data
   - Mock Stripe responses

This matches our authentication test structure for consistency."
```

### Benefits
- ✅ **Consistent Tests**: Same structure across features
- ✅ **Better Coverage**: Follow proven patterns
- ✅ **Faster Writing**: Reuse test templates
- ✅ **Maintainability**: Predictable test organization

---

## Use Case 11: DevOps & Deployment

### Scenario
You're setting up CI/CD for a new microservice. Your team has done this before.

### Investigation

**Step 1**: Find Past CI/CD Setup
```bash
c0ntextkeeper search "ci/cd setup github actions" --limit 10
```

**Result**:
```
📄 Session: 2024-09-15
   Project: auth-service
   CI/CD Setup: GitHub Actions
   Pipeline Steps:
     1. Lint & TypeScript check
     2. Unit tests
     3. Integration tests (with Docker PostgreSQL)
     4. Build Docker image
     5. Push to Docker Hub
     6. Deploy to staging (auto)
     7. Deploy to production (manual approval)

   Files: .github/workflows/ci.yml
   Lessons: Run tests in parallel, cache dependencies
```

**Step 2**: Review Deployment Pattern
```
You: "What's our standard deployment process?"
[Claude uses fetch_context to review deployment patterns]

Claude: "Based on our auth-service deployment (Sep 2024):

Standard Deployment Pipeline:
  1. **Code Quality** (3-5 min):
     - ESLint, TypeScript, Prettier
     - Parallel execution for speed

  2. **Testing** (5-8 min):
     - Unit tests (Jest)
     - Integration tests (with test DB)
     - E2E tests (critical paths only)

  3. **Build** (2-3 min):
     - Docker multi-stage build
     - Cache npm dependencies
     - Optimize image size

  4. **Deploy** (Auto to staging, manual to prod):
     - Staging: Auto on main branch
     - Production: Requires approval
     - Blue-green deployment
     - Auto rollback on health check fail

Key Settings:
  - Timeout: 20 minutes
  - Retry on flaky tests: 2 attempts
  - Slack notifications on failure

Would you like me to create the same setup for this service?"
```

### Benefits
- ✅ **Standardized CI/CD**: Same pipeline across services
- ✅ **Proven Configuration**: Reuse working setups
- ✅ **Faster Setup**: Copy template instead of starting from scratch
- ✅ **Best Practices**: Apply learned optimizations

---

## Use Case 12: Security Incident Response

### Scenario
A security vulnerability is discovered in a dependency. You need to understand everywhere it's used.

### Investigation

**Step 1**: Find Dependency Usage
```bash
c0ntextkeeper search "express-jwt" --sort date --limit 50
```

**Results**:
```
📄 Session: 2024-11-20 - auth-service
   Usage: JWT authentication middleware
   Files: src/middleware/auth.ts
   Version: express-jwt@8.4.1

📄 Session: 2024-10-15 - api-gateway
   Usage: Token validation for proxied requests
   Files: src/auth/validator.ts
   Version: express-jwt@8.4.1

📄 Session: 2024-09-08 - admin-panel
   Usage: Admin authentication
   Files: server/middleware/auth.ts
   Version: express-jwt@7.7.7
```

**Step 2**: Assess Impact
```
You: "express-jwt has a security vulnerability in versions < 8.4.2.
      What services are affected?"

[Claude uses search_archive to find all mentions]

Claude: "Based on search results:

🚨 Affected Services:
  1. auth-service (v8.4.1) - VULNERABLE
     Impact: High (core authentication)
     Files: src/middleware/auth.ts

  2. api-gateway (v8.4.1) - VULNERABLE
     Impact: High (validates all proxied requests)
     Files: src/auth/validator.ts

  3. admin-panel (v7.7.7) - VULNERABLE
     Impact: Critical (outdated, multiple CVEs)
     Files: server/middleware/auth.ts

✅ Unaffected:
  1. frontend-app (uses client-side auth, no express-jwt)
  2. worker-service (no authentication)

Recommended Actions:
  1. Update admin-panel ASAP (critical)
  2. Update auth-service & api-gateway (high priority)
  3. Run security audit: npm audit
  4. Test authentication flows after update"
```

### Benefits
- ✅ **Complete Visibility**: Find all usage across projects
- ✅ **Impact Assessment**: Prioritize remediation
- ✅ **Quick Response**: Faster incident resolution
- ✅ **Audit Trail**: Document security updates

---

## Common Workflows

### Morning Routine
```bash
# Check yesterday's progress
c0ntextkeeper stats

# Review recent patterns
c0ntextkeeper patterns

# Start Claude Code
# (auto-loads relevant context automatically)
```

---

### Before Major Changes
```bash
# Search for related past work
c0ntextkeeper search "database migration"

# Review architectural decisions
c0ntextkeeper search "architecture decision" --limit 20

# Check patterns to follow
c0ntextkeeper patterns --type architecture
```

---

### During Code Review
```bash
# Find context for PR changes
c0ntextkeeper search "[feature-name]" --sort date

# Check if similar patterns exist
c0ntextkeeper patterns --type code
```

---

### End of Week
```bash
# Review week's progress
c0ntextkeeper search "$(date -v-7d +%Y-%m-%d)" --limit 50

# Check storage usage
c0ntextkeeper stats

# Cleanup old archives if needed
c0ntextkeeper cleanup --dry-run
```

---

## Tips for Maximum Value

### 1. Run `/compact` Regularly
```
✅ DO: /compact after completing features, fixing bugs, or making decisions
❌ DON'T: Wait until conversation is huge (lose granularity)
```

### 2. Use Descriptive Language
```
✅ DO: "Implement JWT authentication with refresh tokens"
❌ DON'T: "Add auth" (too vague for search)
```

### 3. Enable Relevant Hooks
```
# Minimal (80% value)
c0ntextkeeper setup  # Just PreCompact

# Enhanced (95% value)
c0ntextkeeper hooks enable stop  # Add Q&A knowledge

# Comprehensive (100% value)
c0ntextkeeper hooks enable posttooluse  # Add pattern tracking
```

### 4. Leverage Auto-Load
```
# Configure for your project size
c0ntextkeeper context configure --strategy smart
c0ntextkeeper context configure --max-size 15  # Increase for large projects
```

### 5. Use Specific Search Queries
```
✅ GOOD: "database connection pool error fix typescript"
❌ POOR: "error fix"
```

### 6. Review Patterns Weekly
```bash
# Every Friday
c0ntextkeeper patterns
c0ntextkeeper stats
```

---

## Measuring Impact

### Productivity Metrics

**Before c0ntextKeeper**:
- Time to recall past solutions: 15-30 minutes (searching code, git history)
- Context loss between sessions: ~80% (Claude forgets everything)
- Onboarding time: 1-2 weeks
- Repeated problem-solving: Common

**After c0ntextKeeper**:
- Time to recall past solutions: < 1 minute (search archive)
- Context retention: ~90% (auto-load at session start)
- Onboarding time: 3-4 days (self-service via archives)
- Repeated problem-solving: Rare (patterns detected)

**Time Savings**:
- Average: 30-60 minutes per day
- Per week: 2.5-5 hours
- Per year: 130-260 hours (3-6 weeks)

---

## See Also

- **[Quick Start](./quickstart.md)** - Get started in 60 seconds
- **[FEATURES.md](../FEATURES.md)** - Complete feature catalog
- **[Hooks Reference](../technical/hooks-reference.md)** - What hooks capture
- **[MCP Tools Guide](../technical/mcp-tools.md)** - Tool usage examples
- **[Configuration](../technical/configuration.md)** - Customize settings
