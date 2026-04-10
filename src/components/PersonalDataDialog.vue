<template>
  <a-modal
    :open="open"
    title="个人资料"
    @ok="confirmEvent"
    @cancel="cancelEvent"
    cancelText="取消"
    okText="确认"
    :confirm-loading="loading"
  >
    <a-form :model="submitForm" :rules="formRules">
      <a-form-item label="昵称" name="nickName">
        <a-input v-model:value="submitForm.nickName" :maxlength="20" />
      </a-form-item>
      <a-form-item label="帐号">
        <span>{{ userStore.getAccount }}</span>
      </a-form-item>
      <a-form-item label="角色">
        <span>{{ roleName }}</span>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import api from "@/api/apiList";
const { updateNickNameInterface } = api;
import { message } from "ant-design-vue";
import { useAuthStore } from "../stores/authStore";
const userStore = useAuthStore();
const props = defineProps<Props>();
const emits = defineEmits(["close-modal"]);
interface Props {
  visible: boolean;
}
interface SubmitForm {
  nickName: string;
}
const submitForm = ref<SubmitForm>({
  nickName: userStore.getNickName || "",
});
const loading = ref(false);
const roleName = computed(() => {
  if (userStore.getRoleId == "0") {
    return "超级管理员";
  }
  return "普通用户";
});
watch(
  () => props.visible,
  (value) => {
    if (value) {
      submitForm.value.nickName = userStore.getNickName || "";
    }
  }
);
const formRules = {
  nickName: [{ required: true, message: "请输入昵称", trigger: "blur" }],
};
const open = computed(() => props.visible);
const confirmEvent = function () {
  const nickName = submitForm.value.nickName?.trim();
  if (!nickName) {
    message.error("昵称不能为空");
    return;
  }
  loading.value = true;
  updateNickNameInterface({ nickName })
    .then((res) => {
      if (res.code === 200 || res.code === 201) {
        message.success(res.message || "修改昵称成功");
        emits("close-modal", nickName);
      } else {
        message.error(res.message || "修改昵称失败");
      }
    })
    .catch(() => {
      message.error("修改昵称失败，请稍后重试");
    })
    .finally(() => {
      loading.value = false;
    });
};
const cancelEvent = function () {
  emits("close-modal");
};
</script>

<style scoped lang="scss"></style>
