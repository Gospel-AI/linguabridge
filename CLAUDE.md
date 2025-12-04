# LinguaBridge - LLM Annotation Platform

**Version**: v1.0 (2025-12-04)
**Status**: MVP Development Phase

> **Language Versions**:
> - English: [CLAUDE.md](./CLAUDE.md) - For Ghana development team
> - Japanese: [CLAUDE.jp.md](./CLAUDE.jp.md) - For Japanese planning team

---

## Project Overview

LinguaBridge is a **specialized LLM annotation platform** connecting AI companies with skilled annotators, focusing on **African and Southeast Asian languages** at competitive prices.

### Target Customers

| Segment | Description | Priority |
|---------|-------------|----------|
| **AI/ML Startups** | Small teams building multilingual models | Primary |
| **Research Institutions** | Universities collecting training data | Primary |
| **Annotation Companies** | Outsourcing partners for overflow work | Secondary |

### Core Value Proposition

**For Customers**:
- 50% lower cost than Scale AI, Appen
- Specialized African language coverage (Akan, Hausa, Yoruba, Igbo)
- Batch processing (1,000-10,000+ tasks)
- API + Web UI for flexible workflows
- Quality control with IAA and gold standards

**For Annotators**:
- Flexible remote work opportunity
- Specialized training in LLM annotation
- Performance-based tier system
- Competitive compensation

### Differentiation

| Factor | Scale AI | MTurk | LinguaBridge |
|--------|----------|-------|--------------|
| **Price** | High | Low | **Low-Medium** |
| **Quality** | High | Low | **Medium-High** |
| **African Languages** | Limited | None | **Specialized** |
| **Min Order** | Large | None | **1,000 tasks** |
| **Target** | Enterprise | Individual | **Startups/Research** |

---

## Supported Languages

### Phase 1 (Launch)

| Language | Country | Speakers | ISO Code |
|----------|---------|----------|----------|
| English | Global | 1.5B | en |
| Akan (Twi/Fante) | Ghana | 11M | ak |
| Hausa | Nigeria | 70M | ha |
| Yoruba | Nigeria | 45M | yo |
| Igbo | Nigeria | 40M | ig |
| Nigerian Pidgin | Nigeria | 75M | pcm |

### Phase 2 (Planned)
- Swahili (Kenya, Tanzania)
- Amharic (Ethiopia)
- Thai, Vietnamese, Indonesian

---

## Annotation Types

### Text Classification
- **Use Case**: Sentiment analysis, topic classification, safety labels
- **UI**: Multi-select buttons, single-select radio
- **Output**: JSONL with label field

### Named Entity Recognition (NER)
- **Use Case**: Entity tagging for NLP models
- **UI**: Text highlighting with entity type selection
- **Output**: JSONL with spans and entity types

### Comparison Ranking (RLHF)
- **Use Case**: Preference learning, response ranking
- **UI**: Side-by-side comparison, drag-and-drop ranking
- **Output**: JSONL with ranked pairs

### Text Evaluation
- **Use Case**: AI output quality assessment
- **UI**: Likert scale (1-5), rubric-based scoring
- **Output**: JSONL with scores and optional comments

### Translation Validation
- **Use Case**: Machine translation quality check
- **UI**: Source-target display, error highlighting
- **Output**: JSONL with quality scores and error annotations

---

## Technology Stack

### Frontend
- **React 18** + TypeScript + Tailwind CSS
- **Hosting**: Vercel
- **Key Libraries**: react-hook-form, zod, axios

### Backend
- **Node.js 20** + Express + TypeScript
- **Hosting**: Railway
- **Key Libraries**: stripe, swagger, helmet

### Database & Auth
- **Supabase** (PostgreSQL + Auth)
- **Row Level Security** for data isolation

### Payments
- **Stripe Connect** (Custom Accounts)
- **Currency**: USD-based

---

## API Design

### Authentication
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Projects
```
GET    /api/projects                 # List projects
POST   /api/projects                 # Create project
GET    /api/projects/:id             # Get project details
PUT    /api/projects/:id             # Update project
DELETE /api/projects/:id             # Delete project
```

### Tasks (Batch)
```
POST   /api/projects/:id/tasks/batch # Upload tasks (CSV/JSON)
GET    /api/projects/:id/tasks       # List tasks with pagination
GET    /api/projects/:id/export      # Export annotations
```

### Annotations
```
GET    /api/annotator/tasks          # Get available tasks
POST   /api/annotator/tasks/:id      # Submit annotation
GET    /api/annotator/stats          # Annotator statistics
```

### Quality
```
GET    /api/projects/:id/quality     # Quality metrics (IAA, accuracy)
POST   /api/projects/:id/gold        # Upload gold standard tasks
```

---

## Database Schema (Key Tables)

### projects
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  annotation_type TEXT NOT NULL, -- 'classification', 'ner', 'ranking', etc.
  config JSONB, -- labels, instructions, etc.
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  data JSONB NOT NULL, -- input data for annotation
  is_gold BOOLEAN DEFAULT FALSE,
  gold_answer JSONB, -- for gold standard tasks
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### annotations
```sql
CREATE TABLE annotations (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  annotator_id UUID REFERENCES users(id),
  annotation JSONB NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### annotator_profiles
```sql
CREATE TABLE annotator_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  languages JSONB, -- ["en", "ha", "yo"]
  tier TEXT DEFAULT 'standard', -- 'standard', 'pro'
  accuracy_score DECIMAL,
  tasks_completed INTEGER DEFAULT 0,
  certified_types TEXT[] -- ['classification', 'ner']
);
```

---

## Pricing Strategy

### Per-Task Pricing

| Task Type | LinguaBridge | Scale AI | Savings |
|-----------|--------------|----------|---------|
| Text Classification | $0.03-0.08 | $0.10-0.30 | 60-70% |
| NER | $0.08-0.15 | $0.20-0.50 | 60-70% |
| RLHF Ranking | $0.15-0.30 | $0.50-1.00 | 70% |
| Translation Validation | $0.10-0.20 | $0.30-0.60 | 60-70% |

### Volume Discounts
- 1,000-4,999 tasks: Base price
- 5,000-9,999 tasks: 10% discount
- 10,000+ tasks: 15% discount
- Monthly contract: Custom pricing

### Revenue Split
- Platform fee: 18%
- Annotator: 76%
- Stripe: 6%

---

## Quality Control System

### Gold Standard Validation
- Insert 5-10% hidden test tasks
- Auto-calculate annotator accuracy
- Flag low performers for review

### Inter-Annotator Agreement (IAA)
- Duplicate 5-10% of tasks
- Calculate Cohen's Kappa / Fleiss' Kappa
- Report agreement scores to clients

### Annotator Tiers

| Tier | Requirements | Benefits |
|------|--------------|----------|
| Standard | Pass certification | Base rate |
| Pro | 20+ tasks, 4.2+ rating | +20% bonus |

---

## Development Roadmap

### Month 1-2: Core Platform
- [ ] Project creation UI
- [ ] Batch task upload (CSV/JSON)
- [ ] Classification annotation UI
- [ ] NER annotation UI
- [ ] Export functionality

### Month 3-4: Quality & API
- [ ] Gold standard insertion
- [ ] IAA calculation
- [ ] REST API for clients
- [ ] Python SDK

### Month 5-6: Scale & Growth
- [ ] RLHF ranking UI
- [ ] Monthly subscriptions
- [ ] Annotator training system
- [ ] Performance dashboard

---

## Project Structure

```
linguabridge/
├── CLAUDE.md              # This file (English)
├── CLAUDE.jp.md           # This file (Japanese)
├── README.md              # Quick start guide
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page routes
│   │   ├── services/      # API clients
│   │   └── types/         # TypeScript types
├── backend/               # Node.js backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, validation
│   │   └── services/      # External integrations
├── claudedocs/            # Project documentation
└── database/              # Supabase migrations
```

---

## Quick Start

### Development Setup

```bash
# Clone repository
git clone https://github.com/Gospel-AI/linguabridge.git
cd linguabridge

# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev

# Backend (new terminal)
cd backend
npm install
cp .env.example .env
npm run dev
```

### Environment Variables

**Frontend (.env)**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:3000
```

**Backend (.env)**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
STRIPE_SECRET_KEY=your_stripe_key
PORT=3000
```

---

## Team

| Role | Location | Responsibilities |
|------|----------|------------------|
| Planning & Strategy | Japan | Business, marketing, customer acquisition |
| Development | Ghana | Frontend, backend, infrastructure |

---

## Contact

- **GitHub Issues**: Bug reports, feature requests
- **Email**: [contact email]

---

## Update History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-04 | v1.0 | Initial LinguaBridge creation from TaskBridge fork |
