import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import routes from "./routes";
import { useAuthStore } from "../stores/authStore";
const router = createRouter({
    history:createWebHistory(import.meta.env.BASE_URL),
    routes:routes,
})
router.beforeEach(async(to:RouteLocationNormalized)=>{
    const autoStore = useAuthStore();
    if(to.meta.requiredAuth){
        if(!autoStore.getToken){
            return "/login"
        }
        // 验证 token 有效性
        const isValid = await autoStore.validateToken();
        if(!isValid){
            return "/login"
        }
    }
    return true
})

export default router