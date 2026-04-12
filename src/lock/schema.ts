import { z } from "zod";

export const lockEntrySchema = z.object({
  registry: z.string(),
  version: z.string(),
  resolved: z.string(),
  integrity: z.string(),
  fetchedAt: z.string(),
});

export const lockFileSchema = z.object({
  lockVersion: z.literal(1),
  sources: z.record(lockEntrySchema).default({}),
  extends: z.record(lockEntrySchema).default({}),
});

export type LockEntry = z.infer<typeof lockEntrySchema>;
export type LockFile = z.infer<typeof lockFileSchema>;
