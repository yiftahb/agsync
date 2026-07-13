---
name: context-manager
description: >
  Manages agsync structured context — create or edit instructions.md and
  pattern files, and migrate existing cursor rules or coderabbit YAML into
  the agsync context format. Use when the user asks to set up context, add
  guidelines, create patterns, or migrate from cursor/coderabbit configs.
---

<task>
Help the user create or maintain agsync structured context files:

1. **Author** `.agsync/instructions.md` (root or package) and `.agsync/patterns/*.md`
2. **Migrate** from `.cursorrules`, `.cursor/rules/*.mdc`, or `.coderabbit.yaml`
3. **Validate** with `agsync validate` after every write
</task>

<guidelines>
**instructions.md format:**
```markdown
---
extends: root          # omit at root level
apply_patterns:
  - id: pattern-id
    paths: ["subdir/**"]
---

## HLD
Prose description of architecture and intent.

## Guidelines
- id: rule-id
  rule: "the rule, phrased as a constraint"
  override: true       # only if overriding a parent rule with same id
```

**pattern file format** (`.agsync/patterns/<name>.md`):
```markdown
---
id: pattern-name
---

## HLD
Why this pattern exists.

## Guidelines
- id: rule-id
  rule: "the rule"
```

**Migration rules:**
- `.cursorrules` flat text → extract imperative lines → propose as guidelines in root `instructions.md`
- `.mdc` with `globs:` → map globs to `paths:` on guidelines or `apply_patterns`
- `.coderabbit.yaml` `path_instructions` → reverse-map each path entry to guidelines with matching `paths:`
- Ask before deleting source files
</guidelines>

<important>
- Every guideline needs a unique `id` — use kebab-case, describe the constraint not the action
- Guidelines cascade root → nested scopes (`backend` → `backend/service-a`). A nested scope may redefine a parent guideline `id`; set `override: true` to silence the collision warning. Nearest scope wins.
- Paths resolve relative to the scope that declares them: a guideline (or applied-pattern guideline) in `backend/service-a/.agsync` with `paths: ["controllers/**"]` resolves to `backend/service-a/controllers/**`. Use `**` for a rule that stays global at any scope. At the repo root, paths are repo-root-relative. `apply_patterns[].paths` is used verbatim (write the full path).
- Run `agsync validate` before reporting done; fix any errors or warnings
- Do not add guidelines that restate the obvious — only non-obvious constraints survive
</important>
