# WERKAR inquiry backend setup

The site assets are static, with a Cloudflare Worker backend prepared for inquiry storage and email notifications. The live service is not connected until a real D1 database ID is configured, its migration is applied, and the Worker is deployed. Do not publish the example Wrangler file with its placeholder database ID.

## Cloudflare setup

1. From the project root, run `npx wrangler d1 create werkar-inquiries` and copy the returned database ID. This provisions the database in the authenticated Cloudflare account; it is not done by the website code.
2. Copy `wrangler.jsonc.example` to the repository root as `wrangler.jsonc`, then replace `REPLACE_WITH_CLOUDFLARE_D1_DATABASE_ID` with the real ID. Keep `.assetsignore` at the root so backend source and database files are not exposed as static downloads.
3. Apply the migration with `npx wrangler d1 migrations apply werkar-inquiries --remote`.
4. Set Worker secrets/variables in the Cloudflare dashboard (or with `wrangler secret put`):
   - `ADMIN_TOKEN`: a random secret with at least 32 characters. Do not put it in the repository or send it in chat.
   - `RESEND_API_KEY`: Resend API key.
   - `MAIL_FROM`: a sender address on a domain verified for sending.
   - `MAIL_TO`: comma-separated notification recipients (for example, `infowerkar@gmail.com`). Keep this server-side; the code removes duplicate addresses.
5. Configure the Cloudflare Git deployment to run `npx wrangler deploy` from the repository root. Do not trigger deployment until D1 ID, migration, and Worker secrets are configured.

The contact page will POST to `/api/inquiries`. The Worker stores the submission in D1 before attempting an email notification. The private panel is `/inquiries.html`; it requires `ADMIN_TOKEN`, does not list email recipients, and allows marking inquiries as reviewed. Email delivery failure does not discard the stored submission. A failed API request is shown as a save failure; the page does not open an email draft that could be mistaken for a saved enquiry.

## Email notification settings

Notifications use Resend's API. Gmail is only a possible recipient mailbox; a Gmail password is neither needed nor supported. Verify a sending domain in Resend, use an address on that verified domain for `MAIL_FROM`, save the Resend API key as the Worker secret `RESEND_API_KEY`, and set `MAIL_TO` to the destination mailbox (such as `infowerkar@gmail.com`). The visitor's address is set as `reply_to` so the team can respond directly. Keep all four settings in Cloudflare Worker secrets/variables, never in browser JavaScript or committed files. Without these settings, enquiries still save to D1, while the admin panel reports that the notification was not sent.

From the project root, configure the admin token with `npx wrangler secret put ADMIN_TOKEN` and the Resend key with `npx wrangler secret put RESEND_API_KEY`. Configure `MAIL_FROM` and `MAIL_TO` as Worker variables in the Cloudflare dashboard (or `npx wrangler secret put` if you prefer to keep them secret). Use the prompts to enter values; do not put secret values directly into shell history or source files.

## Local development

Copy the Wrangler example to `wrangler.jsonc`, use a local D1 database, and set local-only variables in `.dev.vars` (never commit that file). Apply the migration locally and use `npx wrangler dev`.
