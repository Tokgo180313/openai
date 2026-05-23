import { defineStore } from "pinia";

export const uploadStore = defineStore("store", {
  getters: {
    getUploadSaveUrl(): string {
      const base = String(import.meta.env.VITE_APP_BASIC_URL ?? "").replace(
        /\/$/,
        "",
      );
      return `${base}/upload-file/save`;
    },
    buildDownloadUrl() {
      return (fileId: number | string) => {
        const base = String(import.meta.env.VITE_APP_BASIC_URL ?? "").replace(
          /\/$/,
          "",
        );
        return `${base}/upload-file/${fileId}/download`;
      };
    },
  },
});