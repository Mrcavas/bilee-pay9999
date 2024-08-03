import { defineConfig } from "@solidjs/start/config"
import mkcert from "vite-plugin-mkcert"

export default defineConfig({
  server: {
    preset: "vercel",
  },
})
