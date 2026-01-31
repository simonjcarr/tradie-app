# Testing

## Quick Reference

**For ALL Convex backend tests:**
- ✅ ALWAYS use `convexTest(schema)` - Creates fresh database per test
- ✅ ALWAYS use `withIdentity({ subject: "user_id" })` - Mocks authentication
- ❌ NEVER use real Clerk API calls
- ❌ NEVER mock `ctx.auth.getUserIdentity()` directly

```typescript
// Every test should follow this pattern:
const t = convexTest(schema);
const asUser = t.withIdentity({ subject: "user_123" });
```

## Build Verification
After every change, build the project and fix any errors you find.

```bash
npm run build
```

## Test-Driven Development (TDD) Workflow

We follow TDD best practices for all new features and bug fixes:

### TDD Process

1. **Write the test first** - Before writing any implementation code, write a failing test that describes the desired behavior
2. **Run the test** - Verify the test fails for the right reason (Red)
3. **Write minimal code** - Write just enough code to make the test pass (Green)
4. **Run all tests** - Ensure the new code doesn't break existing functionality
5. **Refactor** - Clean up the code while keeping all tests passing (Refactor)
6. **Repeat** - Continue the Red-Green-Refactor cycle

### TDD Best Practices

- **One test at a time** - Focus on one behavior per test
- **Small steps** - Make incremental changes, don't try to implement everything at once
- **Test behavior, not implementation** - Focus on what the code does, not how it does it
- **Descriptive test names** - Use "should..." format that describes the expected behavior
- **Keep tests isolated** - Each test should be independent and not rely on other tests
- **Test edge cases** - Include tests for error conditions, boundary values, and invalid input
- **Fast tests** - Tests should run quickly to encourage frequent execution

### When to Write Tests

- **Always before new features** - Write tests first, then implement
- **Always before bug fixes** - Write a failing test that reproduces the bug, then fix it
- **Before refactoring** - Ensure existing behavior is covered by tests before making changes
- **Complex logic** - Any non-trivial business logic should have comprehensive test coverage

## Testing Framework

We use **Vitest** + **convex-test** for testing Convex backend functions.

### Critical Testing Requirements

**IMPORTANT: When testing Convex functions, you MUST:**

1. **ALWAYS use `convex-test`** - This is the official Convex testing library
   ```typescript
   import { convexTest } from "convex-test";
   const t = convexTest(schema);
   ```

2. **ALWAYS use `withIdentity()` for authentication** - Never use real Clerk API calls in tests
   ```typescript
   const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });
   ```

3. **NEVER mock `ctx.auth.getUserIdentity()`** - Use `withIdentity()` instead, which properly mocks the entire auth flow

4. **Each test gets a fresh database** - Call `convexTest(schema)` at the start of each test for complete isolation

**Why these requirements?**
- `convex-test` provides fresh, isolated databases per test (no test pollution)
- `withIdentity()` simulates authentication without external API calls (fast, deterministic tests)
- Tests are completely isolated from production Clerk configuration
- No network calls = fast, reliable tests that work offline

### Running Tests

```bash
# Watch mode (recommended during development)
npm test

# Run once (for CI/CD or verification)
npm run test:once

# Interactive UI
npm run test:ui
```

### Test File Structure

- Test files live alongside the code they test
- Use `.test.ts` or `.test.tsx` extension
- Import pattern: `convexTest`, `describe`, `expect`, `it`, `api`, `schema`

Example location: `convex/tasks.test.ts` for testing `convex/tasks.ts`

### Writing Tests for Convex Functions

**ALWAYS start every test with `convexTest(schema)` to get a fresh, isolated database:**

```typescript
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

describe("feature name", () => {
  it("should describe expected behavior", async () => {
    // Step 1: ALWAYS create fresh test instance with convexTest
    const t = convexTest(schema);

    // Step 2: ALWAYS use withIdentity for authenticated users
    const asUser = t.withIdentity({ subject: "user_123", name: "Test User" });

    // Step 3: Execute the function being tested
    const result = await asUser.mutation(api.module.function, {
      /* args */
    });

    // Step 4: Verify the expected outcome
    expect(result).toBeDefined();
  });
});
```

**Required imports for every Convex test file:**
```typescript
import { convexTest } from "convex-test";  // REQUIRED - creates test instance
import { describe, expect, it } from "vitest";  // REQUIRED - test framework
import { api } from "./_generated/api";  // REQUIRED - your Convex functions
import schema from "./schema";  // REQUIRED - your database schema
```

### Testing Patterns

**Authentication in Tests** - ALWAYS use `withIdentity()`:
```typescript
// CORRECT: Use withIdentity() for authenticated tests
const asUser = t.withIdentity({ subject: "user_id", name: "Test User" });
await asUser.query(api.tasks.getTasks, {});

// WRONG: Never call t.query() or t.mutation() directly if auth is required
// await t.query(api.tasks.getTasks, {});  // ❌ This will fail auth checks

// CORRECT: For testing unauthenticated access (should throw error)
await expect(async () => {
  await t.query(api.tasks.getTasks, {});
}).rejects.toThrowError();
```

**Test Multiple Users** (for authorization tests):
```typescript
// Create separate identities for different users
const alice = t.withIdentity({ subject: "alice_id", name: "Alice" });
const bob = t.withIdentity({ subject: "bob_id", name: "Bob" });

// Alice creates a task
const taskId = await alice.mutation(api.tasks.createTask, {
  text: "Alice's task"
});

// Bob cannot delete Alice's task
await expect(async () => {
  await bob.mutation(api.tasks.deleteTask, { id: taskId });
}).rejects.toThrowError("Unauthorized");
```

**Direct Database Access** (for test setup):
```typescript
await t.run(async (ctx) => {
  await ctx.db.insert("tasks", { /* data */ });
});
```

**Test Errors and Authorization**:
```typescript
await expect(async () => {
  await t.query(api.module.function, {});
}).rejects.toThrowError("Expected error message");
```

### Test Coverage Requirements

- **All mutations** must have tests covering:
  - Successful operation
  - Authentication requirements
  - Authorization (users can only access their own data)
  - Error conditions

- **All queries** must have tests covering:
  - Successful data retrieval
  - Authentication requirements
  - Data filtering (users see only their data)
  - Empty results

- **Edge cases** to always test:
  - Unauthenticated access
  - Unauthorized access (wrong user)
  - Invalid input
  - Missing or deleted resources
  - Boundary conditions

### Test Organization

Group related tests using `describe` blocks:

```typescript
describe("task management", () => {
  describe("createTask", () => {
    it("should create task for authenticated user", async () => {});
    it("should require authentication", async () => {});
  });

  describe("deleteTask", () => {
    it("should delete user's own task", async () => {});
    it("should prevent deleting other user's task", async () => {});
  });
});
```

### TDD Workflow Example

When adding a new feature like "archive task":

1. **Write failing test first**:
```typescript
it("should archive a task", async () => {
  const t = convexTest(schema);
  const asUser = t.withIdentity({ subject: "user_123" });

  const taskId = await asUser.mutation(api.tasks.createTask, {
    text: "Task to archive"
  });

  await asUser.mutation(api.tasks.archiveTask, { id: taskId });

  const tasks = await asUser.query(api.tasks.getTasks, {});
  expect(tasks[0].isArchived).toBe(true);
});
```

2. **Run test** - It will fail because `archiveTask` doesn't exist yet
3. **Implement minimal code** - Add the `archiveTask` mutation
4. **Run tests** - Verify it passes
5. **Refactor if needed** - Clean up while keeping tests green

## Continuous Testing

- Run tests in watch mode during development: `npm test`
- All tests must pass before committing code
- Build must succeed before committing: `npm run build`
- Tests run automatically in CI/CD pipeline

# Git Rules
- Before creating code, switch to development branch and check for updates.
- Create a feature branch from development for each new feature or bug fix.
- Commit changes with clear messages.
- Push feature branch to remote repository.
- Open a pull request to merge feature branch into development using gh CLI
- Do a code review of the pull request.
- Merge the pull request into the development branch if the code review does not find any issues.
- If the code review finds issues, address them and push the changes to the feature branch.
- After merging the pull request, delete the feature branch both locally and remotely.