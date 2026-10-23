# Shri Shaam Tent House

Production-focused website, customer booking platform, and business dashboard for **Shri Shaam Tent House**, 169 A Jay Nagar Colony, Pithampur, Madhya Pradesh.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- Server-side Next.js API routes
- PostgreSQL / Neon with Drizzle ORM and checked-in migrations
- Database-backed, hashed-session authentication with bcrypt password hashing
- Razorpay and manually reviewed QR/UPI payments
- Vercel Blob for persistent public assets and private payment proofs
- PDFKit quotations and payment invoices
- Optional Resend, WhatsApp Cloud API, and Twilio notifications
- Vitest domain, security, migration, and PDF tests

## What is implemented

- Premium responsive public website: home, about, services, packages, gallery, contact, authentication, and error/loading states
- Live availability calendar with public AVAILABLE / PARTIAL / BOOKED labels
- Event booking planner with server-calculated, itemised quotations
- Database-level slot uniqueness to prevent concurrent double-booking
- Customer profiles, booking history, owned documents, quotation acceptance, and payments
- Admin dashboard, booking/calendar management, service/package CRUD, gallery, review moderation, payment review, and persistent business settings
- Separate booking and payment statuses; verified-payment-only invoice generation
- Honest integration states: missing providers are never simulated

## Local setup

Requirements: Node.js 22+ and a Neon PostgreSQL database for interactive backend flows.

```bash
npm install
cp .env.example .env.local
# Add DATABASE_URL to .env.local; never commit this file.
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Without `DATABASE_URL`, public content can render using the clearly defined fallback catalogue, but availability, registration, booking, and admin mutations report **NOT CONFIGURED**.

### Create the first administrator securely

There is intentionally no default admin password.

1. Run migrations and seed the catalogue.
2. Register the desired administrator email through the normal customer registration page.
3. Promote that existing account only:

```bash
ADMIN_EMAILS="owner@example.com" npm run db:seed
```

4. Log out and back in, then open `/admin`.

Run seeds against the intended database only. Seed operations use conflict-safe inserts and do not reset tables or overwrite existing business settings.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
# or all four:
npm run check
```

See [TEST_REPORT.md](./TEST_REPORT.md) for the verified results and provider-dependent checks that remain NOT CONFIGURED.

## Production setup

Read [DEPLOYMENT.md](./DEPLOYMENT.md) before deploying. It covers Neon migrations, the first admin, Vercel Blob, Razorpay webhook signature setup, notification providers, and the production smoke-test checklist.

## Important business-content note

The supplied business name, contact person, address, service area, services, and Instagram URL are used. No verified phone number was supplied, so phone/WhatsApp actions remain hidden until configured in admin settings. Initial package prices are editable starting content and must be reviewed by the business before accepting real bookings. Gallery placeholders are explicitly labelled design inspiration, not past customer events; no reviews are fabricated.
