import { resolve, dirname, relative } from "node:path";
import { findConfigFile, loadFullConfig } from "@/loader/config";
import type { LoadedConfig, UserAgentConfig, GlobalFeatures, GitignoreMode } from "@/types";
import { existsSync } from "node:fs";

export function findGitRoot(startDir: string): string {
  let current = resolve(startDir);
  while (current !== dirname(current)) {
    if (existsSync(resolve(current, ".git"))) {
      return current;
    }
    current = dirname(current);
  }
  return startDir;
}

export async function collectConfigChain(startDir: string): Promise<string[]> {
  const gitRoot = findGitRoot(startDir);
  const configPaths: string[] = [];
  let current = resolve(startDir);

  while (true) {
    const configPath = await findConfigFile(current);
    if (configPath) {
      configPaths.unshift(configPath);
    }
    if (resolve(current) === resolve(gitRoot)) {
      break;
    }
    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return configPaths;
}

function mergeGlobalFeatures(base: GlobalFeatures, overlay: GlobalFeatures): GlobalFeatures {
  return {
    instructions: overlay.instructions || base.instructions,
    skills: overlay.skills || base.skills,
    commands: overlay.commands || base.commands,
    mcp: overlay.mcp || base.mcp,
  };
}

function mergeAgentFeature<T>(base: T | undefined, overlay: T | undefined): T | undefined {
  if (!overlay) return base;
  if (!base) return overlay;
  return { ...base, ...overlay };
}

function mergeAgents(
  base: Record<string, Partial<UserAgentConfig>>,
  overlay: Record<string, Partial<UserAgentConfig>>
): Record<string, Partial<UserAgentConfig>> {
  const merged = { ...base };

  for (const [name, overlayCfg] of Object.entries(overlay)) {
    const baseCfg = merged[name] ?? {};
    merged[name] = {
      instructions: mergeAgentFeature(baseCfg.instructions, overlayCfg.instructions),
      skills: mergeAgentFeature(baseCfg.skills, overlayCfg.skills),
      commands: mergeAgentFeature(baseCfg.commands, overlayCfg.commands),
      mcp: mergeAgentFeature(baseCfg.mcp, overlayCfg.mcp),
    };
  }

  return merged;
}

export async function loadHierarchicalConfig(startDir: string): Promise<LoadedConfig | null> {
  const chain = await collectConfigChain(startDir);
  if (chain.length === 0) {
    return null;
  }

  const configs = await Promise.all(chain.map((p) => loadFullConfig(p)));

  if (configs.length === 1) {
    return configs[0];
  }

  const rootConfigDir = dirname(configs[0].configPath);

  return configs.slice(1).reduce<LoadedConfig>((merged, current) => {
    const configDir = dirname(current.configPath);
    const scopePrefix = relative(rootConfigDir, configDir).replace(/\\/g, "/");

    const scopedSkills = scopePrefix
      ? current.skills.map((s) => ({
          ...s,
          name: `${scopePrefix}:${s.name}`,
          scope: `${scopePrefix}/`,
          sourceDir: resolve(configDir, ".agsync", "skills", s.name),
        }))
      : current.skills;

    const scopedCommands = scopePrefix
      ? current.commands.map((c) => ({
          ...c,
          name: `${scopePrefix}:${c.name}`,
          scope: `${scopePrefix}/`,
        }))
      : current.commands;

    return {
      config: {
        version: current.config.version,
        features: mergeGlobalFeatures(merged.config.features, current.config.features),
        gitignore: (current.config.gitignore ?? merged.config.gitignore) as GitignoreMode,
        agents: mergeAgents(merged.config.agents, current.config.agents),
        skills: [...merged.config.skills, ...current.config.skills],
        commands: [...merged.config.commands, ...current.config.commands],
        tools: [...merged.config.tools, ...current.config.tools],
      },
      skills: [...merged.skills, ...scopedSkills],
      commands: [...merged.commands, ...scopedCommands],
      tools: [...merged.tools, ...current.tools],
      configPath: current.configPath,
    };
  }, configs[0]);
}
