# BlackOut Cut Tracker

Workout, nutrition, progress, and AI coaching app.

## Local development

1. Install the current Node.js LTS release.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` when integrations are added.
4. Start the app with `npm run dev` and open `http://localhost:3000`.

## Integration preparation

The environment-variable contract is documented in `.env.example`. Supabase's
public URL and publishable key may be exposed to the browser; service-role keys
must remain server-only. The OpenAI API key must also remain server-only and
must never use the `NEXT_PUBLIC_` prefix.

No live Supabase or OpenAI client is initialized yet. Add their official SDKs
when the first database, authentication, or AI feature is implemented.
