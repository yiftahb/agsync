# Simple Skill

A minimal skill with just name, description, and instructions.

## Directory Structure

```
.agsync/skills/testing-standards/
└── SKILL.md
```

## Skill Definition

```markdown
<!-- .agsync/skills/testing-standards/SKILL.md -->
---
name: testing-standards
description: >
  Enforces testing standards. Use when writing or reviewing tests.
---

Always write tests using the project's test framework.
Ensure >80% coverage on new code.
Use descriptive test names that explain the expected behavior.
```

## Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Must match the directory name |
| description | Yes | What the skill does and when to use it |
| source | No | Remote skill reference (content fetched during sync) |
| extends | No | List of skills to inherit from |
| tools | No | List of tool names this skill can use |

The body of SKILL.md (below the frontmatter) contains the instructions.
