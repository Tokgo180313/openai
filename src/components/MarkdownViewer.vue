<template>
  <div :class="{ 'is-user': role == 'user' ,'is-assistant':role=='assistant'}">
    <div class="markdown-body" v-html="compiledMarkdown"></div>
  </div>
</template>

<script lang="ts" setup>
import { markdownRenderer } from "../utils/markdownRenderer";
import { computed } from "vue";
import DOMPurify from "dompurify";

import "@/styles/markdown.css";
interface MarkdownTypes {
  content: string;
  role: string;
}
const props = defineProps<MarkdownTypes>();
const compiledMarkdown = computed(() => {
  let content = props.content
  if(props.role =="user"){
    content = `<span style="background:rgba(211,211,211,0.3);padding:0.5em 1em;border-radius:0.5em;">${content}</span>`
  }
  return markdownRenderer.render(DOMPurify.sanitize(content));
});
</script>

<style scoped lang="scss">
.is-user {
  text-align: right;
}
.is-assistant{
  text-align: left;
}
</style>
