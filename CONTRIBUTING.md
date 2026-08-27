<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="media/cadence-logo-full-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="media/cadence-logo-full-light.png">
    <img alt="Cadence" src="media/cadence-logo-full-light.png" width="420">
  </picture>
</p>

# Contributing

First, thank you so much for considering contributing to Cadence. Contributors mean a lot to us, and it's people like you that make this project so rewarding to build.

## Prerequisites

- **Node.js 22+**
- **pnpm 10+**

## Setup

1. Fork and clone the repo

   ```bash
   git clone https://github.com/rishabh777dev/cadence.git
   cd cadence
   ```

2. Install dependencies

   ```bash
   pnpm install
   ```

3. Start development

   ```bash
   pnpm dev
   ```

   This starts the Electron app with hot-reloading via `electron-vite`. The embedded Hono server starts automatically on a local port.

   On first launch, macOS will prompt for:
   1. **Microphone** access
   2. **Accessibility** access (required for paste simulation and global key listener)

## Build

```bash
# macOS
pnpm --filter @cadence-voice/electron build:mac

# Windows
pnpm --filter @cadence-voice/electron build:win

# Linux
pnpm --filter @cadence-voice/electron build:linux
```

## Project structure

- `apps/electron` — Electron desktop app (main process + React renderer)
- `apps/server` — Hono API server (embedded in the Electron app)

## Development workflow

1. Create a branch from `main`
2. Make your changes
3. Run `pnpm biome check .` to verify lint and formatting
4. Run `pnpm --filter @cadence-voice/electron typecheck:web` to verify types
5. Commit — husky runs biome on staged files automatically
6. Open a PR against `main`

## Code style

- **Biome** for linting and formatting (not ESLint/Prettier)
- 2-space indentation, 80-char line width
- Imports are auto-sorted by Biome

## Commit messages

Follow conventional commits:

```
feat: add new feature
fix: resolve a bug
chore: maintenance task
```

## Pull request titles

PR titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. We squash-merge PRs and use the PR title for the squash commit and the release changelog, so a clean title matters.

```
type(scope): short imperative summary
```

The scope is optional. Allowed types:

`feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `style`, `revert`

Examples:

```
fix: prevent duplicate settings requests
feat(plugins): add update checks
docs: clarify local development setup
refactor(server): simplify plugin loading
```

A CI check validates PR titles automatically. If it fails, edit your PR title to match the format above — no need to open a new PR.

## Cadence Cloud backend (managed STT)

Only needed if you're working on the **Cadence Cloud** transcription provider. It's a separate Cloudflare Worker (the `cloud` repository) that exposes the `/v1/transcribe` endpoint, and the desktop app calls it when "Cadence Cloud" is the selected voice model.

1. In the cloud repo's `apps/server`, create local secrets from the template and add a Groq API key:

   ```bash
   cp apps/server/.dev.vars.example apps/server/.dev.vars
   # set GROQ_API_KEY=... in .dev.vars
   ```

2. Start the Worker with Wrangler (defaults to `http://localhost:8787`):

   ```bash
   pnpm dev   # runs `wrangler dev`
   ```

3. Point the desktop app at it by setting this in `apps/electron/.env.local`, then restart `pnpm dev`:

   ```
   CADENCE_CLOUD_URL=http://localhost:8787
   ```

`.dev.vars` is gitignored — never commit real keys. For a deployed Worker, set secrets with `wrangler secret put GROQ_API_KEY` instead.