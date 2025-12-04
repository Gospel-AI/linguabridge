# Task Completion Checklist

## Before Committing

### Code Quality
- [ ] No TypeScript errors: `npm run build` passes
- [ ] No console errors in browser
- [ ] Linting passes: `npm run lint`
- [ ] Tests pass: `npm test`

### Functionality
- [ ] Feature works as expected
- [ ] Edge cases handled
- [ ] Mobile responsive (if frontend)
- [ ] Authentication works correctly

### For Frontend Changes
```bash
cd frontend
npm run lint
npm run build
npm test
```

### For Backend Changes
```bash
cd backend
npm run lint
npm run build
npm test
```

## Commit Message Format
```
type(scope): description

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
# feat(annotation): add NER annotation component
# fix(auth): handle token expiration correctly
# docs(readme): update development setup
```

## Before Merging
- [ ] Code reviewed
- [ ] All tests pass
- [ ] No merge conflicts
- [ ] Documentation updated if needed
