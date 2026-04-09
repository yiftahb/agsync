---
name: claude-tools
description: Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.

---

# Claude Code Tool Configuration

You are an expert in configuring MCP tools and integrations for Claude Code.

## MCP Server Configuration

Claude Code reads MCP server definitions from `.claude/settings.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value",
        "PORT": "3000"
      }
    }
  }
}
```

### Fields

| Field | Description |
|-------|-------------|
| command | The executable to run (e.g., `node`, `python`, `npx`) |
| args | Array of command-line arguments |
| env | Environment variables passed to the server process |

## How MCP Works with Claude Code

MCP (Model Context Protocol) is a standard for connecting AI models to external tools and data sources. Claude Code acts as an MCP client that connects to MCP servers defined in settings.json.

When Claude Code starts, it launches each configured MCP server as a subprocess and communicates with it via the MCP protocol. The server exposes tools, resources, and prompts that Claude Code can use.

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/dir"]
    }
  }
}
```

### Python-based servers
```json
{
  "mcpServers": {
    "database": {
      "command": "python",
      "args": ["-m", "mcp_server_sqlite", "--db-path", "./data.db"]
    }
  }
}
```

### Docker-based servers
```json
{
  "mcpServers": {
    "postgres": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "mcp/postgres", "postgresql://localhost/mydb"]
    }
  }
}
```

## Settings File Locations

- **Project-level**: `.claude/settings.json` in the repository root
- **User-level**: `~/.claude/settings.json` for personal defaults

Project-level settings take precedence.

## With agsync

When using agsync, define tools in `.agsync/tools/*.yaml`:

```yaml
name: my-server
description: My MCP server
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Running `agsync sync` generates `.claude/settings.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and in PATH
- Check that environment variables are set correctly
- Use `claude mcp list` to see configured servers
- Use `claude mcp serve <name>` to test a server manually
- Check Claude Code logs for connection errors