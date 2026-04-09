import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { BaseAgentConverter } from "@/converters/base";
import type { ResolvedConfig, ConvertedOutput, ResolvedSkill } from "@/types";

const execFileAsync = promisify(execFile);

function buildSkillMd(skill: ResolvedSkill, config: ResolvedConfig): string {
  const lines: string[] = [];

  lines.push("---");
  lines.push(`name: ${skill.name}`);
  lines.push(`description: ${skill.description}`);
  lines.push("---");
  lines.push("");
  lines.push(skill.instructions.trim());

  if (skill.tools.length > 0) {
    lines.push("");
    lines.push("## Available Tools");
    lines.push("");
    for (const toolName of skill.tools) {
      const tool = config.tools.find((t) => t.name === toolName);
      if (tool) {
        lines.push(`- **${tool.name}**: ${tool.description}`);
      } else {
        lines.push(`- ${toolName}`);
      }
    }
  }

  return lines.join("\n");
}

export class ClaudeCodeConverter extends BaseAgentConverter {
  readonly name = "claude-code";

  convert(config: ResolvedConfig, outputDir: string): ConvertedOutput {
    const files = [];

    for (const skill of config.skills) {
      files.push({
        path: resolve(outputDir, ".claude", "skills", skill.name, "SKILL.md"),
        content: buildSkillMd(skill, config),
      });
    }

    const mcpTools = config.tools.filter((t) => t.type === "mcp");
    if (mcpTools.length > 0) {
      const mcpServers: Record<string, unknown> = {};
      for (const tool of mcpTools) {
        mcpServers[tool.name] = {
          command: tool.command ?? "",
          args: tool.args ?? [],
          env: tool.env ?? {},
        };
      }
      files.push({
        path: resolve(outputDir, ".claude", "settings.json"),
        content: JSON.stringify({ mcpServers }, null, 2),
      });
    }

    return { files };
  }

  async detect(): Promise<boolean> {
    try {
      await execFileAsync("claude", ["--version"]);
      return true;
    } catch {
      return false;
    }
  }

  getOutputPaths(outputDir: string): string[] {
    return [
      resolve(outputDir, ".claude", "skills"),
      resolve(outputDir, ".claude", "settings.json"),
    ];
  }
}
