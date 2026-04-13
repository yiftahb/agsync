import { findConfigFile, loadConfigFile, discoverAgsyncDirs } from "@/loader/config";
import { findGitRoot } from "@/loader/hierarchy";
import { resolveAgentConfig, getEnabledAgents } from "@/agents/registry";
import type { DoctorCheck } from "@/types";

async function checkNodeVersion(): Promise<DoctorCheck> {
  const version = process.versions.node;
  const major = parseInt(version.split(".")[0], 10);
  if (major >= 18) {
    return { name: "Node.js version", status: "pass", message: `v${version}` };
  }
  return { name: "Node.js version", status: "fail", message: `v${version} (requires >= 18)` };
}

async function checkConfigExists(targetDir: string): Promise<DoctorCheck> {
  const configPath = await findConfigFile(targetDir);
  if (configPath) {
    return { name: "agsync.yaml", status: "pass", message: `Found at ${configPath}` };
  }
  return { name: "agsync.yaml", status: "fail", message: "Not found. Run 'agsync init' to create one" };
}

async function checkAgsyncDirs(targetDir: string): Promise<DoctorCheck> {
  const gitRoot = findGitRoot(targetDir);
  const dirs = await discoverAgsyncDirs(gitRoot);
  if (dirs.length > 1) {
    return { name: ".agsync/ directories", status: "pass", message: `${dirs.length} .agsync/ dirs found (monorepo)` };
  }
  if (dirs.length === 1) {
    return { name: ".agsync/ directories", status: "pass", message: "Single .agsync/ directory" };
  }
  return { name: ".agsync/ directories", status: "warn", message: "No .agsync/ directories found" };
}

async function checkEnabledAgents(targetDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];
  const configPath = await findConfigFile(targetDir);
  if (!configPath) return checks;

  try {
    const config = await loadConfigFile(configPath);
    const resolved = resolveAgentConfig(config.agents);
    const enabled = getEnabledAgents(resolved);

    if (enabled.length === 0) {
      checks.push({ name: "Enabled agents", status: "warn", message: "No agents have features enabled" });
    } else {
      for (const name of enabled) {
        const agentCfg = resolved[name];
        const features: string[] = [];
        if (agentCfg.instructions?.enabled) features.push("instructions");
        if (agentCfg.skills?.enabled) features.push("skills");
        if (agentCfg.commands?.enabled) features.push("commands");
        if (agentCfg.mcp?.enabled) features.push("mcp");
        checks.push({
          name: `Agent: ${name}`,
          status: "pass",
          message: features.join(", "),
        });
      }
    }
  } catch {
    checks.push({ name: "Enabled agents", status: "warn", message: "Could not parse config" });
  }

  return checks;
}

export async function runDoctor(targetDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  checks.push(await checkNodeVersion());
  checks.push(await checkConfigExists(targetDir));
  checks.push(await checkAgsyncDirs(targetDir));

  const agentChecks = await checkEnabledAgents(targetDir);
  checks.push(...agentChecks);

  return checks;
}
