import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { AntDesignVueResolver } from "unplugin-vue-components/resolvers";
import Components from "unplugin-vue-components/vite";
import path from "path";
// import markdown from "vite-plugin-markdown"
// https://vite.dev/config/
export default defineConfig({
  server: {
    // proxy:{
    //   "/api":{
    //     target:"http://localhost:3000",
    //     changeOrigin:true,
    //     rewrite:(path)=>path.replace("/^\/api/","")
    //   }
    // }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    vue(),
    // markdown(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false,
        }),
      ],
    }),
  ],
  optimizeDeps: {
    include: ['prismjs']
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/style/variables.scss" as *;`,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "js/[name]-[hash].js",
        chunkFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name ?? "";
          if (/\.css$/i.test(name)) {
            return "css/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
