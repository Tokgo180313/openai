<template>
  <div class="main-container">
    <div class="system-setting">
      <a-select
        v-model:value="questionType"
        :bordered="false"
        @change="handleQuestionTypeChange"
        style="min-width: 300px"
      >
        <a-select-option
          v-for="item in chatModelList"
          :key="item.id"
          :title="item.apiModelName"
          :value="item.apiModelName"
        >
        </a-select-option>
      </a-select>
    </div>
    <div class="system-operation">
      <a-tooltip v-if="hasManageAccess" title="控制台" placement="bottom">
        <i
          style="margin: 0 1em; cursor: pointer"
          class="iconfont icon-zonghekongzhitai"
          @click="goToConsole"
        ></i>
      </a-tooltip>
      <a-tooltip title="分享" placement="bottom">
        <i
          style="margin: 0 1em; cursor: pointer"
          class="iconfont icon-daochu"
        ></i>
      </a-tooltip>
      <a-tooltip title="删除" placement="bottom">
        <i
          style="margin: 0 1em; cursor: pointer"
          class="iconfont icon-shanchu"
          @click="showRemoveEvent"
        ></i>
      </a-tooltip>
    </div>
  </div>
  <RemoveChatDialog
    :visible="showRemoveDialog"
    :titleId="removeChatTitleId"
    @close-modal="handleCloseModal"
    @update-list="handleUpdateList"
  ></RemoveChatDialog>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { message } from "ant-design-vue";
import { useRequestStore } from "../stores/requestStore";
import RemoveChatDialog from "../components/RemoveChatDialog.vue";
import { storeToRefs } from "pinia";
import { useModelStore } from "@/stores/modelStore";
import { useChatStore } from "@/stores/chatStore";
import { useEventsBus } from "@/stores/event-bus";
import { useAuthStore } from "@/stores/authStore";
import {
  getFirstMenuPath,
  hasManageMenus,
  setupManageRoutes,
} from "@/router/dynamicRoutes";
import { resolveLoginMenus } from "@/utils/resolveLoginMenus";

const modelStore = useModelStore();
const eventBus = useEventsBus();
const chatStore = useChatStore();
const router = useRouter();
const authStore = useAuthStore();

const hasManageAccess = computed(() => hasManageMenus(authStore.getMenus));

const goToConsole = async () => {
  const menus = await resolveLoginMenus(authStore.getRoleId, authStore.getMenus);
  if (!hasManageMenus(menus)) {
    message.warning("暂无后台管理权限");
    return;
  }
  authStore.setMenus(menus);
  setupManageRoutes(router, menus);
  const targetPath = getFirstMenuPath(menus);
  if (targetPath) {
    router.push(targetPath);
  } else {
    message.warning("暂无可访问的后台页面");
  }
};
const questionType = ref(modelStore.currentApiModelName || null);
const showRemoveDialog = ref(false);
const store = useRequestStore();
const chatModelList = computed(() => modelStore.chatModelList);
const handleQuestionTypeChange = function () {
  if (!questionType.value) return;
  useRequestStore().updateQuestionTye(questionType.value);
  modelStore.setCurrentApiModelName(questionType.value);
  const model = chatModelList.value.find(
    (item) => item.apiModelName === questionType.value,
  );
  modelStore.setCurrentProvider(model?.provider ?? null);
};
const removeChatTitleId = ref("");
const showRemoveEvent = function () {
  showRemoveDialog.value = true;
  removeChatTitleId.value = chatStore.getTitleId;
};
const handleCloseModal = function () {
  showRemoveDialog.value = false;
  removeChatTitleId.value = "";
};
const handleUpdateList = function () {
  eventBus.emit("update-chat-list");
};
</script>

<style scoped lang="scss">
.iconfont {
  font-size: 0.8rem;
}
.main-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1em;
}
.system-operation {
  text-align: right;
  margin-right: 1em;
}
.system-setting {
  text-align: left;
}
.option-item {
  display: flex;
  justify-content: flex-start;
  width: 120px;
  .item-icon {
    margin: 0 1em;
  }
}
</style>
