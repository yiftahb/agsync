import type {
  StructuredInstructions,
  PatternDefinition,
  CompiledContext,
  ResolvedGuideline,
} from "@/types";

export function mergeContext(
  root: StructuredInstructions | null,
  pkg: StructuredInstructions | null,
  scope: string,
  patterns: PatternDefinition[]
): { context: CompiledContext; warnings: string[] } {
  const warnings: string[] = [];
  const patternMap = new Map(patterns.map((p) => [p.id, p]));

  const hldParts: string[] = [];
  if (root?.hld) hldParts.push(root.hld);
  if (pkg?.hld) hldParts.push(pkg.hld);

  const resolved = new Map<string, ResolvedGuideline>();
  const rootPaths = ["**"];
  const pkgPaths = scope ? [`${scope}/**`] : ["**"];

  for (const g of root?.guidelines ?? []) {
    resolved.set(g.id, {
      id: g.id,
      rule: g.rule,
      paths: g.paths ?? rootPaths,
      source: "root",
    });
  }

  for (const g of pkg?.guidelines ?? []) {
    if (g.override) {
      if (!resolved.has(g.id)) {
        warnings.push(`Guideline "${g.id}" has override:true but no matching root rule`);
      }
      resolved.set(g.id, {
        id: g.id,
        rule: g.rule,
        paths: g.paths ?? pkgPaths,
        source: "package",
        overrideOf: g.id,
      });
    } else {
      if (resolved.has(g.id)) {
        warnings.push(`Guideline "${g.id}" duplicated without override:true — package version used`);
      }
      resolved.set(g.id, {
        id: g.id,
        rule: g.rule,
        paths: g.paths ?? pkgPaths,
        source: "package",
      });
    }
  }

  const appliedPatternIds: string[] = [];
  const toApply = [...(root?.applyPatterns ?? []), ...(pkg?.applyPatterns ?? [])];

  for (const ap of toApply) {
    const pattern = patternMap.get(ap.id);
    if (!pattern) {
      warnings.push(`Pattern "${ap.id}" not found`);
      continue;
    }
    if (!appliedPatternIds.includes(ap.id)) appliedPatternIds.push(ap.id);
    const boundPaths = ap.paths ?? pkgPaths;

    for (const g of pattern.guidelines) {
      const resolvedId = `${ap.id}:${g.id}`;
      resolved.set(resolvedId, {
        id: resolvedId,
        rule: g.rule,
        paths: boundPaths,
        source: `pattern:${ap.id}`,
      });
    }
  }

  return {
    context: {
      scope,
      hld: hldParts.join("\n\n"),
      guidelines: [...resolved.values()],
      patterns: appliedPatternIds,
    },
    warnings,
  };
}

export interface ChainLevel {
  scope: string;
  instructions: StructuredInstructions;
}

function resolveScopedPath(scope: string, path: string): string {
  if (path === "**") return "**";
  return scope ? `${scope}/${path}` : path;
}

function defaultPathsForScope(scope: string): string[] {
  return scope ? [`${scope}/**`] : ["**"];
}

export function mergeContextChain(
  levels: ChainLevel[],
  patterns: PatternDefinition[]
): { context: CompiledContext; warnings: string[] } {
  const warnings: string[] = [];
  const patternMap = new Map(patterns.map((p) => [p.id, p]));
  const resolved = new Map<string, ResolvedGuideline>();
  const hldParts: string[] = [];
  const appliedPatternIds: string[] = [];

  for (const { scope, instructions } of levels) {
    if (instructions.hld) hldParts.push(instructions.hld);
    const source = scope === "" ? "root" : "package";

    for (const g of instructions.guidelines) {
      const paths = g.paths?.length
        ? g.paths.map((p) => resolveScopedPath(scope, p))
        : defaultPathsForScope(scope);
      if (g.override) {
        if (!resolved.has(g.id)) {
          warnings.push(`Guideline "${g.id}" has override:true but no matching parent rule`);
        }
        resolved.set(g.id, { id: g.id, rule: g.rule, paths, source, overrideOf: g.id });
      } else {
        if (resolved.has(g.id)) {
          warnings.push(`Guideline "${g.id}" duplicated without override:true — nearest scope used`);
        }
        resolved.set(g.id, { id: g.id, rule: g.rule, paths, source });
      }
    }

    for (const ap of instructions.applyPatterns) {
      const pattern = patternMap.get(ap.id);
      if (!pattern) {
        warnings.push(`Pattern "${ap.id}" not found`);
        continue;
      }
      if (!appliedPatternIds.includes(ap.id)) appliedPatternIds.push(ap.id);
      for (const g of pattern.guidelines) {
        const resolvedId = `${ap.id}:${g.id}`;
        const paths = ap.paths
          ? ap.paths
          : g.paths?.length
            ? g.paths.map((p) => resolveScopedPath(scope, p))
            : defaultPathsForScope(scope);
        resolved.set(resolvedId, { id: resolvedId, rule: g.rule, paths, source: `pattern:${ap.id}` });
      }
    }
  }

  const scope = levels.length ? levels[levels.length - 1].scope : "";
  return {
    context: {
      scope,
      hld: hldParts.join("\n\n"),
      guidelines: [...resolved.values()],
      patterns: appliedPatternIds,
    },
    warnings,
  };
}
