---
name: project-auth-extension
description: "Détails du flux d'authentification bearer token entre l'extension et la webapp"
metadata: 
  node_type: memory
  type: project
  originSessionId: a46ed3cf-acb4-4c38-9f28-78774328fc89
---

**Flux bearer token :**
1. Extension POST `/api/auth/sign-in/email` → Better Auth retourne `{ token, user, ... }`
2. Token stocké via `chrome.storage.local.set({ token })`
3. Au prochain ouverture popup : récupère le token, vérifie via GET `/api/auth/get-session` avec `Authorization: Bearer <token>`
4. Toutes les requêtes API : header `Authorization: Bearer <token>` (plus de `credentials: "include"`)

**Côté serveur :**
- `apps/web/src/lib/session.ts` : `getSession(headers)` vérifie d'abord le cookie Better Auth, puis fait un SELECT sur `sessions` JOIN `users` WHERE `token = ? AND expiresAt > now()`
- Tous les route handlers (`/api/bookmarks`, `/api/bookmarks/[id]`) appellent `getSessionFromRequest()` qui wrape `getSession(await headers())`

**Pourquoi bearer et pas cookie :**
Cookie `SameSite=Lax` ne traverse pas les origines `chrome-extension://` → CORS bloqué. Bearer token dans `Authorization` header contourne ce problème.

**Why:** Résout les erreurs "Invalid origin" et les 401 sur POST /api/bookmarks depuis l'extension.
**How to apply:** Toute nouvelle route API doit utiliser `getSessionFromRequest()` de `@/lib/session`. Ne pas réutiliser `auth.api.getSession()` directement dans les routes.
