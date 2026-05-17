import type { CompiledContext, ReviewTarget } from "@/types";

export interface ReviewCompiler {
  target: ReviewTarget;
  outputPath: string;
  compile(contexts: CompiledContext[]): string;
}
