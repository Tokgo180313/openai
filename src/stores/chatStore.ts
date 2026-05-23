import { defineStore } from "pinia";
interface stateInfo {
  loading: boolean;
}
export const useChatStore = defineStore("store", {
  state: () => ({ documentId: null, titleId: null }),
  getters: {
    getDocumentId() {
      return this.documentId;
    },
    getTitleId() {
      return this.titleId;
    },
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
