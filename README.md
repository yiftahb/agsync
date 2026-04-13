<p align="center">
  <img src="assets/logo.png" alt="agsync" width="400">
</p>

<p align="center">
  Git-native CLI to sync skills, commands, and MCP servers across AI coding agents.
</p>

<p align="center">
  <a href="https://github.com/yiftahb/agsync/actions/workflows/ci.yml"><img src="https://github.com/yiftahb/agsync/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/agsync-cli"><img src="https://img.shields.io/npm/v/agsync-cli" alt="npm version"></a>
  <a href="https://github.com/yiftahb/agsync/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/agsync-cli" alt="license"></a>
</p>

## Supported Agents

| Agent | Instructions | Skills | Commands | MCP |
|-------|-------------|--------|----------|-----|
| Claude Code | `CLAUDE.md` | `.claude/skills/` | `.claude/commands/` | `.claude/settings.json` |
| Cursor | `AGENTS.md` | `.cursor/skills/` | `.cursor/commands/` | `.cursor/mcp.json` |
| Codex | `.codex/instructions.md` | `.codex/skills/` | `.codex/commands/` | `.codex/config.toml` |
| Windsurf | `AGENTS.md` | `.windsurf/skills/` | `.windsurf/commands/` | `.windsurf/mcp_config.json` |
| Copilot | `.github/copilot-instructions.md` | -- | `.github/agents/` | `.mcp.json` |
| Gemini | `GEMINI.md` | `.gemini/skills/` | `.gemini/commands/` | `.gemini/settings.json` |
| OpenCode | `AGENTS.md` | `.opencode/skills/` | `.opencode/command/` | `opencode.json` |
| Antigravity | `.agent/rules/instructions.md` | `.agent/skills/` | `.agent/commands/` | -- |

## Install

```bash
npm i -g agsync-cli
```

Or run directly:

```bash
npx agsync-cli
```

## Features

🤖 **Multi-Agent Sync** — Define skills, commands, and instructions once in `.agsync/`, generate native output for every agent your team uses. Symlinks keep everything in sync.

🧩 **Skill Extension** — Import skills from GitHub or ClawHub, extend them with local overrides, and resolve inheritance chains automatically. Supporting files (rules, scripts, references) are bundled alongside.

🔒 **Version Locking** — Pin external skills to exact versions. A lock file (`agsync-lock.yaml`) tracks resolved commits and content hashes for reproducible builds. Use `--frozen` in CI to enforce it.

🔌 **MCP Sync** — Define MCP servers in YAML, expand environment variables at sync time, and generate the correct config format (JSON or TOML) per agent with smart merging.

📁 **Monorepo Scoping** — One `agsync.yaml` at the repo root, with `.agsync/` directories in any subfolder. Skills and commands are automatically prefixed (e.g. `frontend:my-skill`), built to the root, and each subfolder gets its own `AGENTS.md` with scoped instructions.

🔒 **Gitignore Management** — Automatically manage `.gitignore` entries for generated output. Choose between `on` (all output), `mcpOnly` (default, MCP configs only), or `off`.

## Commands

| Command | Description |
|---------|-------------|
| `agsync init` | Scaffold a new project with `agsync.yaml` and `.agsync/` |
| `agsync skill add <name>` | Create a local empty skill |
| `agsync skill add github:<org/repo/path@ver>` | Import a skill from GitHub |
| `agsync skill add clawhub:<slug@ver>` | Import a skill from ClawHub |
| `agsync skill remove <name>` | Remove a skill |
| `agsync command add <name>` | Create a new command (.md) |
| `agsync command remove <name>` | Remove a command |
| `agsync tool add <name>` | Create a new tool definition (.yaml) |
| `agsync tool remove <name>` | Remove a tool |
| `agsync validate` | Validate config, skills, commands, and tool references |
| `agsync plan [--frozen]` | Preview changes without writing files |
| `agsync sync [--frozen]` | Generate output for all enabled agents |
| `agsync doctor` | Check environment health and enabled agents |
| `agsync version` | Show current version and check for updates |
| `agsync update` | Update to the latest version |
| `agsync help` | Show extended help |

## Monorepo Support

One `agsync.yaml` at the repo root, multiple `.agsync/` directories in subfolders:

```
project/
├── agsync.yaml              ← single config
├── .agsync/                 ← root skills, commands, mcp
├── frontend/
│   └── .agsync/             ← frontend-specific definitions
│       ├── instructions.md  → generates frontend/AGENTS.md
│       └── skills/ui-kit/
└── backend/
    └── .agsync/
        └── skills/api/
```

- Scoped skills are prefixed automatically (`frontend:ui-kit`) and output to `.agents/skills/frontend--ui-kit/` at the root
- Each subfolder with `.agsync/instructions.md` gets its own `AGENTS.md` generated in-place
- The root `AGENTS.md` cross-references scoped instructions: *"When working in folder: `frontend` — you MUST load `frontend/AGENTS.md`"*
- Agent symlinks (`CLAUDE.md`, `.claude/skills/`) are only created at the root
- `agsync skill add`, `command add`, `tool add` resolve the nearest `.agsync/` upwards, so running from `frontend/` adds to `frontend/.agsync/`

## License

MIT
