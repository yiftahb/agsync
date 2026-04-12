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
  agsync skill add <org/repo> <name>      Import a skill from a GitHub repository
  agsync skill remove <name>              Remove a skill from .agsync/skills/

MAINTENANCE
  agsync doctor                           Check environment health and enabled agents
  agsync version                          Show current version and check for updates
  agsync update                           Update agsync to the latest version
  agsync help                             Show this help message

COMMON WORKFLOWS

  Set up a new project:
    agsync init
    # Edit .agsync/skills/, .agsync/commands/, .agsync/tools/
    agsync sync

  Import a skill from GitHub:
    agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer
    # Creates a SKILL.md stub with a source reference
    agsync sync

  Add a command (slash command):
    # Create .agsync/commands/deploy.md with the command instructions
    agsync sync

  Add an MCP server:
    # Create .agsync/tools/github.yaml:
    #   name: github
    #   type: mcp
    #   command: npx
    #   args: ["-y", "@modelcontextprotocol/server-github"]
    #   env:
    #     GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN
    export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx
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

  Imported skill (stub with source):
    ---
    name: my-skill
    description: What this skill does
    source:
      registry: github
      org: org-name
      repo: repo-name
      path: path/to/skill
    ---

COMMAND FORMAT
  Commands are .md files under .agsync/commands/:

    .agsync/commands/deploy.md     → /deploy slash command
    .agsync/commands/review.md     → /review slash command

  Each file contains the command instructions in markdown.

TOOL FORMAT
  Define MCP servers in .agsync/tools/*.yaml:

    name: github
    description: GitHub MCP server
    type: mcp
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN

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
    tools:
      - path: .agsync/tools/*.yaml
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
  When agsync runs in a subfolder with its own agsync.yaml, child skills and
  commands are automatically scoped and output to the git root.

  Example:
    project/                          ← git root, agsync.yaml
    ├── frontend/                     ← child agsync.yaml
    │   └── .agsync/skills/ui-kit/
    └── .agents/skills/
        ├── shared-skill/             ← root skill (no scope)
        └── frontend--ui-kit/         ← scoped skill

  Name mapping:
    Metadata name       frontend:ui-kit       (colon separator)
    Directory name      frontend--ui-kit      (double-dash, filesystem-safe)

  Generated SKILL.md files include a scope: field in frontmatter and a
  prominent warning so agents only apply them within the correct subfolder.
  AGENTS.md groups scoped skills under their scope heading.

GENERATED OUTPUT
  AGENTS.md                         Generated instructions + skill listing
  .agents/skills/*/SKILL.md         Canonical skill output
  .agents/skills/scope--name/       Scoped skill from a subfolder
  .agents/commands/*.md             Canonical command output
  CLAUDE.md                         Symlink → AGENTS.md
  GEMINI.md                         Symlink → AGENTS.md
  .claude/skills/                   Symlink → .agents/skills/
  .cursor/skills/                   Symlink → .agents/skills/
  .claude/settings.json             Generated MCP config
  .cursor/mcp.json                  Generated MCP config
  .codex/config.toml                Generated MCP config (TOML)

SUPPORTED AGENTS
  claude, cursor, codex, windsurf, copilot, gemini, opencode, antigravity
`.trim();
}
