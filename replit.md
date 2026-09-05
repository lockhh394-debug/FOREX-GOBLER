# Obsidian Members Club

An immersive, high-conviction landing experience for a private digital members club focused on wealth, leverage, and daily execution.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

### First-time setup

1. Copy `.env.example` to `.env` and fill in the Clerk, Postgres, reviewer, and object-storage values. Never commit `.env`.
2. Provision PostgreSQL, then run `pnpm --filter @workspace/db run push` to create the `orders` and `payment_submissions` tables.
3. Create public and private Replit Object Storage paths and set `PUBLIC_OBJECT_SEARCH_PATHS` and `PRIVATE_OBJECT_DIR`.
4. Add the reviewer Clerk user ID to `ADMIN_USER_IDS`.
5. Run `pnpm run typecheck && pnpm run build` before deploying.

### Local development

Run the frontend with `PORT=5174 pnpm --filter @workspace/obsidian-members-club run dev` and the API with `PORT=5000 pnpm --filter @workspace/api-server run dev`.

The frontend uses `/api` for the generated client. In a deployed Replit application, configure the frontend and API under the same application/router so Clerk cookies and API requests share the host.

### Deploy from VS Code

Use a Node/PostgreSQL host such as Render, Railway, Fly.io, or a VPS. Deploy the API as a Node service with `pnpm --filter @workspace/api-server build` followed by `pnpm --filter @workspace/api-server start`, and deploy the frontend as a Vite static site with `pnpm --filter @workspace/obsidian-members-club build` serving `artifacts/obsidian-members-club/dist/public`. Set `DATABASE_URL`, Clerk keys, object-storage values, `ADMIN_USER_IDS`, and the email variables in the host's secret manager. Route `/api/*` to the API service and the remaining paths to the frontend; then point `forexgobler.com` or `forexgobler.net` DNS to that host and enable HTTPS.

### Custom domain: forexgobler.net

1. Deploy the Replit application and confirm the generated Replit URL works first.
2. In Replit deployment settings, choose **Custom domain** and add `forexgobler.net` (and `www.forexgobler.net` if desired).
3. At the domain registrar, add the DNS records Replit provides. Do not guess the record values; Replit supplies the exact target and verification record.
4. Wait for DNS and TLS verification, then test `https://forexgobler.net/` and the sign-in flow.

### Clerk privacy and branding

The app-facing auth copy is branded Forex Gobler. In the Clerk dashboard, set the application name and email branding to Forex Gobler, configure a verified sending domain if you have one, and use production keys for the live deployment. Clerk controls verification-email templates and provider metadata; those settings cannot be changed from frontend JSX. Do not place secret keys or raw identity data in the frontend environment.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/obsidian-members-club/src/App.tsx` — marketing experience plus Clerk auth routes, member dashboard, product selection, crypto payment, proof upload, and order status UI.
- `artifacts/obsidian-members-club/src/index.css` — visual system, responsive layout, motion, and accessibility preferences.
- `artifacts/api-server/` — Clerk-protected catalogue, order, payment-proof, and object-storage routes.
- `lib/api-spec/openapi.yaml` — current API contract source of truth.

## Architecture decisions

- The interface uses an original Obsidian identity rather than copying any reference site's logos, marks, or protected content.
- Motion is progressive and respects `prefers-reduced-motion` so the immersive feel does not compromise accessibility.
- Clerk manages persistent registration/login and the Google sign-in option; signed-in users are routed to `/user-portal`.
- The purchase path is: choose a Forex Gobler EA → pay using USDT-TRC20 → upload a payment screenshot → wait for verification → receive a unique license and bot delivery instructions by email.
- Delivery is communicated as 3–5 business days after successful payment verification. No guaranteed trading-result claims are used.

## Product

- Scroll-led landing experience for the Obsidian Members Club.
- Smooth anchor navigation with responsive mobile menu.
- Persistent Clerk registration/login with Google sign-in available through the managed auth configuration.
- Member dashboard with Basic MT5 Bot ($50), Prop Firm EA Bot ($250), and Premium EA Bot ($200).
- USDT-TRC20 payment instructions, screenshot proof upload through private object storage, pending payment-review state, and per-user order history.
- Expandable FAQ and conversion CTAs throughout the page.

## User preferences

- The user wants an engaging, obsessive, high-conviction feel inspired by bold creator-led membership sites.

## Gotchas

- The web artifact workflow supplies `PORT` and `BASE_PATH`; local production builds need those values set explicitly.
- Private proof objects must remain owner-scoped through the order/payment-submission relationship.
- Reviewer verification routes require the customer's Clerk user ID to be listed in the `ADMIN_USER_IDS` environment variable.
- `RESEND_FROM_EMAIL` can be set to a verified Resend sender; the development fallback is Resend's onboarding sender.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
