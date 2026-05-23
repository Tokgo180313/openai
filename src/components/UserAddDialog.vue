<template>
  <div class="container">
    <a-modal
      v-model:open="openModal"
      @ok="confirmAddEvent"
      @cancel="cancelEvent"
      ok-text="确认"
      cancel-text="取消"
      title="添加用户"
    >
      <a-form
        ref="formRef"
        :model="submitForm"
        autocomplete="off"
        @finish="onFinish"
        @finishFailed="onFinishFailed"
      >
        <a-form-item
          label="上级"
          name="parentId"
          :rules="[{ required: true, message: '请选择上级用户' }]"
        >
          <a-select
            v-model:value="submitForm.parentId"
            placeholder="请选择上级用户"
            show-search
            :options="parentOptions"
            :loading="parentListLoading"
            :filter-option="filterParentOption"
            allow-clear
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item
          label="帐号"
          name="account"
          :rules="[{ required: true, message: 'please input your account' }]"
        >
          <a-input v-model:value="submitForm.account" allowClear></a-input>
        </a-form-item>
        <a-form-item
          label="昵称"
          name="nickName"
          :rules="[{ required: true, message: 'please input your nickName' }]"
        >
          <a-input v-model:value="submitForm.nickName" allowClear></a-input>
        </a-form-item>
        <a-form-item
          label="角色"
          name="roleId"
          :rules="[{ required: true, message: 'please select your role' }]"
        >
          <a-select v-model:value="submitForm.roleId" @change="roleChangeEvent">
            <a-select-option v-for="item in roleList" :key="item.value">{{ item.label }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import api from "@/api/apiList";
import { message } from "ant-design-vue";
import type { FormInstance } from "ant-design-vue/es/form";
let { addUserInfoInterface, findAllUserInfoInterface } = api;
import { useModelStore } from "../stores/modelStore";
import { ROLE } from "@/constants/role";
import type { UserType } from "@/views/user/types/UserType";
const modelStore = useModelStore();
const roleList = computed(() => modelStore.roleOptions);
interface Props {
  visible: boolean;
  /** 打开弹窗时默认选中的上级 id，可在下拉里改成其它用户 */
  defaultParentId?: string;
}
interface UserInfoDtoType {
  account: string;
  password: string;
  roleId: string;
  nickName?: string;
  parentId?: string;
}
const props = defineProps<Props>();
const formRef = ref<FormInstance>();
const parentListLoading = ref(false);
const parentOptions = ref<{ label: string; value: string }[]>([]);

let submitForm = ref<UserInfoDtoType>({
  account: "",
  roleId: ROLE.NORMAL_USER,
  nickName: "",
  parentId: "",
});

function filterParentOption(input: string, option: { label?: string }) {
  const label = option.label ?? "";
  return label.toLowerCase().includes(input.trim().toLowerCase());
}

async function loadParentOptions() {
  parentListLoading.value = true;
  try {
    const res = await findAllUserInfoInterface({
      name: "",
      current: 1,
      pageSize: 500,
    });
    if (res.code === 201) {
      const list = (res.data?.list || []) as UserType[];
      parentOptions.value = list.map((u) => ({
        value: u.id,
        label: u.account || String(u.id),
      }));
    } else {
      parentOptions.value = [];
    }
  } catch {
    parentOptions.value = [];
    message.error("加载上级用户列表失败");
  } finally {
    parentListLoading.value = false;
  }
}

watch(
  () => props.visible,
  async (open) => {
    if (open) {
      await loadParentOptions();
      submitForm.value.parentId = props.defaultParentId ?? "";
    }
  },
);
const emits = defineEmits(["close-modal"]);
let openModal = computed(() => props.visible);

const confirmAddEvent = async function () {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  try {
    const res = await addUserInfoInterface(submitForm.value);
    if (res.code === 200) {
      message.success(res.message);
      emits("close-modal", true);
      resetForm();
    }
  } catch {
    /* request layer may toast */
  }
};
const cancelEvent = function () {
  emits("close-modal", false);
};
const roleChangeEvent = function (value) {
  submitForm.value.roleId = value;
};
const onFinish = function () {
  console.log(submitForm);
};

const onFinishFailed = function () {};
const resetForm = function () {
  submitForm.value = {
    account: "",
    roleId: ROLE.NORMAL_USER,
    nickName: "",
    parentId: props.defaultParentId ?? "",
  };
  formRef.value?.clearValidate();
};
</script>

<style scoped lang="scss"></style>
