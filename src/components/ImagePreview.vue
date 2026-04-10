<template>
  <div class="image-preview-container">
    <div class="empty-state" v-if="items.length === 0">暂无附件</div>
    <div class="image-grid" v-else>
      <div
        class="image-item"
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
          :style="{ backgroundColor: getFileBackgroundColor(item.name) }"
          @click="downloadFile(item)"
        >
          <div class="file-icon-wrap">
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
    return "icon-file1";
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
  if (["pdf"].includes(ext)) return "#fff1f0";
  if (["doc", "docx"].includes(ext)) return "#f0f5ff";
  if (["xls", "xlsx", "csv"].includes(ext)) return "#f6ffed";
  if (["ppt", "pptx"].includes(ext)) return "#fff7e6";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "#f9f0ff";
  if (["js", "ts", "tsx", "vue", "json", "md", "py", "java", "go", "txt"].includes(ext)) {
    return "#e6f7ff";
  }
  return "#f7f7f7";
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}
.image-item {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}
.image-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.image-item img {
  width: 100%;
  height: 88px;
  object-fit: cover;
  cursor: pointer;
}
.file-card {
  height: 60px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  cursor: pointer;
  gap: 8px;
}
.file-icon-wrap {
  width: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.file-icon-wrap .iconfont {
  font-size: 1.1rem;
}
.file-name-wrap {
  min-width: 0;
  flex: 1;
}
.file-name {
  font-size: 12px;
  color: #444;
  display: inline-block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.image-remove-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.image-remove-badge .iconfont {
  font-size: 12px;
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
