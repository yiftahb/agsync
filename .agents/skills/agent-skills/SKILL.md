---
name: agent-skills
description: Expert in the Agent Skills open standard (agentskills.io). Use when creating, editing, or validating SKILL.md files, structuring skill directories, or understanding how skills are discovered and loaded by agents.

---

# Agent Skills Standard

You are an expert in the Agent Skills open standard, the portable format for extending AI agents with specialized capabilities.

## What Is a Skill?

A skill is a directory containing a `SKILL.md` file plus optional supporting files. Skills package domain-specific knowledge and workflows that agents can use to perform tasks. Skills are portable across any agent that supports the standard (Cursor, Codex, and others).

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
| name | Yes | Max 64 chars. Lowercase letters, numbers, hyphens only. Must match parent directory name. No leading/trailing/consecutive hyphens. |
| description | Yes | Max 1024 chars. Describes what the skill does AND when to use it. Include keywords for implicit matching. |
| license | No | License name or reference to bundled license file. |
| compatibility | No | Max 500 chars. Environment requirements (system packages, network, etc.). |
| metadata | No | Arbitrary key-value mapping (string keys to string values). |
| allowed-tools | No | Space-delimited list of pre-approved tools. Experimental. |

### Name Field Rules
- 1-64 characters
- Only lowercase alphanumeric and hyphens
- No leading, trailing, or consecutive hyphens
- Must match the parent directory name
- Valid: `code-review`, `data-analysis`, `pdf-processing`
- Invalid: `Code-Review`, `-pdf`, `pdf--processing`

### Description Best Practices
- Describe both WHAT the skill does and WHEN to use it
- Include specific keywords that help agents identify relevant tasks
- Good: "Extracts text from PDF files, fills forms, merges PDFs. Use when working with PDF documents."
- Bad: "Helps with PDFs."

## Progressive Disclosure

Skills are loaded in stages for context efficiency:

1. **Metadata (~100 tokens)**: `name` and `description` loaded at startup for all skills
2. **Instructions (< 5000 tokens recommended)**: Full SKILL.md body loaded when skill is activated
3. **Resources (as needed)**: Files in scripts/, references/, assets/ loaded only when required

Keep SKILL.md under 500 lines. Move detailed reference material to separate files.

## Optional Directories

### scripts/
Executable code agents can run. Should be self-contained, include helpful error messages, and handle edge cases. Any language supported by the agent (Python, Bash, JavaScript, etc.).

### references/
Additional documentation loaded on demand. Keep files focused and small. Common files: REFERENCE.md, domain-specific guides.

### assets/
Static resources: templates, images, schemas, data files.

## File References

Reference files using relative paths from the skill root:

```markdown
See [the reference guide](references/REFERENCE.md) for details.
Run the script: `scripts/extract.py`
```

Keep references one level deep. Avoid deeply nested reference chains.

## Skill Discovery Locations

Agents scan these directories:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level (primary standard path) |
| `.cursor/skills/` | Project-level (Cursor) |
| `.claude/skills/` | Project-level (Claude Code) |
| `.codex/skills/` | Project-level (Codex) |
| `~/.cursor/skills/` | User-level |
| `~/.agents/skills/` | User-level |
| `$HOME/.agents/skills` | User-level |

## Invocation

- **Implicit**: Agent automatically activates when task matches the `description`
- **Explicit**: User types `$skill-name` (Codex), `/skill-name` (Cursor), or selects from skill picker

## Validation

Use the skills-ref reference library:
```bash
skills-ref validate ./my-skill
```

## Reference

Full specification: https://agentskills.io/specification
Documentation index: https://agentskills.io/llms.txt