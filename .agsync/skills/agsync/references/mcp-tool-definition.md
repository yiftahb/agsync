# MCP Tool Definitions

Define MCP servers in `.agsync/mcp/*.yaml`. During `agsync sync`, these are generated into each agent's MCP config file.

## Example: Stdio Server (default)

```yaml
# .agsync/mcp/github.yaml
name: github
description: GitHub MCP server for interacting with GitHub APIs
command: npx
args: ["-y", "@modelcontextprotocol/server-github"]
env:
  GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN
```

## Example: HTTP Server (remote)

```yaml
# .agsync/mcp/remote-api.yaml
name: remote-api
description: Remote MCP server
type: http
url: https://api.example.com/mcp
headers:
  Authorization: Bearer $API_TOKEN
```

## Tool Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Tool identifier |
| description | Yes | What this tool does |
| namespaces | No | Array of namespace tags for filtering with `agsync sync --namespace <name>` |
| type | No | `stdio` (default) or `http` |
| command | For stdio | Command to run |
| args | No | Command arguments (stdio only) |
| env | No | Environment variables (supports `$VAR` expansion) |
| url | For http | Remote server URL |
| headers | No | HTTP headers (http only, not supported by all agents) |

## Namespaces

Tag servers with one or more namespaces and filter at sync time. Useful when CI runners and local coding agents need different sets of servers.

```yaml
# .agsync/mcp/github-actions.yaml
name: github-actions
description: GitHub Actions MCP server
namespaces: [ci-cd]
command: npx
args: ["-y", "@modelcontextprotocol/server-github-actions"]
```

```bash
agsync sync --namespace ci-cd          # only ci-cd-tagged + untagged servers
agsync sync --namespace coding-agents  # only coding-agents-tagged + untagged servers
agsync sync                            # all servers (no filter)
```

- `namespaces` is optional. Servers without it are **always included** (treated as global).
- A skill that references a server excluded by the active namespace produces a warning, not an error.
- Scaffold a tagged server: `agsync mcp add <name> --namespace ci-cd` (repeat the flag for multiple).

## Environment Variable Expansion

Env values support `$VAR` and `${VAR}` syntax. During `agsync sync`, these are expanded from the current shell environment:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx
agsync sync
```

- If a referenced variable is not set, `sync` fails with a clear error
- `validate` warns about unset variables without failing
- Add MCP config files to `.gitignore` to avoid committing resolved secrets

## Generated MCP Configs

| Agent | File | Format |
|-------|------|--------|
| Claude | `.mcp.json` | JSON (`mcpServers`) |
| Cursor | `.cursor/mcp.json` | JSON (`mcpServers`) |
| Codex | `.codex/config.toml` | TOML (`[mcp_servers]`) |
| Windsurf | `.windsurf/mcp_config.json` | JSON (`mcpServers`) |
| Copilot | `.mcp.json` | JSON (`mcpServers`) |
| Gemini | `.gemini/settings.json` | JSON (`mcpServers`) |
| OpenCode | `opencode.json` | JSON (`mcp`) |

Existing entries are preserved (merge strategy). Only agsync-managed tool entries are updated.
