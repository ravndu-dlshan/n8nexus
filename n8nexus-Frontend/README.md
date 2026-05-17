<div align="center">

# ⚡ N8Nexus Frontend

### Describe a process. Ship an n8n workflow.

**AI-powered workflow builder** — turn plain English (and your docs) into production-ready **n8n** automations.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TanStack](https://img.shields.io/badge/TanStack-Start-FF4154?style=flat-square)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-Auth-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)

🔗 Pairs with the **[FastAPI backend](../OpenAi-chat/README.md)**

</div>

---

## ✨ Features

| | |
|---|---|
| 🏠 **Marketing site** | Landing page, pricing, and product overview |
| 🔐 **Supabase auth** | Sign up, login, password reset, OAuth callback |
| 💬 **AI chat workspace** | Conversational workflow design with streaming replies |
| 🔧 **Workflow builder** | Sync fields from chat → generate n8n JSON → deploy |
| 📊 **Automations dashboard** | List, inspect, and run saved automations |
| 📁 **Dashboard extras** | Templates, documents, business profile, activity |

---

## 🛠️ Tech stack

| Layer | Tools |
|:------|:------|
| ⚛️ **Framework** | [TanStack Start](https://tanstack.com/start) · [TanStack Router](https://tanstack.com/router) |
| 🎨 **UI** | React 19 · Radix UI · Tailwind CSS v4 · shadcn-style components |
| 📡 **Data** | TanStack Query · typed API client (`src/lib/api/`) |
| 🔑 **Auth** | [Supabase](https://supabase.com) |
| 📦 **Build** | Vite 7 |
| 🚀 **Deploy** | Vercel (Nitro) · Cloudflare Workers (Wrangler) |

---

## 📋 Prerequisites

- 🟢 **Node.js** 20+ (LTS recommended)
- 📦 **npm** (or pnpm / yarn)
- 🐍 Running **[FastAPI backend](../OpenAi-chat/README.md)** for local full-stack dev
- 🔐 **Supabase project** (URL + anon key)

---

## 🚀 Quick start

```bash
cd n8Nexus
npm install
cp .env.example .env   # ✏️ edit values — see below
npm run dev
```

👉 Open **http://localhost:8081**

> 💡 With `VITE_API_BASE_URL=/api`, Vite proxies API calls to `http://127.0.0.1:8000` (see `vite.config.ts`).

---

## 🔐 Environment variables

Copy `.env.example` → `.env`. Only `VITE_*` vars are exposed to the browser.

| Variable | Required | Description |
|:---------|:--------:|:------------|
| `VITE_API_BASE_URL` | ✅ prod | Backend URL — use `/api` locally or full HTTPS in production |
| `VITE_API_PROXY_TARGET` | ➖ | Proxy target for `/api` (default `http://127.0.0.1:8000`) |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous (public) key |

### 🏠 Local development (recommended)

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

1. Start the backend (`uvicorn` on port **8000**)
2. Run `npm run dev`

### 🌐 Production

```env
VITE_API_BASE_URL=https://your-api.up.railway.app
```

> ⚠️ Add your frontend origin to the backend `CORS_ORIGINS` (see [backend README](../OpenAi-chat/README.md)).

---

## 📜 Scripts

| Command | What it does |
|:--------|:-------------|
| `npm run dev` | 🖥️ Dev server on port **8081** |
| `npm run build` | 📦 Production build |
| `npm run build:dev` | 🔨 Build in development mode |
| `npm run preview` | 👀 Preview production build |
| `npm run lint` | 🧹 ESLint |
| `npm run format` | ✨ Prettier |

---

## 📂 Project structure

```
n8Nexus/
├── src/
│   ├── routes/              # 🗺️ File-based routes (TanStack Router)
│   │   ├── index.tsx        # 🏠 Landing page
│   │   ├── login.tsx …      # 🔐 Auth pages
│   │   └── _dash.*          # 📊 Dashboard (chat, automations, …)
│   ├── components/          # 🧩 UI, chat, marketing, layout
│   ├── lib/
│   │   ├── api/             # 📡 Backend client
│   │   └── supabase.ts      # 🔑 Auth client
│   └── server.ts            # ⚙️ SSR entry (TanStack Start)
├── vite.config.ts           # ⚡ Dev server + proxy + deploy plugins
├── wrangler.jsonc           # ☁️ Cloudflare Workers
└── .env.example
```

### 🗺️ Main routes

| Path | Page |
|:-----|:-----|
| `/` | 🏠 Marketing landing |
| `/login` · `/signup` · `/forgot-password` | 🔐 Authentication |
| `/dashboard` | 📊 Dashboard home |
| `/chat` | 💬 AI workflow chat |
| `/automations` | 🤖 Saved automations |
| `/templates` | 📋 Workflow templates |
| `/documents` · `/business-profile` · `/settings` · `/activity` | 📁 Supporting pages |

---

## 🔌 API integration

All requests flow through `src/lib/api/client.ts`:

- 🌐 Resolves base URL via `getApiBaseUrl()`
- 🎫 Sends `Authorization: Bearer <supabase_jwt>` when signed in
- 🔗 Mirrors backend routes: `/chat/*` · `/workflows/*` · `/automations/*`

> 🔒 **Generate**, **deploy**, and **automation** endpoints need a valid Supabase session + backend `DATABASE_URL`.

---

## ☁️ Deployment

### ▲ Vercel

1. Connect the `n8Nexus` folder (or monorepo subpath)
2. Set env vars: `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
3. Deploy — Nitro activates when `VERCEL` is set

Example: `https://n8nexus-frontend.vercel.app` — add this URL to backend **CORS**.

### ☁️ Cloudflare Workers

Uses `@cloudflare/vite-plugin` when not on Vercel. Set secrets in the dashboard and deploy with **Wrangler** (`wrangler.jsonc`).

---

## 🩺 Troubleshooting

| Symptom | Fix |
|:--------|:----|
| ⏱️ API timeout / network error | Backend on port **8000**? `VITE_API_BASE_URL=/api` + proxy target correct? |
| 🚫 CORS in production | Add frontend URL to backend `CORS_ORIGINS` |
| 🔐 “Sign in required” | Logged in? JWT valid? Backend `SUPABASE_URL` matches project |
| 📭 Empty automations list | Backend `DATABASE_URL` set? User authenticated? |

---

## 🔗 Related

| Resource | Link |
|:---------|:-----|
| 🐍 **Backend API** | [OpenAi-chat README](../OpenAi-chat/README.md) |
| 📋 **All env vars** | [Root `.env.example`](../.env.example) |

---

<div align="center">

**Built with ❤️ for n8n automation**

*Private project*

</div>
