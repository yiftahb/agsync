import { GitHubRegistry } from "@/registries/github";
import { ClawHubRegistry } from "@/registries/clawhub";
import type { SkillRegistry } from "@/types";

const registries: Record<string, SkillRegistry> = {
  github: new GitHubRegistry(),
  clawhub: new ClawHubRegistry(),
};

export function getRegistry(name: string): SkillRegistry {
  const registry = registries[name];
  if (!registry) {
    throw new Error(`Unknown skill registry: "${name}". Supported: ${Object.keys(registries).join(", ")}`);
  }
  return registry;
}
