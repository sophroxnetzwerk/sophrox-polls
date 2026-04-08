import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { ViteMcp } from 'vite-plugin-mcp'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), ViteMcp()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
})
