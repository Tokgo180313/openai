<template>
  <a-modal v-model:open="openModal" title="编辑个人资料">
    <div class="content">
      <a-form :model="submitForm">
        <a-form-item>
          <a-avatar></a-avatar>
        </a-form-item>
        <a-form-item label="显示名称">
          <a-input v-model:value="submitForm.nickName"></a-input>
        </a-form-item>
        <a-form-item label="帐号">
          <a-input v-model:value="submitForm.account"></a-input>
        </a-form-item>
        <a-form-item>
          <div class="operation">
            <a-button>取消</a-button>
            <a-button type="primary" @click="confirmEvent">保存</a-button>
          </div>
        </a-form-item>
      </a-form>
    </div>
  </a-modal>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import api from "@/api/apiList"
import { message } from "ant-design-vue";
let {updateUserInfoInterface} = api;
const submitForm = ref({
  avatar: "",
  nickName: "",
  account: "",
});
const confirmEvent = function(){
  updateUserInfoInterface(submitForm.value).then(res=>{
    if(res.code ===201){
      message.success(res.message)
    }
  })
}
</script>

<style scoped lang="scss">
  .content{
    padding: 1em;
  }
  .operation{
    text-align: right;
  }
</style>
