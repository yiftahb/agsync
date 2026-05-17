import { coderabbitCompiler } from "@/review/coderabbit";
import type { ReviewCompiler } from "@/review/types";
import type { ReviewTarget } from "@/types";

const compilers: ReviewCompiler[] = [coderabbitCompiler];

export function getCompiler(target: ReviewTarget): ReviewCompiler | undefined {
  return compilers.find((c) => c.target === target);
}
