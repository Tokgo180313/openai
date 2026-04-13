<template>
  <div class="image-preview-container">
    <div class="empty-state" v-if="items.length === 0">暂无附件</div>
    <div class="image-grid" v-else>
      <div
        class="image-item"
        :class="{ 'file-item': item.type === 'file' }"
        v-for="(item, index) in items"
        :key="item.id || index"
      >
        <span
          v-if="showRemove"
          class="image-remove-badge"
          @click.stop="$emit('remove', item)"
        >
          <i class="iconfont icon-cuo"></i>
        </span>
        <img
          v-if="item.type === 'image'"
          :src="item.url"
          :alt="item.name || '预览图片'"
          @click="previewImage(item)"
        />
        <div
          v-else
          class="file-card"
          @click="downloadFile(item)"
        >
          <div
            class="file-icon-wrap"
            :style="{ backgroundColor: getFileBackgroundColor(item.name) }"
          >
            <i
              class="iconfont"
              :class="getFileIcon(item.name)"
              :style="{ color: getFileIconColor(item.name) }"
            ></i>
          </div>
          <div class="file-name-wrap">
            <a-tooltip :title="item.name || ''" placement="topLeft">
              <span class="file-name">{{ item.name }}</span>
            </a-tooltip>
            <span class="file-type-text">{{ getFileTypeText(item.name) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface PreviewItem {
  id?: string | number;
  url: string;
  name?: string;
  file?: File;
  type: "image" | "file";
  uploading?: boolean;
}
interface Props {
  items: PreviewItem[];
  showRemove?: boolean;
}
withDefaults(defineProps<Props>(), {
  items: () => [],
  showRemove: true,
});

const emit = defineEmits<{
  remove: [item: PreviewItem];
}>();

const previewImage = (item: PreviewItem) => {
  if (!item.url) return;
  window.open(item.url, "_blank");
};

const downloadFile = (item: PreviewItem) => {
  if (!item.url) return;
  const link = document.createElement("a");
  link.href = item.url;
  link.download = item.name || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const getFileExt = (name?: string) => {
  if (!name || !name.includes(".")) return "";
  return name.split(".").pop()?.toLowerCase() || "";
};

const getFileIcon = (name?: string) => {
  const ext = getFileExt(name);
  if (["pdf"].includes(ext)) return "icon-PDFwenjian";
  if (["doc", "docx"].includes(ext)) return "icon-weibiaoti-2_huaban1";
  if (["xls", "xlsx"].includes(ext)) return "icon-xlswenjian";
  if (["csv"].includes(ext)) return "icon-csv";
  if (["ppt", "pptx"].includes(ext)) return "icon-weibiaoti-2_huaban11";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "icon-yasuobao";
  if (["js", "ts", "tsx", "vue", "json", "md", "py", "java", "go", "txt"].includes(ext)) {
    return "icon-s12";
  }
  return "icon-file";
};

const getFileIconColor = (name?: string) => {
  const ext = getFileExt(name);
  if (["pdf"].includes(ext)) return "#d93025";
  if (["doc", "docx"].includes(ext)) return "#2b579a";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#217346";
  if (["ppt", "pptx"].includes(ext)) return "#d24726";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "#6f42c1";
  if (["js", "ts", "tsx", "vue", "json", "md", "py", "java", "go"].includes(ext)) {
    return "#1f6feb";
  }
  return "#777";
};

const getFileBackgroundColor = (name?: string) => {
  const ext = getFileExt(name);
  if (["pdf"].includes(ext)) return "#7f1d1d";
  if (["doc", "docx"].includes(ext)) return "#1e3a8a";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#14532d";
  if (["ppt", "pptx"].includes(ext)) return "#9a3412";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "#581c87";
  if (["js", "ts", "tsx", "vue", "json", "md", "py", "java", "go", "txt"].includes(ext)) {
    return "#0f3d5e";
  }
  return "#374151";
};

const getFileTypeText = (name?: string) => {
  const ext = getFileExt(name);
  if (!ext) return "文件";
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp"].includes(ext)) return "图片";
  if (["pdf"].includes(ext)) return "PDF 文档";
  if (["doc", "docx", "txt", "md"].includes(ext)) return "文档";
  if (["xls", "xlsx", "csv"].includes(ext)) return "表格";
  if (["ppt", "pptx"].includes(ext)) return "演示文稿";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "压缩包";
  return "文件";
};
</script>

<style scoped lang="scss">
.image-preview-container {
  padding: 4px 0;
}
.empty-state {
  text-align: center;
  color: #999;
  padding: 12px;
  border: 1px dashed #eee;
  border-radius: 8px;
}
.image-grid {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}
.image-item {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: visible;
  transition: transform 0.2s;
}
.image-item:not(.file-item) {
  width: 100px;
}
.image-item.file-item {
  border-radius: 12px;
  width: 240px;
  min-width: 190px;
  max-width: 100%;
}
.image-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.image-item img {
  width: 100%;
  height: 72px;
  object-fit: cover;
  cursor: pointer;
  border-radius: 12px;
}
.file-card {
  height: 72px;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  gap: 8px;
  background: #f3f3f3;
  border-radius: 12px;
}
.file-icon-wrap {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 12px;
  background: #1677ff;
}
.file-icon-wrap .iconfont {
  font-size: 2rem;
  color: #fff !important;
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.file-name-wrap {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  align-items: flex-start;
  text-align: left;
}
.file-name {
  font-size: 12px;
  font-weight: 600;
  color: #111;
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 20px;
}
.file-type-text {
  font-size: 10px;
  color: #666;
  line-height: 20px;
}
.image-remove-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 2;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.image-remove-badge .iconfont {
  font-size: 11px;
}
.image-info {
  padding: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9f9f9;
  gap: 8px;
}
.image-info span {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}
.action-btn,
.remove-btn {
  padding: 0;
  height: auto;
  font-size: 11px;
}

</style>
