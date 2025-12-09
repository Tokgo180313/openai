import * as bcrypt from "bcrypt"

export class PasswordUtil {
    private static readonly SALT_ROUNDS=12;

    // 加密密码
    static async hash(password:string):Promise<string>{
        return bcrypt.hash(password,this.SALT_ROUNDS);
    }

    // 验证密码
    static async compare(password:string,hash:string):Promise<boolean>{
        return bcrypt.compare(password,hash);
    }

    // 生成盐值
    static async genSale():Promise<string>{
        return bcrypt.genSalt(this.SALT_ROUNDS);
    }
}