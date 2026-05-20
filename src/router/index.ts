import {
  createRouter,
  createWebHistory,
  type RouteLocationNormalized,
} from "vue-router";
import routes from "./routes";
import { useAuthStore } from "../stores/authStore";
import {
  hasManageMenus,
  setupManageRoutes,
} from "./dynamicRoutes";
import { resolveLoginMenus } from "@/utils/resolveLoginMenus";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export async function initManageRoutesFromStore() {
  const authStore = useAuthStore();
  if (!authStore.getToken) {
    return;
  }
  const menus = await resolveLoginMenus(authStore.getRoleId, authStore.getMenus);
  authStore.setMenus(menus);
  if (menus.length) {
    setupManageRoutes(router, menus);
  }
}

router.beforeEach(async (to: RouteLocationNormalized) => {
  const authStore = useAuthStore();

  if (to.meta.requiredAuth) {
    if (!authStore.getToken) {
      return "/login";
    }
    const isValid = await authStore.validateToken();
    if (!isValid) {
      return "/login";
    }
  }

  if (to.matched.length === 0 && authStore.getToken) {
    const menus = await resolveLoginMenus(authStore.getRoleId, authStore.getMenus);
    if (menus.length) {
      authStore.setMenus(menus);
      setupManageRoutes(router, menus);
      return to.fullPath;
    }
  }

  return true;
});

export default router;
