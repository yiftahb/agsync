import { parse as parseYaml } from "yaml";
import { guidelineSchema, instructionsFrontmatterSchema } from "@/schema/config";
import type { StructuredInstructions, Guideline, AppliedPattern } from "@/types";

export function parseStructuredInstructions(raw: string): StructuredInstructions {
  let frontmatterData: Record<string, unknown> = {};
  let body = raw;

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (fmMatch) {
    try {
      frontmatterData = (parseYaml(fmMatch[1]) as Record<string, unknown>) ?? {};
    } catch {
      // ignore
    }
    body = fmMatch[2] ?? "";
  }

  let parsed: { extends?: string; apply_patterns: AppliedPattern[] };
  try {
    parsed = instructionsFrontmatterSchema.parse(frontmatterData);
  } catch {
    parsed = { apply_patterns: [] };
  }

  const hldRaw = extractSection(body, "HLD");
  const guidelinesRaw = extractSection(body, "Guidelines");

  const guidelines: Guideline[] = [];
  if (guidelinesRaw.trim()) {
    try {
      const list = parseYaml(guidelinesRaw);
      if (Array.isArray(list)) {
        for (const item of list) {
          try {
            guidelines.push(guidelineSchema.parse(item));
          } catch {
            // skip invalid entries
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    extends: parsed.extends,
    hld: hldRaw || undefined,
    guidelines,
    applyPatterns: parsed.apply_patterns,
  };
}

function extractSection(body: string, heading: string): string {
  const regex = new RegExp(`^##\\s+${heading}\\s*$`, "im");
  const match = body.match(regex);
  if (!match || match.index === undefined) return "";

  const start = match.index + match[0].length;
  const rest = body.slice(start);
  const nextH2 = rest.match(/^##\s/m);
  return rest.slice(0, nextH2?.index ?? rest.length).trim();
}
