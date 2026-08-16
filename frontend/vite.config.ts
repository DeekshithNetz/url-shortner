import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer();

function shortUrlProxy(apiBaseUrl: string): Plugin {
  return {
    name: "short-url-proxy",

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0] || "/";

        // Let Vite handle its own internal requests
        if (
          pathname.startsWith("/@") ||
          pathname.startsWith("/src/") ||
          pathname.startsWith("/node_modules/")
        ) {
          next();
          return;
        }

        // These routes belong to React
        if (
          pathname === "/" ||
          pathname === "/about" ||
          pathname === "/contact"
        ) {
          next();
          return;
        }

        // Everything else is a short URL
        proxy.web(req, res, {
          target: apiBaseUrl,
          changeOrigin: true,
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(),
      shortUrlProxy(env.VITE_API_BASE_URL),
    ],
  };
});