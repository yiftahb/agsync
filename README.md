<p align="center">
  <img src="assets/logo.png" alt="agsync" width="400">
</p>

<p align="center">
  Git-native CLI to sync skills, commands, and MCP tools across AI coding agents.
</p>

<p align="center">
  <a href="https://github.com/yiftahb/agsync/actions/workflows/ci.yml"><img src="https://github.com/yiftahb/agsync/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/agsync-cli"><img src="https://img.shields.io/npm/v/agsync-cli" alt="npm version"></a>
  <a href="https://github.com/yiftahb/agsync/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/agsync-cli" alt="license"></a>
</p>

Define your AI agent skills, commands, and tool configurations once in `.agsync/`, then generate output for every coding agent your team uses.

## Supported Agents

| Agent | Instructions | Skills | Commands | MCP |
|-------|-------------|--------|----------|-----|
| Claude Code | `CLAUDE.md` | `.claude/skills/` | `.claude/commands/` | `.claude/settings.json` |
| Cursor | -- | `.cursor/skills/` | `.cursor/commands/` | `.cursor/mcp.json` |
| Codex | `.codex/instructions.md` | `.codex/skills/` | `.codex/commands/` | `.codex/config.toml` |
| Windsurf | -- | `.windsurf/skills/` | `.windsurf/commands/` | `.windsurf/mcp_config.json` |
| Copilot | `.github/copilot-instructions.md` | -- | `.github/agents/` | `.mcp.json` |
| Gemini | `GEMINI.md` | `.gemini/skills/` | `.gemini/commands/` | `.gemini/settings.json` |
| OpenCode | -- | `.opencode/skills/` | `.opencode/command/` | `opencode.json` |
| Antigravity | `.agent/rules/instructions.md` | `.agent/skills/` | `.agent/commands/` | -- |

## Install

```bash
npm i -g agsync-cli
```

Or run directly:

```bash
npx agsync-cli
```

## Quick Start

```bash
# Scaffold a new project
agsync init

# Import a skill from GitHub
agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer

# Validate definitions
agsync validate

# Generate agent configs
agsync sync
```

After `agsync sync`, your repo will contain:

```
project/
├── agsync.yaml                          # Your config
├── .agsync/
│   ├── instructions.md                  # Your project instructions
│   ├── skills/*/SKILL.md               # Source of truth (skills)
│   ├── commands/*.md                    # Source of truth (commands)
│   └── tools/*.yaml                     # MCP tool definitions
│
├── AGENTS.md                            # Generated (instructions + skill listing)
├── .agents/skills/*/SKILL.md            # Canonical skill output
├── .agents/commands/*.md                # Canonical command output
│
├── CLAUDE.md → AGENTS.md               # Symlink
├── .claude/skills/ → .agents/skills/    # Symlink
├── .claude/commands/ → .agents/commands/# Symlink
├── .cursor/skills/ → .agents/skills/    # Symlink
├── .claude/settings.json                # Generated MCP config
├── .cursor/mcp.json                     # Generated MCP config
└── .codex/config.toml                   # Generated MCP config (TOML)
```

## How It Works

agsync reads canonical definitions from `.agsync/`, resolves inheritance chains, and generates the native format each agent expects:

- **Instructions**: `.agsync/instructions.md` is combined with a skill listing to generate `AGENTS.md`. Agent-specific instruction files (`CLAUDE.md`, `GEMINI.md`, etc.) are symlinks to `AGENTS.md`
- **Skills**: Generated as `SKILL.md` files in `.agents/skills/` (canonical output). Agent-specific directories (`.claude/skills/`, `.cursor/skills/`, etc.) are symlinks to `.agents/skills/`
- **Commands**: `.md` files in `.agsync/commands/` are copied to `.agents/commands/`. Agent-specific command directories are symlinks
- **MCP configs**: Generated per-agent in the correct format (JSON or TOML) and merged with existing entries

## Commands

### `agsync init`

Creates `agsync.yaml` and the `.agsync/` directory structure with a sample skill, instructions template, and commands directory.

### `agsync skill add <org/repo> <skill-name>`

Imports a skill from a GitHub repository. Creates a `SKILL.md` stub with the skill's name, description, and source reference. The actual content is fetched during `agsync sync`.

```bash
agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer
agsync skill add yiftahb/agsync agent-skills
```

### `agsync skill remove <skill-name>`

Removes a skill from `.agsync/skills/`.

### `agsync validate`

Validates all config and definitions: schema checks, duplicate names, cross-references between skills and tools.

### `agsync plan`

Preview what `sync` would do without writing any files.

### `agsync sync`

The core command. Resolves skills, generates output, creates symlinks, and writes MCP configs.

### `agsync doctor`

Checks environment health: Node.js version, config presence, hierarchy chain, and enabled agents.

## Skill Examples

Each skill is a directory under `.agsync/skills/` with a `SKILL.md` file.

### Simple skill

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

### Imported skill

```bash
agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer
```

Creates a SKILL.md stub:

```markdown
---
name: code-reviewer
description: Reviews code for quality, security, and performance.
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
---
```

### Extended imported skill

Add instructions below the frontmatter to extend:

```markdown
---
name: code-reviewer
description: Security-focused code reviewer for our team.
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
tools:
  - github
---

Additionally, focus on OWASP Top 10 vulnerabilities.
Flag any hardcoded secrets or credentials.
```

## MCP Tool Definitions

Define MCP servers in `.agsync/tools/*.yaml`:

```yaml
name: github
description: GitHub MCP server
type: mcp
command: npx
args: ["-y", "@modelcontextprotocol/server-github"]
env:
  GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN
```

Environment variables are expanded at sync time. Add generated MCP config files to `.gitignore` to avoid committing secrets.

## Features

### Global Feature Togglers

The `features:` block provides master switches for each feature type. All default to `false`. When a global feature is `false`, it is disabled for **all** agents regardless of per-agent configuration.

```yaml
features:
  instructions: true   # AGENTS.md + instruction symlinks
  skills: true         # .agents/skills/ + skill symlinks
  commands: true       # .agents/commands/ + command symlinks
  mcp: true            # MCP config file generation
```

### Gitignore Management

The `gitignore:` option controls how `agsync sync` manages your `.gitignore` file. Managed entries are placed in a section between `# agsync:begin` and `# agsync:end`.

| Mode | Behavior |
|------|----------|
| `on` | Add all generated output (`.agents/`, `AGENTS.md`, symlinks, MCP configs) |
| `mcpOnly` | Add only MCP config file paths (default) |
| `off` | Do not manage `.gitignore` |

This is especially useful for MCP configs that may contain expanded environment variables.

## Configuration

`agsync.yaml` at the project root:

```yaml
version: "1"

features:
  instructions: true
  skills: true
  commands: true
  mcp: true

gitignore: mcpOnly

skills:
  - path: .agsync/skills/*
commands:
  - path: .agsync/commands/*
tools:
  - path: .agsync/tools/*.yaml

agents:
  claude:
    instructions: { enabled: true }
    skills: { enabled: true }
    commands: { enabled: true }
    mcp: { enabled: true }
  cursor:
    skills: { enabled: true }
    commands: { enabled: true }
    mcp: { enabled: true }
  codex:
    instructions: { enabled: true }
    skills: { enabled: true }
    mcp: { enabled: true }
  copilot:
    instructions: { enabled: true }
    commands: { enabled: true }
    mcp: { enabled: true }
```

Each agent's features are disabled by default. Only list the agents and features you want active.

## Monorepo Support

Place `agsync.yaml` at multiple levels. Configs are collected and merged from the git root down:

```
monorepo/
├── agsync.yaml              # Org-wide config
├── .agsync/skills/
├── apps/
│   └── api/
│       ├── agsync.yaml      # API-specific additions
│       └── .agsync/skills/
```

## License

MIT
