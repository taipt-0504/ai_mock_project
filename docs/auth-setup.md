# Auth.js + Google Cloud Setup

This guide walks through provisioning the Google OAuth client and the Auth.js
server-side secret needed to run the Login flow locally and in production.

## 1. Generate `AUTH_SECRET`

Auth.js signs and encrypts session cookies with this 256-bit key. Generate one
per environment:

```bash
openssl rand -base64 32
```

Store the output as `AUTH_SECRET` in `.env.local` (development) or in your
production secrets manager. **Never** commit it.

## 2. Create the Google OAuth client

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. If prompted, configure the **OAuth consent screen** first:
   - User type: **External** (or **Internal** if everyone signing in has a
     Workspace account in your org).
   - Add your contact email and the app domain.
   - Scopes: `openid`, `email`, `profile`.
3. Click **Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized redirect URIs** (one per environment, exact match):
     - Local dev: `http://localhost:3000/api/auth/callback/google`
     - Production: `https://YOUR_PROD_DOMAIN/api/auth/callback/google`
4. Copy the generated **Client ID** and **Client secret**.

## 3. Populate `.env.local`

```dotenv
DATABASE_URL=postgres://saa2025:saa2025@localhost:5432/saa2025
DATABASE_URL_TEST=postgres://saa2025:saa2025@localhost:5432/saa2025_test
AUTH_SECRET=<output of `openssl rand -base64 32`>
AUTH_GOOGLE_ID=<Client ID from step 2.4>
AUTH_GOOGLE_SECRET=<Client secret from step 2.4>
AUTH_TRUST_HOST=true
NODE_ENV=development
```

`AUTH_TRUST_HOST=true` is required when running behind a reverse proxy or
under non-Vercel hosting; safe for local dev.

## 4. Verify

```bash
docker compose up -d db
npm run db:migrate
npm run dev
```

Visit <http://localhost:3000/login> → click **LOGIN With Google** → complete
the Google consent flow → you should land at `/` with a `Session` row in the
database.

## Production hardening checklist

- Rotate `AUTH_SECRET` only with a planned cutover (existing sessions are
  invalidated).
- Add the production redirect URI in step 2.3 BEFORE deploying.
- Enable **HTTPS** at the load balancer; `Strict-Transport-Security` is set
  by `middleware.ts`.
- Set `AUTH_TRUST_HOST=true` only if requests reach the app via a trusted
  proxy that strips and re-sets `Host` correctly. Otherwise omit it.
- Audit the OAuth consent screen scopes — never request more than `openid`,
  `email`, `profile` for sign-in.
