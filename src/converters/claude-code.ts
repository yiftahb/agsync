import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { BaseAgentConverter } from "@/converters/base";
import type { ResolvedConfig, ConvertedOutput } from "@/types";

const execFileAsync = promisify(execFile);

export class ClaudeCodeConverter extends BaseAgentConverter {
  readonly name = "claude-code";

  convert(config: ResolvedConfig, outputDir: string): ConvertedOutput {
    const files = [];

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
      resolve(outputDir, ".claude", "settings.json"),
    ];
  }
}
