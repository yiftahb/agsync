import { mkdir, writeFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { stringify as toYaml } from "yaml";

const SAMPLE_CONFIG = {
  version: "1",
  targets: ["claude-code", "codex", "cursor"],
  skills: [{ path: ".agsync/skills/*" }],
  tools: [{ path: ".agsync/tools/*.yaml" }],
};

const SAMPLE_SKILL = {
  name: "default",
  description: "Default skill for this project",
  instructions: "You are a helpful coding assistant for this project.",
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function runInit(targetDir: string): Promise<string[]> {
  const created: string[] = [];

  const configPath = resolve(targetDir, "agsync.yaml");
  if (await fileExists(configPath)) {
    throw new Error("agsync.yaml already exists in this directory");
  }

  const dirs = [".agsync/skills", ".agsync/tools"];
  for (const dir of dirs) {
    const dirPath = resolve(targetDir, dir);
    await mkdir(dirPath, { recursive: true });
    created.push(`${dir}/`);
  }

  await writeFile(configPath, toYaml(SAMPLE_CONFIG), "utf-8");
  created.push("agsync.yaml");

  const skillDir = resolve(targetDir, ".agsync", "skills", "default");
  await mkdir(skillDir, { recursive: true });
  const skillPath = resolve(skillDir, "default.yaml");
  await writeFile(skillPath, toYaml(SAMPLE_SKILL), "utf-8");
  created.push(".agsync/skills/default/default.yaml");

  return created;
}
