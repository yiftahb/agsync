import { rm, access } from "node:fs/promises";
import { resolve } from "node:path";
import { findNearestAgsyncDir, findNearestConfigFile } from "@/loader/config";
import { dirname } from "node:path";

async function resolveAgsyncDir(targetDir: string): Promise<string> {
  const agsyncDir = await findNearestAgsyncDir(targetDir);
  if (agsyncDir) return agsyncDir;

  const configPath = await findNearestConfigFile(targetDir);
  if (configPath) return resolve(dirname(configPath), ".agsync");

  throw new Error("No .agsync/ directory or agsync.yaml found. Run 'agsync init' first");
}

export async function runRemove(targetDir: string, skillName: string): Promise<string> {
  const agsyncDir = await resolveAgsyncDir(targetDir);
  const skillDir = resolve(agsyncDir, "skills", skillName);

  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" not found at ${skillDir}`);
  }

  await rm(skillDir, { recursive: true, force: true });
  return skillDir;
}

export async function runRemoveCommand(targetDir: string, commandName: string): Promise<string> {
  const agsyncDir = await resolveAgsyncDir(targetDir);
  const cmdPath = resolve(agsyncDir, "commands", `${commandName}.md`);

  try {
    await access(cmdPath);
  } catch {
    throw new Error(`Command "${commandName}" not found at ${cmdPath}`);
  }

  await rm(cmdPath, { force: true });
  return cmdPath;
}

export async function runRemoveTool(targetDir: string, toolName: string): Promise<string> {
  const agsyncDir = await resolveAgsyncDir(targetDir);
  const toolPath = resolve(agsyncDir, "tools", `${toolName}.yaml`);

  try {
    await access(toolPath);
  } catch {
    throw new Error(`Tool "${toolName}" not found at ${toolPath}`);
  }

  await rm(toolPath, { force: true });
  return toolPath;
}
