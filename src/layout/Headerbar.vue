<template>
  <div class="main-container">
    <div class="header-leading">
      <a-tooltip v-if="showMenuButton" title="打开菜单" placement="bottom">
        <i
          class="iconfont icon-a-icon1beifen menu-toggle"
          @click="emit('toggleMenu')"
        ></i>
      </a-tooltip>
      <div class="system-setting">
        <a-select
          v-model:value="questionType"
          :bordered="false"
          @change="handleQuestionTypeChange"
          class="model-select"
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
    </div>
    <div class="system-operation">
      <a-tooltip
        v-if="showManageConsole"
        title="控制台"
        placement="bottom"
      >
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
import { useBreakpoint } from "@/hooks/useBreakpoint";

withDefaults(
  defineProps<{
    showMenuButton?: boolean;
  }>(),
  { showMenuButton: false },
);

const emit = defineEmits<{ toggleMenu: [] }>();

const modelStore = useModelStore();
const eventBus = useEventsBus();
const chatStore = useChatStore();
const router = useRouter();
const authStore = useAuthStore();
const { isMobile } = useBreakpoint();

const hasManageAccess = computed(() => hasManageMenus(authStore.getMenus));
const showManageConsole = computed(() => hasManageAccess.value && !isMobile.value);

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
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5em;
  align-items: center;
  min-width: 0;
  width: 100%;
}
.header-leading {
  display: flex;
  align-items: center;
  gap: 0.5em;
  min-width: 0;
}
.menu-toggle {
  font-size: 1.4rem;
  cursor: pointer;
  padding: 0.25em;
  flex-shrink: 0;
}
.system-operation {
  text-align: right;
  margin-right: 0.5em;
  flex-shrink: 0;
  white-space: nowrap;
}
.system-setting {
  text-align: left;
  min-width: 0;
  flex: 1;
}
.model-select {
  min-width: 0;
  width: 100%;
  max-width: 200px;
}
.option-item {
  display: flex;
  justify-content: flex-start;
  width: 120px;
  .item-icon {
    margin: 0 1em;
  }
}

@media screen and (max-width: 768px) {
  .main-container {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.25em;
  }
  .system-operation {
    margin-right: 0.25em;
  }
  .model-select {
    max-width: 100%;
  }
}
</style>
