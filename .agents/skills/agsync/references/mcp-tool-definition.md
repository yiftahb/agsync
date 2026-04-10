# MCP Tool Definitions

Define MCP servers in `.agsync/tools/*.yaml`. During `agsync sync`, these are generated into `.claude/settings.json` and `.cursor/mcp.json`.

## Example: GitHub MCP Server

```yaml
# .agsync/tools/github.yaml
name: github
description: GitHub MCP server for interacting with GitHub APIs — repos, issues, PRs, files, and more
type: mcp
command: npx
args: ["-y", "@modelcontextprotocol/server-github"]
env:
  GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN
```

## Tool Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Tool identifier |
| description | Yes | What this tool does |
| type | Yes | `mcp`, `cli`, or `builtin` |
| command | For mcp/cli | Command to run |
| args | No | Command arguments |
| env | No | Environment variables (supports `$VAR` expansion) |

## Environment Variable Expansion

Env values support `$VAR` and `${VAR}` syntax. During `agsync sync`, these are expanded from the current shell environment:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx
agsync sync
```

- If a referenced variable is not set, `sync` fails with a clear error
- `validate` warns about unset variables without failing
- Add `.claude/settings.json` and `.cursor/mcp.json` to `.gitignore` to avoid committing resolved secrets

## Generated Output

Existing entries in `.claude/settings.json` and `.cursor/mcp.json` are preserved (merge, not overwrite). Only agsync-managed tool entries are updated.
