<template>
  <div class="tiny-editor">
    <Editor
      v-model="contentValue"
      :init="initOptions"
    ></Editor>
  </div>
</template>

<script lang="ts" setup>
import Editor from "@tinymce/tinymce-vue";
import { TinyTypes } from "../types/TinyTypes";
import { computed ,ref} from "vue";
const props = withDefaults(defineProps<TinyTypes>(), {
  modelValue: "",
  disbled: false,
  height: 400,
  language: "zh-CN",
});
//  定义事件
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
//  响应内容
const contentValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit("update:modelValue", value);
  },
});
// TinyMCE 配置
const initOptions = ref({
  height: props.height,
  language: props.language,
  menubar: "file edit view insert format tools table help",
  readonly:false,
  plugins: [
    "advlist",
    "autolink",
    "lists",
    "link",
    "image",
    "charmap",
    "preview",
    "anchor",
    "searchreplace",
    "visualblocks",
    "code",
    "fullscreen",
    "insertdatetime",
    "media",
    "table",
    "code",
    "help",
    "wordcount",
  ],
  toolbar:
    "undo redo | blocks | bold italic underline strikethrough | " +
    "alignleft aligncenter alignright alignjustify | " +
    "bullist numlist outdent indent | link image media | " +
    "forecolor backcolor removeformat | table help | code fullscreen",
  // 图片上传配置
  images_upload_handler: (blobInfo: any) => {
    return new Promise((resolve, reject) => {
      // 这里实现图片上传逻辑
      // 示例：直接返回 base64
      const reader = new FileReader();
      reader.readAsDataURL(blobInfo.blob());
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        reject("图片上传失败: " + error);
      };
    });
  },
  // 其他配置
  branding: false,
  elementpath: false,
  promotion: false,
  resize: true,
  content_css: "default",
  skin: "oxide",
});
</script>

<style lang="scss" scoped>
.tiny-editor{
    width: 100%;
}
</style>
