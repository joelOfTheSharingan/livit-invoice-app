# Livit Invoice App

Invoice management system for Livit Interiors — built with React, Vite, and Supabase.

## Setup

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

## Architecture

```
src/
├── auth/          Authentication hook
├── components/    UI components (dashboard, chatbot, common, layout)
├── hooks/         Stateful business logic hooks
├── lib/           Supabase client init
├── pages/         Page-level controllers (Dashboard, Login)
├── services/      External communication (Supabase, AI, PDF)
├── store/         Shared state factories and constants
├── styles/        Global CSS, variables, utilities
└── utils/         Pure helper functions (calculations, formatting)

api/
└── chat.js        Serverless proxy — keeps OpenRouter key server-side
```

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` | Supabase anon key |
| `OPENROUTER_API_KEY` | Vercel env / `.env` | OpenRouter key (server-side only) |

## Deploy

Push to GitHub → import in Vercel → add env vars → done.
