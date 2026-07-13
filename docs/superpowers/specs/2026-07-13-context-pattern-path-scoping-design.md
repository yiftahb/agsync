# Context management: scope-relative pattern paths

Date: 2026-07-13
Status: approved (design phase)

## Problem

agsync's context system distinguishes two concepts:

- **Patterns** (`.agsync/patterns/*.md`) — architectural principles reusable across the repo (e.g. a `rest-api-service` pattern describing controller/service layering).
- **Guidelines** — atomic rules (e.g. `no-comments: code must be self-explanatory`), each optionally scoped to `paths`.

Both already support per-guideline `paths` in the schema ([`Guideline.paths`](../../../src/types/index.ts), [`guidelineSchema`](../../../src/schema/config.ts)). But when a pattern is applied via `apply_patterns`, [`mergeContext`](../../../src/context/merger.ts) discards each guideline's own `paths` and replaces it with a single `boundPaths` value for the whole pattern application:

```ts
// current — src/context/merger.ts:71-79
for (const g of pattern.guidelines) {
  const resolvedId = `${ap.id}:${g.id}`;
  resolved.set(resolvedId, {
    id: resolvedId,
    rule: g.rule,
    paths: boundPaths,   // <- every guideline in the pattern gets the same path, own paths lost
    source: `pattern:${ap.id}`,
  });
}
```

This breaks the main reuse case: a monorepo with several microservices wants to define one shared pattern (e.g. `rest-api-service`) with guidelines like `"no business logic in controllers"` scoped to `controllers/**`, apply that same pattern in each microservice's `.agsync/instructions.md`, and have the path resolve relative to *that* microservice — `service-a/controllers/**`, `service-b/controllers/**` — without rewriting the pattern per service.

## Goals

1. A pattern guideline's own `paths` (if set) resolve **relative to the scope where the pattern is applied**, instead of being discarded.
2. No new syntax or schema changes — `paths` already exists and already means "glob relative to repo root" everywhere else in the system.
3. Full backward compatibility: patterns whose guidelines don't declare `paths` behave exactly as today (fall back to the scope's default bound paths).
4. The `apply_patterns.paths` override (existing escape hatch, forces one path list across an entire pattern application) keeps working unchanged.
5. Building agent (`AGENTS.md`) and reviewing agent (`.coderabbit.yaml`) stay consistent on rules + paths — verified as an inherent property of the architecture (see below), not new work.
6. Gradual adoption in an existing monorepo — confirmed as already working, not new work (see below).

## Non-goals

- Carrying pattern/HLD rationale prose into `.coderabbit.yaml` (confirmed out of scope — reviewing agent only needs rules + paths, not architectural narrative).
- Broader test coverage for `parser.ts`, `compiler.ts`, `patterns.ts`, `coderabbit.ts` (real gap, flagged as a separate follow-up, not bundled here).
- Any change to skill/command/MCP sync paths.

## Design

### Core change — `src/context/merger.ts`

Add a small path-resolution helper and use it in the pattern-application loop inside `mergeContext`:

```ts
function resolveScopedPath(scope: string, path: string): string {
  if (path === "**") return "**";          // global sentinel stays global regardless of scope
  return scope ? `${scope}/${path}` : path; // root scope ("") passes through untouched
}
```

Updated loop:

```ts
for (const g of pattern.guidelines) {
  const resolvedId = `${ap.id}:${g.id}`;
  const paths = ap.paths                                   // explicit override — still wins, unchanged
    ?? (g.paths?.length
      ? g.paths.map((p) => resolveScopedPath(scope, p))    // NEW: keep + scope the guideline's own path
      : boundPaths);                                        // no own path — unchanged fallback

  resolved.set(resolvedId, { id: resolvedId, rule: g.rule, paths, source: `pattern:${ap.id}` });
}
```

`scope` here is the bare scope folder name (e.g. `"service-a"`), confirmed to have no trailing slash ([`hierarchy.ts:31`](../../../src/loader/hierarchy.ts)), so the join is a plain string concatenation with no path-normalization step needed.

### Data flow (unchanged downstream)

```
instructions.md (scope) --apply_patterns--> pattern lookup
  --per guideline--> resolveScopedPath(scope, guideline.paths) or fallback
  --> ResolvedGuideline in CompiledContext[scope]
  --> compiler.ts (AGENTS.md)          [no changes needed]
  --> review/coderabbit.ts (.coderabbit.yaml)  [no changes needed]
```

Both compile targets already consume the same `CompiledContext[]` (`sync.ts:392` and `sync.ts:433`), so once path resolution is correct at the merge step, both outputs are consistent by construction — this is an existing architectural property, not something this change needs to build.

### Edge cases

| Case | Behavior |
|---|---|
| Pattern applied at root (`scope === ""`) | No prefix — guideline's own path used as-is |
| Guideline path is exactly `"**"` | Stays global regardless of applying scope (existing sentinel semantics, unchanged) |
| `apply_patterns.paths` explicitly set | Overrides every guideline's path for that application (existing escape hatch, unchanged) |
| Guideline has no own `paths` | Falls back to `boundPaths` (today's default: `ap.paths ?? scope/**`) — fully backward compatible |
| Pattern applied in multiple scopes | Each application resolves independently — same pattern, different resolved paths per scope |

### Gradual adoption (confirmed existing behavior, no changes)

[`discoverAgsyncDirs`](../../../src/loader/config.ts) walks the whole repo tree and only registers a directory as a scope if it contains a `.agsync/` folder (skipping dotfiles and `node_modules`). A microservice without `.agsync/` is never discovered, never compiled, and never gets an `AGENTS.md`. Adding `.agsync/instructions.md` to one microservice later picks it up automatically on the next `agsync sync` — no registration step, no global config change required. This already satisfies incremental rollout across an existing monorepo.

## Testing

1. **`tests/context/merger.test.ts`** (new file — `src/context/` has no dedicated tests today):
   - Pattern guideline with own `paths`, applied at a nested scope → resolves to `${scope}/${path}`.
   - Same, applied at root scope (`""`) → path unchanged, no prefix.
   - Guideline path `"**"` → stays `"**"` regardless of scope.
   - `apply_patterns.paths` set explicitly → overrides all guideline paths in that application.
   - Guideline with no own `paths` → falls back to today's default (regression guard for backward compatibility).

2. **Monorepo mixed-adoption integration test** (extend `tests/loader/hierarchy.test.ts` or add `tests/commands/sync.test.ts` case):
   - Fixture: `service-a/.agsync/{instructions.md, patterns applied}` + root `.agsync/patterns/rest-api-service.md` (guideline scoped to `controllers/**`) + `service-b/` with **no** `.agsync/` at all.
   - Assert: `service-a/AGENTS.md` guideline path resolves to `service-a/controllers/**`; `service-b` produces no `AGENTS.md` and is absent from `compiledContexts`.

## Out-of-scope follow-ups (not part of this implementation)

- Test coverage for `parser.ts`, `compiler.ts`, `patterns.ts`, `review/coderabbit.ts` in general.
- Any coderabbit output beyond `path_instructions` (e.g. carrying HLD prose) — explicitly declined for this iteration.
