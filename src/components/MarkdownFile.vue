<template>
 <div v-if="loading" class="loading">Loading...</div>
 <div v-else-if="error" class="error"></div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { MarkdownFileTypes } from '../types/MarkdownFileTypes';
const props = defineProps<MarkdownFileTypes>
const content = ref<string>("")
const loading = ref<boolean>(true)
const error = ref<string>("")
onMounted(async ()=>{
    try {
        loading.value = true;
        const response = await import(`../docs/${props.filePath}`)
        content.value = response.default;
    } catch (err) {
        error.value = `Failed to load markdown file:${err}`
        console.error("Error loading markdown file:", err)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped lang="scss">
</style>