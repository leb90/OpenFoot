import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

function normalizeModuleId(id: string): string {
  return id.replaceAll("\\", "/");
}

function isNodeModulePackage(id: string, packageName: string): boolean {
  const normalizedId = normalizeModuleId(id);
  const packagePath = `/node_modules/${packageName}`;

  return (
    normalizedId.includes(`${packagePath}/`) ||
    normalizedId.endsWith(packagePath)
  );
}

function matchesAnyPackage(id: string, packageNames: string[]): boolean {
  return packageNames.some((packageName) => isNodeModulePackage(id, packageName));
}

function isAppModule(id: string, modulePath: string): boolean {
  return normalizeModuleId(id).endsWith(modulePath);
}

function matchesAnyAppModule(id: string, modulePaths: string[]): boolean {
  return modulePaths.some((modulePath) => isAppModule(id, modulePath));
}

function manualChunks(id: string): string | undefined {
  if (matchesAnyAppModule(id, ["/src/lib/countries.ts"])) {
    return "countries";
  }

  if (id.indexOf("node_modules") === -1) {
    return undefined;
  }

  if (matchesAnyPackage(id, ["i18n-iso-countries"])) {
    return "countries";
  }

  if (matchesAnyPackage(id, ["react-router", "react-router-dom"])) {
    return "router";
  }

  if (
    matchesAnyPackage(id, [
      "i18next",
      "react-i18next",
      "i18next-resources-to-backend",
    ])
  ) {
    return "i18n";
  }

  if (isNodeModulePackage(id, "lucide-react")) {
    return "icons";
  }

  if (matchesAnyPackage(id, ["react", "react-dom", "scheduler"])) {
    return "react-vendor";
  }

  return undefined;
}

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "server/**/*.test.js"],
    setupFiles: ["src/test-setup.ts"],
    coverage: {
      exclude: [
        "src/i18n/locales/**",
        "src/**/*.test.{ts,tsx}",
        "server/**/*.test.js",
        "src/test-setup.ts",
      ],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:
          process.env.LOCAL_API_URL ??
          `http://localhost:${process.env.API_PORT ?? "3001"}`,
        changeOrigin: true,
      },
    },
  },
}));
