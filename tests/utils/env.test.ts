import { expandEnvValue, expandToolEnv, findEnvReferences } from "@/utils/env";
import type { ToolDefinition } from "@/types";

describe("expandEnvValue", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved.TEST_VAR = process.env.TEST_VAR;
    saved.HOST = process.env.HOST;
    saved.PORT = process.env.PORT;
    process.env.TEST_VAR = "resolved";
    process.env.HOST = "localhost";
    process.env.PORT = "3000";
  });

  afterEach(() => {
    for (const [key, val] of Object.entries(saved)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  it("returns value unchanged when no $ present", () => {
    expect(expandEnvValue("hello")).toBe("hello");
  });

  it("expands $VAR syntax", () => {
    expect(expandEnvValue("$TEST_VAR")).toBe("resolved");
  });

  it("expands ${VAR} syntax", () => {
    expect(expandEnvValue("${TEST_VAR}")).toBe("resolved");
  });

  it("expands variable embedded in string", () => {
    expect(expandEnvValue("prefix-$TEST_VAR-suffix")).toBe("prefix-resolved-suffix");
  });

  it("expands multiple variables", () => {
    expect(expandEnvValue("${HOST}:${PORT}")).toBe("localhost:3000");
  });

  it("throws when env var is not set", () => {
    delete process.env.MISSING_VAR;
    expect(() => expandEnvValue("$MISSING_VAR")).toThrow(
      'Environment variable "MISSING_VAR" is not set'
    );
  });
});

describe("expandToolEnv", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved.SECRET = process.env.SECRET;
    process.env.SECRET = "s3cret";
  });

  afterEach(() => {
    if (saved.SECRET === undefined) delete process.env.SECRET;
    else process.env.SECRET = saved.SECRET;
  });

  it("passes through tools without env", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "cli", command: "echo" },
    ];
    const result = expandToolEnv(tools);
    expect(result).toEqual(tools);
  });

  it("expands env values in tools", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", command: "node", env: { KEY: "$SECRET" } },
    ];
    const result = expandToolEnv(tools);
    expect(result[0].env).toEqual({ KEY: "s3cret" });
  });

  it("includes tool name and key in error message", () => {
    delete process.env.NOPE;
    const tools: ToolDefinition[] = [
      { name: "my-tool", description: "d", type: "mcp", env: { API_KEY: "$NOPE" } },
    ];
    expect(() => expandToolEnv(tools)).toThrow('tool "my-tool", key "API_KEY"');
  });

  it("does not mutate original tools", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", env: { KEY: "$SECRET" } },
    ];
    expandToolEnv(tools);
    expect(tools[0].env!.KEY).toBe("$SECRET");
  });
});

describe("findEnvReferences", () => {
  it("finds $VAR references", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", env: { KEY: "$MY_VAR" } },
    ];
    const refs = findEnvReferences(tools);
    expect(refs).toEqual([{ tool: "t", key: "KEY", varName: "MY_VAR" }]);
  });

  it("finds ${VAR} references", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", env: { KEY: "${MY_VAR}" } },
    ];
    const refs = findEnvReferences(tools);
    expect(refs).toEqual([{ tool: "t", key: "KEY", varName: "MY_VAR" }]);
  });

  it("finds multiple references in one value", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", env: { URL: "${HOST}:${PORT}" } },
    ];
    const refs = findEnvReferences(tools);
    expect(refs).toHaveLength(2);
    expect(refs[0].varName).toBe("HOST");
    expect(refs[1].varName).toBe("PORT");
  });

  it("returns empty for tools without env", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "cli", command: "echo" },
    ];
    expect(findEnvReferences(tools)).toEqual([]);
  });

  it("returns empty for literal values", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", env: { DEBUG: "true" } },
    ];
    expect(findEnvReferences(tools)).toEqual([]);
  });
});
