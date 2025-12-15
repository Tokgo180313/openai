<template>
  <div class="container">
    <a-modal
      v-model:open="openModal"
      @ok="confirmAddEvent"
      @cancel="cancelEvent"
      ok-text="确认"
      cancel-text="取消"
      title="添加用户"
    >
      <a-form :model="submitForm" 
          autocomplete="off"
          @finish="onFinish"
          @finishFailed="onFinishFailed">
        <a-form-item
          label="帐号"
          name="account"
          :rules="[{ required: true, message: 'please input your account' }]"
        >
          <a-input v-model:value="submitForm.account" allowClear></a-input>
        </a-form-item>
        <a-form-item
          label="角色"
          name="roleId"
          :rules="[{ required: true, message: 'please select your role' }]"
        >
          <a-select v-model:value="submitForm.roleId" @change="roleChangeEvent">
            <a-select-option value="1">管理员</a-select-option>
            <a-select-option value="2">普通用户</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from "vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
import { UserPropsType } from "../types/props.ts";
let { addUserInfoInterface } = api;
interface Props {
  visible: boolean;
}
interface UserInfoDtoType {
  account: string;
  password: string;
  roleId: string;
  nickName?: strings;
}
const props = defineProps<Props>();
let submitForm = ref<UserInfoDtoType>({
  account: "",
  roleId: "2",
});
const emits = defineEmits(["close-modal"]);
let openModal = computed(() => props.visible);
const confirmAddEvent = function () {
  console.log(submitForm)
  if(submitForm.value.account.trim() !==''){
    addUserInfoInterface(submitForm.value).then((res) => {
      if (res.code === 200) {
        message.success(res.message);
        emits("close-modal", true);
      }
    });
  }
};
const cancelEvent = function () {
  emits("close-modal", false);
};
const roleChangeEvent = function (value) {
  submitForm.value.roleId = value;
};
const onFinish = function(){
  console.log(submitForm)
}

const onFinishFailed = function(){}
</script>

<style scoped lang="scss"></style>
