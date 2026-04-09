<!-- agsync:begin -->
## Available Skills

### agent-skills

Expert in the Agent Skills open standard (agentskills.io). Use when creating, editing, or validating SKILL.md files, structuring skill directories, or understanding how skills are discovered and loaded by agents.


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

### agsync

Expert in agsync, the Git-native CLI that syncs skills and MCP tools across Claude Code, Codex, and Cursor. Use when working with agsync.yaml, adding or removing skills, syncing configs, or troubleshooting agsync workflows.


# agsync

You are an expert in agsync, a Git-native CLI tool that compiles and syncs skill definitions and MCP tool bindings across multiple AI coding clients.

## What agsync Does

agsync is the single source of truth for AI agent configuration in a repository. It takes canonical definitions stored under `.agsync/` and generates client-specific output for Claude Code, Codex, and Cursor.

## Project Structure

```
project/
├── agsync.yaml                          # Root config (only file outside .agsync/)
├── .agsync/
│   ├── skills/                          # Skill definitions
│   │   ├── my-skill/
│   │   │   ├── my-skill.yaml            # Skill definition (name must match dir)
│   │   │   ├── scripts/                 # Optional executable code
│   │   │   ├── references/              # Optional documentation
│   │   │   └── assets/                  # Optional templates, resources
│   │   └── imported-skill/
│   │       ├── imported-skill.yaml      # Converted from SKILL.md on import
│   │       └── references/
│   └── tools/*.yaml                     # MCP and CLI tool definitions
├── AGENTS.md                            # Generated (agsync section injected)
├── CLAUDE.md                            # Symlink to AGENTS.md
├── .agents/skills/*/SKILL.md            # Generated for Codex + Cursor
├── .claude/skills/*.md                  # Generated for Claude Code
├── .claude/settings.json                # Generated MCP config for Claude Code
└── .cursor/mcp.json                     # Generated MCP config for Cursor
```

## Skill Definition Format

Every skill is a directory under `.agsync/skills/` containing a YAML file that matches the directory name:

```
.agsync/skills/code-reviewer/code-reviewer.yaml
```

The YAML file defines the skill:

```yaml
name: code-reviewer
description: >
  Reviews code for quality, security, and performance.
extends:
  - ./base-skill
  - github:org/repo/path
instructions: |
  You are an expert code reviewer.
  Focus on security vulnerabilities first.
tools:
  - grep-tool
  - lint-tool
source:
  registry: github
  org: Shubhamsaboo
  repo: awesome-llm-apps
  path: awesome_agent_skills/code-reviewer
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier, must match the directory name |
| description | Yes | What the skill does and when to use it |
| instructions | Yes | Detailed instructions for the agent (markdown) |
| extends | No | List of skills to inherit from (local or GitHub) |
| tools | No | List of tool names this skill can use |
| source | No | Provenance tracking for imported skills |

### Optional Directories (per Agent Skills standard)

| Directory | Purpose |
|-----------|---------|
| scripts/ | Executable code agents can run |
| references/ | Documentation loaded on demand |
| assets/ | Templates, images, data files |

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

## CLI Commands

### agsync init
Scaffolds a new project: creates `agsync.yaml` and `.agsync/` directory structure with a sample skill.

### agsync skill add <org/repo> <skill-name>
Imports a skill from a GitHub repository. Fetches the skill directory, converts any SKILL.md to the agsync YAML format, downloads supporting files (scripts, references, assets), and stores everything in `.agsync/skills/<name>/`. The `source` field in the YAML tracks where it came from.

### agsync skill remove <skill-name>
Removes a skill directory from `.agsync/skills/`.

### agsync validate
Validates all config and definitions: parses agsync.yaml via Zod schemas, loads all referenced files, checks for duplicate names, verifies cross-references between skills and tools.

### agsync sync
The core command. Loads config, resolves skill extends chains, builds a resolved manifest, then generates output for each target:
- Cleans `.agents/skills/` and `.claude/skills/` before writing (ensures no stale output)
- Injects an `<!-- agsync:begin -->` / `<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Merges MCP config into `.claude/settings.json` and `.cursor/mcp.json` (preserves existing entries)

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)

```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "value"
```

Types: `mcp`, `cli`, `builtin`.

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

MCP config files (`.claude/settings.json`, `.cursor/mcp.json`) are merged, not overwritten, so manually added entries are preserved.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.


# Claude Code Agent Skills

You are an expert in Claude's Agent Skills system.

## What Are Skills?

Skills are modular, filesystem-based packages that extend Claude with domain-specific expertise. Each skill bundles instructions, metadata, and optional resources (scripts, templates, references) that Claude uses automatically when relevant. Skills load on-demand and eliminate the need to repeatedly provide the same guidance across conversations.

## Skill Structure

Every skill requires a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: your-skill-name
description: Brief description of what this Skill does and when to use it
---

# Your Skill Name

## Instructions
Clear, step-by-step guidance for Claude to follow.

## Examples
Concrete examples of using this skill.
```

### Required Fields

| Field | Constraints |
|-------|-------------|
| name | Max 64 chars. Lowercase letters, numbers, hyphens only. No reserved words ("anthropic", "claude"). |
| description | Max 1024 chars. Non-empty. Describe what the skill does AND when to use it. |

## Directory Structure

```
my-skill/
├── SKILL.md           # Required: metadata + instructions
├── scripts/           # Optional: executable code Claude can run
├── references/        # Optional: documentation loaded on demand
└── assets/            # Optional: templates, images, data files
```

## Progressive Disclosure (Three Levels)

Skills load content in stages for context efficiency:

### Level 1: Metadata (always loaded, ~100 tokens)
The `name` and `description` from YAML frontmatter are included in the system prompt at startup. This lets Claude know the skill exists without consuming significant context.

### Level 2: Instructions (loaded when triggered, < 5000 tokens recommended)
When a task matches a skill's description, Claude reads the SKILL.md body from the filesystem via bash. Only then do instructions enter the context window.

### Level 3: Resources (loaded as needed, effectively unlimited)
Scripts, references, and assets are read only when referenced. Scripts execute via bash and only their output enters context (the code itself never loads).

| Level | When Loaded | Token Cost | Content |
|-------|-------------|------------|---------|
| Metadata | Always | ~100 tokens per skill | name and description |
| Instructions | When triggered | < 5000 tokens | SKILL.md body |
| Resources | As needed | Unlimited | scripts/, references/, assets/ |

## Skill Discovery Locations

| Location | Scope |
|----------|-------|
| `.claude/skills/` | Project-level |
| `~/.claude/skills/` | User-level (personal) |
| `.agents/skills/` | Project-level (open standard, also discovered) |

## How Claude Uses Skills

1. At startup, Claude loads all skill metadata (name + description) into the system prompt
2. When a request matches a skill's description, Claude reads SKILL.md from the filesystem
3. If instructions reference other files, Claude reads those files on demand
4. Scripts execute via bash; only their output enters context

## Pre-built Agent Skills

Anthropic provides pre-built skills for:
- PowerPoint (pptx)
- Excel (xlsx)
- Word (docx)
- PDF (pdf)

These work automatically on claude.ai and via the Claude API.

## Custom Skills

Custom skills are filesystem-based directories with SKILL.md files. Claude discovers and uses them automatically.

### Where Custom Skills Work

| Surface | Availability | Sharing |
|---------|-------------|---------|
| Claude Code | Filesystem-based, project or user level | Via repo or Claude Code Plugins |
| Claude API | Upload via /v1/skills endpoints | Workspace-wide |
| claude.ai | Upload as zip in Settings > Features | Individual user only |

Custom skills do NOT sync across surfaces. You must manage them separately for each.

## Best Practices

- Keep SKILL.md under 500 lines; move detailed content to references/
- Write descriptions that clearly state WHAT the skill does and WHEN to use it
- Include specific keywords in descriptions for better implicit matching
- Use scripts/ for deterministic operations that shouldn't consume context
- Reference files with relative paths from the skill root
- Keep file references one level deep; avoid nested reference chains

## Security

Only use skills from trusted sources. Skills direct Claude to invoke tools and execute code. Audit all files in untrusted skills before use. Be cautious of skills that fetch data from external URLs.

## Reference

- Anthropic docs: https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills
- Open standard: https://agentskills.io/specification

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

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

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

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

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->` section into AGENTS.md
- Creates CLAUDE.md as a symlink to AGENTS.md
- Generates `.agents/skills/<name>/SKILL.md` for Codex and Cursor (open standard)
- Generates `.claude/skills/<name>.md` for Claude Code
- Generates `.claude/settings.json` and `.cursor/mcp.json` for MCP tools

### agsync doctor
Checks environment health: Node.js version, config presence, hierarchy chain, and whether target client CLIs are installed.

## Skill Extends

Skills can inherit from other skills using the `extends` field:
- `./base-skill` resolves to a local skill in the skills directory
- `github:org/repo/path` fetches from a GitHub repository and caches locally

Merge strategy: base instructions are concatenated (base first), tools and policies are union-merged, the extending skill's name and description take precedence.

## Hierarchy Support

In monorepos, place `agsync.yaml` at multiple levels. When sync runs, it walks up the directory tree to the git root, collecting all configs. Parent configs are merged first, then child configs override.

## Tool Definitions (.agsync/tools/*.yaml)
```yaml
name: my-mcp-server
description: What this tool does
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "ref:secret"
```

Types: `mcp`, `cli`, `builtin`.

## Policy Definitions (.agsync/policies/*.yaml)
```yaml
name: no-secrets-in-output
description: Never expose secrets
rules:
  - type: deny
    action: output
    pattern: "*.env|*secret*"
```

## Generated Output

agsync does not own AGENTS.md or CLAUDE.md entirely. It injects its section between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers, preserving any manual content outside those markers.

The generated `.agents/skills/` directory uses the open Agent Skills standard (SKILL.md with frontmatter), which both Codex and Cursor read natively.

### claude-skills

Expert in Claude Code skill files and configuration. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/.


# Claude Code Skills

You are an expert in Claude Code's skill system and how to configure it effectively.

## Overview

Claude Code reads skill files from `.claude/skills/` in the project directory. Each skill is a markdown file that provides context and instructions to Claude Code when working in a repository.

## Skill File Format

Skills are plain markdown files placed in `.claude/skills/`:

```
.claude/
└── skills/
    ├── code-reviewer.md
    ├── project-conventions.md
    └── testing-guide.md
```

Each file contains a title and instructions:

```markdown
# Code Reviewer

You are an expert code reviewer for this project.

## When to Apply
- Reviewing pull requests
- Checking code quality

## Instructions
- Focus on security vulnerabilities first
- Check for proper error handling
- Verify test coverage
```

## How Claude Code Discovers Skills

- Claude Code scans `.claude/skills/` in the current project directory
- All `.md` files in that directory are loaded as skills
- Skills provide additional context to Claude Code's system prompt
- Skills are always available when Claude Code operates in that project

## CLAUDE.md

`CLAUDE.md` at the project root is Claude Code's primary instruction file. It is loaded automatically and contains project-level guidance. When using agsync, `CLAUDE.md` is a symlink to `AGENTS.md`, and agsync injects its skill summary between `<!-- agsync:begin -->` and `<!-- agsync:end -->` markers.

## MCP Configuration

Claude Code reads MCP server configuration from `.claude/settings.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "value"
      }
    }
  }
}
```

## Best Practices

- Keep each skill focused on one domain or workflow
- Write instructions in imperative form
- Include "When to Apply" sections so Claude knows when the skill is relevant
- Reference project-specific conventions, file paths, and patterns
- Do not duplicate content that belongs in CLAUDE.md

### claude-tools

Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.


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
  API_KEY: "ref:secret"
```

Running `agsync sync` generates `.claude/settings.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and in PATH
- Check that environment variables are set correctly
- Use `claude mcp list` to see configured servers
- Use `claude mcp serve <name>` to test a server manually
- Check Claude Code logs for connection errors

### codex-skills

Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.


# Codex Agent Skills

You are an expert in OpenAI Codex's skill system, which follows the open Agent Skills standard.

## Overview

Codex skills package instructions, resources, and optional scripts so Codex can follow a workflow reliably. Skills are the authoring format for reusable workflows. They can be distributed as plugins for installation by other developers.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md              # Required: instructions + metadata
    ├── scripts/              # Optional: executable code
    ├── references/           # Optional: documentation
    ├── assets/               # Optional: templates, resources
    └── agents/
        └── openai.yaml       # Optional: UI metadata and dependencies
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Explain exactly when this skill should and should not trigger.
---

Skill instructions for Codex to follow.
```

### Required Frontmatter

- `name`: Skill identifier
- `description`: Determines implicit invocation triggers. Write with clear scope and boundaries.

## Skill Discovery Locations

Codex scans these directories in order of precedence:

| Scope | Path | Use Case |
|-------|------|----------|
| REPO (current) | `$CWD/.agents/skills` | Folder-specific workflows |
| REPO (parent) | `$CWD/../.agents/skills` | Nested repository skills |
| REPO (root) | `$REPO_ROOT/.agents/skills` | Organization-wide skills |
| USER | `$HOME/.agents/skills` | Personal skill collection |
| ADMIN | `/etc/codex/skills` | System-level defaults |
| SYSTEM | Built-in | OpenAI-bundled skills |

## How Skills Are Invoked

1. **Explicit**: Type `$skill-name` or run `/skills` to select
2. **Implicit**: Codex activates skills when the task matches the `description`

## agents/openai.yaml

Optional metadata file for UI customization, invocation policy, and tool dependencies:

```yaml
interface:
  display_name: "User-facing name"
  short_description: "User-facing description"
  icon_small: "./assets/small-logo.svg"
  icon_large: "./assets/large-logo.png"
  brand_color: "#3B82F6"
  default_prompt: "Optional surrounding prompt"

policy:
  allow_implicit_invocation: true

dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "Tool description"
      transport: "streamable_http"
      url: "https://example.com"
```

Set `allow_implicit_invocation: false` to require explicit `$skill` invocation.

## Progressive Disclosure

Codex uses progressive loading:
1. Metadata (name, description, path, openai.yaml) loads on startup
2. Full SKILL.md instructions load only when the skill is selected

This keeps context usage efficient.

## Skill Configuration

Enable or disable skills in `~/.codex/config.toml`:

```toml
[[skills.config]]
path = "/path/to/skill/SKILL.md"
enabled = false
```

## Distribution via Plugins

Skills can be packaged as plugins for distribution beyond a single repo. Plugins can bundle multiple skills, app integrations, MCP server configuration, and presentation assets.

## Best Practices

- Keep each skill focused on one job
- Write `description` fields that clearly define when the skill should and should not trigger
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use the built-in `$skill-creator` to scaffold new skills
- Symlinked skill folders are supported

### codex-tools

Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.


# Codex Tool Configuration

You are an expert in configuring MCP tools and integrations for OpenAI Codex.

## Tool Dependencies in Skills

Codex skills declare tool dependencies in `agents/openai.yaml`:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "toolIdentifier"
      description: "What this tool does"
      transport: "streamable_http"
      url: "https://example.com/mcp"
```

### Tool Dependency Fields

| Field | Description |
|-------|-------------|
| type | Tool type, typically `"mcp"` |
| value | Tool identifier string |
| description | Human-readable description of what the tool provides |
| transport | Transport protocol: `"streamable_http"` or `"stdio"` |
| url | URL for HTTP-based MCP servers |

## MCP in Codex

Codex supports MCP (Model Context Protocol) for connecting to external tools and data sources. MCP servers expose tools, resources, and prompts that Codex can use during task execution.

### Streamable HTTP Transport

For remote MCP servers accessible over HTTP:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "openaiDocs"
      description: "OpenAI documentation server"
      transport: "streamable_http"
      url: "https://developers.openai.com/mcp"
```

### stdio Transport

For local MCP servers that communicate via stdin/stdout:

```yaml
dependencies:
  tools:
    - type: "mcp"
      value: "filesystem"
      description: "Local filesystem access"
      transport: "stdio"
```

## Skill-Level Tool Integration

Tools are bound to specific skills. When a skill with tool dependencies is activated, Codex ensures the required MCP servers are available.

### Example: Skill with MCP Tool

```
my-skill/
├── SKILL.md
└── agents/
    └── openai.yaml
```

**SKILL.md:**
```markdown
---
name: my-skill
description: Uses external data to answer questions.
---

# My Skill

When answering questions, use the data-api tool to fetch current information.
```

**agents/openai.yaml:**
```yaml
interface:
  display_name: "Data Lookup"
  short_description: "Fetches data from the API"

dependencies:
  tools:
    - type: "mcp"
      value: "data-api"
      description: "Real-time data API"
      transport: "streamable_http"
      url: "https://api.example.com/mcp"
```

## Plugin-Level Tool Distribution

When distributing skills as plugins, MCP server configuration can be bundled alongside skills, app integrations, and presentation assets in a single package.

## With agsync

When using agsync, define tools in `.agsync/tools/*.yaml`:

```yaml
name: my-server
description: My MCP server
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "ref:secret"
```

Running `agsync sync` generates `.agents/skills/<name>/SKILL.md` files. For Codex-specific openai.yaml configuration, create it manually in the skill directory or extend the agsync workflow.

## Best Practices

- Declare all tool dependencies explicitly in openai.yaml
- Write clear tool descriptions so Codex understands when to use each tool
- Prefer streamable_http for remote services
- Keep tool configurations minimal and focused
- Test MCP servers independently before declaring them as dependencies

### cursor-skills

Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.


# Cursor Agent Skills

You are an expert in the Cursor Agent Skills system, which follows the open Agent Skills standard.

## Overview

Agent Skills is an open standard for extending AI agents with specialized capabilities. A skill is a portable, version-controlled package that teaches agents how to perform domain-specific tasks.

## Skill Directory Structure

```
.agents/skills/
└── my-skill/
    ├── SKILL.md           # Required: instructions + metadata
    ├── scripts/           # Optional: executable code
    ├── references/        # Optional: documentation loaded on demand
    └── assets/            # Optional: templates, images, data files
```

## SKILL.md Format

```markdown
---
name: my-skill
description: Short description of what this skill does and when to use it.
---

# My Skill

Detailed instructions for the agent.

## When to Use
- Use this skill when...
- This skill is helpful for...

## Instructions
- Step-by-step guidance for the agent
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| name | Yes | Skill identifier. Lowercase letters, numbers, and hyphens. Must match the parent folder name. |
| description | Yes | What the skill does and when to use it. Used by the agent to determine relevance. |
| license | No | License name or reference. |
| compatibility | No | Environment requirements. |
| metadata | No | Arbitrary key-value mapping. |
| disable-model-invocation | No | When true, only invoked explicitly via /skill-name. |

## Skill Discovery Directories

Cursor automatically loads skills from:

| Location | Scope |
|----------|-------|
| `.agents/skills/` | Project-level |
| `.cursor/skills/` | Project-level |
| `~/.cursor/skills/` | User-level (global) |
| `.claude/skills/` | Compatibility |
| `.codex/skills/` | Compatibility |

## How Skills Are Invoked

1. **Implicit**: Cursor automatically activates skills when the task matches the skill `description`
2. **Explicit**: Type `/` in Agent chat and search for the skill name

## Including Scripts

Skills can include a `scripts/` directory with executable code. Reference scripts in SKILL.md using relative paths:

```markdown
Run the deployment script: `scripts/deploy.sh <environment>`
```

Scripts can be written in any language (Bash, Python, JavaScript, etc.).

## Progressive Disclosure

Skills use progressive loading for context efficiency:
1. Cursor starts with each skill's metadata (name, description, file path)
2. Full SKILL.md instructions load only when the skill is selected or deemed relevant

Keep the main SKILL.md focused and move detailed reference material to `references/`.

## MCP Configuration

Cursor reads MCP server configuration from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["server.js"],
      "env": {}
    }
  }
}
```

## Best Practices

- Keep each skill focused on one job
- Write clear `description` fields that define scope and boundaries precisely
- Prefer instructions over scripts unless deterministic behavior is needed
- Write imperative steps with explicit inputs and outputs
- Use `disable-model-invocation: true` for skills that should only run when explicitly called
- Use `references/` for long documentation to keep SKILL.md concise

### cursor-tools

Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


# Cursor Tool Configuration

You are an expert in configuring MCP tools and integrations for Cursor.

## MCP Server Configuration

Cursor reads MCP server definitions from `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": {
        "API_KEY": "value"
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

## How MCP Works with Cursor

MCP (Model Context Protocol) connects Cursor's AI agent to external tools and data sources. Cursor acts as an MCP client, launching configured servers as subprocesses and communicating via the MCP protocol.

MCP servers can expose:
- **Tools**: Functions the agent can call (e.g., database queries, API calls)
- **Resources**: Data the agent can read (e.g., file contents, documentation)
- **Prompts**: Pre-defined prompt templates

## MCP Configuration Locations

| Location | Scope |
|----------|-------|
| `.cursor/mcp.json` | Project-level (checked into repo) |
| `~/.cursor/mcp.json` | User-level (personal defaults) |

Project-level configuration takes precedence.

## Configuring via Cursor Settings

You can also configure MCP servers through:
1. Open Cursor Settings (Cmd+Shift+J on Mac, Ctrl+Shift+J on Windows/Linux)
2. Navigate to the MCP section
3. Add or edit server configurations

## Common MCP Server Patterns

### npx-based servers
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"]
    }
  }
}
```

### Streamable HTTP servers
For remote MCP servers, Cursor supports HTTP transport:
```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://api.example.com/mcp",
      "transport": "streamable_http"
    }
  }
}
```

### SSE-based servers
```json
{
  "mcpServers": {
    "sse-server": {
      "url": "https://api.example.com/sse",
      "transport": "sse"
    }
  }
}
```

## With agsync

When using agsync, define tools in `.agsync/tools/*.yaml`:

```yaml
name: my-server
description: My MCP server
type: mcp
command: node
args: ["server.js"]
env:
  API_KEY: "ref:secret"
```

Running `agsync sync` generates `.cursor/mcp.json` from these definitions.

## Troubleshooting

- Verify the MCP server binary is installed and accessible
- Check Cursor's Output panel (MCP section) for connection logs
- Restart Cursor after changing mcp.json
- Ensure environment variables are set correctly
- Test the server standalone before configuring it in Cursor

<!-- agsync:end -->
