# Trading Shop Fintech UI

Mobile-first trading shop dashboard rebuilt with Next.js, React, Tailwind CSS, and persistent Postgres-backed API routes.

## Stack

- Next.js App Router
- Tailwind CSS (dark fintech design system)
- Postgres (`postgres`)
- TypeScript

## Core UI

- Hero dashboard card for Main Vault with high-contrast, glassy style
- Swipeable mobile asset strip that becomes desktop grid
- Client sub-vault cards with asset distribution progress indicators
- Buy/Sell CTA buttons with emerald/rose action semantics
- Bottom-sheet trade form on mobile and centered modal on desktop
- Floating action button to generate End of Day report cards
- Accessible labels, large touch targets, smooth transition states

## Trading Logic

- `Buy`: increases selected asset, deducts `amount * rate` from `LYD`
- `Sell`: decreases selected asset, adds `amount * rate` to `LYD`
- Blocks direct `LYD` buy/sell in this flow
- Logs each transaction with timestamp in local state and posts to `/api/trades`

## Data Persistence

- App data is stored in Postgres using `DATABASE_URL`.
- On first run, the `vaults` table is auto-seeded from `seedVaults`.
- Every submitted trade writes to `transactions` and current balances are saved to `vaults`.

## Development

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Production Build

Create your environment file from `.env.example` and set your managed Postgres URL:

```bash
DATABASE_URL=postgresql://postgres:password@db.example.supabase.co:5432/postgres?sslmode=require
```

```bash
npm run build
npm run start
```

## Netlify Deployment

1. Push this repo to GitHub.
2. In Netlify, create a new site from the repo.
3. Set environment variables in Netlify site settings:
	- `DATABASE_URL`
4. Do not set `NODE_ENV` manually in Netlify; Next.js and Netlify set it correctly during build/runtime.
5. Deploy. Netlify reads `netlify.toml` and builds with Next.js plugin.
6. `netlify.toml` sets `NPM_FLAGS=--include=dev` so Tailwind/PostCSS dev dependencies are available during build.
7. Verify by creating trades and refreshing; data should persist.
