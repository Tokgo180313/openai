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
            :rules="[{ required: true, message: 'please input your account' }]"
          >
            <a-input
              v-model:value="submitForm.account"
              placeholder="account"
            ></a-input>
          </a-form-item>
          <a-form-item
            label="password"
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
let {loginInterface} =api;
let submitForm = reactive<FormState>({
  account: "",
  password: "",
});
const onFinish = (values: any) => {
  loginInterface(submitForm).then((res) => {
    console.log(res);
    if(res.code ==200){
      message.success("登录成功")
      sessionStorage.setItem("access_token",res.data.access_token)
      sessionStorage.setItem("account",res.data.user.account)
      router.push("/chat")
    }else{
      console.log(res.message)
      message.error(res.message)
    }
  });
};
const onFinishFailed = (values: any) => {
  message.error(values)
};
</script>

<style scoped lang="scss"></style>
