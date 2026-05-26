# dyor.sh

AI-Native research shell for crypto token due diligence.

## What it is

DYOR.sh is an AI-Native crypto research agent shell. The first screen is the product surface: enter a token, project, contract, or social link and get a structured research brief with risk posture, evidence buckets, and a shareable report route.

The current build ships a static frontend on Cloudflare Pages plus Pages Functions at `/api/scan`, `/api/compare`, and `/api/report`. The first live connector uses Dexscreener to resolve DEX pairs, liquidity, volume, market structure, source links, identity confidence, watch triggers, lightweight risk scores, side-by-side token comparisons, and shareable `/c/...` compare routes. Live report and compare routes include query hints so they can be reopened and refreshed; when a `DYOR_REPORTS` KV binding is available, report snapshots are stored and reopened by snapshot id first. Holder, unlock, deeper source, and social checks remain follow-up surfaces.

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
