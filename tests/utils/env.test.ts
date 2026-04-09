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
    expect(expandEnvValue("hello").result).toBe("hello");
    expect(expandEnvValue("hello").missing).toEqual([]);
  });

  it("expands $VAR syntax", () => {
    expect(expandEnvValue("$TEST_VAR").result).toBe("resolved");
  });

  it("expands ${VAR} syntax", () => {
    expect(expandEnvValue("${TEST_VAR}").result).toBe("resolved");
  });

  it("expands variable embedded in string", () => {
    expect(expandEnvValue("prefix-$TEST_VAR-suffix").result).toBe("prefix-resolved-suffix");
  });

  it("expands multiple variables", () => {
    expect(expandEnvValue("${HOST}:${PORT}").result).toBe("localhost:3000");
  });

  it("returns empty string and reports missing vars", () => {
    delete process.env.MISSING_VAR;
    const { result, missing } = expandEnvValue("$MISSING_VAR");
    expect(result).toBe("");
    expect(missing).toEqual(["MISSING_VAR"]);
  });

  it("reports multiple missing vars", () => {
    delete process.env.A_VAR;
    delete process.env.B_VAR;
    const { result, missing } = expandEnvValue("${A_VAR}:${B_VAR}");
    expect(result).toBe(":");
    expect(missing).toEqual(["A_VAR", "B_VAR"]);
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
    const { tools: result, warnings } = expandToolEnv(tools);
    expect(result).toEqual(tools);
    expect(warnings).toEqual([]);
  });

  it("expands env values in tools", () => {
    const tools: ToolDefinition[] = [
      { name: "t", description: "d", type: "mcp", command: "node", env: { KEY: "$SECRET" } },
    ];
    const { tools: result } = expandToolEnv(tools);
    expect(result[0].env).toEqual({ KEY: "s3cret" });
  });

  it("returns warnings for missing env vars", () => {
    delete process.env.NOPE;
    const tools: ToolDefinition[] = [
      { name: "my-tool", description: "d", type: "mcp", env: { API_KEY: "$NOPE" } },
    ];
    const { tools: result, warnings } = expandToolEnv(tools);
    expect(result[0].env).toEqual({ API_KEY: "" });
    expect(warnings).toEqual([{ tool: "my-tool", key: "API_KEY", varName: "NOPE" }]);
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
