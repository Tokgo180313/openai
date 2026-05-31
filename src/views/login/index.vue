<template>
  <div class="content">
    <div class="login">
      <div class="login-input">
        <a-form
          :model="submitForm"
          :layout="formLayout"
          :label-col="formLabelCol"
          :wrapper-col="formWrapperCol"
          autocomplete="off"
          class="login-form"
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
          <a-form-item class="login-submit-item" :wrapper-col="submitWrapperCol">
            <a-button type="primary" htmlType="submit" block>登陆</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive } from "vue";
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
import { isMobileViewport } from "@/utils/breakpoint";
import { useBreakpoint } from "@/hooks/useBreakpoint";
const userStore = useAuthStore();
const modelStore = useModelStore();
const { isMobile } = useBreakpoint();

const formLayout = computed(() => (isMobile.value ? "vertical" : "horizontal"));
const formLabelCol = computed(() =>
  isMobile.value ? undefined : { span: 8 },
);
const formWrapperCol = computed(() =>
  isMobile.value ? undefined : { span: 16 },
);
const submitWrapperCol = computed(() =>
  isMobile.value ? undefined : { offset: 8, span: 16 },
);
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
      !isMobileViewport() &&
      !isChatDefaultOnLogin(data.user.roleId) &&
      menus.length
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
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  background: url("@/assets/images/background.jpg") no-repeat center;
  background-size: cover;
}

.login {
  box-sizing: border-box;
  width: min(320px, calc(100vw - 2rem));
  min-height: 220px;
  position: absolute;
  border-radius: 1em;
  box-shadow: 0 0 0 0.1em rgba(211, 211, 211, 0.5);
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background-color: #fff;
  padding: 1.5rem;
}

.login-input {
  width: 100%;

  :deep(.login-form) {
    width: 100%;
  }

  :deep(.ant-form-item) {
    margin-bottom: 1rem;
  }

  :deep(.login-submit-item) {
    margin-bottom: 0;
  }
}

@media (max-width: 767px) {
  .login {
    width: min(320px, calc(100vw - 2rem));
    padding: 1.25rem 1rem 1.5rem;
  }

  .login-input {
    :deep(.ant-form-item-label > label) {
      height: auto;
    }

    :deep(.ant-input),
    :deep(.ant-input-affix-wrapper) {
      width: 100%;
    }
  }
}
</style>
