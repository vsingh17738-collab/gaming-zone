# Production deployment guide

## 1. Neon PostgreSQL

1. Create or select the intended Neon project and database. Do not use a production database for destructive testing.
2. Copy the pooled connection string into the secure environment as `DATABASE_URL`.
3. From a trusted machine or CI job with that variable set, run:

```bash
npm ci
npm run db:migrate
npm run db:seed
```

The checked-in migrations create tables, foreign keys, checks, indexes, and race-safe reservation/payment uniqueness constraints. They do not drop or reset existing tables. Review every future migration before applying it to production.

## 2. Vercel project

Import the existing GitHub repository into Vercel and keep Next.js auto-detection. Build command: `npm run build`. Node.js version: 22 or newer.

Set variables only in **Vercel → Project → Settings → Environment Variables**. Never commit `.env.local` or production values.

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Neon pooled PostgreSQL connection |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical HTTPS origin, no trailing slash |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Persistent logo, QR, gallery, and private proof storage |
| `RAZORPAY_KEY_ID` | For Razorpay | Server-side order creation and payment fetch |
| `RAZORPAY_KEY_SECRET` | For Razorpay | Server-side signature verification |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | For Razorpay | Public Checkout key ID only; never put the secret here |
| `RAZORPAY_WEBHOOK_SECRET` | For webhooks | Raw-body webhook signature validation |

After setting variables, redeploy. Run migrations separately; the web build does not mutate the database.

## 3. First administrator

There is no seeded password or hardcoded administrator. Register the desired account on the deployed site, then run the following from a trusted environment using the production `DATABASE_URL`:

```bash
ADMIN_EMAILS="owner@example.com" npm run db:seed
```

This promotes only an existing matching account. Use a unique strong password and restrict admin credentials to authorised people.

## 4. Persistent uploads

Create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`. Logo, QR, and gallery uploads are public assets; payment proofs are private blobs readable only through an admin-authorized streaming route.

Accepted image formats: PNG, JPG/JPEG, WEBP. Maximum size: 5 MB. MIME type, size, and file signatures are validated. Blob storage—not the ephemeral Vercel filesystem—is required for persistence across redeployments.

In **Admin → Settings**, upload the real business QR and save the form. Uploading alone returns an asset URL; saving settings connects it to the public payment workflow.

## 5. Razorpay

Use test keys first and never make a real charge during setup testing without authorization.

1. Configure all three Razorpay key variables shown above. The two key IDs should match.
2. In the Razorpay dashboard, add webhook URL:

   `https://YOUR_DOMAIN/api/payments/razorpay/webhook`

3. Subscribe to `payment.captured` and set `RAZORPAY_WEBHOOK_SECRET` to the webhook's own secret.
4. Test order creation, Checkout, server capture fetch, signature verification, duplicate callbacks, and webhook processing in Razorpay test mode.
5. Verify the payment appears as paid only after capture verification and that exactly one invoice is generated per payment record.

A browser return or QR screenshot alone never marks a booking paid. Manual proofs require admin approval; reviewer ID and timestamp are stored.

## 6. Optional notifications

Missing providers are shown as **NOT CONFIGURED** and no success is simulated.

### Resend email

Set `RESEND_API_KEY` and a verified sender in `EMAIL_FROM`. Test registration, booking updates, and payment receipts with an authorised test recipient.

### WhatsApp Cloud API

Set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID`. For business-initiated updates outside an open customer service window, configure an approved template with exactly one body variable and set:

- `WHATSAPP_TEMPLATE_NAME`
- `WHATSAPP_TEMPLATE_LANGUAGE` (for example `en_US`)

Without a template name, the integration uses a legitimate freeform message, which Meta normally permits only inside an open 24-hour customer service window. Provider rejections are recorded as failed, never as sent.

Direct `wa.me` links are separate from automated WhatsApp notifications and require only the verified business WhatsApp number in admin settings.

### Twilio SMS

Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER`. Confirm sender/regulatory requirements for Indian SMS before enabling production delivery.

All provider calls are server-side, have a 10-second timeout, and persist the actual provider outcome.

## 7. Business setup before accepting bookings

- Review initial package and extra-service prices with Raj Patel.
- Add verified phone and WhatsApp numbers in admin settings.
- Upload the real logo, payment QR, and authorised business event photos.
- Configure UPI/bank details only if the business wants to accept manual payments.
- Review quotation terms, tax details, invoice text, and the default 30% advance.
- Replace illustrative gallery inspiration with real portfolio images when available.
- Confirm the Google Maps location and Instagram link.

## 8. Production verification checklist

1. Confirm deployment logs show a successful Next.js build.
2. Confirm all public pages load over HTTPS and security headers are present.
3. Register a test customer; log out and log in again.
4. Verify a non-admin cannot call admin APIs and one customer cannot read another customer's booking/documents.
5. Create two simultaneous requests for the same slot; only one may persist.
6. Confirm a booking, accept its quotation, and verify the 30% advance and remaining balance.
7. Use Razorpay test mode for success, bad signature, duplicate callback, and webhook cases.
8. Upload a manual test proof; confirm it stays unverified until admin approval and the private proof cannot be read by a customer or anonymous visitor.
9. Download quotation and invoice PDFs and check references/amounts.
10. Update a setting and confirm it remains after refresh and redeployment.
11. Send provider-authorised test notifications only; inspect stored delivery outcomes.
12. Check mobile and desktop layouts, then remove authorised test data through a reviewed administrative/data-retention process.

A Vercel deployment must not be described as verified until these production checks have actually run against the deployed URL.
