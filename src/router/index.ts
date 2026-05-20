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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export function initManageRoutesFromStore() {
  const authStore = useAuthStore();
  if (authStore.getToken && authStore.getMenus?.length) {
    setupManageRoutes(router, authStore.getMenus);
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

  if (to.matched.length === 0 && hasManageMenus(authStore.getMenus)) {
    setupManageRoutes(router, authStore.getMenus);
    return to.fullPath;
  }

  return true;
});

export default router;
