# Code Style & Conventions

## TypeScript
- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use explicit return types for functions
- No `any` unless absolutely necessary

## React Conventions
- Functional components with hooks
- Lazy loading for route components
- Use `memo()` for performance-critical components
- Named exports for components: `export const MyComponent = ...`

## File Naming
- React components: PascalCase (e.g., `TaskCard.tsx`)
- Utilities/services: camelCase (e.g., `authService.ts`)
- Types: lowercase with `.d.ts` or in `/types` directory
- Tests: `*.test.ts` or `*.test.tsx`

## Directory Structure
- `/components` - Reusable UI components
- `/pages` - Route-level components
- `/hooks` - Custom React hooks
- `/services` - API clients
- `/contexts` - React contexts
- `/types` - TypeScript type definitions
- `/utils` - Utility functions

## Backend Conventions
- Express routes in `/routes`
- Business logic in `/controllers`
- Middleware in `/middleware`
- External integrations in `/services`

## Import Order
1. React/Node built-ins
2. Third-party libraries
3. Internal aliases (@/)
4. Relative imports

## Comments
- Use JSDoc for exported functions
- Inline comments for complex logic only
- No obvious comments
