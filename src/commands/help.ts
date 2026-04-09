export function getExtendedHelp(): string {
  return `
agsync - Git-native CLI to sync skills and MCP tools across AI coding clients

USAGE
  agsync <command> [options]

COMMANDS
  init                                  Scaffold a new agsync project
  skill add <org/repo> <skill-name>     Add a skill from a GitHub repository
  skill remove <skill-name>             Remove a skill
  validate                              Validate config and all definitions
  sync                                  Compile and generate client configs
  doctor                                Check environment health
  help                                  Show this help message

EXAMPLES
  agsync init
  agsync skill add org/repo my-skill
  agsync skill add org/repo code-reviewer
  agsync skill remove code-reviewer
  agsync validate
  agsync sync
  agsync doctor

HIERARCHY
  agsync supports hierarchical configs in monorepos. Place agsync.yaml at the
  repo root and in subdirectories. Child configs inherit from parents automatically.

SKILL FORMAT
  Each skill is a directory under .agsync/skills/ containing a YAML file
  matching the directory name:

    .agsync/skills/my-skill/my-skill.yaml

  The YAML file defines the skill:

    name: my-skill
    description: What this skill does
    instructions: |
      Detailed instructions for the agent.
    extends:
      - ./base-skill
    tools:
      - tool-name

  Optional directories alongside the YAML (per Agent Skills standard):
    scripts/       Executable code
    references/    Documentation loaded on demand
    assets/        Templates, images, data files

TOOL FORMAT
  Define MCP servers in .agsync/tools/*.yaml:

    name: my-server
    description: What this tool does
    type: mcp
    command: node
    args: ["server.js"]
    env:
      API_KEY: $API_KEY

  Env values support $VAR and \${VAR} syntax. During sync, these are expanded
  from the current shell environment. If a referenced variable is not set,
  sync fails with an error. validate warns about unset variables without failing.

PROJECT STRUCTURE
  agsync.yaml                       Main configuration (repo root)
  .agsync/skills/*/                 Skill definitions
  .agsync/tools/*.yaml              MCP tool and CLI definitions

GENERATED OUTPUT
  AGENTS.md                         agsync section injected between markers
  CLAUDE.md                         Symlink to AGENTS.md
  .agents/skills/*/SKILL.md         Codex + Cursor (Agent Skills standard)
  .claude/skills/*/SKILL.md         Claude Code
  .claude/settings.json             MCP config for Claude Code
  .cursor/mcp.json                  MCP config for Cursor
`.trim();
}
