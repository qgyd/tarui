import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import AutoImport from "unplugin-auto-import/vite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.TAURI_DEV_HOST;
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8"));

// https://vite.dev/config/
export default defineConfig(async () => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    AutoImport({
      imports: [
        "react",
        {
          "react-router": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "Outlet",
            "RouterProvider",
          ],
          "antd": [
            "message",
            "notification",
            "Modal",
            "Button",
            "Card",
            "Space",
            "Typography",
            "Divider",
            "Row",
            "Col",
            "Statistic",
            "Tag",
            "Alert",
            "ConfigProvider",
            "Layout",
            "Menu",
            "theme",
          ],
          "@ant-design/icons": [
            "RocketOutlined",
            "SettingOutlined",
            "ThunderboltOutlined",
            "HomeOutlined",
            "InfoCircleOutlined",
            "DashboardOutlined",
          ],
        },
      ],
      dts: "src/auto-imports.d.ts",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
