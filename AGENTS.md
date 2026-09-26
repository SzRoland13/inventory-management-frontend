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
