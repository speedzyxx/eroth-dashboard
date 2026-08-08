# Eroth Dashboard

Dashboard High-End para Small-Scale / Party 20 del gremio **Eroth** (Albion Online).

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Framer Motion + Lucide React

## Arranque

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## API Albion

La API oficial del killboard (no documentada, tolerada por Sandbox) usa:

- Americas: `https://gameinfo.albiononline.com/api/gameinfo`
- Europe: `https://gameinfo-ams.albiononline.com/api/gameinfo`
- Asia: `https://gameinfo-sgp.albiononline.com/api/gameinfo`

Íconos de ítems: `https://render.albiononline.com/v1/item/{ITEM_ID}.png`

Por defecto la UI carga **mock data**. Cambia `USE_LIVE_API` en `src/lib/config.ts` o usa el toggle en el header.

## Variables de entorno (opcional)

Copia `.env.example` a `.env.local`:

```
NEXT_PUBLIC_ALBION_SERVER=americas
NEXT_PUBLIC_EROTH_GUILD_ID=
NEXT_PUBLIC_USE_LIVE_API=false
```
