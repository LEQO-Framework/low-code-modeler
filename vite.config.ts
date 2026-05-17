import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      manifest: {
        name: "Low-Code Modeler",
        short_name: "Low-Code Modeler",
        display: "standalone",
        background_color: "#ffffff",
        lang: "en",
        scope: "/",
        start_url: "/index.html",
        icons: [],
        theme_color: "#ffffff",
      },
    }),
  ],
});
