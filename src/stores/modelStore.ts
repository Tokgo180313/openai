import { defineStore } from "pinia";
import api from "@/api/apiList";
import type { AiModelQueryDto } from "@/api/manage/ai-model";
import type { AiModelItem } from "@/types/ai-model.type";
import { isEnabledChatModel } from "@/types/ai-model.type";
import { ROLE } from "@/constants/role";

const {
  findAiModelListInterface,
  findAiModelProviderListInterface,
  getRoleListInterface,
} = api;

export const useModelStore = defineStore("aiModel", {
  state: () => ({
    aiModelList: [] as AiModelItem[],
    providerList: [] as string[],
    roleList: [] as { id: number; name: string }[],
    /** 当前选中的 API 模型名（传给聊天接口的 model） */
    currentApiModelName: null as string | null,
    /** 当前选中的服务商（传给聊天接口的 provider） */
    currentProvider: null as string | null,
  }),
  persist: true,
  getters: {
    /** 全部模型的 API 模型名列表 */
    apiModelNameList(): string[] {
      return this.aiModelList.map((item) => item.apiModelName);
    },
    /** 启用且 modelType 为 text 的模型 */
    chatModelList(): AiModelItem[] {
      return this.aiModelList.filter(isEnabledChatModel);
    },
    providerOptions(): string[] {
      return this.providerList;
    },
    roleOptions() {
      return this.roleList.map((item) => ({
        label: item.name,
        value: String(item.id),
      }));
    },
  },
  actions: {
    setAiModelList(list: AiModelItem[]) {
      const defaultModel = list.find(isEnabledChatModel) ?? list[0];
      if (defaultModel?.apiModelName) {
        this.setCurrentApiModelName(defaultModel.apiModelName);
        this.setCurrentProvider(defaultModel.provider ?? null);
      }
      this.aiModelList = list;
    },
    setCurrentApiModelName(apiModelName: string | null) {
      this.currentApiModelName = apiModelName;
    },
    setCurrentProvider(provider: string | null) {
      this.currentProvider = provider;
    },
    setRoleList(roleList: { id: number; name: string }[]) {
      this.roleList = roleList;
    },
    setProviderList(providerList: string[]) {
      this.providerList = providerList;
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
        }
        this.setRoleList([]);
        return [];
      });
    },
    /**
     * @param options.preserveSelection 为 true 时只更新 aiModelList，不修改当前选中模型
     */
    fetchAiModelList(
      param: AiModelQueryDto = {},
      options?: { preserveSelection?: boolean },
    ) {
      return findAiModelListInterface(param)
        .then((res) => {
          if (res.code === 200 || res.code === 201) {
            const list: AiModelItem[] = res.data?.list ?? res.data ?? [];
            if (options?.preserveSelection) {
              this.aiModelList = list;
            } else {
              this.setAiModelList(list);
            }
            return list;
          }
          if (options?.preserveSelection) {
            this.aiModelList = [];
          } else {
            this.setAiModelList([]);
          }
          return [];
        })
        .catch(() => {
          if (options?.preserveSelection) {
            this.aiModelList = [];
          } else {
            this.setAiModelList([]);
          }
          return [];
        });
    },
    fetchProviderList() {
      return findAiModelProviderListInterface()
        .then((res) => {
          if (res.code === 200 || res.code === 201) {
            const list = res.data?.list ?? res.data ?? [];
            this.setProviderList(list);
            return list;
          }
          this.setProviderList([]);
          return [];
        })
        .catch(() => {
          this.setProviderList([]);
          return [];
        });
    },
  },
});
