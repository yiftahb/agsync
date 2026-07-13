import { resolve, dirname } from "node:path";
import { readFile } from "node:fs/promises";
import { findNearestConfigFile, loadFullConfig } from "@/loader/config";
import { parseStructuredInstructions } from "@/context/parser";
import { loadPatterns } from "@/context/patterns";
import { mergeContextChain, type ChainLevel } from "@/context/merger";
import type { LoadedConfig, StructuredInstructions, CompiledContext } from "@/types";
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

export function buildScopeChain(
  targetScope: string,
  levelByScope: Map<string, StructuredInstructions>
): ChainLevel[] {
  const chain: ChainLevel[] = [];
  const root = levelByScope.get("");
  if (root) chain.push({ scope: "", instructions: root });
  if (targetScope === "") return chain;

  const parts = targetScope.split(/[\\/]/);
  let prefix = "";
  for (const part of parts) {
    prefix = prefix ? `${prefix}/${part}` : part;
    const instructions = levelByScope.get(prefix);
    if (instructions) chain.push({ scope: prefix, instructions });
  }
  return chain;
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

    const levelByScope = new Map<string, StructuredInstructions>();
    levelByScope.set("", rootStructured);
    for (const scope of loaded.scopes) {
      levelByScope.set(scope.scope, scope.structuredInstructions ?? { guidelines: [], applyPatterns: [] });
    }

    const compiledContexts: CompiledContext[] = [];
    const targetScopes = ["", ...loaded.scopes.map((s) => s.scope)];
    for (const targetScope of targetScopes) {
      const chain = buildScopeChain(targetScope, levelByScope);
      const { context, warnings } = mergeContextChain(chain, patterns);
      contextWarnings.push(...warnings);
      compiledContexts.push(context);
    }

    loaded.compiledContexts = compiledContexts;
    loaded.contextWarnings = contextWarnings;
    loaded.patterns = patterns;
  }

  return loaded;
}
