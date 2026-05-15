<template>
  <div class="image-page">
    <div class="task-grid">
      <Task
        v-for="item in tasks"
        :key="String(item.id)"
        :task-id="item.id"
        :should-register-task-image="true"
      />
    </div>
    <div class="toolbar">
      <a-button type="primary" block @click="addTask">添加任务</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Task from "./components/task.vue";

interface TaskItem {
  id: number | string;
}

let nextId = 1;

function localFallbackTasks(count: number): TaskItem[] {
  const items: TaskItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({ id: nextId++ });
  }
  return items;
}

function bumpNextIdFromTasks(items: TaskItem[]) {
  const nums = items
    .map((t) => (typeof t.id === "number" ? t.id : Number(t.id)))
    .filter((n) => Number.isFinite(n));
  if (nums.length) {
    nextId = Math.max(...nums) + 1;
  }
}

/** 初始四条本地任务；登记逻辑见 Task 子组件（模型列表就绪后 POST /taskImage/addTaskImage） */
const tasks = ref<TaskItem[]>(localFallbackTasks(4));
bumpNextIdFromTasks(tasks.value);

function addTask() {
  tasks.value.push({ id: nextId++ }, { id: nextId++ });
}
</script>

<style scoped>
.image-page {
  padding: 16px;
  background-color: var(--color-bg-layout, #f5f5f5);
}

.toolbar {
  margin-top: 16px;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  align-items: start;
}

@media (max-width: 768px) {
  .task-grid {
    grid-template-columns: 1fr;
  }
}
</style>
