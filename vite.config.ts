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
});
