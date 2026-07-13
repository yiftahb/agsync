import { mergeContextChain, type ChainLevel } from "@/context/merger";
import type { PatternDefinition, StructuredInstructions } from "@/types";

function level(scope: string, instructions: Partial<StructuredInstructions>): ChainLevel {
  return {
    scope,
    instructions: { guidelines: [], applyPatterns: [], ...instructions },
  };
}

describe("mergeContextChain", () => {
  it("two-level fold scopes package paths and keeps root global", () => {
    const { context } = mergeContextChain(
      [
        level("", { guidelines: [{ id: "no-comments", rule: "self-explanatory code" }] }),
        level("frontend", { guidelines: [{ id: "fe-only", rule: "use design tokens" }] }),
      ],
      []
    );

    expect(context.scope).toBe("frontend");
    const root = context.guidelines.find((g) => g.id === "no-comments")!;
    expect(root.paths).toEqual(["**"]);
    expect(root.source).toBe("root");
    const pkg = context.guidelines.find((g) => g.id === "fe-only")!;
    expect(pkg.paths).toEqual(["frontend/**"]);
    expect(pkg.source).toBe("package");
  });

  it("three-level cascade: nearest scope wins on id collision with override", () => {
    const { context, warnings } = mergeContextChain(
      [
        level("", { guidelines: [{ id: "logging", rule: "console.log ok" }] }),
        level("backend", {
          guidelines: [{ id: "logging", rule: "use structured logger", override: true }],
        }),
        level("backend/service-a", { guidelines: [{ id: "svc", rule: "expose /health" }] }),
      ],
      []
    );

    const logging = context.guidelines.find((g) => g.id === "logging")!;
    expect(logging.rule).toBe("use structured logger");
    expect(logging.paths).toEqual(["backend/**"]);
    expect(logging.overrideOf).toBe("logging");
    const svc = context.guidelines.find((g) => g.id === "svc")!;
    expect(svc.paths).toEqual(["backend/service-a/**"]);
    expect(warnings).toEqual([]);
  });

  it("warns when override:true has no ancestor rule", () => {
    const { warnings } = mergeContextChain(
      [level("backend", { guidelines: [{ id: "x", rule: "r", override: true }] })],
      []
    );
    expect(warnings).toContain('Guideline "x" has override:true but no matching parent rule');
  });

  it("warns when an id is redefined without override:true", () => {
    const { context, warnings } = mergeContextChain(
      [
        level("", { guidelines: [{ id: "dup", rule: "root" }] }),
        level("backend", { guidelines: [{ id: "dup", rule: "backend" }] }),
      ],
      []
    );
    expect(context.guidelines.find((g) => g.id === "dup")!.rule).toBe("backend");
    expect(warnings).toContain('Guideline "dup" duplicated without override:true — nearest scope used');
  });

  it("resolves a pattern guideline's own path relative to the applying scope", () => {
    const patterns: PatternDefinition[] = [
      {
        id: "rest-api",
        guidelines: [
          { id: "thin-controllers", rule: "no business logic in controllers", paths: ["controllers/**"] },
          { id: "no-raw-sql", rule: "no raw SQL in services", paths: ["services/**"] },
        ],
      },
    ];
    const { context } = mergeContextChain(
      [level("backend", { applyPatterns: [{ id: "rest-api" }] })],
      patterns
    );

    const c = context.guidelines.find((g) => g.id === "rest-api:thin-controllers")!;
    expect(c.paths).toEqual(["backend/controllers/**"]);
    const s = context.guidelines.find((g) => g.id === "rest-api:no-raw-sql")!;
    expect(s.paths).toEqual(["backend/services/**"]);
    expect(context.patterns).toEqual(["rest-api"]);
  });

  it("resolves the same pattern independently at two levels", () => {
    const patterns: PatternDefinition[] = [
      { id: "p", guidelines: [{ id: "g", rule: "r", paths: ["controllers/**"] }] },
    ];
    const backend = mergeContextChain(
      [level("backend", { applyPatterns: [{ id: "p" }] })],
      patterns
    ).context;
    const domain = mergeContextChain(
      [level("backend/domain-x", { applyPatterns: [{ id: "p" }] })],
      patterns
    ).context;

    expect(backend.guidelines.find((g) => g.id === "p:g")!.paths).toEqual(["backend/controllers/**"]);
    expect(domain.guidelines.find((g) => g.id === "p:g")!.paths).toEqual(["backend/domain-x/controllers/**"]);
  });

  it("keeps the ** sentinel global at a nested level", () => {
    const patterns: PatternDefinition[] = [
      { id: "p", guidelines: [{ id: "g", rule: "r", paths: ["**"] }] },
    ];
    const { context } = mergeContextChain(
      [level("backend/service-a", { applyPatterns: [{ id: "p" }] })],
      patterns
    );
    expect(context.guidelines.find((g) => g.id === "p:g")!.paths).toEqual(["**"]);
  });

  it("uses apply_patterns.paths verbatim, overriding guideline own paths", () => {
    const patterns: PatternDefinition[] = [
      { id: "p", guidelines: [{ id: "g", rule: "r", paths: ["controllers/**"] }] },
    ];
    const { context } = mergeContextChain(
      [level("backend", { applyPatterns: [{ id: "p", paths: ["custom/**"] }] })],
      patterns
    );
    expect(context.guidelines.find((g) => g.id === "p:g")!.paths).toEqual(["custom/**"]);
  });

  it("falls back to the level default when a guideline has no own paths", () => {
    const { context } = mergeContextChain(
      [level("backend/service-a", { guidelines: [{ id: "g", rule: "r" }] })],
      []
    );
    expect(context.guidelines.find((g) => g.id === "g")!.paths).toEqual(["backend/service-a/**"]);
  });

  it("warns and skips a missing pattern", () => {
    const { context, warnings } = mergeContextChain(
      [level("backend", { applyPatterns: [{ id: "ghost" }] })],
      []
    );
    expect(warnings).toContain('Pattern "ghost" not found');
    expect(context.patterns).toEqual([]);
  });

  it("concatenates HLD in chain order", () => {
    const { context } = mergeContextChain(
      [
        level("", { hld: "root arch" }),
        level("backend", { hld: "backend arch" }),
      ],
      []
    );
    expect(context.hld).toBe("root arch\n\nbackend arch");
  });
});
