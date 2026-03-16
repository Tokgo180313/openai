import user from "./user.ts"
import record from "./record.ts"
import model from "./model.ts"
import role from "./role.ts"
import usage from "./usage.ts"
export default {
    ...user,
    ...record,
    ...model,
    ...role,
    ...usage
}