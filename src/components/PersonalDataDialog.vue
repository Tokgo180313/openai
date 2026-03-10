<template>
 <a-modal ></a-modal>
</template>

<script lang="ts" setup>
const props = defineProps();
const emits = defineEmits();
const confirmEvent = function () {
  console.log("确认修改密码");
};
const cancelEvent = function () {
  console.log("取消修改密码");
};
</script>

<style scoped lang="scss">
</style>