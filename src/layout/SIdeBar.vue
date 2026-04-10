<template>
  <div>
    <div class="sider-header">
      <div class="system-icon" v-if="!isCollapsed" @click="newChatEvent">
        <i style="font-size: 1.6rem" class="iconfont icon-gpt"></i>
      </div>
      <a-tooltip
        v-if="!isCollapsed"
        title="关闭侧边栏"
        placement="right"
        trigger="hover"
      >
        <div class="operation-icon" @click="toggleCollapse">
          <i style="font-size: 1.6rem" class="iconfont icon-a-icon1beifen"></i>
        </div>
      </a-tooltip>
      <a-tooltip
        v-if="isCollapsed"
        title="打开侧边栏"
        placement="bottom"
        trigger="hover"
      >
        <div
          class="operation-icon"
          @mouseenter="mouseenterEvent"
          @mouseleave="mouseleaveEvent"
          @click="toggleCollapse"
        >
          <i style="font-size: 1.6em" :class="`iconfont ${showIcon}`"></i>
        </div>
      </a-tooltip>
    </div>
    <div class="sider-tool">
      <div class="tool-item" @click="newChatEvent">
        <div class="item-icon" v-if="!isCollapsed">
          <i style="font-size: 1.2rem" class="iconfont icon-shuxie"></i>
        </div>
        <div v-if="!isCollapsed" class="item-text">
          <span>新聊天</span>
        </div>
        <div class="item-icon" v-if="isCollapsed">
          <a-tooltip
            title="新聊天"
            placement="right"
            trigger="hover"
            :overlayStyle="{ 'margin-left': '1em' }"
          >
            <i style="font-size: 1.2rem" class="iconfont icon-shuxie"></i>
          </a-tooltip>
        </div>
      </div>
    </div>
    <div v-if="!isCollapsed" class="placeholder">你的聊天</div>
    <div
      v-if="!isCollapsed"
      class="sider-content"
      ref="siderContentRef"
      @scroll="handleScrollLoadMore"
    >
      <div
        class="content-item"
        @mouseenter="mouseenterItemEvent(item)"
        @mouseleave="mouseleaveItemEvent"
        @click="selectedEvent(item)"
        v-for="item in visibleTitleList"
        :key="item.id"
        :class="{ 'content-selected': selectedRow == item.id }"
      >
        <div class="content-text">
          <span v-if="item.title.length<=8">

            {{ item.title.slice(0, 8) }}
          </span>

          <a-tooltip placement="topLeft" v-else>
            <template #title>
              <div style="max-width: 220px;">
                {{ item.title }}
              </div>
            </template>
            <span>{{ item.title.slice(0,8) }}...</span>
          </a-tooltip>
        </div>
        <div v-show="currentRow == item.id || showContentItemIcon == item.id">
          <a-popover
            placement="right"
            trigger="click"
            @openChange="handleOpenChange"
          >
            <template #content>
              <div class="item-list">
                <p class="item">
                  <span class="item-icon"
                    ><i class="iconfont icon-daochu1"></i
                  ></span>
                  <span class="item-text">分享</span>
                </p>
                <p class="item">
                  <span class="item-icon">
                    <i class="iconfont icon-shuxie1"></i
                  ></span>
                  <span class="item-text">重命名</span>
                </p>
                <p class="item" @click="RemoveChatEvent(item)">
                  <span class="item-icon"
                    ><i class="iconfont icon-shanchu"></i
                  ></span>
                  <span class="item-text">删除</span>
                </p>
              </div>
            </template>
            <span class="content-icon" @click.stop>
              <i class="iconfont icon-gengduo1"></i>
            </span>
          </a-popover>
        </div>
      </div>
      <div v-if="visibleTitleList.length > 0" class="load-more-tip">
        {{ hasMoreTitle ? "上滑加载更多..." : "没有更多了" }}
      </div>
    </div>
    <div class="sider-footer" :style="{ width: footerWidth }">
      <a-popover placement="top" trigger="click">
        <template #content>
          <div class="item-list" style="width: 160px">
            <p class="item">
              <span class="item-icon"
                ><i class="iconfont icon-fl-renyuan"></i
              ></span>
              <span class="item-text" @click="showUserSetEvent">{{ nickName }}</span>
            </p>
            <p class="item">
              <span class="item-icon"
                ><i class="iconfont icon-fl-renyuan"></i
              ></span>
              <span class="item-text" @click="showUserInfoEvent">个人资料</span>
            </p>
            <p class="item">
              <span class="item-icon"
                ><i class="iconfont icon-shezhi"></i
              ></span>
              <span class="item-text">设置</span>
            </p>
            <p class="item" @click="loginOutEvent">
              <span class="item-icon"
                ><i class="iconfont icon-tuichu"></i
              ></span>
              <span class="item-text">退出</span>
            </p>
          </div>
        </template>
        <div class="footer-item">
          <div class="item-icon">
            <a-avatar
              size="default"
              :style="{ backgroundColor: color, verticalAlign: 'middle' }"
              :gap="gap"
            >
              {{ avatarValue }}
            </a-avatar>
          </div>
          <div class="item-text">{{ nickName }}</div>
        </div>
      </a-popover>
    </div>
    <login-out-dialog
      :visible="showLoginOutDialog"
      @close-modal="closeModalEvent"
    ></login-out-dialog>
    <RemoveChatDialog
      :visible="showRemoveChatVisible"
      :titleId="removeChatTitleId"
      @close-modal="closeRemoveChatEvent"
      @update-list="updateListEvent"
    ></RemoveChatDialog>
    <PersonalDataDialog
      :visible="showUpdateNickNameDialog"
      @close-modal="closeUpdateNickNameDialog"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import LoginOutDialog from "@/components/LoginOutDialog.vue";
import RemoveChatDialog from "@/components/RemoveChatDialog.vue";
import PersonalDataDialog from "@/components/PersonalDataDialog.vue";
const footerWidth = computed(() => {
  return isCollapsed.value ? "60px" : "200px";
});
const currentRow = ref(null);
const selectedRow = ref(null);
const isCollapsed = ref(false);
const emit = defineEmits(["collapsedChange"]);
const isEnter = ref(false);
const showIcon = ref("icon-gpt");
const showContentItemIcon = ref(null);
const siderContentRef = ref<HTMLElement | null>(null);
let showLoginOutDialog = ref(false);
import apiList from "@/api/apiList";
import { useEventsBus } from "../stores/event-bus";
import { useChatStore } from "../stores/chatStore";
import { nanoid } from "nanoid";
import { useAuthStore } from "@/stores/authStore";
const { chatTitleListInterface } = apiList;
const PAGE_SIZE = 10;
interface titleInfo {
  id: string;
  title: string;
  documentId: string;
  createdAt: string;
  updatedAt: string;
}
const titleList = ref<titleInfo[]>([]);
const visibleTitleList = ref<titleInfo[]>([]);
const currentPage = ref(1);
const hasMoreTitle = ref(false);
const loadingMoreTitle = ref(false);
const eventBus = useEventsBus();
const chatStore = useChatStore();
const userStore = useAuthStore();
const color = "#f56a00";
const gap = 4;
const avatarValue = ref<string>(
  userStore.getNickName ? userStore.getNickName.slice(0, 1) : userStore.getAccount.slice(0, 1),
);
const nickName = ref<string>(
  userStore.getNickName ? userStore.getNickName : userStore.getAccount,
);
onMounted(() => {
  chatTitleImpl();
  eventBus.on("update-chat-list", () => {
    chatTitleImpl();
    newChatEvent();
  });
});
onUnmounted(() => {
  eventBus.off("update-chat-list");
});

const tryAutoLoadUntilFilled = async function () {
  await nextTick();
  while (siderContentRef.value && hasMoreTitle.value && !loadingMoreTitle.value) {
    if (siderContentRef.value.scrollHeight > siderContentRef.value.clientHeight + 8) {
      break;
    }
    const loaded = await loadMoreTitleList();
    if (!loaded) {
      break;
    }
    await nextTick();
  }
};
const chatTitleImpl = function () {
  currentPage.value = 1;
  loadingMoreTitle.value = true;
  chatTitleListInterface({ page: 1, pageSize: PAGE_SIZE })
    .then((res) => {
      if (res.code === 200) {
        titleList.value = res.data?.list || [];
        visibleTitleList.value = titleList.value;
        hasMoreTitle.value = !!res.data?.hasMore;
      } else {
        titleList.value = [];
        visibleTitleList.value = [];
        hasMoreTitle.value = false;
      }
    })
    .then(() => {
      if (chatStore.getDocumentId) {
        selectedRow.value = chatStore.getTitleId;
        eventBus.emit("chat-change");
      }
    })
    .catch(() => {
      titleList.value = [];
      visibleTitleList.value = [];
      hasMoreTitle.value = false;
    })
    .finally(() => {
      loadingMoreTitle.value = false;
      tryAutoLoadUntilFilled();
    });
}
const loadMoreTitleList = function () {
  if (!hasMoreTitle.value || loadingMoreTitle.value) {
    return Promise.resolve(false);
  }
  const nextPage = currentPage.value + 1;
  loadingMoreTitle.value = true;
  return chatTitleListInterface({ page: nextPage, pageSize: PAGE_SIZE })
    .then((res) => {
      if (res.code === 200) {
        const nextList = res.data?.list || [];
        currentPage.value = nextPage;
        titleList.value = [...titleList.value, ...nextList];
        visibleTitleList.value = titleList.value;
        hasMoreTitle.value = !!res.data?.hasMore;
        return nextList.length > 0;
      } else {
        hasMoreTitle.value = false;
        return false;
      }
    })
    .catch(() => {
      hasMoreTitle.value = false;
      return false;
    })
    .finally(() => {
      loadingMoreTitle.value = false;
    });
};
const handleScrollLoadMore = function () {
  if (!siderContentRef.value || !hasMoreTitle.value) {
    return;
  }
  const { scrollTop, clientHeight, scrollHeight } = siderContentRef.value;
  if (scrollTop + clientHeight >= scrollHeight - 8) {
    loadMoreTitleList();
  }
};
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit("collapsedChange", isCollapsed.value);
  if (!isCollapsed.value) {
    showIcon.value = "icon-gpt";
  }
};
const mouseenterEvent = () => {
  if (isCollapsed.value) {
    showIcon.value = "icon-a-icon1beifen";
    isEnter.value = true;
  }
};
const mouseleaveEvent = () => {
  if (isCollapsed.value) {
    isEnter.value = false;
    showIcon.value = "icon-gpt";
  }
};
const mouseenterItemEvent = function (item) {
  currentRow.value = item.id;
};
const mouseleaveItemEvent = function (item) {
  currentRow.value = null;
};
const selectedEvent = function (item) {
  selectedRow.value = item.id;
  chatStore.updateDocument(item.documentId);
  chatStore.updateTitleId(item.id);
  eventBus.emit("chat-change");
};
const newChatEvent = function () {
  let documentId = nanoid();
  selectedRow.value = null;
  chatStore.updateDocument(documentId);
  chatStore.updateTitleId(null);
  eventBus.emit("chat-change");
};
const loginOutEvent = function () {
  showLoginOutDialog.value = true;
  console.log(showLoginOutDialog.value);
};
const closeModalEvent = function () {
  showLoginOutDialog.value = false;
};
const showUserSetEvent = function () {
  console.log("user set");
};
const selectedIconEvent = function (item) {
  event?.stopPropagation();
  showContentItemIcon.value = item.id;
};
const handleOpenChange = function (value) {
  if (!value) {
    showContentItemIcon.value = null;
    currentRow.value = null;
  } else {
    showContentItemIcon.value = currentRow.value;
  }
};
const showRemoveChatVisible = ref(false);
const removeChatTitleId = ref(null);
const showUpdateNickNameDialog = ref(false);
const RemoveChatEvent = function (item) {
  showRemoveChatVisible.value = true;
  removeChatTitleId.value = item.id;
};
const closeRemoveChatEvent = function () {
  showRemoveChatVisible.value = false;
  removeChatTitleId.value = null;
};
const updateListEvent = function () {
  chatTitleImpl();
  newChatEvent();
};
const showUserInfoEvent = function () {
  showUpdateNickNameDialog.value = true;
};
const closeUpdateNickNameDialog = function (value?: string) {
  if (value) {
    userStore.setNickName(value);
    nickName.value = value || userStore.getAccount;
    avatarValue.value = (value || userStore.getAccount).slice(0, 1);
  }
  showUpdateNickNameDialog.value = false;
};
</script>
<style scoped lang="scss">
.iconfont {
  font-size: 1.2rem;
}
.sider-header {
  display: flex;
  justify-content: space-between;
  padding: 0.6em;
  padding-bottom: 1em;
  .system-icon {
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
  }
  .operation-icon {
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: ew-resize;
  }
  .system-icon:hover {
    background-color: lightgrey;
  }
  .operation-icon:hover {
    background-color: lightgrey;
  }
}
.sider-tool {
  .tool-item {
    text-align: left;
    line-height: 2rem;
    height: 2rem;
    display: flex;
    justify-content: flex-start;
    margin: 0 0.3em;
    border-radius: 0.5em;
    cursor: pointer;
    .item-icon {
      margin-left: 0.85rem;
    }
    .item-text {
      margin-left: 0.6em;
    }
  }
  .tool-item:hover {
    background-color: lightgrey;
  }
}
.placeholder {
  text-align: center;
  height: 2rem;
  line-height: 2rem;
  color: rgba(51, 51, 51, 0.6);
  margin: 1em 0;
  letter-spacing: 0.5em;
}
.sider-content {
  overflow: auto;
  max-height: calc(100vh - 13rem);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  .content-item {
    text-align: left;
    line-height: 1.5rem;
    min-height: 2rem;
    display: flex;
    justify-content: space-between;
    margin: 0 0.3em;
    padding: 0.2rem 0;
    border-radius: 0.5em;
    cursor: pointer;
    width: 100%;
    .content-icon {
      padding: 0 0.5rem;
    }
    .content-text {
      margin-left: 0.85rem;
      word-break: break-all;
    }
  }
  .content-item:hover {
    background-color: rgba(211, 211, 211, 0.5);
  }
  .load-more-tip {
    text-align: center;
    color: rgba(51, 51, 51, 0.6);
    font-size: 0.8rem;
    padding: 0.6rem 0;
  }
}
.sider-footer {
  position: fixed;
  bottom: 0;
  background-color: #fff;
  .footer-item {
    line-height: 3rem;
    height: 3rem;
    display: flex;
    justify-content: flex-start;
    cursor: pointer;
    border-radius: 0.5rem;
    margin: 0 0.3em;
    .item-icon {
      margin-left: 0.85rem;
    }
    .item-text {
      margin-left: 0.6em;
    }
  }
  .footer-item:hover {
    background-color: rgba(211, 211, 211, 0.5);
  }
}

.content-selected {
  background-color: rgba(211, 211, 211, 0.5);
}
.item-list {
  .item {
    height: 2rem;
    line-height: 2rem;
    padding: 0 0.5em;
    cursor: pointer;
    border-radius: 0.6rem;
    .item-icon {
      padding: 0 0.5em;
    }
  }
  .item:hover {
    background-color: rgba(211, 211, 211, 0.5);
  }
}
</style>
