Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written.

## Overview

agsync is a Git-native CLI that syncs AI agent skill definitions and MCP tool bindings across Claude Code, Codex, and Cursor. It reads canonical definitions from `.agsync/` and generates client-specific output.

## Architecture

```
src/
├── index.ts              # CLI entry point (commander)
├── commands/
│   ├── init.ts           # agsync init — scaffolds project
│   ├── add.ts            # agsync skill add — imports from GitHub
│   ├── remove.ts         # agsync skill remove
│   ├── validate.ts       # agsync validate — schema + cross-ref checks
│   ├── plan.ts           # agsync plan — preview changes (dry-run)
│   ├── sync.ts           # agsync sync — plan + apply changes
│   ├── doctor.ts         # agsync doctor — environment health
│   └── help.ts           # agsync help — extended help text
├── converters/
│   ├── base.ts           # BaseAgentConverter abstract class
│   ├── claude-code.ts    # Generates .claude/skills/ + .claude/settings.json
│   ├── codex.ts          # Generates .agents/skills/
│   └── cursor.ts         # Generates .cursor/mcp.json
├── loader/
│   ├── config.ts         # Loads agsync.yaml + skill/tool YAML files
│   └── hierarchy.ts      # Walks up to git root merging parent configs
├── resolver/
│   └── skills.ts         # Resolves skill extends chains (local + GitHub)
├── schema/
│   └── config.ts         # Zod schemas for agsync.yaml, skills, tools
├── types/
│   └── index.ts          # All TypeScript interfaces
└── utils/
    └── env.ts            # $VAR / ${VAR} expansion for tool env values
```

### Data flow

1. `loader/` parses `agsync.yaml` and all referenced YAML files, validated by `schema/`
2. `resolver/` resolves skill `extends` chains
3. `converters/` transform resolved config into client-specific files
4. `commands/sync.ts` orchestrates: validate → plan → apply

### Key abstractions

- **`BaseAgentConverter`** — each target implements `convert()`, `detect()`, `getOutputPaths()`, and inherits `generateAgsyncSection()`
- **`SyncPlan`** — contains `skills` (create/update/delete), `files` (all output), `skillOutputDirs`, and `warnings`
- **`buildSyncPlan()`** computes the plan without side effects; `applySyncPlan()` writes to disk
- Env values in tool definitions support `$VAR` and `${VAR}` syntax, expanded at sync time. Missing vars produce warnings and empty strings.

## Build

```bash
pnpm build        # tsup → dist/index.js (ESM, node18 target)
pnpm dev          # tsup --watch
```

Uses tsup with the config in `tsup.config.ts`. Output is a single ESM bundle in `dist/`.

## Test

```bash
pnpm test         # jest — all tests
pnpm test:watch   # jest --watch
```

Tests are in `tests/` mirroring `src/` structure. Uses ts-jest with ESM preset. Path alias `@/*` maps to `src/*` via `moduleNameMapper`. Tests create temp dirs and clean up after each run.

## Lint & Typecheck

```bash
pnpm lint         # eslint src/ tests/
pnpm typecheck    # tsc --noEmit
```

ESLint uses flat config (`eslint.config.mjs`) with typescript-eslint. Strict TypeScript with `@/*` absolute imports.

## Conventions

- Absolute imports via `@/` (e.g., `import { runSync } from "@/commands/sync"`)
- No comments in code unless logic is non-obvious
- pnpm as package manager
- Jest for testing, ESLint for linting, strict TypeScript

<!-- agsync:begin -->
## Available Skills

- **agent-skills**: Expert in the Agent Skills open standard (agentskills.io). Use when creating, editing, or validating SKILL.md files, structuring skill directories, or understanding how skills are discovered and loaded by agents.

- **agsync**: Expert in agsync, the Git-native CLI that syncs skills and MCP tools across Claude Code, Codex, and Cursor. Use when working with agsync.yaml, adding or removing skills, syncing configs, or troubleshooting agsync workflows.

- **claude-skills**: Expert in Claude Code Agent Skills. Use when creating, editing, or troubleshooting Claude Code skills under .claude/skills/ or understanding how Claude discovers, loads, and uses skills.

- **claude-tools**: Expert in Claude Code MCP tool configuration and .claude/settings.json. Use when setting up MCP servers, configuring tools, or troubleshooting Claude Code tool integrations.

- **codex-skills**: Expert in OpenAI Codex Agent Skills. Use when creating, editing, or troubleshooting Codex skills under .agents/skills/.

- **codex-tools**: Expert in Codex MCP tool configuration and agents/openai.yaml tool dependencies. Use when setting up MCP servers, configuring tools, or troubleshooting Codex tool integrations.

- **cursor-skills**: Expert in Cursor Agent Skills, the open standard for extending AI agents. Use when creating, editing, or troubleshooting Cursor skills under .agents/skills/ or .cursor/skills/.

- **cursor-tools**: Expert in Cursor MCP tool configuration and .cursor/mcp.json. Use when setting up MCP servers, configuring tools, or troubleshooting Cursor tool integrations.


Skills are managed by agsync. Full definitions are in `.agents/skills/`.
<!-- agsync:end -->
