import user from "./user.ts"
import apiKey from "./apiKey.ts"
import record from "./record.ts"
import model from "./model.ts"
import role from "./role.ts"
export default {
    ...user,
    ...apiKey,
    ...record,
    ...model,
    ...role
}