import { mkdtemp, writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { stringify as toYaml } from "yaml";
import { runDoctor } from "@/commands/doctor";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-doctor-"));
  await mkdir(join(tempDir, ".git"), { recursive: true });
});

afterEach(async () => {
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
      toYaml({ version: "1", targets: ["codex"] })
    );

    const checks = await runDoctor(tempDir);
    const configCheck = checks.find((c) => c.name === "agsync.yaml");
    expect(configCheck!.status).toBe("pass");
  });

  it("checks for client CLIs", async () => {
    const checks = await runDoctor(tempDir);
    const clientChecks = checks.filter((c) => c.name.endsWith("CLI"));
    expect(clientChecks.length).toBe(3);
  });

  it("reports hierarchy status", async () => {
    const checks = await runDoctor(tempDir);
    const hierarchyCheck = checks.find((c) => c.name === "Config hierarchy");
    expect(hierarchyCheck).toBeDefined();
  });
});
