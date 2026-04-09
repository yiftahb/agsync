import { rm, access } from "node:fs/promises";
import { resolve } from "node:path";
import { findConfigFile } from "@/loader/config";

export async function runRemove(targetDir: string, skillName: string): Promise<string> {
  const configPath = await findConfigFile(targetDir);
  if (!configPath) {
    throw new Error("No agsync.yaml found. Run 'agsync init' first");
  }

  const skillDir = resolve(targetDir, ".agsync", "skills", skillName);

  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" not found at ${skillDir}`);
  }

  await rm(skillDir, { recursive: true, force: true });

  return skillDir;
}
