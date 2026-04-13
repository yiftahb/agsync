import { rm, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { findNearestConfigFile } from "@/loader/config";

async function findBaseDir(targetDir: string): Promise<string> {
  const configPath = await findNearestConfigFile(targetDir);
  if (!configPath) {
    throw new Error("No agsync.yaml found. Run 'agsync init' first");
  }
  return dirname(configPath);
}

export async function runRemove(targetDir: string, skillName: string): Promise<string> {
  const baseDir = await findBaseDir(targetDir);
  const skillDir = resolve(baseDir, ".agsync", "skills", skillName);

  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" not found at ${skillDir}`);
  }

  await rm(skillDir, { recursive: true, force: true });
  return skillDir;
}

export async function runRemoveCommand(targetDir: string, commandName: string): Promise<string> {
  const baseDir = await findBaseDir(targetDir);
  const cmdPath = resolve(baseDir, ".agsync", "commands", `${commandName}.md`);

  try {
    await access(cmdPath);
  } catch {
    throw new Error(`Command "${commandName}" not found at ${cmdPath}`);
  }

  await rm(cmdPath, { force: true });
  return cmdPath;
}

export async function runRemoveTool(targetDir: string, toolName: string): Promise<string> {
  const baseDir = await findBaseDir(targetDir);
  const toolPath = resolve(baseDir, ".agsync", "tools", `${toolName}.yaml`);

  try {
    await access(toolPath);
  } catch {
    throw new Error(`Tool "${toolName}" not found at ${toolPath}`);
  }

  await rm(toolPath, { force: true });
  return toolPath;
}
