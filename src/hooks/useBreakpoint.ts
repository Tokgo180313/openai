import { onMounted, onUnmounted, ref } from "vue";
import { isMobileViewport, MOBILE_BREAKPOINT } from "@/utils/breakpoint";

export function useBreakpoint() {
  const isMobile = ref(isMobileViewport());

  const update = () => {
    isMobile.value = isMobileViewport();
  };

  onMounted(() => {
    update();
    window.addEventListener("resize", update);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", update);
  });

  return {
    isMobile,
    mobileBreakpoint: MOBILE_BREAKPOINT,
  };
}
