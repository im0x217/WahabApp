# Trading Shop Fintech UI

Mobile-first trading shop dashboard rebuilt with Next.js, React, Tailwind CSS, and PocketBase-ready API routes.

## Stack

- Next.js App Router
- Tailwind CSS (dark fintech design system)
- PocketBase SDK
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

## PocketBase Integration

Set your PocketBase URL in `.env.local`:

```bash
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
```

If not configured, the app uses seeded fallback data and in-memory API behavior.

## Development

```bash
npm install
npm run dev
```

Open: `http://localhost:3000`

## Production Build

```bash
npm run build
npm run start
```
