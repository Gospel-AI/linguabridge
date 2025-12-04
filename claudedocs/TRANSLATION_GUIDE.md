# TaskBridge Translation System Guide

## Overview

TaskBridge uses a **3-phase hybrid translation system** to support global workers:

1. **Phase 1 (Month 1-3)**: English-only posts + AI auto-translation
2. **Phase 2 (Month 4-6)**: Multi-language posting + improved AI translation
3. **Phase 3 (Month 7+)**: Translation verification tasks (human-in-the-loop)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Company posts task (English)                            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Saved to tasks table (original_language = 'en')         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Worker views task (preferred_language = 'fr')           │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         │ Check cache     │
         └────────┬────────┘
                  │
        ┌─────────┴─────────┐
        │ Cache exists?     │
        └─────────┬─────────┘
                  │
         ┌────────┴────────┐
         │YES            NO│
         ▼                 ▼
   ┌─────────┐      ┌──────────────┐
   │Return   │      │ DeepL/GPT API│
   │cached   │      │ (EN→FR)      │
   └─────────┘      └──────┬───────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Save cache  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Display to  │
                    │ worker with │
                    │ 🤖 AI badge │
                    └─────────────┘
```

---

## Technology Stack

### Translation Services

| Service | Use Case | Cost | Quality | Speed |
|---------|----------|------|---------|-------|
| **DeepL API** | Primary (EN, JA, FR, ES, ZH) | Free: 500K chars/mo<br>Paid: $5.49/mo | High | Instant |
| **GPT-4** | Fallback (Swahili, etc.) | ~$30/mo for 100 tasks | Very High | 2-5 sec |

### Frontend
- **react-i18next**: UI internationalization
- **@tanstack/react-query**: Translation caching

### Backend
- **DeepL API**: Primary translation engine
- **OpenAI GPT-4**: Fallback for unsupported languages

### Database
- **task_translations**: Translation cache table
- **users.preferred_language**: User language preference

---

## Setup Instructions

### 1. Environment Variables

Add to `backend/.env`:

```bash
# DeepL API (get free key at https://www.deepl.com/pro-api)
DEEPL_API_KEY=your_deepl_api_key_here:fx  # :fx suffix for free tier

# OpenAI API (fallback for Swahili)
OPENAI_API_KEY=your_openai_api_key_here

# Supported languages (comma-separated)
SUPPORTED_LANGUAGES=en,ja,fr,sw,es,zh
```

### 2. Run Database Migration

```bash
cd backend
psql $DATABASE_URL -f migrations/003_translation_system.sql
```

Or using Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `migrations/003_translation_system.sql`
3. Run query

### 3. Install Dependencies

```bash
# Backend
cd backend
npm install axios

# Frontend
cd frontend
npm install react-i18next i18next i18next-browser-languagedetector @tanstack/react-query
```

### 4. Register Translation Routes

Add to `backend/src/index.ts`:

```typescript
import translationRoutes from './routes/translations';

// ... other imports

app.use('/api/translations', translationRoutes);
```

---

## Usage Guide

### For Developers

#### 1. Display Translated Task

```typescript
import { TranslatedTaskCard } from '../components/TranslatedTaskCard';

function TaskList() {
  const { data: tasks } = useQuery(['tasks'], fetchTasks);

  return (
    <div>
      {tasks.map(task => (
        <TranslatedTaskCard
          key={task.id}
          task={task}
          onApply={handleApply}
        />
      ))}
    </div>
  );
}
```

#### 2. Use Translation Hook Directly

```typescript
import { useTaskTranslation } from '../hooks/useTaskTranslation';

function TaskDetail({ task }) {
  const { data: translated, isLoading } = useTaskTranslation(task);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1>{translated.title}</h1>
      <p>{translated.description}</p>
      {translated.translation_method === 'ai' && (
        <Badge>🤖 AI Translated</Badge>
      )}
    </div>
  );
}
```

#### 3. Change User Language

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);

    // Save to backend
    await axios.put('/api/users/me', {
      preferred_language: lang,
    });
  };

  return (
    <select onChange={(e) => changeLanguage(e.target.value)}>
      <option value="en">🇬🇧 English</option>
      <option value="ja">🇯🇵 日本語</option>
      <option value="fr">🇫🇷 Français</option>
      <option value="sw">🇰🇪 Kiswahili</option>
    </select>
  );
}
```

### For Companies (Task Posting)

#### Phase 1: English Only (Current)

```
⚠️ Please post tasks in English for maximum reach.
   Automatic translation will be provided to workers.

Title (English): _________________________
Description (English):
_________________________________________
```

#### Phase 2: Multi-Language (Month 4+)

```
Post in multiple languages (optional):
☑ English (required)
☐ Japanese
☐ French
☐ Swahili

□ Automatically translate to other languages
  (powered by AI, human review recommended)
```

### For Workers

Workers automatically see tasks in their preferred language:

```
┌─────────────────────────────────────┐
│ タスク: データ収集                     │
│ 🤖 AI translated                    │
│                                     │
│ 説明: ナイロビの店舗で価格を確認...    │
│                                     │
│ [原文を表示] [今すぐ応募]              │
└─────────────────────────────────────┘
```

---

## Translation Quality Levels

### 1. Original
```json
{
  "translation_method": "original",
  "badge": "✓ Original"
}
```
- Task posted in this language
- No translation needed
- 100% accurate

### 2. AI Translated
```json
{
  "translation_method": "ai",
  "badge": "🤖 AI translated"
}
```
- Automatically translated by DeepL/GPT
- 85-95% accuracy
- May have minor nuance issues

### 3. Human Verified
```json
{
  "translation_method": "human",
  "verified_by": "user_id",
  "verified_at": "2025-11-01T10:30:00Z",
  "badge": "✓ Human verified"
}
```
- Reviewed by bilingual worker
- 95-100% accuracy
- Cultural appropriateness confirmed

---

## Translation Verification Workflow (Phase 3)

### Step 1: AI Translation Generated
```
Task posted → AI translates → Saved to cache
```

### Step 2: Verification Task Created
```sql
INSERT INTO tasks (category, title, description, price)
VALUES (
  'translation_verification',
  'Verify French Translation',
  'Original: "Collect store prices in Nairobi..."
   Translation: "Collecter les prix en magasin à Nairobi..."

   Please verify:
   1. Accuracy (meaning correct?)
   2. Naturalness (sounds natural?)
   3. Cultural appropriateness',
  2.00
);
```

### Step 3: Worker Reviews
```typescript
// Worker submits verification
{
  "isAccurate": true,  // or false
  "suggestedTitle": "Better translation...",
  "suggestedDescription": "Improved version...",
  "feedback": "Original was good but..."
}
```

### Step 4: Translation Updated
```
If accurate → Mark as "human verified"
If improved → Update with worker's version + mark as "human verified"
```

---

## Cost Analysis

### Month 1-3 (500 tasks)
```
DeepL Free: 0 chars → $0
Average task: 100 chars title + 400 chars description = 500 chars
500 tasks × 500 chars = 250,000 chars
→ Within free tier (500K/month)

Total cost: $0
```

### Month 6 (2,000 tasks)
```
DeepL Pro needed: $5.49/month
2,000 tasks × 500 chars = 1,000,000 chars
→ DeepL Pro: $5.49/month unlimited

Swahili (GPT-4 fallback): 200 tasks × $0.15 = $30
Total cost: $35/month
```

### Month 12 (4,000 tasks + verification)
```
DeepL Pro: $5.49/month
GPT-4 fallback: 400 tasks × $0.15 = $60
Translation verification: 100 tasks × $2 = $200 (worker pay)
Platform revenue from verification: $200 × 18% = $36

Total cost: $65/month
Revenue offset: $36/month
Net cost: $29/month
```

---

## Performance Optimization

### 1. Caching Strategy
```typescript
// Cache translations for 24 hours
queryClient.setQueryData(['task-translation', taskId, language], data, {
  staleTime: 24 * 60 * 60 * 1000,
});
```

### 2. Batch Translation (Future)
```typescript
// Translate multiple tasks at once
const translateBatch = async (taskIds: string[], language: string) => {
  const tasks = await fetchTasks(taskIds);
  const translations = await Promise.all(
    tasks.map(task => translator.translateTask(task, language))
  );
  return translations;
};
```

### 3. Preemptive Translation
```typescript
// Translate popular tasks in advance
cron.schedule('0 2 * * *', async () => {
  const popularTasks = await getPopularTasks(100);
  const languages = ['fr', 'sw', 'ja'];

  for (const task of popularTasks) {
    for (const lang of languages) {
      await translateAndCache(task, lang);
    }
  }
});
```

---

## Monitoring & Analytics

### Admin Dashboard Metrics

```typescript
const stats = await useTranslationStats();

{
  "totalTranslations": 15234,
  "aiTranslations": 14890,
  "humanTranslations": 344,
  "verificationRate": "2.3%",
  "deeplUsage": {
    "characterCount": 8456234,
    "characterLimit": 500000,
    "percentageUsed": "94.5%"
  }
}
```

### Key Metrics to Track
- Translation cache hit rate (target: >80%)
- Average translation time (target: <2s)
- Verification task completion rate
- Translation quality feedback
- DeepL API usage (stay within budget)

---

## Troubleshooting

### Issue: Translation not showing
**Check:**
1. User language preference set? (`users.preferred_language`)
2. Translation cache exists? (check `task_translations` table)
3. DeepL API key valid?
4. Network request succeeding? (check browser console)

### Issue: Poor translation quality
**Solutions:**
1. Switch from DeepL to GPT-4 for that language
2. Create verification task for human review
3. Allow company to provide manual translation

### Issue: DeepL quota exceeded
**Solutions:**
1. Upgrade to DeepL Pro ($5.49/month)
2. Implement smarter caching (longer TTL)
3. Use GPT-4 as fallback
4. Limit translation to popular tasks only

---

## Roadmap

### ✅ Phase 1 (Month 1-3) - CURRENT
- [x] AI translation (DeepL + GPT-4)
- [x] Translation caching
- [x] UI language switching
- [x] Translation quality badges

### 🔄 Phase 2 (Month 4-6) - IN PROGRESS
- [ ] Multi-language task posting
- [ ] Translation quality feedback
- [ ] Improved caching strategy
- [ ] Analytics dashboard

### 📋 Phase 3 (Month 7+) - PLANNED
- [ ] Translation verification tasks
- [ ] Human-in-the-loop workflow
- [ ] Community translation contributions
- [ ] Translation memory system

---

## Best Practices

### For Developers
1. **Always use TranslatedTaskCard** instead of raw task data
2. **Cache aggressively** - translations rarely change
3. **Handle loading states** - translation takes 1-3 seconds
4. **Provide fallback** - show original if translation fails
5. **Monitor API usage** - avoid unexpected costs

### For Content Writers
1. **Write clear English** - AI translates better with simple language
2. **Avoid idioms** - "kick the bucket" doesn't translate well
3. **Use cultural neutrality** - avoid region-specific references
4. **Keep it concise** - shorter text = cheaper translation
5. **Use bullet points** - easier to translate accurately

### For QA Testing
1. Test all 6 supported languages
2. Check translation quality manually
3. Verify "View Original" toggle works
4. Test with very long task descriptions
5. Check special characters (é, ñ, 中, etc.)

---

## Support

For translation system issues:
- **Technical**: Check `backend/src/services/translation.ts`
- **UI**: Check `frontend/src/components/TranslatedTaskCard.tsx`
- **API**: Check `backend/src/routes/translations.ts`
- **Database**: Check `migrations/003_translation_system.sql`

For questions or improvements, contact the development team.
