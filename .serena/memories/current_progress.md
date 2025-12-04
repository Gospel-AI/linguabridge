# LinguaBridge - Current Progress

## Last Updated: 2025-12-04

## Session Summary

### Completed Tasks

#### 1. Local Development Mode Authentication
- **Status**: ✅ Complete
- **Files Modified**:
  - `frontend/src/services/apiClient.ts` - Local mode token (`local_{userId}`)
  - `frontend/src/contexts/AuthContext.tsx` - LOCAL_USERS array, signInLocal function
  - `frontend/src/pages/Login.tsx` - Local mode user selection UI
  - `backend/src/middleware/auth.ts` - Local token handling

#### 2. Database Table Compatibility
- **Status**: ✅ Complete
- **Issue**: `tasks` table doesn't exist (only `annotation_tasks`)
- **Fix**: Added table existence check in controllers
- **Files Modified**:
  - `backend/src/controllers/tasks.ts` - Table existence check, return empty array
  - `backend/src/controllers/applications.ts` - Same fix applied

#### 3. ProjectList.tsx Error Fix
- **Status**: ✅ Complete
- **Issue**: `TypeError: project.price_per_task.toFixed is not a function`
- **Cause**: PostgreSQL returns price_per_task as string
- **Fix**: `Number(project.price_per_task ?? 0).toFixed(2)`
- **File**: `frontend/src/pages/annotation/ProjectList.tsx:166`

#### 4. Sample Data Population
- **Status**: ✅ Complete
- **Details**: 50 annotation projects added to database
  - Classification: 10 projects
  - NER: 10 projects
  - Ranking (RLHF): 10 projects
  - Evaluation: 10 projects
  - Translation Validation: 10 projects
- **Languages**: EN, JA, HA, YO, IG, PCM (Nigerian Pidgin)

## Local Test Users

| ID | Email | Role |
|----|-------|------|
| 11111111-1111-1111-1111-111111111111 | admin@linguabridge.com | admin |
| 22222222-2222-2222-2222-222222222222 | client@example.com | client |
| 33333333-3333-3333-3333-333333333333 | annotator1@example.com | annotator |
| 44444444-4444-4444-4444-444444444444 | annotator2@example.com | annotator |

## Development Environment

### Docker Services
- PostgreSQL: localhost:5434
- Backend: localhost:3000
- Frontend: localhost:5173

### Key Environment Variables
- `USE_LOCAL_DB=true` (backend)
- `VITE_USE_LOCAL_MODE=true` (frontend)

## Next Steps (Pending)

1. Add sample `annotation_tasks` for projects
2. Implement annotation UI components
3. Test end-to-end annotation workflow
4. Add quality control features (gold standards, IAA)

## Known Issues

- None currently blocking

## Architecture Notes

### Authentication Flow (Local Mode)
1. User selects local user on login page
2. Frontend stores `linguabridge_local_user` in localStorage
3. apiClient sends `local_{userId}` as Bearer token
4. Backend auth middleware validates local token
5. req.user populated with local user info

### Database Schema
- `annotation_projects` - Project definitions
- `annotation_tasks` - Individual tasks for annotation
- `annotations` - Submitted annotations
- `annotator_profiles` - Annotator capabilities and stats
