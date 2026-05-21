import user from "./user.ts"
import record from "./record.ts"
import aiModel from "./ai-model.ts"
import role from "./role.ts"
import usage from "./usage.ts"
import provider from "./provider.ts"
import schedule from "./schedule.ts"
import aiModelConfig from "./aiModelConfig.ts"
import menu from "./menu.ts"
import optimization from "./optimization.ts"
export default {
    ...user,
    ...record,
    ...aiModel,
    ...role,
    ...usage,
    ...provider,
    ...schedule,
    ...aiModelConfig,
    ...menu,
    ...optimization,
}