<template>
  <div class="image-page">
    <div class="task-grid">
      <Task v-for="item in tasks" :key="item.id" :task-id="item.id" />
    </div>
    <div class="toolbar">
      <a-button type="primary" block @click="addTask">添加任务</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Task from './components/task.vue';

interface TaskItem {
  id: number;
}

let nextId = 1;

function createInitialTasks(): TaskItem[] {
  const items: TaskItem[] = [];
  for (let i = 0; i < 4; i++) {
    items.push({ id: nextId++ });
  }
  return items;
}

const tasks = ref<TaskItem[]>(createInitialTasks());

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
