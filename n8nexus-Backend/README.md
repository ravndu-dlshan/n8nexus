<div align="center">

# 🐍 N8Nexus API

### FastAPI backend for AI → n8n automation

**OpenAI chat** · **workflow generation** · **n8n deploy** · **per-user automation storage**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-LangChain-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![n8n](https://img.shields.io/badge/n8n-Integration-FF6D5A?style=flat-square)](https://n8n.io)

🔗 Pairs with the **[N8Nexus frontend](../n8Nexus/README.md)**

</div>

---

## 🔄 How it works

```
💬 Chat  →  🔍 Sync  →  ⚙️ Generate  →  🚀 Deploy  →  💾 Automations
   │            │              │              │              │
   │     Extract template     Fill JSON     Push to n8n    Save to DB
   │     + field values       from templates  via REST API   (PostgreSQL)
   └──────────────────────────────────────────────────────────────────┘
```

| Step | What happens |
|:----:|:-------------|
| 1️⃣ | **Chat** — AI guides users through describing an automation and collecting template fields |
| 2️⃣ | **Sync** — LLM extracts template ID + field values from the conversation |
| 3️⃣ | **Generate** — Fills pre-built n8n workflow JSON from `n8n_templates/` |
| 4️⃣ | **Deploy** — Creates or updates workflows on your n8n instance |
| 5️⃣ | **Automations** — Persists results per Supabase user (when DB is configured) |

---

## 🛠️ Tech stack

| Layer | Tools |
|:------|:------|
| 🚀 **API** | [FastAPI](https://fastapi.tiangolo.com) · Uvicorn |
| 🧠 **LLM** | LangChain · OpenAI (`langchain-openai`) |
| 💾 **Sessions** | In-memory chat + workflow state |
| 🐘 **Database** | SQLAlchemy 2 · PostgreSQL (`psycopg`) |
| 🔐 **Auth** | Supabase JWT (JWKS or shared secret) |
| 🔗 **Integrations** | n8n REST API (`httpx`) |

---

## 📋 Prerequisites

- 🐍 **Python** 3.11+
- 🔑 **OpenAI API key**
- ⚡ **n8n instance** with API access (`N8N_BASE_URL`, `N8N_API_KEY`)
- 🔐 **Supabase** project (for `/automations` routes)
- 🐘 **PostgreSQL** (e.g. Supabase DB) — optional, required for saved automations

---

## 🚀 Quick start

```bash
cd OpenAi-chat
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env      # ✏️ add your keys
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

| URL | Purpose |
|:----|:--------|
| 🏠 http://127.0.0.1:8000/ | API root |
| 📖 http://127.0.0.1:8000/docs | Interactive Swagger UI |
| 📄 http://127.0.0.1:8000/openapi.json | OpenAPI schema |

### 💻 CLI chat (no server)

```bash
python main.py
```

Terminal-only OpenAI chat — same system prompt, great for quick LLM tests.

---

## 🔐 Environment variables

Copy `.env.example` → `.env`. **Never commit** `.env`.

| Variable | Required | Description |
|:---------|:--------:|:------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `OPENAI_CHAT_MODEL` | ➖ | Default model (`gpt-4o-mini`) |
| `N8N_BASE_URL` | 🚀 deploy | n8n instance URL, no trailing slash |
| `N8N_API_KEY` | 🚀 deploy | n8n API key |
| `DATABASE_URL` | 💾 | PostgreSQL connection string |
| `SUPABASE_URL` | 🔐 | Supabase project URL (JWKS auth) |
| `SUPABASE_JWT_SECRET` | 🔐 alt | HS256 secret if not using JWKS |
| `CORS_ORIGINS` | ➖ | Extra comma-separated allowed origins |

> 💡 Defaults already allow `localhost:5173`, `8081`, etc. and `*.vercel.app` via regex.

### 🟢 Minimal setup (chat + workflows)

```env
OPENAI_API_KEY=sk-...
N8N_BASE_URL=https://your-instance.n8n.cloud
N8N_API_KEY=your-n8n-api-key
```

### 🟣 Full stack (frontend + saved automations)

```env
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
N8N_BASE_URL=https://your-instance.n8n.cloud
N8N_API_KEY=your-n8n-api-key
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
CORS_ORIGINS=https://n8nexus-frontend.vercel.app,http://localhost:8081
```

> ✅ On startup, if `DATABASE_URL` is set, the `automations` table is created automatically.

---

## 📡 API overview

Routes are mounted **twice**: `/chat/...` and `/api/chat/...`

### 💬 Chat

| Method | Path | Description |
|:------:|:-----|:------------|
| `POST` | `/chat` | Stateless multi-turn chat |
| `POST` | `/chat/sessions` | Create new session |
| `POST` | `/chat/session` | Send message (with history) |
| `POST` | `/chat/session/stream` | Streaming NDJSON tokens |
| `GET` | `/chat/sessions/{id}` | History + workflow snapshot |
| `DELETE` | `/chat/sessions/{id}` | Delete session |

### 🔧 Workflows

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/workflows/templates` | List built-in templates |
| `GET` | `/workflows/sessions/{id}/status` | Template, fields, readiness |
| `POST` | `/workflows/sessions/{id}/sync` | LLM field extraction |
| `POST` | `/workflows/sessions/{id}/generate` | Build n8n workflow JSON |
| `POST` | `/workflows/sessions/{id}/deploy` | Push to n8n |

> 🔒 Generate/deploy save to DB when `DATABASE_URL` + `Authorization: Bearer <jwt>` are present.

### 🤖 Automations *(auth required)*

| Method | Path | Description |
|:------:|:-----|:------------|
| `GET` | `/automations` | List user's automations |
| `GET` | `/automations/{id}` | Get one automation |
| `GET` | `/automations/by-session/{id}` | Lookup by chat session |
| `POST` | `/automations/{id}/run` | Trigger workflow |

| Status | Meaning |
|:------:|:--------|
| `503` | `DATABASE_URL` not configured |
| `401` | Missing or invalid Supabase JWT |

---

## 📋 Workflow templates

Templates in `n8n_templates/` · registered in `n8n_registry.py`:

| ID | Template |
|:---|:---------|
| `manual_set` | 👆 Manual trigger → Set node |
| `manual_http` | 🌐 Manual trigger → HTTP request |
| `webhook_lead` | 📥 Webhook → lead capture |
| `webhook_ai` | 🤖 Webhook → mock AI reply |
| `webhook_supabase` | 🗄️ Webhook → Supabase-style registration |

The system prompt in `prompt.py` guides the model to collect all required fields before generation.

---

## 📂 Project structure

```
OpenAi-chat/
├── main.py                    # 🚀 FastAPI app + routes
├── llm.py                     # 🧠 OpenAI via LangChain
├── prompt.py                  # 💬 n8n assistant system prompt
├── chat_history.py            # 💾 In-memory sessions
├── workflow_state.py          # 📋 Per-session workflow fields
├── workflow_service.py        # 🔄 Sync · generate · deploy
├── workflow_builder.py        # ⚙️ Template JSON filling
├── n8n_client.py              # 🔗 n8n REST client
├── n8n_deploy.py              # 🚀 Deploy helpers
├── n8n_registry.py            # 📋 Template definitions
├── n8n_templates/             # 📁 Base workflow JSON
├── automation_service.py        # 💾 DB CRUD
├── automation_run_service.py  # ▶️ Run automations
├── auth.py                    # 🔐 Supabase JWT
├── db/
│   ├── database.py
│   └── models.py
└── requirements.txt
```

---

## 🚂 Deployment (Railway / similar)

1. ⚙️ Set all env vars in your host dashboard
2. 🚀 Start command:

   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

3. 🌐 Point frontend `VITE_API_BASE_URL` at your API URL
4. 🔓 Add frontend URL to `CORS_ORIGINS`

> ⚠️ **Session state is in-memory** — chat/workflow state is lost on restart. Automations in PostgreSQL **persist**.

---

## 🧪 Development notes

| Topic | Detail |
|:------|:-------|
| 🌍 **CORS** | Extend via `CORS_ORIGINS`; `*.vercel.app` allowed by regex |
| 🐘 **DB URL** | `postgres://` auto-normalized to `postgresql+psycopg://` |
| 📝 **Logging** | See `logger.py` for LLM and n8n errors |
| 🧪 **Tests** | `scripts/test_n8n_deploy.py` for deploy smoke tests |

---

## 🩺 Troubleshooting

| Symptom | Likely fix |
|:--------|:-----------|
| `502` on chat | Check `OPENAI_API_KEY`, model name, OpenAI quota |
| `400` workflow not ready | Run **sync**; fill missing fields in chat |
| Deploy fails | Verify `N8N_BASE_URL`, `N8N_API_KEY`, API permissions |
| Automations not saved | Set `DATABASE_URL` + valid Bearer token + `SUPABASE_URL` |
| `401` on `/automations` | Frontend must send Supabase access token |
| CORS from browser | Add frontend origin to `CORS_ORIGINS` |

---

## 🔗 Related

| Resource | Link |
|:---------|:-----|
| ⚛️ **Frontend** | [n8Nexus README](../n8Nexus/README.md) |
| 📋 **All env vars** | [Root `.env.example`](../.env.example) |

---

<div align="center">

**Powering N8Nexus automations — one API call at a time** 🚀

*Private project — add a license if you open-source the repo.*

</div>
