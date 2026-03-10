<template>
 <div>
    <a-modal v-model:open="open" title="Basic Modal" @ok="handleOk" @cancel="emit('close-modal')">
      <a-form :model="submitForm" :rules="formRules">
        <a-form-item label="Old Password" name="oldPassword">
          <a-input v-model:value="submitForm.oldPassword" />
        </a-form-item>
        <a-form-item label="New Password" name="newPassword">
          <a-input v-model:value="submitForm.newPassword" />
        </a-form-item>
        <a-form-item label="Confirm Password" name="confirmPassword">
          <a-input v-model:value="submitForm.confirmPassword" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>

</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import api from "@/api/apiList";
const { updatePasswordInterface } = api;
import { message } from "ant-design-vue";
const formRules = {
  oldPassword: [{ required: true, message: "请输入旧密码", trigger: "blur" }],
  newPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    { validator: (rule, value) => {
      console.log(value, submitForm.value.newPassword);
        if (value !== submitForm.value.newPassword) {
          return Promise.reject("两次输入的新密码不一致");
        }
        return Promise.resolve();
      },
      trigger: "blur",
    },
  ],
};
interface Props {
  visible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["close-modal"]);
interface SubmitForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
const submitForm = ref<SubmitForm>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const open = computed(() => props.visible);
import { useAuthStore } from "../stores/authStore";
import user from "../api/user";
const userStore = useAuthStore();
import { useRouter } from "vue-router";
const router = useRouter();

const handleOk = () => {
  console.log(submitForm);
  if (submitForm.value.newPassword != submitForm.value.confirmPassword) {
    return;
  }
  updatePasswordInterface(submitForm.value).then((res) => {
    if (res.code == 200) {
      open.value = false;
      emit("close-modal");
      userStore.clearToken();
      router.replace("/login");
      message.success("密码修改成功，请重新登录");
      
    }
  });
};

</script>

<style scoped lang="scss">
</style>