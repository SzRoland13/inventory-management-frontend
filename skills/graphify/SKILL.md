---
name: graphify
description:
  Use this project's Graphify knowledge graph to answer codebase questions,
  explore relationships, and refresh the graph after code changes.
---

# Graphify for this project

The project graph is stored in `graphify-out/graph.json`. Use the Graphify CLI
from the repository root.

## Query the existing graph

For a natural-language codebase question, start with:

```sh
graphify query "<question>"
```

For a relationship between two concepts, use `graphify path "<A>" "<B>"`. For a
focused explanation, use `graphify explain "<concept>"`. If a query does not
provide enough context, inspect `graphify-out/GRAPH_REPORT.md` and then relevant
source files. Ground conclusions in source files when the graph is incomplete or
stale.

## Refresh after code changes

Run `graphify update .` after changing code. This project uses Graphify's
AST-only update path, which does not require an API key.

## Detailed references

- `query-reference.md`: graph query and traversal details.
- `update-reference.md`: incremental refresh details.
- `exports-reference.md`: optional graph exports.
- `transcribe-reference.md`: handling media files during a full graph build.
- `github-and-merge-reference.md`: building or combining graphs across
  repositories.
