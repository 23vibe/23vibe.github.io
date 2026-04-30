// Cloudflare Worker — 23vibe contact form handler
// Secrets (set via: wrangler secret put <NAME>):
//   TURNSTILE_SECRET   — Cloudflare Turnstile secret key
//   BREVO_API_KEY      — Brevo transactional API key
//   SENDER_EMAIL       — verified sender address in your Brevo account
//   RECIPIENT_EMAIL    — where contact emails are delivered

const ALLOWED_ORIGIN = 'https://23vibe.github.io';

const CORS = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function respond(body, status = 200) {
    return new Response(body, { status, headers: CORS });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return respond(null, 204);
        if (request.method !== 'POST') return respond('Method not allowed', 405);

        let body;
        try {
            body = await request.json();
        } catch {
            return respond('Bad request', 400);
        }

        const { name, email, message, turnstileToken } = body;

        if (!name || !email || !message || !turnstileToken) {
            return respond('Missing fields', 400);
        }
        if (name.length > 100 || email.length > 200 || message.length > 5000) {
            return respond('Input too long', 400);
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return respond('Invalid email', 400);
        }

        // Verify Turnstile token
        const tsRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: env.TURNSTILE_SECRET,
                response: turnstileToken,
                remoteip: request.headers.get('CF-Connecting-IP'),
            }),
        });
        const tsData = await tsRes.json();
        if (!tsData.success) return respond('CAPTCHA verification failed', 400);

        // Send email via Brevo
        const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': env.BREVO_API_KEY,
            },
            body: JSON.stringify({
                sender: { name: '23vibe contact', email: env.SENDER_EMAIL },
                to: [{ email: env.RECIPIENT_EMAIL }],
                replyTo: { email, name },
                subject: `23vibe contact from ${name}`,
                textContent: `Name: ${name}\nEmail: ${email}\n\n${message}`,
            }),
        });

        if (!brevoRes.ok) return respond('Failed to send email', 500);

        return respond('OK', 200);
    },
};
