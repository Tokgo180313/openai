<template>
    <a-modal v-model:open="open" title="更新modelName" @ok="handleSubmit" @cancel="handleClose" ok-text="确认" cancel-text="取消">
        <a-form :model="submitForm" :rules="rules" ref="formRef">
            <a-form-item label="模型分类" name="modelClassify">
                <a-select v-model:value="submitForm.modelClassify" placeholder="请选择模型名称">
                    <a-select-option v-for="item in modelClassifyList" :key="item">{{ item }}</a-select-option>
                </a-select>
            </a-form-item>
            <a-form-item label="模型名称" name="modelName">
                <a-input v-model:value="submitForm.modelName" />
            </a-form-item>
        </a-form>
    </a-modal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import api from "@/api/apiList";
let { updatemodelNameInterface } = api;
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
    modelName: string;
    modelClassify: string;
}
const submitForm = ref<FormType>({
    modelName: "",
    modelClassify: "",
});
const rules = {
    modelName: [{ required: true, message: "请输入modelName", trigger: "blur" }],
    modelClassify: [{ required: true, message: "请选择模型分类", trigger: "blur" }],
};
const handleSubmit = () => {
    updatemodelNameInterface(submitForm.value).then((res) => {
        if (res.code === 201) {
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
    modelName: "",
  };
};
</script>

<style scoped>

</style>