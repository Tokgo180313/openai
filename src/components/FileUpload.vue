<template>
  <div class="file-upload-container">
    <file-pond
      ref="pond"
      name="file"
      label-idle="拖放文件或浏览"
      :allow-multiple="allowMultiple"
      :max-files="maxFiles"
      :server="serverConfig"
      :files="files"
      :instant-upload="instantUpload"
      :accepted-file-types="acceptedFileTypes"
      @init="handleFilePondInit"
      @addfile="handleAddFile"
      @processfile="handleProcessFile"
      @removefile="handleRemoveFile"
      @error="handleError"
    ></file-pond>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import VueFilePond from "vue-filepond";
import "filepond/dist/filepond.min.css";
import FilePondPluginFileValidatetype from "filepond-plugin-file-validate-type";
import FilePondPluginImagePreview from "filepond-plugin-image-preview";
import "filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css";
// 定义 props
interface Props {
  allowMultiple?: boolean;
  maxFiles?: number;
  instantUpload: boolean;
  acceptedFileTypes?: string[];
  serverEndpoint?: string;
}
const props = withDefaults(defineProps<Props>(), {
  allowMultiple: true,
  maxFiles: 5,
  instantUpload: false,
  acceptedFileTypes: () => ["image/*"],
  serverEndpoint: "/file/upload",
});
const emit = defineEmits<{
  uploadSuccess: [files: any[]];
  uploadError: [error: unknown];
  fileAdded: [file: any];
  fileRemoved: [file: any];
}>();
const FilePond = VueFilePond(
  FilePondPluginFileValidatetype,
  FilePondPluginImagePreview
);

const pond = ref<any>(null);
const files = ref<any[]>([]);
// 服务器配置
const serverConfig = {
  url: props.serverEndpoint,
  process: {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("access_token")}`,
    },
  },
};
const handleFilePondInit = () => {
  console.log("filepond init");
};
const handleAddFile = (error: any, file: any) => {
  if (error) {
    emit("uploadError", error);
    return;
  }
  emit("fileAdded", file);
};
const handleProcessFile = (error: any, file: any) => {
  if (error) {
    emit("uploadError", error);
    return;
  }
  // 处理上传成功的文件
  console.log("file processed", file);
  emit("uploadSuccess", file.value);
};
const handleRemoveFile = (error: unknown, file: File) => {
  if (error) {
    emit("uploadError", error);
    return;
  }
  emit("fileRemoved", file);
};
const handleError = (error: unknown) => {
  console.error("filepond error", error);
  emit("uploadError", error);
};
// 手动触发上传
const uploadFiles = () => {
  if (pond.value) {
    pond.value.processFiles();
  }
};
// 清空所有文件
const clearFiles = () => {
  if (pond.value) {
    pond.value.removeFiles();
  }
};
// 暴露方法给父组件
defineExpose({
  uploadFiles,
  clearFiles,
});
</script>

<style scoped lang="scss">
.file-upload-container {
  width: 100%;
}
</style>
