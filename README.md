# Elevate — Image & Etiquette Coach

The mobile application and Cloudflare backend live in [`elevate/`](./elevate).

- React Native / Expo for Android and a responsive web app.
- Cloudflare Worker API, D1 accounts and coaching history, private R2 media, and opt-in Workers AI.
- Persistent profile → adaptive coaching → rehearsal → real-world practice → reflection → weekly review.

See the [application guide](./elevate/README.md) and [Cloudflare / Android deployment runbook](./elevate/DEPLOYMENT.md).

```sh
cd elevate
npm install
npm run build:web
npm run db:migrate:local
npm run dev:cloud
```

Open http://localhost:8787. AI is disabled in the offline preview; D1 and R2 run locally. Production resources and Android signing are configured through your own accounts.
