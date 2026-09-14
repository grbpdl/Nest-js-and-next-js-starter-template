# Starter API

NestJS REST starter with auth, OTP, Google OAuth, RBAC, and local/cloud media upload.

## Features

- **Auth**: register (+ OTP verify), login (JWT httpOnly cookie), logout, refresh, `/auth/me`
- **OTP**: email via SMTP; phone via Sparrow SMS, or Discord when `SMS_DEBUG=true`
- **Google OAuth**: `/auth/google` + callback (redirects to frontend `ORIGIN`)
- **RBAC**: roles (`super_admin`, `admin`, `user`) + permissions; `super_admin` bypasses guards
- **Devices**: multi-device login with IP, platform, optional FCM; logout clears FCM so push stops
- **Admin create**: `POST /user` and `POST /user/admin` (super_admin only, verified accounts)
- **Media**: `STORAGE_TYPE=local` or `cloud` (DigitalOcean Spaces)

## Quick start

```bash
cp .env.example .env
# fill Postgres, JWT, mail, ORIGIN=http://localhost:3001, optional Discord/Sparrow/Google/Spaces
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
| Auth | `POST /auth/register`, `/login`, `/logout`, `/forgot-password`, `/reset-password`, `/change-password`, `GET /auth/me`, `/auth/google` |
| Device | `GET /device`, `POST /device/fcm`, `DELETE /device/:deviceId` |
| OTP | `POST /otp/send`, `/otp/verify`, `/otp/resend`, `/otp/send/me` |
| User | `GET /user`, `GET /user/users`, `GET /user/admins`, `POST /user`, `POST /user/admin`, `POST /user/:id/password`, CRUD |
| Role / Permission | CRUD + assign under `/role`, `/permission` |
| Media | `/media`, `/files` |

Self-signup uses **`POST /auth/register`** then **`POST /otp/verify`** (`purpose: verify_email`). Login requires a verified email.

`GET /auth/me` returns roles plus flat `permissions: string[]` (`entity:action`).

## Devices + FCM

On login / refresh, send optional:

```json
{
  "deviceId": "stable-client-id",
  "fcmToken": "firebase-token",
  "deviceInfo": { "platform": "android", "model": "Pixel 8", "osVersion": "14", "appVersion": "1.0.0" }
}
```

The API stores IP (from the request), platform, and FCM per `(userId, deviceId)`.

- `POST /auth/logout` with `{ "deviceId": "..." }` clears that device’s FCM and marks it inactive
- Logout without `deviceId` clears FCM on **all** devices (sessions are also fully revoked via `tokenVersion`)
- `POST /device/fcm` registers/updates FCM after login
- `GET /device` lists the user’s devices

## Seed admin

Set `ADMIN_USER_EMAIL`, `ADMIN_USER_PASSWORD`, `ADMIN_USER_PHONE` then `npm run db:seed`.

## OTP delivery

| Channel | Behavior |
|---------|----------|
| Email | Always SMTP (`MAILER_*`) |
| Phone + `SMS_DEBUG=true` | Discord webhook (`DISCORD_WEBHOOK_URL`) |
| Phone + `SMS_DEBUG=false` | Sparrow SMS (`SPARROW_SMS_TOKEN`, `SPARROW_SMS_FROM`) |
