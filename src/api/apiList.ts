import chat from "./chat/index"
import login from "./login/index"
import user from "./user/index"
export  default {
    ...login,
    ...chat,
    ...user
}