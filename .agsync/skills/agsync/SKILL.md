---
name: agsync
description: >
  Expert in agsync, the Git-native CLI that syncs skills, commands, and MCP tools
  across AI coding agents. Use when working with agsync.yaml, adding or removing
  skills, syncing configs, or troubleshooting agsync workflows.
---

# agsync

You are an expert in agsync, a Git-native CLI tool that compiles and syncs skill definitions, commands, and MCP tool bindings across multiple AI coding agents.

## Important

**Never edit files outside `.agsync/` directly.** All generated output (`AGENTS.md`, `.agents/skills/`, `.agents/commands/`, agent-specific symlinks) is managed by agsync. Edit sources in `.agsync/` and run `agsync sync` to regenerate.

## What agsync Does

agsync reads canonical definitions from `.agsync/` and generates agent-specific output. The `.agsync/` directory is the single source of truth.

## Project Structure

```
project/
├── agsync.yaml                          # Root config (one per repo)
├── .agsync/                             # Root definitions
│   ├── instructions.md                  # User-written project instructions
│   ├── skills/                          # Skill definitions
│   │   ├── my-skill/
│   │   │   ├── SKILL.md                 # Skill definition (frontmatter + body)
│   │   │   ├── scripts/                 # Optional executable code
│   │   │   ├── references/              # Optional documentation
│   │   │   └── assets/                  # Optional templates, resources
│   │   └── imported-skill/
│   │       └── SKILL.md                 # Stub with source (content fetched on sync)
│   ├── commands/                        # Slash commands (.md files)
│   │   └── deploy.md                    # /deploy command
│   └── mcp/*.yaml                       # MCP server definitions
│
├── frontend/                            # Subfolder with its own .agsync/
│   ├── .agsync/
│   │   ├── instructions.md              # Subfolder instructions
│   │   └── skills/ui-kit/SKILL.md       # Scoped skill
│   └── AGENTS.md                        # Generated (scoped instructions)
│
│  ─── Generated output (do not edit) ───
├── AGENTS.md                            # Root instructions + skill listing + scope refs
├── .agents/skills/*/SKILL.md            # Canonical skill output
├── .agents/skills/frontend--ui-kit/     # Scoped skill (double-dash)
├── .agents/commands/*.md                # Canonical command output
│
│  ─── Agent symlinks (root only, do not edit) ───
├── CLAUDE.md → AGENTS.md               # Symlink
├── .claude/skills/ → .agents/skills/    # Symlink
├── .cursor/skills/ → .agents/skills/    # Symlink
├── .claude/settings.json                # Generated MCP config
├── .cursor/mcp.json                     # Generated MCP config
└── .codex/config.toml                   # Generated MCP config (TOML)
```

## Skill Definition (SKILL.md)

Each skill is a directory under `.agsync/skills/` with a `SKILL.md` file:

```markdown
---
name: my-skill
description: What this skill does and when to use it
---

Detailed instructions for the agent.
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier, must match the directory name |
| description | Yes | What the skill does and when to use it |
| source | No | Remote skill reference (content fetched during sync) |
| extends | No | List of skills to inherit from (local or GitHub) |
| tools | No | List of tool names this skill can use |

A skill must have either body instructions or `source` (or both).

### Imported Skill (stub with source)

```markdown
---
name: code-reviewer
description: Reviews code for quality
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
  version: "v1.0.0"
---
```

## Version Locking

External skills are pinned to exact versions via `source.version`. A lock file (`agsync-lock.yaml`) records the resolved commit/version and content hash for each external dependency.

Use `--frozen` with `sync` or `plan` in CI to enforce the lock file — the command fails if the lock is missing or stale.

## Commands

Commands are `.md` files under `.agsync/commands/`. The filename becomes the slash command name.

```
.agsync/commands/deploy.md    → /deploy
.agsync/commands/review.md    → /review
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `agsync init` | Scaffold a new project |
| `agsync skill add <name>` | Create a local empty skill |
| `agsync skill add github:<org/repo/path@ver>` | Import a skill from GitHub |
| `agsync skill add clawhub:<slug@ver>` | Import a skill from ClawHub |
| `agsync skill remove <name>` | Remove a skill |
| `agsync command add <name>` | Create a new command (.md) |
| `agsync command remove <name>` | Remove a command |
| `agsync tool add <name>` | Create a new tool definition (.yaml) |
| `agsync tool remove <name>` | Remove a tool |
| `agsync validate` | Validate config and definitions |
| `agsync plan [--frozen]` | Preview changes without writing |
| `agsync sync [--frozen]` | Resolve skills, fetch sources, generate agent configs |
| `agsync doctor` | Check environment health |
| `agsync version` | Show version and check for updates |
| `agsync update` | Update to latest version |

All `add` and `remove` commands resolve the nearest `.agsync/` directory upwards in the directory tree, so they work correctly from any subdirectory (e.g. running from `frontend/` adds to `frontend/.agsync/`).

## agsync.yaml Format

```yaml
version: "1"
skills:
  - path: .agsync/skills/*
commands:
  - path: .agsync/commands/*
tools:
  - path: .agsync/mcp/*.yaml
agents:
  claude:
    instructions: { enabled: true }
    skills: { enabled: true }
    commands: { enabled: true }
    mcp: { enabled: true }
  cursor:
    skills: { enabled: true }
    mcp: { enabled: true }
  codex:
    instructions: { enabled: true }
    skills: { enabled: true }
    mcp: { enabled: true }
```

## Generated Output

- `AGENTS.md` is generated from `.agsync/instructions.md` + skill listing + scope cross-references. Agent-specific instruction files (CLAUDE.md, GEMINI.md, etc.) are symlinks to AGENTS.md, created only at the repo root.
- Subfolders with `.agsync/instructions.md` or skills get their own `AGENTS.md` generated in-place (e.g. `frontend/AGENTS.md`). The root `AGENTS.md` references these: "When working in folder: `frontend` — you MUST load `frontend/AGENTS.md`".
- `.agents/skills/` and `.agents/commands/` contain the canonical output with "managed by agsync" headers. Scoped items use double-dash directory names (e.g. `frontend--ui-kit`).
- Agent skill/command directories (`.claude/skills/`, `.cursor/skills/`, etc.) are symlinks to `.agents/skills/` and `.agents/commands/`.
- MCP configs are generated per-agent (JSON or TOML), merged with existing entries.

## Supported Agents

claude, cursor, codex, windsurf, copilot, gemini, opencode, antigravity

## Examples

See the reference files for detailed examples:
- `references/simple-skill.md` — minimal skill definition
- `references/skill-with-resources.md` — skill with scripts, references, assets
- `references/importing-skills.md` — importing from open source
- `references/extending-skills.md` — extending via source or extends
- `references/mcp-tool-definition.md` — MCP tool with env expansion
