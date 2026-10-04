// WPlus custom build

import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync } from "node:fs";

const sourceAssetsPlugin = {
  name: "source-assets",
  setup(buildApi) {
    buildApi.onLoad({ filter: /\.(css|html)$/ }, ({ path }) => ({
      contents: `export default ${JSON.stringify(readFileSync(path, "utf8"))}`,
      loader: "js",
    }));
  },
};

function killAllWPlus() {
    try {
        execFileSync("taskkill", [
            "/F",
            "/IM",
            "WPlus.exe",
            "/T"
        ], {
            stdio: "ignore"
        });

        console.log("🛑 Todas las instancias de WPlus.exe han sido cerradas.");
    } catch {
        // No había ninguna instancia ejecutándose
    }
}

// ========================================
// 1. Compilar engine.ts
// ========================================

await build({
  entryPoints: ["src/engine.ts"],
  bundle: true,
  outfile: "dist/engine.js",
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: false,
  plugins: [sourceAssetsPlugin],
});

// ========================================
// 2. Compilar ui.ts
// ========================================

await build({
  entryPoints: ["src/ui.ts"],
  bundle: true,
  outfile: "dist/ui.js",
  format: "iife",
  target: "es2020",
  minify: false,
  sourcemap: false,
  plugins: [sourceAssetsPlugin],
});

// ========================================
// 3. Copiar los JS compilados
// ========================================

copyFileSync("dist/engine.js", "engine.js");
copyFileSync("dist/ui.js", "ui.js");

console.log("Engine/UI compilados y copiados.");

// ========================================
// 4. Crear WPlus.exe
// ========================================

console.log("🛑 Cerrando cualquier instancia de WPlus...");
killAllWPlus();

console.log("📦 Lanzando PyInstaller...");

execFileSync(
  "pyinstaller",
  [
    "--onefile",
    "--windowed",
    "--noconfirm",
    "--clean",

    "--name",
    "WPlus",

    "--add-data",
    "engine.js;.",

    "--add-data",
    "ui.js;.",

    "service/wplus.py",
  ],
  {
    stdio: "inherit",
  }
);

console.log("WPlus.exe generado.");

