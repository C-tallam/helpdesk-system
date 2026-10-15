# IT Helpdesk & Ticketing System

Full-stack helpdesk app: React frontend + Express/MongoDB API (JWT auth, roles: user / agent / admin).

- `server/` REST API (this step)
- `client/` React frontend (coming next)

## Run the API locally
```bash
cd server
npm install
copy .env.example .env      # then edit .env
npm run dev
```
Health check: http://localhost:5001/api/health

## Roles
Anyone can register as a normal **user** (own tickets only). Promote staff with:
`npm run set-role -- someone@example.com agent` (or `admin`).

## Main endpoints (all except register/login/health need `Authorization: Bearer <token>`)
| Method | Path | Who |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | any user |
| POST/GET | /api/tickets | user (own) / staff (all) |
| GET | /api/tickets/stats | staff |
| GET/PATCH | /api/tickets/:id | owner or staff (owner may only close) |
| DELETE | /api/tickets/:id | admin |
| GET/POST | /api/tickets/:id/comments | owner or staff (internal notes: staff only) |
| GET | /api/users/agents | staff |
| GET | /api/users, PATCH /api/users/:id/role | admin |
