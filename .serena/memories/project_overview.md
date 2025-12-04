# LinguaBridge Project Overview

## Purpose
LinguaBridge is a specialized LLM annotation platform connecting AI companies with skilled annotators, focusing on African and Southeast Asian languages at competitive prices (50% below Scale AI).

## Target Customers
- AI/ML Startups (primary)
- Research Institutions (primary)
- Annotation Companies (secondary)

## Key Features
- Batch processing: 1,000-10,000+ tasks per project
- 5 annotation types: Classification, NER, RLHF Ranking, Evaluation, Translation Validation
- Quality control: Gold standard tasks, Inter-Annotator Agreement (IAA)
- Annotator tier system: Standard → Pro (auto-promotion)
- Languages: English, Akan, Hausa, Yoruba, Igbo, Nigerian Pidgin, Turkish

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS (Vite, Vercel)
- **Backend**: Node.js 20 + Express + TypeScript (Railway)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Payments**: Stripe Connect

## Repository Structure
```
linguabridge/
├── frontend/          # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       ├── contexts/
│       └── types/
├── backend/           # Node.js backend
│   └── src/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       └── services/
├── database/          # Supabase migrations
└── claudedocs/        # Documentation
```

## Current Status
MVP Development Phase - Building annotation UI components
