import { defineStore } from "pinia";
import api from "@/api/apiList";
let { findModelListInterface, findModelClassifyListInterface ,getRoleListInterface} = api;
export const useModelStore = defineStore("model", {
  state: () => ({
    modelList: [],
    modelClassifyList: [],
    roleList: [],
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
  },
  actions: {
    setModelList(modelList) {
      this.modelList = modelList;
    },
    setRoleList(roleList) {
      this.roleList = roleList;
    },
    fetchRoleList(param) {
      return getRoleListInterface(param)
        .then((res) => {
          if (res.code === 201) {
            let roleList = res.data.list || res.data || [];
            roleList = roleList.filter(item=>item.roleId !== '0');
            this.setRoleList(roleList);
            return roleList
          } else {
            this.setRoleList([]);
            return [] ;
          }
        });
    },
    fetchModelList(param) {
      return findModelListInterface(param)
        .then((res) => {
          if (res.code === 201) {
            this.setModelList(res.data.list||res.data||[]);
            return res.data.list||res.data||[];
          } else {
            this.setModelList([]);
            return [] ;
          }
        })
        .catch(() => {
          this.setModelList([]);
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
