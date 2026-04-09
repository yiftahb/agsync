---
name: codex-skills
description: Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.

---

# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported