import chat from "./chat/index"
import login from "./login/index"
import manage from "./manage/index"
export  default {
    ...login,
    ...chat,
    ...manage,
}