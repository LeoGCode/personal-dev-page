import {
  execSync,
  type ExecSyncOptionsWithStringEncoding,
} from "node:child_process";

interface CheckResult {
  passed: boolean;
  output: string;
}

const commands: Record<string, string> = {
  typecheck: "npx tsc --noEmit",
  eslint: "npx eslint --fix",
  prettier: "npx prettier --write .",
  vitest: "npx vitest run",
  build: "npx next build",
};

const results: Record<string, CheckResult> = {};

const execOptions: ExecSyncOptionsWithStringEncoding = {
  stdio: "pipe",
  encoding: "utf-8",
};

console.log("Running all checks...\n");

const promises = Object.entries(commands).map(([name, cmd]) => {
  return new Promise<void>((resolve) => {
    try {
      execSync(cmd, execOptions);
      results[name] = { passed: true, output: "" };
      console.log(`  ${name} passed`);
    } catch (error: unknown) {
      const err = error as {
        stdout?: string;
        stderr?: string;
        message: string;
      };
      const output = err.stdout || err.stderr || err.message;
      results[name] = { passed: false, output };
      console.log(`\n  ${name} failed`);
      console.log(`--- Output of ${name} ---`);
      console.log(output.trim());
      console.log("-".repeat(30));
    }
    resolve();
  });
});

await Promise.all(promises);

// Final summary
console.log("\nSummary:");
console.log("----------");
for (const name of Object.keys(commands)) {
  const { passed } = results[name];
  console.log(`${name}: ${passed ? "PASSED" : "FAILED"}`);
}

if (Object.values(results).some((r) => !r.passed)) {
  process.exit(1);
}
