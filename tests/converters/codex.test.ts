import { join } from "node:path";
import { CodexConverter } from "@/converters/codex";
import { buildSkillMd } from "@/converters/base";
import type { ResolvedConfig } from "@/types";

describe("CodexConverter", () => {
  const converter = new CodexConverter();

  it("has the correct name", () => {
    expect(converter.name).toBe("codex");
  });

  it("returns empty files (skills handled by sync)", () => {
    const config: ResolvedConfig = {
      targets: ["codex"],
      skills: [
        {
          name: "helper",
          description: "Helpful assistant",
          instructions: "Help the user",
          tools: [],
          extendsChain: ["helper"],
        },
      ],
      tools: [],
    };

    const output = converter.convert(config, "/project");
    expect(output.files).toHaveLength(0);
  });

  it("returns output paths including .agents/skills and AGENTS.md", () => {
    const paths = converter.getOutputPaths("/project");
    expect(paths).toContain(join("/project", "AGENTS.md"));
    expect(paths).toContain(join("/project", ".agents", "skills"));
  });
});

describe("buildSkillMd", () => {
  it("generates SKILL.md with correct frontmatter", () => {
    const config: ResolvedConfig = {
      targets: ["codex"],
      skills: [
        {
          name: "test",
          description: "Test skill",
          instructions: "Do testing",
          tools: [],
          extendsChain: ["test"],
        },
      ],
      tools: [],
    };

    const content = buildSkillMd(config.skills[0], config);
    expect(content).toContain("---");
    expect(content).toContain("name: test");
    expect(content).toContain("description: Test skill");
    expect(content).toContain("Do testing");
  });

  it("includes tool references", () => {
    const config: ResolvedConfig = {
      targets: ["codex"],
      skills: [
        {
          name: "test",
          description: "Test",
          instructions: "Test",
          tools: ["my-tool"],
          extendsChain: ["test"],
        },
      ],
      tools: [{ name: "my-tool", description: "A tool", type: "cli", command: "echo" }],
    };

    const content = buildSkillMd(config.skills[0], config);
    expect(content).toContain("**my-tool**");
  });
});
