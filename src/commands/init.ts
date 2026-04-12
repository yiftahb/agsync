import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as toYaml } from "yaml";

const SAMPLE_CONFIG = {
  version: "1",
  features: {
    instructions: true,
    skills: true,
    commands: true,
    mcp: true,
  },
  gitignore: "mcpOnly",
  skills: [{ path: ".agsync/skills/*" }],
  commands: [{ path: ".agsync/commands/*" }],
  tools: [{ path: ".agsync/tools/*.yaml" }],
  agents: {
    claude: {
      instructions: { enabled: true },
      skills: { enabled: true },
      commands: { enabled: true },
      mcp: { enabled: true },
    },
    cursor: {
      skills: { enabled: true },
      commands: { enabled: true },
      mcp: { enabled: true },
    },
    codex: {
      instructions: { enabled: true },
      skills: { enabled: true },
      commands: { enabled: true },
      mcp: { enabled: true },
    },
    copilot: {
      instructions: { enabled: true },
      commands: { enabled: true },
      mcp: { enabled: true },
    },
  },
};

const DEFAULT_SKILL_MD = `---
name: default
description: Default skill for this project
---

You are a helpful coding assistant for this project.
`;

const INSTRUCTIONS_MD = `## Overview

This project uses agsync to manage AI agent configurations.

## Conventions

- Follow existing code patterns and conventions
- Write clear, concise code
`;

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runInit(targetDir: string): Promise<string[]> {
  const created: string[] = [];

  const configPath = resolve(targetDir, "agsync.yaml");
  if (await fileExists(configPath)) {
    throw new Error("agsync.yaml already exists in this directory");
  }

  const dirs = [".agsync/skills", ".agsync/commands", ".agsync/tools"];
  for (const dir of dirs) {
    const dirPath = resolve(targetDir, dir);
    await mkdir(dirPath, { recursive: true });
    created.push(`${dir}/`);
  }

  await writeFile(configPath, toYaml(SAMPLE_CONFIG), "utf-8");
  created.push("agsync.yaml");

  const instructionsPath = resolve(targetDir, ".agsync", "instructions.md");
  await writeFile(instructionsPath, INSTRUCTIONS_MD, "utf-8");
  created.push(".agsync/instructions.md");

  const skillDir = resolve(targetDir, ".agsync", "skills", "default");
  await mkdir(skillDir, { recursive: true });
  const skillPath = resolve(skillDir, "SKILL.md");
  await writeFile(skillPath, DEFAULT_SKILL_MD, "utf-8");
  created.push(".agsync/skills/default/SKILL.md");

  return created;
}
