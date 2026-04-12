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

🧩 **Skill Extension** — Import skills from GitHub, extend them with local overrides, and resolve inheritance chains automatically. Supporting files (rules, scripts, references) are bundled alongside.

🔌 **MCP Sync** — Define MCP servers in YAML, expand environment variables at sync time, and generate the correct config format (JSON or TOML) per agent with smart merging.

🔒 **Gitignore Management** — Automatically manage `.gitignore` entries for generated output. Choose between `on` (all output), `mcpOnly` (default, MCP configs only), or `off`.

## Commands

| Command | Description |
|---------|-------------|
| `agsync init` | Scaffold a new project with `agsync.yaml` and `.agsync/` |
| `agsync skill add <org/repo> <name>` | Import a skill from GitHub |
| `agsync skill remove <name>` | Remove a skill |
| `agsync validate` | Validate config, skills, commands, and tool references |
| `agsync plan` | Preview changes without writing files |
| `agsync sync` | Generate output for all enabled agents |
| `agsync doctor` | Check environment health and enabled agents |
| `agsync version` | Show current version and check for updates |
| `agsync update` | Update to the latest version |
| `agsync help` | Show extended help |

## License

MIT
