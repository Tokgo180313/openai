<template>
  <div class="main">
    <div class="content">
      <MarkdownViewer :content="markdownContent"></MarkdownViewer>
    </div>
    <div class="footer">
      <a-textarea
        v-model:value="markdownContent"
        :auto-size="{ minRows: 3, maxRows: 3 }"
        :bordered="false"
      ></a-textarea>
      <div class="set-btn">
        <div class="left-set">
          <a-button type="text" @click="uploadImageEvent">上传图片</a-button>
          <a-button type="text" @click="uploadFileEvent"
            ><FolderOutlined
          /></a-button>
        </div>
        <div class="right-set">
          <a-button type="primary" @click="submitEvent">发送</a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FolderOutlined } from "@ant-design/icons-vue";
import MarkdownViewer from "../../components/MarkdownViewer.vue";
import { ref } from "vue";
const markdownContent = `
下面是一些实例
# TypeScript 示例

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const user: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com'
};

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

# JavaScript 示例

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled);
\`\`\`

# CSS 示例

\`\`\`css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
}
\`\`\`
`;
const onContentChange = (value: string) => {
  console.log("内容变化", value);
};
const submitEvent = function () {};
const uploadImageEvent = function () {};
const uploadFileEvent = function () {};
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
.set-btn {
  display: flex;
  justify-content: space-between;
}
</style>
