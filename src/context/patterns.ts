import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { glob } from "glob";
import { parse as parseYaml } from "yaml";
import { patternFrontmatterSchema } from "@/schema/config";
import { parseStructuredInstructions } from "@/context/parser";
import type { PatternDefinition, ScopedContent } from "@/types";

export async function loadPatterns(
  rootDir: string,
  scopes: ScopedContent[]
): Promise<{ patterns: PatternDefinition[]; warnings: string[] }> {
  const warnings: string[] = [];
  const map = new Map<string, PatternDefinition>();

  const dirs = [rootDir, ...scopes.map((s) => s.dir)];

  for (const dir of dirs) {
    const patternsDir = resolve(dir, ".agsync", "patterns");
    if (!existsSync(patternsDir)) continue;

    const files = await glob(resolve(patternsDir, "*.md"));
    for (const file of files.sort()) {
      const raw = await readFile(file, "utf-8");

      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!fmMatch) {
        warnings.push(`Pattern file "${file}" missing frontmatter — skipped`);
        continue;
      }

      let id: string;
      try {
        const fm = parseYaml(fmMatch[1]) as Record<string, unknown>;
        id = patternFrontmatterSchema.parse(fm).id;
      } catch {
        warnings.push(`Pattern file "${file}" has invalid or missing id — skipped`);
        continue;
      }

      if (map.has(id)) {
        warnings.push(`Pattern id "${id}" defined in multiple files — first definition wins`);
        continue;
      }

      const parsed = parseStructuredInstructions(raw);
      map.set(id, { id, hld: parsed.hld, guidelines: parsed.guidelines });
    }
  }

  return { patterns: [...map.values()], warnings };
}
