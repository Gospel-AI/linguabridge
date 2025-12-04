# LinguaBridge

**LLM Annotation Platform for Multilingual Data**

> A specialized annotation platform connecting AI companies with skilled annotators, with a focus on African and Southeast Asian languages.

---

## Overview

LinguaBridge is an LLM annotation platform designed for:
- **AI/ML Startups** building multilingual models
- **Research Institutions** collecting training data
- **Annotation Companies** seeking reliable outsourcing partners

### Key Features

- **Multilingual Focus**: English + African languages (Akan/Twi, Hausa, Yoruba, Igbo, Nigerian Pidgin)
- **Batch Processing**: Upload 1,000-10,000+ tasks at once
- **Quality Control**: Inter-annotator agreement, gold standard validation
- **Competitive Pricing**: 50% below major competitors (Scale AI, Appen)
- **API + Web UI**: Both programmatic and manual workflows supported
- **Annotation Types**: Text classification, NER, RLHF ranking, translation validation

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Node.js 20 + Express |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Payments** | Stripe Connect |
| **Hosting** | Vercel (Frontend) + Railway (Backend) |

---

## Getting Started

### Prerequisites
- Node.js 20 LTS
- Git
- Supabase account
- Stripe account

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/linguabridge.git
cd linguabridge

# Frontend setup
cd frontend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev

# Backend setup (new terminal)
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase and Stripe credentials
npm run dev
```

---

## Project Structure

```
linguabridge/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── types/      # TypeScript types
├── backend/            # Node.js backend
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── controllers/# Business logic
│   │   ├── middleware/ # Auth, validation
│   │   └── services/   # External integrations
├── claudedocs/         # Project documentation
└── database/           # Supabase migrations
```

---

## Supported Languages

### Phase 1 (Launch)
| Language | Region | Speakers |
|----------|--------|----------|
| English | Global | 1.5B |
| Akan (Twi/Fante) | Ghana | 11M |
| Hausa | Nigeria | 70M |
| Yoruba | Nigeria | 45M |
| Igbo | Nigeria | 40M |
| Nigerian Pidgin | Nigeria | 75M |

### Phase 2 (Planned)
- Swahili (East Africa)
- Amharic (Ethiopia)
- Thai, Vietnamese, Indonesian (Southeast Asia)

---

## Annotation Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Text Classification** | Categorize text into labels | Sentiment, topic, safety |
| **Named Entity Recognition** | Tag entities in text | NER models, information extraction |
| **Comparison Ranking** | Rank multiple responses | RLHF, preference learning |
| **Text Evaluation** | Rate text quality (1-5) | AI output quality assessment |
| **Translation Validation** | Verify translation quality | MT quality control |

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

## Contact

- **Issues**: [GitHub Issues](https://github.com/your-org/linguabridge/issues)
- **Email**: [contact email]
