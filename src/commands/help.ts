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

PROJECT STRUCTURE
  agsync.yaml                       Main configuration (repo root)
  .agsync/skills/*/                 Skill definitions
  .agsync/tools/*.yaml              MCP tool and CLI definitions
`.trim();
}
