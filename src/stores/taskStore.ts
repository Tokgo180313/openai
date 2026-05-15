import { nanoid } from "nanoid";
import { defineStore } from "pinia";

export type HistoryImage = {
  uid: string;
  url: string;
  code: string;
  context: string;
};

type TaskRuntime = {
  responseLoading: boolean;
  showStatus: string;
  responseErrorText: string;
  currentUrlCode: string;
  currentUrl: string;
  historyImageList: HistoryImage[];
  requestTimerId?: ReturnType<typeof setTimeout>;
};

function emptyTask(): TaskRuntime {
  return {
    responseLoading: false,
    showStatus: "0",
    responseErrorText: "",
    currentUrlCode: "",
    currentUrl: "",
    historyImageList: [],
  };
}

export const useTaskStore = defineStore("imageTask", {
  state: () => ({
    tasks: {} as Record<string, TaskRuntime>,
  }),
  actions: {
    ensureTask(taskId: string) {
      if (!this.tasks[taskId]) {
        this.tasks[taskId] = emptyTask();
      }
    },
    startTask(taskId: string) {
      this.ensureTask(taskId);
      const t = this.tasks[taskId];
      t.responseLoading = true;
      t.showStatus = "1";
      t.responseErrorText = "";
    },
    cancelTask(taskId: string) {
      const t = this.tasks[taskId];
      if (!t) return;
      t.responseLoading = false;
      t.showStatus = "0";
      if (t.requestTimerId !== undefined) {
        clearTimeout(t.requestTimerId);
        t.requestTimerId = undefined;
      }
    },
    setError(taskId: string, msg: string) {
      this.ensureTask(taskId);
      const t = this.tasks[taskId];
      t.responseLoading = false;
      t.showStatus = "3";
      t.responseErrorText = msg;
      if (t.requestTimerId !== undefined) {
        clearTimeout(t.requestTimerId);
        t.requestTimerId = undefined;
      }
    },
    completeTaskWithPlaceholder(
      taskId: string,
      payload: { url: string; code: string; context: string },
    ) {
      this.ensureTask(taskId);
      const t = this.tasks[taskId];
      t.responseLoading = false;
      t.showStatus = "2";
      t.currentUrl = payload.url;
      t.currentUrlCode = payload.code;
      t.responseErrorText = "";
      t.historyImageList.unshift({
        uid: nanoid(),
        url: payload.url,
        code: payload.code,
        context: payload.context,
      });
      if (t.requestTimerId !== undefined) {
        clearTimeout(t.requestTimerId);
        t.requestTimerId = undefined;
      }
    },
    setRequestTimerId(taskId: string, id: ReturnType<typeof setTimeout>) {
      this.ensureTask(taskId);
      const t = this.tasks[taskId];
      if (t.requestTimerId !== undefined) clearTimeout(t.requestTimerId);
      t.requestTimerId = id;
    },
    deleteHistoryItem(taskId: string, uid: string) {
      const t = this.tasks[taskId];
      if (!t) return;
      t.historyImageList = t.historyImageList.filter((x) => x.uid !== uid);
    },
    viewHistoryItem(taskId: string, item: HistoryImage) {
      this.ensureTask(taskId);
      const t = this.tasks[taskId];
      t.currentUrl = item.url;
      t.currentUrlCode = item.code;
    },
    /** 用服务端返回的历史列表覆盖本地该任务的历史（如进入页面时拉取） */
    setRemoteHistoryList(taskId: string, list: HistoryImage[]) {
      this.ensureTask(taskId);
      this.tasks[taskId].historyImageList = list;
    },
    /** 从持久化任务恢复结果预览（不写历史列表） */
    setPersistedResultPreview(taskId: string, payload: { url: string; code: string }) {
      this.ensureTask(taskId);
      const t = this.tasks[taskId];
      t.responseLoading = false;
      t.showStatus = "2";
      t.currentUrl = payload.url;
      t.currentUrlCode = payload.code;
      t.responseErrorText = "";
      if (t.requestTimerId !== undefined) {
        clearTimeout(t.requestTimerId);
        t.requestTimerId = undefined;
      }
    },
    clearTaskImages(_taskId: string) {
      /* 预留：与后端缓存联动时可扩展 */
    },
  },
});
