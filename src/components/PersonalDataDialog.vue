<template>
  <a-modal
    v-model:open="open"
    title="个人资料"
    @ok="confirmEvent"
    @cancel="cancelEvent"
    cancelText="取消"
    okText="确认"
  >
    <a-form :model="submitForm" :rules="formRules">
      <a-form-item label="昵称" name="nickName">
        <a-input v-model:value="submitForm.nickName" />
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
import { computed, ref } from "vue";
import api from "@/api/apiList";
const { updateNickNameInterface } = api;
import { message } from "ant-design-vue";
import user from "../api/user";
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
const roleName = computed(() => {
  if (userStore.getRoleId == "0") {
    return "超级管理员";
  } else {
    return modelStore.getRoleList.find(
        (item) => item.value === userStore.getRoleId,
      )?.label;
    }
  }
);
const formRules = {
  nickName: [{ required: true, message: "请输入昵称", trigger: "blur" }],
};
const open = computed(() => props.visible);
const confirmEvent = function () {
  updateNickNameInterface(submitForm.value).then((res) => {
    if (res.code === 201) {
      message.success("修改昵称成功");
      emits("close-modal", submitForm.value.nickName);
    } else {
      message.error(res.message);
    }
  });
};
const cancelEvent = function () {
  emits("close-modal");
};
</script>

<style scoped lang="scss"></style>
