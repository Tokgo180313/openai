<template>
    <a-layout class="layout-container">
      <a-layout-sider width="200px" style="background:#001529;color:#FFF"> side </a-layout-sider>
      <a-layout class="main-layout">
        <a-layout-header style="background:#FFF;padding:0 2px;" >header</a-layout-header>
        <a-layout-content class="content-area">
          <!-- 子路由出口 -->
          <router-view></router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
</template>

<script lang="ts" setup>

</script>

<style scoped lang="scss">

.layout-container{
    height: 100vh;
    display: flex;
    width: 100vw;
}
.main-layout{
    flex:1;
    display: flex;
    flex-direction: column;
    // min-height: 0;
}
.content-area{
    flex:1;
    padding:20px;
    height: 100%;
    overflow: auto;
    // min-height: 0;
    background: #f0f2f5;
}
</style>
