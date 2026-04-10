import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { BaseAgentConverter } from "@/converters/base";
import type { ResolvedConfig, ConvertedOutput } from "@/types";

const execFileAsync = promisify(execFile);

export class CodexConverter extends BaseAgentConverter {
  readonly name = "codex";

  convert(_config: ResolvedConfig, _outputDir: string): ConvertedOutput {
    return { files: [] };
  }

  async detect(): Promise<boolean> {
    try {
      await execFileAsync("codex", ["--version"]);
      return true;
    } catch {
      return false;
    }
  }

  getOutputPaths(outputDir: string): string[] {
    return [
      resolve(outputDir, ".agents", "skills"),
      resolve(outputDir, "AGENTS.md"),
    ];
  }
}
