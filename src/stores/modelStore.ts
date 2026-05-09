import { defineStore } from "pinia";
import api from "@/api/apiList";
let { findModelListInterface, findModelClassifyListInterface ,getRoleListInterface} = api;
export const useModelStore = defineStore("model", {
  state: () => ({
    modelList: [],
    modelClassifyList: [],
    roleList: [],
    currentModel: null,
    currentModelClassify: null,
  }),
  persist: true,
  getters: {
    getModelList() {
      return this.modelList.map(item => item.modelName);
    },
    getModelClassifyList() {
      return this.modelClassifyList;
    },
    getRoleList() {
      return this.roleList.map(item=>({label:item.name,value:item.roleId}));
    },
    getCurrentModel() {
      return this.currentModel;
    },
    getCurrentModelClassify() {
      return this.currentModelClassify;
    },
  },
  actions: {
    setModelList(modelList) {
      this.setCurrentModel(modelList[0].modelName);
      this.modelList = modelList;
    },
    setCurrentModel(model) {
      this.currentModel = model;
    },
    setCurrentModelClassify(modelClassify) {
      this.currentModelClassify = modelClassify;
    },
    setRoleList(roleList) {
      this.roleList = roleList;
    },
    setModelClassifyList(modelClassifyList) {
      this.modelClassifyList = modelClassifyList;
    },
    fetchRoleList(param) {
      return getRoleListInterface(param)
        .then((res) => {
          if (res.code === 201) {
            let roleList = res.data.list || res.data || [];
            roleList = roleList.filter(item=>item.roleId !== '0');
            console.log(roleList);
            this.setRoleList(roleList);
            return roleList
          } else {
            this.setRoleList([]);
            return [] ;
          }
        });
    },
    /**
     * @param options.preserveCurrentModel 为 true 时只更新 modelList，不修改 currentModel（供管理类下拉开列表等场景）
     */
    fetchModelList(
      param,
      options?: { preserveCurrentModel?: boolean },
    ) {
      return findModelListInterface(param)
        .then((res) => {
          if (res.code === 201) {
            const list = res.data.list || res.data || [];
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
            return [] ;
          }
        })
        .catch(() => {
          if (options?.preserveCurrentModel) {
            this.modelList = [];
          } else {
            this.setModelList([]);
          }
          return [] ;
        });
    },
    fetchModelClassifyList(param) {
      return findModelClassifyListInterface(param)
        .then((res) => {
          if (res.code === 200) {
            this.setModelClassifyList(res.data.list || res.data || []);
            return res.data.list || res.data ||[];
          } else {
            this.setModelClassifyList([]);
            return [] ;
          }
        })
        .catch(() => {
          this.setModelClassifyList([]);
          return [];
        });
    },
  },
});
