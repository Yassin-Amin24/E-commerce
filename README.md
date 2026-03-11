# ClothesMart

Full-stack marketplace with listings, chats, and seller tools. Backend: FastAPI + PostgreSQL (Neon). Frontend: React + TypeScript + Tailwind. Docker has been removed; everything runs locally or on Vercel (Python serverless for the API, static build for the UI).

## Stack
- Backend: FastAPI, SQLAlchemy (async, PostgreSQL), Pydantic v2, Alembic, JWT (python-jose), passlib/bcrypt
- Frontend: React 18, TypeScript, Vite, TailwindCSS, React Router, Zustand
- DB: Neon (managed Postgres) via `DATABASE_URL` (sslmode=require recommended)

## Prerequisites
- Python 3.11+
- Node 18+
- Neon database URL (copy to `DATABASE_URL`)

## Project Structure

```
E-commerce/
├── api/                # Vercel serverless entrypoint for FastAPI
├── backend/            # FastAPI app and Alembic migrations
├── frontend/           # React/Vite frontend
├── vercel.json         # Vercel build + routing config
└── README.md
```

## Backend setup (local)
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env  # fill in DATABASE_URL, SECRET_KEY, etc.

# Run migrations
alembic upgrade head

# (optional) seed sample data
python seed.py

# start API
uvicorn main:app --reload --port 8000
```

Key env vars (see `backend/.env.example`):
- `DATABASE_URL` (Neon connection string, include `sslmode=require`)
- `SECRET_KEY`, `ALGORITHM`
- `ALLOWED_ORIGINS` (comma-separated list; include your Vercel domain)
- `LOG_LEVEL`, `ECHO_SQL`

## Frontend setup (local)
```bash
cd frontend
npm install

# copy env and adjust if you want a direct URL instead of the proxy
cp .env.example .env

npm run dev
```
- Dev server: http://localhost:5173
- The Vite dev server proxies `/api` to `http://localhost:8000` by default (configurable via `VITE_API_PROXY_TARGET`).

## Vercel deployment (serverless backend + static frontend)
- `vercel.json` builds the frontend from `frontend/` and exposes the FastAPI app through `api/index.py` using the Python 3.11 runtime.
- Set **Project Settings → Build & Output** root to repo root (not frontend).
- Set environment variables in Vercel:
	- Backend: `DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ALLOWED_ORIGINS` (include your Vercel domain), `LOG_LEVEL`, `ECHO_SQL`
	- Frontend: `VITE_API_URL` should stay `/api` so calls hit the colocated backend function.
- Deploy: `vercel --prod` (or through the dashboard). No Docker is required.

## API quick ref
- Auth: POST /auth/signup, POST /auth/login, GET /auth/me
- Products: GET /products, GET /products/{id}, POST /products, DELETE /products/{id}, GET /products/mine
- Conversations: POST /conversations, GET /conversations, GET /conversations/{id}/messages, POST /conversations/{id}/messages, POST /conversations/{id}/delivered, POST /conversations/{id}/read, DELETE /conversations/{id}

### Sample accounts
- mia@sellers.test / Password123!
- owen@sellers.test / Password123!

### Notes
- Image input is URL-only (no file uploads). If a URL lacks protocol, the UI prefixes https://.
- Deleting a listing also removes its conversations.
- Message status is stored as lowercase strings (sent/delivered/read).
- Auth token is stored via Zustand (localStorage).

## Schema (simplified)
- users: id, email, full_name, password_hash, created_at
- products: id, name, description, price, location, image_urls (JSONB), seller_id, created_at
- conversations: id, product_id, buyer_id, seller_id, created_at (unique product+buyer+seller)
- messages: id, conversation_id, sender_id, receiver_id, content, status, sent_at, delivered_at, read_at

## Common tasks
- Run migrations: `alembic upgrade head`
- Seed data: `python seed.py`

## License
For portfolio/demo use.
