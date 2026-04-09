import { resolve, dirname } from "node:path";
import { findConfigFile, loadFullConfig } from "@/loader/config";
import type { LoadedConfig, TargetClient } from "@/types";
import { existsSync } from "node:fs";

function findGitRoot(startDir: string): string {
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

function mergeTargets(base: TargetClient[], overlay: TargetClient[]): TargetClient[] {
  const set = new Set([...base, ...overlay]);
  return [...set];
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

  return configs.slice(1).reduce<LoadedConfig>((merged, current) => {
    return {
      config: {
        version: current.config.version,
        targets: mergeTargets(merged.config.targets, current.config.targets),
        skills: [...merged.config.skills, ...current.config.skills],
        tools: [...merged.config.tools, ...current.config.tools],
      },
      skills: [...merged.skills, ...current.skills],
      tools: [...merged.tools, ...current.tools],
      configPath: current.configPath,
    };
  }, configs[0]);
}
