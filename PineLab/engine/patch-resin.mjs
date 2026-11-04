import { readFileSync, writeFileSync } from "node:fs";

const path = new URL("./vendor/resin/src/transpiler/analyzer/call-expr.ts", import.meta.url);
const source = readFileSync(path, "utf8");
const before = `        const numOr = (name: string, dflt: number): number => {
          const a = plotArg(name);
          return a !== undefined && a.value.kind === "NumberLiteral" ? a.value.value : dflt;
        };`;
const after = `        const numOr = (name: string, dflt: number): number => {
          const a = plotArg(name);
          if (a === undefined) return dflt;
          if (a.value.kind === "NumberLiteral") return a.value.value;
          // Negative numeric literals are parsed as UnaryOp("-", NumberLiteral).
          if (a.value.kind === "UnaryOp" && a.value.op === "-" && a.value.operand.kind === "NumberLiteral") {
            return -a.value.operand.value;
          }
          return dflt;
        };`;
if (source.includes(after)) {
  console.log("Resin negative numeric plot metadata patch already present.");
} else if (source.includes(before)) {
  writeFileSync(path, source.replace(before, after));
  console.log("Applied Resin negative numeric plot metadata patch.");
} else {
  throw new Error("Resin analyzer patch context changed; refusing an unsafe patch.");
}
