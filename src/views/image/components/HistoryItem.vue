<template>
  <a-popover
    placement="left"
    trigger="click"
    title="历史记录"
    :disabled="historyImageList.length === 0"
    :overlay-style="{ width: `${popoverWidth}px`, maxWidth: '90vw' }"
  >
    <template #content>
      <div class="history-list-wrap">
        <div v-if="historyImageList.length === 0" class="empty-history">暂无历史</div>
        <div v-for="image in historyImageList" :key="image.uid" class="history-item">
          <a-image
            class="history-img"
            :src="resolveImageSrc(image.url, image.code)"
            :preview="{ src: resolveImageSrc(image.url, image.code) }"
          />
          <div class="history-content">
            <div class="history-prompt" :title="image.context || ''">
              {{ image.context || "（无文案）" }}
            </div>
            <div class="history-actions">
              <a-button type="link" size="small" @click="emit('view', image)">查看</a-button>
              <a-button type="link" size="small" @click="emit('download', image)">
                下载
              </a-button>
              <a-button type="link" danger size="small" @click="emit('delete', image)">
                删除
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div
      class="output-history-btn"
      :class="historyImageList.length ? '' : 'disabled-history'"
    >
      历史记录
    </div>
  </a-popover>
</template>

<script setup lang="ts">
type HistoryImage = {
  uid: string;
  url: string;
  code: string;
  context: string;
};

defineProps<{
  historyImageList: HistoryImage[];
  resolveImageSrc: (urlOrBase64: string, code: string) => string;
  popoverWidth: number;
}>();

const emit = defineEmits<{
  view: [image: HistoryImage];
  download: [image: HistoryImage];
  delete: [image: HistoryImage];
}>();
</script>

<style scoped>
.output-history-btn {
  cursor: pointer;
  text-align: center;
  border: 1px solid #4f46e5;
  border-radius: 5px;
  margin: 0.5em 0;
  line-height: 32px;
  height: 32px;
  user-select: none;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.history-list-wrap {
  width: 100%;
  max-height: 360px;
  overflow-y: auto;
}

.history-img {
  width: 64px;
  height: 48px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
  flex-shrink: 0;
  overflow: hidden;
}

:deep(.history-img .ant-image-img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.history-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-prompt {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
  white-space: normal;
}

.disabled-history {
  opacity: 0.55;
  pointer-events: none;
}

.empty-history {
  padding: 6px 0;
  color: #999;
  font-size: 12px;
  text-align: center;
}
</style>
