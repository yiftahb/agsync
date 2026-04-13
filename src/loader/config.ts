import { readFile, stat, readdir } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { existsSync } from "node:fs";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";
import {
  agsyncConfigSchema,
  toolDefinitionSchema,
} from "@/schema/config";
import { parseSkillMd } from "@/utils/github";
import type {
  AgsyncConfig,
  LoadedConfig,
  ScopedContent,
  SkillDefinition,
  CommandDefinition,
  ToolDefinition,
} from "@/types";

export async function findConfigFile(startDir: string): Promise<string | null> {
  const candidate = resolve(startDir, "agsync.yaml");
  try {
    await readFile(candidate, "utf-8");
    return candidate;
  } catch {
    return null;
  }
}

export async function findNearestConfigFile(startDir: string): Promise<string | null> {
  let current = resolve(startDir);
  while (true) {
    const found = await findConfigFile(current);
    if (found) return found;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export async function loadConfigFile(configPath: string): Promise<AgsyncConfig> {
  const raw = await readFile(configPath, "utf-8");
  const parsed = parseYaml(raw);
  return agsyncConfigSchema.parse(parsed);
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    const s = await stat(path);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function loadSkillEntries(
  baseDir: string,
  patterns: { path: string }[]
): Promise<SkillDefinition[]> {
  const results: SkillDefinition[] = [];

  for (const pattern of patterns) {
    const fullPattern = resolve(baseDir, pattern.path);
    const matches = await glob(fullPattern);

    for (const match of matches.sort()) {
      if (await isDirectory(match)) {
        const skillMdPath = resolve(match, "SKILL.md");
        try {
          const raw = await readFile(skillMdPath, "utf-8");
          const parsed = parseSkillMd(raw);
          results.push({
            name: parsed.name,
            description: parsed.description,
            instructions: parsed.instructions || undefined,
            extends: parsed.extends,
            tools: parsed.tools,
            source: parsed.source,
          });
        } catch {
          const dirName = basename(match);
          const yamlPath = resolve(match, `${dirName}.yaml`);
          try {
            const raw = await readFile(yamlPath, "utf-8");
            const parsed = parseYaml(raw);
            const { skillDefinitionSchema } = await import("@/schema/config");
            results.push(skillDefinitionSchema.parse(parsed));
          } catch (_) {
            void _;
          }
        }
      }
    }
  }

  return results;
}

async function loadCommandEntries(
  baseDir: string,
  patterns: { path: string }[]
): Promise<CommandDefinition[]> {
  const results: CommandDefinition[] = [];

  for (const pattern of patterns) {
    const fullPattern = resolve(baseDir, pattern.path);
    const matches = await glob(fullPattern);

    for (const match of matches.sort()) {
      if (match.endsWith(".md")) {
        const raw = await readFile(match, "utf-8");
        const name = basename(match, ".md");
        results.push({ name, content: raw });
      }
    }
  }

  return results;
}

async function loadYamlFiles<T>(
  baseDir: string,
  patterns: { path: string }[],
  parser: (data: unknown) => T
): Promise<T[]> {
  const results: T[] = [];
  for (const pattern of patterns) {
    const fullPattern = resolve(baseDir, pattern.path);
    const files = await glob(fullPattern);
    for (const file of files.sort()) {
      const raw = await readFile(file, "utf-8");
      const parsed = parseYaml(raw);
      results.push(parser(parsed));
    }
  }
  return results;
}

export async function loadFullConfig(configPath: string): Promise<LoadedConfig> {
  const config = await loadConfigFile(configPath);
  const baseDir = dirname(configPath);

  const skills = await loadSkillEntries(baseDir, config.skills);

  const commands = await loadCommandEntries(baseDir, config.commands);

  const tools = await loadYamlFiles<ToolDefinition>(
    baseDir,
    config.tools,
    (data) => toolDefinitionSchema.parse(data)
  );

  const scopes = await discoverScopes(baseDir);

  return { config, skills, commands, tools, configPath, scopes };
}

export async function findNearestAgsyncDir(startDir: string): Promise<string | null> {
  let current = resolve(startDir);
  while (true) {
    const candidate = resolve(current, ".agsync");
    if (existsSync(candidate) && (await stat(candidate)).isDirectory()) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export async function discoverAgsyncDirs(rootDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const agsyncDir = resolve(dir, ".agsync");
    if (existsSync(agsyncDir) && (await stat(agsyncDir)).isDirectory()) {
      results.push(dir);
    }
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules") continue;
      const full = resolve(dir, entry);
      if (await isDirectory(full)) {
        await walk(full);
      }
    }
  }

  await walk(rootDir);
  return results;
}

async function loadScopedContent(
  scopeDir: string,
  rootDir: string
): Promise<ScopedContent | null> {
  const agsyncDir = resolve(scopeDir, ".agsync");
  const relative = scopeDir === rootDir
    ? ""
    : scopeDir.slice(rootDir.length + 1);

  if (relative === "") return null;

  let instructions = "";
  const instructionsPath = resolve(agsyncDir, "instructions.md");
  try {
    instructions = await readFile(instructionsPath, "utf-8");
  } catch {
    // no instructions
  }

  const skillsDir = resolve(agsyncDir, "skills");
  const skills = existsSync(skillsDir)
    ? await loadSkillEntries(agsyncDir, [{ path: "skills/*" }])
    : [];

  for (const skill of skills) {
    skill.scope = relative;
  }

  const commandsDir = resolve(agsyncDir, "commands");
  const commands = existsSync(commandsDir)
    ? await loadCommandEntries(agsyncDir, [{ path: "commands/*.md" }])
    : [];

  for (const cmd of commands) {
    cmd.scope = relative;
  }

  const toolsDir = resolve(agsyncDir, "tools");
  const tools = existsSync(toolsDir)
    ? await loadYamlFiles<ToolDefinition>(agsyncDir, [{ path: "tools/*.yaml" }], (data) =>
        toolDefinitionSchema.parse(data)
      )
    : [];

  return {
    scope: relative,
    dir: scopeDir,
    instructions,
    skills,
    commands,
    tools,
  };
}

async function discoverScopes(rootDir: string): Promise<ScopedContent[]> {
  const dirs = await discoverAgsyncDirs(rootDir);
  const scopes: ScopedContent[] = [];
  for (const dir of dirs.sort()) {
    const scoped = await loadScopedContent(dir, rootDir);
    if (scoped) scopes.push(scoped);
  }
  return scopes;
}
