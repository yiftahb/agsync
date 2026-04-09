import { findConfigFile } from "@/loader/config";
import { collectConfigChain } from "@/loader/hierarchy";
import { getAllConverters } from "@/converters";
import type { DoctorCheck, TargetClient } from "@/types";

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

async function checkHierarchy(targetDir: string): Promise<DoctorCheck> {
  const chain = await collectConfigChain(targetDir);
  if (chain.length > 1) {
    return { name: "Config hierarchy", status: "pass", message: `${chain.length} configs in chain` };
  }
  if (chain.length === 1) {
    return { name: "Config hierarchy", status: "pass", message: "Single config (no parent)" };
  }
  return { name: "Config hierarchy", status: "warn", message: "No configs found in hierarchy" };
}

async function checkTargetClients(targets: TargetClient[]): Promise<DoctorCheck[]> {
  const converters = getAllConverters(targets);
  const checks: DoctorCheck[] = [];

  for (const converter of converters) {
    const detected = await converter.detect();
    if (detected) {
      checks.push({ name: `${converter.name} CLI`, status: "pass", message: "Installed" });
    } else {
      checks.push({ name: `${converter.name} CLI`, status: "warn", message: "Not found in PATH" });
    }
  }

  return checks;
}

export async function runDoctor(targetDir: string): Promise<DoctorCheck[]> {
  const checks: DoctorCheck[] = [];

  checks.push(await checkNodeVersion());
  checks.push(await checkConfigExists(targetDir));
  checks.push(await checkHierarchy(targetDir));

  const defaultTargets: TargetClient[] = ["claude-code", "codex", "cursor"];
  const clientChecks = await checkTargetClients(defaultTargets);
  checks.push(...clientChecks);

  return checks;
}
