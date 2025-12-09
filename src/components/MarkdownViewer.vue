<template>
 <div class="markdown-body" v-html="compiledMarkdown"></div>
</template>

<script lang="ts" setup>
import { markdownRenderer } from '../utils/markdownRenderer';
import { MarkdownTypes } from '../types/MarkdownTypes';
import { computed } from 'vue';
import "@/styles/markdown.css"
const props = defineProps<MarkdownTypes>();
const compiledMarkdown = computed(()=>{
    return markdownRenderer.render(props.content)
})
</script>

<style scoped lang="scss">

</style>