# Frontend Starter

Minimal Next.js App Router UI for the NestJS REST auth + RBAC starter.

## Features

- Register → email OTP verify → login
- Google OAuth (redirects via backend `/auth/google`)
- Profile page for all authenticated users
- Left sidebar navigation (account + super-admin links)
- Admins / super admins see assigned roles and permission codes
- Super admin: Create User, Create Admin, Set password

## Quick start

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev
```

App: [http://localhost:3001](http://localhost:3001)

Backend must be running on port 3000 with `ORIGIN=http://localhost:3001` so cookie auth and Google callback work.

## Screens

| Route | Who |
|-------|-----|
| `/login`, `/register`, `/verify` | Public |
| `/forgot-password`, `/reset-password` | Public (OTP via email or phone) |
| `/profile`, `/change-password` | Any authenticated user |
| `/admin/users/create`, `/admin/admins/create`, `/admin/users/set-password` | `super_admin` |
| `/auth/callback` | Google OAuth return |

## Auth notes

Browser calls use `credentials: 'include'` against the API origin. Login sets httpOnly cookies on the API host.
