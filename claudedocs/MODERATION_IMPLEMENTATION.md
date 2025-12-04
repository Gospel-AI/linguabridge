# Content Moderation System - Phase 1 Implementation Guide

**Status**: ✅ Implementation Complete
**Date**: 2025-11-01
**Phase**: Phase 1 - Automated Validation & Reporting

---

## 📦 What Was Implemented

### 1. Core Moderation Service
**File**: `backend/src/middleware/contentModeration.ts`

**Features**:
- ✅ Keyword-based detection (7 categories)
- ✅ Pattern-based detection (7 patterns)
- ✅ Risk level assessment (critical, high, medium)
- ✅ Action determination (BLOCK, HOLD_FOR_REVIEW, WARN, ALLOW)
- ✅ Moderation logging

**Categories Covered**:
1. Illegal drugs
2. Weapons
3. Fraud & financial crimes
4. Privacy violations
5. Child safety (CRITICAL)
6. Violence & extremism
7. Intellectual property violations

**Patterns Detected**:
1. Unrealistic compensation
2. External contact attempts
3. Financial information requests (CRITICAL)
4. Direct payment mentions
5. Platform circumvention
6. Vague instructions
7. Excessive urgency

### 2. Database Schema
**File**: `backend/migrations/008_content_moderation.sql`

**Tables Created**:
- `moderation_queue` - Tasks requiring human review
- `moderation_logs` - Audit trail of all moderation actions
- `task_reports` - Community reports of problematic tasks

**Views Created**:
- `moderation_dashboard` - Admin view of moderation queue
- `reports_dashboard` - Admin view of reports

**Enhancements to Existing Tables**:
- Added moderation fields to `tasks` table:
  - `moderation_status`
  - `moderation_flags`
  - `moderation_warnings`
  - `moderation_reviewed_at`
  - `moderation_reviewed_by`

### 3. Reporting System
**Files**:
- `backend/src/routes/reports.ts` - API routes
- `backend/src/controllers/reports.ts` - Business logic

**Endpoints**:
```
POST   /api/reports              - Submit report
GET    /api/reports              - List user's reports
GET    /api/reports/:id          - Get report details
GET    /api/reports/admin/queue  - List all reports (admin)
POST   /api/reports/admin/:id/review - Review report (admin)
```

### 4. Integration
**Modified Files**:
- `backend/src/routes/tasks.ts` - Added moderation middleware to task creation
- `backend/src/index.ts` - Registered reports routes

---

## 🚀 How to Deploy

### Step 1: Run Database Migration

```bash
cd backend

# Make script executable
chmod +x run-moderation-migration.sh

# Run migration
./run-moderation-migration.sh
```

**Expected Output**:
```
🚀 Starting Content Moderation Migration...
📍 Project: your-project-ref

✅ Migration completed successfully!

📋 Created tables:
   - moderation_queue (for human review)
   - moderation_logs (audit trail)
   - task_reports (community reporting)
```

### Step 2: Restart Backend Server

```bash
# If running in development
npm run dev

# If running in production
npm start
```

### Step 3: Verify Installation

```bash
# Check health endpoint
curl http://localhost:3000/health

# Should return: {"status":"ok", ...}
```

---

## 🧪 Testing the Implementation

### Test 1: Basic Task Creation (Should Pass)

```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Translate product description",
    "description": "Please translate our product description from English to Japanese. We need a natural and culturally appropriate translation.",
    "domain_type": "translation",
    "budget": 25,
    "deadline": "2025-12-31T23:59:59Z"
  }'
```

**Expected**: ✅ Task created successfully

---

### Test 2: Blocked Task (Critical Violation)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Need bank account information",
    "description": "Please provide your bank account number and credit card details for payment processing.",
    "domain_type": "ai_verification",
    "budget": 50,
    "deadline": "2025-12-31T23:59:59Z"
  }'
```

**Expected**: ❌ 403 Forbidden
```json
{
  "error": "Task submission blocked",
  "reason": "Critical policy violation detected. This task contains content that is strictly prohibited on our platform.",
  "message": "..."
}
```

---

### Test 3: Task Held for Review (Suspicious)

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quick task - contact me directly",
    "description": "Please complete this task quickly. Contact me on WhatsApp at +1234567890 for details. Payment via PayPal.",
    "domain_type": "physical_data",
    "budget": 100,
    "deadline": "2025-12-31T23:59:59Z"
  }'
```

**Expected**: ⚠️ Task created but held for review
```json
{
  "message": "Your task has been submitted for review. Our moderation team will review it within 24 hours.",
  "task": {
    "id": "...",
    "status": "pending_review",
    "moderation_status": "under_review"
  }
}
```

---

### Test 4: Submit Report

```bash
# First, create a normal task and get its ID
TASK_ID="task_uuid_here"

# Submit report
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$TASK_ID'",
    "reason": "scam",
    "description": "This task appears to be a scam. The payment method seems suspicious and the task description is vague.",
    "evidence": ["screenshot_url", "message_url"]
  }'
```

**Expected**: ✅ Report created
```json
{
  "message": "Report submitted successfully",
  "report": {
    "id": "...",
    "task_id": "...",
    "reason": "scam",
    "status": "pending"
  }
}
```

---

### Test 5: Critical Report (Illegal Content)

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$TASK_ID'",
    "reason": "illegal",
    "description": "This task is requesting illegal activities.",
    "evidence": []
  }'
```

**Expected**: ✅ Report created + Task immediately suspended
```json
{
  "message": "Report submitted successfully",
  "report": {...}
}
```

**Side Effect**: Task status changed to "suspended"

---

### Test 6: View User Reports

```bash
curl -X GET "http://localhost:3000/api/reports?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected**: ✅ List of user's reports
```json
{
  "reports": [...],
  "total": 2,
  "limit": 10,
  "offset": 0
}
```

---

### Test 7: Admin - View All Reports

```bash
# Requires admin token
ADMIN_TOKEN="admin_jwt_token"

curl -X GET "http://localhost:3000/api/reports/admin/queue?status=pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected**: ✅ List of all pending reports

---

### Test 8: Admin - Review Report

```bash
REPORT_ID="report_uuid_here"

curl -X POST "http://localhost:3000/api/reports/admin/$REPORT_ID/review" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "suspend_task",
    "notes": "Confirmed violation of content policy. Task suspended and user warned."
  }'
```

**Expected**: ✅ Report reviewed, task suspended

---

## 📊 Monitoring & Analytics

### Check Moderation Queue

```sql
-- Connect to Supabase SQL Editor

-- View pending reviews
SELECT * FROM moderation_dashboard
WHERE review_status = 'pending'
ORDER BY flagged_at DESC;

-- View moderation statistics
SELECT
  DATE(flagged_at) as date,
  COUNT(*) as total_flagged,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM moderation_queue
GROUP BY DATE(flagged_at)
ORDER BY date DESC;
```

### Check Report Statistics

```sql
-- View report statistics
SELECT
  reason,
  COUNT(*) as total_reports,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
FROM task_reports
GROUP BY reason
ORDER BY total_reports DESC;

-- View critical reports
SELECT * FROM reports_dashboard
WHERE reason = 'illegal'
AND report_status IN ('pending', 'investigating')
ORDER BY reported_at DESC;
```

---

## 🔍 Troubleshooting

### Issue: Migration Fails

**Symptoms**: Error when running migration script

**Solutions**:
1. Check environment variables:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_SERVICE_KEY
   ```

2. Verify database connection:
   ```bash
   psql "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" -c "\dt"
   ```

3. Check for existing tables:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_name IN ('moderation_queue', 'task_reports', 'moderation_logs');
   ```

---

### Issue: Task Not Blocked Despite Violation

**Symptoms**: Task with prohibited keywords gets approved

**Debugging**:
1. Check moderation logs:
   ```sql
   SELECT * FROM moderation_logs
   WHERE task_id = 'task_uuid'
   ORDER BY created_at DESC;
   ```

2. Review flags detected:
   ```sql
   SELECT flags FROM moderation_logs
   WHERE task_id = 'task_uuid';
   ```

3. Update keywords if needed (edit `contentModeration.ts`)

---

### Issue: False Positives

**Symptoms**: Legitimate tasks getting flagged

**Solutions**:
1. Review flagged content:
   ```sql
   SELECT
     t.title,
     t.description,
     mq.flags,
     mq.ai_confidence
   FROM moderation_queue mq
   JOIN tasks t ON mq.task_id = t.id
   WHERE mq.status = 'pending'
   ORDER BY mq.flagged_at DESC;
   ```

2. Adjust detection thresholds in `contentModeration.ts`

3. Manually approve false positives:
   ```sql
   UPDATE moderation_queue
   SET status = 'approved',
       reviewed_by = 'admin_uuid',
       reviewed_at = NOW(),
       review_notes = 'False positive - legitimate task'
   WHERE id = 'queue_item_uuid';

   UPDATE tasks
   SET moderation_status = 'approved',
       status = 'open'
   WHERE id = 'task_uuid';
   ```

---

## 📈 Next Steps (Phase 2)

### To Be Implemented in Month 2-3:

1. **AI-Based Moderation** (OpenAI Moderation API)
   - More accurate detection
   - Multi-language support
   - Cost: ~$5/month

2. **Human Review Dashboard** (Frontend)
   - Admin interface for review queue
   - One-click approve/reject
   - Bulk actions

3. **Email Notifications**
   - Alert admins of critical reports
   - Notify users of task status changes
   - Daily/weekly moderation summaries

4. **Enhanced Reporting**
   - File upload for evidence
   - Anonymous reporting option
   - Follow-up system

---

## 🎯 Success Metrics

Track these metrics weekly:

```sql
-- Weekly moderation report
SELECT
  'Blocked' as action,
  COUNT(*) as count
FROM moderation_logs
WHERE action = 'BLOCK'
  AND created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'Held for Review' as action,
  COUNT(*)
FROM moderation_logs
WHERE action = 'HOLD_FOR_REVIEW'
  AND created_at >= NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'Reports Submitted' as action,
  COUNT(*)
FROM task_reports
WHERE created_at >= NOW() - INTERVAL '7 days';
```

**Target Metrics**:
- Block rate: < 2% of total submissions
- False positive rate: < 5% of blocked tasks
- Report response time: < 24 hours average
- Critical report response time: < 2 hours

---

## 📞 Support

For questions or issues with the moderation system:

1. Check logs: `backend/logs/` (if configured)
2. Review Supabase logs: Supabase Dashboard → Logs
3. Contact platform administrator

**Emergency**: For critical violations (child safety, terrorism), contact immediately via [emergency email]

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-01 | 1.0 | Phase 1 implementation complete |
