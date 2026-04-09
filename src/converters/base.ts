import type { ResolvedConfig, ConvertedOutput } from "@/types";

export abstract class BaseAgentConverter {
  abstract readonly name: string;

  abstract convert(config: ResolvedConfig, outputDir: string): ConvertedOutput;

  abstract detect(): Promise<boolean>;

  abstract getOutputPaths(outputDir: string): string[];

  generateAgsyncSection(config: ResolvedConfig): string {
    const lines: string[] = [];

    lines.push("<!-- agsync:begin -->");
    lines.push("## Available Skills");
    lines.push("");

    for (const skill of config.skills) {
      lines.push(`### ${skill.name}`);
      lines.push("");
      lines.push(skill.description);
      lines.push("");
      lines.push(skill.instructions.trim());
      lines.push("");

      if (skill.tools.length > 0) {
        lines.push("#### Tools");
        lines.push("");
        for (const toolName of skill.tools) {
          const tool = config.tools.find((t) => t.name === toolName);
          if (tool) {
            lines.push(`- **${tool.name}**: ${tool.description}`);
          } else {
            lines.push(`- ${toolName}`);
          }
        }
        lines.push("");
      }
    }

    lines.push("<!-- agsync:end -->");

    return lines.join("\n");
  }
}
