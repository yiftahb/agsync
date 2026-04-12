import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  readLockFile,
  writeLockFile,
  isLocked,
  getLockEntry,
} from "@/lock/lock";
import { computeIntegrity } from "@/lock/integrity";
import type { LockFile } from "@/types";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "agsync-lock-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

const SAMPLE_LOCK: LockFile = {
  lockVersion: 1,
  sources: {
    "code-reviewer": {
      registry: "github",
      version: "v1.2.0",
      resolved: "abc123",
      integrity: "sha256:aaa",
      fetchedAt: "2026-04-10T12:00:00Z",
    },
  },
  extends: {
    "github:acme/base@v2.0.0": {
      registry: "github",
      version: "v2.0.0",
      resolved: "def456",
      integrity: "sha256:bbb",
      fetchedAt: "2026-04-10T12:00:00Z",
    },
  },
};

describe("lock file read/write", () => {
  it("returns null when no lock file exists", async () => {
    const result = await readLockFile(tempDir);
    expect(result).toBeNull();
  });

  it("writes and reads back a lock file", async () => {
    await writeLockFile(tempDir, SAMPLE_LOCK);
    const result = await readLockFile(tempDir);
    expect(result).not.toBeNull();
    expect(result!.lockVersion).toBe(1);
    expect(result!.sources["code-reviewer"].version).toBe("v1.2.0");
    expect(result!.extends["github:acme/base@v2.0.0"].resolved).toBe("def456");
  });

  it("writes sorted keys", async () => {
    const lock: LockFile = {
      lockVersion: 1,
      sources: {
        "z-skill": { registry: "github", version: "v1", resolved: "z", integrity: "sha256:z", fetchedAt: "" },
        "a-skill": { registry: "github", version: "v1", resolved: "a", integrity: "sha256:a", fetchedAt: "" },
      },
      extends: {},
    };
    const path = await writeLockFile(tempDir, lock);
    const content = await readFile(path, "utf-8");
    const aIdx = content.indexOf("a-skill");
    const zIdx = content.indexOf("z-skill");
    expect(aIdx).toBeLessThan(zIdx);
  });

  it("includes header comment", async () => {
    const path = await writeLockFile(tempDir, SAMPLE_LOCK);
    const content = await readFile(path, "utf-8");
    expect(content).toMatch(/^# auto-generated/);
  });
});

describe("isLocked", () => {
  it("returns true when entry exists with matching version", () => {
    expect(isLocked(SAMPLE_LOCK, "sources", "code-reviewer", "v1.2.0")).toBe(true);
  });

  it("returns false when version does not match", () => {
    expect(isLocked(SAMPLE_LOCK, "sources", "code-reviewer", "v2.0.0")).toBe(false);
  });

  it("returns false when entry does not exist", () => {
    expect(isLocked(SAMPLE_LOCK, "sources", "nonexistent", "v1.0.0")).toBe(false);
  });
});

describe("getLockEntry", () => {
  it("returns the entry when it exists", () => {
    const entry = getLockEntry(SAMPLE_LOCK, "sources", "code-reviewer");
    expect(entry).toBeDefined();
    expect(entry!.version).toBe("v1.2.0");
  });

  it("returns undefined when entry does not exist", () => {
    expect(getLockEntry(SAMPLE_LOCK, "sources", "missing")).toBeUndefined();
  });
});

describe("computeIntegrity", () => {
  it("returns a sha256 prefixed hash", () => {
    const result = computeIntegrity("hello");
    expect(result).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("produces consistent results", () => {
    const a = computeIntegrity("test content");
    const b = computeIntegrity("test content");
    expect(a).toBe(b);
  });

  it("produces different hashes for different content", () => {
    const a = computeIntegrity("content a");
    const b = computeIntegrity("content b");
    expect(a).not.toBe(b);
  });
});
