import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import * as configLoader from "@/loader/config";
import * as registry from "@/agents/registry";
import { runDoctor } from "@/commands/doctor";
import type { ResolvedAgentConfig } from "@/types";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-doctor-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
  jest.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

describe("runDoctor", () => {
  it("checks Node.js version", async () => {
    const checks = await runDoctor(tempDir);
    const nodeCheck = checks.find((c) => c.name === "Node.js version");
    expect(nodeCheck).toBeDefined();
    expect(nodeCheck!.status).toBe("pass");
  });

  it("reports missing agsync.yaml", async () => {
    const checks = await runDoctor(tempDir);
    const configCheck = checks.find((c) => c.name === "agsync.yaml");
    expect(configCheck).toBeDefined();
    expect(configCheck!.status).toBe("fail");
  });

  it("reports found agsync.yaml", async () => {
    await writeFile(
      join(tempDir, "agsync.yaml"),
      toYaml({
        version: "1",
        agents: { codex: { skills: { enabled: true } } },
        skills: [],
        commands: [],
        mcp: [],
      })
    );

    const checks = await runDoctor(tempDir);
    const configCheck = checks.find((c) => c.name === "agsync.yaml");
    expect(configCheck!.status).toBe("pass");
  });

  it("reports enabled agents using resolveAgentConfig and getEnabledAgents", async () => {
    await writeFile(join(tempDir, "agsync.yaml"), "version: '1'\nagents: {}\n");

    const resolved: ResolvedAgentConfig = {
      claude: {
        skills: { enabled: true, destination: ".claude/skills", type: "symlink" },
        mcp: {
          enabled: true,
          destination: ".claude/settings.json",
          type: "generated",
          merge_strategy: "merge",
          mcp_format: { format: "json", root_key: "mcpServers" },
        },
      },
    };

    jest.spyOn(configLoader, "loadConfigFile").mockResolvedValue({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      gitignore: "mcpOnly",
      agents: { claude: { skills: { enabled: true }, mcp: { enabled: true } } },
      skills: [],
      commands: [],
      mcp: [],
    });
    jest.spyOn(registry, "resolveAgentConfig").mockReturnValue(resolved);
    jest.spyOn(registry, "getEnabledAgents").mockReturnValue(["claude"]);

    const checks = await runDoctor(tempDir);

    expect(registry.resolveAgentConfig).toHaveBeenCalled();
    expect(registry.getEnabledAgents).toHaveBeenCalledWith(resolved);

    const agentCheck = checks.find((c) => c.name === "Agent: claude");
    expect(agentCheck).toMatchObject({
      status: "pass",
      message: expect.stringMatching(/skills|mcp/),
    });
  });

  it("warns when no agents have features enabled", async () => {
    await writeFile(join(tempDir, "agsync.yaml"), "version: '1'\nagents: {}\n");

    jest.spyOn(configLoader, "loadConfigFile").mockResolvedValue({
      version: "1",
      features: { instructions: true, skills: true, commands: true, mcp: true },
      gitignore: "mcpOnly",
      agents: { codex: { skills: { enabled: false } } },
      skills: [],
      commands: [],
      mcp: [],
    });
    jest.spyOn(registry, "resolveAgentConfig").mockReturnValue({
      codex: {
        skills: { enabled: false, destination: ".codex/skills", type: "symlink" },
      },
    });
    jest.spyOn(registry, "getEnabledAgents").mockReturnValue([]);

    const checks = await runDoctor(tempDir);
    const warn = checks.find((c) => c.name === "Enabled agents");
    expect(warn).toMatchObject({
      status: "warn",
      message: expect.stringContaining("No agents have features enabled"),
    });
  });

  it("reports .agsync/ directories status", async () => {
    const checks = await runDoctor(tempDir);
    const dirCheck = checks.find((c) => c.name === ".agsync/ directories");
    expect(dirCheck).toBeDefined();
  });
});
