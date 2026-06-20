# VisaReady

AI-powered Australian visa document checklist tool.

## Local development

```bash
npm install
npm run dev
```

Note: the AI checklist generation calls `/api/generate`, which only works when deployed on Vercel (or run via `vercel dev` locally) since it needs the serverless function.

## Deploy to Vercel

1. Push this folder to a new GitHub repository.
2. Go to https://vercel.com/new and import that repository.
3. Vercel will auto-detect Vite — leave the default build settings.
4. **Before deploying**, go to your Vercel project → **Settings → Environment Variables** and add:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (from https://console.anthropic.com/settings/keys)
5. Click Deploy. You'll get a live URL like `visaready.vercel.app`.

## Getting an Anthropic API key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Go to Settings → API Keys → Create Key
4. Add billing details (pay-as-you-go, very cheap per checklist generated)
5. Copy the key into Vercel as described above

## Updating the Calendly link

In `src/App.jsx`, search for "Book a consultation" near the bottom of the file and wrap that button in a link to your real Calendly URL, e.g.:

```jsx
<a href="https://calendly.com/your-username/consultation" target="_blank" rel="noopener noreferrer">
  <button>Book a consultation</button>
</a>
```
