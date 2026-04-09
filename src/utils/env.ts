import type { ToolDefinition } from "@/types";

const ENV_VAR_REGEX = /\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g;

export function expandEnvValue(value: string): string {
  if (!value.includes("$")) return value;

  return value.replace(ENV_VAR_REGEX, (match, braced, unbraced) => {
    const varName = braced ?? unbraced;
    const resolved = process.env[varName];
    if (resolved === undefined) {
      throw new Error(`Environment variable "${varName}" is not set`);
    }
    return resolved;
  });
}

export function expandToolEnv(tools: ToolDefinition[]): ToolDefinition[] {
  return tools.map((tool) => {
    if (!tool.env) return tool;

    const expandedEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(tool.env)) {
      try {
        expandedEnv[key] = expandEnvValue(value);
      } catch (err) {
        throw new Error(
          `${(err as Error).message} (referenced in tool "${tool.name}", key "${key}")`
        );
      }
    }

    return { ...tool, env: expandedEnv };
  });
}

export interface EnvReference {
  tool: string;
  key: string;
  varName: string;
}

export function findEnvReferences(tools: ToolDefinition[]): EnvReference[] {
  const refs: EnvReference[] = [];

  for (const tool of tools) {
    if (!tool.env) continue;
    for (const [key, value] of Object.entries(tool.env)) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(ENV_VAR_REGEX.source, "g");
      while ((match = regex.exec(value)) !== null) {
        refs.push({ tool: tool.name, key, varName: match[1] ?? match[2] });
      }
    }
  }

  return refs;
}
