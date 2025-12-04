# API Design

**Version**: 2.0
**Last Updated**: 2025-10-31

---

## Overview

TaskBridge uses a hybrid API architecture optimized for the v2.0 focus domain strategy:
- **Frontend → Supabase**: Direct database queries via Supabase client (RLS-protected)
- **Backend API**: Express REST API for complex operations (Stripe, training, GPS verification, photo processing, tier automation)

This approach maximizes development speed while maintaining security through Row Level Security (RLS) and enables specialized processing for focus domains.

---

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────────┐  ┌──────────────┐
│   Supabase   │  │   Backend    │
│   (Direct)   │  │   API (REST) │
│              │  │              │
│ • Auth       │  │ • Stripe     │
│ • CRUD Ops   │  │ • Training   │
│ • Real-time  │  │ • GPS Check  │
│ • PostGIS    │  │ • Photo AI   │
│              │  │ • Webhooks   │
│              │  │ • Tier Auto  │
└──────────────┘  └──────────────┘
```

---

## Frontend → Supabase (Direct Access)

### Authentication

#### Sign Up
```typescript
POST /auth/v1/signup (Supabase managed)

// Client SDK usage:
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure_password',
  options: {
    data: {
      full_name: 'John Doe',
      role: 'worker' // or 'client' or 'both'
    }
  }
})
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2025-10-31T12:00:00Z"
  },
  "session": {
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure_password'
})
```

#### Sign Out
```typescript
await supabase.auth.signOut()
```

#### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

---

### User Profile

#### Get Profile
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single()
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "worker",
  "full_name": "John Doe",
  "bio": "Experienced translator and data specialist",
  "avatar_url": null,
  "onboarding_completed": true,
  "created_at": "2025-10-31T12:00:00Z"
}
```

#### Update Profile
```typescript
const { error } = await supabase
  .from('users')
  .update({
    full_name: 'Jane Doe',
    bio: 'Updated bio',
    role: 'both'
  })
  .eq('id', user.id)
```

---

### Tasks

#### List Published Tasks (All Categories)
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false })
```

**Response:**
```json
[
  {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "Validate Japanese Localization Quality",
    "description": "Review AI-translated content for cultural appropriateness...",
    "category": "Translation/Localization",
    "domain_type": "translation",
    "amount": 35.00,
    "currency": "USD",
    "status": "published",
    "deadline": "2025-11-15T23:59:59Z",
    "required_tier": 1,
    "created_at": "2025-10-31T12:00:00Z"
  }
]
```

#### List Tasks by Focus Domain
```typescript
// Translation tasks
const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('domain_type', 'translation')
  .eq('status', 'published')
  .order('created_at', { ascending: false })

// AI Verification tasks
.eq('domain_type', 'ai_verification')

// Physical Data Collection tasks
.eq('domain_type', 'physical_data')

// Generic tasks
.is('domain_type', null) // or .eq('domain_type', 'generic')
```

#### Get Task Detail (with Domain-Specific Fields)
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    creator:users!tasks_creator_id_fkey (
      id,
      email,
      full_name,
      role
    )
  `)
  .eq('id', taskId)
  .single()
```

**Response (Translation Task Example):**
```json
{
  "id": "uuid",
  "creator_id": "uuid",
  "title": "Validate Japanese Localization",
  "description": "Review AI-translated content...",
  "category": "Translation/Localization",
  "domain_type": "translation",
  "amount": 35.00,
  "currency": "USD",
  "status": "published",
  "deadline": "2025-11-15T23:59:59Z",
  "required_tier": 1,
  "translation_source_lang": "en",
  "translation_target_lang": "ja",
  "translation_content_type": "UI Text",
  "translation_evaluation_criteria": {
    "accuracy": true,
    "naturalness": true,
    "cultural_appropriateness": true
  },
  "created_at": "2025-10-31T12:00:00Z",
  "creator": {
    "id": "uuid",
    "full_name": "Company Name"
  }
}
```

**Response (AI Verification Task Example):**
```json
{
  "id": "uuid",
  "domain_type": "ai_verification",
  "ai_content_type": "chatbot_response",
  "ai_check_hallucinations": true,
  "ai_check_bias": true,
  "ai_check_cultural": true,
  "ai_sample_content": "AI-generated text to verify...",
  "ai_context_info": "Customer support chatbot for healthcare"
}
```

**Response (Physical Data Task Example):**
```json
{
  "id": "uuid",
  "domain_type": "physical_data",
  "physical_location": {
    "type": "Point",
    "coordinates": [139.6917, 35.6895] // [lng, lat]
  },
  "physical_location_name": "Tokyo Tower, Minato-ku, Tokyo",
  "physical_required_photos": ["storefront", "product_display", "price_tag"],
  "physical_verification_radius": 50,
  "physical_data_points": ["opening_hours", "customer_count", "competitor_prices"]
}
```

#### Create Generic Task
```typescript
const { data, error } = await supabase
  .from('tasks')
  .insert({
    creator_id: user.id,
    title: 'Data Entry - 100 Product Records',
    description: 'Enter product data into spreadsheet...',
    category: 'Data Entry',
    domain_type: null, // Generic task
    amount: 25.00,
    currency: 'USD',
    status: 'published',
    deadline: '2025-11-15T23:59:59Z',
    required_tier: 1
  })
  .select()
  .single()
```

#### Get My Posted Tasks
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    applications (
      id,
      worker_id,
      status,
      created_at,
      worker:users!applications_worker_id_fkey (
        id,
        email,
        full_name
      )
    )
  `)
  .eq('creator_id', user.id)
  .order('created_at', { ascending: false })
```

---

### Applications

#### Check Existing Application
```typescript
const { data, error } = await supabase
  .from('applications')
  .select('*')
  .eq('task_id', taskId)
  .eq('worker_id', user.id)
  .maybeSingle()
```

#### Submit Application
```typescript
const { data, error } = await supabase
  .from('applications')
  .insert({
    task_id: taskId,
    worker_id: user.id,
    status: 'pending',
    cover_letter: 'I am a certified translator with experience in...'
  })
  .select()
  .single()
```

#### Withdraw Application
```typescript
const { error } = await supabase
  .from('applications')
  .delete()
  .eq('id', applicationId)
  .eq('worker_id', user.id) // RLS ensures only owner can delete
```

#### Get My Applications
```typescript
const { data, error } = await supabase
  .from('applications')
  .select(`
    id,
    task_id,
    status,
    cover_letter,
    created_at,
    task:tasks (
      id,
      title,
      description,
      category,
      domain_type,
      amount,
      currency,
      status,
      deadline,
      required_tier,
      created_at
    )
  `)
  .eq('worker_id', user.id)
  .order('created_at', { ascending: false })
```

#### Accept/Reject Application (Client only)
```typescript
const { error } = await supabase
  .from('applications')
  .update({ status: 'accepted' }) // or 'rejected'
  .eq('id', applicationId)
  .eq('task_id', taskId)
  // RLS ensures only task creator can update
```

---

### Worker Profile & Tier Status

#### Get Worker Profile (with Tier Info)
```typescript
const { data, error } = await supabase
  .from('workers')
  .select('*')
  .eq('user_id', user.id)
  .single()
```

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "tier": 2,
  "tier_updated_at": "2025-10-15T10:30:00Z",
  "total_completed_tasks": 25,
  "average_rating": 4.5,
  "last_month_rating": 4.6,
  "prev_month_rating": 4.3,
  "language_pairs": [
    {"source": "en", "target": "ja", "proficiency": "native"},
    {"source": "en", "target": "ko", "proficiency": "professional"}
  ],
  "specialized_domains": ["translation", "ai_verification"],
  "certifications": ["translation", "ai_verification"],
  "current_location": {
    "type": "Point",
    "coordinates": [139.6917, 35.6895]
  },
  "onboarding_completed": true,
  "stripe_account_id": "acct_xxx",
  "created_at": "2025-08-01T12:00:00Z"
}
```

#### Update Worker Location (for Physical Data Tasks)
```typescript
const { error } = await supabase
  .from('workers')
  .update({
    current_location: `POINT(${longitude} ${latitude})`,
    location_updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id)
```

---

### Training & Certification (Supabase Direct)

#### Get Available Training Modules
```typescript
const { data, error } = await supabase
  .from('training_modules')
  .select('*')
  .order('domain_type')
```

**Response:**
```json
[
  {
    "id": "uuid",
    "domain_type": "translation",
    "title": "Translation/Localization Validation Training",
    "description": "Learn how to evaluate translation quality...",
    "video_url": "https://loom.com/xxx",
    "video_duration_seconds": 600,
    "quiz_questions": [
      {
        "id": "q1",
        "question": "What are the three key evaluation criteria?",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "A"
      }
    ],
    "pass_threshold": 70,
    "created_at": "2025-10-31T12:00:00Z"
  }
]
```

#### Get My Training Progress
```typescript
const { data, error } = await supabase
  .from('worker_training_progress')
  .select(`
    *,
    training_module:training_modules (
      domain_type,
      title
    )
  `)
  .eq('worker_id', user.id)
```

**Response:**
```json
[
  {
    "id": "uuid",
    "worker_id": "uuid",
    "training_module_id": "uuid",
    "video_completed": true,
    "video_watch_percentage": 100,
    "quiz_attempts": 1,
    "quiz_score": 85,
    "passed": true,
    "certified_at": "2025-10-31T14:30:00Z",
    "training_module": {
      "domain_type": "translation",
      "title": "Translation Validation Training"
    }
  }
]
```

#### Update Video Watch Progress
```typescript
const { error } = await supabase
  .from('worker_training_progress')
  .update({
    video_watch_percentage: 75,
    video_completed: false
  })
  .eq('worker_id', user.id)
  .eq('training_module_id', moduleId)
```

---

### Transactions

#### Get My Transactions (with Tier Bonus Info)
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .or(`client_id.eq.${user.id},worker_id.eq.${user.id}`)
  .order('created_at', { ascending: false })
```

**Response:**
```json
[
  {
    "id": "uuid",
    "task_id": "uuid",
    "client_id": "uuid",
    "worker_id": "uuid",
    "amount": 35.00,
    "worker_amount": 28.70,
    "platform_fee": 6.30,
    "worker_tier_at_completion": 2,
    "tier_bonus_amount": 5.00,
    "currency": "USD",
    "status": "completed",
    "stripe_payment_intent_id": "pi_xxx",
    "stripe_transfer_id": "tr_xxx",
    "created_at": "2025-10-31T12:00:00Z",
    "completed_at": "2025-10-31T15:00:00Z"
  }
]
```

---

## Backend REST API

Base URL: `http://localhost:3000` (development) / `https://api.taskbridge.com` (production)

All endpoints require `Authorization: Bearer <token>` header (except webhooks).

---

## Focus Domain Task Creation

### Create Translation/Localization Task
```
POST /api/tasks/translation
```

**Request:**
```json
{
  "title": "Validate Japanese UI Localization",
  "description": "Review AI-translated interface text for accuracy and cultural appropriateness",
  "amount": 35.00,
  "currency": "USD",
  "deadline": "2025-11-15T23:59:59Z",
  "source_language": "en",
  "target_language": "ja",
  "content_type": "UI Text",
  "evaluation_criteria": {
    "accuracy": true,
    "naturalness": true,
    "cultural_appropriateness": true
  },
  "sample_content": "Welcome to our app! Click here to get started.",
  "required_tier": 1
}
```

**Response:**
```json
{
  "success": true,
  "task_id": "uuid",
  "task": {
    "id": "uuid",
    "creator_id": "uuid",
    "title": "Validate Japanese UI Localization",
    "domain_type": "translation",
    "category": "Translation/Localization",
    "status": "published",
    "created_at": "2025-10-31T12:00:00Z"
  }
}
```

### Create AI Verification Task
```
POST /api/tasks/ai-verification
```

**Request:**
```json
{
  "title": "Verify AI Chatbot Responses for Cultural Sensitivity",
  "description": "Check AI-generated customer support responses for bias and cultural appropriateness",
  "amount": 15.00,
  "currency": "USD",
  "deadline": "2025-11-10T23:59:59Z",
  "content_type": "chatbot_response",
  "check_hallucinations": true,
  "check_bias": true,
  "check_cultural": true,
  "sample_content": "I understand your concern. Based on your profile...",
  "context_info": "Healthcare customer support chatbot for Japanese market",
  "required_tier": 1
}
```

**Response:**
```json
{
  "success": true,
  "task_id": "uuid",
  "task": {
    "id": "uuid",
    "domain_type": "ai_verification",
    "category": "AI Verification",
    "status": "published"
  }
}
```

### Create Physical Data Collection Task
```
POST /api/tasks/physical-data
```

**Request:**
```json
{
  "title": "Collect Competitor Pricing at Tokyo Store",
  "description": "Visit store and photograph competitor product prices",
  "amount": 12.00,
  "currency": "USD",
  "deadline": "2025-11-05T23:59:59Z",
  "location": {
    "lat": 35.6895,
    "lng": 139.6917
  },
  "location_name": "Tokyo Tower, Minato-ku, Tokyo",
  "required_photos": ["storefront", "product_display", "price_tag"],
  "verification_radius_meters": 50,
  "data_points": ["opening_hours", "customer_count", "prices"],
  "required_tier": 1
}
```

**Response:**
```json
{
  "success": true,
  "task_id": "uuid",
  "task": {
    "id": "uuid",
    "domain_type": "physical_data",
    "category": "Physical Data Collection",
    "status": "published",
    "physical_location": {
      "type": "Point",
      "coordinates": [139.6917, 35.6895]
    }
  }
}
```

---

## Training & Certification API

### Get Training Module Content
```
GET /api/training/:domain
```

**Parameters:**
- `domain`: `translation` | `ai_verification` | `physical_data`

**Response:**
```json
{
  "success": true,
  "module": {
    "id": "uuid",
    "domain_type": "translation",
    "title": "Translation/Localization Validation Training",
    "description": "Learn to evaluate translation quality...",
    "video_url": "https://loom.com/share/xxx",
    "video_duration_seconds": 600,
    "quiz_questions": [
      {
        "id": "q1",
        "question": "What are the three key evaluation criteria for translations?",
        "options": [
          "Accuracy, Naturalness, Cultural Appropriateness",
          "Speed, Cost, Quality",
          "Grammar, Spelling, Punctuation",
          "None of the above"
        ]
      }
    ],
    "pass_threshold": 70
  },
  "progress": {
    "video_completed": false,
    "video_watch_percentage": 0,
    "quiz_attempts": 0,
    "quiz_score": null,
    "passed": false
  }
}
```

### Update Video Watch Progress
```
POST /api/training/video-progress
```

**Request:**
```json
{
  "training_module_id": "uuid",
  "watch_percentage": 75,
  "completed": false
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "video_watch_percentage": 75,
    "video_completed": false
  }
}
```

### Submit Quiz (Auto-Grading)
```
POST /api/training/submit-quiz
```

**Request:**
```json
{
  "training_module_id": "uuid",
  "domain_type": "translation",
  "answers": {
    "q1": "Accuracy, Naturalness, Cultural Appropriateness",
    "q2": "To ensure high-quality results",
    "q3": "Cultural context matters"
  }
}
```

**Response (Pass):**
```json
{
  "success": true,
  "result": {
    "score": 85,
    "passed": true,
    "correct_answers": 5,
    "total_questions": 6,
    "certified": true,
    "certified_at": "2025-10-31T14:30:00Z"
  },
  "message": "Congratulations! You are now certified for Translation/Localization tasks."
}
```

**Response (Fail - Can Retry):**
```json
{
  "success": true,
  "result": {
    "score": 60,
    "passed": false,
    "correct_answers": 3,
    "total_questions": 6,
    "certified": false,
    "can_retry": true,
    "retry_after": "2025-11-01T14:30:00Z"
  },
  "message": "You need 70% to pass. You can retry after 24 hours."
}
```

### Get Certification Status
```
GET /api/training/certification-status
```

**Response:**
```json
{
  "success": true,
  "certifications": [
    {
      "domain_type": "translation",
      "certified": true,
      "certified_at": "2025-10-31T14:30:00Z",
      "quiz_score": 85
    },
    {
      "domain_type": "ai_verification",
      "certified": false,
      "quiz_attempts": 1,
      "last_quiz_score": 60,
      "can_retry": true,
      "retry_after": "2025-11-01T14:30:00Z"
    },
    {
      "domain_type": "physical_data",
      "certified": false,
      "video_completed": false
    }
  ]
}
```

---

## Task Submission & Evaluation API

### Submit Translation/Localization Evaluation
```
POST /api/submissions/translation
```

**Request:**
```json
{
  "task_id": "uuid",
  "evaluation": {
    "accuracy_score": 4,
    "naturalness_score": 5,
    "cultural_score": 4,
    "overall_score": 4,
    "comments": "The translation is accurate but some phrases could be more natural in Japanese context.",
    "issues_found": [
      {
        "original": "Click here to get started",
        "translation": "ここをクリックして開始",
        "issue": "Too literal, better: 「はじめる」をクリック",
        "severity": "minor"
      }
    ],
    "recommendations": "Consider using more casual tone for app UI"
  }
}
```

**Response:**
```json
{
  "success": true,
  "submission_id": "uuid",
  "status": "submitted",
  "submitted_at": "2025-10-31T15:00:00Z"
}
```

### Submit AI Verification Results
```
POST /api/submissions/ai-verification
```

**Request:**
```json
{
  "task_id": "uuid",
  "verification": {
    "hallucination_detected": false,
    "bias_detected": true,
    "bias_details": "Response assumes customer's technical expertise without confirmation",
    "cultural_issues": false,
    "overall_quality": 3,
    "recommended_action": "revise",
    "suggested_improvements": "Add clarification question about user's technical level before proceeding",
    "comments": "Response is factually accurate but makes assumptions about user knowledge"
  }
}
```

**Response:**
```json
{
  "success": true,
  "submission_id": "uuid",
  "ai_verification_result_id": "uuid",
  "status": "submitted"
}
```

### Submit Physical Data Collection
```
POST /api/submissions/physical-data
```

**Request (multipart/form-data):**
```
task_id: "uuid"
submission_location_lat: 35.6895
submission_location_lng: 139.6917
collected_data: {
  "opening_hours": "9:00-21:00",
  "customer_count": "approximately 50",
  "competitor_prices": {"item_a": "¥1200", "item_b": "¥800"}
}
photo_storefront: [File]
photo_product_display: [File]
photo_price_tag: [File]
```

**Response:**
```json
{
  "success": true,
  "submission_id": "uuid",
  "verification": {
    "gps_verified": true,
    "distance_from_target": 12.5,
    "within_radius": true,
    "photos_uploaded": 3,
    "photo_quality_checks": {
      "photo_storefront": { "quality": "good", "size_mb": 2.3 },
      "photo_product_display": { "quality": "good", "size_mb": 1.8 },
      "photo_price_tag": { "quality": "acceptable", "size_mb": 1.2 }
    }
  },
  "status": "submitted",
  "submitted_at": "2025-10-31T15:30:00Z"
}
```

### Verify GPS Location
```
POST /api/submissions/verify-gps
```

**Request:**
```json
{
  "task_id": "uuid",
  "submission_location": {
    "lat": 35.6895,
    "lng": 139.6917
  }
}
```

**Response (Verified):**
```json
{
  "success": true,
  "verified": true,
  "distance_meters": 12.5,
  "within_radius": true,
  "radius_meters": 50,
  "spoofing_detected": false
}
```

**Response (Failed - Out of Range):**
```json
{
  "success": false,
  "verified": false,
  "distance_meters": 125.8,
  "within_radius": false,
  "radius_meters": 50,
  "message": "Submission location is outside the required radius"
}
```

**Response (Failed - Spoofing Suspected):**
```json
{
  "success": false,
  "verified": false,
  "spoofing_detected": true,
  "spoofing_indicators": [
    "rapid_location_change",
    "impossible_speed"
  ],
  "message": "GPS spoofing detected. Please try again from the actual location."
}
```

### Upload & Validate Photo
```
POST /api/submissions/upload-photo
```

**Request (multipart/form-data):**
```
task_id: "uuid"
photo_type: "storefront"
photo: [File]
location_lat: 35.6895
location_lng: 139.6917
```

**Response (Success):**
```json
{
  "success": true,
  "photo_url": "https://storage.supabase.com/xxx/photo.jpg",
  "validation": {
    "quality": "good",
    "size_mb": 2.3,
    "resolution": "1920x1080",
    "has_location_metadata": true,
    "metadata_location": {
      "lat": 35.6895,
      "lng": 139.6917
    },
    "location_matches": true
  }
}
```

**Response (Failed - Quality Issues):**
```json
{
  "success": false,
  "error": "Photo quality issues detected",
  "validation": {
    "quality": "poor",
    "issues": [
      "Resolution too low (minimum 800x600 required)",
      "Image is blurry"
    ]
  }
}
```

---

## Worker Tier Management API

### Get Worker Profile
```
GET /api/workers/profile
```

**Response:**
```json
{
  "success": true,
  "worker": {
    "id": "uuid",
    "user_id": "uuid",
    "tier": 2,
    "tier_updated_at": "2025-10-15T10:30:00Z",
    "total_completed_tasks": 25,
    "average_rating": 4.5,
    "last_month_rating": 4.6,
    "prev_month_rating": 4.3,
    "language_pairs": [
      {"source": "en", "target": "ja", "proficiency": "native"}
    ],
    "specialized_domains": ["translation", "ai_verification"],
    "certifications": ["translation", "ai_verification", "physical_data"],
    "stripe_account_id": "acct_xxx",
    "onboarding_completed": true
  }
}
```

### Get Tier Status & Promotion Progress
```
GET /api/workers/tier-status
```

**Response (Tier 1 - Making Progress):**
```json
{
  "success": true,
  "current_tier": 1,
  "tier_updated_at": "2025-08-01T12:00:00Z",
  "promotion_progress": {
    "eligible_for_promotion": false,
    "tasks_completed": 15,
    "tasks_required": 20,
    "tasks_remaining": 5,
    "average_rating": 4.3,
    "rating_required": 4.2,
    "rating_met": true,
    "estimated_promotion_date": "2025-11-10"
  }
}
```

**Response (Tier 2 - Current Status):**
```json
{
  "success": true,
  "current_tier": 2,
  "tier_updated_at": "2025-10-15T10:30:00Z",
  "tier_2_benefits": {
    "pay_bonus_percentage": 20,
    "priority_notifications": true,
    "pro_badge": true
  },
  "demotion_risk": {
    "at_risk": false,
    "last_month_rating": 4.6,
    "prev_month_rating": 4.3,
    "threshold": 4.0,
    "consecutive_months_below": 0
  }
}
```

### Get Tier Change History
```
GET /api/workers/tier-history
```

**Response:**
```json
{
  "success": true,
  "tier_changes": [
    {
      "id": "uuid",
      "worker_id": "uuid",
      "old_tier": 1,
      "new_tier": 2,
      "reason": "auto_promotion",
      "trigger_conditions": {
        "total_completed_tasks": 20,
        "average_rating": 4.5
      },
      "changed_at": "2025-10-15T10:30:00Z"
    }
  ],
  "current_tier": 2,
  "time_in_current_tier_days": 16
}
```

---

## Quality Control & Reporting API

### Report Quality Problem
```
POST /api/reports/problem
```

**Request:**
```json
{
  "task_id": "uuid",
  "submission_id": "uuid",
  "worker_id": "uuid",
  "issue_type": "low_quality", // or "gps_spoofing", "photo_fake", "inappropriate"
  "description": "Submitted photos appear to be from internet, not taken on location",
  "evidence": {
    "photo_urls": ["https://..."],
    "additional_notes": "Reverse image search shows this photo on Google"
  }
}
```

**Response:**
```json
{
  "success": true,
  "report_id": "uuid",
  "status": "submitted",
  "report": {
    "id": "uuid",
    "task_id": "uuid",
    "reported_by": "uuid",
    "issue_type": "low_quality",
    "status": "pending_review",
    "created_at": "2025-10-31T16:00:00Z"
  }
}
```

### Get Admin Quality Reports
```
GET /api/admin/quality-reports
```

**Query Parameters:**
```
?status=pending_review&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "uuid",
      "task_id": "uuid",
      "submission_id": "uuid",
      "worker_id": "uuid",
      "reported_by": "uuid",
      "issue_type": "gps_spoofing",
      "description": "GPS location does not match photo metadata",
      "status": "pending_review",
      "created_at": "2025-10-31T16:00:00Z",
      "task": {
        "title": "Collect Store Data",
        "domain_type": "physical_data"
      },
      "worker": {
        "full_name": "Worker Name",
        "tier": 1,
        "average_rating": 4.2
      }
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

### Check GPS Spoofing (Internal Use)
```
POST /api/quality/check-gps-spoofing
```

**Request:**
```json
{
  "worker_id": "uuid",
  "current_location": {
    "lat": 35.6895,
    "lng": 139.6917,
    "timestamp": "2025-10-31T15:00:00Z"
  },
  "previous_location": {
    "lat": 35.1234,
    "lng": 138.5678,
    "timestamp": "2025-10-31T14:50:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "spoofing_detected": false,
  "checks": {
    "rapid_location_change": false,
    "impossible_speed": false,
    "distance_km": 45.2,
    "time_difference_minutes": 10,
    "average_speed_kmh": 271.2,
    "max_reasonable_speed_kmh": 500
  }
}
```

### Validate Photo Quality (Internal Use)
```
POST /api/quality/check-photo-quality
```

**Request (multipart/form-data):**
```
photo: [File]
min_resolution: "800x600"
```

**Response (Good Quality):**
```json
{
  "success": true,
  "quality": "good",
  "resolution": "1920x1080",
  "size_mb": 2.3,
  "format": "jpeg",
  "issues": []
}
```

**Response (Poor Quality):**
```json
{
  "success": false,
  "quality": "poor",
  "resolution": "640x480",
  "size_mb": 0.5,
  "format": "jpeg",
  "issues": [
    "Resolution below minimum (800x600 required)",
    "File size suspiciously small",
    "Image appears blurry"
  ]
}
```

---

## Payment Endpoints

### Create Payment Intent
```
POST /api/payments/create-intent
```

**Request:**
```json
{
  "task_id": "uuid",
  "amount": 35.00,
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx"
}
```

### Confirm Payment
```
POST /api/payments/confirm
```

**Request:**
```json
{
  "payment_intent_id": "pi_xxx",
  "task_id": "uuid",
  "worker_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "uuid"
}
```

### Transfer to Worker (with Tier Bonus)
```
POST /api/payments/transfer
```

**Request:**
```json
{
  "transaction_id": "uuid",
  "worker_id": "uuid",
  "amount": 35.00,
  "worker_tier": 2
}
```

**Response:**
```json
{
  "success": true,
  "transfer_id": "tr_xxx",
  "base_amount": 28.70,
  "tier_bonus": 5.00,
  "total_worker_payout": 33.70,
  "platform_fee": 6.30,
  "stripe_fee": 2.10,
  "estimated_arrival": "2025-11-01"
}
```

---

## Stripe Connect Endpoints

### Create Connect Account (Worker)
```
POST /api/connect/create-account
```

**Request:**
```json
{
  "email": "worker@example.com",
  "country": "US"
}
```

**Response:**
```json
{
  "success": true,
  "account_id": "acct_xxx",
  "onboarding_url": "https://connect.stripe.com/setup/xxx"
}
```

### Get Account Status
```
GET /api/connect/account-status
```

**Response:**
```json
{
  "success": true,
  "account_id": "acct_xxx",
  "charges_enabled": true,
  "payouts_enabled": true,
  "details_submitted": true
}
```

---

## Webhook Endpoints

### Stripe Webhook
```
POST /api/webhooks/stripe
```

**Headers:**
```
Stripe-Signature: t=xxx,v1=xxx
```

**Events Handled:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `transfer.created`
- `transfer.failed`
- `account.updated`

---

## Supabase Functions (Automatic)

These functions run automatically via pg_cron (no API endpoints needed).

### Auto-Promote Workers
```sql
-- Runs daily at midnight
SELECT auto_promote_workers();
```

Automatically promotes Tier 1 workers to Tier 2 when:
- `total_completed_tasks >= 20`
- `average_rating >= 4.2`

### Auto-Demote Workers
```sql
-- Runs on 1st of each month
SELECT auto_demote_workers();
```

Automatically demotes Tier 2 workers to Tier 1 when:
- Rating < 4.0 for 2 consecutive months

### Update Worker Ratings
```sql
-- Runs daily at midnight
SELECT update_worker_ratings();
```

Recalculates:
- `average_rating`
- `last_month_rating`
- `prev_month_rating`

---

## Admin Endpoints

### Get Platform Statistics
```
GET /api/admin/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total_users": 1250,
    "total_workers": 850,
    "total_clients": 400,
    "total_tasks": 450,
    "total_revenue": 12500.00,
    "active_tasks": 85,
    "tier_breakdown": {
      "tier_1": 650,
      "tier_2": 200
    },
    "domain_breakdown": {
      "translation": 150,
      "ai_verification": 180,
      "physical_data": 70,
      "generic": 50
    }
  }
}
```

### Get Worker Analytics
```
GET /api/admin/workers
```

**Query Parameters:**
```
?tier=2&certified_domain=translation&limit=20&offset=0
```

**Response:**
```json
{
  "success": true,
  "workers": [
    {
      "id": "uuid",
      "full_name": "Worker Name",
      "email": "worker@example.com",
      "tier": 2,
      "total_completed_tasks": 45,
      "average_rating": 4.7,
      "certifications": ["translation", "ai_verification"],
      "created_at": "2025-08-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 200,
    "limit": 20,
    "offset": 0
  }
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Task not found",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHENTICATED` | 401 | Missing or invalid auth token |
| `UNAUTHORIZED` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `INVALID_REQUEST` | 400 | Invalid request data |
| `VALIDATION_ERROR` | 422 | Data validation failed |
| `RATE_LIMIT` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `GPS_SPOOFING_DETECTED` | 403 | GPS location verification failed |
| `PHOTO_QUALITY_FAILED` | 422 | Photo does not meet quality standards |
| `NOT_CERTIFIED` | 403 | Worker not certified for this domain |
| `TIER_REQUIREMENT_NOT_MET` | 403 | Task requires higher tier |
| `QUIZ_FAILED` | 422 | Quiz score below pass threshold |
| `RETRY_NOT_ALLOWED` | 429 | Must wait 24 hours before retrying quiz |

---

## Rate Limiting

### Supabase Direct Access
- Free tier: 500 requests/second
- Pro tier: Unlimited (fair use)

### Backend API
- Authenticated endpoints: 100 requests/minute per user
- Training endpoints: 20 requests/minute per user (video/quiz)
- Photo upload endpoints: 10 uploads/minute per user
- Webhook endpoints: 1000 requests/minute per IP
- Public endpoints: 20 requests/minute per IP

---

## Security

### Authentication
- JWT tokens via Supabase Auth
- 1 hour access token lifetime
- Automatic refresh via Supabase client

### Authorization
- Row Level Security (RLS) on all database tables
- Backend API validates user permissions
- Service role key for admin operations
- Domain certification checks for specialized tasks

### Data Protection
- HTTPS only (enforced in production)
- API keys in environment variables
- Stripe webhook signature verification
- CORS restricted to frontend domain
- GPS location privacy (only verified, never stored permanently)
- Photo EXIF metadata stripped before storage

### GPS Spoofing Prevention
- Speed-based detection (max 500 km/h reasonable)
- Timestamp validation
- EXIF metadata cross-check
- Historical location pattern analysis

---

## Pagination

### Query Parameters
```
?limit=20&offset=0
```

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Filtering & Sorting

### Tasks Filtering
```typescript
// By domain type
.eq('domain_type', 'translation')

// By category
.eq('category', 'Translation/Localization')

// By status
.in('status', ['published', 'in_progress'])

// By tier requirement
.lte('required_tier', userTier)

// By amount range
.gte('amount', 10.00)
.lte('amount', 50.00)

// By deadline
.gte('deadline', new Date().toISOString())

// By location (PostGIS - Physical Data tasks)
.rpc('tasks_within_radius', {
  target_lng: 139.6917,
  target_lat: 35.6895,
  radius_meters: 5000
})

// Sorting
.order('created_at', { ascending: false })
.order('amount', { ascending: true })
```

### Workers Filtering
```typescript
// By tier
.eq('tier', 2)

// By certification
.contains('certifications', ['translation'])

// By language pairs
.contains('language_pairs', [{ source: 'en', target: 'ja' }])

// By location proximity (PostGIS)
.rpc('workers_within_radius', {
  target_lng: 139.6917,
  target_lat: 35.6895,
  radius_km: 10
})
```

---

## Real-time Subscriptions

```typescript
// Subscribe to new tasks matching worker certifications
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tasks',
    filter: 'status=eq.published'
  }, (payload) => {
    const task = payload.new
    // Check if worker is certified for this domain
    if (task.domain_type && !workerCertifications.includes(task.domain_type)) {
      return // Skip uncertified tasks
    }
    console.log('New task available:', task)
  })
  .subscribe()

// Subscribe to tier changes
const tierSubscription = supabase
  .channel('tier_changes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'tier_changes',
    filter: `worker_id=eq.${workerId}`
  }, (payload) => {
    console.log('Your tier changed:', payload.new)
  })
  .subscribe()
```

---

## PostGIS Geospatial Queries

### Find Tasks Within Radius
```sql
-- Custom RPC function
CREATE OR REPLACE FUNCTION tasks_within_radius(
  target_lng FLOAT,
  target_lat FLOAT,
  radius_meters INT
)
RETURNS SETOF tasks
LANGUAGE sql
AS $
  SELECT *
  FROM tasks
  WHERE domain_type = 'physical_data'
    AND ST_DWithin(
      physical_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_meters
    )
  ORDER BY physical_location <-> ST_MakePoint(target_lng, target_lat)::geometry;
$;
```

**Usage:**
```typescript
const { data, error } = await supabase
  .rpc('tasks_within_radius', {
    target_lng: 139.6917,
    target_lat: 35.6895,
    radius_meters: 5000
  })
```

### Find Nearby Workers
```sql
CREATE OR REPLACE FUNCTION workers_within_radius(
  target_lng FLOAT,
  target_lat FLOAT,
  radius_km FLOAT
)
RETURNS SETOF workers
LANGUAGE sql
AS $
  SELECT *
  FROM workers
  WHERE current_location IS NOT NULL
    AND ST_DWithin(
      current_location::geography,
      ST_MakePoint(target_lng, target_lat)::geography,
      radius_km * 1000
    )
  ORDER BY current_location <-> ST_MakePoint(target_lng, target_lat)::geometry;
$;
```

---

## Future Enhancements

### Planned Features (Month 4-12)
- [ ] Notifications API (email, push, in-app)
- [ ] Messaging between clients and workers
- [ ] Advanced file upload API (audio/video for Phase 2)
- [ ] Review and rating system with detailed feedback
- [ ] Dispute resolution workflow API
- [ ] Analytics API for clients and workers
- [ ] Bulk operations API
- [ ] WebSocket real-time task matching
- [ ] AI-powered task recommendation engine
- [ ] Multi-language support for platform UI

---

## Testing

### Development Environment
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Supabase: Project-specific URL

### Test Accounts
```
Client: client@example.com / test123456
Worker Tier 1: worker1@example.com / test123456
Worker Tier 2: worker2@example.com / test123456
Admin: admin@example.com / test123456
```

### API Testing Tools
- **Postman**: [Collection TBD]
- **Bruno**: [Collection TBD]
- **cURL**: Examples throughout this document

### Sample cURL Commands

**Create Translation Task:**
```bash
curl -X POST http://localhost:3000/api/tasks/translation \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Validate Japanese UI Localization",
    "description": "Review AI-translated interface text",
    "amount": 35.00,
    "currency": "USD",
    "deadline": "2025-11-15T23:59:59Z",
    "source_language": "en",
    "target_language": "ja",
    "content_type": "UI Text",
    "evaluation_criteria": {
      "accuracy": true,
      "naturalness": true,
      "cultural_appropriateness": true
    }
  }'
```

**Submit Quiz:**
```bash
curl -X POST http://localhost:3000/api/training/submit-quiz \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "training_module_id": "uuid",
    "domain_type": "translation",
    "answers": {
      "q1": "Accuracy, Naturalness, Cultural Appropriateness"
    }
  }'
```

**Verify GPS:**
```bash
curl -X POST http://localhost:3000/api/submissions/verify-gps \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "uuid",
    "submission_location": {
      "lat": 35.6895,
      "lng": 139.6917
    }
  }'
```

---

## Resources

- [Supabase Client Documentation](https://supabase.com/docs/reference/javascript)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Connect Custom Accounts](https://stripe.com/docs/connect/custom-accounts)
- [Express.js Documentation](https://expressjs.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [Turf.js Geospatial](https://turfjs.org/)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-10-31 | Added focus domain endpoints, training API, tier management, quality control, GPS verification, photo validation, PostGIS integration |
| 1.0 | 2025-10-30 | Initial MVP API design |
