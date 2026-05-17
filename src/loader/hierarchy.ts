import { resolve, dirname } from "node:path";
import { readFile } from "node:fs/promises";
import { findNearestConfigFile, loadFullConfig } from "@/loader/config";
import { parseStructuredInstructions } from "@/context/parser";
import { loadPatterns } from "@/context/patterns";
import { mergeContext } from "@/context/merger";
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

  if (loaded.config.features.context) {
    const baseDir = dirname(configPath);
    const contextWarnings: string[] = [];

    let rootRaw = "";
    try {
      rootRaw = await readFile(resolve(baseDir, ".agsync", "instructions.md"), "utf-8");
    } catch {
      // no root instructions
    }
    const rootStructured = parseStructuredInstructions(rootRaw);

    const { patterns, warnings: patternWarnings } = await loadPatterns(baseDir, loaded.scopes);
    contextWarnings.push(...patternWarnings);

    const compiledContexts = [];

    const { context: rootContext, warnings: rootWarnings } = mergeContext(null, rootStructured, "", patterns);
    contextWarnings.push(...rootWarnings);
    compiledContexts.push(rootContext);

    for (const scope of loaded.scopes) {
      const pkgStructured = scope.structuredInstructions ?? { guidelines: [], applyPatterns: [] };
      const { context, warnings } = mergeContext(rootStructured, pkgStructured, scope.scope, patterns);
      contextWarnings.push(...warnings);
      compiledContexts.push(context);
    }

    loaded.compiledContexts = compiledContexts;
    loaded.contextWarnings = contextWarnings;
    loaded.patterns = patterns;
  }

  return loaded;
}
