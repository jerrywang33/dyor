# dyor.sh

AI research shell for crypto token due diligence.

## What it is

DYOR.sh is a frontend prototype for an AI-powered crypto research agent. The first screen is the product surface: enter a token, project, contract, or social link and get a structured research brief with risk posture, evidence buckets, and a shareable report route.

This build is intentionally static so it can ship fast on Cloudflare Pages. Live data connectors can be added behind the same shell later.

## Local development

```sh
npm install
npm run check
npm run dev
```

## Deployment

Cloudflare credentials are expected in `.env.cloudflare.local`.

```sh
source .env.cloudflare.local
npm run deploy
```

## Harness path

Harness is a good second-stage fit once the project needs approval gates, preview environments, rollback policy, environment-scoped secrets, and production deploy governance. The MVP uses direct Cloudflare Pages deployment to keep the first release small.
