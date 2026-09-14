# Developer notes

This repo is a **REST Auth + Media starter**.

## Stack

- NestJS + TypeORM + Postgres
- JWT cookie auth, Google OAuth
- OTP (SMTP email; Twilio SMS or Discord when `SMS_DEBUG=true`)
- RBAC (roles + permissions)
- Media upload (`STORAGE_TYPE=local|cloud`, DigitalOcean Spaces)

## Layout

```
src/
  config/env.config.ts
  modules/auth|user|role|permission
  modules/common/otp|media
  infra/database|mail|sms|redis
```

## Commands

```bash
npm run dev
npm run db:seed
npm run build
```

See root [README.md](../README.md) for env vars and API surface.
