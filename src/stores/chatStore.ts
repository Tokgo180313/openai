import { defineStore } from "pinia";

export const useChatStore = defineStore("store", {
  state: () => ({
    documentId: null as string | null,
    titleId: null as string | null,
  }),
  getters: {
    getDocumentId: (state) => state.documentId,
    getTitleId: (state) => state.titleId,
  },
  persist: true,
  actions: {
    updateDocument(id: string) {
      this.documentId = id;
    },
    updateTitleId(id: string | null) {
      this.titleId = id;
    },
  },
});
