import { expandEnvValue, expandMcpEnv, findEnvReferences, parseDotEnv, loadDotEnv } from "@/utils/env";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { McpDefinition } from "@/types";

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

describe("expandMcpEnv", () => {
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
    const servers: McpDefinition[] = [
      { name: "t", description: "d", command: "echo" },
    ];
    const { mcp: result, warnings } = expandMcpEnv(servers);
    expect(result).toEqual(servers);
    expect(warnings).toEqual([]);
  });

  it("expands env values in tools", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", command: "node", env: { KEY: "$SECRET" } },
    ];
    const { mcp: result } = expandMcpEnv(servers);
    expect(result[0].env).toEqual({ KEY: "s3cret" });
  });

  it("returns warnings for missing env vars", () => {
    delete process.env.NOPE;
    const servers: McpDefinition[] = [
      { name: "my-tool", description: "d", env: { API_KEY: "$NOPE" } },
    ];
    const { mcp: result, warnings } = expandMcpEnv(servers);
    expect(result[0].env).toEqual({ API_KEY: "" });
    expect(warnings).toEqual([{ server: "my-tool", key: "API_KEY", varName: "NOPE" }]);
  });

  it("does not mutate original tools", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", env: { KEY: "$SECRET" } },
    ];
    expandMcpEnv(servers);
    expect(servers[0].env!.KEY).toBe("$SECRET");
  });

  it("expands header values", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", type: "http", url: "https://example.com", headers: { Authorization: "Bearer $SECRET" } },
    ];
    const { mcp: result } = expandMcpEnv(servers);
    expect(result[0].headers).toEqual({ Authorization: "Bearer s3cret" });
  });

  it("returns warnings for missing header vars", () => {
    delete process.env.MISSING_TOKEN;
    const servers: McpDefinition[] = [
      { name: "api", description: "d", type: "http", url: "https://example.com", headers: { Authorization: "Bearer $MISSING_TOKEN" } },
    ];
    const { mcp: result, warnings } = expandMcpEnv(servers);
    expect(result[0].headers).toEqual({ Authorization: "Bearer " });
    expect(warnings).toEqual([{ server: "api", key: "Authorization", varName: "MISSING_TOKEN" }]);
  });

  it("passes through http tools without headers or env", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", type: "http", url: "https://example.com" },
    ];
    const { mcp: result, warnings } = expandMcpEnv(servers);
    expect(result).toEqual(servers);
    expect(warnings).toEqual([]);
  });

  it("does not mutate original headers", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", type: "http", url: "https://example.com", headers: { Authorization: "$SECRET" } },
    ];
    expandMcpEnv(servers);
    expect(servers[0].headers!.Authorization).toBe("$SECRET");
  });

});

describe("findEnvReferences", () => {
  it("finds $VAR references", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", env: { KEY: "$MY_VAR" } },
    ];
    const refs = findEnvReferences(servers);
    expect(refs).toEqual([{ server: "t", key: "KEY", varName: "MY_VAR" }]);
  });

  it("finds ${VAR} references", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", env: { KEY: "${MY_VAR}" } },
    ];
    const refs = findEnvReferences(servers);
    expect(refs).toEqual([{ server: "t", key: "KEY", varName: "MY_VAR" }]);
  });

  it("finds multiple references in one value", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", env: { URL: "${HOST}:${PORT}" } },
    ];
    const refs = findEnvReferences(servers);
    expect(refs).toHaveLength(2);
    expect(refs[0].varName).toBe("HOST");
    expect(refs[1].varName).toBe("PORT");
  });

  it("returns empty for tools without env", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", command: "echo" },
    ];
    expect(findEnvReferences(servers)).toEqual([]);
  });

  it("returns empty for literal values", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", env: { DEBUG: "true" } },
    ];
    expect(findEnvReferences(servers)).toEqual([]);
  });

  it("ignores $VAR references in args", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", args: ["--key", "$API_KEY"] },
    ];
    const refs = findEnvReferences(servers);
    expect(refs).toEqual([]);
  });

  it("finds references in headers", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", type: "http", url: "https://example.com", headers: { Authorization: "Bearer $API_TOKEN" } },
    ];
    const refs = findEnvReferences(servers);
    expect(refs).toEqual([{ server: "t", key: "Authorization", varName: "API_TOKEN" }]);
  });

  it("finds references in both env and headers", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", env: { KEY: "$ENV_VAR" }, headers: { "X-Key": "$HEADER_VAR" } },
    ];
    const refs = findEnvReferences(servers);
    expect(refs).toHaveLength(2);
    expect(refs[0]).toEqual({ server: "t", key: "KEY", varName: "ENV_VAR" });
    expect(refs[1]).toEqual({ server: "t", key: "X-Key", varName: "HEADER_VAR" });
  });

  it("returns empty for headers with literal values", () => {
    const servers: McpDefinition[] = [
      { name: "t", description: "d", type: "http", url: "https://example.com", headers: { "Content-Type": "application/json" } },
    ];
    expect(findEnvReferences(servers)).toEqual([]);
  });
});

describe("parseDotEnv", () => {
  it("parses simple KEY=VALUE pairs", () => {
    expect(parseDotEnv("FOO=bar\nBAZ=qux")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("ignores comments and blank lines", () => {
    const content = "# comment\n\nKEY=val\n  # another comment\n";
    expect(parseDotEnv(content)).toEqual({ KEY: "val" });
  });

  it("strips double quotes from values", () => {
    expect(parseDotEnv('KEY="hello world"')).toEqual({ KEY: "hello world" });
  });

  it("strips single quotes from values", () => {
    expect(parseDotEnv("KEY='hello world'")).toEqual({ KEY: "hello world" });
  });

  it("handles values with = signs", () => {
    expect(parseDotEnv("URL=postgres://host:5432/db?opt=1")).toEqual({
      URL: "postgres://host:5432/db?opt=1",
    });
  });

  it("handles empty values", () => {
    expect(parseDotEnv("EMPTY=")).toEqual({ EMPTY: "" });
  });

  it("ignores lines without =", () => {
    expect(parseDotEnv("INVALID_LINE")).toEqual({});
  });
});

describe("loadDotEnv", () => {
  let tmpDir: string;
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "env-test-"));
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
    for (const [key, val] of Object.entries(savedEnv)) {
      if (val === undefined) delete process.env[key];
      else process.env[key] = val;
    }
  });

  it("loads .env into process.env", () => {
    savedEnv.DOTENV_TEST_A = process.env.DOTENV_TEST_A;
    delete process.env.DOTENV_TEST_A;

    writeFileSync(join(tmpDir, ".env"), "DOTENV_TEST_A=from_file");
    const vars = loadDotEnv(tmpDir);

    expect(vars).toEqual({ DOTENV_TEST_A: "from_file" });
    expect(process.env.DOTENV_TEST_A).toBe("from_file");
  });

  it("does not overwrite existing process.env values", () => {
    savedEnv.DOTENV_TEST_B = process.env.DOTENV_TEST_B;
    process.env.DOTENV_TEST_B = "original";

    writeFileSync(join(tmpDir, ".env"), "DOTENV_TEST_B=overridden");
    loadDotEnv(tmpDir);

    expect(process.env.DOTENV_TEST_B).toBe("original");
  });

  it("returns empty object when no .env exists", () => {
    expect(loadDotEnv(tmpDir)).toEqual({});
  });
});
