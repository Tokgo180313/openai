<template>
  <div :class="{ 'is-user': role == 'user' }">
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
  return markdownRenderer.render(DOMPurify.sanitize(props.content));
});
</script>

<style scoped lang="scss">
.is-user {
  text-align: right;
}
</style>
