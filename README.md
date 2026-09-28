# Creator Commerce SaaS

A creator-commerce platform built with Next.js, PostgreSQL, Prisma, Redis/BullMQ, private S3-compatible storage, Razorpay and Resend.

## Local development

1. Copy `.env.example` to `.env` and configure the required services.
2. Install dependencies with `npm install`.
3. Generate Prisma Client with `npm run db:generate`.
4. Apply migrations with `npx prisma migrate deploy`.
5. Seed SaaS plans with `npx prisma db seed`.
6. Start the app with `npm run dev`.

## Production

- Set `DATABASE_URL` to a PostgreSQL database.
- Run `npx prisma migrate deploy` before starting the app.
- Configure Razorpay keys/webhooks for product, booking, event and recurring SaaS payments.
- Configure S3-compatible private storage for digital products and lead magnets.
- Configure Resend for transactional and marketing email.
- Set `CRON_SECRET` and `APP_URL` GitHub Actions secrets so scheduled maintenance can run.
- Set `ADMIN_EMAILS` to a comma-separated list of bootstrap administrator emails.
- Set `COMMUNITY_ENCRYPTION_KEY` to a base64-encoded 32-byte key for encrypted community credentials.
- Keep the database, Redis and storage credentials out of source control.

## Scheduled jobs

The maintenance workflow calls:

- `/api/cron/cleanup`
- `/api/cron/membership-expiry`
- `/api/cron/booking-reminders`

## Health

Use `/api/health` for container/load-balancer health checks.

## Private downloads

Digital product downloads require a paid order plus a private per-order download token. Public product pages never expose the S3 object key as a download URL.

## Billing

SaaS plans support Razorpay recurring subscriptions when the corresponding monthly/yearly Razorpay plan IDs are configured by an administrator.

## CI

GitHub Actions runs Prisma validation/generation, TypeScript typechecking and the production build on pushes and pull requests to `main`.
