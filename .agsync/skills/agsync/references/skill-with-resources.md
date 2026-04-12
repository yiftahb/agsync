# Skill with Scripts, References, and Assets

Skills can include executable scripts, reference documentation, and asset files alongside the SKILL.md definition.

## Directory Structure

```
.agsync/skills/db-migrations/
├── SKILL.md
├── scripts/
│   └── check-migration.sh     # Agents can execute this
├── references/
│   └── schema-guide.md        # Loaded on demand for context
└── assets/
    └── migration-template.sql  # Templates and data files
```

## Skill Definition

```markdown
<!-- .agsync/skills/db-migrations/SKILL.md -->
---
name: db-migrations
description: >
  Database migration expert. Use when creating, reviewing, or
  troubleshooting database migrations.
---

You are an expert in database migrations.

Before creating a migration, run scripts/check-migration.sh to
validate the current schema state. Refer to references/schema-guide.md
for naming conventions and best practices.
```

## Resource Directories

| Directory | Purpose | How agents use it |
|-----------|---------|-------------------|
| scripts/ | Executable code | Agents run these and use the output |
| references/ | Documentation | Agents read these on demand for context |
| assets/ | Templates, data | Agents use these as templates or data sources |

Scripts execute via the agent's shell; only the output enters context. Reference files are read on demand. This keeps the context window efficient.
