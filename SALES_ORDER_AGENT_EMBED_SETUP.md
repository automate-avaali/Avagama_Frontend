# Sales Order Agent — Vercel Configuration for Avagama Embedding

**To:** The team that owns the `sales-order-agent` Vercel project
**From:** Avagama frontend team
**Goal:** Make the Sales Order Agent (a) openable by our users without a Vercel login, and (b) embeddable inside the Avagama app in an `<iframe>`.

We have added an **"Agent Solutions"** page in Avagama that shows your agent with a guided tutorial. Right now the agent window is blank because of two settings on the Vercel deployment. This guide explains exactly what to change. **No changes are needed on the Avagama side** — once the URL is public and frame-friendly, it works automatically.

---

## The two blockers (with evidence)

Running `curl -I` against the current URL returns:

```
HTTP/1.1 302 Found
Location: https://vercel.com/sso-api?url=...        ← Blocker #1: Vercel login required
X-Frame-Options: DENY                                ← Blocker #2: iframe embedding forbidden
```

- **Blocker #1 — Vercel Authentication (SSO).** The deployment is protected, so every request first redirects to a Vercel login. Only members of the Vercel team can view it. Iframes and logged-out users can't get past it.
- **Blocker #2 — `X-Frame-Options: DENY`.** Even for an authorized user, this header tells browsers to never render the page inside a frame, so the in-page embed stays blank.

Both must be resolved for the embed to work. Blocker #1 alone must be resolved for the "Open in new tab" launch to work.

---

## Fix #1 — Make the deployment publicly accessible (remove the Vercel login)

Pick **one** of the following.

### Option A (recommended): Use a Production deployment / custom domain
Production deployments are **not** SSO-protected by default.
1. Merge/promote the agent to **Production** in Vercel (or assign a custom domain, e.g. `sales-order-agent.avaali.com`).
2. Send us that **production URL** instead of the preview URL
   (the current `...-3v8hz9lhe-...vercel.app` is a protected *preview* URL).

### Option B: Turn off Deployment Protection
1. Vercel Dashboard → **`sales-order-agent` project** → **Settings** → **Deployment Protection**.
2. Set **Vercel Authentication** to **Disabled** (for the environments we need — at minimum Production; also Preview if you want to keep using a preview URL).
3. Save.

> If you must keep protection on, a third option is a **Protection Bypass for Automation** token — but that's more complex and Option A/B is simpler for a user-facing demo. Let us know if you'd prefer that route.

---

## Fix #2 — Allow the page to be embedded in an iframe

The app currently sends `X-Frame-Options: DENY`. To allow embedding **only** on Avagama's domains, remove that header and instead send a Content-Security-Policy `frame-ancestors` directive listing our origins.

**Allow these origins:**
```
https://avagamaai.netlify.app
http://localhost:3000
```
(add your EC2 host too if/when the Avagama app moves there)

### If the agent is a Next.js app on Vercel — `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Remove any existing X-Frame-Options: DENY / SAMEORIGIN.
          // Use frame-ancestors to allow ONLY Avagama to embed this app:
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://avagamaai.netlify.app http://localhost:3000;",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```
Also make sure you are **not** setting `X-Frame-Options: 'DENY'` anywhere else (some templates add it in `next.config`, middleware, or a `<meta>` tag — remove those).

### If it's a static / other framework — `vercel.json`
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'self' https://avagamaai.netlify.app http://localhost:3000;"
        }
      ]
    }
  ]
}
```
> Note: `X-Frame-Options` has no "allow specific site" value — `frame-ancestors` in CSP is the correct modern replacement. Just make sure the old `X-Frame-Options: DENY` is no longer emitted.

---

## How to verify (before sending back to us)

After deploying the changes, run:

```bash
curl -I https://<your-public-agent-url>/
```

You should see:
- **No** `302` redirect to `vercel.com/sso-api` (i.e. a normal `200 OK`).
- **No** `X-Frame-Options: DENY`.
- A `Content-Security-Policy: frame-ancestors ... avagamaai.netlify.app ...` header.

You can also open the URL in a private/incognito window (not logged into Vercel) — it should load the agent directly, with no Vercel login screen.

---

## What to send back to us

Just reply with the final **public agent URL**, e.g.:
```
https://sales-order-agent.avaali.com/
```
We plug it into one environment variable (`VITE_SALES_ORDER_AGENT_URL`) and the embed lights up — no code change on our side.

---

## Summary checklist

- [ ] **Fix #1:** Deployment is public (production domain **or** Vercel Authentication disabled) — no Vercel login.
- [ ] **Fix #2:** `X-Frame-Options: DENY` removed; `Content-Security-Policy: frame-ancestors ... avagamaai.netlify.app http://localhost:3000` added.
- [ ] Verified with `curl -I` (200 OK, no SSO redirect, correct CSP).
- [ ] Public URL sent to the Avagama team.
