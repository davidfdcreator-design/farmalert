# FarmaAlert

Personal PWA per promemoria farmaci con notifiche push.

## Struttura

- `client/` — Frontend React + Vite + Tailwind (deploy: GitHub Pages)
- `server/` — Backend Express + Prisma + node-cron (deploy: Fly.io)

## Sviluppo locale

```bash
# server
cd server
npm install
cp .env.example .env  # poi modifica con i tuoi valori
npx prisma migrate dev
npm run dev

# client (in altro terminale)
cd client
npm install
npm run dev
```

App accessibile su `http://localhost:5173/farmalert/`.

## Deploy

- **Backend**: `cd server && flyctl deploy`
- **Frontend**: push su `main`, GitHub Actions deploya su Pages

## Variabili d'ambiente

Vedi `server/.env.example` per la lista.
