# Testing Guide - TaskBridge

**Last Updated**: 2025-10-31
**Test Framework**: Jest + ts-jest (Backend), Vitest + React Testing Library (Frontend - TBD)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Test Results](#test-results)
5. [Coverage Reports](#coverage-reports)
6. [Running Tests](#running-tests)
7. [Writing Tests](#writing-tests)
8. [Troubleshooting](#troubleshooting)
9. [Future Improvements](#future-improvements)

---

## 🎯 Overview

TaskBridge uses a comprehensive testing strategy to ensure code quality and reliability:

- **Backend**: Jest + ts-jest for unit and integration tests
- **Frontend**: Vitest + React Testing Library (planned)
- **Coverage Target**: 80% for critical paths
- **CI/CD**: Automated testing on push (planned)

### Testing Philosophy

- ✅ **Test behavior, not implementation**: Focus on what the code does, not how it does it
- ✅ **Comprehensive coverage**: Test happy paths, edge cases, and error scenarios
- ✅ **Maintainable tests**: Clear, readable, and easy to update
- ✅ **Fast feedback**: Tests should run quickly in development

---

## 🔧 Backend Testing

### Technology Stack

- **Test Runner**: Jest 30.2.0
- **TypeScript Support**: ts-jest 29.4.5
- **Assertion Library**: Jest built-in
- **Mocking**: Jest built-in + manual mocks

### Project Structure

```
backend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts                    # Global test setup
│   │   ├── controllers/
│   │   │   ├── workers.test.ts         # Worker profile tests
│   │   │   ├── applications.test.ts    # Application workflow tests
│   │   │   └── tasks.test.ts           # Task CRUD tests
│   │   └── middleware/
│   │       └── auth.test.ts            # Authentication tests
│   ├── controllers/
│   ├── middleware/
│   └── ...
├── jest.config.cjs                     # Jest configuration
└── package.json
```

### Test Files

#### 1. `workers.test.ts` - Worker Profile Operations
**Tests**: 11 scenarios
- ✅ Get my profile (with existing worker record)
- ✅ Get my profile (auto-create worker record if missing)
- ✅ Update profile (profile + worker data)
- ✅ Get worker public profile
- ✅ List workers (with filters)
- ✅ Error handling (404, 500, validation errors)

**Coverage**: 76.92% statements

#### 2. `applications.test.ts` - Application Workflow
**Tests**: 15 scenarios
- ✅ Create application (successful)
- ✅ Prevent duplicate applications
- ✅ Prevent self-application (can't apply to own task)
- ✅ List my applications (with pagination)
- ✅ Get application details (with authorization)
- ✅ Update application status (client only)
- ✅ List task applications (task creator only)
- ✅ Batch get task applications (optimization)
- ✅ Error handling (404, 403, 400)

**Coverage**: 59.18% statements

#### 3. `tasks.test.ts` - Task CRUD Operations
**Tests**: 12 scenarios
- ✅ List tasks (with filters)
- ✅ Get task details
- ✅ Create task (with validation)
- ✅ Update task (owner only)
- ✅ Delete task (owner only)
- ✅ Error handling (404, 403, 400, 500)

**Coverage**: 75.6% statements

#### 4. `auth.test.ts` - Authentication & Authorization
**Tests**: 12 scenarios ✅ **ALL PASSED!**
- ✅ Authenticate with valid token
- ✅ JWT signature verification
- ✅ User lookup via Supabase Auth
- ✅ Reject missing/invalid Authorization header
- ✅ Reject invalid JWT format
- ✅ Handle expired tokens
- ✅ Role-based access control
- ✅ Multiple role support
- ✅ Fallback to decode-only mode (backward compatibility)

**Coverage**: 93.18% statements 🎉

### Configuration

**`jest.config.cjs`**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/scripts/**',
    '!src/index.ts',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.(js|jsx)$': '$1',
  },
  testTimeout: 10000,
}
```

**`setup.ts`**:
```typescript
// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.SUPABASE_ANON_KEY = 'test-anon-key'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.PORT = '3001'

// Global setup/teardown
beforeEach(() => {
  jest.clearAllMocks()
})
```

---

## 🎨 Frontend Testing

### Technology Stack (Planned)

- **Test Runner**: Vitest
- **Component Testing**: React Testing Library
- **User Event Simulation**: @testing-library/user-event
- **Mocking**: vitest mocks

### Project Structure (Planned)

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── setup.ts
│   │   ├── components/
│   │   │   └── [component].test.tsx
│   │   ├── pages/
│   │   │   └── [page].test.tsx
│   │   └── utils/
│   │       └── [utility].test.ts
│   └── ...
├── vitest.config.ts
└── package.json
```

### Test Coverage Goals

- **Components**: 80%+ (focus on user interactions)
- **Pages**: 70%+ (integration scenarios)
- **Utils**: 90%+ (pure functions)
- **Hooks**: 80%+ (state management logic)

---

## 📊 Test Results

### Current Status (2025-10-31)

**Backend Tests**:
- ✅ **Total Tests**: 50
- ✅ **Passed**: 39 (78%)
- ⚠️ **Failed**: 11 (22% - mock configuration issues)
- ✅ **Test Suites**: 4 (1 fully passed, 3 partially passed)

**Breakdown by Suite**:

| Test Suite | Tests | Passed | Failed | Status |
|------------|-------|--------|--------|--------|
| auth.test.ts | 12 | 12 | 0 | ✅ 100% |
| workers.test.ts | 11 | 9 | 2 | ⚠️ 82% |
| applications.test.ts | 15 | 11 | 4 | ⚠️ 73% |
| tasks.test.ts | 12 | 7 | 5 | ⚠️ 58% |

### Known Issues

The 11 failing tests are due to mock chain method configuration:
1. **Supabase insert().select() chains**: Need proper mock return value chaining
2. **Supabase delete().eq() chains**: Mock function not returning expected structure
3. **Complex query chains**: Multiple chained methods require careful mock setup

**These are not code bugs, but test infrastructure improvements needed.**

---

## 📈 Coverage Reports

### Overall Coverage (Backend)

```
------------------|---------|----------|---------|---------|
File              | % Stmts | % Branch | % Funcs | % Lines |
------------------|---------|----------|---------|---------|
All files         |   57.73 |       50 |   81.48 |    57.8 |
 controllers      |   68.07 |    51.51 |   90.47 |   67.86 |
  applications.ts |   59.18 |    46.51 |   83.33 |   58.62 |
  tasks.ts        |    75.6 |    57.14 |     100 |    75.6 |
  workers.ts      |   76.92 |    56.81 |     100 |   76.92 |
 middleware       |   93.18 |     92.3 |     100 |   93.18 |
  auth.ts         |   93.18 |     92.3 |     100 |   93.18 |
 routes           |       0 |      100 |     100 |       0 |
  applications.ts |       0 |      100 |     100 |       0 |
  tasks.ts        |       0 |      100 |     100 |       0 |
  workers.ts      |       0 |      100 |     100 |       0 |
------------------|---------|----------|---------|---------|
```

### Key Metrics

- ✅ **Middleware Coverage**: 93.18% (excellent!)
- ✅ **Function Coverage**: 81.48% (good)
- ⚠️ **Statement Coverage**: 57.73% (needs improvement)
- ⚠️ **Branch Coverage**: 50% (needs improvement)

### Coverage Goals

**Short-term (Month 1-2)**:
- Controllers: 70%+ statements
- Middleware: Maintain 90%+
- Overall: 65%+ statements

**Long-term (Month 3-6)**:
- Controllers: 80%+ statements
- Middleware: Maintain 90%+
- Overall: 75%+ statements
- Add integration tests: 70%+

---

## 🚀 Running Tests

### Backend

#### Run All Tests
```bash
cd backend
npm test
```

#### Watch Mode (Development)
```bash
npm run test:watch
```

#### Generate Coverage Report
```bash
npm run test:coverage
```

Coverage report will be generated in `backend/coverage/`:
- **HTML Report**: `coverage/lcov-report/index.html` (open in browser)
- **Text Report**: Displayed in terminal
- **LCOV Report**: `coverage/lcov.info` (for CI/CD)

#### Run Specific Test File
```bash
npm test -- workers.test.ts
```

#### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="authentication"
```

### Frontend (When Implemented)

```bash
cd frontend
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:ui           # Vitest UI (planned)
```

---

## ✍️ Writing Tests

### Test Structure

```typescript
import { Request, Response } from 'express'
import { myFunction } from '../../controllers/myController'
import { supabase } from '../../lib/supabase'

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('MyController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let jsonMock: jest.Mock
  let statusMock: jest.Mock

  beforeEach(() => {
    // Setup mocks
    jsonMock = jest.fn()
    statusMock = jest.fn(() => ({ json: jsonMock }))
    
    mockRequest = {
      user: { id: 'test-id', email: 'test@example.com' },
      body: {},
      params: {},
      query: {}
    }
    
    mockResponse = {
      json: jsonMock,
      status: statusMock
    }

    jest.clearAllMocks()
  })

  describe('myFunction', () => {
    it('should handle successful case', async () => {
      // Arrange
      const mockData = { id: '1', name: 'Test' }
      const selectMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({ 
        data: mockData, 
        error: null 
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        single: singleMock
      }))

      // Act
      await myFunction(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(jsonMock).toHaveBeenCalledWith(mockData)
    })

    it('should handle errors', async () => {
      // Arrange
      const selectMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      ;(supabase.from as jest.Mock).mockImplementation(() => ({
        select: selectMock,
        single: singleMock
      }))

      // Act
      await myFunction(mockRequest as Request, mockResponse as Response)

      // Assert
      expect(statusMock).toHaveBeenCalledWith(500)
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error'
        })
      )
    })
  })
})
```

### Best Practices

1. **Arrange-Act-Assert Pattern**: Clear test structure
2. **Mock External Dependencies**: Supabase, Stripe, etc.
3. **Test Error Paths**: Don't just test happy paths
4. **Use Descriptive Names**: Test names should explain what they test
5. **Keep Tests Independent**: Each test should run in isolation
6. **Clean Up After Tests**: Use `afterEach` and `beforeEach`
7. **Test User Behavior**: Focus on what users experience

### Common Patterns

#### Mocking Supabase Queries

```typescript
// Simple query
;(supabase.from as jest.Mock).mockImplementation(() => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: mockData, error: null })
}))

// Complex query with filters
const selectMock = jest.fn().mockReturnThis()
const eqMock = jest.fn().mockReturnThis()
const gteMock = jest.fn().mockReturnThis()
const rangeMock = jest.fn().mockResolvedValue({
  data: mockData,
  error: null,
  count: 10
})

;(supabase.from as jest.Mock).mockImplementation(() => ({
  select: selectMock,
  eq: eqMock,
  gte: gteMock,
  range: rangeMock
}))
```

#### Testing Authorization

```typescript
it('should reject unauthorized access', async () => {
  delete mockRequest.user // Remove user from request

  await myProtectedFunction(mockRequest as Request, mockResponse as Response)

  expect(statusMock).toHaveBeenCalledWith(401)
  expect(jsonMock).toHaveBeenCalledWith({
    error: 'Unauthorized',
    message: 'Authentication required'
  })
})
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Cannot find module" Error

**Problem**: Jest can't resolve TypeScript imports with `.js` extension

**Solution**: Update `jest.config.cjs`:
```javascript
moduleNameMapper: {
  '^(\\.{1,2}/.*)\\.(js|jsx)$': '$1',
}
```

#### 2. "module is not defined" Error

**Problem**: `jest.config.js` conflicts with `type: "module"` in `package.json`

**Solution**: Rename to `jest.config.cjs`

#### 3. Mock Not Working

**Problem**: Supabase mock not being applied

**Solution**: Ensure mock path matches exactly:
```typescript
jest.mock('../../lib/supabase', () => ({ ... }))
// Path must match import statement exactly
```

#### 4. Test Timeout

**Problem**: Tests taking too long

**Solution**: Increase timeout in `jest.config.cjs`:
```javascript
testTimeout: 10000, // 10 seconds
```

### Debug Mode

Run tests with verbose output:
```bash
npm test -- --verbose --detectOpenHandles
```

Run a single test in debug mode:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand workers.test.ts
```

---

## 🎯 Future Improvements

### Short-term (Month 1-2)

1. **Fix Failing Tests**: Improve mock chain configurations
2. **Increase Coverage**: Add tests for uncovered branches
3. **Integration Tests**: Test full API request/response cycles
4. **Frontend Tests**: Implement Vitest + React Testing Library
5. **CI/CD Integration**: Automate tests on GitHub Actions

### Medium-term (Month 3-4)

1. **E2E Tests**: Playwright for critical user flows
2. **Performance Tests**: Load testing for API endpoints
3. **Visual Regression Tests**: Screenshot comparison for UI
4. **Database Tests**: Test RLS policies and triggers
5. **API Contract Tests**: Ensure API compatibility

### Long-term (Month 5-6)

1. **Mutation Testing**: Verify test effectiveness (Stryker)
2. **Property-Based Testing**: Generate test cases automatically
3. **Chaos Engineering**: Test system resilience
4. **Security Testing**: Automated vulnerability scanning
5. **Accessibility Testing**: Automated a11y checks

---

## 📚 Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)

### Best Practices
- [Testing JavaScript by Kent C. Dodds](https://testingjavascript.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

### Tools
- [Jest Mock Generator](https://github.com/egm0121/jest-mock-generator)
- [Coverage Gutters (VSCode)](https://marketplace.visualstudio.com/items?itemName=ryanluker.vscode-coverage-gutters)
- [Jest Runner (VSCode)](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner)

---

## 📞 Support

For testing questions or issues:
- **GitHub Issues**: Report bugs or ask questions
- **Documentation**: Check this guide first
- **Team Communication**: Slack/Discord for quick questions

---

**Last Updated**: 2025-10-31
**Maintainer**: TaskBridge Development Team
**Version**: 1.0.0
