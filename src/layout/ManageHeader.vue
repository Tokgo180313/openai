<template>
  <div class="header">
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
    <login-out-dialog
      :visible="showLoginOutDialog"
      @close-modal="closeModalEvent"
    ></login-out-dialog>
    <update-password-dialog
      :visible="showUpdatePasswordValue"
      @close-modal="closeUpdatePasswordModalEvent"
    ></update-password-dialog>
  </div>
</template>

<script lang="ts" setup>
import LoginOutDialog from "@/components/LoginOutDialog.vue";
import UpdatePasswordDialog from "@/components/UpdatePasswordDialog.vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";
import { ref } from "vue";
const router = useRouter();
const userStore = useAuthStore();
const showLoginOutDialog = ref<boolean>(false);
const avatarValue = "管";
const color = "#f56a00";
const gap = 4;
const showPersonalEvent = () => {
  console.log("个人信息");
};
const showUpdatePasswordValue = ref<boolean>(false);
const showUpdatePasswordEvent = () => {
  console.log("修改密码");
  showUpdatePasswordValue.value = true;
};
const showLogoutEvent = () => {
    showLoginOutDialog.value = true;
};
const closeModalEvent = function () {
  showLoginOutDialog.value = false;
};
const closeUpdatePasswordModalEvent = function () {
  showUpdatePasswordValue.value = false;
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
  text-align: right;
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
</style>
