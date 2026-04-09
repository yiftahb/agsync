<p align="center">
  <img src="assets/logo.png" alt="agsync" width="400">
</p>

<p align="center">
  Git-native CLI to sync skills and MCP tools across Claude Code, Codex, and Cursor.
</p>

Define your AI agent skills and tool configurations once in `.agsync/`, then generate client-specific output for every coding agent your team uses.

## Supported Agents

| Agent | Status |
|-------|--------|
| Claude Code | Supported |
| Cursor | Supported |
| Codex | Supported |
| OpenCode | Coming Soon |
| Windsurf | Coming Soon |
| Cline | Coming Soon |
| Aider | Coming Soon |
| GitHub Copilot | Coming Soon |

## Install

```bash
npm i -g agsync
```

Or run directly:

```bash
npx agsync
```

## Quick Start

```bash
# Scaffold a new project
agsync init

# Import a skill from GitHub
agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer

# Validate definitions
agsync validate

# Generate client configs
agsync sync
```

After `agsync sync`, your repo will contain:

```
project/
├── agsync.yaml                          # Your config
├── .agsync/skills/*/                    # Source of truth
├── .agsync/tools/*.yaml                 # MCP tool definitions
│
├── AGENTS.md                            # Generated (agsync section injected)
├── CLAUDE.md                            # Injected (claude-code target)
├── .agents/skills/*/SKILL.md            # Generated for Codex + Cursor
├── .claude/skills/*/SKILL.md            # Generated for Claude Code
├── .claude/settings.json                # Generated MCP config (Claude Code)
└── .cursor/mcp.json                     # Generated MCP config (Cursor)
```

## How It Works

agsync reads canonical skill and tool definitions from `.agsync/`, resolves inheritance chains, and generates the native format each client expects:

- **Codex & Cursor** read from `.agents/skills/<name>/SKILL.md` (open [Agent Skills](https://agentskills.io) standard)
- **Claude Code** reads from `.claude/skills/<name>/SKILL.md`
- **MCP configs** are merged into `.claude/settings.json` and `.cursor/mcp.json` (existing entries preserved)
- **AGENTS.md** gets an `<!-- agsync:begin -->` / `<!-- agsync:end -->` section injected (manual content outside markers is preserved)

## Commands

### `agsync init`

Creates `agsync.yaml` and the `.agsync/` directory structure with a sample skill.

### `agsync skill add <org/repo> <skill-name>`

Imports a skill from a GitHub repository. Fetches the skill directory, converts `SKILL.md` to agsync's YAML format, downloads supporting files (scripts, references, assets), and tracks provenance via a `source` field.

```bash
# Import from any repo that has skills
agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer
agsync skill add your-org/your-repo your-skill

# Import skills bundled with agsync
agsync skill add yiftahb/agsync agent-skills
agsync skill add yiftahb/agsync claude-skills
```

### `agsync skill remove <skill-name>`

Removes a skill from `.agsync/skills/`.

```bash
agsync skill remove code-reviewer
```

### `agsync validate`

Validates all config and definitions: schema checks, duplicate names, cross-references between skills and tools. Warns when tool env values reference environment variables that are not currently set.

```
Warnings:
  tool: github: Env var "GITHUB_PERSONAL_ACCESS_TOKEN" is not set (key "GITHUB_PERSONAL_ACCESS_TOKEN")
```

Warnings do not cause a non-zero exit code. Only hard errors do.

### `agsync plan`

Preview what `sync` would do without writing any files. Shows files to create, update, and delete.

```
$ agsync plan
Create:
  + .agents/skills/helper/SKILL.md
  + .claude/skills/helper/SKILL.md
Update:
  ~ AGENTS.md
  ~ .claude/settings.json

4 file(s): 2 create, 2 update, 0 delete
```

### `agsync sync`

The core command. Runs `plan` internally then applies all changes: resolves skill extends chains, expands environment variable references in tool definitions, cleans output directories, then generates all client configs.

### `agsync doctor`

Checks environment health: Node.js version, config presence, hierarchy chain, and installed client CLIs.

```
[PASS] Node.js version: v22.13.1
[PASS] agsync.yaml: Found
[PASS] Config hierarchy: Single config (no parent)
[PASS] claude-code CLI: Installed
[PASS] codex CLI: Installed
[WARN] cursor CLI: Not found in PATH
```

## Skill Format

Each skill is a directory under `.agsync/skills/` with a YAML file matching the directory name:

```
.agsync/skills/code-reviewer/
├── code-reviewer.yaml     # Skill definition
├── scripts/               # Optional: executable code
├── references/            # Optional: documentation
└── assets/                # Optional: templates, resources
```

The YAML defines the skill:

```yaml
name: code-reviewer
description: >
  Reviews code for quality, security, and performance.
  Use when reviewing PRs or performing code audits.
extends:
  - ./base-reviewer
  - github:org/repo/path
instructions: |
  You are an expert code reviewer.

  ## Review Process
  1. Check for security vulnerabilities
  2. Identify performance issues
  3. Verify error handling
tools:
  - grep-tool
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
```

### Skill Extends

Skills can inherit from other skills:

- `./base-skill` - local skill in the same skills directory
- `github:org/repo/path` - fetches from GitHub and caches locally

Base instructions are concatenated, tools are union-merged, and the extending skill's name/description take precedence.

## MCP Tool Definitions

Define MCP servers in `.agsync/tools/*.yaml`:

```yaml
name: my-mcp-server
description: My custom MCP server
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: $API_KEY
```

`agsync sync` generates `.claude/settings.json` and `.cursor/mcp.json` from these definitions. Existing entries in those files are preserved (merge, not overwrite).

### Environment Variable Expansion

Env values support `$VAR` and `${VAR}` syntax. During `agsync sync`, these are expanded from the current shell environment. This keeps secrets out of version control — define the reference in your tool YAML and set the actual value in your shell:

```bash
export API_KEY=sk-xxx
agsync sync
```

If a referenced variable is not set, sync will fail with a clear error. `agsync validate` will warn about unset variables without failing.

Add generated config files (`.claude/settings.json`, `.cursor/mcp.json`) to `.gitignore` when using env expansion to avoid committing resolved secrets.

## Monorepo Support

Place `agsync.yaml` at multiple levels. When `agsync sync` runs, it walks up the directory tree to the git root, collecting and merging all configs:

```
monorepo/
├── agsync.yaml              # Org-wide skills and tools
├── .agsync/skills/
├── apps/
│   └── api/
│       ├── agsync.yaml      # API-specific skills
│       └── .agsync/skills/
└── packages/
    └── shared/
        └── agsync.yaml      # Package-specific skills
```

## Bundled Skills

agsync ships with skills for understanding each client's skill and tool systems:

| Skill | Description |
|-------|-------------|
| `agsync` | Expert in agsync itself |
| `agent-skills` | The open Agent Skills standard (agentskills.io) |
| `claude-skills` | Claude Code Agent Skills |
| `cursor-skills` | Cursor Agent Skills |
| `codex-skills` | Codex Agent Skills |
| `claude-tools` | Claude Code MCP configuration |
| `cursor-tools` | Cursor MCP configuration |
| `codex-tools` | Codex tool dependencies |

Import any of them:

```bash
agsync skill add yiftahb/agsync claude-skills
```

## Configuration

`agsync.yaml` at the project root:

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

## License

MIT
