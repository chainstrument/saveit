---
name: project-stack
description: Stack technique et architecture du projet SaveIt (monorepo bookmark manager)
metadata: 
  node_type: memory
  type: project
  originSessionId: a46ed3cf-acb4-4c38-9f28-78774328fc89
---

Monorepo pnpm — `apps/web` (Next.js 16, App Router), `apps/extension` (WXT 0.20 + React), `packages/shared` (Zod schemas).

**DB** : Drizzle ORM + Neon PostgreSQL via `@neondatabase/serverless` (driver HTTP, pas TCP). Raison : WSL2 bloque le port 5432. Le client est dans `apps/web/src/db/index.ts` — `neon()` + `drizzle(client, { schema })`.

**Auth** : Better Auth 1.6. Config serveur dans `apps/web/src/lib/auth.ts`. Cookie `better-auth.session_token` pour la webapp, bearer token pour l'extension. La session bearer est vérifiée dans `apps/web/src/lib/session.ts` (lookup direct en DB sur la table `sessions`).

**Extension** : bearer token stocké dans `chrome.storage.local`. Login inline dans le popup (pas de redirect). Toutes les requêtes API utilisent `Authorization: Bearer <token>`.

**CORS/Proxy** : `apps/web/src/proxy.ts` — gère les origines `chrome-extension://` et `moz-extension://`, passe le header `Authorization`, bypass pour les requêtes bearer de l'extension.

**Why:** Résume l'architecture réelle après plusieurs sessions de debug (WSL2, CORS, cookie → bearer).
**How to apply:** Avant de toucher la DB, l'auth ou l'extension, vérifier ces fichiers clés plutôt que de réinventer la roue.
