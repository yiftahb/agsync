import type { ResolvedConfig, ConvertedOutput } from "@/types";

export abstract class BaseAgentConverter {
  abstract readonly name: string;

  abstract convert(config: ResolvedConfig, outputDir: string): ConvertedOutput;

  abstract detect(): Promise<boolean>;

  abstract getOutputPaths(outputDir: string): string[];

  generateAgsyncSection(config: ResolvedConfig, skillsPath: string): string {
    const lines: string[] = [];

    lines.push("<!-- agsync:begin -->");
    lines.push("## Available Skills");
    lines.push("");

    for (const skill of config.skills) {
      lines.push(`- **${skill.name}**: ${skill.description}`);
    }

    lines.push("");
    lines.push(`Skills are managed by agsync. Full definitions are in \`${skillsPath}\`.`);
    lines.push("<!-- agsync:end -->");

    return lines.join("\n");
  }
}
