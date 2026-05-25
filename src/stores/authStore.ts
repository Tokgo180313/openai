import { defineStore } from "pinia";
import api from "@/api/apiList";
import { normalizeRoleId, normalizeRoleIds } from "@/constants/role";
import type { LoginMenuItem } from "@/types/auth.type";

let { validateTokenInterface } = api;

/** 迁移：auth 持久化已从 localStorage 改为 sessionStorage */
try {
  localStorage.removeItem("auth");
} catch {
  // ignore
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null as string | null,
    nickName: null as string | null,
    roleId: null as string | null,
    roleIds: [] as string[],
    account: null as string | null,
    userId: null as string | null,
    menus: [] as LoginMenuItem[],
  }),
  persist: {
    storage: sessionStorage,
    key: "auth",
  },
  getters: {
    getToken: (state) => state.token,
    getNickName: (state) => state.nickName,
    getRoleId: (state) => state.roleId,
    getRoleIds: (state) => state.roleIds,
    getAccount: (state) => state.account,
    getUserId: (state) =>
      state.userId ?? sessionStorage.getItem("user_id"),
    getMenus: (state) => state.menus,
  },

  actions: {
    validateToken() {
      return validateTokenInterface()
        .then((res) => {
          if (res.code === 200) {
            return true;
          } else {
            return false;
          }
        })
        .catch(() => {
          return false;
        });
    },
    setToken(token: string) {
      sessionStorage.setItem("access_token", token);
      this.token = token;
    },
    setNickName(nickName: string) {
      sessionStorage.setItem("nick_name", nickName);
      this.nickName = nickName;
    },
    setRoleId(roleId: string | number | null | undefined) {
      const normalized = normalizeRoleId(roleId);
      sessionStorage.setItem("role_id", normalized);
      this.roleId = normalized || null;
    },
    setRoleIds(roleIds: (string | number)[] | null | undefined) {
      this.roleIds = normalizeRoleIds(roleIds);
      sessionStorage.setItem("role_ids", JSON.stringify(this.roleIds));
    },
    setMenus(menus: LoginMenuItem[] | null | undefined) {
      this.menus = menus ?? [];
      sessionStorage.setItem("menus", JSON.stringify(this.menus));
    },
    setAccount(account: string) {
      sessionStorage.setItem("account", account);
      this.account = account;
    },
    setUserId(userId: string | null) {
      if (userId != null && userId !== "") {
        sessionStorage.setItem("user_id", userId);
        this.userId = userId;
      } else {
        sessionStorage.removeItem("user_id");
        this.userId = null;
      }
    },
    clearToken() {
      this.token = null;
      this.nickName = null;
      this.roleId = null;
      this.roleIds = [];
      this.account = null;
      this.userId = null;
      this.menus = [];
      sessionStorage.removeItem("auth");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("nick_name");
      sessionStorage.removeItem("role_id");
      sessionStorage.removeItem("role_ids");
      sessionStorage.removeItem("menus");
      sessionStorage.removeItem("account");
      sessionStorage.removeItem("user_id");
    },
  },
});
