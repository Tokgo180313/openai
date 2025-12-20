<template>
  <div class="image-preview-container">
    <div class="empty-state" v-if="images.length === 0">暂无图片</div>
    <div class="image-grid" v-else>
      <div
        class="image-item"
        v-for="(image, index) in images"
        :key="image.id || index"
      >
        <img :src="image.url" :alt="image.name||'预览图片'">
        <div class="image-info">
            <span>{{ image.name }}</span>
            <a-button danger v-if="showRemove" @click="$emit('remove',image)" class="remove-btn">移除</a-button>
        </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
interface ImageItem {
    id?:string|number
    url:string
    name?:string
    file?:File
}
interface Props {
    images:ImageItem[]
    showRemove?:boolean
}
const props = withDefaults(defineProps<Props>(),{
    images:()=>[],
    showRemove:true,
})

const emit = defineEmits<{
    remove:[image:ImageItem],
    'image-click':[image:ImageItem]
}>()
</script>

<style scoped lang="scss">
    .image-preview-container{
        padding: 20px;
    }
    .empty-state{
        text-align: center;
        color: #999;
        padding: 40px;
        border: 2px dashed #eee;
        border-radius: 8px;
    }
    .image-grid{
        display: grid;
        grid-template-columns: repeat(auto-fill,minmax(150px,1fr));
        gap:16px;
        margin-top: 20px;
    }
    .image-item{
        border:1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.2s;
    }
    .image-item:hover{
        transform: translate(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .image-item img{
        width: 100%;
        height: 150px;
        object-fit: cover;
        cursor: pointer;
    }
    .image-info{
        padding: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f9f9f9;
    }
    .image-info span{
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

</style>
