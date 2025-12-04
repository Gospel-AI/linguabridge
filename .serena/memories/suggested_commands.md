# Suggested Commands for LinguaBridge Development

## Frontend Commands (run from /frontend)
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint

# Formatting
npm run format

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
npm run test:ui       # Vitest UI
```

## Backend Commands (run from /backend)
```bash
# Development server
npm run dev

# Development with clean port
npm run dev:clean

# Build TypeScript
npm run build

# Start production
npm start

# Kill stuck port 3000
npm run kill-port

# Testing
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Utility scripts
npm run test:supabase # Test Supabase connection
npm run seed          # Seed database
npm run verify        # Verify data

# Linting & Formatting
npm run lint
npm run format
```

## Git Commands (Darwin/macOS)
```bash
git status            # Check status
git branch            # List branches
git checkout -b <name> # Create feature branch
git add .             # Stage all
git commit -m "msg"   # Commit
git push -u origin <branch> # Push new branch
```

## System Utilities (Darwin/macOS)
```bash
ls -la               # List files
cd <dir>             # Change directory
lsof -ti:3000        # Find process on port
kill -9 <pid>        # Kill process
```
