import type { ResolvedConfig, ResolvedSkill, ConvertedOutput } from "@/types";

export function buildSkillMd(skill: ResolvedSkill, config: ResolvedConfig): string {
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
