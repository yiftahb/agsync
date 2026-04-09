import { BaseAgentConverter } from "@/converters/base";
import { ClaudeCodeConverter } from "@/converters/claude-code";
import { CodexConverter } from "@/converters/codex";
import { CursorConverter } from "@/converters/cursor";
import type { TargetClient } from "@/types";

const converterMap: Record<TargetClient, () => BaseAgentConverter> = {
  "claude-code": () => new ClaudeCodeConverter(),
  codex: () => new CodexConverter(),
  cursor: () => new CursorConverter(),
};

export function getConverter(target: TargetClient): BaseAgentConverter {
  const factory = converterMap[target];
  if (!factory) {
    throw new Error(`Unknown target: ${target}`);
  }
  return factory();
}

export function getAllConverters(targets: TargetClient[]): BaseAgentConverter[] {
  return targets.map(getConverter);
}

export { BaseAgentConverter, ClaudeCodeConverter, CodexConverter, CursorConverter };
