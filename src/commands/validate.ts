import { loadHierarchicalConfig } from "@/loader/hierarchy";
import { findEnvReferences } from "@/utils/env";
import type { ValidationError, LoadedConfig } from "@/types";

function validateSkillCompleteness(loaded: LoadedConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const skill of loaded.skills) {
    if (!skill.instructions && !skill.source) {
      errors.push({
        file: `skill: ${skill.name}`,
        message: `Must have either "instructions" or "source" (or both)`,
      });
    }
  }
  return errors;
}

function validateCrossReferences(loaded: LoadedConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  const toolNames = new Set(loaded.tools.map((t) => t.name));

  for (const skill of loaded.skills) {
    for (const toolRef of skill.tools ?? []) {
      if (!toolNames.has(toolRef)) {
        errors.push({
          file: `skill: ${skill.name}`,
          message: `References unknown tool "${toolRef}"`,
        });
      }
    }
  }

  return errors;
}

function validateUniqueNames(loaded: LoadedConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  const checkDuplicates = (items: { name: string }[], kind: string) => {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.name)) {
        errors.push({ file: `${kind}: ${item.name}`, message: `Duplicate ${kind} name` });
      }
      seen.add(item.name);
    }
  };

  checkDuplicates(loaded.skills, "skill");
  checkDuplicates(loaded.tools, "tool");
  checkDuplicates(loaded.commands, "command");

  return errors;
}

function validateCommands(loaded: LoadedConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const cmd of loaded.commands) {
    if (!cmd.content.trim()) {
      errors.push({
        file: `command: ${cmd.name}`,
        message: "Command file is empty",
        severity: "warn",
      });
    }
  }

  return errors;
}

function validateEnvReferences(loaded: LoadedConfig): ValidationError[] {
  const refs = findEnvReferences(loaded.tools);
  const warnings: ValidationError[] = [];

  for (const ref of refs) {
    if (process.env[ref.varName] === undefined) {
      warnings.push({
        file: `tool: ${ref.tool}`,
        message: `Env var "${ref.varName}" is not set (key "${ref.key}")`,
        severity: "warn",
      });
    }
  }

  return warnings;
}

export async function runValidate(targetDir: string): Promise<ValidationError[]> {
  const loaded = await loadHierarchicalConfig(targetDir);

  if (!loaded) {
    return [{ file: targetDir, message: "No agsync.yaml found" }];
  }

  const errors: ValidationError[] = [];
  errors.push(...validateUniqueNames(loaded));
  errors.push(...validateSkillCompleteness(loaded));
  errors.push(...validateCrossReferences(loaded));
  errors.push(...validateCommands(loaded));
  errors.push(...validateEnvReferences(loaded));

  return errors;
}
