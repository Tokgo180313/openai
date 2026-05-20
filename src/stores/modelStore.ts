import { defineStore } from "pinia";
import api from "@/api/apiList";
import type { ModelItem } from "@/types/model.type";
import { isEnabledChatModel } from "@/types/model.type";
import { ROLE } from "@/constants/role";

let {
  findModelListInterface,
  findModelClassifyListInterface,
  getRoleListInterface,
} = api;

export const useModelStore = defineStore("model", {
  state: () => ({
    modelList: [] as ModelItem[],
    modelClassifyList: [] as string[],
    roleList: [] as { id: number; name: string }[],
    currentModel: null as string | null,
    currentModelClassify: null as string | null,
  }),
  persist: true,
  getters: {
    getModelList(): string[] {
      return this.modelList.map((item) => item.modelName);
    },
    /** 启用且 modelType 为 chat 的模型（完整列表项） */
    getChatModelList(): ModelItem[] {
      return this.modelList.filter(isEnabledChatModel);
    },
    getModelClassifyList(): string[] {
      return this.modelClassifyList;
    },
    getRoleList() {
      return this.roleList.map((item) => ({
        label: item.name,
        value: String(item.id),
      }));
    },
    getCurrentModel(): string | null {
      return this.currentModel;
    },
    getCurrentModelClassify(): string | null {
      return this.currentModelClassify;
    },
  },
  actions: {
    setModelList(modelList: ModelItem[]) {
      const defaultModel =
        modelList.find(isEnabledChatModel) ?? modelList[0];
      if (defaultModel?.modelName) {
        this.setCurrentModel(defaultModel.modelName);
        this.setCurrentModelClassify(defaultModel.modelClassify ?? null);
      }
      this.modelList = modelList;
    },
    setCurrentModel(model: string | null) {
      this.currentModel = model;
    },
    setCurrentModelClassify(modelClassify: string | null) {
      this.currentModelClassify = modelClassify;
    },
    setRoleList(roleList: { id: number; name: string }[]) {
      this.roleList = roleList;
    },
    setModelClassifyList(modelClassifyList: string[]) {
      this.modelClassifyList = modelClassifyList;
    },
    fetchRoleList(param: Record<string, unknown>) {
      return getRoleListInterface(param).then((res) => {
        if (res.code === 201) {
          let roleList = (res.data.list || res.data || []).map(
            (item: { id: number | string; name: string }) => ({
              id: Number(item.id),
              name: item.name,
            }),
          );
          roleList = roleList.filter(
            (item) => String(item.id) !== ROLE.SUPER_ADMIN,
          );
          this.setRoleList(roleList);
          return roleList;
        } else {
          this.setRoleList([]);
          return [];
        }
      });
    },
    /**
     * @param options.preserveCurrentModel 为 true 时只更新 modelList，不修改 currentModel（供管理类下拉开列表等场景）
     */
    fetchModelList(
      param: Record<string, unknown>,
      options?: { preserveCurrentModel?: boolean },
    ) {
      return findModelListInterface(param)
        .then((res) => {
          if (res.code === 201) {
            const list: ModelItem[] = res.data.list || res.data || [];
            if (options?.preserveCurrentModel) {
              this.modelList = list;
            } else {
              this.setModelList(list);
            }
            return list;
          } else {
            if (options?.preserveCurrentModel) {
              this.modelList = [];
            } else {
              this.setModelList([]);
            }
            return [];
          }
        })
        .catch(() => {
          if (options?.preserveCurrentModel) {
            this.modelList = [];
          } else {
            this.setModelList([]);
          }
          return [];
        });
    },
    fetchModelClassifyList(param?: Record<string, unknown>) {
      return findModelClassifyListInterface(param)
        .then((res) => {
          if (res.code === 200) {
            this.setModelClassifyList(res.data.list || res.data || []);
            return res.data.list || res.data || [];
          } else {
            this.setModelClassifyList([]);
            return [];
          }
        })
        .catch(() => {
          this.setModelClassifyList([]);
          return [];
        });
    },
  },
});
