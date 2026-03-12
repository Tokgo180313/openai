<template>
  <div class="header">
    <div class="back-home-btn">
      <a-tooltip title="返回首页" placement="bottom">
        <span class="back-home-btn-icon" @click="backHomeEvent">
          <i class="iconfont icon-shouye"></i>
        </span>
      </a-tooltip>
    </div>
    <div>
      <a-popover placement="bottomRight" trigger="click">
        <template #content>
          <div class="set-content">
            <p @click="showPersonalEvent">个人信息</p>
            <p @click="showUpdatePasswordEvent">修改密码</p>
            <p @click="showLogoutEvent">退出登录</p>
          </div>
        </template>
        <a-avatar
          size="large"
          :style="{ backgroundColor: color, verticalAlign: 'middle' }"
          :gap="gap"
        >
          {{ avatarValue }}
        </a-avatar>
      </a-popover>
    </div>
    <login-out-dialog
      :visible="showLoginOutDialog"
      @close-modal="closeLoginOutModalEvent"
    ></login-out-dialog>
    <update-password-dialog
      :visible="showUpdatePasswordVisible"
      @close-modal="closeUpdatePasswordModalEvent"
    ></update-password-dialog>
    <personal-data-dialog
      :visible="showPersonalVisible"
      @close-modal="closePersonalDataModalEvent"
    ></personal-data-dialog>
  </div>
</template>

<script lang="ts" setup>
import LoginOutDialog from "@/components/LoginOutDialog.vue";
import UpdatePasswordDialog from "@/components/UpdatePasswordDialog.vue";
import PersonalDataDialog from "@/components/PersonalDataDialog.vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { ref } from "vue";
const router = useRouter();
const userStore = useAuthStore();
const showLoginOutDialog = ref<boolean>(false);
const showPersonalVisible = ref<boolean>(false);
const avatarValue = ref<string>(
  userStore.getNickName ? userStore.getNickName.slice(0, 1) : "",
);
const color = "#f56a00";
const gap = 4;
const showPersonalEvent = () => {
  // console.log("个人信息");
  showPersonalVisible.value = true;
};
const showUpdatePasswordVisible = ref<boolean>(false);
const showUpdatePasswordEvent = () => {
  // console.log("修改密码");
  showUpdatePasswordVisible.value = true;
};
const showLogoutEvent = () => {
  showLoginOutDialog.value = true;
};
const closeLoginOutModalEvent = function () {
  showLoginOutDialog.value = false;
};
const closeUpdatePasswordModalEvent = function () {
  showUpdatePasswordVisible.value = false;
};
const closePersonalDataModalEvent = function (nickName?: string) {
  showPersonalVisible.value = false;
  if (nickName) {
    userStore.setNickName(nickName);
    avatarValue.value = nickName.slice(0, 1);
  }
};
const backHomeEvent = function () {
  router.push("/");
};
</script>

<style scoped lang="scss">
.header {
  height: 60px;
  line-height: 60px;
  background-color: #fff;
  padding: 0 20px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.ant-avatar {
  cursor: pointer;
}
.set-content {
  width: 120px;
  text-align: center;
  p {
    margin: 0;
    padding: 8px 16px;
    cursor: pointer;
    &:hover {
      background-color: #f0f0f0;
    }
  }
}
.back-home-btn-icon {
  cursor: pointer;
  font-size: 1.5rem;
  color: #666;
  margin-right: 1rem;
  &:hover {
    color: #000;
  }
}
</style>
