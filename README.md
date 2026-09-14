# Starter API

NestJS REST starter with auth, OTP, Google OAuth, RBAC, and local/cloud media upload.

## Features

- **Auth**: register, login (JWT httpOnly cookie), logout, `/auth/me`
- **OTP**: email via SMTP; phone via Twilio, or Discord when `SMS_DEBUG=true`
- **Google OAuth**: `/auth/google` + callback
- **RBAC**: roles (`super_admin`, `admin`, `user`) + permissions
- **Media**: `STORAGE_TYPE=local` writes under `UPLOAD_DIR_LOCAL` and serves `/uploads`; `STORAGE_TYPE=cloud` uses DigitalOcean Spaces

## Quick start

```bash
cp .env.example .env
# fill Postgres, JWT, mail, and optional Discord/Twilio/Spaces
npm install
npm run db:seed
npm run dev
```

Swagger: `http://localhost:3000/api`

Authenticated routes accept either:
- **Browser**: httpOnly `access_token` cookie (use `credentials: 'include'`)
- **Mobile**: `Authorization: Bearer <access_token>` from login `data.access_token`

Token pair:
- `access_token` — short-lived (`JWT_ACCESS_EXPIRATION`, default `15m`)
- `refresh_token` — longer-lived (`JWT_REFRESH_EXPIRATION`, default `7d`)

Refresh with `POST /auth/refresh` (cookie, JSON body, or `X-Refresh-Token` header). Logout revokes all sessions.

In Swagger UI open **Authorize** and set cookie and/or bearer (access token).

## OTP delivery

| Channel | Behavior |
|---------|----------|
| Email | Always SMTP (`MAILER_*`) |
| Phone + `SMS_DEBUG=true` | Discord webhook (`DISCORD_WEBHOOK_URL`) |
| Phone + `SMS_DEBUG=false` | Twilio (`TWILIO_*`) |

## Media

```env
STORAGE_TYPE=local   # or cloud
UPLOAD_DIR_LOCAL=./uploads
UPLOAD_DIR_CLOUD=uploads
# DO_SPACES_* when STORAGE_TYPE=cloud
```

- `POST /media/upload` (multipart `file`, auth required)
- `GET /media/:id`, `DELETE /media/:id`
- `GET /files/:id`, `GET /files/:id/url`

## Main REST routes

| Area | Routes |
|------|--------|
| Auth | `POST /auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `GET /auth/me`, `/auth/google` |
| OTP | `POST /otp/send`, `/otp/verify`, `/otp/resend`, `/otp/send/me` |
| User / Role / Permission | CRUD under `/user`, `/role`, `/permission` |
| Media | `/media`, `/files` |

## Seed admin

Set `ADMIN_USER_EMAIL`, `ADMIN_USER_PASSWORD`, `ADMIN_USER_PHONE` then `npm run db:seed`.
# Nest-js-rest-api-starter-template
