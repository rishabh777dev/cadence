import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@cadence-voice/validations": resolve(
        __dirname,
        "../../packages/validations/src/index.ts",
      ),
      "cadence-voice": resolve(__dirname, "../../packages/sdk/src/index.ts"),
      "@cadence-voice/utils": resolve(
        __dirname,
        "../../packages/utils/src/index.ts",
      ),
      "@cadence-voice/stt": resolve(
        __dirname,
        "../../packages/stt/src/index.ts",
      ),
    },
  },
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 10_000,
    pool: "forks",
  },
});
