import { defineStore } from "pinia";
import api from "@/api/apiList";
import type { AiModelItem } from "@/types/ai-model.type";
import { isEnabledChatModel } from "@/types/ai-model.type";
import { ROLE } from "@/constants/role";

const {
  findAiModelListInterface,
  findAiModelProviderListInterface,
  getRoleListInterface,
} = api;

export const useModelStore = defineStore("model", {
  state: () => ({
    modelList: [] as AiModelItem[],
    /** 服务商列表（原 modelClassifyList） */
    modelClassifyList: [] as string[],
    roleList: [] as { id: number; name: string }[],
    /** 当前选中的 API 模型名 */
    currentModel: null as string | null,
    /** 当前选中的服务商 */
    currentModelClassify: null as string | null,
  }),
  persist: true,
  getters: {
    getModelList(): string[] {
      return this.modelList.map((item) => item.apiModelName);
    },
    /** 启用且 modelType 为 text 的模型 */
    getChatModelList(): AiModelItem[] {
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
    setModelList(modelList: AiModelItem[]) {
      const defaultModel =
        modelList.find(isEnabledChatModel) ?? modelList[0];
      if (defaultModel?.apiModelName) {
        this.setCurrentModel(defaultModel.apiModelName);
        this.setCurrentModelClassify(defaultModel.provider ?? null);
      }
      this.modelList = modelList;
    },
    setCurrentModel(model: string | null) {
      this.currentModel = model;
    },
    setCurrentModelClassify(provider: string | null) {
      this.currentModelClassify = provider;
    },
    setRoleList(roleList: { id: number; name: string }[]) {
      this.roleList = roleList;
    },
    setModelClassifyList(providerList: string[]) {
      this.modelClassifyList = providerList;
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
     * @param options.preserveCurrentModel 为 true 时只更新 modelList，不修改 currentModel
     */
    fetchModelList(
      param: Record<string, unknown>,
      options?: { preserveCurrentModel?: boolean },
    ) {
      return findAiModelListInterface(param)
        .then((res) => {
          if (res.code === 200 || res.code === 201) {
            const list: AiModelItem[] = res.data.list || res.data || [];
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
    fetchModelClassifyList() {
      return findAiModelProviderListInterface()
        .then((res) => {
          if (res.code === 200 || res.code === 201) {
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
