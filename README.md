# 23vibe.github.io

Landing page for the 23vibe open-source project — free underground DIY community hosting for DJs, promoters, soundsystems, clubs, squats, producers, and all open-minded people.

## Stack

- Static site hosted on **GitHub Pages**
- Animated starfield canvas + orbiting navigation
- Content loaded from `content.md` and `sites.json` at runtime
- Contact form protected by **Cloudflare Turnstile** (CAPTCHA)
- Contact emails sent via **Brevo** transactional API through a **Cloudflare Worker**

## Project structure

```
index.html          — single-page app shell
content.md          — editable copy for all sections (home, terms, contact, search)
sites.json          — registry of published community pages
css/style.css       — all styles
js/script.js        — app logic (navigation, rendering, contact form)
js/starfield.js     — canvas starfield animation
worker/contact.js   — Cloudflare Worker: Turnstile verification + Brevo email dispatch
worker/wrangler.toml — Wrangler deploy config
.github/workflows/deploy.yml — GitHub Pages deployment workflow
```

## Deployment

### 1. Deploy the Cloudflare Worker

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Set secrets (values are prompted interactively, never stored in files):

```bash
npx wrangler secret put TURNSTILE_SECRET    # Cloudflare Turnstile secret key
npx wrangler secret put BREVO_API_KEY       # Brevo API key
npx wrangler secret put SENDER_EMAIL        # verified sender address in Brevo
npx wrangler secret put RECIPIENT_EMAIL     # address that receives contact submissions
```

### 2. Update site config

In `js/script.js`, set the two public values:

```js
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';
const TURNSTILE_SITE_KEY = 'your_turnstile_site_key';
```

Both are safe to commit — the site key is public by design, and the Worker URL has no auth.

### 3. Deploy to GitHub Pages

Push to `main`. The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys automatically.

## Contact form flow

```
Browser (name + email + message + Turnstile token)
  ↓ POST
Cloudflare Worker
  ├── verify Turnstile token (server-side)
  └── send email via Brevo API
        ↓
  Your inbox (replyTo set to the sender's email)
```

All secrets live in Cloudflare Worker environment — nothing sensitive is in the repository or exposed to the browser.

## Adding a community page

Add an entry to `sites.json`:

```json
{ "name": "Your Name", "repo": "your-repo-name", "tags": ["dj", "techno"] }
```

## License

See [LICENSE](LICENSE).

