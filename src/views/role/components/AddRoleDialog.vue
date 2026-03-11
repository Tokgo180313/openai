<template>
  <a-modal
    :open="true"
    title="添加角色"
    @cancel="handleCancel"
    ok-text="确认"
    cancel-text="取消"
    :mask-closable="false"
  >
    <a-form :model="submitForm" :rules="rules">
      <a-form-item label="角色ID" name="roleId">
        <a-input-number
          v-model:value="submitForm.roleId"
          placeholder="请输入角色ID"
          :min="1"
        />
      </a-form-item>
      <a-form-item label="角色名称" name="name">
        <a-input v-model:value="submitForm.name" placeholder="请输入角色名称" />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-select v-model:value="submitForm.status" placeholder="请选择状态">
          <a-select-option value="1">启用</a-select-option>
          <a-select-option value="0">禁用</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import api from "@/api/apiList.ts";
import { message } from "ant-design-vue";
const { addRoleInterface } = api;

interface Props{
    visible: boolean;
}
const props = defineProps<Props>();
const emit = defineEmits(["close-modal"]);
interface RoleType {
  roleId: number;
  name: string;
  status: string;
}
let submitForm = ref<RoleType>({
  roleId: 2,
  name: "普通用户",
  status: "1",
});
const rules = {
  roleId: [{ required: true, message: "请输入角色ID", trigger: "blur" }],
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  status: [{ required: true, message: "请选择状态", trigger: "change" }],
};
const open = computed(() => props.visible);
const handleCancel = () => {
  emit("close-modal");
};
const handleOk = async () => {
  addRoleInterface(submitForm.value)
    .then((res) => {
      if (res.code === 201) {
        emit("close-modal");
        message.success("添加角色成功")
      }
    })
    .catch((err) => {
      message.error("添加角色失败");
    });
};

</script>

<style scoped lang="scss"></style>
