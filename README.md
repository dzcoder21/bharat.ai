# 🇮🇳 Bharat.AI v2.0 — Multi-Agent AI Search Engine

> **India ka apna Google** — powered by Claude Sonnet + GPT-4o + Brave Search

---

## 🤖 AI Agent Architecture

```
User Query
    │
    ▼
┌─────────────────────────────────────────────────────┐
│              STAGE 1 — Parallel                     │
│                                                     │
│  ┌──────────────────┐    ┌──────────────────────┐   │
│  │  QueryAgent      │    │  WebFetchAgent        │   │
│  │  (OpenAI GPT-4o) │    │  (Brave / DuckDuckGo) │   │
│  │                  │    │                       │   │
│  │  • Intent detect │    │  • Web results        │   │
│  │  • Query expand  │    │  • News results       │   │
│  │  • Entity extract│    │  • Image results      │   │
│  └────────┬─────────┘    └──────────┬────────────┘   │
└───────────┼──────────────────────────┼───────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────┐
│              STAGE 2 — Parallel                     │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ AnswerAgent  │  │  RankAgent   │  │RelatedAgent│  │
│  │(Claude Sonnet│  │(GPT-4o-mini) │  │(GPT-4o-mini│  │
│  │+ web_search) │  │              │  │            │  │
│  │              │  │ • Re-rank    │  │• Related Q │  │
│  │ • AI answer  │  │ • Feat snippet│  │• People ask│  │
│  │ • Cited facts│  │ • Knowledge  │  │• Autocomplete│ │
│  └──────────────┘  │   panel      │  └───────────┘  │
│                    └──────────────┘                 │
└─────────────────────────────────────────────────────┘
            │
            ▼
    Final Response (~3-5s)
```

---

## ✨ Features

| Feature | Powered By |
|---|---|
| 🤖 AI Answer with citations | Claude Sonnet + web_search |
| 🧠 Query understanding & expansion | OpenAI GPT-4o |
| 📊 Smart result ranking | GPT-4o-mini |
| ❓ People Also Ask | GPT-4o-mini |
| 🔗 Related searches | GPT-4o-mini |
| 💡 Autocomplete | GPT-4o-mini |
| 🗂️ Knowledge Panel | GPT-4o-mini |
| 🌐 Web + News + Images | Brave Search API |
| 🕐 Search history | MongoDB |
| 🔥 Trending searches | MongoDB aggregation |
| ⚡ Result caching | node-cache (5 min TTL) |

---

## 🗂️ Project Structure

```
bharat-ai/
├── server/
│   ├── agents/
│   │   ├── queryAgent.js        # OpenAI GPT-4o — intent + expansion
│   │   ├── answerAgent.js       # Claude Sonnet — AI answer + web search
│   │   ├── rankAgent.js         # GPT-4o-mini — ranking + knowledge panel
│   │   ├── relatedAgent.js      # GPT-4o-mini — related + PAA
│   │   └── webFetchAgent.js     # Brave Search / DuckDuckGo
│   ├── config/
│   │   ├── aiClients.js         # OpenAI + Anthropic client init
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   └── searchController.js
│   ├── models/
│   │   └── Search.js
│   ├── routes/
│   │   └── search.js
│   ├── services/
│   │   ├── orchestrator.js      # Main pipeline coordinator
│   │   └── cache.js             # In-memory result cache
│   ├── index.js
│   └── .env.example
│
├── client/
│   └── src/
│       ├── components/results/
│       │   ├── AIAnswerCard     # Claude's answer with copy/collapse
│       │   ├── WebResultCard    # Individual result with deeplinks
│       │   ├── NewsCard         # News result with thumbnail
│       │   ├── ImageGrid        # Masonry image grid + lightbox
│       │   ├── KnowledgePanel   # Entity info sidebar
│       │   ├── PeopleAlsoAsk    # Accordion FAQ section
│       │   ├── RelatedSearches  # 2-col grid of related queries
│       │   ├── FeaturedSnippet  # Featured snippet box
│       │   └── ResultsSkeleton  # Shimmer loading skeleton
│       ├── pages/
│       │   ├── Home.jsx         # Google-like landing page
│       │   └── Results.jsx      # Full results page with tabs
│       ├── hooks/
│       │   └── useDebounce.js
│       └── utils/
│           └── api.js
└── package.json
```

---

## 🚀 Quick Start

### 1. Extract & Install
```bash
unzip bharat-ai.zip && cd bharat-ai
npm run install-all
```

### 2. Set API Keys
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
ANTHROPIC_API_KEY=sk-ant-...    # console.anthropic.com
OPENAI_API_KEY=sk-...           # platform.openai.com/api-keys
BRAVE_API_KEY=BSA...            # api.search.brave.com (free: 2000/month)
MONGODB_URI=mongodb://localhost:27017/bharatai
```

### 3. Run
```bash
npm run dev
# → Frontend: http://localhost:3000
# → Backend:  http://localhost:5000
```

---

## 🔑 API Keys — Where to Get

| Key | URL | Cost |
|---|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/ | Pay-per-use |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Pay-per-use |
| `BRAVE_API_KEY` | https://api.search.brave.com/ | Free: 2000/mo |
| `MONGODB_URI` | https://mongodb.com/atlas | Free tier |

> **Minimum required:** Only `ANTHROPIC_API_KEY` + `OPENAI_API_KEY`  
> Without Brave, DuckDuckGo fallback is used automatically.

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/search?q=...` | Full AI search |
| `GET` | `/api/search/autocomplete?q=...` | Autocomplete suggestions |
| `GET` | `/api/search/history` | Recent searches |
| `DELETE` | `/api/search/history` | Clear history |
| `GET` | `/api/search/trending` | Trending queries |
| `GET` | `/api/health` | Server health + agent status |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, CSS Modules |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| AI Agent 1 | OpenAI GPT-4o (query understanding) |
| AI Agent 2 | Anthropic Claude Sonnet (AI answers) |
| AI Agent 3 | OpenAI GPT-4o-mini (ranking) |
| AI Agent 4 | OpenAI GPT-4o-mini (related/PAA) |
| Web Search | Brave Search API / DuckDuckGo fallback |
| Caching | node-cache (in-memory, 5min TTL) |
| Security | Helmet, CORS, Rate Limiter |

---

*Jai Hind! 🇮🇳 — Made with ❤️ in India*
