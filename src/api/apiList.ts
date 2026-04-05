import chat from "./chat/index"
import login from "./login/index"
import manage from "./manage/index"
import stream from "./stream/index"
export  default {
    ...login,
    ...chat,
    ...manage,
    ...stream,
}