import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 5173, // fijo en 5173
    open: true  // abre navegador al arrancar
  }
});
