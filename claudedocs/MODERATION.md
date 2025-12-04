# Content Moderation System

**Purpose**: Multi-layered defense architecture to detect and prevent illegal/fraudulent tasks on TaskBridge platform

**Version**: 1.1
**Last Updated**: 2025-11-01
**Status**: Phase 1 Implementation Complete

## 📚 Documentation Index

- **[Risk Level Classification](./MODERATION_RISK_LEVELS.md)** - Detailed risk level definitions, upgrade rationale, and decision matrix
- **[Implementation Guide](./MODERATION_IMPLEMENTATION.md)** - Technical implementation details and test cases
- **[Legal Compliance (EN)](./LEGAL_COMPLIANCE.md)** - Legal procedures and incident response (English)
- **[Legal Compliance (JP)](./LEGAL_COMPLIANCE.jp.md)** - Legal procedures and incident response (Japanese)

---

## 🛡️ Architecture Overview

TaskBridge employs a **5-layer defense-in-depth strategy** to ensure platform safety:

```
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Continuous Monitoring (Pattern Detection)      │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Community Reporting (Worker + Company Reports) │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Human Review Queue (Manual Verification)       │
├─────────────────────────────────────────────────────────┤
│ Layer 2: AI-Based Moderation (OpenAI Moderation API)   │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Automated Validation (Keyword + Pattern)       │
└─────────────────────────────────────────────────────────┘
```

---

## Layer 1: Automated Validation (Phase 1)

### Prohibited Content Categories

```typescript
interface ProhibitedCategories {
  illegal_activities: string[];      // Drugs, weapons, counterfeiting
  fraud_schemes: string[];           // Scams, money laundering
  harmful_content: string[];         // Violence, hate speech
  privacy_violations: string[];      // Data theft, stalking
  child_safety: string[];            // Child exploitation
  platform_circumvention: string[];  // External contact requests
}
```

### Detection Patterns

**1. Keyword-Based Filtering**
```yaml
prohibited_keywords:
  drugs:
    - cocaine, heroin, methamphetamine, fentanyl
    - drug dealing, narcotics, illegal substances

  weapons:
    - illegal weapons, firearms, explosives
    - ammunition, bomb making

  fraud:
    - money laundering, fake documents, counterfeit
    - pyramid scheme, ponzi scheme
    - stolen credit cards, fraudulent accounts

  privacy_violations:
    - hack account, steal data, spy on
    - illegal surveillance, stalking
    - personal information theft

  child_safety:
    - underage, child exploitation
    - inappropriate content involving minors

  platform_circumvention:
    - contact me at, whatsapp, telegram
    - direct payment, paypal me, venmo
    - bypass platform, off-platform
```

**2. Pattern Matching**
```typescript
interface SuspiciousPatterns {
  unrealistic_compensation: {
    condition: 'budget > $500 AND estimated_time < 30min',
    risk_level: 'high',
    action: 'hold_for_review'
  };

  external_contact_request: {
    condition: 'description contains contact methods',
    risk_level: 'high',
    action: 'hold_for_review'
  };

  financial_information_request: {
    condition: 'requests bank/credit card/SSN/passport',
    risk_level: 'critical',
    action: 'block'
  };

  vague_instructions: {
    condition: 'description < 50 chars OR no clear deliverables',
    risk_level: 'medium',
    action: 'warn_company'
  };
}
```

### Implementation

**File**: `backend/src/middleware/contentModeration.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

interface ModerationResult {
  allowed: boolean;
  action: 'ALLOW' | 'BLOCK' | 'HOLD_FOR_REVIEW' | 'WARN';
  flags: string[];
  reason?: string;
  confidence: number;
}

export class ContentModerationService {
  private prohibitedKeywords: Map<string, string[]>;

  constructor() {
    this.initializeKeywords();
  }

  async moderateTaskSubmission(taskData: any): Promise<ModerationResult> {
    const flags: string[] = [];
    let highestRiskLevel = 0;

    const content = `${taskData.title} ${taskData.description}`.toLowerCase();

    // 1. Keyword Detection
    const keywordFlags = this.detectProhibitedKeywords(content);
    flags.push(...keywordFlags);

    // 2. Pattern Detection
    const patternFlags = this.detectSuspiciousPatterns(taskData, content);
    flags.push(...patternFlags);

    // 3. Determine Action
    if (flags.some(f => f.startsWith('critical:'))) {
      return {
        allowed: false,
        action: 'BLOCK',
        flags,
        reason: 'Critical policy violation detected',
        confidence: 0.95
      };
    }

    if (flags.some(f => f.startsWith('high:'))) {
      return {
        allowed: false,
        action: 'HOLD_FOR_REVIEW',
        flags,
        reason: 'Suspicious content requires manual review',
        confidence: 0.80
      };
    }

    if (flags.some(f => f.startsWith('medium:'))) {
      return {
        allowed: true,
        action: 'WARN',
        flags,
        reason: 'Minor issues detected, proceed with caution',
        confidence: 0.60
      };
    }

    return {
      allowed: true,
      action: 'ALLOW',
      flags: [],
      confidence: 1.0
    };
  }

  private detectProhibitedKeywords(content: string): string[] {
    const flags: string[] = [];

    // Check each category
    for (const [category, keywords] of this.prohibitedKeywords.entries()) {
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          const riskLevel = this.getRiskLevel(category);
          flags.push(`${riskLevel}:prohibited_keyword:${category}:${keyword}`);
        }
      }
    }

    return flags;
  }

  private detectSuspiciousPatterns(taskData: any, content: string): string[] {
    const flags: string[] = [];

    // Unrealistic compensation
    if (taskData.budget > 500 && taskData.estimated_time < 30) {
      flags.push('high:unrealistic_compensation');
    }

    // External contact attempt
    const contactPatterns = /whatsapp|telegram|signal|contact me at|email me|call me/i;
    if (contactPatterns.test(content)) {
      flags.push('high:external_contact_request');
    }

    // Financial information request
    const financialPatterns = /bank account|credit card|ssn|social security|passport number|driver license/i;
    if (financialPatterns.test(content)) {
      flags.push('critical:financial_info_request');
    }

    // Direct payment mention
    const paymentPatterns = /paypal|venmo|cash app|zelle|bitcoin|crypto wallet/i;
    if (paymentPatterns.test(content)) {
      flags.push('high:direct_payment_request');
    }

    // Vague instructions
    if (taskData.description.length < 50) {
      flags.push('medium:vague_instructions');
    }

    return flags;
  }

  private getRiskLevel(category: string): string {
    const criticalCategories = ['child_safety', 'illegal_activities'];
    const highCategories = ['fraud_schemes', 'privacy_violations'];

    if (criticalCategories.includes(category)) return 'critical';
    if (highCategories.includes(category)) return 'high';
    return 'medium';
  }

  private initializeKeywords(): void {
    this.prohibitedKeywords = new Map([
      ['illegal_activities', [
        'cocaine', 'heroin', 'methamphetamine', 'fentanyl', 'drug dealing',
        'illegal weapons', 'firearms', 'explosives', 'bomb making',
        'counterfeit', 'fake documents', 'forged passport'
      ]],
      ['fraud_schemes', [
        'money laundering', 'pyramid scheme', 'ponzi scheme',
        'stolen credit cards', 'hacked accounts', 'fake reviews'
      ]],
      ['privacy_violations', [
        'hack account', 'steal data', 'spy on', 'stalking',
        'illegal surveillance', 'personal information theft'
      ]],
      ['child_safety', [
        'child exploitation', 'underage', 'minors inappropriate'
      ]],
      ['platform_circumvention', [
        'contact me directly', 'bypass platform', 'off-platform payment'
      ]]
    ]);
  }
}

// Express Middleware
export async function moderateContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const moderationService = new ContentModerationService();
  const result = await moderationService.moderateTaskSubmission(req.body);

  if (result.action === 'BLOCK') {
    return res.status(403).json({
      error: 'Task submission blocked',
      reason: result.reason,
      message: 'This task violates our content policy and cannot be posted.'
    });
  }

  if (result.action === 'HOLD_FOR_REVIEW') {
    // Add to review queue
    req.body.status = 'pending_review';
    req.body.moderation_flags = result.flags;
  }

  if (result.action === 'WARN') {
    req.body.moderation_warnings = result.flags;
  }

  // Attach moderation result to request
  req.moderationResult = result;

  next();
}
```

### Database Schema

```sql
-- Add moderation fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'approved';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moderation_flags JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moderation_reviewed_at TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS moderation_reviewed_by UUID;

-- Create moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  flagged_at TIMESTAMP DEFAULT NOW(),
  flags JSONB NOT NULL,
  ai_confidence DECIMAL(3,2),
  status VARCHAR(50) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  action_taken VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX idx_moderation_queue_task_id ON moderation_queue(task_id);
```

---

## Layer 2: AI-Based Moderation (Phase 2)

### OpenAI Moderation API Integration

**Service**: `backend/src/services/aiModeration.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function moderateWithAI(content: string) {
  try {
    const response = await openai.moderations.create({
      input: content
    });

    const result = response.results[0];

    return {
      flagged: result.flagged,
      categories: Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category),
      scores: result.category_scores
    };
  } catch (error) {
    console.error('AI moderation error:', error);
    // Fail-safe: flag for human review on error
    return {
      flagged: true,
      categories: ['moderation_api_error'],
      scores: {}
    };
  }
}

// OpenAI Categories:
// - hate: Hate speech
// - harassment: Harassment
// - self-harm: Self-harm
// - sexual: Sexual content
// - violence: Violence
// - hate/threatening: Threatening hate speech
// - harassment/threatening: Threatening harassment
// - sexual/minors: Sexual content involving minors
// - violence/graphic: Graphic violence
```

**Cost**: $0.0002 per 1K tokens (~$0.20/month for 1,000 task submissions)

---

## Layer 3: Human Review System (Phase 3)

### Review Queue Dashboard

**Admin Dashboard Route**: `/admin/moderation`

```typescript
// Review queue API
router.get('/api/admin/moderation/queue', requireAdmin, async (req, res) => {
  const { status = 'pending', limit = 50 } = req.query;

  const { data, error } = await supabase
    .from('moderation_queue')
    .select(`
      *,
      tasks (*),
      reviewed_by:users!reviewed_by (email, full_name)
    `)
    .eq('status', status)
    .order('flagged_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  res.json({ queue: data });
});

// Review action
router.post('/api/admin/moderation/review/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: 'approve' | 'reject'

  const { data, error } = await supabase
    .from('moderation_queue')
    .update({
      status: action === 'approve' ? 'approved' : 'rejected',
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: notes,
      action_taken: action
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Update task status
  if (action === 'approve') {
    await supabase
      .from('tasks')
      .update({ moderation_status: 'approved', status: 'open' })
      .eq('id', data.task_id);
  } else {
    await supabase
      .from('tasks')
      .update({ moderation_status: 'rejected', status: 'cancelled' })
      .eq('id', data.task_id);

    // Notify company
    await sendRejectionNotification(data.task_id);
  }

  res.json({ success: true, data });
});
```

### Review Guidelines Document

See: [claudedocs/MODERATION_GUIDELINES.md](./MODERATION_GUIDELINES.md)

---

## Layer 4: Community Reporting System (Phase 1)

### Report Submission

```typescript
// POST /api/reports
router.post('/reports', requireAuth, async (req, res) => {
  const { task_id, reason, description, evidence } = req.body;

  // Validate reason
  const validReasons = ['illegal', 'scam', 'inappropriate', 'spam', 'other'];
  if (!validReasons.includes(reason)) {
    return res.status(400).json({ error: 'Invalid reason' });
  }

  // Create report
  const { data: report, error } = await supabase
    .from('task_reports')
    .insert({
      task_id,
      reported_by: req.user.id,
      reason,
      description,
      evidence,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Immediate action for critical reports
  if (reason === 'illegal') {
    await supabase
      .from('tasks')
      .update({
        status: 'suspended',
        visibility: 'hidden',
        moderation_status: 'under_investigation'
      })
      .eq('id', task_id);

    // Send critical alert
    await sendAdminAlert({
      type: 'critical_report',
      task_id,
      reported_by: req.user.id,
      reason
    });
  }

  res.json({ success: true, report_id: report.id });
});
```

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS task_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reason VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  investigated_by UUID REFERENCES users(id),
  investigation_notes TEXT,
  action_taken VARCHAR(50),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_reports_status ON task_reports(status);
CREATE INDEX idx_task_reports_task_id ON task_reports(task_id);
CREATE INDEX idx_task_reports_reason ON task_reports(reason);
```

---

## Layer 5: Continuous Monitoring (Phase 4)

### Risk Indicators

```typescript
interface AccountRiskIndicators {
  // Company-side risks
  high_rejection_rate: boolean;      // > 50% tasks rejected
  rapid_posting: boolean;            // > 10 tasks in 1 hour
  worker_complaints: number;         // Complaints from workers

  // Worker-side risks
  suspicious_acceptance: boolean;    // Accepts many flagged tasks
  low_completion_rate: boolean;      // < 30% completion rate
  report_history: number;            // Times reported by others
}
```

### Daily Risk Assessment

```typescript
// Scheduled job: Daily at 2 AM
async function dailyRiskAssessment() {
  // Analyze last 7 days
  const suspiciousAccounts = await supabase.rpc('identify_risky_accounts', {
    lookback_days: 7,
    rejection_threshold: 0.5,
    complaint_threshold: 3
  });

  for (const account of suspiciousAccounts) {
    await flagAccountForReview(account.id, account.risk_factors);

    // Auto-suspend if critical
    if (account.risk_score > 0.8) {
      await suspendAccount(account.id, 'automatic_risk_detection');
    }
  }
}
```

### Real-Time Alerts

```typescript
// Supabase Realtime monitoring
export function setupRealtimeAlerts() {
  supabase
    .channel('task_monitoring')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tasks'
    }, async (payload) => {
      const task = payload.new;

      // Immediate moderation
      const result = await moderateTaskSubmission(task);

      if (!result.allowed) {
        await handleSuspiciousTask(task.id, result);
      }
    })
    .subscribe();
}
```

---

## 📊 Implementation Roadmap

### Phase 1 (Month 1) - **CURRENT**
- ✅ Layer 1: Automated validation (keyword + pattern)
- ✅ Layer 4: Community reporting system
- ✅ Database schema setup
- ✅ Legal compliance documentation

**Deliverables**:
- Content moderation middleware
- Report submission API
- Admin dashboard (basic)

**Cost**: $0/month

---

### Phase 2 (Month 2-3)
- ✅ Layer 2: OpenAI Moderation API integration
- ✅ Layer 3: Human review queue
- ✅ Review guidelines documentation
- ✅ Admin notification system

**Cost**: ~$5/month + 1-2 hours/week review time

---

### Phase 3 (Month 4-6)
- ✅ Layer 5: Continuous monitoring
- ✅ Pattern detection improvements
- ✅ Hire moderator workers (Tier 2)
- ✅ Automated account risk scoring

**Cost**: ~$55-105/month (includes moderator payments)

---

### Phase 4 (Month 7+)
- ✅ Machine learning model training
- ✅ Advanced pattern detection
- ✅ International keyword expansion
- ✅ Continuous improvement

---

## 🎯 Success Metrics

```yaml
effectiveness_metrics:
  prevention_rate:
    target: "> 99% of illegal tasks blocked before posting"
    measurement: "blocked_tasks / total_flagged_tasks"

  false_positive_rate:
    target: "< 5% (avoid blocking legitimate tasks)"
    measurement: "false_positives / total_blocks"

  review_time:
    target: "< 24 hours for suspicious tasks"
    measurement: "avg(reviewed_at - flagged_at)"

  report_response_time:
    target: "< 2 hours for critical reports"
    measurement: "avg(action_taken_at - reported_at)"
```

---

## 💰 Cost Analysis

| Phase | Features | Monthly Cost | Time Investment |
|-------|----------|--------------|-----------------|
| Phase 1 | Automated + Reporting | $0 | 5-10 hours setup |
| Phase 2 | + AI Moderation | $5 | 1-2 hours/week |
| Phase 3 | + Monitoring | $55-105 | 0.5-1 hour/week |
| Phase 4 | + ML Models | $105+ | Automated |

**Total Year 1 Cost**: ~$600-1,200

---

## 🔗 Related Documentation

- [Legal Compliance Document](./LEGAL_COMPLIANCE.md) (English)
- [法的対応文書](./LEGAL_COMPLIANCE.jp.md) (Japanese)
- [Moderation Guidelines](./MODERATION_GUIDELINES.md)
- [Admin Dashboard Guide](./ADMIN_DASHBOARD.md)

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-01 | 1.0 | Initial release, Phase 1 implementation started |
