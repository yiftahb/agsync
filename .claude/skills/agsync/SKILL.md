---
name: agsync
description: Expert in agsync, the Git-native CLI that syncs skills and MCP tools across Claude Code, Codex, and Cursor. Use when working with agsync.yaml, adding or removing skills, syncing configs, or troubleshooting agsync workflows.

---

# agsync

You are an expert in agsync, a Git-native CLI tool that compiles and syncs skill definitions and MCP tool bindings across multiple AI coding clients.

## What agsync Does

agsync is the single source of truth for AI agent configuration in a repository. It takes canonical definitions stored under `.agsync/` and generates client-specific output for Claude Code, Codex, and Cursor.

## Project Structure

```
project/
├── agsync.yaml                          # Root config
├── .agsync/
│   ├── skills/                          # Skill definitions
│   │   ├── my-skill/
│   │   │   ├── my-skill.yaml            # Skill definition (name must match dir)
│   │   │   ├── scripts/                 # Optional executable code
│   │   │   ├── references/              # Optional documentation
│   │   │   └── assets/                  # Optional templates, resources
│   │   └── imported-skill/
│   │       └── imported-skill.yaml      # Stub with source (content fetched on sync)
│   └── tools/*.yaml                     # MCP tool definitions
├── AGENTS.md                            # Skill listing injected (agsync section)
├── CLAUDE.md                            # Skill listing injected (agsync section)
├── .agents/skills/*/SKILL.md            # Generated for Codex + Cursor
├── .claude/skills/*/SKILL.md            # Generated for Claude Code
├── .claude/settings.json                # Generated MCP config for Claude Code
└── .cursor/mcp.json                     # Generated MCP config for Cursor
```

## Skill Definition Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier, must match the directory name |
| description | Yes | What the skill does and when to use it |
| instructions | When no source | Detailed instructions for the agent (markdown) |
| source | When no instructions | Remote skill reference (content fetched during sync) |
| extends | No | List of skills to inherit from (local or GitHub) |
| tools | No | List of tool names this skill can use |

A skill must have either `instructions` or `source` (or both).

## CLI Commands

| Command | Description |
|---------|-------------|
| `agsync init` | Scaffold a new project |
| `agsync skill add <org/repo> <name>` | Register a skill from GitHub (creates stub YAML) |
| `agsync skill remove <name>` | Remove a skill |
| `agsync validate` | Validate config and definitions |
| `agsync plan` | Preview changes without writing |
| `agsync sync` | Resolve skills, fetch sources, generate client configs |
| `agsync doctor` | Check environment health |
| `agsync version` | Show version and check for updates |
| `agsync update` | Update to latest version |

## How `skill add` and `sync` Work Together

`skill add` creates a lightweight YAML stub with the source reference. `sync` fetches the remote SKILL.md and supporting files, resolves the content, and generates output. If the stub has local `instructions`, they are appended after the remote instructions (extension model).

## Examples

See the reference files for detailed examples:
- `references/simple-skill.md` — minimal skill definition
- `references/skill-with-resources.md` — skill with scripts, references, assets
- `references/importing-skills.md` — importing from open source
- `references/extending-skills.md` — extending via source or extends
- `references/mcp-tool-definition.md` — MCP tool with env expansion

## agsync.yaml Format

```yaml
version: "1"
targets:
  - claude-code
  - codex
  - cursor
skills:
  - path: .agsync/skills/*
tools:
  - path: .agsync/tools/*.yaml
```

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.