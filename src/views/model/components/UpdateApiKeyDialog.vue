<template>
    <a-modal v-model:open="open" title="更新ApiKey" @ok="handleSubmit" @cancel="handleClose" ok-text="确认" cancel-text="取消">
        <a-form :model="form" :rules="rules" ref="formRef">
            <a-form-item label="模型分类" name="modelClassify">
                <a-select v-model:value="form.modelName" placeholder="请选择模型名称">
                    <a-select-option v-for="item in modelList" :key="item.value">{{ item.label }}</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="ApiKey" name="apiKey">
                <a-input v-model:value="form.apiKey" />
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
}
const form = ref<FormType>({
    apiKey: "",
});
const rules = {
    apiKey: [{ required: true, message: "请输入ApiKey", trigger: "blur" }],
    modelClassify: [{ required: true, message: "请选择模型分类", trigger: "blur" }],
};
const handleSubmit = () => {
    updateApiKeyInterface(form.value).then((res) => {
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
  form.value = {
    apiKey: "",
  };
};
</script>

<style scoped>

</style>