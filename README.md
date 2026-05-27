# dyor.sh

AI-Native research shell for crypto token due diligence.

## What it is

DYOR.sh is an AI-Native crypto research agent shell. The first screen is the product surface: enter a token, project, contract, or social link and get a structured research brief with risk posture, evidence buckets, and a shareable report route.

The current build ships a static frontend on Cloudflare Pages plus Pages Functions at `/api/scan`, `/api/redflags`, `/api/compare`, `/api/watch`, `/api/brief`, `/api/capabilities`, and `/api/report`, plus `/openapi.json`, `/llms.txt`, `/.well-known/ai-plugin.json`, `/robots.txt`, and `/sitemap.xml` for agent discovery. The first live connector uses Dexscreener to resolve DEX pairs, liquidity, volume, market structure, source links, chain explorer links, identity confidence, structured red flags, watch triggers, lightweight risk scores, side-by-side token comparisons, a refreshable local research queue, copy-ready Markdown briefs, machine-readable agent capabilities, and shareable `/c/...` compare routes. The shell accepts plain tickers, `/scan`, `/redflags`, `/watch`, `/compare`, Dexscreener URLs, and common explorer URLs. Live report and compare routes include query hints so they can be reopened and refreshed; when a `DYOR_REPORTS` KV binding is available, report snapshots are stored and reopened by snapshot id first. Holder, unlock, deeper source, and social checks remain follow-up surfaces.

## Status

MVP v0.1 is live at [dyor.sh](https://dyor.sh). This release is suitable as the public baseline for the domain, GitHub repository, API discovery files, and first agent-facing research workflow.

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

## License

DYOR.sh is released under the MIT License. See [LICENSE](./LICENSE).

## Harness path

Harness is a good second-stage fit once the project needs approval gates, preview environments, rollback policy, environment-scoped secrets, and production deploy governance. The MVP uses direct Cloudflare Pages deployment to keep the first release small.
