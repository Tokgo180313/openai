<template>
  <div class="main">
    <div class="content">
      <MarkdownViewer :content="markdownContent"></MarkdownViewer>
    </div>
    <div class="footer">
      <div
        id="markdown-content"
        class="markdown-content"
        contenteditable="true"
        placeholder="请输入内容"
        @keydown="submitEvent"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FolderOutlined } from "@ant-design/icons-vue";
import MarkdownViewer from "../../components/MarkdownViewer.vue";
import { ref, onMounted, onUnmounted } from "vue";
const markdownContent = ref("");
interface PatseOptions {
  stripFormatting?: boolean;
  convertToMarkdown?: boolean;
  maxLength?: number;
}
const onContentChange = (value: string) => {
  console.log("内容变化", value);
};
let textContent: HTMLTextAreaElement | null = null;
onMounted(() => {
  try {
    textContent = document.getElementById(
      "markdown-content"
    ) as HTMLTextAreaElement;
    if (textContent) {
      // textContent.addEventListener("paste",async (event)=>{
      //   // event.preventDefault();
      //   const clipboardData = (event.clipboardData||window.clipboardEvent)
      //   // console.log(clipboardData)
      //   for(let i =0;i<clipboardData.items.length;i++){
      //     const item = clipboardData.items[i]
      //     console.log("item",item)
      //     if(item.type.indexOf("image") !==-1){
      //       console.log("检测到图片粘贴")
      //     }
      //   }
      //   // patseImageEvent(event)
      // })
      textContent.addEventListener("paste", patseImageEvent);
    }
  } catch (error) {
    console.error(error);
  }
});
onUnmounted(() => {
  if (textContent) {
    textContent.removeEventListener("paste", patseImageEvent);
  }
});
const submitEvent = function (event) {
  const { code, isComposing, shiftKey } = event;
  if (code === "Enter") {
    if (!shiftKey) {
      // enter 事件
      handleEnterEvent();
    }
  }
};
const handleEnterEvent = function () {
  const content = document
    .querySelector("[contenteditable]")
    ?.innerHTML;
  markdownContent.value = content || "";
  console.log("markdown", markdownContent.value);
};
const uploadImageEvent = function () {};
const uploadFileEvent = function () {};
const patseImageEvent = function (event: ClipboardEvent) {
  console.log("粘贴事件出发点");
  const options: PatseOptions = {
    stripFormatting: true,
    convertToMarkdown: true,
    maxLength: 10000,
  };
  handlePatse(event, options);
};
const handlePatse = function (
  event: ClipboardEvent,
  options: PatseOptions = {}
): string | null {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return null;
  }
  console.log(clipboardData);

  try {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        handlePastedImage(file);
        event.preventDefault();
      }
    }
  } catch (error) {
    console.error(error);
  }
};
const handlePastedImage = function (file) {
  if (!file) {
    return;
  }
  const imageUrl = URL.createObjectURL(file);
  const img = document.createElement("img");
  img.src = imageUrl;
  img.setHTMLUnsafe.maxWidth = "300px";
  document.body.appendChild(img);
  console.log("图片信息：", {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
  });
};
</script>

<style scoped lang="scss">
.main {
  height: 100%;
  display: flex;
  justify-content: flex-end;
  flex-direction: column;
}

.content {
  overflow: auto;
  text-align: left;
  margin: 1em 10em;
}
.footer {
  text-align: right;
  bottom: 0;
  background: #fff;
  margin: 0 auto;
  width: 62.8%;
  //   height: 120px;
  border: 1px solid lightgray;
  border-radius: 0.5em;
  button {
    margin: 0 0.3em 0.3em 0;
  }
}
.markdown-content {
  min-height: 10vh;
  max-height: 30vh;
  padding: 0.5rem;
  text-align: left;
}
.markdown-content:empty:before {
  content: attr(placeholder);
  color: #999;
}
.markdown-content:focus {
  outline: none;
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}
.set-btn {
  display: flex;
  justify-content: space-between;
}
</style>
