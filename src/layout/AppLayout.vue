<template>
    <a-layout class="layout-container">
      <a-layout-sider :width="asideWidth" class="aside-container"> 
      <div class="main-sider">
        <div class="sider-header">
          <div class="system-icon" v-if="showSystem" @mouseenter="mouseenterEvent">
            <i style="font-size: 1.6rem;" class="iconfont icon-gpt"></i>
          </div>
          <div class="operation-icon" v-if="showOperation" @mouseleave="mouseleaveEvent" @click="toggleCollapse">
            <i style="font-size: 1.6rem;" class="iconfont icon-a-icon1beifen"></i>
          </div>
        </div>
      </div>  
      </a-layout-sider>
      <a-layout class="main-layout">
        <a-layout-header style="background:#FFF;padding:0 2px;border-bottom: 1px solid lightgray;" >header</a-layout-header>
        <a-layout-content class="content-area">
          <!-- 子路由出口 -->
          <router-view></router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
const isCollapsed = ref(false)
const isEnter = ref(false)
const asideWidth = computed(()=>{
  return isCollapsed.value?"60px":"200px";
})
const showOperation = computed(()=>{
  return isCollapsed.value?isEnter.value:true
})
const showSystem = computed(()=>{
  return isCollapsed.value?!isEnter.value:true
})
const toggleCollapse = ()=>{
  isCollapsed.value = ! isCollapsed.value;
}
const mouseenterEvent = ()=>{
  if(isCollapsed.value){
    isEnter.value = true
  }
}
const mouseleaveEvent =()=>{
  if(isCollapsed){
    isEnter.value = false
  }
}

</script>

<style scoped lang="scss">

.layout-container{
    height: 100vh;
    display: flex;
    width: 100vw;
}
.aside-container{
  background: #f9f9f9;
  color:#000;
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
    background: #fff;
}
.sider-header{
  display: flex;
  justify-content: space-between;
  padding: 0.5em;
  .system-icon{
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 0.5rem;
  }
  .operation-icon{
    padding: 0.5rem;
    border-radius: 0.5rem;
    cursor: ew-resize;
  }
  .system-icon:hover{
    background-color: lightgrey;
  }
  .operation-icon:hover{
    background-color: lightgrey
  }
}
</style>
