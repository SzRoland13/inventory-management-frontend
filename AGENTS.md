<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may
all differ from your training data. Read the relevant guide in
`node_modules/next/dist/docs/` (resolved from this file's directory; in
monorepos the `next` package may not be visible from the repo root) before
writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at
`node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a
diff only re-creates the uncommitted change; committing it with your work keeps
the tree clean.

<!-- END:nextjs-agent-rules -->

## Project structure

This frontend uses a feature-based structure under `src/features/`:

- `src/app/` contains Next.js route files and layouts. Keep route pages thin:
  they should delegate page UI to the corresponding feature screen while
  preserving the existing route and layout boundaries.
- `src/features/<feature>/` owns domain code. Use these folder names as needed:
  `screens/` for full page views rendered by routes; `components/` for feature
  UI reused within the feature; `services/` for API/service calls; `queries/`
  for React Query hooks and cache behavior; `types/` for TypeScript types and
  DTOs; `schemas/` for runtime validation schemas; `stores/` for feature state;
  `hooks/` for feature-specific React hooks; and `helpers/` for feature-specific
  utilities. Keep each concern in its matching folder, and omit folders that the
  feature does not need. Existing feature areas include `auth`, `users`,
  `settings`, `dashboard`, `documents`, `products`, `reports`, `sales`,
  `stocks`, and `warehouses`.
- `src/features/shared/` is for code reused across features, including UI
  primitives, providers, generic API helpers, media capabilities, and generic
  components. Keep domain-specific behavior inside its owning feature.
- The shared TanStack table renderer lives in `src/features/shared/table/`. It
  receives a TanStack table instance and renders it; features own their table
  configuration, columns, state, and actions. Use that renderer for new feature
  tables when it fits.
- App-wide framework configuration and localization remain in their existing
  locations, such as `src/i18n/`, `src/app/`, and `src/proxy.ts`.

When adding functionality, first check whether it belongs to an existing
feature. Add code to `shared` only when it is genuinely reusable, and update
imports to point to the new feature-owned location when moving code.

## Graphify

This project has a knowledge graph in `graphify-out/`.

- For codebase questions, when `graphify-out/graph.json` exists, query it first
  with `graphify query "<question>"`. Use `graphify path "<A>" "<B>"` for
  relationships and `graphify explain "<concept>"` for a focused explanation.
- For broad navigation, use `graphify-out/wiki/index.md` if it exists. Read
  `graphify-out/GRAPH_REPORT.md` for broad architecture questions or when a
  focused query is insufficient.
- After modifying code, run `graphify update .` to refresh the graph.
- See `skills/graphify/SKILL.md` for Graphify usage details.
