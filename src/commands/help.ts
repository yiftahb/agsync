export function getExtendedHelp(): string {
  return `
agsync - Git-native CLI to sync skills and MCP tools across AI coding clients

USAGE
  agsync <command> [options]

GETTING STARTED
  agsync init                             Scaffold a new project with agsync.yaml and sample skill
  agsync validate                         Validate config and all definitions
  agsync plan                             Preview changes without writing files
  agsync sync                             Generate client configs for all targets

MANAGING SKILLS
  agsync skill add <org/repo> <name>      Import a skill from a GitHub repository
  agsync skill remove <name>              Remove a skill from .agsync/skills/

MAINTENANCE
  agsync doctor                           Check environment health and client CLIs
  agsync version                          Show current version and check for updates
  agsync update                           Update agsync to the latest version
  agsync help                             Show this help message

COMMON WORKFLOWS

  Set up a new project:
    agsync init
    # Edit .agsync/skills/ and .agsync/tools/ as needed
    agsync sync

  Import and customize a skill from GitHub:
    agsync skill add Shubhamsaboo/awesome-llm-apps code-reviewer
    # Edit .agsync/skills/code-reviewer/code-reviewer.yaml
    agsync sync

  Add an MCP server (e.g. GitHub):
    # Create .agsync/tools/github.yaml:
    #   name: github
    #   type: mcp
    #   command: npx
    #   args: ["-y", "@modelcontextprotocol/server-github"]
    #   env:
    #     GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN
    export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx
    agsync sync

  Check what sync will do before applying:
    agsync validate && agsync plan

SKILL FORMAT
  Each skill is a directory under .agsync/skills/ containing a YAML file
  matching the directory name:

    .agsync/skills/my-skill/
    ├── my-skill.yaml      Required: skill definition
    ├── scripts/           Optional: executable code
    ├── references/        Optional: documentation loaded on demand
    └── assets/            Optional: templates, images, data files

  Minimal YAML:
    name: my-skill
    description: What this skill does and when to use it
    instructions: |
      Detailed instructions for the agent.

  Skills can extend other skills:
    extends:
      - ./base-skill                       Local skill
      - github:org/repo/path               Fetched from GitHub

TOOL FORMAT
  Define MCP servers in .agsync/tools/*.yaml:

    name: github
    description: GitHub MCP server
    type: mcp
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_PERSONAL_ACCESS_TOKEN: $GITHUB_PERSONAL_ACCESS_TOKEN

  Env values support $VAR and \${VAR} syntax, expanded from the shell at
  sync time. Unset variables cause sync to fail; validate warns without failing.

GENERATED OUTPUT
  AGENTS.md                         Skill listing injected between agsync markers
  CLAUDE.md                         Skill listing injected (when claude-code is a target)
  .agents/skills/*/SKILL.md         Codex + Cursor (Agent Skills standard)
  .claude/skills/*/SKILL.md         Claude Code
  .claude/settings.json             MCP config for Claude Code
  .cursor/mcp.json                  MCP config for Cursor
`.trim();
}
