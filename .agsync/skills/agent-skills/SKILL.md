---
name: agent-skills
description: >
  Expert in the Agent Skills open standard (agentskills.io). Use when creating,
  editing, or validating SKILL.md files, structuring skill directories, or
  understanding how skills are discovered and loaded by agents.
---

# Agent Skills Standard

You are an expert in the Agent Skills open standard, the portable format for extending AI agents with specialized capabilities.

## What Is a Skill?

A skill is a directory containing a `SKILL.md` file plus optional supporting files. Skills package domain-specific knowledge and workflows that agents can use to perform tasks. Skills are portable across any agent that supports the standard.

## Directory Structure

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation loaded on demand
├── assets/           # Optional: templates, images, data files
└── ...               # Any additional files
```

## SKILL.md Format

The file must contain YAML frontmatter followed by Markdown content:

```markdown
---
name: skill-name
description: What this skill does and when to use it.
---

# Skill Name

Detailed instructions for the agent.

## When to Use
- Specific triggers and use cases

## Instructions
- Step-by-step guidance
```

## Frontmatter Fields

| Field | Required | Constraints |
|-------|----------|-------------|
| name | Yes | Max 64 chars. Lowercase letters, numbers, hyphens only. Must match parent directory name. |
| description | Yes | Max 1024 chars. Describes what the skill does AND when to use it. |
| license | No | License name or reference to bundled license file. |
| compatibility | No | Max 500 chars. Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |

### Name Field Rules
- 1-64 characters
- Only lowercase alphanumeric and hyphens
- No leading, trailing, or consecutive hyphens
- Must match the parent directory name

### Description Best Practices
- Describe both WHAT the skill does and WHEN to use it
- Include specific keywords that help agents identify relevant tasks

## Progressive Disclosure

Skills are loaded in stages for context efficiency:

1. **Metadata (~100 tokens)**: `name` and `description` loaded at startup
2. **Instructions (< 5000 tokens recommended)**: Full SKILL.md body loaded when activated
3. **Resources (as needed)**: Supporting files loaded only when required

Keep SKILL.md under 500 lines. Move detailed reference material to separate files.

## Optional Directories

### scripts/
Executable code agents can run. Should be self-contained with helpful error messages.

### references/
Additional documentation loaded on demand. Keep files focused and small.

### assets/
Static resources: templates, images, schemas, data files.

## Skill Discovery Locations

Agents scan these directories:

| Location | Scope | Agents |
|----------|-------|--------|
| `.agents/skills/` | Project-level | Primary standard path (all agents) |
| `.claude/skills/` | Project-level | Claude Code |
| `.cursor/skills/` | Project-level | Cursor |
| `.codex/skills/` | Project-level | Codex |
| `.windsurf/skills/` | Project-level | Windsurf |
| `.gemini/skills/` | Project-level | Gemini |
| `.opencode/skills/` | Project-level | OpenCode |
| `.agent/skills/` | Project-level | Antigravity |
| `~/.agents/skills/` | User-level | All agents |

## Invocation

- **Implicit**: Agent automatically activates when task matches the `description`
- **Explicit**: User types `@skill-name`, `$skill-name`, or selects from skill picker

## Reference

Full specification: https://agentskills.io/specification
Documentation index: https://agentskills.io/llms.txt
