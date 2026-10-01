# Made in Maia Shop

Custom Made in Maia online shop and content management studio, built with Next.js, PostgreSQL and Drizzle.

## Local development

Requirements:

- Node.js 22.13 or newer
- PostgreSQL

Create `.env.local` from `.env.example`, then run:

```sh
npm ci
npm run db:migrate
npm run dev -- -p 3103
```

Storefront: `http://localhost:3103`

Studio: `http://localhost:3103/studio`

Local uploads are written to `public/uploads` when `UPLOADS_DIR` is empty.

## Production architecture

- Render paid web service (`0.5c-512mb`)
- Render paid PostgreSQL (`0.1c-256mb`)
- 5 GB Render persistent disk mounted at `/var/data`
- Product media stored at `/var/data/uploads` and served through `/uploads/*`
- Cloudflare for DNS and SSL
- Resend for transactional order email
- Stripe for checkout and payment webhooks
- Separate mailbox provider for human email accounts

The production resources are defined in `render.yaml`. Commits to the connected branch trigger automatic deployments. Database migrations run as the paid service's pre-deploy command.

## Render environment variables

The Blueprint configures `DATABASE_URL`, `UPLOADS_DIR`, and `UPLOADS_PUBLIC_URL`. Add these secrets in the Render dashboard:

- `STUDIO_PASSWORD` — long unique password for the CMS
- `STRIPE_SECRET_KEY` — optional until Stripe verification is complete
- `STRIPE_WEBHOOK_SECRET` — optional until the Stripe webhook is created
- `RESEND_API_KEY` — optional until transactional email is enabled

`ORDER_FROM_EMAIL` defaults to `Made in Maia <loja@madeinmaia.pt>`. The domain must be verified with Resend before production email is sent from it.

Do not commit `.env.local` or any secret keys.

## Deployment order

1. Sync the Render Blueprint and approve the paid web, database and 5 GB disk resources.
2. Set `STUDIO_PASSWORD` in Render.
3. Deploy and verify `/api/health`, the storefront and `/studio`.
4. Configure `madeinmaia.pt` and `www.madeinmaia.pt` as custom domains in Render.
5. Point DNS through Cloudflare using the records supplied by Render.
6. Configure the mailbox provider and preserve the required MX, SPF and DKIM records.
7. Verify `madeinmaia.pt` in Resend and add `RESEND_API_KEY`.
8. When Stripe verification completes, add the Stripe keys and register the production webhook.

## Media persistence

Studio uploads are not stored in Git. They remain on the Render disk between deployments. Backups must cover both PostgreSQL and the upload disk.
