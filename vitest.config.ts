import { defineConfig } from "vitest/config"
import path from "node:path"

// L'alias "@" deve puntare alla radice come in tsconfig, altrimenti le prove
// non troverebbero i moduli e un rosso d'ambiente sembrerebbe un rosso di codice.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
})
