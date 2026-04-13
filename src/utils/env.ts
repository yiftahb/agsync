import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { McpDefinition, EnvWarning, EnvReference } from "@/types";

const ENV_VAR_REGEX = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

export function parseDotEnv(content: string): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }
  return vars;
}

export function loadDotEnv(dir: string): Record<string, string> {
  const envPath = resolve(dir, ".env");
  try {
    const content = readFileSync(envPath, "utf-8");
    const vars = parseDotEnv(content);
    for (const [key, value] of Object.entries(vars)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    return vars;
  } catch {
    return {};
  }
}

export function expandEnvValue(value: string): { result: string; missing: string[] } {
  if (!value.includes("$")) return { result: value, missing: [] };

  const missing: string[] = [];
  const result = value.replace(ENV_VAR_REGEX, (match, braced, unbraced) => {
    const varName = braced ?? unbraced;
    const resolved = process.env[varName];
    if (resolved === undefined) {
      missing.push(varName);
      return "";
    }
    return resolved;
  });

  return { result, missing };
}

export function expandMcpEnv(mcps: McpDefinition[]): {
  mcp: McpDefinition[];
  warnings: EnvWarning[];
} {
  const warnings: EnvWarning[] = [];

  const expanded = mcps.map((def) => {
    const updates: Partial<McpDefinition> = {};

    if (def.env) {
      const expandedEnv: Record<string, string> = {};
      for (const [key, value] of Object.entries(def.env)) {
        const { result, missing } = expandEnvValue(value);
        expandedEnv[key] = result;
        for (const varName of missing) {
          warnings.push({ server: def.name, key, varName });
        }
      }
      updates.env = expandedEnv;
    }

    if (def.args) {
      updates.args = def.args.map((arg) => {
        const { result, missing } = expandEnvValue(arg);
        for (const varName of missing) {
          warnings.push({ server: def.name, key: "args", varName });
        }
        return result;
      });
    }

    if (!updates.env && !updates.args) return def;
    return { ...def, ...updates };
  });

  return { mcp: expanded, warnings };
}

export function findEnvReferences(mcps: McpDefinition[]): EnvReference[] {
  const refs: EnvReference[] = [];

  for (const def of mcps) {
    if (def.env) {
      for (const [key, value] of Object.entries(def.env)) {
        let match: RegExpExecArray | null;
        const regex = new RegExp(ENV_VAR_REGEX.source, "g");
        while ((match = regex.exec(value)) !== null) {
          refs.push({ server: def.name, key, varName: match[1] ?? match[2] });
        }
      }
    }
    if (def.args) {
      for (const arg of def.args) {
        let match: RegExpExecArray | null;
        const regex = new RegExp(ENV_VAR_REGEX.source, "g");
        while ((match = regex.exec(arg)) !== null) {
          refs.push({ server: def.name, key: "args", varName: match[1] ?? match[2] });
        }
      }
    }
  }

  return refs;
}
