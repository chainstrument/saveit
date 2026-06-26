# SaveIt — Guide pour Claude

## Architecture

Monorepo pnpm avec trois packages :

- `apps/web` — Next.js 15 App Router. Contient à la fois le frontend dashboard et l'API REST (Route Handlers). Package name : `@saveit/web`.
- `apps/extension` — Extension navigateur WXT + React. Package name : `@saveit/extension`.
- `packages/shared` — Schémas Zod et types TypeScript partagés entre web et extension. Package name : `@saveit/shared`.

## Commandes utiles

```bash
# Installer toutes les dépendances
pnpm install

# Lancer la webapp
pnpm --filter @saveit/web dev

# Lancer l'extension (dev Chrome)
pnpm --filter @saveit/extension dev

# Type-check tous les packages
pnpm type-check

# Générer et appliquer les migrations DB
pnpm --filter @saveit/web db:generate
pnpm --filter @saveit/web db:migrate

# Ouvrir Drizzle Studio (UI pour la DB)
pnpm --filter @saveit/web db:studio
```

## Stack et conventions

### Base de données
- ORM : Drizzle. Schéma dans `apps/web/src/db/schema.ts`.
- IDs : `crypto.randomUUID()` (UUID v4), pas cuid2 malgré ce que suggèrent les schémas Zod du shared.
- Relations Drizzle définies dans `schema.ts` (pas dans un fichier séparé).

### Auth
- Better Auth. Config serveur dans `apps/web/src/lib/auth.ts`.
- Client navigateur dans `apps/web/src/lib/auth-client.ts`.
- Session via cookie `better-auth.session_token`.
- Le middleware `apps/web/src/middleware.ts` protège toutes les routes sauf `/login`, `/register`, `/api/auth`.

### API
- Routes dans `apps/web/src/app/api/`.
- Toujours vérifier la session avec `auth.api.getSession({ headers: await headers() })` avant d'agir.
- Valider le body avec les schémas Zod de `@saveit/shared`.

### Extension
- Point d'entrée : `apps/extension/src/entrypoints/popup.tsx`.
- Config WXT : `apps/extension/wxt.config.ts`.
- L'extension communique avec la webapp via `fetch` + `credentials: "include"` pour envoyer le cookie de session.
- Variable d'env WXT : `WXT_API_URL` (préfixe `WXT_` pour les variables exposées dans l'extension).

### UI (webapp)
- shadcn/ui basé sur `@base-ui/react` (pas Radix). Ne pas utiliser `asChild` sur les composants shadcn.
- Composants UI dans `apps/web/src/components/ui/`.
- Composants métier dans `apps/web/src/components/bookmarks/` et `apps/web/src/components/auth/`.

### Types partagés
- Schémas Zod dans `packages/shared/src/schemas.ts`.
- Toujours importer depuis `@saveit/shared`, jamais redéfinir localement.

## Variables d'environnement

Fichier de référence : `.env.example` à la racine.
Fichier local pour la webapp : `apps/web/.env.local`.

| Variable | Usage |
|----------|-------|
| `DATABASE_URL` | Connexion PostgreSQL (Neon) |
| `BETTER_AUTH_SECRET` | Secret de signature des sessions Better Auth |
| `NEXT_PUBLIC_APP_URL` | URL publique de la webapp (utilisée par l'auth client + extension) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google (optionnel v1) |
| `WXT_API_URL` | URL de la webapp, injectée dans le build de l'extension |

## Pièges connus

- `apps/web` ne doit PAS avoir son propre `pnpm-workspace.yaml` — Next.js en crée un automatiquement lors du `create-next-app`, il faut le supprimer.
- shadcn/ui avec `@base-ui/react` : pas de prop `asChild` sur `DropdownMenuTrigger` et autres primitives.
- Le package `@saveit/shared` utilise `"exports": { ".": "./src/index.ts" }` sans build — les consommateurs doivent supporter l'import direct de TypeScript (Next.js et WXT le font nativement).
