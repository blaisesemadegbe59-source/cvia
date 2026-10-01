import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"], alias: { "server-only": path.resolve("tests/server-only-stub.ts") } },
  resolve: { alias: { "@": path.resolve("src") } },
});
