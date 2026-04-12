import { createHash } from "node:crypto";

export function computeIntegrity(content: string): string {
  return "sha256:" + createHash("sha256").update(content, "utf-8").digest("hex");
}
