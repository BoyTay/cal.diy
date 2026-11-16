import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const defaultSeeds = [1001, 2024, 3030, 4242, 5555, 6006, 7777, 8888, 9999, 12345];
const passthroughArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--seeds="));
const seedsArg = process.argv.find((arg) => arg.startsWith("--seeds="));
const seeds = seedsArg
  ? seedsArg
      .slice("--seeds=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : defaultSeeds;

console.log(`Running MBT across ${seeds.length} seeds: ${seeds.join(", ")}`);
const results = [];

for (const seed of seeds) {
  const startTime = Date.now();
  const run = spawnSync(
    process.execPath,
    ["scripts/run-issue-06-mbt.mjs", "--seed", String(seed), ...passthroughArgs],
    {
      encoding: "utf8",
      stdio: ["inherit", "pipe", "pipe"],
    }
  );
  const elapsed = Date.now() - startTime;
  const stdout = run.stdout?.trim() ?? "";
  const stderr = run.stderr?.trim() ?? "";

  const evidenceMatch = stdout.match(/Evidence: (.+\.json)/);
  let evidenceData = null;
  if (evidenceMatch && evidenceMatch[1]) {
    try {
      evidenceData = JSON.parse(readFileSync(evidenceMatch[1], "utf8"));
    } catch {
      // Ignore read errors
    }
  }

  const pathLength = evidenceData?.path?.length ?? 0;
  const uniqueEdges = new Set(evidenceData?.path?.filter((s) => s.startsWith("e_")) ?? []).size;
  const uniqueVertices = new Set(evidenceData?.path?.filter((s) => s.startsWith("v_")) ?? []).size;
  const result = evidenceData?.result ?? (run.status === 0 ? "completed" : "failed");

  results.push({
    seed: String(seed),
    steps: pathLength,
    edges: `${uniqueEdges}/12`,
    vertices: `${uniqueVertices}/7`,
    result,
    durationMs: elapsed,
    exitCode: run.status,
  });

  console.log(
    `[Seed ${seed}] Steps: ${pathLength} | Edges: ${uniqueEdges}/12 | Vertices: ${uniqueVertices}/7 | Result: ${result} (${elapsed}ms)`
  );
  if (run.status !== 0 && stderr) {
    console.error(`  Error: ${stderr}`);
  }
}

console.log("\n### Summary Table");
console.log("| Seed | Steps | Edges | Vertices | Result | Duration |");
console.log("| --- | --- | --- | --- | --- | --- |");
for (const r of results) {
  console.log(
    `| ${r.seed} | ${r.steps} | ${r.edges} | ${r.vertices} | ${r.result} | ${r.durationMs}ms |`
  );
}

const failed = results.filter((r) => r.exitCode !== 0 && r.result === "fail");
if (failed.length > 0) {
  console.error(`\n${failed.length} of ${results.length} runs failed.`);
  process.exit(1);
} else {
  console.log(`\nAll ${results.length} runs completed.`);
}
