# How to Run Locally

Create `.env.local` from `.env.example` (`Copy-Item .env.example .env.local` on Windows, `cp .env.example .env.local` on Mac/Linux), then run:

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npm run inngest:dev
```

Open http://localhost:3000 and http://localhost:8288.
