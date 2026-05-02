import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    // Tests hit a real Postgres via the same DATABASE_URL the app uses.
    // Run sequentially so isolated test rows can't collide across files.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15_000,
  },
});
