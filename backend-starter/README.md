# Starter API

NestJS REST starter with auth, OTP, Google OAuth, RBAC, and local/cloud media upload.

## Features

- **Auth**: register (+ OTP verify), login (JWT httpOnly cookie), logout, refresh, `/auth/me`
- **OTP**: email via SMTP; phone via Twilio, or Discord when `SMS_DEBUG=true`
- **Google OAuth**: `/auth/google` + callback (redirects to frontend `ORIGIN`)
- **RBAC**: roles (`super_admin`, `admin`, `user`) + permissions; `super_admin` bypasses guards
- **Admin create**: `POST /user` and `POST /user/admin` (super_admin only, verified accounts)
- **Media**: `STORAGE_TYPE=local` or `cloud` (DigitalOcean Spaces)

## Quick start

```bash
cp .env.example .env
# fill Postgres, JWT, mail, ORIGIN=http://localhost:3001, optional Discord/Twilio/Google/Spaces
npm install
npm run db:seed
npm run dev
```

Swagger: [http://localhost:3000/api](http://localhost:3000/api)

Pair with [`../frontend-starter`](../frontend-starter) on port **3001**.

Authenticated routes accept either:

- **Browser**: httpOnly `access_token` cookie (`credentials: 'include'`)
- **Mobile**: `Authorization: Bearer <access_token>` from login `data.access_token`

## Main REST routes

| Area | Routes |
|------|--------|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `GET /auth/me`, `/auth/google` |
| OTP | `POST /otp/send`, `/otp/verify`, `/otp/resend`, `/otp/send/me` |
| User | `POST /user` (super_admin → role `user`), `POST /user/admin` (super_admin → role `admin`), CRUD |
| Role / Permission | CRUD + assign under `/role`, `/permission` |
| Media | `/media`, `/files` |

Self-signup uses **`POST /auth/register`** then **`POST /otp/verify`** (`purpose: verify_email`). Login requires a verified email.

`GET /auth/me` returns roles plus flat `permissions: string[]` (`entity:action`).

## Seed admin

Set `ADMIN_USER_EMAIL`, `ADMIN_USER_PASSWORD`, `ADMIN_USER_PHONE` then `npm run db:seed`.
