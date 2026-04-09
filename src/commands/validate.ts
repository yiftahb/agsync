import { loadHierarchicalConfig } from "@/loader/hierarchy";
import type { ValidationError, LoadedConfig } from "@/types";

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

  return errors;
}

export async function runValidate(targetDir: string): Promise<ValidationError[]> {
  const loaded = await loadHierarchicalConfig(targetDir);

  if (!loaded) {
    return [{ file: targetDir, message: "No agsync.yaml found" }];
  }

  const errors: ValidationError[] = [];
  errors.push(...validateUniqueNames(loaded));
  errors.push(...validateCrossReferences(loaded));

  return errors;
}
