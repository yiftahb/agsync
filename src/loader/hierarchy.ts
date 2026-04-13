import { resolve, dirname } from "node:path";
import { findNearestConfigFile, loadFullConfig } from "@/loader/config";
import type { LoadedConfig } from "@/types";
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

export async function loadHierarchicalConfig(startDir: string): Promise<LoadedConfig | null> {
  const configPath = await findNearestConfigFile(startDir);
  if (!configPath) return null;

  const loaded = await loadFullConfig(configPath);

  for (const scope of loaded.scopes) {
    const scopedSkills = scope.skills.map((s) => ({
      ...s,
      name: `${scope.scope}:${s.name}`,
      scope: scope.scope,
      sourceDir: resolve(scope.dir, ".agsync", "skills", s.name),
    }));
    loaded.skills.push(...scopedSkills);

    const scopedCommands = scope.commands.map((c) => ({
      ...c,
      name: `${scope.scope}:${c.name}`,
      scope: scope.scope,
    }));
    loaded.commands.push(...scopedCommands);

    loaded.mcp.push(...scope.mcp);
  }

  return loaded;
}
