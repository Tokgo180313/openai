<template>
    <a-modal v-model:open="open" title="更新ApiKey" @ok="handleSubmit" @cancel="handleClose" ok-text="确认" cancel-text="取消">
        <a-form :model="submitForm" :rules="rules" ref="formRef">
            <a-form-item label="模型分类" name="modelClassify">
                <a-select v-model:value="submitForm.modelClassify" placeholder="请选择模型名称">
                    <a-select-option v-for="item in modelClassifyList" :key="item">{{ item }}</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="ApiKey" name="apiKey">
                <a-input v-model:value="submitForm.apiKey" />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import api from "@/api/apiList";
let { updateApiKeyInterface } = api;
import { message } from "ant-design-vue";
import { useModelStore } from "@/stores/modelStore";
const modelStore = useModelStore();
const modelClassifyList = computed(() => modelStore.modelClassifyList);
console.log(modelClassifyList.value);
interface PropsType {
    visible: boolean;
}
const props = defineProps<PropsType>();
const open = computed(() => props.visible);
const emits = defineEmits(["close"]);
const handleClose = () => {
    emits("close");
};
interface FormType {
    apiKey: string;
    modelClassify: string;
}
const submitForm = ref<FormType>({
    apiKey: "",
    modelClassify: "",
});
const rules = {
    apiKey: [{ required: true, message: "请输入ApiKey", trigger: "blur" }],
    modelClassify: [{ required: true, message: "请选择模型分类", trigger: "blur" }],
};
const handleSubmit = () => {
    updateApiKeyInterface(submitForm.value).then((res) => {
        if (res.code === 200) {
            handleClose();
            resetForm();
            message.success(res.message);
        } else {
            message.error(res.message || "更新失败");
    }
  });
};
const resetForm = () => {
  submitForm.value = {
    apiKey: "",
  };
};
</script>

<style scoped>

</style>