export function getExtendedHelp(): string {
  return `
agsync - Git-native CLI to sync skills, commands, and MCP tools across AI coding agents

USAGE
  agsync <command> [options]

GETTING STARTED
  agsync init                             Scaffold a new project with agsync.yaml
  agsync validate                         Validate config and all definitions
  agsync plan                             Preview changes without writing files
  agsync sync                             Generate output for all enabled agents

MANAGING SKILLS
  agsync skill add <name>                       Create a local empty skill
  agsync skill add github:<org/repo/path@ver>   Import a skill from GitHub
  agsync skill add clawhub:<slug@ver>           Import a skill from ClawHub
  agsync skill remove <name>                    Remove a skill from .agsync/skills/

MANAGING COMMANDS
  agsync command add <name>                     Create a new empty command (.md)
  agsync command remove <name>                  Remove a command from .agsync/commands/

MANAGING MCP TOOLS
  agsync mcp add <name>                         Create a new empty tool definition (.yaml)
  agsync mcp remove <name>                      Remove a tool from .agsync/mcp/

MAINTENANCE
  agsync doctor                           Check environment health and enabled agents
  agsync version                          Show current version and check for updates
  agsync update                           Update agsync to the latest version
  agsync help                             Show this help message

COMMON WORKFLOWS

  Set up a new project:
    agsync init
    # Edit .agsync/skills/, .agsync/commands/, .agsync/mcp/
    agsync sync

  Import a skill from GitHub:
    agsync skill add github:Shubhamsaboo/awesome-llm-apps/code-reviewer@v1.0.0
    # Creates a SKILL.md stub with a source reference
    agsync sync

  Add a command (slash command):
    agsync command add deploy
    # Edit .agsync/commands/deploy.md with the command instructions
    agsync sync

  Add an MCP tool:
    agsync mcp add github
    # Edit .agsync/mcp/github.yaml with server config
    agsync sync

SKILL FORMAT
  Each skill is a directory under .agsync/skills/ with a SKILL.md file:

    .agsync/skills/my-skill/
    ├── SKILL.md            Required: frontmatter + instructions
    ├── scripts/            Optional: executable code
    ├── references/         Optional: documentation
    └── assets/             Optional: templates, data files

  SKILL.md format:
    ---
    name: my-skill
    description: What this skill does and when to use it
    ---

    Detailed instructions for the agent.

  Imported skill from GitHub:
    ---
    name: my-skill
    description: What this skill does
    source:
      registry: github
      org: org-name
      repo: repo-name
      path: path/to/skill
      version: "v1.2.0"
    ---

  Imported skill from ClawHub:
    ---
    name: my-skill
    description: What this skill does
    source:
      registry: clawhub
      slug: author/skill-name
      version: "3.0.0"
    ---

VERSION LOCKING
  External skills are pinned to exact versions via the source.version field.
  A lock file (agsync-lock.yaml) records the resolved commit/version and a
  content hash for each external dependency.

  Lock file sections:
    sources:     Skills fetched via source: in SKILL.md
    extends:     Skills fetched via extends: refs

  The --frozen flag (sync, plan) enforces the lock file:
    agsync sync --frozen        Fail if lock is missing or stale
    agsync plan --frozen        Same check without writing files

  On GitHub, version can be a tag (v1.2.0), commit SHA, or branch name.
  On ClawHub, version is always semver.

  The lock file is auto-generated on first sync and updated on each sync.
  Extends refs must include @version: github:org/repo/path@v1.0.0

COMMAND FORMAT
  Commands are .md files under .agsync/commands/:

    .agsync/commands/deploy.md     → /deploy slash command
    .agsync/commands/review.md     → /review slash command

  Each file contains the command instructions in markdown.

TOOL FORMAT
  Define MCP servers in .agsync/mcp/*.yaml:

  Stdio (default, type can be omitted):
    name: github
    description: GitHub MCP server
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN

  HTTP (remote):
    name: remote-api
    description: Remote MCP server
    type: http
    url: https://api.example.com/mcp
    headers:
      Authorization: Bearer $API_TOKEN

CONFIG FORMAT
  agsync.yaml defines content sources and agent features:

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
    mcp:
      - path: .agsync/mcp/*.yaml
    agents:
      claude:
        instructions: { enabled: true }
        skills: { enabled: true }
        mcp: { enabled: true }
      cursor:
        skills: { enabled: true }
        mcp: { enabled: true }

GLOBAL FEATURES
  The features: block is a set of master switches (default: all false).
  If a feature is globally false, it is disabled for ALL agents regardless
  of per-agent configuration.

    features:
      instructions: false    # Controls AGENTS.md + instruction symlinks
      skills: false          # Controls .agents/skills/ + skill symlinks
      commands: false        # Controls .agents/commands/ + command symlinks
      mcp: false             # Controls MCP config generation

GITIGNORE MANAGEMENT
  The gitignore: option controls how agsync manages .gitignore entries.
  Entries are placed in a managed section between # agsync:begin / # agsync:end.

    on        Add ALL generated output (.agents/, AGENTS.md, symlinks, MCP configs)
    mcpOnly   Add only MCP config file paths (default)
    off       Do not manage .gitignore at all

MONOREPO SCOPING
  One agsync.yaml lives at the repo root. Subfolders can each have their
  own .agsync/ directory with skills, commands, MCP definitions, and instructions.
  All output builds to the git root.

  Example:
    project/                          ← git root, agsync.yaml
    ├── .agsync/                      ← root definitions
    ├── frontend/
    │   └── .agsync/                  ← subfolder definitions
    │       ├── instructions.md       → generates frontend/AGENTS.md
    │       └── skills/ui-kit/
    └── .agents/skills/
        ├── shared-skill/             ← root skill (no scope)
        └── frontend--ui-kit/         ← scoped skill

  Name mapping:
    Metadata name       frontend:ui-kit       (colon separator)
    Directory name      frontend--ui-kit      (double-dash, filesystem-safe)

  Per-scope AGENTS.md:
    Each subfolder with .agsync/instructions.md or skills gets its own
    AGENTS.md generated in-place (e.g. frontend/AGENTS.md).
    The root AGENTS.md references these with:
      "When working in folder: frontend — you MUST load frontend/AGENTS.md"

  Agent symlinks (CLAUDE.md, .claude/skills/) are only created at the root.
  Scoped SKILL.md files include a scope: field and a warning so agents
  only apply them within the correct subfolder.

  The add/remove commands resolve the nearest .agsync/ directory upwards,
  so running from frontend/ adds to frontend/.agsync/.

GENERATED OUTPUT
  AGENTS.md                         Root instructions + skill listing + scope refs
  subfolder/AGENTS.md               Per-scope instructions (if .agsync/ exists)
  .agents/skills/*/SKILL.md         Canonical skill output
  .agents/skills/scope--name/       Scoped skill from a subfolder
  .agents/commands/*.md             Canonical command output
  CLAUDE.md                         Symlink → AGENTS.md (root only)
  GEMINI.md                         Symlink → AGENTS.md (root only)
  .claude/skills/                   Symlink → .agents/skills/ (root only)
  .cursor/skills/                   Symlink → .agents/skills/ (root only)
  .claude/settings.json             Generated MCP config
  .cursor/mcp.json                  Generated MCP config
  .codex/config.toml                Generated MCP config (TOML)

SUPPORTED AGENTS
  claude, cursor, codex, windsurf, copilot, gemini, opencode, antigravity
`.trim();
}
