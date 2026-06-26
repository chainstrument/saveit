# SaveIt

Outil de sauvegarde de marque-pages pour la veille, composé d'une extension navigateur et d'une webapp dashboard.

## Structure

```
saveit/
├── apps/
│   ├── web/          # Webapp Next.js 15 (dashboard + API)
│   └── extension/    # Extension navigateur WXT + React
├── packages/
│   └── shared/       # Schémas Zod et types TypeScript partagés
├── .env.example
└── pnpm-workspace.yaml
```

## Stack

| Couche | Technologie |
|--------|-------------|
| Monorepo | pnpm workspaces |
| Webapp | Next.js 15 (App Router), Tailwind CSS, shadcn/ui |
| Extension | WXT, React, TypeScript |
| API | Next.js Route Handlers (REST) |
| Base de données | PostgreSQL (Neon) + Drizzle ORM |
| Auth | Better Auth (email/password + OAuth Google) |
| Types partagés | Zod + TypeScript (`@saveit/shared`) |

## Démarrage

### Prérequis

- Node.js >= 20
- pnpm >= 9

### Installation

```bash
pnpm install
```

### Configuration

```bash
cp .env.example apps/web/.env.local
# Remplir DATABASE_URL, BETTER_AUTH_SECRET, NEXT_PUBLIC_APP_URL
```

### Base de données (Neon)

1. Créer un projet sur [neon.tech](https://neon.tech)
2. Copier la `DATABASE_URL` dans `apps/web/.env.local`
3. Lancer la migration :

```bash
pnpm --filter @saveit/web db:generate
pnpm --filter @saveit/web db:migrate
```

### Lancer la webapp

```bash
pnpm --filter @saveit/web dev
# → http://localhost:3000
```

### Lancer l'extension (mode dev Chrome)

```bash
pnpm --filter @saveit/extension dev
# Charger le dossier .wxt/chrome-mv3 dans chrome://extensions
```

## Fonctionnalités v1

- **Extension** : popup avec capture auto URL + titre, champ note, tags
- **Webapp** : dashboard avec liste, recherche full-text, filtres par tags
- **Auth** : inscription / connexion email + mot de passe
- **API** : CRUD complet sur les bookmarks, protégé par session

## Roadmap v2

- Collections / dossiers
- Export CSV et Markdown
- Résumé automatique via Claude (LLM)
- Détection de doublons
- OAuth Google
