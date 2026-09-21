# Brand Studio

A personal branding tool for LinkedIn. Strategy, tone of voice, and reference
inputs feed an AI drafting flow; posts are queued, scheduled (as an intent,
not an auto-publish), and copied to clipboard for manual posting.

## Why manual publish, not auto-post

LinkedIn's official write API (`w_member_social`, via the Community
Management API) requires a business-vetted app approval process, and there
is no compliant way to read a member's own feed/engagement data
programmatically (`r_member_social` is closed to new applicants). Unofficial
scraping or browser automation violates LinkedIn's User Agreement and risks
the account this tool exists to build. v1 deliberately stops at "prepare the
post, copy to clipboard, you paste it in," with a reminder system to make
sure prepared posts don't get forgotten. See the app's onboarding/dashboard
flow for the reminder logic (`scheduledAt` = intent, `postedAt` = confirmed,
set only by the user).

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind v4)
- Prisma 7 + Postgres (via `@prisma/adapter-pg`, driver-adapter model)
- Auth.js (NextAuth v5) with Google OAuth, database sessions
- Anthropic SDK (Claude) for content generation

## Local setup

```bash
npm install
cp .env.example .env   # fill in the values below
npm run db:push        # push the Prisma schema to your database
npm run dev
```

### Environment variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Provision a Postgres database (Vercel dashboard -> Storage -> Create Database -> Postgres/Neon, or any Postgres host) |
| `AUTH_SECRET` | Run `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) -> OAuth 2.0 Client ID (Web application). Authorized redirect URI: `<your-domain>/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google` for local dev) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) -> API Keys |

Set the same variables in Vercel: Project -> Settings -> Environment Variables.

## Data model

- `BrandProfile`: one per user, the onboarding output (tone of voice, industry,
  content types, LinkedIn URL) that every generation call reads from.
- `TopPost`: the user's own best-performing posts, pasted in manually, used as
  a style/few-shot reference. Never scraped.
- `ReferenceAccount`: accounts/voices the user wants to write in a similar
  spirit to. Manually entered.
- `Post`: a generated or hand-written draft. `status` is `DRAFT` or `POSTED`.
  `scheduledAt` is when the user intends to post (drives the reminder,
  optional). `postedAt` is set automatically, once, when the user clicks
  "Mark as posted", regardless of whether that's before, at, or after
  `scheduledAt`.

## Not yet built

- **Reminder delivery.** The dashboard flags an overdue draft visually
  (`scheduledAt` passed, still `DRAFT`), but there's no push/email
  notification yet. That needs a cron job (Vercel Cron) plus a notification
  channel (e.g. [Resend](https://resend.com), free up to 3,000 emails/mo) to
  actually alert the user outside the app.
- **Image generation (Canva).** The plan is Canva Connect API for
  templated cheat sheets/carousels. Needs a Canva developer app
  registration and OAuth flow, not wired up yet.
- **LinkedIn Community Management API.** If/when access is approved,
  this replaces the copy-to-clipboard button with real one-click
  publishing. Everything in the data model already supports this without a
  schema change, `Post.status` just gets set by a successful API call
  instead of a manual click.
- **Multi-tenant billing.** The data model is already scoped per-`userId`
  for a multi-user product, but there's no Stripe integration, plan gating,
  or ToS/privacy policy yet, required before onboarding anyone but yourself.
