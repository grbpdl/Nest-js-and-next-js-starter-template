# Customer Engagement Starter

Monorepo with a ready-to-use NestJS REST API and Next.js frontend focused on auth and RBAC.

## Packages

| Folder | Stack | Port |
|--------|-------|------|
| [`backend-starter`](backend-starter) | NestJS + TypeORM + Postgres | 3000 |
| [`frontend-starter`](frontend-starter) | Next.js App Router | 3001 |
| [`refrence-project`](refrence-project) | Full GraphQL reference (not required to run the starter) |

## Run locally

```bash
# backend
cd backend-starter
cp .env.example .env
npm install && npm run db:seed && npm run dev

# frontend (another terminal)
cd frontend-starter
cp .env.example .env.local
npm install && npm run dev
```

Seeded super admin uses `ADMIN_USER_*` from the backend `.env`.

## Role → UI

| Role | After login |
|------|-------------|
| `user` | Profile |
| `admin` | Profile + roles/permissions list |
| `super_admin` | Profile + Create User + Create Admin |
