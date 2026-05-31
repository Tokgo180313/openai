<template>
  <div class="content">
    <div class="login">
      <div class="login-input">
        <a-form
          :model="submitForm"
          :label-col="{ span: 8 }"
          :wrapper-col="{ span: 16 }"
          autocomplete="off"
          @finish="onFinish"
          @finishFailed="onFinishFailed"
        >
          <a-form-item
            label="account"
            name="account"
            :rules="[{ required: true, message: 'please input your account' }]"
          >
            <a-input
              v-model:value="submitForm.account"
              placeholder="account"
            ></a-input>
          </a-form-item>
          <a-form-item
            label="password"
            name="password"
            :rules="[{ required: true, message: 'please input your password' }]"
          >
            <a-input-password
              v-model:value="submitForm.password"
              placeholder="password"
            ></a-input-password>
          </a-form-item>
          <a-form-item :wrapper-col="{ offset: 8, span: 16 }">
            <a-button type="primary" htmlType="submit" style="width: 100%"
              >登陆</a-button
            >
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { FormState } from "./types/FormState.ts";
import api from "@/api/apiList.ts";
import { useRouter } from "vue-router";
const router = useRouter();
import { message } from "ant-design-vue";
import { useAuthStore } from "../../stores/authStore.ts";
import { useModelStore } from "../../stores/modelStore.ts";
import type { LoginResponseData } from "@/types/auth.type";
import {
  getFirstMenuPath,
  resetManageRoutes,
  setupManageRoutes,
} from "@/router/dynamicRoutes";
import { isChatDefaultOnLogin } from "@/constants/role";
import { resolveLoginMenus } from "@/utils/resolveLoginMenus";
const userStore = useAuthStore();
const modelStore = useModelStore();
let { loginInterface } = api;
let submitForm = reactive<FormState>({
  account: "",
  password: "",
});
const onFinish = async () => {
  try {
    const res = await loginInterface(submitForm);
    if (res.code != 200) {
      message.error(res.message);
      return;
    }
    const data = res.data as LoginResponseData;
    message.success("登录成功");
    userStore.setNickName(data.user.nickName);
    userStore.setToken(data.access_token);
    userStore.setAccount(data.user.account);
    userStore.setRoleId(data.user.roleId);
    userStore.setRoleIds(data.user.roleIds);
    const uid = data.user?.id;
    if (uid != null && uid !== "") {
      userStore.setUserId(String(uid));
    }
    const menus = await resolveLoginMenus(data.user.roleId, data.menus);
    userStore.setMenus(menus);
    modelStore.fetchAiModelList({ enabled: "1" });
    modelStore.fetchProviderList();
    resetManageRoutes(router);
    if (menus.length) {
      setupManageRoutes(router, menus);
      modelStore.fetchRoleList({});
    }

    const redirectPath =
      !isChatDefaultOnLogin(data.user.roleId) && menus.length
        ? getFirstMenuPath(menus) || "/chat"
        : "/chat";
    router.push(redirectPath);
  } catch {
    message.error("登录失败，请稍后重试");
  }
};
const onFinishFailed = (values: any) => {
  // message.error(values)
};
</script>

<style scoped lang="scss">
.content {
  width: 100vw;
  height: 100vh;
  background: url("@/assets/images/background.jpg") no-repeat center;
  background-size: 100% 100%;
}
.login {
  padding: 1.5rem 1.5rem 0 1.5rem;
  width: 26vw;
  height: 26vh;
  position: absolute;
  border-radius: 1em;
  box-shadow: 0 0 0 0.1em rgba(211, 211, 211, 0.5);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  // display: grid;
  // place-items: center;
}
.login-input {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
