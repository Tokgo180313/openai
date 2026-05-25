import type { App } from "vue";
import type { ObjectDirective } from "@vue/runtime-core"; // 从 @vue/runtime-core 导入 ObjectDirective
import type { DirectiveBinding } from "@vue/runtime-core";  // 从 @vue/runtime-core 导入 DirectiveBinding

interface ClickOutsideElement extends HTMLElement {
  __clickOutsideHandler__?: (event: MouseEvent) => void;
}

const clickOutside: ObjectDirective = {
  beforeMount(el: ClickOutsideElement, binding: DirectiveBinding) {
    const excludedEls = binding.arg ? binding.arg.split(",") : []; // 通过 arg 获取排除的 selector

    el.__clickOutsideHandler__ = (event: MouseEvent) => {
        // 如果点击的是当前元素本身，或者当前元素的子元素，直接返回
        console.log(el,event.target as Node)
      if (el === event.target || el.contains(event.target as Node)) {
        return;
      }

      // 判断点击的目标是否在排除的元素内
      if (
        !excludedEls.some((selector) => (event.target as HTMLElement).matches(selector)) &&
        !(el === event.target || el.contains(event.target as Node))
      ) {
        binding.value(event); // 执行传入的方法
      }
    };

    document.addEventListener("click", el.__clickOutsideHandler__);
  },

  unmounted(el: ClickOutsideElement) {
    document.removeEventListener("click", el.__clickOutsideHandler__!);
  },
};

export const clickOutsidePlugin = {
  install(app: App) {
    app.directive("clickOutside", clickOutside);
  },
};
