import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
export default function setup() {
  for (const suffix of ["", "-wal", "-shm", "-journal"])
    rmSync(`data/e2e.db${suffix}`, { force: true });
  const env = {
    ...process.env,
    DATABASE_URL: "file:./data/e2e.db",
    ACCOUNT_PASSWORD: "test-only-password-2026",
  };
  execFileSync("pnpm", ["db:migrate"], { env, stdio: "pipe" });
  for (const [email, name] of [
    ["examiner@test.invalid", "Test Examiner"],
    ["other@test.invalid", "Other Examiner"],
  ])
    execFileSync("pnpm", ["account:create", email, name], {
      env,
      stdio: "pipe",
    });
}
