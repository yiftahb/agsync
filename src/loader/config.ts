import { readFile, stat } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";
import {
  agsyncConfigSchema,
  skillDefinitionSchema,
  toolDefinitionSchema,
} from "@/schema/config";
import type {
  AgsyncConfig,
  LoadedConfig,
  SkillDefinition,
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
        const dirName = basename(match);
        const yamlPath = resolve(match, `${dirName}.yaml`);
        try {
          const raw = await readFile(yamlPath, "utf-8");
          const parsed = parseYaml(raw);
          results.push(skillDefinitionSchema.parse(parsed));
        } catch (_) {
          void _;
        }
      } else if (match.endsWith(".yaml") || match.endsWith(".yml")) {
        const raw = await readFile(match, "utf-8");
        const parsed = parseYaml(raw);
        results.push(skillDefinitionSchema.parse(parsed));
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

  const tools = await loadYamlFiles<ToolDefinition>(
    baseDir,
    config.tools,
    (data) => toolDefinitionSchema.parse(data)
  );

  return { config, skills, tools, configPath };
}
