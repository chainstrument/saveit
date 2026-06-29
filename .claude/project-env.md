---
name: project-env
description: "Environnement local de développement SaveIt (ports, WSL2, Neon)"
metadata: 
  node_type: memory
  type: project
  originSessionId: a46ed3cf-acb4-4c38-9f28-78774328fc89
---

- Next.js tourne sur **port 3001** (port 3000 occupé par un serveur Python/uvicorn).
- WSL2 bloque le port TCP 5432 → impossible d'utiliser postgres.js. Driver imposé : `@neondatabase/serverless` (HTTP).
- `NEXT_PUBLIC_APP_URL=http://localhost:3001` dans `apps/web/.env.local`.
- `WXT_API_URL=http://localhost:3001` dans `apps/extension/.env` (gitignored).
- Le fichier de référence des vars d'env est `.env.example` à la racine.

**Why:** Le port 3001 et le driver HTTP sont des contraintes de l'environnement WSL2 de l'utilisateur, pas des choix d'archi.
**How to apply:** Toujours utiliser port 3001 dans les exemples curl et les configs locales. Ne jamais suggérer de revenir à postgres.js.
