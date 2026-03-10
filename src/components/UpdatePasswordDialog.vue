<template>
 <div>
    <a-button type="primary" @click="showModal">Open Modal</a-button>
    <a-modal v-model:open="open" title="Basic Modal" @ok="handleOk">
      <a-form v-model="submitForm"></a-form>
    </a-modal>
  </div>

</template>

<script lang="ts" setup>
const submitForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};
</script>

<style scoped lang="scss">
</style>