---
name: claude-skills
description: Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.

---

# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification